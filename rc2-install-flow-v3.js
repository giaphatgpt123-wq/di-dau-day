(()=>{
'use strict';
const VERSION='3.4.0-rc2';
let deferredPrompt=null;
const $=id=>document.getElementById(id);
const ua=()=>navigator.userAgent||'';
const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIOS=()=>/iPad|iPhone|iPod/i.test(ua());
const isAndroid=()=>/Android/i.test(ua());
const isSafari=()=>/Safari/i.test(ua())&&!/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua());
const secure=()=>window.isSecureContext||location.hostname==='localhost';
function instructions(){
  if(!secure())return 'Cài PWA yêu cầu HTTPS. Hãy mở ứng dụng từ địa chỉ GitHub Pages chính thức.';
  if(isIOS())return isSafari()?'Safari → nút Chia sẻ → Thêm vào Màn hình chính → Thêm.':'Trên iPhone/iPad, mở trang này bằng Safari → Chia sẻ → Thêm vào Màn hình chính.';
  if(isAndroid())return 'Chrome/Edge → menu ⋮ → Cài ứng dụng hoặc Thêm vào màn hình chính → xác nhận Cài.';
  return 'Chrome/Edge → menu trình duyệt → Cài ứng dụng / Install app.';
}
function render(){
  const box=$('installBox'),msg=$('installMsg'),btn=$('installBtn');
  if(!box||!btn)return;
  if(isStandalone()){
    box.classList.add('hidden');
    document.documentElement.dataset.installState='installed';
    return;
  }
  box.classList.remove('hidden');
  document.documentElement.dataset.installState=deferredPrompt?'ready':'manual';
  if(msg)msg.textContent=deferredPrompt?'Sẵn sàng cài trực tiếp. Sau khi cài, ứng dụng mở như app độc lập và hỗ trợ offline.':instructions();
  btn.textContent=deferredPrompt?'Cài ngay':'Hướng dẫn cài';
  btn.disabled=false;
}
function showGuide(){
  const modal=$('modal');
  const text=instructions();
  if(!modal){alert(text);return;}
  modal.innerHTML=`<div class="modalbg" onclick="if(event.target===this)this.innerHTML=''"><div class="modal"><h2>Cài Đi Đâu Đây</h2><p>${text}</p><p class="meta">Không cần APK hoặc khóa ký Android khi cài theo PWA. Dữ liệu ứng dụng và GPS vẫn hoạt động theo quyền của trình duyệt.</p><div class="actions"><button class="primary" id="installGuideClose" type="button">Đã hiểu</button></div></div></div>`;
  $('installGuideClose')?.addEventListener('click',()=>{modal.innerHTML=''});
}
async function install(){
  if(isStandalone()){render();return {outcome:'installed'};}
  if(!deferredPrompt){showGuide();return {outcome:'manual'};}
  const prompt=deferredPrompt;
  deferredPrompt=null;
  prompt.prompt();
  const choice=await prompt.userChoice.catch(()=>({outcome:'dismissed'}));
  render();
  return choice;
}
addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  deferredPrompt=event;
  render();
});
addEventListener('appinstalled',()=>{
  deferredPrompt=null;
  render();
  try{window.DiDauServices?.AuditStore?.append?.('APP_INSTALLED','PWA',{version:VERSION})}catch{}
});
addEventListener('DOMContentLoaded',()=>{
  const btn=$('installBtn');
  if(btn)btn.onclick=install;
  render();
});
if(document.readyState!=='loading'){
  const btn=$('installBtn');
  if(btn)btn.onclick=install;
  render();
}
window.DiDauInstall={version:VERSION,install,render,instructions,isStandalone};
})();
