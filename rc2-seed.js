(()=>{
  'use strict';
  const PACKS={
    hatien:{url:'./data/seed-ha-tien.json',label:'Lô Hà Tiên'},
    corridor:{url:'./data/seed-r002-corridor.json',label:'Lô hành lang R-002'}
  };

  async function loadPack(key){
    const cfg=PACKS[key];
    if(!cfg) throw new Error('Seed pack không tồn tại.');
    const response=await fetch(cfg.url,{cache:'no-cache'});
    if(!response.ok) throw new Error(`Không tải được seed pack (${response.status}).`);
    const data=await response.json();
    if(!Array.isArray(data.pois)) throw new Error('Seed pack không hợp lệ.');
    return {cfg,data};
  }

  async function importSeed(key){
    if(!window.rc2PoiPipeline?.saveNormalizedPoi) return alert('Pipeline POI chưa sẵn sàng.');
    try{
      const {cfg,data:pack}=await loadPack(key);
      let added=0,merged=0,skipped=0;
      for(const raw of pack.pois){
        const r=window.rc2PoiPipeline.saveNormalizedPoi({...raw,verified:false,verificationStatus:'SOURCE_IMPORTED'});
        if(!r?.ok){skipped++;continue}
        if(r.merged)merged++;else added++;
      }
      audit('POI_SEED_IMPORTED',pack.pack||key,{rows:pack.pois.length,added,merged,skipped,routeId:pack.routeId});
      view='library';render();
      alert(`${cfg.label}: ${added} mới · ${merged} hợp nhất · ${skipped} bỏ qua.`);
    }catch(e){alert(e.message||'Không nạp được seed pack.');}
  }

  window.importHaTienSeed=()=>importSeed('hatien');
  window.importR002CorridorSeed=()=>importSeed('corridor');

  const priorRender=window.render;
  window.render=function renderWithSeed(){
    priorRender();
    if(view!=='library')return;
    const heading=[...document.querySelectorAll('#main h2')].find(x=>x.textContent.includes('Thư viện'));
    const actions=heading?.parentElement?.querySelector('.actions');
    if(!actions)return;
    if(!actions.querySelector('[data-seed-ha-tien]')){
      const b=document.createElement('button');
      b.dataset.seedHaTien='1';
      b.textContent='Nạp lô Hà Tiên';
      b.onclick=importHaTienSeed;
      actions.appendChild(b);
    }
    if(!actions.querySelector('[data-seed-r002-corridor]')){
      const b=document.createElement('button');
      b.dataset.seedR002Corridor='1';
      b.textContent='Nạp hành lang R-002';
      b.onclick=importR002CorridorSeed;
      actions.appendChild(b);
    }
  };
})();
