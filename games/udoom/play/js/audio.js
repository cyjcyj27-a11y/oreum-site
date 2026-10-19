/* 효과음은 사인·삼각파 합성(밝기 2kHz 아래), 총소리는 낮은 쿵 + 저역 통과 잡음. 배경음은 어두운 베이스 리프. */
window.Audio3 = (function(){
let ctx=null, bus=null, sfxOn=true, bgmOn=true, bgmNode=null, noiseBuf=null;
const SMP={}; // 녹음(Pixabay) 디코드 결과
// 녹음 위에 합성음을 깔아 무게를 더하는 소리(샷건 저음, 10/17). 권총·샷건 녹음은 사장님 지시로 맞바꿔 씀(10/17)
const LAYER={shotgun:0.6};
// 10/19 사장님 "권총 소리가 너무 딱총 소리 같다": 녹음을 조금 낮게(빠르기 0.88) + 아래에 낮은 쿵(pistol 합성) + 실내 잔향(0.9초, 어둡게)을 섞어 몸통과 꼬리를 줌
const GUNFX={}; /* 10/19 사장님이 준 권총 녹음(pistol2)으로 바꾸며 권총 쿵·잔향은 뺌(녹음에 실내 울림이 있음). 다른 총에 쓸 때: 이름:{rate,wet} */
let verbIn=null;
const ALIAS={weapon:['pick',1], pistol:['pistol2',0.6] /* 10/19 사장님 녹음, 샷건보다 작게 */, shotgun:['pistol',1], zshot:['pistol',0.55], pbite:['stab',1], step:['step1',1] /* 10/19 사장님 "발소리를 1개로 통일" */, pdie:['zdie',0.9], psee:['isee',0.8], idie:['zdie',0.8], cdie:['explode',0.5], locked:['empty',1], btn:['empty',0.5]};
function loadSamples(){ if(!window.SFXDATA) return; for(const k in SFXDATA){ try{ const bin=atob(SFXDATA[k]); const buf=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) buf[i]=bin.charCodeAt(i); ctx.decodeAudioData(buf.buffer.slice(0), b=>{ SMP[k]=b; }, e=>console.warn('sfx decode',k,e)); }catch(e){} } }
function smp(name,vol,rate,wet){ const b=SMP[name]; if(!b) return false; const s=ctx.createBufferSource(); s.buffer=b; if(rate) s.playbackRate.value=rate; const g=ctx.createGain(); g.gain.value=vol; s.connect(g); g.connect(bus); if(wet&&verbIn){ const w=ctx.createGain(); w.gain.value=wet; g.connect(w); w.connect(verbIn); } s.start(); return true; }
function init(){
  if(ctx) return;
  ctx = new (window.AudioContext||window.webkitAudioContext)();
  bus = ctx.createGain(); bus.gain.value = 0.8;
  const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=4200;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value=-14; comp.ratio.value=4; comp.attack.value=0.003; comp.release.value=0.12;
  { const n=Math.floor(ctx.sampleRate*0.9), ir=ctx.createBuffer(2,n,ctx.sampleRate); for(let c=0;c<2;c++){ const d=ir.getChannelData(c); let y=0; for(let i=0;i<n;i++){ const k=i/n; y=y*0.82+(Math.random()*2-1)*0.18; d[i]=y*Math.pow(1-k,3)*(i<ctx.sampleRate*0.012?0.3:1); } }
    const cv=ctx.createConvolver(); cv.buffer=ir; const vo=ctx.createGain(); vo.gain.value=0.9; verbIn=ctx.createGain(); verbIn.connect(cv); cv.connect(vo); vo.connect(bus); } /* 권총 잔향(어두운 잡음 IR) */
  bus.connect(lp); lp.connect(comp); comp.connect(ctx.destination);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate*1.5, ctx.sampleRate);
  const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  try{ sfxOn = localStorage.getItem('udoom.snd')!=='0'; bgmOn = localStorage.getItem('udoom.bgm')!=='0'; }catch(e){}
  loadSamples();
}
function resume(){ init(); if(ctx.state==='suspended') ctx.resume(); if(bgmOn && !bgmNode) startBgm(); }
function tone(f,t,dur,type,vol,env){
  const o=ctx.createOscillator(), g=ctx.createGain(); o.type=type||'sine'; o.frequency.setValueAtTime(f,t);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+(env||0.006)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t+dur+0.02); return o;
}
function noise(t,dur,vol,fc,q,type){
  const s=ctx.createBufferSource(); s.buffer=noiseBuf; const f=ctx.createBiquadFilter(); f.type=type||'lowpass'; f.frequency.value=fc||1200; f.Q.value=q||0.7;
  const g=ctx.createGain(); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
  s.connect(f); f.connect(g); g.connect(bus); s.start(t); s.stop(t+dur+0.02);
}
function thump(t,f0,f1,dur,vol){ const o=ctx.createOscillator(), g=ctx.createGain(); o.type='sine'; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+dur*0.7);
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); o.connect(g); g.connect(bus); o.start(t); o.stop(t+dur+0.02); }
const S = {
  pistol(t){ thump(t,150,46,0.24,1.0); noise(t,0.12,0.35,900,0.7); },
  shotgun(t){ thump(t,120,40,0.32,1.1); noise(t,0.28,0.7,900,0.6); noise(t+0.05,0.2,0.3,500,0.5); },
  chain(t){ thump(t,200,70,0.1,0.6); noise(t,0.08,0.35,1700,0.8); },
  rocket(t){ thump(t,90,40,0.5,0.9); noise(t,0.5,0.6,700,0.5); },
  bfg(t){ for(let i=0;i<6;i++) tone(110+i*55,t+i*0.05,0.6,'triangle',0.25); noise(t+0.3,0.6,0.5,600,0.5); },
  swing(t){ noise(t,0.12,0.25,900,1.5,'bandpass'); },
  stab(t){ thump(t,160,80,0.12,0.5); noise(t,0.1,0.3,700,1,'bandpass'); },
  explode(t){ thump(t,80,30,0.7,1.2); noise(t,0.7,0.8,500,0.4); noise(t+0.08,0.4,0.4,1200,0.5); },
  hit(t){ noise(t,0.07,0.3,800,1,'bandpass'); },
  pain(t){ tone(220,t,0.18,'triangle',0.4); tone(170,t+0.06,0.2,'triangle',0.3); },
  die(t){ tone(160,t,0.5,'triangle',0.45); tone(110,t+0.15,0.6,'sine',0.4); thump(t+0.4,80,40,0.3,0.5); },
  pick(t){ tone(523,t,0.12,'triangle',0.3); tone(784,t+0.08,0.18,'triangle',0.3); },
  weapon(t){ [392,523,659,784].forEach((f,i)=>tone(f,t+i*0.07,0.25,'triangle',0.3)); },
  key(t){ [659,784,1046].forEach((f,i)=>tone(f,t+i*0.09,0.3,'sine',0.3)); },
  door(t){ noise(t,0.6,0.25,300,0.5); thump(t,70,50,0.5,0.4); thump(t+0.55,60,40,0.15,0.5); },
  locked(t){ tone(110,t,0.25,'triangle',0.4); tone(104,t+0.12,0.3,'triangle',0.4); },
  secret(t){ [523,659,784,1046,1318].forEach((f,i)=>tone(f,t+i*0.06,0.35,'sine',0.28)); },
  exit(t){ [330,392,494,659].forEach((f,i)=>tone(f,t+i*0.1,0.5,'triangle',0.3)); thump(t,100,50,0.4,0.5); },
  step(t){ noise(t,0.07,0.12,500,0.6); },
  zsee(t){ tone(140,t,0.3,'sawtooth',0.12); tone(120,t+0.2,0.3,'sawtooth',0.12); },
  zshot(t){ thump(t,170,60,0.14,0.6); noise(t,0.12,0.35,1400,0.8); },
  zdie(t){ tone(130,t,0.5,'sawtooth',0.14); thump(t+0.3,70,40,0.3,0.5); },
  isee(t){ tone(260,t,0.25,'sawtooth',0.1); tone(200,t+0.18,0.3,'sawtooth',0.1); },
  ifire(t){ noise(t,0.3,0.35,600,0.5); tone(180,t,0.25,'triangle',0.3); },
  idie(t){ tone(240,t,0.4,'sawtooth',0.12); tone(150,t+0.2,0.5,'sawtooth',0.1); },
  psee(t){ thump(t,120,90,0.3,0.6); thump(t+0.25,110,80,0.3,0.6); },
  pbite(t){ noise(t,0.12,0.4,700,1,'bandpass'); thump(t,150,70,0.15,0.6); },
  pdie(t){ thump(t,140,50,0.6,0.8); tone(100,t,0.6,'sawtooth',0.12); },
  csee(t){ tone(90,t,0.6,'sine',0.35); tone(95,t+0.1,0.6,'sine',0.3); },
  cfire(t){ tone(300,t,0.3,'triangle',0.3); noise(t,0.25,0.3,900,0.8,'bandpass'); },
  cdie(t){ thump(t,120,30,0.8,0.9); noise(t,0.6,0.5,400,0.5); },
  bsee(t){ thump(t,80,60,0.6,0.9); tone(70,t,0.8,'sawtooth',0.15); tone(75,t+0.3,0.8,'sawtooth',0.15); },
  bfire(t){ tone(160,t,0.35,'triangle',0.35); noise(t,0.3,0.35,700,0.6); },
  bdie(t){ thump(t,100,30,1.2,1.0); tone(60,t,1.2,'sawtooth',0.15); noise(t+0.2,0.8,0.5,400,0.5); },
  lava(t){ noise(t,0.3,0.3,400,0.5); thump(t,100,60,0.2,0.4); },
  btn(t){ tone(440,t,0.06,'triangle',0.2); },
  tally(t){ tone(880,t,0.05,'triangle',0.15); },
  hurt(t){ thump(t,200,90,0.2,0.6); tone(180,t,0.2,'triangle',0.3); },
  pdeath(t){ tone(200,t,0.6,'triangle',0.4); tone(140,t+0.2,0.8,'triangle',0.4); thump(t+0.5,80,40,0.5,0.7); }
};
function layer(f,t,a){ const old=bus; const g=ctx.createGain(); g.gain.value=a; g.connect(old); bus=g; try{ f(t); } finally { bus=old; } }
function play(name,vol,dist){ if(!ctx||!sfxOn) return; const t=ctx.currentTime+0.001;
  let a=vol==null?1:vol; if(dist!=null){ a*=Math.max(0,1-dist/26); if(a<=0) return; }
  // 녹음이 있으면 녹음으로(이름 → 별칭 → 여러 개면 무작위)
  let key=name, mul=1; const al=ALIAS[name]; if(al){ if(al.length===3&&typeof al[1]==='string') key=al[Math.floor(Math.random()*al.length)]; else { key=al[0]; mul=al[1]||1; } }
  if(SMP[key]){ const fx=GUNFX[name]; smp(key,a*mul,fx&&fx.rate,fx&&fx.wet); if(LAYER[name]&&S[name]) layer(S[name],t,a*LAYER[name]); return; }
  const f=S[name]; if(!f) return;
  if(a>=0.99){ f(t); return; }
  const old=bus; const g=ctx.createGain(); g.gain.value=a; g.connect(old); bus=g; try{ f(t); } finally { bus=old; } }
function startBgm(){
  if(!ctx||bgmNode) return;
  const g=ctx.createGain(); g.gain.value=0.0; g.connect(bus); bgmNode={g,timer:null,stop:false};
  g.gain.linearRampToValueAtTime(0.26, ctx.currentTime+2);
  const riff=[41.2,41.2,49,41.2,55,41.2,36.7,41.2, 41.2,41.2,49,43.65,55,61.7,55,49];
  let step=0; const dt=60/92/2;
  const drone=ctx.createOscillator(); drone.type='sawtooth'; drone.frequency.value=41.2; const df=ctx.createBiquadFilter(); df.type='lowpass'; df.frequency.value=160; const dg=ctx.createGain(); dg.gain.value=0.5;
  drone.connect(df); df.connect(dg); dg.connect(g); drone.start(); bgmNode.drone=drone;
  function tick(){ if(bgmNode.stop) return; const t=ctx.currentTime+0.05; const f=riff[step%riff.length];
    const o=ctx.createOscillator(); o.type='square'; o.frequency.value=f*2; const fl=ctx.createBiquadFilter(); fl.type='lowpass'; fl.frequency.setValueAtTime(900,t); fl.frequency.exponentialRampToValueAtTime(200,t+dt*0.9);
    const og=ctx.createGain(); og.gain.setValueAtTime(0.0001,t); og.gain.linearRampToValueAtTime(0.5,t+0.01); og.gain.exponentialRampToValueAtTime(0.001,t+dt*0.95);
    o.connect(fl); fl.connect(og); og.connect(g); o.start(t); o.stop(t+dt);
    if(step%4===0){ const k=ctx.createOscillator(); k.frequency.setValueAtTime(110,t); k.frequency.exponentialRampToValueAtTime(40,t+0.18); const kg=ctx.createGain(); kg.gain.setValueAtTime(0.9,t); kg.gain.exponentialRampToValueAtTime(0.001,t+0.22); k.connect(kg); kg.connect(g); k.start(t); k.stop(t+0.25); }
    if(step%8===4){ const s=ctx.createBufferSource(); s.buffer=noiseBuf; const sf=ctx.createBiquadFilter(); sf.type='bandpass'; sf.frequency.value=900; const sg=ctx.createGain(); sg.gain.setValueAtTime(0.35,t); sg.gain.exponentialRampToValueAtTime(0.001,t+0.15); s.connect(sf); sf.connect(sg); sg.connect(g); s.start(t); s.stop(t+0.2); }
    step++; bgmNode.timer=setTimeout(tick, dt*1000);
  }
  tick();
}
function stopBgm(){ if(!bgmNode) return; bgmNode.stop=true; clearTimeout(bgmNode.timer); try{bgmNode.drone.stop();}catch(e){} bgmNode.g.gain.linearRampToValueAtTime(0,ctx.currentTime+0.3); bgmNode=null; }
function setSfx(v){ sfxOn=v; try{localStorage.setItem('udoom.snd',v?'1':'0');}catch(e){} }
function setBgm(v){ bgmOn=v; try{localStorage.setItem('udoom.bgm',v?'1':'0');}catch(e){} if(v) startBgm(); else stopBgm(); }
return {init,resume,play,setSfx,setBgm,get sfxOn(){return sfxOn;},get bgmOn(){return bgmOn;},startBgm,stopBgm};
})();
