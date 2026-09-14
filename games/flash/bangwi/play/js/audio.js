/* 방귀 뀌기 — 소리. 전부 WebAudio 로 합성한다(파일 없음, file:// 에서도 난다).
 * window.BGA = { unlock, fartOn(), fartOff(), fartWobble(t), burst(), hmm(), caught(), clear(), beat(), tick(), setOn(b), on }
 */
(function () {
  'use strict';
  var ctx = null, master = null, noiseBuf = null;
  var on = true;
  try { on = localStorage.getItem('bangwi.snd') !== '0'; } catch (e) {}

  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = on ? 0.9 : 0;
    master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  function live() { var c = ensure(); if (!c) return null; if (c.state === 'suspended') c.resume(); return c; }
  function unlock() {
    var c = live(); if (!c) return;
    try { var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) {}
  }

  // ── 방귀: 낮은 톱니파를 20~30Hz 로 떨게 하고 바람 소리를 섞는다 ──
  var F = null;
  function fartVoice(c, base, vol) {
    var t = c.currentTime;
    var o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = base;
    var o2 = c.createOscillator(); o2.type = 'square'; o2.frequency.value = base * 0.5;
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 4;
    var flap = c.createGain(); flap.gain.value = 0.5;            // 떨림(엉덩이 펄럭)
    var lfo = c.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 24;
    var lfoG = c.createGain(); lfoG.gain.value = 0.45;
    lfo.connect(lfoG); lfoG.connect(flap.gain);
    var n = c.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
    var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 380; bp.Q.value = 1.2;
    var nG = c.createGain(); nG.gain.value = 0.35;
    var out = c.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(vol, t + 0.03);
    o.connect(lp); o2.connect(lp); lp.connect(flap);
    n.connect(bp); bp.connect(nG); nG.connect(flap);
    flap.connect(out); out.connect(master);
    o.start(t); o2.start(t); lfo.start(t); n.start(t);
    return { o: o, o2: o2, lfo: lfo, n: n, lp: lp, out: out, base: base };
  }
  function killVoice(v, c, tail) {
    var t = c.currentTime;
    v.out.gain.cancelScheduledValues(t);
    v.out.gain.setValueAtTime(v.out.gain.value, t);
    v.o.frequency.setTargetAtTime(v.base * 0.55, t, tail * 0.5);   // 끝에 "푸스" 하고 내려앉는다
    v.out.gain.exponentialRampToValueAtTime(0.0001, t + tail);
    [v.o, v.o2, v.lfo, v.n].forEach(function (x) { try { x.stop(t + tail + 0.05); } catch (e) {} });
  }
  // ── 누르고 있는 동안 "뿡! 뿡! 뿌웅~" 을 끊어서 계속 터뜨린다 ──
  // 한 방마다: 앞에 "ㅃ" 터지는 소리 → 음이 위에서 아래로 떨어지는 떨림 → 짧게 끊김
  function toot(c, at, len, base, vol) {
    var o = c.createOscillator(), o2 = c.createOscillator();
    o.type = 'sawtooth'; o2.type = 'square';
    o.frequency.setValueAtTime(base * 1.35, at);
    o.frequency.exponentialRampToValueAtTime(base, at + Math.min(0.06, len * 0.4));
    o.frequency.exponentialRampToValueAtTime(base * 0.72, at + len);
    o2.frequency.setValueAtTime(base * 0.675, at);
    o2.frequency.exponentialRampToValueAtTime(base * 0.36, at + len);
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 6;
    lp.frequency.setValueAtTime(1100, at); lp.frequency.exponentialRampToValueAtTime(380, at + len);
    var flap = c.createGain(); flap.gain.value = 0.55;           // 엉덩이 펄럭
    var lfo = c.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 26 + Math.random() * 14;
    var lg = c.createGain(); lg.gain.value = 0.45; lfo.connect(lg); lg.connect(flap.gain);
    var env = c.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(vol, at + 0.012);
    env.gain.setValueAtTime(vol * 0.85, at + len * 0.7);
    env.gain.exponentialRampToValueAtTime(0.0001, at + len + 0.04);
    o.connect(lp); o2.connect(lp); lp.connect(flap); flap.connect(env); env.connect(master);
    // 맨 앞 "ㅃ"
    var n = c.createBufferSource(); n.buffer = noiseBuf;
    var nl = c.createBiquadFilter(); nl.type = 'lowpass'; nl.frequency.value = 520;
    var ng = c.createGain(); ng.gain.setValueAtTime(vol * 1.3, at); ng.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
    n.connect(nl); nl.connect(ng); ng.connect(master);
    var end = at + len + 0.06;
    o.start(at); o2.start(at); lfo.start(at); n.start(at, Math.random());
    o.stop(end); o2.stop(end); lfo.stop(end); n.stop(at + 0.06);
  }
  var F = null;                          // { next: 다음 한 방 시각 }
  function fartOn() {
    if (F) return;
    var c = live(); if (!c) return;
    F = { next: c.currentTime + 0.005, n: 0 };
    fartWobble(0, 1);
  }
  function fartOff() {
    if (!F) return;
    F = null;
    var c = ctx; if (!c || !on) return;
    toot(c, c.currentTime + 0.01, 0.06, 240, 0.25);             // 끝에 "뽁"
  }
  // 매 프레임 불러 준다: 다음 한 방이 다가오면 미리 예약한다
  function fartWobble(time, strength) {
    if (!F || !ctx) return;
    var c = ctx;
    while (F.next < c.currentTime + 0.08) {
      var r = Math.random(), len, base;
      if (r < 0.18) { len = 0.32 + Math.random() * 0.2; base = 70 + Math.random() * 20; }       // 뿌우웅
      else if (r < 0.32) { len = 0.06 + Math.random() * 0.04; base = 170 + Math.random() * 60; } // 뽁
      else { len = 0.12 + Math.random() * 0.1; base = 95 + Math.random() * 45; }                // 뿡
      if (on) toot(c, Math.max(F.next, c.currentTime), len, base * (0.85 + 0.3 * (strength || 0.5)), 0.34);
      F.next = Math.max(F.next, c.currentTime) + len + 0.05 + Math.random() * 0.07;
      F.n++;
    }
  }

  // ── 참다 터짐: 길고 큰 뿌아아앙 + 쿵 ──
  function burst() {
    var c = live(); if (!c) return;
    fartOff();
    var v = fartVoice(c, 70, 0.95), t = c.currentTime;
    v.lp.frequency.setValueAtTime(900, t);
    v.o.frequency.setValueAtTime(95, t);
    v.o.frequency.linearRampToValueAtTime(60, t + 0.6);
    v.o.frequency.linearRampToValueAtTime(110, t + 1.0);
    v.o.frequency.linearRampToValueAtTime(48, t + 1.8);
    v.lfo.frequency.setValueAtTime(30, t); v.lfo.frequency.linearRampToValueAtTime(14, t + 1.8);
    setTimeout(function () { killVoice(v, c, 0.35); }, 1700);
    var n = c.createBufferSource(); n.buffer = noiseBuf;
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160;
    var g = c.createGain(); g.gain.setValueAtTime(1.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    n.connect(lp); lp.connect(g); g.connect(master); n.start(t); n.stop(t + 1);
  }

  // ── 누가 고개를 돌리려 할 때: "흠?" ──
  function hmm() {
    var c = live(); if (!c) return;
    var t = c.currentTime;
    var o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
    o.type = 'triangle'; lp.type = 'lowpass'; lp.frequency.value = 900;
    o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(330, t + 0.22);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + 0.03);
    g.gain.setValueAtTime(0.32, t + 0.14); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(lp); lp.connect(g); g.connect(master); o.start(t); o.stop(t + 0.3);
  }

  // ── 들킴: 뿌뿌뿌뿌~ 트롬본 ──
  function caught() {
    var c = live(); if (!c) return;
    fartOff();
    var t = c.currentTime, notes = [311, 294, 277, 262];
    notes.forEach(function (f, i) {
      var st = t + 0.08 + i * 0.36, dur = i === 3 ? 0.9 : 0.32;
      var o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
      var vib = c.createOscillator(), vg = c.createGain();
      o.type = 'sawtooth'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 1100;
      vib.frequency.value = i === 3 ? 6 : 0.01; vg.gain.value = i === 3 ? 9 : 0;
      vib.connect(vg); vg.connect(o.frequency);
      if (i === 3) o.frequency.linearRampToValueAtTime(f * 0.92, st + dur);
      g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(0.3, st + 0.04);
      g.gain.setValueAtTime(0.3, st + dur - 0.08); g.gain.exponentialRampToValueAtTime(0.0001, st + dur);
      o.connect(lp); lp.connect(g); g.connect(master);
      o.start(st); vib.start(st); o.stop(st + dur + 0.02); vib.stop(st + dur + 0.02);
    });
  }

  // ── CLEAR: 딩동댕 ──
  function clear() {
    var c = live(); if (!c) return;
    fartOff();
    var t = c.currentTime;
    [523, 659, 784, 1047].forEach(function (f, i) {
      var st = t + i * 0.11, o = c.createOscillator(), g = c.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(0.28, st + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, st + (i === 3 ? 0.7 : 0.25));
      o.connect(g); g.connect(master); o.start(st); o.stop(st + 0.75);
    });
  }

  // ── 가득 찼을 때 심장 소리 ──
  function beat() {
    var c = live(); if (!c) return;
    var t = c.currentTime;
    [0, 0.16].forEach(function (d, i) {
      var o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(70, t + d); o.frequency.exponentialRampToValueAtTime(42, t + d + 0.12);
      g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(i ? 0.35 : 0.5, t + d + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.15);
      o.connect(g); g.connect(master); o.start(t + d); o.stop(t + d + 0.17);
    });
  }

  // ── PERFECT·NICE: 반짝 ──
  function tick(hi) {
    var c = live(); if (!c) return;
    var t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = 'square'; o.frequency.setValueAtTime(hi ? 1320 : 880, t); o.frequency.setValueAtTime(hi ? 1760 : 1175, t + 0.06);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.2);
  }

  function setOn(b) {
    on = !!b;
    try { localStorage.setItem('bangwi.snd', on ? '1' : '0'); } catch (e) {}
    if (master) master.gain.value = on ? 0.9 : 0;
  }

  window.BGA = { unlock: unlock, fartOn: fartOn, fartOff: fartOff, fartWobble: fartWobble, burst: burst,
    hmm: hmm, caught: caught, clear: clear, beat: beat, tick: tick, setOn: setOn, get on() { return on; } };
})();
