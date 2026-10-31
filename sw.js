const V='medine-1793437708';
const CORE=["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.allSettled(CORE.map(u=>c.add(new Request(u,{cache:'reload'}))))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{const P=V.split('-')[0]+'-';e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.indexOf(P)===0&&x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||!/^https?:/.test(r.url))return;const u=new URL(r.url);
 if(/^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){e.respondWith(caches.open('fonts-v1').then(c=>c.match(r).then(h=>h||fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());return res}))));return}
 if(u.origin!==self.location.origin)return;
 const nav=r.mode==='navigate'||/\/$|\.html$/.test(u.pathname)||/sw\.js$|manifest\.json$/.test(u.pathname);
 if(nav){e.respondWith(fetch(r,{cache:'no-store'}).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res}).catch(()=>caches.open(V).then(c=>c.match(r).then(h=>h||c.match('index.html')))));return}
 e.respondWith(caches.open(V).then(c=>c.match(r).then(h=>{const n=fetch(r).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res}).catch(()=>h);return h||n})));
});
