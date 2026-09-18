(()=>{
  'use strict';

  const DATA_SCHEMA=2;
  const esc=value=>String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const normalizeName=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\b(so|số)\b/g,' ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const finite=n=>Number.isFinite(Number(n));
  const now=()=>Date.now();

  function classifyRegion(routeId){
    const route=routeById(routeId);
    return route?.group||'Chưa phân vùng';
  }

  function suggestRoute(lat,lng,accuracy=null){
    if(!finite(lat)||!finite(lng)) return {routeId:currentRouteId,method:'CURRENT_ROUTE_NO_COORD'};
    try{
      const match=recognizeRoute({lat:Number(lat),lng:Number(lng),accuracy:Number(accuracy)||80});
      if(match?.route?.id && Number(match.distance)<=3){
        return {routeId:match.route.id,method:match.source||'AUTO_MATCH',distanceKm:Number(match.distance),confidence:match.confidence||null};
      }
    }catch{}
    return {routeId:currentRouteId,method:'CURRENT_ROUTE_FALLBACK'};
  }

  function normalizedPoi(raw={}){
    const route=suggestRoute(raw.lat,raw.lng,raw.accuracy);
    const routeId=raw.routeId||route.routeId||currentRouteId;
    const sourceType=raw.sourceType||'manual';
    const verified=Boolean(raw.verified);
    return {
      ...raw,
      schema:DATA_SCHEMA,
      id:raw.id||`P-${now()}-${Math.random().toString(36).slice(2,7)}`,
      name:String(raw.name||'').trim(),
      nameKey:normalizeName(raw.name),
      category:String(raw.category||'Khác').trim(),
      subcategory:String(raw.subcategory||'').trim(),
      note:String(raw.note||'').trim(),
      lat:finite(raw.lat)?Number(raw.lat):null,
      lng:finite(raw.lng)?Number(raw.lng):null,
      accuracy:finite(raw.accuracy)?Number(raw.accuracy):null,
      routeId,
      region:raw.region||classifyRegion(routeId),
      routeAssignment:raw.routeAssignment||route.method,
      routeDistanceKm:finite(raw.routeDistanceKm)?Number(raw.routeDistanceKm):(finite(route.distanceKm)?route.distanceKm:null),
      sourceType,
      sourceUrl:raw.sourceUrl||null,
      sourceLabel:raw.sourceLabel||(sourceType==='google_maps'?'Google Maps':sourceType==='field'?'Nhập tại chỗ':'Nhập thủ công'),
      verified,
      verificationStatus:verified?'FIELD_VERIFIED':(raw.verificationStatus||'UNVERIFIED'),
      createdAt:raw.createdAt||now(),
      updatedAt:now(),
      createdBy:raw.createdBy||session()?.email||'local-user',
      sources:Array.isArray(raw.sources)?raw.sources:[]
    };
  }

  function separationKm(a,b){
    if(!finite(a.lat)||!finite(a.lng)||!finite(b.lat)||!finite(b.lng)) return Infinity;
    try{return distanceKm({lat:Number(a.lat),lng:Number(a.lng)},{lat:Number(b.lat),lng:Number(b.lng)})}catch{return Infinity}
  }

  function duplicateOf(candidate,list=pois()){
    const key=candidate.nameKey||normalizeName(candidate.name);
    let best=null;
    for(const existing of list){
      const existingKey=existing.nameKey||normalizeName(existing.name);
      const d=separationKm(candidate,existing);
      const sameName=key&&existingKey&&key===existingKey;
      const fuzzyName=key&&existingKey&&(key.includes(existingKey)||existingKey.includes(key));
      const duplicate=(sameName&&d<=0.5)||(fuzzyName&&d<=0.12)||(sameName&&!finite(candidate.lat)&&!finite(existing.lat));
      if(duplicate&&(!best||d<best.distanceKm)) best={poi:existing,distanceKm:d};
    }
    return best;
  }

  function mergeDuplicate(existing,incoming){
    const sources=[...(Array.isArray(existing.sources)?existing.sources:[])];
    const source={type:incoming.sourceType,label:incoming.sourceLabel,url:incoming.sourceUrl||null,at:now(),by:incoming.createdBy};
    if(!sources.some(s=>s.type===source.type&&s.url===source.url)) sources.push(source);
    return normalizedPoi({
      ...existing,
      name:existing.name||incoming.name,
      category:existing.category==='Chia sẻ Maps'&&incoming.category?incoming.category:existing.category,
      subcategory:existing.subcategory||incoming.subcategory,
      note:existing.note||incoming.note,
      lat:finite(existing.lat)?existing.lat:incoming.lat,
      lng:finite(existing.lng)?existing.lng:incoming.lng,
      accuracy:finite(existing.accuracy)?existing.accuracy:incoming.accuracy,
      image:existing.image||incoming.image||null,
      verified:Boolean(existing.verified||incoming.verified),
      verificationStatus:(existing.verified||incoming.verified)?'FIELD_VERIFIED':existing.verificationStatus||incoming.verificationStatus,
      sourceType:existing.sourceType||incoming.sourceType,
      sourceUrl:existing.sourceUrl||incoming.sourceUrl,
      sourceLabel:existing.sourceLabel||incoming.sourceLabel,
      sources,
      createdAt:existing.createdAt||incoming.createdAt,
      createdBy:existing.createdBy||incoming.createdBy
    });
  }

  function saveNormalizedPoi(raw){
    const candidate=normalizedPoi(raw);
    if(!candidate.name) return {ok:false,error:'Nhập tên địa điểm.'};
    const list=pois();
    const dup=duplicateOf(candidate,list);
    if(dup){
      const i=list.findIndex(p=>p.id===dup.poi.id);
      list[i]=mergeDuplicate(dup.poi,candidate);
      setPois(list);
      audit('POI_DEDUP_MERGED',dup.poi.id,{incoming:candidate.id,distanceKm:Number.isFinite(dup.distanceKm)?+dup.distanceKm.toFixed(3):null,source:candidate.sourceType});
      return {ok:true,merged:true,poi:list[i]};
    }
    candidate.sources=[{type:candidate.sourceType,label:candidate.sourceLabel,url:candidate.sourceUrl||null,at:now(),by:candidate.createdBy}];
    list.unshift(candidate);
    setPois(list);
    audit('POI_CREATED_V2',candidate.id,{routeId:candidate.routeId,region:candidate.region,verified:candidate.verified,source:candidate.sourceType});
    return {ok:true,merged:false,poi:candidate};
  }

  function migratePois(){
    const list=pois();
    let changed=false;
    const migrated=list.map(p=>{
      if(p.schema===DATA_SCHEMA&&p.nameKey&&p.verificationStatus&&p.sourceType) return p;
      changed=true;
      return normalizedPoi({
        ...p,
        sourceType:p.category==='Chia sẻ Maps'?'google_maps':'legacy',
        sourceLabel:p.category==='Chia sẻ Maps'?'Google Maps':'Dữ liệu cũ',
        sourceUrl:p.category==='Chia sẻ Maps'&&/^https?:/i.test(p.note||'')?p.note:null,
        verificationStatus:p.verified?'FIELD_VERIFIED':'UNVERIFIED'
      });
    });
    if(changed){setPois(migrated);audit('POI_SCHEMA_MIGRATED','d1-pois',{schema:DATA_SCHEMA,count:migrated.length});}
  }

  window.openPoiForm=()=>{$('modal').innerHTML=`<div class="modalbg" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h2>Thêm địa điểm thực tế</h2>
    <input id="poiName" placeholder="Tên địa điểm">
    <select id="poiCategory"><option>Quán ăn</option><option>Coffee</option><option>Lưu trú</option><option>Trạm dừng</option><option>Cây xăng</option><option>Vui chơi</option><option>Tham quan</option><option>Tâm linh</option></select>
    <input id="poiSub" placeholder="Phân loại phụ: ăn sáng, khách sạn, resort…">
    <input id="poiNote" placeholder="Ghi chú / giá / điện thoại / nguồn">
    <input id="poiImage" type="file" accept="image/*">
    <label><input id="poiVerified" type="checkbox" style="width:auto"> Tôi đang ở đây và đã kiểm chứng tại chỗ</label>
    <div class="actions"><button class="primary" onclick="savePoi()">Lưu & phân loại</button><button onclick="closeModal()">Hủy</button></div>
    <p class="meta">Hệ thống tự chuẩn hóa tên, kiểm tra điểm trùng, gợi ý tuyến/khu vực và dùng GPS gần nhất. Ảnh tối đa 700 KB.</p>
  </div></div>`};

  window.savePoi=async()=>{
    const name=$('poiName')?.value.trim();
    if(!name) return alert('Nhập tên địa điểm.');
    let image=null,file=$('poiImage')?.files?.[0];
    if(file){
      if(file.size>700000) return alert('Ảnh vượt 700 KB.');
      image=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)});
    }
    const verified=Boolean($('poiVerified')?.checked);
    const result=saveNormalizedPoi({
      name,
      category:$('poiCategory')?.value||'Khác',
      subcategory:$('poiSub')?.value.trim()||'',
      note:$('poiNote')?.value.trim()||'',
      verified,
      lat:lastFix?.lat??null,
      lng:lastFix?.lng??null,
      accuracy:lastFix?.accuracy??null,
      image,
      sourceType:verified?'field':'manual',
      sourceLabel:verified?'Nhập tại chỗ':'Nhập thủ công'
    });
    if(!result.ok) return alert(result.error);
    closeModal();view='library';render();
    alert(result.merged?'Đã phát hiện điểm trùng và hợp nhất dữ liệu.':'Đã lưu và phân loại địa điểm.');
  };

  window.openShareImport=()=>{$('modal').innerHTML=`<div class="modalbg" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h2>Nhận địa điểm từ Google Maps</h2>
    <input id="mapUrl" placeholder="Dán URL Google Maps đầy đủ">
    <input id="mapName" placeholder="Tên địa điểm">
    <select id="mapCategory"><option>Quán ăn</option><option>Coffee</option><option>Lưu trú</option><option>Trạm dừng</option><option>Cây xăng</option><option>Vui chơi</option><option>Tham quan</option><option>Tâm linh</option><option>Khác</option></select>
    <input id="mapSub" placeholder="Phân loại phụ">
    <div class="actions"><button class="primary" onclick="saveMapLink()">Phân tích & nhập thư viện</button><button onclick="closeModal()">Hủy</button></div>
    <p class="meta">URL phải chứa tọa độ @lat,lng hoặc !3dlat!4dlng. Điểm từ Maps là nguồn tham chiếu, không tự nhận tích xanh xác minh tại chỗ.</p>
  </div></div>`};

  window.saveMapLink=()=>{
    const url=$('mapUrl')?.value.trim()||'';
    const name=$('mapName')?.value.trim()||'Điểm chia sẻ Google Maps';
    const c=parseMapUrl(url);
    if(!c) return alert('Không tìm thấy tọa độ trong URL. Hãy mở link rút gọn thành URL Google Maps đầy đủ rồi dán lại.');
    const result=saveNormalizedPoi({
      name,
      category:$('mapCategory')?.value||'Khác',
      subcategory:$('mapSub')?.value.trim()||'',
      note:'Nguồn: Google Maps',
      verified:false,
      verificationStatus:'SOURCE_IMPORTED',
      lat:c.lat,lng:c.lng,accuracy:null,
      sourceType:'google_maps',
      sourceLabel:'Google Maps',
      sourceUrl:url
    });
    closeModal();view='library';render();
    alert(result.merged?'Địa điểm đã tồn tại: nguồn Google Maps được hợp nhất vào bản ghi cũ.':'Đã nhập Google Maps và phân loại vào thư viện.');
  };

  window.rc2PoiPipeline={schema:DATA_SCHEMA,normalizeName,duplicateOf,saveNormalizedPoi,suggestRoute};
  migratePois();
})();
