(()=>{
  'use strict';
  const esc=value=>String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const finite=n=>Number.isFinite(Number(n));
  const rad=x=>x*Math.PI/180;
  const distanceKm=(a,b)=>{const R=6371,dLat=rad(Number(b.lat)-Number(a.lat)),dLon=rad(Number(b.lng)-Number(a.lng));const s=Math.sin(dLat/2)**2+Math.cos(rad(Number(a.lat)))*Math.cos(rad(Number(b.lat)))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(s)))};
  const categoryGroup=p=>{
    const s=`${p.category||''} ${p.subcategory||''}`.toLowerCase();
    if(/ăn|quán ăn|ẩm thực|food/.test(s)) return 'Ăn uống';
    if(/lưu trú|khách sạn|nhà nghỉ|villa|resort|hotel/.test(s)) return 'Lưu trú';
    if(/tham quan|vui chơi|check.?in|du lịch|tâm linh|di tích|bảo tàng/.test(s)) return 'Tham quan';
    return 'Khác';
  };
  const mapDest=p=>finite(p.lat)&&finite(p.lng)?`${Number(p.lat)},${Number(p.lng)}`:(p.name||'');
  const directions=p=>`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapDest(p))}`;
  const mapUrl=p=>`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapDest(p))}`;
  let active='Tất cả';
  let radius=50;

  function discoveryList(q=''){
    const origin=window.lastFix||JSON.parse(localStorage.getItem('d1-last-gps')||'null');
    return pois().map(p=>({
      ...p,
      group:categoryGroup(p),
      distance:origin&&finite(p.lat)&&finite(p.lng)?distanceKm(origin,p):null
    })).filter(p=>active==='Tất cả'||p.group===active)
      .filter(p=>!q||JSON.stringify(p).toLowerCase().includes(q))
      .filter(p=>p.distance===null||p.distance<=radius)
      .sort((a,b)=>{
        if(a.distance===null&&b.distance===null) return Number(b.verified)-Number(a.verified);
        if(a.distance===null) return 1;
        if(b.distance===null) return -1;
        if(a.distance!==b.distance) return a.distance-b.distance;
        return Number(b.verified)-Number(a.verified);
      });
  }

  window.renderDiscovery=function(q=''){
    const origin=window.lastFix||JSON.parse(localStorage.getItem('d1-last-gps')||'null');
    const list=discoveryList(q);
    const cats=['Tất cả','Ăn uống','Tham quan','Lưu trú'];
    const cards=list.length?list.map(p=>`<article class="panel">
      <span class="tag">${esc(p.group)}</span>${p.verified?'<span class="tag good">✓ Đã xác nhận</span>':'<span class="tag warn">Chưa xác minh</span>'}
      <h3>${esc(p.name)}</h3>
      <div class="meta">${esc(p.category||'')} ${p.subcategory?`· ${esc(p.subcategory)}`:''}<br>${p.distance===null?'Chưa tính được khoảng cách':`${p.distance<1?Math.round(p.distance*1000)+' m':p.distance.toFixed(1)+' km'} từ vị trí hiện tại`}<br>Tuyến: ${esc(p.routeId||'—')}</div>
      ${p.note?`<p>${esc(p.note)}</p>`:''}
      <div class="actions"><a class="pill primary" href="${directions(p)}" target="_blank" rel="noopener">Dẫn đường</a><a class="pill" href="${mapUrl(p)}" target="_blank" rel="noopener">Mở bản đồ</a></div>
    </article>`).join(''):'<div class="panel">Chưa có địa điểm phù hợp bộ lọc. Hãy thêm POI vào thư viện hoặc tăng bán kính.</div>';
    document.getElementById('main').innerHTML=`<h2>Khám phá quanh tôi</h2>
      <div class="notice">${origin?`Đang dùng vị trí GPS gần nhất ±${Math.round(origin.accuracy||0)} m.`:'Chưa có GPS. Bật Vị trí hiện tại để sắp xếp theo khoảng cách thực.'}</div>
      <div class="actions">${cats.map(c=>`<button class="${c===active?'primary':''}" onclick="setDiscoveryCategory('${c}')">${c}</button>`).join('')}</div>
      <div class="actions"><label class="meta">Bán kính <select id="discoveryRadius" onchange="setDiscoveryRadius(this.value)"><option value="10" ${radius===10?'selected':''}>10 km</option><option value="20" ${radius===20?'selected':''}>20 km</option><option value="30" ${radius===30?'selected':''}>30 km</option><option value="50" ${radius===50?'selected':''}>50 km</option><option value="100" ${radius===100?'selected':''}>100 km</option></select></label></div>
      <div class="grid" style="margin-top:10px">${cards}</div>`;
  };
  window.setDiscoveryCategory=c=>{active=c;renderDiscovery(document.getElementById('search')?.value.toLowerCase().trim()||'')};
  window.setDiscoveryRadius=v=>{radius=Number(v)||50;renderDiscovery(document.getElementById('search')?.value.toLowerCase().trim()||'')};

  const priorRender=window.render;
  window.render=function(){
    const q=document.getElementById('search')?.value.toLowerCase().trim()||'';
    document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===window.view));
    document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===window.view));
    if(window.view==='discovery'){
      renderDiscovery(q);
      updateHero?.();
      return;
    }
    priorRender();
  };

  document.querySelectorAll('[data-view="discovery"],[data-nav="discovery"]').forEach(b=>{
    b.onclick=()=>{window.view='discovery';window.render()};
  });
})();