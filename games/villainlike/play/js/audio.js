// 소리: 1호선 빌런 녹음 효과음(window.SFXDATA) + 코드 합성 + 8비트 뽕짝(빌런라이크 가락, 140bpm)
// file:// 에서도 돌아가게 녹음은 sfx.js 안의 base64 로 읽는다(fetch 없음)
window.SND = (function () {
  'use strict';
  var ac = null, master = null, sfxBus = null, bgmBus = null, buf = {};
  var sndOn = true, bgmOn = true, bgmTimer = null, nextT = 0, step = 0, onAir = false, duckV = 1;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  if (ls('villainlike.snd') === '0') sndOn = false;
  if (ls('villainlike.bgm') === '0') bgmOn = false;
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 1; master.connect(ac.destination);
    sfxBus = ac.createGain(); sfxBus.gain.value = sndOn ? 0.9 : 0; sfxBus.connect(master);
    bgmBus = ac.createGain(); bgmBus.gain.value = bgmOn ? 0.3 : 0; bgmBus.connect(master);
    var data = window.SFXDATA || {};
    Object.keys(data).forEach(function (k) {
      buf[k] = [];
      data[k].forEach(function (b64) {
        try { var bin = atob(b64), arr = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); ac.decodeAudioData(arr.buffer, function (b) { buf[k].push(b); }, function () {}); } catch (e) {}
      });
    });
  }
  var lastAt = {};
  function smp(name, vol, rate, gap) {
    if (!ac || !sndOn) return null; var l = buf[name]; if (!l || !l.length) return null;
    var n = ac.currentTime; if (gap && lastAt[name] && n - lastAt[name] < gap) return null; lastAt[name] = n;
    var s = ac.createBufferSource(); s.buffer = l[(Math.random() * l.length) | 0];
    s.playbackRate.value = rate || (0.94 + Math.random() * 0.12);
    var g = ac.createGain(); g.gain.value = vol == null ? 1 : vol; s.connect(g); g.connect(sfxBus); s.start(); return s;
  }
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  // 짧은 음(효과음). 밝기 2kHz 아래(편한 효과음 규칙)
  function tone(t, m, dur, vol, type, bus, slideTo) {
    var o = ac.createOscillator(); o.type = type || 'triangle'; o.frequency.setValueAtTime(mtof(m), t);
    if (slideTo) o.frequency.linearRampToValueAtTime(mtof(slideTo), t + dur);
    var f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1900;
    var g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.setValueAtTime(vol, t + dur * 0.55); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(bus || sfxBus); o.start(t); o.stop(t + dur + 0.02);
  }
  var noiseB = null;
  function noise(t, vol, len, hp, bus) {
    if (!noiseB) { noiseB = ac.createBuffer(1, ac.sampleRate * 0.6, ac.sampleRate); var d = noiseB.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    var s = ac.createBufferSource(); s.buffer = noiseB; var f = ac.createBiquadFilter(); f.type = hp ? 'highpass' : 'lowpass'; f.frequency.value = hp || 900;
    var g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0005, t + len);
    s.connect(f); f.connect(g); g.connect(bus || sfxBus); s.start(t); s.stop(t + Math.min(0.58, len + 0.02));
  }
  var gapAt = {};
  function gap(k, s) { var n = ac.currentTime; if (gapAt[k] && n - gapAt[k] < s) return false; gapAt[k] = n; return true; }
  function ok() { return ac && sndOn; }
  var api = {
    get on() { return sndOn; }, get bgmOn() { return bgmOn; },
    unlock: function () { init(); },
    blip: function () { smp('click', 0.7, 1, 0.04); },
    back: function () { if (!ok()) return; var t = ac.currentTime; tone(t, 72, 0.07, 0.06, 'square'); tone(t + 0.07, 67, 0.09, 0.05, 'square'); },
    whistle: function () { if (!ok() || !gap('wh', 0.14)) return; var t = ac.currentTime; tone(t, 79, 0.1, 0.045, 'square'); tone(t + 0.02, 80, 0.08, 0.03, 'square'); },
    slash: function () { if (!ok() || !gap('sl', 0.07)) return; noise(ac.currentTime, 0.2, 0.1, 1200); },
    shoot: function () { smp('throw', 0.3, null, 0.06); },
    cuff: function () { smp('cuff', 0.45, null, 0.08); },
    mop: function () { smp('gas', 0.3, 1.3, 0.25); },
    stamp: function () { smp('bang', 0.5, 1.2, 0.08); },
    card: function () { smp('beep', 0.25, 1.4, 0.12); },
    punch: function () { if (!ok() || !gap('pu', 0.06)) return; noise(ac.currentTime, 0.18, 0.06, 0); tone(ac.currentTime, 48, 0.06, 0.08, 'sine'); },
    fence: function () { smp('door', 0.5, 1.15, 0.1); },
    speaker: function () { if (!ok()) return; var t = ac.currentTime; tone(t, 79, 0.2, 0.04, 'sine'); tone(t + 0.16, 76, 0.2, 0.04, 'sine'); tone(t + 0.32, 72, 0.3, 0.04, 'sine'); },
    hit: function () { if (!ok() || !gap('hit', 0.045)) return; noise(ac.currentTime, 0.14, 0.05, 1600); },
    catch: function () { smp('coin', 0.22, 1.3, 0.06); },
    gem: function () { if (!ok() || !gap('gm', 0.035)) return; api._gn = ((api._gn || 0) + 1) % 8; tone(ac.currentTime, 79 + [0, 2, 4, 5, 7, 9, 11, 12][api._gn], 0.05, 0.035, 'square'); },
    hurt: function () { if (!ok()) return; smp('no', 0.45, 1, 0.15); tone(ac.currentTime, 52, 0.16, 0.07, 'sawtooth', null, 44); },
    levelup: function () { if (!ok()) return; var t = ac.currentTime; [72, 76, 79, 84, 88].forEach(function (m, i) { tone(t + i * 0.07, m, 0.2, 0.06, 'triangle'); }); smp('coin', 0.4, 1.3); },
    gold: function () { if (!ok()) return; var t = ac.currentTime; [72, 76, 79, 84, 88, 91].forEach(function (m, i) { tone(t + i * 0.06, m, 0.24, 0.06, 'triangle'); }); smp('clear', 0.5, 1.3); },
    boom: function () { if (!ok()) return; smp('bang', 0.8, 0.8, 0.08); noise(ac.currentTime, 0.3, 0.4, 0); },
    roar: function () { smp('siren', 0.55, 1, 0.5); },
    bossdown: function () { smp('cuff', 1, 0.8); smp('clear', 0.6); },
    horn: function (pwr) {
      if (!ok()) return; var t = ac.currentTime, v = 0.06 + pwr * 0.05;
      tone(t, 58, 0.9, v, 'sawtooth'); tone(t, 62, 0.9, v * 0.8, 'sawtooth'); tone(t, 65, 0.9, v * 0.6, 'square');
      for (var i = 0; i < 6; i++) noise(t + 0.15 + i * 0.11, 0.22, 0.08, 0);
      noise(t, 0.12, 0.9, 2400);
    },
    charge: function (u) { if (!ok() || !gap('ch', 0.09)) return; tone(ac.currentTime, 55 + Math.round(u * 24), 0.08, 0.03, 'square'); },
    bell: function () { if (!ok()) return; var t = ac.currentTime; tone(t, 79, 0.28, 0.07, 'sine'); tone(t + 0.22, 76, 0.28, 0.07, 'sine'); tone(t + 0.44, 72, 0.5, 0.07, 'sine'); },
    cheer: function () { smp('clear', 0.8, 1); },
    fail: function () { smp('fail', 0.8, 1); },
    coo: function () { if (!ok() || !gap('co', 0.6)) return; var t = ac.currentTime; tone(t, 55, 0.18, 0.06, 'sine'); tone(t + 0.2, 53, 0.22, 0.05, 'sine'); },
    toggleSfx: function () { sndOn = !sndOn; ls('villainlike.snd', sndOn ? '1' : '0'); if (sfxBus) sfxBus.gain.value = sndOn ? 0.9 : 0; if (sndOn) api.blip(); return sndOn; },
    toggleBgm: function () { bgmOn = !bgmOn; ls('villainlike.bgm', bgmOn ? '1' : '0'); if (bgmBus) bgmBus.gain.value = bgmOn ? 0.3 * duckV : 0; if (bgmOn) api.bgm(true); else api.bgm(false); return bgmOn; },
    bgm: function (play) {
      if (play === false) { onAir = false; if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; } return; }
      init(); if (!bgmOn || !ac || onAir) return;
      onAir = true; nextT = ac.currentTime + 0.1; step = 0; bgmTimer = setInterval(sched, 110); sched();
    },
    duck: function (v) { duckV = v ? 0.35 : 1; if (bgmBus && bgmOn) bgmBus.gain.setTargetAtTime(0.3 * duckV, ac.currentTime, 0.1); },
    boss: function (v) { api._boss = !!v; }
  };
  // 배경음: 8비트 뽕짝(쿵짝 2박), Dm-Dm-Gm-A7 / Dm-Bb-A7-Dm. 보스가 있으면 반음 위 + 하이햇 촘촘
  function note(t, m, dur, vol, type) {
    var o = ac.createOscillator(); o.type = type || 'square'; o.frequency.value = mtof(m);
    var g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.005); g.gain.setValueAtTime(vol, t + dur * 0.6); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bgmBus); o.start(t); o.stop(t + dur + 0.02);
  }
  var CH = [[62, 65, 69], [62, 65, 69], [67, 70, 74], [69, 73, 76], [62, 65, 69], [70, 74, 77], [69, 73, 76], [62, 65, 69]];
  var LEAD = [
    74, 0, 77, 0, 76, 74, 72, 74,  69, 0, 0, 72, 74, 0, 0, 0,
    79, 0, 77, 76, 74, 0, 70, 74,  73, 0, 76, 0, 69, 0, 0, 0,
    74, 0, 77, 79, 81, 0, 79, 77,  77, 0, 74, 0, 70, 0, 74, 77,
    76, 0, 73, 76, 79, 77, 76, 73,  74, 0, 0, 0, 62, 0, 0, 0];
  function sched() {
    if (!ac || !onAir) return;
    var boss = api._boss, up = boss ? 1 : 0, e8 = 60 / 140 / 2;
    while (nextT < ac.currentTime + 0.4) {
      var s8 = step % 8, bar = (step >> 3) % 8, ch = CH[bar];
      if (s8 % 4 === 0) note(nextT, ch[0] - 24 + up + (s8 === 4 ? 7 : 0), e8 * 1.6, 0.09, 'square');
      if (s8 % 4 === 2) { note(nextT, ch[1] + up, e8 * 0.7, 0.025, 'square'); note(nextT, ch[2] + up, e8 * 0.7, 0.025, 'square'); noise(nextT, 0.07, 0.05, 5000, bgmBus); }
      if (s8 % 4 === 0) noise(nextT, 0.12, 0.08, 0, bgmBus);
      if (boss && s8 % 2 === 1) noise(nextT, 0.04, 0.03, 6000, bgmBus);
      var ln = LEAD[step % 64];
      if (ln) { note(nextT, ln + up, e8 * 1.7, 0.035, 'triangle'); note(nextT, ln + 12 + up, e8 * 0.5, 0.008, 'square'); }
      nextT += e8; step++;
    }
  }
  return api;
})();
