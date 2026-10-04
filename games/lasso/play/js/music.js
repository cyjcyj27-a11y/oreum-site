// music.js — 코드로 연주하는 서부 음악. 평소엔 느린 말발굽 박자, 쫓을 땐 빨라진다
(function () {
  const { AU, actx } = CORE;
  const N = { A2: 110, C3: 130.8, D3: 146.8, E3: 164.8, F3: 174.6, G3: 196, A3: 220, B3: 246.9, C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392, Gs4: 415.3, A4: 440, B4: 493.9, C5: 523.3, D5: 587.3, E5: 659.3, F5: 698.5, G5: 784, A5: 880 };
  const CH = { Am: ['A2', 'A3', 'C4', 'E4'], C: ['C3', 'G3', 'C4', 'E4'], G: ['G3', 'G3', 'B3', 'D4'], F: ['F3', 'A3', 'C4', 'F4'], E: ['E3', 'Gs4', 'B3', 'E4'] };
  const BARS = ['Am', 'Am', 'C', 'G', 'Am', 'F', 'E', 'Am'];
  // 휘파람 가락: [박(16분 단위), 음, 길이]
  const MEL = [[[0, 'A4', 6], [8, 'C5', 4], [12, 'E5', 4]], [[0, 'D5', 4], [4, 'C5', 4], [8, 'A4', 8]], [[0, 'G4', 4], [4, 'C5', 4], [8, 'E5', 4], [12, 'G5', 4]], [[0, 'D5', 6], [6, 'B4', 2], [8, 'G4', 8]],
    [[0, 'A4', 4], [4, 'C5', 4], [8, 'E5', 4], [12, 'A5', 4]], [[0, 'F5', 6], [6, 'E5', 2], [8, 'C5', 4], [12, 'A4', 4]], [[0, 'E5', 4], [4, 'Gs4', 4], [8, 'B4', 4], [12, 'E5', 4]], [[0, 'A4', 12]]];
  let on = false, timer = null, nextT = 0, step = 0, mode = 'calm', loopN = 0;
  function pluck(f, t, dur, vol, type) { const c = AU.ctx, o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter(); o.type = type || 'sawtooth'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.setValueAtTime(2600, t); lp.frequency.exponentialRampToValueAtTime(500, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(lp); lp.connect(g); g.connect(AU.bgmGain); o.start(t); o.stop(t + dur + 0.05); }
  function whistle(f, t, dur, vol) { const c = AU.ctx, o = c.createOscillator(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f * 0.97, t); o.frequency.linearRampToValueAtTime(f, t + 0.06); l.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.012, t + dur * 0.6); l.connect(lg); lg.connect(o.frequency); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.05); g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(AU.bgmGain); o.start(t); l.start(t); o.stop(t + dur + 0.05); l.stop(t + dur + 0.05); }
  function clop(t, vol, f) { const c = AU.ctx, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.05); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07); o.connect(g); g.connect(AU.bgmGain); o.start(t); o.stop(t + 0.1); }
  function shake(t, vol) { CORE.noise(t, 0.05, vol, 6000, 1.5, AU.bgmGain, 'highpass'); }
  function sched() {
    if (!on || !AU.ctx) return;
    const bpm = mode === 'chase' ? 138 : 96, s16 = 60 / bpm / 4;
    while (nextT < AU.ctx.currentTime + 0.25) {
      const bar = Math.floor(step / 16) % 8, s = step % 16, ch = CH[BARS[bar]], t = nextT;
      if (s % 8 === 0) pluck(N[ch[0]], t, s16 * 6, 0.5, 'triangle'); if (s % 8 === 4 && mode === 'chase') pluck(N[ch[0]] * 1.5, t, s16 * 3, 0.3, 'triangle');
      if (s % 4 === 0 || s % 4 === 2 || s % 4 === 3) { // 다그닥 다그닥
        const acc = s % 4 === 0; [1, 2, 3].forEach((k, i) => pluck(N[ch[k]], t + i * 0.008, s16 * (acc ? 2.4 : 1.2), acc ? 0.11 : 0.06));
        clop(t, acc ? 0.16 : 0.09, acc ? 700 : 900);
      }
      if (s % 4 === 2) shake(t, 0.12);
      if (loopN % 2 === 1 || mode === 'chase') MEL[bar].forEach(([at, n, len]) => { if (at === s) whistle(N[n], t, len * s16 * 0.95, 0.2); });
      step++; if (step % 128 === 0) loopN++; nextT += s16;
    }
  }
  window.MUSIC = {
    start() { if (on || !AU.bgmOn || !actx()) return; on = true; nextT = AU.ctx.currentTime + 0.1; timer = setInterval(sched, 60); },
    stop() { on = false; clearInterval(timer); },
    mode(m) { mode = m; }
  };
})();
