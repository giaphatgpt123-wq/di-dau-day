(()=>{
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>'\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[ch]));
  let timer=null;
  const finite=v=>Number.isFinite(Number(v));
  const fmtTime=ms=>{const m=Math.floor(Math.max(0,Number(ms)||0)/60000);return `${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}`};
  const dir=p=>p&&finite(p.lat)&&finite(p.lng)?`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${Number(p.lat)},${Number(p.lng)}`)}`:null;
  function row(label,p){
    if(!p)return `<div style="padding:14px 0;border-top:1px solid #ffffff22"><div style="font-size:14px;opacity:.75">${esc(label)}</div><div style="font-size:20px;font-weight:700">Chưa có điểm phù hợp</div></div>`;
    const href=dir(p);
    return `<div style="padding:14px 0;border-top:1px solid #ffffff22"><div style="font-size:14px;opacity:.75">${esc(label)}</div><div style="font-size:21px;font-weight:800">${esc(p.name)}</div><div style="font-size:28px;font-weight:900">${Number(p.driveDistance).toFixed(1)} km</div>${href?`<a href="${href}" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px;padding:12px 16px;border-radius:14px;background:#fff;color:#111;text-decoration:none;font-weight:800">Dẫn đường</a>`:''}</div>`;
  }
  function paint(){
    const box=document.getElementById('drivingModeOverlay');if(!box)return;
    const s=typeof window.getTripStatus==='function'?window.getTripStatus():null;
    const speed=s&&s.speedKmh!=null?`${Math.round(s.speedKmh)}`:'—';
    const heading=s&&s.heading!=null?`${Math.round(s.heading)}°`:'—';
    const alerts=s?.alerts||[];
    box.innerHTML=`<div style="max-width:620px;margin:0 auto;padding:18px 18px 32px"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><div style="font-size:14px;opacity:.7">CHẾ ĐỘ LÁI XE · R-002</div><div style="font-size:20px;font-weight:800">${esc(s?.stage||'Chưa xác định')}</div></div><button onclick="closeDrivingMode()" style="font-size:18px;padding:12px 16px;border:0;border-radius:14px">Thoát</button></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:18px 0"><div style="padding:18px;border-radius:18px;background:#ffffff12;text-align:center"><div style="font-size:13px;opacity:.7">TỐC ĐỘ</div><div style="font-size:64px;line-height:1;font-weight:900">${speed}</div><div style="font-size:18px">km/h</div></div><div style="padding:18px;border-radius:18px;background:#ffffff12;text-align:center"><div style="font-size:13px;opacity:.7">HƯỚNG</div><div style="font-size:48px;line-height:1.2;font-weight:900">${heading}</div><div style="font-size:18px">Đã lái ${fmtTime(s?.drivingElapsed||0)}</div></div></div>${alerts.length?`<div style="padding:14px;border-radius:16px;background:#7a1d1d;margin-bottom:14px"><div style="font-weight:900;font-size:20px">CẢNH BÁO</div><div style="font-size:18px">${alerts.map(esc).join(' · ')}</div></div>`:'<div style="padding:12px;border-radius:14px;background:#ffffff12;margin-bottom:12px">Không có cảnh báo quan trọng đang hoạt động.</div>'}${row('Cây xăng kế tiếp',s?.nextFuel)}${row('Trạm dừng kế tiếp',s?.nextRest)}<div style="margin-top:18px;font-size:13px;opacity:.65">Chỉ hiển thị POI đã đủ điều kiện GPS. Không thao tác màn hình khi đang trực tiếp điều khiển phương tiện.</div></div>`;
  }
  function open(){
    let box=document.getElementById('drivingModeOverlay');
    if(!box){box=document.createElement('div');box.id='drivingModeOverlay';box.setAttribute('role','dialog');box.setAttribute('aria-label','Chế độ lái xe');box.style.cssText='position:fixed;inset:0;z-index:9999;background:#07140f;color:white;overflow:auto;font-family:system-ui,-apple-system,sans-serif';document.body.appendChild(box)}
    document.body.style.overflow='hidden';paint();clearInterval(timer);timer=setInterval(paint,2000);
  }
  function close(){clearInterval(timer);timer=null;document.getElementById('drivingModeOverlay')?.remove();document.body.style.overflow=''}
  function addButton(){if(view!=='discovery')return;const main=document.getElementById('main');if(!main||main.querySelector('[data-driving-mode-launch]'))return;const b=document.createElement('button');b.type='button';b.className='primary';b.dataset.drivingModeLaunch='1';b.textContent='Chế độ lái xe';b.onclick=open;const status=main.querySelector('[data-trip-status]');if(status)status.insertAdjacentElement('afterbegin',b);else main.prepend(b)}
  window.openDrivingMode=open;window.closeDrivingMode=close;window.renderDrivingModeLauncher=addButton;
  const prior=window.renderDiscovery;if(typeof prior==='function')window.renderDiscovery=function renderDiscoveryWithDrivingMode(q=''){prior(q);addButton()};
  window.addEventListener('pagehide',close);
})();
