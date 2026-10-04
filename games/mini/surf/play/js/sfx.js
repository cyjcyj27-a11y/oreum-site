/* 소리: 단추·조개·미션·아이템은 Web Audio 합성, 파도·물보라·부딪힘·갈매기·돌고래는 Pixabay 녹음(js/sfxdata.js, tools/sfx_make.py) */
(function () {
  'use strict';
  var AC = null, master, gSfx, gBgm, gAmb, ambOn = false, bgmOn = false, bgmTimer = null;
  var S = { snd: true, bgm: true };
  try { S.snd = localStorage.getItem('surf.snd') !== '0'; S.bgm = localStorage.getItem('surf.bgm') !== '0'; } catch (e) {}
  function ctx() {
    if (AC) { if (AC.state === 'suspended') AC.resume(); return AC; }
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = 0.9; master.connect(AC.destination);
    gSfx = AC.createGain(); gSfx.gain.value = S.snd ? 1 : 0; gSfx.connect(master);
    gBgm = AC.createGain(); gBgm.gain.value = S.bgm ? 0.5 : 0; gBgm.connect(master);
    gAmb = AC.createGain(); gAmb.gain.value = S.snd ? 0.5 : 0; gAmb.connect(master);
    var D = window.SFXDATA || {};
    Object.keys(D).forEach(function (k) { var bin = atob(D[k]), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); AC.decodeAudioData(u.buffer).then(function (b) { BUF[k] = b; }).catch(function () {}); });
    return AC;
  }
  var BUF = {};
  function smp(name, vol, rate, dest) { var b = BUF[name]; if (!b) return false; var c = ctx(), s = c.createBufferSource(), g = c.createGain(); s.buffer = b; s.playbackRate.value = (rate || 1) * (0.95 + Math.random() * 0.1); g.gain.value = vol == null ? 1 : vol; s.connect(g); g.connect(dest || gSfx); s.start(); return true; }
  function osc(type, f0, f1, t0, dur, vol, dest) {
    var c = ctx(), o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || gSfx); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  var noiseBuf = null;
  function noise(dur, t0, vol, fLo, fHi, dest) {
    var c = ctx();
    if (!noiseBuf) { noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    var s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    var g = c.createGain(), hp = c.createBiquadFilter(), lp = c.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = fLo || 200; lp.type = 'lowpass'; lp.frequency.value = fHi || 4000;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(dest || gSfx); s.start(t0); s.stop(t0 + dur + 0.05);
    return { g: g, lp: lp, hp: hp };
  }
  var SFX = {
    state: S, _buf: BUF,
    unlock: function () { ctx(); SFX.ambient(true); if (S.bgm) SFX.bgm(true); },
    setSnd: function (on) { S.snd = on; try { localStorage.setItem('surf.snd', on ? '1' : '0'); } catch (e) {} if (AC) { gSfx.gain.value = on ? 1 : 0; gAmb.gain.value = on ? 0.5 : 0; } },
    setBgm: function (on) { S.bgm = on; try { localStorage.setItem('surf.bgm', on ? '1' : '0'); } catch (e) {} if (AC) { gBgm.gain.value = on ? 0.5 : 0; if (on) SFX.bgm(true); } },
    click: function () { var t = ctx().currentTime; osc('triangle', 520, 380, t, 0.08, 0.25); noise(0.05, t, 0.12, 1500, 6000); },
    swoosh: function () { if (smp('swoosh', 0.5, 1.15)) return; var t = ctx().currentTime; noise(0.18, t, 0.22, 600, 3000); },
    shell: function (n) { var t = ctx().currentTime, f = 880 * Math.pow(1.06, (n || 0) % 8); osc('sine', f, f * 1.5, t, 0.14, 0.22); osc('sine', f * 2, f * 2, t + 0.03, 0.1, 0.08); },
    jump: function () { if (smp('spray', 0.55, 1.2)) return; var t = ctx().currentTime; noise(0.3, t, 0.28, 300, 2500); osc('sine', 200, 420, t, 0.18, 0.12); },
    land: function () { if (smp('land', 0.7)) return; var t = ctx().currentTime; noise(0.22, t, 0.35, 150, 1800); },
    gull: function () { smp('gull', 0.45, 1 + Math.random() * 0.15); },
    duck: function () { if (smp('duck', 0.8)) return; var t = ctx().currentTime; noise(0.35, t, 0.3, 100, 900); osc('sine', 160, 90, t, 0.25, 0.14); },
    hit: function () { if (smp('hit', 0.9)) { smp('land', 0.5, 0.9); return; } var t = ctx().currentTime; osc('square', 140, 60, t, 0.16, 0.3); noise(0.25, t, 0.4, 100, 1200); },
    wipeout: function () { if (smp('wipe', 1)) { smp('hit', 0.6, 0.8); return; } var t = ctx().currentTime; noise(1.4, t, 0.6, 80, 2500); osc('sawtooth', 220, 40, t, 0.5, 0.2); },
    close: function () { var t = ctx().currentTime; osc('sine', 660, 990, t, 0.1, 0.2); },
    mission: function () { var t = ctx().currentTime; [523, 659, 784, 1046].forEach(function (f, i) { osc('triangle', f, f, t + i * 0.09, 0.22, 0.22); }); },
    dolphin: function () { if (smp('dolphin', 0.6)) return; var t = ctx().currentTime; for (var i = 0; i < 4; i++) osc('sine', 1800 + i * 200, 2600 + i * 200, t + i * 0.08, 0.07, 0.14); },
    power: function () { var t = ctx().currentTime; osc('sine', 400, 1200, t, 0.3, 0.2); osc('sine', 600, 1800, t + 0.05, 0.3, 0.12); },
    spot: function () { var t = ctx().currentTime; [392, 523, 659].forEach(function (f, i) { osc('triangle', f, f, t + i * 0.12, 0.3, 0.2); }); },
    danger: function () { if (smp('crash', 0.8)) return; var t = ctx().currentTime; noise(0.6, t, 0.3, 60, 700); },
    ambient: function (on) {
      if (on === ambOn) return; ambOn = on; if (!on) return;
      var c = ctx(), t = c.currentTime;
      if (BUF.ocean) { var s = c.createBufferSource(); s.buffer = BUF.ocean; s.loop = true; var og = c.createGain(); og.gain.value = 0.9; s.connect(og); og.connect(gAmb); s.start(t); return; }
      setTimeout(function () { if (BUF.ocean && ambOn) { ambOn = false; SFX.ambient(true); } }, 1500);
      var a = noise(1e9, t, 0.5, 60, 900, gAmb);
      var lfo = c.createOscillator(), lg = c.createGain(); lfo.type = 'sine'; lfo.frequency.value = 0.09; lg.gain.value = 0.22;
      lfo.connect(lg); lg.connect(a.g.gain); lfo.start(t);
      var lfo2 = c.createOscillator(), lg2 = c.createGain(); lfo2.frequency.value = 0.13; lg2.gain.value = 350; lfo2.connect(lg2); lg2.connect(a.lp.frequency); lfo2.start(t);
    },
    /* 배경음은 js/music.js (여름 바다 118bpm, 볼링 틀) */
    bgm: function (on) {
      if (!window.SURFMUSIC) return;
      if (!on) { bgmOn = false; SURFMUSIC.stop(); return; }
      if (bgmOn) return; bgmOn = true; SURFMUSIC.start(ctx(), gBgm);
    }
  };
  window.SFX = SFX;
})();