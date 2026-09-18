(()=>{
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>'\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[ch]));
  const evaluate=()=>window.DiDauEngine?.DrivingSession?.evaluate?.()||{state:{},elapsed:0,moving:false,paused:true,speed:null,gps:null,gpsHealth:null,due:false,issued:false,nearestRest:null,thresholdMs:2*60*60*1000};
  const dir=p=>p?`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${Number(p.lat)},${Number(p.lng)}`)}`:null;
  function renderRestReminder(){
    if(view!=='discovery')return;
    const main=document.getElementById('main');if(!main)return;
    main.querySelector('[data-driver-rest]')?.remove();
    const r=evaluate(),panel=document.createElement('section');panel.className='panel';panel.dataset.driverRest='1';
    const mins=Math.floor(r.elapsed/60000),hh=Math.floor(mins/60),mm=mins%60;
    let body=`<p class="meta">Thời gian lái thực tế ghi nhận: ${hh} giờ ${mm} phút. Dừng ngắn không cộng vào thời gian lái; dừng liên tục 15 phút sẽ bắt đầu phiên mới.</p>`;
    if(r.paused)body+=`<div class="notice"><b>Tạm dừng bộ đếm do GPS chưa đủ tin cậy${r.gpsHealth?.reason?`: ${esc(r.gpsHealth.reason)}`:''}.</b></div>`;
    if(r.due){body+=`<div class="notice"><b>Đã đến ngưỡng nghỉ sau 2 giờ lái thực tế.</b></div>`;if(r.nearestRest)body+=`<div style="padding:8px 0"><b>Trạm dừng phía trước: ${esc(r.nearestRest.name)}</b><div class="meta">${r.nearestRest.driveDistance.toFixed(1)} km${r.nearestRest.corridorStage?` · ${esc(r.nearestRest.corridorStage)}`:''}</div><a class="pill primary" href="${dir(r.nearestRest)}" target="_blank" rel="noopener">Dẫn đường đến điểm nghỉ</a></div>`;else body+='<p class="meta">Chưa có trạm dừng đủ điều kiện GPS trong danh sách phía trước. Hãy chủ động chọn điểm dừng an toàn phù hợp.</p>'}else body+='<p class="meta">Chưa đến ngưỡng nhắc nghỉ 2 giờ lái thực tế.</p>';
    panel.innerHTML=`<h3>Thời gian lái xe</h3>${body}`;
    const anchor=main.querySelector('[data-proactive-alerts]')||main.querySelector('[data-driving-alerts]')||main.querySelector('[data-driving-recommendations]');if(anchor)anchor.insertAdjacentElement('afterend',panel);else main.prepend(panel);
  }
  window.getDrivingRestState=evaluate;
  window.resetDrivingRestSession=()=>window.DiDauEngine?.DrivingSession?.reset?.();
  window.renderDrivingRestReminder=renderRestReminder;
  const prior=window.renderDiscovery;if(typeof prior==='function')window.renderDiscovery=function renderDiscoveryWithRest(q=''){prior(q);renderRestReminder()};
})();
