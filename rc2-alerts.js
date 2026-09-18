(()=>{
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>'\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[ch]));
  const GROUPS=['Cây xăng','Trạm dừng','Ăn uống','Lưu trú'];
  const THRESHOLDS=[10,20,30];
  const threshold=()=>{const v=Number(localStorage.getItem('d1-driving-alert-threshold'));return THRESHOLDS.includes(v)?v:20};
  const nearestByGroup=items=>GROUPS.map(group=>({group,item:items.filter(x=>x.driveGroup===group).sort((a,b)=>a.driveDistance-b.driveDistance)[0]||null}));
  function alertState(){
    if(typeof window.getDrivingRecommendations!=='function') return {mode:'UNAVAILABLE',threshold:threshold(),alerts:[]};
    const rec=window.getDrivingRecommendations();
    const limit=threshold();
    const alerts=nearestByGroup(rec.items||[]).filter(x=>x.item&&x.item.driveDistance<=limit).map(x=>({
      group:x.group,
      name:x.item.name,
      distanceKm:x.item.driveDistance,
      headingDelta:x.item.headingDelta,
      corridorStage:x.item.corridorStage||null,
      lat:x.item.lat,
      lng:x.item.lng
    }));
    return {mode:rec.mode,threshold:limit,alerts};
  }
  const dir=a=>`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${Number(a.lat)},${Number(a.lng)}`)}`;
  function renderAlerts(){
    if(view!=='discovery')return;
    const main=document.getElementById('main');if(!main)return;
    main.querySelector('[data-driving-alerts]')?.remove();
    const state=alertState();
    const panel=document.createElement('section');panel.className='panel';panel.dataset.drivingAlerts='1';
    const buttons=THRESHOLDS.map(v=>`<button class="${state.threshold===v?'primary':''}" onclick="setDrivingAlertThreshold(${v})">${v} km</button>`).join('');
    const rows=state.alerts.length?state.alerts.map(a=>`<div style="padding:8px 0;border-top:1px solid rgba(127,127,127,.25)"><b>${esc(a.group)} còn ${a.distanceKm.toFixed(1)} km</b><div class="meta">${esc(a.name)}${a.corridorStage?` · ${esc(a.corridorStage)}`:''}${a.headingDelta!==null&&a.headingDelta!==undefined?` · lệch hướng ${Math.round(a.headingDelta)}°`:''}</div><a class="pill primary" href="${dir(a)}" target="_blank" rel="noopener">Dẫn đường</a></div>`).join(''):'<p class="meta">Chưa có điểm đủ điều kiện trong ngưỡng cảnh báo hiện tại.</p>';
    panel.innerHTML=`<h3>Cảnh báo sắp tới</h3><p class="meta">Chỉ dùng POI R-002 đã đủ điều kiện GPS; khi đang di chuyển, kế thừa bộ lọc cùng hướng từ B5.</p><div class="actions">${buttons}</div>${rows}`;
    const drive=main.querySelector('[data-driving-recommendations]');if(drive)drive.insertAdjacentElement('afterend',panel);else{const notice=main.querySelector('.notice');if(notice)notice.insertAdjacentElement('afterend',panel);else main.prepend(panel)}
  }
  window.setDrivingAlertThreshold=v=>{const n=Number(v);if(!THRESHOLDS.includes(n))return;localStorage.setItem('d1-driving-alert-threshold',String(n));renderAlerts()};
  window.getDrivingAlertState=alertState;
  window.renderDrivingAlerts=renderAlerts;
  const prior=window.renderDiscovery;
  if(typeof prior==='function')window.renderDiscovery=function renderDiscoveryWithAlerts(q=''){prior(q);renderAlerts()};
})();
