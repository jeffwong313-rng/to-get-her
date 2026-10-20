/* To Get Her: the game itself. Runs the adventure: exploring the hex map with fog and Action Points, alternating turns between
   the two heroes, the XCOM-style battles, rewards, events and the way home. Drawing lives in art.js, menus in ui.js. */
(function(){
'use strict';
const TGH=window.TGH=window.TGH||{};
const A=TGH.art;
const {rnd,ri,rand,pick,chance,clamp,weighted,uid,dist,cap}=TGH;
const G=TGH.game={s:null,mode:'title',busy:false,sel:null,pend:null};
const ui=()=>TGH.ui;
const sleep=ms=>A.wait(A.S(ms));
const SAVE_KEY='to-get-her-save';
const VERSION=1;
G.settings={fast:false};

/* ---------- save and load ---------- */
const stripper=(k,v)=>(k==='rig'||k==='obj')?undefined:v;
G.save=function(){
  if(!G.s)return;
  try{localStorage.setItem(SAVE_KEY,JSON.stringify({v:VERSION,s:G.s,settings:G.settings},stripper))}catch(e){}
};
G.hasSave=()=>{try{return !!localStorage.getItem(SAVE_KEY)}catch(e){return false}};
G.exportSave=()=>btoa(unescape(encodeURIComponent(JSON.stringify({v:VERSION,s:G.s,settings:G.settings},stripper))));
G.importSave=function(code){
  try{const o=JSON.parse(decodeURIComponent(escape(atob(code.trim()))));if(!o||!o.s||!o.s.heroes)return false;localStorage.setItem(SAVE_KEY,JSON.stringify(o));return true}catch(e){return false}
};
G.load=function(){
  try{
    const o=JSON.parse(localStorage.getItem(SAVE_KEY));if(!o||!o.s)return false;
    G.s=o.s;Object.assign(G.settings,o.settings||{});A.fast=!!G.settings.fast;
    for(const h of G.s.heroes){h.rig=null;TGH.recalc(h,G.s.town)}
    return true;
  }catch(e){return false}
};
G.wipeSave=()=>{try{localStorage.removeItem(SAVE_KEY)}catch(e){}};

/* ---------- a new game ---------- */
G.newGame=function(setup){
  // setup: {heroes:[{name,gender,look,base}], relation, sister:{name,whose}}
  const heroes=setup.heroes.map(o=>{
    const h=TGH.newHero(o);
    const fam=TGH.bestWeaponFor(h);
    const names={sword:'Practice Sword',bow:'Practice Bow',staff:'Oak Staff'};
    h.equip.weapon={id:uid(),slot:'weapon',fam,rarity:'common',ilvl:1,plus:0,base:5,affixes:[],name:names[fam]};
    TGH.recalc(h,{});h.hp=h.maxHp;h.mp=h.maxMp;h.ap=h.maxAp;
    return h;
  });
  G.s={heroes,relation:setup.relation,sister:setup.sister,town:TGH.newTown(),run:null,seen:{}};
  // a spare bow and staff for whoever wants to try them
  const spare=[{fam:'bow',name:'Spare Bow'},{fam:'staff',name:'Spare Staff'},{fam:'sword',name:'Spare Sword'}];
  for(const sp of spare)if(!heroes.some(h=>h.equip.weapon.fam===sp.fam))G.s.town.pack.push({id:uid(),slot:'weapon',fam:sp.fam,rarity:'common',ilvl:1,plus:0,base:5,affixes:[],name:sp.name});
  G.save();
};

/* ---------- helpers ---------- */
const S_=()=>G.s,R_=()=>G.s.run;
G.heroes=()=>G.s.heroes;
G.active=()=>G.s.heroes[R_().turn.hero];
G.foes=()=>R_().battle?R_().battle.foes.filter(f=>!f.down):[];
G.allFoes=()=>R_().battle?R_().battle.foes:[];
G.live=()=>G.s.heroes.filter(h=>!h.down);
const idx=(c,r)=>r*R_().map.w+c;
G.tileAt=(c,r)=>R_().map.tiles[idx(c,r)];
const unitAt=(c,r)=>{for(const h of G.s.heroes)if(h.c===c&&h.r===r)return h;for(const f of G.allFoes())if(!f.down&&f.c===c&&f.r===r)return f;return null};
G.unitAt=unitAt;
const entAt=(c,r)=>R_().map.ents.find(e=>!e.gone&&e.c===c&&e.r===r);
const isMonsterEnt=e=>e.type==='pack'||e.type==='elite'||e.type==='boss';
const passableFor=(unit)=>(c,r)=>{
  if(c<0||c>=R_().map.w||r<0||r>=R_().map.h)return false;
  if(TGH.BLOCKS_MOVE.has(R_().map.tiles[idx(c,r)]))return false;
  const u=unitAt(c,r);if(u&&u!==unit)return false;
  const e=entAt(c,r);if(e&&isMonsterEnt(e))return false;
  return true;
};
G.reachMap=function(h,budget){
  return TGH.search(R_().map,{c:h.c,r:h.r},passableFor(h),budget);
};
const tell=(msg,cls)=>{ui()&&ui().log(msg,cls)};
const kindOf=(biome,name)=>{const m=TGH.BIOMES[biome].mons.find(x=>x[0]===name);return m?m[1]:'beast'};
G.sisterName=()=>(G.s.sister&&G.s.sister.name)||'Mira';

/* ---------- starting an adventure ---------- */
G.startRun=function(biome){
  const s=G.s,B=TGH.BIOMES[biome];
  const seed=(Math.random()*1e9)|0;
  const map=TGH.genMap(biome,seed);
  let bossName=B.boss;
  if(bossName==='cave'){
    const all=Object.keys(TGH.CAVE_BEASTS),left=all.filter(n=>!(s.town.caveBeaten||[]).includes(n));
    bossName=pick(left.length?left:all);
  }
  for(const h of s.heroes){h.st={};h.down=false;h.hp=h.maxHp;h.mp=h.maxMp;h.ap=h.maxAp}
  const boss=map.ents.find(e=>e.type==='boss');boss.name=bossName;
  s.run={biome,map,vis:new Array(map.w*map.h).fill(0),loot:{gold:0,mats:{},xp:0},turn:{hero:0,bank:0,round:1},battle:null,bossName,bossBeaten:false,rounds:0,foesKilled:0,log:[]};
  s.heroes[0].c=map.start[0].c;s.heroes[0].r=map.start[0].r;
  s.heroes[1].c=map.start[1].c;s.heroes[1].r=map.start[1].r;
  G.enterRun(true);
};
// Build the scene from the run in the save (a fresh start or a loaded one).
G.enterRun=function(fresh){
  const run=R_(),map=run.map,s=G.s;
  A.setBiome(run.biome);A.buildMap(map);
  // start markers
  for(const st of map.start)A.addEnt({id:'start'+st.c,type:'start',c:st.c,r:st.r});
  for(const e of map.ents){
    if(e.gone&&e.type!=='camp')continue;
    A.addEnt(e);
    if(isMonsterEnt(e))G.buildEntMonsters(e);
  }
  if(run.bossBeaten)G.addExitPortal();
  for(const h of s.heroes){h.rig=null;A.addUnit(h);if(h.down)A.die(h)}
  if(run.battle){for(const f of run.battle.foes){f.rig=null;A.addUnit(f);if(f.down){f.rig.root.visible=false}}}
  G.computeVis();
  G.mode=run.battle?'battle':'explore';
  G.sel=null;G.pend=null;G.busy=false;
  A.show('map');
  A.focus(G.active().c,G.active().r,true);
  G.startHeroTurn(run.turn.hero,{keepAp:!fresh});
  if(fresh){ui().banner('The way in','Row by row, find the way up. '+TGH.BIOMES[run.biome].flavor,2600)}
};
G.addExitPortal=function(){
  const run=R_();if(run.exitEnt)return;
  const b=run.map.bossPos;const e={id:'exit',type:'exit',c:b.c,r:b.r};run.exitEnt=e;A.addEnt(e);
};
// Show a monster pack, elite or boss on the map as little living models.
G.buildEntMonsters=function(e){
  const run=R_(),biome=run.biome,B=TGH.BIOMES[biome];
  const root=e.obj;e.rigs=[];
  const mk=(name,opts,sc,x,z)=>{
    const f=TGH.makeFoe(name,kindOf(biome,name),1,Object.assign({biome},opts||{}));
    const rig=TGH.chars.buildMonster(f,biome);rig.root.scale.setScalar(sc);rig.root.position.set(x,0,z);rig.phase=Math.random()*6;
    rig.root.rotation.y=Math.PI;root.add(rig.root);e.rigs.push(rig);
  };
  if(e.type==='pack'){e.names.forEach((n,i)=>{const a=i/3*Math.PI*2+.4;mk(n,{},.62,Math.cos(a)*.42,Math.sin(a)*.42)})}
  else if(e.type==='elite')mk(e.name,{elite:true,mut:e.mut},1.25,0,0);
  else if(e.type==='boss'){
    const def=TGH.CAVE_BEASTS[e.name]||TGH.BOSSES[e.name];
    mk(e.name,{def,kind:def.kind},1.7,0,0);
  }
  if(!e.gone)A.refreshEnt(e);
};

/* ---------- fog of war ---------- */
G.computeVis=function(){
  const run=R_(),m=run.map,vis=run.vis;
  for(let i=0;i<vis.length;i++)if(vis[i]===2)vis[i]=1;
  const see=(c,r,rad)=>{
    for(const h of TGH.ring(c,r,rad,m.w,m.h)){
      const k=h.r*m.w+h.c;if(vis[k]===2)continue;
      if(TGH.los(m,{c,r},h))vis[k]=2;
    }
  };
  for(const h of G.s.heroes)see(h.c,h.r,h.sight);
  if(run.battle)for(const f of run.battle.foes)if(!f.down)see(f.c,f.r,1);
  A.setFog(vis);
};

/* ---------- turns ---------- */
G.startHeroTurn=function(i,o){
  o=o||{};const run=R_(),s=G.s;let h=s.heroes[i];
  if(h.down){const j=1-i;if(!s.heroes[j].down){i=j;h=s.heroes[j]}else return G.defeat()}
  run.turn.hero=i;
  if(!o.keepAp){
    tickStatuses(h);
    h.ap=h.maxAp;run.turn.bank=0;
    if(G.mode==='battle'&&h.st.apBonus){h.ap+=h.st.apBonus;delete h.st.apBonus}
  }
  G.sel=null;G.pend=null;A.clearAllOverlays();
  A.focus(h.c,h.r);
  if(!o.keepAp)ui().turnBanner(h,G.mode==='battle');
  ui().refresh();
  if(!o.keepAp)G.save();
};
function tickStatuses(u){
  for(const k of Object.keys(u.st)){
    const v=u.st[k];if(v&&typeof v==='object'&&v.n!=null){v.n--;if(v.n<=0)delete u.st[k]}
    else if(k==='imbue'){u.st.imbue--;if(u.st.imbue<=0)delete u.st.imbue}
  }
}
G.endTurn=async function(){
  if(G.busy)return;G.busy=true;G.sel=null;G.pend=null;A.clearAllOverlays();
  const run=R_(),s=G.s,i=run.turn.hero;
  run.turn.bank=0;
  try{
    if(G.mode==='battle'){
      const other=1-i;
      if(i===0&&!s.heroes[other].down){G.busy=false;return G.startHeroTurn(other)}
      if(i===1||s.heroes[other].down){
        if(i===0&&s.heroes[other].down||i===1){await G.foePhase();run.battle&&(run.battle.round++);
          if(G.mode!=='battle'){G.busy=false;return}
          G.busy=false;return G.startHeroTurn(s.heroes[0].down?1:0)}
      }
    }else{
      const other=1-i;G.busy=false;
      return G.startHeroTurn(s.heroes[other].down?i:other);
    }
  }finally{G.busy=false}
};

/* ---------- movement ---------- */
G.moveBudget=function(h){return R_().turn.bank+h.ap*h.move};
// Find the cheapest way to a hex and what it would cost, or null.
G.planMove=function(h,c,r){
  const run=R_(),budget=G.moveBudget(h);
  const res=G.reachMap(h,budget);
  const path=TGH.pathTo(run.map,res,{c,r});
  if(!path||!path.length)return null;
  const L=path.length,need=Math.max(0,L-run.turn.bank),apCost=Math.ceil(need/h.move);
  return {c,r,path,L,apCost,ok:apCost<=h.ap};
};
G.showMoveRange=function(){
  const h=G.active(),res=G.reachMap(h,G.moveBudget(h)),list=[];
  for(const [k,d] of res.dist){if(d===0)continue;list.push({c:k%R_().map.w,r:Math.floor(k/R_().map.w)})}
  A.setOverlay('move',list,'#5ab0ff');
};
G.doMove=async function(plan){
  const h=G.active(),run=R_();
  G.busy=true;G.pend=null;A.clearAllOverlays();ui().refresh();
  let interrupted=false;
  for(const step of plan.path){
    // pay for the step: banked movement first, then a fresh AP
    if(run.turn.bank>0)run.turn.bank--;
    else{if(h.ap<=0)break;h.ap--;run.turn.bank+=h.move-1}
    A.focus(step.c,step.r);
    await A.moveAlong(h,[step]);
    G.computeVis();ui().refresh();
    const stop=await G.afterStep(h);
    if(stop){interrupted=true;break}
  }
  G.busy=false;
  if(G.mode==='battle'||!interrupted)A.focus(h.c,h.r);
  ui().refresh();
  G.checkAutoEnd();
  G.save&&G.mode==='explore'&&!G.busy&&G.save();
};
G.checkAutoEnd=function(){
  if(G.busy||G.mode==='title')return;
  const h=G.active();
  if(h&&h.ap<=0&&R_().turn.bank<=0&&!R_().modal)setTimeout(()=>{if(!G.busy&&G.active()===h&&h.ap<=0&&R_().turn.bank<=0&&!document.querySelector('.modal'))G.endTurn()},500);
};
// After every hex a hero enters: does anything wake up or wait here?
G.afterStep=async function(h){
  const run=R_();
  if(!run.battle){
    for(const e of run.map.ents){
      if(e.gone)continue;
      const d=dist(h,e);
      if((e.type==='elite'||e.type==='boss')&&d<=2){await G.beginBattle(e,h);return true}
      if(e.type==='pack'&&d<=1){await G.beginBattle(e,h);return true}
    }
  }
  const e=entAt(h.c,h.r);
  if(e){
    if(e.type==='camp'){await G.useCamp(e,h);return false}
    if(e.type==='q'){await G.useQuestion(e,h);return G.mode==='battle'}
    if(e.type==='chest'){await G.openChest(e,h);return G.mode==='battle'}
    if(e.type==='mat'){G.takeMat(e,h);return false}
  }
  if(run.exitEnt&&h.c===run.exitEnt.c&&h.r===run.exitEnt.r){G.finishAdventure();return true}
  return false;
};

/* ---------- things on the map ---------- */
G.useCamp=async function(e,h){
  const run=R_();e.gone=true;
  const obj=e.obj;if(obj&&obj.userData.flame)obj.userData.flame.forEach(f=>f.scale.set(.5,.5,.5));
  for(const x of G.s.heroes){
    if(x.down){x.down=false;x.hp=Math.round(x.maxHp*.3);A.revive(x)}
    x.hp=Math.min(x.maxHp,x.hp+Math.round(x.maxHp*.4));x.mp=Math.min(x.maxMp,x.mp+Math.round(x.maxMp*.4));
    A.fx.sparkles(A.unitPos(x),'#ffcf6a',12,.6);
    ui().float(x,'+'+Math.round(x.maxHp*.4),'heal');
  }
  tell('You rest by the fire. Both heroes recover 40% health and mana.','good');
  ui().refresh();await sleep(700);
};
G.takeMat=function(e,h){
  e.gone=true;A.refreshEnt(e);
  const run=R_();run.loot.mats[e.mat]=(run.loot.mats[e.mat]||0)+e.amt;
  A.fx.sparkles(A.unitPos(h),TGH.MATS[e.mat].col,10,.8);
  ui().float(h,'+'+e.amt+' '+TGH.MATS[e.mat].n,'mat');
  tell(`Picked up ${e.amt} ${TGH.MATS[e.mat].n}.`,'good');
  A.refreshEnt(e);
};
G.addItem=function(it){
  const town=G.s.town,cap_=TGH.vaultCap(town.b.vault||1);
  town.pack.push(it);
  if(town.pack.length>cap_){
    // sell the least valuable piece to make room
    town.pack.sort((a,b)=>TGH.sellValue(a)-TGH.sellValue(b));
    const out=town.pack.shift();const v=TGH.sellValue(out);R_()&&(R_().loot.gold+=v);
    tell(`The pack is full. ${out.name} was sold for ${v} gold.`,'warn');
  }
};
G.rollLoot=function(level,lift,n){
  const out=[];for(let i=0;i<n;i++){const it=TGH.makeItem(level,{lift});G.addItem(it);out.push(it)}return out;
};
G.openChest=async function(e,h){
  const run=R_();e.gone=true;A.refreshEnt(e);
  if(chance(.12)){
    tell('The chest bites back! A mimic!','bad');
    const lvl=TGH.foeLevel(run.biome,e.r,run.map.h,1);
    const foes=[TGH.makeFoe('Mimic','brute',lvl,{biome:run.biome,elite:true,color:'#8a5a2a'})];
    await G.beginBattle({id:uid(),type:'ambush',c:e.c,r:e.r,custom:foes},h);return;
  }
  const lvl=TGH.foeLevel(run.biome,e.r,run.map.h,0);
  const gold=Math.round(ri(10,22)*Math.pow(lvl,.85));run.loot.gold+=gold;
  const items=chance(.65)?G.rollLoot(lvl,.4,1):[];
  A.fx.sparkles(A.unitPos(h),'#ffe27a',16,1);
  tell(`Chest: ${gold} gold${items.length?' and '+items.map(i=>i.name).join(', '):''}.`,'good');
  await ui().showLoot('Chest opened',gold,items);
};
const EVENTS={spring:15,cache:20,stranger:12,ambush:15,shrine:12,lore:12,trap:14};
G.useQuestion=async function(e,h){
  const run=R_();e.gone=true;A.refreshEnt(e);
  const kind=weighted(EVENTS),lvl=TGH.foeLevel(run.biome,e.r,run.map.h,0),sis=G.sisterName();
  if(kind==='spring'){
    for(const x of G.s.heroes){if(!x.down){x.hp=Math.min(x.maxHp,x.hp+Math.round(x.maxHp*.3));x.mp=Math.min(x.maxMp,x.mp+Math.round(x.maxMp*.3))}}
    A.fx.sparkles(A.unitPos(h),'#8fe0ff',20,1);
    await ui().eventBox('A quiet spring','Clear water bubbles from the rock. Both heroes drink and recover 30% health and mana.',[{label:'Refreshed'}]);
  }else if(kind==='cache'){
    const gold=Math.round(ri(12,28)*Math.pow(lvl,.85)),mat=pick(TGH.BIOMES[run.biome].mat);run.loot.gold+=gold;run.loot.mats[mat]=(run.loot.mats[mat]||0)+1;
    await ui().eventBox('A hidden cache','Someone left supplies under a loose stone: '+gold+' gold and 1 '+TGH.MATS[mat].n+'.',[{label:'Take it'}]);
  }else if(kind==='stranger'){
    const bet=Math.max(10,Math.round(lvl*8));
    const pick_=await ui().eventBox('A hooded stranger','“A game, travellers? Wager '+bet+' gold of your haul. Win and I double it.”',[{label:'Play ('+bet+' gold)',v:'play'},{label:'Walk away',v:'no'}]);
    if(pick_==='play'){
      const win=chance(.42+Math.min(.2,h.stats.lck*.02));
      if(win){run.loot.gold+=bet;await ui().eventBox('Lucky!','The dice fall your way. +'+bet+' gold.',[{label:'Nice'}])}
      else{run.loot.gold=Math.max(0,run.loot.gold-bet);await ui().eventBox('Unlucky','The stranger grins and pockets your wager. -'+bet+' gold from this haul.',[{label:'Ugh'}])}
    }
  }else if(kind==='ambush'){
    await ui().eventBox('Ambush!','Shapes drop from the dark. They were waiting for you.',[{label:'To arms'}]);
    const B=TGH.BIOMES[run.biome];
    const names=[pick(B.mons)[0],pick(B.mons)[0],pick(B.mons)[0]];
    const foes=names.map(n=>TGH.makeFoe(n,kindOf(run.biome,n),lvl,{biome:run.biome}));
    await G.beginBattle({id:uid(),type:'ambush',c:e.c,r:e.r,custom:foes},h);
  }else if(kind==='shrine'){
    const stats=TGH.shuffle(TGH.STATS).slice(0,3);
    const v=await ui().eventBox('A shrine','A small stone shrine hums. “Take a blessing,” a voice seems to say. '+h.name+' may gain +1 to one stat for good.',stats.map(k=>({label:'+1 '+TGH.STATFULL[k],v:k})));
    if(v){h.base[v]++;TGH.recalc(h,G.s.town);h.hp=Math.min(h.maxHp,h.hp+3)}
  }else if(kind==='lore'){
    const lines=[
      `A scrap of cloth snagged on a thorn. It looks like it came from ${sis}'s scarf. You tuck it away and walk faster.`,
      `Small footprints in the dust, and then none at all, as if ${sis} was lifted from the ground. Your heart pounds.`,
      `A wall of old carvings: a doorway at the top of the world, and a figure in a crown. The darkness started there.`,
      `You hear a faint song carried on the wind, the one ${sis} used to hum. You are going the right way.`];
    G.s.seen.lore=(G.s.seen.lore||0)+1;
    const ln=lines[(G.s.seen.lore-1)%lines.length];
    for(const x of G.s.heroes){const r=TGH.gainXp(x,15+lvl*4,G.s.town)}
    await ui().eventBox('A clue',ln+' (Both heroes gain experience.)',[{label:'Onward'}]);
    ui().checkLevelUps();
  }else{
    const dmg=Math.round(h.maxHp*(chance(h.stats.lck*.03)?.08:.18));h.hp=Math.max(1,h.hp-dmg);
    A.fx.burst(A.unitPos(h),'#ff6a6a',12);ui().float(h,'-'+dmg,'dmg');
    await ui().eventBox('A trap!','Hidden spikes snap up. '+h.name+' takes '+dmg+' damage.',[{label:'Ouch'}]);
  }
  ui().refresh();
};

/* ---------- battles ---------- */
G.beginBattle=async function(ent,trigHero){
  const run=R_();
  G.busy=true;G.sel=null;G.pend=null;A.clearAllOverlays();
  const lvl=TGH.foeLevel(run.biome,ent.r,run.map.h,0),biome=run.biome,B=TGH.BIOMES[biome];
  let foes=[];
  if(ent.custom)foes=ent.custom;
  else if(ent.type==='pack')foes=ent.names.map(n=>TGH.makeFoe(n,kindOf(biome,n),lvl,{biome}));
  else if(ent.type==='elite'){
    foes=[TGH.makeFoe(ent.name,kindOf(biome,ent.name),lvl+2,{biome,elite:true,mut:ent.mut})];
    const m=pick(B.mons)[0];foes.push(TGH.makeFoe(m,kindOf(biome,m),lvl,{biome}));
  }else if(ent.type==='boss'){
    const def=TGH.CAVE_BEASTS[ent.name]||TGH.BOSSES[ent.name];
    foes=[TGH.makeFoe(ent.name,def.kind,lvl+3,{biome,def,kind:def.kind})];
    for(let i=0;i<2;i++){const m=pick(B.mons)[0];const f=TGH.makeFoe(m,kindOf(biome,m),lvl,{biome});f.maxHp=Math.round(f.maxHp*.7);f.hp=f.maxHp;foes.push(f)}
  }
  // find them places, starting at the spot they were standing
  const taken=new Set(),free=[];
  const ok=(c,r)=>!TGH.BLOCKS_MOVE.has(run.map.tiles[idx(c,r)])&&!unitAt(c,r)&&!taken.has(idx(c,r));
  const cands=TGH.ring(ent.c,ent.r,4,run.map.w,run.map.h).filter(h=>ok(h.c,h.r)).sort((a,b)=>dist(a,ent)-dist(b,ent)||rnd()-.5);
  for(const f of foes){
    const spot=cands.find(h=>ok(h.c,h.r));if(!spot){f.down=true;continue}
    taken.add(idx(spot.c,spot.r));f.c=spot.c;f.r=spot.r;
  }
  foes=foes.filter(f=>!f.down);
  run.battle={foes,ent:ent.id,entRef:ent.type==='ambush'?null:ent.id,round:1};
  // the pack on the map becomes the pack on the field
  if(ent.type!=='ambush'){ent.gone=true;if(ent.obj)ent.obj.visible=false}
  G.mode='battle';
  for(const f of foes){A.addUnit(f);f.rig.root.rotation.y=Math.PI}
  G.computeVis();
  A.focus(ent.c,ent.r);
  ui().battleBanner(foes);
  A.fx.ring(A.unitPos(foes[0]),'#ff6a6a',700);
  await sleep(1300);
  // Elites and bosses that aggro a lone hero leave the partner to catch up. The trigger hero keeps the rest of their turn.
  G.busy=false;
  G.startHeroTurn(run.turn.hero,{keepAp:true});
  ui().refresh();
  G.checkAutoEnd();
};

/* ---------- choosing and using actions ---------- */
G.rangeOf=function(h,skill){return skill?TGH.skillRange(h,skill):TGH.attackRange(h)};
G.canTarget=function(h,skill,tc,tr){
  const rg=G.rangeOf(h,skill);const d=dist(h,{c:tc,r:tr});
  if(d>rg)return false;if(d>1&&!TGH.los(R_().map,h,{c:tc,r:tr}))return false;return true;
};
G.hexesInRange=function(h,rg){
  const m=R_().map;return TGH.ring(h.c,h.r,rg,m.w,m.h).filter(x=>!(x.c===h.c&&x.r===h.r)&&(dist(h,x)<=1||TGH.los(m,h,x)));
};
G.chooseAction=function(kind,skill){
  if(G.busy)return;
  const h=G.active();G.pend=null;A.clearAllOverlays();
  if(kind==='attack')skill=null;
  const apCost=skill?skill.ap:TGH.BASIC_AP;
  if(h.ap<apCost){ui().toast('Not enough AP.');return}
  if(skill&&h.mp<TGH.skillMp(h,skill)){ui().toast('Not enough mana.');return}
  G.sel={kind,skill};
  const tgt=skill?skill.tgt:'enemy';
  if(tgt==='self'||tgt==='party'){G.pend={type:'act',skill,target:h,self:true};ui().refresh();return}
  const rg=G.rangeOf(h,skill);
  A.setOverlay('range',G.hexesInRange(h,rg),tgt==='enemy'?'#ff6a6a':'#6aff9a');
  const marks=[];
  if(tgt==='enemy')for(const f of G.foes())if(G.canTarget(h,skill,f.c,f.r))marks.push(f);
  if(tgt==='ally')for(const x of G.s.heroes)if(!x.down&&(x===h||G.canTarget(h,skill,x.c,x.r)))marks.push(x);
  if(tgt==='fallen')for(const x of G.s.heroes)if(x.down&&G.canTarget(h,skill,x.c,x.r))marks.push(x);
  A.setOverlay('targets',marks.map(u=>({c:u.c,r:u.r})),'#ffe27a');
  if(!marks.length)ui().toast(tgt==='enemy'?'Nobody in range. Move closer first.':'No one to target.');
  ui().refresh();
};
G.cancel=function(){G.sel=null;G.pend=null;A.clearAllOverlays();ui().refresh()};
// Tapping a hex on the map.
G.tapHex=function(c,r){
  if(G.busy||(G.mode!=='explore'&&G.mode!=='battle'))return;
  const h=G.active();const u=unitAt(c,r);
  // with an action selected, tapping picks a target
  if(G.sel){
    const sk=G.sel.skill,tgt=sk?sk.tgt:'enemy';
    let ok=false,target=null;
    if(tgt==='enemy'){target=u&&u.team==='foe'&&!u.down?u:null;ok=target&&G.canTarget(h,sk,c,r)}
    else if(tgt==='ally'){target=u&&u.team==='hero'&&!u.down?u:null;ok=target&&(target===h||G.canTarget(h,sk,c,r))}
    else if(tgt==='fallen'){target=u&&u.team==='hero'&&u.down?u:null;ok=target&&G.canTarget(h,sk,c,r)}
    else{G.cancel();return}
    if(target&&ok){
      if(G.pend&&G.pend.target===target){G.confirm();return}
      G.pend={type:'act',skill:sk,target};
      A.clearOverlay('preview');
      A.setOverlay('preview',G.affected(h,sk,target).map(x=>({c:x.c,r:x.r})),'#ff3a3a');
      ui().refresh();return;
    }
    if(target&&!ok){ui().toast('Out of range ('+dist(h,{c,r})+' hexes away, reach '+G.rangeOf(h,sk)+').');return}
    G.cancel();// fall through to a plain move
  }
  if(u&&u.team==='foe'&&!u.down){
    // a quick attack: tap an enemy to preview your basic attack on it
    if(h.ap<TGH.BASIC_AP){ui().toast('Not enough AP.');return}
    if(!G.canTarget(h,null,c,r)){ui().toast(u.name+' is '+dist(h,u)+' hexes away. Your reach is '+G.rangeOf(h,null)+'. Move closer.');ui().inspect(u);return}
    G.sel={kind:'attack',skill:null};G.pend={type:'act',skill:null,target:u};
    A.setOverlay('preview',G.affected(h,null,u).map(x=>({c:x.c,r:x.r})),'#ff3a3a');ui().refresh();return;
  }
  if(u&&u.team==='hero'){A.focus(u.c,u.r);ui().inspect(u);return}
  // move
  if(G.pend&&G.pend.type==='move'&&G.pend.c===c&&G.pend.r===r){G.confirm();return}
  const plan=G.planMove(h,c,r);
  if(!plan){const e=entAt(c,r);if(e&&isMonsterEnt(e)){ui().toast('Walk up to it to start a fight.');return}A.clearOverlay('path');G.pend=null;ui().refresh();return}
  G.pend={type:'move',c,r,plan};
  A.setPath(plan.path,{c:h.c,r:h.r},plan.ok);
  ui().refresh();
};
G.confirm=function(){
  if(G.busy||!G.pend)return;
  const p=G.pend;
  if(p.type==='move'){if(!p.plan.ok){ui().toast('Not enough AP for that move.');return}G.doMove(p.plan)}
  else if(p.type==='act')G.doAction(G.active(),p.skill,p.target);
};
// The foes a strike would touch, for the red preview.
G.affected=function(h,skill,target){
  const out=[];
  const aoe=skill&&skill.aoe||0;
  if(!aoe||skill.tgt!=='enemy'){return [target]}
  for(const f of G.foes())if(dist(f,target)<=aoe)out.push(f);
  return out.length?out:[target];
};

/* ---------- doing the thing ---------- */
const hit=(h,f,skill,mult)=>TGH.strike(h,f,skill,{});
G.doAction=async function(h,skill,target){
  const run=R_();G.busy=true;
  const apCost=skill?skill.ap:TGH.BASIC_AP,mp=skill?TGH.skillMp(h,skill):0;
  G.pend=null;G.sel=null;A.clearAllOverlays();
  if(h.ap<apCost||h.mp<mp){G.busy=false;ui().toast('Not enough AP or mana.');return}
  h.ap-=apCost;h.mp-=mp;ui().refresh();
  A.focus(target.c,target.r);
  try{
    if(!skill||skill.tgt==='enemy')await G.attackSequence(h,skill,target);
    else await G.supportSequence(h,skill,target);
  }finally{}
  // clean up deaths
  G.computeVis();
  const dead=G.foes().length===0&&run.battle;
  if(dead){await G.victory();return}
  if(G.live().length===0){G.busy=false;await G.defeat();return}
  G.busy=false;A.focus(h.c,h.r);ui().refresh();
  G.checkAutoEnd();
};
const elCol=el=>TGH.EL_COL[el]||'#ffffff';
G.attackSequence=async function(h,skill,target){
  const fam=h.fam;
  let victims=[target];
  if(skill&&skill.aoe)victims=G.affected(h,skill,target);
  const ranged=(skill?(skill.range==='bow'||skill.range==='mage'):(fam==='bow'||fam==='staff'));
  const el=TGH.attackElement(h,skill);
  const col=el==='prism'?'#ffffff':elCol(el==='physical'?'physical':el);
  // wind up
  if(ranged&&(skill?skill.range==='mage':fam==='staff')){await A.cast(h,col)}
  else if(ranged){A.faceHex(h,target.c,target.r)}
  let lunge=null;
  if(!ranged){lunge=await A.lunge(h,target.c,target.r,.55)}
  const nHits=skill&&skill.hits||1;
  let totalDmg=0,kills=0,drainBase=0;
  const chainHit=new Set();
  for(let n=0;n<nHits;n++){
    let tgts=victims.filter(v=>!v.down);
    if(skill&&skill.id==='hail')tgts=[pick(G.foes().filter(f=>dist(f,target)<=skill.aoe)||[target])||target];
    if(!tgts.length)break;
    if(ranged&&n===0||skill&&skill.id==='hail'){
      const magic=skill?skill.range==='mage':fam==='staff';
      await Promise.all(tgts.slice(0,3).map(t=>A.fx.projectile(A.unitPos(h),A.unitPos(t),magic?'orb':'arrow',col)));
    }
    for(const t of tgts){
      if(t.down)continue;
      const r=TGH.strike(h,t,skill,{});
      if(!r.hit){ui().float(t,'Miss','miss');tell(`${h.name}'s ${skill?skill.n:'attack'} misses ${t.name}.`);continue}
      let dmg=r.dmg;
      if(n===0&&tgts.length>1&&t!==target&&!skill.hits)dmg=Math.round(dmg*.9);
      applyDamage(h,t,dmg,r,skill);
      totalDmg+=dmg;drainBase+=dmg;
      A.fx.slash(A.unitPos(t),col==='#b9b1a3'?'#ffffff':col);A.fx.burst(A.unitPos(t),col==='#b9b1a3'?'#ffd0a0':col,r.crit?16:8);
      A.hurt(t,r.crit);
      if(skill&&skill.stun&&!t.down){applyStun(t,skill.stun)}
      if(skill&&skill.weakenAtk&&!t.down){t.st.weakenAtk={n:skill.weakenAtk.n,v:skill.weakenAtk.v};ui().float(t,'Weakened','dbf')}
      if(skill&&skill.exec&&!t.down&&!t.boss&&t.hp<t.maxHp*skill.exec){t.hp=0;ui().float(t,'Execute!','crit')}
      if(t.hp<=0&&!t.down)kills+=await killFoe(h,t);
      if(t.mut==='thorns'&&!t.down){const ref=Math.max(1,Math.round(dmg*.1));h.hp=Math.max(1,h.hp-ref);ui().float(h,'-'+ref,'dmg')}
    }
    if(nHits>1)await sleep(200);
  }
  // chain lightning style jumps
  if(skill&&skill.chain&&!target.down||skill&&skill.chain){
    let from=target,last=null;
    for(let j=0;j<skill.chain.length;j++){
      if(!chance(skill.chain[j]))break;
      const next=G.foes().filter(f=>f!==from&&f!==last&&dist(f,from)<=2).sort((a,b)=>dist(a,from)-dist(b,from))[0];
      if(!next)break;
      await A.fx.projectile(A.unitPos(from),A.unitPos(next),'orb',col);
      const r=TGH.strike(h,next,skill,{});
      if(r.hit){const dmg=Math.round(r.dmg*Math.pow(.75,j+1));applyDamage(h,next,dmg,r,skill);totalDmg+=dmg;A.fx.burst(A.unitPos(next),col,8);A.hurt(next,r.crit);if(next.hp<=0&&!next.down)await killFoe(h,next)}
      last=from;from=next;
    }
  }
  if(skill&&skill.hexed){for(const t of victims)if(!t.down){t.st.hexed={n:skill.hexed.n,v:skill.hexed.v};ui().float(t,'Hexed','dbf');A.fx.sparkles(A.unitPos(t),'#b56fe3',10,1)}}
  if(skill&&skill.drain&&drainBase>0){const hl=Math.round(drainBase*skill.drain);h.hp=Math.min(h.maxHp,h.hp+hl);ui().float(h,'+'+hl,'heal')}
  if(h.lifesteal&&totalDmg>0){const hl=Math.max(1,Math.round(totalDmg*h.lifesteal/100));h.hp=Math.min(h.maxHp,h.hp+hl);ui().float(h,'+'+hl,'heal')}
  if(skill&&skill.imbue){}
  if(lunge){lunge.release();await lunge.done}
  else await sleep(200);
  if(h.st.imbue!=null&&!skill&&h.fam==='bow'){}
};
function applyDamage(att,t,dmg,r,skill){
  t.hp=Math.max(0,t.hp-dmg);
  const txt=(r.crit?'CRIT ':'')+dmg+(r.mult>1?' ▲':r.mult<1?' ▼':'');
  ui().float(t,txt,r.crit?'crit':'dmg');
  tell(`${att.name} hits ${t.name} for ${dmg}${r.crit?' (critical)':''}${r.mult>1?', super effective':''}${r.mult<1?', not very effective':''}.`);
}
function applyStun(t,n){
  const turns=t.boss?1:n;t.st.stun=turns;ui().float(t,'Stunned','dbf');
}
async function killFoe(h,t){
  t.down=true;tell(`${t.name} is defeated.`,'good');
  R_().foesKilled++;
  await A.die(t);
  return 1;
}
G.supportSequence=async function(h,skill,target){
  const col='#9fffd0';
  await A.cast(h,'#8fffc0');
  const st=h.st;
  if(skill.healPct||skill.healInt){
    const group=skill.tgt==='party'?G.s.heroes.filter(x=>!x.down):[target];
    if(skill.tgt==='fallen'){
      target.down=false;target.hp=Math.max(1,Math.round(target.maxHp*skill.healPct));A.revive(target);ui().float(target,'Revived','heal');
    }else for(const t of group){
      const amt=TGH.healAmount(h,t,skill);t.hp=Math.min(t.maxHp,t.hp+amt);
      A.fx.sparkles(A.unitPos(t),'#8fffc0',14,.8);ui().float(t,'+'+amt,'heal');
    }
    if(skill.id==='wind'){const amt=Math.round(h.maxHp*skill.healPct);h.hp=Math.min(h.maxHp,h.hp+amt)}
  }
  if(skill.guard){st.guard={n:skill.guard.n,taken:skill.guard.taken,taunt:skill.guard.taunt};ui().float(h,'Guarding','buff');A.fx.ring(A.unitPos(h),'#8fa8c8',500)}
  if(skill.buff){for(const x of G.s.heroes)if(!x.down){x.st.buff=Object.assign({},skill.buff);ui().float(x,'Empowered','buff');A.fx.sparkles(A.unitPos(x),'#ffd34a',10,1)}}
  if(skill.imbue){st.imbue=skill.imbue;const e=await ui().pickElement('Imbue your arrows');if(e)h.arrowEl=e;ui().float(h,'Imbued','buff')}
  if(skill.critBuff){st.critBuff={n:skill.critBuff.n,v:skill.critBuff.v};ui().float(h,'Focused','buff')}
  if(skill.evaBuff){st.eva={n:skill.evaBuff.n,v:skill.evaBuff.v};ui().float(h,'Evasive','buff');if(skill.dmgSelf)st.dmgSelf={n:skill.evaBuff.n,v:skill.dmgSelf}}
  if(skill.partyEva){for(const x of G.s.heroes)if(x!==h&&!x.down){x.st.eva={n:3,v:skill.partyEva};ui().float(x,'Evasive','buff')}}
  await sleep(300);
};

/* ---------- guard, items ---------- */
G.doGuard=function(){
  const h=G.active();if(G.busy||h.ap<1){ui().toast('Not enough AP.');return}
  h.ap--;h.st.guard={n:1,taken:.65,taunt:false};ui().float(h,'Guard','buff');A.fx.ring(A.unitPos(h),'#8fa8c8',400);
  tell(h.name+' braces. Damage taken is reduced until their next turn.');
  G.sel=null;G.pend=null;A.clearAllOverlays();ui().refresh();G.checkAutoEnd();
};
G.useItem=async function(id,target){
  const h=G.active(),P=TGH.POTIONS[id],town=G.s.town;
  if(G.busy)return;
  if(!town.items[id]||town.items[id]<1){ui().toast('None left.');return}
  if(h.ap<1){ui().toast('Using an item costs 1 AP.');return}
  if(P.scroll){
    if(G.mode==='battle'){ui().toast('You cannot read a scroll in the middle of a fight.');return}
    town.items[id]--;h.ap--;G.finishAdventure(true);return;
  }
  if(P.revive){if(!target.down){ui().toast(target.name+' is not down.');return}}
  else if(target.down){ui().toast(target.name+' is down. Use a Phoenix Feather.');return}
  G.busy=true;town.items[id]--;h.ap--;
  const farm=1+(town.b.witch||1)*.08-.08;
  if(P.heal){const a=Math.round(target.maxHp*P.heal*farm);target.hp=Math.min(target.maxHp,target.hp+a);ui().float(target,'+'+a,'heal');A.fx.sparkles(A.unitPos(target),'#ff9a9a',12,.8)}
  if(P.mana){const a=Math.round(target.maxMp*P.mana);target.mp=Math.min(target.maxMp,target.mp+a);ui().float(target,'+'+a+' MP','mana');A.fx.sparkles(A.unitPos(target),'#8ab0ff',12,.8)}
  if(P.ap){h.ap+=P.ap;ui().float(h,'+'+P.ap+' AP','buff')}
  if(P.revive){target.down=false;target.hp=Math.round(target.maxHp*P.revive);A.revive(target);ui().float(target,'Revived','heal')}
  tell(`${h.name} uses ${P.n} on ${target.name}.`);
  await sleep(500);G.busy=false;ui().refresh();G.checkAutoEnd();
};

/* ---------- the foes' turn ---------- */
G.foePhase=async function(){
  const run=R_(),b=run.battle;if(!b)return;
  ui().enemyBanner();await sleep(900);
  for(const f of b.foes){
    if(f.down)continue;
    if(!run.battle)return;
    // statuses tick at the start of the foe's own turn
    for(const k of Object.keys(f.st)){const v=f.st[k];if(k==='stun')continue;if(v&&v.n!=null){v.n--;if(v.n<=0)delete f.st[k]}}
    if(f.mut==='regen'&&f.hp<f.maxHp){const a=Math.round(f.maxHp*.08);f.hp=Math.min(f.maxHp,f.hp+a);ui().float(f,'+'+a,'heal')}
    if(f.def==='The Cave Bear'){f.atk=Math.round(f.atk*1.07)}
    if(f.st.stun){f.st.stun--;if(f.st.stun<=0)delete f.st.stun;ui().float(f,'Stunned','dbf');await sleep(500);continue}
    f.ap=f.maxAp;
    A.focus(f.c,f.r);await sleep(260);
    await G.foeAct(f);
    G.computeVis();
    if(G.live().length===0){await G.defeat();return}
  }
  for(const h of G.s.heroes)if(h.st.guard&&h.st.guard.n<=0)delete h.st.guard;
};
const targetFor=f=>{
  const heroes=G.s.heroes.filter(h=>!h.down);if(!heroes.length)return null;
  const taunt=heroes.filter(h=>(h.st.guard&&h.st.guard.taunt)||(h.st.buff&&h.st.buff.taunt));
  const pool=taunt.length?taunt:heroes;
  return pool.sort((a,b)=>dist(f,a)-dist(f,b)||a.hp/a.maxHp-b.hp/b.maxHp)[0];
};
G.foeAct=async function(f){
  const K=TGH.KINDS[f.kind]||TGH.KINDS.beast;
  let guard=0;
  while(f.ap>0&&guard++<6){
    const tg=targetFor(f);if(!tg)return;
    const d=dist(f,tg),rg=f.range;
    const canHit=d<=rg&&(d<=1||TGH.los(R_().map,f,tg));
    const heavy=K.look==='brute'||f.boss;
    const cost=heavy?2:1;
    if(f.def==='The Giant Boar'&&d>=3&&f.ap>=2&&!canHit){
      // charge: paw the ground, then rush the target
      ui().float(f,'Pawing the ground…','dbf');await sleep(500);
      await G.foeMove(f,tg,6);f.ap=0;
      const t2=targetFor(f);if(t2&&dist(f,t2)<=1){await G.foeStrike(f,t2,1.8,'Tusk Charge')}
      return;
    }
    if(canHit&&f.ap>=cost){await G.foeStrike(f,tg,heavy?1.1:.62);f.ap-=cost;continue}
    // move closer
    if(f.ap>=1){
      const moved=await G.foeMove(f,tg,f.mv,rg);
      f.ap--;if(!moved&&!canHit){f.ap=0}
    }else break;
  }
};
G.foeMove=async function(f,tg,steps,range){
  const run=R_(),m=run.map;
  const pass=(c,r)=>{if(TGH.BLOCKS_MOVE.has(m.tiles[idx(c,r)]))return false;const u=unitAt(c,r);if(u&&u!==f)return false;const e=entAt(c,r);if(e&&isMonsterEnt(e)&&!(e.gone))return false;return true};
  const res=TGH.search(m,{c:f.c,r:f.r},pass,steps);
  // the reachable hex that ends nearest the target (inside range if possible)
  let best=null,bd=1e9;
  for(const [k] of res.dist){
    const c=k%m.w,r=Math.floor(k/m.w),d=dist({c,r},tg),inR=range&&d<=range&&(d<=1||TGH.los(m,{c,r},tg));
    const score=(inR?-100:0)+d*2+res.dist.get(k)*.01;
    if(score<bd){bd=score;best={c,r}}
  }
  if(!best||(best.c===f.c&&best.r===f.r))return false;
  const path=TGH.pathTo(m,res,best);if(!path||!path.length)return false;
  f.rig.moving=true;
  await A.moveAlong(f,path);
  G.computeVis();
  return true;
};
G.foeStrike=async function(f,tg,mult,label){
  const ranged=f.range>1,magic=f.magic||f.kind==='spider';
  if(label)ui().float(f,label,'dbf');
  A.focus(tg.c,tg.r);
  const fake=Object.assign({},f);
  let l=null;
  if(!ranged)l=await A.lunge(f,tg.c,tg.r,.5);
  else{A.faceHex(f,tg.c,tg.r);await A.fx.projectile(A.unitPos(f),A.unitPos(tg),'orb',magic?(f.kind==='spider'?'#b0f060':'#c090ff'):'#ffb060')}
  const skill={mult,acc:92,el:'physical'};
  const r=TGH.strike(f,tg,{mult:mult,acc:92,crit:0},{});
  if(!r.hit){ui().float(tg,'Miss','miss');tell(`${f.name} misses ${tg.name}.`)}
  else{
    tg.hp=Math.max(0,tg.hp-r.dmg);
    ui().float(tg,(r.crit?'CRIT ':'')+r.dmg,r.crit?'crit':'dmg');tell(`${f.name} hits ${tg.name} for ${r.dmg}.`,'bad');
    A.fx.burst(A.unitPos(tg),'#ff8a6a',10);A.hurt(tg,r.crit);
    if(tg.hp<=0){tg.down=true;tell(tg.name+' is down!','bad');await A.die(tg)}
  }
  if(l){l.release();await l.done}
  ui().refresh();
};

/* ---------- winning, losing, going home ---------- */
G.victory=async function(){
  const run=R_(),b=run.battle,s=G.s;
  const killed=b.foes;
  const xp=killed.reduce((a,f)=>a+f.xp,0),gold=killed.reduce((a,f)=>a+f.gold,0);
  const wasBoss=killed.some(f=>f.boss),wasElite=killed.some(f=>f.elite);
  const bossFoe=killed.find(f=>f.boss);
  const lvl=killed[0].level;
  run.loot.gold+=Math.round(gold*(1+(s.heroes.reduce((a,h)=>a+((h.bonus&&h.bonus.goldfind)||0),0))/100));
  // loot
  const items=[];
  if(wasBoss){items.push(...G.rollLoot(lvl,1.2,2))}
  else if(wasElite){items.push(...G.rollLoot(lvl,.6,1))}
  else if(chance(.2+s.heroes.reduce((a,h)=>a+h.stats.lck,0)*.005))items.push(...G.rollLoot(lvl,.1,1));
  const mats={};
  const B=TGH.BIOMES[run.biome];
  const nm=wasBoss?3:wasElite?2:chance(.45)?1:0;
  for(let i=0;i<nm;i++){const k=pick(B.mat);mats[k]=(mats[k]||0)+1;run.loot.mats[k]=(run.loot.mats[k]||0)+1}
  // experience, and the fallen are pulled back on their feet
  const results=[];
  for(const h of s.heroes){
    const was=h.level;const down=h.down;
    const r=TGH.gainXp(h,down?Math.round(xp*.5):xp,s.town);
    results.push({h,xp:r.xp,up:r.gained,down});
    if(down){h.down=false;h.hp=Math.max(1,Math.round(h.maxHp*.2));A.revive(h)}
    h.st={};
  }
  // the pack, the boss
  const ent=run.map.ents.find(e=>e.id===b.ent);if(ent){ent.gone=true;A.removeEnt(ent)}
  for(const f of b.foes)A.removeUnit(f);
  run.battle=null;G.mode='explore';
  if(wasBoss){run.bossBeaten=true;G.addExitPortal();
    if(run.biome==='cave'){s.town.caveBeaten=s.town.caveBeaten||[];if(!s.town.caveBeaten.includes(run.bossName))s.town.caveBeaten.push(run.bossName)}}
  G.computeVis();
  G.busy=false;
  await ui().victory({xp,gold,items,mats,results,boss:bossFoe});
  ui().checkLevelUps();
  A.focus(G.s.heroes[0].c,G.s.heroes[0].r);
  G.startHeroTurn(0);
  G.save();
};
G.defeat=async function(){
  if(G.mode==='ended')return;
  G.mode='ended';G.busy=true;
  const run=R_(),s=G.s;
  const lost={gold:run.loot.gold,mats:Object.assign({},run.loot.mats)};
  const fee=Math.round(s.town.gold*.1);s.town.gold-=fee;
  await ui().defeat(lost,fee);
  G.s.run=null;
  for(const h of s.heroes){h.down=false;h.st={};h.hp=h.maxHp;h.mp=h.maxMp}
  G.busy=false;G.toTown();
};
G.finishAdventure=async function(early){
  const run=R_(),s=G.s;if(G.mode==='ended')return;
  G.mode='ended';G.busy=true;
  const loot=run.loot,beaten=run.bossBeaten;
  s.town.gold+=loot.gold;for(const k of Object.keys(loot.mats))s.town.mats[k]=(s.town.mats[k]||0)+loot.mats[k];
  const biome=run.biome;
  if(beaten&&!s.town.beaten.includes(biome))s.town.beaten.push(biome);
  for(const h of s.heroes){h.down=false;h.st={};h.hp=h.maxHp;h.mp=h.maxMp}
  const summary={biome,beaten,gold:loot.gold,mats:loot.mats,early,foes:run.foesKilled};
  s.run=null;G.save();
  await ui().homecoming(summary);
  G.busy=false;
  if(beaten&&biome==='dark'){await ui().ending();}
  G.toTown();
};
G.goHome=function(){
  if(G.busy||G.mode!=='explore')return;
  const hs=G.s.heroes,st=R_().map.start;
  const near=hs.every(h=>st.some(p=>dist(h,p)<=2));
  if(!near){ui().toast('Both heroes must be near the start to go home.');return}
  G.finishAdventure(true);
};
G.toTown=function(){
  G.mode='town';G.sel=null;G.pend=null;
  A.clearAllOverlays();
  TGH.ui.showTown();
  G.save();
};
})();
