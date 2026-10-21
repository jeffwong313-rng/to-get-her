/* To Get Her: the 3D stage. One WebGL canvas, a hex-tile battlefield that fills with fog and light as the heroes explore, a
   little town, tweens, particles, the camera, and small portrait renderers for the interface. */
(function(){
'use strict';
const TGH=window.TGH=window.TGH||{};
const T=window.THREE,Ch=TGH.chars,{mat,part,sph,cone,cyl,box,tor}=Ch;
const PI=Math.PI;
const A=TGH.art={};
const hexN=c=>new T.Color(c);

/* ---------- renderer and scenes ---------- */
A.init=function(canvas){
  A.canvas=canvas;
  A.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  A.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  A.renderer.outputColorSpace=T.SRGBColorSpace;
  A.clock=0;A.tweens=[];A.rigs=[];A.parts=[];A.units=new Map();A.ents=new Map();A.overlay=new Map();
  A.cam=new T.PerspectiveCamera(36,2,.1,200);
  A.focusT={x:0,z:0};A.zoom=.85;A.orbit=0;
  A.mode='none';
  A.scenes={map:new T.Scene(),town:new T.Scene()};
  for(const s of Object.values(A.scenes)){
    s.add(new T.HemisphereLight(0xfff4ea,0x7a6aa0,1.15));
    const d=new T.DirectionalLight(0xffffff,1.7);d.position.set(6,12,8);s.add(d);s.userData.dir=d;
  }
  A.resize();window.addEventListener('resize',A.resize);
  let last=performance.now();
  const loop=now=>{const dt=Math.min(.05,(now-last)/1000);last=now;A.update(dt);requestAnimationFrame(loop)};
  requestAnimationFrame(loop);
};
A.resize=function(){
  const w=window.innerWidth,h=window.innerHeight;A.renderer.setSize(w,h,false);
  A.cam.aspect=w/h;A.cam.updateProjectionMatrix();A.aspect=w/h;
};
A.show=function(mode){A.mode=mode;A.canvas.style.visibility=mode==='none'?'hidden':'visible'};

/* ---------- tweens ---------- */
A.ease={lin:t=>t,out:t=>1-Math.pow(1-t,3),inout:t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,back:t=>{const c=1.7;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)}};
A.tween=function(ms,fn,ease){
  return new Promise(res=>{A.tweens.push({t:0,d:Math.max(1,ms)/1000,fn,ease:ease||A.ease.inout,res})});
};
A.wait=ms=>new Promise(r=>setTimeout(r,ms));
A.fast=false; // fast-forward button shortens everything
const S=ms=>A.fast?ms*.45:ms;
A.S=S;

/* ---------- map building ---------- */
const hexGeo=new T.CylinderGeometry(.985,.985,.7,6,1);
const hexEdge=new T.EdgesGeometry(new T.CylinderGeometry(.985,.985,.02,6,1));
const hexFlat=(()=>{const s=new T.Shape();for(let i=0;i<6;i++){const a=PI/6+i*PI/3-PI/2+PI/6;const x=Math.cos(a+PI/6)*.9,y=Math.sin(a+PI/6)*.9;i?s.lineTo(x,y):s.moveTo(x,y)}s.closePath();return new T.ShapeGeometry(s)})();
const rr=TGH.rng(7);
A.setBiome=function(key){
  const B=TGH.BIOMES[key];A.biome=key;A.B=B;
  const sc=A.scenes.map;sc.background=hexN(B.sky);sc.fog=new T.Fog(hexN(B.fog),30,62);
};
A.buildMap=function(map){
  const sc=A.scenes.map,B=TGH.BIOMES[map.biome];A.map=map;
  A.clearMap();
  A.group=new T.Group();sc.add(A.group);
  A.tiles=new Array(map.w*map.h);A.pickMeshes=[];
  const rg=TGH.rng(map.seed*7+3);
  const sideC=B.edge;
  for(let r=0;r<map.h;r++)for(let c=0;c<map.w;c++){
    const i=r*map.w+c,t=map.tiles[i],p=TGH.hexPos(c,r);
    const jitter=(rg()-.5)*.08;
    const top=(c+r)%2?B.floor[0]:B.floor[1];
    const base=Ch.shade(top,jitter);
    let topC=base,h=.7,y=-.35,emissive=null;
    if(t==='water'){topC='#4aa8d8';y=-.5}
    else if(t==='lava'){topC='#ff6a2a';y=-.5;emissive=true}
    else if(t==='void'){topC='#1a0e2a';y=-.55}
    const mats={vis:[mat(sideC),t==='water'?waterMat():t==='lava'?lavaMat():mat(topC),mat(sideC)],
      dim:[mat(Ch.shade(sideC,-.35)),t==='water'?mat('#2a5a78'):t==='lava'?mat('#6a2a12'):mat(Ch.shade(topC,-.45)),mat(sideC)]};
    const m=new T.Mesh(hexGeo,mats.vis);m.position.set(p.x,y,p.z);
    m.userData={c,r,tile:true};A.group.add(m);A.pickMeshes.push(m);
    const edge=new T.LineSegments(hexEdge,new T.LineBasicMaterial({color:hexN(Ch.shade(sideC,-.3)),transparent:true,opacity:.55}));
    edge.position.set(p.x,y+(h/2)+.005,p.z);A.group.add(edge);
    const tile={m,edge,mats,t,c,r,prop:null,deco:[],state:0};
    A.tiles[i]=tile;
    // props
    if(t==='boulder')tile.prop=A.boulder(p,rg,B);
    else if(t==='mountain')tile.prop=A.mountain(p,rg,B);
    else if(t==='tree')tile.prop=A.tree(p,rg);
    else if(t==='floor'&&rg()<.3)tile.prop=A.deco(p,rg,map.biome);
    if(tile.prop){A.group.add(tile.prop);tile.prop.visible=false}
    m.visible=false;edge.visible=false;
  }
  // a soft ground plane far below, so the edge of the map does not float in nothing
  const ground=new T.Mesh(new T.CircleGeometry(80,24),new T.MeshBasicMaterial({color:hexN(Ch.shade(B.fog,-.2))}));ground.rotation.x=-PI/2;ground.position.y=-1.2;A.group.add(ground);
};
A.clearMap=function(){
  if(A.group){A.scenes.map.remove(A.group);A.group=null}
  for(const u of A.units.values())A.scenes.map.remove(u.rig.root);
  for(const e of A.ents.values())if(e.obj)A.scenes.map.remove(e.obj);
  A.units.clear();A.ents.clear();A.rigs=[];A.overlay.clear();A.ovPool=null;A.ovMeshes=null;A.fx.list=[];
};
let _water,_lava;
const waterMat=()=>_water||(_water=new T.MeshToonMaterial({color:0x4aa8d8,gradientMap:Ch.gradient,emissive:0x1a5a8a,emissiveIntensity:.4}));
const lavaMat=()=>_lava||(_lava=new T.MeshToonMaterial({color:0xff6a2a,gradientMap:Ch.gradient,emissive:0xff5a1a,emissiveIntensity:.8}));
A.boulder=function(p,rg,B){
  const g=new T.Group();g.position.set(p.x,0,p.z);
  const n=1+Math.floor(rg()*2);
  for(let i=0;i<n;i++){const s=.35+rg()*.3;part(g,Ch.geo.dodeG(),Ch.shade(B.edge,.35+rg()*.1),(rg()-.5)*.5,s*.7,(rg()-.5)*.5,s,s*.8,s,{ry:rg()*3,rx:rg()*.4})}
  return g;
};
A.mountain=function(p,rg,B){
  const g=new T.Group();g.position.set(p.x,0,p.z);
  const h=1.5+rg()*.9,col=Ch.shade(B.edge,.2);
  cone(g,col,0,h/2,0,.85,h,{});
  if((A.B&&A.B.land==='tundra')||rg()<.4)cone(g,'#f4f8fb',0,h*.82,0,.34,h*.36,{ol:.012});
  cone(g,Ch.shade(col,-.15),.5,.45,.2,.45,.9,{});
  return g;
};
A.tree=function(p,rg){
  const g=new T.Group();g.position.set(p.x,0,p.z);
  cyl(g,'#6a4a30',0,.35,0,.12,.7,{});
  const lc=['#4d8a3a','#5a9a44','#3e7a30'][Math.floor(rg()*3)];
  sph(g,lc,0,.95,0,.55,.5,.55,{});sph(g,Ch.shade(lc,.12),.2,1.2,.1,.38,.34,.38,{});
  return g;
};
A.deco=function(p,rg,biome){
  const g=new T.Group();g.position.set(p.x+(rg()-.5)*.8,0,p.z+(rg()-.5)*.8);
  const B=TGH.BIOMES[biome]||TGH.BIOMES['wilds:forest'];
  const land=B.land;
  if(land==='forest'){for(let i=0;i<3;i++)cone(g,'#7ab05a',(i-1)*.07,.1,(rg()-.5)*.1,.04,.22,{rz:(i-1)*.25,noOutline:true})}
  else if(land==='abyss'){cone(g,'#a070ff',0,.18,0,.06,.36,{glow:true,rz:.1})}
  else if(land==='tundra'){sph(g,'#ffffff',0,.04,0,.2,.08,.2,{noOutline:true})}
  else if(land==='sky'){cone(g,'#fff07a',0,.18,0,.05,.34,{glow:true,rz:-.2})}
  else if(land==='badlands'){sph(g,'#d8c8a0',0,.06,0,.12,.07,.16,{noOutline:true});sph(g,'#d8c8a0',.1,.05,.05,.07,.05,.07,{noOutline:true})}
  else if(land==='island'){sph(g,'#3a2a26',0,.07,0,.13,.1,.13,{noOutline:true});sph(g,'#ff9a3a',.04,.12,.03,.03,.03,.03,{glow:true})}
  else sph(g,Ch.shade(B.edge,.4),0,.07,0,.12,.09,.12,{noOutline:true});
  return g;
};

/* ---------- fog of war ---------- */
// vis: Uint8Array, 0 never seen, 1 remembered, 2 in sight right now.
A.setFog=function(vis){
  for(let i=0;i<A.tiles.length;i++){
    const t=A.tiles[i],s=vis[i];if(t.state===s)continue;t.state=s;
    t.m.visible=s>0;t.edge.visible=s>0;if(t.prop)t.prop.visible=s>0;
    if(s>0)t.m.material=s===2?t.mats.vis:t.mats.dim;
  }
  for(const e of A.ents.values())A.refreshEnt(e);
  for(const u of A.units.values())if(u.team==='foe')u.rig.root.visible=vis[u.r*A.map.w+u.c]===2&&!u.down;
};

/* ---------- units ---------- */
A.addUnit=function(u){
  const rig=u.team==='hero'?Ch.buildHero(u):Ch.buildMonster(u,A.map.biome);
  const sc=u.scale||1;rig.root.scale.setScalar(sc);rig.phase=Math.random()*6;rig.moving=false;
  // soft blob shadow
  const sh=new T.Mesh(new T.CircleGeometry(.42*sc,16),new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.28,depthWrite:false}));sh.rotation.x=-PI/2;sh.position.y=.02;
  const g=new T.Group();g.add(sh);g.add(rig.root);rig.holder=g;rig.root=rig.root;
  A.scenes.map.add(g);u.rig=rig;u.rig.shadow=sh;A.units.set(u.id,u);A.rigs.push(rig);
  A.placeUnit(u,u.c,u.r);return rig;
};
A.removeUnit=function(u){if(!u.rig)return;A.scenes.map.remove(u.rig.holder);A.units.delete(u.id);A.rigs=A.rigs.filter(r=>r!==u.rig)};
A.unitPos=function(u){const p=TGH.hexPos(u.c,u.r);return new T.Vector3(p.x,0,p.z)};
A.placeUnit=function(u,c,r){u.c=c;u.r=r;const p=TGH.hexPos(c,r);u.rig.holder.position.set(p.x,0,p.z)};
// Hop from hex to hex.
A.moveAlong=async function(u,path){
  const rig=u.rig;rig.moving=true;
  for(const step of path){
    const from=rig.holder.position.clone(),to=TGH.hexPos(step.c,step.r);
    // turn to face the way we are going
    const ang=Math.atan2(to.x-from.x,to.z-from.z);
    A.tween(S(120),t=>{rig.root.rotation.y=A.lerpAngle(rig.root.rotation.y,ang,Math.min(1,t*1.4))},A.ease.out);
    await A.tween(S(170),t=>{rig.holder.position.set(from.x+(to.x-from.x)*t,0,from.z+(to.z-from.z)*t)},A.ease.lin);
    u.c=step.c;u.r=step.r;
  }
  rig.moving=false;
};
A.lerpAngle=(a,b,t)=>{let d=((b-a+PI)%(PI*2)+PI*2)%(PI*2)-PI;return a+d*t};
A.face=(u,target)=>{const a=A.unitPos(u),b=target.isVector3?target:A.unitPos(target);u.rig.root.rotation.y=Math.atan2(b.x-a.x,b.z-a.z)};
A.faceHex=(u,c,r)=>{const b=TGH.hexPos(c,r),a=A.unitPos(u);u.rig.root.rotation.y=Math.atan2(b.x-a.x,b.z-a.z)};
// Lunge toward a point and back, swinging the weapon arm.
A.lunge=async function(u,tc,tr,reach){
  const rig=u.rig;A.faceHex(u,tc,tr);
  const a=A.unitPos(u),b=TGH.hexPos(tc,tr),dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||1,k=Math.min(reach==null?.5:reach,l*.6);
  rig.swing=true;
  const arm=rig.parts.armR;
  await A.tween(S(130),t=>{rig.holder.position.set(a.x+dx/l*k*t,0,a.z+dz/l*k*t);if(arm)arm.rotation.x=-2.2*t},A.ease.out);
  const hit=A.tween(S(160),t=>{rig.holder.position.set(a.x+dx/l*k*(1-t),0,a.z+dz/l*k*(1-t));if(arm)arm.rotation.x=-2.2+2.2*t},A.ease.inout);
  return {done:hit,release:()=>{rig.swing=false}};
};
// Raise the arm and glow for a spell.
A.cast=async function(u,col){
  const rig=u.rig,arm=rig.parts.armR;rig.swing=true;
  A.fx.ring(A.unitPos(u),col||'#b9a8ff',S(450));
  await A.tween(S(220),t=>{if(arm)arm.rotation.x=-2.6*t;rig.holder.position.y=.12*t},A.ease.out);
  await A.tween(S(160),t=>{if(arm)arm.rotation.x=-2.6+1.2*t;rig.holder.position.y=.12*(1-t)},A.ease.inout);
  rig.swing=false;
};
A.hurt=async function(u,crit){
  const rig=u.rig,p=rig.holder.position.clone();
  Ch.flash(rig.root,true);
  await A.tween(S(110),t=>{rig.holder.position.x=p.x+(Math.random()-.5)*.18*(1-t);rig.root.scale.y=(u.scale||1)*(1-.12*Math.sin(t*PI))},A.ease.lin);
  Ch.flash(rig.root,false);rig.holder.position.copy(p);rig.root.scale.y=u.scale||1;
};
A.die=async function(u){
  const rig=u.rig;
  await A.tween(S(500),t=>{rig.root.rotation.z=t*PI/2*(u.team==='hero'?1:1.1);rig.root.position.y=-.1*t;rig.root.scale.setScalar((u.scale||1)*(u.team==='hero'?1:1-t*.5));rig.shadow.material.opacity=.28*(1-t*.6)},A.ease.out);
  if(u.team==='foe'){rig.root.visible=false}
};
A.revive=async function(u){
  const rig=u.rig;rig.root.visible=true;
  await A.tween(S(400),t=>{rig.root.rotation.z=PI/2*(1-t);rig.root.position.y=-.1*(1-t);rig.root.scale.setScalar(u.scale||1);rig.shadow.material.opacity=.28},A.ease.out);
  rig.root.rotation.z=0;rig.root.position.y=0;
  A.fx.sparkles(A.unitPos(u),'#fff6a0',16,1.2);
};
A.setEquipLook=function(u){Ch.setWeapon(u.rig,u)};

/* ---------- overlays: move range, attack range, path, targets ---------- */
const ovMat={};
const ovMaterial=c=>ovMat[c]||(ovMat[c]=new T.MeshBasicMaterial({color:hexN(c),transparent:true,opacity:.42,depthWrite:false,side:T.DoubleSide}));
A.setOverlay=function(name,list,color,opacity){
  A.clearOverlay(name);
  const arr=[];
  for(const h of list){
    const m=new T.Mesh(hexFlat,ovMaterial(color));m.rotation.x=-PI/2;
    const p=TGH.hexPos(h.c,h.r);m.position.set(p.x,.03+(opacity||0)*0,p.z);m.renderOrder=2;
    m.userData.hex=h;A.scenes.map.add(m);arr.push(m);
  }
  A.overlay.set(name,arr);
};
A.clearOverlay=function(name){const a=A.overlay.get(name);if(a){for(const m of a)A.scenes.map.remove(m);A.overlay.delete(name)}};
A.clearAllOverlays=function(){for(const n of [...A.overlay.keys()])A.clearOverlay(n)};
// A path drawn as a line of dots.
A.setPath=function(path,from,ok){
  A.clearOverlay('path');
  const pts=[from,...path];const arr=[];
  pts.forEach((h,i)=>{if(i===0)return;const p=TGH.hexPos(h.c,h.r);
    const m=new T.Mesh(new T.CircleGeometry(i===pts.length-1?.3:.14,14),new T.MeshBasicMaterial({color:ok?0xffffff:0xff8a8a,transparent:true,opacity:.95,depthWrite:false}));
    m.rotation.x=-PI/2;m.position.set(p.x,.06,p.z);m.renderOrder=3;A.scenes.map.add(m);arr.push(m)});
  A.overlay.set('path',arr);
};

/* ---------- points of interest ---------- */
const qTex=(()=>{const cv=document.createElement('canvas');cv.width=cv.height=128;const x=cv.getContext('2d');x.fillStyle='#ffe27a';x.strokeStyle='#5a3a10';x.lineWidth=8;x.font='900 110px Georgia,serif';x.textAlign='center';x.textBaseline='middle';x.strokeText('?',64,70);x.fillText('?',64,70);const t=new T.CanvasTexture(cv);t.colorSpace=T.SRGBColorSpace;return t})();
A.addEnt=function(e){
  const g=new T.Group(),p=TGH.hexPos(e.c,e.r);g.position.set(p.x,0,p.z);
  const B=TGH.BIOMES[A.map.biome];
  if(e.type==='camp'){
    for(let i=0;i<3;i++){const a=i/3*PI*2;cyl(g,'#6a4a30',Math.cos(a)*.22,.08,Math.sin(a)*.22,.07,.4,{rz:Math.cos(a)*1.2,rx:-Math.sin(a)*1.2})}
    const f=cone(g,'#ff8a2a',0,.34,0,.2,.55,{glow:true});const f2=cone(g,'#ffd34a',0,.3,0,.11,.36,{glow:true});g.userData.flame=[f,f2];
  }else if(e.type==='q'){
    const sp=new T.Sprite(new T.SpriteMaterial({map:qTex,transparent:true,depthTest:false}));sp.scale.set(.9,.9,1);sp.position.y=1.0;sp.renderOrder=5;g.add(sp);g.userData.float=sp;
    sph(g,'#ffe27a',0,.0,0,.4,.04,.4,{glow:true,alpha:.45,noOutline:true});
  }else if(e.type==='chest'){
    box(g,'#8a5a2a',0,.2,0,.5,.34,.34,{});box(g,'#a06a30',0,.4,0,.5,.12,.34,{});box(g,'#e8c050',0,.28,.18,.1,.12,.03,{});
    tor(g,'#e8c050',0,.35,0,.01,{});
  }else if(e.type==='mat'){
    const col=TGH.MATS[e.mat].col;
    for(let i=0;i<4;i++){const a=i*1.9,s=.14+(i%2)*.06;part(g,Ch.geo.dodeG(),col,Math.cos(a)*.18,s*.8,Math.sin(a)*.18,s,s*.9,s,{ry:a})}
    const ring=new T.Mesh(new T.RingGeometry(.4,.48,24),new T.MeshBasicMaterial({color:hexN(col),transparent:true,opacity:.55,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-PI/2;ring.position.y=.04;g.add(ring);
  }else if(e.type==='boss'||e.type==='pack'||e.type==='elite'){
    // these show their real monsters (added by the game through addUnit); nothing extra here
  }else if(e.type==='exit'){
    const r1=tor(g,'#9fe8ff',0,.9,0,.7,{glow:true,rx:0});sph(g,'#d8f6ff',0,.9,0,.55,.55,.05,{glow:true,alpha:.55,noOutline:true});g.userData.spin=r1;
  }else if(e.type==='start'){
    tor(g,'#fff2a0',0,.05,0,.7,{glow:true,rx:PI/2,ol:.01});
  }
  A.scenes.map.add(g);e.obj=g;A.ents.set(e.id,e);A.refreshEnt(e);return g;
};
A.removeEnt=function(e){if(e.obj){A.scenes.map.remove(e.obj);e.obj=null}A.ents.delete(e.id)};
A.refreshEnt=function(e){
  if(!e.obj)return;const t=A.tiles[e.r*A.map.w+e.c];
  // things you found stay on the map once seen; monsters only show while in sight
  const mon=e.type==='pack'||e.type==='elite'||e.type==='boss';
  e.obj.visible=!!t&&(mon?t.state===2:t.state>0)&&(!e.gone||e.type==='camp');
};

/* ---------- particles and effects ---------- */
A.fx={list:[]};
const dotG=new T.SphereGeometry(1,8,6);
A.fx.spawn=function(pos,col,n,spd,size,life,up,grav){
  const sc=A.mode==='town'?A.scenes.town:A.scenes.map;
  for(let i=0;i<n;i++){
    const m=new T.Mesh(dotG,new T.MeshBasicMaterial({color:hexN(col),transparent:true}));m.scale.setScalar(size*(.6+Math.random()*.8));
    m.position.copy(pos);m.position.y+=up||0.6;sc.add(m);
    const a=Math.random()*PI*2,e=(Math.random()-.2)*spd;
    A.fx.list.push({m,sc,vx:Math.cos(a)*spd*Math.random(),vy:Math.abs(e)+.5,vz:Math.sin(a)*spd*Math.random(),t:0,life:life||.6,g:grav==null?4:grav});
  }
};
A.fx.burst=(pos,col,n)=>A.fx.spawn(pos,col,n||10,3,.07,.55);
A.fx.sparkles=(pos,col,n,h)=>{A.fx.spawn(pos,col,n||12,1.2,.05,.9,h||.4,-1.2)};
A.fx.ring=function(pos,col,ms){
  const m=new T.Mesh(new T.RingGeometry(.4,.55,28),new T.MeshBasicMaterial({color:hexN(col),transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}));
  m.rotation.x=-PI/2;m.position.copy(pos);m.position.y=.05;A.scenes.map.add(m);
  A.tween(ms||500,t=>{m.scale.setScalar(1+t*2.2);m.material.opacity=.8*(1-t)},A.ease.out).then(()=>A.scenes.map.remove(m));
};
// Something flies from one point to another: an arrow, a bolt of magic.
A.fx.projectile=async function(from,to,kind,col){
  const sc=A.scenes.map;const g=new T.Group();
  if(kind==='arrow'){cyl(g,'#e8d8b0',0,0,0,.015,.5,{rx:PI/2,noOutline:true});cone(g,'#cfd6e0',0,0,.28,.04,.1,{rx:PI/2,noOutline:true})}
  else{sph(g,col||'#b9a8ff',0,0,0,.14,.14,.14,{glow:true,noOutline:true});sph(g,col||'#b9a8ff',0,0,0,.24,.24,.24,{glow:true,alpha:.35,noOutline:true})}
  const a=from.clone();a.y=.8;const b=to.clone();b.y=.7;
  g.position.copy(a);g.lookAt(b);sc.add(g);
  const d=a.distanceTo(b);
  await A.tween(S(Math.max(160,d*60)),t=>{g.position.lerpVectors(a,b,t);g.position.y+=Math.sin(t*PI)*d*.06;if(kind!=='arrow'&&Math.random()<.5)A.fx.spawn(g.position,col||'#b9a8ff',1,.4,.04,.3,0,0)},A.ease.lin);
  sc.remove(g);
};
A.fx.slash=function(pos,col){
  const m=new T.Mesh(new T.TorusGeometry(.5,.05,6,16,PI*.8),new T.MeshBasicMaterial({color:hexN(col||'#ffffff'),transparent:true,depthWrite:false}));
  m.position.copy(pos);m.position.y=.8;m.rotation.set(Math.random()*.6,Math.random()*PI,Math.random()*PI);A.scenes.map.add(m);
  A.tween(S(240),t=>{m.scale.setScalar(.7+t*.6);m.material.opacity=1-t;m.rotation.z+=.15},A.ease.out).then(()=>A.scenes.map.remove(m));
};
A.fx.blast=function(pos,col,r){
  A.fx.ring(pos,col,S(550));A.fx.spawn(pos,col,22,5,.09,.7);
};

/* ---------- camera ---------- */
A.focus=function(c,r,instant){const p=TGH.hexPos(c,r);A.focusT.x=p.x;A.focusT.z=p.z;if(instant){A.cur={x:p.x,z:p.z}}};
A.focusPos=function(x,z,instant){A.focusT.x=x;A.focusT.z=z;if(instant)A.cur={x,z}};
A.cur={x:0,z:0};
A.clampFocus=function(){
  if(!A.map)return;const maxX=Math.sqrt(3)*(A.map.w+.5),maxZ=1.5*A.map.h;
  A.focusT.x=TGH.clamp(A.focusT.x,0,maxX);A.focusT.z=TGH.clamp(A.focusT.z,-1,maxZ);
};
A.panBy=function(dx,dz){A.focusT.x+=dx;A.focusT.z+=dz;A.clampFocus()};
A.setZoom=z=>{A.zoom=TGH.clamp(z,.5,1.35)};
A.pick=function(px,py){
  if(!A.tiles)return null;
  const v=new T.Vector2(px/window.innerWidth*2-1,-(py/window.innerHeight)*2+1);
  const ray=new T.Raycaster();ray.setFromCamera(v,A.cam);
  const hit=ray.intersectObjects(A.pickMeshes,false).find(h=>h.object.visible);
  if(hit)return {c:hit.object.userData.c,r:hit.object.userData.r};
  return null;
};
A.project=function(x,y,z){
  const v=new T.Vector3(x,y,z).project(A.cam);return {x:(v.x*.5+.5)*window.innerWidth,y:(-v.y*.5+.5)*window.innerHeight,behind:v.z>1};
};
A.unitScreen=function(u,h){const p=u.rig.holder.position;return A.project(p.x,(h==null?1.7:h)*(u.scale||1),p.z)};

/* ---------- town scene ---------- */
A.buildTown=function(town){
  const sc=A.scenes.town;
  if(A.townGroup){sc.remove(A.townGroup)}
  sc.background=hexN('#241a3a');sc.fog=new T.Fog(hexN('#241a3a'),24,60);
  const g=new T.Group();A.townGroup=g;sc.add(g);
  const rg=TGH.rng(99);
  // ground
  const gr=new T.Mesh(new T.CylinderGeometry(15,15.6,.8,40),[mat('#5f8a48'),mat('#6a9a50'),mat('#3a2a28')].map(m=>m));gr.position.y=-.4;g.add(gr);
  const path=new T.Mesh(new T.CylinderGeometry(4.6,4.6,.82,30),mat('#c8b490'));path.position.y=-.39;g.add(path);
  const path2=new T.Mesh(new T.CylinderGeometry(3.6,3.6,.84,30),mat('#d8c8a4'));path2.position.y=-.38;g.add(path2);
  const lvl=k=>(town.b[k]||0);
  const mk=(name,x,z,ry,build)=>{const b=new T.Group();b.position.set(x,0,z);b.rotation.y=ry;b.userData.name=name;g.add(b);build(b);return b};
  const roof=(b,col,w,h,y)=>{cone(b,col,0,y,0,w,h,{});};
  // Family Home
  A.townB={};
  A.townB.lodge=mk('lodge',0,-9,0,b=>{
    if(lvl('lodge')<1){rubble(b,rg);return}
    const s=1+lvl('lodge')*.06;b.scale.setScalar(s);
    box(b,'#e8dcc4',0,.9,0,3,1.8,2.4,{});part(b,Ch.geo.coneG(),'#b8483a',0,2.4,0,2.5,1.4,2.0,{ry:PI/4});
    box(b,'#7a4a2a',0,.55,1.22,.7,1.1,.06,{});for(const x of [-.9,.9])box(b,'#ffe27a',x,1.1,1.22,.5,.5,.05,{glow:true});
    cyl(b,'#8a8a92',.9,2.8,-.4,.18,.8,{});
    for(let i=0;i<lvl('lodge');i++)sph(b,'#ffe27a',-1.3+i*.65,2.1,1.25,.06,.06,.06,{glow:true});
  });
  A.townB.forge=mk('forge',-8,-3,PI/2.4,b=>{
    const s=1+lvl('forge')*.05;b.scale.setScalar(s);
    box(b,'#9a9aa6',0,.8,0,2.6,1.6,2.2,{});part(b,Ch.geo.coneG(),'#5a5a68',0,2.0,0,2.3,.9,1.9,{ry:PI/4});
    cyl(b,'#6a6a76',.8,2.4,-.3,.22,1.2,{});box(b,'#ff8a2a',0,.5,1.12,1.1,.8,.06,{glow:true});
    box(b,'#3a3a46',1.8,.35,.6,.5,.35,.3,{});box(b,'#3a3a46',1.8,.6,.6,.7,.12,.3,{});
    g.userData.smoke=g.userData.smoke||[];
  });
  A.townB.witch=mk('witch',8,-3,-PI/2.4,b=>{
    const s=1+lvl('witch')*.05;b.scale.setScalar(s);
    cyl(b,'#5a3a7a',0,.9,0,1.2,1.8,{});part(b,Ch.geo.coneG(),'#3a2a5a',0,2.4,0,1.5,1.5,1.5,{});
    sph(b,'#c090ff',0,3.2,0,.2,.2,.2,{glow:true});box(b,'#7a4a2a',0,.5,1.18,.6,1.0,.06,{});
    sph(b,'#6adf8a',1.6,.45,.8,.45,.35,.45,{});sph(b,'#6adf8a',1.6,.8,.8,.3,.12,.3,{glow:true,noOutline:true});
  });
  A.townB.farm=mk('farm',-7,6,PI-PI/3,b=>{
    if(lvl('farm')<1){rubble(b,rg);return}
    const s=1+lvl('farm')*.05;b.scale.setScalar(s);
    box(b,'#b8483a',0,.9,0,2.6,1.8,2.2,{});part(b,Ch.geo.coneG(),'#8a3a2e',0,2.2,0,2.4,1.0,2.0,{ry:PI/4});
    box(b,'#f0e8d0',0,.7,1.12,1.0,1.4,.06,{});
    for(let i=0;i<4;i++)for(let j=0;j<3;j++)cone(b,'#e8c050',3+i*.4,.35,-1+j*.8,.12,.7,{});
  });
  A.townB.vault=mk('vault',7,6,-PI+PI/3,b=>{
    const s=1+lvl('vault')*.05;b.scale.setScalar(s);
    box(b,'#8a8a96',0,.9,0,2.4,1.8,2.2,{});box(b,'#6a6a76',0,1.9,0,2.6,.2,2.4,{});
    box(b,'#e8c050',0,.8,1.12,1.0,1.3,.1,{});sph(b,'#2a2030',0,.8,1.2,.12,.12,.06,{});
  });
  // the adventure gate and notice board
  A.townB.gate=mk('gate',0,9,PI,b=>{
    for(const x of [-1.2,1.2])cyl(b,'#6a4a30',x,1.2,0,.18,2.4,{});box(b,'#6a4a30',0,2.5,0,2.8,.3,.3,{});
    sph(b,'#ffe27a',0,1.4,0,.5,.5,.06,{glow:true,alpha:.5,noOutline:true});
  });
  // trees around the rim
  for(let i=0;i<22;i++){const a=i/22*PI*2+rg()*.2,rr2=12.4+rg()*1.6;const p={x:Math.cos(a)*rr2,z:Math.sin(a)*rr2};const t=A.tree(p,rg);t.scale.setScalar(1.2+rg()*.7);g.add(t)}
  for(let i=0;i<10;i++){const a=rg()*PI*2,rr2=5+rg()*6;const p={x:Math.cos(a)*rr2,z:Math.sin(a)*rr2};g.add(A.deco(p,rg,'wilds'))}
  // fireflies
  A.townFlies=[];for(let i=0;i<24;i++){const m=sph(g,'#fff6a0',(rg()-.5)*22,.8+rg()*2,(rg()-.5)*22,.05,.05,.05,{glow:true,noOutline:true});A.townFlies.push({m,a:rg()*6})}
  // the two heroes stand together in the square
  A.townHeroes=[];
};
function rubble(b,rg){for(let i=0;i<7;i++){const s=.3+rg()*.5;part(b,Ch.geo.dodeG(),['#7a7a82','#6a6a72','#8a8a92'][i%3],(rg()-.5)*2.4,s*.6,(rg()-.5)*2,s,s*.7,s,{ry:rg()*3})}box(b,'#6a4a30',.4,.3,.2,1.4,.1,.12,{rz:.2});}
A.setTownHeroes=function(heroes){
  const sc=A.scenes.town;
  for(const t of A.townHeroes||[])sc.remove(t.rig.root);
  A.townHeroes=[];
  heroes.forEach((h,i)=>{
    const rig=Ch.buildHero(h);rig.root.scale.setScalar(1.35);rig.root.position.set(i?1.0:-1.0,0,1.2);rig.root.rotation.y=i?-.35:.35;
    rig.phase=i*2;sc.add(rig.root);A.townHeroes.push({rig,h});
  });
};

/* ---------- portraits ---------- */
let pr=null;
A.portrait=function(h,w,hh){
  w=w||160;hh=hh||190;
  const key=JSON.stringify([h.look,h.gender,h.equip&&h.equip.weapon&&[h.equip.weapon.fam,h.equip.weapon.rarity],h.equip&&h.equip.helmet&&1,h.equip&&h.equip.chest&&1,w]);
  A.pcache=A.pcache||{};if(A.pcache[key])return A.pcache[key];
  if(!pr){
    const cv=document.createElement('canvas');cv.width=w;cv.height=hh;
    const rd=new T.WebGLRenderer({canvas:cv,antialias:true,alpha:true,preserveDrawingBuffer:true});rd.setPixelRatio(1);
    const sc=new T.Scene();sc.add(new T.HemisphereLight(0xfff4ea,0x7a6aa0,1.2));const d=new T.DirectionalLight(0xffffff,1.6);d.position.set(2,4,5);sc.add(d);
    pr={cv,rd,sc,cam:new T.PerspectiveCamera(26,w/hh,.1,50)};
  }
  pr.cv.width=w;pr.cv.height=hh;pr.rd.setSize(w,hh,false);pr.cam.aspect=w/hh;pr.cam.updateProjectionMatrix();
  const rig=Ch.buildHero(h);rig.parts.armR.rotation.x=0;
  pr.sc.add(rig.root);Ch.animate(rig,0,false,0);
  pr.cam.position.set(.2,1.15,4.6);pr.cam.lookAt(0,.95,0);
  pr.rd.setClearColor(0x000000,0);pr.rd.render(pr.sc,pr.cam);
  const url=pr.cv.toDataURL('image/png');pr.sc.remove(rig.root);
  A.pcache[key]=url;return url;
};
// A live, slowly turning preview in its own canvas (character creation).
A.preview=function(canvas){
  const rd=new T.WebGLRenderer({canvas,antialias:true,alpha:true});rd.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  const sc=new T.Scene();sc.add(new T.HemisphereLight(0xfff4ea,0x7a6aa0,1.2));const d=new T.DirectionalLight(0xffffff,1.6);d.position.set(2,4,5);sc.add(d);
  const cam=new T.PerspectiveCamera(30,1,.1,50);
  // a little stage disc
  const disc=new T.Mesh(new T.CylinderGeometry(.9,.95,.12,32),mat('#6a5a8a'));disc.position.y=-.06;sc.add(disc);
  const o={rig:null,alive:true,t:0,spin:0,set(h){if(o.rig)sc.remove(o.rig.root);o.rig=Ch.buildHero(h);o.rig.root.scale.setScalar(1.15);sc.add(o.rig.root);o.rig.parts.armR.rotation.z=.12},
    dispose(){o.alive=false;rd.dispose();try{rd.forceContextLoss()}catch(e){}}};
  const sz=()=>{const w=canvas.clientWidth||200,h=canvas.clientHeight||280;if(canvas.width!==Math.floor(w*rd.getPixelRatio())||canvas.height!==Math.floor(h*rd.getPixelRatio()))rd.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()};
  const loop=()=>{if(!o.alive)return;o.t+=.016;sz();
    if(o.rig){o.rig.root.rotation.y=Math.sin(o.t*.7)*.5+.25+o.spin;Ch.animate(o.rig,o.t,false,0)}
    cam.position.set(0,1.3,4.3);cam.lookAt(0,.82,0);rd.render(sc,cam);requestAnimationFrame(loop)};
  requestAnimationFrame(loop);return o;
};

/* ---------- frame update ---------- */
A.update=function(dt){
  A.clock+=dt;const t=A.clock;
  for(let i=A.tweens.length-1;i>=0;i--){
    const tw=A.tweens[i];tw.t+=dt;const k=Math.min(1,tw.t/tw.d);tw.fn(tw.ease(k));
    if(k>=1){A.tweens.splice(i,1);tw.res()}
  }
  for(let i=A.fx.list.length-1;i>=0;i--){
    const p=A.fx.list[i];p.t+=dt;p.vy-=p.g*dt;p.m.position.x+=p.vx*dt;p.m.position.y+=p.vy*dt;p.m.position.z+=p.vz*dt;
    p.m.material.opacity=Math.max(0,1-p.t/p.life);if(p.t>=p.life){p.sc.remove(p.m);p.m.material.dispose();A.fx.list.splice(i,1)}
  }
  if(A.mode==='none')return;
  if(A.mode==='map'){
    for(const u of A.units.values()){const rig=u.rig;if(!rig.root.visible&&u.team==='foe')continue;if(u.down&&u.team==='hero')continue;Ch.animate(rig,t,rig.moving,rig.phase)}
    for(const e of A.ents.values()){const o=e.obj;if(!o||!o.visible)continue;
      if(o.userData.flame){const s=1+Math.sin(t*12+e.c)*.12;o.userData.flame[0].scale.set(1,s,1);o.userData.flame[1].scale.set(1,1.1-(s-1),1)}
      if(o.userData.float)o.userData.float.position.y=1.0+Math.sin(t*2.4+e.c)*.12;
      if(o.userData.spin){o.userData.spin.rotation.z=t*1.5}
      if(e.rigs)for(const rg of e.rigs)Ch.animate(rg,t,false,rg.phase)}
    if(_water)_water.emissiveIntensity=.35+Math.sin(t*1.6)*.12;
    if(_lava)_lava.emissiveIntensity=.8+Math.sin(t*2.2)*.25;
    // camera follows its focus
    A.cur.x+=(A.focusT.x-A.cur.x)*Math.min(1,dt*5);A.cur.z+=(A.focusT.z-A.cur.z)*Math.min(1,dt*5);
    const fit=A.aspect<1.2?1.5/A.aspect*.9:1;
    const d=18*A.zoom*fit;
    A.cam.position.set(A.cur.x,d*.78,A.cur.z+d*.62);A.cam.lookAt(A.cur.x,0,A.cur.z-.5);
    A.renderer.render(A.scenes.map,A.cam);
  }else if(A.mode==='town'){
    A.orbit+=dt*.08;const R=22;
    A.cam.position.set(Math.sin(A.orbit*.6)*5,11,R*.82);A.cam.lookAt(0,1.2,0);
    for(const f of A.townFlies||[]){f.a+=dt;f.m.position.y+=Math.sin(f.a*2)*.004;f.m.position.x+=Math.cos(f.a*.7)*.006}
    for(const h of A.townHeroes||[])Ch.animate(h.rig,t,false,h.rig.phase);
    A.renderer.render(A.scenes.town,A.cam);
  }
};
})();
