// 소리: 전부 코드로. 떡메 쿵·쫀득·칼 착·콩고물 사라락·뽁·테이프 찌익·상자 통·트럭 빵빵·코인·별, 배경음(마림바 돌림 노래).
(function () {
  const A = (window.SND = {});
  const MUTE = /[?&]mute\b/.test(location.search);
  let ctx = null, master = null, sfxG = null, bgmG = null;
  A.sfx = localStorage.getItem('otteok.snd') !== '0';
  A.bgm = localStorage.getItem('otteok.bgm') !== '0';
  function ensure() {
    if (MUTE) return false;
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.85; master.connect(ctx.destination);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000; lp.connect(master);
    sfxG = ctx.createGain(); sfxG.gain.value = A.sfx ? 1 : 0; sfxG.connect(lp);
    bgmG = ctx.createGain(); bgmG.gain.value = A.bgm ? 0.26 : 0; bgmG.connect(lp);
    return true;
  }
  A.unlock = function () { if (ensure() && A.bgm) startBgm(); };
  A.setSfx = function (on) { A.sfx = on; try { localStorage.setItem('otteok.snd', on ? '1' : '0'); } catch (e) {} if (sfxG) sfxG.gain.value = on ? 1 : 0; };
  A.setBgm = function (on) { A.bgm = on; try { localStorage.setItem('otteok.bgm', on ? '1' : '0'); } catch (e) {} if (bgmG) bgmG.gain.setTargetAtTime(on ? 0.26 : 0, ctx.currentTime, 0.1); if (on && ensure()) startBgm(); };
  function ok() { return A.sfx && ensure(); }
  function nb() { if (A._nb) return A._nb; const n = ctx.sampleRate * 1.0, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return (A._nb = b); }
  function tone(f, t, dur, type, vol, to, dest) {
    if (!isFinite(f) || !isFinite(vol) || (to != null && !isFinite(to))) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(dest || sfxG); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(t, dur, f0, f1, q, vol, type, attack) {
    if (!isFinite(f0) || !isFinite(f1) || !isFinite(vol)) return;
    const s = ctx.createBufferSource(); s.buffer = nb();
    const bf = ctx.createBiquadFilter(); bf.type = type || 'bandpass'; bf.frequency.setValueAtTime(f0, t); bf.frequency.exponentialRampToValueAtTime(f1, t + dur); bf.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + (attack || 0.004)); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(bf); bf.connect(g); g.connect(sfxG); s.start(t, Math.random() * 0.4); s.stop(t + dur + 0.05);
  }
  const now = () => ctx.currentTime;

  // 떡메 쿵: 낮은 퉁 + 나무 딱
  A.thud = function (k) { if (!ok()) return; const t = now(); k = k == null ? 1 : k; tone(95, t, 0.22, 'sine', 0.55 * (0.6 + k * 0.4), 48); tone(180, t, 0.07, 'triangle', 0.2, 90); noise(t, 0.08, 900, 300, 1.2, 0.25, 'lowpass'); };
  // 쫀득: 짧게 미끄러지는 젖은 소리
  A.squish = function () { if (!ok()) return; const t = now(); tone(420, t, 0.12, 'sine', 0.12, 160); noise(t + 0.01, 0.1, 1800, 500, 3, 0.08); };
  A.plop = function () { if (!ok()) return; const t = now(); tone(260, t, 0.14, 'sine', 0.25, 520); tone(140, t, 0.1, 'sine', 0.15, 90); };
  A.stretch = function () { if (!ok()) return; const t = now(); tone(200, t, 0.45, 'sine', 0.14, 520); noise(t, 0.4, 600, 2000, 4, 0.05); };
  A.chop = function () { if (!ok()) return; const t = now(); noise(t, 0.06, 3200, 1800, 2, 0.32); tone(900, t, 0.05, 'triangle', 0.1, 400); tone(120, t + 0.01, 0.08, 'sine', 0.25, 70); };
  A.powder = function () { if (!ok()) return; const t = now(); noise(t, 0.28, 5000, 2500, 0.8, 0.12, 'bandpass', 0.05); tone(300, t, 0.08, 'sine', 0.1, 200); };
  A.pop = function (p) { if (!ok()) return; const t = now(); p = p || 1; tone(500 * p, t, 0.09, 'sine', 0.22, 1100 * p); };
  // PERFECT 연속: 실로폰 음이 한 칸씩 오른다
  const PEN = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
  A.ding = function (c) { if (!ok()) return; const t = now(), f = 784 * Math.pow(2, PEN[Math.min(PEN.length - 1, c || 0)] / 12); tone(f, t, 0.4, 'sine', 0.22); tone(f * 2, t, 0.25, 'sine', 0.06); tone(f * 3.01, t, 0.12, 'sine', 0.03); };
  A.burst = function () { if (!ok()) return; const t = now(); noise(t, 0.25, 900, 200, 1, 0.3, 'lowpass'); tone(160, t, 0.2, 'sawtooth', 0.06, 60); };
  A.squeeze = function (k) { if (!ok()) return; const t = now(); tone(300 + k * 400, t, 0.06, 'sine', 0.05, 340 + k * 420); };
  A.lid = function () { if (!ok()) return; const t = now(); tone(330, t, 0.12, 'triangle', 0.15, 220); noise(t, 0.05, 2000, 800, 2, 0.12); };
  A.steam = function () { if (!ok()) return; const t = now(); noise(t, 0.3, 4000, 6000, 0.6, 0.05, 'highpass', 0.08); };
  A.whoosh = function () { if (!ok()) return; const t = now(); noise(t, 0.25, 600, 2400, 1.5, 0.12, 'bandpass', 0.06); };
  A.fold = function (p) { if (!ok()) return; const t = now(); noise(t, 0.12, 1500 * (p || 1), 3500 * (p || 1), 1.2, 0.12, 'bandpass', 0.02); tone(400 * (p || 1), t + 0.05, 0.08, 'sine', 0.08, 600 * (p || 1)); };
  A.knot = function () { if (!ok()) return; const t = now(); tone(600, t, 0.1, 'sine', 0.2, 1200); tone(900, t + 0.08, 0.14, 'sine', 0.2, 1800); [1318, 1568, 2093].forEach((f, i) => tone(f, t + 0.16 + i * 0.06, 0.3, 'sine', 0.08)); };
  A.slap = function () { if (!ok()) return; const t = now(); noise(t, 0.07, 2500, 900, 1, 0.3); tone(220, t, 0.05, 'sine', 0.12, 120); };
  A.box = function () { if (!ok()) return; const t = now(); tone(130, t, 0.15, 'sine', 0.35, 70); noise(t, 0.08, 700, 250, 1, 0.2, 'lowpass'); };
  A.bubble = function () { if (!ok()) return; const t = now(); for (let i = 0; i < 6; i++) { const s = t + i * 0.05 + Math.random() * 0.02; tone(900 + Math.random() * 700, s, 0.04, 'sine', 0.1, 400); } };
  let tapeNode = null;
  A.tapeStart = function () { if (!ok() || tapeNode) return; const s = ctx.createBufferSource(); s.buffer = nb(); s.loop = true; const bf = ctx.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = 1400; bf.Q.value = 2.5; const g = ctx.createGain(); g.gain.value = 0; s.connect(bf); bf.connect(g); g.connect(sfxG); s.start(); tapeNode = { s, bf, g }; };
  A.tapeMove = function (sp, k) { if (!tapeNode) return; const t = now(); tapeNode.g.gain.setTargetAtTime(Math.min(0.28, sp * 0.05), t, 0.02); tapeNode.bf.frequency.setTargetAtTime(1100 + k * 1800, t, 0.03); };
  A.tapeEnd = function () { if (!tapeNode) return; const n = tapeNode; tapeNode = null; n.g.gain.setTargetAtTime(0, now(), 0.03); n.s.stop(now() + 0.2); };
  A.honk = function () { if (!ok()) return; const t = now(); [0, 0.22].forEach((d) => { tone(440, t + d, 0.16, 'square', 0.07); tone(554, t + d, 0.16, 'square', 0.05); }); };
  A.truck = function () { if (!ok()) return; const t = now(); tone(70, t, 1.2, 'sawtooth', 0.06, 140); noise(t, 1.0, 300, 900, 0.8, 0.06, 'lowpass', 0.1); };
  A.coin = function () { if (!ok()) return; const t = now(); tone(1568, t, 0.08, 'square', 0.04); tone(2093, t + 0.06, 0.18, 'square', 0.04); };
  A.star = function (i) { if (!ok()) return; const t = now(), f = [784, 988, 1175, 1397, 1568][Math.min(4, i)]; tone(f, t, 0.35, 'sine', 0.2); tone(f * 2, t, 0.2, 'triangle', 0.05); };
  A.notify = function () { if (!ok()) return; const t = now(); tone(1047, t, 0.12, 'sine', 0.18); tone(1568, t + 0.1, 0.2, 'sine', 0.18); };
  A.fanfare = function () { if (!ok()) return; const t = now(); [523, 659, 784, 1047, 784, 1047].forEach((f, i) => { tone(f, t + i * 0.11, 0.3, 'triangle', 0.14); tone(f / 2, t + i * 0.11, 0.3, 'sine', 0.08); }); };
  A.fail = function () { if (!ok()) return; const t = now(); [392, 330, 262].forEach((f, i) => tone(f, t + i * 0.18, 0.3, 'triangle', 0.14)); };
  A.click = function () { if (!ok()) return; const t = now(); tone(700, t, 0.05, 'sine', 0.12, 900); };
  A.bell = function () { if (!ok()) return; const t = now(); [0, 0.5, 1.0].forEach((d) => { [523, 1046, 1569, 2093].forEach((f, i) => tone(f, t + d, 2.2 - i * 0.4, 'sine', 0.16 / (i + 1))); }); };

  // ---------- 배경음: 마림바·피치카토 돌림 노래(우리가 지은 곡) ----------
  let bgmOn = false, nextT = 0, step = 0, timer = null;
  const BPM = 112, Q = 60 / BPM / 2; // 8분음표
  // 코드: C G Am F / C G F G
  const CH = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62], [53, 57, 60], [55, 59, 62]];
  const MEL = [
    [72, 0, 76, 0, 79, 77, 76, 0], [74, 0, 71, 0, 74, 76, 74, 0], [72, 0, 69, 72, 76, 0, 74, 72], [69, 0, 72, 0, 77, 76, 74, 0],
    [76, 0, 79, 0, 84, 0, 81, 79], [79, 77, 74, 0, 71, 0, 74, 0], [77, 76, 74, 72, 69, 0, 72, 74], [74, 0, 71, 0, 67, 0, 0, 0],
  ];
  const mf = (n) => 440 * Math.pow(2, (n - 69) / 12);
  function mar(f, t, v, d) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o2.type = 'sine'; o.frequency.value = f; o2.frequency.value = f * 4.0;
    const g2 = ctx.createGain(); g2.gain.setValueAtTime(v * 0.25, t); g2.gain.exponentialRampToValueAtTime(0.0005, t + 0.08);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0005, t + (d || 0.5));
    o.connect(g); o2.connect(g2); g.connect(bgmG); g2.connect(bgmG);
    o.start(t); o2.start(t); o.stop(t + (d || 0.5) + 0.05); o2.stop(t + 0.1);
  }
  function sched() {
    if (!bgmOn || !ctx) return;
    while (nextT < ctx.currentTime + 0.25) {
      const bar = Math.floor(step / 8) % 8, s = step % 8;
      const ch = CH[bar];
      if (s % 4 === 0) mar(mf(ch[0] - 24), nextT, 0.32, 0.6);
      if (s % 2 === 1) ch.forEach((n) => mar(mf(n), nextT, 0.06, 0.18));
      const m = MEL[bar][s];
      if (m) mar(mf(m), nextT, 0.2, 0.42);
      nextT += Q; step++;
    }
  }
  function startBgm() {
    if (bgmOn || !ctx) return;
    bgmOn = true; nextT = ctx.currentTime + 0.1; step = 0;
    timer = setInterval(sched, 60);
  }
  A.stopBgm = function () { bgmOn = false; clearInterval(timer); };
})();
