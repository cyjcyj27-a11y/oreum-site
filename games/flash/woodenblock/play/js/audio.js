// 소리: 전부 코드로 만든다 (나무 딱딱, 미끄러지는 사각 소리, 와르르, 잔잔한 배경음)
(function () {
  const A = (window.AU = {});
  let ctx = null, sfx = null, mus = null, noiseBuf = null;
  const load = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v === '1'; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) {} };
  A.snd = load('woodenblock.snd', true);
  A.bgm = load('woodenblock.bgm', true);
  const SV = 0.75, MV = 0.1;

  function ensure() {
    if (ctx) return ctx;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    sfx = ctx.createGain();
    sfx.gain.value = A.snd ? SV : 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 6;
    sfx.connect(comp);
    comp.connect(ctx.destination);
    mus = ctx.createGain();
    mus.gain.value = A.bgm ? MV : 0;
    mus.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  A.unlock = function () {
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (!mTimer) startMusic();
  };
  A.setSnd = function (v) { A.snd = v; save('woodenblock.snd', v); if (sfx) sfx.gain.value = v ? SV : 0; if (!v) A.scrape(0); };
  A.setBgm = function (v) { A.bgm = v; save('woodenblock.bgm', v); if (mus) mus.gain.value = v ? MV : 0; };

  function tone(f, t0, dur, type, vol, out, f2) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.3, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(out || sfx);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur, vol, type, freq, q, out, attack) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    s.playbackRate.value = 0.8 + Math.random() * 0.4;
    f.type = type; f.frequency.value = freq; f.Q.value = q || 1;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + (attack || 0.003));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(out || sfx);
    s.start(t0, Math.random() * 1.5); s.stop(t0 + dur + 0.05);
  }

  // 나무토막 딱: 짧은 두드림 + 속 빈 울림
  let lastK = 0, kN = 0;
  A.knock = function (v) {
    if (!ensure() || !A.snd) return;
    const now = ctx.currentTime;
    if (now - lastK > 0.04) kN = 0;
    if (kN > 6) return;
    kN++; lastK = now;
    const t = now + Math.random() * 0.01;
    const vol = Math.min(0.5, 0.05 + v * 0.09);
    const f = 1100 + Math.random() * 900;
    noise(t, 0.035, vol, 'bandpass', f * 1.8, 4);
    tone(f, t, 0.06, 'triangle', vol * 0.6);
    tone(f * 0.47, t, 0.08, 'sine', vol * 0.5);
    tone(260 + Math.random() * 80, t, 0.1, 'sine', vol * 0.35);
  };

  // 미끄러지는 사각 소리 (끌 때 계속)
  let scr = null;
  A.scrape = function (speed) {
    if (!ctx) return;
    if (!scr) {
      if (!speed) return;
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = noiseBuf; s.loop = true;
      f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 0.9;
      f2.type = 'highshelf'; f2.frequency.value = 3000; f2.gain.value = -8;
      g.gain.value = 0;
      s.connect(f); f.connect(f2); f2.connect(g); g.connect(sfx);
      s.start();
      scr = { s, f, g };
    }
    const v = A.snd ? Math.min(0.32, speed * 0.9) : 0;
    const t = ctx.currentTime;
    scr.g.gain.setTargetAtTime(v * (0.75 + Math.random() * 0.5), t, 0.03);
    scr.f.frequency.setTargetAtTime(1100 + speed * 2600, t, 0.05);
  };

  A.pop = function () {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    tone(420, t, 0.16, 'sine', 0.35, null, 980);
    noise(t, 0.05, 0.2, 'bandpass', 2400, 3);
  };
  A.place = function () {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    tone(180, t, 0.14, 'sine', 0.45, null, 120);
    noise(t, 0.05, 0.25, 'lowpass', 900, 1);
  };
  A.click = function () {
    if (!ensure() || !A.snd) return;
    tone(900, ctx.currentTime, 0.05, 'triangle', 0.18);
  };
  A.coin = function () {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    tone(1320, t, 0.08, 'square', 0.08);
    tone(1980, t + 0.07, 0.18, 'square', 0.08);
  };
  // 와르르: 낮은 쿵 + 흩어지는 딱딱은 물리 충돌에서 따로 난다
  A.crash = function () {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    tone(110, t, 0.5, 'sine', 0.55, null, 55);
    noise(t, 0.6, 0.35, 'lowpass', 500, 0.8, null, 0.02);
    for (let i = 0; i < 14; i++) setTimeout(() => A.knock(0.8 + Math.random() * 2.5), 40 + i * (50 + Math.random() * 60));
  };
  A.creak = function (v) {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(70 + Math.random() * 30, t);
    o.frequency.linearRampToValueAtTime(95 + Math.random() * 40, t + 0.35);
    f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 5;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.min(0.12, 0.03 + v * 0.05), t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(f); f.connect(g); g.connect(sfx);
    o.start(t); o.stop(t + 0.45);
  };
  A.win = function () {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.1, 0.35, 'triangle', 0.22));
    tone(1568, t + 0.42, 0.5, 'sine', 0.15);
  };
  A.lose = function () {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    [392, 330, 262].forEach((f, i) => tone(f, t + 0.5 + i * 0.18, 0.4, 'triangle', 0.18));
  };
  A.meow = function (happy) {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = 'sawtooth';
    const a = happy ? 620 : 520;
    o.frequency.setValueAtTime(a, t);
    o.frequency.linearRampToValueAtTime(a * 1.5, t + 0.12);
    o.frequency.linearRampToValueAtTime(a * (happy ? 1.2 : 0.8), t + 0.42);
    f.type = 'bandpass'; f.frequency.setValueAtTime(900, t); f.frequency.linearRampToValueAtTime(1600, t + 0.15); f.frequency.linearRampToValueAtTime(800, t + 0.42); f.Q.value = 3;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    o.connect(f); f.connect(g); g.connect(sfx);
    o.start(t); o.stop(t + 0.5);
  };

  // ---------- 배경음: 느린 로파이 (전자피아노 화음 + 붓 드럼) ----------
  let mTimer = null, bar = 0;
  const CH = [
    [53, 57, 60, 64], // Fmaj7
    [52, 55, 59, 62], // Em7
    [50, 53, 57, 60], // Dm7
    [48, 52, 55, 59], // Cmaj7
  ];
  const mf = (n) => 440 * Math.pow(2, (n - 69) / 12);
  function ep(f, t, dur, vol) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = 'sine'; o2.type = 'triangle';
    o.frequency.value = f; o2.frequency.value = f * 2.001;
    lp.type = 'lowpass'; lp.frequency.value = 1800;
    const g2 = ctx.createGain(); g2.gain.value = 0.18;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(vol * 0.35, t + 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(mus);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  function startMusic() {
    const beat = 60 / 76;
    let next = ctx.currentTime + 0.2;
    const sched = () => {
      while (next < ctx.currentTime + 1.2) {
        const c = CH[bar % 4];
        const t = next;
        // 화음 (살짝 흩뿌려서)
        c.forEach((n, i) => ep(mf(n), t + i * 0.025, beat * 3.6, 0.22));
        ep(mf(c[0] - 12), t, beat * 3.8, 0.3);
        // 멜로디 조각
        const mel = [c[3] + 12, c[2] + 12, c[1] + 12, c[3] + 12];
        if (bar % 2 === 1) {
          ep(mf(mel[0]), t + beat * 1.5, beat * 1.2, 0.12);
          ep(mf(mel[1]), t + beat * 2.5, beat * 1.4, 0.1);
        }
        // 붓 드럼
        for (let b = 0; b < 4; b++) {
          const tb = t + b * beat;
          if (b === 0 || b === 2) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(90, tb); o.frequency.exponentialRampToValueAtTime(45, tb + 0.15); g.gain.setValueAtTime(0.5, tb); g.gain.exponentialRampToValueAtTime(0.0001, tb + 0.2); o.connect(g); g.connect(mus); o.start(tb); o.stop(tb + 0.25); }
          noise(tb + beat * 0.5, 0.12, b % 2 ? 0.1 : 0.05, 'highpass', 6000, 0.7, mus, 0.02);
          if (b % 2) noise(tb, 0.25, 0.12, 'bandpass', 1800, 0.6, mus, 0.03);
        }
        next += beat * 4;
        bar++;
      }
    };
    sched();
    mTimer = setInterval(sched, 300);
  }
})();
