/* 모에모에 메이드카페 — 소리 (Web Audio 합성, 파일 없음) */
(function () {
  'use strict';
  let ctx = null, master = null, bgmGain = null, bgmOn = true, sfxOn = true, bgmTimer = null;
  try { bgmOn = localStorage.getItem('maidcafe.bgm') !== '0'; sfxOn = localStorage.getItem('maidcafe.snd') !== '0'; } catch (_) { }
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
  function noise(t, dur, vol, hp) {
    const n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ctx.createBufferSource(); s.buffer = b; const g = ctx.createGain(); g.gain.value = vol;
    const f = ctx.createBiquadFilter(); f.type = hp ? 'highpass' : 'lowpass'; f.frequency.value = hp || 900;
    s.connect(f); f.connect(g); g.connect(master); s.start(t);
  }
  const S = {
    coin() { const t = ctx.currentTime; tone(1568, t, .08, 'square', .1); tone(2093, t + .06, .16, 'square', .09); },
    coins() { const t = ctx.currentTime; for (let i = 0; i < 6; i++) tone(1400 + Math.random() * 900, t + i * .045, .09, 'square', .07); },
    bell() { const t = ctx.currentTime; tone(1760, t, .3, 'sine', .14); tone(2217, t + .12, .45, 'sine', .11); tone(1760, t + .3, .5, 'sine', .07); },
    kyun() { const t = ctx.currentTime; [1046, 1318, 1568, 2093].forEach((f, i) => tone(f, t + i * .06, .35, 'triangle', .12)); tone(2637, t + .26, .6, 'sine', .08); },
    heart() { const t = ctx.currentTime; tone(880, t, .12, 'sine', .1, null, 1320); tone(1320, t + .1, .25, 'sine', .08); },
    serve() { const t = ctx.currentTime; noise(t, .08, .15, 3000); tone(2400, t, .1, 'sine', .07); },
    tap() { const t = ctx.currentTime; tone(700, t, .06, 'square', .06, null, 1000); },
    pop() { const t = ctx.currentTime; tone(500, t, .08, 'sine', .12, null, 900); },
    nice() { const t = ctx.currentTime; [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * .07, .18, 'square', .09)); },
    buy() { const t = ctx.currentTime; tone(660, t, .1, 'square', .09); tone(880, t + .1, .1, 'square', .09); tone(1320, t + .2, .3, 'square', .1); },
    no() { const t = ctx.currentTime; tone(300, t, .12, 'square', .08, null, 200); },
    rank() { const t = ctx.currentTime; [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => tone(f, t + i * .1, .5, 'square', .1)); tone(2093, t + .6, 1, 'triangle', .1); },
    gacha() { const t = ctx.currentTime; for (let i = 0; i < 12; i++) tone(600 + i * 120, t + i * .05, .12, 'triangle', .07); },
    reveal() { const t = ctx.currentTime; [784, 1046, 1318].forEach((f, i) => tone(f, t + i * .08, .4, 'square', .1)); tone(1568, t + .25, .8, 'triangle', .12); },
    ssr() { const t = ctx.currentTime; [523, 659, 784, 1046, 784, 1046, 1318, 1568, 2093].forEach((f, i) => tone(f, t + i * .09, .5, 'square', .1)); for (let i = 0; i < 8; i++) tone(2000 + Math.random() * 1500, t + .8 + i * .07, .3, 'sine', .05); },
    lvup() { const t = ctx.currentTime; [659, 784, 988, 1318].forEach((f, i) => tone(f, t + i * .07, .3, 'triangle', .1)); },
    mission() { const t = ctx.currentTime; [1046, 1318, 1568, 2093].forEach((f, i) => tone(f, t + i * .1, .4, 'square', .09)); },
    leave() { const t = ctx.currentTime; tone(600, t, .12, 'sine', .07, null, 400); },
    stamp() { const t = ctx.currentTime; noise(t, .1, .3, 600); tone(200, t, .12, 'sine', .2, null, 80); },
    ending() { const t = ctx.currentTime; [523, 659, 784, 1046, 1318, 1046, 1318, 1568, 2093].forEach((f, i) => tone(f, t + i * .14, .7, 'square', .1)); },
  };
  // 배경 음악 — 귀여운 8마디 루프 (C–G–Am–F, 120bpm)
  const BEAT = .25; // 8분음표
  const MEL = [ // [음(Hz), 길이(8분음표)] 0 은 쉼표
    [1046, 1], [1318, 1], [1568, 2], [1318, 1], [1046, 1], [1175, 2],
    [988, 1], [1175, 1], [1480, 2], [1175, 1], [988, 1], [1046, 2],
    [880, 1], [1046, 1], [1318, 2], [1046, 1], [880, 1], [1175, 2],
    [698, 1], [880, 1], [1046, 2], [1175, 1], [1318, 1], [1568, 2],
  ];
  const CH = [[262, 330, 392], [196, 247, 294], [220, 262, 330], [175, 220, 262]];
  function bgmLoop() {
    if (!ctx || !bgmOn) return;
    const t = ctx.currentTime; let p = 0;
    MEL.forEach(n => { if (n[0]) tone(n[0], t + p * BEAT, n[1] * BEAT * .85, 'square', .045, bgmGain); p += n[1]; });
    CH.forEach((ch, i) => { const b = t + i * 8 * BEAT; ch.forEach(f => tone(f, b, 8 * BEAT * .95, 'triangle', .05, bgmGain)); for (let k = 0; k < 8; k++) tone(ch[0] / 2, b + k * BEAT, BEAT * .5, 'triangle', k & 1 ? .04 : .07, bgmGain); for (let k = 0; k < 4; k++) tone(ch[(k + 1) % 3] * 2, b + (k * 2 + 1) * BEAT, BEAT * .4, 'sine', .035, bgmGain); });
    bgmTimer = setTimeout(bgmLoop, 32 * BEAT * 1000 - 20);
  }
  window.SND = {
    init() { ensure(); if (!ctx) return; if (!bgmTimer) bgmLoop(); },
    play(n) { if (!ctx || !sfxOn || !S[n]) return; S[n](); },
    get bgm() { return bgmOn; }, get sfx() { return sfxOn; },
    toggleBgm() { bgmOn = !bgmOn; try { localStorage.setItem('maidcafe.bgm', bgmOn ? '1' : '0'); } catch (_) { } if (bgmGain) bgmGain.gain.setTargetAtTime(bgmOn ? .14 : 0, ctx.currentTime, .1); if (bgmOn && ctx && !bgmTimer) bgmLoop(); if (!bgmOn && bgmTimer) { clearTimeout(bgmTimer); bgmTimer = null; } return bgmOn; },
    toggleSfx() { sfxOn = !sfxOn; try { localStorage.setItem('maidcafe.snd', sfxOn ? '1' : '0'); } catch (_) { } return sfxOn; },
  };
})();
