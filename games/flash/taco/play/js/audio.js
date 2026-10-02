/* 타코 만들기 — 소리(전부 Web Audio 합성). 가락은 직접 지은 것 */
var SND = (function () {
'use strict';
var ctx = null, sfxG, bgmG, nbuf, sndOn = 1, bgmOn = 1, musicOn = 0, tempo = 1, sizG = null, timer = null, nextT = 0, stepI = 0;
function init() {
  if (ctx) return; var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ctx = new AC(); sfxG = ctx.createGain(); sfxG.gain.value = sndOn ? 0.9 : 0; sfxG.connect(ctx.destination);
  bgmG = ctx.createGain(); bgmG.gain.value = bgmOn ? 0.42 : 0; bgmG.connect(ctx.destination);
  nbuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); var d = nbuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
function unlock() { init(); if (!ctx) return; if (ctx.state === 'suspended' && !document.hidden) ctx.resume(); if (musicOn && !timer) startMusic(); }
function tone(type, f0, f1, dur, vol, when, dest, atk) {
  if (!ctx) return; var t = ctx.currentTime + (when || 0), o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + (atk || 0.006)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || sfxG); o.start(t); o.stop(t + dur + 0.03);
}
function noise(dur, vol, ftype, f0, f1, q, when, dest) {
  if (!ctx) return; var t = ctx.currentTime + (when || 0), s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = nbuf; s.loop = true; f.type = ftype; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = q || 0.8;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(dest || sfxG); s.start(t, Math.random() * 0.8); s.stop(t + dur + 0.03);
}
function arp(notes, gap, type, vol, len) { notes.forEach(function (n, i) { tone(type || 'triangle', mf(n), 0, len || 0.22, vol || 0.2, i * gap); }); }
function mf(m) { return 440 * Math.pow(2, (m - 69) / 12); }
var SCOOP = { beef: 190, chicken: 230, shrimp: 260, lettuce: 520, cheese: 640, tomato: 380, onion: 480, cilantro: 700, avocado: 330, corn: 760, jalapeno: 430, lime: 560 };
function play(name, arg) {
  if (!ctx || !sndOn || ctx.state !== 'running') return;
  var i;
  switch (name) {
    case 'btn': tone('sine', 520, 300, 0.07, 0.25); noise(0.04, 0.2, 'lowpass', 900); break;
    case 'nope': tone('square', 170, 150, 0.07, 0.1); tone('square', 140, 120, 0.09, 0.1, 0.09); break;
    case 'slap': noise(0.09, 0.4, 'lowpass', 700, 250); tone('sine', 160, 90, 0.08, 0.25); break;
    case 'plate': noise(0.07, 0.3, 'lowpass', 1400, 500); tone('sine', 300, 180, 0.09, 0.2); break;
    case 'ding': tone('sine', 1319, 0, 0.5, 0.2); tone('sine', 1976, 0, 0.4, 0.12, 0.02); break;
    case 'burn': noise(0.5, 0.2, 'bandpass', 3000, 900, 1.2); break;
    case 'scoop': var f = SCOOP[arg] || 400; for (i = 0; i < 4; i++) { tone('sine', f * (1 + Math.random() * 0.25), f * 0.6, 0.06, 0.16, 0.24 + i * 0.03); } noise(0.12, 0.12, 'bandpass', f * 3, f * 2, 1.5, 0.22); noise(0.07, 0.1, 'highpass', 2500, 0, 0.7); break;
    case 'squirt': noise(0.42, 0.22, 'bandpass', 700, 2400, 3, 0.15); tone('sine', 300, 520, 0.4, 0.06, 0.15); break;
    case 'whoosh': noise(0.22, 0.25, 'bandpass', 2400, 600, 1.2); break;
    case 'crunch': for (i = 0; i < 3; i++) noise(0.045, 0.4, 'highpass', 1400 + Math.random() * 1500, 0, 0.6, i * 0.035); tone('square', 110, 70, 0.05, 0.08); break;
    case 'coin': tone('square', 988, 0, 0.06, 0.08); tone('square', 1319, 0, 0.14, 0.08, 0.06); break;
    case 'nice': arp([72, 76], 0.08, 'triangle', 0.22); break;
    case 'great': arp([72, 76, 79], 0.07, 'triangle', 0.22); break;
    case 'perfect': arp([72, 76, 79, 84, 88], 0.06, 'triangle', 0.24, 0.3); noise(0.4, 0.06, 'highpass', 6000, 0, 0.7, 0.2); break;
    case 'meh': tone('triangle', 330, 290, 0.18, 0.16); break;
    case 'yuck': tone('sawtooth', 220, 110, 0.35, 0.12); break;
    case 'angry': tone('sawtooth', 300, 120, 0.35, 0.16); tone('sawtooth', 200, 90, 0.3, 0.12, 0.12); break;
    case 'bell': tone('sine', 1568, 0, 0.3, 0.14); tone('sine', 2093, 0, 0.35, 0.1, 0.09); break;
    case 'ready': arp([76, 79, 84, 79, 84], 0.07, 'square', 0.09, 0.14); break;
    case 'hit': tone('sine', 130, 50, 0.14, 0.5); noise(0.12, 0.3, 'bandpass', 1800, 700, 1); break;
    case 'boom': noise(0.6, 0.5, 'lowpass', 2400, 200); tone('sine', 110, 40, 0.4, 0.5); arp([67, 72, 76, 79, 84], 0.07, 'square', 0.1, 0.25); break;
    case 'trash': noise(0.14, 0.3, 'lowpass', 900, 200); tone('sine', 120, 70, 0.12, 0.25, 0.05); break;
    case 'buy': arp([79, 84, 91], 0.06, 'square', 0.1, 0.18); noise(0.1, 0.1, 'highpass', 5000); break;
    case 'clear': arp([67, 72, 76, 79, 84, 88], 0.09, 'triangle', 0.24, 0.4); arp([55, 60], 0.27, 'sawtooth', 0.06, 0.5); break;
    case 'over': arp([67, 64, 60, 55], 0.2, 'triangle', 0.22, 0.4); break;
    case 'truck': noise(0.9, 0.12, 'lowpass', 300, 600); tone('sawtooth', 70, 110, 0.9, 0.08); tone('square', 520, 0, 0.12, 0.08, 0.2); tone('square', 520, 0, 0.2, 0.08, 0.36); break;
  }
}
function sizzle(v) {
  if (!ctx) return;
  if (!sizG) { var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(); sizG = ctx.createGain(); s.buffer = nbuf; s.loop = true; f.type = 'bandpass'; f.frequency.value = 5200; f.Q.value = 0.6; sizG.gain.value = 0; s.connect(f); f.connect(sizG); sizG.connect(sfxG); s.start(); }
  sizG.gain.setTargetAtTime(v ? 0.07 : 0, ctx.currentTime, 0.08);
}

/* ---------- 배경 가락: 마리아치 손(son) — 6/8 과 3/4 이 한 마디씩 번갈아 나오는 박(세스키알테라), G장조.
   트럼펫 두 대 3도 화음 + 꾸밈음, 기타론 베이스, 비우엘라 긁기, 마라카스, 뒷부분 바이올린 ---------- */
var CH = { G: { b: [43, 38, 47], c: [59, 62, 67, 71] }, D: { b: [38, 45, 42], c: [57, 60, 62, 66] }, C: { b: [36, 43, 40], c: [60, 64, 67, 72] } };
var BARS = ['G', 'G', 'D', 'D', 'D', 'D', 'G', 'G', 'C', 'C', 'G', 'G', 'D', 'D', 'G', 'G'];
var MEL = [
  [71, 0, 74, 79, 0, 74], [79, 0, 78, 0, 79, 0], [78, 0, 74, 81, 0, 78], [76, 0, 74, 0, 72, 0],
  [69, 0, 72, 78, 0, 74], [81, 0, 78, 0, 74, 0], [79, 0, 74, 71, 0, 74], [79, 0, 0, 0, -1, -1],
  [76, 0, 79, 84, 0, 79], [76, 0, 79, 0, 76, 0], [74, 0, 79, 83, 0, 79], [74, 0, 71, 0, 74, 0],
  [72, 74, 72, 69, 0, 66], [69, 0, 72, 0, 78, 0], [79, 0, 78, 79, 0, 74], [79, 0, 0, 74, 0, 79]
];
var GM = { 7: 1, 9: 1, 11: 1, 0: 1, 2: 1, 4: 1, 6: 1 };
function trumpet(m, t, dur, vol, grace) {
  var o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain(), fr = mf(m);
  o.type = 'sawtooth'; o2.type = 'square'; o2.detune.value = 7;
  if (grace) { o.frequency.setValueAtTime(mf(m + 2), t); o.frequency.setValueAtTime(fr, t + 0.045); o2.frequency.setValueAtTime(mf(m + 2), t); o2.frequency.setValueAtTime(fr, t + 0.045); } else { o.frequency.value = fr; o2.frequency.value = fr; }
  f.type = 'bandpass'; f.frequency.setValueAtTime(1100, t); f.frequency.linearRampToValueAtTime(2100, t + 0.03); f.Q.value = 0.9;
  l.frequency.value = 6.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(fr * 0.016, t + Math.min(dur, 0.22)); l.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol * 1.25, t + 0.012); g.gain.linearRampToValueAtTime(vol, t + 0.06); g.gain.setValueAtTime(vol * 0.85, t + Math.max(0.07, dur - 0.04)); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  var g2 = ctx.createGain(); g2.gain.value = 0.35; o.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(bgmG); o.start(t); o2.start(t); l.start(t); o.stop(t + dur + 0.02); o2.stop(t + dur + 0.02); l.stop(t + dur + 0.02);
}
function pluck(m, t, dur, vol, type) { var o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'triangle'; o.frequency.value = mf(m); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(bgmG); o.start(t); o.stop(t + dur + 0.02); }
function strum(ch, t, vol, up) { var n = ch.c; for (var i = 0; i < n.length; i++) { var k = up ? n.length - 1 - i : i; pluck(n[k] + 12, t + i * 0.011, 0.11, vol, 'triangle'); pluck(n[k], t + i * 0.011, 0.09, vol * 0.5, 'square'); } nz(t, 0.03, vol * 0.5, 3500); }
function nz(t, dur, vol, hp) { var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = nbuf; f.type = 'highpass'; f.frequency.value = hp; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(bgmG); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02); }
function violins(ch, t, dur) { ch.c.slice(1).forEach(function (m) { var o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = mf(m + 12); f.type = 'lowpass'; f.frequency.value = 1700; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.022, t + 0.12); g.gain.setValueAtTime(0.022, t + dur - 0.1); g.gain.linearRampToValueAtTime(0.0001, t + dur); o.connect(f); f.connect(g); g.connect(bgmG); o.start(t); o.stop(t + dur + 0.02); }); }
function sched() {
  if (!ctx || ctx.state !== 'running') return;
  if (nextT < ctx.currentTime) nextT = ctx.currentTime + 0.05;
  while (nextT < ctx.currentTime + 0.25) {
    var e = 0.158 / tempo, bar = Math.floor(stepI / 6) % 16, k = stepI % 6, ch = CH[BARS[bar]], t = nextT, m = MEL[bar][k], three = bar % 2 === 1;
    /* 기타론: 6/8 마디는 1·4, 3/4 마디는 1·3·5 */
    if (!three) { if (k === 0) { pluck(ch.b[0], t, 0.34, 0.34); pluck(ch.b[0] + 12, t, 0.2, 0.1); } if (k === 3) { pluck(ch.b[1] + (ch.b[1] < 40 ? 12 : 0), t, 0.3, 0.28); } }
    else if (k % 2 === 0) { pluck(ch.b[k / 2] + (k ? 12 : 0), t, 0.26, k ? 0.24 : 0.34); }
    /* 비우엘라: 6/8 은 (쉼)긁-긁 (쉼)긁-긁, 3/4 은 뒷박 */
    if (!three) { if (k === 1 || k === 4) strum(ch, t, 0.05, 0); if (k === 2 || k === 5) strum(ch, t, 0.06, 1); }
    else { if (k % 2 === 1) strum(ch, t, 0.065, k === 3); }
    nz(t, 0.045, (k === 0 || k === 3) ? 0.05 : 0.022, 7500);
    if (k === 0 && bar >= 8 && bar < 12) violins(ch, t, e * 6);
    if (m > 0) { var len = 1; while (k + len < 6 && MEL[bar][k + len] === 0 && len < 4) len++; var d = len * e * 0.9, lo = GM[(m - 3) % 12] ? m - 3 : GM[(m - 4) % 12] ? m - 4 : m - 3; trumpet(m, t, d, 0.075, len >= 2 && k === 0); trumpet(lo, t, d, 0.045, false); }
    nextT += e; stepI++;
  }
}
function startMusic() { if (!ctx || timer) return; nextT = 0; timer = setInterval(sched, 60); }
function music(v) { musicOn = v; if (v) { if (ctx && !timer) startMusic(); } else if (timer) { clearInterval(timer); timer = null; } }
return {
  unlock: unlock, play: play, sizzle: sizzle, music: music,
  fiesta: function (v) { tempo = v ? 1.2 : 1; },
  snd: function (v) { sndOn = v; if (sfxG) sfxG.gain.value = v ? 0.9 : 0; },
  bgm: function (v) { bgmOn = v; if (bgmG) bgmG.gain.value = v ? 0.42 : 0; },
  hide: function (h) { if (!ctx) return; if (h) ctx.suspend(); else ctx.resume(); }
};
})();
