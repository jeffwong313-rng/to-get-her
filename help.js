/* To Get Her: the guide. Definitions for everything in the game, the little ? tips that show them, the full Guide pop-up, and
   the stat milestones shown while you build a hero. Plain text lives here so the screens stay short. */
(function(){
'use strict';
const TGH=window.TGH=window.TGH||{};
const H=TGH.help={};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const T=TGH.TIERS;

/* ---------- the glossary ---------- */
const G=H.G={};
const add=(cat,id,t,d)=>{G[id]={id,cat,t,d}};
add('Basics','special','SPECIAL','Seven stats every hero has: Strength, Perception, Endurance, Charisma, Intelligence, Agility and Luck. Everyone starts at 1 in each and spends 10 points at the start, then 2 more with every level. There are no classes: your stats decide which skills you can learn.');
add('Basics','ap','Action Points (AP)','Each hero has their own AP. Moving, attacking, using a skill or an item all cost AP. You start with 2. A new AP arrives every 6 levels and every 6 Agility points above 1 (up to 6, 7 with gear). AP refills at the start of your turn.');
add('Basics','move','Movement','Spending 1 AP lets you walk several hexes. You start at 2 hexes per AP and gain +1 hex per AP for every 3 Agility above 1. Leftover steps carry over: if one AP buys 3 hexes and you only walk 2, the 3rd is kept for the rest of that turn.');
add('Basics','hex','Hex grid','The map is a field of hexagons. Every hex has six neighbours. Distances, reach and bursts all count hexes. Boulders, mountains, water and lava block the way.');
add('Basics','fog','Fog and sight','You only see hexes within your Sight: 2 + half your Perception (rounded up). Seen hexes stay on the map as a memory but monsters on them only show while you can see them. Higher Perception also stretches bow and spell reach.');
add('Basics','turns','Turns','While exploring the heroes take turns: hero 1, then hero 2, then hero 1 again. Each decides alone what to do. In a battle the order is hero 1, hero 2, then the monsters. The action bar and the glowing card show whose turn it is.');
add('Basics','coop','Pass and play','Both heroes are played on one device. When your turn ends, pass it to your partner. You can also walk the heroes together or split up to scout.');
add('Basics','hp','Health (HP)','How much damage a hero can take. Grows with Endurance (+6 per point) and level (+5). A hero who reaches 0 is down for the rest of the fight. Camp fires and Phoenix Feathers bring them back.');
add('Basics','mp','Mana (MP)','Spent on skills. Grows with Intelligence (+3 per point), Endurance (+1) and level (+2). Basic attacks are free. Mana is restored by Inner Calm, Mana Potions and Camp fires.');
add('Basics','armor','Armor','Reduces damage from every hit. It comes from helmet, chest and pants and gets stronger with Endurance. Armor of 60 halves incoming damage; the formula is 60 / (60 + armor).');
add('Basics','eva','Evasion','The chance to make an attack miss. Agility adds 1.3% per point and Luck 0.5%, up to 55%. Archers love it.');
add('Basics','crit','Critical hits','A crit does extra damage (150% by default). Luck adds 1.2% chance per point and Agility 0.6%. Some skills and gear add more.');
add('Basics','level','Levels and XP','Beating monsters gives XP. Each level gives 2 stat points and 1 skill point, more max HP and, every 6 levels, an extra AP. The cap is level '+TGH.MAX_LEVEL+'.');
add('Basics','statpts','Stat points','Spend them in the Hero menu. Each point raises a stat by 1. Plan for the milestones: skill tiers unlock at '+T[2].stat+', '+T[3].stat+' and '+T[4].stat+' in the discipline stat.');
add('Basics','skillpts','Skill points','You get 1 per level. Spend them to learn a skill you qualify for. A skill needs the right stat level and a minimum hero level.');
add('Stats','str','Strength','Power of swords and every Warrior skill. Each point adds about 1.8 damage to a sword swing. Warrior tiers unlock at STR '+T[1].stat+' / '+T[2].stat+' / '+T[3].stat+' / '+T[4].stat+'.');
add('Stats','per','Perception','See farther through the fog (Sight 2 + half PER). Bow reach grows +1 hex every 3 PER (max 6). Spell reach grows +1 hex every 5 PER (max 4). A little accuracy too.');
add('Stats','end','Endurance','Health (+6 per point), armor strength, and the discipline stat of the Monk. Monk tiers unlock at END '+T[1].stat+' / '+T[2].stat+' / '+T[3].stat+' / '+T[4].stat+'. Knuckles and bare hands hit harder with it.');
add('Stats','cha','Charisma','Boosts healing and buffs by 3% per point, cheapens shops by 2% per point (max 25%), and is a second requirement for support skills like Rallying Cry (4), Resurrection (8) and Serenity (4).');
add('Stats','int','Intelligence','More mana (+3 per point) and spell damage. Staves hit harder with it. Mage tiers unlock at INT '+T[1].stat+' / '+T[2].stat+' / '+T[3].stat+' / '+T[4].stat+'.');
add('Stats','agi','Agility','Each 3 points add +1 hex of movement per AP, each 6 points add +1 AP, and every point adds 1.3% evasion. Bows hit harder with it. Archer tiers unlock at AGI '+T[1].stat+' / '+T[2].stat+' / '+T[3].stat+' / '+T[4].stat+'.');
add('Stats','lck','Luck','Crit chance, rarer loot, better outcomes at ? tiles and a little evasion.');
add('Skills','tiers','Skill tiers','Skills come in four tiers. A tier unlocks when your discipline stat reaches '+T[1].stat+', '+T[2].stat+', '+T[3].stat+' and '+T[4].stat+' and you reach level '+T[1].lvl+', '+T[2].lvl+', '+T[3].lvl+' and '+T[4].lvl+'. A hero with 11 STR, 11 INT and 11 AGI can learn tier 2 skills from the Warrior, Archer and Mage lists. You are free to mix.');
add('Skills','disc','Disciplines','Warrior (Strength), Archer (Agility), Mage (Intelligence) and Monk (Endurance). They are not classes you pick: they are the skill lists your stats open. The name under a hero is just what they are best at right now.');
add('Skills','war','Warrior','Close-range bruiser. Basic reach 1 (a few skills reach 2). Big hits, stuns and armor-ignoring blows, plus guard and rally skills. Uses Strength.');
add('Skills','arc','Archer','The longest reach in the game, growing with Perception. Piercing shots, volleys, crits and evasion. Uses Agility.');
add('Skills','mon','Monk','Fights with hands and discipline. Reach 1. Flurries, stuns, whirlwinds, self-healing and iron-body defense. Uses Endurance, which also makes the Monk very sturdy.');
add('Skills','mag','Mage','Elemental spells at medium reach, curses and healing. Spells hit weaknesses harder than anyone. Uses Intelligence.');
add('Skills','weapons','Weapons','Anyone can carry any weapon. A weapon sets how far basic attacks reach and which stat they scale with: Sword = Strength (reach 1), Bow = Agility (reach grows with Perception), Staff = Intelligence (elemental, medium reach), Knuckles and bare hands = Endurance (reach 1). Skills always use their own discipline stat.');
add('Skills','reach','Reach','How many hexes away you can hit. Swords and knuckles: 1. Bows start at 2 and gain +1 every 3 Perception (max 6). Spells start at 2 and gain +1 every 5 Perception (max 4). A target farther than 1 hex must also be in line of sight.');
add('Skills','los','Line of sight','Ranged attacks need a clear line. Boulders and mountains block it. Adjacent targets are always visible.');
add('Skills','aoe','Bursts','Some skills hit a burst: the target and every enemy within the stated number of hexes. A radius of 1 touches the six neighbours.');
add('Elements','elements','Elements','Fire beats Grass, Grass beats Fighting, Fighting beats Thunder, Thunder beats Ice, Ice beats Fire. Hitting a monster with the element that beats it deals 1.5x (1.75x for mage spells); the wrong element deals half. Dark and physical are neutral. Each land\'s monsters belong to its element.');
add('Elements','attune','Attunement','Mages and staves use an element you choose in the Hero menu. Change it between fights (or mid-battle for free) to match the monster\'s weakness.');
add('Elements','prism','Prism','Prism Hail and Rain of Stars choose, for each arrow, the element that hurts that monster most.');
add('Map','camp','Camp fire','Walk onto it to rest. Heals both heroes, restores mana and brings a fallen partner back. Once used it burns down.');
add('Map','question','? tile','Walk onto it to find out. It can be treasure, a clue about your sister, a healing spring or a trap. Luck improves the odds.');
add('Map','chest','Chest','Loot waits inside: gear, gold or materials.');
add('Map','mat','Materials','Stone, scrap, wood, hide, crystal, carbon and void shards lie around each land. Carry them home to rebuild the town: they pay for the forge, vault, witch\'s hut, farm and family home.');
add('Map','elite','Elite','A stronger monster, sometimes with a mutation. It notices heroes within 2 hexes and starts a fight by itself. It drops better loot.');
add('Map','boss','Boss','Guards the way out of each land. Notices you from 2 hexes. If one hero starts the fight, the other must spend AP to walk over and help.');
add('Map','terrain','Terrain','Boulders and mountains block walking and sight. Water and lava cannot be crossed. Plan a route around them.');
add('Map','pack','Monster pack','A group of up to three monsters. They start a fight when you step next to them.');
add('Combat','fatigue','Fatigue','Builds as heroes go deeper and after every fight (+2% battle, +5% elite, +10% boss). Strength and Endurance slow the road build-up. 50%: one hex less per AP. 80%: 33% less damage dealt and 33% more taken. 100%: an injury (sprained ankle, cramps, dizziness, bruised ribs or a headache) until you have been home twice. Camps take 50% off, an Energy Brew 25%, and going home clears it all. Some monsters land Wearying Blows.');
add('Combat','faint','Fainting','If both heroes fall, the villagers carry them home. You keep your gear and levels, but all loot and materials from that trip are lost.');
add('Combat','stun','Stun','A stunned unit loses its next turn. Bosses only lose 1 turn no matter how long it should last.');
add('Combat','guard','Guard','Reduces damage taken for a few rounds. Taunting guards make monsters prefer to hit that hero.');
add('Combat','hexed','Hexed','The target takes extra damage from everyone for a few rounds.');
add('Combat','weaken','Weakened','The unit deals less damage for a few rounds.');
add('Combat','bleed','Bleeding','Loses health at the start of its turn for a few rounds.');
add('Combat','buff','Empowered','Deals more damage and takes less for a few rounds. Rallying Cry, Warlord\'s Banner and Avatar of Stillness grant this to both heroes.');
add('Combat','mutation','Mutations','Elites can mutate: Regenerating heals each turn, Frenzied hits harder, Warded takes less damage, Colossal has much more health, Thorned reflects some damage.');
add('Monsters','tier','Monster danger','Every land has its own monsters. Cave monsters know no skills, the Wilds and Wasteland teach them one, and the Summit and Dark Side two. Elites and bosses know more.');
add('Monsters','ability','Signature ability','Every kind of monster has one special trait of its own: Pack Hunter, Frozen Shell, Avalanche Fist and more. They are revealed in the Bestiary as you learn the monster.');
add('Monsters','habit','Fighting habit','How a monster picks its target: it attacks the nearest hero (front), hunts the hero with the lowest health (weak), goes for the most fragile hero (back), or keeps hitting the hero it already hurt (fixate).');
add('Monsters','scout','Bestiary','Every monster you meet is recorded. Each fight your Perception may reveal more: first the basics, then stats and resistances, then its skills, then its signature ability and habit. Every 3 kills of a kind guarantees the next stage.');
add('Monsters','res','Resistances','Each kind of monster takes more or less damage from physical blows and from each element. A positive number means it shrugs the damage off; a negative number is a weakness.');
add('Town','forge','Forge','Upgrade a weapon or armor with gold, scrap and stone. Each plus adds 10% to its power or armor. A higher forge level raises the limit.');
add('Town','vault','Vault','The shared pack where unused gear is kept. A bigger vault holds more.');
add('Town','witch','Witch\'s Hut','Sells potions. Higher levels brew stronger potions and add Quickening Draughts and Phoenix Feathers.');
add('Town','farm','Farm','Hot meals at home: each level adds 6 max health to both heroes.');
add('Town','lodge','Family Home','Rest here to heal. The family home also gives a little extra when the heroes set out. Your little sister\'s scarf hangs by the door.');
add('Town','gate','Stone Gate','Choose which land to travel to: the Cave, the Wilds, the Wasteland, the Summit, and finally the Dark Side. Each opens when you clear the one before it.');
add('Items','rarity','Rarity','Common, Rare, Epic and Godlike. Better rarity means stronger base power and more bonus lines.');
add('Items','affix','Bonus lines','Gear can add stats (+STR), Health, Mana, Crit, Lifesteal, Gold Find, XP, and rare ones add Max AP, Hexes per AP or Sight.');
add('Items','potions','Potions','Using an item costs 1 AP. Healing potions restore 40% health, Mana potions 50% mana, a Quickening Draught gives +2 AP, a Phoenix Feather revives a fallen hero, and a Return Scroll takes both heroes home with their loot.');

H.cats=['Basics','Stats','Skills','Elements','Map','Combat','Monsters','Town','Items'];
H.text=id=>(G[id]&&G[id].d)||'';

/* ---------- ? icons and tooltips ---------- */
// help('ap') or help('Raw text here'): a small round ? that shows the entry on hover, focus or tap.
H.q=(idOrText,label)=>{
  const e=G[idOrText];
  const tip=e?e.d:idOrText,title=e?e.t:(label||'');
  return `<span class="help" tabindex="0" role="button" aria-label="Help${title?': '+esc(title):''}" data-tip="${esc(tip)}"${title?` data-tt="${esc(title)}"`:''}${e?` data-gid="${e.id}"`:''}>?</span>`;
};
// A tip on any element: attrs for tipped text.
H.tipAttr=(idOrText)=>{const e=G[idOrText];return `data-tip="${esc(e?e.d:idOrText)}"${e?` data-tt="${esc(e.t)}" data-gid="${e.id}"`:''}`};

let tip=null,tipFor=null,hideT=null;
function ensureTip(){
  if(tip)return tip;
  tip=document.createElement('div');tip.id='tip';tip.hidden=true;tip.setAttribute('role','tooltip');document.body.appendChild(tip);return tip;
}
function showTip(el,sticky){
  const text=el.getAttribute('data-tip');if(!text)return;
  const t=ensureTip();clearTimeout(hideT);
  const title=el.getAttribute('data-tt'),gid=el.getAttribute('data-gid');
  t.innerHTML=(title?`<b>${esc(title)}</b>`:'')+`<span>${esc(text)}</span>`+(gid?`<button class="tipmore" data-open="${gid}">Open in Guide</button>`:'');
  t.hidden=false;t.classList.toggle('sticky',!!sticky);tipFor=el;
  const r=el.getBoundingClientRect(),tw=Math.min(340,window.innerWidth-16);
  t.style.maxWidth=tw+'px';
  let x=Math.min(window.innerWidth-tw-8,Math.max(8,r.left+r.width/2-tw/2));
  t.style.left=x+'px';t.style.top='0px';
  const th=t.offsetHeight;let y=r.top-th-8;if(y<8)y=Math.min(window.innerHeight-th-8,r.bottom+8);
  t.style.top=y+'px';
}
function hideTip(){if(!tip)return;tip.hidden=true;tipFor=null}
H.hide=hideTip;
document.addEventListener('mouseover',e=>{
  if(!matchMedia('(hover:hover)').matches)return;
  const el=e.target.closest&&e.target.closest('[data-tip]');if(el&&el!==tipFor)showTip(el,false);
});
document.addEventListener('mouseout',e=>{
  if(!matchMedia('(hover:hover)').matches)return;
  const el=e.target.closest&&e.target.closest('[data-tip]');
  if(el&&el===tipFor&&!(tip&&tip.classList.contains('sticky'))){hideT=setTimeout(hideTip,120)}
});
document.addEventListener('focusin',e=>{const el=e.target.closest&&e.target.closest('.help');if(el)showTip(el,false)});
document.addEventListener('focusout',e=>{if(!(tip&&tip.classList.contains('sticky')))hideTip()});
document.addEventListener('click',e=>{
  const more=e.target.closest&&e.target.closest('.tipmore');
  if(more){const id=more.dataset.open;hideTip();H.open(id);return}
  const q=e.target.closest&&e.target.closest('.help');
  if(q){e.stopPropagation();if(tipFor===q&&!tip.hidden){hideTip()}else showTip(q,true);return}
  const t=e.target.closest&&e.target.closest('[data-tip]');
  if(t&&!matchMedia('(hover:hover)').matches&&!t.matches('button,input,select,textarea,a')){showTip(t,true);return}
  if(tip&&!tip.hidden&&!(e.target.closest&&e.target.closest('#tip')))hideTip();
},true);

/* ---------- the Guide pop-up ---------- */
H.fatBar=function(h){const f=TGH.fatOf(h),j=TGH.injOf(h);
  return `<div class="bar fatb ${f>=80?'hi':f>=50?'mid':''}" data-gid="fatigue" ${H.tipAttr?'':''} data-tip="${(f>=80?'Exhausted: 33% less damage dealt, 33% more taken. ':f>=50?'Tiring: one hex less per AP. ':'')+'Fatigue builds on the road and after fights. Rest at camps, use an Energy Brew, or go home.'}"><i style="width:${f}%"></i><b>Fatigue ${f}%${j?' · '+TGH.INJURY[j].n+' ('+TGH.INJURY[j].d+')':''}</b></div>`};
H.open=function(focusId){
  hideTip();
  const old=document.querySelector('.modal.guide');if(old)old.remove();
  const startCat=focusId&&G[focusId]?G[focusId].cat:H.cats[0];
  const m=document.createElement('div');m.className='modal guide';
  m.innerHTML=`<div class="gbox"><div class="ghead"><h2>Guide</h2><input type="search" id="g-q" placeholder="Search the guide…" aria-label="Search the guide"><button class="gclose" id="g-x" aria-label="Close">×</button></div>
    <div class="gbody"><nav class="gnav">${H.cats.map(c=>`<button data-c="${c}" class="${c===startCat?'on':''}">${c}</button>`).join('')}</nav><div class="gmain" id="g-main"></div></div></div>`;
  document.body.appendChild(m);
  const main=m.querySelector('#g-main');
  const render=(cat,q)=>{
    q=(q||'').trim().toLowerCase();
    const list=Object.values(G).filter(e=>q?(e.t+' '+e.d).toLowerCase().includes(q):e.cat===cat);
    main.innerHTML=(q?`<p class="gnote">${list.length} result${list.length===1?'':'s'}</p>`:`<h3>${cat}</h3>`)+(list.map(e=>`<div class="gentry ${e.id===focusId?'focus':''}" id="ge-${e.id}"><b>${esc(e.t)}</b><p>${esc(e.d)}</p></div>`).join('')||'<p class="empty">Nothing found.</p>');
    const f=main.querySelector('.focus');if(f)f.scrollIntoView({block:'center'});
  };
  render(startCat);
  m.querySelectorAll('.gnav button').forEach(b=>b.onclick=()=>{m.querySelectorAll('.gnav button').forEach(x=>x.classList.toggle('on',x===b));m.querySelector('#g-q').value='';focusId=null;render(b.dataset.c)});
  m.querySelector('#g-q').oninput=e=>{m.querySelectorAll('.gnav button').forEach(x=>x.classList.remove('on'));render(null,e.target.value)};
  m.querySelector('#g-x').onclick=()=>m.remove();
  m.addEventListener('click',e=>{if(e.target===m)m.remove()});
};

/* ---------- stat milestones: what the next few points will buy ---------- */
// Each entry lists the stat value at which something improves.
const tiersFor=(label)=>[T[1].stat,T[2].stat,T[3].stat,T[4].stat].map((v,i)=>({at:v,text:`${label} tier ${i+1} skills (${T[i+1].n})`}));
const MILES={
  str:()=>tiersFor('Warrior'),
  int:()=>tiersFor('Mage'),
  end:()=>tiersFor('Monk'),
  agi:()=>{const o=tiersFor('Archer');for(let v=4;v<=25;v+=3)o.push({at:v,text:`+1 hex of movement per AP (${2+Math.floor((v-1)/3)} total)`});for(const v of [7,13,19])o.push({at:v,text:`+1 Action Point`});return o},
  per:()=>{const o=[];for(let v=3;v<=21;v+=2)o.push({at:v,text:`+1 Sight`});for(let v=4;v<=13;v+=3)o.push({at:v,text:`bow reach ${2+Math.floor((v-1)/3)} hexes`});for(const v of [6,11])o.push({at:v,text:`spell reach ${2+Math.floor((v-1)/5)} hexes`});return o},
  cha:()=>[{at:2,text:'Mend opens (with INT 3)'},{at:4,text:'Rallying Cry, Circle of Mending, Serenity open'},{at:8,text:'Warlord\'s Banner, Resurrection, Perfect Zen open'},{at:13,text:'Shop discount reaches the 25% maximum'}],
  lck:()=>[{at:5,text:'noticeably more crits and loot'},{at:10,text:'better ? tile outcomes'},{at:20,text:'crit chance +24%'}]
};
H.next=(stat,v)=>{const l=MILES[stat]?MILES[stat]():[];const up=l.filter(x=>x.at>v).sort((a,b)=>a.at-b.at)[0];return up?{at:up.at,more:up.at-v,text:up.text}:null};
// What a single extra point gives right now, in plain words.
H.perPoint={
  str:'+about 1.8 damage on every sword swing and Warrior skill',
  per:'0.4% accuracy, and sooner or later more Sight and reach',
  end:'+6 max health, +1 max mana, stronger armor, harder Monk hits',
  cha:'+3% healing and buffs, 2% cheaper shops',
  int:'+3 max mana, about 1.8 damage on staff attacks and every spell',
  agi:'+1.3% evasion, 0.6% crit, about 1.8 damage on bow shots and Archer skills',
  lck:'+1.2% crit chance, better loot and ? tiles'
};
// A short list of skills a hero could learn right now, by tier, for the creation screen.
H.learnable=h=>Object.values(TGH.SKILLS).filter(k=>TGH.canLearn(h,k.id));
H.nearest=(h)=>{
  // the cheapest locked skill to reach: fewest stat points missing
  let best=null;
  for(const k of Object.values(TGH.SKILLS)){
    if(h.skills.includes(k.id)||TGH.canLearn(h,k.id))continue;
    const miss=Object.entries(k.need).reduce((a,[s,v])=>a+Math.max(0,v-h.stats[s]),0);
    const lv=Math.max(0,TGH.skillLvl(k)-h.level);
    const score=miss*10+lv;
    if(!best||score<best.score)best={k,miss,lv,score};
  }
  return best;
};
})();
