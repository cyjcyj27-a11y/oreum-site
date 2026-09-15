// 소리 — 전부 코드로 만든다. 효과음·음악 단추가 따로다
(function () {
  var KEY = 'burger.snd', MKEY = 'burger.bgm';
  var on = true, mus = true;
  try { on = localStorage.getItem(KEY) !== '0'; mus = localStorage.getItem(MKEY) !== '0'; } catch (e) {}
  var ac = null, master = null, sfxBus = null, musBus = null, noiseBuf = null;
  var sizzle = null, bubble = null;

  function ctx() {
    if (ac) return ac;
    var C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    ac = new C();
    master = ac.createGain(); master.gain.value = 0.7; master.connect(ac.destination);
    sfxBus = ac.createGain(); sfxBus.gain.value = on ? 1 : 0; sfxBus.connect(master);
    musBus = ac.createGain(); musBus.gain.value = 0; musBus.connect(master);
    var n = ac.sampleRate * 2; noiseBuf = ac.createBuffer(1, n, ac.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return ac;
  }
  function tone(f, t0, dur, type, vol, f2, bus) {
    var a = ctx(); if (!a) return;
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.3, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(bus || sfxBus); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(t0, dur, type, freq, q, vol, f2, bus) {
    var a = ctx(); if (!a) return;
    var s = a.createBufferSource(); s.buffer = noiseBuf;
    var bp = a.createBiquadFilter(); bp.type = type || 'bandpass'; bp.frequency.setValueAtTime(freq, t0); bp.Q.value = q || 1;
    if (f2) bp.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    var g = a.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.25, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(bp); bp.connect(g); g.connect(bus || sfxBus);
    s.start(t0, Math.random() * 1.5); s.stop(t0 + dur + 0.02);
  }
  // 계속 나는 소리 — 지글지글(그릴), 보글보글(튀김기)
  function loop(type, freq, q) {
    var a = ctx(); if (!a) return null;
    var s = a.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    var f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    var g = a.createGain(); g.gain.value = 0;
    s.connect(f); f.connect(g); g.connect(sfxBus); s.start();
    return { g: g, f: f, lv: 0 };
  }

  var SFX = {
    // 패티를 철판에 올림 — 치익
    sear: function (t) { noise(t, 0.9, 'highpass', 2600, 0.7, 0.32, 4200); noise(t, 0.12, 'lowpass', 400, 1, 0.25); },
    flip: function (t) { noise(t, 0.12, 'bandpass', 900, 1.2, 0.18, 2200); tone(160, t + 0.2, 0.08, 'sine', 0.3, 90); noise(t + 0.2, 0.5, 'highpass', 3000, 0.7, 0.24); },
    drop: function (t) { tone(190, t, 0.09, 'sine', 0.32, 110); noise(t, 0.05, 'lowpass', 700, 1, 0.18); },
    soft: function (t) { noise(t, 0.08, 'bandpass', 1400, 0.8, 0.14, 700); tone(260, t, 0.06, 'sine', 0.12, 180); },
    squirt: function (t) { noise(t, 0.28, 'bandpass', 600, 3, 0.3, 1400); noise(t + 0.22, 0.08, 'bandpass', 300, 2, 0.2); },
    bun: function (t) { tone(140, t, 0.12, 'sine', 0.35, 90); noise(t, 0.06, 'lowpass', 500, 1, 0.14); },
    dunk: function (t) { noise(t, 1.0, 'highpass', 1800, 0.6, 0.3, 3500); noise(t, 0.2, 'lowpass', 300, 1, 0.3); },
    lift: function (t) { noise(t, 0.3, 'bandpass', 2500, 1, 0.12, 900); tone(520, t, 0.05, 'triangle', 0.06); },
    trash: function (t) { noise(t, 0.2, 'lowpass', 900, 1, 0.3, 200); tone(90, t + 0.05, 0.15, 'sine', 0.3, 60); },
    no: function (t) { tone(220, t, 0.08, 'square', 0.06); tone(180, t + 0.09, 0.1, 'square', 0.06); },
    ding: function (t) { tone(1568, t, 0.9, 'sine', 0.22); tone(3136, t, 0.4, 'sine', 0.05); },
    door: function (t) { tone(1175, t, 0.5, 'sine', 0.14); tone(988, t + 0.14, 0.6, 'sine', 0.14); },
    coin: function (t) { tone(988, t, 0.1, 'square', 0.07); tone(1319, t + 0.08, 0.35, 'square', 0.07); },
    great: function (t) { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, t + i * 0.07, 0.3, 'triangle', 0.16); }); },
    bad: function (t) { tone(300, t, 0.2, 'triangle', 0.14, 200); tone(220, t + 0.18, 0.3, 'triangle', 0.14, 150); },
    clear: function (t) { [523, 659, 784, 659, 784, 1047].forEach(function (f, i) { tone(f, t + i * 0.11, 0.35, 'triangle', 0.18); }); },
    click: function (t) { tone(700, t, 0.04, 'sine', 0.12); },
    pop: function (t) { noise(t, 0.5, 'lowpass', 1600, 0.7, 0.28, 300); tone(90 + Math.random() * 60, t, 0.25, 'sine', 0.18, 50); },
    buy: function (t) { tone(660, t, 0.08, 'triangle', 0.16); tone(990, t + 0.07, 0.2, 'triangle', 0.16); },
    rise: function (t) { [392, 523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, t + i * 0.09, 0.5, 'triangle', 0.15); }); }
  };
  function play(name) {
    var a = ctx(); if (!a || !on) return;
    if (a.state === 'suspended') a.resume();
    var f = SFX[name]; if (f) f(a.currentTime + 0.005);
  }
  // 지글거림 크기 — 그릴 위 패티 수, 튀김기 바구니 수
  function level(grillN, fryN, burnt) {
    var a = ctx(); if (!a) return;
    if (!sizzle) { sizzle = loop('highpass', 3200, 0.5); bubble = loop('lowpass', 520, 0.8); }
    if (!sizzle) return;
    var t = a.currentTime;
    var sv = grillN ? Math.min(0.2, 0.07 + grillN * 0.025) : 0;
    sizzle.g.gain.setTargetAtTime(sv, t, 0.15);
    sizzle.f.frequency.setTargetAtTime(burnt ? 2200 : 3200, t, 0.3);
    bubble.g.gain.setTargetAtTime(fryN ? Math.min(0.5, 0.25 + fryN * 0.1) : 0, t, 0.2);
    // 기름 튀는 톡톡
    if (on && grillN && Math.random() < 0.06 * grillN) noise(t + Math.random() * 0.05, 0.03, 'highpass', 5000, 1, 0.08 + Math.random() * 0.1);
    if (on && fryN && Math.random() < 0.18 * fryN) tone(180 + Math.random() * 260, t, 0.05, 'sine', 0.05, 500);
  }

  // ---------- 음악: 느긋한 가게 음악 (직접 지은 곡) ----------
  var BPM = 100, beat = 60 / BPM, nextT = 0, step = 0, timer = null;
  // Cmaj7 Am7 Dm7 G7 / Em7 A7 Dm7 G7
  var CH = [[60, 64, 67, 71], [57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65],
    [52, 55, 59, 62], [57, 61, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65]];
  var BASS = [48, 45, 50, 43, 40, 45, 50, 43];
  var MEL = [
    [76, 0, 74, 72, 0, 71, 72, 0], [69, 0, 0, 72, 71, 69, 67, 0], [74, 0, 72, 69, 0, 72, 74, 76], [74, 0, 0, 0, 71, 0, 67, 0],
    [71, 0, 67, 64, 0, 67, 71, 0], [73, 0, 76, 0, 73, 71, 69, 0], [72, 0, 69, 65, 0, 69, 72, 74], [71, 0, 0, 67, 0, 0, 0, 0]
  ];
  function mf(n) { return 440 * Math.pow(2, (n - 69) / 12); }
  function ep(f, t, dur, vol) {                       // 전자피아노 느낌
    tone(f, t, dur, 'sine', vol, null, musBus);
    tone(f * 2, t, dur * 0.4, 'triangle', vol * 0.18, null, musBus);
  }
  function schedule() {
    var a = ac; if (!a) return;
    while (nextT < a.currentTime + 0.3) {
      var bar = Math.floor(step / 8) % 8, s8 = step % 8, t = nextT;
      var sw = s8 % 2 ? beat * 0.08 : 0;                // 살짝 흔들리는 박
      if (s8 === 0) CH[bar].forEach(function (n) { ep(mf(n), t, beat * 3.2, 0.045); });
      if (s8 === 5) CH[bar].slice(1).forEach(function (n) { ep(mf(n), t + sw, beat * 1.2, 0.03); });
      if (s8 === 0 || s8 === 4) tone(mf(BASS[bar] - (s8 === 4 ? -7 : 0)), t, beat * 1.6, 'triangle', 0.13, null, musBus);
      if (s8 === 6) tone(mf(BASS[bar] + 5), t + sw, beat * 0.4, 'triangle', 0.09, null, musBus);
      var m = MEL[bar][s8];
      if (m && step >= 64) ep(mf(m), t + sw, beat * 0.9, 0.05);
      noise(t + sw, 0.04, 'highpass', 7000, 0.7, s8 % 2 ? 0.02 : 0.035, null, musBus);
      if (s8 === 2 || s8 === 6) noise(t, 0.09, 'bandpass', 1800, 0.8, 0.03, null, musBus);
      nextT += beat / 2; step++;
    }
  }
  function musicOn(v) {
    var a = ctx(); if (!a) return;
    if (v && mus) {
      if (!timer) { nextT = a.currentTime + 0.1; timer = setInterval(schedule, 90); }
      musBus.gain.cancelScheduledValues(a.currentTime);
      musBus.gain.setTargetAtTime(0.8, a.currentTime, 0.6);
    } else {
      musBus.gain.cancelScheduledValues(a.currentTime);
      musBus.gain.setValueAtTime(0, a.currentTime);
      if (timer) { clearInterval(timer); timer = null; }
    }
  }

  var wantMusic = false;
  window.SND = {
    play: play, level: level,
    unlock: function () { var a = ctx(); if (a && a.state === 'suspended') a.resume(); },
    on: function () { return on; }, musicOn: function () { return mus; },
    bgm: function (v) { wantMusic = v; musicOn(v); },
    toggle: function () {
      on = !on; try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
      var a = ctx(); if (a) sfxBus.gain.setValueAtTime(on ? 1 : 0, a.currentTime);
      return on;
    },
    toggleMusic: function () {
      mus = !mus; try { localStorage.setItem(MKEY, mus ? '1' : '0'); } catch (e) {}
      musicOn(wantMusic);
      return mus;
    },
    mute: function () { on = false; mus = false; var a = ctx(); if (a) { sfxBus.gain.value = 0; musBus.gain.value = 0; } musicOn(false); }
  };
})();
