(()=>{
  'use strict';
  const finite=n=>Number.isFinite(Number(n));
  const esc=v=>String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

  function queue(){
    return pois().filter(p=>!finite(p.lat)||!finite(p.lng)||p.gpsRankEligible===false||p.geocodeStatus==='ADDRESS_ONLY_NEEDS_GEOCODE');
  }

  function updatePoi(id,patch){
    const list=pois();
    const i=list.findIndex(p=>p.id===id);
    if(i<0) return false;
    list[i]={...list[i],...patch,updatedAt:Date.now()};
    setPois(list);
    return list[i];
  }

  window.openGeocodeQueue=()=>{
    const items=queue();
    const rows=items.slice(0,100).map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.address||'—')}</td><td>${esc(p.category||'—')}</td><td>${esc(p.geocodeStatus||'CHỜ TỌA ĐỘ')}</td><td><button onclick="openGeocodeVerify('${p.id}')">Xác minh</button></td></tr>`).join('');
    $('modal').innerHTML=`<div class="modalbg" onclick="if(event.target===this)closeModal()"><div class="modal"><h2>Hàng đợi tọa độ</h2><p class="meta">${items.length} POI đang chờ tọa độ/xác minh. Không điểm nào được bật xếp hạng GPS trước khi xác nhận.</p><div style="overflow:auto;max-height:420px"><table><thead><tr><th>Tên</th><th>Địa chỉ</th><th>Loại</th><th>Trạng thái</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="5">Không còn POI chờ tọa độ.</td></tr>'}</tbody></table></div><div class="actions"><button onclick="closeModal()">Đóng</button></div></div></div>`;
  };

  window.openGeocodeVerify=id=>{
    const p=pois().find(x=>x.id===id);if(!p)return;
    $('modal').innerHTML=`<div class="modalbg" onclick="if(event.target===this)closeModal()"><div class="modal"><h2>Xác minh tọa độ</h2><p><b>${esc(p.name)}</b></p><p class="meta">${esc(p.address||'Chưa có địa chỉ')}</p><input id="geoLat" inputmode="decimal" placeholder="Vĩ độ (lat)" value="${finite(p.lat)?p.lat:''}"><input id="geoLng" inputmode="decimal" placeholder="Kinh độ (lng)" value="${finite(p.lng)?p.lng:''}"><input id="geoSource" placeholder="Nguồn tọa độ / ghi chú xác minh"><label><input id="geoField" type="checkbox" style="width:auto"> Tôi đang ở đúng địa điểm này và dùng GPS hiện tại</label><div class="actions"><button class="primary" onclick="confirmGeocode('${p.id}')">Xác nhận tọa độ</button><button onclick="openGeocodeQueue()">Quay lại</button></div><p class="meta">Nếu tích “đang ở đúng địa điểm”, hệ thống dùng mẫu GPS gần nhất; nếu không, phải nhập lat/lng từ nguồn đáng tin cậy.</p></div></div>`;
  };

  window.confirmGeocode=id=>{
    const p=pois().find(x=>x.id===id);if(!p)return;
    const field=Boolean($('geoField')?.checked);
    let lat,lng,accuracy=null,method='MANUAL_COORD_CONFIRMED';
    if(field){
      if(!lastFix||!finite(lastFix.lat)||!finite(lastFix.lng)) return alert('Chưa có GPS hiện tại hợp lệ.');
      if(Number(lastFix.accuracy)>80) return alert('Sai số GPS lớn hơn 80 m. Hãy lấy lại vị trí trước khi xác minh.');
      lat=Number(lastFix.lat);lng=Number(lastFix.lng);accuracy=Number(lastFix.accuracy)||null;method='FIELD_GPS_CONFIRMED';
    }else{
      lat=Number($('geoLat')?.value);lng=Number($('geoLng')?.value);
      if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat<-90||lat>90||lng<-180||lng>180) return alert('Tọa độ không hợp lệ.');
    }
    const source=$('geoSource')?.value.trim()||null;
    const updated=updatePoi(id,{lat,lng,accuracy,gpsRankEligible:true,geocodeStatus:method,coordinateSource:source,coordinateVerifiedAt:Date.now(),routeAssignment:'COORDINATE_CONFIRMED'});
    if(!updated)return;
    audit('POI_COORDINATE_CONFIRMED',id,{method,lat,lng,accuracy,source});
    openGeocodeQueue();
  };

  const priorRender=window.render;
  window.render=function renderWithGeocodeQueue(){
    priorRender();
    if(view!=='library')return;
    const heading=[...document.querySelectorAll('#main h2')].find(x=>x.textContent.includes('Thư viện'));
    const actions=heading?.parentElement?.querySelector('.actions');
    if(actions&&!actions.querySelector('[data-geocode-queue]')){
      const b=document.createElement('button');b.dataset.geocodeQueue='1';b.textContent=`Tọa độ chờ (${queue().length})`;b.onclick=openGeocodeQueue;actions.appendChild(b);
    }
  };
})();
