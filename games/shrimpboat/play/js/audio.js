// 새우잡이배 — 소리. 물리 효과음·파도·엔진은 녹음(js/sfx.js, 있으면), 없으면 코드 합성. 가락은 조타실 라디오에서 나오는 트로트풍(직접 지은 것)
var SND = (function () {
'use strict';
var ctx = null, sfxG, bgmG, nbuf, sndOn = 1, bgmOn = 1, musicOn = 0, timer = null, nextT = 0, stepI = 0, BUF = {}, VOX = {}, last = {}, loops = {};
function init() {
  if (ctx) return; var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ctx = new AC(); sfxG = ctx.createGain(); sfxG.gain.value = sndOn ? 0.9 : 0;
  var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 5; sfxG.connect(comp); comp.connect(ctx.destination);
  bgmG = ctx.createGain(); bgmG.gain.value = bgmOn ? 0.22 : 0; bgmG.connect(ctx.destination);
  nbuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); var d = nbuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  function dec(src, into) { Object.keys(src).forEach(function (k) { var bin = atob(src[k]), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); try { ctx.decodeAudioData(u.buffer, function (b) { into[k] = b; }, function () {}); } catch (e) {} }); }
  dec(window.SFXDATA || {}, BUF); dec(window.VOXDATA || {}, VOX);
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
  s.connect(f); f.connect(g); g.connect(dest || sfxG); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.03);
}
function mf(m) { return 440 * Math.pow(2, (m - 69) / 12); }
function arp(notes, gap, type, vol, len) { notes.forEach(function (n, i) { tone(type || 'triangle', mf(n), 0, len || 0.22, vol || 0.2, i * gap); }); }
function play(name) {
  if (!ctx || !sndOn || ctx.state !== 'running') return;
  var i;
  switch (name) {
    case 'tap': tone('sine', 520, 300, 0.06, 0.18); break;
    case 'btn': tone('sine', 420, 260, 0.08, 0.25); noise(0.05, 0.25, 'lowpass', 700); break;
    case 'nope': tone('square', 170, 150, 0.07, 0.1); tone('square', 140, 120, 0.09, 0.1, 0.09); break;
    case 'lever': if (!smp('lever', 0.8)) { tone('square', 140, 90, 0.08, 0.2); noise(0.08, 0.3, 'bandpass', 1800, 600, 2); } break;
    case 'creak': if (!gate('creak', 260)) break; if (!smp('creak', 0.6)) { tone('sawtooth', 160 + Math.random() * 60, 120, 0.35, 0.05); noise(0.3, 0.08, 'bandpass', 900, 500, 6); } break;
    case 'surf': if (!smp('surf', 0.8)) noise(1.2, 0.4, 'bandpass', 900, 300, 0.7); break;
    case 'clunk': if (!smp('clang', 0.7)) { tone('sine', 160, 70, 0.2, 0.4); noise(0.12, 0.3, 'lowpass', 800, 200); } break;
    case 'clang': if (!smp('clang', 0.8)) { tone('triangle', 420, 380, 0.4, 0.15); tone('sine', 1250, 0, 0.3, 0.06); noise(0.1, 0.3, 'bandpass', 2500, 900, 1); } break;
    case 'dump': if (!smp('dump', 1)) { noise(0.9, 0.5, 'bandpass', 1400, 500, 0.8); for (i = 0; i < 10; i++) noise(0.06, 0.25, 'bandpass', 2000 + Math.random() * 2000, 0, 2, 0.1 + Math.random() * 0.6); } break;
    case 'flop': if (!gate('flop', 70)) break; if (!smp('flop', 0.7)) { noise(0.06, 0.3, 'lowpass', 1200, 300); tone('sine', 300, 120, 0.06, 0.12); } break;
    case 'slap': if (!gate('slap', 60)) break; if (!smp('slap', 0.5)) noise(0.05, 0.25, 'lowpass', 900, 200); break;
    case 'scrub': if (!gate('scrub', 170)) break; if (!smp('scrub', 0.55)) noise(0.12, 0.15, 'bandpass', 2600, 0, 0.9); break;
    case 'pick': noise(0.05, 0.2, 'bandpass', 1500, 600, 1.2); break;
    case 'whoosh': if (!gate('whoosh', 50)) break; noise(0.18, 0.18, 'bandpass', 800, 2400, 1.2); break;
    case 'plop': if (!gate('plop', 40)) break; if (!smp('plop', 0.6, 1.2)) { noise(0.06, 0.3, 'lowpass', 900, 250); tone('sine', 220, 120, 0.07, 0.15); } break;
    case 'splashS': if (!gate('splashS', 60)) break; if (!smp('splashS', 0.5)) noise(0.4, 0.25, 'bandpass', 2400, 700, 0.8); break;
    case 'splash': if (!smp('splash', 1)) { noise(0.8, 0.5, 'bandpass', 2600, 700, 0.7); noise(0.4, 0.4, 'lowpass', 700, 200); } break;
    case 'chomp': tone('sine', 140, 60, 0.15, 0.35); noise(0.08, 0.3, 'lowpass', 600, 200); arp([79, 84], 0.08, 'triangle', 0.12); break;
    case 'pocket': arp([84, 88, 91], 0.06, 'square', 0.08, 0.15); break;
    case 'pyong': if (!gate('pyong', 35)) break; var pr = 0.95 + Math.random() * 0.1; tone('sine', 420 * pr, 1500 * pr, 0.12, 0.22); tone('triangle', 840 * pr, 2600 * pr, 0.09, 0.05); break;   // 새우가 바구니에 쏙: 뿅
    case 'ding': tone('sine', 1568, 0, 0.25, 0.12); tone('sine', 2349, 0, 0.3, 0.08, 0.05); break;
    case 'clean': arp([72, 76, 79, 84], 0.07, 'triangle', 0.22, 0.3); break;
    case 'nice': arp([72, 76], 0.08, 'triangle', 0.2); break;
    case 'great': arp([72, 76, 79], 0.07, 'triangle', 0.22); break;
    case 'perfect': arp([72, 76, 79, 84, 88], 0.06, 'triangle', 0.24, 0.3); break;
    case 'up': arp([67, 72, 76, 79], 0.09, 'triangle', 0.22, 0.3); break;
    case 'down': arp([64, 60, 57], 0.14, 'triangle', 0.2, 0.34); break;
    case 'hatch': if (!smp('clang', 0.6, 0.8)) { tone('sine', 120, 80, 0.2, 0.3); noise(0.15, 0.3, 'lowpass', 600, 150); } break;
    case 'pour': if (!smp('pour', 0.8)) noise(0.8, 0.3, 'bandpass', 1200, 500, 0.8); break;
    case 'lift': if (!smp('lift', 0.6)) noise(0.1, 0.2, 'bandpass', 600, 300, 1); break;
    case 'thud': if (!smp('thud', 0.8)) { tone('sine', 110, 50, 0.2, 0.45); noise(0.1, 0.35, 'lowpass', 500, 120); } break;
    case 'rope': noise(0.6, 0.15, 'bandpass', 1500, 800, 3); break;
    case 'ignite': if (!smp('ignite', 0.8)) { noise(0.03, 0.4, 'highpass', 3000); noise(0.5, 0.25, 'lowpass', 1200, 400, 0.7, 0.05); } break;
    case 'click': tone('square', 900, 500, 0.03, 0.12); noise(0.03, 0.3, 'highpass', 3000); break;
    case 'rip': if (!smp('rip', 0.8)) noise(0.25, 0.35, 'bandpass', 2400, 4200, 2); break;
    case 'rattle': for (i = 0; i < 4; i++) { tone('square', 700 + Math.random() * 300, 0, 0.03, 0.08, i * 0.06); noise(0.04, 0.2, 'bandpass', 2400, 0, 3, i * 0.06); } break;
    case 'unlock': tone('square', 1200, 0, 0.03, 0.1); tone('square', 800, 0, 0.05, 0.12, 0.09); noise(0.06, 0.3, 'bandpass', 3000, 0, 2, 0.09); break;
    case 'locker': if (!smp('clang', 0.4, 1.3)) noise(0.2, 0.25, 'bandpass', 1500, 600, 1); break;
    case 'tarp': noise(0.3, 0.2, 'bandpass', 1800, 900, 1); break;
    case 'hit': tone('sine', 90, 40, 0.3, 0.6); noise(0.15, 0.6, 'lowpass', 900, 100); break;
    case 'horn': tone('sawtooth', 147, 0, 1.4, 0.12); tone('sawtooth', 185, 0, 1.4, 0.1); break;
    case 'paddle': if (!smp('paddle', 0.7)) noise(0.35, 0.3, 'bandpass', 1200, 400, 1); break;
    case 'step': if (!smp('step', 0.3, 0.9 + Math.random() * 0.2)) noise(0.05, 0.1, 'lowpass', 420, 160); break;
    case 'stepC': if (!smp('step', 0.18, 0.8)) noise(0.05, 0.06, 'lowpass', 380, 150); break;
    case 'alarm': for (i = 0; i < 3; i++) tone('square', 880, 0, 0.12, 0.06, i * 0.25); break;
    case 'gull': if (!smp('gull', 0.35 + Math.random() * 0.2)) { tone('sawtooth', 1100, 1500, 0.12, 0.04); tone('sawtooth', 1500, 900, 0.28, 0.04, 0.12); } break;
    case 'end': arp([60, 64, 67, 72, 76, 79, 84, 88], 0.11, 'triangle', 0.26, 0.5); break;
    case 'fail': arp([67, 63, 60, 55, 51], 0.24, 'triangle', 0.22, 0.5); break;
  }
}
/* ---------- 계속 나는 소리: 파도·바람·비·엔진·양망기·불·끓는 물·물 붓기·코골이 ---------- */
function mkLoop(name) {
  var g = ctx.createGain(); g.gain.value = 0; g.connect(sfxG); var L = { g: g, v: 0 };
  if (BUF[name]) { var s = ctx.createBufferSource(); s.buffer = BUF[name]; s.loop = true; s.connect(g); s.start(0, Math.random() * BUF[name].duration); L.src = s; return L; }
  L.synth = true; L.parts = [];
  var n = ctx.createBufferSource(); n.buffer = nbuf; n.loop = true; var f = ctx.createBiquadFilter(), a = ctx.createGain(); a.gain.value = 1; n.connect(f); f.connect(a); a.connect(g);
  var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.connect(lg);
  if (name === 'waves') { f.type = 'lowpass'; f.frequency.value = 520; lfo.frequency.value = 0.13; lg.gain.value = 0.55; lg.connect(a.gain); }
  else if (name === 'wind') { f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 1.4; lfo.frequency.value = 0.21; lg.gain.value = 380; lg.connect(f.frequency); }
  else if (name === 'rain') { f.type = 'highpass'; f.frequency.value = 3200; }
  else if (name === 'engine') { f.type = 'lowpass'; f.frequency.value = 220; lfo.frequency.value = 11; lg.gain.value = 0.7; lg.connect(a.gain); var o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = 44; og.gain.value = 0.25; o.connect(og); og.connect(a); o.start(); L.o = o; }
  else if (name === 'winch') { f.type = 'bandpass'; f.frequency.value = 650; f.Q.value = 4; var o2 = ctx.createOscillator(), og2 = ctx.createGain(); o2.type = 'square'; o2.frequency.value = 62; og2.gain.value = 0.12; o2.connect(og2); og2.connect(g); o2.start(); L.o = o2; }
  else if (name === 'flame') { f.type = 'lowpass'; f.frequency.value = 700; }
  else if (name === 'boil') { f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 3; lfo.type = 'square'; lfo.frequency.value = 9; lg.gain.value = 0.9; lg.connect(a.gain); }
  else if (name === 'pour') { f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 0.9; }
  else if (name === 'snore') { f.type = 'bandpass'; f.frequency.value = 260; f.Q.value = 2; lfo.frequency.value = 0.28; lg.gain.value = 1; lg.connect(a.gain); a.gain.value = 0; var o3 = ctx.createOscillator(), og3 = ctx.createGain(); o3.type = 'sawtooth'; o3.frequency.value = 88; og3.gain.value = 0.35; o3.connect(og3); og3.connect(f); o3.start(); L.o = o3; }
  n.start(0, Math.random()); lfo.start(); L.src = n; L.parts = [n, lfo, L.o]; return L;
}
function loop(name, v, rate) {
  if (!ctx) return; if (!loops[name]) { if (!v) return; loops[name] = mkLoop(name); }
  var L = loops[name];
  if (L.synth && BUF[name]) { L.parts.forEach(function (p) { try { if (p) p.stop(); } catch (e) {} }); L.g.disconnect(); var nv = L.v; loops[name] = L = mkLoop(name); L.v = -1; v = v || nv; }   // 녹음이 늦게 풀리면 바꿔 끼운다
  if (Math.abs(L.v - v) < 0.01 && !rate) return; L.v = v;
  var vol = { waves: 0.5, wind: 0.35, rain: 0.25, engine: 0.35, winch: 0.4, flame: 0.25, boil: 0.25, pour: 0.4, snore: 0.4 }[name] || 0.4;
  L.g.gain.setTargetAtTime(v * vol, ctx.currentTime, 0.12);
  if (rate && L.src && L.src.playbackRate) L.src.playbackRate.setTargetAtTime(rate, ctx.currentTime, 0.2);
  if (name === 'winch' && L.o) L.o.frequency.setTargetAtTime(v > 1 ? 52 : 62, ctx.currentTime, 0.1);
}
var vSrc = null;
function voice(k) { if (vSrc) { try { vSrc.stop(); } catch (e) {} vSrc = null; } if (!k || !ctx || !sndOn || ctx.state !== 'running') return; var b = VOX[k]; if (!b) return; var s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = b; g.gain.value = 1.1; s.connect(g); g.connect(sfxG); s.start(); vSrc = s; }

/* ---------- 라디오 가락: 2/4 쿵짝, 가단조, 비브라토 낀 오르간 선율. 라디오처럼 좁은 대역으로 ---------- */
var MEL = [[76, 2], [74, 1], [72, 1], [69, 3], [0, 1], [74, 2], [72, 1], [74, 1], [76, 4], [76, 1], [77, 1], [76, 1], [74, 1], [72, 2], [71, 1], [72, 1], [71, 2], [69, 1], [68, 1], [69, 4],
  [81, 2], [79, 1], [76, 1], [79, 2], [76, 2], [74, 1], [76, 1], [74, 1], [72, 1], [69, 4], [72, 2], [74, 1], [76, 1], [77, 2], [76, 1], [74, 1], [76, 2], [71, 1], [68, 1], [69, 3], [0, 1]];
var CHD = ['Am', 'Am', 'Dm', 'Am', 'Dm', 'Am', 'E', 'Am', 'Am', 'C', 'Dm', 'Am', 'Am', 'Dm', 'E', 'Am'];
var CH = { Am: { b: 45, c: [57, 60, 64] }, Dm: { b: 50, c: [57, 62, 65] }, E: { b: 40, c: [56, 59, 62] }, C: { b: 48, c: [55, 60, 64] } };
var mq = [], radio = null;
(function () { var t = 0; MEL.forEach(function (m) { mq.push({ at: t, n: m[0], d: m[1] }); t += m[1]; }); })();
function lead(m, t, dur) {
  var o = ctx.createOscillator(), g = ctx.createGain(), v = ctx.createOscillator(), vg = ctx.createGain(), f = ctx.createBiquadFilter();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(mf(m) * 0.985, t); o.frequency.linearRampToValueAtTime(mf(m), t + 0.07);
  v.frequency.value = 5.6; vg.gain.value = mf(m) * 0.012; v.connect(vg); vg.connect(o.frequency);
  f.type = 'lowpass'; f.frequency.value = 2200; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09, t + 0.03); g.gain.setValueAtTime(0.08, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f); f.connect(g); g.connect(radio); o.start(t); v.start(t + 0.12); o.stop(t + dur + 0.05); v.stop(t + dur + 0.05);
}
function sched() {
  if (!ctx || ctx.state !== 'running') return;
  if (!radio) { radio = ctx.createBiquadFilter(); radio.type = 'bandpass'; radio.frequency.value = 1100; radio.Q.value = 0.55; radio.connect(bgmG); }
  var e = 60 / 128 / 2;
  if (nextT < ctx.currentTime) nextT = ctx.currentTime + 0.05;
  while (nextT < ctx.currentTime + 0.3) {
    var k = stepI % 64, bar = Math.floor(k / 4), b = k % 4, ch = CH[CHD[bar]], t = nextT, w = t - ctx.currentTime;
    if (b === 0 || b === 2) tone('triangle', mf(b === 0 ? ch.b : ch.b + 7 - (CHD[bar] === 'E' ? 0 : 0)), 0, 0.22, 0.32, w, radio, 0.005);
    if (b === 1 || b === 3) { ch.c.forEach(function (n) { tone('square', mf(n), 0, 0.12, 0.025, w, radio, 0.004); }); var s = ctx.createBufferSource(), sf = ctx.createBiquadFilter(), sg = ctx.createGain(); s.buffer = nbuf; sf.type = 'highpass'; sf.frequency.value = 2500; sg.gain.setValueAtTime(0.12, t); sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); s.connect(sf); sf.connect(sg); sg.connect(radio); s.start(t, Math.random()); s.stop(t + 0.1); }
    mq.forEach(function (q) { if (q.at === k && q.n > 0) lead(q.n, t, q.d * e * 0.95); });
    nextT += e; stepI++;
  }
}
function startMusic() { if (!ctx || timer) return; nextT = 0; timer = setInterval(sched, 70); }
function music(v) { musicOn = v; if (v) { if (ctx && !timer) startMusic(); } else if (timer) { clearInterval(timer); timer = null; } }
return {
  unlock: unlock, play: play, loop: loop, voice: voice, music: music, _buf: BUF,
  snd: function (v) { sndOn = v; if (sfxG) sfxG.gain.value = v ? 0.9 : 0; },
  bgm: function (v) { bgmOn = v; if (bgmG) bgmG.gain.value = v ? 0.22 : 0; },
  bgmVol: function (v) { if (!bgmG || !bgmOn || Math.abs(v - (this._bv || 0)) < 0.03) return; this._bv = v; bgmG.gain.setTargetAtTime(0.22 * v, ctx.currentTime, 0.3); },
  hide: function (h) { if (!ctx) return; if (h) ctx.suspend(); else ctx.resume(); }
};
})();
