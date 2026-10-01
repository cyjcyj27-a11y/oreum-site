// 달떡 합치기 소리: 효과음과 배경음 전부 Web Audio 로 만든다(파일 없음, file:// 에서도 난다)
(function () {
  'use strict';
  var ac = null, sg = null, bg = null;
  var sndOn = true, bgmOn = true;
  try {
    sndOn = localStorage.getItem('daltteok.snd') !== '0';
    bgmOn = localStorage.getItem('daltteok.bgm') !== '0';
  } catch (e) {}

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    sg = ac.createGain(); sg.gain.value = sndOn ? 0.9 : 0; sg.connect(ac.destination);
    bg = ac.createGain(); bg.gain.value = bgmOn ? 0.32 : 0; bg.connect(ac.destination);
    setInterval(sched, 90);
  }

  function tone(type, f0, f1, dur, vol, when, dest) {
    if (!ac) return;
    var t = (when || ac.currentTime), o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sg); o.start(t); o.stop(t + dur + 0.03);
  }
  var nbuf = null;
  function noise(dur, vol, type, freq, when, dest) {
    if (!ac) return;
    if (!nbuf) {
      nbuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
      var d = nbuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    var t = (when || ac.currentTime), s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = nbuf; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || sg); s.start(t); s.stop(t + dur + 0.02);
  }

  // 오음계(레 미 파# 라 시): 단계가 오를수록 높은 음
  var PENT = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26];
  function note(n) { return 293.66 * Math.pow(2, n / 12); }
  var lastThud = 0;

  var S = {
    tap: function () { tone('triangle', 1500, 950, 0.05, 0.16); tone('sine', 3000, 2400, 0.03, 0.06); },
    drop: function () { tone('sine', 540, 250, 0.11, 0.22); },
    thud: function (p) {
      if (ac.currentTime - lastThud < 0.05) return; lastThud = ac.currentTime;
      var v = Math.min(0.3, 0.05 + p * 0.25);
      tone('sine', 150, 70, 0.09, v); noise(0.04, v * 0.4, 'lowpass', 500);
    },
    merge: function (lv) {
      var f = note(PENT[Math.min(11, lv)]);
      tone('sine', f, f * 1.5, 0.13, 0.26); tone('triangle', f * 2, f * 2, 0.2, 0.08, ac.currentTime + 0.05);
      noise(0.03, 0.16, 'highpass', 1800);
    },
    praise: function (k) {
      var t = ac.currentTime;
      for (var i = 0; i < 3 + k; i++) tone('triangle', note(PENT[4 + i + k]), 0, 0.22, 0.18, t + i * 0.07);
    },
    moon: function () {
      var t = ac.currentTime;
      [5, 7, 8, 10, 11].forEach(function (p, i) { tone('triangle', note(PENT[p]), 0, 0.5, 0.2, t + i * 0.09); tone('sine', note(PENT[p]) * 2, 0, 0.6, 0.08, t + i * 0.09); });
    },
    kung: function () { tone('sine', 95, 38, 0.32, 0.7); noise(0.14, 0.45, 'lowpass', 420); tone('triangle', 220, 110, 0.08, 0.2); },
    full: function () { var t = ac.currentTime; tone('triangle', note(12), 0, 0.15, 0.16, t); tone('triangle', note(19), 0, 0.25, 0.16, t + 0.1); },
    over: function () {
      var t = ac.currentTime;
      [9, 7, 4, 0].forEach(function (p, i) { tone('triangle', note(p), 0, 0.4, 0.2, t + i * 0.18); });
    }
  };

  // ---------- 배경음: 가야금 뜯는 느낌의 오음계 가락, 92bpm ----------
  var MEL = [
    [7, -1, 9, -1, 12, -1, 9, 7, 4, -1, 7, -1, 2, -1, -1, -1],
    [4, -1, 7, -1, 9, -1, 7, 4, 2, -1, 4, -1, 0, -1, -1, -1],
    [7, -1, 9, -1, 12, -1, 14, 12, 9, -1, 12, -1, 7, -1, -1, -1],
    [4, -1, 2, -1, 4, -1, 7, 4, 2, -1, 0, -1, -1, -1, 2, -1]
  ];
  var BAS = [-12, -5, -12, -8];
  var step = 0, nextT = 0, SPB = 60 / 92 / 2;
  function pluck(n, t, vol) {
    var o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter(), fr = note(n);
    o.type = 'triangle'; o.frequency.setValueAtTime(fr * 1.012, t); o.frequency.exponentialRampToValueAtTime(fr, t + 0.05);
    f.type = 'lowpass'; f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(700, t + 0.5);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(f); f.connect(g); g.connect(bg); o.start(t); o.stop(t + 0.95);
  }
  function sched() {
    if (!ac || !bgmOn || ac.state !== 'running') { nextT = 0; return; }
    if (nextT < ac.currentTime) nextT = ac.currentTime + 0.05;
    while (nextT < ac.currentTime + 0.25) {
      var bar = (step >> 4) % 4, st = step & 15, m = MEL[bar][st];
      if (m >= 0) pluck(m, nextT, 0.5);
      if (st === 0 || st === 8) tone('sine', note(BAS[bar] + (st ? 7 : 0)), 0, 0.6, 0.45, nextT, bg);
      if (st === 4 || st === 12) noise(0.03, 0.12, 'bandpass', 2400, nextT, bg);
      if (st === 6 || st === 14) noise(0.02, 0.06, 'bandpass', 3600, nextT, bg);
      nextT += SPB; step++;
    }
  }

  window.DTA = {
    init: init,
    sfx: function (name, p) { if (ac && sndOn && S[name]) S[name](p); },
    snd: function () { return sndOn; },
    bgm: function () { return bgmOn; },
    setSnd: function (v) { sndOn = v; try { localStorage.setItem('daltteok.snd', v ? '1' : '0'); } catch (e) {} if (sg) sg.gain.value = v ? 0.9 : 0; },
    setBgm: function (v) { bgmOn = v; try { localStorage.setItem('daltteok.bgm', v ? '1' : '0'); } catch (e) {} if (bg) bg.gain.value = v ? 0.32 : 0; }
  };
})();
