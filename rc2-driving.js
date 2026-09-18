(()=>{
  'use strict';
  const finite=n=>Number.isFinite(Number(n));
  const rad=x=>x*Math.PI/180;
  const deg=x=>x*180/Math.PI;
  const norm=x=>((Number(x)%360)+360)%360;
  const esc=v=>String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const distanceKm=(a,b)=>{const R=6371,dLat=rad(Number(b.lat)-Number(a.lat)),dLon=rad(Number(b.lng)-Number(a.lng));const s=Math.sin(dLat/2)**2+Math.cos(rad(Number(a.lat)))*Math.cos(rad(Number(b.lat)))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(s)))};
  const bearing=(a,b)=>{const y=Math.sin(rad(Number(b.lng)-Number(a.lng)))*Math.cos(rad(Number(b.lat)));const x=Math.cos(rad(Number(a.lat)))*Math.sin(rad(Number(b.lat)))-Math.sin(rad(Number(a.lat)))*Math.cos(rad(Number(b.lat)))*Math.cos(rad(Number(b.lng)-Number(a.lng)));return norm(deg(Math.atan2(y,x)))};
  const angleDiff=(a,b)=>Math.abs(((norm(a)-norm(b)+540)%360)-180);
  const group=p=>{const s=`${p.category||''} ${p.subcategory||''}`.toLowerCase();if(/cây xăng|xăng dầu|petrol|fuel/.test(s))return'Cây xăng';if(/trạm dừng|điểm dịch vụ|rest stop/.test(s))return'Trạm dừng';if(/ăn|quán ăn|ẩm thực|food/.test(s))return'Ăn uống';if(/lưu trú|khách sạn|nhà nghỉ|villa|resort|hotel/.test(s))return'Lưu trú';return'Khác'};
  const priority={'Cây xăng':0,'Trạm dừng':1,'Ăn uống':2,'Lưu trú':3,'Khác':9};
  const currentOrigin=()=>lastFix||JSON.parse(localStorage.getItem('d1-last-gps')||'null');
  function recommendations(){
    const origin=currentOrigin();
    if(!origin||!finite(origin.lat)||!finite(origin.lng))return{items:[],mode:'NO_GPS',heading:null,speed:null};
    const heading=finite(origin.heading)?norm(origin.heading):null;
    const speed=finite(origin.speed)?Number(origin.speed):0;
    const moving=heading!==null&&speed>=1.5;
    const radius=Math.min(100,Math.max(5,Number(localStorage.getItem('d1-discovery-radius'))||50));
    const selectedStage=localStorage.getItem('d1-discovery-stage')||'Tất cả';
    const items=pois().filter(p=>p.routeId==='R-002'&&p.gpsRankEligible!==false&&finite(p.lat)&&finite(p.lng))
      .map(p=>{const d=distanceKm(origin,p),b=bearing(origin,p),delta=moving?angleDiff(heading,b):null;return{...p,driveGroup:group(p),driveDistance:d,driveBearing:b,headingDelta:delta}})
      .filter(p=>p.driveDistance<=radius)
      .filter(p=>selectedStage==='Tất cả'||!p.corridorStage||p.corridorStage===selectedStage)
      .filter(p=>!moving||p.headingDelta<=80)
      .sort((a,b)=>{
        const pa=priority[a.driveGroup]??9,pb=priority[b.driveGroup]??9;
        if(pa!==pb)return pa-pb;
        if(moving&&a.headingDelta!==b.headingDelta)return a.headingDelta-b.headingDelta;
        return a.driveDistance-b.driveDistance;
      }).slice(0,5);
    return{items,mode:moving?'MOVING_FORWARD':'GPS_NO_HEADING',heading,speed};
  }
  const dir=p=>`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${Number(p.lat)},${Number(p.lng)}`)}`;
  function renderDrivingRecommendations(){
    if(view!=='discovery')return;
    const main=document.getElementById('main');if(!main||main.querySelector('[data-driving-recommendations]'))return;
    const {items,mode,heading,speed}=recommendations();
    const panel=document.createElement('section');panel.className='panel';panel.dataset.drivingRecommendations='1';
    let status='Chưa có GPS hợp lệ để đề xuất phía trước.';
    if(mode==='GPS_NO_HEADING')status='Có GPS nhưng chưa đủ hướng/tốc độ ổn định; tạm ưu tiên điểm gần và loại chưa xác minh tọa độ.';
    if(mode==='MOVING_FORWARD')status=`Đang lọc điểm phía trước theo hướng ${Math.round(heading)}° · tốc độ ${(speed*3.6).toFixed(0)} km/h.`;
    const cards=items.length?items.map((p,i)=>`<div style="padding:8px 0;border-top:1px solid rgba(127,127,127,.25)"><b>${i+1}. ${esc(p.name)}</b> <span class="tag">${esc(p.driveGroup)}</span><div class="meta">${p.driveDistance.toFixed(1)} km${p.headingDelta!==null?` · lệch hướng ${Math.round(p.headingDelta)}°`:''}${p.corridorStage?` · ${esc(p.corridorStage)}`:''}</div><a class="pill primary" href="${dir(p)}" target="_blank" rel="noopener">Dẫn đường</a></div>`).join(''):'<p class="meta">Chưa có POI đủ điều kiện GPS trong phạm vi/hướng hiện tại.</p>';
    panel.innerHTML=`<h3>Đề xuất phía trước</h3><p class="meta">${esc(status)}</p>${cards}`;
    const notice=main.querySelector('.notice');if(notice)notice.insertAdjacentElement('afterend',panel);else main.prepend(panel);
  }
  window.getDrivingRecommendations=recommendations;
  window.renderDrivingRecommendations=renderDrivingRecommendations;
  const priorRenderDiscovery=window.renderDiscovery;
  if(typeof priorRenderDiscovery==='function'){
    window.renderDiscovery=function renderDiscoveryWithDriving(q=''){priorRenderDiscovery(q);renderDrivingRecommendations()};
  }
})();
