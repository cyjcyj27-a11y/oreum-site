// 소리: 전부 코드로 합성(밝기 2kHz 아래로 편하게)
(function () {
  const A = (window.SND = {});
  let ctx = null, master = null, sfx = null, bgm = null, noiseB = null;
  A.sfxOn = localStorage.getItem('tattoo.snd') !== '0';
  A.bgmOn = localStorage.getItem('tattoo.bgm') !== '0';
  A.ensure = function () {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = A._muted ? 0 : 0.9; master.connect(ctx.destination);
    sfx = ctx.createGain(); sfx.gain.value = A.sfxOn ? 1 : 0; sfx.connect(master);
    bgm = ctx.createGain(); bgm.gain.value = A.bgmOn ? 0.26 : 0; bgm.connect(master);
    noiseB = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const d = noiseB.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  };
  A.setSfx = (on) => { A.sfxOn = on; try { localStorage.setItem('tattoo.snd', on ? '1' : '0'); } catch (e) {} if (sfx) sfx.gain.value = on ? 1 : 0; };
  A.setBgm = (on) => { A.bgmOn = on; try { localStorage.setItem('tattoo.bgm', on ? '1' : '0'); } catch (e) {} if (bgm) bgm.gain.setTargetAtTime(on ? 0.26 : 0, ctx.currentTime, 0.1); };
  A.mute = () => { if (master) master.gain.value = 0; A._muted = true; };

  function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function osc(type, f, t, a, peak, d, out, f2) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    env(g, t, a, peak, d); o.connect(g); g.connect(out || sfx); o.start(t); o.stop(t + a + d + 0.05); return o;
  }
  function noise(t, dur, peak, type, f, q, out, f2) {
    const s = ctx.createBufferSource(); s.buffer = noiseB;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q || 1;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = ctx.createGain(); env(g, t, 0.005, peak, dur);
    s.connect(fl); fl.connect(g); g.connect(out || sfx); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  const ok = () => A.ensure() && ctx;

  // 타투 머신: 낮게 웅웅(110Hz 언저리 세모파를 부드럽게 거름), 살에 닿으면 조금 낮아지고 먹먹해짐
  // 떨림(am)은 따로 둔 마디에만 걸고, 켜고 끄는 소리 크기(g)와 섞지 않음(섞으면 꺼도 계속 울림)
  let mc = null;
  A.machine = function (on) {
    if (!ok()) return;
    if (!mc) {
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), wob = ctx.createGain(), g = ctx.createGain(), am = ctx.createOscillator(), amg = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = 118; o2.type = 'sawtooth'; o2.frequency.value = 236.5;
      const o2g = ctx.createGain(); o2g.gain.value = 0.25;
      f.type = 'lowpass'; f.frequency.value = 520; f.Q.value = 0.8;
      wob.gain.value = 0.8; am.frequency.value = 59; amg.gain.value = 0.2; am.connect(amg); amg.connect(wob.gain);
      g.gain.value = 0;
      o.connect(f); o2.connect(o2g); o2g.connect(f); f.connect(wob); wob.connect(g); g.connect(sfx); o.start(); o2.start(); am.start();
      mc = { o, o2, f, g };
    }
    mc.g.gain.setTargetAtTime(on ? 0.035 : 0, ctx.currentTime, on ? 0.02 : 0.04);
  };
  A.skin = function (on) { if (!mc) return; const t = ctx.currentTime; mc.o.frequency.setTargetAtTime(on ? 104 : 118, t, 0.05); mc.o2.frequency.setTargetAtTime(on ? 209 : 236.5, t, 0.05); mc.f.frequency.setTargetAtTime(on ? 400 : 520, t, 0.05); };
  // 숨: 들이쉼(스읍) · 내쉼(후)
  A.inhale = function () { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.55, 0.12, 'bandpass', 900, 1.2, null, 1400); };
  A.exhale = function () { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.7, 0.1, 'bandpass', 700, 0.9, null, 380); };
  // 휴지로 쓱
  let wipeT = 0;
  A.wipe = function () { if (!ok()) return; const t = ctx.currentTime; if (t - wipeT < 0.06) return; wipeT = t; noise(t, 0.12, 0.1, 'bandpass', 1100, 1.0, null, 700); };
  // 피어싱 쏙 + 장신구 딸깍
  A.pierce = function (perfect) { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.05, 0.4, 'bandpass', 1200, 3); osc('sine', 420, t, 0.003, 0.3, 0.08, null, 160); osc('triangle', 1318, t + 0.12, 0.003, 0.1, 0.12); if (perfect) { osc('triangle', 784, t + 0.2, 0.005, 0.16, 0.2); osc('triangle', 1175, t + 0.28, 0.005, 0.14, 0.3); } };
  A.bad = function () { if (!ok()) return; const t = ctx.currentTime; osc('square', 196, t, 0.004, 0.06, 0.12, null, 150); };
  A.ouch = function (big) {
    if (!ok()) return; const t = ctx.currentTime, p = big ? 1.15 : 1;
    const voice = (t0, dur, f0, f1, fm) => {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0 * p, t0); o.frequency.linearRampToValueAtTime(f1 * p, t0 + dur);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(0.26, t0 + 0.02); g.gain.setValueAtTime(0.26, t0 + dur - 0.05); g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
      fm.forEach(([f, q, a]) => { const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = q; const ga = ctx.createGain(); ga.gain.value = a; o.connect(b); b.connect(ga); ga.connect(g); });
      g.connect(sfx); o.start(t0); o.stop(t0 + dur + 0.05);
    };
    voice(t, 0.12, 250, 290, [[780, 6, 1.2], [1150, 7, 0.8]]);
    voice(t + 0.13, 0.26, 320, 190, [[400, 6, 0.8], [1800, 9, 0.35], [800, 6, 1.1]]);
  };
  A.coin = function () { if (!ok()) return; const t = ctx.currentTime; osc('triangle', 784, t, 0.004, 0.15, 0.12); osc('triangle', 1175, t + 0.07, 0.004, 0.13, 0.22); };
  A.gold = function () { if (!ok()) return; const t = ctx.currentTime; [0, 0.07, 0.14, 0.21, 0.3].forEach((d, i) => { osc('triangle', [784, 988, 1175, 1318, 1568][i], t + d, 0.004, 0.16, 0.3); }); };
  // 셔터 드르륵
  A.shutter = function (dur) {
    if (!ok()) return; const t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = noiseB; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 650; f.Q.value = 0.8;
    const g = ctx.createGain(); g.gain.value = 0;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 24; const lg = ctx.createGain(); lg.gain.value = 0.16; lfo.connect(lg); lg.connect(g.gain);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.18, t + 0.1); g.gain.setValueAtTime(0.18, t + dur - 0.2); g.gain.linearRampToValueAtTime(0, t + dur);
    s.connect(f); f.connect(g); g.connect(sfx); s.start(t); lfo.start(t); s.stop(t + dur + 0.1); lfo.stop(t + dur + 0.1);
    osc('sine', 70, t + dur - 0.05, 0.005, 0.4, 0.2);
  };
  // 네온 지지직 + 웅
  A.neon = function () { if (!ok()) return; const t = ctx.currentTime; for (let i = 0; i < 6; i++) noise(t + i * 0.08, 0.035, 0.14, 'bandpass', 180 * (i % 3 + 1), 4); osc('sawtooth', 60, t + 0.5, 0.08, 0.025, 1.4); };
  // 바람 인형 송풍기 위잉
  A.blower = function () { if (!ok()) return; const t = ctx.currentTime; noise(t, 1.6, 0.08, 'lowpass', 300, 0.7, null, 600); osc('sawtooth', 55, t, 0.3, 0.03, 1.4, null, 90); };
  A.ui = function () { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.03, 0.22, 'bandpass', 900, 2); osc('sine', 520, t, 0.002, 0.1, 0.05); };
  A.clear = function () { if (!ok()) return; const t = ctx.currentTime; [523, 659, 784, 1046].forEach((f, i) => osc('triangle', f, t + i * 0.09, 0.006, 0.17, 0.35)); };
  A.fail = function () { if (!ok()) return; const t = ctx.currentTime; [392, 330, 262].forEach((f, i) => osc('triangle', f, t + i * 0.16, 0.01, 0.18, 0.3)); };
  A.fanfare = function () { if (!ok()) return; const t = ctx.currentTime; const n = [523, 659, 784, 1046, 784, 1046, 1318]; n.forEach((f, i) => { osc('triangle', f, t + i * 0.13, 0.01, 0.2, i === n.length - 1 ? 1.2 : 0.3); osc('sine', f / 2, t + i * 0.13, 0.01, 0.1, 0.3); }); };

  // 배경음: 느린 로커빌리(통통 튀는 베이스 + 2·4박 스네어 + 퉁기는 기타, 빠르기 132)
  let bgmT = 0, bar = 0, playing = false;
  const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const PROG = [40, 40, 45, 40, 47, 45, 40, 47]; // E E A E B A E B (근음, 미디)
  function pluck(f, t, d, v) {
    const o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.setValueAtTime(1800, t); fl.frequency.exponentialRampToValueAtTime(400, t + d); fl.Q.value = 3;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(fl); fl.connect(g); g.connect(bgm); o.start(t); o.stop(t + d + 0.05);
  }
  function sched() {
    if (!playing) return;
    const spb = 60 / 132;
    while (bgmT < ctx.currentTime + 1.2) {
      const r = PROG[bar % PROG.length];
      // 베이스: 근음·5도 걷기
      [0, 7, 12, 7, 0, 7, 9, 7].forEach((iv, i) => osc('triangle', mf(r + iv - 12), bgmT + i * spb * 0.5, 0.005, 0.16, spb * 0.42, bgm));
      // 스네어 2·4 + 하이햇 8분
      [1, 3].forEach((b) => noise(bgmT + b * spb, 0.12, 0.09, 'bandpass', 1500, 0.8, bgm));
      for (let i = 0; i < 8; i++) noise(bgmT + i * spb * 0.5, 0.03, 0.025, 'highpass', 1800, 1, bgm);
      // 기타: 엇박 퉁김(근음+5도+6도 번갈아)
      [0.5, 1.5, 2.5, 3.5].forEach((b, i) => { pluck(mf(r + 12), bgmT + b * spb, 0.22, 0.05); pluck(mf(r + 12 + (i % 2 ? 9 : 7)), bgmT + b * spb + 0.01, 0.22, 0.04); });
      // 두 마디마다 짧은 리프
      if (bar % 2 === 1) [r + 24, r + 27, r + 28, r + 31].forEach((n, i) => pluck(mf(n - 12), bgmT + (2 + i * 0.5) * spb, 0.3, 0.04));
      bgmT += 4 * spb; bar++;
    }
    setTimeout(sched, 300);
  }
  A.startBgm = function () { if (!ok() || playing) return; playing = true; bgmT = ctx.currentTime + 0.1; sched(); };
})();
