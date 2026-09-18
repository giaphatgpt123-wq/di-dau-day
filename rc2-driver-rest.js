(()=>{
  'use strict';
  const KEY='d1-driving-rest-state';
  const THRESHOLD_MS=2*60*60*1000;
  const RESET_STOP_MS=15*60*1000;
  const MOVING_SPEED=1.5;
  const esc=v=>String(v??'').replace(/[&<>'\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[ch]));
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}};
  const write=s=>localStorage.setItem(KEY,JSON.stringify(s));
  const origin=()=>lastFix||JSON.parse(localStorage.getItem('d1-last-gps')||'null');
  function updateSession(){
    const now=Date.now(),gps=origin(),state=read();
    const speed=Number.isFinite(Number(gps?.speed))?Number(gps.speed):0;
    const moving=speed>=MOVING_SPEED;
    let next={...state};
    if(moving){
      if(!next.startedAt)next.startedAt=now;
      next.lastMovingAt=now;
      delete next.stoppedAt;
    }else if(next.startedAt){
      if(!next.stoppedAt)next.stoppedAt=now;
      if(now-next.stoppedAt>=RESET_STOP_MS)next={};
    }
    write(next);
    const elapsed=next.startedAt?Math.max(0,(next.lastMovingAt||now)-next.startedAt):0;
    return{state:next,elapsed,moving,speed,gps};
  }
  function nearestRest(){
    if(typeof window.getDrivingRecommendations!=='function')return null;
    const rec=window.getDrivingRecommendations();
    const items=(rec.items||[]).filter(x=>x.driveGroup==='Trạm dừng');
    return items.sort((a,b)=>a.driveDistance-b.driveDistance)[0]||null;
  }
  function evaluateRestReminder(){
    const session=updateSession();
    const state=session.state;
    const due=session.elapsed>=THRESHOLD_MS;
    const already=Boolean(state.restReminderIssued);
    let issued=false;
    if(due&&!already){state.restReminderIssued=Date.now();write(state);issued=true;}
    return{...session,due,issued,nearestRest:nearestRest(),thresholdMs:THRESHOLD_MS};
  }
  const dir=p=>p?`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${Number(p.lat)},${Number(p.lng)}`)}`:null;
  function renderRestReminder(){
    if(view!=='discovery')return;
    const main=document.getElementById('main');if(!main)return;
    main.querySelector('[data-driver-rest]')?.remove();
    const r=evaluateRestReminder();
    const panel=document.createElement('section');panel.className='panel';panel.dataset.driverRest='1';
    const mins=Math.floor(r.elapsed/60000),hh=Math.floor(mins/60),mm=mins%60;
    let body=`<p class="meta">Thời gian lái liên tục ghi nhận: ${hh} giờ ${mm} phút. Dừng liên tục 15 phút sẽ bắt đầu phiên mới.</p>`;
    if(r.due){
      body+=`<div class="notice"><b>Đã đến ngưỡng nghỉ sau 2 giờ lái liên tục.</b></div>`;
      if(r.nearestRest){body+=`<div style="padding:8px 0"><b>Trạm dừng phía trước: ${esc(r.nearestRest.name)}</b><div class="meta">${r.nearestRest.driveDistance.toFixed(1)} km${r.nearestRest.corridorStage?` · ${esc(r.nearestRest.corridorStage)}`:''}</div><a class="pill primary" href="${dir(r.nearestRest)}" target="_blank" rel="noopener">Dẫn đường đến điểm nghỉ</a></div>`}
      else body+='<p class="meta">Chưa có trạm dừng đủ điều kiện GPS trong danh sách phía trước. Hãy chủ động chọn điểm dừng an toàn phù hợp.</p>';
    }else body+='<p class="meta">Chưa đến ngưỡng nhắc nghỉ 2 giờ.</p>';
    panel.innerHTML=`<h3>Thời gian lái xe</h3>${body}`;
    const anchor=main.querySelector('[data-proactive-alerts]')||main.querySelector('[data-driving-alerts]')||main.querySelector('[data-driving-recommendations]');if(anchor)anchor.insertAdjacentElement('afterend',panel);else main.prepend(panel);
  }
  window.getDrivingRestState=evaluateRestReminder;
  window.resetDrivingRestSession=()=>localStorage.removeItem(KEY);
  window.renderDrivingRestReminder=renderRestReminder;
  const prior=window.renderDiscovery;
  if(typeof prior==='function')window.renderDiscovery=function renderDiscoveryWithRest(q=''){prior(q);renderRestReminder()};
})();
