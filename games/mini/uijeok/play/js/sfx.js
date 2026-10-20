// 소리: 효과음은 짧게 합성(밝기 2kHz 아래), 배경음은 히자즈 음계 우드 뜯기 + 프레임 북(낮은 지속음은 웅 소리라 뺌, 10/20)
(function () {
  const AU = (window.AU = {});
  let ac = null, out = null, sfxG = null, bgmG = null;
  AU.sfx = localStorage.getItem('uijeok.snd') !== '0';
  AU.bgm = localStorage.getItem('uijeok.bgm') !== '0';
  function init() {
    if (ac) return true;
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return false; }
    out = ac.createDynamicsCompressor(); out.threshold.value = -14; out.ratio.value = 4; out.connect(ac.destination);
    sfxG = ac.createGain(); sfxG.gain.value = AU.sfx ? 0.7 : 0; sfxG.connect(out);
    bgmG = ac.createGain(); bgmG.gain.value = AU.bgm ? 0.32 : 0; bgmG.connect(out);
    return true;
  }
  AU.unlock = function () { if (init() && ac.state === 'suspended') ac.resume(); };
  AU.setSfx = (on) => { AU.sfx = on; localStorage.setItem('uijeok.snd', on ? '1' : '0'); if (sfxG) sfxG.gain.value = on ? 0.7 : 0; };
  AU.setBgm = (on) => { AU.bgm = on; localStorage.setItem('uijeok.bgm', on ? '1' : '0'); if (bgmG) bgmG.gain.setTargetAtTime(on ? 0.32 : 0, ac.currentTime, 0.1); };
  let nb = null;
  function noise() { if (nb) return nb; nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return nb; }
  function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  function tone(type, f0, f1, dur, vol, dst, at, lp) {
    const t = at || ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    let n = o; if (lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); n = f; }
    n.connect(g); g.connect(dst || sfxG); env(g, t, 0.005, vol, dur); o.start(t); o.stop(t + dur + 0.05);
  }
  function nz(dur, vol, lp, hp, dst, at, sweep) {
    const t = at || ac.currentTime, s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
    s.buffer = noise(); s.loop = true; f.type = 'lowpass'; f.frequency.setValueAtTime(lp, t); if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur);
    let n = f; if (hp) { const h = ac.createBiquadFilter(); h.type = 'highpass'; h.frequency.value = hp; f.connect(h); n = h; }
    s.connect(f); n.connect(g); g.connect(dst || sfxG); env(g, t, 0.004, vol, dur); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  const S = {
    step: (v) => { nz(0.05, 0.12 * v, 420); },
    jump: () => { nz(0.16, 0.12, 500, 0, 0, 0, 1400); },
    land: () => { tone('sine', 120, 60, 0.12, 0.35); nz(0.08, 0.18, 500); },
    landHard: () => { tone('sine', 90, 40, 0.25, 0.5); nz(0.18, 0.3, 380); },
    grab: () => { nz(0.05, 0.22, 900, 200); tone('sine', 180, 120, 0.06, 0.15); },
    climb: () => { nz(0.25, 0.1, 700, 0, 0, 0, 300); },
    teeter: () => { tone('triangle', 320, 260, 0.09, 0.08); },
    bump: () => { tone('sine', 110, 70, 0.1, 0.3); },
    crack: () => { nz(0.08, 0.2, 1200, 300); tone('square', 140, 90, 0.05, 0.05, 0, 0, 600); },
    crumble: () => { nz(0.35, 0.25, 700, 0, 0, 0, 200); },
    crash: () => { nz(0.4, 0.4, 900, 0, 0, 0, 160); tone('sine', 70, 35, 0.3, 0.4); },
    gate: () => { const t = ac.currentTime; for (let i = 0; i < 6; i++) tone('triangle', 520 + (i % 2) * 90, 0, 0.05, 0.07, 0, t + i * 0.07, 1600); },
    door: () => { tone('sine', 140, 70, 0.6, 0.3); nz(0.5, 0.12, 400); },
    swish0: () => { nz(0.12, 0.18, 1800, 500, 0, 0, 600); },
    swish: () => {},
    raise: () => { nz(0.14, 0.08, 900, 300, 0, 0, 1600); },
    clang: () => { const t = ac.currentTime; tone('sine', 880, 860, 0.35, 0.18, 0, t, 1900); tone('sine', 1320, 1300, 0.25, 0.1, 0, t, 1900); tone('triangle', 620, 600, 0.2, 0.14, 0, t, 1800); nz(0.04, 0.2, 1900, 600); },
    hit: () => { tone('sine', 160, 70, 0.14, 0.45); nz(0.06, 0.25, 1000, 200); },
    hurt: () => { tone('triangle', 220, 140, 0.2, 0.25, 0, 0, 1200); },
    die: () => { const t = ac.currentTime; tone('triangle', 300, 90, 0.7, 0.25, 0, t, 1200); tone('sine', 80, 40, 0.5, 0.4, 0, t + 0.05); },
    slice: () => { nz(0.08, 0.3, 1900, 800); tone('sine', 120, 50, 0.4, 0.4); },
    enemyDie: () => { tone('triangle', 260, 80, 0.5, 0.22, 0, 0, 1100); },
    fallScream: () => { tone('triangle', 520, 180, 0.8, 0.12, 0, 0, 1400); },
    draw: () => { nz(0.18, 0.1, 1700, 900, 0, 0, 1100); tone('triangle', 900, 1000, 0.15, 0.04, 0, 0, 1800); },
    sheath: () => { nz(0.14, 0.08, 1400, 700, 0, 0, 800); },
    drink: () => { const t = ac.currentTime; for (let i = 0; i < 5; i++) tone('sine', 300 + Math.random() * 200, 600, 0.06, 0.12, 0, t + i * 0.08); },
    lifeup: () => { const t = ac.currentTime; [293.7, 370, 440, 587.3].forEach((f, i) => tone('triangle', f, 0, 0.35, 0.16, 0, t + i * 0.09, 1900)); },
    gem: () => { const t = ac.currentTime; [784, 1046.5, 1318.5].forEach((f, i) => tone('sine', f, 0, 0.3, 0.1, 0, t + i * 0.06, 1900)); },
    arrow: () => { nz(0.08, 0.12, 1600, 600, 0, 0, 900); tone('triangle', 420, 300, 0.05, 0.06, 0, 0, 1400); },
    click: () => { tone('triangle', 520, 400, 0.05, 0.12, 0, 0, 1500); },
    level: () => { const t = ac.currentTime; [146.8, 155.6, 185, 196, 220].forEach((f, i) => tone('triangle', f * 2, 0, 0.5, 0.15, 0, t + i * 0.11, 1600)); },
  };
  AU.play = function (n, v) { if (!AU.sfx || !init() || ac.state !== 'running') return; const f = S[n]; if (f) try { f(v == null ? 1 : v); } catch (e) {} };

  // ---------- 배경음 ----------
  // 히자즈: D Eb F# G A Bb C D (반음 수)
  const HIJAZ = [0, 1, 4, 5, 7, 8, 10, 12, 13, 16, 17, 19];
  const MOODS = {
    jail: { root: 146.83, bpm: 76, drum: 0.5, dens: 0.45 }, palace: { root: 146.83, bpm: 96, drum: 1, dens: 0.7 }, roof: { root: 164.81, bpm: 104, drum: 1, dens: 0.75 },
    cave: { root: 130.81, bpm: 70, drum: 0.3, dens: 0.4 }, ruins: { root: 138.59, bpm: 88, drum: 0.7, dens: 0.6 }, temple: { root: 146.83, bpm: 112, drum: 1, dens: 0.8 }, title: { root: 146.83, bpm: 84, drum: 0.6, dens: 0.55 },
  };
  let mood = null, nextT = 0, step = 0, timer = null, seed = 1, phrase = [];
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  function oud(f, t, vol) {
    const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
    o.type = 'triangle'; o2.type = 'sawtooth'; o.frequency.value = f; o2.frequency.value = f * 1.002;
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(1800, t); lp.frequency.exponentialRampToValueAtTime(500, t + 0.4);
    const g2 = ac.createGain(); g2.gain.value = 0.25;
    o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(bgmG);
    env(g, t, 0.004, vol, 0.55); o.start(t); o2.start(t); o.stop(t + 0.7); o2.stop(t + 0.7);
  }
  function drum(t, low, vol) {
    if (low) tone('sine', 110, 55, 0.25, vol, bgmG, t);
    else nz(0.05, vol * 0.5, 1700, 500, bgmG, t);
  }
  function makePhrase() {
    phrase = []; let d = Math.floor(rnd() * 4);
    for (let i = 0; i < 16; i++) { if (rnd() < mood.dens) { d = Math.max(0, Math.min(HIJAZ.length - 1, d + Math.floor(rnd() * 5) - 2)); phrase.push(d); } else phrase.push(-1); }
    phrase[0] = 0; phrase[15] = -1; phrase[14] = rnd() < 0.5 ? 0 : 4;
  }
  function sched() {
    if (!ac || !mood) return;
    const spb = 60 / mood.bpm / 2;
    while (nextT < ac.currentTime + 0.25) {
      const s = step % 16;
      if (s === 0 && (step % 64) === 0) makePhrase();
      const n = phrase[s]; if (n >= 0) oud(mood.root * Math.pow(2, HIJAZ[n] / 12), nextT, 0.13);
      if (mood.drum) { const pat = [1, 0, 2, 0, 2, 1, 0, 2]; const k = pat[s % 8]; if (k === 1) drum(nextT, true, 0.32 * mood.drum); else if (k === 2) drum(nextT, false, 0.2 * mood.drum); }
      nextT += spb; step++;
    }
  }
  AU.music = function (name) {
    if (!init()) return;
    const m = MOODS[name] || MOODS.palace;
    if (mood === m) return;
    mood = m; seed = name.length * 977 + 13; step = 0; nextT = ac.currentTime + 0.1; makePhrase();
    if (!timer) timer = setInterval(sched, 80);
  };
})();