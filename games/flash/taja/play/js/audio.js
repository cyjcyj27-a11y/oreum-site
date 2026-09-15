/* 타닥타닥 달리기 — 소리와 음악. 전부 WebAudio 로 만든다(파일 없음). */
(function () {
  'use strict';
  var KEY = 'taja';
  var ac = null, master = null, sfx = null, mus = null, nb = null;
  var snd = load('snd', true), bgm = load('bgm', true);

  function load(k, def) { try { var v = localStorage.getItem(KEY + '.' + k); return v === null ? def : v === '1'; } catch (e) { return def; } }
  function save(k, v) { try { localStorage.setItem(KEY + '.' + k, v ? '1' : '0'); } catch (e) {} }

  function ensure() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC({ latencyHint: 'interactive' });
    master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
    sfx = ac.createGain(); sfx.gain.value = snd ? 1 : 0; sfx.connect(master);
    mus = ac.createGain(); mus.gain.value = 0; mus.connect(master);
    setInterval(schedule, 25);
  }
  function noiseBuf() {
    if (nb) return nb;
    var n = Math.floor(ac.sampleRate * 1.5), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return (nb = b);
  }
  function tone(out, freq, type, t0, dur, vol, slideTo, att) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + (att || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + dur + 0.03);
  }
  function burst(out, t0, dur, vol, freq, q, type, freqTo) {
    var s = ac.createBufferSource(); s.buffer = noiseBuf();
    var f = ac.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.setValueAtTime(freq, t0); f.Q.value = q || 1.2;
    if (freqTo) f.frequency.exponentialRampToValueAtTime(freqTo, t0 + dur);
    var g = ac.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(t0, Math.random() * 0.8); s.stop(t0 + dur + 0.05);
  }
  function ok() { return ac && snd; }

  // ── 음악: 신나는 운동회 가락. 4마디 × 4 = 16마디 돌림 ──
  var BPM = 138, step = 60 / BPM / 2, nextT = 0, idx = 0, playing = false, fast = false;
  var N = function (n) { return 440 * Math.pow(2, (n - 69) / 12); };
  // 코드 진행 C G Am F / C G F G
  var CH = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62], [53, 57, 60], [55, 59, 62]];
  var MEL = [72, 0, 76, 79, 76, 0, 72, 74, 71, 0, 74, 79, 74, 0, 71, 67, 72, 0, 76, 72, 69, 0, 72, 76, 77, 76, 74, 72, 74, 0, 71, 0,
             72, 0, 76, 79, 81, 79, 76, 79, 79, 0, 77, 76, 74, 0, 71, 74, 77, 0, 76, 74, 72, 0, 69, 72, 74, 76, 74, 71, 72, 0, 0, 0];
  function schedule() {
    if (!ac || !playing) return;
    if (nextT < ac.currentTime - 0.2) nextT = ac.currentTime + 0.05;
    while (nextT < ac.currentTime + 0.12) { note(idx, nextT); nextT += step * (fast ? 0.86 : 1); idx = (idx + 1) % 64; }
  }
  function note(i, t) {
    var bar = Math.floor(i / 8), ch = CH[bar % 8], beat = i % 8;
    // 베이스
    if (beat % 2 === 0) tone(mus, N(ch[0] - 24 + (beat === 4 ? 7 : 0)), 'triangle', t, step * 1.6, 0.22);
    // 화음 뒷박
    if (beat % 2 === 1) ch.forEach(function (n) { tone(mus, N(n), 'square', t, step * 0.7, 0.025); });
    // 가락
    var m = MEL[i]; if (m) tone(mus, N(m), 'square', t, step * 0.9, 0.05); if (m) tone(mus, N(m + 12), 'sine', t, step * 0.6, 0.02);
    // 북
    if (beat === 0 || beat === 4) { tone(mus, 120, 'sine', t, 0.14, 0.35, 45); }
    if (beat === 2 || beat === 6) burst(mus, t, 0.1, 0.12, 1800, 0.8);
    burst(mus, t, 0.03, 0.04, 8000, 1, 'highpass');
  }

  var A = {
    init: ensure,
    get snd() { return snd; }, get bgm() { return bgm; },
    toggleSnd: function () { snd = !snd; save('snd', snd); if (sfx) sfx.gain.value = snd ? 1 : 0; return snd; },
    toggleBgm: function () { bgm = !bgm; save('bgm', bgm); A.music(playing, fast); return bgm; },
    // on: 음악 켜기, quick: 경주 중 조금 빠르게
    music: function (on, quick) {
      if (!ac) return;
      fast = !!quick;
      if (on && !playing) { playing = true; nextT = ac.currentTime + 0.05; idx = 0; }
      if (!on) playing = false;
      mus.gain.cancelScheduledValues(ac.currentTime);
      mus.gain.setTargetAtTime(on && bgm ? (quick ? 0.55 : 0.4) : 0, ac.currentTime, 0.15);
    },
    // 맞게 친 한 타 — 작은 "톡"
    key: function () { if (!ok()) return; var t = ac.currentTime; tone(sfx, 1900 + Math.random() * 500, 'sine', t, 0.03, 0.05); burst(sfx, t, 0.02, 0.06, 4200, 2); },
    // 틀린 타
    bad: function () { if (!ok()) return; var t = ac.currentTime; tone(sfx, 150, 'square', t, 0.12, 0.07, 110); },
    // 낱말 넘김
    word: function (perfect) { if (!ok()) return; var t = ac.currentTime; tone(sfx, perfect ? 880 : 660, 'triangle', t, 0.1, 0.12); if (perfect) tone(sfx, 1320, 'triangle', t + 0.06, 0.12, 0.1); },
    combo: function (n) { if (!ok()) return; var t = ac.currentTime, f = [784, 988, 1175, 1568]; for (var k = 0; k < Math.min(4, 2 + n); k++) tone(sfx, f[k], 'triangle', t + k * 0.06, 0.18, 0.12); },
    beep: function (go) { if (!ok()) return; var t = ac.currentTime; tone(sfx, go ? 1046 : 523, 'square', t, go ? 0.5 : 0.18, 0.12); if (go) { burst(sfx, t, 0.35, 0.15, 3000, 4); } },
    // 누가 나를 앞질렀다 — 휙
    whoosh: function () { if (!ok()) return; var t = ac.currentTime; burst(sfx, t, 0.35, 0.18, 600, 1.2, 'bandpass', 2400); },
    tease: function () { if (!ok()) return; var t = ac.currentTime; for (var k = 0; k < 3; k++) tone(sfx, 1000 - k * 110, 'sine', t + k * 0.09, 0.08, 0.08, 800 - k * 110); },
    trip: function () { if (!ok()) return; var t = ac.currentTime; tone(sfx, 420, 'sine', t, 0.35, 0.18, 90); burst(sfx, t + 0.12, 0.15, 0.2, 400, 1); },
    // 결승 — 관중 환호
    cheer: function (big) {
      if (!ok()) return; var t = ac.currentTime;
      burst(sfx, t, big ? 2.4 : 1.4, big ? 0.35 : 0.2, 1100, 0.5);
      burst(sfx, t + 0.1, big ? 2 : 1.1, big ? 0.22 : 0.12, 2400, 0.7);
      for (var k = 0; k < (big ? 10 : 4); k++) burst(sfx, t + Math.random() * 1.2, 0.08, 0.15, 3000 + Math.random() * 2000, 6);
    },
    win: function () { if (!ok()) return; var t = ac.currentTime + 0.2, f = [523, 659, 784, 1047, 784, 1047]; for (var k = 0; k < f.length; k++) tone(sfx, f[k], 'square', t + k * 0.11, k === 5 ? 0.6 : 0.14, 0.09); },
    lose: function () { if (!ok()) return; var t = ac.currentTime + 0.2; tone(sfx, 392, 'triangle', t, 0.3, 0.2, 330); tone(sfx, 262, 'triangle', t + 0.28, 0.6, 0.2, 196); },
    medal: function () { if (!ok()) return; var t = ac.currentTime; tone(sfx, 1568, 'sine', t, 0.8, 0.12); tone(sfx, 2093, 'sine', t + 0.08, 0.9, 0.1); },
    click: function () { if (!ok()) return; var t = ac.currentTime; tone(sfx, 700, 'triangle', t, 0.06, 0.1, 500); }
  };
  window.TJAudio = A;
})();
