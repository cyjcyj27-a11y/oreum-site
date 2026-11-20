/* 러다이트 — 소리 (모두 코드로 만든 8비트 소리) */
(function(){
var A = window.LA = {};
var ctx = null, master = null, sfxG = null, bgmG = null;
var store = {}; try { store = JSON.parse(localStorage.getItem('luddite.snd') || '{}'); } catch(e) {}
A.bgmOn = store.bgm !== false; A.sfxOn = store.sfx !== false;
function save(){ try { localStorage.setItem('luddite.snd', JSON.stringify({bgm:A.bgmOn, sfx:A.sfxOn})); } catch(e) {} }

A.init = function(){
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return; }
  master = ctx.createGain(); master.gain.value = 0.7; master.connect(ctx.destination);
  sfxG = ctx.createGain(); sfxG.gain.value = A.sfxOn ? 1 : 0; sfxG.connect(master);
  bgmG = ctx.createGain(); bgmG.gain.value = A.bgmOn ? 0.32 : 0; bgmG.connect(master);
  startBgm();
};
A.setBgm = function(on){ A.bgmOn = on; save(); if (bgmG) bgmG.gain.value = on ? 0.32 : 0; };
A.setSfx = function(on){ A.sfxOn = on; save(); if (sfxG) sfxG.gain.value = on ? 1 : 0; };

function tone(f, d, type, vol, slide, when){
  if (!ctx) return;
  var t = ctx.currentTime + (when || 0);
  var o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + d);
  g.gain.setValueAtTime(vol || 0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
  o.connect(g); g.connect(sfxG); o.start(t); o.stop(t + d + 0.02);
}
var nbuf = null;
function noise(d, vol, freq, when, q){
  if (!ctx) return;
  if (!nbuf) { nbuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); var c = nbuf.getChannelData(0); for (var i = 0; i < c.length; i++) c[i] = Math.random() * 2 - 1; }
  var t = ctx.currentTime + (when || 0);
  var s = ctx.createBufferSource(); s.buffer = nbuf;
  var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 1200; f.Q.value = q || 0.8;
  var g = ctx.createGain(); g.gain.setValueAtTime(vol || 0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
  s.connect(f); f.connect(g); g.connect(sfxG); s.start(t); s.stop(t + d + 0.02);
}
A.sfx = function(k, n){
  if (!ctx || !A.sfxOn) return;
  switch (k) {
    case 'tap': tone(520, 0.05, 'square', 0.08); noise(0.03, 0.08, 2400); break;
    case 'hit': noise(0.12, 0.5, 900); tone(140, 0.14, 'square', 0.3, 0.5); break;
    case 'perfect': noise(0.14, 0.55, 800); tone(150, 0.16, 'square', 0.35, 0.45); tone(1046, 0.12, 'square', 0.12, 1, 0.04); tone(1568, 0.16, 'square', 0.1, 1, 0.09); break;
    case 'miss': tone(220, 0.18, 'sawtooth', 0.14, 0.6); break;
    case 'nail': tone(880, 0.06, 'triangle', 0.15); tone(1320, 0.08, 'triangle', 0.1, 1, 0.05); break;
    case 'convert': [784, 988, 1175, 1568].forEach(function(f, i){ tone(f, 0.12, 'square', 0.09, 1, i * 0.05); }); break;
    case 'cheer': noise(0.8, 0.22, 1600, 0, 0.4); noise(0.6, 0.16, 700, 0.1, 0.4); break;
    case 'coin': tone(988, 0.07, 'square', 0.1); tone(1319, 0.14, 'square', 0.1, 1, 0.06); break;
    case 'buy': [523, 659, 784, 1046].forEach(function(f, i){ tone(f, 0.1, 'square', 0.1, 1, i * 0.06); }); break;
    // 포장마차: 정답은 올라가는 딩동댕, 오답은 낮은 땡 버저
    case 'right': [659, 784, 1046].forEach(function(f, i){ var d = i === 2 ? 0.45 : 0.16; tone(f, d, 'triangle', 0.32, 1, i * 0.13); tone(f * 2, d, 'sine', 0.08, 1, i * 0.13); }); noise(0.1, 0.35, 900, 0.42); break;
    case 'wrong': tone(140, 0.55, 'sawtooth', 0.26); tone(148, 0.55, 'sawtooth', 0.22); tone(70, 0.55, 'square', 0.12); tone(300, 0.3, 'sine', 0.16, 0.5, 0.6); break;
    case 'drink': tone(300, 0.3, 'sine', 0.2, 0.5); noise(0.3, 0.1, 500, 0.05); break;
    case 'win': [523, 659, 784, 1046, 784, 1046].forEach(function(f, i){ tone(f, 0.14, 'square', 0.11, 1, i * 0.09); }); break;
    case 'lose': [392, 330, 262].forEach(function(f, i){ tone(f, 0.2, 'triangle', 0.14, 1, i * 0.14); }); break;
    case 'smash': noise(0.35, 0.6, 600, 0, 0.5); tone(90, 0.3, 'sawtooth', 0.3, 0.4); tone(1800, 0.05, 'square', 0.08, 0.5, 0.05); break;
    case 'card': noise(0.06, 0.15, 3000); break;
    case 'pull': tone(180 + (n || 1) * 40, 0.05, 'triangle', 0.08, 1.15); noise(0.03, 0.05, 1800); break;
    case 'whoosh': noise(0.22, 0.35, 1400, 0, 0.7); noise(0.18, 0.2, 3200, 0.03, 0.7); tone(520, 0.12, 'sine', 0.08, 2.2); break;
    case 'combo': [659, 784, 988, 1175, 1319, 1568].slice(0, Math.min(6, (n || 2) + 1)).forEach(function(f, i){ tone(f, 0.1, 'square', 0.08, 1, i * 0.045); }); noise(0.25, 0.12, 2400, 0.05); break;
    case 'talk': tone(660 + Math.random() * 120, 0.03, 'square', 0.04); break;
    case 'siren': for (var i = 0; i < 4; i++) { tone(700, 0.2, 'square', 0.08, 1.4, i * 0.4); tone(980, 0.2, 'square', 0.08, 0.7, i * 0.4 + 0.2); } break;
  }
};

/* 배경음: 두 마디 반복 칩튠 (트로트 느낌 단조 → 장조 섞음) */
var bgmTimer = null, step = 0, mode = 0;
var SONGS = [
  { tempo: 0.15, lead: [69, 0, 72, 74, 76, 0, 74, 72, 69, 0, 67, 69, 72, 0, 0, 0, 69, 0, 72, 74, 76, 79, 76, 74, 72, 0, 74, 72, 69, 0, 0, 0],
    bass: [45, 45, 52, 52, 45, 45, 52, 52, 41, 41, 48, 48, 43, 43, 50, 50] },
  { tempo: 0.13, lead: [72, 76, 79, 76, 81, 79, 76, 72, 74, 77, 81, 77, 79, 0, 0, 0, 72, 76, 79, 84, 81, 79, 76, 79, 77, 76, 74, 71, 72, 0, 0, 0],
    bass: [48, 48, 55, 55, 53, 53, 50, 50, 48, 48, 55, 55, 43, 43, 48, 48] }
];
function midi(n){ return 440 * Math.pow(2, (n - 69) / 12); }
function btone(f, d, type, vol, t){
  var o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
  o.connect(g); g.connect(bgmG); o.start(t); o.stop(t + d + 0.02);
}
function startBgm(){
  if (bgmTimer) return;
  var next = ctx.currentTime + 0.1;
  bgmTimer = setInterval(function(){
    var s = SONGS[mode];
    while (next < ctx.currentTime + 0.3) {
      var i = step % 32, n = s.lead[i];
      if (n) btone(midi(n), s.tempo * 0.9, 'square', 0.06, next);
      if (i % 2 === 0) btone(midi(s.bass[(i / 2) % 16]), s.tempo * 1.8, 'triangle', 0.16, next);
      if (i % 4 === 2) { /* 탁 */ var b = ctx.createBufferSource(); if (!nbuf) A.sfx('tap'); if (nbuf) { b.buffer = nbuf; var f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 5000; var g = ctx.createGain(); g.gain.setValueAtTime(0.05, next); g.gain.exponentialRampToValueAtTime(0.001, next + 0.04); b.connect(f); f.connect(g); g.connect(bgmG); b.start(next); b.stop(next + 0.05); } }
      next += s.tempo; step++;
    }
  }, 60);
}
A.song = function(m){ if (mode !== m) { mode = m; step = 0; } };
})();
