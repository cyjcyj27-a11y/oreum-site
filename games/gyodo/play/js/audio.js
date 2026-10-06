// 소리: 녹음 효과음(window.SFXDATA, base64 mp3) + 코드 음악(8비트 사각파 행진)
(function () {
  'use strict';
  var ac = null, master = null, sfxBus = null, bgmBus = null, buf = {};
  var sndOn = true, bgmOn = true, bgmTimer = null, nextT = 0, step = 0;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  if (ls('gyodo.snd') === '0') sndOn = false;
  if (ls('gyodo.bgm') === '0') bgmOn = false;
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 1; master.connect(ac.destination);
    sfxBus = ac.createGain(); sfxBus.gain.value = sndOn ? 0.9 : 0; sfxBus.connect(master);
    bgmBus = ac.createGain(); bgmBus.gain.value = bgmOn ? 0.32 : 0; bgmBus.connect(master);
    var data = window.SFXDATA || {};
    Object.keys(data).forEach(function (k) {
      buf[k] = [];
      data[k].forEach(function (b64) {
        try { var bin = atob(b64), arr = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); ac.decodeAudioData(arr.buffer, function (b) { buf[k].push(b); }, function () {}); } catch (e) {}
      });
    });
    if (bgmOn) startBgm();
  }
  var lastAt = {};
  function smp(name, vol, rate, gap) {
    var l = buf[name]; if (!l || !l.length) return null;
    var n = ac.currentTime; if (gap && lastAt[name] && n - lastAt[name] < gap) return null; lastAt[name] = n;
    var s = ac.createBufferSource(); s.buffer = l[(Math.random() * l.length) | 0];
    s.playbackRate.value = rate || (0.94 + Math.random() * 0.12);
    var g = ac.createGain(); g.gain.value = vol == null ? 1 : vol; s.connect(g); g.connect(sfxBus); s.start(); return s;
  }
  var SFX = {
    click: function () { smp('click', 0.7, 1, 0.04); },
    build: function () { smp('build', 0.7, null, 0.05); },
    door: function () { smp('door', 0.75, null, 0.05); },
    no: function () { smp('no', 0.5, 1, 0.12); },
    sell: function () { smp('coin', 0.6); },
    throw: function () { smp('throw', 0.35, null, 0.06); },
    cuff: function () { smp('cuff', 0.75, null, 0.05); smp('coin', 0.3, 1.2, 0.08); },
    bossdown: function () { smp('cuff', 1, 0.8); smp('clear', 0.6); },
    smoke: function () { smp('smoke', 0.8); },
    siren: function () { smp('siren', 0.7, 1, 0.5); },
    bang: function () { smp('bang', 0.8, null, 0.1); },
    break: function () { smp('break', 0.9); },
    bark: function () { smp('bark', 0.55, null, 0.15); },
    pop: function () { smp('pop', 0.5, null, 0.08); },
    gas: function () { smp('gas', 0.45, null, 0.1); },
    whistle: function () { smp('whistle', 0.7, 1); },
    bell: function () { smp('bell', 0.55, 1); },
    beep: function () { smp('beep', 0.5, 1, 0.2); },
    clear: function () { smp('clear', 0.8, 1); },
    fail: function () { smp('fail', 0.8, 1); }
  };
  // 배경음: 132bpm 단조 행진. 사각파 베이스 + 펄스 아르페지오 + 잡음 북. 소등(밤)엔 느리게 깔림
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function note(t, m, dur, vol, type, duty) {
    var o = ac.createOscillator(); o.type = type || 'square'; o.frequency.value = mtof(m);
    var g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.005); g.gain.setValueAtTime(vol, t + dur * 0.6); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bgmBus); o.start(t); o.stop(t + dur + 0.02);
  }
  var noiseB = null;
  function hat(t, vol, len) {
    if (!noiseB) { noiseB = ac.createBuffer(1, ac.sampleRate * 0.2, ac.sampleRate); var d = noiseB.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    var s = ac.createBufferSource(); s.buffer = noiseB; var f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = len > 0.06 ? 900 : 6000;
    var g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0005, t + len);
    s.connect(f); f.connect(g); g.connect(bgmBus); s.start(t); s.stop(t + len + 0.02);
  }
  // Am - F - G - E (8마디 반복)
  var CH = [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 56, 59]];
  var LEAD = [76, 0, 74, 72, 71, 0, 72, 74, 72, 0, 69, 0, 71, 72, 74, 0, 74, 0, 72, 71, 72, 0, 74, 76, 71, 0, 68, 0, 71, 0, 0, 0];
  function sched() {
    if (!ac) return;
    var night = window.G && G.night, beat = 60 / (night ? 96 : 132);
    while (nextT < ac.currentTime + 0.4) {
      var s16 = step % 16, bar = (step >> 4) % 4, ch = CH[bar];
      if (s16 % 4 === 0) note(nextT, ch[0] - 24, beat * 0.9, 0.09, 'square');
      if (s16 % 4 === 2) note(nextT, ch[0] - 12, beat * 0.45, 0.06, 'square');
      if (!night) note(nextT, ch[(s16 >> 1) % 3] + 12, beat * 0.22, 0.022, 'square');
      if (s16 % 8 === 4) hat(nextT, 0.16, 0.12); else if (s16 % 2 === 0 && !night) hat(nextT, 0.05, 0.03);
      var ln = LEAD[(step >> 1) % 32];
      if (step % 2 === 0 && ln && !night) note(nextT, ln, beat * 0.9, 0.035, 'triangle');
      if (night && s16 === 0) note(nextT, ch[1] + 12, beat * 3.5, 0.03, 'triangle');
      nextT += beat / 2; step++;
    }
  }
  function startBgm() { if (!ac || bgmTimer) return; nextT = ac.currentTime + 0.1; step = 0; bgmTimer = setInterval(sched, 120); sched(); }
  function stopBgm() { if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; } }
  window.AU = {
    init: init,
    play: function (n, a) { if (!ac || !sndOn || !SFX[n]) return; try { SFX[n](a); } catch (e) {} },
    snd: function (v) { if (v === undefined) return sndOn; sndOn = v; ls('gyodo.snd', v ? '1' : '0'); if (sfxBus) sfxBus.gain.value = v ? 0.9 : 0; },
    bgm: function (v) { if (v === undefined) return bgmOn; bgmOn = v; ls('gyodo.bgm', v ? '1' : '0'); if (bgmBus) bgmBus.gain.value = v ? 0.32 : 0; if (v) startBgm(); else stopBgm(); }
  };
})();