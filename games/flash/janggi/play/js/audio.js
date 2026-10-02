/* 장기 — 소리. 알 놓는 소리는 WebAudio 로, 장군·멍군·빅장 외침은 mp3(edge-tts). file:// 로 열어도 된다. */
(function () {
  'use strict';
  var KEY = 'janggi';
  var ac = null, master = null;
  var snd = load('snd', true);

  function load(k, def) { try { var v = localStorage.getItem(KEY + '.' + k); return v === null ? def : v === '1'; } catch (e) { return def; } }
  function save(k, v) { try { localStorage.setItem(KEY + '.' + k, v ? '1' : '0'); } catch (e) {} }

  function ensure() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (AC) { ac = new AC(); master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination); }
  }
  function noiseBuf(sec) {
    var n = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function tone(freq, type, t0, dur, vol, slideTo) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function burst(t0, dur, vol, freq, q) {
    var s = ac.createBufferSource(); s.buffer = noiseBuf(dur + 0.05);
    var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1.2;
    var g = ac.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t0); s.stop(t0 + dur + 0.05);
  }
  function ok() { return snd && ac; }
  // 나무 알을 나무 판에 '딱' — 낮은 판 울림 + 짧은 나무 클릭
  function clack(t, vol) {
    var f = 1500 + Math.random() * 250;
    tone(f, 'sine', t, 0.03, 0.22 * vol, f * 0.55); burst(t, 0.03, 0.5 * vol, 2600, 1.4);
    tone(165, 'sine', t, 0.13, 0.5 * vol, 95); burst(t, 0.07, 0.3 * vol, 520, 0.8);
  }

  var voices = {};
  function voice(name) {
    if (!snd) return;
    try {
      var a = voices[name]; if (!a) { a = voices[name] = new Audio('assets/v-' + name + '.mp3'); a.preload = 'auto'; }
      a.currentTime = 0; a.volume = 0.9; var p = a.play(); if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }

  var A = {
    init: ensure,
    get snd() { return snd; },
    toggleSnd: function () { snd = !snd; save('snd', snd); return snd; },
    pick: function () { if (!ok()) return; var t = ac.currentTime; tone(900, 'sine', t, 0.025, 0.08, 700); burst(t, 0.02, 0.12, 3000, 1.5); },   // 알을 집는다
    move: function () { if (!ok()) return; clack(ac.currentTime, 1); },
    capture: function () { if (!ok()) return; var t = ac.currentTime; clack(t, 1.25); clack(t + 0.07, 0.6); tone(120, 'sine', t + 0.02, 0.2, 0.35, 70); },   // 잡힌 알이 튕겨 나간다
    check: function () { if (!ok()) return; var t = ac.currentTime; tone(660, 'triangle', t, 0.25, 0.18, 620); tone(990, 'sine', t + 0.03, 0.35, 0.12, 900); },
    bad: function () { if (!ok()) return; var t = ac.currentTime; tone(150, 'square', t, 0.1, 0.06, 110); },
    pass: function () { if (!ok()) return; var t = ac.currentTime; tone(420, 'sine', t, 0.12, 0.12, 380); tone(330, 'sine', t + 0.12, 0.16, 0.1, 300); },
    draw: function () { if (!ok()) return; var t = ac.currentTime; tone(520, 'sine', t, 0.16, 0.14, 440); tone(390, 'sine', t + 0.14, 0.22, 0.12, 330); },
    win: function () { if (!ok()) return; var t = ac.currentTime, f = [523, 659, 784, 1047], k; for (k = 0; k < 4; k++) tone(f[k], 'triangle', t + k * 0.12, 0.3, 0.22); tone(1047, 'sine', t + 0.5, 0.7, 0.18); },
    lose: function () { if (!ok()) return; var t = ac.currentTime; tone(392, 'triangle', t, 0.3, 0.22, 330); tone(262, 'triangle', t + 0.28, 0.6, 0.22, 196); },
    voice: voice
  };
  window.JGAudio = A;
})();
