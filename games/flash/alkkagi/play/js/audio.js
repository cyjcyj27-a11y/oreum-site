/* 알까기 — 소리. 전부 WebAudio 로 만든다(파일 없음, file:// 로 열어도 된다). */
(function () {
  'use strict';
  var KEY = 'alkkagi';
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

  var A = {
    init: ensure,
    get snd() { return snd; },
    toggleSnd: function () { snd = !snd; save('snd', snd); return snd; },
    // 손가락으로 튕길 때
    flick: function (p) { if (!ok()) return; var t = ac.currentTime; burst(t, 0.06, 0.18 + p * 0.3, 1400); tone(220, 'sine', t, 0.07, 0.18, 100); },
    // 바둑돌끼리 "딱" — 세기에 따라 크게. 유리질 높은 소리 + 짧은 잡음
    clack: function (s) {
      if (!ok()) return; var t = ac.currentTime, v = Math.min(0.55, 0.08 + s * 0.06), f = 2100 + Math.random() * 500;
      tone(f, 'sine', t, 0.05, v, f * 0.55); tone(f * 1.6, 'triangle', t, 0.025, v * 0.5); burst(t, 0.02, v * 0.6, 4200, 2);
    },
    // 판 가장자리에서 떨어져 탁자에 "톡" 하고 구른다
    drop: function () {
      if (!ok()) return; var t = ac.currentTime;
      tone(1200, 'sine', t, 0.04, 0.2, 500);
      tone(130, 'sine', t + 0.08, 0.14, 0.4, 55); burst(t + 0.08, 0.07, 0.35, 450, 0.8);
      tone(700, 'sine', t + 0.17, 0.03, 0.12, 400); tone(600, 'sine', t + 0.25, 0.03, 0.08, 350);
    },
    // 칭찬(NICE·DOUBLE)
    nice: function (n) { if (!ok()) return; var t = ac.currentTime, k; for (k = 0; k < (n || 1) + 1; k++) tone(880 * Math.pow(1.5, k * 0.5), 'sine', t + k * 0.09, 0.14, 0.2); },
    win: function () { if (!ok()) return; var t = ac.currentTime, f = [523, 659, 784, 1047], k; for (k = 0; k < 4; k++) tone(f[k], 'triangle', t + k * 0.12, 0.3, 0.22); tone(1047, 'sine', t + 0.5, 0.7, 0.18); },
    lose: function () { if (!ok()) return; var t = ac.currentTime; tone(392, 'triangle', t, 0.3, 0.22, 330); tone(262, 'triangle', t + 0.28, 0.6, 0.22, 196); },
    // 돌을 판에 놓을 때(판 차림)
    place: function () { if (!ok()) return; var t = ac.currentTime; tone(1500 + Math.random() * 400, 'sine', t, 0.04, 0.12, 900); burst(t, 0.02, 0.1, 3000, 2); }
  };
  window.AKAudio = A;
})();
