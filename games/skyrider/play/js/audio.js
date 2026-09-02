// 소리 — 전부 WebAudio 로 만든다 (파일 없음)
(function () {
  let ctx = null, master = null, sfxBus = null, musBus = null, windEl = null, padGain = null;
  let birdT = 4, engGain = null, engOsc = null, engOsc2 = null;
  let musicOn = true, sfxOn = true;
  const warnEls = [];   // 울리고 있는 경고음들 (주유 시작하면 끊는다)
  try { musicOn = localStorage.getItem('maedal.music') !== 'off'; sfxOn = localStorage.getItem('maedal.sfx') !== 'off'; } catch (e) { }

  function noiseBuffer(sec) {
    const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * sec), ctx.sampleRate);
    const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = sfxOn ? 1 : 0; sfxBus.connect(master);
    musBus = ctx.createGain(); musBus.gain.value = musicOn ? 1 : 0; musBus.connect(master);
    // 바람: assets/wind.mp3 를 잔잔하게 깔고 속도에 따라 키운다
    windEl = document.getElementById('sndWind'); windEl.volume = 0; windEl.play().catch(() => { });
    // 오토바이 엔진 (멀면 안 들린다)
    engGain = ctx.createGain(); engGain.gain.value = 0; engGain.connect(sfxBus);
    const ef = ctx.createBiquadFilter(); ef.type = 'lowpass'; ef.frequency.value = 900; ef.connect(engGain);
    engOsc = ctx.createOscillator(); engOsc.type = 'sawtooth'; engOsc.frequency.value = 70; engOsc.connect(ef); engOsc.start();
    engOsc2 = ctx.createOscillator(); engOsc2.type = 'square'; engOsc2.frequency.value = 35; const eg2 = ctx.createGain(); eg2.gain.value = 0.4; engOsc2.connect(eg2).connect(ef); engOsc2.start();
    // 낮은 울림
    padGain = ctx.createGain(); padGain.gain.value = 0.035; padGain.connect(musBus);
    startMusic();
    for (const f of [55, 82.4, 110.5]) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = 0.3;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05 + Math.random() * 0.08; const lg = ctx.createGain(); lg.gain.value = 0.15;
      lfo.connect(lg).connect(g.gain); lfo.start();
      o.connect(g).connect(padGain); o.start();
    }
  }
  function toggleMusic() { musicOn = !musicOn; try { localStorage.setItem('maedal.music', musicOn ? 'on' : 'off'); } catch (e) { } if (musBus) musBus.gain.setTargetAtTime(musicOn ? 1 : 0, ctx.currentTime, 0.05); return musicOn; }
  function toggleSfx() { sfxOn = !sfxOn; try { localStorage.setItem('maedal.sfx', sfxOn ? 'on' : 'off'); } catch (e) { } if (sfxBus) sfxBus.gain.setTargetAtTime(sfxOn ? 1 : 0, ctx.currentTime, 0.05); if (windEl && !sfxOn) windEl.volume = 0; return sfxOn; }
  function toggle() { return !toggleMusic(); }
  function isMuted() { return !musicOn; }

  // ── 배경음악: 오음계 아르페지오 + 낮은 화음, 90BPM, 8마디 순환 ──
  const SCALE = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3, 659.3, 784.0];   // C 오음계 두 옥타브
  const CHORDS = [[0, 2, 4], [3, 5, 7], [1, 3, 5], [4, 6, 8]];                        // 4마디씩
  let musicNext = 0, musicStep = 0, musicTimer = null;
  function startMusic() {
    const lead = ctx.createGain(); lead.gain.value = 0.045; lead.connect(musBus);
    const chordG = ctx.createGain(); chordG.gain.value = 0.02; chordG.connect(musBus);
    const beat = 60 / 90 / 2;   // 8분음표
    musicNext = ctx.currentTime + 0.3;
    const rnd = NOISE.makeRng(1234);
    function note(f, t, dur, bus, type, vol) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(bus); o.start(t); o.stop(t + dur + 0.05);
    }
    musicTimer = setInterval(() => {
      if (!ctx) return;
      while (musicNext < ctx.currentTime + 0.5) {
        const bar = Math.floor(musicStep / 8) % 16, sub = musicStep % 8;
        const ch = CHORDS[Math.floor(bar / 4) % 4];
        if (sub === 0) for (const i of ch) note(SCALE[i] / 2, musicNext, beat * 8, chordG, 'sine', 1);
        // 아르페지오: 화음 음 + 가끔 이웃 음, 쉼표도
        if (rnd() < 0.82) { const pick = rnd() < 0.7 ? ch[sub % 3] : Math.min(8, ch[sub % 3] + (rnd() < 0.5 ? 1 : 2)); note(SCALE[pick] * (bar % 8 >= 4 ? 2 : 1) / (bar % 8 >= 4 ? 2 : 1), musicNext, beat * (1.2 + rnd()), lead, 'triangle', 1); }
        musicNext += beat; musicStep++;
      }
    }, 120);
  }

  function burst(dur, filterHz, gain, type) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuffer(dur + 0.05);
    const f = ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = filterHz;
    const g = ctx.createGain(); g.gain.setValueAtTime(gain, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    s.connect(f).connect(g).connect(sfxBus); s.start(); s.stop(ctx.currentTime + dur + 0.05);
  }
  function tone(freq, dur, gain, type, slideTo) {
    const o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(gain, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g).connect(sfxBus); o.start(); o.stop(ctx.currentTime + dur + 0.02);
  }

  const A = {
    init, toggle, isMuted, toggleMusic, toggleSfx, pause(on) { if (master) master.gain.setTargetAtTime(on ? 0 : 1, ctx.currentTime, 0.03); if (on) { const r = document.getElementById('sndRefuel'); if (r && !r.paused) r.pause(); } if (windEl) { if (on) windEl.pause(); else if (sfxOn) windEl.play().catch(() => { }); } }, get musicOn() { return musicOn; }, get sfxOn() { return sfxOn; },
    grab(type) {
      if (!ctx) return;
      if (type === 'rope') { burst(0.12, 1800, 0.18, 'bandpass'); tone(320, 0.08, 0.05, 'triangle', 220); }
      else if (type === 'wet') { burst(0.16, 900, 0.22); tone(180, 0.1, 0.05, 'sine', 90); }
      else { burst(0.09, 700, 0.35); tone(140, 0.07, 0.12, 'sine', 70); }
    },
    crumble() { if (!ctx) return; for (let i = 0; i < 4; i++) setTimeout(() => burst(0.08, 2200, 0.25, 'bandpass'), i * 45); setTimeout(() => burst(0.35, 500, 0.3), 120); },
    slip() { if (!ctx) return; tone(420, 0.22, 0.12, 'sawtooth', 160); burst(0.2, 1500, 0.15, 'highpass'); },
    lunge() { if (!ctx) return; const o = ctx.createBufferSource(); o.buffer = noiseBuffer(0.4); const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(250, ctx.currentTime); f.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.3); const g = ctx.createGain(); g.gain.setValueAtTime(0.2, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35); o.connect(f).connect(g).connect(sfxBus); o.start(); },
    land(force) { if (!ctx) return; const k = Math.min(1, force / 14); tone(70, 0.25 + k * 0.2, 0.25 + k * 0.4, 'sine', 35); burst(0.15 + k * 0.2, 400 + k * 600, 0.2 + k * 0.4); },
    summit() {
      if (!ctx) return;
      for (const [f, d] of [[220, 0], [277.2, 0.3], [329.6, 0.6], [440, 0.9]]) setTimeout(() => {
        const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 1.2); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 7);
        o.connect(g).connect(musBus); o.start(); o.stop(ctx.currentTime + 7.2);
      }, d * 1000);
    },
    // 주문 소리: assets/order.mp3
    order() {
      if (!sfxOn) return;
      const a = document.getElementById('sndOrder').cloneNode(); a.volume = 0.8; a.play();
    },
    crash(vol) { if (!sfxOn) return; const a = document.getElementById('sndCrash').cloneNode(); a.volume = vol || 0.9; a.play(); },
    // 연료 30% 경고음 (assets/warn.mp3)
    warn() { if (!sfxOn) return; const a = document.getElementById('sndWarn').cloneNode(); a.volume = 0.4; warnEls.push(a); a.addEventListener('ended', () => { const i = warnEls.indexOf(a); if (i >= 0) warnEls.splice(i, 1); }); a.play().catch(() => { }); },
    stopWarn() { for (const a of warnEls) { try { a.pause(); } catch (e) { } } warnEls.length = 0; },
    // 주유 중 콸콸 (assets/refuel.mp3, 반복). 매 프레임 on/off 로 부른다
    refuel(on) {
      const el = document.getElementById('sndRefuel'); if (!el) return;
      if (on && sfxOn) { A.stopWarn(); el.volume = 0.5; if (el.paused) el.play().catch(() => { }); }
      else if (!el.paused) { el.pause(); el.currentTime = 0; }
    },
    deliver(tip) { if (!ctx) return; const seq = tip ? [523, 659, 784, 1047] : [523, 659]; seq.forEach((f, i) => setTimeout(() => tone(f, 0.18, 0.06, 'triangle'), i * 110)); },
    engine(dist, rev) {
      if (!ctx || !engGain) return;
      const v = Math.max(0, 1 - dist / 90); const vol = v * v * 0.032;   // 20%
      engGain.gain.setTargetAtTime(vol, ctx.currentTime, 0.1);
      const f = 62 + rev * 40; engOsc.frequency.setTargetAtTime(f, ctx.currentTime, 0.1); engOsc2.frequency.setTargetAtTime(f * 0.5, ctx.currentTime, 0.1);
    },
    // 매 프레임: 바람 세기(0~1), 낙하 속도(m/s)
    update(dt, wind, fallSpeed, inCloud) {
      if (!ctx) return;
      const sp = Math.min(1, fallSpeed / 26);   // 오토바이 속도 (m/s)
      const target = sfxOn ? Math.min(0.3, 0.025 + sp * 0.16 + wind * 0.09) : 0;   // 50%
      if (windEl) { windEl.volume += (target - windEl.volume) * Math.min(1, dt * 3); if (windEl.paused && sfxOn) windEl.play().catch(() => { }); }
      padGain.gain.setTargetAtTime(0.03 + inCloud * 0.03, ctx.currentTime, 0.5);
      birdT -= dt;
      if (birdT < 0) {
        birdT = 5 + Math.random() * 12;
        if (!inCloud) { const n = 1 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) setTimeout(() => { tone(520 + Math.random() * 120, 0.16, 0.035, 'sawtooth', 380); burst(0.12, 1400, 0.05, 'bandpass'); }, i * 260); }
      }
    },
  };
  window.AUDIO = A;
})();
