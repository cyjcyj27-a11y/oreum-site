/* 팜온마즈 — 소리 (Web Audio 합성, 파일 없음) */
(function () {
  'use strict';
  let ctx = null, master = null, bgmGain = null, bgmOn = true, sfxOn = true, bgmTimer = null, wind = null;
  try { bgmOn = localStorage.getItem('farmonmars.bgm') !== '0'; sfxOn = localStorage.getItem('farmonmars.snd') !== '0'; } catch (_) { }
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = .9; master.connect(ctx.destination);
    bgmGain = ctx.createGain(); bgmGain.gain.value = bgmOn ? .14 : 0; bgmGain.connect(master);
  }
  function tone(f, t, dur, type, vol, dest, slide) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + dur + .02);
  }
  function noise(t, dur, vol, hp, lp) {
    const n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ctx.createBufferSource(); s.buffer = b; const g = ctx.createGain(); g.gain.value = vol;
    const f = ctx.createBiquadFilter(); f.type = hp ? 'highpass' : 'lowpass'; f.frequency.value = hp || lp || 900;
    s.connect(f); f.connect(g); g.connect(master); s.start(t);
  }
  const S = {
    pop() { const t = ctx.currentTime; tone(880, t, .09, 'square', .1, null, 1400); },
    pops() { const t = ctx.currentTime; for (let i = 0; i < 4; i++) tone(900 + i * 160, t + i * .05, .09, 'square', .09, null, 1500 + i * 200); },
    plant() { const t = ctx.currentTime; noise(t, .1, .12, 0, 500); tone(300, t, .08, 'triangle', .07, null, 180); },
    nice() { const t = ctx.currentTime; [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * .07, .18, 'square', .1)); },
    bell() { const t = ctx.currentTime; tone(1318, t, .35, 'sine', .18); tone(1760, t + .18, .5, 'sine', .14); },
    launch() { const t = ctx.currentTime; noise(t, 1.6, .5, 0, 400); tone(60, t, 1.6, 'sawtooth', .18, null, 220); },
    land() { const t = ctx.currentTime; noise(t, .8, .35, 0, 500); tone(150, t + .7, .2, 'sine', .25, null, 40); },
    crates() { const t = ctx.currentTime; for (let i = 0; i < 6; i++) { noise(t + i * .07, .05, .16, 0, 700); tone(1200 + Math.random() * 800, t + i * .07, .08, 'square', .07); } },
    hammer() { const t = ctx.currentTime; noise(t, .05, .22, 2200); tone(520, t, .06, 'square', .07, null, 300); },
    done() { const t = ctx.currentTime; tone(660, t, .1, 'square', .1); tone(880, t + .1, .1, 'square', .1); tone(1320, t + .2, .3, 'square', .12); },
    clear() { const t = ctx.currentTime; [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, t + i * .12, .4, 'square', .11)); },
    water() { const t = ctx.currentTime; for (let i = 0; i < 5; i++) tone(500 + Math.random() * 500, t + i * .08, .12, 'sine', .08, null, 900 + i * 100); noise(t, .6, .12, 0, 600); },
    ice() { const t = ctx.currentTime; [1568, 2093, 2637, 3136].forEach((f, i) => tone(f, t + i * .06, .3, 'sine', .09)); },
    squeak() { const t = ctx.currentTime; tone(1400, t, .08, 'square', .08, null, 2200); tone(1600, t + .1, .08, 'square', .08, null, 2400); },
    munch() { const t = ctx.currentTime; noise(t, .06, .14, 0, 900); noise(t + .12, .06, .12, 0, 900); },
    shoo() { const t = ctx.currentTime; tone(400, t, .08, 'square', .1, null, 800); tone(500, t + .09, .08, 'square', .1, null, 1000); tone(1800, t + .2, .12, 'square', .07, null, 3000); },
    eaten() { const t = ctx.currentTime; tone(330, t, .2, 'sawtooth', .1, null, 200); tone(260, t + .2, .3, 'sawtooth', .1, null, 150); },
    zap() { const t = ctx.currentTime; noise(t, .12, .2, 3000); tone(2000, t, .12, 'sawtooth', .08, null, 300); },
    brush() { const t = ctx.currentTime; noise(t, .1, .15, 1500); noise(t + .12, .1, .15, 1500); },
    warn() { const t = ctx.currentTime; tone(440, t, .25, 'square', .09); tone(440, t + .35, .25, 'square', .09); },
    sol() { const t = ctx.currentTime; tone(523, t, .3, 'sine', .14); tone(659, t + .2, .3, 'sine', .12); tone(784, t + .4, .6, 'sine', .12); },
    boom() { const t = ctx.currentTime; noise(t, .5, .3, 0, 300); tone(90, t, .4, 'sine', .25, null, 30); },
    fire() { const t = ctx.currentTime; noise(t, .25, .2, 0, 1500); tone(1500 + Math.random() * 800, t, .3, 'sine', .06, null, 300); },
    click() { const t = ctx.currentTime; tone(1000, t, .05, 'square', .06); },
  };
  // 배경 음악 — 넓고 잔잔한 화성 루프
  const PROG = [[196, 247, 294, 392], [175, 220, 262, 349], [165, 208, 247, 330], [147, 175, 220, 294]];
  function bgmLoop() {
    if (!ctx || !bgmOn) return;
    const t = ctx.currentTime;
    PROG.forEach((ch, i) => {
      const b = t + i * 2.4;
      ch.forEach(f => tone(f, b, 2.3, 'triangle', .06, bgmGain));
      for (let k = 0; k < 3; k++) tone(ch[(k + i) % 4] * 2, b + .4 + k * .7, .5, 'sine', .04, bgmGain);
    });
    bgmTimer = setTimeout(bgmLoop, 9600);
  }
  function windStart() {
    if (!ctx || wind) return;
    const n = ctx.sampleRate * 2, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    wind = ctx.createBufferSource(); wind.buffer = b; wind.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 300; f.Q.value = .6;
    const g = ctx.createGain(); g.gain.value = 0; wind.connect(f); f.connect(g); g.connect(master); wind.start(); wind.g = g;
  }
  window.SND = {
    init() { ensure(); if (!ctx) return; if (!bgmTimer) bgmLoop(); windStart(); },
    play(n) { if (!ctx || !sfxOn || !S[n]) return; S[n](); },
    wind(v) { if (wind) wind.g.gain.setTargetAtTime(sfxOn ? Math.min(.35, v) : 0, ctx.currentTime, .4); },
    get bgm() { return bgmOn; }, get sfx() { return sfxOn; },
    toggleBgm() { bgmOn = !bgmOn; try { localStorage.setItem('farmonmars.bgm', bgmOn ? '1' : '0'); } catch (_) { } if (bgmGain) bgmGain.gain.setTargetAtTime(bgmOn ? .14 : 0, ctx.currentTime, .1); if (bgmOn && ctx && !bgmTimer) bgmLoop(); return bgmOn; },
    toggleSfx() { sfxOn = !sfxOn; try { localStorage.setItem('farmonmars.snd', sfxOn ? '1' : '0'); } catch (_) { } return sfxOn; },
  };
})();
