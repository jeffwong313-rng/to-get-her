/* To Get Her: rules. Heroes, monsters, items and damage. No drawing in here, so the numbers can be tested on their own. */
(function(){
'use strict';
const TGH=window.TGH=window.TGH||{};
const {rnd,ri,rand,pick,chance,clamp,weighted,uid}=TGH;
const cap=s=>s?s[0].toUpperCase()+s.slice(1):s;
TGH.cap=cap;

/* ---------- items ---------- */
const ARMOR_BASE={helmet:3,chest:5,pants:4};
TGH.makeItem=function(ilvl,opts){
  opts=opts||{};
  const tbl={common:60,rare:28,epic:10,godlike:2};
  const lift=opts.lift||0; // bosses and chests push the table up
  tbl.common=Math.max(5,tbl.common-lift*30);tbl.rare+=lift*10;tbl.epic+=lift*14;tbl.godlike+=lift*5;
  if(ilvl<5){tbl.epic*=.3;tbl.godlike=0}else if(ilvl<12){tbl.godlike*=.3}
  const rarity=opts.rarity||weighted(tbl),R=TGH.RAR[rarity];
  const slot=opts.slot||weighted({weapon:22,helmet:14,chest:14,pants:14,ring:14,amulet:10});
  const it={id:uid(),slot,rarity,ilvl,plus:0,affixes:[],name:''};
  if(slot==='weapon'){
    it.fam=opts.fam||pick(['sword','bow','staff']);
    it.base=Math.round((4+ilvl*1.5)*R.m*rand(.92,1.08));
    if(it.fam==='staff'&&chance(.4))it.el=pick(TGH.ELEMENTS);
    it.name=pick(TGH.WNAMES[it.fam]);
  }else if(ARMOR_BASE[slot]){
    it.base=Math.round(ARMOR_BASE[slot]*(1+ilvl*.18)*R.m*rand(.92,1.08));
    it.name=pick(TGH.ANAMES[slot]);
  }else it.name=pick(TGH.ANAMES[slot]);
  const nAff={common:chance(.4)?1:0,rare:ri(1,2),epic:ri(2,3),godlike:ri(3,4)}[rarity];
  const pool=TGH.AFFIXES.filter(a=>!a.rareOnly||R.i>=2);
  const used=new Set();
  for(let i=0;i<nAff;i++){
    const a=pick(pool);if(used.has(a.k))continue;used.add(a.k);
    it.affixes.push({k:a.k,v:a.rareOnly?1:Math.max(1,Math.round(rand(a.a,a.b)*R.m*(1+ilvl*.04)))});
  }
  it.name=(rarity==='common'&&chance(.5)?'':pick(TGH.PREFIX[rarity])+' ')+it.name;
  return it;
};
TGH.itemBase=it=>it.base?Math.round(it.base*(1+(it.plus||0)*.1)):0;
TGH.itemTitle=it=>it.name+(it.plus?' +'+it.plus:'');
TGH.affixText=a=>{const d=TGH.AFFIXES.find(x=>x.k===a.k);return `+${a.v} ${d.l}`};
TGH.itemLines=it=>{
  const out=[];
  if(it.slot==='weapon')out.push(`${TGH.FAM[it.fam].n}: ${TGH.itemBase(it)} power${it.el?', '+cap(it.el):''}`);
  else if(it.base)out.push(`Armor ${TGH.itemBase(it)}`);
  for(const a of it.affixes)out.push(TGH.affixText(a));
  return out;
};
TGH.sellValue=it=>Math.round((6+it.ilvl*3)*TGH.RAR[it.rarity].m*(1+(it.plus||0)*.4));

/* ---------- heroes ---------- */
TGH.newHero=function(o){
  const h={id:uid(),name:o.name,gender:o.gender,look:Object.assign({},o.look),level:1,xp:0,base:Object.assign({},o.base),
    points:0,skillPoints:1,skills:[],equip:{},attune:'fire',arrowEl:'fire',hp:1,mp:1,ap:2,c:0,r:0,down:false,st:{}};
  TGH.recalc(h,{});h.hp=h.maxHp;h.mp=h.maxMp;h.ap=h.maxAp;
  return h;
};
// Work out everything a hero is right now: effective stats (with gear), health, mana, AP, armor, crit, evasion.
TGH.recalc=function(h,town){
  const bonus={};
  for(const it of Object.values(h.equip))if(it)for(const a of it.affixes)bonus[a.k]=(bonus[a.k]||0)+a.v;
  h.bonus=bonus;
  h.stats={};for(const k of TGH.STATS)h.stats[k]=h.base[k]+(bonus[k]||0);
  const farm=((town&&town.b&&town.b.farm)||0)*6;
  h.maxHp=Math.round(20+6*h.stats.end+5*h.level+(bonus.hp||0)+farm);
  h.maxMp=Math.round(8+3*h.stats.int+2*h.level+h.stats.end+(bonus.mp||0));
  let arm=0;for(const it of Object.values(h.equip))if(it&&it.slot!=='weapon'&&it.base)arm+=TGH.itemBase(it);
  h.armor=Math.round(arm*(1+h.stats.end*.06)+h.stats.end*.5);
  h.maxAp=Math.min(7,TGH.maxAP(h)+(bonus.ap||0));
  h.sightBonus=bonus.sight||0;
  h.move=TGH.movePerAP(h)+(bonus.move||0);
  h.sight=TGH.sightOf(h);
  h.crit=5+h.stats.lck*1.2+h.stats.agi*.6+(bonus.crit||0);
  h.critdmg=150+(bonus.critdmg||0);
  h.eva=Math.min(55,h.stats.agi*1.3+h.stats.lck*.5);
  h.lifesteal=bonus.lifesteal||0;
  h.fam=h.equip.weapon?h.equip.weapon.fam:'fist';
  h.wpn=h.equip.weapon?TGH.itemBase(h.equip.weapon):2;
  h.hp=Math.min(h.hp,h.maxHp);h.mp=Math.min(h.mp,h.maxMp);h.ap=Math.min(h.ap,h.maxAp);
  h.team='hero';
  return h;
};
TGH.xpNeed=L=>Math.round(40*Math.pow(L,1.45));
TGH.gainXp=function(h,xp,town){
  xp=Math.round(xp*(1+((h.bonus&&h.bonus.xp)||0)/100));
  h.xp+=xp;let gained=0;
  while(h.level<TGH.MAX_LEVEL&&h.xp>=TGH.xpNeed(h.level)){
    h.xp-=TGH.xpNeed(h.level);h.level++;gained++;h.points+=TGH.POINTS_PER_LEVEL;h.skillPoints+=1;
    const was=h.maxHp;TGH.recalc(h,town);h.hp=Math.min(h.maxHp,h.hp+(h.maxHp-was));
    if(h.down){}
  }
  return {xp,gained};
};
// Spend a stat point.
TGH.spendPoint=function(h,k,town){if(h.points<=0)return false;h.base[k]++;h.points--;const was=h.maxHp,wm=h.maxMp;TGH.recalc(h,town);if(!h.down){h.hp+=Math.max(0,h.maxHp-was);h.mp+=Math.max(0,h.maxMp-wm)}h.hp=Math.min(h.hp,h.maxHp);h.mp=Math.min(h.mp,h.maxMp);return true};
TGH.learnSkill=function(h,id){if(h.skillPoints<=0||!TGH.canLearn(h,id))return false;h.skills.push(id);h.skillPoints--;return true};
TGH.skillMp=(h,k)=>k.mpPct?Math.max(k.mp,Math.round(h.maxMp*k.mpPct)):k.mp;
// Which kind of fighter a hero looks like right now, from the weapon they hold and the stat they favour.
TGH.heroTitle=h=>{const s=h.stats;const m=Math.max(s.str,s.agi,s.int);const w=s.str===m?'Warrior':s.agi===m?'Archer':'Mage';
  const second=[['Warrior',s.str],['Archer',s.agi],['Mage',s.int]].filter(([n,v])=>n!==w&&v>=Math.max(4,m-2));
  return second.length?w+'-'+second[0][0].toLowerCase():w};
TGH.bestWeaponFor=h=>{const s=h.base;return s.str>=s.agi&&s.str>=s.int?'sword':s.agi>=s.int?'bow':'staff'};

/* ---------- monsters ---------- */
const LEVEL_BASE={cave:1,wilds:6,wasteland:12,summit:18,dark:25};
TGH.LEVEL_BASE=LEVEL_BASE;
TGH.foeLevel=(biome,r,H,extra)=>LEVEL_BASE[biome]+Math.floor((H-1-r)/H*4)+(extra||0);
// Two heroes at once: monsters are tougher than they used to be.
const FOE_HP=1.3,FOE_ATK=1.0;
TGH.makeFoe=function(name,kindKey,level,o){
  o=o||{};const K=TGH.KINDS[o.kind||kindKey]||TGH.KINDS.beast;
  const biome=TGH.BIOMES[o.biome||'cave'];
  let hpM=K.hp*FOE_HP,atkM=K.atk*FOE_ATK,armM=1,mv=K.mv,range=K.range,scale=1;
  const def=o.def||null;
  if(def){hpM*=def.hp;atkM*=def.atk;mv=def.mv||mv;range=def.range||range;scale=1.7;armM=1.4}
  if(o.elite){hpM*=1.7;atkM*=1.3;armM*=1.3;scale=1.3}
  if(o.mut==='colossal')hpM*=1.6;if(o.mut==='frenzy')atkM*=1.35;if(o.mut==='warded')armM*=1.25;
  const f={id:uid(),team:'foe',name,kind:o.kind||kindKey,level,
    maxHp:Math.round((22+level*10)*hpM),atk:Math.round((4.5+level*2)*atkM),
    armor:Math.round(level*(K.look==='brute'?1.8:.9)*armM),eva:K.look==='bat'?18:K.look==='beast'?8:3,
    crit:5,critdmg:150,mv,range,maxAp:K.ap+(def&&def.fast?1:0)+(o.elite?0:0),el:biome.el==='physical'?null:biome.el,magic:!!K.magic,
    elite:!!o.elite,boss:!!def,mut:o.mut||null,scale,color:(def&&def.color)||o.color||null,eye:(def&&def.eye)||null,blurb:def&&def.blurb,def:def?name:null,
    c:0,r:0,down:false,st:{}};
  f.hp=f.maxHp;f.ap=f.maxAp;
  f.xp=Math.round((10+level*6)*(f.boss?7:f.elite?2.5:1));
  f.gold=Math.round(ri(5,10)*Math.pow(level,.8)*(f.boss?6:f.elite?2.5:1));
  return f;
};

/* ---------- damage ---------- */
// What a hero's attack is built from: which stat, which element, how far it reaches.
TGH.profile=function(h,skill){
  const fam=TGH.FAM[h.fam],disc=skill?skill.disc:fam.disc,stat=TGH.DISC[disc].stat;
  return {stat,val:h.stats[stat],disc,fam};
};
TGH.attackRange=h=>{const fam=TGH.FAM[h.fam];return fam.range==='bow'?TGH.rangeBow(h):fam.range==='mage'?TGH.rangeMage(h):fam.range};
TGH.attackElement=(h,skill)=>{
  const wEl=h.equip.weapon&&h.equip.weapon.el;
  if(skill){
    if(skill.el==='attune')return h.attune;
    if(skill.el==='prism')return 'prism';
    return skill.el==='physical'?(wEl||'physical'):skill.el;
  }
  if(h.fam==='staff')return wEl||h.attune;
  if(h.fam==='bow'&&(h.st.imbue||0)>0)return h.arrowEl;
  return wEl||'physical';
};
// Resolve one strike. Returns {hit, dmg, crit, mult, el}. attacker and target are units (heroes or monsters).
TGH.strike=function(att,def,skill,o){
  o=o||{};
  const hero=att.team==='hero';let base,el,acc,mult=skill?skill.mult:1;
  const P=hero?TGH.profile(att,skill):null;
  if(hero){
    mult=skill?skill.mult:P.fam.mult;
    base=(att.wpn+1.8*P.val+1.2*att.level)*mult;
    el=TGH.attackElement(att,skill);
    acc=(skill?skill.acc:P.fam.acc)+att.stats.per*.4;
  }else{
    base=att.atk*mult;el=att.el||'physical';acc=92;
  }
  if(el==='prism')el=def.el?TGH.ELEMENTS.find(e=>TGH.BEATS[e]===def.el)||'fire':pick(TGH.ELEMENTS);
  const sure=skill&&skill.sure;
  let hit=sure||rnd()*100<clamp(acc-(def.eva||0)-((def.st&&def.st.eva)?def.st.eva.v*100:0),8,100);
  if(skill&&skill.mult===0)hit=hit; // pure debuffs still need to land
  if(!hit)return {hit:false,dmg:0,crit:false,mult:1,el};
  const m=TGH.matchup(el,def.el);let em=m;
  if(m>1){em=(hero&&P.disc==='mag'&&el!=='physical')?(skill&&skill.weak?skill.weak:1.75):m;if(skill&&skill.weak&&hero)em=skill.weak}
  base*=em;
  let cc=(att.crit||5)+(skill?skill.crit||0:0)+((att.st.critBuff)?att.st.critBuff.v:0)+((att.st.buff&&att.st.buff.crit)||0);
  if(hero&&att.st.sneak)cc+=0;
  const crit=(skill&&skill.forceCrit)||rnd()*100<cc;
  if(crit)base*=((att.critdmg||150)+(skill&&skill.cdmg||0))/100;
  let arm=(skill&&(skill.pierce||skill.noRes))?0:def.armor||0;
  if(att.magic&&def.team==='hero')arm*=.5;
  let dmg=base*60/(60+arm)*rand(.92,1.08);
  if(skill&&skill.low&&def.hp<def.maxHp*.5)dmg*=skill.low;
  if(att.st.buff)dmg*=1+att.st.buff.dmg;
  if(att.st.dmgSelf)dmg*=1+att.st.dmgSelf.v;
  if(att.st.weakenAtk)dmg*=1-att.st.weakenAtk.v;
  if(def.st.hexed)dmg*=1+def.st.hexed.v;
  if(def.st.guard)dmg*=def.st.guard.taken;
  if(def.st.buff&&def.st.buff.def)dmg*=1-def.st.buff.def;
  if(def.mut==='warded')dmg*=.92;
  if(def.team==='hero')dmg*=o.foeScale||1;
  dmg=Math.max(1,Math.round(dmg));
  return {hit:true,dmg,crit,mult:m,el};
};
TGH.healAmount=(caster,target,k)=>Math.round(target.maxHp*(k.healPct||0)+(k.healInt?caster.stats.int*k.healInt:0)*(1+caster.stats.cha*.03));

/* ---------- town helpers ---------- */
TGH.newTown=()=>({b:{forge:1,vault:1,witch:1,farm:0,lodge:0},gold:60,mats:{stone:0,metal:0,wood:0,hide:0,crystal:0,carbon:0,void:0},
  items:{potion:3,mpotion:1,apdraught:0,phoenix:0,scroll:1},pack:[],beaten:[],caveBeaten:[],story:0});
TGH.upgradeCost=function(it){const L=(it.plus||0)+1;return {gold:Math.round(40*L*(1+it.ilvl*.12)*TGH.RAR[it.rarity].m),metal:L,stone:Math.ceil(L/2)}};
})();
