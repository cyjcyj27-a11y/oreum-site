/* 취권 — 소리. 전부 WebAudio 합성(파일 없음, file:// 에서도 난다).
 * window.SND = { unlock, hit(p), smash(), whoosh(p), kick(), grunt(pitch), fall(p), stab(), eat(), clear(), ding(),
 *                hurt(), beat(), setOn(b), on, setMusic(b), music, bgm(play) }
 */
(function () {
  'use strict';
  var ctx = null, master = null, sfx = null, mus = null, noiseBuf = null;
  var on = true, music = true;
  try { on = localStorage.getItem('chwigwon.snd') !== '0'; music = localStorage.getItem('chwigwon.bgm') !== '0'; } catch (e) {}

  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9;
    var lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -8; lim.knee.value = 4; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.12;
    master.connect(lim); lim.connect(ctx.destination);
    sfx = ctx.createGain(); sfx.gain.value = on ? 1 : 0; sfx.connect(master);
    mus = ctx.createGain(); mus.gain.value = music ? 0.55 : 0; mus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  function live() { var c = ensure(); if (!c) return null; if (c.state !== 'running' && c.state !== 'closed') { try { c.resume(); } catch (e) {} } return c; }
  function unlock() {
    var c = live(); if (!c) return;
    try { var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) {}
  }

  // 잡음 한 토막: 필터 종류·주파수·길이·크기
  function noise(type, f, q, dur, vol, t0, f2) {
    var c = live(); if (!c || !on) return;
    var t = t0 || c.currentTime;
    var n = c.createBufferSource(); n.buffer = noiseBuf;
    n.playbackRate.value = 0.8 + Math.random() * 0.4;
    var fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    var g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(fl); fl.connect(g); g.connect(sfx);
    n.start(t, Math.random() * 1.5); n.stop(t + dur + 0.02);
  }
  // 떨어지는 사인(둔탁한 몸 소리)
  function thump(f1, f2, dur, vol, t0, type) {
    var c = live(); if (!c || !on) return;
    var t = t0 || c.currentTime;
    var o = c.createOscillator(); o.type = type || 'sine';
    o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    var g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(sfx); o.start(t); o.stop(t + dur + 0.02);
  }

  // ── 타격음 엔진: 딱(고음 순간) + 퍽(저음 두 겹) + 뼈 으스러짐(중음 찌그러뜨림) + 복도 울림 ──
  // 모든 함수가 (c, B, t) 를 받아 오프라인으로도 뽑을 수 있다
  var NB = [];
  function nbuf(c) {
    for (var i = 0; i < NB.length; i++) if (NB[i].c === c) return NB[i].b;
    var b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = b.getChannelData(0);
    for (var j = 0; j < d.length; j++) d[j] = Math.random() * 2 - 1;
    NB.push({ c: c, b: b }); if (NB.length > 3) NB.shift();
    return b;
  }
  function makeBus(c, dest) {
    // 살짝 찌그러뜨려 두툼하게 → 눌러서 단단하게
    var sat = c.createWaveShaper(), n = 1024, cv = new Float32Array(n);
    for (var i = 0; i < n; i++) { var x = i / (n - 1) * 2 - 1; cv[i] = Math.tanh(x * 2.2) / Math.tanh(2.2); }
    sat.curve = cv;
    var comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 6; comp.ratio.value = 5; comp.attack.value = 0.002; comp.release.value = 0.09;
    var out = c.createGain(); out.gain.value = 1.15;
    sat.connect(comp); comp.connect(out); out.connect(dest);
    // 복도 울림: 짧고 밝은 잔향(0.45초)
    var len = Math.floor(c.sampleRate * 0.45), ir = c.createBuffer(2, len, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = ir.getChannelData(ch), lp = 0;
      for (var k = 0; k < len; k++) {
        var tt = k / c.sampleRate, e = Math.pow(1 - k / len, 3.2);
        var early = (Math.abs(tt - 0.011 - ch * 0.004) < 0.0008 || Math.abs(tt - 0.027 + ch * 0.003) < 0.0008) ? 0.8 : 0;
        lp = lp * 0.55 + (Math.random() * 2 - 1) * 0.45;
        d[k] = (lp * e + early * e) * 0.6;
      }
    }
    var conv = c.createConvolver(); conv.buffer = ir;
    var wet = c.createGain(); wet.gain.value = 0.22;
    conv.connect(wet); wet.connect(dest);
    return { hit: sat, verb: conv };
  }
  function env(c, g, t, peak, att, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + att);
    g.gain.exponentialRampToValueAtTime(0.0001, t + att + dec);
  }
  function nz(c, B, t, type, f, q, att, dec, vol, verb, f2) {
    var n = c.createBufferSource(); n.buffer = nbuf(c); n.playbackRate.value = 0.85 + Math.random() * 0.3;
    var fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + att + dec);
    var g = c.createGain(); env(c, g, t, vol, att, dec);
    n.connect(fl); fl.connect(g); g.connect(B.hit); if (verb) { var v = c.createGain(); v.gain.value = verb; g.connect(v); v.connect(B.verb); }
    n.start(t, Math.random() * 1.5); n.stop(t + att + dec + 0.03);
  }
  function tn(c, B, t, type, f1, f2, glide, att, dec, vol, verb) {
    var o = c.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + glide);
    var g = c.createGain(); env(c, g, t, vol, att, dec);
    o.connect(g); g.connect(B.hit); if (verb) { var v = c.createGain(); v.gain.value = verb; g.connect(v); v.connect(B.verb); }
    o.start(t); o.stop(t + att + dec + 0.03);
  }
  function sHit(c, B, t, p) {
    p = p || 1; var r = 0.92 + Math.random() * 0.16;
    nz(c, B, t, 'highpass', 2600 * r, 0.7, 0.0004, 0.02, 1.5 * p, 0.3);            // 딱
    nz(c, B, t, 'bandpass', 4800 * r, 1.3, 0.0004, 0.03, 0.8 * p, 0.25);
    nz(c, B, t + 0.001, 'bandpass', 2300 * r, 1.4, 0.001, 0.04, 1.0 * p, 0.25);   // 짝
    tn(c, B, t, 'triangle', 420 * r, 160, 0.03, 0.001, 0.05, 0.55 * p, 0.1);       // 살 맞는 찰싹
    nz(c, B, t + 0.002, 'bandpass', 1100 * r, 1.1, 0.002, 0.07, 1.25 * p, 0.3);    // 으스러짐
    tn(c, B, t, 'sine', 170 * r, 55, 0.07, 0.001, 0.12 + 0.04 * p, 0.62 * Math.min(1.4, p), 0.12);   // 퍽
    tn(c, B, t, 'sine', 72, 42, 0.12, 0.002, 0.14, 0.28 * p, 0);                    // 밑바닥
  }
  function sSmash(c, B, t) {
    sHit(c, B, t, 1.45);
    [1870, 2960, 4420, 6100].forEach(function (f, i) { tn(c, B, t + 0.003, 'sine', f, f * 0.995, 0.3, 0.001, 0.4 - i * 0.06, 0.24 / (1 + i * 0.5), 0.55); });  // 쇠망치 울림
    tn(c, B, t, 'sine', 80, 30, 0.35, 0.002, 0.42, 0.62, 0.3);                      // 쿵
    nz(c, B, t + 0.02, 'bandpass', 1400, 0.8, 0.01, 0.3, 0.7, 0.45);                 // 부서지는 잔소리
  }
  function sKick(c, B, t) {
    var r = 0.94 + Math.random() * 0.12;
    nz(c, B, t, 'bandpass', 2400 * r, 1, 0.0008, 0.018, 0.55, 0.2);
    tn(c, B, t, 'sine', 130 * r, 48, 0.08, 0.001, 0.16, 0.95, 0.15);
    nz(c, B, t, 'lowpass', 700, 0.8, 0.002, 0.08, 0.6, 0.2);
  }
  function sFall(c, B, t, p) {
    p = p || 1;
    tn(c, B, t, 'sine', 95, 34, 0.18, 0.002, 0.26, 0.85 * p, 0.25);
    nz(c, B, t, 'lowpass', 520, 0.8, 0.004, 0.2, 0.6 * p, 0.35);
    nz(c, B, t + 0.05, 'bandpass', 1600, 1.2, 0.003, 0.05, 0.18 * p, 0.3);
  }
  function sWhoosh(c, B, t, p) {
    p = p || 1;
    nz(c, B, t, 'bandpass', 380, 1.6, 0.05, 0.1 + p * 0.05, 0.42 * p, 0.1, 2800);
    nz(c, B, t + 0.02, 'highpass', 4000, 0.6, 0.04, 0.08, 0.12 * p, 0);
  }
  function sSlam(c, B, t) {
    tn(c, B, t, 'sine', 110, 30, 0.3, 0.001, 0.4, 1.0, 0.35);          // 쿵
    nz(c, B, t, 'highpass', 1800, 0.7, 0.0005, 0.03, 0.9, 0.3);        // 철퍽(맞닿는 순간)
    nz(c, B, t + 0.002, 'bandpass', 700, 0.9, 0.003, 0.14, 1.0, 0.4);
    nz(c, B, t + 0.09, 'lowpass', 600, 0.8, 0.005, 0.2, 0.5, 0.4);      // 한 번 더 튀며 쓸림
  }
  var LB = null;
  function lb() { var c = live(); if (!c || !on) return null; if (!LB) LB = makeBus(c, sfx); return c; }
  function hit(p) { var c = lb(); if (c) sHit(c, LB, c.currentTime, p); }
  function smash() { var c = lb(); if (c) sSmash(c, LB, c.currentTime); }
  function whoosh(p) { var c = lb(); if (c) sWhoosh(c, LB, c.currentTime, p); }
  function kick() { var c = lb(); if (c) sKick(c, LB, c.currentTime); }
  function fall(p) { var c = lb(); if (c) sFall(c, LB, c.currentTime, p); }
  function slam() { var c = lb(); if (c) sSlam(c, LB, c.currentTime); }
  function grunt(pitch) {     // "억" — 짧은 톱니 목소리
    var c = live(); if (!c || !on) return;
    var t = c.currentTime, f = (pitch || 1) * (110 + Math.random() * 40);
    var o = c.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(f * 1.25, t); o.frequency.exponentialRampToValueAtTime(f * 0.7, t + 0.2);
    var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 650 + Math.random() * 250; bp.Q.value = 3;
    var bp2 = c.createBiquadFilter(); bp2.type = 'bandpass'; bp2.frequency.value = 1150; bp2.Q.value = 4;
    var g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(bp); o.connect(bp2); bp.connect(g); bp2.connect(g); g.connect(sfx);
    o.start(t); o.stop(t + 0.25);
  }
  function stab() {           // 칼 — 금속 쨍
    var c = live(); if (!c || !on) return;
    var t = c.currentTime;
    [2350, 3120, 4700].forEach(function (f, i) {
      var o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      var g = c.createGain(); g.gain.setValueAtTime(0.12 / (i + 1), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g); g.connect(sfx); o.start(t); o.stop(t + 0.4);
    });
    noise('highpass', 3000, 1, 0.08, 0.3);
    hurt();
  }
  function hurt() {           // 주인공이 맞음 — 낮은 신음
    grunt(0.72);
    thump(110, 50, 0.12, 0.5);
  }
  function eat() {            // 군만두 바삭
    var c = live(); if (!c) return;
    for (var i = 0; i < 4; i++) noise('bandpass', 1800 + Math.random() * 1500, 2, 0.05, 0.35, c.currentTime + i * 0.09);
    tone(660, 0.12, 0.12, c.currentTime + 0.38, 'triangle'); tone(990, 0.2, 0.12, c.currentTime + 0.48, 'triangle');
  }
  function tone(f, dur, vol, t, type) {
    var c = live(); if (!c || !on) return;
    t = t || c.currentTime;
    var o = c.createOscillator(); o.type = type || 'sine'; o.frequency.value = f;
    var g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(sfx); o.start(t); o.stop(t + dur + 0.02);
  }
  function ding() { var c = live(); if (!c) return; tone(1318, 0.9, 0.2, c.currentTime); tone(1046, 1.1, 0.16, c.currentTime + 0.28); }
  function clear() {
    var c = live(); if (!c) return;
    var t = c.currentTime;
    [57, 60, 64, 69].forEach(function (m, i) { tone(mtof(m), 0.9 - i * 0.1, 0.14, t + i * 0.11, 'triangle'); });
  }
  function beat() { thump(70, 40, 0.12, 0.5); thump(65, 38, 0.12, 0.4, (live() || {}).currentTime + 0.16); }
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  // ── 음악: 볼링 코드 음악 틀(16분 스케줄러 + 킥·햇·스네어 + 옥타브 베이스 + 가끔 리드).
  //    취권 분위기로 124bpm, 라단조 5음계(D F G A C). 리드는 삼각파에 비브라토(얼후 흉내).
  var BPM = 124, S16 = 60 / BPM / 4, playing = false, nextT = 0, stepN = 0, timer = null;
  var PROG = [[50, 62, 65, 69], [48, 60, 65, 67], [53, 65, 69, 72], [45, 57, 60, 64]];   // Dm  C  F  Am
  var LEAD = [74, -1, 77, 79, -1, 81, -1, 79, 77, -1, 74, -1, 72, 74, -1, -1];
  var LEAD2 = [81, -1, 84, -1, 81, 79, -1, 77, -1, 79, 77, 74, -1, 72, -1, -1];
  function mNote(f, t, dur, type, vol, cut, vib) {
    var c = ctx, o = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter();
    o.type = type; o.frequency.value = f;
    fl.type = 'lowpass'; fl.frequency.value = cut || 1800;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (vib) { var v = c.createOscillator(), vg = c.createGain(); v.frequency.value = 5.5; vg.gain.value = f * 0.012; v.connect(vg); vg.connect(o.frequency); v.start(t); v.stop(t + dur + 0.05); }
    o.connect(fl); fl.connect(g); g.connect(mus); o.start(t); o.stop(t + dur + 0.05);
  }
  function mNoise(t, dur, vol, type, f) {
    var c = ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noiseBuf; fl.type = type; fl.frequency.value = f;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(mus); s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }
  function kickDrum(t) { var c = ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); g.gain.setValueAtTime(0.8, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.connect(g); g.connect(mus); o.start(t); o.stop(t + 0.2); }
  function woodblock(t, hi) { var c = ctx, o = c.createOscillator(), g = c.createGain(); o.type = 'square'; o.frequency.value = hi ? 1650 : 1100; g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); o.connect(g); g.connect(mus); o.start(t); o.stop(t + 0.06); }
  function schedule() {
    if (!ctx || !playing) return;
    while (nextT < ctx.currentTime + 0.25) {
      var t = nextT, s = stepN % 16, bar = Math.floor(stepN / 16) % 4, ch = PROG[bar], phrase = Math.floor(stepN / 64) % 4;
      if (s % 4 === 0) kickDrum(t);
      if (s % 4 === 2) mNoise(t, 0.08, 0.28, 'highpass', 7000);
      if (s === 4 || s === 12) mNoise(t, 0.15, 0.4, 'bandpass', 1800);
      if (s === 6 || s === 14 || s === 11) woodblock(t, s === 11);           // 목탁 딱딱
      mNote(mtof(ch[0] - 12 + (s % 2 ? 12 : 0)), t, S16 * 0.9, 'sawtooth', 0.2, 700);   // 옥타브 베이스
      if (s % 8 === 3 || s % 8 === 6) for (var k = 1; k < 4; k++) mNote(mtof(ch[k]), t, S16 * 1.5, 'square', 0.03, 2400);
      var L = (phrase === 1 ? LEAD : phrase === 3 ? LEAD2 : null);
      if (L && L[s] > 0) mNote(mtof(L[s] + (bar === 1 ? -2 : bar === 3 ? -3 : 0)), t, S16 * 2.2, 'triangle', 0.085, 3000, true);
      nextT += S16; stepN++;
    }
  }
  function bgm(play) {
    var c = live(); if (!c) return;
    if (play && !playing) { playing = true; nextT = c.currentTime + 0.1; stepN = 0; timer = setInterval(schedule, 50); schedule(); }
    if (!play && playing) { playing = false; clearInterval(timer); }
  }
  // 술 마시는 소리(꿀꺽)·트림·취한 딸꾹질
  function gulp() { var c = live(); if (!c || !on) return; var t = c.currentTime; [0, 0.16, 0.32].forEach(function (d, i) { thump(180 + i * 20, 90, 0.11, 0.35, t + d, 'triangle'); noise('lowpass', 900, 1, 0.08, 0.25, t + d + 0.03); }); }
  function burp() { var c = live(); if (!c || !on) return; var t = c.currentTime; thump(120, 70, 0.35, 0.45, t, 'sawtooth'); noise('bandpass', 400, 2, 0.3, 0.3, t); }
  function hic() { var c = live(); if (!c || !on) return; var t = c.currentTime; thump(300, 620, 0.09, 0.28, t, 'square'); }
  function gong() { var c = live(); if (!c) return; var t = c.currentTime; [196, 294, 392, 587].forEach(function (f, i) { tone(f, 2.4 - i * 0.3, 0.16 - i * 0.03, t, i ? 'sine' : 'triangle'); }); noise('bandpass', 700, 3, 0.5, 0.25, t); }

  window.SND = {
    unlock: unlock, hit: hit, smash: smash, whoosh: whoosh, kick: kick, grunt: grunt, fall: fall, stab: stab,
    eat: eat, clear: clear, ding: ding, hurt: hurt, beat: beat, bgm: bgm, gulp: gulp, burp: burp, hic: hic, gong: gong,
    _synth: { makeBus: makeBus, hit: sHit, smash: sSmash, kick: sKick, fall: sFall, whoosh: sWhoosh, slam: sSlam },
    slam: slam,
    get on() { return on; }, get music() { return music; },
    setOn: function (b) { on = b; try { localStorage.setItem('chwigwon.snd', b ? '1' : '0'); } catch (e) {} if (sfx) sfx.gain.value = b ? 1 : 0; },
    setMusic: function (b) { music = b; try { localStorage.setItem('chwigwon.bgm', b ? '1' : '0'); } catch (e) {} if (mus) mus.gain.value = b ? 0.55 : 0; }
  };
})();
