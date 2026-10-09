// 소리: 녹음 효과음(window.SFXDATA) + 코드로 만든 소리(문 열림 차임, 출발, 민원 전화) + 8비트 뽕짝 음악
(function () {
  'use strict';
  var ac = null, master = null, sfxBus = null, bgmBus = null, buf = {};
  var sndOn = true, bgmOn = true, bgmTimer = null, nextT = 0, step = 0;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  if (ls('line1.snd') === '0') sndOn = false;
  if (ls('line1.bgm') === '0') bgmOn = false;
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
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  // 짧은 음(효과음용). 밝기 2kHz 아래로(편한 효과음 규칙)
  function tone(t, m, dur, vol, type, bus) {
    var o = ac.createOscillator(); o.type = type || 'triangle'; o.frequency.value = mtof(m);
    var f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1900;
    var g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.setValueAtTime(vol, t + dur * 0.55); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(bus || sfxBus); o.start(t); o.stop(t + dur + 0.02);
  }
  var noiseB = null;
  function noise(t, vol, len, hp, bus) {
    if (!noiseB) { noiseB = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate); var d = noiseB.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    var s = ac.createBufferSource(); s.buffer = noiseB; var f = ac.createBiquadFilter(); f.type = hp ? 'highpass' : 'lowpass'; f.frequency.value = hp || 900;
    var g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0005, t + len);
    s.connect(f); f.connect(g); g.connect(bus || sfxBus); s.start(t); s.stop(t + len + 0.02);
  }
  var gapAt = {};
  function gap(k, s) { var n = ac.currentTime; if (gapAt[k] && n - gapAt[k] < s) return false; gapAt[k] = n; return true; }
  var SFX = {
    click: function () { smp('click', 0.7, 1, 0.04); },
    build: function () { smp('build', 0.7, null, 0.05); },
    fence: function () { smp('door', 0.7, 1.15, 0.05); },
    no: function () { smp('no', 0.5, 1, 0.12); },
    sell: function () { smp('coin', 0.6); },
    throw: function () { smp('throw', 0.35, null, 0.06); },
    whistle: function () { if (!gap('wh', 0.12)) return; var t = ac.currentTime; tone(t, 79, 0.09, 0.05, 'square'); tone(t + 0.02, 80, 0.07, 0.03, 'square'); },
    swish: function () { if (!gap('sw', 0.08)) return; noise(ac.currentTime, 0.18, 0.09, 1200); },
    grab: function () { smp('cuff', 0.6, 0.85, 0.06); },
    splash: function () { if (!gap('sp', 0.1)) return; noise(ac.currentTime, 0.12, 0.12, 700); },
    mop: function () { smp('gas', 0.4, 1.3, 0.1); },
    cuff: function () { smp('cuff', 0.75, null, 0.05); smp('coin', 0.3, 1.2, 0.08); },
    bossdown: function () { smp('cuff', 1, 0.8); smp('clear', 0.6); },
    bang: function () { smp('bang', 0.8, null, 0.1); },
    break: function () { smp('break', 0.9); },
    danso: function () { if (!gap('dn', 0.2)) return; var t = ac.currentTime; tone(t, 74, 0.12, 0.08, 'triangle'); tone(t + 0.06, 81, 0.1, 0.06, 'triangle'); smp('bang', 0.4, 1.6); },
    coo: function () { if (!gap('co', 0.4)) return; var t = ac.currentTime; tone(t, 55, 0.18, 0.08, 'sine'); tone(t + 0.2, 53, 0.22, 0.07, 'sine'); },
    snore: function () { var t = ac.currentTime; noise(t, 0.12, 0.5, 0, null); tone(t, 40, 0.45, 0.05, 'sawtooth'); },
    thud: function () { smp('bang', 0.5, 0.7, 0.1); },
    hawk: function () { if (!gap('hk', 0.6)) return; var t = ac.currentTime; tone(t, 67, 0.09, 0.05, 'square'); tone(t + 0.11, 67, 0.09, 0.05, 'square'); tone(t + 0.22, 72, 0.16, 0.05, 'square'); },
    slurp: function () { if (!gap('sl', 0.5)) return; var t = ac.currentTime; tone(t, 60, 0.08, 0.05, 'triangle'); tone(t + 0.1, 64, 0.08, 0.05, 'triangle'); },
    cheers: function () { var t = ac.currentTime; [0, 0.08, 0.16].forEach(function (d, i) { tone(t + d, 76 + i * 2, 0.05, 0.05, 'triangle'); }); smp('clear', 0.3, 1.4); },
    complain: function () { if (!gap('cp', 0.25)) return; var t = ac.currentTime; for (var i = 0; i < 4; i++) { tone(t + i * 0.09, 84, 0.06, 0.05, 'square'); tone(t + i * 0.09 + 0.045, 88, 0.04, 0.04, 'square'); } },
    // 문 열림 차임(띵동 내려가는 세 음), 닫힘 삐삐, 도착·출발 덜컹
    dooropen: function () { var t = ac.currentTime; tone(t, 79, 0.28, 0.07, 'sine'); tone(t + 0.22, 76, 0.28, 0.07, 'sine'); tone(t + 0.44, 72, 0.5, 0.07, 'sine'); },
    doorclose: function () { var t = ac.currentTime; for (var i = 0; i < 3; i++) tone(t + i * 0.16, 81, 0.09, 0.05, 'square'); noise(t + 0.55, 0.15, 0.2, 0); },
    arrive: function () { var t = ac.currentTime; noise(t, 0.08, 0.9, 2400); tone(t, 50, 0.8, 0.04, 'sawtooth'); },
    depart: function () { var t = ac.currentTime; for (var i = 0; i < 4; i++) noise(t + i * 0.32, 0.12, 0.1, 0); smp('bell', 0.4, 1); },
    plop: function () { if (!gap('pl', 0.3)) return; var t = ac.currentTime; tone(t, 45, 0.12, 0.08, 'sine'); tone(t + 0.08, 40, 0.15, 0.06, 'sine'); },
    found: function () { smp('beep', 0.4, 1, 0.3); },
    clear: function () { smp('clear', 0.8, 1); },
    fail: function () { smp('fail', 0.8, 1); },
    nice: function () { var t = ac.currentTime; [76, 79, 84].forEach(function (m, i) { tone(t + i * 0.08, m, 0.18, 0.06, 'square'); }); },
    card: function () { var t = ac.currentTime; tone(t, 72, 0.08, 0.06, 'triangle'); tone(t + 0.07, 76, 0.08, 0.06, 'triangle'); tone(t + 0.14, 79, 0.16, 0.06, 'triangle'); },
    gold: function () { var t = ac.currentTime; [72, 76, 79, 84, 88].forEach(function (m, i) { tone(t + i * 0.07, m, 0.22, 0.06, 'triangle'); }); smp('coin', 0.5, 1.3); }
  };
  // 배경음: 8비트 뽕짝(쿵짝 2박). Am-Am-Dm-E. 밤 구간은 느리게
  function note(t, m, dur, vol, type) {
    var o = ac.createOscillator(); o.type = type || 'square'; o.frequency.value = mtof(m);
    var g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.005); g.gain.setValueAtTime(vol, t + dur * 0.6); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bgmBus); o.start(t); o.stop(t + dur + 0.02);
  }
  var CH = [[57, 60, 64], [57, 60, 64], [62, 65, 69], [64, 68, 71], [57, 60, 64], [65, 69, 72], [64, 68, 71], [57, 60, 64]];
  // 8마디 x 8칸(8분음표). 0 쉼
  var LEAD = [
    76, 0, 76, 74, 72, 0, 74, 76,  81, 0, 79, 76, 74, 0, 72, 0,
    74, 0, 74, 77, 76, 74, 72, 74,  76, 0, 71, 0, 68, 0, 0, 0,
    72, 0, 72, 74, 76, 0, 79, 76,  77, 0, 76, 74, 72, 0, 69, 0,
    71, 0, 72, 74, 76, 0, 74, 71,  69, 0, 0, 0, 69, 0, 0, 0];
  function sched() {
    if (!ac) return;
    var night = window.G && G.map && G.map.night, bpm = night ? 104 : 128, e8 = 60 / bpm / 2;
    while (nextT < ac.currentTime + 0.4) {
      var s8 = step % 8, bar = (step >> 3) % 8, ch = CH[bar];
      // 쿵(베이스: 근음·5음 번갈아) 짝(화음 뜯기)
      if (s8 % 4 === 0) note(nextT, ch[0] - 24 + (s8 === 4 ? 7 : 0), e8 * 1.6, 0.09, 'square');
      if (s8 % 4 === 2) { note(nextT, ch[1], e8 * 0.7, 0.025, 'square'); note(nextT, ch[2], e8 * 0.7, 0.025, 'square'); noise(nextT, 0.07, 0.05, 5000, bgmBus); }
      if (s8 % 4 === 0) noise(nextT, 0.12, 0.08, 0, bgmBus);
      var ln = LEAD[step % 64];
      if (ln && !(night && s8 % 2)) { note(nextT, ln, e8 * 1.7, 0.035, 'triangle'); note(nextT, ln + 12, e8 * 0.5, 0.008, 'square'); }
      nextT += e8; step++;
    }
  }
  function startBgm() { if (!ac || bgmTimer) return; nextT = ac.currentTime + 0.1; step = 0; bgmTimer = setInterval(sched, 120); sched(); }
  function stopBgm() { if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; } }
  window.AU = {
    init: init,
    play: function (n, a) { if (!ac || !sndOn || !SFX[n]) return; try { SFX[n](a); } catch (e) {} },
    snd: function (v) { if (v === undefined) return sndOn; sndOn = v; ls('line1.snd', v ? '1' : '0'); if (sfxBus) sfxBus.gain.value = v ? 0.9 : 0; },
    bgm: function (v) { if (v === undefined) return bgmOn; bgmOn = v; ls('line1.bgm', v ? '1' : '0'); if (bgmBus) bgmBus.gain.value = v ? 0.3 : 0; if (v) startBgm(); else stopBgm(); }
  };
})();
