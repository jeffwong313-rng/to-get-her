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
function newLook(i){const r=n=>Math.floor(Math.random()*n);const o=r(L.outfit.length);
  return {skin:r(L.skin.length),hairStyle:r(L.hairStyle.length),hairColor:r(L.hairColor.length),eye:r(L.eye.length),eyeStyle:r(L.eyeStyle.length),brow:r(L.brow.length),mouth:r(L.mouth.length),mark:r(4)===0?1+r(L.mark.length-1):0,
    top:r(L.top.length),topCol:o,trimCol:(o+3+r(5))%L.outfit.length,bottom:r(L.bottom.length),bottomCol:r(L.outfit.length),shoe:r(L.shoe.length-1),shoeCol:r(L.outfit.length),accessory:r(3)===0?1+r(L.accessory.length-1):0,accCol:r(L.outfit.length)}}
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
const LOOK_TABS=[
  ['body','Body',[['sw','skin','Skin tone']]],
  ['hair','Hair',[['chip','hairStyle','Hair style'],['sw','hairColor','Hair color']]],
  ['face','Face',[['chip','eyeStyle','Eye shape'],['sw','eye','Eye color'],['chip','brow','Brows'],['chip','mouth','Mouth'],['chip','mark','Face mark']]],
  ['top','Top',[['chip','top','Top style'],['sw','topCol','Main color'],['sw','trimCol','Trim color']]],
  ['bottom','Pants',[['chip','bottom','Bottom style'],['sw','bottomCol','Color']]],
  ['shoe','Shoes',[['chip','shoe','Shoe style'],['sw','shoeCol','Color']]],
  ['extra','Extras',[['chip','accessory','Accessory'],['sw','accCol','Accessory color']]],
];
const COLOR_LIST={skin:'skin',hairColor:'hairColor',eye:'eye',topCol:'outfit',trimCol:'outfit',bottomCol:'outfit',shoeCol:'outfit',accCol:'outfit'};
const STYLE_NAMES={hairStyle:'hairStyleN',eyeStyle:'eyeStyleN',brow:'browN',mouth:'mouthN',mark:'markN',top:'topN',bottom:'bottomN',shoe:'shoeN',accessory:'accessoryN'};
const STYLE_LIST={hairStyle:'hairStyle',eyeStyle:'eyeStyle',brow:'brow',mouth:'mouth',mark:'mark',top:'top',bottom:'bottom',shoe:'shoe',accessory:'accessory'};
function drawLook(){
  C.tab=C.tab||['body','body'];
  const panel=i=>{
    const c=C.heroes[i],look=TGH.look(c.look),tab=C.tab[i];
    const rows=LOOK_TABS.find(t=>t[0]===tab)[2].map(([kind,key,label])=>{
      if(kind==='sw'){const list=L[COLOR_LIST[key]],names=L[COLOR_LIST[key]+'N']||[];
        return `<div class="crow"><label>${label}</label><div class="swatches" data-k="${key}" data-i="${i}">${list.map((col,k)=>`<button class="sw ${look[key]===k?'on':''}" style="background:${col}" data-v="${k}" title="${esc(names[k]||'')}" aria-label="${esc(names[k]||col)}"></button>`).join('')}</div></div>`}
      const names=L[STYLE_NAMES[key]];
      return `<div class="crow"><label>${label}</label><div class="opts" data-k="${key}" data-i="${i}">${names.map((n,k)=>`<button class="opt ${look[key]===k?'on':''}" data-v="${k}">${esc(n)}</button>`).join('')}</div></div>`;
    }).join('');
    return `<div class="cpanel look p${i}">
      <div class="ph">Player ${i+1}</div>
      <div class="lcol"><canvas class="prev" id="prev${i}"></canvas>
      <input type="text" class="cname" data-i="${i}" maxlength="14" placeholder="${NAMES[c.gender][i]}" value="${esc(c.name)}" aria-label="Name">
      <div class="gender" data-i="${i}"><button class="${c.gender==='f'?'on':''}" data-g="f">Girl</button><button class="${c.gender==='m'?'on':''}" data-g="m">Boy</button></div>
      <button class="ghost small rnd" data-i="${i}">Randomize</button></div>
      <div class="rcol"><div class="ltabs" data-i="${i}">${LOOK_TABS.map(t=>`<button class="${t[0]===tab?'on':''}" data-t="${t[0]}">${t[1]}</button>`).join('')}</div>
      <div class="cscroll">${rows}</div></div>
    </div>`;
  };
  scr().innerHTML=`<div class="creation"><div class="chead">Who are you? <small>Make the two heroes: style and color for every part. Gender only changes the default name.</small></div><div class="cpanels">${panel(0)}${panel(1)}</div><div class="cfoot"><button class="big gold" id="c-next">Next: Relationship →</button></div></div>`;
  for(const i of [0,1]){const cv=$('#prev'+i);C.prev[i]=A.preview(cv);C.prev[i].set(tmpHero(C.heroes[i]))}
  const refresh=i=>{C.prev[i].set(tmpHero(C.heroes[i]))};
  scr().querySelectorAll('.swatches').forEach(el=>el.querySelectorAll('.sw').forEach(b=>b.onclick=()=>{
    const i=+el.dataset.i,k=el.dataset.k;C.heroes[i].look[k]=+b.dataset.v;el.querySelectorAll('.sw').forEach(x=>x.classList.toggle('on',x===b));refresh(i)}));
  scr().querySelectorAll('.opts').forEach(el=>el.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
    const i=+el.dataset.i,k=el.dataset.k;C.heroes[i].look[k]=+b.dataset.v;el.querySelectorAll('.opt').forEach(x=>x.classList.toggle('on',x===b));refresh(i)}));
  scr().querySelectorAll('.ltabs').forEach(el=>el.querySelectorAll('button').forEach(b=>b.onclick=()=>{C.tab[+el.dataset.i]=b.dataset.t;C.keep=true;drawCreation()}));
  scr().querySelectorAll('.gender').forEach(el=>el.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    const i=+el.dataset.i;C.heroes[i].gender=b.dataset.g;el.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
    const ph=scr().querySelector('.cname[data-i="'+i+'"]');ph.placeholder=NAMES[C.heroes[i].gender][i];refresh(i)}));
  scr().querySelectorAll('.cname').forEach(el=>el.oninput=()=>{C.heroes[+el.dataset.i].name=el.value});
  scr().querySelectorAll('.rnd').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;C.heroes[i].look=newLook(i);drawCreation();});
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
const H_=TGH.help;
function heroSummary(h){
  const d=TGH.DISC,tiers=TGH.TIERS;
  const open=H_.learnable(h);
  const byDisc=Object.keys(d).map(k=>{
    const v=h.stats[d[k].stat],t=[1,2,3,4].filter(n=>v>=tiers[n].stat).length;
    return `<div class="dsc" style="--c:${d[k].col}"><b>${d[k].n}</b><span>${d[k].n==='Monk'?'END':TGH.STATN[d[k].stat]} ${v}</span><span class="tr">${t?'Tier '+t:'locked'}</span></div>`}).join('');
  const nxt=H_.nearest(h);
  return `<div class="dsum">${byDisc}</div>
    <div class="derived"><span>HP <b>${h.maxHp}</b></span><span>MP <b>${h.maxMp}</b></span><span>AP <b>${h.maxAp}</b></span><span>Move <b>${h.move}</b>/AP</span><span>Sight <b>${h.sight}</b></span><span>Armor <b>${h.armor}</b></span><span>Evasion <b>${Math.round(h.eva)}%</b></span><span>Crit <b>${Math.round(h.crit)}%</b></span></div>
    <div class="reachline">Reach: sword ${1} · bow ${TGH.rangeBow(h)} · spells ${TGH.rangeMage(h)} ${H_.q('reach')}</div>
    <div class="open">Skills you can learn now (${open.length}): ${open.length?open.map(k=>`<span class="skchip" style="--c:${d[k.disc].col}" ${H_.tipAttr(k.d)}>${esc(k.n)}</span>`).join(''):'<i>none yet</i>'}</div>
    ${nxt?`<div class="nearest">Closest unlock: <b>${esc(nxt.k.n)}</b> (${esc(TGH.skillReqText(nxt.k))}) · ${nxt.miss?nxt.miss+' stat point'+(nxt.miss===1?'':'s')+' short':'stats ready, needs level '+TGH.skillLvl(nxt.k)}</div>`:''}`;
}
function drawStats(){
  const panel=i=>{
    const c=C.heroes[i],left=TGH.START_POINTS-spent(c);
    const tmp=TGH.newHero({name:c.name,gender:c.gender,look:c.look,base:c.base});
    tmp.equip.weapon={slot:'weapon',fam:TGH.bestWeaponFor(tmp),base:5,plus:0,affixes:[],rarity:'common'};TGH.recalc(tmp,{});
    const rows=TGH.STATS.map(s=>{
      const v=c.base[s],nx=H_.next(s,v);
      return `<div class="srow2"><div class="sline"><span class="sn">${TGH.STATFULL[s]} ${H_.q(s)}</span><button data-s="${s}" data-d="-1" ${v<=1?'disabled':''} aria-label="Lower ${TGH.STATFULL[s]}">−</button><b>${v}</b><button data-s="${s}" data-d="1" ${left<=0||v>=11?'disabled':''} aria-label="Raise ${TGH.STATFULL[s]}">+</button></div>
        <small class="sd">${esc(TGH.STATD[s])}</small>
        <small class="pp">Each point: ${esc(H_.perPoint[s])}</small>
        ${nx?`<small class="nx">Next: <b>${nx.more} more point${nx.more===1?'':'s'}</b> (to ${nx.at}) → ${esc(nx.text)}</small>`:'<small class="nx">Maxed out for now.</small>'}</div>`}).join('');
    return `<div class="cpanel stat p${i}"><div class="ph">${esc(c.name)} <small>${TGH.heroTitle(tmp)}</small></div>
      <div class="statcols"><div class="sleft"><img class="sport" src="${A.portrait(tmp,150,180)}"><div class="pleft ${left?'':'done'}">${left} point${left===1?'':'s'} left</div>${heroSummary(tmp)}</div><div class="sright">${rows}</div></div></div>`;
  };
  const ready=C.heroes.every(c=>spent(c)===TGH.START_POINTS);
  scr().innerHTML=`<div class="creation"><div class="chead">Your SPECIAL ${H_.q('special')} <small>Everyone starts with 1 in each stat and ${TGH.START_POINTS} points to add (up to 11 in one stat). There are no classes: your stats decide which skills open up. Tier 2 skills need 10 in their stat.</small></div>
    <div class="cpanels">${panel(0)}${panel(1)}</div><div class="cfoot"><button class="big ghost" id="c-back">← Back</button><button class="big gold" id="c-go" ${ready?'':'disabled'}>Begin the journey</button></div></div>`;
  scr().querySelectorAll('.srow2 button').forEach(b=>b.onclick=()=>{
    const i=+b.closest('.cpanel').classList.contains('p1');const c=C.heroes[i];c.base[b.dataset.s]+=+b.dataset.d;
    const keep=scr().querySelectorAll('.sright');const sc=[...keep].map(x=>x.scrollTop);drawStats();scr().querySelectorAll('.sright').forEach((x,k)=>x.scrollTop=sc[k]);
  });
  $('#c-back').onclick=()=>{C.step='relation';drawCreation()};
  $('#c-go').onclick=()=>story();
}

/* ---------- the story ---------- */
async function story(){
  disposePreviews();
  const [a,b]=C.heroes;
  const mk=c=>({look:c.look,gender:c.gender,equip:{},name:c.name.trim()});
  await U.storybook({a:mk(a),b:mk(b),rel:C.relation,sis:C.sister.name.trim()||'Mira',whose:C.relation==='couple'?C.sister.whose:'both'});
  G.newGame({heroes:C.heroes.map(c=>({name:c.name.trim(),gender:c.gender,look:c.look,base:c.base})),relation:C.relation,sister:{name:C.sister.name.trim()||'Mira',whose:C.sister.whose}});
  scr().innerHTML='';
  G.toTown();
  setTimeout(()=>U.toast('Welcome home. Take the stone gate when you are ready.'),600);
}
U.rereadStory=function(){
  const s=G.s,[a,b]=s.heroes;
  return U.storybook({a,b,rel:s.relation,sis:G.sisterName(),whose:s.sister.whose},{reread:true});
};

/* ---------- the town ---------- */
const matChips=o=>Object.entries(o).filter(([,v])=>v>0).map(([k,v])=>`<span class="mchip" style="border-color:${TGH.MATS[k].col}" title="${esc(TGH.MATS[k].d)}">${TGH.MATS[k].n} ${Math.round(v*10)/10}</span>`).join('');
U.showTown=function(){
  const s=G.s;G.mode='town';U.hudVisible(false);
  A.buildTown(s.town);A.setTownHeroes(s.heroes);A.show('town');
  renderTown();
};
function renderTown(){
  if(TGH.sound)TGH.sound.music('town');
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
      <button class="tbtn" data-p="best"><b>Bestiary</b><small>${Object.keys(t.bestiary||{}).length} kinds studied</small></button>
      <button class="tbtn" data-p="farm"><b>Farm</b><small>${t.b.farm?'Lv '+t.b.farm:'in ruins'}</small></button>
      <button class="tbtn" data-p="lodge"><b>Family Home</b><small>${t.b.lodge?'Lv '+t.b.lodge:'in ruins'} · rest</small></button>
    </div></div>`;
  scr().querySelectorAll('.tbtn').forEach(b=>b.onclick=()=>townPanel(b.dataset.p));
  scr().querySelectorAll('.tparty .hcard').forEach(c=>c.onclick=()=>U.heroMenu(+c.dataset.i));
  $('#tb-set').onclick=()=>settings();
}
function costHtml(c,t){return Object.entries(c).map(([k,v])=>{const have=k==='gold'?t.gold:(t.mats[k]||0);return `<span class="cost ${have>=v?'ok':'no'}">${k==='gold'?v+' gold':v+' '+TGH.MATS[k].n}</span>`}).join(' ')}
const canPay=(c,t)=>Object.entries(c).every(([k,v])=>(k==='gold'?t.gold:(t.mats[k]||0))>=v);
const pay=(c,t)=>{for(const [k,v] of Object.entries(c)){if(k==='gold')t.gold-=v;else t.mats[k]=Math.round((t.mats[k]-v)*10)/10}};
function buildCard(key){
  const t=G.s.town,B=TGH.BUILD[key],L=t.b[key]||0;
  if(L>=B.max)return `<div class="bcard"><b>${B.n} · Lv ${L} (max)</b><small>${esc(B.d)}</small></div>`;
  const c=B.cost(L+1);
  return `<div class="bcard"><b>${B.n} · ${L?'Lv '+L:'in ruins'}</b><small>${esc(B.d)}</small><div>${costHtml(c,t)}</div><button class="gold small" data-build="${key}" ${canPay(c,t)?'':'disabled'}>${L?'Upgrade to Lv '+(L+1):'Rebuild'}</button></div>`;
}
const gateLand={};
function townPanel(p){
  const s=G.s,t=s.town;
  if(p.startsWith('hero')){U.heroMenu(+p[4]);return}
  if(p==='best'){U.bestiary();return}
  let body='',title='';
  if(p==='gate'){
    title='The Stone Gate';
    body=TGH.ADVENTURES.map(k=>{
      const req=TGH.ADV_REQ[k],open=!req||t.beaten.includes(req),done=t.beaten.includes(k),L=TGH.LENGTHS[k];
      if(!open&&!done)return `<div class="advcard locked"><div><b>???</b><small>A land you have not reached yet. Beat the one before it to see more.</small></div></div>`;
      const pick=(k==='cave'||k==='dark')?null:(TGH.LANDS[gateLand[k]]&&TGH.LAND_PICK.includes(gateLand[k])?gateLand[k]:TGH.LAND_PICK[0]);
      const key=TGH.biomeKey(k,pick),B=TGH.BIOMES[key];
      const chips=pick?`<div class="landrow">${TGH.LAND_PICK.map(l=>`<button class="landchip ${l===pick?'on':''}" data-land="${k}|${l}" style="border-color:${TGH.EL_COL[TGH.LANDS[l].el]}"><span style="color:${TGH.EL_COL[TGH.LANDS[l].el]}">\u25CF</span> ${esc(TGH.LANDS[l].name)}</button>`).join('')}</div>`:'';
      const m=TGH.landMod(t,key);
      return `<div class="advcard"><div><b>${esc(pick?L.n:B.name)}</b> ${done?'<span class="done">cleared</span>':''}${pick?`<small>${esc(L.feel)}</small>`:''}${chips}${pick?`<small><b>${esc(B.name.split(': ')[1])}</b> (${esc(B.el)}): ${esc(B.flavor)}</small>`:`<small>${esc(B.flavor)}</small>`}${m?`<small class="mod ${TGH.LAND_MOD[m].bad?'bad':'good'}"><b>${TGH.LAND_MOD[m].n}:</b> ${TGH.LAND_MOD[m].d}</small>`:'<small class="mod">No twist on this trip.</small>'}${k==='cave'?`<small>Cave beasts beaten: ${(t.caveBeaten||[]).length}/3</small>`:''}</div><button class="gold small" data-go="${k}|${pick||''}">Set out</button></div>`;
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
    const stock=['potion','mpotion','ebrew','scroll',...(L>=2?['apdraught']:[]),...(L>=3?['phoenix']:[])];
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
  m.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{m.remove();scr().innerHTML='';U.hudVisible(true);{const [len,land]=b.dataset.go.split('|');G.startRun(len,land||undefined)}});
  m.querySelectorAll('[data-land]').forEach(b=>b.onclick=()=>{const [len,land]=b.dataset.land.split('|');gateLand[len]=land;reopen()});
}
function settings(){
  const m=document.createElement('div');m.className='modal';
  m.innerHTML=`<div class="mbox wide"><h2>Settings</h2><div class="mbody scroll">
    <label class="chk"><input type="checkbox" id="s-sfx" ${TGH.sound.sfxOn?'checked':''}> Sound effects</label>
    <label class="chk"><input type="checkbox" id="s-mus" ${TGH.sound.musicOn?'checked':''}> Music</label>
    <label class="chk"><input type="checkbox" id="s-fast" ${G.settings.fast?'checked':''}> Fast animations</label>
    <p>Save code. Copy it to back up or move your save to another device.</p>
    <textarea id="s-exp" rows="4" readonly></textarea>
    <button class="small" id="s-copy">Copy code</button>
    <p>Import a save code (replaces this game):</p>
    <textarea id="s-imp" rows="3"></textarea><button class="small" id="s-load">Load</button>
    <button class="small" id="s-story">Read the story again</button> <button class="small" id="s-guide">Open the Guide</button><hr><button class="small ghost" id="s-title">Back to title</button> <button class="small ghost danger" id="s-wipe">Delete save</button></div>
    <div class="mbtns"><button class="mb" id="s-close">Close</button></div></div>`;
  document.body.appendChild(m);
  $('#s-exp').value=G.exportSave();
  m.querySelector('#s-sfx').onchange=e=>TGH.sound.setSfx(e.target.checked);
  m.querySelector('#s-mus').onchange=e=>TGH.sound.setMusic(e.target.checked);
  m.querySelector('#s-fast').onchange=e=>{G.settings.fast=e.target.checked;A.fast=G.settings.fast;G.save()};
  m.querySelector('#s-copy').onclick=()=>{$('#s-exp').select();try{document.execCommand('copy');U.toast('Copied.')}catch(e){}};
  m.querySelector('#s-load').onclick=()=>{if(G.importSave($('#s-imp').value)&&G.load()){m.remove();scr().innerHTML='';resume()}else U.toast('That code did not load.')};
  m.querySelector('#s-title').onclick=()=>{m.remove();G.save();U.showTitle()};
  m.querySelector('#s-wipe').onclick=()=>{if(confirm('Delete the saved game for good?')){G.wipeSave();m.remove();U.showTitle()}};
  m.querySelector('#s-close').onclick=()=>m.remove();
  m.querySelector('#s-story').onclick=()=>{m.remove();U.rereadStory()};
  m.querySelector('#s-guide').onclick=()=>TGH.help.open();
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

/* ---------- the hero menu: a full pop-up with a live 3D portrait, stats, skills, gear and items ---------- */
const DISC_ORDER=['war','arc','mag','mon'];
const reachName=k=>k.range==='bow'?'bow reach':k.range==='mage'?'spell reach':k.range?'reach '+k.range:k.tgt==='around'?'around you':k.tgt==='party'?'both heroes':'self';
function statLadder(h,k){
  const d=TGH.DISC,disc=Object.keys(d).find(x=>d[x].stat===k);
  const v=h.stats[k],max=30;
  const ticks=disc?[1,2,3,4].map(n=>`<i class="tick ${v>=TGH.TIERS[n].stat?'hit':''}" style="left:${TGH.TIERS[n].stat/max*100}%"><span>T${n}</span></i>`).join(''):'';
  return `<div class="ladder"><div class="fill" style="width:${Math.min(100,v/max*100)}%"></div>${ticks}</div>`;
}
function gearCompare(h,it,solo){
  const cur=solo?null:h.equip[it.slot];const out=[];
  if(it.slot==='weapon'){
    const f=TGH.FAM[it.fam];
    out.push(`${f.n}: ${TGH.itemBase(it)} power, scales with ${TGH.STATFULL[f.stat]}`);
    if(cur)out.push(`<span class="${TGH.itemBase(it)>=TGH.itemBase(cur)?'up':'dn'}">${TGH.itemBase(it)-TGH.itemBase(cur)>=0?'+':''}${TGH.itemBase(it)-TGH.itemBase(cur)} power vs now</span>`);
  }else if(it.base){
    out.push(`Armor ${TGH.itemBase(it)}`);
    if(cur&&cur.base)out.push(`<span class="${TGH.itemBase(it)>=TGH.itemBase(cur)?'up':'dn'}">${TGH.itemBase(it)-TGH.itemBase(cur)>=0?'+':''}${TGH.itemBase(it)-TGH.itemBase(cur)} armor vs now</span>`);
  }
  for(const a of it.affixes)out.push(TGH.affixText(a));
  return out;
}
let HM=null;
U.heroMenu=function(i,tab){
  if(G.busy)return;
  U.closePopup&&U.closePopup();
  if(HM)closeHero(true);
  HM={i:i||0,tab:tab||U._tab||'stats',filter:'all'};
  const m=document.createElement('div');m.className='modal hm';HM.m=m;
  m.innerHTML=`<div class="hmwin"><div class="hmhead"><div class="hmwho" id="hm-who"></div><div class="hmtitle">Hero</div><button class="gclose" id="hm-x" aria-label="Close">×</button></div>
    <div class="hmbody"><aside class="hmleft"><canvas id="hm-prev" class="hmprev"></canvas><div id="hm-info"></div></aside><section class="hmright"><div class="hmtabs" id="hm-tabs"></div><div class="hmcontent" id="hm-content"></div></section></div></div>`;
  document.body.appendChild(m);
  HM.prev=A.preview(m.querySelector('#hm-prev'));
  m.querySelector('#hm-x').onclick=()=>closeHero();
  m.addEventListener('click',e=>{if(e.target===m)closeHero()});
  renderHero();
};
function closeHero(silent){
  if(!HM)return;
  if(HM.prev)HM.prev.dispose();
  HM.m.remove();HM=null;
  if(silent)return;
  G.save();
  if(G.mode==='town')renderTown();else U.refresh();
}
function renderHero(){
  const s=G.s,h=s.heroes[HM.i],t=s.town,m=HM.m;
  U._tab=HM.tab;
  m.querySelector('#hm-who').innerHTML=s.heroes.map((x,k)=>`<button class="hmsel p${k} ${k===HM.i?'on':''}" data-h="${k}"><img src="${A.portrait(x,56,68)}" alt=""><span>${esc(x.name)}${(x.points||x.skillPoints)?' <b class="dot">!</b>':''}</span></button>`).join('');
  HM.prev.set(h);
  const need=TGH.xpNeed(h.level),xpPct=h.level>=TGH.MAX_LEVEL?100:Math.round(h.xp/need*100);
  const fam=TGH.FAM[h.fam];
  m.querySelector('#hm-info').innerHTML=`<div class="hmname p${HM.i}">${esc(h.name)} <span class="lv">Lv ${h.level}</span></div><div class="hmsub">${TGH.heroTitle(h)} ${TGH.help.q('disc')}</div>
    <div class="bar xp"><i style="width:${xpPct}%"></i><b>XP ${h.xp} / ${h.level>=TGH.MAX_LEVEL?'max':need}</b></div>
    <div class="bar hp"><i style="width:${Math.round(h.hp/h.maxHp*100)}%"></i><b>HP ${h.hp} / ${h.maxHp}</b></div>
    <div class="bar mp"><i style="width:${Math.round(h.mp/h.maxMp*100)}%"></i><b>MP ${h.mp} / ${h.maxMp}</b></div>
    ${TGH.help.fatBar(h)}
    <div class="hmstats">
      <div ${TGH.help.tipAttr('ap')}><span>Action Points</span><b>${h.maxAp}</b></div>
      <div ${TGH.help.tipAttr('move')}><span>Hexes per AP</span><b>${h.move}</b></div>
      <div ${TGH.help.tipAttr('fog')}><span>Sight</span><b>${h.sight}</b></div>
      <div ${TGH.help.tipAttr('armor')}><span>Armor</span><b>${h.armor}</b></div>
      <div ${TGH.help.tipAttr('crit')}><span>Crit</span><b>${Math.round(h.crit)}% ×${(h.critdmg/100).toFixed(2)}</b></div>
      <div ${TGH.help.tipAttr('eva')}><span>Evasion</span><b>${Math.round(h.eva)}%</b></div>
      <div ${TGH.help.tipAttr('reach')}><span>Weapon reach</span><b>${TGH.attackRange(h)}</b></div>
      <div ${TGH.help.tipAttr('reach')}><span>Bow / spell reach</span><b>${TGH.rangeBow(h)} / ${TGH.rangeMage(h)}</b></div>
    </div>
    <div class="hmweapon" ${TGH.help.tipAttr('weapons')}>Holding: <b>${h.equip.weapon?esc(TGH.itemTitle(h.equip.weapon)):'bare hands'}</b><small>${esc(fam.n)} · scales with ${TGH.STATFULL[fam.stat]}</small></div>`;
  const tabs=[['stats','Stats'+(h.points?' ('+h.points+')':'')],['skills','Skills'+(h.skillPoints?' ('+h.skillPoints+')':'')],['gear','Gear'],['items','Items']];
  m.querySelector('#hm-tabs').innerHTML=tabs.map(([k,n])=>`<button class="${k===HM.tab?'on':''}" data-t="${k}">${n}</button>`).join('');
  const c=m.querySelector('#hm-content');const keep=c.scrollTop;
  c.innerHTML=heroTab(h,t);
  c.scrollTop=keep;
  bindHero(h,t);
}
function heroTab(h,t){
  if(HM.tab==='stats')return statsTab(h);
  if(HM.tab==='skills')return skillsTab(h);
  if(HM.tab==='gear')return gearTab(h,t);
  return itemsTab(h,t);
}
function statsTab(h){
  const rows=TGH.STATS.map(k=>{
    const v=h.stats[k],nx=TGH.help.next(k,v);
    return `<div class="hmstat"><div class="hs1"><span class="sn">${TGH.STATFULL[k]} ${TGH.help.q(k)}</span><b class="sv">${v}${h.bonus[k]?`<small class="bn"> (${h.base[k]}+${h.bonus[k]})</small>`:''}</b><button class="plus" data-sp="${k}" ${h.points>0&&h.base[k]<30?'':'disabled'} aria-label="Raise ${TGH.STATFULL[k]}">+</button></div>
      ${statLadder(h,k)}<small>${esc(TGH.STATD[k])}</small><small class="pp">Each point: ${esc(TGH.help.perPoint[k])}</small>${nx?`<small class="nx">Next: <b>${nx.more} more point${nx.more===1?'':'s'}</b> (to ${nx.at}) → ${esc(nx.text)}</small>`:''}</div>`}).join('');
  const up=TGH.help.nearest(h);
  return `<div class="pbanner ${h.points?'':'done'}">${h.points} stat point${h.points===1?'':'s'} to spend ${TGH.help.q('statpts')}<small>Every level: ${TGH.POINTS_PER_LEVEL} stat points and 1 skill point. Level ${h.level}${h.level<TGH.MAX_LEVEL?` · next level +${Math.max(0,TGH.xpNeed(h.level)-h.xp)} XP`:''}</small></div>
    ${up?`<div class="nearest">Closest unlock: <b>${esc(up.k.n)}</b> (${esc(TGH.skillReqText(up.k))}) · ${up.miss?up.miss+' stat point'+(up.miss===1?'':'s')+' short':'stats ready, needs level '+TGH.skillLvl(up.k)}</div>`:''}
    <div class="hmstatgrid">${rows}</div>`;
}
function skillsTab(h){
  const d=TGH.DISC,all=Object.values(TGH.SKILLS);
  const attune=`<div class="attune"><b>Attunement</b> ${TGH.help.q('attune')} <small>(spells${h.skills.includes('imbue')?' and arrows':''} use this element)</small>${TGH.ELEMENTS.map(e=>`<button class="el ${h.attune===e?'on':''}" data-el="${e}" style="--c:${TGH.EL_COL[e]}">${cap(e)}</button>`).join('')}</div>`;
  const filter=`<div class="dfilter">${['all',...DISC_ORDER].map(k=>`<button class="${HM.filter===k?'on':''}" data-f="${k}" style="--c:${k==='all'?'#b4a6d8':d[k].col}">${k==='all'?'All':d[k].n}</button>`).join('')}</div>`;
  const groups=DISC_ORDER.filter(k=>HM.filter==='all'||HM.filter===k).map(k=>{
    const stat=d[k].stat,v=h.stats[stat];
    const tiers=[1,2,3,4].map(n=>{
      const T=TGH.TIERS[n],list=all.filter(x=>x.disc===k&&x.tier===n);
      const statOk=v>=T.stat,lvOk=h.level>=T.lvl;
      const status=statOk&&lvOk?'<span class="ok">Unlocked</span>':!statOk?`<span class="no">${T.stat-v} more ${TGH.STATN[stat]}</span>`:`<span class="no">reach level ${T.lvl}</span>`;
      return `<div class="tier ${statOk&&lvOk?'open':'shut'}"><div class="tierh"><b>Tier ${n} · ${T.n}</b><span class="treq"><span class="${statOk?'ok':'no'}">${TGH.STATN[stat]} ${T.stat}</span> <span class="${lvOk?'ok':'no'}">Lv ${T.lvl}</span> ${status}</span></div>
        <div class="tiergrid">${list.map(sk=>{
          const has=h.skills.includes(sk.id),can=TGH.canLearn(h,sk.id),mp=TGH.skillMp(h,sk);
          const req=Object.entries(sk.need).map(([st,val])=>`<span class="${h.stats[st]>=val?'ok':'no'}">${TGH.STATN[st]} ${val}</span>`).join(' ');
          return `<div class="skcard ${has?'has':can?'can':'lock'}"><div class="skh"><b>${esc(sk.n)}</b><span class="skmeta">${sk.ap} AP · ${sk.mp?mp+' MP':'free'} · ${reachName(sk)}</span></div><small>${esc(sk.d)}</small><div class="req">${req}</div>${has?'<span class="learned">Learned</span>':`<button class="small ${can&&h.skillPoints?'gold':''}" data-learn="${sk.id}" ${can&&h.skillPoints>0?'':'disabled'}>${can?(h.skillPoints?'Learn (1 SP)':'Need a skill point'):'Locked'}</button>`}</div>`}).join('')}</div></div>`}).join('');
    return `<div class="dgroup" style="--c:${d[k].col}"><div class="dgh"><b>${d[k].n}</b> <small>${esc(d[k].blurb)}</small><span class="dstat">${TGH.STATFULL[stat]} <b>${v}</b></span></div>${tiers}</div>`;
  }).join('');
  return `<div class="pbanner ${h.skillPoints?'':'done'}">${h.skillPoints} skill point${h.skillPoints===1?'':'s'} ${TGH.help.q('skillpts')}<small>Skills unlock by stat and level, not by class. ${TGH.help.q('tiers')}</small></div>${attune}${filter}${groups}`;
}
function gearTab(h,t){
  const slots=TGH.SLOTS.map(sl=>{const it=h.equip[sl];return `<div class="gslot ${it?'full':''}"><span class="sl">${TGH.SLOTN[sl]}</span>${it?`<b style="color:${TGH.RAR[it.rarity].c}">${esc(TGH.itemTitle(it))}</b><small>${TGH.RAR[it.rarity].l} · ${gearCompare(h,it,true).join(' · ')}</small><button class="small ghost" data-un="${sl}">Unequip</button>`:'<small class="empty">empty</small>'}</div>`}).join('');
  const sorted=t.pack.slice().sort((a,b)=>TGH.SLOTS.indexOf(a.slot)-TGH.SLOTS.indexOf(b.slot));
  const pack=sorted.map(it=>`<div class="gslot pk"><span class="sl">${TGH.SLOTN[it.slot]}</span><b style="color:${TGH.RAR[it.rarity].c}">${esc(TGH.itemTitle(it))}</b><small>${TGH.RAR[it.rarity].l} · ${gearCompare(h,it).join(' · ')}</small><button class="small" data-eq="${it.id}">Equip</button></div>`).join('')||'<p class="empty">The shared pack is empty. Loot from adventures lands here.</p>';
  return `<div class="wpnnote">${TGH.help.text('weapons')}</div><div class="gear"><div><h3>${esc(h.name)} wears</h3>${slots}</div><div><h3>Shared pack (${t.pack.length}/${TGH.vaultCap(t.b.vault)}) ${TGH.help.q('vault')}</h3><div class="packlist">${pack}</div></div></div>`;
}
function itemsTab(h,t){
  const rows=Object.entries(TGH.POTIONS).map(([id,P])=>`<div class="gslot"><b>${esc(P.n)}</b><span class="cnt">×${t.items[id]||0}</span><small>${esc(P.d)}</small></div>`).join('');
  return `<p class="wpnnote">${TGH.help.text('potions')}</p><div class="itemgrid">${rows}</div>`;
}
function bindHero(h,t){
  const m=HM.m;
  const again=()=>renderHero();
  m.querySelectorAll('.hmsel').forEach(b=>b.onclick=()=>{HM.i=+b.dataset.h;again()});
  m.querySelectorAll('#hm-tabs button').forEach(b=>b.onclick=()=>{HM.tab=b.dataset.t;m.querySelector('#hm-content').scrollTop=0;again()});
  m.querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>{TGH.spendPoint(h,b.dataset.sp,t);if(h.rig&&A.setEquipLook)A.setEquipLook(h);again()});
  m.querySelectorAll('[data-learn]').forEach(b=>b.onclick=()=>{if(TGH.learnSkill(h,b.dataset.learn))again()});
  m.querySelectorAll('[data-el]').forEach(b=>b.onclick=()=>{h.attune=b.dataset.el;if(h.skills.includes('imbue'))h.arrowEl=b.dataset.el;again()});
  m.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{HM.filter=b.dataset.f;again()});
  const swap=()=>{TGH.recalc(h,t);if(h.rig)A.setEquipLook(h)};
  m.querySelectorAll('[data-un]').forEach(b=>b.onclick=()=>{const it=h.equip[b.dataset.un];if(!it)return;t.pack.push(it);delete h.equip[b.dataset.un];swap();again()});
  m.querySelectorAll('[data-eq]').forEach(b=>b.onclick=()=>{const k=t.pack.findIndex(x=>x.id===b.dataset.eq);if(k<0)return;const it=t.pack.splice(k,1)[0];const cur=h.equip[it.slot];if(cur)t.pack.push(cur);h.equip[it.slot]=it;swap();again()});
}
})();
