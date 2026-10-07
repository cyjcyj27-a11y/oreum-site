// 소리: 배경음과 효과음을 같은 악기(마림바·첼레스타·부드러운 화음)로 코드에서 만든다.
// 2026-10-07 사장님 "임팩트 주려고 만드는 게 항상 긁는 찢어지는 소리" → 옛 효과음(동전·반짝이 녹음을 높여 겹친 것)은
// 실제 밝기가 5,000~11,000Hz 였다. 편한 소리는 1,000~2,000Hz. 그래서 사인·삼각파만, 4kHz 위는 거르고,
// 시작은 살짝 부드럽게·끝은 천천히, 장조 5음계 안의 음만 쓴다. 녹음은 단추·카드·셔플·고양이(평범한 소리)만.
(function () {
  const A = (window.AU = {});
  let ctx = null, sfx = null, mus = null;
  const buf = {};
  const load = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v === '1'; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) {} };
  A.snd = load('hiddenpic.snd', true);
  A.bgm = load('hiddenpic.bgm', true);
  const SV = 0.9, MV = 0.15;

  // 효과음 버스: 소리 → (바로 + 잔향) → 4kHz 아래만 → 눌러 주기(갑자기 커지지 않게) → 출력
  function makeBus(ac, dest) {
    const input = ac.createGain();
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4000; lp.Q.value = 0.5;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    // 짧은 방 울림(잔향)
    const len = Math.floor(ac.sampleRate * 1.2), ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let s = 12345 + c * 777; for (let i = 0; i < len; i++) { s = (s * 16807) % 2147483647; d[i] = ((s / 2147483647) * 2 - 1) * Math.pow(1 - i / len, 3.2); } }
    const rev = ac.createConvolver(); rev.buffer = ir;
    const wet = ac.createGain(); wet.gain.value = 0.16;
    const revLp = ac.createBiquadFilter(); revLp.type = 'lowpass'; revLp.frequency.value = 2500;
    input.connect(lp);
    input.connect(rev); rev.connect(revLp); revLp.connect(wet); wet.connect(lp);
    lp.connect(comp); comp.connect(dest);
    return input;
  }

  function ensure() {
    if (ctx) return ctx;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    sfx = ctx.createGain(); sfx.gain.value = A.snd ? SV : 0; sfx.connect(ctx.destination);
    A.bus = makeBus(ctx, sfx);
    mus = ctx.createGain(); mus.gain.value = A.bgm ? MV : 0; mus.connect(ctx.destination);
    const D = window.SFXDATA || {};
    Object.keys(D).forEach((k) => {
      const bin = atob(D[k]), u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      try { ctx.decodeAudioData(u.buffer, (b) => (buf[k] = b), () => {}); } catch (e) {}
    });
    return ctx;
  }
  A.unlock = function () {
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (!timer) startMusic();
  };
  A.setSnd = function (v) { A.snd = v; save('hiddenpic.snd', v); if (sfx) sfx.gain.value = v ? SV : 0; };
  A.setBgm = function (v) { A.bgm = v; save('hiddenpic.bgm', v); if (mus) mus.gain.value = v ? MV : 0; };

  // ── 악기
  // 한 음: 사인 바탕 + 배음 몇 개(배음은 더 빨리 사라진다). 시작 4~8ms 로 부드럽게
  function voice(ac, out, f, t, o) {
    const g = ac.createGain();
    g.connect(out);
    const att = o.att || 0.005, dur = o.dur || 0.5, vol = o.vol || 0.3;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + att);
    g.gain.exponentialRampToValueAtTime(0.0001, t + att + dur);
    (o.parts || [[1, 1, 1]]).forEach(([ratio, amp, decK]) => {
      const osc = ac.createOscillator(), pg = ac.createGain();
      osc.type = o.type || 'sine';
      osc.frequency.setValueAtTime(f * ratio, t);
      if (o.glide) osc.frequency.exponentialRampToValueAtTime(o.glide * ratio, t + dur);
      pg.gain.setValueAtTime(amp, t);
      if (decK < 1) pg.gain.exponentialRampToValueAtTime(Math.max(0.0001, amp * 0.001), t + att + dur * decK);
      osc.connect(pg); pg.connect(g);
      osc.start(t); osc.stop(t + att + dur + 0.05);
    });
  }
  const mallet = (ac, out, f, t, vol, dur) => voice(ac, out, f, t, { vol, dur: dur || 0.45, att: 0.004, parts: [[1, 1, 1], [4, 0.12, 0.12], [2, 0.18, 0.35]] });   // 마림바
  const bell = (ac, out, f, t, vol, dur) => voice(ac, out, f, t, { vol, dur: dur || 1.0, att: 0.006, parts: [[1, 1, 1], [2, 0.22, 0.45], [3, 0.06, 0.25]] });   // 첼레스타
  function pad(ac, out, fs, t, vol, dur) {   // 부드러운 화음(천천히 피었다 진다)
    fs.forEach((f) => {
      const o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
      o.type = 'triangle'; o.frequency.value = f;
      lp.type = 'lowpass'; lp.frequency.value = 1400;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol / fs.length, t + 0.12);
      g.gain.setValueAtTime(vol / fs.length, t + dur * 0.5);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(lp); lp.connect(g); g.connect(out);
      o.start(t); o.stop(t + dur + 0.05);
    });
  }
  const M = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const PENTA = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93];   // 도 레 미 솔 라 (C5~)
  const FOUND = [67, 69, 72, 74, 76, 79, 81, 84, 86, 88];   // 같은 음계를 솔(G4)부터 — 맨 위 미(E6)

  // 효과음 하나를 ac 의 out 으로(시험 때는 오프라인 문맥에서도 그대로 쓴다)
  function synth(ac, out, name, n, t) {
    n = n || 0;
    switch (name) {
      case 'found': {   // 찾을수록 한 칸씩 올라가는 두 음 "띵-동" — 10/7 사장님 "음이 너무 높다" → 도(C5) 대신 솔(G4)부터
        const i = Math.min(n, 7);
        mallet(ac, out, M(FOUND[i]), t, 0.42);
        mallet(ac, out, M(FOUND[i + 2]), t + 0.08, 0.36, 0.6);
        break;
      }
      case 'land': mallet(ac, out, M(67), t, 0.22, 0.2); break;   // 목록에 톡
      case 'combo': [0, 2, 4].forEach((k, j) => bell(ac, out, M(PENTA[Math.min(5, n % 4) + k]), t + j * 0.07, 0.24, 0.7)); break;
      case 'miss':   // 낮고 둥근 "통" (삑 소리 아님)
        voice(ac, out, 260, t, { vol: 0.42, dur: 0.22, att: 0.006, glide: 170, parts: [[1, 1, 1], [2, 0.15, 0.3]] });
        mallet(ac, out, M(43), t, 0.18, 0.3);
        break;
      case 'guard': bell(ac, out, M(79), t, 0.26, 0.5); bell(ac, out, M(84), t + 0.05, 0.2, 0.6); break;
      case 'hint': [0, 2, 4, 6].forEach((k, j) => bell(ac, out, M(PENTA[k]), t + j * 0.075, 0.22, 0.9)); break;
      case 'nohint': mallet(ac, out, M(64), t, 0.26, 0.2); mallet(ac, out, M(60), t + 0.12, 0.26, 0.3); break;
      case 'clear':
        [60, 64, 67, 72].forEach((m, j) => mallet(ac, out, M(m + 12), t + j * 0.11, 0.36, 0.5));
        bell(ac, out, M(84), t + 0.44, 0.24, 1.4);
        pad(ac, out, [M(48), M(52), M(55), M(60)], t + 0.4, 0.22, 1.8);
        break;
      case 'star': bell(ac, out, M([84, 88, 91][Math.min(2, n)]), t, 0.3, 0.9); break;
      case 'over':
        [67, 64, 60, 55].forEach((m, j) => mallet(ac, out, M(m), t + j * 0.18, 0.32, 0.6));
        pad(ac, out, [M(45), M(48), M(52)], t + 0.5, 0.16, 1.6);
        break;
      case 'gold':   // 금테: 맑은 아르페지오 + 따뜻한 화음
        [72, 76, 79, 84, 88].forEach((m, j) => bell(ac, out, M(m), t + j * 0.07, 0.26, 1.1));
        pad(ac, out, [M(60), M(64), M(67), M(72)], t + 0.3, 0.24, 2.0);
        break;
      case 'shine': pad(ac, out, [M(79), M(84)], t, 0.1, 0.7); break;   // 금테가 열리기 직전 은은히
      case 'tick': voice(ac, out, 1100, t, { vol: 0.22, dur: 0.05, att: 0.002 }); break;   // 나무 똑
      case 'end':
        [60, 64, 67, 72, 76, 79, 84].forEach((m, j) => mallet(ac, out, M(m + 12), t + j * 0.1, 0.32, 0.6));
        pad(ac, out, [M(48), M(55), M(60), M(64)], t + 0.6, 0.26, 2.6);
        break;
    }
  }
  A.synth = synth;
  A.makeBus = makeBus;

  function smp(name, vol) {
    const b = buf[name];
    if (!b) return;
    const s = ctx.createBufferSource();
    s.buffer = b;
    const g = ctx.createGain();
    g.gain.value = vol == null ? 1 : vol;
    s.connect(g); g.connect(sfx);
    s.start();
  }
  const last = {};
  function gate(k, ms) { const t = performance.now(); if (last[k] && t - last[k] < ms) return false; last[k] = t; return true; }

  A.play = function (name, n) {
    if (!ensure() || !A.snd) return;
    switch (name) {
      case 'click': smp('clk', 0.6); return;   // 평범한 녹음(단추·카드·셔플·고양이)
      case 'flip': smp('flip', 0.8); return;
      case 'deal': smp('shuf', 0.7); return;
      case 'cat': smp('meow', 0.8); return;
      case 'zoom': return;   // 확대할 때 소리는 귀찮아서 뺐다
      case 'land': if (!gate('land', 60)) return; break;
    }
    synth(ctx, A.bus, name, n, ctx.currentTime + 0.01);
  };
  // ── 배경음: 살금살금(피치카토 베이스 + 첼레스타 가락), 4마디 되풀이 두 갈래
  let timer = null, step = 0, next = 0;
  function tone(f, t0, dur, type, vol, f2) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(mus);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
  // D 단조 느낌: Dm7 - G7 - Cmaj7 - A7
  const BASS = [[38, 45, 41, 45], [43, 50, 47, 50], [36, 43, 40, 43], [33, 40, 37, 40]];
  const MEL = [
    [74, -1, 77, 76, -1, 74, 72, -1], [71, -1, 74, -1, 77, 76, 74, -1], [72, -1, 76, 79, -1, 76, 72, -1], [73, -1, 76, -1, 79, -1, 77, 76],
    [74, 77, 81, -1, 79, 77, 76, -1], [77, -1, 74, 71, -1, 74, 77, 79], [76, -1, 72, -1, 79, -1, 76, 72], [73, 76, 79, 81, -1, 79, -1, -1],
  ];
  function startMusic() {
    next = ctx.currentTime + 0.15;
    timer = setInterval(() => {
      if (!A.bgm || ctx.state !== 'running') { next = ctx.currentTime + 0.15; return; }
      while (next < ctx.currentTime + 0.4) {
        const len = 0.22;
        const bar = Math.floor(step / 8) % 8, beat = step % 8;
        const swing = beat % 2 ? 0.045 : 0;
        const t = next + swing;
        if (beat % 2 === 0) {
          const f = midi(BASS[bar % 4][beat / 2]);
          tone(f, t, 0.32, 'triangle', 0.32);
          tone(f * 2, t, 0.12, 'sine', 0.06);
        }
        if (beat === 2 || beat === 6) { tone(2600, t, 0.04, 'square', 0.012); }   // 살짝 손가락 튕김
        const m = MEL[bar][beat];
        if (m > 0) {
          tone(midi(m), t, 0.55, 'sine', 0.13);
          tone(midi(m) * 4, t, 0.18, 'sine', 0.02);
          tone(midi(m) * 3, t, 0.25, 'triangle', 0.015);
        }
        next += len;
        step++;
      }
    }, 90);
  }
  A.ctx = () => ctx;
})();
