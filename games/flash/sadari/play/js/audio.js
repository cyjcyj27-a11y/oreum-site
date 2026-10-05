// 소리: 녹음 효과음(window.SFXDATA, base64 mp3) + 가벼운 코드 음악(통통 튀는 마림바 플럭)
(function () {
  'use strict';
  var ac = null, master = null, sfxBus = null, bgmBus = null;
  var buf = {};
  var sndOn = true, bgmOn = true, bgmTimer = null, nextT = 0, step = 0;
  var drumSrc = null;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  if (ls('sadari2.snd') === '0') sndOn = false;
  if (ls('sadari2.bgm') === '0') bgmOn = false;

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 1; master.connect(ac.destination);
    sfxBus = ac.createGain(); sfxBus.gain.value = sndOn ? 0.9 : 0; sfxBus.connect(master);
    bgmBus = ac.createGain(); bgmBus.gain.value = bgmOn ? 0.45 : 0; bgmBus.connect(master);
    var data = window.SFXDATA || {};
    Object.keys(data).forEach(function (k) {
      buf[k] = [];
      data[k].forEach(function (b64) {
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
    if (!l || !l.length) return null;
    var s = ac.createBufferSource(); s.buffer = l[(Math.random() * l.length) | 0];
    s.playbackRate.value = rate || (0.94 + Math.random() * 0.12);
    var g = ac.createGain(); g.gain.value = vol == null ? 1 : vol;
    s.connect(g); g.connect(sfxBus); s.start();
    return s;
  }
  function tone(t, f, dur, vol, type, out) {
    var o = ac.createOscillator(); o.type = type || 'sine'; o.frequency.value = f;
    var g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0006, t + dur);
    o.connect(g); g.connect(out || sfxBus); o.start(t); o.stop(t + dur + 0.05);
  }
  // 사다리 타는 소리: 가로줄 지날 때마다 배경음과 같은 마림바 한 음(오음계로 한 칸씩 올라감)
  var STEP = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93];
  var lastStep = 0;
  function marS(t, m, vol) {
    var f = 440 * Math.pow(2, (m - 69) / 12);
    var o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    var o2 = ac.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 4;
    var g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.45);
    var g2 = ac.createGain(); g2.gain.setValueAtTime(vol * 0.3, t); g2.gain.exponentialRampToValueAtTime(0.0005, t + 0.06);
    o.connect(g); o2.connect(g2); g.connect(sfxBus); g2.connect(sfxBus);
    o.start(t); o2.start(t); o.stop(t + 0.5); o2.stop(t + 0.1);
  }
  // 단추 소리: 평범한 클릭 녹음(Pixabay Click Button, Universfield). 10/5 사장님 딩동 → 딩 → "평범한 버튼 누르는 소리". 녹음이 아직 안 풀렸을 때만 딩
  var lastDing = 0;
  function bell(t, f, dur, vol) {
    [[1, 1], [2, 0.28], [3, 0.1]].forEach(function (h) {
      var o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f * h[0];
      var g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * h[1], t + 0.006); g.gain.exponentialRampToValueAtTime(0.0005, t + dur / h[0]);
      o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + dur + 0.05);
    });
  }
  function dingdong() {
    var t = ac.currentTime; if (t - lastDing < 0.05) return; lastDing = t;
    if (!smp('clk', 0.8, 1)) bell(t, 1318.5, 0.6, 0.075);
  }
  var SFX = {
    step: function (k) { var n = ac.currentTime; if (n - lastStep < 0.06) return; lastStep = n; marS(n, STEP[Math.min(STEP.length - 1, k | 0)], 0.09); },
    shuf: function () { if (!smp('shuf', 0.8)) tone(ac.currentTime, 600, 0.05, 0.03, 'triangle'); },
    tap: function () { dingdong(); },
    lid: function () { dingdong(); },
    peel: function () { smp('peel', 0.55); },
    win: function () {
      var t = ac.currentTime + 0.02, ar = [659.25, 783.99, 1046.5, 1318.5];
      ar.forEach(function (f, i) { tone(t + i * 0.07, f, 0.55, 0.06, 'triangle'); });
    },
    miss: function () { var t = ac.currentTime; tone(t, 330, 0.16, 0.05, 'triangle'); tone(t + 0.1, 262, 0.22, 0.05, 'triangle'); },
    drum: function () { if (drumSrc) try { drumSrc.stop(); } catch (e) {} drumSrc = smp('drum', 0.7, 1); },
    drumStop: function () { if (drumSrc) { try { drumSrc.stop(); } catch (e) {} drumSrc = null; } },
    pop: function () { smp('pop', 0.8); }
  };

  // 배경음: 104bpm, C - Am - F - G 마림바 플럭(사인 + 짧은 배음), 가끔 휘파람 같은 가락
  var CH = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]];
  var MEL = [72, 74, 76, 79, 81];
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function mar(t, m, dur, vol) {
    var f = mtof(m);
    var o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    var o2 = ac.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 4;
    var g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    var g2 = ac.createGain(); g2.gain.setValueAtTime(vol * 0.35, t); g2.gain.exponentialRampToValueAtTime(0.0005, t + 0.08);
    o.connect(g); o2.connect(g2); g.connect(bgmBus); g2.connect(bgmBus);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + 0.12);
  }
  var BEAT = 60 / 104;
  function sched() {
    if (!ac) return;
    while (nextT < ac.currentTime + 0.5) {
      var bar = (step >> 3) % 4, s8 = step % 8, ch = CH[bar];
      if (s8 === 0) mar(nextT, ch[0] - 12, BEAT * 1.6, 0.07);
      if (s8 === 4) mar(nextT, ch[0] - 5, BEAT * 1.2, 0.05);
      if (s8 === 2 || s8 === 6) ch.forEach(function (m, i) { mar(nextT + i * 0.012, m, BEAT * 0.7, 0.028); });
      if ((s8 === 3 || s8 === 7) && Math.random() < 0.3) mar(nextT, MEL[(Math.random() * MEL.length) | 0], BEAT * 0.9, 0.03);
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
    snd: function (v) { if (v === undefined) return sndOn; sndOn = v; ls('sadari2.snd', v ? '1' : '0'); if (sfxBus) sfxBus.gain.value = v ? 0.9 : 0; if (!v) SFX.drumStop && ac && SFX.drumStop(); },
    bgm: function (v) {
      if (v === undefined) return bgmOn; bgmOn = v; ls('sadari2.bgm', v ? '1' : '0');
      if (bgmBus) bgmBus.gain.value = v ? 0.45 : 0;
      if (v) startBgm(); else stopBgm();
    }
  };
})();
