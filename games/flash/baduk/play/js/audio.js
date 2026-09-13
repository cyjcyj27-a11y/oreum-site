/* 바둑 — 소리. 전부 WebAudio 로 만든다(파일 없음, file:// 로 열어도 된다). */
(function () {
  'use strict';
  var KEY = 'baduk';
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
    // 돌을 판에 "딱" — 나무 판 울림 + 돌 부딪는 높은 소리
    stone: function () {
      if (!ok()) return; var t = ac.currentTime, f = 1900 + Math.random() * 300;
      tone(f, 'sine', t, 0.045, 0.32, f * 0.6); burst(t, 0.025, 0.4, 3600, 1.6);
      tone(210, 'sine', t, 0.11, 0.42, 120); burst(t, 0.06, 0.25, 700, 0.9);
    },
    // 따낸 돌을 집어 드는 "달그락"
    capture: function (n) {
      if (!ok()) return; var t = ac.currentTime + 0.12, k, m = Math.min(6, n);
      for (k = 0; k < m; k++) { var f = 2300 + Math.random() * 700, tt = t + k * 0.055; tone(f, 'sine', tt, 0.035, 0.22, f * 0.6); burst(tt, 0.02, 0.2, 4200, 2); }
    },
    pass: function () { if (!ok()) return; var t = ac.currentTime; tone(520, 'sine', t, 0.16, 0.14, 440); tone(390, 'sine', t + 0.14, 0.22, 0.12, 330); },
    bad: function () { if (!ok()) return; var t = ac.currentTime; tone(150, 'square', t, 0.12, 0.08, 110); },
    nice: function (n) { if (!ok()) return; var t = ac.currentTime + 0.2, k; for (k = 0; k < Math.min(4, (n || 1) + 1); k++) tone(880 * Math.pow(1.5, k * 0.5), 'sine', t + k * 0.09, 0.14, 0.2); },
    count: function () { if (!ok()) return; var t = ac.currentTime, f = [392, 494, 587, 784], k; for (k = 0; k < 4; k++) tone(f[k], 'sine', t + k * 0.16, 0.25, 0.12); },
    win: function () { if (!ok()) return; var t = ac.currentTime, f = [523, 659, 784, 1047], k; for (k = 0; k < 4; k++) tone(f[k], 'triangle', t + k * 0.12, 0.3, 0.22); tone(1047, 'sine', t + 0.5, 0.7, 0.18); },
    lose: function () { if (!ok()) return; var t = ac.currentTime; tone(392, 'triangle', t, 0.3, 0.22, 330); tone(262, 'triangle', t + 0.28, 0.6, 0.22, 196); }
  };
  window.BDAudio = A;
})();
