/* 땅따먹기 — 소리. 전부 WebAudio 로 만든다(파일 없음, file:// 로 열어도 된다). */
(function () {
  'use strict';
  var KEY = 'ttang';
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
    var n = Math.floor(ac.sampleRate * 1.5), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return (nb = b);
  }
  function tone(freq, type, t0, dur, vol, slideTo) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function burst(t0, dur, vol, freq, q, freqTo) {
    var s = ac.createBufferSource(); s.buffer = noiseBuf();
    var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(freq, t0); f.Q.value = q || 1.2;
    if (freqTo) f.frequency.exponentialRampToValueAtTime(freqTo, t0 + dur);
    var g = ac.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t0, Math.random() * 0.3); s.stop(t0 + dur + 0.05);
  }
  function ok() { return snd && ac; }

  var A = {
    init: ensure,
    get snd() { return snd; },
    toggleSnd: function () { snd = !snd; save('snd', snd); return snd; },
    // 손가락으로 사금파리를 "탁" 튕기고, 흙바닥을 "스르륵" 미끄러진다
    flick: function (p, dur) {
      if (!ok()) return; var t = ac.currentTime;
      burst(t, 0.05, 0.25 + p * 0.3, 2200, 1.5); tone(340, 'triangle', t, 0.05, 0.16, 160);
      var s = ac.createBufferSource(); s.buffer = noiseBuf();
      var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(900 + p * 700, t); f.frequency.exponentialRampToValueAtTime(380, t + dur); f.Q.value = 0.9;
      var g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.1 + p * 0.12, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
    },
    // 흙 위에 멈출 때 "톡"
    stop: function () { if (!ok()) return; var t = ac.currentTime; tone(210, 'sine', t, 0.08, 0.2, 120); burst(t, 0.04, 0.12, 700, 1); },
    // 돌을 내 땅 안에 옮겨 놓을 때
    place: function () { if (!ok()) return; var t = ac.currentTime; tone(520 + Math.random() * 80, 'triangle', t, 0.05, 0.14, 300); burst(t, 0.03, 0.08, 1800, 2); },
    // 땅을 먹었다 — 나뭇가지로 "슥슥" 긋고 올라가는 소리
    grab: function (n) {
      if (!ok()) return; var t = ac.currentTime, k;
      for (k = 0; k < 3; k++) burst(t + k * 0.07, 0.07, 0.16, 2600 + k * 300, 3, 1400);
      var f = [523, 659, 784, 1047, 1319], m = Math.min(5, 2 + (n || 0));
      for (k = 0; k < m; k++) tone(f[k], 'triangle', t + 0.18 + k * 0.07, 0.22, 0.16);
    },
    // 판 밖으로 나감
    out: function () { if (!ok()) return; var t = ac.currentTime; burst(t, 0.3, 0.2, 1200, 0.8, 300); tone(300, 'sine', t + 0.05, 0.35, 0.18, 110); },
    // 실패(남의 땅·못 돌아옴)
    miss: function () { if (!ok()) return; var t = ac.currentTime; tone(233, 'square', t, 0.12, 0.08, 220); tone(175, 'square', t + 0.14, 0.26, 0.08, 150); },
    // 상대가 실수 — 킥킥
    tease: function () { if (!ok()) return; var t = ac.currentTime, k; for (k = 0; k < 3; k++) tone(900 - k * 90, 'sine', t + k * 0.09, 0.07, 0.1, 700 - k * 90); },
    win: function () { if (!ok()) return; var t = ac.currentTime, f = [523, 659, 784, 1047], k; for (k = 0; k < 4; k++) tone(f[k], 'triangle', t + k * 0.12, 0.3, 0.22); tone(1047, 'sine', t + 0.5, 0.7, 0.18); },
    lose: function () { if (!ok()) return; var t = ac.currentTime; tone(392, 'triangle', t, 0.3, 0.22, 330); tone(262, 'triangle', t + 0.28, 0.6, 0.22, 196); },
    turn: function () { if (!ok()) return; var t = ac.currentTime; tone(880, 'sine', t, 0.08, 0.08); }
  };
  window.TTAudio = A;
})();
