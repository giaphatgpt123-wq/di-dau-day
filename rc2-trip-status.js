(()=>{
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>'\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[ch]));
  const finite=v=>Number.isFinite(Number(v));
  const nearest=(items,group)=>(items||[]).filter(x=>x.driveGroup===group).sort((a,b)=>a.driveDistance-b.driveDistance)[0]||null;
  const fmtElapsed=ms=>{const m=Math.floor(Math.max(0,Number(ms)||0)/60000);return `${Math.floor(m/60)} giờ ${m%60} phút`};
  function snapshot(){
    const health=typeof window.getGpsHealth==='function'?window.getGpsHealth():null;
    const gps=health?.fix||(lastFix||JSON.parse(localStorage.getItem('d1-last-gps')||'null'));
    const rec=typeof window.getDrivingRecommendations==='function'?window.getDrivingRecommendations():{items:[],mode:'UNAVAILABLE'};
    const rest=typeof window.getDrivingRestState==='function'?window.getDrivingRestState():null;
    const proactive=typeof window.getProactiveAlertState==='function'?window.getProactiveAlertState():null;
    const fuel=nearest(rec.items,'Cây xăng'),stop=nearest(rec.items,'Trạm dừng');
    const selectedStage=localStorage.getItem('d1-discovery-stage')||'Tất cả';
    const inferredStage=(fuel||stop||rec.items?.[0])?.corridorStage||null;
    const active=[];
    if(rest?.due)active.push('Đến ngưỡng nghỉ sau 2 giờ lái');
    if(proactive?.serviceGap)active.push('Khoảng trống dịch vụ phía trước');
    if(health&&!health.usable)active.push(health.reason||`GPS ${health.status}`);
    if(health?.status==='HEADING_UNSTABLE')active.push('Hướng GPS không ổn định');
    const speed=health?.speedKnown&&finite(gps?.speed)?Number(gps.speed):null;
    const heading=health?.directional&&finite(gps?.heading)?Number(gps.heading):null;
    return{speedKmh:speed===null?null:speed*3.6,heading,drivingElapsed:rest?.elapsed||0,drivingDue:Boolean(rest?.due),stage:selectedStage!=='Tất cả'?selectedStage:(inferredStage||'Chưa xác định'),nextFuel:fuel,nextRest:stop,alerts:active,mode:rec.mode,gpsHealth:health};
  }
  const dir=p=>p&&finite(p.lat)&&finite(p.lng)?`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${Number(p.lat)},${Number(p.lng)}`)}`:null;
  function poiRow(label,p){if(!p)return `<div class="meta"><b>${esc(label)}:</b> chưa có điểm đủ điều kiện phía trước.</div>`;const link=dir(p);return `<div class="meta"><b>${esc(label)}:</b> ${esc(p.name)} · ${p.driveDistance.toFixed(1)} km${p.corridorStage?` · ${esc(p.corridorStage)}`:''}${link?` · <a href="${link}" target="_blank" rel="noopener">Dẫn đường</a>`:''}</div>`;}
  function renderTripStatus(){if(view!=='discovery')return;const main=document.getElementById('main');if(!main)return;main.querySelector('[data-trip-status]')?.remove();const s=snapshot(),panel=document.createElement('section');panel.className='panel';panel.dataset.tripStatus='1';const speed=s.speedKmh===null?'—':`${s.speedKmh.toFixed(0)} km/h`,heading=s.heading===null?'—':`${Math.round(s.heading)}°`;const gpsState=s.gpsHealth?`<div class="meta"><b>GPS:</b> ${esc(s.gpsHealth.status)}${Number.isFinite(s.gpsHealth.ageMs)?` · ${Math.round(s.gpsHealth.ageMs/1000)}s`:''}</div>`:'';const warning=s.alerts.length?`<div class="notice"><b>Cảnh báo đang hoạt động</b><div class="meta">${s.alerts.map(esc).join(' · ')}</div></div>`:'<p class="meta">Không có cảnh báo chủ động đang hoạt động.</p>';panel.innerHTML=`<h3>Trạng thái hành trình</h3><div class="gpsline"><span><b>Tốc độ:</b> ${speed}</span><span><b>Hướng:</b> ${heading}</span></div><div class="gpsline"><span><b>Đã lái:</b> ${fmtElapsed(s.drivingElapsed)}</span><span><b>Chặng:</b> ${esc(s.stage)}</span></div>${gpsState}${poiRow('Cây xăng kế tiếp',s.nextFuel)}${poiRow('Trạm dừng kế tiếp',s.nextRest)}${warning}`;const notice=main.querySelector('.notice');if(notice)notice.insertAdjacentElement('afterend',panel);else main.prepend(panel);}
  window.getTripStatus=snapshot;window.renderTripStatus=renderTripStatus;const prior=window.renderDiscovery;if(typeof prior==='function')window.renderDiscovery=function renderDiscoveryWithTripStatus(q=''){prior(q);renderTripStatus()};
})();
