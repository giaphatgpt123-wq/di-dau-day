(()=>{
  'use strict';

  const esc=value=>String(value??'').replace(/[&<>'"]/g,ch=>({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  }[ch]));
  const finite=n=>Number.isFinite(Number(n));
  const mapsDestination=p=>finite(p.lat)&&finite(p.lng)
    ? `${Number(p.lat)},${Number(p.lng)}`
    : (p.name||'');
  const directionsUrl=p=>`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsDestination(p))}`;
  const mapUrl=p=>`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsDestination(p))}`;

  // GPS persistence: remember that the user enabled tracking and resume it on reload/reopen.
  const originalStartGPS=window.startGPS;
  window.startGPS=function startGPSPersistent(){
    localStorage.setItem('d1-gps-tracking','1');
    if(!navigator.geolocation){
      alert('Thiết bị không hỗ trợ Geolocation.');
      return;
    }
    if(watchId!==null) navigator.geolocation.clearWatch(watchId);
    gpsActive=true;
    document.getElementById('gpsBtn')?.classList.add('on');
    const status=document.getElementById('gpsStatus');
    if(status) status.textContent='GPS: đang lấy vị trí…';
    navigator.geolocation.getCurrentPosition(
      onPosition,
      onErr,
      {enableHighAccuracy:true,timeout:12000,maximumAge:30000}
    );
    watchId=navigator.geolocation.watchPosition(
      onPosition,
      onErr,
      {enableHighAccuracy:true,timeout:25000,maximumAge:5000}
    );
    navigator.vibrate?.(25);
  };

  const gpsButton=document.getElementById('gpsBtn');
  if(gpsButton) gpsButton.onclick=window.startGPS;

  const resumeGPS=()=>{
    if(localStorage.getItem('d1-gps-tracking')==='1' && watchId===null && navigator.geolocation){
      window.startGPS();
    }
  };
  addEventListener('pageshow',()=>setTimeout(resumeGPS,150));
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible') resumeGPS();
  });
  setTimeout(resumeGPS,500);

  // Library: add practical map/navigation actions to every saved POI.
  window.renderLibrary=function renderLibraryRC2(q=''){
    const list=pois().filter(p=>!q||JSON.stringify(p).toLowerCase().includes(q));
    const r=routeById(currentRouteId);
    const cards=list.length?list.map(p=>{
      const coord=finite(p.lat)&&finite(p.lng)
        ? `${Number(p.lat).toFixed(6)}, ${Number(p.lng).toFixed(6)}`
        : 'Chưa có tọa độ';
      return `<div class="panel">
        <span class="tag">${esc(p.category)}</span>
        ${p.verified?'<span class="tag good">✓ Đã xác nhận</span>':'<span class="tag warn">Chưa xác minh</span>'}
        <h3>${esc(p.name)}</h3>
        <div class="meta">${esc(p.subcategory||'')}<br>${coord}<br>Tuyến: ${esc(p.routeId||'—')}</div>
        <p>${esc(p.note||'')}</p>
        ${p.image?`<img src="${esc(p.image)}" alt="Ảnh ${esc(p.name)}" style="max-width:100%;border-radius:10px">`:''}
        <div class="actions">
          <a class="pill primary" href="${directionsUrl(p)}" target="_blank" rel="noopener">Dẫn đường</a>
          <a class="pill" href="${mapUrl(p)}" target="_blank" rel="noopener">Mở bản đồ</a>
        </div>
      </div>`;
    }).join(''):'<div class="panel">Chưa có địa điểm người dùng. Dữ liệu tuyến PDH vẫn hoạt động độc lập.</div>';

    document.getElementById('main').innerHTML=`
      <h2>Thư viện PDH</h2>${metrics()}
      <div class="actions">
        <button class="primary" onclick="openPoiForm()">+ Thêm địa điểm</button>
        <button onclick="openShareImport()">Nhận link Google Maps</button>
      </div>
      <div class="notice">Tuyến đang chọn: <b>${esc(r?.id||'—')} · ${esc(r?.name||'')}</b>. Điểm thủ công chỉ có tích xanh khi người nhập xác nhận tại chỗ.</div>
      <div class="grid">${cards}</div>`;
  };

  // Account UI: keep the existing local-auth model but make role/state clear and allow password reveal.
  window.togglePasswordVisibility=()=>{
    const input=document.getElementById('pass');
    if(!input) return;
    input.type=input.type==='password'?'text':'password';
  };

  window.openAccount=function openAccountRC2(){
    const s=session();
    document.getElementById('modal').innerHTML=`<div class="modalbg" onclick="if(event.target===this)closeModal()"><div class="modal">
      <h2>Tài khoản</h2>
      ${s?`
        <p><b>${esc(s.email)}</b> · <span class="tag ${s.role==='admin'?'good':''}">${esc(s.role)}</span></p>
        <div class="actions">
          ${s.role==='admin'?'<button class="primary" onclick="view=\'admin\';closeModal();render()">Mở quản trị</button>':''}
          <button onclick="view='library';closeModal();render()">Giao diện người dùng</button>
          <button onclick="logout()">Đăng xuất</button>
        </div>`:`
        <input id="email" type="email" autocomplete="username" placeholder="Email">
        <input id="pass" type="password" autocomplete="current-password" placeholder="Mật khẩu">
        <label class="meta"><input type="checkbox" style="width:auto" onchange="togglePasswordVisibility()"> Hiện mật khẩu</label>
        <div class="actions">
          <button class="primary" onclick="login()">Đăng nhập</button>
          <button onclick="createUser()">Tạo User</button>
          <button onclick="createAdmin()">Tạo Admin đầu tiên</button>
        </div>`}
      <p class="meta">Tài khoản RC2 hiện lưu cục bộ trên thiết bị. Chưa phải xác thực máy chủ đa thiết bị.</p>
    </div></div>`;
  };
  const accountButton=document.getElementById('accountBtn');
  if(accountButton) accountButton.onclick=window.openAccount;

  // Admin creates a user without losing the current Admin session.
  window.adminCreateUser=async()=>{
    if(session()?.role!=='admin') return alert('Cần quyền Admin.');
    const email=document.getElementById('adminNewEmail')?.value.trim().toLowerCase();
    const pass=document.getElementById('adminNewPass')?.value||'';
    if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || pass.length<6){
      return alert('Email hợp lệ và mật khẩu tối thiểu 6 ký tự.');
    }
    const list=users();
    if(list.some(u=>u.email===email)) return alert('Email đã tồn tại.');
    list.push({email,passHash:await hash(pass),role:'user',createdBy:session().email,createdAt:Date.now()});
    setUsers(list);
    audit('USER_CREATED_BY_ADMIN',email,{role:'user'});
    render();
  };

  const originalRenderAdmin=window.renderAdmin;
  window.renderAdmin=function renderAdminRC2(){
    originalRenderAdmin();
    if(session()?.role!=='admin') return;
    const main=document.getElementById('main');
    const list=users();
    main.insertAdjacentHTML('beforeend',`<div class="panel">
      <h3>Quản lý tài khoản cục bộ</h3>
      <p class="meta">Admin hiện tại: ${esc(session().email)}. Tạo User không làm thay đổi phiên Admin đang đăng nhập.</p>
      <input id="adminNewEmail" type="email" autocomplete="off" placeholder="Email User mới">
      <input id="adminNewPass" type="password" autocomplete="new-password" placeholder="Mật khẩu ban đầu (≥6 ký tự)">
      <div class="actions"><button class="primary" onclick="adminCreateUser()">+ Tạo User</button></div>
      <div style="margin-top:12px">${list.map(u=>`<div class="audit"><b>${esc(u.email)}</b> · ${esc(u.role)}</div>`).join('')||'<div class="meta">Chưa có tài khoản.</div>'}</div>
    </div>`);
  };

  // Refresh account label after login/logout/render cycles.
  const updateAccountLabel=()=>{
    const s=session();
    const b=document.getElementById('accountBtn');
    if(b) b.textContent=s?(s.role==='admin'?'Admin':'User'):'Tài khoản';
  };
  const originalRender=window.render;
  window.render=function renderRC2(){
    originalRender();
    updateAccountLabel();
  };
  updateAccountLabel();
})();
