(()=>{
  'use strict';
  function boot(){
    const ui=window.DiDauUiShell;if(!ui)return;
    const search=document.getElementById('search');if(search)search.oninput=()=>ui.render();
    document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>ui.setView(b.dataset.view));
    document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{if(b.dataset.nav==='account')window.openAccount?.();else ui.setView(b.dataset.nav)});
    const account=document.getElementById('accountBtn');if(account)account.onclick=()=>window.openAccount?.();
    ui.render();
    document.documentElement.dataset.bootstrap='core-v3';
  }
  const Bootstrap={version:'3.3.0-rc2',boot};
  window.DiDauBootstrap=Bootstrap;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0),{once:true});else setTimeout(boot,0);
})();
