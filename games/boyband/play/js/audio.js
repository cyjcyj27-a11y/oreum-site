/* 보이밴드 만들기 — 소리. 파일 없이 WebAudio 로 만든다. 효과음(boyband.snd)·음악(boyband.bgm) 따로 저장 */
(function () {
  'use strict';
  let ctx = null, master = null, sfxGain = null, bgmGain = null;
  let snd = true, bgm = true, bgmOn = false;
  try { snd = localStorage.getItem('boyband.snd') !== '0'; bgm = localStorage.getItem('boyband.bgm') !== '0'; } catch (e) { }

  function ac() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = .8; master.connect(ctx.destination);
    sfxGain = ctx.createGain(); sfxGain.gain.value = snd ? 1 : 0; sfxGain.connect(master);
    bgmGain = ctx.createGain(); bgmGain.gain.value = bgm ? .55 : 0; bgmGain.connect(master);
    return ctx;
  }
  function tone(f, t0, dur, type, vol, dest, slide) {
    const c = ac(), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + .008);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.connect(g); g.connect(dest || sfxGain); o.start(t0); o.stop(t0 + dur + .02);
  }
  function noise(t0, dur, vol, hp, dest) {
    const c = ac(), n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(); s.buffer = b;
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 2000;
    const g = c.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(dest || sfxGain); s.start(t0);
  }

  const SFX = {
    click() { const t = ac().currentTime; tone(880, t, .05, 'square', .06); },
    pick() { const t = ac().currentTime; tone(660, t, .08, 'triangle', .15); tone(990, t + .07, .12, 'triangle', .15); },
    unpick() { const t = ac().currentTime; tone(660, t, .1, 'triangle', .12, null, 330); },
    coin() { const t = ac().currentTime; tone(1320, t, .07, 'square', .12); tone(1760, t + .07, .16, 'square', .12); },
    week() { const t = ac().currentTime; noise(t, .25, .25, 900); tone(220, t, .3, 'sawtooth', .08, null, 110); },
    up() { const t = ac().currentTime; tone(523, t, .09, 'triangle', .14); tone(659, t + .08, .09, 'triangle', .14); tone(784, t + .16, .18, 'triangle', .14); },
    great() { const t = ac().currentTime; [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * .07, .22, 'triangle', .16)); noise(t + .28, .3, .18, 3000); },
    bad() { const t = ac().currentTime; tone(330, t, .25, 'sawtooth', .12, null, 165); tone(247, t + .2, .35, 'sawtooth', .1, null, 120); },
    out() { const t = ac().currentTime; tone(392, t, .3, 'sine', .16, null, 196); tone(294, t + .3, .5, 'sine', .14, null, 147); },
    event() { const t = ac().currentTime; tone(440, t, .12, 'square', .08); tone(440, t + .16, .12, 'square', .08); },
    fanfare() {
      const t = ac().currentTime;
      [[523, 0], [659, .12], [784, .24], [1047, .36], [784, .5], [1047, .62], [1319, .8]].forEach(([f, d]) => tone(f, t + d, .35, 'triangle', .18));
      [0, .12, .24, .36, .62, .8].forEach(d => noise(t + d, .2, .12, 4000));
    },
    cheer() { const t = ac().currentTime; for (let i = 0; i < 6; i++) noise(t + i * .05, .9, .12, 700 + i * 200); },
    blip(p) { const t = ac().currentTime; tone(300 * (p || 1), t, .045, 'square', .045, null, 240 * (p || 1)); },
    pop() { const t = ac().currentTime; tone(600, t, .08, 'sine', .12, null, 900); },
    heart() { const t = ac().currentTime; tone(880, t, .1, 'sine', .12); tone(1175, t + .1, .2, 'sine', .12); },
    rain() { const t = ac().currentTime; noise(t, 1.4, .1, 500); tone(196, t, 1.2, 'sine', .08, null, 98); },
  };

  /* 음악은 사장님 곡뿐. 합성 배경음은 뺐다(2026-09-07 밤 지시) */
  const BPM = 118;
  /* 사장님 곡 — assets/song.mp3 ('금붕어가 알을 낳았어요'). 못 읽으면 위의 합성음으로 */
  let song = null, ending = null;
  function getSong() {
    if (song) return song;
    song = new Audio('assets/inst.mp3'); song.loop = true; song.preload = 'auto'; song.volume = bgm ? .7 : 0;   // 보컬 뺀 반주
    return song;
  }
  /* 엔딩 — 원곡(보컬 포함) 처음부터 */
  function playEnding() {
    stopBgm();
    if (!ending) { ending = new Audio('assets/song.mp3'); ending.preload = 'auto'; }
    ending.volume = bgm ? .85 : 0; ending.currentTime = 0; ending.play().catch(() => { });
  }
  function startBgm() {
    if (bgmOn) return; bgmOn = true; ac();
    const el = getSong(); el.volume = bgm ? .7 : 0; el.play().catch(() => { });
  }
  function stopBgm() { bgmOn = false; if (song) song.pause(); }

  window.BBA = {
    sfx: SFX,
    get snd() { return snd; }, get bgm() { return bgm; },
    toggleSnd() { snd = !snd; try { localStorage.setItem('boyband.snd', snd ? '1' : '0'); } catch (e) { } if (sfxGain) sfxGain.gain.setTargetAtTime(snd ? 1 : 0, ac().currentTime, .03); return snd; },
    toggleBgm() { bgm = !bgm; try { localStorage.setItem('boyband.bgm', bgm ? '1' : '0'); } catch (e) { } if (song) song.volume = bgm ? .7 : 0; if (ending) ending.volume = bgm ? .85 : 0; if (bgm && !ending) startBgm(); return bgm; },
    music(on) { if (on) { startBgm(); } else stopBgm(); },
    ending: playEnding,
    quiet() { if (song) song.volume = bgm ? .25 : 0; },   // 실패 엔딩 — 반주만 작게
    duck(on) { if (song) song.volume = on ? (bgm ? .06 : 0) : (bgm ? .7 : 0); },   // 예능 영상 동안 반주 거의 끄기
    unlock() { ac(); },
    beat: 60 / BPM,
  };
})();
