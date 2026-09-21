// 두뇌풀가동 — 소리는 전부 코드(WebAudio). 효과음 + 가벼운 배경음 루프
(function () {
  'use strict';
  const K = 'fullbrain.';
  const A = {
    snd: localStorage.getItem(K + 'snd') !== '0',
    bgm: localStorage.getItem(K + 'bgm') !== '0',
  };
  let ctx = null, master = null, sfxBus = null, bgmBus = null;

  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
      master = ctx.createGain(); master.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = A.snd ? 0.8 : 0; sfxBus.connect(master);
      bgmBus = ctx.createGain(); bgmBus.gain.value = A.bgm ? 0.13 : 0; bgmBus.connect(master);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function unlock() {
    const c = ac(); if (!c) return;
    const s = c.createBufferSource(); s.buffer = c.createBuffer(1, 1, 22050); s.connect(c.destination); s.start(0);
  }

  // ---- 효과음 조각
  function tone(f, t0, dur, type, vol, slide) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.5, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(sfxBus); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(t0, dur, vol, hp) {
    const c = ac(); if (!c) return;
    const n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(); s.buffer = b;
    const f = c.createBiquadFilter(); f.type = hp ? 'highpass' : 'lowpass'; f.frequency.value = hp || 900;
    const g = c.createGain(); g.gain.value = vol || 0.3;
    s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t0);
  }

  const SFX = {
    tap()   { const c = ac(); if (!c) return; const t = c.currentTime; tone(520, t, 0.05, 'square', 0.12); noise(t, 0.04, 0.12, 2500); },
    ok(combo) {                                    // 정답 — 콤보가 오르면 한 음 더 높이
      const c = ac(); if (!c) return; const t = c.currentTime, k = Math.min(6, combo || 0);
      tone(660 * Math.pow(1.06, k), t, 0.12, 'triangle', 0.4);
      tone(990 * Math.pow(1.06, k), t + 0.08, 0.18, 'triangle', 0.35);
    },
    great() { const c = ac(); if (!c) return; const t = c.currentTime; [660, 830, 990, 1320].forEach((f, i) => tone(f, t + i * 0.07, 0.22, 'triangle', 0.35)); },
    miss()  { const c = ac(); if (!c) return; const t = c.currentTime; tone(220, t, 0.28, 'sawtooth', 0.3, 110); tone(160, t + 0.02, 0.3, 'square', 0.15, 80); noise(t, 0.12, 0.2); },
    tick()  { const c = ac(); if (!c) return; const t = c.currentTime; tone(1500, t, 0.03, 'square', 0.08); },
    timeup(){ const c = ac(); if (!c) return; const t = c.currentTime; tone(880, t, 0.1, 'square', 0.25); tone(440, t + 0.12, 0.35, 'square', 0.25, 200); },
    full()  {                                      // 풀가동 — 위로 솟는 휘파람 + 반짝
      const c = ac(); if (!c) return; const t = c.currentTime;
      tone(300, t, 0.45, 'sawtooth', 0.25, 1400); noise(t, 0.4, 0.15, 1800);
      [1320, 1760, 2200].forEach((f, i) => tone(f, t + 0.3 + i * 0.06, 0.25, 'sine', 0.25));
    },
    clear() { const c = ac(); if (!c) return; const t = c.currentTime; [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, t + i * 0.11, 0.3, 'triangle', 0.4)); },
    over()  { const c = ac(); if (!c) return; const t = c.currentTime; [392, 349, 311, 262].forEach((f, i) => tone(f, t + i * 0.22, 0.4, 'triangle', 0.4)); },
    ending(){ const c = ac(); if (!c) return; const t = c.currentTime; [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => { tone(f, t + i * 0.13, 0.5, 'triangle', 0.4); tone(f / 2, t + i * 0.13, 0.5, 'sine', 0.25); }); },
    heart() { const c = ac(); if (!c) return; const t = c.currentTime; tone(300, t, 0.2, 'sine', 0.35, 120); noise(t, 0.15, 0.25); },
  };

  // ---- 배경음: 두 옥타브 아르페지오 + 낮은 베이스, 16분음표 루프(코드로 생성)
  let bgmOn = false, bgmTimer = null, step = 0, tempo = 1;
  const CH = [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9, 12], [7, 11, 14, 17]];     // Cmaj7 F  Dm G
  const midi = m => 440 * Math.pow(2, (m - 69) / 12);
  function bgmStep() {
    const c = ac(); if (!c || !bgmOn) return;
    const t = c.currentTime + 0.05, chord = CH[Math.floor(step / 16) % CH.length], i = step % 16;
    const n = 60 + chord[[0, 1, 2, 3, 2, 1, 2, 3][i % 8]] + (i >= 8 ? 12 : 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle'; o.frequency.value = midi(n);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g); g.connect(bgmBus); o.start(t); o.stop(t + 0.2);
    if (i % 8 === 0) {
      const b = c.createOscillator(), bg = c.createGain();
      b.type = 'sine'; b.frequency.value = midi(36 + chord[0]);
      bg.gain.setValueAtTime(0.0001, t); bg.gain.exponentialRampToValueAtTime(0.7, t + 0.02); bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      b.connect(bg); bg.connect(bgmBus); b.start(t); b.stop(t + 1);
    }
    step++;
    bgmTimer = setTimeout(bgmStep, 125 / tempo);
  }
  function bgmStart() { if (bgmOn) return; bgmOn = true; step = 0; bgmStep(); }
  function bgmStop() { bgmOn = false; clearTimeout(bgmTimer); }
  function setTempo(x) { tempo = x; }

  function setSnd(on) { A.snd = on; localStorage.setItem(K + 'snd', on ? '1' : '0'); if (sfxBus) sfxBus.gain.value = on ? 0.8 : 0; }
  function setBgm(on) { A.bgm = on; localStorage.setItem(K + 'bgm', on ? '1' : '0'); if (bgmBus) bgmBus.gain.value = on ? 0.13 : 0; }

  window.FBAudio = { A, unlock, sfx: SFX, bgmStart, bgmStop, setTempo, setSnd, setBgm,
    get snd() { return A.snd; }, set snd(v) { setSnd(!!v); }, get bgm() { return A.bgm; }, set bgm(v) { setBgm(!!v); } };
})();
