// 고시원 총무 — 소리. 닦기·물·테이프 같은 물리 효과음은 녹음(js/sfx.js, 있으면), 단추·가락은 코드. 가락은 직접 지은 것
var SND = (function () {
'use strict';
var pgI = 0, ctx = null, sfxG, bgmG, nbuf, sndOn = 1, bgmOn = 1, musicOn = 0, timer = null, nextT = 0, stepI = 0, BUF = {}, last = {}, scG = null, scSrc = null, humG = null;
function init() {
  if (ctx) return; var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ctx = new AC(); sfxG = ctx.createGain(); sfxG.gain.value = sndOn ? 0.6 : 0;
  var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 6; var soft = ctx.createBiquadFilter(); soft.type = 'highshelf'; soft.frequency.value = 3200; soft.gain.value = -9; var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000; sfxG.connect(soft); soft.connect(lp); lp.connect(comp); comp.connect(ctx.destination);   // 10/4 "효과음이 시끄럽고 날카로워": 고음을 깎고 더 눌러 준다
  bgmG = ctx.createGain(); bgmG.gain.value = bgmOn ? 0.26 : 0; bgmG.connect(ctx.destination);
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
    case 'nope': tone('triangle', 200, 170, 0.08, 0.12); tone('triangle', 160, 130, 0.1, 0.12, 0.09); break;
    case 'pick': if (!smp('pick', 0.7)) { noise(0.07, 0.22, 'bandpass', 1800, 700, 1.2); tone('sine', 420, 620, 0.08, 0.1); } break;
    case 'ding': tone('sine', 1047, 0, 0.25, 0.1); tone('sine', 1568, 0, 0.3, 0.06, 0.05); break;
    case 'trash': if (!smp('trash', 0.8)) { noise(0.22, 0.3, 'bandpass', 2600, 900, 0.8); noise(0.1, 0.25, 'lowpass', 700, 200, 0.8, 0.08); } break;
    case 'tp': if (!smp('tp', 0.38, 0.82)) { noise(0.1, 0.2, 'bandpass', 3200, 1500, 1); tone('sine', 300, 200, 0.06, 0.1, 0.06); } break;
    case 'plunge': if (!smp('plunge', 0.9)) { tone('sine', 160, 70, 0.14, 0.4); noise(0.12, 0.3, 'lowpass', 500, 150); } break;
    case 'flush': if (!smp('flush', 0.9)) { noise(1.6, 0.4, 'bandpass', 900, 300, 0.7); noise(1.2, 0.25, 'lowpass', 400, 120, 0.8, 0.3); } break;
    case 'splash': if (!smp('splash', 1)) { noise(0.7, 0.5, 'bandpass', 3000, 900, 0.7); noise(0.3, 0.4, 'lowpass', 800, 200); } break;
    case 'drain': if (!smp('drain', 0.7)) { noise(0.5, 0.2, 'bandpass', 600, 200, 3); tone('sine', 220, 90, 0.4, 0.08); } break;
    case 'clean': arp([72, 76, 79, 84], 0.07, 'triangle', 0.22, 0.3); noise(0.5, 0.05, 'highpass', 6000, 0, 0.7, 0.15); break;
    case 'glove': if (!smp('glove', 0.9)) { noise(0.12, 0.3, 'bandpass', 1400, 2600, 2); noise(0.05, 0.5, 'bandpass', 2200, 0, 1.5, 0.16); tone('sine', 260, 180, 0.05, 0.2, 0.16); } break;
    case 'lidc': if (!smp('lid', 0.8)) { noise(0.06, 0.3, 'lowpass', 1200, 300); tone('sine', 190, 110, 0.07, 0.25); } break;
    case 'beep': tone('sine', 1320, 0, 0.09, 0.07); tone('sine', 1320, 0, 0.09, 0.07, 0.16); tone('sine', 1760, 0, 0.2, 0.07, 0.32); break;
    case 'click': tone('sine', 700, 400, 0.04, 0.12); noise(0.03, 0.12, 'bandpass', 1500); break;
    case 'rice': if (!gate('rice', 110)) break; if (!smp('rice', 0.6)) noise(0.12, 0.16, 'highpass', 4200 + Math.random() * 1500, 0, 0.7); break;
    case 'water': if (!gate('water', 260)) break; if (!smp('water', 0.5)) noise(0.32, 0.12, 'bandpass', 1800 + Math.random() * 600, 0, 0.6); break;
    case 'stir': if (!gate('stir', 230)) break; if (!smp('stir', 0.45)) { noise(0.13, 0.16, 'bandpass', 500 + Math.random() * 300, 1100, 2.5); } break;
    case 'pour': if (!smp('pour', 0.8)) { noise(0.9, 0.3, 'bandpass', 1200, 500, 0.8); } break;
    case 'tape': if (!smp('tape', 0.42, 0.88)) { noise(0.34, 0.4, 'bandpass', 1800, 3600, 3); noise(0.3, 0.2, 'highpass', 4000, 0, 0.7); } break;
    case 'box': if (!smp('box', 0.55)) { noise(0.08, 0.35, 'lowpass', 500, 160); tone('sine', 120, 70, 0.1, 0.3); } break;
    case 'pack': if (!smp('pack', 0.7)) { noise(0.07, 0.25, 'bandpass', 2800, 1200, 1); tone('sine', 200, 130, 0.05, 0.15, 0.03); } break;
    case 'chop': if (!gate('chop', 40)) break; if (!smp('chop', 0.9)) { noise(0.05, 0.5, 'highpass', 2600, 0, 0.7); noise(0.09, 0.5, 'lowpass', 900, 250); tone('sine', 190, 90, 0.08, 0.35); } break;
    case 'plop': if (!smp('plop', 0.9)) { noise(0.12, 0.5, 'lowpass', 600, 180); tone('sine', 130, 60, 0.14, 0.4); } break;
    case 'lid': if (!smp('lid', 0.9)) { noise(0.1, 0.4, 'lowpass', 1200, 300); tone('sine', 170, 80, 0.1, 0.3, 0.03); } break;
    case 'fridge': if (!smp('fridge', 0.8)) { noise(0.1, 0.3, 'lowpass', 400, 120); tone('sine', 90, 55, 0.14, 0.4); } break;
    case 'dish': if (!smp('dish', 0.8)) { tone('sine', 2100, 1900, 0.12, 0.08); tone('sine', 2900, 0, 0.1, 0.06, 0.05); noise(0.2, 0.2, 'bandpass', 3000, 1200, 0.8); } break;
    case 'page': if (!gate('page', 45)) break; pgI = (pgI + 1 + (Math.random() * 3 | 0)) % 5; if (!smp(pgI ? 'page' + pgI : 'page', 0.9)) { noise(0.09, 0.22, 'bandpass', 2400 + Math.random() * 900, 5200, 1.2); } break;
    case 'alarm': for (i = 0; i < 4; i++) { tone('triangle', 1047, 0, 0.08, 0.07, i * 0.14); tone('triangle', 1319, 0, 0.08, 0.06, i * 0.14 + 0.07); } break;
    case 'buzz': tone('sine', 880, 0, 0.16, 0.09); tone('sine', 1175, 0, 0.22, 0.08, 0.12); noise(0.05, 0.03, 'bandpass', 2400, 0, 2, 0.0); break;   // 문자 알림: 띵동만(10/4 낮은 진동음이 '웅' 소리로 들려 뺐다)
    case 'drink': if (!smp('drink', 0.55, 1)) tone('sine', 300, 200, 0.2, 0.15); break;            // 박카스: 뚜껑 따고 꿀꺽 두 번(녹음)
    case 'stick': if (!smp('stick', 0.5, 1)) noise(0.08, 0.15, 'bandpass', 1500); break;            // 종이 붙이기(포스트잇 녹음)
    case 'blanket': if (!smp('blanket', 0.6, 1)) noise(0.6, 0.15, 'lowpass', 900); break;           // 이불 개기(천 녹음)
    case 'can': if (!smp('can', 0.45)) tone('sine', 900, 700, 0.1, 0.08); break;                   // 캔·컵 줍기
    case 'coin': tone('triangle', 988, 0, 0.08, 0.1); tone('triangle', 1319, 0, 0.16, 0.1, 0.06); break;
    case 'buy': arp([79, 84, 88], 0.06, 'triangle', 0.12, 0.18); break;
    case 'nice': arp([76, 81], 0.09, 'sine', 0.16, 0.32); arp([88], 0.0, 'sine', 0.04, 0.4); break;   // 10/4 "라면 나이스 소리": 부드럽게
    case 'great': arp([72, 76, 79], 0.08, 'sine', 0.16, 0.32); break;
    case 'perfect': arp([72, 76, 79, 84], 0.07, 'sine', 0.17, 0.32); break;
    case 'up': arp([67, 72, 76, 79], 0.09, 'triangle', 0.22, 0.3); break;
    case 'down': arp([64, 60, 57], 0.14, 'triangle', 0.2, 0.34); break;
    case 'step': if (!smp('step', 0.35, 0.9 + Math.random() * 0.2)) { noise(0.05, 0.1, 'lowpass', 420, 160); } break;
    case 'door': noise(0.1, 0.3, 'lowpass', 500, 150); tone('sine', 110, 70, 0.12, 0.3); break;
    case 'pass': arp([60, 64, 67, 72, 76, 79, 84, 88], 0.11, 'triangle', 0.26, 0.5); arp([48, 55, 60], 0.3, 'sawtooth', 0.06, 0.7); break;
    case 'fail': arp([67, 63, 60, 55, 51], 0.24, 'triangle', 0.22, 0.5); break;
  }
}
// 문지르는 소리: v 0~1
function scrub(v) {
  if (!ctx) return;
  if (!scG && (v > 0)) {
    scG = ctx.createGain(); scG.gain.value = 0; scG.connect(sfxG);
    if (BUF.scrub) { scSrc = ctx.createBufferSource(); scSrc.buffer = BUF.scrub; scSrc.loop = true; scSrc.connect(scG); scSrc.start(); }
    else { var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), l = ctx.createOscillator(), lg = ctx.createGain(), a = ctx.createGain(); s.buffer = nbuf; s.loop = true; f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = 0.9;
      l.frequency.value = 7.5; lg.gain.value = 0.5; a.gain.value = 0.5; l.connect(lg); lg.connect(a.gain); s.connect(f); f.connect(a); a.connect(scG); s.start(); l.start(); }
  }
  if (scG) scG.gain.setTargetAtTime(v > 0 ? 0.7 * v : 0, ctx.currentTime, 0.05);
}
// 형광등 웅 소리
function hum(v) {
  if (!ctx) return;
  if (!humG) { humG = ctx.createGain(); humG.gain.value = 0; humG.connect(sfxG); [120, 240, 360].forEach(function (f, i) { var o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.value = [0.03, 0.012, 0.006][i]; o.connect(g); g.connect(humG); o.start(); }); }
  humG.gain.setTargetAtTime(v, ctx.currentTime, 0.4);
}

// ---------- 배경 가락: 느린 다장조, 전기 피아노 화음 + 통통 베이스 ----------
var CH = { C: { b: 36, c: [60, 64, 67, 71] }, Am: { b: 33, c: [57, 60, 64, 67] }, Dm: { b: 38, c: [57, 60, 62, 65] }, G: { b: 31, c: [55, 59, 62, 65] }, F: { b: 29, c: [57, 60, 64, 65] }, Em: { b: 28, c: [55, 59, 62, 64] } };
var BARS = ['C', 'Am', 'Dm', 'G', 'C', 'Em', 'F', 'G'];
var MEL = [
  [76, 0, 0, 74, 72, 0, 67, 0], [69, 0, 72, 0, 76, 0, 0, 0], [77, 0, 0, 76, 74, 0, 69, 0], [71, 0, 74, 0, 79, 0, 0, 0],
  [84, 0, 0, 83, 79, 0, 76, 0], [79, 0, 0, 76, 71, 0, 0, 0], [72, 0, 77, 0, 81, 0, 79, 77], [74, 0, 0, 0, -1, 0, 0, 0]
];
function ep(m, t, dur, vol) {
  var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); g.connect(bgmG);
  [1, 2, 4].forEach(function (h, i) { var o = ctx.createOscillator(), og = ctx.createGain(); o.type = i ? 'sine' : 'triangle'; o.frequency.value = mf(m) * h; og.gain.value = [1, 0.3, 0.08][i]; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 0.02); });
}
function sched() {
  if (!ctx || ctx.state !== 'running') return;
  if (nextT < ctx.currentTime) nextT = ctx.currentTime + 0.05;
  while (nextT < ctx.currentTime + 0.25) {
    var e = 0.33, bar = Math.floor(stepI / 8) % 8, k = stepI % 8, ch = CH[BARS[bar]], t = nextT + (k % 2 ? 0.05 : 0), m = MEL[bar][k];
    if (k === 0) { tone('sine', mf(ch.b), 0, 0.9, 0.5, t - ctx.currentTime, bgmG, 0.01); ch.c.forEach(function (n, i) { ep(n, t + i * 0.012, 1.6, 0.05); }); }
    if (k === 3 || k === 5) tone('sine', mf(ch.b + (k === 5 ? 7 : 12)), 0, 0.4, 0.3, t - ctx.currentTime, bgmG, 0.01);
    if (k === 4) ch.c.slice(1).forEach(function (n, i) { ep(n, t + i * 0.012, 0.9, 0.035); });
    if (k % 2 === 0) { var ns = ctx.createBufferSource(), nf = ctx.createBiquadFilter(), ng = ctx.createGain(); ns.buffer = nbuf; nf.type = 'highpass'; nf.frequency.value = 7500; ng.gain.setValueAtTime(k === 4 ? 0.04 : 0.018, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.06); ns.connect(nf); nf.connect(ng); ng.connect(bgmG); ns.start(t, Math.random() * 0.5); ns.stop(t + 0.08); }
    if (m > 0) { var len = 1; while (k + len < 8 && MEL[bar][k + len] === 0 && len < 4) len++; ep(m, t, len * e * 1.3, 0.085); }
    nextT += e; stepI++;
  }
}
function startMusic() { if (!ctx || timer) return; nextT = 0; timer = setInterval(sched, 60); }
function music(v) { musicOn = v; if (v) { if (ctx && !timer) startMusic(); } else if (timer) { clearInterval(timer); timer = null; } }
return {
  unlock: unlock, play: play, scrub: scrub, hum: hum, music: music, _buf: BUF,
  snd: function (v) { sndOn = v; if (sfxG) sfxG.gain.value = v ? 0.6 : 0; },
  bgm: function (v) { bgmOn = v; if (bgmG) bgmG.gain.value = v ? 0.26 : 0; },
  hide: function (h) { if (!ctx) return; if (h) ctx.suspend(); else ctx.resume(); }
};
})();