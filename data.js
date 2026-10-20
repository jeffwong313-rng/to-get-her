/* To Get Her: game data. Everything the rules need to know that is not code: stats, skills, monsters, maps, items,
   appearance options and story text. Plain script, no build step. */
(function(){
'use strict';
const TGH=window.TGH=window.TGH||{};

/* ---------- SPECIAL ---------- */
TGH.STATS=['str','per','end','cha','int','agi','lck'];
TGH.STATN={str:'STR',per:'PER',end:'END',cha:'CHA',int:'INT',agi:'AGI',lck:'LCK'};
TGH.STATFULL={str:'Strength',per:'Perception',end:'Endurance',cha:'Charisma',int:'Intelligence',agi:'Agility',lck:'Luck'};
TGH.STATD={
  str:'Sword damage and heavy skills. Prerequisite for Warrior skills.',
  per:'How far you see in the fog, and how far bows and spells reach.',
  end:'Health and armor strength. Helps you take hits.',
  cha:'Strengthens buffs and healing. Cheaper shops, better odds with strangers.',
  int:'Mana and spell damage. Prerequisite for Mage skills.',
  agi:'Hexes you move per Action Point, evasion, bow damage. Prerequisite for Archer skills.',
  lck:'Crits, rarer loot, better question marks.'};
TGH.START_POINTS=10;
TGH.POINTS_PER_LEVEL=2;
TGH.MAX_LEVEL=40;

/* ---------- elements ---------- */
TGH.ELEMENTS=['fire','grass','fighting','thunder','ice'];
TGH.BEATS={fire:'grass',grass:'fighting',fighting:'thunder',thunder:'ice',ice:'fire'};
TGH.EL_COL={fire:'#e0643a',grass:'#6fb35a',fighting:'#c98b5c',thunder:'#e6d55a',ice:'#8fd0ea',dark:'#9b70dc',physical:'#b9b1a3'};
TGH.matchup=function(atk,def){
  if(!atk||!def||atk==='physical'||atk==='dark'||def==='dark'||def==='physical')return 1;
  if(TGH.BEATS[atk]===def)return 1.5;
  if(TGH.BEATS[def]===atk)return .5;
  return 1;
};

/* ---------- AP rules ---------- */
// Everyone starts with 2 AP. Levels and Agility add more, to a limit of 6.
TGH.maxAP=h=>Math.min(6,2+Math.floor((h.level-1)/6)+Math.floor((h.stats.agi-1)/6));
// One AP buys this many hexes of movement. Agility makes each AP go much further.
TGH.movePerAP=h=>2+Math.floor((h.stats.agi-1)/3);
TGH.sightOf=h=>2+Math.ceil(h.stats.per/2)+(h.sightBonus||0);
TGH.BASIC_AP=1;

/* ---------- ranges (in hexes) ---------- */
// Warriors hit 1 hex away. Bows start at 2 and grow with Perception to the longest range in the game; spells start at 2 and
// grow more slowly.
TGH.rangeBow=h=>Math.min(6,2+Math.floor((h.stats.per-1)/3)+(h.rangeBonus||0));
TGH.rangeMage=h=>Math.min(4,2+Math.floor((h.stats.per-1)/5)+(h.rangeBonus||0));

/* ---------- skills ----------
   disc: war | arc | mag. need: stat prerequisites. lvl: minimum hero level. ap and mp are costs.
   range: a number of hexes, or 'bow' / 'mage' to use that hero's current reach.
   tgt: enemy | self | ally | party | fallen. aoe: radius in hexes around the target (or around the caster for 'self' aoe). */
const S=TGH.SKILLS={};
const sk=(id,o)=>{S[id]=Object.assign({id,mp:0,ap:2,acc:100,crit:0,el:'physical'},o)};
// Warrior (STR). Tier 1 needs STR 3. Tier 2 needs STR 6 + END 3. Tier 3 needs STR 9 + END 5.
sk('cleave',{disc:'war',tier:1,n:'Cleave',mp:6,ap:2,range:1,tgt:'enemy',aoe:1,mult:1.3,need:{str:3},d:'Swings through the target and every enemy next to it.'});
sk('crush',{disc:'war',tier:1,n:'Crushing Blow',mp:6,ap:2,range:1,tgt:'enemy',mult:2.5,acc:95,crit:10,cdmg:25,need:{str:3},d:'A slow, heavy strike. Hits hard when it lands.'});
sk('wall',{disc:'war',tier:1,n:'Shield Wall',mp:5,ap:1,range:0,tgt:'self',guard:{n:2,taken:.4,taunt:true},need:{str:3,end:2},d:'Takes 60% less damage for 2 rounds, and enemies prefer to hit this hero.'});
sk('wind',{disc:'war',tier:1,n:'Second Wind',mp:6,ap:1,range:0,tgt:'self',healPct:.4,need:{str:3,end:3},d:'Recovers 40% of max health.'});
sk('stunblow',{disc:'war',tier:2,n:'Battle Stun',mp:9,ap:2,range:1,tgt:'enemy',mult:1.6,stun:1,need:{str:6,end:3},lvl:4,d:'Stuns the target for 1 turn. Bosses shake it off.'});
sk('quake',{disc:'war',tier:2,n:'Earthshatter',mp:14,ap:3,range:2,tgt:'enemy',aoe:1,mult:1.7,stun:1,el:'fighting',need:{str:6,end:3},lvl:4,d:'Slams the ground two hexes away. Enemies caught in the burst may be stunned.'});
sk('sunder',{disc:'war',tier:2,n:'Sunder',mp:9,ap:2,range:1,tgt:'enemy',mult:3,pierce:true,crit:10,cdmg:25,need:{str:6,end:3},lvl:4,d:'A heavy blow that ignores armor.'});
sk('rally',{disc:'war',tier:2,n:'Rallying Cry',mp:10,ap:2,range:0,tgt:'party',buff:{n:3,dmg:.25,def:.2},need:{str:6,cha:3},lvl:4,d:'For 3 rounds both heroes deal 25% more damage and take 20% less.'});
sk('titan',{disc:'war',tier:3,n:'Titan’s Wrath',mp:20,ap:3,range:2,tgt:'enemy',mult:5,pierce:true,stun:2,crit:10,need:{str:9,end:5},lvl:8,d:'A blow that ignores armor and stuns for 2 turns (1 for bosses). Reaches two hexes.'});
sk('execute',{disc:'war',tier:3,n:'Executioner',mp:18,ap:3,range:1,tgt:'enemy',mult:4,pierce:true,low:1.5,crit:15,cdmg:25,need:{str:9,end:5},lvl:8,d:'Ignores armor and deals 50% more to an enemy below half health.'});
sk('warlord',{disc:'war',tier:3,n:'Warlord’s Banner',mp:22,ap:3,range:0,tgt:'party',buff:{n:4,dmg:.5,def:.6,taunt:true,crit:15},need:{str:9,cha:5},lvl:8,d:'For 4 rounds both heroes deal 50% more damage, take 60% less, and gain +15% crit. Enemies must target the caster.'});
// Archer (AGI). Tier 1 needs AGI 3. Tier 2 needs AGI 6 + PER 3. Tier 3 needs AGI 9 + PER 5.
sk('pierceshot',{disc:'arc',tier:1,n:'Piercing Shot',mp:6,ap:2,range:'bow',tgt:'enemy',mult:1.8,crit:35,need:{agi:3},d:'An aimed shot that looks for weak points.'});
sk('volley',{disc:'arc',tier:1,n:'Volley',mp:8,ap:2,range:'bow',tgt:'enemy',aoe:1,mult:1.1,acc:95,crit:10,need:{agi:3},d:'Rains arrows on the target and everything next to it.'});
sk('double',{disc:'arc',tier:1,n:'Double Shot',mp:7,ap:2,range:'bow',tgt:'enemy',mult:1,hits:2,crit:5,need:{agi:3},d:'Two quick arrows at one target.'});
sk('cripple',{disc:'arc',tier:1,n:'Crippling Arrow',mp:6,ap:2,range:'bow',tgt:'enemy',mult:1.45,weakenAtk:{n:3,v:.3},need:{agi:3,per:2},d:'On hit, the target deals 30% less damage for 3 rounds.'});
sk('imbue',{disc:'arc',tier:2,n:'Elemental Arrows',mp:8,ap:1,range:0,tgt:'self',imbue:3,need:{agi:6,per:3},lvl:4,d:'For 3 turns arrows carry an element of your choice, so they can hit weaknesses like a mage’s spells.'});
sk('sniper',{disc:'arc',tier:2,n:'Sniper',mp:9,ap:1,range:0,tgt:'self',critBuff:{n:2,v:80},need:{agi:6,per:3},lvl:4,d:'Crit chance rises to 80% for 2 turns.'});
sk('assassin',{disc:'arc',tier:2,n:'Assassinate',mp:13,ap:3,range:'bow',tgt:'enemy',mult:2.9,crit:30,cdmg:25,exec:.3,need:{agi:6,per:3},lvl:4,d:'A lethal shot. Finishes off any non-boss enemy it leaves under 30% health.'});
sk('feather',{disc:'arc',tier:2,n:'Featherweight',mp:9,ap:1,range:0,tgt:'self',evaBuff:{n:2,v:.9},need:{agi:6,per:3},lvl:4,d:'Evasion rises to 90% for 2 turns.'});
sk('hail',{disc:'arc',tier:3,n:'Prism Hail',mp:16,ap:3,range:'bow',tgt:'enemy',aoe:2,mult:1,hits:5,acc:95,crit:10,el:'prism',need:{agi:9,per:5},lvl:8,d:'Five arrows scatter around the target, each in the element that hurts its victim most.'});
sk('killshot',{disc:'arc',tier:3,n:'Killshot',mp:20,ap:3,range:'bow',tgt:'enemy',mult:5,sure:true,forceCrit:true,cdmg:50,need:{agi:9,per:5},lvl:8,d:'Never misses and always crits.'});
sk('phantom',{disc:'arc',tier:3,n:'Phantom Veil',mp:20,ap:2,range:0,tgt:'party',evaBuff:{n:4,v:.9},dmgSelf:.35,partyEva:.5,need:{agi:9,per:5},lvl:8,d:'Evasion 90% for 4 turns with 35% more damage. Your partner gets 50% evasion for 3 turns.'});
// Mage (INT). Tier 1 needs INT 3. Tier 2 needs INT 6 + PER 3. Tier 3 needs INT 9 + PER 5.
sk('bolt',{disc:'mag',tier:1,n:'Elemental Bolt',mp:8,ap:2,range:'mage',tgt:'enemy',mult:2,el:'attune',need:{int:3},d:'A focused blast in the attuned element.'});
sk('storm',{disc:'mag',tier:1,n:'Elemental Storm',mp:12,ap:3,range:'mage',tgt:'enemy',aoe:1,mult:1.15,el:'attune',need:{int:3},d:'Engulfs the target and its neighbours in the attuned element.'});
sk('hex',{disc:'mag',tier:1,n:'Hex',mp:6,ap:1,range:'mage',tgt:'enemy',mult:0,hexed:{n:3,v:.33},need:{int:3},d:'The target takes 33% more damage from everyone for 3 rounds.'});
sk('mend',{disc:'mag',tier:1,n:'Mend',mp:9,ap:2,range:'mage',tgt:'ally',healPct:.4,healInt:2.7,need:{int:3,cha:2},d:'Heals one ally for 40% of their max health plus 2.7x the caster’s INT.'});
sk('drain',{disc:'mag',tier:1,n:'Life Drain',mp:8,ap:2,range:'mage',tgt:'enemy',mult:1.5,el:'dark',drain:.5,need:{int:3},d:'Dark damage. Heals the caster for half the damage dealt.'});
sk('chain',{disc:'mag',tier:2,n:'Chain Elemental',mp:12,ap:3,range:'mage',tgt:'enemy',mult:1.6,el:'attune',chain:[.8,.6,.4],need:{int:6,per:3},lvl:4,d:'A bolt that leaps between nearby enemies, losing force each jump.'});
sk('nova',{disc:'mag',tier:2,n:'Elemental Nova',mp:16,ap:3,range:'mage',tgt:'enemy',aoe:2,mult:1.7,el:'attune',need:{int:6,per:3},lvl:4,d:'A burst of the attuned element two hexes wide.'});
sk('lance',{disc:'mag',tier:2,n:'Arcane Lance',mp:10,mpPct:.5,ap:2,range:'mage',tgt:'enemy',mult:4,el:'attune',weak:2,need:{int:6,per:3},lvl:4,d:'A focused lance in the attuned element. Costs half of max MP. Weakness hits deal 2x.'});
sk('circle',{disc:'mag',tier:2,n:'Circle of Mending',mp:14,ap:2,range:0,tgt:'party',healPct:.27,healInt:1.3,need:{int:6,cha:3},lvl:4,d:'Heals both heroes for 27% of their max health plus 1.3x the caster’s INT.'});
sk('cataclysm',{disc:'mag',tier:3,n:'Cataclysm',mp:28,ap:3,range:'mage',tgt:'enemy',aoe:3,mult:2.5,el:'attune',stun:1,need:{int:9,per:5},lvl:8,d:'Engulfs a huge area in the attuned element and stuns everything in it for 1 turn.'});
sk('meteor',{disc:'mag',tier:3,n:'Starfall',mp:24,mpPct:.5,ap:3,range:'mage',tgt:'enemy',mult:9,el:'attune',weak:2,noRes:true,crit:10,need:{int:9,per:5},lvl:8,d:'A falling star that ignores resistance. Costs half of max MP. Weakness hits deal 2x.'});
sk('revive',{disc:'mag',tier:3,n:'Resurrection',mp:30,ap:3,range:'mage',tgt:'fallen',healPct:.5,need:{int:9,cha:5},lvl:8,d:'Brings a fallen ally back with 50% health, from across the field.'});

TGH.DISC={war:{n:'Warrior',stat:'str',col:'#d9534f'},arc:{n:'Archer',stat:'agi',col:'#5cb85c'},mag:{n:'Mage',stat:'int',col:'#6d6bdc'}};
TGH.skillReqText=k=>Object.entries(k.need).map(([s,v])=>TGH.STATN[s]+' '+v).join(', ')+(k.lvl?`, level ${k.lvl}`:'');
TGH.canLearn=(h,id)=>{const k=S[id];return !h.skills.includes(id)&&Object.entries(k.need).every(([s,v])=>h.stats[s]>=v)&&h.level>=(k.lvl||1)};
TGH.skillRange=(h,k)=>k.range==='bow'?TGH.rangeBow(h):k.range==='mage'?TGH.rangeMage(h):k.range;

/* ---------- weapons: no classes, only what you carry and how you are built ---------- */
TGH.FAM={
  sword:{n:'Sword',stat:'str',range:1,disc:'war',el:'physical',ap:1,mult:1,acc:95},
  bow:{n:'Bow',stat:'agi',range:'bow',disc:'arc',el:'physical',ap:1,mult:1,acc:88},
  staff:{n:'Staff',stat:'int',range:'mage',disc:'mag',el:'attune',ap:1,mult:.9,acc:100},
  fist:{n:'Bare hands',stat:'str',range:1,disc:'war',el:'physical',ap:1,mult:.7,acc:95}
};

/* ---------- monsters ----------
   kind decides the 3D model, stats and manners. range is in hexes; mv is hexes per AP. */
TGH.KINDS={
  beast:{hp:1,atk:1,mv:3,range:1,ap:2,spd:'fast',look:'beast',el:null},
  slime:{hp:1.3,atk:.8,mv:1,range:1,ap:2,look:'slime'},
  wraith:{hp:.8,atk:1.15,mv:2,range:3,ap:2,look:'wraith',magic:true},
  brute:{hp:1.7,atk:1.2,mv:1,range:1,ap:2,look:'brute'},
  bat:{hp:.6,atk:.8,mv:4,range:1,ap:2,look:'bat'},
  spider:{hp:.8,atk:1,mv:2,range:3,ap:2,look:'spider',web:true},
  serpent:{hp:1,atk:1.05,mv:2,range:2,ap:2,look:'serpent'},
  skeleton:{hp:.9,atk:1,mv:2,range:1,ap:2,look:'skeleton'},
};
TGH.BIOMES={
  cave:{name:'The Cave',el:'physical',mat:['stone','metal'],hazard:'water',block:['boulder','boulder','mountain'],
    sky:'#1b1626',fog:'#120f1a',floor:['#7c7488','#6f6780'],edge:'#4a4358',w:12,h:16,mons:[['Cave Wolf','beast'],['Gloom Slime','slime'],['Cave Wraith','wraith'],['Rock Brute','brute'],['Cave Bat','bat'],['Burrow Spider','spider'],['Pit Serpent','serpent'],['Restless Dead','skeleton']],
    flavor:'A short crawl through the caves near home, where something big has made its den.',diff:0,mult:1,packs:5,elites:1,camps:2,qs:3,chests:2,mats:5,boss:'cave'},
  wilds:{name:'The Wilds',el:'grass',mat:['wood','hide','stone'],hazard:'water',block:['boulder','tree','mountain'],
    sky:'#16241a',fog:'#0d160f',floor:['#6e8a54','#627c4a'],edge:'#3c4f2e',w:12,h:20,mons:[['Thornback','beast'],['Moss Slime','slime'],['Spore Wisp','wraith'],['Bark Brute','brute'],['Rot Bat','bat'],['Web Mother','spider'],['Vine Serpent','serpent'],['Rooted Dead','skeleton']],
    flavor:'Days out in the untamed wilds, past the last farms and the last roads.',diff:.5,mult:1.3,packs:8,elites:2,camps:3,qs:4,chests:3,mats:7,boss:'The Rotting Oak'},
  wasteland:{name:'The Wasteland',el:'fire',mat:['carbon','metal','stone'],hazard:'lava',block:['boulder','mountain'],
    sky:'#2a1410',fog:'#1a0c0a',floor:['#8a5a44','#7c4f3c'],edge:'#4a2418',w:12,h:24,mons:[['Cinder Hound','beast'],['Magma Ooze','slime'],['Flame Wisp','wraith'],['Obsidian Brute','brute'],['Cinder Bat','bat'],['Lava Crawler','spider'],['Magma Wyrm','serpent'],['Charred Bones','skeleton']],
    flavor:'A long haul across wastes the smoke has burned dead. Lava splits the ground.',diff:1,mult:1.7,packs:11,elites:3,camps:3,qs:5,chests:3,mats:9,boss:'Mother of Ash'},
  summit:{name:'The Summit',el:'ice',mat:['crystal','stone','metal'],hazard:'water',block:['mountain','mountain','boulder'],
    sky:'#12202e',fog:'#0c1620',floor:['#cfe0ec','#bdd2e2'],edge:'#6f8aa0',w:12,h:28,mons:[['Frost Wolf','beast'],['Rime Slime','slime'],['Ice Wraith','wraith'],['Glacier Brute','brute'],['Rime Bat','bat'],['Snow Weaver','spider'],['Ice Serpent','serpent'],['Frozen Dead','skeleton']],
    flavor:'The climb to the highest point in the land, where everyone can sense a dark force waiting.',diff:1.5,mult:2.3,packs:14,elites:4,camps:4,qs:6,chests:4,mats:11,boss:'The Gatekeeper'},
  dark:{name:'The Dark Side',el:'dark',mat:['void'],hazard:'void',block:['mountain','boulder'],
    sky:'#07040c',fog:'#05030a',floor:['#3a2f50','#30284a'],edge:'#1a1230',w:12,h:22,mons:[['Gloom Hound','beast'],['Void Ooze','slime'],['Hollow Shade','wraith'],['Abyssal Knight','brute'],['Shade Bat','bat'],['Void Weaver','spider'],['Abyssal Eel','serpent'],['Unlit Dead','skeleton']],
    flavor:'There is no sky here. This is where the darkness took her.',diff:2,mult:3,packs:11,elites:4,camps:3,qs:4,chests:2,mats:6,boss:'The Unlit King'},
};
TGH.ADVENTURES=['cave','wilds','wasteland','summit','dark'];
TGH.ADV_REQ={cave:null,wilds:'cave',wasteland:'wilds',summit:'wasteland',dark:'summit'};
TGH.CAVE_BEASTS={
  'The Cave Bear':{kind:'beast',hp:3.2,atk:1.1,mv:2,color:'#6a4a30',eye:'#ffcf5a',blurb:'Slow and enormous. It grows more furious as the fight drags on.',rage:true},
  'The Giant Boar':{kind:'beast',hp:2.6,atk:1.25,mv:3,color:'#5a4436',eye:'#ff4a3a',blurb:'Paws the ground, then charges across the field for huge damage.',charge:true},
  'The Night Panther':{kind:'beast',hp:1.7,atk:1.1,mv:5,color:'#2a2632',eye:'#9cff5a',blurb:'The fastest thing in the caves. Acts three times for each of yours.',fast:true},
};
TGH.BOSSES={
  'The Rotting Oak':{kind:'brute',hp:4.2,atk:1.2,mv:1,range:2,color:'#4d6b2e',eye:'#ffb02e',blurb:'A tree that remembers walking. Its roots reach two hexes.'},
  'Mother of Ash':{kind:'serpent',hp:4.6,atk:1.3,mv:2,range:3,color:'#4a1c14',eye:'#ffd34a',blurb:'Born in the ember. Spits fire three hexes.'},
  'The Gatekeeper':{kind:'wraith',hp:5.2,atk:1.35,mv:2,range:4,color:'#5a6a8a',eye:'#9fd6ff',blurb:'It stands at the top of the world. A first, veiled look at what waits beyond.'},
  'The Unlit King':{kind:'brute',hp:7,atk:1.5,mv:2,range:3,color:'#1c1230',eye:'#ff3a5a',blurb:'He has found you. There is no other path. Your sister is behind him.'},
};
TGH.MUTATIONS={
  regen:{n:'Regenerating',d:'heals 8% each turn'},frenzy:{n:'Frenzied',d:'+35% attack'},
  warded:{n:'Warded',d:'+25% armor'},colossal:{n:'Colossal',d:'+60% health'},thorns:{n:'Thorned',d:'reflects 10% damage taken'}
};

/* ---------- loot ---------- */
TGH.RAR={common:{i:0,m:1,l:'Common',c:'#b9b1a3'},rare:{i:1,m:1.3,l:'Rare',c:'#5f97e3'},epic:{i:2,m:1.8,l:'Epic',c:'#b56fe3'},godlike:{i:3,m:2.5,l:'Godlike',c:'#f2a83a'}};
TGH.SLOTS=['weapon','helmet','chest','pants','ring','amulet'];
TGH.SLOTN={weapon:'Weapon',helmet:'Helmet',chest:'Chest',pants:'Pants',ring:'Ring',amulet:'Amulet'};
TGH.WNAMES={sword:['Longsword','Falchion','Warhammer','Cutlass'],bow:['Shortbow','Longbow','Recurve','Hunter’s Bow'],staff:['Staff','Rod','Crook','Wand']};
TGH.ANAMES={helmet:['Hood','Cap','Circlet','Greathelm'],chest:['Jerkin','Robe','Cuirass','Tunic'],pants:['Leggings','Wraps','Greaves','Trousers'],ring:['Ring','Band','Signet'],amulet:['Amulet','Pendant','Talisman']};
TGH.PREFIX={common:['Plain','Rough','Old','Dull'],rare:['Grim','Ashen','Hollow','Ironbound'],epic:['Moonlit','Duskforged','Bloodsworn','Starlit'],godlike:['Eternal','Sunless','Worldrender','Dawnbringer']};
TGH.AFFIXES=[
  {k:'str',l:'Strength',a:1,b:2},{k:'agi',l:'Agility',a:1,b:2},{k:'int',l:'Intelligence',a:1,b:2},{k:'per',l:'Perception',a:1,b:2},
  {k:'end',l:'Endurance',a:1,b:2},{k:'cha',l:'Charisma',a:1,b:2},{k:'lck',l:'Luck',a:1,b:2},
  {k:'hp',l:'Health',a:6,b:14},{k:'mp',l:'Mana',a:4,b:9},{k:'crit',l:'Crit Chance %',a:2,b:5},{k:'critdmg',l:'Crit Damage %',a:10,b:25},
  {k:'lifesteal',l:'Lifesteal %',a:1,b:3},{k:'goldfind',l:'Gold Find %',a:5,b:15},{k:'xp',l:'XP Gain %',a:5,b:12},
  {k:'ap',l:'Max AP',a:1,b:1,rareOnly:true},{k:'move',l:'Hexes per AP',a:1,b:1,rareOnly:true},{k:'sight',l:'Sight',a:1,b:1,rareOnly:true},
];
TGH.POTIONS={
  potion:{n:'Healing Potion',price:25,d:'Restores 40% of max health.',heal:.4},
  mpotion:{n:'Mana Potion',price:30,d:'Restores 50% of max mana.',mana:.5},
  apdraught:{n:'Quickening Draught',price:70,d:'Grants +2 AP this turn.',ap:2},
  phoenix:{n:'Phoenix Feather',price:150,d:'Revives a fallen ally with 50% health.',revive:.5},
  scroll:{n:'Return Scroll',price:60,d:'Both heroes return home at once, keeping everything they found.',scroll:true},
};
TGH.MATS={
  stone:{n:'Stone',col:'#8a8a92',d:'Foundations, upgrades.'},metal:{n:'Scrap',col:'#c0b8a8',d:'Forge and gear upgrades.'},
  wood:{n:'Wood',col:'#9a6a3a',d:'Farm fences and barns.'},hide:{n:'Hide',col:'#b0774c',d:'Farm and gear.'},
  crystal:{n:'Crystal',col:'#8fd0ea',d:'The Witch’s vials.'},carbon:{n:'Carbon',col:'#5a5258',d:'The Witch’s cauldron.'},
  void:{n:'Void Shard',col:'#9b70dc',d:'Final upgrades.'},
};

/* ---------- town ---------- */
TGH.BUILD={
  forge:{n:'Forge',max:5,d:'Upgrade gear. Level raises how high items can go.',cost:L=>({gold:120*L,stone:3*L,metal:2*L})},
  vault:{n:'Vault',max:5,d:'Bigger shared pack: room for more gear.',cost:L=>({gold:80*L,stone:2*L+1})},
  witch:{n:'Witch’s Hut',max:5,d:'Better potions. Each level adds 8% to healing and unlocks stock.',cost:L=>({gold:100*L,crystal:2*L,carbon:1*L})},
  farm:{n:'Farm',max:5,d:'Hot meals at home: each level adds +6 max health to both heroes.',cost:L=>({gold:90*L,wood:2*L+1,hide:L+1})},
  lodge:{n:'Family Home',max:5,d:'Rest at home restores everyone, and each level adds +1 starting AP buffer (carry-over move) on adventures.',cost:L=>({gold:150*L,stone:2*L,wood:2*L})},
};
TGH.vaultCap=L=>12+L*6;
TGH.forgeMax=L=>Math.min(10,L*2);

/* ---------- appearance: doubled from the old game ---------- */
const A=TGH.LOOKS={};
A.skin=['#fde3cf','#f8d3b4','#f0c09a','#e3a97c','#d29265','#bd7a50','#a1623c','#855033','#6a3f28','#533020','#f3d6e0','#cfe6d6'];
A.skinN=['Porcelain','Fair','Light','Warm','Honey','Tan','Bronze','Umber','Deep','Ebony','Rosy','Mint'];
A.hairColor=['#2a1e18','#5a3a24','#8a5a34','#c8a050','#e8d28a','#d8d0c0','#f4f1ee','#8a3a20','#c8402e','#e86a8a','#d89ae0','#6a5ad8','#3a8ad8','#3ab8a0'];
A.hairColorN=['Black','Chestnut','Auburn','Honey','Blonde','Ash','Silver','Ginger','Scarlet','Rose','Orchid','Indigo','Azure','Teal'];
A.eye=['#4a3220','#2a5a9a','#3a8a5a','#7a4aa0','#c0402e','#d8a030','#2a2a2a','#5ac8d8','#e86a8a','#8a8a96'];
A.eyeN=['Brown','Blue','Green','Violet','Ruby','Amber','Night','Aqua','Pink','Silver'];
A.outfit=['#8a3030','#3f6d38','#3d3c86','#c8872e','#2a6a7a','#6a3a7a','#a8485e','#4a4a56','#d8d0c0','#2a2a3a','#7a5a2a','#2e7a5e'];
A.outfitN=['Crimson','Forest','Midnight','Gold','Teal','Plum','Rose','Slate','Cream','Black','Bronze','Jade'];
A.hairStyle=['short','spiky','bob','long','ponytail','pigtails','bun','mohawk','curly','sidepart','twinbuns','wolf'];
A.hairStyleN=['Short crop','Spiky','Bob','Long & straight','Ponytail','Pigtails','Top bun','Mohawk','Curly cloud','Side part','Twin buns','Wolf cut'];
A.accessory=['none','glasses','headband','scarf','cape','hat','earring','ribbon'];
A.accessoryN=['None','Round glasses','Headband','Scarf','Cape','Witch hat','Earring','Big ribbon'];
A.mark=['none','freckles','blush','scar','star','tears'];
A.markN=['None','Freckles','Blush','Scar','Star mark','Beauty mark'];

TGH.RELATIONS={
  girlgirl:[['sisters','Sisters'],['couple','Couple']],
  boyboy:[['brothers','Brothers'],['couple','Couple']],
  mixed:[['siblings','Brother and Sister'],['couple','Couple']],
};

/* ---------- town gossip, hints, and the story ---------- */
TGH.HINTS=[
  'Tap a hex to preview a move. Tap it again to go. Each AP buys several hexes.',
  'Elites and bosses notice you from two hexes away. Keep your partner close.',
  'Archers reach farther with Perception. Mages reach less far. Warriors only reach what is next to them.',
  'Level up to spend stat points. Skills need the right stats, so a hybrid build is allowed.',
  'Camp fires heal both heroes and bring a fallen partner back.',
  'Bring stone and scrap home to rebuild the town.',
];
})();
