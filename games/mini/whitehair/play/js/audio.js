// 소리: 전부 코드로 합성(밝기 2kHz 아래로 편하게)
(function () {
  const A = (window.SND = {});
  let ctx = null, master = null, sfx = null, bgm = null, noiseB = null;
  A.sfxOn = localStorage.getItem('whitehair.snd') !== '0';
  A.bgmOn = localStorage.getItem('whitehair.bgm') !== '0';
  A.ensure = function () {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = A._muted ? 0 : 0.9; master.connect(ctx.destination); // 음소거를 먼저 걸었어도 지킴
    sfx = ctx.createGain(); sfx.gain.value = A.sfxOn ? 1 : 0; sfx.connect(master);
    bgm = ctx.createGain(); bgm.gain.value = A.bgmOn ? 0.32 : 0; bgm.connect(master);
    noiseB = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const d = noiseB.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  };
  A.setSfx = (on) => { A.sfxOn = on; localStorage.setItem('whitehair.snd', on ? '1' : '0'); if (sfx) sfx.gain.value = on ? 1 : 0; };
  A.setBgm = (on) => { A.bgmOn = on; localStorage.setItem('whitehair.bgm', on ? '1' : '0'); if (bgm) bgm.gain.setTargetAtTime(on ? 0.32 : 0, ctx.currentTime, 0.1); };
  A.mute = () => { if (master) master.gain.value = 0; A._muted = true; };

  function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function osc(type, f, t, a, peak, d, out, f2) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    env(g, t, a, peak, d); o.connect(g); g.connect(out || sfx); o.start(t); o.stop(t + a + d + 0.05); return o;
  }
  function noise(t, dur, peak, type, f, q, out, f2) {
    const s = ctx.createBufferSource(); s.buffer = noiseB;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q || 1;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = ctx.createGain(); env(g, t, 0.005, peak, dur);
    s.connect(fl); fl.connect(g); g.connect(out || sfx); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  const ok = () => A.ensure() && ctx;

  // 머리카락이 뿌리째 톡
  A.pluck = function (perfect) {
    if (!ok()) return; const t = ctx.currentTime;
    noise(t, 0.05, 0.5, 'bandpass', 1300, 2.5);
    osc('sine', 300, t, 0.003, 0.5, 0.09, null, 120);
    if (perfect) { osc('triangle', 660, t + 0.06, 0.005, 0.18, 0.18); osc('triangle', 990, t + 0.12, 0.005, 0.15, 0.25); }
  };
  // 중간에서 끊어짐(가는 틱)
  A.snap = function () { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.03, 0.4, 'highpass', 1600, 1); osc('square', 900, t, 0.002, 0.05, 0.04, null, 500); };
  // 당기는 동안 두피가 버티는 소리(낮게 끼익)
  let strain = null;
  A.strain = function (k) {
    if (!ok()) return;
    if (!strain) {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = 90; f.type = 'lowpass'; f.frequency.value = 500; g.gain.value = 0;
      o.connect(f); f.connect(g); g.connect(sfx); o.start(); strain = { o, f, g };
    }
    strain.g.gain.setTargetAtTime(k > 0.02 ? 0.03 + k * 0.06 : 0, ctx.currentTime, 0.03);
    strain.o.frequency.setTargetAtTime(80 + k * 140, ctx.currentTime, 0.03);
  };
  // 아야! (모음 두 개를 목소리처럼)
  A.ouch = function (big) {
    if (!ok()) return; const t = ctx.currentTime;
    const p = big ? 1.15 : 1;
    const voice = (t0, dur, f0, f1, fm) => {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0 * p, t0); o.frequency.linearRampToValueAtTime(f1 * p, t0 + dur);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(0.28, t0 + 0.02); g.gain.setValueAtTime(0.28, t0 + dur - 0.05); g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
      const mix = ctx.createGain(); mix.gain.value = 1;
      fm.forEach(([f, q, a]) => { const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = q; const ga = ctx.createGain(); ga.gain.value = a; o.connect(b); b.connect(ga); ga.connect(g); });
      g.connect(sfx); o.start(t0); o.stop(t0 + dur + 0.05);
    };
    voice(t, 0.12, 260, 300, [[800, 6, 1.2], [1200, 7, 0.8]]); // 아
    voice(t + 0.13, 0.26, 330, 200, [[400, 6, 0.8], [1900, 9, 0.35], [800, 6, 1.1]]); // 야
  };
  // 코인
  A.coin = function () { if (!ok()) return; const t = ctx.currentTime; osc('triangle', 784, t, 0.004, 0.16, 0.12); osc('triangle', 1175, t + 0.07, 0.004, 0.14, 0.22); };
  // 황금 머리카락: 동전 쏟아지는 짤랑 여러 번(밝기 2kHz 아래)
  A.gold = function () { if (!ok()) return; const t = ctx.currentTime; [0, 0.07, 0.14, 0.21, 0.3].forEach((d, i) => { osc('triangle', [784, 988, 1175, 1318, 1568][i], t + d, 0.004, 0.17, 0.3); osc('sine', [1175, 1480, 1760, 1976, 1976][i] * 0.75, t + d, 0.004, 0.06, 0.25); }); };
  // 빗질 사락
  let combT = 0;
  A.comb = function () { if (!ok()) return; const t = ctx.currentTime; if (t - combT < 0.07) return; combT = t; noise(t, 0.09, 0.12, 'bandpass', 1500, 1.4, null, 900); };
  A.reveal = function () { if (!ok()) return; const t = ctx.currentTime; osc('sine', 880, t, 0.005, 0.12, 0.2); osc('sine', 1320, t + 0.08, 0.005, 0.1, 0.3); };
  // 셔터 드르륵
  A.shutter = function (dur) {
    if (!ok()) return; const t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = noiseB; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 0.8;
    const g = ctx.createGain(); g.gain.value = 0;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 26; const lg = ctx.createGain(); lg.gain.value = 0.18; lfo.connect(lg); lg.connect(g.gain);
    g.gain.setValueAtTime(0.0, t); g.gain.linearRampToValueAtTime(0.2, t + 0.1); g.gain.setValueAtTime(0.2, t + dur - 0.2); g.gain.linearRampToValueAtTime(0, t + dur);
    s.connect(f); f.connect(g); g.connect(sfx); s.start(t); lfo.start(t); s.stop(t + dur + 0.1); lfo.stop(t + dur + 0.1);
    osc('sine', 70, t + dur - 0.05, 0.005, 0.4, 0.2); // 끝에 쿵
  };
  // 형광등 지직 + 켜짐
  A.light = function () { if (!ok()) return; const t = ctx.currentTime; for (let i = 0; i < 4; i++) noise(t + i * 0.09, 0.04, 0.12, 'bandpass', 120 * (i + 1), 3); osc('sine', 120, t + 0.4, 0.05, 0.03, 0.6); };
  // 문 종 딸랑
  A.bell = function () { if (!ok()) return; const t = ctx.currentTime; [0, 0.11, 0.2].forEach((d, i) => { osc('sine', 988, t + d, 0.003, 0.22 - i * 0.05, 0.9); osc('sine', 1480, t + d, 0.003, 0.08, 0.6); osc('sine', 1976 * 0.75, t + d, 0.003, 0.04, 0.4); }); };
  A.ui = function () { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.03, 0.25, 'bandpass', 900, 2); osc('sine', 520, t, 0.002, 0.12, 0.05); };
  A.clear = function () { if (!ok()) return; const t = ctx.currentTime; [523, 659, 784, 1046].forEach((f, i) => { osc('triangle', f, t + i * 0.09, 0.006, 0.18, 0.35); }); };
  A.fail = function () { if (!ok()) return; const t = ctx.currentTime; [392, 330, 262].forEach((f, i) => osc('triangle', f, t + i * 0.16, 0.01, 0.18, 0.3)); };
  A.fanfare = function () { if (!ok()) return; const t = ctx.currentTime; const n = [523, 659, 784, 1046, 784, 1046, 1318]; n.forEach((f, i) => { osc('triangle', f, t + i * 0.13, 0.01, 0.2, i === n.length - 1 ? 1.2 : 0.3); osc('sine', f / 2, t + i * 0.13, 0.01, 0.1, 0.3); }); };

  // 배경음: 느긋한 가게 라디오(전자피아노 화음 + 걷는 베이스 + 솔 브러시)
  let bgmT = 0, bar = 0, playing = false;
  const CH = [[57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65], [60, 64, 67, 71]]; // Am7 Dm7 G7 Cmaj7
  const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function ep(f, t, d, v) {
    const o = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f; m.frequency.value = f * 2; mg.gain.setValueAtTime(f * 1.2, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + 0.6);
    m.connect(mg); mg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(bgm); o.start(t); m.start(t); o.stop(t + d + 0.05); m.stop(t + d + 0.05);
  }
  function sched() {
    if (!playing) return;
    const spb = 60 / 84;
    while (bgmT < ctx.currentTime + 1.2) {
      const c = CH[bar % 4];
      [0, 1.5, 2.5].forEach((b, i) => c.forEach((n, k) => ep(mf(n), bgmT + b * spb + k * 0.012, i ? 1.0 : 1.6, i ? 0.035 : 0.05)));
      [0, 1, 2, 3].forEach((b) => { const n = c[0] - 12 + [0, 7, 12, 10][b]; osc('triangle', mf(n), bgmT + b * spb, 0.01, 0.12, spb * 0.8, bgm); });
      [0.5, 1.5, 2.5, 3.5].forEach((b) => noise(bgmT + b * spb, 0.08, 0.05, 'bandpass', 1800, 0.8, bgm));
      if (bar % 2 === 1) { const mel = [c[3] + 12, c[2] + 12, c[3] + 12 + 2, c[1] + 12]; mel.forEach((n, i) => ep(mf(n), bgmT + (0.5 + i * 0.75) * spb, 0.5, 0.03)); }
      bgmT += 4 * spb; bar++;
    }
    setTimeout(sched, 300);
  }
  A.startBgm = function () { if (!ok() || playing) return; playing = true; bgmT = ctx.currentTime + 0.1; sched(); };
})();
