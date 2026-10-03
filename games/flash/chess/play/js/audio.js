/* 체스 — 소리. 말 놓는 소리는 WebAudio(펠트 바닥 말이 판에 닿는 둔한 소리), 체크·체크메이트 외침은 mp3(edge-tts). file:// 로 열어도 된다. */
(function () {
  'use strict';
  var KEY = 'chess';
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
  // 펠트 바닥 말이 판에 '툭' — 낮은 울림 위주, 클릭은 약하게
  function thud(t, vol) {
    tone(140, 'sine', t, 0.14, 0.55 * vol, 70); burst(t, 0.05, 0.22 * vol, 420, 0.8);
    burst(t, 0.02, 0.18 * vol, 2200, 1.5);
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
    pick: function () { if (!ok()) return; var t = ac.currentTime; tone(700, 'sine', t, 0.03, 0.07, 500); burst(t, 0.02, 0.1, 2600, 1.5); },
    move: function () { if (!ok()) return; thud(ac.currentTime, 1); },
    capture: function () { if (!ok()) return; var t = ac.currentTime; thud(t, 1.2); burst(t + 0.01, 0.04, 0.35, 3200, 1.8); thud(t + 0.09, 0.5); },
    castle: function () { if (!ok()) return; var t = ac.currentTime; thud(t, 1); thud(t + 0.16, 0.9); },
    check: function () { if (!ok()) return; var t = ac.currentTime; tone(880, 'triangle', t, 0.22, 0.16, 840); tone(1320, 'sine', t + 0.02, 0.4, 0.1, 1200); },
    bad: function () { if (!ok()) return; var t = ac.currentTime; tone(150, 'square', t, 0.1, 0.06, 110); },
    promo: function () { if (!ok()) return; var t = ac.currentTime, k; for (k = 0; k < 3; k++) tone(660 * Math.pow(1.26, k), 'sine', t + k * 0.08, 0.16, 0.14); },
    draw: function () { if (!ok()) return; var t = ac.currentTime; tone(520, 'sine', t, 0.16, 0.14, 440); tone(390, 'sine', t + 0.14, 0.22, 0.12, 330); },
    win: function () { if (!ok()) return; var t = ac.currentTime, f = [523, 659, 784, 1047], k; for (k = 0; k < 4; k++) tone(f[k], 'triangle', t + k * 0.12, 0.3, 0.22); tone(1047, 'sine', t + 0.5, 0.7, 0.18); },
    lose: function () { if (!ok()) return; var t = ac.currentTime; tone(392, 'triangle', t, 0.3, 0.22, 330); tone(262, 'triangle', t + 0.28, 0.6, 0.22, 196); },
    voice: voice
  };
  window.CHAudio = A;
})();
