/* To Get Her: the heads-up display. Hero cards, the action bar that changes with whose turn it is, floating numbers, banners,
   pop-up boxes and the touch/mouse controls for the map. Full screens (title, creation, town, hero menu) are in screens.js. */
(function(){
'use strict';
const TGH=window.TGH=window.TGH||{};
const A=TGH.art,G=TGH.game;
const U=TGH.ui={};
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
U.esc=esc;
const pct=(a,b)=>Math.max(0,Math.min(100,Math.round(a/Math.max(1,b)*100)));
const cap=TGH.cap;

/* ---------- setup ---------- */
U.init=function(){
  U.root=$('#hud');U.screen=$('#screen');
  U.floaters=$('#floaters');U.barsLayer=$('#bars');
  U.bars=new Map();
  bindMap();
  const loop=()=>{U.updateBars();requestAnimationFrame(loop)};requestAnimationFrame(loop);
  window.addEventListener('keydown',onKey);
};
U.hudVisible=on=>{$('#hud').style.display=on?'block':'none'};

/* ---------- map controls: tap, drag to pan, pinch or wheel to zoom ---------- */
function bindMap(){
  const el=$('#hud'),pts=new Map();let start=null,moved=false,pinch=0;
  const down=e=>{
    if(e.target!==el&&!e.target.classList.contains('maplayer'))return;
    el.setPointerCapture&&el.setPointerCapture(e.pointerId);
    pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size===1){start={x:e.clientX,y:e.clientY};moved=false}
    if(pts.size===2){const [a,b]=[...pts.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y);moved=true}
  };
  const move=e=>{
    if(!pts.has(e.pointerId))return;
    const p=pts.get(e.pointerId),dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
    if(pts.size===2){const [a,b]=[...pts.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch)A.setZoom(A.zoom*pinch/d);pinch=d;return}
    if(!moved&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>10)moved=true;
    if(moved&&G.mode!=='town'&&G.mode!=='title'){const k=A.zoom*.034;A.panBy(-dx*k,-dy*k*1.5)}
  };
  const up=e=>{
    if(!pts.has(e.pointerId))return;pts.delete(e.pointerId);
    if(!moved&&pts.size===0&&(G.mode==='explore'||G.mode==='battle')&&!G.busy){
      const h=A.pick(e.clientX,e.clientY);if(h)G.tapHex(h.c,h.r);
    }
    if(pts.size<2)pinch=0;
  };
  el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
  el.addEventListener('wheel',e=>{if(G.mode==='explore'||G.mode==='battle'){e.preventDefault();A.setZoom(A.zoom*(e.deltaY>0?1.08:.93))}},{passive:false});
}
function onKey(e){
  if(document.querySelector('.modal')||G.mode==='title')return;
  const k=e.key;
  if(G.mode!=='explore'&&G.mode!=='battle')return;
  if(k==='Enter'||k===' '){e.preventDefault();G.confirm()}
  else if(k==='Escape')G.cancel();
  else if(k==='e'||k==='E')G.endTurn();
  else if(k==='a'||k==='A')G.chooseAction('attack');
  else if(k==='ArrowLeft')A.panBy(-2,0);else if(k==='ArrowRight')A.panBy(2,0);else if(k==='ArrowUp')A.panBy(0,-2);else if(k==='ArrowDown')A.panBy(0,2);
}

/* ---------- little pieces ---------- */
U.log=function(msg,cls){
  const box=$('#logbox');if(!box)return;
  const d=document.createElement('div');d.className='logline '+(cls||'');d.textContent=msg;box.appendChild(d);
  while(box.children.length>5)box.removeChild(box.firstChild);
  setTimeout(()=>d.classList.add('old'),5000);
};
U.toast=function(msg){
  const t=$('#toast');t.textContent=msg;t.classList.remove('show');void t.offsetWidth;t.classList.add('show');
  clearTimeout(U._tt);U._tt=setTimeout(()=>t.classList.remove('show'),2400);
};
U.float=function(u,text,cls){
  if(!u||!u.rig)return;
  const p=A.unitScreen(u,1.9);if(p.behind)return;
  const d=document.createElement('div');d.className='float '+(cls||'dmg');d.textContent=text;
  const j=(Math.random()-.5)*36;d.style.left=(p.x+j)+'px';d.style.top=p.y+'px';
  U.floaters.appendChild(d);setTimeout(()=>d.remove(),1500);
};
U.banner=function(title,sub,ms){
  const b=$('#banner');b.innerHTML=`<div class="bn-t">${esc(title)}</div>${sub?`<div class="bn-s">${esc(sub)}</div>`:''}`;
  b.className='show plain';clearTimeout(U._bt);U._bt=setTimeout(()=>b.classList.remove('show'),ms||1600);
};
U.turnBanner=function(h,battle){
  const i=G.s.heroes.indexOf(h);
  document.body.dataset.turn=i;
  const b=$('#banner');
  b.innerHTML=`<img src="${A.portrait(h,96,112)}"><div><div class="bn-t">${esc(h.name)}'s turn</div><div class="bn-s">${battle?'Round '+(G.s.run.battle?G.s.run.battle.round:1)+' · Choose your actions':'Player '+(i+1)+' · explore'}</div></div>`;
  b.className='show turn p'+i+(battle?' big':'');clearTimeout(U._bt);U._bt=setTimeout(()=>b.classList.remove('show'),battle?1700:1100);
};
U.battleBanner=function(foes){
  const b=$('#banner');const boss=foes.find(f=>f.boss),el=foes.find(f=>f.elite);
  b.innerHTML=`<div class="bn-t">${boss?'BOSS BATTLE':el?'ELITE ENCOUNTER':'BATTLE!'}</div><div class="bn-s">${esc(foes.map(f=>f.name).join(' · '))}</div>`;
  b.className='show battle';clearTimeout(U._bt);U._bt=setTimeout(()=>b.classList.remove('show'),1500);
};
U.enemyBanner=function(){
  const b=$('#banner');document.body.dataset.turn='e';
  b.innerHTML='<div class="bn-t">Enemy turn</div>';b.className='show enemy';clearTimeout(U._bt);U._bt=setTimeout(()=>b.classList.remove('show'),1000);
  U.refresh();
};

/* ---------- the HUD: cards and bars ---------- */
const STATUS_NAMES={guard:'Guard',buff:'Empowered',eva:'Evasive',critBuff:'Focused',dmgSelf:'Fierce',imbue:'Imbued',stun:'Stunned',hexed:'Hexed',weakenAtk:'Weakened'};
const chips=u=>Object.entries(u.st||{}).filter(([k,v])=>STATUS_NAMES[k]).map(([k,v])=>`<span class="chip">${STATUS_NAMES[k]}${v&&v.n?' '+v.n:typeof v==='number'?' '+v:''}</span>`).join('');
function card(h,i){
  const run=G.s.run,active=run&&G.active()===h&&(G.mode==='explore'||G.mode==='battle');
  const pips=Array.from({length:h.maxAp},(_,k)=>`<i class="${k<h.ap?'on':''}"></i>`).join('');
  const pts=h.points>0||h.skillPoints>0;
  const bank=active&&run.turn.bank>0?`<span class="bank">+${run.turn.bank} hex</span>`:'';
  return `<div class="hcard p${i} ${active?'active':''} ${h.down?'down':''}" data-i="${i}">
    <img class="port" src="${A.portrait(h)}" alt="">
    <div class="hc-main">
      <div class="hc-name">${esc(h.name)} <span class="lv">Lv ${h.level}</span>${pts?'<span class="ping" title="Unspent points">!</span>':''}</div>
      <div class="hc-title">${TGH.heroTitle(h)}${active?'<span class="yt">YOUR TURN</span>':''}</div>
      <div class="bar hp"><i style="width:${pct(h.hp,h.maxHp)}%"></i><b>${h.hp} / ${h.maxHp}</b></div>
      <div class="bar mp"><i style="width:${pct(h.mp,h.maxMp)}%"></i><b>${h.mp} / ${h.maxMp}</b></div>
      <div class="aprow"><span class="aplabel">AP</span><span class="pips">${pips}</span>${bank}</div>
      <div class="chips">${chips(h)}</div>
    </div></div>`;
}
U.refresh=function(){
  const hud=$('#hud');
  if(G.mode!=='explore'&&G.mode!=='battle'&&G.mode!=='ended'){return}
  if(!G.s||!G.s.run)return;
  const run=G.s.run,hs=G.s.heroes;
  $('#cardL').innerHTML=card(hs[0],0);$('#cardR').innerHTML=card(hs[1],1);
  for(const c of document.querySelectorAll('.hcard'))c.onclick=()=>{const h=hs[+c.dataset.i];A.focus(h.c,h.r);if(!G.busy)U.heroMenu&&U.heroMenu(+c.dataset.i)};
  $('#topinfo').innerHTML=`<b>${esc(TGH.BIOMES[run.biome].name)}</b>${G.mode==='battle'?` · <span class="rd">Round ${run.battle.round}</span> · ${G.foes().length} foe${G.foes().length===1?'':'s'}`:''}`;
  document.body.dataset.mode=G.mode;
  if(G.mode!=='ended')document.body.dataset.turn=document.body.dataset.turn==='e'&&G.busy?'e':G.s.run.turn.hero;
  U.renderActionBar();
};
U.renderActionBar=function(){
  const bar=$('#actionbar'),run=G.s.run,h=G.active();if(!h)return;
  const i=G.s.heroes.indexOf(h),battle=G.mode==='battle';
  const dis=G.busy?'disabled':'';
  const apOk=n=>h.ap>=n;
  const fam=TGH.FAM[h.fam];
  const rg=TGH.attackRange(h);
  let btns='';
  if(battle){
    btns+=`<button class="act atk" data-a="attack" ${dis||(apOk(1)?'':'disabled')}><b>Attack</b><small>1 AP · reach ${rg}</small></button>`;
    btns+=`<button class="act" data-a="skills" ${dis}><b>Skills</b><small>${h.skills.length} known</small></button>`;
    btns+=`<button class="act" data-a="items" ${dis}><b>Items</b><small>1 AP</small></button>`;
    btns+=`<button class="act" data-a="guard" ${dis||(apOk(1)?'':'disabled')}><b>Guard</b><small>1 AP</small></button>`;
  }else{
    btns+=`<button class="act" data-a="skills" ${dis}><b>Skills</b><small>${h.skills.length} known</small></button>`;
    btns+=`<button class="act" data-a="items" ${dis}><b>Items</b><small>potions</small></button>`;
    btns+=`<button class="act" data-a="hero" ${dis}><b>Hero</b><small>${(h.points||h.skillPoints)?'points to spend!':'stats · gear'}</small></button>`;
    const near=G.s.heroes.every(x=>run.map.start.some(p=>TGH.dist(x,p)<=2));
    if(near)btns+=`<button class="act" data-a="home" ${dis}><b>Go Home</b><small>bank loot</small></button>`;
  }
  btns+=`<button class="act end" data-a="end" ${dis}><b>End Turn</b><small>${battle?(i===0&&!G.s.heroes[1].down?'then '+esc(G.s.heroes[1].name):'then enemies'):'pass to '+esc(G.s.heroes[1-i].name)}</small></button>`;
  // preview panel: what a tap on the map is about to do
  let pend='';
  const p=G.pend;
  if(p&&p.type==='move'){
    pend=`<div class="pend"><div class="pt">Move ${p.plan.L} hex${p.plan.L===1?'':'es'}</div><div class="ps">${p.plan.apCost?`Costs ${p.plan.apCost} AP`:'Free (banked movement)'}${p.plan.ok?'':' · not enough AP'}</div>
      <button class="go" data-a="confirm" ${p.plan.ok?'':'disabled'}>Go</button><button class="no" data-a="cancel">✕</button></div>`;
  }else if(p&&p.type==='act'){
    const sk=p.skill,t=p.target,est=U.estimate(h,sk,t);
    const sname=sk?sk.n:fam.n+' attack';
    let line='';
    if(est&&t.team==='foe')line=`about <b>${est.avg}</b> damage${est.aoe>1?' to '+est.aoe+' foes':''} · ${est.hit}% to hit${est.weak?' · <span class="weak">weak!</span>':est.resist?' · <span class="res">resisted</span>':''}`;
    else if(sk&&(sk.healPct||sk.healInt))line=sk.tgt==='party'?'heals both heroes':sk.tgt==='fallen'?'revives '+esc(t.name):'heals '+esc(t.name);
    else line=sk?esc(sk.d):'';
    pend=`<div class="pend"><div class="pt">${esc(sname)}${t.team==='foe'?' → '+esc(t.name):''}</div><div class="ps">${line}</div>
      <button class="go" data-a="confirm">${sk&&!sk.mult?'Use':'Strike'}</button><button class="no" data-a="cancel">✕</button></div>`;
  }
  bar.innerHTML=`${pend}<div class="who p${i}"><img src="${A.portrait(h,72,86)}"><div><div class="wn">${esc(h.name)}</div><div class="ws">AP ${h.ap}/${h.maxAp} · ${h.move} hexes/AP</div></div></div><div class="btns">${btns}</div>`;
  for(const b of bar.querySelectorAll('button'))b.onclick=()=>onAct(b.dataset.a);
  // enemy phase: dim the bar
  bar.classList.toggle('foes',document.body.dataset.turn==='e');
};
function onAct(a){
  if(a==='attack')G.chooseAction('attack');
  else if(a==='skills')U.skillMenu();
  else if(a==='items')U.itemMenu();
  else if(a==='guard')G.doGuard();
  else if(a==='end')G.endTurn();
  else if(a==='confirm')G.confirm();
  else if(a==='cancel')G.cancel();
  else if(a==='hero')U.heroMenu(G.s.run.turn.hero);
  else if(a==='home')G.goHome();
}
// Rough damage a strike would do: sample it a few times.
U.estimate=function(h,sk,t){
  if(t.team!=='foe')return null;
  let sum=0,hits=0,weak=false,resist=false;const n=40;
  const keep=TGH.rnd;
  for(let k=0;k<n;k++){const r=TGH.strike(h,t,sk,{});if(r.hit){hits++;sum+=r.dmg;if(r.mult>1)weak=true;if(r.mult<1)resist=true}}
  const mult=sk&&sk.hits||1;
  return {avg:hits?Math.round(sum/hits)*mult:0,hit:Math.round(hits/n*100),weak,resist,aoe:sk&&sk.aoe?G.affected(h,sk,t).length:1};
};

/* ---------- popup lists above the action bar ---------- */
function popup(html){
  U.closePopup();
  const d=document.createElement('div');d.className='popup';d.innerHTML=html;$('#hud').appendChild(d);U._pop=d;
  setTimeout(()=>{U._off=e=>{if(!d.contains(e.target))U.closePopup()};document.addEventListener('pointerdown',U._off)},0);
  return d;
}
U.closePopup=function(){if(U._pop){U._pop.remove();U._pop=null}if(U._off){document.removeEventListener('pointerdown',U._off);U._off=null}};
U.skillMenu=function(){
  const h=G.active();
  if(!h.skills.length){U.toast('No skills yet. Open the Hero menu to learn one.');return}
  const rows=h.skills.map(id=>{
    const k=TGH.SKILLS[id],mp=TGH.skillMp(h,k),rg=TGH.skillRange(h,k);
    const usable=G.mode==='battle'?(h.ap>=k.ap&&h.mp>=mp):(['self','party','ally','fallen'].includes(k.tgt)&&k.healPct!==undefined&&h.ap>=k.ap&&h.mp>=mp);
    const inExplore=G.mode==='explore'&&!k.healPct&&!k.guard;
    return `<button class="skrow ${usable?'':'dim'}" data-id="${id}"><span class="sn" style="color:${TGH.DISC[k.disc].col}">${esc(k.n)}</span><span class="sc">${k.ap} AP · ${mp} MP · ${rg?'reach '+rg:'self'}</span><span class="sd">${esc(k.d)}</span></button>`;
  }).join('');
  const d=popup(`<div class="pop-t">${esc(h.name)}'s skills</div>${rows}`);
  d.querySelectorAll('.skrow').forEach(b=>b.onclick=()=>{const k=TGH.SKILLS[b.dataset.id];U.closePopup();
    if(G.mode==='explore'&&!(k.healPct!==undefined||k.tgt==='self'||k.tgt==='party')){U.toast('That skill is for battle.');return}
    G.chooseAction('skill',k)});
};
U.itemMenu=function(){
  const h=G.active(),it=G.s.town.items;
  const rows=Object.entries(TGH.POTIONS).filter(([id])=>it[id]>0).map(([id,P])=>`<button class="skrow" data-id="${id}"><span class="sn">${esc(P.n)} ×${it[id]}</span><span class="sc">1 AP</span><span class="sd">${esc(P.d)}</span></button>`).join('')||'<div class="empty">You have no items. The Witch sells potions in town.</div>';
  const d=popup(`<div class="pop-t">Items</div>${rows}`);
  d.querySelectorAll('.skrow').forEach(b=>b.onclick=async()=>{
    const id=b.dataset.id,P=TGH.POTIONS[id];U.closePopup();
    if(P.scroll||P.ap){G.useItem(id,h);return}
    const t=await U.pickHero(P.revive?'Revive who?':'Use on whom?',P.revive);if(t)G.useItem(id,t);
  });
};
U.pickHero=function(title,wantDown){
  return new Promise(res=>{
    const hs=G.s.heroes;
    const html=`<div class="pop-t">${esc(title)}</div><div class="pickrow">${hs.map((x,i)=>`<button class="pickhero p${i}" data-i="${i}" ${(wantDown?!x.down:x.down)?'disabled':''}><img src="${A.portrait(x,72,86)}"><span>${esc(x.name)}</span><small>${x.hp}/${x.maxHp} HP · ${x.mp}/${x.maxMp} MP</small></button>`).join('')}</div>`;
    const d=popup(html);
    d.querySelectorAll('.pickhero').forEach(b=>b.onclick=()=>{U.closePopup();res(hs[+b.dataset.i])});
    const watch=setInterval(()=>{if(!U._pop||U._pop!==d){clearInterval(watch);res(null)}},200);
  });
};
U.pickElement=function(title){
  return U.modalChoice(title,'Choose an element. Each beats one and loses to another: Fire → Grass → Fighting → Thunder → Ice → Fire.',TGH.ELEMENTS.map(e=>({label:cap(e),v:e,col:TGH.EL_COL[e]})));
};
U.inspect=function(u){
  const box=$('#infocard');
  if(u.team==='hero'){box.classList.remove('show');return}
  const el=u.el;const beats=el?TGH.ELEMENTS.find(e=>TGH.BEATS[e]===el):null;
  box.innerHTML=`<div class="ic-n">${esc(u.name)} <span class="lv">Lv ${u.level}</span>${u.boss?'<span class="tag boss">BOSS</span>':u.elite?'<span class="tag elite">ELITE</span>':''}</div>
    <div class="bar hp"><i style="width:${pct(u.hp,u.maxHp)}%"></i><b>${u.hp} / ${u.maxHp}</b></div>
    <div class="ic-s">Reach ${u.range} · ${u.mv} hex${u.mv>1?'es':''}/AP · armor ${u.armor}${el?` · ${cap(el)}, weak to <span style="color:${TGH.EL_COL[beats]}">${cap(beats)}</span>`:''}</div>
    ${u.mut?`<div class="ic-s">${TGH.MUTATIONS[u.mut].n}: ${TGH.MUTATIONS[u.mut].d}</div>`:''}${u.blurb?`<div class="ic-s">${esc(u.blurb)}</div>`:''}`;
  box.classList.add('show');clearTimeout(U._ic);U._ic=setTimeout(()=>box.classList.remove('show'),5000);
};

/* ---------- health bars floating over units ---------- */
U.updateBars=function(){
  const live=(G.mode==='explore'||G.mode==='battle')&&G.s&&G.s.run;
  if(!live){for(const [,d] of U.bars)d.remove();U.bars.clear();return}
  const seen=new Set();
  const units=[...G.s.heroes,...(G.mode==='battle'?G.allFoes():[])];
  for(const u of units){
    if(!u.rig)continue;
    const show=!u.down&&u.rig.root.visible&&(u.team==='hero'||G.mode==='battle');
    let d=U.bars.get(u.id);
    if(!show){if(d)d.style.display='none';continue}
    if(!d){d=document.createElement('div');d.className='ubar '+u.team;d.innerHTML='<div class="un"></div><div class="ub"><i></i></div>';U.barsLayer.appendChild(d);U.bars.set(u.id,d)}
    seen.add(u.id);
    const p=A.unitScreen(u,(u.team==='hero'?1.75:1.5)+(u.boss?.8:0));
    d.style.display=p.behind?'none':'block';d.style.left=p.x+'px';d.style.top=p.y+'px';
    d.querySelector('i').style.width=pct(u.hp,u.maxHp)+'%';
    const nm=d.querySelector('.un');const label=u.team==='foe'?(u.boss||u.elite?u.name:''):'';
    if(nm.textContent!==label)nm.textContent=label;
    d.classList.toggle('active',u.team==='hero'&&G.active()===u&&G.mode!=='ended');
  }
  for(const [id,d] of U.bars)if(!seen.has(id)&&!units.some(u=>u.id===id)){d.remove();U.bars.delete(id)}
};

/* ---------- boxes in the middle of the screen ---------- */
U.modalChoice=function(title,body,buttons){
  return new Promise(res=>{
    const m=document.createElement('div');m.className='modal';
    m.innerHTML=`<div class="mbox"><h2>${esc(title)}</h2><div class="mbody">${body}</div><div class="mbtns">${buttons.map((b,i)=>`<button class="mb ${b.cls||''}" data-i="${i}" style="${b.col?'border-color:'+b.col+';color:'+b.col:''}">${esc(b.label)}</button>`).join('')}</div></div>`;
    document.body.appendChild(m);
    m.querySelectorAll('.mb').forEach(b=>b.onclick=()=>{m.remove();res(buttons[+b.dataset.i].v!==undefined?buttons[+b.dataset.i].v:buttons[+b.dataset.i].label)});
  });
};
U.eventBox=(title,text,buttons)=>U.modalChoice(title,`<p>${esc(text)}</p>`,buttons);
U.showLoot=function(title,gold,items){
  const body=`<p class="gold">+${gold} gold</p>${items.map(i=>`<div class="lootitem" style="border-color:${TGH.RAR[i.rarity].c}"><b style="color:${TGH.RAR[i.rarity].c}">${esc(TGH.itemTitle(i))}</b><small>${TGH.RAR[i.rarity].l} ${TGH.SLOTN[i.slot]} · ${TGH.itemLines(i).join(' · ')}</small></div>`).join('')}`;
  return U.modalChoice(title,body,[{label:'Nice'}]);
};
U.victory=async function(r){
  const chipsHtml=Object.entries(r.mats).map(([k,v])=>`<span class="mchip" style="border-color:${TGH.MATS[k].col}">${TGH.MATS[k].n} ×${v}</span>`).join('');
  const heroes=r.results.map(x=>`<div class="vrow p${G.s.heroes.indexOf(x.h)}"><img src="${A.portrait(x.h,60,72)}"><div><b>${esc(x.h.name)}</b> +${x.xp} XP${x.up?` <span class="lvup">LEVEL UP! → ${x.h.level}</span>`:''}${x.down?' <small>(was down)</small>':''}</div></div>`).join('');
  const loot=r.items.map(i=>`<div class="lootitem" style="border-color:${TGH.RAR[i.rarity].c}"><b style="color:${TGH.RAR[i.rarity].c}">${esc(TGH.itemTitle(i))}</b><small>${TGH.RAR[i.rarity].l} ${TGH.SLOTN[i.slot]} · ${TGH.itemLines(i).join(' · ')}</small></div>`).join('');
  await U.modalChoice(r.boss?esc(r.boss.name)+' defeated!':'Victory!',`${heroes}<p class="gold">+${r.gold} gold ${chipsHtml}</p>${loot}${r.boss?'<p class="lvup">A way opens at the top of the map. Step into the portal to take your haul home.</p>':''}`,[{label:'Continue',cls:'gold'}]);
};
U.defeat=async function(lost,fee){
  await U.modalChoice('Both heroes have fallen','<p>The dark closes in. You wake up at home, bruised but alive. Everything you carried out of that place is gone'+(fee?', and the healer took '+fee+' gold':'')+'.</p>',[{label:'Return home'}]);
};
U.homecoming=async function(s){
  const mats=Object.entries(s.mats).map(([k,v])=>`<span class="mchip" style="border-color:${TGH.MATS[k].col}">${TGH.MATS[k].n} ×${v}</span>`).join('')||'<small>no materials</small>';
  await U.modalChoice(s.beaten?'The way is clear':'Home safe',`<p>${s.beaten?'You beat the guardian of '+esc(TGH.BIOMES[s.biome].name)+'.':'You come home.'} Loot banked:</p><p class="gold">+${s.gold} gold</p><p>${mats}</p>`,[{label:'Back to town',cls:'gold'}]);
};
U.checkLevelUps=function(){
  for(const h of G.s.heroes)if(h.points>0||h.skillPoints>0){U.toast(`${h.name} has points to spend. Open the Hero menu.`);break}
};
})();
