/* 치킨집 — 소리. 칼·기름·바삭 같은 물리 효과음은 녹음(js/sfx.js, 있으면), 단추·가락은 코드. 가락은 직접 지은 것 */
var SND = (function () {
'use strict';
var ctx = null, sfxG, bgmG, nbuf, sndOn = 1, bgmOn = 1, musicOn = 0, timer = null, nextT = 0, stepI = 0, fryG = null, frySrc = null, fryB = null, BUF = {}, last = {};
function init() {
  if (ctx) return; var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ctx = new AC(); sfxG = ctx.createGain(); sfxG.gain.value = sndOn ? 0.9 : 0;
  var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 5; sfxG.connect(comp); comp.connect(ctx.destination);
  bgmG = ctx.createGain(); bgmG.gain.value = bgmOn ? 0.3 : 0; bgmG.connect(ctx.destination);
  nbuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); var d = nbuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  var D = window.SFXDATA || {};
  Object.keys(D).forEach(function (k) { var bin = atob(D[k]), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); try { ctx.decodeAudioData(u.buffer, function (b) { BUF[k] = b; }, function () {}); } catch (e) {} });
}
function unlock() { init(); if (!ctx) return; if (ctx.state === 'suspended' && !document.hidden) ctx.resume(); if (musicOn && !timer) startMusic(); }
function smp(name, vol, rate, when) {
  var b = BUF[name]; if (!b) return false;
  var s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = b; s.playbackRate.value = (rate || 1) * (0.94 + Math.random() * 0.12); g.gain.value = vol == null ? 1 : vol; s.connect(g); g.connect(sfxG); s.start(ctx.currentTime + (when || 0)); return true;
}
function gate(k, ms) { var t = performance.now(); if (last[k] && t - last[k] < ms) return false; last[k] = t; return true; }
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
function mf(m) { return 440 * Math.pow(2, (m - 69) / 12); }
function arp(notes, gap, type, vol, len) { notes.forEach(function (n, i) { tone(type || 'triangle', mf(n), 0, len || 0.22, vol || 0.2, i * gap); }); }
function play(name) {
  if (!ctx || !sndOn || ctx.state !== 'running') return;
  var i;
  switch (name) {
    case 'btn': tone('sine', 520, 300, 0.07, 0.25); noise(0.04, 0.2, 'lowpass', 900); break;
    case 'nope': tone('square', 170, 150, 0.07, 0.1); tone('square', 140, 120, 0.09, 0.1, 0.09); break;
    case 'pick': noise(0.07, 0.22, 'bandpass', 1800, 700, 1.2); tone('sine', 420, 620, 0.08, 0.1); break;
    case 'plop': if (!smp('plop', 0.9)) { noise(0.12, 0.5, 'lowpass', 600, 180); tone('sine', 130, 60, 0.14, 0.4); } break;
    case 'chop': if (!gate('chop', 40)) break; if (!smp('chop', 0.9)) { noise(0.05, 0.5, 'highpass', 2600, 0, 0.7); noise(0.09, 0.5, 'lowpass', 900, 250); tone('sine', 190, 90, 0.08, 0.35); } break;
    case 'slam': if (!smp('chop', 1, 0.72)) { noise(0.06, 0.6, 'highpass', 2200, 0, 0.7); noise(0.16, 0.6, 'lowpass', 700, 150); } tone('sine', 110, 45, 0.2, 0.5); break;
    case 'plup': if (!gate('plup', 35)) break; if (!smp('plup', 0.7)) { tone('sine', 300, 120, 0.1, 0.3); noise(0.08, 0.2, 'lowpass', 800, 300); } break;
    case 'stir': if (!smp('stir', 0.45)) { noise(0.13, 0.16, 'bandpass', 500 + Math.random() * 300, 1100, 2.5); tone('sine', 180 + Math.random() * 80, 260, 0.1, 0.07); } break;
    case 'drip': noise(0.2, 0.2, 'bandpass', 900, 400, 2); tone('sine', 240, 380, 0.12, 0.1); break;
    case 'splash': if (!gate('splash', 45)) break; if (!smp('splash', 0.75)) { noise(0.45, 0.4, 'bandpass', 5200, 3000, 0.7); noise(0.12, 0.35, 'lowpass', 900, 300); } break;
    case 'lift': if (!smp('lift', 0.8)) { noise(0.5, 0.25, 'bandpass', 4200, 1600, 0.8); noise(0.1, 0.2, 'lowpass', 700, 300); } break;
    case 'box': if (!gate('box', 40)) break; if (!smp('box', 0.7)) { noise(0.06, 0.3, 'bandpass', 1500, 600, 1); tone('sine', 150, 90, 0.07, 0.2); } break;
    case 'lid': if (!smp('lid', 0.9)) { noise(0.1, 0.4, 'lowpass', 1200, 300); tone('sine', 170, 80, 0.1, 0.3, 0.03); noise(0.05, 0.25, 'bandpass', 2400, 0, 1.5, 0.09); } break;
    case 'sauce': noise(0.6, 0.2, 'bandpass', 500, 1300, 3, 0.1); tone('sine', 220, 360, 0.5, 0.06, 0.1); break;
    case 'sprinkle': for (i = 0; i < 8; i++) noise(0.03, 0.14, 'highpass', 5000 + Math.random() * 3000, 0, 0.7, i * 0.05); break;
    case 'pack': noise(0.06, 0.3, 'bandpass', 1300, 500, 1); tone('sine', 520, 300, 0.09, 0.15); break;
    case 'whoosh': noise(0.24, 0.25, 'bandpass', 2400, 600, 1.2); break;
    case 'crunch': if (!smp('crunch', 0.9)) { for (i = 0; i < 4; i++) noise(0.04, 0.45, 'highpass', 1500 + Math.random() * 1800, 0, 0.6, i * 0.032); tone('square', 110, 70, 0.05, 0.08); } break;
    case 'coin': tone('square', 988, 0, 0.06, 0.08); tone('square', 1319, 0, 0.14, 0.08, 0.06); break;
    case 'nice': arp([72, 76], 0.08, 'triangle', 0.22); break;
    case 'great': arp([72, 76, 79], 0.07, 'triangle', 0.22); break;
    case 'perfect': arp([72, 76, 79, 84, 88], 0.06, 'triangle', 0.24, 0.3); noise(0.4, 0.06, 'highpass', 6000, 0, 0.7, 0.2); break;
    case 'meh': tone('triangle', 330, 290, 0.18, 0.16); break;
    case 'yuck': tone('sawtooth', 220, 110, 0.35, 0.12); break;
    case 'angry': tone('sawtooth', 300, 120, 0.35, 0.16); tone('sawtooth', 200, 90, 0.3, 0.12, 0.12); break;
    case 'bell': tone('sine', 1568, 0, 0.3, 0.14); tone('sine', 2093, 0, 0.35, 0.1, 0.09); break;
    case 'ding': tone('sine', 1319, 0, 0.5, 0.2); tone('sine', 1976, 0, 0.4, 0.12, 0.02); break;
    case 'burn': noise(0.6, 0.2, 'bandpass', 3000, 900, 1.2); tone('square', 180, 150, 0.12, 0.08); tone('square', 180, 150, 0.12, 0.08, 0.18); break;
    case 'ready': arp([76, 79, 84, 79, 84], 0.07, 'square', 0.09, 0.14); break;
    case 'trash': noise(0.14, 0.3, 'lowpass', 900, 200); tone('sine', 120, 70, 0.12, 0.25, 0.05); break;
    case 'buy': arp([79, 84, 91], 0.06, 'square', 0.1, 0.18); noise(0.1, 0.1, 'highpass', 5000); break;
    case 'clear': arp([67, 72, 76, 79, 84, 88], 0.09, 'triangle', 0.24, 0.4); arp([55, 60], 0.27, 'sawtooth', 0.06, 0.5); break;
    case 'over': arp([67, 64, 60, 55], 0.2, 'triangle', 0.22, 0.4); break;
  }
}
/* 기름 끓는 소리: v 0~1 */
function fry(v) {
  if (!ctx) return;
  if (!fryG) {
    fryG = ctx.createGain(); fryG.gain.value = 0; fryG.connect(sfxG);
    var base = ctx.createBufferSource(), f = ctx.createBiquadFilter(); base.buffer = nbuf; base.loop = true; f.type = 'bandpass'; f.frequency.value = 5200; f.Q.value = 0.6;
    fryB = ctx.createGain(); fryB.gain.value = BUF.fry ? 0 : 0.09; base.connect(f); f.connect(fryB); fryB.connect(fryG); base.start();
  }
  if (BUF.fry && !frySrc) { frySrc = ctx.createBufferSource(); frySrc.buffer = BUF.fry; frySrc.loop = true; frySrc.loopStart = 0.08; frySrc.loopEnd = 4.08; var g = ctx.createGain(); g.gain.value = 0.7; frySrc.connect(g); g.connect(fryG); frySrc.start(); fryB.gain.value = 0; }
  fryG.gain.setTargetAtTime(v > 0 ? 0.35 + 0.65 * v : 0, ctx.currentTime, 0.12);
}

/* ---------- 배경 가락: 다장조 셔플, 오르간 가락 + 통통 튀는 베이스 ---------- */
var CH = { C: { b: [36, 43], c: [60, 64, 67] }, Am: { b: [33, 40], c: [57, 60, 64] }, F: { b: [29, 36], c: [57, 60, 65] }, G: { b: [31, 38], c: [59, 62, 67] }, Dm: { b: [38, 45], c: [57, 62, 65] } };
var BARS = ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm', 'C'];
var MEL = [
  [76, 0, 79, 76, 72, 0, 74, 76], [81, 0, 79, 76, 72, 0, 69, -1], [77, 0, 81, 77, 72, 0, 74, 77], [79, 0, 74, 79, 83, 0, 79, -1],
  [84, 0, 83, 84, 79, 0, 76, 0], [81, 0, 79, 81, 76, 0, 72, 0], [74, 77, 81, 77, 79, 83, 86, 83], [84, 0, 0, -1, 72, 72, 72, -1]
];
function organ(m, t, dur, vol) {
  var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.setValueAtTime(vol * 0.85, t + Math.max(0.02, dur - 0.04)); g.gain.linearRampToValueAtTime(0.0001, t + dur); g.connect(bgmG);
  [1, 2, 3].forEach(function (h, i) { var o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'sine'; o.frequency.value = mf(m) * h; og.gain.value = [1, 0.45, 0.2][i]; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 0.02); });
}
function pluck(m, t, dur, vol, type) { var o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'triangle'; o.frequency.value = mf(m); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(bgmG); o.start(t); o.stop(t + dur + 0.02); }
function sched() {
  if (!ctx || ctx.state !== 'running') return;
  if (nextT < ctx.currentTime) nextT = ctx.currentTime + 0.05;
  while (nextT < ctx.currentTime + 0.25) {
    var e = 0.21, bar = Math.floor(stepI / 8) % 8, k = stepI % 8, ch = CH[BARS[bar]], t = nextT + (k % 2 ? 0.035 : 0), m = MEL[bar][k];
    if (bar === 6 && k >= 4) ch = CH.G;
    if (k === 0 || k === 3) pluck(ch.b[0], t, 0.28, 0.34); if (k === 4 || k === 7) pluck(ch.b[1], t, 0.24, 0.28);
    if (k === 2 || k === 6) ch.c.forEach(function (n, i) { pluck(n, t + i * 0.006, 0.12, 0.06, 'square'); });
    var ns = ctx.createBufferSource(), nf = ctx.createBiquadFilter(), ng = ctx.createGain(); ns.buffer = nbuf; nf.type = 'highpass'; nf.frequency.value = 7000; ng.gain.setValueAtTime(k % 2 ? 0.05 : 0.022, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); ns.connect(nf); nf.connect(ng); ng.connect(bgmG); ns.start(t, Math.random() * 0.5); ns.stop(t + 0.07);
    if (k === 2 || k === 6) { var s2 = ctx.createBufferSource(), f2 = ctx.createBiquadFilter(), g2 = ctx.createGain(); s2.buffer = nbuf; f2.type = 'bandpass'; f2.frequency.value = 1800; g2.gain.setValueAtTime(0.09, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); s2.connect(f2); f2.connect(g2); g2.connect(bgmG); s2.start(t, Math.random() * 0.5); s2.stop(t + 0.11); }
    if (m > 0) { var len = 1; while (k + len < 8 && MEL[bar][k + len] === 0 && len < 4) len++; organ(m, t, len * e * 0.9, 0.075); }
    nextT += e; stepI++;
  }
}
function startMusic() { if (!ctx || timer) return; nextT = 0; timer = setInterval(sched, 60); }
function music(v) { musicOn = v; if (v) { if (ctx && !timer) startMusic(); } else if (timer) { clearInterval(timer); timer = null; } }
return {
  unlock: unlock, play: play, fry: fry, music: music, _buf: BUF,
  snd: function (v) { sndOn = v; if (sfxG) sfxG.gain.value = v ? 0.9 : 0; },
  bgm: function (v) { bgmOn = v; if (bgmG) bgmG.gain.value = v ? 0.3 : 0; },
  hide: function (h) { if (!ctx) return; if (h) ctx.suspend(); else ctx.resume(); }
};
})();
