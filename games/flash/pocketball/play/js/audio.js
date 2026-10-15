// 소리: 공·쿠션·포켓·큐·브레이크 소리는 Pixabay 녹음(sfx.js), 없으면 짧은 합성. 보상음·배경음은 코드(마림바·첼레스타·부드러운 화음).
// 규칙: 보상음은 사인·삼각파만, 4kHz 위는 거르고, 장조 5음계 안의 음만. 크게 하려면 음 높이 말고 음 수·화음·길이로.
(function () {
  const A = (window.AU = {});
  let ctx = null, sfx = null, mus = null, bus = null;
  const buf = {};
  const load = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v === '1'; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) {} };
  A.snd = load('pocketball.snd', true);
  A.bgm = load('pocketball.bgm', true);
  const SV = 0.9, MV = 0.14;
  let rs = 12345; const rnd = () => ((rs = (rs * 16807) % 2147483647) - 1) / 2147483646; // 소리 쪽 난수는 따로(게임 물리 난수와 섞이지 않게)

  // 효과음 버스: 소리 → (바로 + 짧은 잔향) → 4kHz 아래만 → 눌러 주기 → 출력
  function makeBus(ac, dest) {
    const input = ac.createGain();
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4000; lp.Q.value = 0.5;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    const len = Math.floor(ac.sampleRate * 1.0), ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let s = 12345 + c * 777; for (let i = 0; i < len; i++) { s = (s * 16807) % 2147483647; d[i] = ((s / 2147483647) * 2 - 1) * Math.pow(1 - i / len, 3.2); } }
    const rev = ac.createConvolver(); rev.buffer = ir;
    const wet = ac.createGain(); wet.gain.value = 0.14;
    const revLp = ac.createBiquadFilter(); revLp.type = 'lowpass'; revLp.frequency.value = 2500;
    input.connect(lp); input.connect(rev); rev.connect(revLp); revLp.connect(wet); wet.connect(lp);
    lp.connect(comp); comp.connect(dest);
    return input;
  }
  function ensure() {
    if (ctx) return ctx;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    sfx = ctx.createGain(); sfx.gain.value = A.snd ? SV : 0; sfx.connect(ctx.destination);
    bus = makeBus(ctx, sfx);
    mus = ctx.createGain(); mus.gain.value = A.bgm ? MV : 0; mus.connect(ctx.destination);
    const D = window.SFXDATA || {};
    Object.keys(D).forEach((k) => {
      const bin = atob(D[k]), u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      try { ctx.decodeAudioData(u.buffer, (b) => (buf[k] = b), () => {}); } catch (e) {}
    });
    return ctx;
  }
  A.unlock = function () { if (!ensure()) return; if (ctx.state === 'suspended') ctx.resume(); if (!timer) startMusic(); };
  A.setSnd = function (v) { A.snd = v; save('pocketball.snd', v); if (sfx) sfx.gain.value = v ? SV : 0; };
  A.setBgm = function (v) { A.bgm = v; save('pocketball.bgm', v); if (mus) mus.gain.value = v ? MV : 0; };

  // ── 악기
  function voice(ac, out, f, t, o) {
    const g = ac.createGain(); g.connect(out);
    const att = o.att || 0.005, dur = o.dur || 0.5, vol = o.vol || 0.3;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + att + dur);
    (o.parts || [[1, 1, 1]]).forEach(([ratio, amp, decK]) => {
      const osc = ac.createOscillator(), pg = ac.createGain();
      osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f * ratio, t);
      if (o.glide) osc.frequency.exponentialRampToValueAtTime(o.glide * ratio, t + dur);
      pg.gain.setValueAtTime(amp, t);
      if (decK < 1) pg.gain.exponentialRampToValueAtTime(Math.max(0.0001, amp * 0.001), t + att + dur * decK);
      osc.connect(pg); pg.connect(g); osc.start(t); osc.stop(t + att + dur + 0.05);
    });
  }
  const mallet = (ac, out, f, t, vol, dur) => voice(ac, out, f, t, { vol, dur: dur || 0.45, att: 0.004, parts: [[1, 1, 1], [4, 0.12, 0.12], [2, 0.18, 0.35]] });
  const bell = (ac, out, f, t, vol, dur) => voice(ac, out, f, t, { vol, dur: dur || 1.0, att: 0.006, parts: [[1, 1, 1], [2, 0.22, 0.45], [3, 0.06, 0.25]] });
  function pad(ac, out, fs, t, vol, dur) {
    fs.forEach((f) => {
      const o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
      o.type = 'triangle'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 1400;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol / fs.length, t + 0.12);
      g.gain.setValueAtTime(vol / fs.length, t + dur * 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
    });
  }
  const M = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // 보상·알림음(사인·삼각파, 장조 안의 음만)
  function synth(ac, out, name, n, t) {
    switch (name) {
      case 'pot':      // 내 공이 들어감: 마림바 둘(연속이면 한 음씩 올라감)
        { const b = 72 + [0, 2, 4, 7, 9, 12, 14, 16][Math.min(7, n || 0)];
          mallet(ac, out, M(b), t, 0.32, 0.45); mallet(ac, out, M(b + 7), t + 0.08, 0.26, 0.6); }
        break;
      case 'great':    // 한 번에 둘 이상
        [72, 76, 79, 84].forEach((m, j) => mallet(ac, out, M(m), t + j * 0.07, 0.3, 0.5));
        bell(ac, out, M(88), t + 0.28, 0.2, 1.1);
        break;
      case 'foul':     // 낮고 둥근 "통-통"
        voice(ac, out, 220, t, { vol: 0.34, dur: 0.22, att: 0.006, glide: 150, parts: [[1, 1, 1], [2, 0.15, 0.3]] });
        voice(ac, out, 180, t + 0.18, { vol: 0.3, dur: 0.3, att: 0.006, glide: 120, parts: [[1, 1, 1], [2, 0.12, 0.3]] });
        break;
      case 'win':      // 프레임 승리: 올라가는 화음 + 첼레스타
        [60, 64, 67, 72, 76].forEach((m, j) => mallet(ac, out, M(m), t + j * 0.09, 0.32, 0.6));
        pad(ac, out, [M(48), M(55), M(60), M(64)], t + 0.3, 0.26, 2.2);
        bell(ac, out, M(84), t + 0.5, 0.22, 1.6);
        break;
      case 'lose':
        [67, 64, 60, 55].forEach((m, j) => mallet(ac, out, M(m), t + j * 0.16, 0.26, 0.6));
        pad(ac, out, [M(43), M(50), M(55)], t + 0.4, 0.2, 1.8);
        break;
      case 'flip': mallet(ac, out, M(79), t, 0.18, 0.25); break;
      case 'gold':     // 금테: 첼레스타가 위로 쏟아짐
        [76, 79, 84, 88, 91].forEach((m, j) => bell(ac, out, M(m), t + j * 0.06, 0.2, 1.2));
        pad(ac, out, [M(60), M(64), M(67), M(72)], t + 0.2, 0.22, 2.2);
        break;
      case 'pick':
        [67, 72, 76].forEach((m, j) => mallet(ac, out, M(m), t + j * 0.07, 0.3, 0.5));
        break;
      case 'turn': mallet(ac, out, M(67), t, 0.14, 0.3); mallet(ac, out, M(74), t + 0.07, 0.12, 0.35); break;
      case 'champ':
        [60, 64, 67, 72, 76, 79, 84].forEach((m, j) => mallet(ac, out, M(m), t + j * 0.1, 0.32, 0.7));
        pad(ac, out, [M(48), M(55), M(60), M(64), M(67)], t + 0.5, 0.3, 3.2);
        [84, 88, 91, 96].forEach((m, j) => bell(ac, out, M(m), t + 0.8 + j * 0.12, 0.18, 1.6));
        break;
    }
  }
  A.synth = synth; A.makeBus = makeBus;

  // 녹음이 없을 때 쓰는 짧은 물리 소리(낮은 대역 위주)
  function noiseBurst(ac, out, t, f, q, dur, vol) {
    const n = Math.floor(ac.sampleRate * (dur + 0.02)), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (rnd() * 2 - 1) * Math.exp(-i / (ac.sampleRate * dur * 0.3));
    const s = ac.createBufferSource(); s.buffer = b;
    const fl = ac.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = q;
    const g = ac.createGain(); g.gain.value = vol;
    s.connect(fl); fl.connect(g); g.connect(out); s.start(t);
  }
  function physSynth(ac, out, name, v, t) {
    v = Math.min(1, v);
    switch (name) {
      case 'ball': noiseBurst(ac, out, t, 1900, 2.5, 0.025, 0.9 * v); voice(ac, out, 1650, t, { vol: 0.16 * v, dur: 0.035, att: 0.001 }); break;
      case 'rail': noiseBurst(ac, out, t, 260, 1.2, 0.06, 0.9 * v); voice(ac, out, 110, t, { vol: 0.25 * v, dur: 0.07, att: 0.002 }); break;
      case 'pocket': noiseBurst(ac, out, t, 420, 1.5, 0.08, 0.8); noiseBurst(ac, out, t + 0.09, 300, 1.5, 0.08, 0.5); noiseBurst(ac, out, t + 0.16, 900, 3, 0.03, 0.25); break;
      case 'cue': noiseBurst(ac, out, t, 1200, 2, 0.03, 0.7 * v + 0.2); voice(ac, out, 760, t, { vol: 0.14 * v + 0.05, dur: 0.04, att: 0.001 }); break;
      case 'click': noiseBurst(ac, out, t, 1500, 3, 0.015, 0.5); break;
    }
  }

  function smp(name, vol, rate) {
    const b = buf[name]; if (!b) return null;
    const s = ctx.createBufferSource(); s.buffer = b; if (rate) s.playbackRate.value = rate;
    const g = ctx.createGain(); g.gain.value = vol == null ? 1 : vol;
    s.connect(g); g.connect(bus); s.start();
    return s;
  }
  const last = {};
  function gate(k, ms) { const t = performance.now(); if (last[k] && t - last[k] < ms) return false; last[k] = t; return true; }
  // 물리 소리: v = 부딪힌 빠르기(m/s)
  A.hit = function (type, v) {
    if (!ctx || !A.snd) return;
    const vol = Math.min(1, Math.pow(v / 3, 0.75));
    if (vol < 0.03) return;
    if (type === 'ball' && performance.now() < brkUntil) return;   // 브레이크 녹음이 우르르를 대신 낸다
    if (!gate(type, type === 'ball' ? 18 : 30)) return;
    const key = type === 'ball' ? (rnd() < 0.5 ? 'ball' : 'ball2') : type;
    if (smp(key, type === 'ball' ? vol * 0.85 : vol, 0.95 + rnd() * 0.1)) return;
    physSynth(ctx, bus, type, vol, ctx.currentTime + 0.005);
  };
  let brkUntil = 0;
  A.play = function (name, v) {
    if (!ctx || !A.snd) return;
    if (name === 'brk') { if (smp('brk', 0.75)) brkUntil = performance.now() + 900; return; }
    if (name === 'pocket') { if (!smp(rnd() < 0.5 ? 'pocket' : 'pocket2', 0.85)) physSynth(ctx, bus, 'pocket', 0.7, ctx.currentTime + 0.005); return; }
    if (name === 'click' || name === 'cue') { if (!smp(name, name === 'cue' ? 0.35 + (v || 0.5) * 0.65 : 0.8)) physSynth(ctx, bus, name, v == null ? 0.7 : v, ctx.currentTime + 0.005); return; }
    synth(ctx, bus, name, v, ctx.currentTime + 0.01);
  };

  // ── 배경음: 볼링 틀(스케줄러 + 북·햇·스네어 + 옥타브 베이스 + 화음 스탭 + 가끔 가락), 당구장답게 104bpm 펑키 라운지
  //   진행 Dm7 - G7 - Cmaj7 - A7. 전부 3kHz 아래만 남겨 귀가 편하게
  let timer = null, step = 0, next = 0, noise = null, mlp = null;
  function noiseBuf() { if (noise) return noise; const n = ctx.sampleRate, b = ctx.createBuffer(1, n, n), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = rnd() * 2 - 1; return (noise = b); }
  function musOut() { if (mlp && mlp.context === ctx) return mlp; mlp = ctx.createBiquadFilter(); mlp.type = 'lowpass'; mlp.frequency.value = 3000; mlp.connect(mus); return mlp; }
  function tone(f, t0, dur, type, vol, opt) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'triangle'; o.frequency.setValueAtTime(f, t0);
    if (opt && opt.f2) o.frequency.exponentialRampToValueAtTime(opt.f2, t0 + dur);
    let dest = g;
    if (opt && opt.lp) { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = opt.lp; o.connect(lp); lp.connect(g); } else o.connect(g);
    if (opt && opt.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 5.5; lg.gain.value = f * 0.01; l.connect(lg); lg.connect(o.frequency); l.start(t0 + 0.1); l.stop(t0 + dur + 0.05); }
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.006);
    g.gain.setValueAtTime(vol, t0 + dur * 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    g.connect(musOut()); o.start(t0); o.stop(t0 + dur + 0.05);
    return dest;
  }
  function hitN(t0, type, f, dur, vol) {
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf(); fl.type = type; fl.frequency.value = f; if (type === 'bandpass') fl.Q.value = 0.9;
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(fl); fl.connect(g); g.connect(musOut()); s.start(t0, rnd() * 0.5); s.stop(t0 + dur + 0.02);
  }
  const ROOT = [38, 43, 36, 45];                                      // D G C A
  const CH = [[57, 60, 64, 65], [55, 59, 62, 65], [55, 59, 64, 67], [57, 61, 64, 67]]; // Dm7(9) G7 Cmaj7 A7
  // 가락: 16스텝 한 마디, -1 쉼. 4마디 두 번째 돌 때만 들어온다
  const LEAD = [
    [74, -1, 72, -1, 69, -1, 72, 74, -1, -1, 77, -1, 76, -1, 74, -1],
    [71, -1, -1, 74, -1, 77, -1, 79, -1, 77, 74, -1, 71, -1, -1, -1],
    [72, -1, 76, -1, 79, -1, 76, -1, 83, -1, -1, 81, 79, -1, 76, -1],
    [73, -1, 76, -1, 79, -1, 81, -1, 79, -1, 76, -1, 73, -1, -1, -1],
  ];
  const S16 = 60 / 104 / 4;
  function sched(t, step) {
    const s = step % 16, bar = Math.floor(step / 16) % 4, cyc = Math.floor(step / 64) % 2;
    const sw = s % 2 === 1 ? S16 * 0.18 : 0;                          // 살짝 스윙
    t += sw;
    if (s === 0 || s === 6 || s === 10) tone(140, t, 0.12, 'sine', 0.3, { f2: 46 });         // 북
    if (s % 2 === 0) hitN(t, 'highpass', 5000, 0.035, s % 4 === 2 ? 0.05 : 0.03);              // 칙
    if (s === 4 || s === 12) hitN(t, 'bandpass', 1700, 0.11, 0.15);                            // 짝
    const r = ROOT[bar];
    if (s % 2 === 0) tone(M(r + (s % 4 === 2 ? 12 : 0)), t, 0.16, 'sawtooth', 0.075, { lp: 650 }); // 옥타브 베이스
    if (s === 3 || s === 6 || s === 11) CH[bar].forEach((m) => tone(M(m), t, 0.16, 'triangle', 0.052));   // 화음 스탭(일렉 피아노 느낌)
    if (cyc === 1) {
      const m = LEAD[bar][s];
      if (m > 0) { let n = 1; while (s + n < 16 && LEAD[bar][s + n] === -1 && n < 3) n++; tone(M(m), t, S16 * n * 0.95, 'triangle', 0.11, { vib: n > 1 }); }
    }
  }
  function startMusic() {
    next = ctx.currentTime + 0.15;
    timer = setInterval(() => {
      if (!A.bgm || ctx.state !== 'running') { next = ctx.currentTime + 0.15; return; }
      while (next < ctx.currentTime + 0.2) { sched(next, step); next += S16; step++; }
    }, 40);
  }
  // 시험용: 배경음을 오프라인으로 그림(스피커로 안 나감)
  A.renderMusic = async function (sec) {
    const keep = [ctx, mus, noise, mlp], sr = 22050;
    ctx = new OfflineAudioContext(1, sr * sec, sr); noise = null; mus = ctx.createGain(); mus.gain.value = 1; mus.connect(ctx.destination);
    for (let i = 0, t = 0; t < sec - 0.5; i++, t += S16) sched(t + 0.01, i);
    const out = await ctx.startRendering();
    [ctx, mus, noise, mlp] = keep;
    return out.getChannelData(0);
  };
})();
