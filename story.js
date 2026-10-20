/* To Get Her: the storybook. An eight-page tale that opens the game as a book you flip through, one spread at a time:
   a drawn picture on the left page and the words on the right. The same book can be read again from the town settings. */
(function(){
'use strict';
const TGH=window.TGH=window.TGH||{};
const A=TGH.art,U=TGH.ui;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- story beats while you play: a few lines when you arrive in a land and a clue when its guardian falls ---------- */
TGH.BEATS={
  cave:{t:'The Cave',arrive:'The cave mouth breathes out cold air that smells of wet stone and something older. Along the walls the darkness left a tide mark, a black line at head height, as if the night itself had flooded in here and drained away again. Something big has made a den deep inside. {sis} came this way. You are sure of it.',
    clueT:'Four bars of a song',clue:'Behind the beast\u2019s den, scratched into the stone at a child\u2019s height, are four bars of a song. The same four bars, over and over, never finished. {sis} was here, and she was not dragged. She stopped long enough to leave you a message. She is alive.'},
  wilds:{t:'The Wilds',arrive:'The road gives out and the Wilds take over. The trees lean the wrong way, as if something huge passed through and they are still bowing. There is no birdsong. Far ahead, very faintly, you can hear someone humming.',
    clueT:'A scrap of red wool',clue:'Caught in the roots of the fallen Oak is a thread of red wool, wound carefully around a thorn so you could not miss it. The Darkness is not carrying {sis}. She is being led, and she is leaving a trail of her own for you to follow.'},
  wasteland:{t:'The Ember Wastes',arrive:'Ash falls like snow over the Ember Wastes, and the ground ticks and glows underfoot. Lanterns from Hollow Hearth lie scattered here, burnt out, as if the Darkness gathered them up and dropped them one by one. Your lantern still burns. It is the only thing that does.',
    clueT:'Small footprints',clue:'In the glass the fire left behind there are footprints, small ones, bare and calm, walking in a straight line. Beside them walks something much taller. Whatever leads {sis} onward, she is not afraid of it. That should comfort you. It does not.'},
  summit:{t:'The Frozen Summit',arrive:'The air thins. Snow crusts over the ruins of an old watchtower, and the wind carries the hum of that same four-bar song, almost a whisper now. Every step upward feels like a promise. At the top, a door of black ice waits, and it knows your names.',
    clueT:'The Gatekeeper\u2019s last words',clue:'As the Gatekeeper fades, the veil slips and it speaks in a voice that is almost kind: \u201CShe asked for you, by name. Go on. He is not what you think he is.\u201D The black door opens onto the last road. {sis} is on the other side.'},
  dark:{t:'The Unlit Throne',arrive:'Here the dark is not an absence but a place, with walls and floors and a long hall that leads to a throne. The humming is clear now. It comes from the far end, steady and unafraid, and every lantern you carried is burning bright in your hands. This is the place the Darkness came from. This is where {sis} is.'},
};
/* ---------- the words ---------- */
// d: {a:{name,...}, b:{name,...}, rel, sis, whose}
TGH.storyPages=function(d){
  const a=d.a.name,b=d.b.name,sis=d.sis,rel=d.rel;
  const whose=d.whose===0?a:d.whose===1?b:null;
  let kin,kin2,promise;
  if(rel==='sisters'){kin=`${a} and ${b} were sisters, and ${sis} was the little one who trailed after them everywhere.`;kin2=`the two older sisters`;promise=`two sisters`}
  else if(rel==='brothers'){kin=`${a} and ${b} were brothers, and ${sis} was the little one who trailed after them everywhere.`;kin2=`the two older brothers`;promise=`two brothers`}
  else if(rel==='siblings'){kin=`${a} and ${b} were brother and sister, and ${sis} was the little one who trailed after them everywhere.`;kin2=`the two older siblings`;promise=`a brother and a sister`}
  else{kin=`${whose} had a little sister, ${sis}, and ${whose===a?b:a} had become part of the family long ago: first a friend at the table, then something more.`;kin2=`the two of them`;promise=`the two who love her`}
  const together=rel==='couple'?`${a} and ${b}`:`${a} and ${b}`;
  const her=rel==='couple'?`${whose}'s little sister`:`their little sister`;
  return [
    {t:'Hollow Hearth',s:`There was once a town in a valley where the river bends twice, and its name was Hollow Hearth. It was never grand. It had one forge, one crooked bakery, a witch who sold cures and gossip in equal measure, and a stone gate at the far end of the lane that nobody had opened in a hundred years. But every evening the lamplighter climbed the lane with his long pole, and one by one the lanterns bloomed, and the whole valley glowed gold. People said Hollow Hearth could be found from the sky by its light alone.`,art:'valley'},
    {t:'The Family',s:`${kin} ${sis} had a red scarf that her grandmother knitted, three sizes too long, and she wore it in every season. She hummed the same four bars of a song while she worked and never finished it, because she said songs were better left a little unfinished. Supper was loud. The roof leaked in one corner. Nobody in the world would have traded it. This is the family that ${kin2} would spend the rest of their lives trying to put back together.`,art:'family',portraits:true},
    {t:'Lantern Night',s:`Every autumn, on the night the moon was fullest, Hollow Hearth held Lantern Night. Every family lit a paper lantern and sent it drifting up over the rooftops, and the old people said each one carried a wish to the moon. That year ${sis} was allowed, for the first time, to light the very first lantern. She held it in both hands as if it were alive. "Next year," she announced, "I'll light all of them." Everyone laughed. The moon hung huge and silver above the valley, and for a moment there was no shadow anywhere in the world.`,art:'lanterns'},
    {t:'The Shadow',s:`It began at the edge of the moon, a nick, as if something had taken a bite. The dogs stopped barking and started to whine. The lanterns, which had been rising so cheerfully, began to sink. Then the edge of the moon went black, and then more of it, until only a thin silver rim remained, and the first thread of smoke slid off it and down toward the valley like a spider lowering itself on silk. The lamplighter dropped his pole. Somebody rang the bell in the square, once, and then did not ring it again.`,art:'eclipse'},
    {t:'The Darkness',s:`It did not roar. That was the worst of it. It simply arrived, rolling down the hills as soft and heavy as a blanket, and wherever it touched, the light went out. Lanterns, windows, the fire in the forge, even the stars. People ran, and the darkness let some of them run. It was not hunting them. It was looking for something. ${together} were far from the house that night, and by the time they understood, the valley was black from end to end and the only sound was the river.`,art:'darkness'},
    {t:'Taken',s:`They ran home with nothing but each other's hands to follow. The door of the house hung open. The table was still laid. The red scarf, three sizes too long, lay on the floor beneath the window, still warm from a neck it had left only moments before. "${sis}?" they called. "${sis}!" Nothing answered but the creak of the roof. Out on the hills, the great dark was drawing back like a tide going out, and it was drawing back toward the north, toward the mountains, toward the place the old maps left blank. It had taken ${her}.`,art:'scarf'},
    {t:'Ruins',s:`Morning came, thin and grey, and showed what was left of Hollow Hearth. The forge stood cold. The bakery had no roof. The witch sat in the wreck of her hut, stirring a pot over nothing, and when she saw ${together} she only nodded as if she had been waiting. "It took her because she is bright," she said. "The dark hungers for light, and she has more than anyone I have ever met. It carried her past the stone gate, up the old road, to the place where the moon's shadow falls. You cannot walk there as you are. You will have to grow strong. You will have to rebuild."`,art:'ruins'},
    {t:'To Get Her',s:`${together} stood at the stone gate as the first real light of the day touched it, and the gate, which no one had opened in a hundred years, groaned and swung a little on its hinges, as if it had been waiting too. The road behind it was long. The dark would be waiting at the end. But ${promise} had made a promise, and there are some promises that are stronger than any shadow. Gather stone and scrap and rebuild the town. Grow strong together. Walk into the dark, one hex at a time, and bring her home. Light the first lantern again. It is time to go and get her.`,art:'gate',portraits:true}
  ];
};

/* ---------- the pictures: drawn by hand in SVG, one for each page ---------- */
const sky=(id,top,bot)=>`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/></linearGradient>`;
const stars=(n,seed,op)=>{let s='',x=seed;const r=()=>(x=(x*9301+49297)%233280)/233280;for(let i=0;i<n;i++)s+=`<circle cx="${(r()*400).toFixed(0)}" cy="${(r()*260).toFixed(0)}" r="${(r()*1.4+.4).toFixed(1)}" fill="#fff" opacity="${(op||.8)*r().toFixed(2)}"/>`;return s};
const house=(x,y,w,h,c,lit)=>`<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/><polygon points="${x-6},${y} ${x+w/2},${y-w*.45} ${x+w+6},${y}" fill="#3a2a3a"/>${lit?`<rect x="${x+w*.3}" y="${y+h*.35}" width="${w*.22}" height="${h*.3}" fill="#ffd27a"/>`:`<rect x="${x+w*.3}" y="${y+h*.35}" width="${w*.22}" height="${h*.3}" fill="#1a1426"/>`}</g>`;
const lantern=(x,y,s,c)=>`<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="9" ry="12" fill="${c||'#ffcf6a'}"/><ellipse cx="0" cy="0" rx="16" ry="20" fill="${c||'#ffcf6a'}" opacity=".22"/><rect x="-3" y="-15" width="6" height="3" fill="#8a5a2a"/></g>`;
const ART={
  valley:()=>`<defs>${sky('s1','#2a1f4a','#e8935a')}</defs><rect width="400" height="500" fill="url(#s1)"/>${stars(40,3,.7)}
    <circle cx="300" cy="110" r="38" fill="#f6ecd2"/><circle cx="300" cy="110" r="52" fill="#f6ecd2" opacity=".14"/>
    <path d="M0 330 Q90 270 200 320 T400 300 V500 H0Z" fill="#2c2748"/><path d="M0 390 Q120 340 230 385 T400 370 V500 H0Z" fill="#1d1a34"/>
    ${house(60,345,54,40,'#4a3a58',1)}${house(150,360,46,36,'#54405a',1)}${house(240,350,58,44,'#483a58',1)}${house(320,365,40,32,'#54405a',1)}
    <path d="M10 430 Q200 380 390 440" stroke="#ffcf6a" stroke-width="2" fill="none" stroke-dasharray="2 14" stroke-linecap="round"/>
    ${[40,110,175,250,320,375].map((x,i)=>lantern(x,420-(i%2)*20+Math.sin(i)*8,.7)).join('')}
    <rect x="190" y="290" width="26" height="50" fill="#3a3550"/><polygon points="187,290 203,262 219,290" fill="#4a4568"/>`,
  family:()=>`<defs>${sky('s2','#3a2a4a','#c87a52')}<radialGradient id="g2" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#ffd8a0" stop-opacity=".9"/><stop offset="1" stop-color="#ffd8a0" stop-opacity="0"/></radialGradient></defs>
    <rect width="400" height="500" fill="url(#s2)"/><rect x="40" y="70" width="320" height="340" rx="14" fill="#6a4a3a"/><rect x="58" y="88" width="284" height="304" rx="8" fill="#f0c890"/><ellipse cx="200" cy="260" rx="170" ry="150" fill="url(#g2)"/>
    <rect x="58" y="330" width="284" height="62" fill="#8a5a3a"/><rect x="90" y="318" width="220" height="14" rx="4" fill="#b07a4a"/>
    <rect x="130" y="100" width="140" height="80" fill="#2a2646"/><circle cx="215" cy="136" r="22" fill="#f6ecd2"/>${stars(14,9,.9).replace(/cy="(\d+)"/g,(m,v)=>'cy="'+(110+v%60)+'"')}
    <path d="M58 392 H342" stroke="#5a3a28" stroke-width="6"/><circle cx="82" cy="300" r="14" fill="#c04a3a"/>`,
  lanterns:()=>`<defs>${sky('s3','#0f0d2a','#4a3a7a')}</defs><rect width="400" height="500" fill="url(#s3)"/>${stars(70,7,.9)}
    <circle cx="200" cy="140" r="86" fill="#f6ecd2"/><circle cx="200" cy="140" r="120" fill="#f6ecd2" opacity=".12"/><circle cx="170" cy="120" r="14" fill="#e4d8b6"/><circle cx="228" cy="160" r="18" fill="#e4d8b6"/><circle cx="214" cy="100" r="8" fill="#e4d8b6"/>
    ${Array.from({length:22},(_,i)=>{const x=(i*47)%380+10,y=470-((i*61)%330);return lantern(x,y,.5+((i*13)%10)/22)}).join('')}
    <path d="M0 460 Q100 430 200 455 T400 440 V500 H0Z" fill="#14122a"/>${house(40,445,40,40,'#2a2442',1)}${house(300,450,50,36,'#2a2442',1)}`,
  eclipse:()=>`<defs>${sky('s4','#05040e','#241a3a')}<radialGradient id="mg" cx=".5" cy=".5" r=".5"><stop offset=".7" stop-color="#f6ecd2"/><stop offset="1" stop-color="#f6ecd2" stop-opacity="0"/></radialGradient></defs><rect width="400" height="500" fill="url(#s4)"/>${stars(50,5,.6)}
    <circle cx="200" cy="150" r="100" fill="url(#mg)" opacity=".5"/><circle cx="200" cy="150" r="80" fill="#f6ecd2"/><circle cx="238" cy="132" r="76" fill="#05040e"/>
    <path d="M232 205 C230 260 190 280 210 330 S170 390 200 450" stroke="#0a0814" stroke-width="16" fill="none" stroke-linecap="round" opacity=".95"/><path d="M250 190 C260 250 300 270 280 330" stroke="#0a0814" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M0 440 Q100 410 200 435 T400 420 V500 H0Z" fill="#100c1e"/>${house(60,425,40,40,'#201a36',1)}${house(150,435,34,30,'#201a36',0)}${house(300,430,48,38,'#201a36',1)}`,
  darkness:()=>`<defs>${sky('s5','#050308','#1a1030')}</defs><rect width="400" height="500" fill="url(#s5)"/>
    ${[0,1,2,3,4].map(i=>`<path d="M-20 ${200+i*50} Q80 ${150+i*50} 180 ${210+i*50} T420 ${190+i*50} V520 H-20Z" fill="#0${i}0510" opacity="${.5+i*.1}"/>`).join('')}
    ${house(50,400,44,40,'#1a1428',0)}${house(150,410,38,34,'#1a1428',0)}${house(260,395,52,42,'#1a1428',0)}
    ${[[110,230],[250,200],[320,300],[80,320]].map(([x,y])=>`<g><ellipse cx="${x}" cy="${y}" rx="6" ry="4" fill="#9b70dc"/><ellipse cx="${x+22}" cy="${y}" rx="6" ry="4" fill="#9b70dc"/></g>`).join('')}
    <circle cx="200" cy="60" r="20" fill="#2a2440" opacity=".5"/>`,
  scarf:()=>`<defs>${sky('s6','#241a3a','#0a0814')}<linearGradient id="beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd8a0" stop-opacity=".6"/><stop offset="1" stop-color="#ffd8a0" stop-opacity="0"/></linearGradient></defs><rect width="400" height="500" fill="url(#s6)"/>
    <rect x="40" y="60" width="320" height="400" fill="#1a1426"/><rect x="120" y="120" width="160" height="340" fill="#2a2038"/><rect x="130" y="130" width="140" height="330" fill="#0a0814"/>
    <polygon points="130,460 20,500 20,330 130,230" fill="url(#beam)" opacity=".7"/>
    <path d="M40 470 Q120 440 180 470 T330 470" stroke="#c04a3a" stroke-width="22" fill="none" stroke-linecap="round"/><path d="M60 470 Q130 445 185 470" stroke="#e86a5a" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>
    <path d="M100 475 l-12 14 M130 478 l-8 16" stroke="#c04a3a" stroke-width="5" stroke-linecap="round"/>`,
  ruins:()=>`<defs>${sky('s7','#7a6a8a','#e8c8a0')}</defs><rect width="400" height="500" fill="url(#s7)"/>${stars(8,2,.5)}
    <circle cx="320" cy="200" r="34" fill="#fff4d8" opacity=".9"/>
    <path d="M0 360 Q120 320 240 355 T400 340 V500 H0Z" fill="#6a5a6a"/><path d="M0 420 Q150 390 300 425 T400 415 V500 H0Z" fill="#4a3e50"/>
    <g fill="#3a3048"><polygon points="40,430 40,360 70,340 100,365 100,430"/><polygon points="130,430 130,390 160,380 175,400 175,430"/><polygon points="230,430 230,350 250,335 280,350 290,430"/><rect x="320" y="380" width="44" height="50"/><polygon points="320,380 340,350 364,380"/></g>
    <rect x="52" y="395" width="16" height="22" fill="#1a1426"/><path d="M250 330 q6-24 16-14" stroke="#7a6a7a" stroke-width="4" fill="none"/>
    <path d="M160 340 q10-40 30-60 q-10 30 5 60" fill="#8a7a8a" opacity=".5"/><rect x="186" y="250" width="22" height="60" fill="#5a5068"/><polygon points="183,250 197,226 211,250" fill="#6a6078"/>`,
  gate:()=>`<defs>${sky('s8','#3a3a7a','#ffcf8a')}</defs><rect width="400" height="500" fill="url(#s8)"/>${stars(30,4,.5)}
    <circle cx="200" cy="215" r="60" fill="#fff4d8" opacity=".9"/><circle cx="200" cy="215" r="90" fill="#fff4d8" opacity=".14"/>
    <path d="M0 300 L90 220 L160 280 L230 190 L320 270 L400 230 V500 H0Z" fill="#3a3258"/><path d="M0 340 L110 280 L200 330 L290 270 L400 320 V500 H0Z" fill="#241e3e"/>
    <path d="M150 500 Q190 420 200 360 Q210 300 214 270" stroke="#e8c890" stroke-width="16" fill="none" stroke-linecap="round" opacity=".8"/>
    <g fill="#8a8a98"><rect x="120" y="360" width="22" height="90"/><rect x="258" y="360" width="22" height="90"/><path d="M110 360 Q200 296 290 360 L270 362 Q200 322 130 362Z"/></g>
    ${lantern(200,420,1.2,'#ffcf6a')}`
};
const artHtml=(page,d)=>{
  const svg=`<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" class="bart" role="img" aria-label="${esc(page.t)}">${ART[page.art]()}</svg>`;
  let ports='';
  if(page.portraits)ports=`<div class="bports"><img src="${A.portrait(d.a,150,190)}" alt="${esc(d.a.name)}"><img src="${A.portrait(d.b,150,190)}" alt="${esc(d.b.name)}"></div>`;
  return svg+ports;
};

/* ---------- the book ---------- */
// data: {a,b,rel,sis,whose}. Resolves when the reader reaches the end (or skips).
U.storybook=function(d,opt){
  opt=opt||{};
  return new Promise(resolve=>{
    const pages=TGH.storyPages(d);let i=0,busy=false;
    const m=document.createElement('div');m.className='modal bookmodal';
    const text=(p,n)=>`<div class="btext"><div class="bnum">${n+1} / ${pages.length}</div><h2>${esc(p.t)}</h2><p>${esc(p.s)}</p></div>`;
    m.innerHTML=`<div class="book"><div class="bgrid">
        <div class="pg left" id="bl"></div><div class="pg right" id="br"></div><div class="spine"></div></div>
      <div class="bctl"><button class="ghost small" id="bk-prev" aria-label="Previous page">‹ Back</button><div class="dots" id="bk-dots"></div><button class="ghost small" id="bk-skip">${opt.reread?'Close':'Skip'}</button><button class="gold" id="bk-next">Next ›</button></div></div>`;
    document.body.appendChild(m);
    const L=m.querySelector('#bl'),Rr=m.querySelector('#br'),grid=m.querySelector('.bgrid');
    const dots=m.querySelector('#bk-dots'),prev=m.querySelector('#bk-prev'),next=m.querySelector('#bk-next');
    const setDots=()=>{dots.innerHTML=pages.map((_,k)=>`<i class="${k===i?'on':k<i?'past':''}"></i>`).join('');prev.disabled=i===0;next.textContent=i===pages.length-1?(opt.reread?'The end':'Begin the journey'):'Next ›';next.classList.toggle('gold',true)};
    const show=()=>{L.innerHTML=artHtml(pages[i],d);Rr.innerHTML=text(pages[i],i);setDots()};
    show();
    const done=()=>{m.remove();resolve()};
    const flip=(dir)=>{
      if(busy)return;const j=i+dir;if(j<0||j>=pages.length)return;
      busy=true;
      const narrow=window.innerWidth<760;
      if(narrow){grid.classList.add('fadeout');setTimeout(()=>{i=j;show();grid.classList.remove('fadeout');busy=false},220);return}
      const f=document.createElement('div');f.className='flip '+(dir>0?'fwd':'bwd');
      if(dir>0){
        f.innerHTML=`<div class="face front pg right">${text(pages[i],i)}</div><div class="face back pg left">${artHtml(pages[j],d)}</div>`;
        Rr.innerHTML=text(pages[j],j);
      }else{
        f.innerHTML=`<div class="face front pg left">${artHtml(pages[i],d)}</div><div class="face back pg right">${text(pages[j],j)}</div>`;
        L.innerHTML=artHtml(pages[j],d);
      }
      grid.appendChild(f);
      void f.offsetWidth;f.classList.add('go');
      let fin=false;const end=()=>{if(fin)return;fin=true;i=j;show();f.remove();busy=false};
      f.addEventListener('transitionend',end);setTimeout(end,1100);
    };
    next.onclick=()=>{if(i===pages.length-1)done();else flip(1)};
    prev.onclick=()=>flip(-1);
    m.querySelector('#bk-skip').onclick=done;
    m._key=e=>{if(!document.body.contains(m)){document.removeEventListener('keydown',m._key);return}if(e.key==='ArrowRight'||e.key==='Enter')next.onclick();else if(e.key==='ArrowLeft')prev.onclick();else if(e.key==='Escape')done()};
    document.addEventListener('keydown',m._key);
  });
};
})();
