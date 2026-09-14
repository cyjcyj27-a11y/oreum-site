// audio.js — 소리는 전부 코드로 만든다. 음악도 코드: 평소엔 산책 곡(시티팝 96), 싸울 땐 록 비트(158), 공원엔 바람·새소리
(function () {
  let ctx = null, master, sfxG, bgmG, ambG, songG, fightG, echoIn, gtrIn, nbuf, meowBuf = null;
  let mctx = null, mBgm = null;   // 음악 전용 소리 통로 (버퍼 넉넉히)
  let fighting = false, birdT = 2;
  const bufs = {};   // 녹음 소리: 강아지(사장님이 넣은 파일)
  const calm = { bpm: 96, next: 0, step: 0 };
  const bat = { bpm: 158, next: 0, step: 0 };
  const mf = n => 440 * Math.pow(2, (n - 69) / 12);

  function gain(v, dest) { const g = ctx.createGain(); g.gain.value = v; if (dest) g.connect(dest); return g; }
  function osc(type, f, t, end, dest, det) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; if (det) o.detune.value = det;
    if (dest) o.connect(dest); o.start(t); o.stop(end); return o;
  }
  function filt(type, f, q, dest) { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q || 0.7; if (dest) b.connect(dest); return b; }

  // 소리 길 짜기 (실제 재생과 미리 만들어 보기가 같이 쓴다)
  function build(c, live) {
    ctx = c;
    master = gain(0.9, c.destination);
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(master);
    sfxG = gain(T.sfx ? 0.9 : 0, comp);
    bgmG = gain(T.bgm ? 0.55 : 0, comp);
    ambG = gain(1, bgmG); songG = gain(1, bgmG); fightG = gain(0, bgmG);
    // 잔향·메아리·기타 찌그러뜨리기는 곡을 구울 때만 만든다 — 실제 소리 길에 두면 소리가 없어도 계산을 먹는다
    if (!live) {
    // 잔향: 짧은 되먹임 지연 셋(가벼운 방 울림). 잡음 울림판(ConvolverNode)은 곡 굽기를 10초 넘게 잡아먹었다
    const verb = gain(1), verbOut = filt('lowpass', 3200, 0.7, gain(0.5, bgmG));
    for (const [dt, fbk] of [[0.0297, 0.62], [0.0371, 0.6], [0.0411, 0.58], [0.0437, 0.55]]) {
      const dl = c.createDelay(0.1); dl.delayTime.value = dt;
      const fb = gain(fbk); verb.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(verbOut);
    }
    songG.connect(gain(0.22, verb)); fightG.connect(gain(0.1, verb));
    // 메아리: 산책 곡 멜로디에만 (점8분 박자)
    echoIn = gain(1);
    const dl = c.createDelay(1); dl.delayTime.value = 60 / calm.bpm * 0.75;
    const fb = gain(0.3); echoIn.connect(dl); dl.connect(fb); fb.connect(dl);
    dl.connect(filt('lowpass', 2400, 0.7, gain(0.35, songG)));
    // 기타: 톱니파 둘을 찌그러뜨려 파워코드
    const sh = c.createWaveShaper(), cv = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; cv[i] = Math.tanh(x * 6); }
    sh.curve = cv; gtrIn = gain(1, sh);
    const gl = filt('lowpass', 2600, 0.9, gain(0.07, fightG)); sh.connect(filt('highpass', 90, 0.7, gl));
    }
    // 잡음 원본 + 공원 바람
    const n = c.sampleRate * 2; nbuf = c.createBuffer(1, n, c.sampleRate);
    const d = nbuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = nbuf; s.loop = true;
    s.connect(filt('lowpass', 500, 0.7, gain(0.05, ambG))); s.start();
    calm.next = c.currentTime + 0.1; calm.step = 0;
    bat.next = c.currentTime + 0.1; bat.step = 0;
  }

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    // 'balanced': 소리 버퍼를 조금 넉넉히 — 화면이 무거울 때 음악이 끊기지 않게 (9/14 "음악이 버벅")
    // 'playback': 소리 버퍼를 넉넉히 — 3D 화면이 무거울 때 오디오가 굶어 지직거리지 않게 (9/14). 효과음은 아주 조금 늦는다
    let c; try { c = new AC({ latencyHint: 'playback' }); } catch (e) { c = new AC(); }
    build(c, true);
    // 음악은 따로 떼어 0.17초치 버퍼로 튼다 (9/14 "3번쯤 반복되니까 지직": 'playback' 도 버퍼가 0.02초뿐이라
    //   3D 화면이 몇 분 무겁게 돌면 오디오가 굶었다). 효과음은 늦으면 안 되니 원래 통로에 둔다.
    try { mctx = new AC({ latencyHint: 0.17, sampleRate: c.sampleRate }); } catch (e) { mctx = null; }
    if (mctx) {
      const mm = mctx.createGain(); mm.gain.value = 0.9; mm.connect(mctx.destination);
      const mc = mctx.createDynamicsCompressor(); mc.threshold.value = -14; mc.ratio.value = 4; mc.connect(mm);   // 원래 통로와 같은 소리 결
      mBgm = mctx.createGain(); mBgm.gain.value = T.bgm ? 0.55 : 0; mBgm.connect(mc);
      songG = mctx.createGain(); songG.connect(mBgm);
      fightG = mctx.createGain(); fightG.gain.value = 0; fightG.connect(mBgm);
    } else mctx = c;
    // 녹음 소리: 야옹(붕어빵 장사와 같은 파일)
    fetch('assets/sfx/meow.mp3?v=' + window.__V).then(r => r.arrayBuffer()).then(b => ctx.decodeAudioData(b)).then(buf => { meowBuf = buf; }).catch(() => { });
    for (const n of ['bark', 'bark1', 'whine1', 'whine2']) fetch('assets/sfx/' + n + '.mp3?v=' + window.__V).then(r => r.arrayBuffer()).then(b => ctx.decodeAudioData(b)).then(buf => { bufs[n] = buf; }).catch(() => { });
    startLoops();
  }
  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
    if (mctx && mctx.state === 'suspended') mctx.resume();
  }

  function tone(freq, dur, type, vol, slide, dest, when) {
    const t = when || ctx.currentTime;
    const o = ctx.createOscillator(); o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfxG); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, type, f0, f1, vol, q, dest, when) {
    const t = when || ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = nbuf; s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur); f.Q.value = q || 1;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || sfxG); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.02);
  }

  function play(buf, vol, rate) {
    const s = ctx.createBufferSource(); s.buffer = buf; s.playbackRate.value = rate || 1;
    const g = ctx.createGain(); g.gain.value = vol; s.connect(g); g.connect(sfxG); s.start();
  }

  function sfx(name, v) {
    if (!ctx) return;
    v = v == null ? 1 : v;
    switch (name) {
      case 'whoosh': noise(0.13, 'bandpass', 700, 2600, 0.12 * v, 1.6); break;
      case 'whooshBig': noise(0.35, 'bandpass', 400, 2200, 0.22 * v, 1.2); break;
      case 'hit': noise(0.09, 'lowpass', 2400, 300, 0.5 * v, 0.8); tone(150, 0.09, 'sine', 0.45 * v, 60); break;
      case 'hitBig': noise(0.16, 'lowpass', 3000, 200, 0.6 * v, 0.7); tone(110, 0.18, 'sine', 0.6 * v, 40); tone(420, 0.05, 'square', 0.08 * v, 200); break;
      case 'slam': noise(0.5, 'lowpass', 900, 60, 0.6, 0.6); tone(70, 0.45, 'sine', 0.7, 30); break;
      case 'dodge': noise(0.18, 'highpass', 1800, 900, 0.1, 0.8); break;
      case 'ko': tone(880, 0.5, 'triangle', 0.14, 440); setTimeout(() => ctx && tone(660, 0.6, 'triangle', 0.1, 330), 90); break;
      case 'bell': [0, 0.28].forEach(d => { tone(1320, 0.9, 'sine', 0.2, null, sfxG, ctx.currentTime + d); tone(1980, 0.5, 'sine', 0.06, null, sfxG, ctx.currentTime + d); }); break;
      case 'clear': [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.5, 'triangle', 0.16, null, sfxG, ctx.currentTime + i * 0.09)); break;
      case 'taunt': tone(300, 0.12, 'sawtooth', 0.05, 380); tone(380, 0.22, 'sawtooth', 0.05, 240, sfxG, ctx.currentTime + 0.13); break;
      case 'coin': tone(1180 + Math.random() * 80, 0.07, 'triangle', 0.1); tone(1760, 0.1, 'triangle', 0.08, null, sfxG, ctx.currentTime + 0.05); break;
      case 'page': tone(660, 0.05, 'triangle', 0.05); break;
      case 'deny': tone(180, 0.15, 'square', 0.06, 140); break;
      case 'praise': tone(988, 0.12, 'square', 0.06); tone(1319, 0.2, 'square', 0.06, null, sfxG, ctx.currentTime + 0.08); break;
      case 'poof': noise(0.3, 'bandpass', 1200, 400, 0.12, 0.8); break;
      case 'step': noise(0.06, 'bandpass', 900, 400, 0.04 * v, 1.2); break;
      case 'vend': noise(0.12, 'lowpass', 1200, 200, 0.3, 1); tone(90, 0.2, 'sine', 0.4, 60, sfxG, ctx.currentTime + 0.25); noise(0.2, 'lowpass', 800, 100, 0.35, 1, sfxG, ctx.currentTime + 0.25); break;
      case 'drink': [0, 0.12, 0.24].forEach(d => tone(320 + d * 400, 0.09, 'sine', 0.1, 520, sfxG, ctx.currentTime + d)); break;
      case 'warn': tone(700, 0.08, 'square', 0.07, 900); tone(1050, 0.12, 'square', 0.07, 1300, sfxG, ctx.currentTime + 0.09); break;
      case 'just': tone(1568, 0.25, 'sine', 0.16, 2400); noise(0.25, 'highpass', 5000, 2500, 0.12, 0.7); break;
      case 'break': noise(0.4, 'highpass', 3500, 800, 0.35, 0.6); tone(220, 0.35, 'sawtooth', 0.12, 80); [1760, 2217, 2637].forEach((f, i) => tone(f, 0.25, 'triangle', 0.06, null, sfxG, ctx.currentTime + 0.05 + i * 0.05)); break;
      case 'rage': tone(90, 0.5, 'sawtooth', 0.14, 60); tone(95, 0.5, 'sawtooth', 0.1, 55); break;
      case 'meow': {
        if (meowBuf) {
          // 모든 고양이가 같은 소리 (원래 빠르기 그대로, 9/14 사장님)
          const s = ctx.createBufferSource(); s.buffer = meowBuf;
          const g = ctx.createGain(); g.gain.value = 0.9 * v;
          s.connect(g); g.connect(sfxG); s.start();
          break;
        }
        const t = ctx.currentTime, p = 1; tone(620 * p, 0.12, 'triangle', 0.12 * v, 980 * p, sfxG, t); tone(980 * p, 0.28, 'triangle', 0.12 * v, 520 * p, sfxG, t + 0.11); tone(1240 * p, 0.3, 'sine', 0.04 * v, 700 * p, sfxG, t + 0.11); break; }
      case 'crunch': noise(0.06, 'bandpass', 2600 + Math.random() * 900, 1400, 0.12, 1.5); noise(0.05, 'bandpass', 1800, 900, 0.08, 1.5, sfxG, ctx.currentTime + 0.07); break;
      case 'can': { const t = ctx.currentTime; noise(0.08, 'highpass', 3000, 1500, 0.2, 0.8); tone(1500, 0.08, 'square', 0.04, 900, sfxG, t); noise(0.25, 'bandpass', 1200, 500, 0.12, 1, sfxG, t + 0.15); break; }
      case 'stamp': noise(0.12, 'lowpass', 1500, 120, 0.5, 0.7); tone(90, 0.16, 'sine', 0.5, 50); break;
      case 'nyah': { const t = ctx.currentTime; [0, 0.13, 0.26].forEach((d, i) => tone(i === 2 ? 420 : 520, 0.11, 'sawtooth', 0.05, i === 2 ? 300 : 620, sfxG, t + d)); break; }
      case 'splash': noise(0.5, 'lowpass', 1400, 200, 0.35, 0.8); break;
      case 'paddle': noise(0.18, 'bandpass', 700, 300, 0.08, 1.2); break;
      case 'peep': { const t = ctx.currentTime; tone(2400, 0.07, 'sine', 0.08, 3000, sfxG, t); tone(2600, 0.08, 'sine', 0.08, 3200, sfxG, t + 0.1); break; }
      case 'quack': { const t = ctx.currentTime; [0, 0.18].forEach(d => { tone(330, 0.14, 'sawtooth', 0.09, 240, sfxG, t + d); noise(0.12, 'bandpass', 900, 600, 0.08, 3, sfxG, t + d); }); break; }
      case 'chime': { const f = [784, 988, 1175, 1568][Math.max(0, Math.min(3, (v | 0) - 1))]; tone(f, 0.9, 'sine', 0.18); tone(f * 2, 0.5, 'sine', 0.05); break; }
      case 'fizzle': noise(0.4, 'highpass', 3000, 600, 0.2, 0.6); tone(160, 0.25, 'square', 0.06, 90); break;
      case 'grind': noise(0.45, 'lowpass', 500, 150, 0.35, 2); tone(70, 0.4, 'sawtooth', 0.08, 55); break;
      // 쇠바퀴 밸브를 돌리는 드르륵: 짧은 딸깍을 점점 느리게 14번 + 쇠 울림
      case 'ratchet': {
        const t = ctx.currentTime;
        let w = 0;
        for (let i = 0; i < 14; i++) {
          const d = w + Math.random() * 0.006;
          noise(0.028, 'bandpass', 2600 + Math.random() * 900, 1500, 0.2 * v, 3, sfxG, t + d);
          tone(420 + Math.random() * 60, 0.03, 'square', 0.035 * v, 300, sfxG, t + d);
          w += 0.034 + i * 0.0025;
        }
        noise(0.5, 'lowpass', 700, 180, 0.08 * v, 1, sfxG, t);
        tone(160, 0.35, 'sawtooth', 0.025 * v, 120, sfxG, t);
        break;
      }
      case 'water': noise(0.7, 'bandpass', 1800, 900, 0.22, 0.7); tone(200, 0.2, 'sine', 0.1, 120); break;
      case 'charm': { const t = ctx.currentTime; [1319, 1760, 2093, 2637].forEach((f, i) => tone(f, 0.35, 'triangle', 0.09, null, sfxG, t + i * 0.06)); noise(0.5, 'highpass', 6000, 3000, 0.05, 0.7); break; }
      // 걸음: 흙길은 사각, 잔디는 폭신
      case 'footPath': noise(0.09, 'bandpass', 2200 + Math.random() * 500, 800, 0.16 * v, 0.9); noise(0.06, 'lowpass', 500, 120, 0.22 * v, 0.7); break;
      case 'footGrass': noise(0.12, 'lowpass', 900 + Math.random() * 300, 160, 0.2 * v, 0.6); noise(0.08, 'highpass', 4000, 2500, 0.025 * v, 0.7); break;
      case 'trash': { const t = ctx.currentTime; [0, 0.06, 0.13].forEach(d => noise(0.07, 'highpass', 3500 + Math.random() * 2000, 2000, 0.16, 0.8, sfxG, t + d)); tone(520, 0.12, 'triangle', 0.07, 780, sfxG, t + 0.2); break; }
      // 동물: 멍 · 낑낑 · 구구 · 푸드덕 · 모이 뿌리기
      // 강아지: 녹음 파일이 있으면 그걸로 (엄마 멍멍멍 · 새끼 멍! 한 번 · 낑낑 두 가지)
      case 'bark': if (bufs.bark) { play(bufs.bark, 1.0 * v, 0.95 + Math.random() * 0.1); break; }
      // falls through
      case 'barkSynth': { const t = ctx.currentTime; tone(520 * (0.9 + Math.random() * 0.2), 0.11, 'sawtooth', 0.09 * v, 260, sfxG, t); noise(0.09, 'bandpass', 1400, 700, 0.12 * v, 2, sfxG, t); break; }
      case 'yip': if (bufs.bark1) { play(bufs.bark1, 1.0 * v, 1.2 + Math.random() * 0.1); break; } sfx('barkSynth', v); break;
      case 'whine': if (bufs.whine1) { play(Math.random() < 0.5 || !bufs.whine2 ? bufs.whine1 : bufs.whine2, 0.8 * v, 1.05 + Math.random() * 0.1); break; }
      // falls through
      case 'whineSynth': { const t = ctx.currentTime; tone(1100, 0.22, 'sine', 0.06 * v, 820, sfxG, t); tone(1180, 0.3, 'sine', 0.05 * v, 760, sfxG, t + 0.26); break; }
      case 'coo': { const t = ctx.currentTime; [0, 0.32].forEach(d => { tone(420, 0.12, 'sine', 0.08 * v, 360, sfxG, t + d); tone(380, 0.22, 'sine', 0.08 * v, 300, sfxG, t + d + 0.12); }); break; }
      case 'flap': { const t = ctx.currentTime; for (let i = 0; i < 9; i++) noise(0.06, 'bandpass', 900 + Math.random() * 600, 400, 0.14, 0.9, sfxG, t + i * 0.055 + Math.random() * 0.02); break; }
      case 'seed': { const t = ctx.currentTime; for (let i = 0; i < 7; i++) noise(0.03, 'highpass', 5000, 3000, 0.07, 1, sfxG, t + i * 0.04 + Math.random() * 0.03); break; }
      case 'lose': [392, 330, 262].forEach((f, i) => tone(f, 0.45, 'triangle', 0.14, null, sfxG, ctx.currentTime + i * 0.22)); break;
    }
  }

  // ── 악기 ──────────────────────────────────────────────
  // 전자 피아노: 둥근 몸통 + 치는 순간 반짝이는 윗소리
  function ep(n, t, dur, vol, dest) {
    const f = mf(n), end = t + Math.max(dur, 0.41) + 1.5;   // 소리가 다 사그라든 뒤에 끈다 (덜 줄었을 때 끄면 딸깍)
    const g = gain(0, dest);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(vol * 0.4, t + 0.4); g.gain.setTargetAtTime(0.0001, t + Math.max(dur, 0.41), 0.2);
    osc('sine', f, t, end, g); osc('triangle', f, t, end, gain(0.25, g), 5);
    const tg = gain(0, dest); tg.gain.setValueAtTime(vol * 0.35, t); tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    osc('sine', f * 4, t, t + 0.25, tg);
  }
  function bass(n, t, dur, vol, dest, saw) {
    const f = mf(n), end = t + dur + 0.3;
    const g = gain(0, filt('lowpass', saw ? 900 : 650, 0.9, dest));
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.setTargetAtTime(vol * 0.65, t + 0.03, 0.12); g.gain.setTargetAtTime(0.0001, t + dur, 0.03);
    osc(saw ? 'sawtooth' : 'triangle', f, t, end, g); osc('sine', f, t, end, g);
  }
  // 멜로디: 산책 곡은 피리 같은 세모파, 싸움 곡은 톱니파. 길게 끌면 떨림이 붙는다
  function lead(n, t, dur, vol, dest, fx, bright) {
    const f = mf(n), end = t + dur + 0.3;
    const lp = filt('lowpass', bright ? 3400 : 2200, 0.8, dest); if (fx) lp.connect(fx);
    const g = gain(0, lp);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.setTargetAtTime(0.0001, t + dur * 0.9, 0.05);
    const lg = gain(0); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(0, t + 0.15); lg.gain.linearRampToValueAtTime(bright ? 12 : 18, t + 0.45);
    osc('sine', 5.6, t, end, lg);
    const a = osc(bright ? 'sawtooth' : 'triangle', f, t, end, g, bright ? -6 : 0);
    const b = osc('square', f, t, end, gain(bright ? 0.5 : 0.12, g), bright ? 6 : 0);
    lg.connect(a.detune); lg.connect(b.detune);
  }
  function bell(n, t, vol, dest, fx) {
    const f = mf(n), g = gain(0, dest); if (fx) g.connect(fx);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    osc('sine', f, t, t + 1.35, g);
    const g2 = gain(0, dest); g2.gain.setValueAtTime(vol * 0.3, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc('sine', f * 3.01, t, t + 0.4, g2);
  }
  // 신스 브라스 찌르기: 필터가 확 열렸다 닫힌다
  function brass(ns, t, dur, vol, dest) {
    const lp = filt('lowpass', 600, 2, dest);
    lp.frequency.setValueAtTime(700, t); lp.frequency.exponentialRampToValueAtTime(3800, t + 0.03); lp.frequency.exponentialRampToValueAtTime(900, t + dur + 0.1);
    const g = gain(0, lp);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.setTargetAtTime(0.0001, t + dur, 0.05);
    ns.forEach((n, i) => osc('sawtooth', mf(n), t, t + dur + 0.35, g, i % 2 ? 9 : -9));   // 음마다 톱니파 하나 (둘이면 무거웠다)
  }
  function gtr(n, t, dur, vol) {
    const g = gain(0, gtrIn);
    g.gain.setValueAtTime(vol, t); g.gain.setTargetAtTime(0.0001, t + dur, 0.02);
    osc('sawtooth', mf(n), t, t + dur + 0.15, g); osc('sawtooth', mf(n + 7), t, t + dur + 0.15, g, 4);
  }
  function kick(t, vol, dest) { tone(160, 0.24, 'sine', vol, 42, dest, t); noise(0.02, 'lowpass', 2400, 900, vol * 0.25, 1, dest, t); }
  function snare(t, vol, dest) { noise(0.2, 'bandpass', 2300, 1300, vol, 0.6, dest, t); tone(200, 0.1, 'triangle', vol * 0.45, 150, dest, t); }
  function rim(t, vol, dest) { noise(0.05, 'bandpass', 2600, 2000, vol, 2.5, dest, t); tone(1650, 0.03, 'square', vol * 0.2, 1100, dest, t); }
  function hat(t, vol, dest, open) { noise(open ? 0.25 : 0.04, 'highpass', 8500, 7000, vol, 0.7, dest, t); }
  function crash(t, vol, dest) { noise(1.4, 'highpass', 6000, 3500, vol, 0.5, dest, t); }

  // ── 산책 곡 "우에노 산책" — D장조, 왕도 진행. 8마디씩 A(피리 멜로디) · B(종 아르페지오) · C(드럼 쉬고 종으로 멜로디) ──
  const CALM = {
    chords: [[55, 59, 62, 66], [57, 61, 64, 66], [54, 57, 61, 64], [57, 59, 62, 66], [55, 59, 62, 64], [55, 57, 61, 64], [57, 61, 62, 66], [54, 57, 60, 62]],
    roots: [43, 45, 42, 47, 40, 45, 38, 38],
    // [8분 자리, 음, 길이(8분)]
    mel: [
      [[0, 74, 2], [2, 76, 1], [3, 78, 3], [6, 76, 1], [7, 74, 1]],
      [[0, 76, 3], [3, 73, 1], [4, 69, 4]],
      [[0, 73, 2], [2, 76, 2], [4, 78, 2], [6, 81, 2]],
      [[0, 78, 3], [3, 76, 1], [4, 74, 4]],
      [[0, 71, 2], [2, 74, 1], [3, 76, 3], [6, 79, 2]],
      [[0, 78, 2], [2, 76, 2], [4, 73, 2], [6, 76, 2]],
      [[0, 78, 3], [3, 81, 1], [4, 78, 2], [6, 74, 2]],
      [[0, 76, 6], [6, 74, 1], [7, 71, 1]],
    ],
  };
  const EP_HITS = [[0, 1.5], [3, 1], [6, 2]];
  const BASS_PAT = [[0, 0, 2], [3, 0, 1], [4, 12, 0.5], [6, 7, 1], [7, 0, 0.5]];
  const ARP = [[0, 0], [2, 1], [3, 2], [5, 3], [6, 2]];
  function calmStep(k, t, e) {
    const bar = (k / 8 | 0) % 24, s = k % 8, sec = bar / 8 | 0, b = bar % 8, D = songG;
    const ch = CALM.chords[b], r = CALM.roots[b];
    if (sec < 2) {
      if (s === 0 || s === 5) kick(t, s ? 0.22 : 0.3, D);
      if (s === 2 || s === 6) (sec ? snare(t, 0.13, D) : rim(t, 0.14, D));
      hat(t, s % 2 ? 0.08 : 0.045, D, sec === 1 && s === 7);
      if (sec === 1 && b === 7 && s >= 5) snare(t, 0.06 + s * 0.012, D);
      if (sec === 1 && b === 0 && s === 0) crash(t, 0.05, D);
      for (const [hs, len] of EP_HITS) if (hs === s) ch.forEach(n => ep(n, t, len * e, 0.045, D));
      for (const [bs, iv, len] of BASS_PAT) if (bs === s) bass(r + iv, t, len * e, 0.2, D);
    } else {
      if (s === 0) { ch.forEach(n => ep(n, t, 7 * e, 0.04, D)); bass(r, t, 5 * e, 0.17, D); }
      if (s === 6) bass(r + 7, t, 2 * e, 0.12, D);
      if (s % 2 === 1) hat(t, 0.015, D);
    }
    if (sec === 0) { for (const [ms, n, len] of CALM.mel[b]) if (ms === s) lead(n, t, len * e, 0.08, D, echoIn); }
    else if (sec === 1) { for (const [as, i] of ARP) if (as === s) bell(ch[i] + 12, t, 0.035, D, echoIn); }
    else { for (const [ms, n] of CALM.mel[b]) if (ms === s) bell(n, t, 0.06, D, echoIn); }
  }

  // ── 싸움 곡 — F단조 록. 앞 8마디 기타+브라스, 뒤 8마디 멜로디가 올라탄다 ──
  const BAT = {
    chords: [[60, 65, 68], [61, 65, 68], [58, 63, 67], [60, 64, 67], [60, 65, 68], [61, 65, 68], [58, 61, 65], [60, 64, 67]],
    roots: [41, 37, 39, 36, 41, 37, 46, 36],
    mel: [
      [[0, 77, 1], [1, 80, 1], [2, 84, 2], [4, 82, 1], [5, 80, 1], [6, 77, 2]],
      [[0, 80, 3], [3, 77, 1], [4, 75, 2], [6, 77, 2]],
      [[0, 82, 2], [2, 80, 1], [3, 77, 1], [4, 80, 2], [6, 82, 2]],
      [[0, 84, 4], [4, 79, 2], [6, 76, 2]],
    ],
  };
  const BAT_BASS = [0, 0, 12, 0, 0, 12, 0, 7];
  function fightStep(k, t, e) {
    const bar = (k / 8 | 0) % 16, s = k % 8, sec = bar / 8 | 0, b = bar % 8, D = fightG;
    const ch = BAT.chords[b], r = BAT.roots[b];
    if (s === 0 || s === 3 || (s === 5 && b % 2) || (sec && s === 7 && b !== 7)) kick(t, 0.5, D);
    if (s === 2 || s === 6) snare(t, 0.3, D);
    if (b === 7 && s >= 4) snare(t, 0.14 + (s - 4) * 0.04, D);
    hat(t, s % 2 ? 0.08 : 0.12, D, s === 7 && b % 2);
    if (s === 0 && b % 4 === 0) crash(t, 0.1, D);
    bass(r + BAT_BASS[s], t, e * 0.85, 0.2, D, true);
    // 기타: 8분 칙칙, 강박은 길게
    const long = s === 0 || s === 3 || s === 6;
    gtr(r + 12, t, e * (long ? 1.4 : 0.45), long ? 0.5 : 0.28);
    if (s === 0 || s === 3 || s === 6) brass(ch, t, e * (s === 6 ? 1.6 : 0.9), sec ? 0.02 : 0.035, D);
    if (b >= 4 || sec) {
      const m = BAT.mel[b % 4];
      for (const [ms, n, len] of m) if (ms === s) lead(n - (sec && b < 4 ? 12 : 0), t, len * e, 0.06, D, null, true);
    }
  }

  // ── 곡은 시작할 때 한 번 미리 만들어 두고 테이프처럼 반복해 튼다 (9/14 "음악 지직거리고 버벅") ──
  //   예전엔 음표마다 소리 부품을 새로 만들어 틀었더니, 화면이 무거운 폰에서 오디오 계산이 밀려 지직·버벅거렸다.
  //   이제 게임 중 음악 계산은 반복 재생 하나뿐. 곡 끝에서 넘친 울림은 곡 앞에 겹쳐 이음매 없이 돈다.
  const loops = { calm: null, fight: null, calmSrc: null, fightSrc: null, busy: false };
  async function renderLoop(which) {
    const e = 60 / (which === 'calm' ? calm.bpm : bat.bpm) / 2;
    const bars = which === 'calm' ? 24 : 16, sr = ctx.sampleRate, tail = 2.0;   // 실제 소리와 같은 표본율 (낮춰 구우면 늘릴 때 찌직거렸다)
    const n = Math.round(bars * 8 * e * sr);
    const out = ctx.createBuffer(1, n, sr), o = out.getChannelData(0);
    // 한 번에 곡 전체를 구우면 부품 수천 개가 끝까지 살아 있어 20초 넘게 걸렸다 → 한 마디씩 굽고 겹쳐 붙인다
    for (let b = 0; b < bars; b++) {
      const keep = [ctx, master, sfxG, bgmG, ambG, songG, fightG, echoIn, gtrIn, nbuf, calm.next, calm.step, bat.next, bat.step];
      const oc = new OfflineAudioContext(1, Math.ceil(sr * (8 * e + tail)), sr);
      build(oc);
      master.gain.value = 1; bgmG.gain.value = 1; ambG.gain.value = 0;
      bgmG.disconnect(); bgmG.connect(oc.destination);   // 마디마다 새로 시작하는 압축기를 거치면 마디 이음매가 튀었다
      songG.gain.value = which === 'calm' ? 1 : 0; fightG.gain.value = which === 'fight' ? 1 : 0;
      for (let s8 = 0; s8 < 8; s8++) (which === 'calm' ? calmStep : fightStep)(b * 8 + s8, s8 * e + 0.001, e);
      [ctx, master, sfxG, bgmG, ambG, songG, fightG, echoIn, gtrIn, nbuf, calm.next, calm.step, bat.next, bat.step] = keep;   // 실제 소리 길로 되돌리고 나서 굽는다
      const d = (await oc.startRendering()).getChannelData(0);
      const at = Math.round(b * 8 * e * sr);
      for (let i = 0; i < d.length; i++) o[(at + i) % n] += d[i];   // 곡 끝을 넘는 울림은 곡 앞으로
    }
    return out;
  }
  function loopSrc(buf, dest, when) { const s = mctx.createBufferSource(); s.buffer = buf; s.loop = true; s.connect(dest); s.start(when || mctx.currentTime); return s; }
  function startLoops() {
    if (loops.busy) return; loops.busy = true;
    (async () => {
      loops.calm = await renderLoop('calm');
      loops.calmSrc = loopSrc(loops.calm, songG);
      loops.fight = await renderLoop('fight');
      if (fighting) fight(true);
    })().catch(e => console.warn('music', e));
  }

  // 싸움이 시작되면 싸움 곡은 첫 마디부터, 끝나면 소리가 줄어든 뒤 멈춘다
  function fight(on) {
    fighting = on;
    if (!ctx) return;
    if (loops.fightSrc) { const s = loops.fightSrc; loops.fightSrc = null; try { s.stop(mctx.currentTime + (on ? 0.1 : 1.5)); } catch (e) { } }
    if (on && loops.fight) loops.fightSrc = loopSrc(loops.fight, fightG, mctx.currentTime + 0.05);
  }

  // 브라우저는 사람이 한 번 누른 뒤에야 소리를 낸다 — 타이틀에서 아무 데나 누르면 산책 곡 시작
  function music() { init(); resume(); }

  function bird() {
    const t = ctx.currentTime, base = 2600 + Math.random() * 1400, n = 2 + (Math.random() * 4 | 0);
    for (let i = 0; i < n; i++) tone(base, 0.07, 'sine', 0.035, base * (1.3 + Math.random() * 0.3), ambG, t + i * 0.1);
  }

  function glide(p, want, tc, c) {
    if (p._want === want) return;
    p._want = want; const t = (c || ctx).currentTime;
    p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); p.setTargetAtTime(want, t, tc);
  }
  function update(dt) {
    if (!ctx) return;
    // 음량은 오디오 쪽에서 부드럽게 옮긴다 (프레임마다 값을 쓰면 끊긴 프레임에서 뚝뚝 튀었다)
    glide(bgmG.gain, T.bgm ? 0.55 : 0, 0.07);
    if (mBgm) glide(mBgm.gain, T.bgm ? 0.55 : 0, 0.07, mctx);
    glide(sfxG.gain, T.sfx ? 0.9 : 0, 0.04);
    // 대화 중엔 작게, 게임오버엔 더 작게
    const calmWant = fighting ? 0 : T.mode === 'talk' ? 0.55 : T.mode === 'over' ? 0.35 : 1;
    glide(songG.gain, calmWant, 0.25, mctx);
    glide(fightG.gain, fighting ? 1 : 0, 0.25, mctx);
    glide(ambG.gain, fighting ? 0.25 : 1, 0.25);
    birdT -= dt; if (birdT <= 0) { birdT = 2 + Math.random() * 5; if (!fighting && T.bgm) bird(); }
  }

  // 시험용: 스피커로 내지 않고 곡을 만들어 16비트 wav 로 돌려준다 (소리를 한 번도 안 켠 탭에서만)
  async function render(which, secs) {
    if (ctx) throw new Error('already running');
    const sr = 44100, oc = new OfflineAudioContext(2, sr * secs, sr);
    const keepBgm = T.bgm; T.bgm = 1;
    build(oc);
    bgmG.gain.value = 0.55;
    fighting = which === 'fight';
    songG.gain.value = fighting ? 0 : 1; fightG.gain.value = fighting ? 1 : 0; ambG.gain.value = fighting ? 0.25 : 1;
    calm.next = bat.next = 0.05;
    const e1 = 60 / calm.bpm / 2, e2 = 60 / bat.bpm / 2;
    while (calm.next < secs && !fighting) { calmStep(calm.step, calm.next, e1); calm.next += e1; calm.step++; }
    while (bat.next < secs && fighting) { fightStep(bat.step, bat.next, e2); bat.next += e2; bat.step++; }
    const buf = await oc.startRendering();
    ctx = null; fighting = false; T.bgm = keepBgm;
    const L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length;
    let peak = 0, sum = 0, clip = 0;
    const out = new DataView(new ArrayBuffer(44 + n * 4));
    const w = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); out.setUint32(4, 36 + n * 4, true); w(8, 'WAVE'); w(12, 'fmt '); out.setUint32(16, 16, true);
    out.setUint16(20, 1, true); out.setUint16(22, 2, true); out.setUint32(24, sr, true); out.setUint32(28, sr * 4, true);
    out.setUint16(32, 4, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * 4, true);
    for (let i = 0; i < n; i++) {
      for (const [c, x] of [[0, L[i]], [1, R[i]]]) {
        const a = Math.abs(x); if (a > peak) peak = a; if (a >= 1) clip++; sum += x * x;
        out.setInt16(44 + i * 4 + c * 2, Math.max(-1, Math.min(1, x)) * 32767, true);
      }
    }
    return { wav: out.buffer, peak, rms: Math.sqrt(sum / (n * 2)), clip };
  }

  window.AUD = { init, resume, sfx, fight, update, music, render };
})();
