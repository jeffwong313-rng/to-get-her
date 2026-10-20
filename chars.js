/* To Get Her: characters and monsters, drawn as soft toon-shaded 3D with dark outlines. Chibi anime proportions: big heads,
   big painted eyes, round limbs. Nothing here is made of cubes. Everything is built from smooth shapes in code. */
(function(){
'use strict';
const TGH=window.TGH=window.TGH||{};
const T=window.THREE;
const C=TGH.chars={};
const PI=Math.PI;

/* ---------- materials ---------- */
const gradient=(()=>{const d=new Uint8Array([70,140,205,255]);const t=new T.DataTexture(d,4,1,T.RedFormat);t.minFilter=t.magFilter=T.NearestFilter;t.needsUpdate=true;return t})();
C.gradient=gradient;
const matCache=new Map();
const hexOf=c=>typeof c==='number'?c:new T.Color(c).getHex();
const mat=C.mat=function(color,o){
  o=o||{};const k=hexOf(color)+'|'+(o.glow?1:0)+'|'+(o.alpha||1)+'|'+(o.dbl?1:0);
  let m=matCache.get(k);if(m)return m;
  if(o.glow){m=new T.MeshBasicMaterial({color:hexOf(color)})}
  else m=new T.MeshToonMaterial({color:hexOf(color),gradientMap:gradient,side:o.dbl?T.DoubleSide:T.FrontSide,transparent:(o.alpha||1)<1,opacity:o.alpha||1});
  matCache.set(k,m);return m;
};
const hullMat=new T.MeshBasicMaterial({color:0x1a1226,side:T.BackSide});
const flashMat=new T.MeshBasicMaterial({color:0xffffff});
C.shade=function(c,f){const k=new T.Color(c);if(f>=0)k.lerp(new T.Color(0xffffff),f);else k.lerp(new T.Color(0x000000),-f);return '#'+k.getHexString()};

/* ---------- building blocks ---------- */
const geoCache={};
const G=(name,mk)=>geoCache[name]||(geoCache[name]=mk());
const sphereG=()=>G('sph',()=>new T.SphereGeometry(1,20,14));
const coneG=()=>G('cone',()=>new T.ConeGeometry(1,1,14));
const cylG=()=>G('cyl',()=>new T.CylinderGeometry(1,1,1,14));
const boxG=()=>G('box',()=>new T.BoxGeometry(1,1,1));
const torusG=()=>G('tor',()=>new T.TorusGeometry(1,.12,8,24));
const domeG=()=>G('dome',()=>new T.SphereGeometry(1,20,10,0,PI*2,0,PI/2));
const dodeG=()=>G('dode',()=>new T.DodecahedronGeometry(1,0));
C.geo={sphereG,coneG,cylG,boxG,torusG,domeG,dodeG};
// Add a shape (with an outline) to a parent. Geometry is unit-sized; sx,sy,sz scale it.
const part=C.part=function(parent,geo,color,x,y,z,sx,sy,sz,o){
  o=o||{};
  const g=new T.Group();g.position.set(x||0,y||0,z||0);
  if(o.rx)g.rotation.x=o.rx;if(o.ry)g.rotation.y=o.ry;if(o.rz)g.rotation.z=o.rz;
  const m=new T.Mesh(geo,o.mat||mat(color,o));m.scale.set(sx,sy==null?sx:sy,sz==null?sx:sz);m.userData.orig=m.material;g.add(m);
  if(!o.noOutline&&!o.glow){
    const r=Math.max(sx,sy==null?sx:sy,sz==null?sx:sz),k=(o.ol||.022)/Math.max(.05,Math.min(sx,sy==null?sx:sy,sz==null?sx:sz));
    const h=new T.Mesh(geo,hullMat);h.scale.set(sx*(1+Math.min(.5,k))+(o.ol||.022)*.4,(sy==null?sx:sy)*(1+Math.min(.5,k))+(o.ol||.022)*.4,(sz==null?sx:sz)*(1+Math.min(.5,k))+(o.ol||.022)*.4);h.userData.outline=true;g.add(h);
  }
  parent.add(g);return g;
};
const sph=(p,c,x,y,z,sx,sy,sz,o)=>part(p,sphereG(),c,x,y,z,sx,sy,sz,o);
const cone=(p,c,x,y,z,r,h,o)=>part(p,coneG(),c,x,y,z,r,h,r,o);
const cyl=(p,c,x,y,z,r,h,o)=>part(p,cylG(),c,x,y,z,r,h,r,o);
const box=(p,c,x,y,z,sx,sy,sz,o)=>part(p,boxG(),c,x,y,z,sx,sy,sz,o);
const tor=(p,c,x,y,z,r,o)=>part(p,torusG(),c,x,y,z,r,r,r,o);
C.sph=sph;C.cone=cone;C.cyl=cyl;C.box=box;C.tor=tor;
// Turn every part white for a moment (a hit), then put its colours back.
C.flash=function(root,on){root.traverse(m=>{if(m.isMesh&&!m.userData.outline&&m.userData.orig)m.material=on?flashMat:m.userData.orig})};
C.tint=function(root,on,color){root.traverse(m=>{if(m.isMesh&&!m.userData.outline&&m.userData.orig)m.material=on?mat(color,{glow:true}):m.userData.orig})};

/* ---------- the painted face ---------- */
function paintFace(L,gender){
  const cv=document.createElement('canvas');cv.width=400;cv.height=260;const x=cv.getContext('2d');
  const eye=TGH.LOOKS.eye[L.eye],girl=gender==='f';
  const ex=[104,296],ey=150,rx=girl?56:50,ry=girl?72:64;
  // blush
  const blush=L.mark===2||girl;
  if(blush){x.fillStyle=L.mark===2?'rgba(255,90,120,.55)':'rgba(255,120,140,.28)';for(const bx of [72,328]){x.beginPath();x.ellipse(bx,208,30,14,0,0,PI*2);x.fill()}}
  for(const i of [0,1]){
    const cx=ex[i];
    // white of the eye
    x.fillStyle='#fff';x.beginPath();x.ellipse(cx,ey,rx,ry,0,0,PI*2);x.fill();
    // iris with a vertical gradient
    const gr=x.createLinearGradient(0,ey-ry,0,ey+ry);gr.addColorStop(0,C.shade(eye,-.55));gr.addColorStop(.45,eye);gr.addColorStop(1,C.shade(eye,.45));
    x.save();x.beginPath();x.ellipse(cx,ey,rx,ry,0,0,PI*2);x.clip();
    x.fillStyle=gr;x.beginPath();x.ellipse(cx,ey+8,rx*.82,ry*.88,0,0,PI*2);x.fill();
    x.fillStyle='#14101c';x.beginPath();x.ellipse(cx,ey+8,rx*.38,ry*.42,0,0,PI*2);x.fill();
    // shadow of the upper lid
    x.fillStyle='rgba(20,10,30,.28)';x.fillRect(cx-rx,ey-ry,rx*2,ry*.35);
    x.restore();
    // highlights
    x.fillStyle='#fff';x.beginPath();x.ellipse(cx-rx*.28,ey-ry*.22,rx*.22,ry*.2,0,0,PI*2);x.fill();
    x.beginPath();x.arc(cx+rx*.3,ey+ry*.38,rx*.1,0,PI*2);x.fill();
    // upper lash line
    x.strokeStyle='#1a1226';x.lineWidth=girl?9:7;x.lineCap='round';
    x.beginPath();x.ellipse(cx,ey,rx,ry,0,PI*1.06,PI*1.94);x.stroke();
    if(girl){const s=i?1:-1;x.lineWidth=6;x.beginPath();x.moveTo(cx+s*rx*.92,ey-ry*.4);x.lineTo(cx+s*(rx+16),ey-ry*.62);x.stroke()}
    // brows
    x.lineWidth=girl?6:9;x.strokeStyle='rgba(40,24,24,.8)';x.beginPath();
    const s=i?1:-1;x.moveTo(cx-rx*.7,ey-ry-26+(girl?0:6)*s*-1);x.quadraticCurveTo(cx,ey-ry-44,cx+rx*.7,ey-ry-22+(girl?0:-4)*s);x.stroke();
  }
  // mouth: a small happy line
  x.strokeStyle='#7a3a3a';x.lineWidth=6;x.lineCap='round';x.beginPath();x.moveTo(176,222);x.quadraticCurveTo(200,240,224,222);x.stroke();
  // marks
  if(L.mark===1){x.fillStyle='rgba(150,80,50,.7)';for(const [fx,fy] of [[60,196],[84,206],[108,198],[292,198],[316,206],[340,196],[72,184],[328,184]]){x.beginPath();x.arc(fx,fy,4,0,PI*2);x.fill()}}
  if(L.mark===3){x.strokeStyle='#8a2a2a';x.lineWidth=6;x.beginPath();x.moveTo(60,92);x.lineTo(148,226);x.stroke();x.lineWidth=3;for(let k=0;k<4;k++){x.beginPath();x.moveTo(80+k*18-6,128+k*22);x.lineTo(80+k*18+8,120+k*22);x.stroke()}}
  if(L.mark===4){x.fillStyle='#ffd34a';x.strokeStyle='#8a5a1a';x.lineWidth=2;x.beginPath();for(let k=0;k<10;k++){const a=-PI/2+k*PI/5,r=k%2?7:16;x.lineTo(332+Math.cos(a)*r,214+Math.sin(a)*r)}x.closePath();x.fill();x.stroke()}
  if(L.mark===5){x.fillStyle='#2a1a1a';x.beginPath();x.arc(304,ey+ry+16,5,0,PI*2);x.fill()}
  const t=new T.CanvasTexture(cv);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}

/* ---------- hair ---------- */
function buildHair(head,style,col,R){
  const dark=C.shade(col,-.22),light=C.shade(col,.2);
  const hm={dbl:true};
  // the cap: top and back of the head, open at the face
  const capGeo=new T.SphereGeometry(R*1.1,24,16,PI/2+1.0,PI*2-2.0,0,style==='mohawk'?1.0:1.9);
  const cap=new T.Group();head.add(cap);
  const capMesh=new T.Mesh(capGeo,mat(col,hm));capMesh.userData.orig=capMesh.material;cap.add(capMesh);
  const hull=new T.Mesh(capGeo,hullMat);hull.scale.setScalar(1.05);hull.userData.outline=true;cap.add(hull);
  const bangs=(n,spread,h,y)=>{for(let i=0;i<n;i++){const t=n===1?0:i/(n-1)*2-1;const b=cone(head,i%2?col:light,t*spread,y-Math.abs(t)*.05,R*.86-Math.abs(t)*R*.2,R*.15,h,{rx:PI-.5-Math.abs(t)*.2,rz:-t*.5,dbl:true});}};
  const tuft=(x,y,z,r,h,rx,rz,c)=>cone(head,c||col,x,y,z,r,h,{rx:rx||0,rz:rz||0});
  switch(style){
    case 'short':bangs(5,R*.55,R*.5,R*.62);break;
    case 'spiky':
      bangs(5,R*.55,R*.55,R*.62);
      for(let i=0;i<8;i++){const a=i/8*PI*2,rr=R*.7;tuft(Math.cos(a)*rr,R*.8+Math.sin(i*2)*.03,Math.sin(a)*rr*.8-R*.1,R*.2,R*.7,Math.sin(a)*.5,-Math.cos(a)*.5,i%2?col:dark)}
      tuft(0,R*1.15,0,R*.22,R*.7,0,0);break;
    case 'bob':
      bangs(5,R*.6,R*.45,R*.6);
      sph(head,col,0,-R*.15,-R*.2,R*1.18,R*.95,R*1.08,{});
      sph(head,col,-R*1.0,-R*.15,0,R*.28,R*.75,R*.55);sph(head,col,R*1.0,-R*.15,0,R*.28,R*.75,R*.55);break;
    case 'long':
      bangs(5,R*.6,R*.5,R*.62);
      sph(head,col,0,-R*.9,-R*.55,R*.9,R*1.7,R*.5);
      sph(head,col,-R*.98,-R*.55,-R*.1,R*.2,R*1.1,R*.32);sph(head,col,R*.98,-R*.55,-R*.1,R*.2,R*1.1,R*.32);break;
    case 'ponytail':
      bangs(5,R*.55,R*.5,R*.62);
      sph(head,dark,0,R*.75,-R*.95,R*.2,R*.2,R*.2);
      sph(head,col,0,R*.2,-R*1.35,R*.28,R*.45,R*.28,{rx:-.5});sph(head,col,0,-R*.4,-R*1.55,R*.24,R*.5,R*.22,{rx:-.3});break;
    case 'pigtails':
      bangs(5,R*.55,R*.5,R*.62);
      for(const s of [-1,1]){sph(head,'#e8506e',s*R*1.0,R*.35,-R*.3,R*.13,R*.13,R*.13);sph(head,col,s*R*1.18,-R*.15,-R*.3,R*.3,R*.7,R*.3,{rz:s*.15});cone(head,col,s*R*1.25,-R*.75,-R*.3,R*.22,R*.6,{rx:PI,rz:s*.1})}break;
    case 'bun':
      bangs(5,R*.55,R*.5,R*.62);sph(head,col,0,R*1.25,-R*.2,R*.42,R*.38,R*.42);tor(head,'#e8506e',0,R*1.0,-R*.2,R*.36,{rx:PI/2});break;
    case 'mohawk':
      for(let i=0;i<7;i++){const t=i/6;tuft(0,R*(1.0+Math.sin(t*PI)*.18),R*(.7-t*1.4),R*.2,R*(.55+Math.sin(t*PI)*.45),(t-.5)*-.9,0,i%2?col:light)}break;
    case 'curly':
      for(let i=0;i<14;i++){const a=i/14*PI*2,rr=R*.95;sph(head,i%3?col:light,Math.cos(a)*rr,R*.4+Math.sin(i*3)*R*.15,Math.sin(a)*rr*.85-R*.2,R*.36,R*.36,R*.36)}
      for(let i=0;i<5;i++)sph(head,col,(i-2)*R*.3,R*.85,R*.5,R*.3,R*.3,R*.3);
      for(let i=0;i<6;i++){const a=PI*.75+i/5*PI*1.5;sph(head,col,Math.cos(a)*R*1.0,-R*.1,Math.sin(a)*R*1.0-R*.1,R*.32,R*.32,R*.32)}break;
    case 'sidepart':
      bangs(3,R*.4,R*.4,R*.6);
      sph(head,col,R*.35,R*.62,R*.72,R*.62,R*.26,R*.28,{rz:-.5});sph(head,light,-R*.1,R*.7,R*.72,R*.42,R*.22,R*.24,{rz:-.2});break;
    case 'twinbuns':
      bangs(5,R*.55,R*.5,R*.62);
      for(const s of [-1,1]){sph(head,col,s*R*.62,R*1.05,-R*.1,R*.34,R*.34,R*.34);sph(head,'#e8506e',s*R*.62,R*.85,-R*.1,R*.12,R*.12,R*.12)}break;
    case 'wolf':
      bangs(5,R*.6,R*.55,R*.62);
      for(let i=0;i<6;i++){const s=i%2?1:-1,y=-R*(.1+Math.floor(i/2)*.35);tuft(s*R*1.0,y,-R*.2-Math.floor(i/2)*R*.12,R*.2,R*.6,PI,s*.6,i%3?col:dark)}
      tuft(0,R*.15,-R*1.0,R*.28,R*.8,PI-.3,0);tuft(0,-R*.35,-R*1.0,R*.24,R*.7,PI-.2,0,dark);break;
    default:bangs(5,R*.55,R*.5,R*.62);
  }
}

/* ---------- accessories ---------- */
function buildAccessory(root,head,acc,R,outfit,gender){
  const a=TGH.LOOKS.accessory[acc];
  if(a==='glasses'){for(const s of [-1,1])tor(head,'#2a2030',s*R*.42,-R*.08,R*.9,R*.2,{});part(head,cylG(),'#2a2030',0,-R*.08,R*.95,.012,.14,.012,{rz:PI/2,noOutline:true});}
  else if(a==='headband'){tor(head,C.shade(outfit,.1),0,R*.62,0,R*1.06,{rx:PI/2,ol:.01});}
  else if(a==='scarf'){root.userData.scarf=true;tor(root,C.shade(outfit,.15),0,.9,0,.24,{rx:PI/2});box(root,C.shade(outfit,.15),.14,.72,-.05,.1,.34,.06,{rz:.15});}
  else if(a==='cape'){const cp=box(root,C.shade(outfit,-.2),0,.6,-.28,.5,.62,.05,{rx:.12});root.userData.cape=cp;sph(root,'#e8c050',0,.9,-.2,.05,.05,.05);}
  else if(a==='hat'){cone(head,'#3a2a5a',0,R*1.45,0,R*.7,R*1.0,{rz:.1});cyl(head,'#3a2a5a',0,R*.98,0,R*1.35,.05,{});tor(head,'#e8c050',0,R*1.04,0,R*.72,{rx:PI/2,ol:.01});}
  else if(a==='earring'){for(const s of [1])sph(head,'#ffd34a',s*R*1.02,-R*.35,0,.04,.04,.04);}
  else if(a==='ribbon'){const y=R*.95;cone(head,'#e8506e',-R*.3,y,-R*.3,R*.22,R*.4,{rz:PI/2.2});cone(head,'#e8506e',R*.3,y,-R*.3,R*.22,R*.4,{rz:-PI/2.2});sph(head,'#c83a58',0,y,-R*.3,R*.12,R*.12,R*.12);}
}

/* ---------- held items ---------- */
const RC={common:'#c8c0b0',rare:'#5f97e3',epic:'#b56fe3',godlike:'#f2a83a'};
C.buildWeapon=function(fam,rar,el){
  const g=new T.Group(),rc=RC[rar||'common'],ec=el?TGH.EL_COL[el]:rc;
  if(fam==='sword'){
    box(g,'#d8dce6',0,.34,0,.07,.5,.02,{});
    cone(g,'#d8dce6',0,.62,0,.05,.12,{});
    box(g,rc,0,.07,0,.2,.04,.05,{});cyl(g,'#6a4a30',0,-.03,0,.03,.16,{});sph(g,rc,0,-.13,0,.045,.045,.045);
  }else if(fam==='bow'){
    const arc=new T.Mesh(new T.TorusGeometry(.4,.025,8,24,PI),mat('#8a5a2a'));arc.userData.orig=arc.material;arc.rotation.z=-PI/2;arc.position.set(0,.2,0);g.add(arc);
    const arcH=new T.Mesh(new T.TorusGeometry(.4,.045,8,24,PI),hullMat);arcH.rotation.z=-PI/2;arcH.position.set(0,.2,0);arcH.userData.outline=true;g.add(arcH);
    const str=new T.Mesh(new T.CylinderGeometry(.007,.007,.8,4),mat('#f0ead8',{glow:true}));str.position.set(-0,.2,0);str.scale.set(1,1,1);g.add(str);
    // the bow bends toward +x with the string flat: rotate whole thing so the limb faces forward
    sph(g,rc,0,.2,0,.04,.04,.04);
    g.rotation.y=PI/2;g.userData.bow=true;
  }else if(fam==='staff'){
    cyl(g,'#7a5a3a',0,.3,0,.03,.9,{});
    sph(g,ec,0,.82,0,.11,.11,.11,{glow:true});sph(g,ec,0,.82,0,.14,.14,.14,{glow:true,alpha:.35,noOutline:true});
    tor(g,rc,0,.72,0,.1,{rx:PI/2,ol:.01});
    g.userData.orb=g.children[1];
  }
  return g;
};

/* ---------- the hero ---------- */
C.buildHero=function(h){
  const L=h.look,R=.4,girl=h.gender==='f';
  const skin=TGH.LOOKS.skin[L.skin],hair=TGH.LOOKS.hairColor[L.hairColor],outfit=TGH.LOOKS.outfit[L.outfit];
  const root=new T.Group(),rig={type:'hero',root,parts:{}};
  const body=new T.Group();root.add(body);rig.body=body;
  const pants=C.shade(outfit,-.45),boots='#4a3626';
  // legs
  for(const s of [-1,1]){
    const leg=new T.Group();leg.position.set(s*.11,.32,0);body.add(leg);
    cyl(leg,girl?skin:pants,0,-.12,0,.075,.26,{});
    sph(leg,boots,0,-.27,.03,.1,.075,.14,{});
    rig.parts[s<0?'legL':'legR']=leg;
  }
  // torso and skirt
  cyl(body,outfit,0,.58,0,.17,.4,{});part(body,cylG(),outfit,0,.58,0,.17,.4,.17,{noOutline:true});
  const torso=body.children[body.children.length-1];
  if(girl){cone(body,C.shade(outfit,-.12),0,.34,0,.3,.3,{});tor(body,C.shade(outfit,.25),0,.46,0,.2,{rx:PI/2,ol:.01})}
  else{cyl(body,pants,0,.4,0,.19,.12,{});tor(body,'#3a2a1a',0,.45,0,.19,{rx:PI/2,ol:.01});box(body,'#e8c050',0,.45,.19,.06,.05,.02,{})}
  // collar
  tor(body,C.shade(outfit,.3),0,.79,0,.15,{rx:PI/2,ol:.01});
  // arms
  for(const s of [-1,1]){
    const arm=new T.Group();arm.position.set(s*.23,.74,0);body.add(arm);
    cyl(arm,outfit,0,-.1,0,.06,.24,{});sph(arm,skin,0,-.25,0,.07,.07,.07,{});
    arm.rotation.z=s*.12;rig.parts[s<0?'armL':'armR']=arm;
  }
  // head
  const head=new T.Group();head.position.y=1.06;body.add(head);rig.head=head;
  sph(head,skin,0,0,0,R,R*.95,R);
  for(const s of [-1,1])sph(head,skin,s*R*.97,-R*.05,0,.07,.09,.05,{});
  // the face
  const faceGeo=new T.SphereGeometry(R*1.012,24,14,PI/2-.85,1.7,PI/2-.55,1.1);
  const face=new T.Mesh(faceGeo,new T.MeshBasicMaterial({map:paintFace(L,h.gender),transparent:true,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
  face.scale.y=.95;face.userData.face=true;head.add(face);
  buildHair(head,TGH.LOOKS.hairStyle[L.hairStyle],hair,R);
  buildAccessory(body,head,L.accessory,R,outfit,h.gender);
  // gear you can see
  const eq=h.equip||{};
  if(eq.chest){for(const s of [-1,1])sph(body,RC[eq.chest.rarity],s*.22,.82,0,.1,.07,.1,{})}
  if(eq.helmet){tor(head,RC[eq.helmet.rarity],0,R*.5,0,R*1.04,{rx:PI/2,ol:.01});sph(head,RC[eq.helmet.rarity],0,R*.5,R*1.0,.05,.05,.05,{glow:true})}
  if(eq.pants){for(const s of [-1,1])tor(body,RC[eq.pants.rarity],s*.11,.28,0,.09,{rx:PI/2,ol:.008})}
  // weapon in the right hand
  const hand=new T.Group();hand.position.set(0,-.25,.03);rig.parts.armR.add(hand);rig.hand=hand;
  C.setWeapon(rig,h);
  root.userData.rig=rig;
  return rig;
};
C.setWeapon=function(rig,h){
  while(rig.hand.children.length)rig.hand.remove(rig.hand.children[0]);
  const w=h.equip&&h.equip.weapon;
  if(w){const m=C.buildWeapon(w.fam,w.rarity,w.el);m.rotation.x=w.fam==='staff'?0:0;rig.hand.add(m);rig.weapon=m}else rig.weapon=null;
};

/* ---------- monsters ---------- */
const BIO_COL={cave:['#8b7a6a','#4a3e38','#c9b08a'],wilds:['#5f8a45','#2e4a26','#b8e070'],wasteland:['#9a4a34','#4a1e16','#ff9a3a'],summit:['#b8d4e8','#5a7a94','#e8faff'],dark:['#4a3a6a','#1c1230','#c090ff']};
C.palette=function(biome){const b=BIO_COL[biome]||BIO_COL.cave;return {main:b[0],dark:b[1],accent:b[2]}};
function glowEyes(parent,col,x,y,z,s,gap){for(const k of [-1,1]){sph(parent,col,k*gap+x,y,z,s,s*1.2,s*.6,{glow:true});sph(parent,'#14101c',k*gap+x,y,z+s*.2,s*.45,s*.85,s*.3,{glow:true,noOutline:true})}}
C.buildMonster=function(f,biome){
  const K=TGH.KINDS[f.kind]||TGH.KINDS.beast,look=K.look;
  const P=C.palette(biome);if(f.color){P.main=f.color;P.dark=C.shade(f.color,-.45)}
  const eye=f.eye||(biome==='dark'?'#ff6adf':'#ffd34a');
  const root=new T.Group(),rig={type:look,root,parts:{}};const body=new T.Group();root.add(body);rig.body=body;
  const M=P.main,D=P.dark,A=P.accent;
  if(look==='beast'){
    sph(body,M,0,.46,0,.34,.27,.5,{});
    for(const [x,z,k] of [[-1,.28,'fl'],[1,.28,'fr'],[-1,-.28,'bl'],[1,-.28,'br']]){const l=new T.Group();l.position.set(x*.2,.34,z);body.add(l);cyl(l,D,0,-.14,0,.06,.3,{});sph(l,D,0,-.3,.03,.08,.06,.1,{});rig.parts[k]=l}
    const head=new T.Group();head.position.set(0,.62,.46);body.add(head);rig.head=head;
    sph(head,M,0,0,0,.25,.23,.25,{});sph(head,D,0,-.06,.25,.12,.09,.14,{});
    for(const s of [-1,1])cone(head,D,s*.15,.26,-.02,.08,.2,{rz:-s*.25});
    glowEyes(head,eye,0,.04,.2,.055,.11);
    const tail=new T.Group();tail.position.set(0,.5,-.5);body.add(tail);cone(tail,M,0,.12,-.08,.07,.4,{rx:-.9});rig.parts.tail=tail;
    cone(body,A,0,.72,.0,.1,.18,{rz:0}); // mane crest in the land's colour
  }else if(look==='slime'){
    const b=new T.Group();body.add(b);rig.parts.blob=b;
    part(b,sphereG(),M,0,.32,0,.5,.38,.5,{mat:mat(M,{alpha:.88})});sph(b,A,0,.3,0,.18,.14,.18,{glow:true,noOutline:true,alpha:.7});
    for(const s of [-1,1]){sph(b,'#fff',s*.15,.38,.4,.1,.12,.06,{noOutline:true});sph(b,'#14101c',s*.15,.37,.45,.055,.075,.03,{noOutline:true,glow:true})}
    sph(b,'#14101c',0,.24,.46,.07,.025,.03,{noOutline:true,glow:true});
  }else if(look==='wraith'){
    const b=new T.Group();body.add(b);rig.parts.float=b;
    part(b,coneG(),M,0,.55,0,.46,1.0,.46,{mat:mat(M,{alpha:.9,dbl:true}),rx:PI});
    part(b,sphereG(),D,0,1.05,.02,.27,.3,.27,{});
    glowEyes(b,eye,0,1.07,.22,.06,.1);
    for(const s of [-1,1]){const hnd=sph(b,A,s*.42,.7,.2,.09,.09,.09,{glow:true});rig.parts[s<0?'handL':'handR']=hnd}
    sph(b,A,0,.55,.1,.1,.1,.1,{glow:true,alpha:.6,noOutline:true});
  }else if(look==='brute'){
    sph(body,M,0,.62,0,.46,.5,.4,{});sph(body,D,0,.85,.08,.5,.2,.4,{});
    for(const s of [-1,1]){
      const l=new T.Group();l.position.set(s*.2,.25,0);body.add(l);cyl(l,D,0,-.08,0,.14,.3,{});sph(l,D,0,-.22,.04,.16,.1,.2,{});rig.parts[s<0?'legL':'legR']=l;
      const a=new T.Group();a.position.set(s*.5,.8,0);body.add(a);cyl(a,M,0,-.2,0,.12,.42,{});sph(a,A,0,-.48,.04,.17,.17,.17,{});a.rotation.z=s*.2;rig.parts[s<0?'armL':'armR']=a;
    }
    const head=new T.Group();head.position.set(0,1.12,.1);body.add(head);rig.head=head;
    sph(head,M,0,0,0,.22,.2,.22,{});glowEyes(head,eye,0,.02,.17,.045,.08);
    for(const s of [-1,1])cone(head,'#e8e0cc',s*.17,.12,0,.05,.22,{rz:-s*.5});
    cyl(rig.parts.armR,'#6a4a30',0,-.5,.12,.06,.7,{rx:.6});sph(rig.parts.armR,'#6a4a30',0,-.82,.4,.16,.16,.16,{});
  }else if(look==='bat'){
    const b=new T.Group();b.position.y=.9;body.add(b);rig.parts.float=b;
    sph(b,M,0,0,0,.2,.2,.22,{});
    for(const s of [-1,1])cone(b,D,s*.1,.22,0,.05,.16,{});
    glowEyes(b,eye,0,.03,.17,.04,.07);
    for(const s of [-1,1]){const w=new T.Group();w.position.set(s*.16,.04,0);b.add(w);part(w,coneG(),D,s*.3,0,0,.18,.62,.04,{rz:-s*PI/2,mat:mat(D,{dbl:true})});part(w,coneG(),A,s*.3,0,-.02,.1,.42,.03,{rz:-s*PI/2,noOutline:true,mat:mat(A,{dbl:true})});rig.parts[s<0?'wingL':'wingR']=w}
  }else if(look==='spider'){
    sph(body,D,0,.38,-.22,.3,.26,.34,{});sph(body,M,0,.38,.14,.2,.18,.2,{});
    glowEyes(body,eye,0,.44,.3,.04,.06);
    for(let i=0;i<4;i++)for(const s of [-1,1]){const l=new T.Group();l.position.set(s*.12,.38,.1-i*.1);body.add(l);cyl(l,M,s*.22,-.04,0,.025,.5,{rz:s*1.1});cyl(l,D,s*.5,-.18,0,.02,.4,{rz:-s*.4});l.rotation.y=s*(i-1.5)*.35;rig.parts['l'+i+(s<0?'L':'R')]=l}
    sph(body,A,0,.5,-.35,.1,.06,.1,{glow:true,alpha:.8,noOutline:true});
  }else if(look==='serpent'){
    rig.parts.segs=[];
    for(let i=0;i<8;i++){const r=.2-i*.015,s=sph(body,i%2?M:D,0,r,-i*.2+.3,r,r,r*1.1,{});rig.parts.segs.push(s)}
    const head=new T.Group();head.position.set(0,.34,.4);body.add(head);rig.head=head;
    sph(head,M,0,0,0,.2,.16,.24,{});glowEyes(head,eye,0,.05,.18,.04,.09);
    cone(head,A,0,.2,-.05,.05,.2,{});
  }else{ // skeleton
    const head=new T.Group();head.position.set(0,1.0,0);body.add(head);rig.head=head;
    sph(head,'#e8e0cc',0,0,0,.26,.24,.25,{});sph(head,'#e8e0cc',0,-.2,.06,.15,.08,.14,{});
    for(const s of [-1,1]){sph(head,'#14101c',s*.1,.03,.2,.07,.08,.05,{noOutline:true,glow:true});sph(head,eye,s*.1,.03,.23,.03,.03,.02,{glow:true})}
    cyl(body,'#e8e0cc',0,.62,0,.04,.4,{});
    for(let i=0;i<3;i++)tor(body,'#e8e0cc',0,.82-i*.12,0,.2-i*.02,{rx:PI/2,ol:.01});
    sph(body,'#e8e0cc',0,.4,0,.18,.08,.12,{});
    for(const s of [-1,1]){const l=new T.Group();l.position.set(s*.1,.34,0);body.add(l);cyl(l,'#e8e0cc',0,-.15,0,.04,.34,{});sph(l,'#e8e0cc',0,-.33,.04,.06,.04,.1,{});rig.parts[s<0?'legL':'legR']=l;
      const a=new T.Group();a.position.set(s*.24,.88,0);body.add(a);cyl(a,'#e8e0cc',0,-.16,0,.035,.34,{});rig.parts[s<0?'armL':'armR']=a}
    cyl(rig.parts.armR,'#9a8a7a',0,-.4,.12,.025,.5,{rx:.4});box(rig.parts.armR,A,0,-.62,.22,.12,.03,.04,{});
  }
  // elites and bosses: an aura on the ground, a crown or horns
  if(f.elite||f.boss){
    const col=f.boss?(f.eye||'#ff6a6a'):({regen:'#6fd26a',frenzy:'#ff5a3a',warded:'#6ab0e0',colossal:'#c08a4a',thorns:'#c0e04a'}[f.mut]||'#ffd34a');
    const ring=new T.Mesh(new T.RingGeometry(.7,.88,32),new T.MeshBasicMaterial({color:hexOf(col),transparent:true,opacity:.75,side:T.DoubleSide,depthWrite:false}));
    ring.rotation.x=-PI/2;ring.position.y=.03;root.add(ring);rig.ring=ring;
    if(f.boss){const hd=rig.head||body;const hy=look==='wraith'?1.3:look==='brute'?.2:look==='skeleton'?.28:.3;
      for(let i=0;i<5;i++){const a=i/5*PI*2;cone(hd===body?body:hd,'#e8c050',Math.cos(a)*.2,hy+(hd===body?1.1:0),Math.sin(a)*.2,.05,.22,{})}}
  }
  root.userData.rig=rig;
  return rig;
};

/* ---------- animation ---------- */
// Idle motion and walking, called every frame for every rig.
C.animate=function(rig,t,moving,phase){
  const p=rig.parts,b=rig.body,ph=(phase||0);
  const w=moving?Math.sin(t*14+ph):0;
  switch(rig.type){
    case 'hero':
      b.position.y=Math.abs(w)*.06+(moving?0:Math.sin(t*2+ph)*.012);
      if(p.legL){p.legL.rotation.x=w*.7;p.legR.rotation.x=-w*.7}
      if(p.armL){p.armL.rotation.x=-w*.6;if(!rig.swing)p.armR.rotation.x=w*.4;p.armL.rotation.z=-.12-(moving?0:Math.sin(t*2+ph)*.03);p.armR.rotation.z=.12+(moving?0:Math.sin(t*2+ph)*.03)}
      if(rig.head)rig.head.rotation.z=Math.sin(t*1.7+ph)*.025;
      if(rig.weapon&&rig.weapon.userData.orb)rig.weapon.userData.orb.scale.setScalar(1+Math.sin(t*4)*.12);
      break;
    case 'beast':b.position.y=Math.abs(w)*.07;b.rotation.x=moving?w*.05:0;for(const k of ['fl','br'])p[k].rotation.x=w*.8;for(const k of ['fr','bl'])p[k].rotation.x=-w*.8;p.tail.rotation.y=Math.sin(t*6+ph)*.5;if(rig.head)rig.head.rotation.x=Math.sin(t*2+ph)*.04;break;
    case 'slime':{const s=Math.sin(t*3+ph);p.blob.scale.set(1+s*.07,1-s*.09+(moving?Math.abs(w)*.1:0),1+s*.07);break}
    case 'wraith':p.float.position.y=.22+Math.sin(t*2+ph)*.1;p.handL.position.y=.7+Math.sin(t*3)*.07;p.handR.position.y=.7+Math.cos(t*3)*.07;break;
    case 'brute':b.position.y=Math.abs(w)*.06;p.legL.rotation.x=w*.6;p.legR.rotation.x=-w*.6;if(!rig.swing){p.armL.rotation.x=-w*.4+Math.sin(t*1.6+ph)*.05;p.armR.rotation.x=w*.4}b.rotation.z=moving?w*.03:Math.sin(t*1.3+ph)*.015;break;
    case 'bat':p.float.position.y=.9+Math.sin(t*3+ph)*.1;p.wingL.rotation.z=Math.sin(t*14+ph)*.7;p.wingR.rotation.z=-Math.sin(t*14+ph)*.7;break;
    case 'spider':b.position.y=Math.abs(w)*.03+Math.sin(t*3+ph)*.01;for(let i=0;i<4;i++){const s=Math.sin(t*(moving?16:2)+i*1.2+ph)*(moving?.35:.06);p['l'+i+'L'].rotation.z=s;p['l'+i+'R'].rotation.z=-s}break;
    case 'serpent':p.segs.forEach((s,i)=>{s.position.x=Math.sin(t*(moving?8:2.5)-i*.7+ph)*.16});if(rig.head)rig.head.position.x=Math.sin(t*(moving?8:2.5)+.7+ph)*.16;break;
    case 'skeleton':b.position.y=Math.abs(w)*.05;p.legL.rotation.x=w*.7;p.legR.rotation.x=-w*.7;if(!rig.swing){p.armL.rotation.x=-w*.5;p.armR.rotation.x=w*.5}if(rig.head)rig.head.rotation.z=Math.sin(t*2.2+ph)*.05;break;
  }
  if(rig.ring)rig.ring.rotation.z=t*.8;
};
})();
