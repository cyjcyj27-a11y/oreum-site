/* audio.js — 웹오디오로 합성한 소리 (파일 없음, file:// 에서도 동작) */
(function () {
  let ctx = null, master = null, on = true, amb = null;
  try { on = localStorage.getItem('castaway.snd') !== '0'; } catch (e) { }
  function ac() {
    if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = on ? .8 : 0; master.connect(ctx.destination); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function env(g, t, a, d, peak) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0005, t + a + d); }
  function noiseBuf(c, sec) { const b = c.createBuffer(1, c.sampleRate * sec, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
  function burst(sec, peak, a, d, type, freq, q) { const c = ac(), t = c.currentTime, n = c.createBufferSource(); n.buffer = noiseBuf(c, sec); const g = c.createGain(); env(g, t, a, d, peak); const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 1; n.connect(f); f.connect(g); g.connect(master); n.start(t); return { n, g, f, t, c }; }
  function tone(type, f0, f1, len, peak, a) { const c = ac(), t = c.currentTime, o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + len); const g = c.createGain(); env(g, t, a || .01, len, peak); o.connect(g); g.connect(master); o.start(t); o.stop(t + len + .1); return o; }

  const A = {
    get on() { return on; },
    toggle() { on = !on; try { localStorage.setItem('castaway.snd', on ? '1' : '0'); } catch (e) { } if (master) master.gain.setTargetAtTime(on ? .8 : 0, ac().currentTime, .05); return on; },
    unlock() { try { ac(); A.ambient(); } catch (e) { } },
    // 파도·바람 — 노이즈에 느린 LFO
    ambient() {
      if (amb) return; const c = ac();
      const mk = (cut, q, lfoF, depth, vol) => { const n = c.createBufferSource(); n.buffer = noiseBuf(c, 4); n.loop = true; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut; f.Q.value = q; const g = c.createGain(); g.gain.value = vol; const l = c.createOscillator(); l.frequency.value = lfoF; const lg = c.createGain(); lg.gain.value = depth; l.connect(lg); lg.connect(f.frequency); const l2 = c.createOscillator(); l2.frequency.value = lfoF * 1.37; const l2g = c.createGain(); l2g.gain.value = vol * .5; l2.connect(l2g); l2g.connect(g.gain); n.connect(f); f.connect(g); g.connect(master); n.start(); l.start(); l2.start(); return g; };
      amb = { sea: mk(420, .7, .09, 260, .11), wind: mk(1400, .3, .05, 700, .035) };
    },
    setSea(k) { if (amb) amb.sea.gain.setTargetAtTime(.08 + .07 * k, ac().currentTime, .5); },
    cast() { burst(.35, .18, .02, .3, 'bandpass', 900, .6); tone('sine', 300, 90, .25, .05); },
    plop() { tone('sine', 520, 140, .16, .22, .004); burst(.15, .12, .005, .12, 'lowpass', 1200); },
    splash(size) { size = size || 1; burst(.5, .32 * Math.min(1.6, size), .01, .35 + .15 * size, 'lowpass', 2200 + 600 * size); tone('sine', 220, 70, .2, .1 * size, .005); },
    nibble() { tone('sine', 700, 500, .06, .08, .003); },
    bite() { tone('sine', 380, 120, .18, .3, .003); burst(.25, .25, .005, .2, 'bandpass', 1500, .8); },
    hook() { tone('square', 180, 420, .08, .12, .003); },
    reelTick() { tone('square', 1800, 1500, .015, .05, .001); },
    creak(k) { if (Math.random() > k * .9) return; tone('sawtooth', 120 + Math.random() * 60, 90, .12, .04 * k, .01); },
    snap() { tone('square', 900, 200, .12, .3, .002); burst(.2, .3, .002, .15, 'highpass', 2500); },
    miss() { tone('triangle', 330, 220, .25, .12, .01); },
    catchFan(tier) {
      const c = ac(), t = c.currentTime, notes = tier >= 3 ? [523, 659, 784, 1047, 1319, 1568] : tier === 2 ? [523, 659, 784, 1047] : [660, 880];
      notes.forEach((f, i) => { const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f; const g = c.createGain(); env(g, t + i * .12, .01, .4, .16); o.connect(g); g.connect(master); o.start(t + i * .12); o.stop(t + i * .12 + .5); });
    },
    flop() { burst(.08, .12, .003, .06, 'lowpass', 700); },
    eat() { [0, .18, .36].forEach(dt => setTimeout(() => burst(.06, .18, .003, .05, 'bandpass', 2000, 2), dt * 1000)); setTimeout(() => tone('sine', 300, 380, .2, .06), 600); },
    day() { [523, 784].forEach((f, i) => setTimeout(() => tone('sine', f, f, .4, .12, .02), i * 200)); },
    gull() { const c = ac(), t = c.currentTime, o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(1100, t); o.frequency.linearRampToValueAtTime(1500, t + .12); o.frequency.linearRampToValueAtTime(900, t + .4); const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 3; const g = c.createGain(); env(g, t, .02, .4, .04); o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + .5); },
    gameover() { [392, 330, 262].forEach((f, i) => setTimeout(() => tone('triangle', f, f * .9, .6, .14, .02), i * 350)); },
    clear() { const c = ac(), t = c.currentTime;[523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => { const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f; const g = c.createGain(); env(g, t + i * .16, .01, .6, .14); o.connect(g); g.connect(master); o.start(t + i * .16); o.stop(t + i * .16 + .7); }); },
  };
  window.AUDIO = A;
})();
