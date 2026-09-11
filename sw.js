const CACHE_VERSION='d1-rc1.1-shell-v4';
const RUNTIME_CACHE='d1-rc1.1-runtime-v4';
const APP_SHELL=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-192.png','./icons/icon-maskable-512.png','./icons/apple-touch-icon.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_VERSION).then(cache=>cache.addAll(APP_SHELL)));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE_VERSION&&k!==RUNTIME_CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('message',event=>{
  if(event.data && event.data.type==='SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);

  if(req.mode==='navigate'){
    event.respondWith(
      fetch(req).then(resp=>{
        const copy=resp.clone();
        caches.open(RUNTIME_CACHE).then(c=>c.put(req,copy));
        return resp;
      }).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))
    );
    return;
  }

  if(url.origin===location.origin && /\.(png|jpg|jpeg|webp|svg)$/i.test(url.pathname)){
    event.respondWith(
      caches.match(req).then(cached=>{
        const network=fetch(req).then(resp=>{
          const copy=resp.clone();
          caches.open(RUNTIME_CACHE).then(c=>c.put(req,copy));
          return resp;
        }).catch(()=>cached);
        return cached || network;
      })
    );
    return;
  }

  event.respondWith(
    fetch(req).then(resp=>{
      const copy=resp.clone();
      caches.open(RUNTIME_CACHE).then(c=>c.put(req,copy));
      return resp;
    }).catch(()=>caches.match(req))
  );
});