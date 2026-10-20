// To Get Her service worker. The version changes whenever the game changes, so updates install automatically.
const VERSION='tgh-0006';
const CORE=['./','./index.html','./manifest.webmanifest','./style.css','./three.min.js','./data.js','./help.js','./story.js','./util.js','./rules.js','./chars.js','./art.js','./game.js','./sound.js','./ui.js','./screens.js','./main.js','./icon-192.png','./icon-512.png','./maskable-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION&&k!=='tgh-fonts').map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.open('tgh-fonts').then(async c=>{const hit=await c.match(req);const net=fetch(req).then(r=>{if(r.ok||r.type==='opaque')c.put(req,r.clone());return r}).catch(()=>hit);return hit||net}));return}
  if(url.origin!==location.origin)return;
  // network first so updates arrive, saved copy when offline
  e.respondWith(fetch(req).then(r=>{const cp=r.clone();caches.open(VERSION).then(c=>c.put(req,cp));return r}).catch(()=>caches.match(req).then(h=>h||caches.match('./index.html'))));
});
