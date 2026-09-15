/* 야옹 편대 — 소리. 전부 WebAudio 로 만든다(파일 없음). 음악은 한 번 미리 구워 반복 재생한다(끊김 방지). */
(function () {
  'use strict';
  var KEY = 'meowsquad';
  var ac = null, master = null, sfx = null, mus = null, nb = null;
  var snd = load('snd', true), bgm = load('bgm', true);
  var songs = {}, cur = null, curName = null, want = null, lastShoot = 0;

  function load(k, def) { try { var v = localStorage.getItem(KEY + '.' + k); return v === null ? def : v === '1'; } catch (e) { return def; } }
  function save(k, v) { try { localStorage.setItem(KEY + '.' + k, v ? '1' : '0'); } catch (e) {} }

  function ensure() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC({ latencyHint: 'playback' });
    master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
    sfx = ac.createGain(); sfx.gain.value = snd ? 1 : 0; sfx.connect(master);
    mus = ac.createGain(); mus.gain.value = bgm ? 0.55 : 0; mus.connect(master);
    bake('main'); bake('boss');
  }
  function noiseBuf(ctx) {
    var n = Math.floor(ctx.sampleRate * 1.2), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function tone(ctx, out, freq, type, t0, dur, vol, slideTo, attack) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + (attack || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function burst(ctx, out, buf, t0, dur, vol, freq, q, freqTo, type) {
    var s = ctx.createBufferSource(); s.buffer = buf;
    var f = ctx.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.setValueAtTime(freq, t0); f.Q.value = q || 1;
    if (freqTo) f.frequency.exponentialRampToValueAtTime(freqTo, t0 + dur);
    var g = ctx.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.05);
  }
  var mf = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };

  // ── 음악 굽기 ──
  function bake(name) {
    var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC) return;
    var boss = name === 'boss';
    var tempo = boss ? 156 : 138, beat = 60 / tempo, bars = 8, len = bars * 4 * beat, sr = 22050;
    var ctx = new OAC(1, Math.ceil(len * sr), sr);
    var out = ctx.createGain(); out.gain.value = 0.9; out.connect(ctx.destination);
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; lp.connect(out);
    var nbuf = noiseBuf(ctx);
    var prog = boss ? [[45, 'm'], [41, 'M'], [43, 'M'], [40, 'M'], [45, 'm'], [41, 'M'], [38, 'm'], [40, 'M']]
                    : [[48, 'M'], [43, 'M'], [45, 'm'], [41, 'M'], [48, 'M'], [43, 'M'], [41, 'M'], [43, 'M']];
    var mel = boss ? [0, 2, 1, 2, 3, 2, 1, 0] : [0, 1, 2, 3, 2, 1, 2, 0];
    for (var b = 0; b < bars; b++) {
      var root = prog[b][0], tri = prog[b][1] === 'm' ? [0, 3, 7, 12] : [0, 4, 7, 12], t0 = b * 4 * beat;
      // 베이스(8분)
      for (var e = 0; e < 8; e++) {
        var bn = root - 12 + (e % 4 === 2 ? 12 : 0) + (boss && e % 2 ? 7 : 0);
        tone(ctx, out, mf(bn), 'triangle', t0 + e * beat / 2, beat / 2 * 0.9, 0.3);
      }
      // 아르페지오(16분)
      for (var s = 0; s < 16; s++) tone(ctx, lp, mf(root + 12 + tri[[0, 1, 2, 3, 2, 1, 2, 1][s % 8]]), 'square', t0 + s * beat / 4, beat / 4 * 0.8, 0.035);
      // 멜로디
      var rhythm = boss ? [[0, 0.5], [0.5, 0.5], [1, 1], [2, 0.5], [2.5, 0.5], [3, 1]] : [[0, 1], [1, 0.5], [1.5, 0.5], [2, 1.5], [3.5, 0.5]];
      for (var r = 0; r < rhythm.length; r++) {
        var deg = tri[(mel[(b + r) % mel.length] + r) % 4] + (r === rhythm.length - 1 && b % 2 ? 2 : 0);
        tone(ctx, out, mf(root + 24 + deg), 'triangle', t0 + rhythm[r][0] * beat, rhythm[r][1] * beat * 0.95, 0.12, null, 0.01);
      }
      // 북
      for (var q = 0; q < 4; q++) {
        var tb = t0 + q * beat;
        if (q % 2 === 0 || boss) tone(ctx, out, 150, 'sine', tb, 0.14, 0.5, 42);
        if (q % 2 === 1) burst(ctx, out, nbuf, tb, 0.12, 0.22, 1800, 0.8);
        burst(ctx, out, nbuf, tb + beat / 2, 0.035, 0.07, 7000, 1, null, 'highpass');
        burst(ctx, out, nbuf, tb, 0.03, 0.05, 7000, 1, null, 'highpass');
      }
    }
    var p = ctx.startRendering();
    var done = function (buf) { songs[name] = buf; if (want === name) play(name); };
    if (p && p.then) p.then(done); else ctx.oncomplete = function (ev) { done(ev.renderedBuffer); };
  }
  function play(name) {
    want = name;
    if (!ac || !songs[name]) return;
    if (curName === name && cur) return;
    stopMusic();
    var s = ac.createBufferSource(); s.buffer = songs[name]; s.loop = true;
    s.connect(mus); s.start(ac.currentTime + 0.05);
    cur = s; curName = name;
  }
  function stopMusic() { if (cur) { try { cur.stop(); } catch (e) {} cur.disconnect(); } cur = null; curName = null; }

  function ok() { return ac && snd; }
  function N() { return nb || (nb = noiseBuf(ac)); }
  var T = function () { return ac.currentTime; };

  var A = {
    init: ensure,
    get snd() { return snd; }, get bgm() { return bgm; },
    toggleSnd: function () { snd = !snd; save('snd', snd); if (sfx) sfx.gain.value = snd ? 1 : 0; return snd; },
    toggleBgm: function () { bgm = !bgm; save('bgm', bgm); if (mus) mus.gain.value = bgm ? 0.55 : 0; return bgm; },
    setSnd: function (v) { snd = !!v; if (sfx) sfx.gain.value = snd ? 1 : 0; },
    setBgm: function (v) { bgm = !!v; if (mus) mus.gain.value = bgm ? 0.55 : 0; },
    music: play, stopMusic: function () { want = null; stopMusic(); },
    shoot: function () { if (!ok()) return; var t = T(); if (t - lastShoot < 0.07) return; lastShoot = t; tone(ac, sfx, 1250, 'triangle', t, 0.06, 0.045, 700); },
    hit: function () { if (!ok()) return; var t = T(); tone(ac, sfx, 420, 'square', t, 0.04, 0.05, 260); },
    boom: function (big) {
      if (!ok()) return; var t = T(), k = big ? 1.8 : 1;
      burst(ac, sfx, N(), t, 0.32 * k, 0.32, 1400, 0.7, 180);
      tone(ac, sfx, 150, 'sine', t, 0.28 * k, 0.32, 40);
      if (big) { burst(ac, sfx, N(), t + 0.12, 0.6, 0.25, 700, 0.6, 90); tone(ac, sfx, 90, 'sine', t + 0.1, 0.7, 0.35, 30); }
    },
    squeak: function () { if (!ok()) return; var t = T(); tone(ac, sfx, 1900, 'sine', t, 0.08, 0.07, 2600); tone(ac, sfx, 2400, 'sine', t + 0.07, 0.06, 0.05, 1800); },
    coin: function () { if (!ok()) return; var t = T(); tone(ac, sfx, 1320, 'triangle', t, 0.06, 0.1); tone(ac, sfx, 1980, 'triangle', t + 0.05, 0.12, 0.1); },
    fish: function () { if (!ok()) return; var t = T(); tone(ac, sfx, 880 + Math.random() * 200, 'sine', t, 0.08, 0.13, 1500); },
    power: function () { if (!ok()) return; var t = T(); [660, 880, 1100, 1320].forEach(function (f, i) { tone(ac, sfx, f, 'square', t + i * 0.05, 0.08, 0.05); }); },
    shield: function () { if (!ok()) return; var t = T(); tone(ac, sfx, 500, 'sine', t, 0.3, 0.14, 1200); },
    block: function () { if (!ok()) return; var t = T(); tone(ac, sfx, 1600, 'sine', t, 0.15, 0.12, 500); burst(ac, sfx, N(), t, 0.1, 0.12, 3000, 2); },
    rescue: function () {
      if (!ok()) return; var t = T();
      var o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine';
      o.frequency.setValueAtTime(620, t); o.frequency.linearRampToValueAtTime(980, t + 0.12); o.frequency.linearRampToValueAtTime(700, t + 0.38);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.18, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      o.connect(g); g.connect(sfx); o.start(t); o.stop(t + 0.45);
      [784, 988, 1175, 1568].forEach(function (f, i) { tone(ac, sfx, f, 'triangle', t + 0.4 + i * 0.07, 0.25, 0.1); });
    },
    bomb: function (lv) {
      if (!ok()) return; var t = T(), k = 1 + (lv || 0) * 0.15;
      burst(ac, sfx, N(), t, 0.25, 0.35, 3000, 0.6, 400);                       // 쉭
      tone(ac, sfx, 110, 'sine', t + 0.05, 1.1 * k, 0.5, 28);                   // 쿵
      burst(ac, sfx, N(), t + 0.05, 1.0 * k, 0.4, 900, 0.5, 60);                // 우르르
      [880, 1320, 1760].forEach(function (f, i) { tone(ac, sfx, f, 'triangle', t + 0.15 + i * 0.05, 0.5, 0.05); });
    },
    hurt: function () { if (!ok()) return; var t = T(); tone(ac, sfx, 320, 'square', t, 0.35, 0.1, 70); burst(ac, sfx, N(), t, 0.3, 0.25, 900, 0.8, 200); },
    lose: function () { if (!ok()) return; var t = T(); tone(ac, sfx, 180, 'sine', t, 0.25, 0.15, 900); },
    clear: function () { if (!ok()) return; var t = T(); [523, 659, 784, 1047, 784, 1047].forEach(function (f, i) { tone(ac, sfx, f, 'triangle', t + i * 0.1, i > 3 ? 0.4 : 0.14, 0.14); }); },
    warning: function () { if (!ok()) return; var t = T(); for (var i = 0; i < 6; i++) tone(ac, sfx, i % 2 ? 440 : 660, 'square', t + i * 0.22, 0.2, 0.06); },
    buy: function () { if (!ok()) return; var t = T(); [988, 1319, 1760].forEach(function (f, i) { tone(ac, sfx, f, 'triangle', t + i * 0.05, 0.12, 0.1); }); },
    nope: function () { if (!ok()) return; var t = T(); tone(ac, sfx, 200, 'square', t, 0.12, 0.06, 160); },
    click: function () { if (!ok()) return; var t = T(); tone(ac, sfx, 900, 'sine', t, 0.05, 0.08); },
    over: function () { if (!ok()) return; var t = T(); [523, 440, 349, 262].forEach(function (f, i) { tone(ac, sfx, f, 'triangle', t + i * 0.18, 0.3, 0.14); }); },
    fanfare: function () { if (!ok()) return; var t = T(); [523, 659, 784, 1047, 1319, 1568, 2093].forEach(function (f, i) { tone(ac, sfx, f, 'triangle', t + i * 0.12, 0.5, 0.13); }); }
  };
  window.MSAudio = A;
})();
