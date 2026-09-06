/* audio.js — 웹오디오로 합성한 효과음 (파일 없음, file:// 에서도 동작) */
(function () {
  let ctx = null, master = null, on = true;
  try { on = localStorage.getItem('shibavet.snd') !== '0'; } catch (e) { }
  function ac() {
    if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = .8; master.connect(ctx.destination); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function env(g, t, a, d, peak) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0005, t + a + d); }
  function noiseBuf(c, sec) { const b = c.createBuffer(1, c.sampleRate * sec, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
  function pan(c, x) { const p = c.createStereoPanner ? c.createStereoPanner() : null; if (p) { p.pan.value = Math.max(-1, Math.min(1, x || 0)); p.connect(master); return p; } return master; }

  const A = {
    get on() { return on; },
    toggle() { on = !on; try { localStorage.setItem('shibavet.snd', on ? '1' : '0'); } catch (e) { } return on; },
    unlock() { try { ac(); } catch (e) { } },
    // 시바 짖음 — 짧은 톤 + 노이즈 (vol 0~1, px 좌우)
    bark(vol, px) {
      if (!on) return; const c = ac(), t = c.currentTime, g = c.createGain(); g.connect(pan(c, px)); env(g, t, .01, .16, (vol == null ? 1 : vol) * .5);
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(260, t + .16);
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 1.4; o.connect(f); f.connect(g); o.start(t); o.stop(t + .2);
      const n = c.createBufferSource(); n.buffer = noiseBuf(c, .1); const ng = c.createGain(); env(ng, t, .005, .07, (vol == null ? 1 : vol) * .25); const nf = c.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 1800; n.connect(nf); nf.connect(ng); ng.connect(pan(c, px)); n.start(t);
    },
    // 엄살 낑낑 — 올라갔다 떨리는 사인파
    whine(len, vol, px) {
      if (!on) return; const c = ac(), t = c.currentTime, L = len || .7, g = c.createGain(); g.connect(pan(c, px)); env(g, t, .06, L, (vol == null ? 1 : vol) * .28);
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(900, t); o.frequency.linearRampToValueAtTime(1500, t + L * .4); o.frequency.linearRampToValueAtTime(1100, t + L);
      const v = c.createOscillator(); v.frequency.value = 9; const vg = c.createGain(); vg.gain.value = 60; v.connect(vg); vg.connect(o.frequency);
      const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.setValueAtTime(1800, t); o2.frequency.linearRampToValueAtTime(3000, t + L * .4); o2.frequency.linearRampToValueAtTime(2200, t + L); const g2 = c.createGain(); g2.gain.value = .25; o2.connect(g2); g2.connect(g);
      o.connect(g); o.start(t); v.start(t); o2.start(t); o.stop(t + L + .1); v.stop(t + L + .1); o2.stop(t + L + .1);
    },
    // 헥헥 — 숨소리 (짧은 노이즈 두 번)
    pant(px) {
      if (!on) return; const c = ac(), t = c.currentTime;
      [0, .22].forEach((dt, i) => { const n = c.createBufferSource(); n.buffer = noiseBuf(c, .15); const g = c.createGain(); env(g, t + dt, .03, .1, i ? .08 : .12); const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = i ? 1200 : 700; f.Q.value = .8; n.connect(f); f.connect(g); g.connect(pan(c, px)); n.start(t + dt); });
    },
    step(hard, run) {
      if (!on) return; const c = ac(), t = c.currentTime, n = c.createBufferSource(); n.buffer = noiseBuf(c, .06); const g = c.createGain(); env(g, t, .004, hard ? .05 : .08, run ? .12 : .07);
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = hard ? 1400 : 500; n.connect(f); f.connect(g); g.connect(master); n.start(t);
    },
    door(open) {
      if (!on) return; const c = ac(), t = c.currentTime, o = c.createOscillator(); o.type = 'sawtooth'; const g = c.createGain(); env(g, t, .04, .35, .06);
      o.frequency.setValueAtTime(open ? 180 : 260, t); o.frequency.linearRampToValueAtTime(open ? 260 : 120, t + .35); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + .4);
      if (!open) { const n = c.createBufferSource(); n.buffer = noiseBuf(c, .08); const ng = c.createGain(); env(ng, t + .3, .003, .07, .25); n.connect(ng); ng.connect(master); n.start(t + .3); }
    },
    grab() {
      if (!on) return; const c = ac(), t = c.currentTime, n = c.createBufferSource(); n.buffer = noiseBuf(c, .2); const g = c.createGain(); env(g, t, .01, .18, .2); const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 600; n.connect(f); f.connect(g); g.connect(master); n.start(t);
    },
    pat() {
      if (!on) return; const c = ac(), t = c.currentTime, n = c.createBufferSource(); n.buffer = noiseBuf(c, .05); const g = c.createGain(); env(g, t, .003, .05, .15); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 800; n.connect(f); f.connect(g); g.connect(master); n.start(t);
    },
    alert() {
      if (!on) return; const c = ac(), t = c.currentTime, o = c.createOscillator(); o.type = 'square'; const g = c.createGain(); env(g, t, .005, .12, .07); o.frequency.setValueAtTime(880, t); o.frequency.setValueAtTime(1320, t + .06); o.connect(g); g.connect(master); o.start(t); o.stop(t + .15);
    },
    escape() { A.whine(.35, 1); setTimeout(() => A.bark(.8), 200); },
    clear() {
      if (!on) return; const c = ac(), t = c.currentTime;
      [523, 659, 784, 1047].forEach((f, i) => { const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f; const g = c.createGain(); env(g, t + i * .13, .01, .35, .18); o.connect(g); g.connect(master); o.start(t + i * .13); o.stop(t + i * .13 + .4); });
    },
    engine() {
      if (!on) return; const c = ac(), t = c.currentTime, o = c.createOscillator(); o.type = 'sawtooth'; const g = c.createGain(); env(g, t, .3, 1.6, .1); o.frequency.setValueAtTime(60, t); o.frequency.linearRampToValueAtTime(140, t + 1.6); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400; o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + 2);
    },
  };
  window.AUDIO = A;
})();
