/* 효과음 — 전부 코드로. 밝기 2kHz 아래, 부딪힘은 낮은 북 */
(function(){
let AC = null, master = null, NOISE = null, on = true;
try{ on = localStorage.getItem('doublepark.snd') !== '0'; }catch(e){}
function ac(){
  try{
    if(!AC){ AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = on ? 0.9 : 0; master.connect(AC.destination); }
    if(AC.state === 'suspended' && !(window.OfflineAudioContext && AC instanceof OfflineAudioContext)) AC.resume();
  }catch(e){ return null; }
  return AC;
}
function noise(a){ if(NOISE) return NOISE; const n = a.sampleRate, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for(let i = 0; i < n; i++) d[i] = Math.random()*2 - 1; return NOISE = b; }
function tone(f0, f1, dur, type, vol, delay){
  const a = ac(); if(!a) return; const t = a.currentTime + (delay || 0);
  const o = a.createOscillator(), g = a.createGain(); o.type = type || 'sine';
  o.frequency.setValueAtTime(f0, t); if(f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.03);
}
function hiss(f0, f1, dur, vol, q, delay, type){
  const a = ac(); if(!a) return; const t = a.currentTime + (delay || 0);
  const s = a.createBufferSource(); s.buffer = noise(a);
  const bq = a.createBiquadFilter(); bq.type = type || 'bandpass'; bq.Q.value = q || 1;
  bq.frequency.setValueAtTime(f0, t); if(f1) bq.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(bq); bq.connect(g); g.connect(master); s.start(t, Math.random()*0.5); s.stop(t + dur + 0.03);
}

/* 배경음악 — 잔잔한 로파이 피아노(10/9). 80BPM, 8마디 화음 × 3바퀴(가락 A · 가락 B · 쉼) = 24마디 한 돌림.
   전자피아노(사인+옅은 배음) · 패드(낮은 톱니 둘, 900Hz 아래) · 베이스(삼각파). 밝기는 전부 2kHz 아래 */
const BPM = 80, BEAT = 60 / BPM, BAR = BEAT * 4;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const CHORDS = [   // [베이스, 화음]  F장조: Fmaj7 Em7 Dm7 Cmaj7 | B♭maj7 Am7 Gm7 C7sus
  [41, [57, 60, 64, 67]], [40, [55, 59, 62, 67]], [38, [57, 60, 62, 65]], [36, [55, 59, 62, 64]],
  [34, [57, 58, 62, 65]], [33, [55, 60, 64, 67]], [31, [53, 58, 62, 65]], [36, [55, 58, 62, 65]],
];
const MEL_A = [ [[0,72,1.5],[1.5,69,.5],[2,67,2]], [[0,67,1],[1,69,1],[2,74,2]], [[0,72,3]], [[1,67,.5],[1.5,69,.5],[2,72,2]],
                [[0,74,1.5],[1.5,72,.5],[2,69,2]], [[0,67,1],[1,69,1],[2,72,2]], [[0,70,1],[1,69,1],[2,67,2]], [[0,65,3]] ];
const MEL_B = [ [[0,77,2],[2,76,2]], [[0,74,3]], [[0,72,1],[1,74,1],[2,77,2]], [[0,76,4]],
                [[0,74,1.5],[1.5,77,.5],[2,74,2]], [[0,72,3]], [[0,70,1],[1,72,1],[2,74,2]], [[0,72,2],[2,67,2]] ];
let bgmGain = null, bgmTimer = 0, bgmNext = 0, bgmBar = 0, CX = null;   // CX: 배경음악을 그리는 오디오 판(실제 또는 파일 굽기용)
function voice(type, f, t, dur, vol, cut, att, out){
  const a = CX, o = a.createOscillator(), g = a.createGain(), lp = a.createBiquadFilter();
  o.type = type; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = cut; lp.Q.value = 0.3;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(lp); lp.connect(g); g.connect(out || bgmGain); o.start(t); o.stop(t + dur + 0.05); return o;
}
function ep(m, t, dur, vol){ const f = mtof(m); voice('sine', f, t, dur, vol, 1800, 0.008); voice('triangle', f*2, t, dur*0.4, vol*0.12, 1800, 0.004); }
function pad(ms, t, dur){ for(const m of ms){ const f = mtof(m - 12); for(const d of [-5, 5]){ const o = voice('sawtooth', f, t, dur, 0.011, 750, dur*0.35); o.detune.value = d; } } }
function bar(t, n){
  const k = n % 8, pass = Math.floor(n / 8) % 3, [root, ch] = CHORDS[k];
  pad(ch, t, BAR + 0.6);
  voice('triangle', mtof(root), t, BEAT*2.2, 0.09, 380, 0.02); voice('triangle', mtof(root + 7), t + BEAT*2.5, BEAT*1.3, 0.06, 380, 0.02);
  ch.forEach((m, i) => ep(m, t + i*0.018, BEAT*2.6, 0.045));                         // 손가락으로 살짝 굴려 짚기
  [[1.5, 2], [2.5, 1], [3.5, 3]].forEach(([b, i]) => ep(ch[i] + 12, t + b*BEAT, BEAT*1.4, 0.022));
  const mel = pass === 0 ? MEL_A : pass === 1 ? MEL_B : null;
  if(mel) for(const [b, m, d] of mel[k]){ const tt = t + b*BEAT; const o = voice('sine', mtof(m), tt, d*BEAT + 0.35, 0.085, 1600, 0.03); voice('triangle', mtof(m), tt, d*BEAT*.6, 0.018, 1600, 0.02);
    const l = CX.createOscillator(), lg = CX.createGain(); l.frequency.value = 4.8; lg.gain.value = 4; l.connect(lg); lg.connect(o.detune); l.start(tt + 0.15); l.stop(tt + d*BEAT + 0.4); }
}
function bgmTick(){ if(!AC) return; while(bgmNext < AC.currentTime + 0.7){ bar(bgmNext, bgmBar++); bgmNext += BAR; } }
function bgmStart(){ const a = ac(); if(!a || bgmTimer) return; CX = a; bgmGain = a.createGain(); bgmGain.gain.value = 0.8; bgmGain.connect(master);
  bgmNext = a.currentTime + 0.15; bgmBar = 0; bgmTick(); bgmTimer = setInterval(bgmTick, 150); }
// 한 돌림(24마디)을 파일로 굽기(검수용): 실제 재생 중이면 쓰지 않는다
async function bgmRender(bars){ if(bgmTimer) return null; const sr = 44100, n = bars || 24, off = new OfflineAudioContext(2, Math.ceil(sr*(n*BAR + 2)), sr);
  CX = off; bgmGain = off.createGain(); bgmGain.gain.value = 0.55; bgmGain.connect(off.destination);
  for(let i = 0; i < n; i++) bar(0.05 + i*BAR, i); const buf = await off.startRendering(); CX = null; bgmGain = null; return buf; }
document.addEventListener('visibilitychange', () => { if(!AC) return; if(document.hidden) AC.suspend(); else AC.resume(); });
const S = {
  grab:  () => { tone(140, 110, 0.08, 'square', 0.05); hiss(500, 300, 0.06, 0.08, 1.2); },
  roll:  (n) => { hiss(260, 180, 0.12 + n*0.06, 0.16, 0.8, 0, 'lowpass'); for(let i = 0; i < 2 + n; i++) tone(70, 60, 0.05, 'square', 0.04, i*0.05); },
  stop:  () => { tone(160, 60, 0.12, 'sine', 0.28); hiss(400, 200, 0.06, 0.1, 1); },
  bump:  () => { tone(110, 45, 0.18, 'sine', 0.4); tone(220, 160, 0.08, 'square', 0.04); hiss(800, 300, 0.1, 0.12, 1.5); },
  chirp: () => { tone(1200, 0, 0.07, 'square', 0.04); tone(1200, 0, 0.07, 'square', 0.04, 0.12); },
  vroom: () => { tone(60, 220, 0.9, 'sawtooth', 0.06); tone(90, 330, 0.9, 'square', 0.025); hiss(200, 900, 0.9, 0.08, 0.7, 0, 'lowpass'); },
  // 차단기 올라갈 때: F장조로 띠-리-링-링 올라가는 종소리 + 모터 윙 + 끝에 딸깍(배경음악과 같은 조, 2kHz 아래)
  gate:  () => { [698, 880, 1047, 1397].forEach((f, i) => { tone(f, 0, 0.32, 'triangle', 0.12, 0.06 + i*0.075); tone(f, 0, 0.45, 'sine', 0.08, 0.06 + i*0.075); });
                 tone(1047, 0, 0.6, 'sine', 0.055, 0.42); tone(1397, 0, 0.7, 'sine', 0.045, 0.42);
                 hiss(260, 620, 0.42, 0.05, 0.9, 0, 'lowpass'); tone(110, 150, 0.4, 'triangle', 0.05); tone(190, 120, 0.05, 'square', 0.03, 0.42); },
  win:   () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0, 0.25, 'triangle', 0.08, 0.5 + i*0.09)); },
  star:  (i) => tone(660 + i*220, 0, 0.18, 'triangle', 0.08),
  click: () => tone(440, 330, 0.05, 'square', 0.04),
  undo:  () => { tone(330, 220, 0.08, 'triangle', 0.06); },
  setOn(v){ on = v; try{ localStorage.setItem('doublepark.snd', v ? '1' : '0'); }catch(e){} if(master) master.gain.value = v ? 0.9 : 0; },
  get on(){ return on; },
  wake(){ const a = ac(); if(a) bgmStart(); return a; },
  bgmStart, bgmRender,
  // 효과음 하나를 파일로 굽기(검수용)
  async fxRender(name, sec){ const keepA = AC, keepM = master, keepN = NOISE; const off = new OfflineAudioContext(2, Math.ceil(44100*(sec || 2)), 44100);
    AC = off; NOISE = null; master = off.createGain(); master.gain.value = 0.9; master.connect(off.destination); S[name]();
    const buf = await off.startRendering(); AC = keepA; master = keepM; NOISE = keepN; return buf; },
};
window.SFX = S;
})();
