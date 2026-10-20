/* To Get Her: helpers. Seeded random numbers, hex-grid math, path finding, line of sight and the map generator.
   Hexes are pointy-top, in odd-row offset coordinates {c,r}. Row 0 is the top of the map (the boss), the last row is home. */
(function(){
'use strict';
const TGH=window.TGH=window.TGH||{};

/* ---------- random ---------- */
TGH.rng=function(seed){let s=(seed>>>0)||1;return function(){s=Math.imul(s^(s>>>15),s|1);s^=s+Math.imul(s^(s>>>7),s|61);return((s^(s>>>14))>>>0)/4294967295}};
const R={r:Math.random};
TGH.setRng=f=>{R.r=f||Math.random};
const rnd=TGH.rnd=()=>R.r();
TGH.ri=(a,b)=>a+Math.floor(rnd()*(b-a+1));
TGH.rand=(a,b)=>a+rnd()*(b-a);
TGH.pick=a=>a[Math.floor(rnd()*a.length)];
TGH.chance=p=>rnd()<p;
TGH.clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
TGH.weighted=o=>{const e=Object.entries(o),t=e.reduce((a,[,w])=>a+w,0);let x=rnd()*t;for(const [k,w] of e){x-=w;if(x<=0)return k}return e[e.length-1][0]};
TGH.uid=()=>Math.random().toString(36).slice(2,9);
TGH.shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

/* ---------- hex math ---------- */
const DIRS=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]]; // axial
const toAx=(c,r)=>({q:c-((r-(r&1))>>1),r});
const toOff=(q,r)=>({c:q+((r-(r&1))>>1),r});
TGH.toAx=toAx;TGH.toOff=toOff;
TGH.dist=(a,b)=>{const A=toAx(a.c,a.r),B=toAx(b.c,b.r),dq=A.q-B.q,dr=A.r-B.r;return Math.max(Math.abs(dq),Math.abs(dr),Math.abs(dq+dr))};
TGH.neighbors=(c,r,W,H)=>{const a=toAx(c,r),out=[];for(const [dq,dr] of DIRS){const o=toOff(a.q+dq,a.r+dr);if(o.c>=0&&o.c<W&&o.r>=0&&o.r<H)out.push(o)}return out};
// Every hex within n steps of (c,r), ignoring terrain.
TGH.ring=(c,r,n,W,H)=>{const a=toAx(c,r),out=[];for(let dq=-n;dq<=n;dq++)for(let dr=Math.max(-n,-dq-n);dr<=Math.min(n,-dq+n);dr++){const o=toOff(a.q+dq,a.r+dr);if(o.c>=0&&o.c<W&&o.r>=0&&o.r<H)out.push(o)}return out};
// World position of a hex's centre (hex size 1: centre to corner).
TGH.hexPos=(c,r)=>({x:Math.sqrt(3)*(c+.5*(r&1)),z:1.5*r});
TGH.posHex=(x,z,W,H)=>{ // nearest hex to a world point
  const q=(Math.sqrt(3)/3*x-1/3*z),rr=2/3*z;let cx=q,cz=rr,cy=-cx-cz;
  let rx=Math.round(cx),ry=Math.round(cy),rz=Math.round(cz);
  const dx=Math.abs(rx-cx),dy=Math.abs(ry-cy),dz=Math.abs(rz-cz);
  if(dx>dy&&dx>dz)rx=-ry-rz;else if(dy>dz)ry=-rx-rz;else rz=-rx-ry;
  const o=toOff(rx,rz);return(o.c>=0&&o.c<W&&o.r>=0&&o.r<H)?o:null};
TGH.key=(c,r,W)=>r*W+c;

/* ---------- terrain rules ---------- */
// What stops movement and what stops sight.
TGH.BLOCKS_MOVE=new Set(['boulder','mountain','tree','water','lava','void']);
TGH.BLOCKS_SIGHT=new Set(['mountain','tree']);

/* ---------- path finding ---------- */
// Uniform-cost search from a hex. passable(c,r) says whether a hex can be entered. Returns {dist, prev} keyed by index.
TGH.search=function(map,from,passable,maxCost){
  const W=map.w,H=map.h,dist=new Map(),prev=new Map(),k0=from.r*W+from.c;
  dist.set(k0,0);let frontier=[from];
  while(frontier.length){
    const next=[];
    for(const cur of frontier){
      const d=dist.get(cur.r*W+cur.c);if(d>=maxCost)continue;
      for(const n of TGH.neighbors(cur.c,cur.r,W,H)){
        const k=n.r*W+n.c;if(dist.has(k))continue;
        if(!passable(n.c,n.r))continue;
        dist.set(k,d+1);prev.set(k,cur.r*W+cur.c);next.push(n);
      }
    }
    frontier=next;
  }
  return {dist,prev};
};
TGH.pathTo=function(map,res,to){
  const W=map.w,k=to.r*W+to.c;if(!res.dist.has(k))return null;
  const out=[];let cur=k;while(res.prev.has(cur)){out.push({c:cur%W,r:Math.floor(cur/W)});cur=res.prev.get(cur)}
  return out.reverse();
};

/* ---------- line of sight ---------- */
TGH.los=function(map,a,b){
  const A=toAx(a.c,a.r),B=toAx(b.c,b.r),n=TGH.dist(a,b);if(n<=1)return true;
  const ax=A.q,az=A.r,ay=-ax-az,bx=B.q,bz=B.r,by=-bx-bz;
  for(let i=1;i<n;i++){
    const t=i/n,x=ax+(bx-ax)*t+1e-6,y=ay+(by-ay)*t+2e-6,z=az+(bz-az)*t-3e-6;
    let rx=Math.round(x),ry=Math.round(y),rz=Math.round(z);
    const dx=Math.abs(rx-x),dy=Math.abs(ry-y),dz=Math.abs(rz-z);
    if(dx>dy&&dx>dz)rx=-ry-rz;else if(dy>dz)ry=-rx-rz;else rz=-rx-ry;
    const o=toOff(rx,rz);
    if(o.c<0||o.c>=map.w||o.r<0||o.r>=map.h)continue;
    if(TGH.BLOCKS_SIGHT.has(map.tiles[o.r*map.w+o.c]))return false;
  }
  return true;
};

/* ---------- map generator ---------- */
TGH.genMap=function(biomeKey,seed){
  const B=TGH.BIOMES[biomeKey],W=B.w,H=B.h,rg=TGH.rng(seed),rr=()=>rg();
  const ri=(a,b)=>a+Math.floor(rr()*(b-a+1)),pick=a=>a[Math.floor(rr()*a.length)];
  const tiles=new Array(W*H).fill('floor');
  const startC=Math.floor(W/2)-1,startR=H-1,bossC=Math.floor(W/2),bossR=1;
  const idx=(c,r)=>r*W+c,inb=(c,r)=>c>=0&&c<W&&r>=0&&r<H;
  const near=(c,r,tc,tr,d)=>TGH.dist({c,r},{c:tc,r:tr})<=d;
  const setT=(c,r,t)=>{if(!inb(c,r))return;if(near(c,r,startC,startR,3)||near(c,r,startC+1,startR,3)||near(c,r,bossC,bossR,2))return;tiles[idx(c,r)]=t};
  // ridges: walls across the map with gaps, so the way forward bends
  const ridges=Math.max(2,Math.floor(H/6));
  for(let k=0;k<ridges;k++){
    const r=Math.floor((k+1)*H/(ridges+1))+ri(-1,1);if(r<3||r>H-4)continue;
    const gap1=ri(1,W-2),gap2=rr()<.55?ri(1,W-2):-9,block=pick(B.block);
    for(let c=0;c<W;c++){if(Math.abs(c-gap1)<=1||Math.abs(c-gap2)<=1)continue;if(rr()<.88)setT(c,r+(c&1?0:0),block)}
  }
  // scattered boulders, trees and mountains, and pools of water or lava
  const blobs=Math.floor(W*H/14);
  for(let k=0;k<blobs;k++){
    const c=ri(0,W-1),r=ri(2,H-3),hz=rr()<.38,sz=hz?ri(1,3):ri(0,2);
    const t=hz?B.hazard:pick(B.block);
    for(const h of TGH.ring(c,r,sz,W,H)){if(rr()<(hz?.85:.7))setT(h.c,h.r,t)}
  }
  // make sure the road from home to the boss exists
  const passable=(c,r)=>!TGH.BLOCKS_MOVE.has(tiles[idx(c,r)]);
  const reach=()=>TGH.search({w:W,h:H},{c:startC,r:startR},passable,999);
  let res=reach(),tries=0;
  while(!res.dist.has(idx(bossC,bossR))&&tries++<40){
    // carve a wandering path from the boss down toward home
    let c=bossC,r=bossR;
    while(r<startR){r++;c=TGH.clamp(c+ri(-1,1),0,W-1);for(const h of [{c,r},...TGH.neighbors(c,r,W,H).slice(0,1)])if(inb(h.c,h.r))tiles[idx(h.c,h.r)]='floor'}
    res=reach();
  }
  // every hex a hero could not reach becomes a wall
  const walk=res.dist;
  for(let i=0;i<tiles.length;i++)if(!walk.has(i)&&!TGH.BLOCKS_MOVE.has(tiles[i]))tiles[i]=pick(B.block);
  // entities
  const ents=[],taken=new Set();
  const free=[];for(let r=2;r<H-3;r++)for(let c=0;c<W;c++)if(walk.has(idx(c,r))&&tiles[idx(c,r)]==='floor')free.push({c,r});
  const take=(minFromOthers,maxRow,minRow)=>{
    for(let t=0;t<200;t++){
      const h=pick(free);if(taken.has(idx(h.c,h.r)))continue;
      if(minRow!=null&&h.r<minRow)continue;if(maxRow!=null&&h.r>maxRow)continue;
      let ok=true;for(const e of ents)if(TGH.dist(e,h)<minFromOthers){ok=false;break}
      if(!ok)continue;taken.add(idx(h.c,h.r));return h;
    }
    return null;
  };
  const add=(type,h,extra)=>{if(h)ents.push(Object.assign({id:TGH.uid(),type,c:h.c,r:h.r},extra||{}))};
  const mons=B.mons;
  // rarer things first, and relax the spacing if the map is crowded
  const place=(mind,maxRow,minRow)=>{for(let d=mind;d>=1;d--){const h=take(d,maxRow,minRow);if(h)return h}return null};
  for(let i=0;i<B.elites;i++){const h=place(4,H-7,3);if(!h)break;add('elite',h,{name:pick(mons),mut:pick(Object.keys(TGH.MUTATIONS))})}
  for(let i=0;i<B.camps;i++)add('camp',place(4,H-4,3));
  for(let i=0;i<B.packs;i++){const h=place(3,H-5);if(!h)break;add('pack',h,{names:[pick(mons),pick(mons),pick(mons)]})}
  for(let i=0;i<B.chests;i++)add('chest',place(2,H-4));
  for(let i=0;i<B.qs;i++)add('q',place(2,H-4));
  for(let i=0;i<B.mats;i++)add('mat',place(2,H-3),{mat:pick(B.mat),amt:ri(1,2)});
  add('boss',{c:bossC,r:bossR},{name:null});
  return {w:W,h:H,tiles,ents,start:[{c:startC,r:startR},{c:startC+1,r:startR}],bossPos:{c:bossC,r:bossR},biome:biomeKey,seed};
};
})();
