// 소리: 녹음 효과음(window.SFXDATA, base64 mp3) + 코드 배경음(볼링 틀: 스케줄러 + 킥·햇·스네어 + 옥타브 베이스 + 가끔 가락)
(function () {
  'use strict';
  var ac = null, master = null, sfxBus = null, bgmBus = null, buf = {}, nb = null;
  var sndOn = true, bgmOn = true, bgmTimer = null, nextT = 0, step = 0, paused = false;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  if (ls('2048.snd') === '0') sndOn = false;
  if (ls('2048.bgm') === '0') bgmOn = false;
  if (/[?&]mute=1/.test(location.search)) { sndOn = false; bgmOn = false; }

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 1; master.connect(ac.destination);
    sfxBus = ac.createGain(); sfxBus.gain.value = sndOn ? 0.9 : 0; sfxBus.connect(master);
    bgmBus = ac.createGain(); bgmBus.gain.value = bgmOn ? 0.42 : 0; bgmBus.connect(master);
    nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    var d = nb.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    var data = window.SFXDATA || {};
    Object.keys(data).forEach(function (k) {
      buf[k] = [];
      (Array.isArray(data[k]) ? data[k] : [data[k]]).forEach(function (b64) {
        try {
          var bin = atob(b64), arr = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          ac.decodeAudioData(arr.buffer, function (b) { buf[k].push(b); }, function () {});
        } catch (e) {}
      });
    });
    if (bgmOn) startBgm();
  }
  function smp(name, vol, rate, when) {
    var l = buf[name];
    if (!l || !l.length) return false;
    var s = ac.createBufferSource(); s.buffer = l[(Math.random() * l.length) | 0];
    s.playbackRate.value = rate || (0.95 + Math.random() * 0.1);
    var g = ac.createGain(); g.gain.value = vol == null ? 1 : vol;
    s.connect(g); g.connect(sfxBus); s.start(when || 0);
    return true;
  }
  function tone(t, f, dur, vol, type, out) {
    var o = ac.createOscillator(); o.type = type || 'sine'; o.frequency.value = f;
    var g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out || sfxBus); o.start(t); o.stop(t + dur + 0.05);
  }
  var SFX = {
    slide: function () { smp('clk', 0.22, 0.62 + Math.random() * 0.06); },
    merge: function (lv) { // lv = log2(값)
      smp('clk', 0.6, Math.min(1.5, 0.72 + lv * 0.05));
      if (lv >= 7) { var t = ac.currentTime + 0.04; tone(t, 523.25 * Math.pow(2, (lv - 7) / 12 * 2), 0.5, 0.05, 'sine'); tone(t + 0.07, 784 * Math.pow(2, (lv - 7) / 12 * 2), 0.6, 0.04, 'sine'); }
    },
    tap: function () { smp('clk', 0.7); },
    spawn: function () {},
    bad: function () { smp('clk', 0.18, 0.5); },
    clear: function () {
      var t = ac.currentTime;
      for (var i = 0; i < 5; i++) smp('pop', 0.6, 0.9 + i * 0.12, t + i * 0.09);
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (f, i) { tone(t + 0.3 + i * 0.09, f, 0.9, 0.07, 'sine'); tone(t + 0.3 + i * 0.09, f * 2, 0.5, 0.02, 'triangle'); });
    },
    over: function () { var t = ac.currentTime; [392, 349.23, 311.13, 261.63].forEach(function (f, i) { tone(t + i * 0.17, f, 0.4, 0.07, 'triangle'); }); }
  };

  // 배경음: 100bpm, F - C - Dm - Bb, 부드러운 킥·셰이커·스네어 + 옥타브 뛰는 둥근 베이스 + 마림바 화음 + 칼림바 가락(2번째 4마디마다)
  var BPM = 100, S16 = 60 / BPM / 4;
  var PROG = [[41, 57, 60, 65], [36, 55, 60, 64], [38, 57, 62, 65], [34, 58, 62, 65]];
  var LEAD = [72, -1, 77, -1, 76, 74, 72, -1, 69, -1, 72, -1, 74, -1, -1, -1];
  var LEAD2 = [76, -1, 74, -1, 72, -1, 69, 72, 74, -1, 72, -1, 67, -1, -1, -1];
  function mf(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function mNote(f, t, dur, type, vol, cut) {
    var o = ac.createOscillator(), g = ac.createGain(), fl = ac.createBiquadFilter();
    o.type = type; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = cut || 1800;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(fl); fl.connect(g); g.connect(bgmBus); o.start(t); o.stop(t + dur + 0.05);
  }
  function mNoise(t, dur, vol, type, f) {
    var s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = nb; fl.type = type; fl.frequency.value = f;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(bgmBus); s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }
  function marimba(m, t, vol) {
    var f = mf(m);
    mNote(f, t, 0.5, 'sine', vol, 4000);
    mNote(f * 4, t, 0.08, 'sine', vol * 0.35, 6000);
  }
  function tick() {
    if (!ac) return;
    while (nextT < ac.currentTime + 0.2) {
      var t = nextT, s = step % 16, bar = Math.floor(step / 16) % 4, ch = PROG[bar];
      if (bgmOn && !paused) {
        if (s % 8 === 0) { var o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.12); g.gain.setValueAtTime(0.55, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.connect(g); g.connect(bgmBus); o.start(t); o.stop(t + 0.22); }
        if (s % 2 === 1) mNoise(t, 0.05, s % 4 === 3 ? 0.16 : 0.08, 'highpass', 8000);
        if (s === 4 || s === 12) mNoise(t, 0.12, 0.2, 'bandpass', 2200);
        if (s % 2 === 0) mNote(mf(ch[0] + (s % 4 === 2 ? 12 : 0)), t, S16 * 1.6, 'triangle', 0.2, 900);
        if (s === 2 || s === 6 || s === 10 || s === 14) for (var k = 1; k < 4; k++) marimba(ch[k], t + k * 0.012, 0.045);
        var phrase = Math.floor(step / 64) % 4;
        var LL = phrase === 1 ? LEAD : phrase === 3 ? LEAD2 : null;
        if (LL && LL[s] > 0) { mNote(mf(LL[s] + (bar === 3 ? -2 : 0)), t, S16 * 3, 'sine', 0.07, 5000); mNote(mf(LL[s] + 12), t, 0.09, 'sine', 0.02, 7000); }
      }
      nextT += S16; step++;
    }
  }
  function startBgm() { if (!ac || bgmTimer) return; nextT = ac.currentTime + 0.1; step = 0; bgmTimer = setInterval(tick, 50); }
  function stopBgm() { if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; } }

  window.AU = {
    init: init,
    play: function (n, a) { if (!ac || !sndOn || !SFX[n]) return; try { SFX[n](a); } catch (e) {} },
    pause: function (v) { paused = v; },
    snd: function (v) { if (v === undefined) return sndOn; sndOn = v; ls('2048.snd', v ? '1' : '0'); if (sfxBus) sfxBus.gain.value = v ? 0.9 : 0; },
    bgm: function (v) {
      if (v === undefined) return bgmOn; bgmOn = v; ls('2048.bgm', v ? '1' : '0');
      if (bgmBus) bgmBus.gain.value = v ? 0.42 : 0;
      if (v) startBgm(); else stopBgm();
    }
  };
})();
