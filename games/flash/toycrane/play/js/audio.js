// 소리: 효과음 녹음(sfx.js, Pixabay 평범한 기계 소리) + 보상음·배경음은 코드(마림바·첼레스타·부드러운 화음).
// 규칙: 보상음은 사인·삼각파만, 4kHz 위는 거르고, 장조 5음계 안의 음만. 크게 하려면 음 높이 말고 음 수·화음·길이로.
(function () {
  const A = (window.AU = {});
  let ctx = null, sfx = null, mus = null, bus = null;
  const buf = {};
  const load = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v === '1'; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) {} };
  A.snd = load('toycrane.snd', true);
  A.bgm = load('toycrane.bgm', true);
  const SV = 0.9, MV = 0.14;

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
  A.setSnd = function (v) { A.snd = v; save('toycrane.snd', v); if (sfx) sfx.gain.value = v ? SV : 0; if (!v) A.motor(0); };
  A.setBgm = function (v) { A.bgm = v; save('toycrane.bgm', v); if (mus) mus.gain.value = v ? MV : 0; };

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

  // 보상·알림음(시험 때 오프라인 문맥에서도 그대로 쓴다)
  function synth(ac, out, name, n, t) {
    switch (name) {
      case 'get':      // 인형이 구멍에 쏙: 올라가는 마림바 셋 + 첼레스타 + 따뜻한 화음
        [67, 72, 76].forEach((m, j) => mallet(ac, out, M(m), t + j * 0.09, 0.38, 0.5));
        bell(ac, out, M(79), t + 0.27, 0.26, 1.2);
        pad(ac, out, [M(48), M(55), M(60), M(64)], t + 0.2, 0.22, 1.6);
        break;
      case 'newdex':   // 도감에 새 인형: 첼레스타 아르페지오 한 바퀴 더
        [72, 76, 79, 84, 88].forEach((m, j) => bell(ac, out, M(m), t + j * 0.08, 0.24, 1.1));
        pad(ac, out, [M(60), M(64), M(67), M(72)], t + 0.3, 0.22, 2.0);
        break;
      case 'refill':   // 새 인형이 쏟아짐: 마림바가 위에서 아래로 굴러 내려온다
        [84, 81, 79, 76, 74, 72, 69, 67, 64, 60].forEach((m, j) => mallet(ac, out, M(m), t + j * 0.07, 0.3, 0.35));
        pad(ac, out, [M(48), M(52), M(55), M(60)], t + 0.5, 0.2, 1.8);
        break;
      case 'tick': voice(ac, out, 880, t, { vol: 0.2, dur: 0.06, att: 0.002, parts: [[1, 1, 1], [2, 0.1, 0.3]] }); break;   // 남은 시간 똑
      case 'miss':     // 놓쳤을 때 낮고 둥근 "통"
        voice(ac, out, 240, t, { vol: 0.34, dur: 0.24, att: 0.006, glide: 160, parts: [[1, 1, 1], [2, 0.15, 0.3]] });
        break;
    }
  }
  A.synth = synth; A.makeBus = makeBus;

  function smp(name, vol, rate) {
    const b = buf[name]; if (!b) return null;
    const s = ctx.createBufferSource(); s.buffer = b; if (rate) s.playbackRate.value = rate;
    const g = ctx.createGain(); g.gain.value = vol == null ? 1 : vol;
    s.connect(g); g.connect(bus); s.start();
    return s;
  }
  const last = {};
  function gate(k, ms) { const t = performance.now(); if (last[k] && t - last[k] < ms) return false; last[k] = t; return true; }
  A.play = function (name, v) {
    if (!ensure() || !A.snd) return;
    switch (name) {
      case 'click': smp('clk', 0.55); return;
      case 'clamp': smp('clamp', v == null ? 0.8 : v); return;
      case 'clunk': smp('clunk', 0.9); smp('thud', 0.45, 0.8); return;
      case 'thud': if (gate('thud', 70)) smp('thud', v == null ? 0.7 : v, 0.9 + Math.random() * 0.1); return;
    }
    synth(ctx, bus, name, v, ctx.currentTime + 0.01);
  };

  // ── 집게 모터: 실제 모터 녹음을 작게 깔고, 위에 오락실 8비트 소리를 얹는다(사장님 10/13 "조금만 더 레트로하게 재밌게")
  //   옆으로 갈 때 = 도미솔미 "또로로로" 빠른 아르페지오, 내려갈 때 = "뿌우-" 내려가는 미끄럼, 올라올 때 = 올라가는 미끄럼
  //   네모파지만 1.6kHz 아래만 남겨 귀가 편하게
  let mot = null, motG = null, chip = null, chipG = null, chipT0 = 0;
  const ARP = [523.25, 659.25, 783.99, 659.25];
  A.motor = function (level, rate, mode) {
    if (!ctx || !buf.motor) return;
    const t = ctx.currentTime;
    if (!mot && level > 0 && A.snd) {
      motG = ctx.createGain(); motG.gain.value = 0.0001; motG.connect(bus);
      mot = ctx.createBufferSource(); mot.buffer = buf.motor; mot.loop = true; mot.loopStart = 0.1; mot.loopEnd = 3.9;
      mot.connect(motG); mot.start();
      chipG = ctx.createGain(); chipG.gain.value = 0.0001;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600; lp.Q.value = 0.7;
      chip = ctx.createOscillator(); chip.type = 'square'; chip.frequency.value = 523;
      chip.connect(lp); lp.connect(chipG); chipG.connect(bus); chip.start();
    }
    if (!mot) return;
    const on = A.snd && level > 0;
    motG.gain.setTargetAtTime(on ? level * 0.22 : 0.0001, t, 0.05);
    mot.playbackRate.setTargetAtTime(rate || 1, t, 0.08);
    if (!on) { chipG.gain.setTargetAtTime(0.0001, t, 0.03); chipT0 = t; return; }
    const k = t - chipT0;
    let f;
    if (mode === 'down') f = 620 - ((k * 1.6) % 1) * 300;        // 뿌우- 뿌우- 내려감
    else if (mode === 'up') f = 300 + ((k * 1.6) % 1) * 320;     // 올라감
    else f = ARP[Math.floor(k * 12) % 4] * (mode === 'home' ? 0.75 : 1); // 또로로로(돌아갈 땐 한 단 낮게)
    chip.frequency.setValueAtTime(f, t);
    chipG.gain.setTargetAtTime(0.055 * level, t, 0.02);
  };

  // ── 배경음: 8비트 오락실(사장님 10/13 "레트로하게 재밌게"). 140bpm, C - Am - F - G
  //   네모파 가락 + 세모파 베이스 + 빠른 화음 아르페지오 + 잡음 북. 전부 3.2kHz 아래만 남겨 귀가 편하게
  let timer = null, step = 0, next = 0, noise = null, mlp = null;
  function noiseBuf() { if (noise) return noise; const n = ctx.sampleRate, b = ctx.createBuffer(1, n, n), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return (noise = b); }
  function musOut() { if (mlp && mlp.context === ctx) return mlp; mlp = ctx.createBiquadFilter(); mlp.type = 'lowpass'; mlp.frequency.value = 3200; mlp.connect(mus); return mlp; }
  function tone(f, t0, dur, type, vol, opt) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t0);
    if (opt && opt.f2) o.frequency.exponentialRampToValueAtTime(opt.f2, t0 + dur);
    if (opt && opt.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 6; lg.gain.value = f * 0.012; l.connect(lg); lg.connect(o.frequency); l.start(t0 + 0.08); l.stop(t0 + dur + 0.05); }
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.004);
    g.gain.setValueAtTime(vol, t0 + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(musOut()); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function hit(t0, type, f, dur, vol) {
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf(); fl.type = type; fl.frequency.value = f; if (type === 'bandpass') fl.Q.value = 0.9;
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(fl); fl.connect(g); g.connect(musOut()); s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.02);
  }
  const CH = [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]]; // C Am F G
  // 가락(16스텝 = 한 마디, -1 쉼, 0 은 앞 음 이어서). 통통 튀는 오락실 가락 두 갈래
  const LEAD = [
    [[72, -1, 76, 79, -1, 76, 79, -1, 84, -1, 81, -1, 79, -1, 76, -1], [69, -1, 72, 76, -1, 72, 76, -1, 81, -1, 79, -1, 76, -1, 72, -1],
     [65, -1, 69, 72, -1, 69, 72, -1, 77, -1, 76, -1, 74, -1, 72, -1], [67, -1, 71, 74, -1, 71, 74, -1, 79, -1, 77, 76, 74, -1, 71, -1]],
    [[79, 79, -1, 76, -1, 72, -1, 76, 79, -1, 84, -1, -1, -1, 79, -1], [81, 81, -1, 76, -1, 72, -1, 76, 81, -1, 79, -1, -1, -1, 76, -1],
     [77, 77, -1, 74, -1, 69, -1, 74, 77, -1, 76, -1, 74, -1, 72, -1], [74, -1, 76, -1, 77, -1, 79, -1, 83, -1, 84, -1, -1, -1, -1, -1]],
  ];
  const S16 = 60 / 140 / 4;
  function sched(t, step) {
    const s = step % 16, bar = Math.floor(step / 16) % 4, cyc = Math.floor(step / 64) % 2, ch = CH[bar];
    if (s % 4 === 0) tone(130, t, 0.1, 'triangle', 0.3, { f2: 50 });             // 북(세모파 뚝 떨어짐)
    if (s % 2 === 1) hit(t, 'highpass', 6000, 0.03, 0.035);                       // 칙
    if (s === 4 || s === 12) hit(t, 'bandpass', 1500, 0.1, 0.16);                 // 짝
    if (s % 2 === 0) tone(M(ch[0] - 12 + (s % 4 === 2 ? 12 : 0)), t, 0.13, 'triangle', 0.2); // 세모파 옥타브 베이스
    tone(M(ch[s % 3] + 24), t, S16 * 0.9, 'square', 0.024);                       // 빠른 화음 아르페지오(작게)
    const m = LEAD[cyc][bar][s];
    if (m > 0) { let n = 1; while (s + n < 16 && LEAD[cyc][bar][s + n] === -1 && n < 3) n++; tone(M(m), t, S16 * n * 0.95, 'square', 0.1, { vib: n > 1 }); }
  }
  function startMusic() {
    next = ctx.currentTime + 0.15;
    timer = setInterval(() => {
      if (!A.bgm || ctx.state !== 'running') { next = ctx.currentTime + 0.15; return; }
      while (next < ctx.currentTime + 0.2) { sched(next, step); next += S16; step++; }
    }, 40);
  }
  // 시험용: 배경음 sec 초를 오프라인으로 그려 소리 데이터를 돌려준다(스피커로 안 나감)
  A.renderMusic = async function (sec) {
    const keep = [ctx, mus, noise, mlp], sr = 22050;
    ctx = new OfflineAudioContext(1, sr * sec, sr); noise = null; mus = ctx.createGain(); mus.gain.value = 1; mus.connect(ctx.destination);
    for (let i = 0, t = 0; t < sec - 0.5; i++, t += S16) sched(t + 0.01, i);
    const out = await ctx.startRendering();
    [ctx, mus, noise, mlp] = keep;
    return out.getChannelData(0);
  };
})();
