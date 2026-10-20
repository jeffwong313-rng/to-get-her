/* To Get Her: full screens. Title, character creation for two players, the story, the town and the hero menu. */
(function(){
'use strict';
const TGH=window.TGH=window.TGH||{};
const A=TGH.art,G=TGH.game,U=TGH.ui;
const $=s=>document.querySelector(s);
const esc=U.esc,cap=TGH.cap;
const L=TGH.LOOKS;
const scr=()=>$('#screen');

/* ---------- title ---------- */
U.showTitle=function(){
  G.mode='title';U.hudVisible(false);
  A.setTownHeroes([]);A.buildTown(TGH.newTown());A.show('town');
  const has=G.hasSave();
  scr().innerHTML=`<div class="title">
    <div class="logo"><span class="l1">To</span><span class="l2">Get Her</span></div>
    <div class="tag">A two-player adventure for the ones who stay together.</div>
    <div class="tbtns">
      ${has?'<button class="big gold" id="t-cont">Continue</button>':''}
      <button class="big" id="t-new">New Game</button>
      <button class="big ghost" id="t-imp">Import Save</button>
    </div>
    <div class="fine">Two heroes, one device. Take turns, plan together, find her.</div>
  </div>`;
  if(has)$('#t-cont').onclick=()=>{if(G.load()){scr().innerHTML='';resume()}else U.toast('Could not read the save.')};
  $('#t-new').onclick=()=>{if(has&&!confirm('Start over? Your saved game will be replaced when you begin.'))return;U.creation()};
  $('#t-imp').onclick=()=>U.importBox();
};
function resume(){
  if(G.s.run){G.enterRun(false);U.hudVisible(true);U.refresh()}
  else G.toTown();
}
U.importBox=function(){
  U.modalChoice('Import a save','<textarea id="imp" rows="5" placeholder="Paste your save code here"></textarea>',[{label:'Load',v:'go',cls:'gold'},{label:'Cancel',v:null}]).then(v=>{
    if(v==='go'){const t=$('#imp');}
  });
  const ok=document.querySelector('.mb.gold');
  if(ok)ok.onclick=()=>{const code=$('#imp').value;document.querySelector('.modal').remove();if(G.importSave(code)){if(G.load()){scr().innerHTML='';resume()}else U.toast('That save did not load.')}else U.toast('That code is not a valid save.')};
};

/* ---------- character creation ---------- */
const NAMES={f:['Aria','Mei','Luna','Nora','Sakura','Ivy','Elsa','Yuki'],m:['Kai','Ren','Theo','Jun','Leo','Akira','Finn','Kofi']};
const C={};
function newLook(i){const r=n=>Math.floor(Math.random()*n);return {skin:r(L.skin.length),hairStyle:r(L.hairStyle.length),hairColor:r(L.hairColor.length),eye:r(L.eye.length),outfit:r(L.outfit.length),accessory:0,mark:0}}
U.creation=function(){
  G.mode='title';U.hudVisible(false);
  C.step='look';C.prev=[null,null];
  C.heroes=[0,1].map(i=>({name:'',gender:i?'m':'f',look:newLook(i),base:Object.fromEntries(TGH.STATS.map(s=>[s,1]))}));
  C.heroes[0].look.hairStyle=4;C.heroes[1].look.hairStyle=1;
  C.relation=null;C.sister={name:'Mira',whose:'both'};
  A.setTownHeroes([]);A.show('town');
  drawCreation();
};
function disposePreviews(){for(const p of C.prev)if(p)p.dispose();C.prev=[null,null]}
function drawCreation(){
  disposePreviews();
  if(C.step==='look')drawLook();else if(C.step==='relation')drawRelation();else drawStats();
}
const tmpHero=c=>({look:c.look,gender:c.gender,equip:{},name:c.name});
function drawLook(){
  const panel=i=>{
    const c=C.heroes[i];
    const sw=(key,list,names)=>`<div class="crow"><label>${names}</label><div class="swatches" data-k="${key}" data-i="${i}">${list.map((col,k)=>`<button class="sw ${c.look[key]===k?'on':''}" style="background:${col}" data-v="${k}" title="${esc((L[key+'N']||[])[k]||'')}"></button>`).join('')}</div></div>`;
    const arrows=(key,list,names)=>`<div class="crow"><label>${names}</label><div class="arrows" data-i="${i}" data-k="${key}"><button data-d="-1">‹</button><span>${esc(L[key+'N'][c.look[key]])}</span><button data-d="1">›</button></div></div>`;
    return `<div class="cpanel look p${i}">
      <div class="ph">Player ${i+1}</div>
      <div class="lcol"><canvas class="prev" id="prev${i}"></canvas>
      <input type="text" class="cname" data-i="${i}" maxlength="14" placeholder="${NAMES[c.gender][i]}" value="${esc(c.name)}">
      <div class="gender" data-i="${i}"><button class="${c.gender==='f'?'on':''}" data-g="f">Girl</button><button class="${c.gender==='m'?'on':''}" data-g="m">Boy</button></div></div>
      <div class="cscroll">
        ${sw('skin',L.skin,'Skin')}${arrows('hairStyle',L.hairStyle,'Hair style')}${sw('hairColor',L.hairColor,'Hair color')}${sw('eye',L.eye,'Eyes')}${sw('outfit',L.outfit,'Outfit')}${arrows('accessory',L.accessory,'Accessory')}${arrows('mark',L.mark,'Face mark')}
      </div>
      <button class="ghost small rnd" data-i="${i}">Randomize</button>
    </div>`;
  };
  scr().innerHTML=`<div class="creation"><div class="chead">Who are you? <small>Make the two heroes. Choose each look and name.</small></div><div class="cpanels">${panel(0)}${panel(1)}</div><div class="cfoot"><button class="big gold" id="c-next">Next: Relationship →</button></div></div>`;
  for(const i of [0,1]){const cv=$('#prev'+i);C.prev[i]=A.preview(cv);C.prev[i].set(tmpHero(C.heroes[i]))}
  const refresh=i=>{C.prev[i].set(tmpHero(C.heroes[i]))};
  scr().querySelectorAll('.swatches').forEach(el=>el.querySelectorAll('.sw').forEach(b=>b.onclick=()=>{
    const i=+el.dataset.i,k=el.dataset.k;C.heroes[i].look[k]=+b.dataset.v;el.querySelectorAll('.sw').forEach(x=>x.classList.toggle('on',x===b));refresh(i)}));
  scr().querySelectorAll('.arrows').forEach(el=>el.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    const i=+el.dataset.i,k=el.dataset.k,n=L[k].length;C.heroes[i].look[k]=(C.heroes[i].look[k]+ +b.dataset.d+n)%n;el.querySelector('span').textContent=L[k+'N'][C.heroes[i].look[k]];refresh(i)}));
  scr().querySelectorAll('.gender').forEach(el=>el.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    const i=+el.dataset.i;C.heroes[i].gender=b.dataset.g;el.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
    const ph=scr().querySelector('.cname[data-i="'+i+'"]');ph.placeholder=NAMES[C.heroes[i].gender][i];refresh(i)}));
  scr().querySelectorAll('.cname').forEach(el=>el.oninput=()=>{C.heroes[+el.dataset.i].name=el.value});
  scr().querySelectorAll('.rnd').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;C.heroes[i].look=newLook(i);const keep=C.heroes.map(c=>c.name);drawCreation();});
  $('#c-next').onclick=()=>{
    for(const i of [0,1]){const c=C.heroes[i];if(!c.name.trim())c.name=NAMES[c.gender][i]}
    if(C.heroes[0].name.trim().toLowerCase()===C.heroes[1].name.trim().toLowerCase()){C.heroes[1].name+=' II'}
    C.step='relation';drawCreation();
  };
}
function relationKind(){
  const a=C.heroes[0].gender,b=C.heroes[1].gender;return a==='f'&&b==='f'?'girlgirl':a==='m'&&b==='m'?'boyboy':'mixed';
}
function drawRelation(){
  const opts=TGH.RELATIONS[relationKind()];
  if(!C.relation||!opts.some(o=>o[0]===C.relation))C.relation=opts[0][0];
  const [a,b]=C.heroes;
  scr().innerHTML=`<div class="creation narrow"><div class="chead">How are you related? <small>This is how the story will tell it.</small></div>
    <div class="relcard">
      <div class="relpair"><div class="relhero p0"><img src="${A.portrait(Object.assign({},tmpHero(a)),140,170)}"><b>${esc(a.name)}</b></div><div class="relheart">♥</div><div class="relhero p1"><img src="${A.portrait(Object.assign({},tmpHero(b)),140,170)}"><b>${esc(b.name)}</b></div></div>
      <div class="relopts">${opts.map(([k,n])=>`<button class="relbtn ${C.relation===k?'on':''}" data-k="${k}">${n}</button>`).join('')}</div>
      <div class="crow wide"><label>Your little sister, taken in the darkness</label><input type="text" id="sisname" maxlength="14" value="${esc(C.sister.name)}"></div>
      ${C.relation==='couple'?`<div class="crow wide"><label>Whose little sister is she?</label><div class="relopts"><button class="relbtn small ${C.sister.whose===0?'on':''}" data-w="0">${esc(a.name)}'s</button><button class="relbtn small ${C.sister.whose===1?'on':''}" data-w="1">${esc(b.name)}'s</button></div></div>`:''}
    </div>
    <div class="cfoot"><button class="big ghost" id="c-back">← Back</button><button class="big gold" id="c-next">Next: Stats →</button></div></div>`;
  scr().querySelectorAll('.relbtn[data-k]').forEach(btn=>btn.onclick=()=>{C.relation=btn.dataset.k;if(C.relation==='couple'&&C.sister.whose==='both')C.sister.whose=0;drawRelation()});
  scr().querySelectorAll('.relbtn[data-w]').forEach(btn=>btn.onclick=()=>{C.sister.whose=+btn.dataset.w;drawRelation()});
  $('#sisname').oninput=e=>{C.sister.name=e.target.value};
  $('#c-back').onclick=()=>{C.step='look';drawCreation()};
  $('#c-next').onclick=()=>{if(!C.sister.name.trim())C.sister.name='Mira';C.step='stats';drawCreation()};
}
const spent=c=>TGH.STATS.reduce((a,s)=>a+c.base[s]-1,0);
function drawStats(){
  const panel=i=>{
    const c=C.heroes[i],left=TGH.START_POINTS-spent(c);
    const tmp=TGH.newHero({name:c.name,gender:c.gender,look:c.look,base:c.base});
    tmp.equip.weapon={slot:'weapon',fam:TGH.bestWeaponFor(tmp),base:5,plus:0,affixes:[],rarity:'common'};TGH.recalc(tmp,{});
    const rows=TGH.STATS.map(s=>`<div class="srow"><span class="sn" title="${esc(TGH.STATD[s])}">${TGH.STATFULL[s]}</span><button data-s="${s}" data-d="-1" ${c.base[s]<=1?'disabled':''}>−</button><b>${c.base[s]}</b><button data-s="${s}" data-d="1" ${left<=0||c.base[s]>=9?'disabled':''}>+</button><small>${esc(TGH.STATD[s])}</small></div>`).join('');
    return `<div class="cpanel p${i}"><div class="ph">${esc(c.name)}</div><img class="sport" src="${A.portrait(tmp,150,180)}">
      <div class="pleft ${left?'':'done'}">${left} point${left===1?'':'s'} left</div>${rows}
      <div class="derived">${TGH.heroTitle(tmp)} · HP ${tmp.maxHp} · MP ${tmp.maxMp} · ${tmp.maxAp} AP · ${tmp.move} hex/AP · sight ${tmp.sight} · reach ${TGH.attackRange(tmp)}</div></div>`;
  };
  const ready=C.heroes.every(c=>spent(c)===TGH.START_POINTS);
  scr().innerHTML=`<div class="creation"><div class="chead">Your SPECIAL <small>Everyone starts with 1 in each stat and 10 points to add. There are no classes: your stats decide which skills you can learn.</small></div>
    <div class="cpanels">${panel(0)}${panel(1)}</div><div class="cfoot"><button class="big ghost" id="c-back">← Back</button><button class="big gold" id="c-go" ${ready?'':'disabled'}>Begin the journey</button></div></div>`;
  scr().querySelectorAll('.srow button').forEach(b=>b.onclick=()=>{
    const i=+b.closest('.cpanel').classList.contains('p1');const c=C.heroes[i];c.base[b.dataset.s]+=+b.dataset.d;drawStats();
  });
  $('#c-back').onclick=()=>{C.step='relation';drawCreation()};
  $('#c-go').onclick=()=>story();
}

/* ---------- the story ---------- */
function storyPages(){
  const [a,b]=C.heroes,sis=C.sister.name,rel=C.relation;
  const who=rel==='sisters'?`${a.name} and ${b.name}, two sisters`:rel==='brothers'?`${a.name} and ${b.name}, two brothers`:rel==='siblings'?`${a.name} and ${b.name}, brother and sister`:`${a.name} and ${b.name}, together`;
  const whose=rel==='couple'?(C.sister.whose===0?`${a.name}'s little sister`:`${b.name}'s little sister`):`their little sister`;
  const pageSurvive=rel==='couple'
    ?`${a.name} and ${b.name} had gone out that night to gather firewood and watch the stars. That is the only reason they were not at home when it came.`
    :`${a.name} and ${b.name} had stayed up late at the old well, talking about nothing. That is the only reason they were not at home when it came.`;
  return [
    {t:'Hollow Hearth',s:`It was never a grand town, but it was home. Every evening the lanterns were lit along the lane, and ${sis}'s laughter carried all the way to the farm.`},
    {t:'The Darkness',s:`Then the darkness came. It rolled over the valley in a single night, swallowing the lanterns, the forge, the fields. By morning the town lay in ruins, and ${whose} was gone.`},
    {t:'Two who remain',s:`${pageSurvive} Now there is only ${who}, and a promise.`},
    {t:'To Get Her',s:`A stone gate stands at the edge of the ruined town, and beyond it, the caves where the darkness went to ground. Wherever it took ${sis}, the road starts there. Rebuild the town. Grow strong. Go and get her.`}
  ];
}
async function story(){
  disposePreviews();
  const pages=storyPages();
  for(let i=0;i<pages.length;i++){
    await U.modalChoice(pages[i].t,`<p class="story">${esc(pages[i].s)}</p>`,[{label:i===pages.length-1?'Begin':'Continue',cls:'gold'}]);
  }
  G.newGame({heroes:C.heroes.map(c=>({name:c.name.trim(),gender:c.gender,look:c.look,base:c.base})),relation:C.relation,sister:{name:C.sister.name.trim()||'Mira',whose:C.sister.whose}});
  scr().innerHTML='';
  G.toTown();
  setTimeout(()=>U.toast('Welcome home. Take the stone gate when you are ready.'),600);
}

/* ---------- the town ---------- */
const matChips=o=>Object.entries(o).filter(([,v])=>v>0).map(([k,v])=>`<span class="mchip" style="border-color:${TGH.MATS[k].col}" title="${esc(TGH.MATS[k].d)}">${TGH.MATS[k].n} ${Math.round(v*10)/10}</span>`).join('');
U.showTown=function(){
  const s=G.s;G.mode='town';U.hudVisible(false);
  A.buildTown(s.town);A.setTownHeroes(s.heroes);A.show('town');
  renderTown();
};
function renderTown(){
  const s=G.s,t=s.town;
  scr().innerHTML=`<div class="town">
    <div class="tbar"><span class="gold">${t.gold} gold</span>${matChips(t.mats)}<span class="grow"></span><button class="ghost small" id="tb-set">Settings</button></div>
    <div class="tparty">${s.heroes.map((h,i)=>`<div class="hcard p${i}" data-i="${i}"><img class="port" src="${A.portrait(h)}"><div class="hc-main"><div class="hc-name">${esc(h.name)} <span class="lv">Lv ${h.level}</span>${(h.points||h.skillPoints)?'<span class="ping">!</span>':''}</div><div class="hc-title">${TGH.heroTitle(h)}</div><div class="bar hp"><i style="width:100%"></i><b>${h.maxHp} HP</b></div><div class="bar mp"><i style="width:100%"></i><b>${h.maxMp} MP</b></div></div></div>`).join('')}</div>
    <div class="tmenu">
      <button class="tbtn gate" data-p="gate"><b>Stone Gate</b><small>Set out on an adventure</small></button>
      <button class="tbtn" data-p="hero0"><b>${esc(s.heroes[0].name)}</b><small>Stats, skills, gear</small></button>
      <button class="tbtn" data-p="hero1"><b>${esc(s.heroes[1].name)}</b><small>Stats, skills, gear</small></button>
      <button class="tbtn" data-p="forge"><b>Forge</b><small>Lv ${t.b.forge} · upgrade gear</small></button>
      <button class="tbtn" data-p="witch"><b>Witch’s Hut</b><small>Lv ${t.b.witch} · potions</small></button>
      <button class="tbtn" data-p="vault"><b>Vault</b><small>Lv ${t.b.vault} · ${t.pack.length}/${TGH.vaultCap(t.b.vault)} items</small></button>
      <button class="tbtn" data-p="farm"><b>Farm</b><small>${t.b.farm?'Lv '+t.b.farm:'in ruins'}</small></button>
      <button class="tbtn" data-p="lodge"><b>Family Home</b><small>${t.b.lodge?'Lv '+t.b.lodge:'in ruins'} · rest</small></button>
    </div></div>`;
  scr().querySelectorAll('.tbtn').forEach(b=>b.onclick=()=>townPanel(b.dataset.p));
  scr().querySelectorAll('.tparty .hcard').forEach(c=>c.onclick=()=>U.heroMenu(+c.dataset.i));
  $('#tb-set').onclick=()=>settings();
}
function costHtml(c,t){return Object.entries(c).map(([k,v])=>{const have=k==='gold'?t.gold:(t.mats[k]||0);return `<span class="cost ${have>=v?'ok':'no'}">${k==='gold'?v+' gold':v+' '+TGH.MATS[k].n}</span>`}).join(' ')}
const canPay=(c,t)=>Object.entries(c).every(([k,v])=>(k==='gold'?t.gold:(t.mats[k]||0))>=v);
const pay=(c,t)=>{for(const [k,v] of Object.entries(c)){if(k==='gold')t.gold-=v;else t.mats[k]-=v}};
function buildCard(key){
  const t=G.s.town,B=TGH.BUILD[key],L=t.b[key]||0;
  if(L>=B.max)return `<div class="bcard"><b>${B.n} · Lv ${L} (max)</b><small>${esc(B.d)}</small></div>`;
  const c=B.cost(L+1);
  return `<div class="bcard"><b>${B.n} · ${L?'Lv '+L:'in ruins'}</b><small>${esc(B.d)}</small><div>${costHtml(c,t)}</div><button class="gold small" data-build="${key}" ${canPay(c,t)?'':'disabled'}>${L?'Upgrade to Lv '+(L+1):'Rebuild'}</button></div>`;
}
function townPanel(p){
  const s=G.s,t=s.town;
  if(p.startsWith('hero')){U.heroMenu(+p[4]);return}
  let body='',title='';
  if(p==='gate'){
    title='The Stone Gate';
    body=TGH.ADVENTURES.map(k=>{
      const B=TGH.BIOMES[k],req=TGH.ADV_REQ[k],open=!req||t.beaten.includes(req),done=t.beaten.includes(k);
      const lvl=TGH.LEVEL_BASE[k];
      return `<div class="advcard ${open?'':'locked'}"><div><b>${esc(B.name)}</b> ${done?'<span class="done">cleared</span>':''}<small>Foes around level ${lvl}–${lvl+4} · ${B.h} rows</small><small>${esc(B.flavor)}</small>${k==='cave'?`<small>Cave beasts beaten: ${(t.caveBeaten||[]).length}/3</small>`:''}</div>${open?`<button class="gold small" data-go="${k}">Set out</button>`:`<span class="lock">Beat ${esc(TGH.BIOMES[req].name)} first</span>`}</div>`;
    }).join('');
  }else if(p==='lodge'){
    title='Family Home';
    body=`<p>Rest here and both heroes wake at full strength. You also heal fully every time you return home.</p><button class="small" id="rest">Rest</button><p class="story">${esc(G.sisterName())}'s scarf hangs by the door. You will bring her back.</p>${buildCard('lodge')}`;
  }else if(p==='forge'){
    title='Forge';
    const items=[];for(const h of s.heroes)for(const sl of TGH.SLOTS)if(h.equip[sl])items.push({it:h.equip[sl],who:h});for(const it of t.pack)items.push({it,who:null});
    const mx=TGH.forgeMax(t.b.forge);
    body=buildCard('forge')+`<p>Items can be upgraded to +${mx}. Each plus adds 10% to the item's base power or armor.</p>`+items.map(({it,who},n)=>{
      if(!it.base)return '';
      const cost=TGH.upgradeCost(it),can=(it.plus||0)<mx;
      return `<div class="bcard"><b style="color:${TGH.RAR[it.rarity].c}">${esc(TGH.itemTitle(it))}</b><small>${who?'equipped by '+esc(who.name):'in the pack'} · ${TGH.itemLines(it).join(' · ')}</small>${can?`<div>${costHtml(cost,t)}</div><button class="small" data-up="${it.id}" ${canPay(cost,t)?'':'disabled'}>Upgrade to +${(it.plus||0)+1}</button>`:'<small>At the limit for this forge.</small>'}</div>`;
    }).join('');
  }else if(p==='witch'){
    title='Witch’s Hut';
    const L=t.b.witch,disc=Math.min(.25,Math.max(...s.heroes.map(h=>h.stats.cha))*.02);
    const stock=['potion','mpotion','scroll',...(L>=2?['apdraught']:[]),...(L>=3?['phoenix']:[])];
    body=buildCard('witch')+`<p>Charisma gets you a discount (${Math.round(disc*100)}%).</p>`+stock.map(id=>{
      const P=TGH.POTIONS[id],price=Math.round(P.price*(1-disc));
      return `<div class="bcard"><b>${esc(P.n)} · you have ${t.items[id]||0}</b><small>${esc(P.d)}</small><button class="small" data-buy="${id}|${price}" ${t.gold>=price&&(t.items[id]||0)<9?'':'disabled'}>Buy for ${price} gold</button></div>`;
    }).join('');
  }else if(p==='farm'){
    title='Farm';body=`<p>Fresh meals at home make both heroes sturdier. Each level adds 6 max health.</p>`+buildCard('farm');
  }else if(p==='vault'){
    title='Vault';
    body=buildCard('vault')+`<p>${t.pack.length} / ${TGH.vaultCap(t.b.vault)} pieces stored. Sell what you do not need.</p>`+(t.pack.length?t.pack.map(it=>`<div class="bcard"><b style="color:${TGH.RAR[it.rarity].c}">${esc(TGH.itemTitle(it))}</b><small>${TGH.RAR[it.rarity].l} ${TGH.SLOTN[it.slot]} · ${TGH.itemLines(it).join(' · ')}</small><button class="small ghost" data-sell="${it.id}">Sell for ${TGH.sellValue(it)} gold</button></div>`).join(''):'<p class="empty">Empty.</p>');
  }
  const m=document.createElement('div');m.className='modal';
  m.innerHTML=`<div class="mbox wide"><h2>${title}</h2><div class="mbody scroll">${body}</div><div class="mbtns"><button class="mb" id="pclose">Close</button></div></div>`;
  document.body.appendChild(m);
  const reopen=()=>{m.remove();townPanel(p);renderTown()};
  m.querySelector('#pclose').onclick=()=>{m.remove();renderTown()};
  m.querySelectorAll('[data-build]').forEach(b=>b.onclick=()=>{const k=b.dataset.build,L=t.b[k]||0,c=TGH.BUILD[k].cost(L+1);if(!canPay(c,t))return;pay(c,t);t.b[k]=L+1;
    for(const h of s.heroes)TGH.recalc(h,t);A.buildTown(t);A.setTownHeroes(s.heroes);G.save();reopen()});
  m.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{const id=b.dataset.up;let it=t.pack.find(x=>x.id===id);let who=null;if(!it)for(const h of s.heroes)for(const sl of TGH.SLOTS)if(h.equip[sl]&&h.equip[sl].id===id){it=h.equip[sl];who=h}
    const c=TGH.upgradeCost(it);if(!canPay(c,t))return;pay(c,t);it.plus=(it.plus||0)+1;for(const h of s.heroes)TGH.recalc(h,t);G.save();reopen()});
  m.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const [id,pr]=b.dataset.buy.split('|');if(t.gold<+pr)return;t.gold-=+pr;t.items[id]=(t.items[id]||0)+1;G.save();reopen()});
  m.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>{const i=t.pack.findIndex(x=>x.id===b.dataset.sell);if(i<0)return;t.gold+=TGH.sellValue(t.pack[i]);t.pack.splice(i,1);G.save();reopen()});
  const rest=m.querySelector('#rest');if(rest)rest.onclick=()=>{for(const h of s.heroes){h.hp=h.maxHp;h.mp=h.maxMp}U.toast('You feel rested.');};
  m.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{m.remove();scr().innerHTML='';U.hudVisible(true);G.startRun(b.dataset.go)});
}
function settings(){
  const m=document.createElement('div');m.className='modal';
  m.innerHTML=`<div class="mbox wide"><h2>Settings</h2><div class="mbody scroll">
    <label class="chk"><input type="checkbox" id="s-fast" ${G.settings.fast?'checked':''}> Fast animations</label>
    <p>Save code. Copy it to back up or move your save to another device.</p>
    <textarea id="s-exp" rows="4" readonly></textarea>
    <button class="small" id="s-copy">Copy code</button>
    <p>Import a save code (replaces this game):</p>
    <textarea id="s-imp" rows="3"></textarea><button class="small" id="s-load">Load</button>
    <hr><button class="small ghost" id="s-title">Back to title</button> <button class="small ghost danger" id="s-wipe">Delete save</button></div>
    <div class="mbtns"><button class="mb" id="s-close">Close</button></div></div>`;
  document.body.appendChild(m);
  $('#s-exp').value=G.exportSave();
  m.querySelector('#s-fast').onchange=e=>{G.settings.fast=e.target.checked;A.fast=G.settings.fast;G.save()};
  m.querySelector('#s-copy').onclick=()=>{$('#s-exp').select();try{document.execCommand('copy');U.toast('Copied.')}catch(e){}};
  m.querySelector('#s-load').onclick=()=>{if(G.importSave($('#s-imp').value)&&G.load()){m.remove();scr().innerHTML='';resume()}else U.toast('That code did not load.')};
  m.querySelector('#s-title').onclick=()=>{m.remove();G.save();U.showTitle()};
  m.querySelector('#s-wipe').onclick=()=>{if(confirm('Delete the saved game for good?')){G.wipeSave();m.remove();U.showTitle()}};
  m.querySelector('#s-close').onclick=()=>m.remove();
}
U.settings=settings;
U.ending=async function(){
  const sis=G.sisterName();
  const pages=[
    {t:'The Unlit King falls',s:`The crown clatters to the stone. The darkness shudders, thins, and pulls back like a tide.`},
    {t:'A small voice',s:`Behind the throne, a figure sits curled against the wall, a scarf pulled up to her chin. “${G.s.heroes[0].name}? ${G.s.heroes[1].name}? You took so long.”`},
    {t:`${sis}`,s:`You carry ${sis} out of the dark and into the light. The lanterns of Hollow Hearth are waiting to be lit again, and this time, you will light them together.`},
    {t:'To Get Her',s:'Thank you for playing. You can keep exploring, rebuild the town, and take on the adventures again.'}];
  for(let i=0;i<pages.length;i++)await U.modalChoice(pages[i].t,`<p class="story">${esc(pages[i].s)}</p>`,[{label:i===pages.length-1?'Return home':'Continue',cls:'gold'}]);
};

/* ---------- the hero menu ---------- */
U.heroMenu=function(i,tab){
  if(G.busy)return;
  U.closePopup&&U.closePopup();
  tab=tab||U._tab||'stats';U._tab=tab;
  const s=G.s,h=s.heroes[i],t=s.town;
  const old=document.querySelector('.modal.hm');if(old)old.remove();
  const m=document.createElement('div');m.className='modal hm';
  const tabs=[['stats','Stats'+(h.points?' ('+h.points+')':'')],['skills','Skills'+(h.skillPoints?' ('+h.skillPoints+')':'')],['gear','Gear']];
  let body='';
  if(tab==='stats'){
    body=`<div class="hmgrid"><div>${TGH.STATS.map(k=>`<div class="srow"><span class="sn">${TGH.STATFULL[k]}</span><b>${h.stats[k]}${h.bonus[k]?`<small class="bn"> (${h.base[k]}+${h.bonus[k]})</small>`:''}</b><button data-sp="${k}" ${h.points>0&&h.base[k]<30?'':'disabled'}>+</button><small>${esc(TGH.STATD[k])}</small></div>`).join('')}
      <div class="pleft ${h.points?'':'done'}">${h.points} stat point${h.points===1?'':'s'} to spend</div></div>
      <div class="derived big"><div><b>${TGH.heroTitle(h)}</b> · Level ${h.level} · XP ${h.xp}/${TGH.xpNeed(h.level)}</div>
      <div>Health ${h.hp}/${h.maxHp} · Mana ${h.mp}/${h.maxMp}</div><div>Action Points ${h.maxAp} · ${h.move} hexes per AP · Sight ${h.sight}</div>
      <div>Reach: weapon ${TGH.attackRange(h)} · bow skills ${TGH.rangeBow(h)} · spells ${TGH.rangeMage(h)}</div>
      <div>Armor ${h.armor} · Crit ${Math.round(h.crit)}% (×${(h.critdmg/100).toFixed(2)}) · Evasion ${Math.round(h.eva)}%</div>
      <small>Every level gives ${TGH.POINTS_PER_LEVEL} stat points and 1 skill point. At Level ${TGH.maxAP({level:h.level+6,stats:h.stats})>h.maxAp?h.level+6-((h.level-1)%6):'—'} you may gain another AP.</small></div></div>`;
  }else if(tab==='skills'){
    const known=h.skills.map(id=>TGH.SKILLS[id]);
    const attune=`<div class="attune"><b>Attunement</b> (spells ${h.skills.includes('imbue')?'and arrows ':''}use this element):${TGH.ELEMENTS.map(e=>`<button class="el ${h.attune===e?'on':''}" data-el="${e}" style="--c:${TGH.EL_COL[e]}">${cap(e)}</button>`).join('')}</div>`;
    const groups=['war','arc','mag'].map(d=>{
      const list=Object.values(TGH.SKILLS).filter(k=>k.disc===d);
      return `<div class="skgroup"><div class="sgh" style="color:${TGH.DISC[d].col}">${TGH.DISC[d].n}s <small>need ${TGH.STATN[TGH.DISC[d].stat]}</small></div>${list.map(k=>{
        const has=h.skills.includes(k.id),can=TGH.canLearn(h,k.id),mp=TGH.skillMp(h,k);
        const req=Object.entries(k.need).map(([st,v])=>`<span class="${h.stats[st]>=v?'ok':'no'}">${TGH.STATN[st]} ${v}</span>`).join(' ')+(k.lvl?` <span class="${h.level>=k.lvl?'ok':'no'}">Lv ${k.lvl}</span>`:'');
        return `<div class="skcard ${has?'has':can?'can':'lock'}"><div class="skh"><b>${esc(k.n)}</b><span>${k.ap} AP · ${k.mp?mp+' MP':'free'} · ${k.range==='bow'?'bow reach':k.range==='mage'?'spell reach':k.range?'reach '+k.range:'self'}</span></div><small>${esc(k.d)}</small><div class="req">${req}</div>${has?'<span class="learned">Learned</span>':`<button class="small ${can&&h.skillPoints?'gold':''}" data-learn="${k.id}" ${can&&h.skillPoints>0?'':'disabled'}>Learn (1 SP)</button>`}</div>`;
      }).join('')}</div>`;
    }).join('');
    body=`<div class="pleft ${h.skillPoints?'':'done'}">${h.skillPoints} skill point${h.skillPoints===1?'':'s'}</div>${attune}<div class="skgrid">${groups}</div>`;
  }else{
    const slots=TGH.SLOTS.map(sl=>{const it=h.equip[sl];return `<div class="slot" data-slot="${sl}"><span class="sl">${TGH.SLOTN[sl]}</span>${it?`<b style="color:${TGH.RAR[it.rarity].c}">${esc(TGH.itemTitle(it))}</b><small>${TGH.itemLines(it).join(' · ')}</small><button class="small ghost" data-un="${sl}">Unequip</button>`:'<small class="empty">empty</small>'}</div>`}).join('');
    const pack=t.pack.map(it=>{const cur=h.equip[it.slot];return `<div class="slot pk"><b style="color:${TGH.RAR[it.rarity].c}">${esc(TGH.itemTitle(it))}</b><small>${TGH.RAR[it.rarity].l} ${TGH.SLOTN[it.slot]} · ${TGH.itemLines(it).join(' · ')}</small>${cur?`<small class="cmp">now: ${esc(TGH.itemTitle(cur))}</small>`:''}<button class="small" data-eq="${it.id}">Equip</button></div>`}).join('')||'<p class="empty">The shared pack is empty. Loot from adventures lands here.</p>';
    body=`<div class="gear"><div><h3>${esc(h.name)} wears</h3>${slots}</div><div><h3>Shared pack (${t.pack.length})</h3><div class="packlist">${pack}</div></div></div>`;
  }
  m.innerHTML=`<div class="mbox wide hmbox"><div class="hmtop"><div class="hmwho">${s.heroes.map((x,k)=>`<button class="hmsel p${k} ${k===i?'on':''}" data-h="${k}"><img src="${A.portrait(x,56,68)}"><span>${esc(x.name)}${(x.points||x.skillPoints)?' •':''}</span></button>`).join('')}</div><div class="hmtabs">${tabs.map(([k,n])=>`<button class="${k===tab?'on':''}" data-t="${k}">${n}</button>`).join('')}</div></div><div class="mbody scroll">${body}</div><div class="mbtns"><button class="mb" id="hmclose">Done</button></div></div>`;
  document.body.appendChild(m);
  const again=(ni,nt)=>U.heroMenu(ni==null?i:ni,nt||tab);
  m.querySelector('#hmclose').onclick=()=>{m.remove();if(G.mode==='town')renderTown();else U.refresh();G.save()};
  m.querySelectorAll('.hmsel').forEach(b=>b.onclick=()=>again(+b.dataset.h));
  m.querySelectorAll('.hmtabs button').forEach(b=>b.onclick=()=>again(i,b.dataset.t));
  m.querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>{TGH.spendPoint(h,b.dataset.sp,t);again()});
  m.querySelectorAll('[data-learn]').forEach(b=>b.onclick=()=>{if(TGH.learnSkill(h,b.dataset.learn))again()});
  m.querySelectorAll('[data-el]').forEach(b=>b.onclick=()=>{h.attune=b.dataset.el;if(h.skills.includes('imbue'))h.arrowEl=b.dataset.el;again()});
  const swap=()=>{TGH.recalc(h,t);if(h.rig)A.setEquipLook(h)};
  m.querySelectorAll('[data-un]').forEach(b=>b.onclick=()=>{const it=h.equip[b.dataset.un];if(!it)return;t.pack.push(it);delete h.equip[b.dataset.un];swap();again()});
  m.querySelectorAll('[data-eq]').forEach(b=>b.onclick=()=>{const k=t.pack.findIndex(x=>x.id===b.dataset.eq);if(k<0)return;const it=t.pack.splice(k,1)[0];const cur=h.equip[it.slot];if(cur)t.pack.push(cur);h.equip[it.slot]=it;swap();again()});
};
})();
