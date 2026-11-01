// 소리: 전부 코드로. 붕붕(벌 가까울수록 크게)·칙(스프레이)·탁(벌 떨어짐)·따끔(쏘임)·휙(포충망)·봉투·발견·완료 + 배경음(느긋한 시골 뜯는 소리).
// 규칙: 부딪히는 소리는 2kHz 아래 밝기, 보상음은 사인·삼각파 5음계, 크게 할 땐 음 수로.
(function () {
  const A = (window.AU = {});
  let ctx = null, sfx = null, mus = null, noiseBuf = null;
  const load = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v === '1'; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) {} };
  A.snd = load('wasp.snd', true); A.bgm = load('wasp.bgm', true);
  const SV = 0.8, MV = 0.12;
  let buzz = null, hiss = null;
  function ensure() {
    if (ctx) return ctx;
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    ctx = new C();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(ctx.destination);
    sfx = ctx.createGain(); sfx.gain.value = A.snd ? SV : 0; sfx.connect(comp);
    mus = ctx.createGain(); mus.gain.value = A.bgm ? MV : 0; mus.connect(ctx.destination);
    const n = ctx.sampleRate * 1.5; noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); let s = 4321; for (let i = 0; i < n; i++) { s = (s * 16807) % 2147483647; d[i] = (s / 2147483647) * 2 - 1; }
    // 붕붕: 톱니 두 개(살짝 어긋남) → 띠 거름, 떨림
    buzz = { g: ctx.createGain() }; buzz.g.gain.value = 0;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 1.4;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600;
    buzz.o1 = ctx.createOscillator(); buzz.o1.type = 'sawtooth'; buzz.o1.frequency.value = 182;
    buzz.o2 = ctx.createOscillator(); buzz.o2.type = 'sawtooth'; buzz.o2.frequency.value = 191;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 7; const lg = ctx.createGain(); lg.gain.value = 9; lfo.connect(lg); lg.connect(buzz.o1.frequency); lg.connect(buzz.o2.frequency);
    buzz.o1.connect(bp); buzz.o2.connect(bp); bp.connect(lp); lp.connect(buzz.g); buzz.g.connect(sfx);
    buzz.o1.start(); buzz.o2.start(); lfo.start();
    // 칙: 잡음 → 띠 거름(1.6kHz)
    hiss = { g: ctx.createGain() }; hiss.g.gain.value = 0;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const hb = ctx.createBiquadFilter(); hb.type = 'bandpass'; hb.frequency.value = 1700; hb.Q.value = 0.7;
    const hl = ctx.createBiquadFilter(); hl.type = 'lowpass'; hl.frequency.value = 3200;
    src.connect(hb); hb.connect(hl); hl.connect(hiss.g); hiss.g.connect(sfx); src.start();
    return ctx;
  }
  A.ctx = () => ctx;
  A.unlock = function () { if (!ensure()) return; if (ctx.state === 'suspended') ctx.resume(); if (!timer) startMusic(); };
  A.setSnd = function (v) { A.snd = v; save('wasp.snd', v); if (sfx) sfx.gain.value = v ? SV : 0; };
  A.setBgm = function (v) { A.bgm = v; save('wasp.bgm', v); if (mus) mus.gain.value = v ? MV : 0; };
  // 계속 나는 소리: near = 가까운 벌 무게(0~), angry 0~1, spraying
  A.loops = function (near, angry, spraying, pitchK) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const v = Math.min(0.32, near * 0.05);
    buzz.g.gain.setTargetAtTime(v, t, 0.08);
    const f = 175 + angry * 45 + (pitchK || 0) * 30;
    buzz.o1.frequency.setTargetAtTime(f, t, 0.2); buzz.o2.frequency.setTargetAtTime(f * 1.05, t, 0.2);
    hiss.g.gain.setTargetAtTime(spraying ? 0.16 : 0, t, spraying ? 0.02 : 0.05);
  };
  function tone(f, t, o) {
    o = o || {};
    const g = ctx.createGain(), osc = ctx.createOscillator();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t);
    if (o.glide) osc.frequency.exponentialRampToValueAtTime(o.glide, t + (o.dur || 0.2));
    const att = o.att || 0.004, dur = o.dur || 0.2, vol = o.vol || 0.3;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + att + dur);
    osc.connect(g); g.connect(o.out || sfx); osc.start(t); osc.stop(t + att + dur + 0.05);
  }
  function noise(t, o) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = o.ft || 'bandpass'; f.frequency.setValueAtTime(o.f || 800, t); f.Q.value = o.q || 1;
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + (o.dur || 0.2));
    const g = ctx.createGain(), att = o.att || 0.003, dur = o.dur || 0.2;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(o.vol || 0.3, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + att + dur);
    src.connect(f); f.connect(g); g.connect(o.out || sfx); src.start(t, Math.random() * 0.5); src.stop(t + att + dur + 0.05);
  }
  const PENT = [0, 2, 4, 7, 9];
  const note = (base, step) => base * Math.pow(2, (PENT[((step % 5) + 5) % 5] + 12 * Math.floor(step / 5)) / 12);
  A.play = function (k, x) {
    if (!ctx || !A.snd) return;
    const t = ctx.currentTime;
    switch (k) {
      case 'kill': // 벌이 맞아 떨어짐: 낮은 탁 + 작은 마림바 한 음(연속이면 음이 오름)
        tone(140, t, { glide: 70, dur: 0.09, vol: 0.25 });
        tone(note(523, Math.min(9, x || 0)), t + 0.01, { type: 'triangle', dur: 0.18, vol: 0.12 });
        break;
      case 'land': noise(t, { f: 500, q: 2, dur: 0.04, vol: 0.06 }); break;
      case 'sting': // 따끔: 짧은 찌름 + 둔한 퍽
        noise(t, { f: 1400, q: 3, dur: 0.06, vol: 0.32 });
        tone(110, t, { glide: 60, dur: 0.16, vol: 0.4 });
        break;
      case 'ouch': tone(220, t, { type: 'triangle', glide: 140, dur: 0.25, vol: 0.25 }); break;
      case 'net': noise(t, { f: 300, f2: 1200, q: 0.8, dur: 0.22, vol: 0.35 }); break;
      case 'catch': [0, 2, 4].slice(0, Math.min(3, x || 1)).forEach((s, i) => tone(note(392, s + 3), t + i * 0.05, { type: 'triangle', dur: 0.2, vol: 0.14 })); break;
      case 'bagUp': noise(t, { f: 200, f2: 900, q: 0.7, dur: 0.5, vol: 0.2 }); break;
      case 'bag': // 봉투 쑥 + 끈 조임 + 툭
        noise(t, { f: 900, f2: 250, q: 0.8, dur: 0.18, vol: 0.4 });
        tone(330, t + 0.18, { type: 'triangle', glide: 660, dur: 0.12, vol: 0.18 });
        tone(90, t + 0.34, { glide: 50, dur: 0.22, vol: 0.55 });
        [0, 2, 4, 5].forEach((s, i) => tone(note(392, s + 2), t + 0.45 + i * 0.08, { type: 'triangle', dur: 0.3, vol: 0.16 }));
        break;
      case 'found': [0, 2, 4, 7].forEach((s, i) => tone(note(440, s), t + i * 0.07, { type: 'sine', dur: 0.35, vol: 0.18 })); break;
      case 'can': tone(600, t, { type: 'triangle', dur: 0.05, vol: 0.2 }); noise(t + 0.05, { f: 1200, q: 1, dur: 0.12, vol: 0.18 }); tone(200, t + 0.12, { dur: 0.1, vol: 0.2 }); break;
      case 'empty': tone(180, t, { type: 'square', dur: 0.06, vol: 0.06 }); tone(150, t + 0.08, { type: 'square', dur: 0.06, vol: 0.06 }); break;
      case 'nope': tone(200, t, { type: 'triangle', glide: 160, dur: 0.15, vol: 0.18 }); break;
      case 'click': noise(t, { f: 700, q: 1.2, dur: 0.05, vol: 0.2 }); tone(300, t, { dur: 0.05, vol: 0.12 }); break;
      case 'coin': tone(988, t, { type: 'sine', dur: 0.12, vol: 0.12 }); tone(1318, t + 0.07, { type: 'sine', dur: 0.25, vol: 0.12 }); break;
      case 'clear': [0, 2, 4, 5, 7, 9].forEach((s, i) => { tone(note(392, s), t + i * 0.1, { type: 'triangle', dur: 0.4, vol: 0.18 }); tone(note(196, s), t + i * 0.1, { dur: 0.4, vol: 0.12 }); }); break;
      case 'siren': for (let i = 0; i < 4; i++) { tone(660, t + i * 0.6, { type: 'triangle', dur: 0.28, vol: 0.12 }); tone(520, t + i * 0.6 + 0.3, { type: 'triangle', dur: 0.28, vol: 0.12 }); } break;
      case 'honeyBad': tone(300, t, { type: 'triangle', glide: 200, dur: 0.3, vol: 0.2 }); break;
      case 'box': [0, 2, 4, 7, 9].forEach((s, i) => tone(note(523, s), t + i * 0.06, { type: 'sine', dur: 0.3, vol: 0.14 })); break;
    }
  };
  // ---------- 배경음: 느긋한 시골 뜯는 소리(5음계, 96bpm) ----------
  let timer = null, step = 0, nextT = 0;
  const BPM = 96, S16 = 60 / BPM / 4;
  const PROG = [[0, 4], [3, 7], [4, 8], [0, 4]]; // 근음 단계
  function startMusic() {
    if (!ctx) return;
    nextT = ctx.currentTime + 0.1;
    timer = setInterval(() => {
      while (nextT < ctx.currentTime + 0.2) { sched(step, nextT); step++; nextT += S16 * (step % 2 ? 1.08 : 0.92); }
    }, 50);
  }
  const MEL = [7, -1, 9, 7, -1, 5, 4, -1, 5, -1, 7, -1, 4, 2, -1, -1, 4, -1, 5, 7, -1, 9, 10, -1, 9, -1, 7, 5, 4, -1, -1, -1];
  function sched(s, t) {
    const bar = ((s / 16) | 0) % 4, b16 = s % 16, root = PROG[bar][0];
    if (b16 % 4 === 0) tone(note(98, root), t, { dur: 0.32, vol: 0.5, out: mus }); // 베이스
    if (b16 % 4 === 2) tone(note(98, root + 2), t, { dur: 0.2, vol: 0.32, out: mus });
    if (b16 % 2 === 1) noise(t, { f: 5000, q: 0.8, dur: 0.03, vol: 0.06, ft: 'highpass', out: mus }); // 셰이커
    if (b16 === 4 || b16 === 12) { [0, 2, 4].forEach((k) => tone(note(196, root + k), t, { type: 'triangle', dur: 0.25, vol: 0.12, out: mus })); }
    const m = MEL[(s % 32)];
    if (m >= 0 && bar !== 3) tone(note(392, m + (bar === 1 ? 1 : 0)), t, { type: 'triangle', dur: 0.24, vol: 0.2, out: mus });
  }
})();
