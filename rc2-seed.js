(()=>{
  'use strict';
  const PACKS={
    hatien:{url:'./data/seed-ha-tien.json',label:'Lô Hà Tiên'},
    corridor:{url:'./data/seed-r002-corridor.json',label:'Lô hành lang R-002'},
    b2:{url:'./data/seed-r002-b2.json',label:'Lô R-002 B2 ăn uống & nhiên liệu'},
    b3:{url:'./data/seed-r002-b3.json',label:'Lô R-002 B3 ăn uống & điểm dịch vụ'}
  };
  async function loadPack(key){const cfg=PACKS[key];if(!cfg)throw new Error('Seed pack không tồn tại.');const response=await fetch(cfg.url,{cache:'no-cache'});if(!response.ok)throw new Error(`Không tải được seed pack (${response.status}).`);const data=await response.json();if(!Array.isArray(data.pois))throw new Error('Seed pack không hợp lệ.');return{cfg,data}}
  async function importSeed(key){if(!window.rc2PoiPipeline?.saveNormalizedPoi)return alert('Pipeline POI chưa sẵn sàng.');try{const {cfg,data:pack}=await loadPack(key);let added=0,merged=0,skipped=0;for(const raw of pack.pois){const r=window.rc2PoiPipeline.saveNormalizedPoi({...raw,verified:false,verificationStatus:'SOURCE_IMPORTED'});if(!r?.ok){skipped++;continue}if(r.merged)merged++;else added++}audit('POI_SEED_IMPORTED',pack.pack||key,{rows:pack.pois.length,added,merged,skipped,routeId:pack.routeId});view='library';render();alert(`${cfg.label}: ${added} mới · ${merged} hợp nhất · ${skipped} bỏ qua.`)}catch(e){alert(e.message||'Không nạp được seed pack.')}}
  window.importHaTienSeed=()=>importSeed('hatien');window.importR002CorridorSeed=()=>importSeed('corridor');window.importR002B2Seed=()=>importSeed('b2');window.importR002B3Seed=()=>importSeed('b3');
  const priorRender=window.render;window.render=function renderWithSeed(){priorRender();if(view!=='library')return;const heading=[...document.querySelectorAll('#main h2')].find(x=>x.textContent.includes('Thư viện'));const actions=heading?.parentElement?.querySelector('.actions');if(!actions)return;const buttons=[['seedHaTien','Nạp lô Hà Tiên',importHaTienSeed],['seedR002Corridor','Nạp hành lang R-002',importR002CorridorSeed],['seedR002B2','Nạp R-002 B2 ăn/xăng',importR002B2Seed],['seedR002B3','Nạp R-002 B3 ăn/dịch vụ',importR002B3Seed]];for(const[key,label,handler]of buttons){const attr=`data-${key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}`;if(actions.querySelector(`[${attr}]`))continue;const b=document.createElement('button');b.dataset[key]='1';b.textContent=label;b.onclick=handler;actions.appendChild(b)}};
})();
