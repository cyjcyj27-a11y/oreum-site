// 소리: 녹음 효과음(window.SFXDATA, base64 mp3) + 없으면 합성 대체 + 잔잔한 코드 음악
(function () {
  'use strict';
  var ac = null, master = null, sfxBus = null, bgmBus = null;
  var buf = {};
  var sndOn = true, bgmOn = true, bgmTimer = null, nextT = 0, step = 0;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  if (ls('sudoku.snd') === '0') sndOn = false;
  if (ls('sudoku.bgm') === '0') bgmOn = false;

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 1; master.connect(ac.destination);
    sfxBus = ac.createGain(); sfxBus.gain.value = sndOn ? 0.9 : 0; sfxBus.connect(master);
    bgmBus = ac.createGain(); bgmBus.gain.value = bgmOn ? 0.5 : 0; bgmBus.connect(master);
    var data = window.SFXDATA || {};
    Object.keys(data).forEach(function (k) {
      var list = Array.isArray(data[k]) ? data[k] : [data[k]];
      buf[k] = [];
      list.forEach(function (b64) {
        try {
          var bin = atob(b64), arr = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          ac.decodeAudioData(arr.buffer, function (b) { buf[k].push(b); }, function () {});
        } catch (e) {}
      });
    });
    if (bgmOn) startBgm();
  }

  function smp(name, vol, rate) {
    var l = buf[name];
    if (!l || !l.length) return false;
    var s = ac.createBufferSource(); s.buffer = l[(Math.random() * l.length) | 0];
    s.playbackRate.value = rate || (0.94 + Math.random() * 0.12);
    var g = ac.createGain(); g.gain.value = vol == null ? 1 : vol;
    s.connect(g); g.connect(sfxBus); s.start();
    return true;
  }
  var noiseBuf = null;
  function noise() {
    if (noiseBuf) return noiseBuf;
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }
  function nz(t, dur, type, f, q, vol, out) {
    var s = ac.createBufferSource(); s.buffer = noise(); s.loop = true;
    var fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    var g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(fl); fl.connect(g); g.connect(out || sfxBus); s.start(t, Math.random()); s.stop(t + dur + 0.05);
    return fl;
  }
  function tone(t, f, dur, vol, type, out) {
    var o = ac.createOscillator(); o.type = type || 'sine'; o.frequency.value = f;
    var g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0006, t + dur);
    o.connect(g); g.connect(out || sfxBus); o.start(t); o.stop(t + dur + 0.05);
  }

  var SFX = {
    write: function () { if (smp('write', 0.9)) return; var t = ac.currentTime; for (var i = 0; i < 3; i++) nz(t + i * 0.045 + Math.random() * 0.01, 0.05, 'bandpass', 3200 + Math.random() * 1500, 2.5, 0.22); },
    memo: function () { if (smp('write', 0.45, 1.3)) return; nz(ac.currentTime, 0.04, 'bandpass', 4200, 3, 0.12); },
    erase: function () { if (smp('erase', 0.9)) return; var t = ac.currentTime; for (var i = 0; i < 4; i++) nz(t + i * 0.06, 0.07, 'lowpass', 1400, 0.7, 0.2); },
    tap: function () { if (smp('tap', 0.6)) return; tone(ac.currentTime, 1900, 0.03, 0.05, 'triangle'); },
    pick: function () { tone(ac.currentTime, 1400, 0.025, 0.03, 'triangle'); },
    bad: function () { var t = ac.currentTime; tone(t, 220, 0.12, 0.08, 'triangle'); tone(t + 0.07, 196, 0.14, 0.07, 'triangle'); },
    sweep: function (k) {
      if (!smp('sweep', 0.7)) { var t0 = ac.currentTime, f = nz(t0, 0.28, 'bandpass', 2600, 1.2, 0.16); f.frequency.linearRampToValueAtTime(5200, t0 + 0.25); }
      var t = ac.currentTime + 0.05, sc = [1046.5, 1174.7, 1318.5, 1568, 1760, 2093];
      tone(t, sc[Math.min(k || 0, 5)], 0.5, 0.06, 'sine'); tone(t + 0.08, sc[Math.min((k || 0) + 2, 5)], 0.6, 0.05, 'sine');
    },
    page: function () { if (smp('page', 0.7)) return; var t = ac.currentTime, f = nz(t, 0.22, 'bandpass', 1800, 0.8, 0.14); f.frequency.linearRampToValueAtTime(900, t + 0.2); },
    stamp: function () {
      if (!smp('stamp', 1)) { var t = ac.currentTime; tone(t, 90, 0.18, 0.5, 'sine'); nz(t, 0.09, 'lowpass', 900, 0.8, 0.35); }
      var t2 = ac.currentTime + 0.25, ar = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      ar.forEach(function (f, i) { tone(t2 + i * 0.09, f, 0.9, 0.07, 'sine'); tone(t2 + i * 0.09, f * 2, 0.5, 0.02, 'sine'); });
    }
  };

  // 잔잔한 코드 음악: 72bpm, Fmaj7 - Em7 - Dm7 - Cmaj7, 부드러운 전자 피아노 + 가끔 오음계 가락
  var CH = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];
  var PENTA = [72, 74, 76, 79, 81, 84];
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function ep(t, m, dur, vol) {
    var f = mtof(m);
    var o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    var mo = ac.createOscillator(); mo.frequency.value = f * 2; var mg = ac.createGain(); mg.gain.setValueAtTime(f * 0.9, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + 0.6);
    mo.connect(mg); mg.connect(o.frequency);
    var g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    o.connect(g); g.connect(bgmBus); o.start(t); mo.start(t); o.stop(t + dur + 0.1); mo.stop(t + dur + 0.1);
  }
  var BEAT = 60 / 72;
  function sched() {
    if (!ac) return;
    while (nextT < ac.currentTime + 0.6) {
      var bar = (step >> 3) % 4, s8 = step % 8, ch = CH[bar];
      if (s8 === 0) { ch.forEach(function (m, i) { ep(nextT + i * 0.03, m, BEAT * 3.6, 0.045); }); ep(nextT, ch[0] - 12, BEAT * 3.8, 0.06); }
      if (s8 === 4) { ep(nextT, ch[0] - 12 + 7, BEAT * 1.8, 0.035); }
      if ((s8 === 3 || s8 === 6) && Math.random() < 0.45) ep(nextT, PENTA[(Math.random() * PENTA.length) | 0], BEAT * 1.6, 0.03);
      nextT += BEAT / 2; step++;
    }
  }
  function startBgm() {
    if (!ac || bgmTimer) return;
    nextT = ac.currentTime + 0.1; step = 0;
    bgmTimer = setInterval(sched, 150); sched();
  }
  function stopBgm() { if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; } }

  window.AU = {
    init: init,
    play: function (n, a) { if (!ac || !sndOn || !SFX[n]) return; try { SFX[n](a); } catch (e) {} },
    snd: function (v) { if (v === undefined) return sndOn; sndOn = v; ls('sudoku.snd', v ? '1' : '0'); if (sfxBus) sfxBus.gain.value = v ? 0.9 : 0; },
    bgm: function (v) {
      if (v === undefined) return bgmOn; bgmOn = v; ls('sudoku.bgm', v ? '1' : '0');
      if (bgmBus) bgmBus.gain.value = v ? 0.5 : 0;
      if (v) startBgm(); else stopBgm();
    }
  };
})();
