(()=>{
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>'\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[ch]));
  const evaluate=()=>window.DiDauEngine?.AlertEngine?.evaluate?.()||{mode:'UNAVAILABLE',events:[],serviceGap:false,routeContext:null};
  const dir=e=>e.lat!=null&&e.lng!=null?`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${Number(e.lat)},${Number(e.lng)}`)}`:null;
  function renderProactive(){
    if(view!=='discovery')return;
    const main=document.getElementById('main');if(!main)return;
    main.querySelector('[data-proactive-alerts]')?.remove();
    const result=evaluate();
    const panel=document.createElement('section');panel.className='panel';panel.dataset.proactiveAlerts='1';
    const rows=result.events.length?result.events.map(e=>e.type==='SERVICE_GAP'?`<div style="padding:8px 0;border-top:1px solid rgba(127,127,127,.25)"><b>Cảnh báo khoảng trống dịch vụ</b><div class="meta">${esc(e.name)}</div></div>`:`<div style="padding:8px 0;border-top:1px solid rgba(127,127,127,.25)"><b>${esc(e.group)} còn ${e.distanceKm.toFixed(1)} km</b><span class="tag">Mức ${e.level} km</span><div class="meta">${esc(e.name)}${e.corridorStage?` · ${esc(e.corridorStage)}`:''}</div>${dir(e)?`<a class="pill primary" href="${dir(e)}" target="_blank" rel="noopener">Dẫn đường</a>`:''}</div>`).join(''):'<p class="meta">Không có cảnh báo mới. Hệ thống chống lặp cho cùng POI và cùng ngưỡng.</p>';
    panel.innerHTML=`<h3>Cảnh báo chủ động</h3><p class="meta">AlertEngine dùng chung RouteContext; tự chuyển mức 30 → 20 → 10 km và chống lặp theo từng tuyến.</p>${rows}`;
    const anchor=main.querySelector('[data-driving-alerts]')||main.querySelector('[data-driving-recommendations]');if(anchor)anchor.insertAdjacentElement('afterend',panel);else main.prepend(panel);
  }
  window.getProactiveAlertState=evaluate;
  window.resetProactiveAlerts=()=>window.DiDauEngine?.AlertEngine?.reset?.();
  window.renderProactiveAlerts=renderProactive;
  const prior=window.renderDiscovery;if(typeof prior==='function')window.renderDiscovery=function renderDiscoveryWithProactive(q=''){prior(q);renderProactive()};
})();
