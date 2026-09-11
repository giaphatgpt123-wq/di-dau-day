(()=>{
  const $=id=>document.getElementById(id);
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  async function run(){
    const box=$('installDiag');
    if(!box)return;
    const secure=location.protocol==='https:'||['localhost','127.0.0.1'].includes(location.hostname);
    const swSupported='serviceWorker' in navigator;
    let swControlled=!!navigator.serviceWorker?.controller;
    let swRegistered=false;
    if(swSupported){
      try{const regs=await navigator.serviceWorker.getRegistrations();swRegistered=regs.length>0;swControlled=!!navigator.serviceWorker.controller}catch{}
    }
    let manifestOk=false;
    try{const r=await fetch('manifest.webmanifest',{cache:'no-store'});if(r.ok){const m=await r.json();manifestOk=!!(m.name&&m.start_url&&m.display&&Array.isArray(m.icons)&&m.icons.some(i=>i.sizes==='192x192')&&m.icons.some(i=>i.sizes==='512x512'))}}catch{}
    const installed=standalone();
    const parts=[
      `${secure?'✓':'✕'} HTTPS`,
      `${manifestOk?'✓':'✕'} Manifest`,
      `${swRegistered?'✓':'✕'} SW đăng ký`,
      `${swControlled?'✓':'○'} SW điều khiển`,
      `${installed?'✓ Đã cài':'○ Chưa standalone'}`
    ];
    box.textContent='Kiểm tra cài đặt: '+parts.join(' · ');
    box.dataset.ready=String(secure&&manifestOk&&swRegistered);
  }
  addEventListener('load',()=>setTimeout(run,700));
  addEventListener('appinstalled',run);
  navigator.serviceWorker?.addEventListener('controllerchange',run);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')run()});
  window.runInstallDiagnostics=run;
})();
