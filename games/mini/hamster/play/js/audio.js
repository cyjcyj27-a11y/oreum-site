// 소리: 고양이만 녹음 파일, 나머지는 전부 코드로. 뿅(뛰기)·냠(씨)·찍(밟힘)·첨벙·냐옹·땡땡(기차)·배경음(발랄한 피치카토 여덟 마디 돌림).
(function () {
  const A = (window.SND = {});
  let ctx = null, master = null, sfxG = null, bgmG = null;
  A.sfx = localStorage.getItem('hamster.snd') !== '0';
  A.bgm = localStorage.getItem('hamster.bgm') !== '0';
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6500; lp.connect(master);
    sfxG = ctx.createGain(); sfxG.gain.value = A.sfx ? 1 : 0; sfxG.connect(lp);
    bgmG = ctx.createGain(); bgmG.gain.value = A.bgm ? 0.28 : 0; bgmG.connect(lp);
    return true;
  }
  A.unlock = function () { ensure(); if (A.bgm) startBgm(); };
  A.setSfx = function (on) { A.sfx = on; try { localStorage.setItem('hamster.snd', on ? '1' : '0'); } catch (e) {} if (sfxG) sfxG.gain.value = on ? 1 : 0; };
  A.setBgm = function (on) { A.bgm = on; try { localStorage.setItem('hamster.bgm', on ? '1' : '0'); } catch (e) {} if (on) { ensure(); startBgm(); } if (bgmG) bgmG.gain.setTargetAtTime(on ? 0.28 : 0, ctx.currentTime, 0.1); };
  function noiseBuf() { if (A._nb) return A._nb; const n = ctx.sampleRate * 0.8, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return (A._nb = b); }
  function ok() { return A.sfx && ensure(); }
  function tone(f, t, dur, type, vol, to, dest) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(dest || sfxG); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(t, dur, f0, f1, q, vol, type, dest) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf();
    const bf = ctx.createBiquadFilter(); bf.type = type || 'bandpass'; bf.frequency.setValueAtTime(f0, t); bf.frequency.exponentialRampToValueAtTime(f1, t + dur); bf.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(bf); bf.connect(g); g.connect(dest || sfxG); s.start(t); s.stop(t + dur + 0.05);
  }
  // 뛰기: 짧은 뿅. 볼이 찰수록 살짝 낮게(무거워짐)
  A.hop = function (k) { if (!ok()) return; const t = ctx.currentTime, b = 620 - (k || 0) * 160 + Math.random() * 40; tone(b, t, 0.07, 'sine', 0.16, b * 1.6); noise(t, 0.03, 3000, 1800, 1.5, 0.03); };
  A.bump = function () { if (!ok()) return; const t = ctx.currentTime; tone(220, t, 0.08, 'sine', 0.18, 150); };
  // 씨 먹기: 냠냠(두 번 오물)
  A.eat = function (n) { if (!ok()) return; const t = ctx.currentTime, up = (n || 0) * 22; tone(760 + up, t, 0.06, 'triangle', 0.17, 980 + up); tone(980 + up, t + 0.07, 0.07, 'triangle', 0.15, 1300 + up); noise(t, 0.05, 2400, 1500, 2, 0.05); };
  A.gold = function () { if (!ok()) return; const t = ctx.currentTime; [1047, 1319, 1568, 2093, 2637].forEach((f, i) => tone(f, t + i * 0.055, 0.25, 'triangle', 0.12)); };
  A.full = function () { if (!ok()) return; const t = ctx.currentTime; tone(330, t, 0.12, 'square', 0.06, 250); };
  // 은신처에 쏟기: 씨가 우르르(개수만큼 톡톡, 많으면 빠르게)
  A.bank = function (n) {
    if (!ok()) return; const t = ctx.currentTime, k = Math.min(n, 14);
    for (let i = 0; i < k; i++) { tone(900 + Math.random() * 500, t + i * 0.045, 0.05, 'triangle', 0.08); }
    [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + k * 0.045 + i * 0.09, 0.3, 'triangle', 0.13));
  };
  // 밟힘: 삐익 + 납작
  A.squash = function () { if (!ok()) return; const t = ctx.currentTime; tone(1400, t, 0.22, 'square', 0.07, 380); tone(90, t, 0.18, 'sine', 0.35, 45); noise(t, 0.1, 900, 200, 0.8, 0.18, 'lowpass'); };
  A.splash = function () { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.45, 2600, 400, 0.7, 0.28); tone(520, t + 0.05, 0.18, 'sine', 0.14, 160); tone(380, t + 0.22, 0.14, 'sine', 0.08, 700); };
  // 고양이: 사장님이 받은 야옹 녹음(assets/catmeow.mp3, 1.2초로 자름, 원본 virtual_vibes-cat-meow-sound-383823). 크기는 파형 재서 붕어빵 야옹 0.5 와 맞춤. <audio> 로 틀어야 file:// 에서도 난다. 못 읽으면 코드 냐옹
  let meowEl = null;
  try { meowEl = new Audio('assets/catmeow.mp3'); meowEl.preload = 'auto'; meowEl.load(); } catch (e) { meowEl = null; }
  A.meow = function () {
    if (!A.sfx) return;
    if (meowEl && meowEl.readyState >= 2) {
      try { const a = meowEl.cloneNode(); a.volume = 0.18; const p = a.play(); if (p && p.catch) p.catch(() => {}); return; } catch (e) {}
    }
    if (!ok()) return; const t = ctx.currentTime, d = 0.75;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(480, t); o.frequency.linearRampToValueAtTime(760, t + 0.22); o.frequency.linearRampToValueAtTime(620, t + 0.45); o.frequency.exponentialRampToValueAtTime(380, t + d);
    const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 6; f1.frequency.setValueAtTime(700, t); f1.frequency.linearRampToValueAtTime(1100, t + 0.25); f1.frequency.linearRampToValueAtTime(800, t + d);
    const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = 8; f2.frequency.setValueAtTime(1800, t); f2.frequency.linearRampToValueAtTime(1500, t + d);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5, t + 0.06); g.gain.setValueAtTime(0.45, t + 0.5); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.connect(sfxG); o.start(t); o.stop(t + d + 0.05);
  };
  A.swipe = function () { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.22, 400, 2400, 0.8, 0.22); };
  // 건널목 땡땡
  A.bell = function () { if (!ok()) return; const t = ctx.currentTime; for (let i = 0; i < 4; i++) { tone(1480, t + i * 0.32, 0.28, 'sine', 0.06); tone(2220, t + i * 0.32, 0.18, 'sine', 0.03); } };
  A.horn = function () { if (!ok()) return; const t = ctx.currentTime; tone(392, t, 0.14, 'square', 0.05); tone(392, t + 0.18, 0.2, 'square', 0.05); };
  A.clear = function () { if (!ok()) return; const t = ctx.currentTime; [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.085, i > 4 ? 0.5 : 0.18, 'triangle', 0.15)); };
  A.tap = function () { if (!ok()) return; const t = ctx.currentTime; tone(1200, t, 0.04, 'sine', 0.1, 900); noise(t, 0.03, 2200, 1500, 2, 0.04); };
  A.ending = function () { if (!ok()) return; const t = ctx.currentTime; [523, 659, 784, 1047, 880, 1047, 1175, 1319, 1568].forEach((f, i) => { tone(f, t + i * 0.16, 0.6, 'triangle', 0.14); tone(f / 2, t + i * 0.16, 0.4, 'sine', 0.08); }); };

  // ---------- 배경음: 발랄한 피치카토(우리가 지은 가락) ----------
  let bgmOn = false, nextT = 0, step = 0, timer = null;
  const BPM = 132, S16 = 60 / BPM / 4;
  // 16분음표 칸마다 음(반음 수, null=쉼). C장조. 두 마디 × 4
  const MEL = [
    12, null, 16, null, 19, null, 16, 19, 21, null, 19, null, 16, null, null, null,
    14, null, 17, null, 21, null, 17, 21, 19, null, 17, null, 14, null, null, null,
    12, null, 16, null, 19, null, 24, null, 23, null, 21, null, 19, null, 16, null,
    17, null, 16, null, 14, null, 11, null, 12, null, null, 7, 12, null, null, null
  ];
  const BASS = [0, 7, 5, 7];       // 마디마다 뿌리음: C G F G
  const CH = [[0, 4, 7], [7, 11, 14], [5, 9, 12], [7, 11, 14]];
  const hz = (n) => 261.63 * Math.pow(2, n / 12);
  function pluck(f, t, vol, dur) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0008, t + (dur || 0.22)); o.connect(g); g.connect(bgmG); o.start(t); o.stop(t + (dur || 0.22) + 0.05); }
  function sched() {
    if (!bgmOn) return;
    while (nextT < ctx.currentTime + 0.2) {
      const i = step % 64, bar = Math.floor(i / 16), b = i % 16;
      const n = MEL[i]; if (n !== null) pluck(hz(n), nextT, 0.22, 0.2);
      if (b === 0 || b === 8) pluck(hz(BASS[bar] - 24), nextT, 0.32, 0.38);
      if (b === 4 || b === 12) CH[bar].forEach((c) => pluck(hz(c - 12), nextT, 0.07, 0.12));
      if (b % 2 === 0) { const s = ctx.createBufferSource(); s.buffer = noiseBuf(); const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000; const g = ctx.createGain(); g.gain.setValueAtTime(b % 4 === 2 ? 0.05 : 0.025, nextT); g.gain.exponentialRampToValueAtTime(0.0008, nextT + 0.04); s.connect(hp); hp.connect(g); g.connect(bgmG); s.start(nextT); s.stop(nextT + 0.06); }
      nextT += S16; step++;
    }
  }
  function startBgm() { if (bgmOn || !ctx) return; bgmOn = true; nextT = ctx.currentTime + 0.05; timer = setInterval(sched, 60); }
})();
