// 소리 — 전부 코드로 합성(파일 없음)
(function () {
  let ac = null, master, sfxBus, bgmBus, noiseBuf;
  const st = { sfx: true, bgm: true };
  try { const s = JSON.parse(localStorage.getItem('pinball.snd') || '{}'); if (s.sfx === false) st.sfx = false; if (s.bgm === false) st.bgm = false; } catch (e) { }
  function save() { try { localStorage.setItem('pinball.snd', JSON.stringify(st)); } catch (e) { } }
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    ac = new C(); master = ac.createGain(); master.gain.value = 0.8;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ac.destination);
    sfxBus = ac.createGain(); sfxBus.gain.value = st.sfx ? 1 : 0; sfxBus.connect(master);
    bgmBus = ac.createGain(); bgmBus.gain.value = st.bgm ? 0.42 : 0; bgmBus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 1, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function env(g, t, a, peak, dcy) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dcy); }
  function osc(type, f0, f1, dur, vol, bus, when) {
    if (!ac) return; const t = ac.currentTime + (when || 0);
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.004, vol, dur); o.connect(g); g.connect(bus || sfxBus); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, fType, f, q, when, bus) {
    if (!ac) return; const t = ac.currentTime + (when || 0);
    const s = ac.createBufferSource(); s.buffer = noiseBuf; const fl = ac.createBiquadFilter(); fl.type = fType || 'bandpass'; fl.frequency.value = f || 2000; fl.Q.value = q || 1;
    const g = ac.createGain(); env(g, t, 0.002, vol, dur); s.connect(fl); fl.connect(g); g.connect(bus || sfxBus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  const A = {
    init, st,
    setSfx(v) { st.sfx = v; save(); if (sfxBus) sfxBus.gain.value = v ? 1 : 0; },
    setBgm(v) { st.bgm = v; save(); if (bgmBus) bgmBus.gain.value = v ? 0.42 : 0; },
    flip() { noise(0.05, 0.5, 'highpass', 2500, 0.7); osc('square', 180, 60, 0.07, 0.25); },
    flipHit(s) { osc('triangle', 300, 120, 0.06, Math.min(0.5, s / 60)); },
    bumper() { osc('square', 880, 220, 0.12, 0.28); osc('sine', 140, 50, 0.18, 0.7); noise(0.06, 0.35, 'bandpass', 3000, 2); },
    sling() { osc('square', 520, 160, 0.08, 0.25); noise(0.05, 0.45, 'bandpass', 1500, 1.5); },
    wall(s) { osc('sine', 260 + Math.random() * 60, 140, 0.05, Math.min(0.35, s / 70)); noise(0.03, Math.min(0.25, s / 90), 'bandpass', 4000, 3); },
    post(s) { osc('triangle', 700, 300, 0.05, Math.min(0.3, s / 60)); },
    drop() { osc('square', 330, 90, 0.1, 0.3); noise(0.08, 0.5, 'lowpass', 900, 1); },
    stand() { osc('square', 990, 660, 0.09, 0.22); osc('sine', 1320, 0, 0.12, 0.15, null, 0.04); },
    lane(i) { const f = [523, 659, 784][i] || 880; osc('triangle', f, 0, 0.18, 0.3); osc('triangle', f * 2, 0, 0.14, 0.12, null, 0.05); },
    allLanes() { [523, 659, 784, 1047, 1319].forEach((f, i) => osc('square', f, 0, 0.12, 0.18, null, i * 0.06)); },
    orbit() { osc('sawtooth', 200, 1600, 0.35, 0.2); noise(0.3, 0.2, 'bandpass', 1200, 3); },
    saucer() { osc('sine', 300, 80, 0.4, 0.5); osc('sine', 120, 40, 0.5, 0.5, null, 0.05); },
    eject() { noise(0.12, 0.6, 'lowpass', 600, 1); osc('square', 90, 300, 0.12, 0.3); },
    plungeCharge(k) { osc('sine', 120 + k * 260, 0, 0.04, 0.06); },
    launch(k) { noise(0.25, 0.5, 'bandpass', 800 + k * 1200, 1); osc('sawtooth', 120, 600 + k * 600, 0.25, 0.18); },
    drain() { [392, 330, 262, 196].forEach((f, i) => osc('square', f, f * 0.97, 0.22, 0.18, null, i * 0.16)); },
    save() { [784, 988, 784, 988].forEach((f, i) => osc('square', f, 0, 0.08, 0.15, null, i * 0.08)); },
    clack(s) { osc('triangle', 1800, 900, 0.04, Math.min(0.3, s / 40)); },
    boss() { osc('sawtooth', 160, 40, 0.35, 0.4); noise(0.2, 0.5, 'lowpass', 500, 1); osc('square', 600, 200, 0.15, 0.2, null, 0.02); },
    bossRoar() { osc('sawtooth', 90, 40, 1.2, 0.4); osc('sawtooth', 93, 41, 1.2, 0.3); noise(1, 0.25, 'lowpass', 300, 1); },
    jackpot() { [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((f, i) => { osc('square', f, 0, 0.14, 0.17, null, i * 0.07); osc('triangle', f / 2, 0, 0.14, 0.2, null, i * 0.07); }); },
    stageClear() { const n = [523, 523, 659, 784, 659, 784, 1047]; n.forEach((f, i) => { osc('square', f, 0, 0.16, 0.18, null, i * 0.11); osc('triangle', f / 2, 0, 0.18, 0.22, null, i * 0.11); }); noise(0.6, 0.15, 'highpass', 5000, 1, 0.75); },
    multiball() { for (let i = 0; i < 10; i++) osc('square', i % 2 ? 660 : 880, 0, 0.1, 0.16, null, i * 0.1); },
    extra() { [784, 1047, 1319, 1568, 2093].forEach((f, i) => osc('triangle', f, 0, 0.2, 0.22, null, i * 0.05)); },
    skill() { [1047, 1568, 2093].forEach((f, i) => osc('square', f, 0, 0.1, 0.17, null, i * 0.06)); },
    click() { osc('square', 900, 500, 0.04, 0.15); },
    over() { [392, 370, 349, 330, 311, 294].forEach((f, i) => osc('square', f, f * 0.98, 0.3, 0.16, null, i * 0.22)); },
    ending() { const n = [392, 523, 659, 784, 659, 784, 1047, 1047, 1319, 1568]; n.forEach((f, i) => { osc('square', f, 0, 0.28, 0.16, null, i * 0.16); osc('triangle', f / 2, 0, 0.3, 0.22, null, i * 0.16); }); }
  };

  // ── 배경음: 오락실 신스 + 굿거리 장단 느낌 5음계 ──
  let seqT = 0, step = 0, playing = false, intense = 0, timer = null;
  const BPM = 138, SPB = 60 / BPM / 2;           // 8분음표
  const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  const mel = [
    [7, -1, 5, 4, 5, -1, 3, 2], [3, -1, 2, 1, 2, 4, 3, -1], [7, 8, 7, 5, 4, -1, 5, -1], [3, 2, 1, 0, 1, -1, -1, -1],
    [5, -1, 7, -1, 8, 7, 5, 4], [5, 4, 3, -1, 4, 3, 2, -1], [7, -1, 8, 9, 8, 7, 5, -1], [4, 3, 2, 3, 0, -1, -1, -1]];
  const bassR = [0, 0, -5, -3, 0, -5, -3, -7];
  function note(i) { const n = scale.length, o = Math.floor(i / n); return 220 * Math.pow(2, (scale[((i % n) + n) % n] + o * 24) / 12); }
  function tick() {
    if (!ac || !playing) return;
    while (seqT < ac.currentTime + 0.25) {
      const bar = Math.floor(step / 8) % 8, s = step % 8, w = seqT - ac.currentTime;
      const root = 110 * Math.pow(2, bassR[bar] / 12);
      // 베이스
      if (s % 2 === 0) bassNote(s === 0 ? root : root * (s === 4 ? 1.5 : 2), w);
      // 북(장구 느낌): 쿵·덕
      if (s === 0 || s === 3 || s === 6) kick(w); if (s === 2 || s === 5) snare(w); hat(w, s % 2 ? 0.04 : 0.07);
      // 멜로디
      const m = mel[bar][s]; if (m >= 0) lead(note(m) * 2, w);
      if (intense && s % 2 === 1) lead(note((m >= 0 ? m : 4) + 2) * 2, w, 0.05);
      seqT += SPB * (intense ? 0.82 : 1); step++;
    }
  }
  function bassNote(f, w) { const t = ac.currentTime + w; const o = ac.createOscillator(), g = ac.createGain(), fl = ac.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = f / 2; fl.type = 'lowpass'; fl.frequency.value = 500; env(g, t, 0.005, 0.35, SPB * 1.6); o.connect(fl); fl.connect(g); g.connect(bgmBus); o.start(t); o.stop(t + SPB * 2); }
  function lead(f, w, v) { const t = ac.currentTime + w; const o = ac.createOscillator(), g = ac.createGain(); o.type = 'square'; o.frequency.value = f; env(g, t, 0.005, v || 0.1, SPB * 1.2); o.connect(g); g.connect(bgmBus); o.start(t); o.stop(t + SPB * 1.5); }
  function kick(w) { const t = ac.currentTime + w; const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12); env(g, t, 0.002, 0.7, 0.16); o.connect(g); g.connect(bgmBus); o.start(t); o.stop(t + 0.2); }
  function snare(w) { const t = ac.currentTime + w; const s = ac.createBufferSource(); s.buffer = noiseBuf; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; const g = ac.createGain(); env(g, t, 0.002, 0.3, 0.1); s.connect(f); f.connect(g); g.connect(bgmBus); s.start(t, Math.random() * 0.5); s.stop(t + 0.15); }
  function hat(w, v) { const t = ac.currentTime + w; const s = ac.createBufferSource(); s.buffer = noiseBuf; const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000; const g = ac.createGain(); env(g, t, 0.001, v, 0.03); s.connect(f); f.connect(g); g.connect(bgmBus); s.start(t, Math.random() * 0.5); s.stop(t + 0.05); }
  A.bgmStart = function () { init(); if (!ac || playing) return; playing = true; seqT = ac.currentTime + 0.1; step = 0; timer = setInterval(tick, 60); };
  A.bgmStop = function () { playing = false; clearInterval(timer); };
  A.intense = v => { intense = v ? 1 : 0; };
  A.ctx = () => ac;
  window.SND = A;
})();
