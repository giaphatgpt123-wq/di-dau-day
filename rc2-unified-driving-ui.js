(()=>{
  'use strict';
  const DETAIL_SELECTORS=['[data-driving-recommendations]','[data-driving-alerts]','[data-proactive-alerts]','[data-driver-rest]'];
  const SPEED_MOVING_KMH=5.4;
  const key='d1-driving-details-open';
  const isDetailsOpen=()=>localStorage.getItem(key)==='1';
  const setDetailsOpen=v=>localStorage.setItem(key,v?'1':'0');
  function isMoving(){
    const s=typeof window.getTripStatus==='function'?window.getTripStatus():null;
    return Number(s?.speedKmh||0)>=SPEED_MOVING_KMH;
  }
  function collectPanels(main){
    const panels=[];
    for(const sel of DETAIL_SELECTORS){const el=main.querySelector(sel);if(el)panels.push(el)}
    return panels;
  }
  function apply(){
    if(typeof view!=='undefined'&&view!=='discovery')return;
    const main=document.getElementById('main');if(!main)return;
    main.querySelector('[data-unified-driving-ui]')?.remove();
    const moving=isMoving();
    const detailsOpen=!moving||isDetailsOpen();
    const panels=collectPanels(main);
    for(const p of panels){p.hidden=!detailsOpen;p.dataset.technicalPanel='1'}
    const status=main.querySelector('[data-trip-status]');
    if(!status)return;
    const bar=document.createElement('section');
    bar.className='panel';bar.dataset.unifiedDrivingUi='1';
    bar.innerHTML=`<div style="display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap"><div><b>${moving?'Đang di chuyển':'Trạng thái hành trình'}</b><div class="meta">${moving?'Ưu tiên giao diện lái xe gọn. Các bảng kỹ thuật đã được thu gọn.':'Có thể mở chế độ lái xe hoặc xem chi tiết kỹ thuật.'}</div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="primary" data-open-driving>Chế độ lái xe</button><button type="button" class="pill" data-toggle-details>${detailsOpen?'Ẩn chi tiết':'Xem chi tiết'}</button></div></div>`;
    status.insertAdjacentElement('beforebegin',bar);
    bar.querySelector('[data-open-driving]')?.addEventListener('click',()=>window.openDrivingMode?.());
    bar.querySelector('[data-toggle-details]')?.addEventListener('click',()=>{const next=!detailsOpen;setDetailsOpen(next);for(const p of panels)p.hidden=!next;const b=bar.querySelector('[data-toggle-details]');if(b)b.textContent=next?'Ẩn chi tiết':'Xem chi tiết'});
  }
  window.renderUnifiedDrivingUI=apply;
  const prior=window.renderDiscovery;
  if(typeof prior==='function')window.renderDiscovery=function renderDiscoveryUnified(q=''){prior(q);apply()};
})();
