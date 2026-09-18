(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(fix,category=null){const root=document.getElementById('ticRecommendations');if(!root||!window.A1TicBridge)return;const rows=fix?A1TicBridge.nearby(fix,{category,radiusKm:30,limit:12}):[];if(!fix){root.innerHTML='<p class="meta">Bật Vị trí hiện tại để xem đề xuất.</p>';return}if(!rows.length){root.innerHTML='<p class="meta">Chưa có POI VERIFIED phù hợp trong gói dữ liệu hiện tại.</p>';return}root.innerHTML=rows.map(p=>{const n=A1TicBridge.nav(p);return `<article class="panel"><b>${esc(p.canonical_name)}</b><p class="meta">${esc(p.category)} · ${p.distance_km.toFixed(1)} km đường thẳng</p><div class="actions"><a class="primary" href="${n.googleMaps}" target="_blank" rel="noopener">Dẫn đường</a><a href="${n.geo}">Mở bản đồ</a></div></article>`}).join('')}
window.A1TicUi={render};
addEventListener('a1:gps',e=>render(e.detail));
})();