(()=>{
  'use strict';
  const PACK_URL='./data/seed-ha-tien.json';

  async function loadPack(){
    const response=await fetch(PACK_URL,{cache:'no-cache'});
    if(!response.ok) throw new Error(`Không tải được seed pack (${response.status}).`);
    const data=await response.json();
    if(!Array.isArray(data.pois)) throw new Error('Seed pack không hợp lệ.');
    return data;
  }

  window.importHaTienSeed=async()=>{
    if(!window.rc2PoiPipeline?.saveNormalizedPoi) return alert('Pipeline POI chưa sẵn sàng.');
    try{
      const pack=await loadPack();
      let added=0,merged=0,skipped=0;
      for(const raw of pack.pois){
        const r=window.rc2PoiPipeline.saveNormalizedPoi({...raw,verified:false,verificationStatus:'SOURCE_IMPORTED'});
        if(!r?.ok){skipped++;continue}
        if(r.merged)merged++;else added++;
      }
      audit('POI_SEED_IMPORTED',pack.pack||'HATIEN-PILOT',{rows:pack.pois.length,added,merged,skipped,routeId:pack.routeId});
      view='library';render();
      alert(`Lô Hà Tiên: ${added} mới · ${merged} hợp nhất · ${skipped} bỏ qua.`);
    }catch(e){alert(e.message||'Không nạp được lô Hà Tiên.');}
  };

  const priorRender=window.render;
  window.render=function renderWithSeed(){
    priorRender();
    if(view!=='library')return;
    const heading=[...document.querySelectorAll('#main h2')].find(x=>x.textContent.includes('Thư viện'));
    const actions=heading?.parentElement?.querySelector('.actions');
    if(actions&&!actions.querySelector('[data-seed-ha-tien]')){
      const b=document.createElement('button');
      b.dataset.seedHaTien='1';
      b.textContent='Nạp lô Hà Tiên';
      b.onclick=importHaTienSeed;
      actions.appendChild(b);
    }
  };
})();
