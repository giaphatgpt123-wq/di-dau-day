(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const services=()=>window.DiDauServices||null;
  const domain=()=>window.DiDauRouteGeometry||null;
  const esc=v=>String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const stateClass=s=>s==='ACTIVE_TRACE'||s==='APPROVED_GEOMETRY'||s==='ACTIVE'?'good':/BLOCKED|PENDING|DRAFT/.test(String(s||''))?'warn':'';
  const routeId=()=>services()?.RouteStore?.getSelectedId?.()||(typeof currentRouteId!=='undefined'?currentRouteId:null);
  const routeList=()=>typeof routeData!=='undefined'&&Array.isArray(routeData?.routes)?routeData.routes:[];
  const selectedRoute=()=>domain()?.RouteDomain?.byId(routeId())||routeList()[0]||null;
  const session=()=>services()?.AccountStore?.session?.()||(typeof window.session==='function'?window.session():null);
  const pois=()=>services()?.PoiStore?.all?.()||(typeof window.pois==='function'?window.pois():[]);
  const audit=()=>services()?.AuditStore?.all?.()||(typeof window.auditLog==='function'?window.auditLog():[]);
  const traceSessionValue=()=>typeof traceSession!=='undefined'?traceSession:null;

  function metrics(){
    const d=domain(),summary=typeof routeData!=='undefined'?(routeData.summary||{}):{},g=d?.GeometryDomain?.counts?.()||{approved:0},q=d?.RouteDomain?.qa?.()||{active:0,eligible:0,qa010:'BLOCKED'};
    return `<div class="metrics"><div class="metric"><b>${summary.corridors??'—'}</b><small>HÀNH LANG</small></div><div class="metric"><b>${summary.segments??'—'}</b><small>ĐOẠN</small></div><div class="metric"><b>${g.approved??0}/53</b><small>GEOMETRY DUYỆT</small></div><div class="metric"><b>${q.active??0}/${q.eligible??0}</b><small>TRACE ACTIVE</small></div><div class="metric"><b>${pois().length}</b><small>ĐIỂM THƯ VIỆN</small></div><div class="metric"><b>${q.qa010||'BLOCKED'}</b><small>ROUTE ENGINE</small></div></div>`;
  }

  function updateHero(){
    const r=selectedRoute();if(!r)return;
    const rs=domain()?.RouteDomain?.state?.(r)||{state:'DRAFT'};
    const title=$('routeTitle'),info=$('routeInfo');
    if(title)title.textContent=`${r.id} · ${r.name}`;
    if(info)info.textContent=`${r.group||''} · ${(r.segments||[]).length} đoạn · ${rs.state}`;
  }

  function renderRoutes(q=''){
    const d=domain(),needle=String(q||'').toLowerCase(),list=routeList().filter(r=>!needle||JSON.stringify(r).toLowerCase().includes(needle)),activeId=routeId(),trace=traceSessionValue();
    $('main').innerHTML=`${trace&&typeof window.traceBanner==='function'?window.traceBanner():''}<h2>Mạng tuyến PDH Travel</h2>${metrics()}<div class="notice"><b>Core Engine v3:</b> cạnh chỉ ACTIVE khi segment có <b>APPROVED_TRACE</b>. Geometry nút chỉ xác nhận topology; không được coi là lộ trình thực.</div><div class="grid">${list.map(r=>{const rs=d?.RouteDomain?.state?.(r)||{state:'DRAFT',active:0,eligible:0};return `<article class="panel route ${r.id===activeId?'selected':''}" data-route-select="${esc(r.id)}"><span class="tag">${esc(r.id)}</span><span class="tag ${stateClass(rs.state)}">${esc(rs.state)}</span><h3>${esc(r.name)}</h3><div class="meta">${esc(r.primary||'')}<br>${rs.active}/${rs.eligible} đoạn có trace duyệt</div>${(r.segments||[]).map(s=>{const es=d?.RouteDomain?.edgeState?.(s)||{state:'PENDING_GEOMETRY',reason:'Thiếu geometry'},blocked=d?.RouteDomain?.segmentBlocked?.(s);const t=d?.GeometryDomain?.traceFor?.(s.id);return `<div class="seg"><div class="seghead"><b>${esc(s.id)} · ${esc(s.from)} → ${esc(s.to)}</b><span class="tag ${stateClass(es.state)}">${esc(es.state)}</span></div><div class="meta">${esc(s.road||'')} · ${esc(es.reason||'')}</div><div class="actions">${!blocked?`<button data-start-trace="${esc(r.id)}|${esc(s.id)}">▶ Ghi vệt</button>`:''}${session()?.role==='admin'&&t?.status==='FIELD_TRACE'?`<button data-approve-trace="${esc(s.id)}">✓ Duyệt trace</button>`:''}</div></div>`}).join('')}</article>`}).join('')}</div>`;
    $('main').querySelectorAll('[data-route-select]').forEach(el=>el.onclick=()=>UiShell.selectRoute(el.dataset.routeSelect));
    $('main').querySelectorAll('[data-start-trace]').forEach(el=>el.onclick=e=>{e.stopPropagation();const [r,s]=el.dataset.startTrace.split('|');window.startTrace?.(r,s)});
    $('main').querySelectorAll('[data-approve-trace]').forEach(el=>el.onclick=e=>{e.stopPropagation();window.approveTrace?.(el.dataset.approveTrace)});
  }

  function renderGeometry(q=''){
    const d=domain(),needle=String(q||'').toLowerCase(),list=(d?.GeometryDomain?.mergedNodes?.()||[]).filter(n=>!needle||`${n.id} ${n.name} ${n.status}`.toLowerCase().includes(needle)),admin=session()?.role==='admin',trace=traceSessionValue();
    $('main').innerHTML=`${trace&&typeof window.traceBanner==='function'?window.traceBanner():''}<h2>Geometry nút PDH <small>(${list.length}/53)</small></h2>${metrics()}<div class="notice">Bật GPS → tới đúng nút → Ghi GPS nút → Admin duyệt. Sai số >80 m không được ghi. Map-matching chỉ ưu tiên trace/nút đã duyệt.</div><div class="grid">${list.map(n=>`<div class="panel"><span class="tag">${esc(n.id)}</span><span class="tag ${stateClass(n.status)}">${esc(n.status)}</span><h3>${esc(n.name)}</h3><div class="meta">${Number.isFinite(n.lat)?`${Number(n.lat).toFixed(6)}, ${Number(n.lng).toFixed(6)} · ±${esc(n.accuracy||'—')} m`:'Chưa có tọa độ'}</div><div class="actions"><button class="primary" data-capture-node="${esc(n.id)}">⌖ Ghi GPS nút</button>${admin&&n.status==='FIELD_CAPTURED'?`<button data-approve-node="${esc(n.id)}">✓ Duyệt</button>`:''}${admin&&n.status!=='PENDING_COORDINATE'?`<button data-reset-node="${esc(n.id)}">Xóa</button>`:''}</div></div>`).join('')}</div>`;
    $('main').querySelectorAll('[data-capture-node]').forEach(el=>el.onclick=()=>window.captureNode?.(el.dataset.captureNode));
    $('main').querySelectorAll('[data-approve-node]').forEach(el=>el.onclick=()=>window.approveNode?.(el.dataset.approveNode));
    $('main').querySelectorAll('[data-reset-node]').forEach(el=>el.onclick=()=>window.resetNode?.(el.dataset.resetNode));
  }

  function renderLibrary(q=''){
    const needle=String(q||'').toLowerCase(),list=pois().filter(p=>!needle||JSON.stringify(p).toLowerCase().includes(needle)),r=selectedRoute();
    $('main').innerHTML=`<h2>Thư viện PDH</h2>${metrics()}<div class="actions"><button class="primary" data-add-poi>+ Thêm địa điểm</button><button data-share-import>Nhận link Google Maps</button></div><div class="notice">Tuyến đang chọn: <b>${esc(r?.id||'—')} · ${esc(r?.name||'Chưa chọn')}</b>. Điểm thủ công chỉ có tích xanh khi người nhập xác nhận tại chỗ.</div><div class="grid">${list.length?list.map(p=>`<div class="panel"><span class="tag">${esc(p.category||'Khác')}</span>${p.verified?'<span class="tag good">✓ Đã xác nhận</span>':'<span class="tag warn">Chưa xác minh</span>'}<h3>${esc(p.name)}</h3><div class="meta">${esc(p.subcategory||'')}<br>${Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng))?`${Number(p.lat).toFixed(6)}, ${Number(p.lng).toFixed(6)}`:'Chưa có tọa độ'}<br>Tuyến: ${esc(p.routeId||'—')}</div><p>${esc(p.note||'')}</p>${p.image?`<img src="${esc(p.image)}" alt="" style="max-width:100%;border-radius:10px">`:''}</div>`).join(''):'<div class="panel">Chưa có địa điểm người dùng.</div>'}</div>`;
    $('main').querySelector('[data-add-poi]')?.addEventListener('click',()=>window.openPoiForm?.());
    $('main').querySelector('[data-share-import]')?.addEventListener('click',()=>window.openShareImport?.());
  }

  function renderAdmin(){
    const s=session();if(!s||s.role!=='admin'){$('main').innerHTML='<div class="panel"><h2>Admin</h2><p>Chưa đăng nhập Admin.</p><button class="pill" data-open-account>Đăng nhập / tạo Admin</button></div>';$('main').querySelector('[data-open-account]')?.addEventListener('click',()=>window.openAccount?.());return}
    const d=domain(),q=d?.RouteDomain?.qa?.()||{},g=d?.GeometryDomain?.counts?.()||{},a=audit();
    $('main').innerHTML=`<h2>Admin · Release & Data Gate</h2>${metrics()}<div class="panel"><div class="qa"><b>QA-005 · Geometry 53 nút</b><span class="tag ${q.qa005==='PASS'?'good':'warn'}">${esc(q.qa005||'BLOCKED')}</span></div><div class="qa"><b>QA-010 · Route engine liên tục</b><span class="tag ${q.qa010==='PASS'?'good':'warn'}">${esc(q.qa010||'BLOCKED')}</span></div><p class="meta">Approved geometry ${g.approved||0}/53 · Approved trace ${q.active||0}/${q.eligible||0}. Chỉ khi đủ dữ liệu thực mới PASS.</p><div class="actions"><button data-export-backup>Xuất backup JSON</button><button data-import-backup>Nhập backup</button><input id="importFileV3" class="hidden" type="file" accept="application/json"><button class="danger" data-clear-audit>Xóa audit</button></div></div><div class="panel"><h3>Audit log</h3>${a.slice(0,80).map(x=>`<div class="audit"><b>${esc(x.action)}</b> · ${esc(x.target)}<br>${new Date(x.at).toLocaleString('vi-VN')} · ${esc(x.actor)}</div>`).join('')||'<div class="meta">Chưa có audit.</div>'}</div>`;
    $('main').querySelector('[data-export-backup]')?.addEventListener('click',()=>window.exportBackup?.());
    $('main').querySelector('[data-import-backup]')?.addEventListener('click',()=>$('importFileV3')?.click());
    $('importFileV3')?.addEventListener('change',e=>window.importBackup?.(e.target.files?.[0]));
    $('main').querySelector('[data-clear-audit]')?.addEventListener('click',()=>{if(services()?.AuditStore?.clear)services().AuditStore.clear();else window.clearAudit?.();UiShell.render()});
  }

  function render(){
    const q=String($('search')?.value||'').toLowerCase().trim(),v=UiShell.getView();
    document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
    document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===v));
    if(v==='discovery'&&typeof window.renderDiscovery==='function')window.renderDiscovery(q);else if(v==='routes')renderRoutes(q);else if(v==='geometry')renderGeometry(q);else if(v==='library')renderLibrary(q);else renderAdmin();
    updateHero();
  }

  const UiShell={
    version:'3.3.0-rc2',
    getView(){try{return typeof view!=='undefined'?view:(services()?.JsonStore?.text?.('d1-view','routes')||'routes')}catch{return services()?.JsonStore?.text?.('d1-view','routes')||'routes'}},
    setView(next){try{view=next}catch{}services()?.JsonStore?.setText?.('d1-view',next);this.render();return next},
    selectRoute(id,source='manual'){services()?.RouteStore?.setSelectedId?.(id,source);try{currentRouteId=id}catch{}updateHero();this.render();return id},
    metrics,updateHero,renderRoutes,renderGeometry,renderLibrary,renderAdmin,render
  };
  window.DiDauUiShell=UiShell;
  window.render=render;window.renderRoutes=renderRoutes;window.renderGeometry=renderGeometry;window.renderLibrary=renderLibrary;window.renderAdmin=renderAdmin;window.updateHero=updateHero;window.selectRoute=(id,source)=>UiShell.selectRoute(id,source);
})();
