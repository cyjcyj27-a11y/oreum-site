/* 피아노 연습 — Web Audio 합성 피아노(파일 없음). 음마다 배음 6개 + 해머 소리, 댐퍼·페달 */
(function () {
  var ctx = null, master = null, comp = null, muted = false;
  var voices = {};        // midi -> [voice]
  var pedal = false;
  var NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  var KOR = ['도', '도#', '레', '레#', '미', '파', '파#', '솔', '솔#', '라', '라#', '시'];

  function ready() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
      } catch (e) { return null; }
      comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.knee.value = 18; comp.ratio.value = 5;
      comp.attack.value = 0.003; comp.release.value = 0.2;
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.9;
      comp.connect(master); master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }
  function now() { return ctx ? ctx.currentTime : 0; }
  function freq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  /* 해머 소리용 잡음 버퍼 */
  var noiseBuf = null;
  function noise() {
    if (noiseBuf) return noiseBuf;
    var n = Math.floor(ctx.sampleRate * 0.06), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    noiseBuf = b; return b;
  }

  /* 음 하나: 배음 6개를 각기 다른 속도로 줄인다. 낮은 음은 길게, 높은 음은 짧게 울린다 */
  function voice(midi, vel, t) {
    var f = freq(midi);
    var bright = 0.55 + vel * 0.45;
    var tau1 = Math.min(5, Math.max(0.55, 3.6 * Math.pow(2, -(midi - 48) / 22)));
    var B = midi < 48 ? 0.00008 : (midi < 72 ? 0.00015 : 0.0004);   // 비조화성(현의 뻣뻣함)
    var out = ctx.createGain(); out.gain.value = 1;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(16000, f * (6 + 10 * bright)), t);
    lp.frequency.exponentialRampToValueAtTime(Math.min(16000, Math.max(f * 2.2, f * (2 + 5 * bright))), t + 0.9);
    lp.Q.value = 0.4;
    out.connect(lp); lp.connect(comp);
    var parts = [], amps = [1, 0.42, 0.2, 0.1, 0.05, 0.03];
    if (midi > 76) amps = [1, 0.28, 0.1, 0.04, 0.015, 0.01];
    for (var n = 1; n <= 6; n++) {
      var fn = f * n * Math.sqrt(1 + B * n * n);
      if (fn > 18000) break;
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = n === 1 ? 'triangle' : 'sine';
      o.frequency.value = fn;
      var a = amps[n - 1] * vel * (n === 1 ? 0.5 : 0.38) * (midi < 52 ? 0.85 : 1);
      var tau = tau1 / (1 + 0.9 * (n - 1));
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(a, t + 0.004 + 0.002 * n);
      g.gain.setTargetAtTime(a * 0.25, t + 0.01, tau * 0.33);    // 처음 빨리 줄고
      g.gain.setTargetAtTime(0.0001, t + 0.01 + tau * 0.5, tau * 0.8);  // 뒤는 천천히
      o.connect(g); g.connect(out);
      o.start(t); o.stop(t + tau * 4 + 1);
      parts.push({ o: o, g: g });
    }
    /* 해머 */
    try {
      var ns = ctx.createBufferSource(); ns.buffer = noise();
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = Math.min(9000, f * 5 + 1500); bp.Q.value = 0.9;
      var ng = ctx.createGain(); ng.gain.setValueAtTime(0.12 * vel * vel, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      ns.connect(bp); bp.connect(ng); ng.connect(out); ns.start(t); ns.stop(t + 0.07);
    } catch (e) {}
    return { out: out, parts: parts, off: false, t: t };
  }
  function kill(v, t) {
    if (v.off) return; v.off = true;
    t = Math.max(t, now());
    v.out.gain.cancelScheduledValues(t);
    v.out.gain.setValueAtTime(v.out.gain.value, t);
    v.out.gain.setTargetAtTime(0.0001, t, 0.045);    // 댐퍼가 현에 닿는다
    v.parts.forEach(function (p) { try { p.o.stop(t + 0.5); } catch (e) {} });
  }

  var sustained = [];   // 페달 밟은 동안 뗀 음
  function noteOn(midi, vel, when) {
    if (!ready()) return;
    vel = vel == null ? 0.8 : Math.max(0.15, Math.min(1, vel));
    var t = when == null ? now() : Math.max(now(), when);
    var list = voices[midi] || (voices[midi] = []);
    // 같은 음을 다시 치면 앞 소리를 살짝 죽인다(현을 다시 때리는 느낌)
    list.forEach(function (v) { if (!v.off) kill(v, t); });
    voices[midi] = list.filter(function (v) { return !v.off; });
    voices[midi].push(voice(midi, vel, t));
    // 목소리가 너무 많으면 오래된 것부터 끈다
    var all = [], k; for (k in voices) voices[k].forEach(function (v) { if (!v.off) all.push(v); });
    if (all.length > 24) { all.sort(function (a, b) { return a.t - b.t; }); for (var i = 0; i < all.length - 24; i++) kill(all[i], t); }
  }
  function noteOff(midi, when) {
    if (!ctx) return;
    var t = when == null ? now() : Math.max(now(), when);
    var list = voices[midi]; if (!list) return;
    if (pedal) { list.forEach(function (v) { if (sustained.indexOf(v) < 0) sustained.push(v); }); return; }
    list.forEach(function (v) { kill(v, t); });
    voices[midi] = [];
  }
  /* 길이를 정해 놓고 치기(자동 연주용) */
  function play(midi, dur, when, vel) {
    if (!ready()) return;
    var t = when == null ? now() : when;
    noteOn(midi, vel == null ? 0.7 : vel, t);
    var list = voices[midi], v = list[list.length - 1];
    if (v) kill(v, t + Math.max(0.08, dur));
  }
  function setPedal(on) {
    pedal = !!on;
    if (!pedal && ctx) { var t = now(); sustained.forEach(function (v) { kill(v, t); }); sustained = []; }
  }
  function stopAll() {
    if (!ctx) return;
    var t = now(), k;
    for (k in voices) { voices[k].forEach(function (v) { kill(v, t); }); voices[k] = []; }
    sustained = [];
  }
  function setMute(m) {
    muted = !!m;
    if (master) { master.gain.setTargetAtTime(muted ? 0 : 0.9, now(), 0.02); }
  }

  /* 메트로놈 딸깍(나무 소리) · 단추 똑 */
  function click(accent, when) {
    if (!ready() || muted) return;
    var t = when == null ? now() : when;
    var o = ctx.createOscillator(), g = ctx.createGain(), bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = accent ? 2600 : 1900; bp.Q.value = 6;
    o.type = 'square'; o.frequency.value = accent ? 1400 : 1000;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.32, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (accent ? 0.07 : 0.05));
    o.connect(bp); bp.connect(g); g.connect(comp); o.start(t); o.stop(t + 0.09);
  }
  function tap() {
    if (!ready() || muted) return;
    var t = now(), ns = ctx.createBufferSource(); ns.buffer = noise();
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 1.4;
    var g = ctx.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    ns.connect(bp); bp.connect(g); g.connect(comp); ns.start(t); ns.stop(t + 0.06);
  }
  /* 맞음·틀림 짧은 신호(피아노 음과 겹치지 않게 아주 짧다) */
  function cue(ok) {
    if (!ready() || muted) return;
    var t = now(), o = ctx.createOscillator(), g = ctx.createGain();
    o.type = ok ? 'sine' : 'triangle';
    if (ok) { o.frequency.setValueAtTime(1760, t); o.frequency.setValueAtTime(2637, t + 0.06); }
    else { o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.12); }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(ok ? 0.08 : 0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (ok ? 0.16 : 0.15));
    o.connect(g); g.connect(comp); o.start(t); o.stop(t + 0.2);
  }

  window.PianoSynth = {
    ready: ready, time: now, noteOn: noteOn, noteOff: noteOff, play: play, pedal: setPedal, stopAll: stopAll,
    mute: setMute, click: click, tap: tap, cue: cue, freq: freq,
    name: function (m) { return NAMES[m % 12] + (Math.floor(m / 12) - 1); },
    letter: function (m) { return NAMES[m % 12]; },
    kor: function (m) { return KOR[m % 12]; },
    isBlack: function (m) { return [1, 3, 6, 8, 10].indexOf(m % 12) >= 0; },
    midi: function (s) {   // 'C#4' -> 61
      var m = /^([A-G])(#|b)?(-?\d)$/.exec(s); if (!m) return null;
      var n = NAMES.indexOf(m[1]); if (m[2] === '#') n++; if (m[2] === 'b') n--;
      return (parseInt(m[3], 10) + 1) * 12 + n;
    }
  };
})();
