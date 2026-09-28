/* ALL SEEING PIZZA — 소리 (Web Audio 합성, 파일 없음) */
(function () {
  'use strict';
  let ctx = null, master = null, bgmGain = null, bgmOn = true, sfxOn = true, bgmTimer = null;
  try { bgmOn = localStorage.getItem('newworldpizza.bgm') !== '0'; sfxOn = localStorage.getItem('newworldpizza.snd') !== '0'; } catch (_) { }
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = .9; master.connect(ctx.destination);
    bgmGain = ctx.createGain(); bgmGain.gain.value = bgmOn ? .13 : 0; bgmGain.connect(master);
  }
  function tone(f, t, dur, type, vol, dest, slide) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + dur + .02);
  }
  function noise(t, dur, vol, type, freq, dest) {
    const n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ctx.createBufferSource(); s.buffer = b; const g = ctx.createGain(); g.gain.value = vol;
    const f = ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq || 900;
    s.connect(f); f.connect(g); g.connect(dest || master); s.start(t);
  }
  const S = {
    coin() { const t = ctx.currentTime; tone(1568, t, .08, 'square', .09); tone(2093, t + .06, .16, 'square', .08); },
    coins() { const t = ctx.currentTime; for (let i = 0; i < 7; i++) tone(1400 + Math.random() * 900, t + i * .045, .09, 'square', .07); },
    honk() { const t = ctx.currentTime; tone(392, t, .16, 'sawtooth', .06); tone(494, t, .16, 'sawtooth', .05); tone(392, t + .2, .22, 'sawtooth', .06); tone(494, t + .2, .22, 'sawtooth', .05); },
    ding() { const t = ctx.currentTime; tone(1760, t, .5, 'sine', .14); tone(2637, t + .01, .7, 'sine', .07); },
    order() { const t = ctx.currentTime; tone(880, t, .08, 'triangle', .1); tone(1320, t + .07, .12, 'triangle', .1); },
    fire() { const t = ctx.currentTime; noise(t, .22, .22, 'bandpass', 700); tone(160, t, .15, 'sine', .08, null, 90); },
    shutter() { const t = ctx.currentTime; noise(t, .04, .35, 'highpass', 3000); noise(t + .07, .05, .3, 'highpass', 2500); },
    shoo() { const t = ctx.currentTime; tone(500, t, .16, 'square', .08, null, 1400); noise(t, .12, .12, 'highpass', 2000); },
    tap() { const t = ctx.currentTime; tone(700, t, .05, 'square', .05, null, 1000); },
    pop() { const t = ctx.currentTime; tone(500, t, .08, 'sine', .12, null, 900); },
    buy() { const t = ctx.currentTime; tone(660, t, .1, 'square', .09); tone(880, t + .1, .1, 'square', .09); tone(1320, t + .2, .3, 'square', .1); },
    no() { const t = ctx.currentTime; tone(300, t, .12, 'square', .08, null, 200); },
    leave() { const t = ctx.currentTime; tone(600, t, .14, 'sine', .07, null, 380); },
    fanfare() { const t = ctx.currentTime; [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, t + i * .09, .3, 'square', .09)); tone(1318, t + .56, .7, 'triangle', .1); },
    cheer() { const t = ctx.currentTime; tone(1046 + Math.random() * 300, t, .08, 'triangle', .09, null, 1568); },
    lvup() { const t = ctx.currentTime; [659, 784, 988, 1318].forEach((f, i) => tone(f, t + i * .06, .25, 'triangle', .1)); },
    bigtip() { const t = ctx.currentTime; for (let i = 0; i < 12; i++) tone(1500 + Math.random() * 1400, t + i * .035, .12, 'square', .06); tone(2093, t + .45, .5, 'triangle', .1); },
    whistle() { const t = ctx.currentTime; tone(900, t, .5, 'sine', .035, null, 2200); },
    boom() { const t = ctx.currentTime; noise(t, .5, .5, 'lowpass', 500); noise(t + .05, .7, .18, 'highpass', 3500); tone(90, t, .3, 'sine', .25, null, 40); },
    ending() { const t = ctx.currentTime; [440, 554, 659, 880, 659, 880, 1108, 1318, 1760].forEach((f, i) => tone(f, t + i * .15, .7, 'square', .09)); },
  };
  // 배경 음악 — 밝은 피자집 디스코 (112bpm, C장조 F–G–Em–Am). 볼링 디스코 틀(사장님 호평)을 밝게 바꿈. 9/28 "배경음악 다시 만들어봐"
  const BPM = 112, S16 = 60 / BPM / 4;
  const PROG = [[41, 53, 57, 60], [43, 55, 59, 62], [40, 52, 55, 59], [45, 57, 60, 64]];
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  const LA = [[72,-1,72,74,76,-1,77,-1,76,-1,74,-1,72,-1,-1,-1],[74,-1,74,76,77,-1,79,-1,77,-1,76,-1,74,-1,-1,-1],[76,-1,79,-1,83,-1,81,79,76,-1,74,-1,76,-1,-1,-1],[81,-1,79,-1,77,-1,76,-1,74,-1,72,-1,71,-1,72,-1]];
  const LB = [[69,-1,-1,72,-1,-1,74,-1,72,-1,69,-1,67,-1,-1,-1],[71,-1,-1,74,-1,-1,76,-1,74,-1,71,-1,67,-1,-1,-1],[67,-1,71,-1,74,-1,76,-1,79,-1,76,-1,74,-1,-1,-1],[72,-1,-1,-1,71,-1,-1,-1,69,-1,-1,-1,-1,-1,-1,-1]];
  const PLAN = [LA, LB, LA, null];                  // 4마디씩: 부름 → 대답 → 부름 → 쉬어 가기(멜로디 없이)
  let step = 0, nextT = 0, nb = null;
  function mNote(f, t, dur, type, vol, cut) {
    const o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    o.type = type; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = cut || 1800;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(fl); fl.connect(g); g.connect(bgmGain); o.start(t); o.stop(t + dur + .05);
  }
  function mNoise(t, dur, vol, type, f) {
    if (!nb) { nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = nb.getChannelData(0); for (let k = 0; k < d.length; k++) d[k] = Math.random() * 2 - 1; }
    const sr = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    sr.buffer = nb; fl.type = type; fl.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    sr.connect(fl); fl.connect(g); g.connect(bgmGain); sr.start(t, Math.random() * .5); sr.stop(t + dur + .02);
  }
  function kick(t) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + .12); g.gain.setValueAtTime(.8, t); g.gain.exponentialRampToValueAtTime(.0001, t + .18); o.connect(g); g.connect(bgmGain); o.start(t); o.stop(t + .2); }
  function tickMusic() {
    if (!ctx || !bgmOn) return;
    while (nextT < ctx.currentTime + .2) {
      const t = nextT, s = step % 16, bar = Math.floor(step / 16) % 4, ch = PROG[bar], sect = PLAN[Math.floor(step / 64) % 4];
      if (s % 4 === 0) kick(t);
      if (s % 4 === 2) mNoise(t, .07, .28, 'highpass', 7500);
      if (s === 4 || s === 12) mNoise(t, .14, .38, 'bandpass', 1900);
      mNote(mf(ch[0] - 12 + (s % 2 ? 12 : 0)), t, S16 * .9, 'sawtooth', .2, 650);          // 옥타브 뛰는 베이스
      if (s % 8 === 2 || s % 8 === 6) for (let k = 1; k < 4; k++) mNote(mf(ch[k] + 12), t, S16 * 1.2, 'square', .028, 2600);   // 뒷박 코드
      if (sect) { const n = sect[bar][s]; if (n > 0) { mNote(mf(n), t, S16 * 1.9, 'triangle', .085, 3200); mNote(mf(n), t + S16 * .5, S16 * 1.2, 'square', .018, 2400); } }   // 멜로디 + 만돌린처럼 한 번 더 튕김
      else if (s === 14 && bar === 3) mNoise(t, .25, .3, 'highpass', 3000);                  // 쉬어 가기 끝 — 다시 들어가는 신호
      nextT += S16; step++;
    }
  }
  function bgmLoop() { if (!ctx || bgmTimer) return; nextT = ctx.currentTime + .1; bgmTimer = setInterval(tickMusic, 50); }
  window.SND = {
    init() { ensure(); if (!ctx) return; if (!bgmTimer) bgmLoop(); },
    play(n) { if (!ctx || !sfxOn || !S[n]) return; S[n](); },
    get bgm() { return bgmOn; }, get sfx() { return sfxOn; },
    snd(v) { sfxOn = !!v; bgmOn = !!v; try { localStorage.setItem('newworldpizza.bgm', v ? '1' : '0'); localStorage.setItem('newworldpizza.snd', v ? '1' : '0'); } catch (_) { } if (bgmGain) bgmGain.gain.value = v ? .13 : 0; if (!v && bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; } },
    toggleBgm() { bgmOn = !bgmOn; try { localStorage.setItem('newworldpizza.bgm', bgmOn ? '1' : '0'); } catch (_) { } if (bgmGain) bgmGain.gain.setTargetAtTime(bgmOn ? .13 : 0, ctx.currentTime, .1); if (bgmOn && ctx && !bgmTimer) bgmLoop(); if (!bgmOn && bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; } return bgmOn; },
    toggleSfx() { sfxOn = !sfxOn; try { localStorage.setItem('newworldpizza.snd', sfxOn ? '1' : '0'); } catch (_) { } return sfxOn; },
  };
})();
