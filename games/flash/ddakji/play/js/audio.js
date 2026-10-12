/* 소리 — 전부 합성. 임팩트도 배경음 악기(마림바)로, 밝기 2kHz 아래 */
(function () {
  var ctx = null, bus = null, sfxG = null, bgmG = null, rev = null;
  var S = { sfx: true, bgm: true };
  try { var sv = JSON.parse(localStorage.getItem('ddakji.snd') || '{}'); if (sv.sfx === false) S.sfx = false; if (sv.bgm === false) S.bgm = false; } catch (e) {}
  function save() { try { localStorage.setItem('ddakji.snd', JSON.stringify(S)); } catch (e) {} }
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4000;
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
    bus = ctx.createGain(); bus.gain.value = .9;
    bus.connect(lp); lp.connect(comp); comp.connect(ctx.destination);
    // 약한 잔향
    rev = ctx.createConvolver(); var len = ctx.sampleRate * 1.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    rev.buffer = ir; var rg = ctx.createGain(); rg.gain.value = .16; rev.connect(rg); rg.connect(bus);
    sfxG = ctx.createGain(); sfxG.gain.value = S.sfx ? 1 : 0; sfxG.connect(bus); sfxG.connect(rev);
    bgmG = ctx.createGain(); bgmG.gain.value = S.bgm ? .32 : 0; bgmG.connect(bus); bgmG.connect(rev);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var nd = noiseBuf.getChannelData(0); for (var j = 0; j < nd.length; j++) nd[j] = Math.random() * 2 - 1;
    if (S.bgm) startBgm();
  }
  var noiseBuf = null;
  function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  // 마림바 한 음
  function mar(freq, t, vol, dec, out) {
    if (!ctx) return; out = out || sfxG;
    var o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = freq;
    env(g, t, .005, vol, dec || .7); o.connect(g); g.connect(out); o.start(t); o.stop(t + (dec || .7) + .1);
    var o2 = ctx.createOscillator(), g2 = ctx.createGain(); o2.type = 'sine'; o2.frequency.value = freq * 4;
    if (freq * 4 < 2400) { env(g2, t, .003, vol * .18, .09); o2.connect(g2); g2.connect(out); o2.start(t); o2.stop(t + .2); }
    var o3 = ctx.createOscillator(), g3 = ctx.createGain(); o3.type = 'triangle'; o3.frequency.value = freq * 2;
    env(g3, t, .004, vol * .12, .25); o3.connect(g3); g3.connect(out); o3.start(t); o3.stop(t + .4);
  }
  function noise(t, dur, f1, f2, q, vol, type, out) {
    if (!ctx) return; var s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    var f = ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.setValueAtTime(f1, t); f.frequency.exponentialRampToValueAtTime(f2, t + dur); f.Q.value = q || .7;
    var g = ctx.createGain(); env(g, t, .004, vol, dur); s.connect(f); f.connect(g); g.connect(out || sfxG);
    s.start(t, Math.random() * .5); s.stop(t + dur + .05);
  }
  function thump(t, f0, f1, dur, vol) {
    var o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, .003, vol, dur); o.connect(g); g.connect(sfxG); o.start(t); o.stop(t + dur + .05);
  }
  var N = { C3: 130.8, D3: 146.8, E3: 164.8, G3: 196, A3: 220, C4: 261.6, D4: 293.7, E4: 329.6, G4: 392, A4: 440, C5: 523.3, D5: 587.3, E5: 659.3, G5: 784, A5: 880, C6: 1046.5 };
  var A = {
    init: init, S: S,
    // 딱지가 바닥을 치는 소리: 종이 탁 + 낮은 쿵
    slap: function (p) { if (!ctx) return; var t = ctx.currentTime; p = p == null ? .7 : p;
      noise(t, .07 + p * .05, 1500, 450, .8, .42 + p * .25); thump(t, 120, 55, .16 + p * .08, .38 + p * .3); noise(t + .01, .04, 900, 300, 1, .2); },
    tap: function () { if (!ctx) return; var t = ctx.currentTime; noise(t, .05, 1300, 600, .9, .35); thump(t, 160, 90, .06, .18); },
    whoosh: function () { if (!ctx) return; var t = ctx.currentTime; noise(t, .38, 300, 900, 1.6, .7, 'bandpass'); },
    rustle: function () { if (!ctx) return; var t = ctx.currentTime; for (var i = 0; i < 4; i++) noise(t + i * .035, .05, 1100, 600, 1.2, .22, 'bandpass'); },
    click: function () { if (!ctx) return; var t = ctx.currentTime; noise(t, .035, 1500, 700, 1, .3); thump(t, 220, 140, .05, .12); },
    flip: function () { if (!ctx) return; var t = ctx.currentTime; [N.C5, N.E5, N.G5, N.C6].forEach(function (f, i) { mar(f, t + i * .07, .32, .6); }); },
    miss: function () { if (!ctx) return; var t = ctx.currentTime; mar(N.E3, t, .4, .5); mar(N.C3, t + .12, .4, .7); },
    lose: function () { if (!ctx) return; var t = ctx.currentTime; mar(N.G3, t, .4, .4); mar(N.E3, t + .14, .4, .4); mar(N.C3, t + .3, .45, .9); },
    card: function () { if (!ctx) return; var t = ctx.currentTime; mar(N.G4, t, .22, .5); mar(N.D5, t + .05, .18, .5); },
    gold: function () { if (!ctx) return; var t = ctx.currentTime; [N.C4, N.G4, N.C5, N.E5, N.G5, N.A5, N.C6].forEach(function (f, i) { mar(f, t + i * .09, .26, 1.2); }); mar(N.C3, t, .3, 1.6); },
    clear: function () { if (!ctx) return; var t = ctx.currentTime; [N.C5, N.D5, N.E5, N.G5, N.E5, N.G5, N.C6].forEach(function (f, i) { mar(f, t + i * .11, .3, .8); }); [N.C3, N.G3, N.C4].forEach(function (f, i) { mar(f, t + i * .22, .3, 1); }); },
    over: function () { if (!ctx) return; var t = ctx.currentTime; [N.G4, N.E4, N.D4, N.C4].forEach(function (f, i) { mar(f, t + i * .2, .3, .7); }); mar(N.C3, t + .8, .4, 1.4); },
    setSfx: function (on) { S.sfx = on; save(); if (sfxG) sfxG.gain.value = on ? 1 : 0; },
    setBgm: function (on) { S.bgm = on; save(); if (bgmG) bgmG.gain.value = on ? .32 : 0; if (on) startBgm(); }
  };
  // 배경음: 골목 오후 마림바, 100bpm, 4마디 두 벌을 돌린다
  var bgmOn = false, nextT = 0, step = 0, timer = null;
  var F3 = 174.6, F4 = 349.2, B3 = 246.9;
  var CH = [[N.C3, N.G3, N.C4, N.E4], [N.A3 / 2, N.E3, N.A3, N.C4], [F3 / 2 * 2, N.C4, F4, N.A4], [N.G3 / 2, N.D3 * 2, N.G3, B3]];
  var MEL = [
    [N.E5, 0, N.G5, N.E5, N.D5, 0, N.C5, 0, N.D5, N.E5, 0, N.G5, N.A5, 0, N.G5, 0],
    [N.E5, 0, N.C5, 0, N.D5, N.C5, N.A4, 0, N.C5, 0, N.A4, N.G4, N.A4, 0, 0, 0],
    [N.A4, 0, N.C5, N.A4, N.C5, 0, N.D5, 0, N.E5, 0, N.D5, N.C5, N.A4, 0, N.C5, 0],
    [N.D5, 0, N.G4, 0, N.A4, N.C5, N.D5, 0, N.G5, 0, N.E5, 0, N.D5, 0, 0, 0],
    [N.C5, N.E5, N.G5, 0, N.A5, 0, N.G5, N.E5, N.D5, 0, N.E5, 0, N.C5, 0, 0, 0],
    [N.C5, 0, N.A4, 0, N.G4, 0, N.A4, N.C5, N.E5, 0, N.D5, 0, N.C5, 0, N.A4, 0],
    [N.A4, N.C5, 0, N.A4, N.G4, 0, N.A4, 0, N.C5, 0, N.D5, 0, N.E5, 0, N.G5, 0],
    [N.G5, 0, N.E5, 0, N.D5, 0, N.C5, 0, N.D5, 0, N.G4, 0, N.C5, 0, 0, 0]
  ];
  var SPB = 60 / 100 / 2; // 8분음표
  function tick() {
    if (!ctx || !bgmOn) return;
    while (nextT < ctx.currentTime + .35) {
      var bar = Math.floor(step / 16) % 8, s = step % 16, ch = CH[bar % 4];
      var m = MEL[bar][s]; if (m) mar(m, nextT, .17, .45, bgmG);
      if (s === 0 || s === 8) mar(ch[0], nextT, .3, .9, bgmG);
      if (s === 4 || s === 12) { mar(ch[2], nextT, .1, .35, bgmG); mar(ch[3], nextT, .08, .35, bgmG); }
      if (s % 2 === 1) noise(nextT, .03, 1800, 1200, 1.5, .035, 'bandpass', bgmG);
      nextT += SPB; step++;
    }
  }
  function startBgm() { if (!ctx || bgmOn) return; bgmOn = true; nextT = ctx.currentTime + .1; timer = setInterval(tick, 90); }
  document.addEventListener('visibilitychange', function () { if (!ctx) return; if (document.hidden) ctx.suspend(); else ctx.resume(); });
  // 시험: 효과음 하나를 오프라인으로 그려 밝기(실효 주파수)·봉우리를 잰다
  A.measure = function (name, arg) {
    var save = [ctx, bus, sfxG, bgmG, rev, noiseBuf], sr = 44100;
    var oc = new OfflineAudioContext(1, sr * 2.5, sr); ctx = oc;
    var lp = oc.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4000;
    bus = oc.createGain(); bus.connect(lp); lp.connect(oc.destination);
    sfxG = oc.createGain(); sfxG.connect(bus); bgmG = sfxG;
    noiseBuf = oc.createBuffer(1, sr, sr); var nd = noiseBuf.getChannelData(0); for (var j = 0; j < nd.length; j++) nd[j] = Math.random() * 2 - 1;
    A[name](arg);
    ctx = save[0]; bus = save[1]; sfxG = save[2]; bgmG = save[3]; rev = save[4]; noiseBuf = save[5];
    return oc.startRendering().then(function (b) {
      var x = b.getChannelData(0), s1 = 0, s2 = 0, pk = 0;
      for (var i = 1; i < x.length; i++) { s1 += x[i] * x[i]; var d = x[i] - x[i - 1]; s2 += d * d; pk = Math.max(pk, Math.abs(x[i])); }
      return { name: name, hz: Math.round(sr / (2 * Math.PI) * Math.sqrt(s2 / s1)), peak: +pk.toFixed(2) };
    });
  };
  window.DDKAudio = A;
})();
