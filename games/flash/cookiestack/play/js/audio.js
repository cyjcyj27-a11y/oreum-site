// 소리: 전부 코드로. 점토 철퍽·잘림·PERFECT 실로폰(연속일수록 음이 오름)·받침 쿵·배경음(마림바 네 마디 돌림).
(function () {
  const A = (window.SND = {});
  let ctx = null, master = null, sfxG = null, bgmG = null, rawG = null;
  A.sfx = localStorage.getItem('cookiestack.snd') !== '0';
  A.bgm = localStorage.getItem('cookiestack.bgm') !== '0';
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    // 녹음 소리는 바삭한 높은 소리를 살리려고 거름망을 안 거친다
    rawG = ctx.createGain(); rawG.gain.value = A.sfx ? 1 : 0; rawG.connect(master);
    // 밝기 2kHz 아래로 눌러 귀가 편하게
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200; lp.connect(master);
    sfxG = ctx.createGain(); sfxG.gain.value = A.sfx ? 1 : 0; sfxG.connect(lp);
    bgmG = ctx.createGain(); bgmG.gain.value = A.bgm ? 0.32 : 0; bgmG.connect(lp);
    return true;
  }
  A.unlock = function () { ensure(); if (ctx) loadCrunch(); if (A.bgm) startBgm(); };
  A.setSfx = function (on) { A.sfx = on; try { localStorage.setItem('cookiestack.snd', on ? '1' : '0'); } catch (e) {} if (sfxG) sfxG.gain.value = on ? 1 : 0; if (rawG) rawG.gain.value = on ? 1 : 0; };
  A.setBgm = function (on) { A.bgm = on; try { localStorage.setItem('cookiestack.bgm', on ? '1' : '0'); } catch (e) {} if (bgmG) bgmG.gain.setTargetAtTime(on ? 0.32 : 0, ctx.currentTime, 0.1); if (on) { ensure(); startBgm(); } };
  function noiseBuf() { if (A._nb) return A._nb; const n = ctx.sampleRate * 0.6, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return (A._nb = b); }
  function ok() { return A.sfx && ensure(); }
  function tone(f, t, dur, type, vol, to, dest) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(dest || sfxG); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(t, dur, f0, f1, q, vol, type) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf();
    const bf = ctx.createBiquadFilter(); bf.type = type || 'bandpass'; bf.frequency.setValueAtTime(f0, t); bf.frequency.exponentialRampToValueAtTime(f1, t + dur); bf.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(bf); bf.connect(g); g.connect(sfxG); s.start(t); s.stop(t + dur + 0.05);
  }
  // 점토가 철퍽 붙는 소리: 낮은 퉁 + 짧은 젖은 소리
  // 쿠키가 떨어질 때: 사장님이 녹음한 바삭 부서지는 소리(js/sfx_data.js). 뽁·코드 바사삭은 뺌
  let crunchBuf = null;
  function loadCrunch() {
    if (crunchBuf || !window.SFX_DATA) return;
    const bin = atob(window.SFX_DATA.crunch), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    crunchBuf = 'loading';
    ctx.decodeAudioData(u8.buffer, (b) => { crunchBuf = b; }, () => { crunchBuf = null; });
  }
  A.drop = function (k) {
    if (!ok()) return;
    loadCrunch();
    if (!crunchBuf || crunchBuf === 'loading') return;
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = crunchBuf; s.playbackRate.value = 0.96 + Math.random() * 0.08; // 매번 똑같지 않게 아주 조금
    g.gain.value = 0.45; s.connect(g); g.connect(rawG); s.start();
  };
  // 잘린 조각 소리는 따로 안 냄(떨어뜨릴 때 바삭 소리 하나로)
  A.cut = function () {};
  A.land = function () { if (!ok()) return; const t = ctx.currentTime; tone(110, t, 0.12, 'sine', 0.22, 55); noise(t, 0.06, 600, 200, 1, 0.12, 'lowpass'); };
  // PERFECT: 실로폰 음이 연속마다 한 칸씩 오른다(펜타토닉)
  const PEN = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31];
  A.perfect = function (c) {
    if (!ok()) return; const t = ctx.currentTime;
    const f = 523.25 * Math.pow(2, PEN[Math.min(PEN.length - 1, c - 1)] / 12);
    tone(f, t + 0.02, 0.5, 'sine', 0.3); tone(f * 2, t + 0.02, 0.2, 'sine', 0.06); tone(f * 1.5, t + 0.09, 0.4, 'sine', 0.12);
  };
  A.slam = function () { if (!ok()) return; const t = ctx.currentTime; tone(90, t, 0.35, 'sine', 0.7, 40); noise(t, 0.25, 700, 120, 0.9, 0.4, 'lowpass'); };
  A.clear = function () {
    if (!ok()) return; const t = ctx.currentTime;
    [0, 4, 7, 12, 16].forEach((n, i) => { const f = 392 * Math.pow(2, n / 12); tone(f, t + i * 0.08, 0.45, 'sine', 0.22); tone(f / 2, t + i * 0.08, 0.3, 'triangle', 0.06); });
  };
  A.miss = function () { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.3, 500, 150, 1, 0.25, 'lowpass'); tone(260, t, 0.4, 'triangle', 0.12, 130); };
  A.over = function () { if (!ok()) return; const t = ctx.currentTime; [7, 4, 0, -5].forEach((n, i) => tone(330 * Math.pow(2, n / 12), t + i * 0.16, 0.4, 'triangle', 0.16)); };
  A.end = function () {
    if (!ok()) return; const t = ctx.currentTime;
    [0, 4, 7, 11, 12, 16, 19, 24].forEach((n, i) => { tone(261.6 * Math.pow(2, n / 12), t + i * 0.13, 1.4, 'sine', 0.2); });
    [0, 7, 12].forEach((n) => tone(130.8 * Math.pow(2, n / 12), t + 1.05, 2.4, 'triangle', 0.1));
  };
  A.pop = function () { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.18, 1200, 300, 1, 0.18, 'lowpass'); tone(600 + Math.random() * 300, t + 0.02, 0.3, 'sine', 0.08, 900); };
  A.click = function () { if (!ok()) return; const t = ctx.currentTime; tone(240, t, 0.08, 'sine', 0.25, 140); noise(t, 0.04, 800, 300, 1, 0.1, 'lowpass'); };

  // ---------- 배경음: C 장조 4마디(C-Am-F-G) 마림바 + 베이스, 96 BPM ----------
  let playing = false, nextT = 0, step16 = 0, timer = null;
  const BPM = 96, S16 = 60 / BPM / 4;
  const CH = [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]]; // C Am F G (C4 기준 반음)
  const MEL = [ // 16칸 x 4마디, 숫자 = 화음 안 몇 번째 음(+옥타브), null = 쉼
    [0, null, 2, null, 1, null, 2, 4, null, 2, null, 1, 0, null, null, null],
    [2, null, 1, null, 0, null, 1, 2, null, 4, null, 2, 1, null, null, null],
    [1, null, 2, null, 4, null, 5, 4, null, 2, null, 1, 2, null, null, null],
    [4, null, 2, null, 1, null, 2, 0, null, 1, null, 2, 4, null, 5, null],
  ];
  function mar(f, t, v) { // 마림바: 사인 + 4배 음 짧게
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0006, t + 0.55);
    o.connect(g); g.connect(bgmG); o.start(t); o.stop(t + 0.6);
    const o2 = ctx.createOscillator(), g2 = ctx.createGain(); o2.type = 'sine'; o2.frequency.value = f * 4;
    g2.gain.setValueAtTime(v * 0.25, t); g2.gain.exponentialRampToValueAtTime(0.0006, t + 0.08); o2.connect(g2); g2.connect(bgmG); o2.start(t); o2.stop(t + 0.1);
  }
  function sched() {
    while (nextT < ctx.currentTime + 0.2) {
      const bar = Math.floor(step16 / 16) % 4, s = step16 % 16, ch = CH[bar];
      const m = MEL[bar][s];
      if (m != null) { const n = ch[m % 3] + 12 * Math.floor(m / 3) + 12; mar(261.63 * Math.pow(2, n / 12), nextT, 0.22); }
      if (s === 0 || s === 8) tone(130.81 * Math.pow(2, ch[0] / 12) / 2, nextT, 0.5, 'triangle', 0.3, null, bgmG);
      if (s === 4 || s === 12) ch.forEach((c, i) => mar(261.63 * Math.pow(2, c / 12), nextT + i * 0.012, 0.07));
      nextT += S16; step16++;
    }
  }
  function startBgm() { if (playing || !ctx) return; playing = true; nextT = ctx.currentTime + 0.1; step16 = 0; timer = setInterval(sched, 60); }
})();
