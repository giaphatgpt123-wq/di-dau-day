(()=>{
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>'\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[ch]));
  const LEVELS=[30,20,10];
  const SERVICE_GROUPS=['Cây xăng','Trạm dừng'];
  const key='d1-proactive-alert-state';
  const readState=()=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return{}}};
  const writeState=s=>localStorage.setItem(key,JSON.stringify(s));
  const bucket=d=>d<=10?10:d<=20?20:d<=30?30:null;
  function evaluate(){
    if(typeof window.getDrivingRecommendations!=='function')return{mode:'UNAVAILABLE',events:[],serviceGap:false};
    const rec=window.getDrivingRecommendations();
    const state=readState();
    const next={...state};
    const events=[];
    for(const item of rec.items||[]){
      const level=bucket(Number(item.driveDistance));
      if(!level)continue;
      const id=String(item.id||item.name||'poi');
      const prev=Number(state[id]||0);
      if(prev===level)continue;
      if(prev&&level>prev)continue;
      next[id]=level;
      events.push({type:'PROXIMITY',level,group:item.driveGroup,name:item.name,distanceKm:item.driveDistance,corridorStage:item.corridorStage||null,lat:item.lat,lng:item.lng});
    }
    const services=(rec.items||[]).filter(x=>SERVICE_GROUPS.includes(x.driveGroup));
    const serviceGap=rec.mode==='MOVING_FORWARD'&&services.length===0;
    const gapKey='__service_gap__';
    if(serviceGap&&!state[gapKey]){next[gapKey]=Date.now();events.push({type:'SERVICE_GAP',level:null,group:'Dịch vụ',name:'Phía trước chưa có cây xăng/trạm dừng đủ điều kiện trong phạm vi hiện tại',distanceKm:null});}
    if(!serviceGap&&state[gapKey])delete next[gapKey];
    writeState(next);
    return{mode:rec.mode,events,serviceGap};
  }
  const dir=e=>e.lat!=null&&e.lng!=null?`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${Number(e.lat)},${Number(e.lng)}`)}`:null;
  function renderProactive(){
    if(view!=='discovery')return;
    const main=document.getElementById('main');if(!main)return;
    main.querySelector('[data-proactive-alerts]')?.remove();
    const result=evaluate();
    const panel=document.createElement('section');panel.className='panel';panel.dataset.proactiveAlerts='1';
    const rows=result.events.length?result.events.map(e=>e.type==='SERVICE_GAP'?`<div style="padding:8px 0;border-top:1px solid rgba(127,127,127,.25)"><b>Cảnh báo khoảng trống dịch vụ</b><div class="meta">${esc(e.name)}</div></div>`:`<div style="padding:8px 0;border-top:1px solid rgba(127,127,127,.25)"><b>${esc(e.group)} còn ${e.distanceKm.toFixed(1)} km</b><span class="tag">Mức ${e.level} km</span><div class="meta">${esc(e.name)}${e.corridorStage?` · ${esc(e.corridorStage)}`:''}</div>${dir(e)?`<a class="pill primary" href="${dir(e)}" target="_blank" rel="noopener">Dẫn đường</a>`:''}</div>`).join(''):'<p class="meta">Không có cảnh báo mới. Hệ thống chống lặp cho cùng POI và cùng ngưỡng.</p>';
    panel.innerHTML=`<h3>Cảnh báo chủ động</h3><p class="meta">Tự chuyển mức 30 → 20 → 10 km khi tiến gần. Cảnh báo chỉ phát lại khi sang ngưỡng gần hơn; khoảng trống dịch vụ chỉ cảnh báo một lần cho tới khi có lại điểm dịch vụ phía trước.</p>${rows}`;
    const anchor=main.querySelector('[data-driving-alerts]')||main.querySelector('[data-driving-recommendations]');if(anchor)anchor.insertAdjacentElement('afterend',panel);else main.prepend(panel);
  }
  window.getProactiveAlertState=evaluate;
  window.resetProactiveAlerts=()=>localStorage.removeItem(key);
  window.renderProactiveAlerts=renderProactive;
  const prior=window.renderDiscovery;
  if(typeof prior==='function')window.renderDiscovery=function renderDiscoveryWithProactive(q=''){prior(q);renderProactive()};
})();
