/* 핑거킥 — 소리.
 * 함성·골·호루라기는 실사 녹음(assets/*.mp3, Pixabay Content License — 출처는 assets/SOUNDS.md),
 * 튕기기·공 맞는 소리·벽 소리는 WebAudio 로 만든다. file:// 로 열어도 되게 <audio> 로 튼다. */
(function () {
  'use strict';
  var KEY = 'fingerkick';
  var ac = null, master = null;
  var snd = load('snd', true), bgm = load('bgm', true);

  function load(k, def) { try { var v = localStorage.getItem(KEY + '.' + k); return v === null ? def : v === '1'; } catch (e) { return def; } }
  function save(k, v) { try { localStorage.setItem(KEY + '.' + k, v ? '1' : '0'); } catch (e) {} }

  function mk(src, loop, vol) { var a = new Audio(src); a.loop = !!loop; a.preload = 'auto'; a.volume = vol; return a; }
  var crowd = mk('assets/crowd.mp3', true, 0.45);
  var goalS = mk('assets/goal.mp3', false, 1.0);
  var shout = mk('assets/shout.mp3', false, 0.9);   // 해설 "골!" 외침
  var whis = mk('assets/whistle.mp3', false, 0.7);
  var full = mk('assets/fulltime.mp3', false, 0.7);
  function play(a) { if (!snd) return; try { a.currentTime = 0; var p = a.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
  function crowdSync() { if (bgm) { var p = crowd.play(); if (p && p.catch) p.catch(function () {}); } else crowd.pause(); }

  function ensure() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); crowdSync(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (AC) { ac = new AC(); master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination); }
    crowdSync();
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
  function burst(t0, dur, vol, freq) {
    var s = ac.createBufferSource(); s.buffer = noiseBuf(dur + 0.05);
    var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.2;
    var g = ac.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t0); s.stop(t0 + dur + 0.05);
  }
  function ok() { return snd && ac; }

  var A = {
    init: ensure,
    get snd() { return snd; }, get bgm() { return bgm; },
    toggleSnd: function () { snd = !snd; save('snd', snd); return snd; },
    toggleBgm: function () { bgm = !bgm; save('bgm', bgm); crowdSync(); return bgm; },
    flick: function (p) { if (!ok()) return; var t = ac.currentTime; burst(t, 0.06, 0.25 + p * 0.3, 1800); tone(240, 'sine', t, 0.08, 0.25, 110); },
    hit: function (s) { if (!ok()) return; var t = ac.currentTime, v = Math.min(0.5, 0.06 + s * 0.05); tone(1000 + s * 40, 'sine', t, 0.05, v, 500); burst(t, 0.03, v * 0.6, 3000); },
    wall: function (s) { if (!ok()) return; var t = ac.currentTime, v = Math.min(0.35, 0.05 + s * 0.04); tone(140, 'sine', t, 0.09, v, 60); burst(t, 0.04, v * 0.4, 700); },
    whistle: function () { play(whis); },
    goal: function () {
      play(goalS); play(shout);
      // 배경 함성도 골 순간에 부풀었다가 가라앉는다
      if (bgm && snd) { crowd.volume = 1.0; var t0 = Date.now(); (function ease() { var k = (Date.now() - t0) / 3500; if (k >= 1) { crowd.volume = 0.45; return; } crowd.volume = 1.0 - 0.55 * k; setTimeout(ease, 60); })(); }
    },
    whistle3: function () { play(full); },
    _els: { crowd: crowd, goal: goalS, shout: shout, whistle: whis, full: full }
  };
  window.FKAudio = A;
})();
