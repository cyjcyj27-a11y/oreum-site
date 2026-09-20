// 소리: 전부 코드로 만든다 (차는 소리·벽·기둥·휘슬·함성·골). 녹음 파일 안 씀 (사장님 2026-09-20)
(function () {
  const A = (window.AU = {});
  let ctx = null, sfx = null, mus = null, noiseBuf = null;
  const load = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v === '1'; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) {} };
  A.snd = load('foosball.snd', true);
  A.bgm = load('foosball.bgm', true);
  const SV = 0.75, MV = 0.12;

  function ensure() {
    if (ctx) return ctx;
    const K = window.AudioContext || window.webkitAudioContext;
    if (!K) return null;
    ctx = new K();
    sfx = ctx.createGain();
    sfx.gain.value = A.snd ? SV : 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 5;
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
  A.setSnd = function (v) { A.snd = v; save('foosball.snd', v); if (sfx) sfx.gain.value = v ? SV : 0; };
  A.setBgm = function (v) { A.bgm = v; save('foosball.bgm', v); if (mus) mus.gain.value = v ? MV : 0; };

  function tone(f, t0, dur, type, vol, out, f2) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.3, t0 + 0.004);
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
    g.gain.exponentialRampToValueAtTime(vol, t0 + (attack || 0.002));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(out || sfx);
    s.start(t0, Math.random() * 1.5); s.stop(t0 + dur + 0.05);
  }

  // 플라스틱 인형이 딱딱한 공을 칠 때: 높은 딱 + 짧은 몸통 울림
  let lastHit = 0;
  A.hit = function (v, kick) {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    if (t - lastHit < 0.025) return;
    lastHit = t;
    const vol = Math.min(0.9, 0.12 + v * 0.22);
    noise(t, 0.035, vol, 'bandpass', kick ? 2600 : 1900, 2.5);
    tone(kick ? 1400 : 1100, t, 0.05, 'triangle', vol * 0.5);
    tone(kick ? 320 : 260, t, 0.08, 'sine', vol * 0.6, null, 180);
  };
  A.wall = function (v) {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    const vol = Math.min(0.8, 0.1 + v * 0.2);
    noise(t, 0.07, vol, 'lowpass', 900, 1);
    tone(150, t, 0.1, 'sine', vol * 0.7, null, 90);
  };
  A.post = function (v) {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    const vol = Math.min(0.7, 0.15 + v * 0.2);
    tone(1850, t, 0.35, 'sine', vol * 0.4);
    tone(2470, t, 0.25, 'sine', vol * 0.25);
    noise(t, 0.04, vol, 'highpass', 3000, 1);
  };

  // 함성: 음높이를 흔들지 않는 넓은 잡음(웅성) + 촘촘한 박수. 음높이가 오르내리면 귀신 소리가 된다
  function crowd(t, dur, vol) {
    const s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true;
    hp.type = 'highpass'; hp.frequency.value = 520;
    lp.type = 'lowpass'; lp.frequency.value = 3400;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.07);
    g.gain.setValueAtTime(vol, t + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(sfx);
    s.start(t); s.stop(t + dur + 0.1);
    // 박수: 짧고 딱딱한 소리를 많이
    const n = Math.round(dur * 34);
    for (let i = 0; i < n; i++) {
      const k = Math.random();
      noise(t + 0.02 + k * k * dur * 0.85, 0.016 + Math.random() * 0.012,
        vol * (0.5 + Math.random() * 0.7) * (1 - k * 0.6), 'bandpass', 1100 + Math.random() * 1900, 1.4, null, 0.001);
    }
  }
  // 호루라기: 높은 두 소리가 살짝 떨린다 + 바람 소리
  function whistle(t, dur, vol) {
    const v = vol == null ? 0.16 : vol;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.02);
    g.gain.setValueAtTime(v, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(sfx);
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 26; lg.gain.value = 55;
    lfo.connect(lg);
    lfo.start(t); lfo.stop(t + dur + 0.05);
    for (const [f, a] of [[2750, 1], [3560, 0.5]]) {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f; og.gain.value = a;
      lg.connect(o.frequency);
      o.connect(og); og.connect(g);
      o.start(t); o.stop(t + dur + 0.05);
    }
    noise(t, dur * 0.9, v * 0.25, 'bandpass', 3000, 1.2, g, 0.02);
  }
  // 골 나팔: 낮은 화음이 길게
  function horn(t, dur, vol) {
    [110, 165, 220, 277].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = i < 2 ? 'sawtooth' : 'square';
      o.frequency.setValueAtTime(f * 0.98, t);
      o.frequency.linearRampToValueAtTime(f, t + 0.06);
      const fl = ctx.createBiquadFilter();
      fl.type = 'lowpass'; fl.frequency.value = 1800;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol * (i < 2 ? 1 : 0.5), t + 0.05);
      g.gain.setValueAtTime(vol * (i < 2 ? 1 : 0.5), t + dur * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(fl); fl.connect(g); g.connect(sfx);
      o.start(t); o.stop(t + dur + 0.05);
    });
  }

  // 경기장 에어혼: 톱니파 두 개를 살짝 어긋나게, 처음에 음이 위로 미끄러진다
  function airhorn(t, dur, vol) {
    for (const [f, a] of [[311, 1], [370, 0.7], [466, 0.35]]) {
      const o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f * 0.9, t);
      o.frequency.exponentialRampToValueAtTime(f, t + 0.08);
      fl.type = 'lowpass'; fl.frequency.setValueAtTime(900, t); fl.frequency.exponentialRampToValueAtTime(2600, t + 0.1);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol * a, t + 0.03);
      g.gain.setValueAtTime(vol * a, t + dur * 0.75);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(fl); fl.connect(g); g.connect(sfx);
      o.start(t); o.stop(t + dur + 0.05);
    }
  }
  // 큰북 한 방
  function drum(t, vol) {
    tone(150, t, 0.35, 'sine', vol, null, 40);
    noise(t, 0.08, vol * 0.5, 'lowpass', 500, 1);
  }

  A.play = function (name) {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    switch (name) {
      case 'tap': tone(880, t, 0.06, 'triangle', 0.18); break;
      case 'buy': [784, 988, 1319].forEach((f, i) => tone(f, t + i * 0.06, 0.2, 'triangle', 0.25)); break;
      case 'no': tone(200, t, 0.18, 'square', 0.1, null, 120); break;
      case 'coin': tone(1319, t, 0.08, 'square', 0.08); tone(1760, t + 0.07, 0.18, 'square', 0.08); break;
      case 'whistle': whistle(t, 0.5); break;
      case 'serve':
        // 옆구멍에서 공이 굴러 나오는 드르륵
        for (let i = 0; i < 7; i++) noise(t + i * 0.045, 0.03, 0.18 - i * 0.015, 'bandpass', 1300 + i * 60, 3);
        break;
      case 'goal':
        // 공이 골 주머니에 떨어져 덜그럭 + 곧바로 함성·나팔
        noise(t, 0.12, 0.6, 'lowpass', 700, 1);
        tone(110, t, 0.2, 'sine', 0.6, null, 60);
        for (let i = 1; i < 5; i++) noise(t + 0.06 + i * 0.05, 0.04, 0.3 / i, 'bandpass', 1200, 2);
        // 경기장 에어혼 두 방(빵— 빠앙—) + 큰북 + 함성이 크게 부풀어 오른다 (9/20 바꿈)
        drum(t + 0.02, 0.5);
        airhorn(t + 0.04, 0.45, 0.13);
        airhorn(t + 0.55, 0.9, 0.15);
        crowd(t + 0.03, 2.8, 0.28);
        drum(t + 0.55, 0.4);
        break;
      case 'against':
        // 먹혔을 때: 둔한 소리 + 짧은 탄식
        noise(t, 0.12, 0.5, 'lowpass', 600, 1);
        tone(100, t, 0.2, 'sine', 0.5, null, 55);
        crowd(t + 0.05, 0.9, 0.06);
        tone(330, t + 0.12, 0.14, 'triangle', 0.14);
        tone(247, t + 0.26, 0.3, 'triangle', 0.12);
        break;
      case 'win':
        whistle(t, 0.16); whistle(t + 0.22, 0.16); whistle(t + 0.44, 0.5);
        crowd(t + 0.5, 2.6, 0.2);
        [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, t + 0.6 + i * 0.11, 0.3, 'square', 0.07));
        break;
      case 'lose':
        whistle(t, 0.16); whistle(t + 0.22, 0.16); whistle(t + 0.44, 0.5);
        [392, 349, 311, 262].forEach((f, i) => tone(f, t + 0.6 + i * 0.18, 0.35, 'triangle', 0.14));
        break;
      case 'spin':
        noise(t, 0.5, 0.08, 'bandpass', 500, 4, null, 0.1);
        break;
    }
  };

  // ---------- 배경음: 들뜬 응원가 (128bpm, C G Am F) ----------
  let mTimer = null, step = 0, nextT = 0;
  const BPM = 128, S16 = 60 / BPM / 4;
  const PROG = [[48, 60, 64, 67], [43, 55, 59, 62], [45, 57, 60, 64], [41, 53, 57, 60]];
  const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
  // 16칸 가락 두 줄 (-1 쉼)
  const LEAD = [
    [72, -1, 72, 74, 76, -1, 74, -1, 72, -1, 67, -1, 69, 71, 72, -1],
    [74, -1, 74, 76, 77, -1, 76, -1, 74, -1, 72, -1, 71, -1, 67, -1],
  ];
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
        if (s % 4 === 0) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.11); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16); o.connect(g); g.connect(mus); o.start(t); o.stop(t + 0.2); }
        if (s % 2 === 1) mNoise(t, 0.05, 0.22, 'highpass', 8000);
        // 박수 (2·4박)
        if (s === 4 || s === 12) { mNoise(t, 0.12, 0.5, 'bandpass', 1500); mNoise(t + 0.012, 0.1, 0.35, 'bandpass', 1100); }
        // 통통 튀는 베이스
        if (s % 4 === 0 || s % 4 === 3) mNote(mf(ch[0] - 12), t, S16 * 1.6, 'sawtooth', 0.2, 600);
        if (s % 4 === 2) mNote(mf(ch[0]), t, S16 * 0.8, 'sawtooth', 0.12, 900);
        // 기타 코드 치기
        if (s % 8 === 2 || s % 8 === 6) for (let k = 1; k < 4; k++) mNote(mf(ch[k]), t + k * 0.006, S16 * 1.2, 'square', 0.03, 2600);
        const phrase = Math.floor(step / 64) % 4;
        if (phrase >= 1) {
          const L = LEAD[bar % 2][s];
          if (L > 0) mNote(mf(L + (bar >= 2 ? -3 : 0)), t, S16 * 1.7, 'triangle', 0.085, 3200);
        }
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
