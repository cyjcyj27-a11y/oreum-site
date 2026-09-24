/* 체커 — 소리. 전부 WebAudio 로 만든다(파일 없음, file:// 로 열어도 된다). */
(function () {
  'use strict';
  var KEY = 'checkers';
  var ac = null, master = null, nb = null;
  var snd = load('snd', true);

  function load(k, def) { try { var v = localStorage.getItem(KEY + '.' + k); return v === null ? def : v === '1'; } catch (e) { return def; } }
  function save(k, v) { try { localStorage.setItem(KEY + '.' + k, v ? '1' : '0'); } catch (e) {} }

  function ensure() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (AC) { ac = new AC(); master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination); }
  }
  function noiseBuf() {
    if (nb) return nb;
    var n = Math.floor(ac.sampleRate * 0.6), d; nb = ac.createBuffer(1, n, ac.sampleRate); d = nb.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return nb;
  }
  function tone(freq, type, t0, dur, vol, slideTo) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function burst(t0, dur, vol, freq, q, type) {
    var s = ac.createBufferSource(); s.buffer = noiseBuf();
    var f = ac.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1.2;
    var g = ac.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t0); s.stop(t0 + dur + 0.05);
  }
  function ok() { return snd && ac; }
  // 나무 말이 판에 "탁" — 둥근 말이라 오목 돌보다 낮고 두툼하게
  function clack(t, v) {
    var f = 1100 + Math.random() * 180;
    tone(f, 'sine', t, 0.05, 0.26 * v, f * 0.55); burst(t, 0.03, 0.36 * v, 2600, 1.4);
    tone(170, 'sine', t, 0.12, 0.45 * v, 95); burst(t, 0.07, 0.22 * v, 520, 0.9);
  }

  var A = {
    init: ensure,
    get snd() { return snd; },
    toggleSnd: function () { snd = !snd; save('snd', snd); return snd; },
    pick: function () { if (!ok()) return; var t = ac.currentTime; burst(t, 0.03, 0.14, 3000, 1.2); tone(900, 'sine', t, 0.04, 0.08, 1300); },
    place: function () { if (!ok()) return; clack(ac.currentTime, 1); },
    // 뛰어넘을 때 — 말이 말을 "톡" 치고 넘어간다, n 번째일수록 높게
    hop: function (n) {
      if (!ok()) return; var t = ac.currentTime, f = 1500 * Math.pow(1.12, n || 0);
      tone(f, 'triangle', t, 0.06, 0.2, f * 0.8); burst(t, 0.03, 0.3, 3800, 2);
      burst(t + 0.02, 0.14, 0.08, 1800, 0.7);   // 판 밖으로 미끄러져 나가는 소리
    },
    king: function () { if (!ok()) return; var t = ac.currentTime + 0.05, f = [784, 988, 1175, 1568], k; for (k = 0; k < 4; k++) tone(f[k], 'sine', t + k * 0.07, 0.35, 0.16); tone(2349, 'sine', t + 0.3, 0.6, 0.06); },
    bad: function () { if (!ok()) return; var t = ac.currentTime; tone(150, 'square', t, 0.12, 0.08, 110); },
    nice: function (n) { if (!ok()) return; var t = ac.currentTime + 0.12, k; for (k = 0; k < Math.min(4, (n || 1) + 1); k++) tone(880 * Math.pow(1.5, k * 0.5), 'sine', t + k * 0.09, 0.14, 0.2); },
    draw: function () { if (!ok()) return; var t = ac.currentTime; tone(520, 'sine', t, 0.16, 0.14, 440); tone(390, 'sine', t + 0.14, 0.22, 0.12, 330); },
    win: function () { if (!ok()) return; var t = ac.currentTime, f = [523, 659, 784, 1047], k; for (k = 0; k < 4; k++) tone(f[k], 'triangle', t + k * 0.12, 0.3, 0.22); tone(1047, 'sine', t + 0.5, 0.7, 0.18); },
    lose: function () { if (!ok()) return; var t = ac.currentTime; tone(392, 'triangle', t, 0.3, 0.22, 330); tone(262, 'triangle', t + 0.28, 0.6, 0.22, 196); }
  };
  window.CKAudio = A;
})();
