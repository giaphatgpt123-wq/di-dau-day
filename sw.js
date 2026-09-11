const CACHE_VERSION='a1-rc4-gh1-shell-v1';
const RUNTIME_CACHE='a1-rc4-gh1-runtime-v1';
const APP_SHELL=['./','./index.html','./manifest.webmanifest','./install-qr.png','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE_VERSION).then(c=>c.addAll(APP_SHELL))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_VERSION&&k!==RUNTIME_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(r.mode==='navigate'){e.respondWith(fetch(r).then(x=>{let y=x.clone();caches.open(RUNTIME_CACHE).then(c=>c.put(r,y));return x}).catch(()=>caches.match(r).then(x=>x||caches.match('./index.html'))));return}if(u.origin===location.origin&&/\.(png|jpg|jpeg|webp|svg)$/i.test(u.pathname)){e.respondWith(caches.match(r).then(x=>{let n=fetch(r).then(v=>{let y=v.clone();caches.open(RUNTIME_CACHE).then(c=>c.put(r,y));return v}).catch(()=>x);return x||n}));return}e.respondWith(fetch(r).then(x=>{let y=x.clone();caches.open(RUNTIME_CACHE).then(c=>c.put(r,y));return x}).catch(()=>caches.match(r)))})
