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
/* Skill tiers. Your discipline stat decides what you are offered: tier 1 needs 3 in the stat, tier 2 needs 10, tier 3 needs 18
   and tier 4 needs 26 (plus a level). A few support skills also want Charisma. A hero with 11 STR, 11 INT and 11 AGI can
   learn tier 2 skills from the warrior, archer and mage lists at once. */
TGH.TIERS={1:{stat:3,lvl:1,n:'Novice'},2:{stat:10,lvl:4,n:'Adept'},3:{stat:18,lvl:10,n:'Master'},4:{stat:26,lvl:20,n:'Legend'}};
// Warrior (STR).
sk('cleave',{disc:'war',tier:1,n:'Cleave',mp:6,ap:2,range:1,tgt:'enemy',aoe:1,mult:1.3,need:{str:3},d:'Swings through the target and every enemy next to it.'});
sk('crush',{disc:'war',tier:1,n:'Crushing Blow',mp:6,ap:2,range:1,tgt:'enemy',mult:2.5,acc:95,crit:10,cdmg:25,need:{str:3},d:'A slow, heavy strike. Hits hard when it lands.'});
sk('wall',{disc:'war',tier:1,n:'Shield Wall',mp:5,ap:1,range:0,tgt:'self',guard:{n:2,taken:.4,taunt:true},need:{str:3,end:2},d:'Takes 60% less damage for 2 rounds, and enemies prefer to hit this hero.'});
sk('wind',{disc:'war',tier:1,n:'Second Wind',mp:6,ap:1,range:0,tgt:'self',healPct:.4,need:{str:3,end:3},d:'Recovers 40% of max health.'});
sk('stunblow',{disc:'war',tier:2,n:'Battle Stun',mp:9,ap:2,range:1,tgt:'enemy',mult:1.6,stun:1,need:{str:10},d:'Stuns the target for 1 turn. Bosses shake it off.'});
sk('quake',{disc:'war',tier:2,n:'Earthshatter',mp:14,ap:3,range:2,tgt:'enemy',aoe:1,mult:1.7,stun:1,el:'fighting',need:{str:10},d:'Slams the ground two hexes away. Enemies caught in the burst may be stunned.'});
sk('sunder',{disc:'war',tier:2,n:'Sunder',mp:9,ap:2,range:1,tgt:'enemy',mult:3,pierce:true,crit:10,cdmg:25,need:{str:10},d:'A heavy blow that ignores armor.'});
sk('rally',{disc:'war',tier:2,n:'Rallying Cry',mp:10,ap:2,range:0,tgt:'party',buff:{n:3,dmg:.25,def:.2},need:{str:10,cha:4},d:'For 3 rounds both heroes deal 25% more damage and take 20% less.'});
sk('titan',{disc:'war',tier:3,n:'Titan’s Wrath',mp:20,ap:3,range:2,tgt:'enemy',mult:5,pierce:true,stun:2,crit:10,need:{str:18},d:'A blow that ignores armor and stuns for 2 turns (1 for bosses). Reaches two hexes.'});
sk('execute',{disc:'war',tier:3,n:'Executioner',mp:18,ap:3,range:1,tgt:'enemy',mult:4,pierce:true,low:1.5,crit:15,cdmg:25,need:{str:18},d:'Ignores armor and deals 50% more to an enemy below half health.'});
sk('warlord',{disc:'war',tier:3,n:'Warlord’s Banner',mp:22,ap:3,range:0,tgt:'party',buff:{n:4,dmg:.5,def:.6,taunt:true,crit:15},need:{str:18,cha:8},d:'For 4 rounds both heroes deal 50% more damage, take 60% less, and gain +15% crit. Enemies must target whoever raised it.'});
sk('worldbreaker',{disc:'war',tier:4,n:'Worldbreaker',mp:30,ap:4,range:2,tgt:'enemy',aoe:2,mult:6,pierce:true,stun:2,crit:15,need:{str:26},d:'Brings the whole sky down on one spot. Ignores armor, hits everything within 2 hexes and stuns it.'});
// Archer (AGI).
sk('pierceshot',{disc:'arc',tier:1,n:'Piercing Shot',mp:6,ap:2,range:'bow',tgt:'enemy',mult:1.8,crit:35,need:{agi:3},d:'An aimed shot that looks for weak points.'});
sk('volley',{disc:'arc',tier:1,n:'Volley',mp:8,ap:2,range:'bow',tgt:'enemy',aoe:1,mult:1.1,acc:95,crit:10,need:{agi:3},d:'Rains arrows on the target and everything next to it.'});
sk('double',{disc:'arc',tier:1,n:'Double Shot',mp:7,ap:2,range:'bow',tgt:'enemy',mult:1,hits:2,crit:5,need:{agi:3},d:'Two quick arrows at one target.'});
sk('cripple',{disc:'arc',tier:1,n:'Crippling Arrow',mp:6,ap:2,range:'bow',tgt:'enemy',mult:1.45,weakenAtk:{n:3,v:.3},need:{agi:3,per:2},d:'On hit, the target deals 30% less damage for 3 rounds.'});
sk('imbue',{disc:'arc',tier:2,n:'Elemental Arrows',mp:8,ap:1,range:0,tgt:'self',imbue:3,need:{agi:10},d:'For 3 turns arrows carry an element of your choice, so they can hit weaknesses like a mage’s spells.'});
sk('sniper',{disc:'arc',tier:2,n:'Sniper',mp:9,ap:1,range:0,tgt:'self',critBuff:{n:2,v:80},need:{agi:10},d:'Crit chance rises to 80% for 2 turns.'});
sk('assassin',{disc:'arc',tier:2,n:'Assassinate',mp:13,ap:3,range:'bow',tgt:'enemy',mult:2.9,crit:30,cdmg:25,exec:.3,need:{agi:10},d:'A lethal shot. Finishes off any non-boss enemy it leaves under 30% health.'});
sk('feather',{disc:'arc',tier:2,n:'Featherweight',mp:9,ap:1,range:0,tgt:'self',evaBuff:{n:2,v:.9},need:{agi:10,per:4},d:'Evasion rises to 90% for 2 turns.'});
sk('hail',{disc:'arc',tier:3,n:'Prism Hail',mp:16,ap:3,range:'bow',tgt:'enemy',aoe:2,mult:1,hits:5,acc:95,crit:10,el:'prism',need:{agi:18},d:'Five arrows scatter around the target, each in the element that hurts its victim most.'});
sk('killshot',{disc:'arc',tier:3,n:'Killshot',mp:20,ap:3,range:'bow',tgt:'enemy',mult:5,sure:true,forceCrit:true,cdmg:50,need:{agi:18},d:'Never misses and always crits.'});
sk('phantom',{disc:'arc',tier:3,n:'Phantom Veil',mp:20,ap:2,range:0,tgt:'party',evaBuff:{n:4,v:.9},dmgSelf:.35,partyEva:.5,need:{agi:18,per:8},d:'Evasion 90% for 4 turns with 35% more damage. Your partner gets 50% evasion for 3 turns.'});
sk('starfall',{disc:'arc',tier:4,n:'Rain of Stars',mp:30,ap:4,range:'bow',tgt:'enemy',aoe:3,mult:1.2,hits:8,acc:100,crit:15,el:'prism',need:{agi:26},d:'Eight falling arrows of light scatter over a wide area, each in the element that hurts its victim most.'});
// Mage (INT).
sk('bolt',{disc:'mag',tier:1,n:'Elemental Bolt',mp:8,ap:2,range:'mage',tgt:'enemy',mult:2,el:'attune',need:{int:3},d:'A focused blast in the attuned element.'});
sk('storm',{disc:'mag',tier:1,n:'Elemental Storm',mp:12,ap:3,range:'mage',tgt:'enemy',aoe:1,mult:1.15,el:'attune',need:{int:3},d:'Engulfs the target and its neighbours in the attuned element.'});
sk('hex',{disc:'mag',tier:1,n:'Hex',mp:6,ap:1,range:'mage',tgt:'enemy',mult:0,hexed:{n:3,v:.33},need:{int:3},d:'The target takes 33% more damage from everyone for 3 rounds.'});
sk('mend',{disc:'mag',tier:1,n:'Mend',mp:9,ap:2,range:'mage',tgt:'ally',healPct:.4,healInt:2.7,need:{int:3,cha:2},d:'Heals one ally for 40% of their max health plus 2.7x the caster’s INT.'});
sk('drain',{disc:'mag',tier:1,n:'Life Drain',mp:8,ap:2,range:'mage',tgt:'enemy',mult:1.5,el:'dark',drain:.5,need:{int:3},d:'Dark damage. Heals the caster for half the damage dealt.'});
sk('chain',{disc:'mag',tier:2,n:'Chain Elemental',mp:12,ap:3,range:'mage',tgt:'enemy',mult:1.6,el:'attune',chain:[.8,.6,.4],need:{int:10},d:'A bolt that leaps between nearby enemies, losing force each jump.'});
sk('nova',{disc:'mag',tier:2,n:'Elemental Nova',mp:16,ap:3,range:'mage',tgt:'enemy',aoe:2,mult:1.7,el:'attune',need:{int:10},d:'A burst of the attuned element two hexes wide.'});
sk('lance',{disc:'mag',tier:2,n:'Arcane Lance',mp:10,mpPct:.5,ap:2,range:'mage',tgt:'enemy',mult:4,el:'attune',weak:2,need:{int:10},d:'A focused lance in the attuned element. Costs half of max MP. Weakness hits deal 2x.'});
sk('circle',{disc:'mag',tier:2,n:'Circle of Mending',mp:14,ap:2,range:0,tgt:'party',healPct:.27,healInt:1.3,need:{int:10,cha:4},d:'Heals both heroes for 27% of their max health plus 1.3x the caster’s INT.'});
sk('cataclysm',{disc:'mag',tier:3,n:'Cataclysm',mp:28,ap:3,range:'mage',tgt:'enemy',aoe:3,mult:2.5,el:'attune',stun:1,need:{int:18},d:'Engulfs a huge area in the attuned element and stuns everything in it for 1 turn.'});
sk('meteor',{disc:'mag',tier:3,n:'Starfall',mp:24,mpPct:.5,ap:3,range:'mage',tgt:'enemy',mult:9,el:'attune',weak:2,noRes:true,crit:10,need:{int:18},d:'A falling star that ignores resistance. Costs half of max MP. Weakness hits deal 2x.'});
sk('revive',{disc:'mag',tier:3,n:'Resurrection',mp:30,ap:3,range:'mage',tgt:'fallen',healPct:.5,need:{int:18,cha:8},d:'Brings a fallen ally back with 50% health, from across the field.'});
sk('annihilate',{disc:'mag',tier:4,n:'Annihilate',mp:40,mpPct:.7,ap:4,range:'mage',tgt:'enemy',aoe:2,mult:10,el:'attune',weak:2.5,noRes:true,crit:15,need:{int:26},d:'Tears a hole in the world. Ignores resistance and armor in a 2-hex burst. Costs 70% of max MP.'});
// Monk (END): the body is the weapon. Calm, tough, quick hands.
sk('palm',{disc:'mon',tier:1,n:'Open Palm',mp:5,ap:2,range:1,tgt:'enemy',mult:1.7,acc:100,crit:10,need:{end:3},d:'A clean, fast palm strike that rarely misses and crits easily.'});
sk('flurry',{disc:'mon',tier:1,n:'Flurry of Fists',mp:7,ap:2,range:1,tgt:'enemy',mult:.65,hits:3,crit:5,need:{end:3},d:'Three quick punches at one target. Each rolls to hit.'});
sk('chi',{disc:'mon',tier:1,n:'Inner Calm',mp:4,ap:1,range:0,tgt:'self',healPct:.3,mpGain:.2,need:{end:3},d:'A slow breath. Recovers 30% of max health and 20% of max mana.'});
sk('stoneskin',{disc:'mon',tier:1,n:'Stone Skin',mp:5,ap:1,range:0,tgt:'self',guard:{n:2,taken:.5,taunt:false},need:{end:3,agi:2},d:'Hardens the body: takes half damage for 2 rounds.'});
sk('pressure',{disc:'mon',tier:2,n:'Pressure Point',mp:9,ap:2,range:1,tgt:'enemy',mult:1.5,stun:1,crit:10,need:{end:10},d:'Strikes a nerve. Stuns the target for 1 turn. Bosses shake it off.'});
sk('whirl',{disc:'mon',tier:2,n:'Whirlwind Kick',mp:11,ap:2,range:0,tgt:'around',aoe:1,mult:1.5,need:{end:10},d:'Spins and kicks every enemy standing next to you.'});
sk('ironbody',{disc:'mon',tier:2,n:'Iron Body',mp:8,ap:1,range:0,tgt:'self',guard:{n:3,taken:.3,taunt:true},need:{end:10},d:'Takes 70% less damage for 3 rounds, and enemies prefer to hit this hero.'});
sk('serenity',{disc:'mon',tier:2,n:'Serenity',mp:12,ap:2,range:0,tgt:'party',healPct:.25,mpGain:.1,need:{end:10,cha:4},d:'A calm that spreads to your partner. Both heroes recover 25% of max health and 10% of max mana.'});
sk('dragon',{disc:'mon',tier:3,n:'Dragon Fist',mp:18,ap:3,range:1,tgt:'enemy',mult:4.5,pierce:true,crit:20,cdmg:30,need:{end:18},d:'A rising strike that ignores armor and crits hard.'});
sk('hundred',{disc:'mon',tier:3,n:'Hundred Fists',mp:20,ap:3,range:1,tgt:'enemy',mult:.7,hits:7,crit:8,need:{end:18},d:'A blur of seven strikes. Each rolls to hit and crit on its own.'});
sk('zen',{disc:'mon',tier:3,n:'Perfect Zen',mp:14,ap:2,range:0,tgt:'self',healPct:.55,mpGain:.4,guard:{n:2,taken:.6,taunt:false},need:{end:18,cha:8},d:'Total stillness. Recovers 55% of max health and 40% of max mana, and takes 40% less damage for 2 rounds.'});
sk('avatar',{disc:'mon',tier:4,n:'Avatar of Stillness',mp:28,ap:4,range:0,tgt:'party',healPct:.3,buff:{n:4,dmg:.6,def:.6,taunt:false,crit:20},need:{end:26},d:'Both heroes heal 30% and, for 4 rounds, deal 60% more damage, take 60% less and gain +20% crit.'});

TGH.DISC={war:{n:'Warrior',stat:'str',col:'#d9534f',blurb:'Heavy armor and big hits. Fights up close (reach 1). Grows with Strength.'},
  arc:{n:'Archer',stat:'agi',col:'#5cb85c',blurb:'Longest reach of anyone. Bow reach grows with Perception. Grows with Agility.'},
  mag:{n:'Mage',stat:'int',col:'#6d6bdc',blurb:'Elemental spells, healing and curses at medium reach. Grows with Intelligence.'},
  mon:{n:'Monk',stat:'end',col:'#e0a43a',blurb:'Bare hands and iron discipline. Fights up close and heals itself. Grows with Endurance.'}};

TGH.skillLvl=k=>TGH.TIERS[k.tier].lvl;
TGH.skillReqText=k=>Object.entries(k.need).map(([s,v])=>TGH.STATN[s]+' '+v).join(', ')+(TGH.skillLvl(k)>1?`, level ${TGH.skillLvl(k)}`:'');
TGH.canLearn=(h,id)=>{const k=S[id];return !h.skills.includes(id)&&Object.entries(k.need).every(([s,v])=>h.stats[s]>=v)&&h.level>=TGH.skillLvl(k)};
TGH.skillRange=(h,k)=>k.range==='bow'?TGH.rangeBow(h):k.range==='mage'?TGH.rangeMage(h):k.range;

/* ---------- weapons: no classes, only what you carry and how you are built ---------- */
TGH.FAM={
  sword:{n:'Sword',stat:'str',range:1,disc:'war',el:'physical',ap:1,mult:1,acc:95},
  bow:{n:'Bow',stat:'agi',range:'bow',disc:'arc',el:'physical',ap:1,mult:1,acc:88},
  staff:{n:'Staff',stat:'int',range:'mage',disc:'mag',el:'attune',ap:1,mult:.9,acc:100},
  fist:{n:'Knuckles',stat:'end',range:1,disc:'mon',el:'physical',ap:1,mult:1,acc:97},
  bare:{n:'Bare hands',stat:'end',range:1,disc:'mon',el:'physical',ap:1,mult:.8,acc:95}
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
/* ---------- lengths and elemental lands ----------
   An adventure is a LENGTH (how big and how hard) in a LAND (which element, monsters and guardian). The cave and the Dark Side are single places. */
TGH.LENGTHS={
  cave:{n:'The Cave',w:12,h:16,diff:0,mult:1,packs:5,elites:1,camps:2,qs:3,chests:2,feel:'A short crawl near home.'},
  wilds:{n:'The Wilds',w:12,h:22,diff:.5,mult:1.3,packs:9,elites:2,camps:3,qs:4,chests:3,feel:'Days out past the last farms and the last roads.'},
  wasteland:{n:'The Wasteland',w:12,h:30,diff:1,mult:1.7,packs:15,elites:4,camps:4,qs:5,chests:4,feel:'A long haul across hard, empty ground.'},
  summit:{n:'The Summit',w:12,h:44,diff:1.5,mult:2.3,packs:22,elites:6,camps:6,qs:7,chests:6,feel:'The climb to the highest point in the land, where everyone can sense a dark force waiting.'},
  dark:{n:'The Dark Side',w:12,h:54,diff:2,mult:3,packs:26,elites:7,camps:6,qs:5,chests:5,feel:'There is no sky here. This is where the darkness took her.'},
};
TGH.LAND_PICK=['tundra','island','sky','forest','badlands'];
TGH.LANDS={
  cave:{name:'The Cave',el:'physical',hazard:'water',block:['boulder','boulder','mountain'],sky:'#1b1626',fog:'#120f1a',floor:['#7c7488','#6f6780'],edge:'#4a4358',
    mons:[['Cave Wolf','beast'],['Gloom Slime','slime'],['Cave Wraith','wraith'],['Rock Brute','brute'],['Cave Bat','bat'],['Burrow Spider','spider'],['Pit Serpent','serpent'],['Restless Dead','skeleton']],
    flavor:'A short crawl through the caves near home, where something big has made its den.',boss:'cave'},
  tundra:{name:'Frozen Tundra',el:'ice',hazard:'water',block:['mountain','mountain','boulder'],sky:'#12202e',fog:'#0c1620',floor:['#cfe0ec','#bdd2e2'],edge:'#6f8aa0',
    mons:[['Frost Wolf','beast'],['Rime Slime','slime'],['Ice Wraith','wraith'],['Glacier Brute','brute'],['Rime Bat','bat'],['Snow Weaver','spider'],['Ice Serpent','serpent'],['Frozen Dead','skeleton']],
    flavor:'Snow bites at exposed skin. Something howls beyond the drifts.',boss:'The Pale Jarl'},
  island:{name:'Ember Isles',el:'fire',hazard:'lava',block:['boulder','mountain'],sky:'#2a1410',fog:'#1a0c0a',floor:['#8a5a44','#7c4f3c'],edge:'#4a2418',
    mons:[['Cinder Hound','beast'],['Magma Ooze','slime'],['Flame Wisp','wraith'],['Obsidian Brute','brute'],['Cinder Bat','bat'],['Lava Crawler','spider'],['Magma Wyrm','serpent'],['Charred Bones','skeleton']],
    flavor:'Black sand, hot underfoot. The sea hisses where lava meets it.',boss:'Mother of Ash'},
  sky:{name:'Storm Spires',el:'thunder',hazard:'void',block:['mountain','boulder'],sky:'#10121f',fog:'#0a0c18',floor:['#6a6a88','#5e5e7c'],edge:'#3a3a5e',
    mons:[['Static Hound','beast'],['Volt Jelly','slime'],['Thunder Harpy','wraith'],['Stormbound Golem','brute'],['Storm Bat','bat'],['Sky Weaver','spider'],['Cloud Serpent','serpent'],['Lightning-Struck Dead','skeleton']],
    flavor:'Stone bridges between floating crags. The air tastes of copper.',boss:'The Tempest Crown'},
  forest:{name:'Rotwood',el:'grass',hazard:'water',block:['boulder','tree','mountain'],sky:'#16241a',fog:'#0d160f',floor:['#6e8a54','#627c4a'],edge:'#3c4f2e',
    mons:[['Thornback','beast'],['Moss Slime','slime'],['Spore Wisp','wraith'],['Bark Brute','brute'],['Rot Bat','bat'],['Web Mother','spider'],['Vine Serpent','serpent'],['Rooted Dead','skeleton']],
    flavor:'The trees lean in close. Spores drift in the dark like snow.',boss:'The Rotting Oak'},
  badlands:{name:'Bone Badlands',el:'fighting',hazard:'water',block:['boulder','mountain'],sky:'#1c140e',fog:'#120c08',floor:['#a07850','#946c46'],edge:'#5a3a24',
    mons:[['Scav Jackal','beast'],['Grit Slime','slime'],['Dust Shade','wraith'],['Bandit Brute','brute'],['Carrion Bat','bat'],['Sand Stalker','spider'],['Dune Serpent','serpent'],['Bandit Bones','skeleton']],
    flavor:'Cracked earth and bleached ribs. Bandit fires smoke on the ridges.',boss:'Warlord Vask'},
  abyss:{name:'The Abyss',el:'dark',hazard:'void',block:['mountain','boulder'],sky:'#07040c',fog:'#05030a',floor:['#3a2f50','#30284a'],edge:'#1a1230',
    mons:[['Gloom Hound','beast'],['Void Ooze','slime'],['Hollow Shade','wraith'],['Abyssal Knight','brute'],['Shade Bat','bat'],['Void Weaver','spider'],['Abyssal Eel','serpent'],['Unlit Dead','skeleton']],
    flavor:'There is no sky here. This is where the darkness took her.',boss:'The Unlit King'},
};
TGH.biomeKey=(len,land)=>len==='cave'||len==='dark'?len:len+':'+(land||'forest');
TGH.BIOMES={};
for(const len of Object.keys(TGH.LENGTHS)){
  const L=TGH.LENGTHS[len],lands=len==='cave'?['cave']:len==='dark'?['abyss']:TGH.LAND_PICK;
  for(const land of lands){
    const LD=TGH.LANDS[land],key=TGH.biomeKey(len,land);
    TGH.BIOMES[key]=Object.assign({},LD,{len,land,key,name:len==='cave'||len==='dark'?L.n:L.n+': '+LD.name,w:L.w,h:L.h,diff:L.diff,mult:L.mult,packs:L.packs,elites:L.elites,camps:L.camps,qs:L.qs,chests:L.chests,mats:0,mat:[],
      boss:len==='summit'?'The Gatekeeper':LD.boss});
  }
}
TGH.ADVENTURES=['cave','wilds','wasteland','summit','dark'];
TGH.ADV_REQ={cave:null,wilds:'cave',wasteland:'wilds',summit:'wasteland',dark:'summit'};
TGH.CAVE_BEASTS={
  'The Cave Bear':{kind:'beast',hp:3.2,atk:1.1,mv:2,color:'#6a4a30',eye:'#ffcf5a',blurb:'Slow and enormous. It grows more furious as the fight drags on.',rage:true,rule:'relentless'},
  'The Giant Boar':{kind:'beast',hp:2.6,atk:1.25,mv:3,color:'#5a4436',eye:'#ff4a3a',blurb:'Paws the ground, then charges across the field for huge damage.',charge:true,rule:'charger'},
  'The Night Panther':{kind:'beast',hp:1.7,atk:1.1,mv:5,color:'#2a2632',eye:'#9cff5a',blurb:'The fastest thing in the caves. Acts three times for each of yours.',fast:true,rule:'hunter'},
};
TGH.BOSSES={
  'The Rotting Oak':{kind:'brute',hp:4.2,atk:1.2,mv:1,range:2,color:'#4d6b2e',eye:'#ffb02e',blurb:'A tree that remembers walking. Its roots reach two hexes.',rule:'ward'},
  'Mother of Ash':{kind:'serpent',hp:4.6,atk:1.3,mv:2,range:3,color:'#4a1c14',eye:'#ffd34a',blurb:'Born in the ember. Spits fire three hexes.',rule:'ward'},
  'The Pale Jarl':{kind:'brute',hp:4.4,atk:1.2,mv:1,range:2,color:'#8fb4d0',eye:'#e8faff',blurb:'A frost-crowned warlord. His cold grows with every turn of the fight.',rule:'relentless'},
  'The Tempest Crown':{kind:'wraith',hp:4.2,atk:1.3,mv:3,range:4,color:'#d9c84a',eye:'#fff7a0',blurb:'A storm given a crown. It strikes from afar and runs down whoever is weakest.',rule:'hunter'},
  'Warlord Vask':{kind:'brute',hp:4.6,atk:1.25,mv:2,range:1,color:'#7a4a2a',eye:'#ff5a3a',blurb:'The bandit king of the badlands. He whistles up his raiders in the middle of the fight.',rule:'summoner'},
  'The Gatekeeper':{kind:'wraith',hp:5.2,atk:1.35,mv:2,range:4,color:'#5a6a8a',eye:'#9fd6ff',blurb:'It stands at the top of the world. A first, veiled look at what waits beyond.',rule:'charger'},
  'The Unlit King':{kind:'brute',hp:7,atk:1.5,mv:2,range:3,color:'#1c1230',eye:'#ff3a5a',blurb:'He has found you. There is no other path. Your sister is behind him.',rule:'summoner'},
};
/* Blessings: after an elite falls the party picks one of three. They last for the rest of the run and work on both heroes. Some carry a cost. */
TGH.BLESS_MAX=3;
TGH.BLESSINGS={
  edge:{n:'Moon\u2019s Edge',m:{power:10},d:'+10% damage.'},
  vow:{n:'Iron Vow',m:{hpPct:15},d:'+15% max health.'},
  eye:{n:'Hunter\u2019s Eye',m:{crit:6,critdmg:15},d:'+6% crit chance, +15% crit damage.'},
  grace:{n:'Fleet Grace',m:{eva:8},d:'+8% evasion.'},
  thirst:{n:'Crimson Thirst',m:{lifesteal:6},d:'Heal for 6% of damage dealt.'},
  steady:{n:'Steady Breath',m:{fatMul:-.5},d:'Fatigue builds 50% slower.'},
  glass:{n:'Glass Oath',m:{power:22,hpPct:-15},d:'+22% damage, but -15% max health.',cost:1},
  greed:{n:'Magpie\u2019s Bargain',m:{goldMul:.3,foeAtk:.1},d:'+30% gold from this trip, but enemies hit 10% harder.',cost:1},
};
/* Land modifiers: each land carries a twist for the current trip. Heroes read them on the gate. */
TGH.LAND_MOD={
  fog:{n:'Thick Fog',bad:1,d:'Heroes see 1 hex less far, so scouting matters.',sight:-1},
  bloodmoon:{n:'Blood Moon',bad:1,d:'Enemies deal 20% more damage.',foeAtk:.2},
  hardened:{n:'Hardened Beasts',bad:1,d:'Enemies have 20% more health.',foeHp:.2},
  warded:{n:'Warding Winds',bad:1,d:'Enemies resist every element 15% more.',foeRes:15},
  lean:{n:'Lean Pickings',bad:1,d:'25% less gold from this trip.',goldMul:-.25},
  bounty:{n:'Bountiful Road',d:'25% more gold from this trip.',goldMul:.25},
  blessed:{n:'Blessed Moon',d:'+15% experience from fights.',xpMul:.15},
  calm:{n:'Calm Air',d:'Fatigue builds 40% slower.',fatMul:-.4},
};
// Every boss has one rule to learn. It shows on the boss's card and in the Bestiary.
TGH.BOSS_RULE={
  ward:{n:'Ward',d:'Takes 50% less damage until hit by its weak element (or stunned). Then it is exposed for 2 of its turns, taking 25% more, before the ward reforms.'},
  charger:{n:'Charger',d:'Spends a turn gathering power, then rushes or unleashes a crushing blow. A stun cancels it.'},
  relentless:{n:'Relentless',d:'Grows angrier every turn of the fight. Finish it quickly, or stun it to buy time.'},
  summoner:{n:'Summoner',d:'Calls a new minion from the dark every 3 rounds, up to a crowd of five.'},
  hunter:{n:'Hunter',d:'Acts three times for each of yours and always goes for the weakest hero. Guard, and keep your weak hero near the strong one.'},
};
TGH.MUTATIONS={
  regen:{n:'Regenerating',d:'heals 8% each turn'},frenzy:{n:'Frenzied',d:'+35% attack'},
  warded:{n:'Warded',d:'+25% armor'},colossal:{n:'Colossal',d:'+60% health'},thorns:{n:'Thorned',d:'reflects 10% damage taken'}
};


/* ---------- every monster has its own colours and features, so no two look alike ---------- */
// name: [main, dark, accent, eye, scale, [features]]
TGH.MONLOOK={};
const ml=(name,main,dark,acc,eye,sc,ft)=>{TGH.MONLOOK[name]={main,dark,acc,eye,sc,ft}};
ml('Cave Wolf','#8a7f92','#4a4358','#c9b08a','#ffcf5a',1,['fangs']);
ml('Gloom Slime','#6a5a8a','#3a2a5a','#b89aff','#e8d8ff',1,['bubbles']);
ml('Cave Wraith','#5a6a7a','#2a3040','#8ad0ff','#8ad0ff',1,['tendrils']);
ml('Rock Brute','#7a7468','#4a443c','#c0b090','#ffb04a',1.1,['plates','tusks']);
ml('Cave Bat','#4a3e5a','#2a2238','#c090ff','#ff6a8a',.9,['fangs']);
ml('Burrow Spider','#6a5a44','#3a2e22','#d8b070','#ffd34a',1,['stinger','eye3']);
ml('Pit Serpent','#5a6a4a','#2e3a26','#c0d090','#ffe06a',1,['frill','fangs']);
ml('Restless Dead','#e8e0cc','#9a8a7a','#7affb0','#7affb0',1,['rags']);
ml('Thornback','#5a7a3a','#2e4a22','#b8e070','#ff9a4a',1,['spikes','tusks']);
ml('Moss Slime','#5a8a3a','#2e5a22','#c8f080','#fff0a0',1,['moss']);
ml('Spore Wisp','#8ab060','#4a6a3a','#e0ff80','#ffee66',1,['glow','tendrils']);
ml('Bark Brute','#7a5a3a','#4a3422','#6ab050','#ffcf4a',1.15,['moss','horns']);
ml('Rot Bat','#6a7a4a','#3a4a2a','#a0d050','#d8ff60',.9,['glow']);
ml('Web Mother','#4a5a3a','#222c1a','#c8e090','#ff6a6a',1.25,['eye3','stinger']);
ml('Vine Serpent','#3a8a4a','#1e5a2a','#a0f080','#ffe06a',1,['vines','frill']);
ml('Rooted Dead','#cfc8a0','#8a8460','#9aff6a','#9aff6a',1,['moss','vines']);
ml('Cinder Hound','#8a3a2a','#4a1a14','#ff8a3a','#ffcf4a',1,['flame','fangs']);
ml('Magma Ooze','#d8602a','#7a2a14','#ffd04a','#fff2a0',1,['cracks','bubbles']);
ml('Flame Wisp','#e8802a','#a03a14','#fff08a','#fff8c0',1,['flame','halo']);
ml('Obsidian Brute','#2a2430','#14101a','#ff6a2a','#ff7a2a',1.2,['plates','cracks','horns']);
ml('Cinder Bat','#5a2a20','#2a1410','#ff8a3a','#ffcf4a',.9,['flame']);
ml('Lava Crawler','#6a2a1a','#2a1008','#ff9a2a','#ffe04a',1,['cracks','stinger']);
ml('Magma Wyrm','#a03a1a','#5a1c0e','#ffb04a','#fff04a',1.2,['spikes','cracks','frill']);
ml('Charred Bones','#5a5048','#2a2420','#ff7a2a','#ff7a2a',1,['cracks','helm']);
ml('Frost Wolf','#c8dce8','#7a9ab0','#8fd0ea','#aaf0ff',1,['shards','fangs']);
ml('Rime Slime','#9ad8f0','#5a9ac0','#e8faff','#ffffff',1,['shards','bubbles']);
ml('Ice Wraith','#b8d8f0','#5a7a98','#e8faff','#8ae0ff',1,['icicles','tendrils','crown']);
ml('Glacier Brute','#a8c8e0','#5a7a98','#e8faff','#8ad8ff',1.25,['shards','plates']);
ml('Rime Bat','#b8d0e8','#6a88a8','#e8faff','#9ae8ff',.9,['icicles']);
ml('Snow Weaver','#e0ecf4','#8aa0b8','#8fd0ea','#7ad8ff',1.1,['eye3','icicles']);
ml('Ice Serpent','#8ad0e8','#3a7a9a','#e8faff','#c8f8ff',1,['frill','shards']);
ml('Frozen Dead','#d8ecf8','#8aa8c0','#6ae0ff','#6ae0ff',1,['icicles','helm']);
ml('Static Hound','#c8c04a','#6a6420','#fff07a','#fffadc',1,['shards','fangs']);
ml('Volt Jelly','#d8e870','#7a8a30','#fffbb0','#ffffff',1,['bubbles','shards']);
ml('Thunder Harpy','#a8a8d8','#4a4a78','#fff07a','#fff07a',1,['tendrils','crown']);
ml('Stormbound Golem','#8a8aa8','#3e3e58','#fff07a','#ffee66',1.25,['plates','shards']);
ml('Storm Bat','#6a6a98','#34345a','#fff07a','#fff07a',.9,['fangs','shards']);
ml('Sky Weaver','#b8b8d8','#5a5a80','#fff07a','#fff07a',1.1,['eye3','shards']);
ml('Cloud Serpent','#c8d0e8','#6a7298','#fff07a','#fff8b0',1,['frill','shards']);
ml('Lightning-Struck Dead','#d8d8c0','#8a8a70','#fff07a','#fff07a',1,['cracks','helm']);
ml('Scav Jackal','#a88a58','#5a4426','#e0c080','#ff9a3a',1,['fangs','spikes']);
ml('Grit Slime','#b8985a','#6a5428','#e8d098','#fff0c0',1,['bubbles']);
ml('Dust Shade','#a8987a','#5a4e38','#e8d098','#e8d098',1,['tendrils']);
ml('Bandit Brute','#8a5a3a','#4a2c1a','#d8a050','#ff6a3a',1.2,['plates','tusks']);
ml('Carrion Bat','#6a4a3a','#3a261c','#d88a5a','#ff5a3a',.9,['fangs']);
ml('Sand Stalker','#c0a070','#6a5230','#e8d098','#ffd34a',1.1,['stinger','eye3']);
ml('Dune Serpent','#c8a468','#6a5028','#f0d8a0','#fff06a',1,['frill','fangs']);
ml('Bandit Bones','#d8c8a0','#8a7a58','#ff9a3a','#ff9a3a',1,['helm','rags']);
ml('The Pale Jarl','#8fb4d0','#4a6a88','#e8faff','#e8faff',1,['crown','shards','plates']);
ml('The Tempest Crown','#d9c84a','#7a6c20','#fff7a0','#fff7a0',1,['crown','shards','tendrils']);
ml('Warlord Vask','#7a4a2a','#3a2010','#d8a050','#ff5a3a',1,['crown','plates','tusks']);
ml('Gloom Hound','#2a2038','#120c1c','#9b70dc','#ff6adf',1,['glow','fangs','eye3']);
ml('Void Ooze','#2a1a4a','#100820','#b070ff','#ff6adf',1,['bubbles','glow']);
ml('Hollow Shade','#1c1430','#0a0614','#9b70dc','#ff6adf',1,['tendrils','halo']);
ml('Abyssal Knight','#2a2244','#12091e','#9b70dc','#ff3a5a',1.25,['plates','horns','helm']);
ml('Shade Bat','#241a3a','#0e0818','#b070ff','#ff6adf',.9,['glow','fangs']);
ml('Void Weaver','#1a1230','#080414','#b070ff','#ff6adf',1.1,['eye3','stinger','glow']);
ml('Abyssal Eel','#1c2a4a','#0a1228','#7ac0ff','#7affff',1,['frill','glow','fangs']);
ml('Unlit Dead','#a89cc0','#5a4a78','#ff6adf','#ff6adf',1,['rags','halo']);
ml('The Cave Bear','#6a4a30','#3a2616','#c0a070','#ffcf5a',1,['tusks','spikes']);
ml('The Giant Boar','#5a4436','#2e2018','#c8b090','#ff4a3a',1,['tusks','plates']);
ml('The Night Panther','#2a2632','#100c16','#9cff5a','#9cff5a',1,['fangs','glow']);
ml('The Rotting Oak','#4d6b2e','#2a3e18','#ffb02e','#ffb02e',1,['moss','horns','vines']);
ml('Mother of Ash','#4a1c14','#200a08','#ff8a3a','#ffd34a',1,['flame','spikes','frill']);
ml('The Gatekeeper','#5a6a8a','#2a3248','#e8faff','#9fd6ff',1,['crown','icicles','tendrils']);
ml('The Unlit King','#1c1230','#080414','#9b70dc','#ff3a5a',1,['crown','plates','halo']);

/* ---------- species: every monster has its own signature ability, fighting habit and tough spots ----------
   ab: [ability, value, name]. habit: front | weak | back | fixate. res: damage the monster resists (negative = weak spot). */
TGH.SPECIES={};
const sp=(name,ab,v,habit,abName)=>{TGH.SPECIES[name]={ab,v,habit,abName}};
sp('Cave Wolf','pack',12,'weak','Pack Hunter');sp('Gloom Slime','thick',25,'front','Gloomy Shell');sp('Cave Wraith','skin',25,'back','Cold Veil');sp('Rock Brute','crusher',2.2,'front','Boulder Fist');
sp('Cave Bat','slippery',10,'back','Erratic Flutter');sp('Burrow Spider','opener',50,'weak','Ambush from Below');sp('Pit Serpent','keen',15,'fixate','Pit Fang');sp('Restless Dead','gasp',80,'front','Rattle Burst');
sp('Frost Wolf','pack',12,'weak','Pack Hunter');sp('Rime Slime','thick',25,'front','Frozen Shell');sp('Ice Wraith','skin',25,'back','Cold Veil');sp('Glacier Brute','crusher',2.2,'front','Avalanche Fist');
sp('Rime Bat','slippery',10,'back','Snowblind Flutter');sp('Snow Weaver','opener',50,'weak','Ambush from the Drifts');sp('Ice Serpent','keen',15,'fixate','Glacial Fang');sp('Frozen Dead','gasp',80,'front','Shatter');
sp('Cinder Hound','frenzy',35,'weak','Smoldering Rage');sp('Magma Ooze','spikes',15,'front','Molten Skin');sp('Flame Wisp','swift',25,'back','Flicker');sp('Obsidian Brute','thick',30,'front','Obsidian Hide');
sp('Cinder Bat','leech',30,'back','Ember Drink');sp('Lava Crawler','execute',35,'weak','Scent of Burns');sp('Magma Wyrm','crusher',2.2,'fixate','Eruption Coil');sp('Charred Bones','gasp',100,'front','Cinder Burst');
sp('Thornback','spikes',15,'front','Thornhide');sp('Moss Slime','regen',5,'front','Overgrowth');sp('Spore Wisp','leech',35,'back','Spore Feast');sp('Bark Brute','thick',25,'front','Bark Armor');
sp('Rot Bat','execute',30,'weak','Carrion Sense');sp('Web Mother','pack',15,'back','Brood Mother');sp('Vine Serpent','keen',12,'fixate','Strangling Coil');sp('Rooted Dead','regen',4,'front','Rerooting');
sp('Static Hound','frenzy',30,'weak','Static Charge');sp('Volt Jelly','spikes',18,'front','Live Wire');sp('Thunder Harpy','swift',30,'back','Gale Wings');sp('Stormbound Golem','thick',30,'front','Stormplate');
sp('Storm Bat','slippery',12,'back','Crackling Flutter');sp('Sky Weaver','opener',45,'weak','Strike from Above');sp('Cloud Serpent','keen',15,'fixate','Thunder Fang');sp('Lightning-Struck Dead','gasp',90,'front','Arc Burst');
sp('Scav Jackal','pack',14,'weak','Scavenger Pack');sp('Grit Slime','thick',22,'front','Gritty Hide');sp('Dust Shade','skin',22,'back','Dust Veil');sp('Bandit Brute','crusher',2.2,'front','Raider Swing');
sp('Carrion Bat','execute',30,'weak','Carrion Sense');sp('Sand Stalker','opener',50,'weak','Ambush from the Dunes');sp('Dune Serpent','keen',15,'fixate','Dune Fang');sp('Bandit Bones','gasp',90,'front','Rattle Burst');
sp('Gloom Hound','pack',15,'weak','Shadow Pack');sp('Void Ooze','regen',6,'front','Endless');sp('Hollow Shade','skin',30,'back','Hollow');sp('Abyssal Knight','crusher',2.3,'fixate','Oathbreaker');
sp('Shade Bat','slippery',15,'back','Shade Wing');sp('Void Weaver','execute',40,'weak','Unravel');sp('Abyssal Eel','leech',30,'fixate','Void Bite');sp('Unlit Dead','gasp',120,'front','Grave Burst');
sp('The Cave Bear','frenzy',30,'fixate','Rising Fury');sp('The Giant Boar','crusher',2.4,'fixate','Tusk Charge');sp('The Night Panther','swift',30,'weak','Three Shadows');
sp('The Rotting Oak','spikes',20,'front','Bramble Crown');sp('Mother of Ash','regen',4,'weak','Ash Rebirth');sp('The Gatekeeper','skin',20,'front','Veil of Smoke');sp('The Unlit King','pack',10,'front','Lord of the Unlit');
TGH.ABIL={
  pack:v=>`Deals ${v}% more damage for every other monster still standing beside it.`,
  frenzy:v=>`Deals ${v}% more damage once it drops below 40% health.`,
  execute:v=>`Deals ${v}% more damage to heroes below 40% health.`,
  thick:v=>`Takes ${v}% less physical damage.`,
  skin:v=>`Takes ${v}% less elemental damage (spells and elemental weapons).`,
  slippery:v=>`${v}% extra evasion: attacks miss it more often.`,
  swift:v=>`Moves one hex farther with every AP and starts the fight with a spare move.`,
  regen:v=>`Heals ${v}% of its max health at the start of each of its turns.`,
  spikes:v=>`Reflects ${v}% of the damage it takes back at the attacker (at most 25% together with a Thorned mutation).`,
  gasp:v=>`When slain, it lashes out at a random hero for ${v}% of its attack.`,
  keen:v=>`${v}% extra chance to land a critical hit.`,
  leech:v=>`Heals for ${v}% of the damage it deals.`,
  crusher:v=>`Its heavy blows hit for ${v}x damage instead of 1.6x.`,
  opener:v=>`Its first attack of each fight deals ${v}% more damage.`,
};
TGH.HABIT={front:'Attacks the nearest hero.',weak:'Hunts the hero with the lowest health.',back:'Goes after the most fragile hero (lowest max health).',fixate:'Keeps attacking the same hero once it has drawn blood.'};
TGH.HABIT_N={front:'Nearest',weak:'Weakest',back:'Fragile',fixate:'Fixated'};
// Skills monsters learn, by shape. Elites and bosses learn extra ones.
TGH.FOE_SKILLS={
  rend:{n:'Rend',d:'A tearing strike that leaves the hero bleeding for 3 turns.'},
  howl:{n:'War Howl',d:'Every monster deals 20% more damage for 3 turns.'},
  harden:{n:'Harden',d:'Takes 40% less damage until its next turn.'},
  drain:{n:'Life Leech',d:'Hits and heals itself for half the damage.'},
  sweep:{n:'Sweep',d:'Hits every hero within 2 hexes for 60% damage.'},
  curse:{n:'Wither',d:'The hero deals 25% less damage for their next 2 turns.'},
  web:{n:'Web',d:'A light hit that robs the hero of 1 AP on their next turn.'},
  ooze:{n:'Reform',d:'Heals 8% of its max health when hurt.'},
  shove:{n:'Shove',d:'A heavy shove that hurls the hero 2 hexes away.'},
  pull:{n:'Grasp',d:'Drags the hero up next to the monster.'},
  mend:{n:'Mend Kin',d:'Heals its most wounded ally for 18% of that ally’s health.'},
  rally:{n:'Rally',d:'An ally’s next attack deals 35% more damage.'},
  guard:{n:'Shield Kin',d:'An ally takes 50% less damage until this monster acts again.'},
  flurry:{n:'Flurry',d:'Two quick blows on one hero.'},
  windup:{n:'Charging',d:'Gathers power this turn. Its next move is a devastating blow.'},
  unleash:{n:'Unleash',d:'The blow it was charging: hits every hero for 1.5x damage.'},
  weary:{n:'Wearying Blow',d:'A grinding hit that adds 8-12% fatigue.'},
  relentless:{n:'Relentless',d:'Spends a turn working itself into a fury: +12% damage for the rest of the fight, up to +60%.'},
};
TGH.SHAPE_SKILLS={beast:['rend','howl'],slime:['ooze','harden'],wraith:['drain','curse','weary'],brute:['sweep','harden'],bat:['drain','rend'],spider:['web','rend'],serpent:['rend','sweep'],skeleton:['harden','weary','sweep']};
// One monster in every land works with the pack instead of fighting.
TGH.TEAM_OF={'Volt Jelly':'mend','Grit Slime':'mend','Dust Shade':'mend','Stormbound Golem':'rally','Bandit Brute':'rally','Lightning-Struck Dead':'guard','Bandit Bones':'guard','Gloom Slime':'mend','Rime Slime':'mend','Flame Wisp':'mend','Spore Wisp':'mend','Hollow Shade':'mend','Rock Brute':'rally','Glacier Brute':'rally','Cinder Hound':'rally','Bark Brute':'rally','Abyssal Knight':'rally','Restless Dead':'guard','Frozen Dead':'guard','Obsidian Brute':'guard','Rooted Dead':'guard','Unlit Dead':'guard'};
// how many skills a land teaches its monsters
TGH.BIOME_SKILLS={cave:0,wilds:1,wasteland:1,summit:2,dark:2};
// the shove/pull skill an elite or boss of each element knows
TGH.ELITE_SKILL={thunder:'shove',fighting:'pull',fire:'shove',grass:'pull',ice:'pull',physical:'shove',dark:'pull'};
// Knowledge comes in four stages
TGH.SCOUT_LV=['Not scouted','Basics','Stats & resistances','Skills','Signature ability & habit'];

/* ---------- loot ---------- */
TGH.RAR={common:{i:0,m:1,l:'Common',c:'#b9b1a3'},rare:{i:1,m:1.3,l:'Rare',c:'#5f97e3'},epic:{i:2,m:1.8,l:'Epic',c:'#b56fe3'},godlike:{i:3,m:2.5,l:'Godlike',c:'#f2a83a'}};
TGH.SLOTS=['weapon','helmet','chest','pants','ring','amulet'];
TGH.SLOTN={weapon:'Weapon',helmet:'Helmet',chest:'Chest',pants:'Pants',ring:'Ring',amulet:'Amulet'};
TGH.WNAMES={fist:['Wraps','Knuckles','Gauntlets','Iron Claws'],sword:['Longsword','Falchion','Warhammer','Cutlass'],bow:['Shortbow','Longbow','Recurve','Hunter’s Bow'],staff:['Staff','Rod','Crook','Wand']};
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
  ebrew:{n:'Energy Brew',price:45,d:'Removes 25% fatigue from one hero.',fat:25},
  scroll:{n:'Return Scroll',price:60,d:'Both heroes return home at once, keeping everything they found.',scroll:true},
};
TGH.MATS={
  stone:{n:'Stone',col:'#8a8a92',from:'physical',d:'Stone: dropped in every land. Used for the town: foundations, the Vault, the Forge and whetstones for upgrading gear.'},
  metal:{n:'Scrap Metal',col:'#c0b8a8',from:'thunder',d:'Scrap Metal: dropped in the Storm Spires. Used by the Forge and the Witch\u2019s cauldron.'},
  wood:{n:'Wood',col:'#9a6a3a',from:'grass',d:'Wood: dropped in Rotwood. Used for the Farm (fences, barns) and the Family Home.'},
  hide:{n:'Hide',col:'#b0774c',from:'fighting',d:'Hide: dropped in the Bone Badlands. Used for the Farm.'},
  crystal:{n:'Ice Crystal',col:'#8fd0ea',from:'ice',d:'Ice Crystal: dropped in the Frozen Tundra. Used by the Witch (vials, scrying glass).'},
  carbon:{n:'Carbon',col:'#5a5258',from:'fire',d:'Carbon: dropped on the Ember Isles. Used by the Witch (charcoal for her cauldron).'},
  void:{n:'Void Shard',col:'#9b70dc',from:'dark',d:'Void Shard: dropped only on the Dark Side. Used for the final upgrades.'},
};
// Each enemy drops, on its own, the material of its land (fire gives Carbon, grass gives Wood...) and sometimes one of its kind; every enemy drops a little Stone.
TGH.EL_MAT={physical:'stone',grass:'wood',fire:'carbon',ice:'crystal',dark:'void',thunder:'metal',fighting:'hide'};
TGH.KIND_MAT={};
TGH.addMat=(o,k,v)=>{o[k]=Math.round(((o[k]||0)+v)*10)/10};
TGH.rollMat=function(biome){const B=TGH.BIOMES[biome];const k=TGH.EL_MAT[B&&B.el]||'stone';return Math.random()<.4?'stone':k};

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

/* ---------- appearance: every part has its own style and its own colour ---------- */
const A=TGH.LOOKS={};
A.skin=['#fde3cf','#f8d3b4','#f0c09a','#e3a97c','#d29265','#bd7a50','#a1623c','#855033','#6a3f28','#533020','#f3d6e0','#cfe6d6','#d8e4f4','#e2d4f0'];
A.skinN=['Porcelain','Fair','Light','Warm','Honey','Tan','Bronze','Umber','Deep','Ebony','Rosy','Mint','Frost','Lilac'];
A.hairColor=['#2a1e18','#5a3a24','#8a5a34','#c8a050','#e8d28a','#d8d0c0','#f4f1ee','#8a3a20','#c8402e','#e86a8a','#d89ae0','#6a5ad8','#3a8ad8','#3ab8a0','#7a2a3a','#4a5a6a','#9ad8b0','#f0a070','#f2d048','#2a2a5a'];
A.hairColorN=['Black','Chestnut','Auburn','Honey','Blonde','Ash','Silver','Ginger','Scarlet','Rose','Orchid','Indigo','Azure','Teal','Wine','Slate','Mint','Coral','Gold','Midnight'];
A.eye=['#4a3220','#2a5a9a','#3a8a5a','#7a4aa0','#c0402e','#d8a030','#2a2a2a','#5ac8d8','#e86a8a','#8a8a96','#6a8a2a','#a05a2a','#3a3aa8','#d8d8e8'];
A.eyeN=['Brown','Blue','Green','Violet','Ruby','Amber','Night','Aqua','Pink','Silver','Olive','Copper','Sapphire','Pearl'];
A.hairStyle=['short','spiky','bob','long','ponytail','pigtails','bun','mohawk','curly','sidepart','twinbuns','wolf','braid','afro','undercut','hime'];
A.hairStyleN=['Short crop','Spiky','Bob','Long & straight','Ponytail','Pigtails','Top bun','Mohawk','Curly cloud','Side part','Twin buns','Wolf cut','Long braid','Big afro','Undercut','Princess cut'];
// face: eye shape, brows and mouth
A.eyeStyle=['round','sharp','sleepy','sparkle','cat','gentle'];
A.eyeStyleN=['Round & lashed','Sharp','Sleepy','Big sparkle','Cat eyes','Gentle'];
A.brow=['soft','straight','bold','arched','none'];
A.browN=['Soft','Straight','Bold','Arched','None'];
A.mouth=['smile','grin','calm','smirk','open'];
A.mouthN=['Little smile','Wide grin','Calm','Smirk','Cheerful'];
A.mark=['none','freckles','blush','scar','star','tears','whiskers','bandage'];
A.markN=['None','Freckles','Rosy cheeks','Scar','Star mark','Beauty mark','Whiskers','Bandage'];
// clothes
A.top=['tunic','tee','hoodie','jacket','robe','vest','dress','plate','sleeveless'];
A.topN=['Tunic','T-shirt','Hoodie','Open jacket','Long robe','Vest','Dress','Plated tunic','Sleeveless'];
A.bottom=['trousers','shorts','skirt','longskirt','leggings','wide','cargo'];
A.bottomN=['Trousers','Shorts','Short skirt','Long skirt','Leggings','Wide pants','Cargo pants'];
A.shoe=['boots','shoes','sandals','tall','bare'];
A.shoeN=['Boots','Shoes','Sandals','Tall boots','Barefoot'];
A.accessory=['none','glasses','headband','scarf','cape','hat','earring','ribbon','eyepatch','flower','bandana','goggles'];
A.accessoryN=['None','Round glasses','Headband','Scarf','Cape','Witch hat','Earring','Big ribbon','Eyepatch','Flower','Bandana','Goggles'];
A.outfit=['#8a3030','#3f6d38','#3d3c86','#c8872e','#2a6a7a','#6a3a7a','#a8485e','#4a4a56','#d8d0c0','#2a2a3a','#7a5a2a','#2e7a5e','#c8402e','#3a8ad8','#e8d28a','#e86a8a','#8a5a34','#f4f1ee','#6a5ad8','#3ab8a0'];
A.outfitN=['Crimson','Forest','Midnight','Gold','Teal','Plum','Rose','Slate','Cream','Black','Bronze','Jade','Scarlet','Azure','Sand','Pink','Leather','White','Indigo','Aqua'];
// look = {skin,hairStyle,hairColor,eye,eyeStyle,brow,mouth,mark,top,topCol,trimCol,bottom,bottomCol,shoe,shoeCol,accessory,accCol}
TGH.look=L=>{const o=L.outfit==null?0:L.outfit;const d={eyeStyle:0,brow:0,mouth:0,top:0,topCol:o,trimCol:3,bottom:0,bottomCol:(o+7)%A.outfit.length,shoe:0,shoeCol:16,accessory:0,accCol:o,mark:0};
  return Object.assign(d,L)};

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
  'Bring materials home to rebuild the town.',
];
})();

/* ---------- campfires: 3 camp points to split between activities. The hero who steps on the fire lends a stat to the matching activity (+3% per point, up to +60%). ---------- */
TGH.CAMP_PTS=3;
TGH.CAMP_ACT={
  rest:{n:'Rest',ico:'\u2764',stat:'end',d:'Every hero recovers 15% health and 15% mana.'},
  ease:{n:'Ease the aches',ico:'\u263E',stat:'agi',d:'Every hero loses 15 fatigue.'},
  plan:{n:'Plan the next fight',ico:'\u2694',stat:'str',d:'The next battle: the party deals 8% more damage.'},
  scout:{n:'Scout ahead',ico:'\u{1F441}',stat:'per',d:'Reveals the map ahead of the fire: 5 rows.'},
  drill:{n:'Drill',ico:'\u{1F4D6}',stat:'int',d:'Every hero gains experience worth about two thirds of a battle here.'},
};
TGH.campBonus=(h,k)=>Math.min(.6,(h.stats[TGH.CAMP_ACT[k].stat]||0)*.03);
