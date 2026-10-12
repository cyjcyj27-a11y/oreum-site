// 소리: 배경음과 효과음을 같은 악기(마림바·첼레스타·부드러운 화음)로 코드에서 만든다.
// 효과음 밝기는 2kHz 아래(메모 sfx-comfortable-synth): 사인·삼각파, 4kHz 위는 거르고, 장조 5음계 음만.
(function () {
  const A = (window.AU = {});
  let ctx = null, sfx = null, mus = null, noiseBuf = null;
  const load = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v === '1'; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) {} };
  A.snd = load('colormix.snd', true);
  A.bgm = load('colormix.bgm', true);
  const SV = 0.9, MV = 0.14;

  function makeBus(ac, dest) {
    const input = ac.createGain();
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4000; lp.Q.value = 0.5;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    const len = Math.floor(ac.sampleRate * 1.3), ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let s = 4242 + c * 911; for (let i = 0; i < len; i++) { s = (s * 16807) % 2147483647; d[i] = ((s / 2147483647) * 2 - 1) * Math.pow(1 - i / len, 3.4); } }
    const rev = ac.createConvolver(); rev.buffer = ir;
    const wet = ac.createGain(); wet.gain.value = 0.18;
    const revLp = ac.createBiquadFilter(); revLp.type = 'lowpass'; revLp.frequency.value = 2400;
    input.connect(lp); input.connect(rev); rev.connect(revLp); revLp.connect(wet); wet.connect(lp);
    lp.connect(comp); comp.connect(dest);
    return input;
  }
  function noise(ac) {
    if (noiseBuf && noiseBuf.sampleRate === ac.sampleRate) return noiseBuf;
    const n = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), d = n.getChannelData(0);
    let s = 99; for (let i = 0; i < d.length; i++) { s = (s * 16807) % 2147483647; d[i] = (s / 2147483647) * 2 - 1; }
    return (noiseBuf = n);
  }
  function ensure() {
    if (ctx) return ctx;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    sfx = ctx.createGain(); sfx.gain.value = A.snd ? SV : 0; sfx.connect(ctx.destination);
    A.bus = makeBus(ctx, sfx);
    mus = ctx.createGain(); mus.gain.value = A.bgm ? MV : 0; mus.connect(ctx.destination);
    return ctx;
  }
  A.unlock = function () { if (!ensure()) return; if (ctx.state === 'suspended') ctx.resume(); if (!timer) startMusic(); };
  A.setSnd = function (v) { A.snd = v; save('colormix.snd', v); if (sfx) sfx.gain.value = v ? SV : 0; };
  A.setBgm = function (v) { A.bgm = v; save('colormix.bgm', v); if (mus) mus.gain.value = v ? MV : 0; };

  function voice(ac, out, f, t, o) {
    const g = ac.createGain(); g.connect(out);
    const att = o.att || 0.005, dur = o.dur || 0.5, vol = o.vol || 0.3;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + att);
    g.gain.exponentialRampToValueAtTime(0.0001, t + att + dur);
    (o.parts || [[1, 1, 1]]).forEach(([ratio, amp, decK]) => {
      const osc = ac.createOscillator(), pg = ac.createGain();
      osc.type = o.type || 'sine';
      osc.frequency.setValueAtTime(f * ratio, t);
      if (o.glide) osc.frequency.exponentialRampToValueAtTime(o.glide * ratio, t + att + dur * (o.gk || 1));
      pg.gain.setValueAtTime(amp, t);
      if (decK < 1) pg.gain.exponentialRampToValueAtTime(Math.max(0.0001, amp * 0.001), t + att + dur * decK);
      osc.connect(pg); pg.connect(g);
      osc.start(t); osc.stop(t + att + dur + 0.05);
    });
  }
  // 걸러 낸 잡음 한 줌(붓질·물감 소리) — 대역 통과 중심은 늘 1.2kHz 아래
  function swish(ac, out, t, o) {
    const s = ac.createBufferSource(); s.buffer = noise(ac);
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = o.q || 1.2;
    bp.frequency.setValueAtTime(o.f0 || 500, t); bp.frequency.exponentialRampToValueAtTime(o.f1 || 900, t + o.dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(o.vol || 0.2, t + (o.att || 0.03));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    s.connect(bp); bp.connect(g); g.connect(out);
    s.start(t, Math.random() * 0.5); s.stop(t + o.dur + 0.05);
  }
  const mallet = (ac, out, f, t, vol, dur) => voice(ac, out, f, t, { vol, dur: dur || 0.45, att: 0.004, parts: [[1, 1, 1], [4, 0.1, 0.12], [2, 0.16, 0.35]] });
  const bell = (ac, out, f, t, vol, dur) => voice(ac, out, f, t, { vol, dur: dur || 1.0, att: 0.006, parts: [[1, 1, 1], [2, 0.2, 0.45], [3, 0.05, 0.25]] });
  function pad(ac, out, fs, t, vol, dur) {
    fs.forEach((f) => {
      const o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
      o.type = 'triangle'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 1300;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol / fs.length, t + 0.14);
      g.gain.setValueAtTime(vol / fs.length, t + dur * 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
    });
  }
  const M = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const PEN = [65, 67, 69, 72, 74, 77, 79, 81, 84, 86];   // 파 솔 라 도 레 (F장조 5음계)
  function synth(ac, out, name, n, t) {
    n = n || 0;
    switch (name) {
      case 'push': swish(ac, out, t, { dur: 0.16, f0: 420, f1: 820, vol: 0.12, q: 0.9 }); break;   // 방울이 미끄러짐
      case 'plop': {   // 철퍽: 물감 덩어리가 부딪혀 섞임 — 둥근 "뽁" + 젖은 잡음 + 한 음(섞을수록 올라감)
        const i = Math.min(n, 7);
        voice(ac, out, 330, t, { vol: 0.5, dur: 0.16, att: 0.004, glide: 120, parts: [[1, 1, 1], [1.5, 0.25, 0.4]] });
        swish(ac, out, t, { dur: 0.22, f0: 900, f1: 300, vol: 0.2, q: 0.8, att: 0.01 });
        mallet(ac, out, M(PEN[i]), t + 0.05, 0.3, 0.5);
        break;
      }
      case 'bump': voice(ac, out, 180, t, { vol: 0.3, dur: 0.12, att: 0.004, glide: 140 }); break;   // 끝에 닿아 멈춤(나무 툭)
      case 'match':   // 견본 색이 나옴
        [0, 2, 4].forEach((k, j) => bell(ac, out, M(PEN[3 + k]), t + j * 0.08, 0.26, 0.9));
        pad(ac, out, [M(53), M(57), M(60), M(65)], t + 0.15, 0.2, 1.4);
        break;
      case 'reveal':   // 그림 한 칸이 칠해짐: 긴 붓질 + 첼레스타 올라감
        swish(ac, out, t, { dur: 0.9, f0: 300, f1: 1000, vol: 0.16, q: 0.7, att: 0.12 });
        [0, 1, 2, 3, 4, 5].forEach((k) => bell(ac, out, M(PEN[2 + k]), t + 0.1 + k * 0.09, 0.16, 0.8));
        break;
      case 'star': bell(ac, out, M([77, 81, 84][Math.min(2, n)]), t, 0.3, 0.9); mallet(ac, out, M([65, 69, 72][Math.min(2, n)]), t, 0.2, 0.4); break;
      case 'over':
        [72, 69, 65, 60].forEach((m, j) => mallet(ac, out, M(m), t + j * 0.18, 0.3, 0.6));
        pad(ac, out, [M(50), M(53), M(57)], t + 0.5, 0.16, 1.6);
        break;
      case 'undo': mallet(ac, out, M(67), t, 0.2, 0.2); mallet(ac, out, M(60), t + 0.07, 0.2, 0.3); break;
      case 'click': voice(ac, out, 620, t, { vol: 0.22, dur: 0.06, att: 0.002, glide: 480, parts: [[1, 1, 1], [2.1, 0.2, 0.3]] }); break;   // 뚜껑 딸깍
      case 'flip': swish(ac, out, t, { dur: 0.14, f0: 600, f1: 1100, vol: 0.14 }); break;
      case 'card': mallet(ac, out, M(72), t, 0.28, 0.4); bell(ac, out, M(79), t + 0.06, 0.18, 0.6); break;
      case 'shine': pad(ac, out, [M(77), M(84)], t, 0.1, 0.8); break;
      case 'gold':
        [72, 77, 81, 84, 89].forEach((m, j) => bell(ac, out, M(m), t + j * 0.07, 0.24, 1.1));
        pad(ac, out, [M(53), M(60), M(65), M(69)], t + 0.3, 0.24, 2.0);
        break;
      case 'use': swish(ac, out, t, { dur: 0.3, f0: 350, f1: 700, vol: 0.18 }); mallet(ac, out, M(77), t + 0.05, 0.22, 0.5); break;
      case 'water': swish(ac, out, t, { dur: 0.5, f0: 700, f1: 300, vol: 0.18, q: 2 }); [0, 1, 2].forEach((k) => voice(ac, out, 500 + k * 140, t + 0.06 + k * 0.08, { vol: 0.14, dur: 0.12, glide: 900 + k * 120 })); break;
      case 'complete':
        [65, 69, 72, 77, 81, 84, 89].forEach((m, j) => mallet(ac, out, M(m), t + j * 0.1, 0.3, 0.6));
        [77, 81, 84].forEach((m, j) => bell(ac, out, M(m + 12), t + 0.75 + j * 0.12, 0.2, 1.4));
        pad(ac, out, [M(41), M(53), M(57), M(60), M(65)], t + 0.6, 0.28, 2.8);
        break;
    }
  }
  A.synth = synth;
  const last = {};
  A.play = function (name, n) {
    if (!ensure() || !A.snd) return;
    const tt = performance.now();
    if (last[name] && tt - last[name] < 40) return;
    last[name] = tt;
    synth(ctx, A.bus, name, n, ctx.currentTime + 0.01);
  };

  // ── 배경음: 3박자 왈츠(F장조) — 마림바 쿵·짝짝 + 첼레스타 가락, 8마디 두 갈래
  let timer = null, step = 0, next = 0;
  function tone(f, t0, dur, type, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(mus); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  // F - Dm - Bb - C / F - Am - Bb - C
  const CH = [[41, 57, 60, 65], [38, 57, 62, 65], [46, 58, 62, 65], [48, 55, 60, 64], [41, 57, 60, 65], [45, 57, 60, 64], [46, 58, 62, 65], [48, 55, 58, 64]];
  const MEL = [
    [72, -1, 74], [77, -1, 74], [74, 72, 70], [72, -1, -1], [69, -1, 72], [76, -1, 72], [74, 77, 79], [76, -1, -1],
    [81, -1, 79], [77, -1, 74], [74, 77, 74], [72, -1, 70], [69, 72, 76], [77, -1, 76], [74, -1, 70], [72, -1, -1],
  ];
  function startMusic() {
    next = ctx.currentTime + 0.15;
    timer = setInterval(() => {
      if (!A.bgm || ctx.state !== 'running') { next = ctx.currentTime + 0.15; return; }
      while (next < ctx.currentTime + 0.4) {
        const beatLen = 0.36, bar = Math.floor(step / 3) % 16, beat = step % 3, ch = CH[bar % 8], t = next;
        if (beat === 0) { tone(M(ch[0]), t, 0.5, 'triangle', 0.34); tone(M(ch[0] + 12), t, 0.16, 'sine', 0.05); }
        else ch.slice(1).forEach((m) => tone(M(m), t, 0.2, 'triangle', 0.05));
        const m = MEL[bar][beat];
        if (m > 0) { tone(M(m), t, 0.7, 'sine', 0.13); tone(M(m) * 2, t, 0.22, 'sine', 0.025); }
        next += beatLen; step++;
      }
    }, 90);
  }
})();
