// 소리 — 효과음은 녹음(sfx.js 의 SFXDATA, Pixabay), 배경음악은 코드(오음계 뜯는 소리)
(function () {
  const A = { ctx: null, master: null, sfxG: null, musG: null, buf: {}, musicOn: true, sfxOn: true, loops: {}, ready: false };
  try { A.musicOn = localStorage.getItem('jando.bgm') !== '0'; A.sfxOn = localStorage.getItem('jando.snd') !== '0'; } catch (e) { }
  function init() {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    A.ctx = new C();
    A.master = A.ctx.createGain(); A.master.gain.value = 0.9; A.master.connect(A.ctx.destination);
    A.sfxG = A.ctx.createGain(); A.sfxG.gain.value = A.sfxOn ? 1 : 0; A.sfxG.connect(A.master);
    A.musG = A.ctx.createGain(); A.musG.gain.value = A.musicOn ? 0.32 : 0; A.musG.connect(A.master);
    // 잔향 (짧은 지연 두 개)
    A.verb = A.ctx.createDelay(1); A.verb.delayTime.value = 0.23; const fb = A.ctx.createGain(); fb.gain.value = 0.32;
    const lp = A.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    A.verb.connect(lp); lp.connect(fb); fb.connect(A.verb); lp.connect(A.musG);
    const D = window.SFXDATA || {};
    for (const k in D) {
      const bin = atob(D[k]), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      A.ctx.decodeAudioData(u.buffer, b => { A.buf[k] = b; if (A.loops[k] && A.loops[k].want) startLoop(k, A.loops[k].vol); }, () => { });
    }
    // 합성 효과음 버스: 3kHz 저역통과 → 컴프레서 → 효과음 (메모 sfx-comfortable-synth: 밝기 2kHz 아래)
    A.synLP = A.ctx.createBiquadFilter(); A.synLP.type = 'lowpass'; A.synLP.frequency.value = 3000;
    A.synComp = A.ctx.createDynamicsCompressor(); A.synComp.threshold.value = -14; A.synComp.ratio.value = 4;
    A.synLP.connect(A.synComp); A.synComp.connect(A.sfxG);
    A.noise = A.ctx.createBuffer(1, A.ctx.sampleRate * 2, A.ctx.sampleRate); { const d = A.noise.getChannelData(0); let b = 0; for (let i = 0; i < d.length; i++) { b = 0.97 * b + 0.03 * (Math.random() * 2 - 1); d[i] = (Math.random() * 2 - 1) * 0.5 + b * 4; } }   // 흰+갈색 섞은 소음
    A.ready = true; startMusic();
  }
  // ── 합성 효과음 (위험) ──
  function nz(t, dur, o) {   // 소음 한 토막: o = { lp, hp, bp, q, vol, att, f1(필터가 끝에 갈 주파수), dest }
    const c = A.ctx, s = c.createBufferSource(); s.buffer = A.noise; s.loop = true; s.playbackRate.value = o.rate || 1;
    const f = c.createBiquadFilter(); f.type = o.bp ? 'bandpass' : 'lowpass'; const f0 = o.bp || o.lp || 800; f.frequency.setValueAtTime(f0, t); if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + dur); f.Q.value = o.q || (o.bp ? 1.2 : 0.7);
    let last = f; if (o.hp) { const h = c.createBiquadFilter(); h.type = 'highpass'; h.frequency.value = o.hp; f.connect(h); last = h; }
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.vol || 0.5, t + (o.att || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); last.connect(g); g.connect(o.dest || A.synLP); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05); return g;
  }
  function tone(t, f, dur, vol, fEnd, type) {   // 낮은 "통" — 사인, 음이 떨어진다
    const c = A.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (fEnd) o.frequency.exponentialRampToValueAtTime(fEnd, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(A.synLP); o.start(t); o.stop(t + dur + 0.05);
  }
  function fx(name, vol) {
    if (!A.ctx || !A.synLP) return; const t = A.ctx.currentTime + 0.01, v = vol === undefined ? 1 : vol;
    if (name === 'pebble') { for (let i = 0; i < 3; i++) nz(t + i * (0.04 + Math.random() * 0.06), 0.05, { bp: 900 + Math.random() * 500, q: 3, vol: 0.45 * v }); }
    else if (name === 'crumble') { for (let i = 0; i < 9; i++) nz(t + Math.random() * 0.7, 0.07 + Math.random() * 0.08, { bp: 500 + Math.random() * 600, q: 2, vol: 0.36 * v }); nz(t, 0.9, { lp: 400, vol: 0.12 * v, att: 0.2 }); }
    else if (name === 'rockHit') { tone(t, 95, 0.5, 0.7 * v, 45); nz(t, 0.35, { lp: 1400, f1: 300, vol: 0.55 * v }); for (let i = 0; i < 5; i++) nz(t + 0.03 + Math.random() * 0.25, 0.06, { bp: 700 + Math.random() * 500, q: 2, vol: 0.18 * v }); }
    else if (name === 'zip') { nz(t, 0.32, { bp: 700, f1: 950, q: 6, vol: 0.32 * v, att: 0.02 }); nz(t, 0.32, { lp: 500, vol: 0.12 * v }); }   // 카라비너가 케이블을 타고 미끄러짐
    else if (name === 'clip') { nz(t, 0.025, { bp: 1500, q: 8, vol: 0.6 * v }); nz(t + 0.07, 0.03, { bp: 1250, q: 8, vol: 0.55 * v }); tone(t + 0.07, 420, 0.12, 0.18 * v, 380, 'triangle'); }   // 철컥
    else if (name === 'bodyHit') { tone(t, 120, 0.25, 0.6 * v, 70); nz(t, 0.18, { lp: 900, vol: 0.4 * v }); }
    else if (name === 'thunderFar') { nz(t, 3.5, { lp: 260, f1: 120, vol: 0.35 * v, att: 0.6 }); nz(t + 0.4, 2.2, { lp: 180, vol: 0.25 * v, att: 0.3 }); }
    else if (name === 'thunder') { nz(t, 0.35, { lp: 1600, f1: 400, vol: 0.6 * v }); tone(t, 70, 1.6, 0.45 * v, 38); nz(t + 0.05, 4.0, { lp: 320, f1: 110, vol: 0.55 * v, att: 0.1 }); }
    else if (name === 'gust') { nz(t, 3.6, { bp: 280, f1: 760, q: 4, vol: 0.32 * v, att: 1.4 }); nz(t, 3.6, { lp: 500, vol: 0.2 * v, att: 1.2 }); }
    else if (name === 'crackle') { for (let i = 0; i < 4; i++) nz(t + Math.random() * 0.2, 0.03, { bp: 1100 + Math.random() * 400, q: 5, vol: 0.5 * v }); }
    else if (name === 'rockBreak') { tone(t, 140, 0.4, 0.55 * v, 60); nz(t, 0.5, { lp: 1800, f1: 350, vol: 0.6 * v }); for (let i = 0; i < 8; i++) nz(t + Math.random() * 0.5, 0.06, { bp: 600 + Math.random() * 700, q: 2, vol: 0.2 * v }); }
  }
  // 빗소리 (계속 도는 소음, 세기만 바꾼다)
  function rain(vol) {
    if (!A.ctx || !A.synLP) return;
    if (!A.rainG) { const c = A.ctx, s = c.createBufferSource(); s.buffer = A.noise; s.loop = true; const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = 1100; b.Q.value = 0.5; const l = c.createBiquadFilter(); l.type = 'lowpass'; l.frequency.value = 1700; A.rainG = c.createGain(); A.rainG.gain.value = 0; s.connect(b); b.connect(l); l.connect(A.rainG); A.rainG.connect(A.sfxG); s.start(); }
    A.rainG.gain.setTargetAtTime(vol * 0.45, A.ctx.currentTime, 0.4);
  }
  function play(name, vol, rate, delay) {
    if (name === 'clear') { jingle(); return null; }
    if (!A.ctx || !A.buf[name]) return null;
    const s = A.ctx.createBufferSource(); s.buffer = A.buf[name]; s.playbackRate.value = rate || 1;
    const g = A.ctx.createGain(); g.gain.value = vol === undefined ? 1 : vol; s.connect(g); g.connect(A.sfxG);
    s.start(A.ctx.currentTime + (delay || 0)); return { s, g };
  }
  function startLoop(name, vol) {
    A.loops[name] = A.loops[name] || {}; A.loops[name].want = true; A.loops[name].vol = vol;
    if (!A.ctx || !A.buf[name] || A.loops[name].src) return;
    const s = A.ctx.createBufferSource(); s.buffer = A.buf[name]; s.loop = true;
    const g = A.ctx.createGain(); g.gain.value = vol; s.connect(g); g.connect(A.sfxG); s.start();
    A.loops[name].src = s; A.loops[name].g = g;
  }
  function loopVol(name, vol, rate) { const L = A.loops[name]; if (!L) { startLoop(name, vol); return; } L.vol = vol; if (L.g) L.g.gain.setTargetAtTime(vol, A.ctx.currentTime, 0.08); if (rate && L.src) L.src.playbackRate.setTargetAtTime(rate, A.ctx.currentTime, 0.1); }
  function stopLoop(name) { const L = A.loops[name]; if (!L) return; L.want = false; if (L.src) { try { L.src.stop(); } catch (e) { } L.src = null; } }
  // ── 배경음악: 라 단조 오음계, 뜯는 현 (고쟁 비슷하게) ──
  const SCALE = [0, 3, 5, 7, 10];   // A C D E G
  function pluck(t, midi, vol, len, dest) {
    const c = A.ctx, f = 440 * Math.pow(2, (midi - 69) / 12);
    const o1 = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
    o1.type = 'triangle'; o2.type = 'sawtooth'; o1.frequency.value = f; o2.frequency.value = f * 1.002;
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(f * 6, t); lp.frequency.exponentialRampToValueAtTime(f * 1.2, t + 0.5);
    const g2 = c.createGain(); g2.gain.value = 0.18;
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(dest || A.musG); if (!dest) lp.connect(A.verb);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0008, t + len);
    o1.start(t); o2.start(t); o1.stop(t + len + 0.05); o2.stop(t + len + 0.05);
    // 떨림 (농현) — 긴 음만
    if (len > 1.2) { const lf = c.createOscillator(), lg = c.createGain(); lf.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.012, t + 0.5); lf.connect(lg); lg.connect(o1.frequency); lf.start(t); lf.stop(t + len); }
  }
  const PHR = [   // [박, 음계 칸(옥타브 포함), 길이]
    [[0, 7, 1.6], [1.5, 6, 0.5], [2, 5, 1.0], [3, 4, 0.9], [4, 5, 2.4]],
    [[0, 4, 0.8], [1, 5, 0.8], [2, 7, 0.8], [2.5, 8, 0.5], [3, 7, 2.6]],
    [[0, 9, 1.4], [1.5, 8, 0.5], [2, 7, 0.9], [3, 5, 0.9], [4, 6, 2.0]],
    [[0, 5, 0.9], [1, 4, 0.6], [1.5, 3, 0.6], [2, 2, 1.0], [3, 4, 3.0]],
  ];
  const deg = n => 57 + Math.floor(n / 5) * 12 + SCALE[((n % 5) + 5) % 5];
  let musT = 0, bar = 0, musTimer = null;
  function startMusic() {
    if (musTimer) return; musT = A.ctx.currentTime + 0.3;
    musTimer = setInterval(() => {
      if (!A.ctx || A.ctx.state !== 'running') return;
      while (musT < A.ctx.currentTime + 1.2) {
        const beat = 0.62, ph = PHR[bar % PHR.length];
        if (bar % 8 !== 7) for (const [b, d, l] of ph) pluck(musT + b * beat, deg(d), 0.22, l * beat * 1.6);
        // 낮은 줄: 마디 첫 박에 근음 + 5도
        pluck(musT, deg([0, 2, 3, 0][bar % 4]) - 24, 0.16, 3.2); pluck(musT + 2 * beat, deg([2, 4, 0, 2][bar % 4]) - 24, 0.1, 2.0);
        musT += 4 * beat * 1.25; bar++;
      }
    }, 300);
  }
  // DAY CLEAR: 뜯는 소리로 올라가는 다섯 음 + 맺음
  function jingle() { if (!A.ctx) return; const t0 = A.ctx.currentTime + 0.05, S = A.sfxG; [0, 2, 4, 5, 7].forEach((d, i) => pluck(t0 + i * 0.11, deg(d + 5), 0.16, 1.2, S)); pluck(t0 + 0.6, deg(10), 0.18, 2.4, S); pluck(t0 + 0.6, deg(5), 0.12, 2.4, S); }
  function setMusic(on) { A.musicOn = on; try { localStorage.setItem('jando.bgm', on ? '1' : '0'); } catch (e) { } if (A.musG) A.musG.gain.setTargetAtTime(on ? 0.32 : 0, A.ctx.currentTime, 0.1); }
  function setSfx(on) { A.sfxOn = on; try { localStorage.setItem('jando.snd', on ? '1' : '0'); } catch (e) { } if (A.sfxG) A.sfxG.gain.setTargetAtTime(on ? 1 : 0, A.ctx.currentTime, 0.05); }
  function pause(p) { if (!A.ctx) return; if (p) A.ctx.suspend(); else A.ctx.resume(); }
  window.AUDIO = { A, init, play, fx, rain, startLoop, loopVol, stopLoop, setMusic, setSfx, pause, get musicOn() { return A.musicOn; }, get sfxOn() { return A.sfxOn; } };
})();
