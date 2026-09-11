const CACHE_VERSION='d1-rc1.3-shell-v1';
const RUNTIME_CACHE='d1-rc1.3-runtime-v1';
const APP_SHELL=['./','./index.html','./manifest.webmanifest','./data/routes-pdh.json','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE_VERSION).then(c=>c.addAll(APP_SHELL))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_VERSION&&k!==RUNTIME_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(r.mode==='navigate'){e.respondWith(fetch(r).then(x=>{let y=x.clone();caches.open(RUNTIME_CACHE).then(c=>c.put(r,y));return x}).catch(()=>caches.match('./index.html')));return}if(u.origin===location.origin){e.respondWith(caches.match(r).then(cached=>{const net=fetch(r).then(x=>{let y=x.clone();caches.open(RUNTIME_CACHE).then(c=>c.put(r,y));return x}).catch(()=>cached);return cached||net}))}});