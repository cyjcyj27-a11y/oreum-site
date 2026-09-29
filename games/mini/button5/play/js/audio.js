// 5억년 버튼 — 소리는 전부 Web Audio 로 만든다(파일 없음)
(function () {
  'use strict';
  const AU = { ctx: null, master: null, sfx: null, bgm: null, sfxOn: true, bgmOn: true, mode: '', loopT: 0, nodes: [] };
  try {
    AU.sfxOn = localStorage.getItem('button5.snd') !== '0';
    AU.bgmOn = localStorage.getItem('button5.bgm') !== '0';
  } catch (e) {}

  function init() {
    if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    AU.ctx = new C();
    AU.master = AU.ctx.createGain(); AU.master.gain.value = 0.9; AU.master.connect(AU.ctx.destination);
    AU.sfx = AU.ctx.createGain(); AU.sfx.gain.value = AU.sfxOn ? 1 : 0; AU.sfx.connect(AU.master);
    AU.bgm = AU.ctx.createGain(); AU.bgm.gain.value = AU.bgmOn ? 0.5 : 0; AU.bgm.connect(AU.master);
    // 잔향(짧은 방 울림) — 공허는 이걸 길게 탄다
    AU.verb = AU.ctx.createConvolver(); AU.verb.buffer = impulse(3.2, 2.4);
    AU.verbGain = AU.ctx.createGain(); AU.verbGain.gain.value = 0.35;
    AU.verb.connect(AU.verbGain); AU.verbGain.connect(AU.master);
    if (AU.mode) setMode(AU.mode, true);
  }
  function impulse(sec, decay) {
    const c = AU.ctx, n = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
    }
    return b;
  }
  let noiseBuf = null;
  function noise() {
    if (!noiseBuf) {
      const c = AU.ctx, n = c.sampleRate * 2; noiseBuf = c.createBuffer(1, n, c.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  }
  function env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  function out(node, wet) {
    node.connect(AU.sfx);
    if (wet) { const w = AU.ctx.createGain(); w.gain.value = wet; node.connect(w); w.connect(AU.verb); }
  }
  // 소음 한 줌(긁기·파기·걸음)
  function nz(t, dur, f, q, peak, type, wet) {
    const c = AU.ctx, s = c.createBufferSource(); s.buffer = noise();
    s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const fl = c.createBiquadFilter(); fl.type = type || 'bandpass'; fl.frequency.value = f; fl.Q.value = q;
    const g = c.createGain(); env(g, t, 0.005, peak, dur);
    s.connect(fl); fl.connect(g); out(g, wet);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
    return fl;
  }
  function tone(t, f, dur, type, peak, wet, f2) {
    const c = AU.ctx, o = c.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = c.createGain(); env(g, t, 0.006, peak, dur);
    o.connect(g); out(g, wet); o.start(t); o.stop(t + dur + 0.05);
  }

  const SFX = {
    scratch() { if (!AU.ctx) return; const t = AU.ctx.currentTime;
      const f = nz(t, 0.16, 2600 + Math.random() * 1400, 3, 0.35, 'bandpass', 0.25);
      f.frequency.exponentialRampToValueAtTime(1500, t + 0.15); },
    count() { if (!AU.ctx) return; const t = AU.ctx.currentTime;
      tone(t, 1100 + Math.random() * 60, 0.06, 'triangle', 0.18, 0.4); tone(t, 2200, 0.03, 'sine', 0.05, 0.2); },
    dig() { if (!AU.ctx) return; const t = AU.ctx.currentTime;
      nz(t, 0.12, 700, 1.2, 0.5, 'lowpass', 0.3); tone(t, 120, 0.12, 'sine', 0.35, 0.3, 60); },
    stone() { if (!AU.ctx) return; const t = AU.ctx.currentTime;
      tone(t, 520 + Math.random() * 80, 0.07, 'square', 0.08, 0.5); nz(t, 0.06, 3000, 2, 0.25, 'bandpass', 0.4); },
    stack() { if (!AU.ctx) return; const t = AU.ctx.currentTime;
      tone(t, 260 + Math.random() * 40, 0.1, 'triangle', 0.3, 0.5, 200); nz(t, 0.05, 1800, 2, 0.3, 'bandpass', 0.5); },
    walk() { if (!AU.ctx) return; const t = AU.ctx.currentTime;
      nz(t, 0.09, 420 + Math.random() * 100, 1.5, 0.35, 'lowpass', 0.35); },
    talk() { if (!AU.ctx) return; const t = AU.ctx.currentTime, c = AU.ctx;
      // 입속말: 모음 두 개가 흐른다
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(140 + Math.random() * 40, t);
      o.frequency.linearRampToValueAtTime(120 + Math.random() * 30, t + 0.22);
      const f1 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 6;
      const v = [[700, 1100], [400, 2000], [300, 900], [500, 1500]][Math.floor(Math.random() * 4)];
      f1.frequency.setValueAtTime(v[0], t); f1.frequency.linearRampToValueAtTime(v[1] * 0.6, t + 0.2);
      const g = c.createGain(); env(g, t, 0.03, 0.25, 0.2);
      o.connect(f1); f1.connect(g); out(g, 0.5); o.start(t); o.stop(t + 0.3); },
    carve() { if (!AU.ctx) return; const t = AU.ctx.currentTime;
      tone(t, 1900 + Math.random() * 300, 0.05, 'square', 0.06, 0.5); nz(t, 0.05, 5000, 3, 0.3, 'highpass', 0.5); },
    memory() { if (!AU.ctx) return; const t = AU.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(t + i * 0.07, f, 1.6, 'sine', 0.12, 0.9)); },
    milestone() { if (!AU.ctx) return; const t = AU.ctx.currentTime;
      tone(t, 880, 1.8, 'sine', 0.16, 1); tone(t, 1320, 1.4, 'sine', 0.06, 1); },
    found() { if (!AU.ctx) return; const t = AU.ctx.currentTime;
      [392, 523.25, 659.25].forEach((f, i) => tone(t + i * 0.12, f, 1.4, 'triangle', 0.14, 0.9)); },
    decoded() { if (!AU.ctx) return; const t = AU.ctx.currentTime;
      [523.25, 659.25, 783.99, 987.77, 1174.66].forEach((f, i) => tone(t + i * 0.09, f, 1.8, 'sine', 0.12, 1)); },
    up() { if (!AU.ctx) return; const t = AU.ctx.currentTime;
      tone(t, 440, 0.12, 'triangle', 0.2, 0.3, 880); tone(t + 0.08, 880, 0.2, 'sine', 0.12, 0.4); },
    no() { if (!AU.ctx) return; const t = AU.ctx.currentTime; tone(t, 180, 0.12, 'square', 0.08, 0.1, 140); },
    press() { if (!AU.ctx) return; const t = AU.ctx.currentTime;
      // 딸깍 → 쿵 → 빨려 들어가는 바람
      tone(t, 900, 0.03, 'square', 0.25, 0); nz(t, 0.05, 2500, 1, 0.5, 'bandpass', 0);
      tone(t + 0.04, 90, 0.5, 'sine', 0.7, 0.4, 40);
      const f = nz(t + 0.1, 1.6, 300, 0.8, 0.5, 'lowpass', 0.8); f.frequency.exponentialRampToValueAtTime(6000, t + 1.6); },
    arrive() { if (!AU.ctx) return; const t = AU.ctx.currentTime;
      tone(t, 55, 3, 'sine', 0.5, 1); tone(t, 110.5, 2.5, 'sine', 0.2, 1); nz(t, 2, 800, 0.5, 0.15, 'lowpass', 1); },
    back() { if (!AU.ctx) return; const t = AU.ctx.currentTime;
      const f = nz(t, 0.9, 6000, 0.8, 0.4, 'lowpass', 0.6); f.frequency.exponentialRampToValueAtTime(300, t + 0.9);
      tone(t + 0.7, 160, 0.3, 'sine', 0.4, 0.2, 90); },
    cash() { if (!AU.ctx) return; const t = AU.ctx.currentTime;
      // 입금 알림: 밝은 두 음 + 동전 반짝
      tone(t, 1318.5, 0.18, 'triangle', 0.22, 0.2); tone(t + 0.1, 1975.5, 0.35, 'triangle', 0.2, 0.3);
      for (let i = 0; i < 6; i++) tone(t + 0.15 + i * 0.045, 2600 + Math.random() * 1600, 0.08, 'sine', 0.06, 0.3); },
    buy() { if (!AU.ctx) return; const t = AU.ctx.currentTime;
      nz(t, 0.08, 4000, 1, 0.25, 'highpass', 0); tone(t + 0.05, 1568, 0.12, 'square', 0.08, 0.2);
      tone(t + 0.12, 2093, 0.4, 'triangle', 0.18, 0.3); [0, 1, 2].forEach(i => tone(t + 0.2 + i * 0.07, 1046.5 * (1 + i * 0.25), 0.3, 'sine', 0.1, 0.3)); },
    chime(i) { if (!AU.ctx) return; const t = AU.ctx.currentTime, P = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
      const f = P[i % 6] * (i >= 6 ? 2 : 1); tone(t, f, 1.2, 'sine', 0.12, 0.9); tone(t, f * 2, 0.5, 'triangle', 0.03, 0.6); },
    tap() { if (!AU.ctx) return; const t = AU.ctx.currentTime; tone(t, 700, 0.04, 'triangle', 0.12, 0); },
    bark() { if (!AU.ctx) return; const t = AU.ctx.currentTime;
      [0, 0.18].forEach(d => { tone(t + d, 620, 0.09, 'sawtooth', 0.12, 0.3, 380); nz(t + d, 0.08, 1200, 2, 0.15, 'bandpass', 0.3); }); },
    crack() { if (!AU.ctx) return; const t = AU.ctx.currentTime;
      for (let i = 0; i < 8; i++) nz(t + i * 0.09 + Math.random() * 0.05, 0.12, 1500 + Math.random() * 3000, 2, 0.4, 'bandpass', 0.8);
      tone(t, 40, 3, 'sine', 0.6, 1); },
    bang() { if (!AU.ctx) return; const t = AU.ctx.currentTime;
      nz(t, 4, 200, 0.5, 0.9, 'lowpass', 1); tone(t, 50, 5, 'sine', 0.8, 1, 25);
      [261.63, 392, 523.25, 659.25, 783.99].forEach((f, i) => tone(t + 1 + i * 0.25, f, 5, 'sine', 0.08, 1)); }
  };

  // ── 배경음 ─────────────────────────────────────────────
  // room: 느린 로파이 피아노(Am7-Fmaj7-C-G, 76bpm) / void: 낮게 깔리는 울림과 먼 종소리
  function stopBgm() { AU.nodes.forEach(n => { try { n.stop(); } catch (e) {} }); AU.nodes = []; clearInterval(AU.loopT); AU.loopT = 0; }
  function setMode(m, force) {
    if (AU.mode === m && !force) return;
    AU.mode = m;
    if (!AU.ctx) return;
    stopBgm();
    if (m === 'room') roomLoop();
    else if (m === 'void') voidDrone();
    else if (m === 'end') endPad();
  }
  function keyNote(t, f, dur, vol) { // 부드러운 전자피아노
    const c = AU.ctx, o = c.createOscillator(), o2 = c.createOscillator();
    o.type = 'sine'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f * 2.001;
    const g = c.createGain(), g2 = c.createGain(); g2.gain.value = 0.18;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(AU.bgm);
    const w = c.createGain(); w.gain.value = 0.3; g.connect(w); w.connect(AU.verb);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  function roomLoop() {
    const beat = 60 / 76;
    const chords = [[220, 261.63, 329.63, 392], [174.61, 220, 261.63, 329.63], [130.81, 196, 261.63, 329.63], [196, 246.94, 293.66, 392]];
    const bass = [110, 87.31, 65.41, 98];
    const mel = [[659.25, 0, 587.33, 523.25], [523.25, 0, 440, 0], [392, 440, 523.25, 0], [493.88, 0, 392, 0]];
    let bar = 0;
    function sched() {
      if (!AU.ctx || AU.mode !== 'room') return;
      const t0 = AU.ctx.currentTime + 0.05, i = bar % 4;
      chords[i].forEach((f, k) => keyNote(t0 + k * 0.03, f, beat * 3.6, 0.05));
      keyNote(t0, bass[i], beat * 3.8, 0.09);
      keyNote(t0 + beat * 2, bass[i], beat * 1.8, 0.05);
      if (bar % 8 >= 4) mel[i].forEach((f, k) => { if (f) keyNote(t0 + k * beat, f, beat * 1.4, 0.035); });
      // 잔잔한 테이프 잡음
      bar++;
    }
    sched(); AU.loopT = setInterval(sched, beat * 4 * 1000);
  }
  function voidDrone() {
    const c = AU.ctx, t = c.currentTime;
    [[55, 0.09], [82.41, 0.05], [110.2, 0.035], [164.8, 0.02]].forEach(([f, v], i) => {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const l = c.createOscillator(); l.frequency.value = 0.05 + i * 0.03; const lg = c.createGain(); lg.gain.value = f * 0.004;
      l.connect(lg); lg.connect(o.frequency);
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 4);
      o.connect(g); g.connect(AU.bgm); const w = c.createGain(); w.gain.value = 0.5; g.connect(w); w.connect(AU.verb);
      o.start(t); l.start(t); AU.nodes.push(o, l);
    });
    // 바람
    const s = c.createBufferSource(); s.buffer = noise(); s.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 400; f.Q.value = 0.6;
    const l = c.createOscillator(); l.frequency.value = 0.07; const lg = c.createGain(); lg.gain.value = 180; l.connect(lg); lg.connect(f.frequency);
    const g = c.createGain(); g.gain.value = 0.018; s.connect(f); f.connect(g); g.connect(AU.bgm);
    s.start(t); l.start(t); AU.nodes.push(s, l);
    // 먼 종
    const bells = [659.25, 587.33, 523.25, 440, 392, 783.99];
    AU.loopT = setInterval(() => {
      if (!AU.ctx || AU.mode !== 'void') return;
      if (Math.random() < 0.55) { const tt = AU.ctx.currentTime; const fb = bells[Math.floor(Math.random() * bells.length)];
        const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = fb; const gg = c.createGain(); env(gg, tt, 0.02, 0.03, 4);
        o.connect(gg); gg.connect(AU.verb); o.start(tt); o.stop(tt + 4.2); }
    }, 5200);
  }
  function endPad() {
    const c = AU.ctx, t = c.currentTime;
    [130.81, 196, 261.63, 329.63, 392, 523.25].forEach((f, i) => {
      const o = c.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f * (1 + (i - 3) * 0.0015);
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.03, t + 6);
      o.connect(g); g.connect(AU.bgm); g.connect(AU.verb); o.start(t); AU.nodes.push(o);
    });
  }
  function setSfx(on) { AU.sfxOn = on; try { localStorage.setItem('button5.snd', on ? '1' : '0'); } catch (e) {} if (AU.sfx) AU.sfx.gain.value = on ? 1 : 0; }
  function setBgm(on) { AU.bgmOn = on; try { localStorage.setItem('button5.bgm', on ? '1' : '0'); } catch (e) {} if (AU.bgm) AU.bgm.gain.value = on ? 0.5 : 0; }

  window.B5A = { AU, init, SFX, setMode, setSfx, setBgm };
})();
