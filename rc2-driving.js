(()=>{
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const recommendations=()=>window.DiDauEngine?.DrivingAdvisor?.recommendations?.()||{items:[],mode:'ENGINE_UNAVAILABLE',heading:null,speed:null,gpsHealth:null,routeContext:null};
  const dir=p=>`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${Number(p.lat)},${Number(p.lng)}`)}`;
  function renderDrivingRecommendations(){
    if(view!=='discovery')return;
    const main=document.getElementById('main');if(!main||main.querySelector('[data-driving-recommendations]'))return;
    const {items,mode,heading,speed,gpsHealth,routeContext}=recommendations();
    const panel=document.createElement('section');panel.className='panel';panel.dataset.drivingRecommendations='1';
    let status='Chưa có GPS hợp lệ để đề xuất phía trước.';
    if(mode==='GPS_NO_HEADING')status='Có GPS nhưng chưa đủ hướng/tốc độ ổn định; tạm ưu tiên điểm gần.';
    if(mode==='GPS_HEADING_UNSTABLE'||mode==='GPS_DIRECTION_RECOVERING')status='Hướng GPS chưa ổn định; tạm ngừng lọc theo hướng.';
    if(mode==='GPS_STALE')status='GPS đã cũ; tạm dừng đề xuất lái xe cho tới khi có mẫu mới.';
    if(mode==='GPS_POOR_ACCURACY')status='Sai số GPS quá lớn; tạm dừng đề xuất lái xe cho tới khi tín hiệu tốt hơn.';
    if(mode==='MOVING_FORWARD')status=`Đang lọc điểm phía trước theo hướng ${Math.round(heading)}° · tốc độ ${(speed*3.6).toFixed(0)} km/h.`;
    if(gpsHealth?.reason&&mode.startsWith('GPS_')&&!['GPS_NO_HEADING','GPS_HEADING_UNSTABLE','GPS_DIRECTION_RECOVERING'].includes(mode))status+=` ${gpsHealth.reason}.`;
    const routeLabel=routeContext?.routeId?` · Tuyến ${esc(routeContext.routeId)}`:'';
    const cards=items.length?items.map((p,i)=>`<div style="padding:8px 0;border-top:1px solid rgba(127,127,127,.25)"><b>${i+1}. ${esc(p.name)}</b> <span class="tag">${esc(p.driveGroup)}</span><div class="meta">${p.driveDistance.toFixed(1)} km${p.headingDelta!==null?` · lệch hướng ${Math.round(p.headingDelta)}°`:''}${p.corridorStage?` · ${esc(p.corridorStage)}`:''}</div><a class="pill primary" href="${dir(p)}" target="_blank" rel="noopener">Dẫn đường</a></div>`).join(''):'<p class="meta">Chưa có POI đủ điều kiện GPS trong phạm vi/hướng hiện tại.</p>';
    panel.innerHTML=`<h3>Đề xuất phía trước${routeLabel}</h3><p class="meta">${esc(status)}</p>${cards}`;
    const notice=main.querySelector('.notice');if(notice)notice.insertAdjacentElement('afterend',panel);else main.prepend(panel);
  }
  window.getDrivingRecommendations=recommendations;
  window.renderDrivingRecommendations=renderDrivingRecommendations;
  const priorRenderDiscovery=window.renderDiscovery;
  if(typeof priorRenderDiscovery==='function')window.renderDiscovery=function renderDiscoveryWithDriving(q=''){priorRenderDiscovery(q);renderDrivingRecommendations()};
})();
