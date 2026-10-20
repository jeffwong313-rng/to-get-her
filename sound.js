/* To Get Her: sound. Every effect and every bar of music is synthesized in the browser with the Web Audio API, so there are no audio files.
   Browsers only allow sound after a tap, so the engine wakes on the first tap or key press. Settings has volume toggles. */
(function(){
'use strict';
const TGH=window.TGH=window.TGH||{};
const S=TGH.sound={sfxOn:true,musicOn:true,ctx:null,master:null,mus:null,track:null};
try{const o=JSON.parse(localStorage.getItem('to-get-her-sound')||'{}');if(o.sfxOn===false)S.sfxOn=false;if(o.musicOn===false)S.musicOn=false}catch(e){}
S.save=()=>{try{localStorage.setItem('to-get-her-sound',JSON.stringify({sfxOn:S.sfxOn,musicOn:S.musicOn}))}catch(e){}};

S.wake=function(){
  if(S.ctx){if(S.ctx.state==='suspended')S.ctx.resume();return}
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  try{S.ctx=new C();S.master=S.ctx.createGain();S.master.gain.value=.5;S.master.connect(S.ctx.destination);
    S.musicBus=S.ctx.createGain();S.musicBus.gain.value=S.musicOn?.22:0;S.musicBus.connect(S.master);
    S.sfxBus=S.ctx.createGain();S.sfxBus.gain.value=.7;S.sfxBus.connect(S.master);
    if(S.track)S.music(S.track,true)}catch(e){S.ctx=null}
};
['pointerdown','keydown','touchstart'].forEach(ev=>window.addEventListener(ev,()=>S.wake(),{passive:true}));

const tone=(f,t0,dur,type,vol,bus,slide)=>{
  const c=S.ctx,o=c.createOscillator(),g=c.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t0);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,slide),t0+dur);
  g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(vol,t0+Math.min(.02,dur/3));g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
  o.connect(g);g.connect(bus||S.sfxBus);o.start(t0);o.stop(t0+dur+.05);
};
let noiseBuf=null;
const noise=(t0,dur,vol,lo,hi)=>{
  const c=S.ctx;if(!noiseBuf){noiseBuf=c.createBuffer(1,c.sampleRate,c.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
  const s=c.createBufferSource();s.buffer=noiseBuf;s.loop=true;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=(lo+hi)/2;f.Q.value=.8;
  const g=c.createGain();g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
  s.connect(f);f.connect(g);g.connect(S.sfxBus);s.start(t0);s.stop(t0+dur+.05);
};
const FX={
  hit:t=>{noise(t,.12,.5,300,1800);tone(160,t,.12,'square',.25,null,60)},
  crit:t=>{noise(t,.18,.6,500,3000);tone(240,t,.2,'sawtooth',.3,null,80);tone(880,t+.04,.18,'triangle',.2)},
  miss:t=>{noise(t,.14,.2,1500,4000)},
  heal:t=>{[523,659,784].forEach((f,i)=>tone(f,t+i*.07,.3,'sine',.25))},
  buff:t=>{[659,988].forEach((f,i)=>tone(f,t+i*.06,.25,'triangle',.2))},
  debuff:t=>{tone(300,t,.3,'sawtooth',.18,null,120)},
  scout:t=>{[1319,1760,2093].forEach((f,i)=>tone(f,t+i*.06,.4,'sine',.22))},
  cast:t=>{tone(300,t,.4,'sine',.2,null,900);noise(t,.3,.15,2000,5000)},
  step:t=>{noise(t,.05,.12,200,900)},
  click:t=>{tone(660,t,.05,'square',.1)},
  ping:t=>{tone(880,t,.25,'sine',.2)},
  down:t=>{tone(200,t,.6,'sawtooth',.28,null,50)},
  win:t=>{[523,659,784,1047].forEach((f,i)=>tone(f,t+i*.12,.5,'triangle',.28))},
  lose:t=>{[392,330,262,196].forEach((f,i)=>tone(f,t+i*.2,.7,'sine',.28))},
  tandem:t=>{[392,523,659,784,1047].forEach((f,i)=>tone(f,t+i*.05,.4,'square',.15));noise(t,.3,.5,400,2500)},
  alert:t=>{tone(220,t,.25,'square',.2);tone(180,t+.18,.3,'square',.2)},
};
S.play=function(name){
  if(!S.sfxOn||!S.ctx||!FX[name])return;
  const now=S.ctx.currentTime;if(S._last===name&&now-S._lt<.04)return;S._last=name;S._lt=now;
  try{FX[name](now+.001)}catch(e){}
};
// floating text class -> sound
S.forFloat=function(cls,text){
  if(cls==='crit')return S.play('crit');
  if(cls==='miss')return S.play('miss');
  if(cls==='heal'||cls==='mana')return S.play('heal');
  if(cls==='buff')return S.play('buff');
  if(cls==='scout')return S.play('scout');
  if(cls==='dbf')return S.play('debuff');
  S.play('hit');
};

/* ---------- music: a slow generative loop per mood ---------- */
const SCALES={
  town:{root:196,notes:[0,2,4,7,9,12],tempo:2.4,type:'triangle',vol:.5,pad:[0,7],bass:true},
  explore:{root:146.8,notes:[0,3,5,7,10,12],tempo:3.2,type:'sine',vol:.45,pad:[0,7],bass:true},
  battle:{root:130.8,notes:[0,1,3,5,7,8],tempo:.55,type:'sawtooth',vol:.22,pad:[0,6],bass:true,drum:true},
  dark:{root:110,notes:[0,1,3,6,7,10],tempo:2.6,type:'sine',vol:.45,pad:[0,6],bass:true},
};
S.music=function(mood,force){
  if(mood===S.track&&!force)return;
  S.track=mood;
  if(!S.ctx)return;
  if(S.mus){clearInterval(S.mus);S.mus=null}
  const cfg=SCALES[mood];if(!cfg)return;
  let beat=0;
  const step=()=>{
    if(!S.musicOn||S.ctx.state!=='running')return;
    const t=S.ctx.currentTime+.05,hz=n=>cfg.root*Math.pow(2,n/12);
    if(cfg.drum){
      if(beat%2===0){tone(70,t,.18,'sine',.5,S.musicBus,35);}
      if(beat%4===2){noise(t,.08,.25,1500,5000)}
      if(beat%8===0){const n=cfg.notes[Math.floor(Math.random()*cfg.notes.length)];tone(hz(n-12),t,.5,'sawtooth',.2,S.musicBus)}
      if(beat%4===1&&Math.random()<.6){const n=cfg.notes[Math.floor(Math.random()*cfg.notes.length)];tone(hz(n),t,.3,cfg.type,.12,S.musicBus)}
    }else{
      if(beat%4===0){for(const p of cfg.pad)tone(hz(p-12),t,cfg.tempo*3.5,'sine',.18,S.musicBus)}
      if(Math.random()<.55){const n=cfg.notes[Math.floor(Math.random()*cfg.notes.length)];tone(hz(n),t,1.6,cfg.type,.2*cfg.vol,S.musicBus)}
    }
    beat++;
  };
  step();S.mus=setInterval(step,cfg.drum?cfg.tempo*250:cfg.tempo*400);
};
S.setMusic=function(on){S.musicOn=on;S.save();if(S.musicBus)S.musicBus.gain.value=on?.22:0;if(on&&S.track)S.music(S.track,true)};
S.setSfx=function(on){S.sfxOn=on;S.save()};
})();
