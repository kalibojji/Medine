const V='medine-1793034359';
const CORE=["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.allSettled(CORE.map(u=>c.add(u)))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V&&x!=='fonts-v1').map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||!/^https?:/.test(r.url))return;
  if(/^fonts\.(googleapis|gstatic)\.com$/.test(new URL(r.url).hostname)){e.respondWith(caches.open('fonts-v1').then(c=>c.match(r).then(h=>h||fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());return res}))));return}
  if(new URL(r.url).origin!==self.location.origin)return;
  e.respondWith(caches.match(r).then(h=>{
    const n=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res}).catch(()=>h);
    return h||n;
  }));
});
