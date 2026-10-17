// 소리: 전부 코드로. 공 튀는 소리·림 쇳소리·백보드 퉁·그물 쉭 + 보상음(마림바) + 배경음(펑키 오락실).
// 규칙: 보상음은 사인·삼각파, 4kHz 위는 거름, 장조 5음계 안의 음, 크게 할 땐 음 높이 말고 음 수·화음으로.
(function () {
  const A = (window.AU = {});
  let ctx = null, sfx = null, mus = null, bus = null, noiseBuf = null;
  const load = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v === '1'; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) {} };
  A.snd = load('hoops.snd', true);
  A.bgm = load('hoops.bgm', true);
  const SV = 0.85, MV = 0.13;

  function makeBus(ac, dest) {
    const input = ac.createGain();
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4000; lp.Q.value = 0.5;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    const len = Math.floor(ac.sampleRate * 0.9), ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let s = 999 + c * 777; for (let i = 0; i < len; i++) { s = (s * 16807) % 2147483647; d[i] = ((s / 2147483647) * 2 - 1) * Math.pow(1 - i / len, 3.4); } }
    const rev = ac.createConvolver(); rev.buffer = ir;
    const wet = ac.createGain(); wet.gain.value = 0.16;
    const revLp = ac.createBiquadFilter(); revLp.type = 'lowpass'; revLp.frequency.value = 2400;
    input.connect(lp); input.connect(rev); rev.connect(revLp); revLp.connect(wet); wet.connect(lp);
    lp.connect(comp); comp.connect(dest);
    return input;
  }
  function ensure() {
    if (ctx) return ctx;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    sfx = ctx.createGain(); sfx.gain.value = A.snd ? SV : 0; sfx.connect(ctx.destination);
    bus = makeBus(ctx, sfx);
    mus = ctx.createGain(); mus.gain.value = A.bgm ? MV : 0; mus.connect(ctx.destination);
    const n = ctx.sampleRate * 1.2; noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); let s = 4321; for (let i = 0; i < n; i++) { s = (s * 16807) % 2147483647; d[i] = (s / 2147483647) * 2 - 1; }
    return ctx;
  }
  A.ctx = () => ctx;
  A.unlock = function () { if (!ensure()) return; if (ctx.state === 'suspended') ctx.resume(); if (!timer) startMusic(); };
  A.setSnd = function (v) { A.snd = v; save('hoops.snd', v); if (sfx) sfx.gain.value = v ? SV : 0; };
  A.setBgm = function (v) { A.bgm = v; save('hoops.bgm', v); if (mus) mus.gain.value = v ? MV : 0; };

  function voice(out, f, t, o) {
    const ac = ctx, g = ac.createGain(); g.connect(out);
    const att = o.att || 0.005, dur = o.dur || 0.5, vol = o.vol || 0.3;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + att + dur);
    (o.parts || [[1, 1, 1]]).forEach(([ratio, amp, decK]) => {
      const osc = ac.createOscillator(), pg = ac.createGain();
      osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f * ratio, t);
      if (o.glide) osc.frequency.exponentialRampToValueAtTime(o.glide * ratio, t + att + dur);
      pg.gain.setValueAtTime(amp, t);
      if (decK < 1) pg.gain.exponentialRampToValueAtTime(Math.max(0.0001, amp * 0.001), t + att + dur * decK);
      osc.connect(pg); pg.connect(g); osc.start(t); osc.stop(t + att + dur + 0.05);
    });
  }
  function noise(out, t, o) {
    const ac = ctx, src = ac.createBufferSource(); src.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = o.ft || 'bandpass'; f.frequency.setValueAtTime(o.f || 1000, t); f.Q.value = o.q || 1;
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + (o.dur || 0.2));
    const g = ac.createGain(); const att = o.att || 0.003, dur = o.dur || 0.2;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(o.vol || 0.3, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + att + dur);
    src.connect(f); f.connect(g); g.connect(out);
    src.start(t, Math.random() * 0.5); src.stop(t + att + dur + 0.05);
  }
  const MAR = { type: 'sine', parts: [[1, 1, 1], [4, 0.18, 0.12], [2, 0.12, 0.3]], att: 0.004 };
  const NOTE = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const last = {};
  A.play = function (name, k) {
    if (!ctx || !A.snd) return;
    const t = ctx.currentTime + 0.005, now = performance.now();
    k = k == null ? 1 : k;
    // 같은 소리가 한꺼번에 몰리면 줄임
    if (last[name] && now - last[name] < 28) return; last[name] = now;
    const v = Math.min(1, k);
    switch (name) {
      case 'throw': noise(bus, t, { ft: 'bandpass', f: 500, f2: 1400, q: 0.8, dur: 0.22, vol: 0.16, att: 0.04 }); break;
      case 'rim': // 쇠 림: 배음이 안 맞는 짧은 땡 + 낮은 웅
        voice(bus, 560 + Math.random() * 40, t, { parts: [[1, 1, 0.5], [2.13, 0.45, 0.25], [2.9, 0.22, 0.18]], dur: 0.38, vol: 0.12 + v * 0.16 });
        voice(bus, 140, t, { dur: 0.12, vol: 0.12 * v, type: 'triangle' }); break;
      case 'board': voice(bus, 120, t, { glide: 80, dur: 0.16, vol: 0.2 + 0.15 * v, type: 'sine' }); noise(bus, t, { ft: 'lowpass', f: 700, dur: 0.07, vol: 0.18 * v }); break;
      case 'floor': voice(bus, 105, t, { glide: 62, dur: 0.14, vol: 0.16 + v * 0.14 }); noise(bus, t, { ft: 'lowpass', f: 500, dur: 0.05, vol: 0.12 * v }); break;
      case 'bb': voice(bus, 150, t, { glide: 100, dur: 0.08, vol: 0.08 + v * 0.06 }); break;
      case 'net': noise(bus, t, { ft: 'lowpass', f: 900, dur: 0.12, vol: 0.06 + 0.05 * v }); break;
      case 'lip': voice(bus, 300, t, { parts: [[1, 1, 1], [2.4, 0.3, 0.3]], dur: 0.1, vol: 0.06 + 0.06 * v }); break;
      case 'swish': noise(bus, t, { ft: 'bandpass', f: 1600, f2: 900, q: 0.7, dur: 0.32, vol: 0.2, att: 0.02 }); break;
      case 'score': { const base = 72; [0, 4, 7].forEach((s, i) => voice(bus, NOTE(base + s), t + i * 0.055, { ...MAR, dur: 0.5, vol: 0.16 })); break; }
      case 'bonus': { [72, 76, 79, 84].forEach((m, i) => voice(bus, NOTE(m), t + i * 0.05, { ...MAR, dur: 0.6, vol: 0.15 })); break; }
      case 'fire': { noise(bus, t, { ft: 'bandpass', f: 300, f2: 1200, q: 0.6, dur: 0.6, vol: 0.2, att: 0.08 }); [60, 64, 67, 72, 76].forEach((m, i) => voice(bus, NOTE(m), t + 0.1 + i * 0.06, { ...MAR, dur: 0.5, vol: 0.13 })); break; }
      case 'tick': voice(bus, 880, t, { type: 'triangle', parts: [[1, 1, 1], [2, 0.2, 0.3]], dur: 0.07, vol: 0.12 }); break;
      case 'tick2': voice(bus, 660, t, { type: 'triangle', parts: [[1, 1, 1]], dur: 0.06, vol: 0.1 }); break;
      case 'click': voice(bus, 180, t, { glide: 110, dur: 0.1, vol: 0.22 }); noise(bus, t, { ft: 'lowpass', f: 900, dur: 0.04, vol: 0.12 }); break;
      case 'end': // 시간 끝: 낮은 화음 통
        [48, 55, 60].forEach((m) => voice(bus, NOTE(m), t, { type: 'triangle', parts: [[1, 1, 1], [2, 0.2, 0.4]], dur: 0.9, vol: 0.12 })); break;
      case 'clear': { const seq = [[67, 0], [72, 0.12], [76, 0.24], [79, 0.36], [84, 0.52]]; seq.forEach(([m, d]) => voice(bus, NOTE(m), t + d, { ...MAR, dur: 0.7, vol: 0.16 }));
        [60, 64, 67, 72].forEach((m) => voice(bus, NOTE(m), t + 0.52, { type: 'triangle', dur: 1.4, vol: 0.06, att: 0.05 })); break; }
      case 'fail': { [64, 62, 59, 55].forEach((m, i) => voice(bus, NOTE(m - 12), t + i * 0.16, { type: 'triangle', parts: [[1, 1, 1], [2, 0.15, 0.3]], dur: 0.5, vol: 0.13 })); break; }
      case 'ticket': voice(bus, 420 + Math.random() * 30, t, { type: 'triangle', parts: [[1, 1, 1], [3, 0.1, 0.2]], dur: 0.035, vol: 0.07 }); break;
      case 'star': { [79, 84, 88].forEach((m, i) => voice(bus, NOTE(m - 12 + k * 2), t + i * 0.04, { ...MAR, dur: 0.6, vol: 0.13 })); break; }
      case 'champ': { const seq = [60, 64, 67, 72, 67, 72, 76, 79, 84]; seq.forEach((m, i) => voice(bus, NOTE(m), t + i * 0.11, { ...MAR, dur: 0.9, vol: 0.15 }));
        [[48, 55, 64], [53, 60, 69], [55, 62, 71], [60, 67, 76]].forEach((ch, j) => ch.forEach((m) => voice(bus, NOTE(m), t + j * 0.5, { type: 'triangle', dur: 0.9, vol: 0.05, att: 0.04 }))); break; }
    }
  };

  // ── 배경음: 112bpm 펑키 오락실(베이스 + 일렉 피아노 화음 + 부드러운 북). Em7 - A7 - Dmaj7 - Bm7
  let timer = null, nextT = 0, step = 0;
  const BPM = 112, S16 = 60 / BPM / 4;
  const CH = [[52, [64, 67, 71, 74]], [57, [64, 67, 69, 73]], [50, [62, 66, 69, 73]], [47, [62, 66, 69, 71]]];
  const BASS = [0, -1, 12, -1, 0, -1, 7, 10, 0, -1, 12, -1, 7, -1, 5, 7];
  const MEL = [[0, 76], [3, 79], [6, 81], [10, 79], [12, 76], [14, 74]];
  function kick(t) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.9, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(g); g.connect(mus); o.start(t); o.stop(t + 0.25); }
  function snare(t) { noise(mus, t, { ft: 'bandpass', f: 1200, q: 0.7, dur: 0.12, vol: 0.32 }); voice(mus, 190, t, { dur: 0.07, vol: 0.18, type: 'triangle' }); }
  function hat(t, v) { noise(mus, t, { ft: 'bandpass', f: 3200, q: 1.2, dur: 0.03, vol: v }); }
  function sched() {
    if (!ctx) return;
    while (nextT < ctx.currentTime + 0.25) {
      const bar = Math.floor(step / 16) % 4, s = step % 16, ch = CH[bar], t = nextT;
      if (A.bgm) {
        if (s === 0 || s === 10) kick(t);
        if (s === 4 || s === 12) snare(t);
        if (s % 2 === 0) hat(t, s % 4 === 2 ? 0.08 : 0.04);
        const b = BASS[s]; if (b >= 0) voice(mus, NOTE(ch[0] - 12 + b), t, { type: 'triangle', parts: [[1, 1, 1], [2, 0.3, 0.4]], dur: S16 * 1.6, vol: 0.5 });
        if (s === 2 || s === 7 || s === 11) ch[1].forEach((m) => voice(mus, NOTE(m), t, { type: 'sine', parts: [[1, 1, 1], [2, 0.25, 0.3], [3, 0.08, 0.2]], dur: S16 * 2.2, vol: 0.08 }));
        if (Math.floor(step / 64) % 2 === 1) MEL.forEach(([ss, m]) => { if (ss === s) voice(mus, NOTE(m - (bar === 2 ? 2 : 0)), t, { ...MAR, dur: 0.35, vol: 0.12 }); });
      }
      nextT += S16; step++;
    }
  }
  function startMusic() { if (timer) return; nextT = ctx.currentTime + 0.1; timer = setInterval(sched, 60); }
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else ctx.resume(); });
})();
