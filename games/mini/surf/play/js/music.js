/* 배경음: 여름 바다 (118bpm, C-G-Am-F). 와르르 볼링 음악 틀(16분 스케줄러 + 킥·햇·박수 + 옥타브 뛰는 베이스 + 두 번째 반복에만 리드)을 그대로 따르고 음색만 바다 쪽으로.
 * 엇박 코드는 우쿨렐레처럼 짧게, 리드는 마림바(사인 + 4배 배음), 메아리 딜레이. 16마디마다 마지막 두 마디는 북·베이스가 빠지고 쏴 올라가는 소리.
 * 실시간: SURFMUSIC.start(ctx, out) / stop(). 시험: SURFMUSIC.render(초) → Promise<AudioBuffer> */
(function () {
  'use strict';
  var BPM = 118, S16 = 60 / BPM / 4;
  var PROG = [[48, 60, 64, 67], [43, 59, 62, 67], [45, 57, 60, 64], [41, 57, 60, 65]]; // C G Am F
  var LEAD_A = [
    [72, -1, 76, -1, 79, -1, 76, -1, 77, 76, 74, -1, 72, -1, -1, -1],
    [74, -1, 71, -1, 74, -1, 79, -1, 77, -1, 76, -1, 74, -1, -1, -1],
    [72, -1, 76, -1, 81, -1, 79, -1, 76, -1, 72, -1, 76, -1, 74, -1],
    [72, -1, 69, -1, 72, -1, 77, -1, 76, -1, 74, -1, 72, -1, -1, -1]];
  var LEAD_B = [
    [-1, -1, 79, -1, -1, 76, -1, 79, -1, -1, 81, -1, 79, -1, 76, -1],
    [-1, -1, 79, -1, -1, 74, -1, 79, -1, -1, 83, -1, 81, -1, 79, -1],
    [-1, -1, 81, -1, -1, 76, -1, 81, -1, -1, 84, -1, 83, -1, 81, -1],
    [-1, -1, 81, -1, -1, 77, -1, 81, -1, -1, 79, -1, 77, -1, 76, -1]];
  var ARP = [1, 2, 3, 2];
  function mf(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function Engine(c, out) {
    var nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = nb.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    var bus = c.createGain(); bus.gain.value = 1;
    var comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.15;
    bus.connect(comp); comp.connect(out);
    // 리드 메아리: 3/16 박 뒤, 되먹임 0.32
    var lead = c.createGain(); lead.gain.value = 1; lead.connect(bus);
    var dl = c.createDelay(1); dl.delayTime.value = S16 * 3; var fb = c.createGain(); fb.gain.value = 0.32; var wet = c.createGain(); wet.gain.value = 0.28; var dlp = c.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2600;
    lead.connect(dl); dl.connect(dlp); dlp.connect(fb); fb.connect(dl); dlp.connect(wet); wet.connect(bus);

    function env(g, t, vol, att, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
    function note(f, t, dur, type, vol, cut, dest, att) {
      var o = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter();
      o.type = type; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = cut || 1800;
      env(g, t, vol, att || 0.006, dur); o.connect(fl); fl.connect(g); g.connect(dest || bus); o.start(t); o.stop(t + dur + 0.05);
    }
    function mallet(f, t, vol) {
      var o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f; env(g, t, vol, 0.004, 0.42); o.connect(g); g.connect(lead); o.start(t); o.stop(t + 0.5);
      var o2 = c.createOscillator(), g2 = c.createGain(); o2.type = 'sine'; o2.frequency.value = f * 4; env(g2, t, vol * 0.2, 0.002, 0.07); o2.connect(g2); g2.connect(lead); o2.start(t); o2.stop(t + 0.12);
    }
    function nz(t, dur, vol, type, f, q, att) {
      var s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
      s.buffer = nb; fl.type = type; fl.frequency.value = f; fl.Q.value = q || 0.8;
      env(g, t, vol, att || 0.002, dur); s.connect(fl); fl.connect(g); g.connect(bus); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
    }
    function kick(t) { var o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); g.gain.setValueAtTime(0.55, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.22); }
    function clap(t) { nz(t, 0.05, 0.28, 'bandpass', 1500, 1.2); nz(t + 0.012, 0.05, 0.24, 'bandpass', 1500, 1.2); nz(t + 0.024, 0.16, 0.3, 'bandpass', 1400, 1); }
    function sweep(t, dur) {
      var s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
      s.buffer = nb; s.loop = true; fl.type = 'bandpass'; fl.Q.value = 2; fl.frequency.setValueAtTime(300, t); fl.frequency.exponentialRampToValueAtTime(7000, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + dur * 0.95); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
      s.connect(fl); fl.connect(g); g.connect(bus); s.start(t); s.stop(t + dur + 0.1);
    }
    function play(step, t) {
      var s = step % 16, bar = Math.floor(step / 16), b4 = bar % 4, b8 = bar % 8, b16 = bar % 16, ch = PROG[b4];
      var brk = b16 >= 14, first = bar < 4;
      if (s === 0 && b16 === 14) sweep(t, S16 * 32);
      // 북
      if (!brk && s % 4 === 0) kick(t);
      if (!brk && (s === 4 || s === 12)) clap(t);
      if (!first) nz(t, s % 4 === 2 ? 0.07 : 0.035, s % 4 === 2 ? 0.22 : 0.1, 'highpass', 6500);
      // 옥타브 뛰는 베이스(볼링 틀의 핵심)
      if (!brk) note(mf(ch[0] - 12 + (s % 2 ? 12 : 0)), t, S16 * 0.85, 'sawtooth', 0.11, 900);
      else if (s === 0) note(mf(ch[0] - 12), t, S16 * 14, 'triangle', 0.14, 600, null, 0.02);
      // 바닥에 깔린 부드러운 화음
      if (s === 0) for (var k = 1; k < 4; k++) note(mf(ch[k] - 12), t, S16 * 15.5, 'triangle', 0.03, 1400, null, 0.25);
      // 엇박 우쿨렐레 코드
      if (s % 4 === 2) for (var j = 1; j < 4; j++) { note(mf(ch[j]), t + j * 0.006, S16 * 1.1, 'square', 0.03, 3200); note(mf(ch[j]), t + j * 0.006, S16 * 1.3, 'triangle', 0.07, 4000); }
      // 리드: 8마디 중 뒤 네 마디, A 와 B 를 번갈아
      var ph = Math.floor(bar / 8) % 2;
      if (b8 >= 4 && !brk) { var L = (ph ? LEAD_B : LEAD_A)[b4][s]; if (L > 0) mallet(mf(L), t, 0.3); }
      // 앞 네 마디는 첫 16마디 뒤부터 잔잔한 분산화음
      if (b8 < 4 && bar >= 16 && s % 2 === 0) mallet(mf(ch[ARP[(s / 2) % 4]] + 12), t, 0.09);
    }
    return { play: play };
  }

  var live = null, timer = null, step = 0, nextT = 0;
  window.SURFMUSIC = {
    BPM: BPM,
    start: function (c, out) {
      if (timer) return;
      if (!live || live.c !== c) live = { c: c, e: Engine(c, out) };
      nextT = c.currentTime + 0.1;
      timer = setInterval(function () { while (nextT < c.currentTime + 0.25) { live.e.play(step, nextT); nextT += S16; step++; } }, 50);
    },
    stop: function () { if (timer) clearInterval(timer); timer = null; },
    render: function (sec) {
      /* 노드를 한꺼번에 다 만들면 느려지니 1초마다 멈춰서 2초 앞까지만 예약 */
      var oc = new OfflineAudioContext(1, Math.ceil(44100 * sec), 44100), e = Engine(oc, oc.destination), t = 0.05, st = 0;
      function fill(upto) { while (t < Math.min(sec, upto)) { e.play(st, t); t += S16; st++; } }
      fill(2);
      for (var k = 1; k < sec - 0.5; k++) (function (k) { oc.suspend(k).then(function () { fill(k + 2); oc.resume(); }); })(k);
      return oc.startRendering();
    }
  };
})();