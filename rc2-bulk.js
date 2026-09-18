(()=>{
  'use strict';
  const MAX_ROWS=2000;
  const REQUIRED=['name'];
  let preview=[];
  const clean=v=>String(v??'').trim();
  const num=v=>{const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null};
  const esc=v=>String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const validCoord=(lat,lng)=>lat!==null&&lng!==null&&lat>=-90&&lat<=90&&lng>=-180&&lng<=180;

  function parseCsv(text){
    const rows=[];let row=[],cell='',q=false;
    for(let i=0;i<text.length;i++){
      const c=text[i],n=text[i+1];
      if(c==='"'&&q&&n==='"'){cell+='"';i++;continue}
      if(c==='"'){q=!q;continue}
      if(c===','&&!q){row.push(cell);cell='';continue}
      if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&n==='\n')i++;row.push(cell);cell='';if(row.some(x=>clean(x)))rows.push(row);row=[];continue}
      cell+=c;
    }
    row.push(cell);if(row.some(x=>clean(x)))rows.push(row);
    if(rows.length<2)return[];
    const headers=rows[0].map(h=>clean(h).toLowerCase());
    return rows.slice(1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??''])));
  }

  function normalizeRow(raw,index){
    const name=clean(raw.name||raw.ten||raw['tên']);
    const lat=num(raw.lat||raw.latitude||raw.vĩ_độ||raw['vĩ độ']);
    const lng=num(raw.lng||raw.lon||raw.longitude||raw.kinh_độ||raw['kinh độ']);
    const hasAnyCoord=lat!==null||lng!==null;
    const errors=[];
    if(!name)errors.push('Thiếu tên');
    if(hasAnyCoord&&!validCoord(lat,lng))errors.push('Tọa độ không hợp lệ');
    const sourceUrl=clean(raw.sourceurl||raw.source_url||raw.url||raw.link||raw.nguon||raw['nguồn']);
    return {
      index:index+1,
      valid:errors.length===0,
      errors,
      poi:{
        name,
        category:clean(raw.category||raw.danhmuc||raw['danh mục'])||'Khác',
        subcategory:clean(raw.subcategory||raw.phanloai||raw['phân loại']),
        note:clean(raw.note||raw.ghichu||raw['ghi chú']),
        phone:clean(raw.phone||raw.sdt||raw['số điện thoại']),
        price:clean(raw.price||raw.gia||raw['giá']),
        lat:validCoord(lat,lng)?lat:null,
        lng:validCoord(lat,lng)?lng:null,
        sourceType:'bulk_import',
        sourceLabel:clean(raw.sourcelabel||raw.source_label)||'Bulk import',
        sourceUrl:sourceUrl||null,
        verified:false,
        verificationStatus:'SOURCE_IMPORTED'
      }
    };
  }

  async function parseFile(file){
    if(!file)throw new Error('Chưa chọn tệp.');
    if(file.size>5*1024*1024)throw new Error('Tệp vượt 5 MB.');
    const text=await file.text();
    let rows;
    if(/\.json$/i.test(file.name)||file.type==='application/json'){
      const data=JSON.parse(text);rows=Array.isArray(data)?data:(Array.isArray(data.pois)?data.pois:[]);
    }else rows=parseCsv(text.replace(/^\uFEFF/,''));
    if(!Array.isArray(rows)||!rows.length)throw new Error('Không đọc được bản ghi POI.');
    if(rows.length>MAX_ROWS)throw new Error(`Tối đa ${MAX_ROWS} bản ghi mỗi lần.`);
    return rows.map(normalizeRow);
  }

  function renderPreview(){
    const valid=preview.filter(x=>x.valid),bad=preview.filter(x=>!x.valid);
    const sample=preview.slice(0,20).map(x=>`<tr><td>${x.index}</td><td>${esc(x.poi.name||'—')}</td><td>${esc(x.poi.category)}</td><td>${x.poi.lat??'—'}, ${x.poi.lng??'—'}</td><td>${x.valid?'OK':esc(x.errors.join('; '))}</td></tr>`).join('');
    $('bulkPreview').innerHTML=`<p><b>${preview.length}</b> dòng · <b>${valid.length}</b> hợp lệ · <b>${bad.length}</b> lỗi</p><div style="overflow:auto;max-height:320px"><table><thead><tr><th>#</th><th>Tên</th><th>Danh mục</th><th>Tọa độ</th><th>Trạng thái</th></tr></thead><tbody>${sample}</tbody></table></div>${preview.length>20?'<p class="meta">Chỉ hiển thị 20 dòng đầu.</p>':''}`;
    $('bulkCommit').disabled=!valid.length;
  }

  window.openBulkImport=()=>{$('modal').innerHTML=`<div class="modalbg" onclick="if(event.target===this)closeModal()"><div class="modal"><h2>Nhập hàng loạt POI</h2><input id="bulkFile" type="file" accept=".csv,.json,text/csv,application/json"><div class="actions"><button class="primary" onclick="previewBulkImport()">Xem trước</button><button onclick="downloadBulkTemplate()">Tải mẫu CSV</button><button id="bulkCommit" disabled onclick="commitBulkImport()">Nhập thư viện</button><button onclick="closeModal()">Hủy</button></div><div id="bulkPreview" class="meta">CSV/JSON tối đa ${MAX_ROWS} bản ghi. Tên là bắt buộc; tọa độ nếu có phải hợp lệ.</div></div></div>`};

  window.previewBulkImport=async()=>{try{preview=await parseFile($('bulkFile')?.files?.[0]);renderPreview()}catch(e){alert(e.message||'Không đọc được tệp.')}};

  window.commitBulkImport=()=>{
    if(!window.rc2PoiPipeline?.saveNormalizedPoi)return alert('Pipeline POI chưa sẵn sàng.');
    let added=0,merged=0,skipped=0;
    for(const row of preview){
      if(!row.valid){skipped++;continue}
      const r=window.rc2PoiPipeline.saveNormalizedPoi(row.poi);
      if(!r?.ok){skipped++;continue}
      if(r.merged)merged++;else added++;
    }
    audit('POI_BULK_IMPORTED','d1-pois',{rows:preview.length,added,merged,skipped});
    closeModal();view='library';render();
    alert(`Nhập xong: ${added} mới · ${merged} hợp nhất · ${skipped} bỏ qua.`);
  };

  window.downloadBulkTemplate=()=>{
    const csv='name,category,subcategory,lat,lng,note,phone,price,sourceUrl,sourceLabel\nQuán mẫu,Quán ăn,Ăn sáng,10.000000,106.000000,Ghi chú,0900000000,50000,https://example.com,Nguồn tham chiếu\n';
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='didauday-poi-template.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  };

  const priorRender=window.render;
  window.render=function renderWithBulk(){
    priorRender();
    if(view!=='library')return;
    const heading=[...document.querySelectorAll('#main h2')].find(x=>x.textContent.includes('Thư viện'));
    const actions=heading?.parentElement?.querySelector('.actions');
    if(actions&&!actions.querySelector('[data-bulk-import]')){
      const b=document.createElement('button');b.dataset.bulkImport='1';b.textContent='Nhập hàng loạt CSV/JSON';b.onclick=openBulkImport;actions.appendChild(b);
    }
  };
})();