// 소리: 전부 코드로 만든다 (윷가락 딱, 멍석 툭, 장구 덩·쿵·따, 함성, 말 뛰는 톡, 국악풍 배경 가락)
(function () {
  const A = (window.AU = {});
  let ctx = null, sfx = null, mus = null, noiseBuf = null;
  const load = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v === '1'; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) {} };
  A.snd = load('yut.snd', true);
  A.bgm = load('yut.bgm', true);
  const SV = 0.8, MV = 0.11;

  function ensure() {
    if (ctx) return ctx;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    sfx = ctx.createGain(); sfx.gain.value = A.snd ? SV : 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 5;
    sfx.connect(comp); comp.connect(ctx.destination);
    mus = ctx.createGain(); mus.gain.value = A.bgm ? MV : 0; mus.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  A.unlock = function () { if (!ensure()) return; if (ctx.state === 'suspended') ctx.resume(); if (!mTimer) startMusic(); };
  A.setSnd = function (v) { A.snd = v; save('yut.snd', v); if (sfx) sfx.gain.value = v ? SV : 0; };
  A.setBgm = function (v) { A.bgm = v; save('yut.bgm', v); if (mus) mus.gain.value = v ? MV : 0; };

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
    s.buffer = noiseBuf; s.playbackRate.value = 0.8 + Math.random() * 0.4;
    f.type = type; f.frequency.value = freq; f.Q.value = q || 1;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + (attack || 0.003));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(out || sfx);
    s.start(t0, Math.random() * 1.5); s.stop(t0 + dur + 0.05);
  }
  // 가야금 비슷한 뜯는 소리
  function pluck(f, t0, dur, vol, out) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    o.type = 'triangle'; o2.type = 'sine';
    o.frequency.setValueAtTime(f, t0); o2.frequency.setValueAtTime(f * 2.01, t0);
    o.frequency.exponentialRampToValueAtTime(f * 0.985, t0 + dur);
    fl.type = 'lowpass'; fl.frequency.setValueAtTime(f * 6, t0); fl.frequency.exponentialRampToValueAtTime(f * 1.5, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    o.connect(fl); o2.connect(g2); g2.connect(fl); fl.connect(g); g.connect(out || sfx);
    o.start(t0); o2.start(t0); o.stop(t0 + dur + 0.05); o2.stop(t0 + dur + 0.05);
  }

  // 윷가락끼리 딱
  let lastK = 0, kN = 0;
  A.clack = function (v) {
    if (!ensure() || !A.snd) return;
    const now = ctx.currentTime;
    if (now - lastK > 0.05) kN = 0;
    if (kN > 5) return;
    kN++; lastK = now;
    const t = now, vol = Math.min(1, 0.25 + (v || 0.5) * 0.7);
    noise(t, 0.03, 0.5 * vol, 'bandpass', 2600 + Math.random() * 1200, 2);
    tone(900 + Math.random() * 500, t, 0.05, 'triangle', 0.18 * vol);
    tone(300 + Math.random() * 120, t, 0.09, 'sine', 0.12 * vol);
  };
  // 멍석에 툭
  A.thud = function (v) {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime, vol = Math.min(1, 0.3 + (v || 0.5) * 0.7);
    noise(t, 0.08, 0.35 * vol, 'lowpass', 500, 1);
    tone(120, t, 0.12, 'sine', 0.25 * vol, null, 60);
  };
  // 던지는 휙
  A.whoosh = function () {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    noise(t, 0.35, 0.2, 'bandpass', 900, 0.8, null, 0.12);
  };
  // 장구: 덩(양쪽) 쿵(북편) 따(채편)
  function kung(t, vol, out) { tone(95, t, 0.28, 'sine', 0.55 * vol, out, 52); noise(t, 0.05, 0.15 * vol, 'lowpass', 400, 1, out); }
  function tta(t, vol, out) { noise(t, 0.06, 0.45 * vol, 'highpass', 2200, 1.5, out); tone(1800, t, 0.03, 'square', 0.06 * vol, out); }
  function deong(t, vol) { kung(t, vol); tta(t, vol * 0.8); }
  // 결과 소리: 도·개·걸은 가볍게, 윷·모는 장구 + 함성
  A.result = function (name) {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime + 0.02;
    if (name === '도' || name === '빽도') { tta(t, 0.8); if (name === '빽도') tone(420, t + 0.05, 0.25, 'sine', 0.2, null, 300); }
    else if (name === '개') { tta(t, 0.8); tta(t + 0.13, 0.7); }
    else if (name === '걸') { tta(t, 0.8); tta(t + 0.12, 0.7); kung(t + 0.24, 0.7); }
    else if (name === '윷') { deong(t, 1); tta(t + 0.14, 0.8); deong(t + 0.28, 1); A.cheer(0.6, t + 0.1); }
    else if (name === '모') { deong(t, 1); deong(t + 0.16, 1); tta(t + 0.3, 0.9); deong(t + 0.42, 1.1); A.cheer(1, t + 0.1); }
  };
  // 함성(여럿이 우와)
  A.cheer = function (v, t0) {
    if (!ensure() || !A.snd) return;
    const t = t0 || ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const f = 180 + Math.random() * 220, d = 0.35 + Math.random() * 0.35;
      const o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t + i * 0.02); o.frequency.linearRampToValueAtTime(f * 1.25, t + d * 0.5); o.frequency.linearRampToValueAtTime(f * 0.9, t + d);
      fl.type = 'bandpass'; fl.frequency.value = 800 + Math.random() * 600; fl.Q.value = 1.2;
      g.gain.setValueAtTime(0.0001, t + i * 0.02); g.gain.exponentialRampToValueAtTime(0.06 * v, t + 0.08 + i * 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(fl); fl.connect(g); g.connect(sfx); o.start(t + i * 0.02); o.stop(t + d + 0.05);
    }
    noise(t, 0.5, 0.08 * v, 'bandpass', 1500, 0.5, null, 0.1);
  };
  // 말 한 칸 톡
  A.hop = function (i) {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    tone(520 + (i || 0) * 60, t, 0.07, 'triangle', 0.14, null, 380);
    noise(t, 0.02, 0.15, 'highpass', 3000, 1);
  };
  // 업기
  A.stack = function () {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    tone(600, t, 0.08, 'triangle', 0.15, null, 900); tone(900, t + 0.08, 0.12, 'triangle', 0.15, null, 1200);
  };
  // 잡기: 휙 + 헉 + 딱
  A.catch = function () {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    noise(t, 0.2, 0.3, 'bandpass', 1200, 1, null, 0.05);
    tone(200, t + 0.12, 0.3, 'sawtooth', 0.12, null, 90);
    tta(t + 0.15, 1); kung(t + 0.22, 1);
    for (let i = 0; i < 3; i++) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(300 + i * 60, t + 0.2); o.frequency.exponentialRampToValueAtTime(150, t + 0.55); g.gain.setValueAtTime(0.0001, t + 0.2); g.gain.exponentialRampToValueAtTime(0.05, t + 0.26); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55); o.connect(g); g.connect(sfx); o.start(t + 0.2); o.stop(t + 0.6); }
  };
  // 잡혔을 때(내 말)
  A.caught = function () {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    tone(360, t, 0.35, 'triangle', 0.18, null, 160);
  };
  // 났다: 맑은 종
  A.out = function () {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    [660, 880, 1320].forEach((f, i) => tone(f, t + i * 0.07, 0.5, 'sine', 0.16));
    pluck(440, t, 0.6, 0.2);
  };
  // 이겼다: 사물놀이 마무리 + 함성
  A.win = function () {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime + 0.05;
    const pat = [0, 0.16, 0.32, 0.4, 0.48, 0.64, 0.8, 1.04];
    pat.forEach((d, i) => (i % 2 ? tta(t + d, 0.9) : deong(t + d, 1)));
    deong(t + 1.3, 1.3);
    A.cheer(1.2, t + 0.3); A.cheer(1, t + 0.9);
    [523, 659, 784, 1046].forEach((f, i) => pluck(f, t + 1.3 + i * 0.09, 0.9, 0.2));
  };
  A.lose = function () {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    kung(t, 0.9); kung(t + 0.5, 0.7);
    pluck(330, t + 0.1, 0.8, 0.15); pluck(294, t + 0.5, 1.0, 0.15);
  };
  A.coin = function () {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    tone(1200, t, 0.08, 'square', 0.06); tone(1800, t + 0.07, 0.16, 'square', 0.06);
  };
  A.tap = function () {
    if (!ensure() || !A.snd) return;
    tone(700, ctx.currentTime, 0.05, 'triangle', 0.1, null, 500);
  };
  A.cpu = function () { // 상대가 약 올리는 짧은 콧방귀
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    tone(520, t, 0.09, 'triangle', 0.12, null, 700); tone(700, t + 0.1, 0.14, 'triangle', 0.1, null, 480);
  };

  // ---------- 배경 가락: 5음(평조) 가야금 + 장구 굿거리 ----------
  let mTimer = null, beat = 0;
  const SCALE = [261.6, 293.7, 349.2, 392.0, 440.0, 523.3, 587.3, 698.5, 784.0];
  function startMusic() {
    if (!ctx) return;
    let seed = 7, mel = 4;
    const r = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const STEP = 0.36; // 굿거리 느긋하게
    let next = ctx.currentTime + 0.1;
    mTimer = setInterval(() => {
      while (next < ctx.currentTime + 0.5) {
        const b = beat % 12; // 12박 굿거리
        if (b === 0 || b === 6) kung(next, 2.2, mus);
        if (b === 3 || b === 9 || b === 10) tta(next, 1.1, mus);
        if (b % 3 === 0 || r() < 0.35) {
          mel += Math.round((r() - 0.5) * 3); mel = Math.max(0, Math.min(SCALE.length - 1, mel));
          pluck(SCALE[mel], next, 0.9, 0.22, mus);
          if (b === 0 && r() < 0.6) pluck(SCALE[mel] / 2, next + 0.02, 1.2, 0.14, mus);
        }
        beat++; next += STEP;
      }
    }, 120);
  }
})();
