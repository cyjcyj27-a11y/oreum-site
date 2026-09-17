// 소리: 전부 코드로 만든다 (굴러가는 소리, 핀 부딪힘, 함성, 신나는 배경음)
(function () {
  const A = (window.AU = {});
  let ctx = null, sfx = null, mus = null, noiseBuf = null, rollSrc = null, rollGain = null, rollLP = null;
  const load = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v === '1'; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) {} };
  A.snd = load('bowling.snd', true);
  A.bgm = load('bowling.bgm', true);
  const SV = 0.7, MV = 0.13;

  function ensure() {
    if (ctx) return ctx;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    sfx = ctx.createGain();
    sfx.gain.value = A.snd ? SV : 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
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
  A.setSnd = function (v) { A.snd = v; save('bowling.snd', v); if (sfx) sfx.gain.value = v ? SV : 0; };
  A.setBgm = function (v) { A.bgm = v; save('bowling.bgm', v); if (mus) mus.gain.value = v ? MV : 0; };

  function tone(f, t0, dur, type, vol, out, f2) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.3, t0 + 0.008);
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
    g.gain.exponentialRampToValueAtTime(vol, t0 + (attack || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(out || sfx);
    s.start(t0, Math.random() * 1.5); s.stop(t0 + dur + 0.05);
  }

  // 핀 부딪힘: 나무통 울림 두 개 + 딱 소리
  let lastClack = 0, clackN = 0;
  function clack(v, t) {
    const vol = Math.min(0.55, 0.06 + v * 0.05);
    const f = 900 + Math.random() * 700;
    noise(t, 0.05, vol, 'bandpass', f * 2.2, 3);
    tone(f, t, 0.09, 'triangle', vol * 0.7);
    tone(f * 1.52, t, 0.06, 'sine', vol * 0.4);
    tone(220 + Math.random() * 60, t, 0.12, 'sine', vol * 0.5);
  }
  A.hit = function (v, ball) {
    if (!ensure() || !A.snd) return;
    const now = ctx.currentTime;
    if (now - lastClack > 0.03) clackN = 0;
    if (clackN > 7) return;
    clackN++;
    lastClack = now;
    const t = now + Math.random() * 0.012;
    clack(v, t);
    if (ball) {
      // 공이 핀 무리에 꽂힐 때 쿵
      tone(95, t, 0.35, 'sine', Math.min(0.7, 0.2 + v * 0.03), null, 45);
      noise(t, 0.25, Math.min(0.6, 0.15 + v * 0.03), 'lowpass', 1400, 0.7);
    }
  };

  // 굴러가는 소리 (계속 켜 두고 크기만 바꾼다)
  A.roll = function (speed, gutter) {
    if (!ensure()) return;
    if (!rollSrc) {
      rollSrc = ctx.createBufferSource();
      rollSrc.buffer = noiseBuf; rollSrc.loop = true;
      rollLP = ctx.createBiquadFilter();
      rollLP.type = 'lowpass'; rollLP.frequency.value = 260; rollLP.Q.value = 2;
      rollGain = ctx.createGain(); rollGain.gain.value = 0;
      const hum = ctx.createOscillator(); hum.type = 'sine'; hum.frequency.value = 48;
      const hg = ctx.createGain(); hg.gain.value = 0.25;
      hum.connect(hg); hg.connect(rollGain);
      rollSrc.connect(rollLP); rollLP.connect(rollGain); rollGain.connect(sfx);
      rollSrc.start(); hum.start();
    }
    const v = A.snd ? Math.min(1, speed / 8) * (gutter ? 0.9 : 0.75) : 0;
    rollGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
    rollLP.frequency.setTargetAtTime(gutter ? 520 : 180 + speed * 25, ctx.currentTime, 0.05);
  };

  // 환호: 음높이를 흔들지 않는 넓은 잡음(웅성) + 촘촘한 박수. 음높이가 오르내리면 귀신 소리가 된다
  function crowd(t, dur, vol) {
    const s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true;
    hp.type = 'highpass'; hp.frequency.value = 500;
    lp.type = 'lowpass'; lp.frequency.value = 3500;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol * 0.45, t + 0.08);
    g.gain.setValueAtTime(vol * 0.45, t + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(sfx);
    s.start(t); s.stop(t + dur + 0.1);
    // 박수: 짧고 딱딱한 소리를 많이
    const n = Math.round(dur * 38);
    for (let i = 0; i < n; i++) {
      const k = Math.random();
      const at = t + 0.03 + k * k * dur * 0.85;
      noise(at, 0.018 + Math.random() * 0.012, vol * (0.5 + Math.random() * 0.6) * (1 - k * 0.7), 'bandpass', 1100 + Math.random() * 1800, 1.4, null, 0.001);
    }
  }

  A.play = function (name, n) {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    switch (name) {
      case 'tap': tone(880, t, 0.06, 'triangle', 0.18); break;
      case 'buy': [784, 988, 1319].forEach((f, i) => tone(f, t + i * 0.06, 0.2, 'triangle', 0.25)); break;
      case 'no': tone(200, t, 0.18, 'square', 0.1, null, 120); break;
      case 'throw': noise(t, 0.12, 0.25, 'lowpass', 500, 1); tone(70, t, 0.15, 'sine', 0.35, null, 40); break;
      case 'gutter': tone(120, t, 0.25, 'sine', 0.3, null, 70); noise(t, 0.2, 0.2, 'lowpass', 700, 1); break;
      case 'wall': noise(t, 0.08, 0.2, 'bandpass', 500, 2); break;
      case 'pit': tone(60, t, 0.3, 'sine', 0.35, null, 35); noise(t, 0.2, 0.2, 'lowpass', 400); break;
      case 'coin': tone(1319, t, 0.08, 'square', 0.08); tone(1760, t + 0.07, 0.18, 'square', 0.08); break;
      case 'strike': {
        crowd(t + 0.05, 2.4, 0.22);
        [523, 659, 784, 1047, 1319].forEach((f, i) => { tone(f, t + i * 0.07, 0.35, 'sawtooth', 0.07); tone(f * 2, t + i * 0.07, 0.3, 'triangle', 0.08); });
        tone(1568, t + 0.4, 0.6, 'triangle', 0.12);
        break;
      }
      case 'spare':
        crowd(t + 0.05, 1.6, 0.14);
        [587, 784, 988, 1175].forEach((f, i) => tone(f, t + i * 0.08, 0.3, 'triangle', 0.14));
        break;
      case 'open': tone(392, t, 0.12, 'triangle', 0.12); tone(330, t + 0.1, 0.2, 'triangle', 0.1); break;
      case 'aww':
        // 아쉬움: 짧게 내려가는 효과음
        tone(330, t, 0.14, 'triangle', 0.14);
        tone(247, t + 0.13, 0.28, 'triangle', 0.12);
        break;
      case 'win':
        crowd(t, 3, 0.2);
        [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.11, 0.3, 'square', 0.07));
        break;
      case 'lose': [392, 349, 311, 262].forEach((f, i) => tone(f, t + i * 0.18, 0.35, 'triangle', 0.14)); break;
      case 'sweep': noise(t, 0.6, 0.12, 'lowpass', 300, 1, null, 0.2); tone(90, t, 0.5, 'sawtooth', 0.03); break;
      case 'drop': for (let i = 0; i < 6; i++) clack(1.5, t + i * 0.035); break;
    }
  };

  // ---------- 배경음: 디스코 볼링장 느낌 (116bpm) ----------
  let mTimer = null, step = 0, nextT = 0;
  const BPM = 116, S16 = 60 / BPM / 4;
  const PROG = [[45, 57, 60, 64], [41, 53, 57, 60], [43, 55, 59, 62], [40, 52, 56, 59]]; // Am F G E
  const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const LEAD = [69, -1, 72, -1, 76, -1, 74, 72, 71, -1, 72, -1, 69, -1, -1, -1];
  function mNote(f, t, dur, type, vol, cut) {
    const o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    o.type = type; o.frequency.value = f;
    fl.type = 'lowpass'; fl.frequency.value = cut || 1800;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(fl); fl.connect(g); g.connect(mus);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function mNoise(t, dur, vol, type, f) {
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; fl.type = type; fl.frequency.value = f;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(mus);
    s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }
  function tickMusic() {
    if (!ctx) return;
    while (nextT < ctx.currentTime + 0.2) {
      const t = nextT, s = step % 16, bar = Math.floor(step / 16) % 4, ch = PROG[bar];
      if (A.bgm && !A.paused) {
        if (s % 4 === 0) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.connect(g); g.connect(mus); o.start(t); o.stop(t + 0.2); }
        if (s % 4 === 2) mNoise(t, 0.09, 0.35, 'highpass', 7000);
        if (s === 4 || s === 12) mNoise(t, 0.16, 0.45, 'bandpass', 1800);
        // 옥타브 뛰는 디스코 베이스
        mNote(mf(ch[0] - 12 + (s % 2 ? 12 : 0)), t, S16 * 0.9, 'sawtooth', 0.22, 700);
        if (s % 8 === 3 || s % 8 === 6) for (let k = 1; k < 4; k++) mNote(mf(ch[k]), t, S16 * 1.5, 'square', 0.035, 2400);
        const L = LEAD[s];
        if (L > 0 && Math.floor(step / 64) % 2 === 1) mNote(mf(L + (bar === 1 ? -4 : bar === 3 ? -1 : 0)), t, S16 * 1.8, 'triangle', 0.09, 3000);
      }
      nextT += S16;
      step++;
    }
  }
  function startMusic() {
    nextT = ctx.currentTime + 0.1;
    mTimer = setInterval(tickMusic, 50);
  }
})();
