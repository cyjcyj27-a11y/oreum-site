// 운빨용사 소리: 8비트 칩 소리를 코드로 만든다(파일 없음). 효과음·배경음 따로 끔.
(function () {
  let ac = null, master = null, sfxOn = true, bgmOn = true;
  try { sfxOn = localStorage.getItem('luckhero.sfx') !== '0'; bgmOn = localStorage.getItem('luckhero.bgm') !== '0'; } catch (e) { }
  function ctx() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination); } catch (e) { return null; } }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(f, t0, dur, type, vol, f2, dest) {
    const a = ctx(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || master); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  let nbuf = null;
  function noise(t0, dur, vol, hp) {
    const a = ctx(); if (!a) return;
    if (!nbuf) { nbuf = a.createBuffer(1, a.sampleRate * 0.5, a.sampleRate); const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    s.buffer = nbuf; f.type = 'highpass'; f.frequency.value = hp || 800;
    g.gain.setValueAtTime(vol || 0.2, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t0); s.stop(t0 + dur + 0.02);
  }
  const N = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const S = {
    tick() { const t = ac.currentTime; tone(900 + Math.random() * 500, t, 0.03, 'square', 0.05); },
    land() { const t = ac.currentTime; tone(520, t, 0.08, 'square', 0.12); noise(t, 0.05, 0.12, 2000); },
    hit() { const t = ac.currentTime; noise(t, 0.12, 0.28, 600); tone(180, t, 0.12, 'square', 0.12, 60); },
    bighit() { const t = ac.currentTime; noise(t, 0.3, 0.4, 300); tone(140, t, 0.3, 'sawtooth', 0.18, 40); },
    block() { const t = ac.currentTime; tone(1200, t, 0.06, 'square', 0.08); tone(800, t + 0.04, 0.1, 'triangle', 0.12); },
    miss() { const t = ac.currentTime; tone(N(62), t, 0.18, 'square', 0.12, N(58)); tone(N(57), t + 0.18, 0.18, 'square', 0.12, N(53)); tone(N(52), t + 0.36, 0.4, 'square', 0.12, N(45)); },
    crit() { const t = ac.currentTime; [72, 76, 79, 84].forEach((n, i) => tone(N(n), t + i * 0.05, 0.12, 'square', 0.1)); },
    jackpot() { const t = ac.currentTime; [72, 76, 79, 84, 79, 84, 88, 91].forEach((n, i) => tone(N(n), t + i * 0.07, 0.14, 'square', 0.11)); for (let i = 0; i < 10; i++) tone(2000 + Math.random() * 1500, t + 0.5 + i * 0.05, 0.08, 'triangle', 0.06); },
    coin() { const t = ac.currentTime; tone(N(83), t, 0.06, 'square', 0.08); tone(N(88), t + 0.06, 0.14, 'square', 0.08); },
    card() { const t = ac.currentTime; noise(t, 0.05, 0.08, 3000); },
    leaf() { const t = ac.currentTime; tone(N(79), t, 0.08, 'triangle', 0.14); tone(N(86), t + 0.07, 0.12, 'triangle', 0.14); },
    heal() { const t = ac.currentTime; [67, 71, 74, 79].forEach((n, i) => tone(N(n), t + i * 0.06, 0.12, 'triangle', 0.13)); },
    hurt() { const t = ac.currentTime; tone(300, t, 0.2, 'sawtooth', 0.14, 90); noise(t, 0.1, 0.2, 400); },
    win() { const t = ac.currentTime; [67, 72, 76, 79, 76, 79, 84].forEach((n, i) => tone(N(n), t + i * 0.1, i === 6 ? 0.5 : 0.14, 'square', 0.1)); },
    lose() { const t = ac.currentTime; [67, 63, 60, 55].forEach((n, i) => tone(N(n), t + i * 0.22, 0.3, 'triangle', 0.15)); },
    click() { const t = ac.currentTime; tone(700, t, 0.04, 'square', 0.06); },
    deny() { const t = ac.currentTime; tone(160, t, 0.12, 'square', 0.1); },
    capsule() { const t = ac.currentTime; for (let i = 0; i < 6; i++) tone(400 + i * 120, t + i * 0.06, 0.06, 'square', 0.07); noise(t + 0.4, 0.15, 0.2, 1500); },
    poison() { const t = ac.currentTime; tone(200, t, 0.2, 'sine', 0.15, 400); },
    roar() { const t = ac.currentTime; noise(t, 0.6, 0.35, 150); tone(90, t, 0.6, 'sawtooth', 0.15, 50); },
  };
  window.SFX = {
    play(n) { if (!sfxOn) return; if (!ctx()) return; try { S[n] && S[n](); } catch (e) { } },
    get on() { return sfxOn; }, set on(v) { sfxOn = v; try { localStorage.setItem('luckhero.sfx', v ? '1' : '0'); } catch (e) { } },
    unlock() { ctx(); },
  };

  // 배경음: 짧은 칩튠 마디를 되풀이
  const SONGS = {
    map: { bpm: 112, lead: [72, 0, 76, 79, 77, 76, 74, 0, 72, 74, 76, 72, 69, 0, 67, 0, 72, 0, 76, 79, 81, 79, 77, 76, 74, 76, 77, 74, 72, 0, 0, 0], bass: [48, 55, 48, 55, 53, 60, 53, 60, 45, 52, 45, 52, 43, 50, 43, 50] },
    battle: { bpm: 150, lead: [69, 72, 76, 72, 69, 72, 76, 79, 77, 76, 74, 72, 74, 0, 71, 0, 69, 72, 76, 72, 81, 79, 77, 76, 74, 72, 71, 69, 68, 0, 71, 0], bass: [45, 45, 52, 45, 41, 41, 48, 41, 43, 43, 50, 43, 40, 40, 47, 44] },
    boss: { bpm: 164, lead: [64, 0, 64, 67, 0, 66, 65, 0, 64, 0, 64, 70, 0, 69, 67, 0, 64, 0, 64, 67, 0, 66, 65, 63, 62, 0, 63, 0, 64, 0, 0, 0], bass: [40, 40, 40, 40, 46, 46, 45, 45, 40, 40, 40, 40, 38, 38, 39, 39] },
    title: { bpm: 100, lead: [76, 0, 79, 0, 84, 83, 81, 79, 77, 0, 81, 0, 79, 0, 76, 0, 74, 0, 77, 0, 81, 79, 77, 76, 74, 72, 74, 76, 72, 0, 0, 0], bass: [48, 0, 55, 0, 53, 0, 57, 0, 50, 0, 55, 0, 48, 0, 55, 0] },
  };
  let cur = null, timer = null, step = 0, bgmGain = null, nextT = 0;
  function sched() {
    const a = ac; if (!a || !cur) return;
    const s = SONGS[cur], dt = 60 / s.bpm / 2;
    while (nextT < a.currentTime + 0.25) {
      const li = step % s.lead.length, bi = Math.floor(step / 2) % s.bass.length;
      const ln = s.lead[li]; if (ln) tone(N(ln), nextT, dt * 0.9, 'square', 0.035, null, bgmGain);
      if (step % 2 === 0 && s.bass[bi]) tone(N(s.bass[bi]), nextT, dt * 1.8, 'triangle', 0.09, null, bgmGain);
      if (cur !== 'title' && cur !== 'map' && step % 4 === 2) noise(nextT, 0.04, 0.05, 5000);
      nextT += dt; step++;
    }
  }
  window.BGM = {
    play(name) {
      if (cur === name) return; cur = name; step = 0;
      if (!bgmOn) return;
      const a = ctx(); if (!a) return;
      if (!bgmGain) { bgmGain = a.createGain(); bgmGain.connect(master); }
      bgmGain.gain.value = 1; nextT = a.currentTime + 0.05;
      if (!timer) timer = setInterval(sched, 90);
    },
    stop() { cur = null; },
    get on() { return bgmOn; },
    set on(v) {
      bgmOn = v; try { localStorage.setItem('luckhero.bgm', v ? '1' : '0'); } catch (e) { }
      if (bgmGain) bgmGain.gain.value = v ? 1 : 0;
      if (v && cur) { const c = cur; cur = null; this.play(c); }
    },
  };
})();
