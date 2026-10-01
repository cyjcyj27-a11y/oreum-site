// audio.js — 효과음·자연 소리는 코드로 합성. 음악은 엔딩에만 있다(사장님 2026-09-17 "음악은 빼자", 2026-10-01 엔딩 음악)
(function () {
  let ctx = null, master = null, sfxBus = null, amb = null, noiseBuf = null;
  let birdT = 2, frogT = 3, crickT = 5, crackT = 0;

  function init() {
    if (ctx) return;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 1; sfxBus.connect(master);
    amb = ctx.createGain(); amb.gain.value = 0.5; amb.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

  const now = () => ctx.currentTime;
  function env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  function tone(type, f0, f1, dur, vol, t, bus) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.005, vol, dur);
    o.connect(g); g.connect(bus || sfxBus);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, t, type, freq, q, bus) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq || 1200; f.Q.value = q || 0.7;
    const g = ctx.createGain(); env(g, t, 0.004, vol, dur);
    s.connect(f); f.connect(g); g.connect(bus || sfxBus);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  }

  function sfx(name, k) {
    if (!ctx || !T.sfx) return;
    const t = now();
    k = k == null ? 1 : k;
    switch (name) {
      case 'step': noise(0.08, 0.12 * k, t, 'bandpass', PL.wade ? 700 : 1600, 0.9); if (PL.wade) noise(0.18, 0.1 * k, t + 0.02, 'bandpass', 500, 1.5); break;
      case 'jump': noise(0.12, 0.08, t, 'bandpass', 900, 1); break;
      case 'land': noise(0.14, 0.18, t, 'lowpass', 500, 0.8); break;
      case 'splash': noise(0.45, 0.25, t, 'bandpass', 800, 0.6); noise(0.3, 0.12, t + 0.08, 'highpass', 2500, 0.5); break;
      case 'swim': noise(0.4, 0.12, t, 'bandpass', 650, 0.8); break;
      case 'pick': tone('sine', 520, 880, 0.09, 0.22, t); noise(0.06, 0.1, t, 'highpass', 3000); break;
      // 손맛 (2026-09-17): 버섯 뽑기 = 흙 찢기는 소리 + 뽁 / 꽃 = 줄기 톡 / 장대 삐걱 / 통에 물 붓기
      case 'pluck': noise(0.16, 0.14, t, 'bandpass', 900, 1.2); noise(0.05, 0.1, t + 0.1, 'lowpass', 500); tone('sine', 380, 140, 0.09, 0.3, t + 0.14); tone('sine', 900, 1500, 0.05, 0.08, t + 0.16); break;
      case 'snap': noise(0.025, 0.28, t, 'highpass', 2800, 1); tone('square', 1900, 900, 0.03, 0.05, t); noise(0.2, 0.05, t + 0.03, 'bandpass', 4200, 2); break;
      case 'creak': { const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(170, t); o.frequency.linearRampToValueAtTime(230, t + 0.35); o.frequency.linearRampToValueAtTime(150, t + 0.8); f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 6; const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 34; lg.gain.value = 0.05; lfo.connect(lg); lg.connect(g.gain); env(g, t, 0.05, 0.06, 0.8); o.connect(f); f.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.95); lfo.start(t); lfo.stop(t + 0.95); break; }
      case 'sizzle': noise(0.22, 0.05 * k, t, 'highpass', 3800, 0.7); noise(0.06, 0.04 * k, t + 0.05 + Math.random() * 0.1, 'bandpass', 2200, 3); break;   // 꼬치구이 (2026-09-19)
      case 'pour': noise(0.5, 0.16, t, 'bandpass', 1300, 0.9); noise(0.35, 0.08, t + 0.1, 'highpass', 3000, 0.6); for (let i = 0; i < 4; i++) tone('sine', 900 + i * 180, 1400 + i * 120, 0.05, 0.04, t + 0.08 + i * 0.09); break;
      case 'new': [660, 830, 990, 1320].forEach((f, i) => tone('triangle', f, 0, 0.35, 0.16, t + i * 0.08)); tone('sine', 1980, 0, 0.6, 0.06, t + 0.32); break;
      case 'coin': tone('square', 988, 0, 0.08, 0.08, t); tone('square', 1318, 0, 0.25, 0.08, t + 0.07); tone('sine', 2637, 0, 0.3, 0.05, t + 0.07); break;
      case 'buy': [523, 659, 784].forEach((f, i) => tone('triangle', f, 0, 0.25, 0.14, t + i * 0.06)); break;
      case 'deny': tone('square', 180, 150, 0.16, 0.08, t); break;
      case 'shutter': noise(0.03, 0.35, t, 'highpass', 2500); noise(0.05, 0.25, t + 0.07, 'bandpass', 1800, 2); tone('sine', 2400, 0, 0.05, 0.05, t + 0.12); break;
      case 'clatter': for (let i = 0; i < 12; i++) noise(0.025, 0.09 * k, t + i * 0.06, 'bandpass', 2200 + (i % 2) * 400, 4); break;
      case 'boar': { const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(95, t); o.frequency.linearRampToValueAtTime(70, t + 0.35); f.type = 'lowpass'; f.frequency.value = 420; env(g, t, 0.02, 0.25, 0.4); o.connect(f); f.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.5); noise(0.3, 0.12, t, 'bandpass', 300, 1); break; }
      case 'poison': tone('sine', 600, 150, 0.9, 0.15, t); tone('sine', 606, 152, 0.9, 0.1, t); break;
      case 'tea': tone('sine', 880, 0, 0.5, 0.06, t); tone('sine', 1100, 0, 0.6, 0.05, t + 0.15); break;
      case 'page': noise(0.2, 0.06, t, 'highpass', 2000); break;
      case 'bloom': [392, 494, 587, 784, 988, 1175].forEach((f, i) => tone('sine', f, 0, 2.4, 0.08, t + i * 0.18)); noise(2.5, 0.03, t, 'highpass', 6000); break;
      // 물리 (physics.js · feel.js) — k 는 세기 0~1
      case 'kick': noise(0.09, 0.3 * k, t, 'lowpass', 380, 1.2); tone('sine', 150, 60, 0.12, 0.28 * k, t); break;
      case 'bounce': noise(0.05, 0.16 * k, t, 'bandpass', 700, 1.4); tone('sine', 220, 110, 0.06, 0.12 * k, t); break;
      case 'tock': noise(0.03, 0.2 * k, t, 'bandpass', 2600, 3); tone('triangle', 1400, 900, 0.03, 0.08 * k, t); break;
      case 'tin': for (let i = 0; i < 3; i++) tone('triangle', 900 + i * 610, 700 + i * 500, 0.18, 0.06 * k, t + i * 0.012); noise(0.06, 0.12 * k, t, 'bandpass', 1800, 2); break;
      case 'plop': tone('sine', 300 + 500 * (1 - k), 1300, 0.09, 0.2 * (0.4 + k * 0.6), t); noise(0.25 + k * 0.3, 0.14 * k + 0.04, t + 0.02, 'bandpass', 900, 0.8); break;
      case 'skip': tone('sine', 700, 1700, 0.05, 0.14, t); noise(0.08, 0.08, t, 'highpass', 2800, 0.7); break;
      case 'whoosh': noise(0.22, 0.1, t, 'bandpass', 1200, 1.5); break;
      case 'chop': noise(0.05, 0.4, t, 'lowpass', 900, 1); tone('square', 180, 70, 0.08, 0.14, t); noise(0.18, 0.2, t + 0.03, 'bandpass', 2400, 2.5); tone('triangle', 2200, 1500, 0.05, 0.07, t + 0.02); break;
      case 'rustle': for (let i = 0; i < 6; i++) noise(0.07, 0.07, t + i * 0.05, 'bandpass', 3000 + (i % 3) * 700, 1.2); break;
      case 'bees': { const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(210, t); const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 7; lg.gain.value = 18; lfo.connect(lg); lg.connect(o.frequency); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 2; env(g, t, 0.4, 0.05, 2.2); o.connect(f); f.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 2.7); lfo.start(t); lfo.stop(t + 2.7); break; }
      case 'puff': noise(0.35, 0.09, t, 'lowpass', 600, 0.6); break;
      case 'hiss': noise(0.9, 0.16 * k, t, 'highpass', 4200, 0.7); noise(0.7, 0.06 * k, t + 0.1, 'bandpass', 7000, 1.5); break;
      case 'bite': noise(0.05, 0.35, t, 'highpass', 2500, 1); tone('square', 900, 200, 0.08, 0.1, t); noise(0.4, 0.14, t + 0.04, 'highpass', 5000, 0.7); break;
      case 'howl': { const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(330, t); o.frequency.linearRampToValueAtTime(520, t + 0.9); o.frequency.linearRampToValueAtTime(470, t + 2.2); o.frequency.linearRampToValueAtTime(300, t + 3.0); f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 3; env(g, t, 0.6, 0.035 * k, 2.6); o.connect(f); f.connect(g); g.connect(amb || sfxBus); o.start(t); o.stop(t + 3.3); break; }
      case 'like': [784, 988, 1175, 1568].forEach((f, i) => tone('sine', f, 0, 0.5, 0.07, t + i * 0.09)); tone('triangle', 1976, 0, 0.8, 0.04, t + 0.36); break;
      case 'grunt': noise(0.35, 0.12, t, 'lowpass', 220, 1); break;
      // 들소 울음 — 낮고 긴 콧김 섞인 소리 (ride.js)
      case 'moo': { const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(78, t); o.frequency.linearRampToValueAtTime(96, t + 0.25); o.frequency.linearRampToValueAtTime(62, t + 0.95); f.type = 'lowpass'; f.frequency.value = 360; env(g, t, 0.08, 0.3 * k, 1.0); o.connect(f); f.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 1.2); noise(0.5, 0.08 * k, t, 'lowpass', 500, 0.5); break; }
      // 돌 가는 소리 (석상 돌리기·얼음 깨짐, island.js)
      case 'grind': noise(0.8, 0.22 * k, t, 'lowpass', 320, 1.5); noise(0.6, 0.08 * k, t + 0.1, 'bandpass', 1800, 3); break;
      // 총소리: 짧은 폭음 + 낮은 울림 + 숲에 되울림 (hunt.js)
      case 'shot': noise(0.06, 0.7, t, 'lowpass', 3000, 0.7); noise(0.35, 0.35, t, 'lowpass', 400, 0.8); tone('sine', 120, 40, 0.25, 0.4, t); noise(0.8, 0.08, t + 0.25, 'lowpass', 700, 0.6); noise(0.6, 0.04, t + 0.6, 'lowpass', 500, 0.6); break;
      case 'hoof': noise(0.07, 0.3 * k, t, 'lowpass', 260, 1); break;
      case 'munch': for (let i = 0; i < 4; i++) noise(0.05, 0.1, t + i * 0.16, 'bandpass', 1500, 2); break;
    }
  }

  // ── 엔딩 음악 (사장님 2026-10-01 "따뜻한 음악을 깔아줘 엔딩에") — 얼음이 다 녹은 때부터 CLEAR 까지, 코드로 쓴 곡 ──
  //   바장조 자장가풍, 한 박 0.9초, 여덟 마디(28.8초)를 되풀이. 깔리는 화음 + 낮은 음 + 뜯는 소리 + 피리 가락, 두 번째 바퀴부터 종소리가 겹친다
  const BEAT = 0.9;
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  const BARS = [   // [낮은 음, 화음 셋, 가락 [박, 음, 길이]]
    [41, [53, 57, 60], [[0, 69, 2], [2, 72, 1], [3, 69, 1]]],             // F
    [40, [55, 60, 64], [[0, 67, 2], [2, 64, 1], [3, 67, 1]]],             // C/E
    [38, [53, 57, 62], [[0, 65, 2], [2, 69, 1], [3, 74, 1]]],             // Dm
    [46, [53, 58, 62], [[0, 74, 1.5], [1.5, 72, 0.5], [2, 70, 2]]],       // Bb
    [45, [53, 60, 65], [[0, 69, 2], [2, 72, 1], [3, 77, 1]]],             // F/A
    [46, [53, 58, 62], [[0, 74, 2], [2, 70, 1], [3, 74, 1]]],             // Bb
    [36, [52, 58, 60], [[0, 72, 1.5], [1.5, 70, 0.5], [2, 67, 1], [3, 64, 1]]],   // C7
    [41, [53, 57, 60], [[0, 65, 4]]],                                     // F
  ];
  let mus = null, musFade = null, musMute = null, musEcho = null;
  function voice(type, f, t, a, hold, rel, vol, bus, vib) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.004, t + 0.5); l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + a + hold + rel + 0.1); }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.setValueAtTime(vol, t + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + rel);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + a + hold + rel + 0.1);
  }
  function bar(n, t) {
    const B = BARS[n % 8], round = (n / 8) | 0, last = n % 8 === 7;
    // 깔리는 화음
    for (const m of B[1]) { voice('sine', mf(m), t, 0.9, BEAT * 4 - 0.9, 1.4, 0.03, musFade); voice('triangle', mf(m + 12), t, 1.2, BEAT * 4 - 1.2, 1.2, 0.007, musFade); }
    // 낮은 음: 첫 박과 셋째 박
    voice('sine', mf(B[0]), t, 0.04, BEAT * 1.6, 0.8, 0.1, musFade);
    if (!last) voice('sine', mf(B[0] + 7), t + BEAT * 2, 0.04, BEAT * 1.2, 0.7, 0.055, musFade);
    // 뜯는 소리: 여덟 번 (끝 마디는 넷만 치고 쉰다)
    const seq = [B[1][0], B[1][1], B[1][2], B[1][0] + 12, B[1][2], B[1][1], B[1][2], B[1][1]];
    for (let i = 0; i < (last ? 4 : 8); i++) { const tt = t + i * BEAT / 2; voice('triangle', mf(seq[i] + 12), tt, 0.008, 0.02, 0.75, 0.032, musEcho); }
    // 가락: 첫 바퀴 네 마디는 반주만 깔고 다섯째 마디부터 들어온다
    if (round > 0 || n >= 4) for (const [b, m, d] of B[2]) {
      const tt = t + b * BEAT, len = d * BEAT;
      voice('sine', mf(m), tt, 0.07, len - 0.12, 0.35, 0.1, musEcho, true);
      voice('sine', mf(m) * 2, tt, 0.07, len - 0.12, 0.3, 0.018, musEcho);
      if (round % 2 === 1) voice('sine', mf(m + 12), tt, 0.005, 0.01, 1.3, 0.03, musEcho);   // 종소리
    }
  }
  function endMusic(on) {
    init(); if (!ctx) return;
    resume();
    if (!musFade) {
      musMute = ctx.createGain(); musMute.gain.value = 1; musMute.connect(master);
      musFade = ctx.createGain(); musFade.gain.value = 0.0001; musFade.connect(musMute);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
      musEcho = ctx.createGain(); musEcho.connect(lp); lp.connect(musFade);
      const d = ctx.createDelay(1), fb = ctx.createGain(), dl = ctx.createBiquadFilter();   // 메아리 한 줄
      d.delayTime.value = BEAT * 0.75; fb.gain.value = 0.28; dl.type = 'lowpass'; dl.frequency.value = 1800;
      lp.connect(d); d.connect(dl); dl.connect(fb); fb.connect(d); dl.connect(musFade);
    }
    const t = now();
    musFade.gain.cancelScheduledValues(t);
    musFade.gain.setValueAtTime(Math.max(0.0001, musFade.gain.value), t);
    if (on) {
      if (!mus) mus = { n: 0, next: t + 0.2 };
      musFade.gain.linearRampToValueAtTime(1, t + 2.5);
    } else {
      mus = null;
      musFade.gain.linearRampToValueAtTime(0.0001, t + 3);
    }
  }
  function musicTick() {
    const t = now();
    musMute.gain.setTargetAtTime(T.sfx ? 1 : 0, t, 0.15);
    if (mus.next < t) mus.next = t + 0.05;   // 탭이 쉬다 돌아오면 지금부터 잇는다
    while (mus.next < t + 0.6) { bar(mus.n, mus.next); mus.n++; mus.next += BEAT * 4; }
  }

  function update(dt) {
    if (!ctx) return;
    if (mus) musicTick();
    if (!T.sfx || T.mode !== 'play') return;
    const t = now();
    const night = SKY.cur.night;
    const f = TER.forest(PL.pos.x, PL.pos.z);
    // 새소리 (낮, 숲일수록 자주)
    birdT -= dt * (f && f.k !== 'meadow' ? 1.4 : 0.7) * (1 - night);
    if (birdT <= 0) {
      birdT = 1.5 + Math.random() * 4;
      const base = 2600 + Math.random() * 1800, n = 2 + (Math.random() * 4 | 0);
      for (let i = 0; i < n; i++) tone('sine', base * (1 + Math.random() * 0.2), base * (0.7 + Math.random() * 0.6), 0.07, 0.025, t + i * 0.1, amb);
    }
    // 개구리 (늪·호숫가, 저녁·밤)
    const wet = Math.hypot(PL.pos.x - TER.Z.swamp.x, PL.pos.z - TER.Z.swamp.z) < 150 || TER.lakeE(PL.pos.x, PL.pos.z) < 1.4;
    frogT -= dt * (wet ? 1 : 0) * (0.3 + night);
    if (frogT <= 0) {
      frogT = 0.8 + Math.random() * 2.5;
      const o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.value = 140 + Math.random() * 60;
      fl.type = 'bandpass'; fl.frequency.value = 600; fl.Q.value = 3;
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 22; lg.gain.value = 0.02;
      lfo.connect(lg); lg.connect(g.gain);
      env(g, t, 0.02, 0.03, 0.3);
      o.connect(fl); fl.connect(g); g.connect(amb);
      o.start(t); o.stop(t + 0.4); lfo.start(t); lfo.stop(t + 0.4);
    }
    // 밤 귀뚜라미는 드물고 부드럽게
    crickT -= dt * night;
    if (crickT <= 0) {
      crickT = 6 + Math.random() * 12;
      for (let i = 0; i < 6; i++) tone('sine', 4200, 0, 0.04, 0.008, t + i * 0.09, amb);
    }
    // 모닥불 탁탁
    if (T.kupala >= 2) {
      const d = Math.hypot(PL.pos.x - TER.Z.bonfire.x, PL.pos.z - TER.Z.bonfire.z);
      crackT -= dt;
      if (crackT <= 0 && d < 40) { crackT = 0.05 + Math.random() * 0.25; noise(0.03, 0.12 * (1 - d / 40), t, 'highpass', 1800 + Math.random() * 2000); }
    }
  }

  window.AUD = { init, resume, sfx, update, endMusic, get ctx() { return ctx; }, get out() { return master; } };   // ctx·out 은 영상 찍을 때 소리를 따로 받는 데 쓴다
})();
