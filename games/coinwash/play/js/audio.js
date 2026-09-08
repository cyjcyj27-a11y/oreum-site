/* 코인빨래방 — 소리 (Web Audio 합성, 파일 없음) */
(function () {
  'use strict';
  let ctx = null, master = null, bgmGain = null, bgmOn = true, sfxOn = true, bgmTimer = null, hum = null;
  try { bgmOn = localStorage.getItem('coinwash.bgm') !== '0'; sfxOn = localStorage.getItem('coinwash.snd') !== '0'; } catch (_) { }
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = .9; master.connect(ctx.destination);
    bgmGain = ctx.createGain(); bgmGain.gain.value = bgmOn ? .16 : 0; bgmGain.connect(master);
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
    coin() { const t = ctx.currentTime; tone(1568, t, .08, 'square', .12); tone(2093, t + .06, .16, 'square', .1); },
    coins() { const t = ctx.currentTime; for (let i = 0; i < 5; i++) tone(1400 + Math.random() * 900, t + i * .05, .09, 'square', .08); },
    bell() { const t = ctx.currentTime; tone(1318, t, .35, 'sine', .18); tone(1760, t + .18, .5, 'sine', .14); },
    beep() { const t = ctx.currentTime; tone(1046, t, .12, 'square', .09); tone(1046, t + .2, .12, 'square', .09); tone(1318, t + .4, .25, 'square', .09); },
    spark() { const t = ctx.currentTime; noise(t, .18, .25, 2500); tone(180, t, .12, 'sawtooth', .12, null, 60); },
    fix() { const t = ctx.currentTime; for (let i = 0; i < 3; i++) { noise(t + i * .16, .06, .2, 1800); tone(700 + i * 200, t + i * .16, .06, 'square', .06); } },
    fixed() { const t = ctx.currentTime; tone(660, t, .1, 'square', .1); tone(880, t + .1, .1, 'square', .1); tone(1320, t + .2, .3, 'square', .12); },
    fold() { const t = ctx.currentTime; noise(t, .12, .15, 600); tone(520, t, .1, 'triangle', .08, null, 900); },
    grab() { const t = ctx.currentTime; noise(t, .09, .12, 400); },
    nice() { const t = ctx.currentTime; [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * .07, .18, 'square', .1)); },
    angry() { const t = ctx.currentTime; tone(220, t, .25, 'sawtooth', .14, null, 140); tone(180, t + .22, .35, 'sawtooth', .14, null, 90); },
    hic() { const t = ctx.currentTime; tone(600, t, .07, 'square', .1, null, 900); tone(500, t + .12, .06, 'square', .08, null, 750); },
    laugh() { const t = ctx.currentTime; for (let i = 0; i < 4; i++) tone(330 - i * 20, t + i * .11, .09, 'square', .09, null, 260 - i * 20); },
    kick() { const t = ctx.currentTime; tone(120, t, .2, 'sine', .3, null, 40); noise(t, .12, .3, 500); },
    shoo() { const t = ctx.currentTime; tone(400, t, .08, 'square', .1, null, 800); tone(500, t + .09, .08, 'square', .1, null, 1000); },
    heart() { const t = ctx.currentTime; tone(392, t, .25, 'triangle', .16, null, 196); tone(262, t + .25, .5, 'triangle', .16, null, 131); },
    clear() { const t = ctx.currentTime; [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, t + i * .12, .4, 'square', .11)); },
    over() { const t = ctx.currentTime; [440, 415, 392, 330].forEach((f, i) => tone(f, t + i * .3, .45, 'sawtooth', .1)); },
    door() { const t = ctx.currentTime; tone(880, t, .12, 'sine', .12); tone(1108, t + .1, .3, 'sine', .1); },
  };
  // 배경 음악 — 잔잔한 새벽 루프 (짧은 코드 진행)
  const PROG = [[262, 330, 392], [220, 262, 330], [175, 220, 262], [196, 247, 294]];
  function bgmLoop() {
    if (!ctx || !bgmOn) return;
    const t = ctx.currentTime; let step = 0;
    PROG.forEach((ch, i) => {
      const b = t + i * 1.6;
      ch.forEach(f => tone(f, b, 1.5, 'triangle', .07, bgmGain));
      for (let k = 0; k < 4; k++) tone(ch[(k * 2) % 3] * 2, b + k * .4, .18, 'square', .03, bgmGain);
    });
    bgmTimer = setTimeout(bgmLoop, 6400);
  }
  function humStart() {
    if (!ctx || hum) return; hum = ctx.createOscillator(); const g = ctx.createGain(); g.gain.value = 0; hum.type = 'sawtooth'; hum.frequency.value = 55;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 160; hum.connect(f); f.connect(g); g.connect(master); hum.start(); hum.g = g;
  }
  window.SND = {
    init() { ensure(); if (!ctx) return; if (!bgmTimer) bgmLoop(); humStart(); },
    play(n) { if (!ctx || !sfxOn || !S[n]) return; S[n](); },
    hum(v) { if (hum) hum.g.gain.setTargetAtTime(sfxOn ? Math.min(.12, v * .04) : 0, ctx.currentTime, .3); },
    get bgm() { return bgmOn; }, get sfx() { return sfxOn; },
    toggleBgm() { bgmOn = !bgmOn; try { localStorage.setItem('coinwash.bgm', bgmOn ? '1' : '0'); } catch (_) { } if (bgmGain) bgmGain.gain.setTargetAtTime(bgmOn ? .16 : 0, ctx.currentTime, .1); if (bgmOn && ctx && !bgmTimer) bgmLoop(); return bgmOn; },
    toggleSfx() { sfxOn = !sfxOn; try { localStorage.setItem('coinwash.snd', sfxOn ? '1' : '0'); } catch (_) { } return sfxOn; },
  };
})();
