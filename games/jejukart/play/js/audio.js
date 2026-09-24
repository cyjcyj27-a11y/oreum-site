// 소리 — 엔진만 파일(BUY JEJU 와 같은 engine.mp3, 픽사베이 무료), 나머지는 전부 코드로 만든다
// file:// 로 열어도 나게 하려고 mp3 는 base64 사본(assets/sfx/engine.mp3.js)에서 읽는다
(function () {
  let ctx = null, master = null, sfxGain = null, bgmGain = null;
  let eng = null, skid = null, started = false;
  const S = {
    snd: localStorage.getItem('alleykart.snd') !== '0',
    bgm: localStorage.getItem('alleykart.bgm') !== '0',
  };

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = S.snd ? 1 : 0;
    sfxGain.connect(master);
    bgmGain = ctx.createGain();
    bgmGain.gain.value = S.bgm ? 0.34 : 0;
    bgmGain.connect(master);
    buildEngineFile();
    buildSkid();
  }

  function noiseBuf(sec) {
    const n = ctx.sampleRate * sec, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  // ---------- 엔진 (BUY JEJU 와 같은 녹음 파일) ----------
  // 이음매 없이 반복하려고 앞뒤 무음을 잘라내고 끝을 앞에 겹쳐 넘긴다 (BUY JEJU 에서 쓰던 방법)
  function loopBuffer(buf, fade) {
    try {
      const sr = buf.sampleRate, ch = buf.numberOfChannels, d0 = buf.getChannelData(0), thr = 0.004;
      let a = 0, b = buf.length - 1;
      while (a < b && Math.abs(d0[a]) < thr) a++;
      while (b > a && Math.abs(d0[b]) < thr) b--;
      const L = b - a + 1;
      if (L < sr * 0.2) return buf;
      const F = Math.max(1, Math.min(Math.round(sr * (fade || 0.12)), Math.floor(L / 3)));
      const N = L - F;
      const out = ctx.createBuffer(ch, N, sr);
      for (let c = 0; c < ch; c++) {
        const src = buf.getChannelData(c), o = out.getChannelData(c);
        for (let i = 0; i < N; i++) o[i] = src[a + i];
        for (let i = 0; i < F; i++) { const t = i / F; o[i] = src[a + i] * t + src[a + N + i] * (1 - t); }
      }
      return out;
    } catch (e) { return buf; }
  }

  function b64buf(s64) {
    const bin = atob(s64), n = bin.length, u = new Uint8Array(n);
    for (let i = 0; i < n; i++) u[i] = bin.charCodeAt(i);
    return u.buffer;
  }

  // 파일 엔진: 반복 재생하고 회전수에 따라 재생 속도·크기만 바꾼다
  function buildEngineFile() {
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(sfxGain);
    eng = { g, src: null, file: true };
    if (!window.AK_ENGINE_MP3) { buildEngineSynth(); return; }
    try {
      ctx.decodeAudioData(b64buf(window.AK_ENGINE_MP3), (buf) => {
        const s = ctx.createBufferSource();
        s.buffer = loopBuffer(buf, 0.12);
        s.loop = true;
        s.connect(g);
        s.start();
        eng.src = s;
      }, () => buildEngineSynth());
    } catch (e) { buildEngineSynth(); }
  }

  // 파일을 못 읽었을 때만 쓰는 예비 엔진 (톱니 두 개 + 낮은 노이즈)
  function buildEngineSynth() {
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'square';
    const g = ctx.createGain();
    g.gain.value = 0;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 900;
    const n = ctx.createBufferSource();
    n.buffer = noiseBuf(1.2);
    n.loop = true;
    const ng = ctx.createGain();
    ng.gain.value = 0.06;
    const nf = ctx.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.value = 260;
    o1.connect(g); o2.connect(g); g.connect(f); f.connect(sfxGain);
    n.connect(nf); nf.connect(ng); ng.connect(g);
    o1.start(); o2.start(); n.start();
    eng = { o1, o2, g, f, ng, file: false };
  }

  function buildSkid() {
    const n = ctx.createBufferSource();
    n.buffer = noiseBuf(1.5);
    n.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 2100;
    f.Q.value = 1.4;
    const g = ctx.createGain();
    g.gain.value = 0;
    n.connect(f); f.connect(g); g.connect(sfxGain);
    n.start();
    skid = { g, f };
  }

  // 매 프레임: 속도·드리프트 상태를 소리에 반영
  function engine(rpm, load, drifting, air) {
    if (!ctx || !eng) return;
    const t = ctx.currentTime;
    if (eng.file) {
      if (eng.src) eng.src.playbackRate.setTargetAtTime(0.72 + rpm * 1.15 + load * 0.12, t, 0.08);
      eng.g.gain.setTargetAtTime(air ? 0.1 : 0.11 + load * 0.2 + rpm * 0.14, t, 0.1);
    } else {
      const base = 58 + rpm * 210;
      eng.o1.frequency.setTargetAtTime(base, t, 0.06);
      eng.o2.frequency.setTargetAtTime(base * 0.5, t, 0.06);
      eng.f.frequency.setTargetAtTime(500 + rpm * 2600, t, 0.08);
      eng.g.gain.setTargetAtTime(air ? 0.05 : 0.055 + load * 0.075, t, 0.08);
    }
    skid.g.gain.setTargetAtTime(drifting ? 0.11 : 0, t, 0.05);
  }

  function env(type, freq, dur, vol, slideTo, filt) {
    if (!ctx || !S.snd) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + dur);
    let node = o;
    if (filt) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filt;
      o.connect(f); node = f;
    }
    node.connect(g);
    g.connect(sfxGain);
    o.start();
    o.stop(ctx.currentTime + dur + 0.05);
  }

  function burst(dur, vol, from, to, q) {
    if (!ctx || !S.snd) return;
    const n = ctx.createBufferSource();
    n.buffer = noiseBuf(dur + 0.1);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = q || 1;
    f.frequency.setValueAtTime(from, ctx.currentTime);
    f.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    n.connect(f); f.connect(g); g.connect(sfxGain);
    n.start();
    n.stop(ctx.currentTime + dur + 0.05);
  }

  const SFX = {
    beep: () => env('square', 660, 0.16, 0.22),
    go: () => { env('square', 990, 0.4, 0.26); env('square', 1320, 0.42, 0.18); },
    item: () => { env('triangle', 520, 0.1, 0.2, 1040); setTimeout(() => env('triangle', 1040, 0.12, 0.16, 1560), 90); },
    boost: () => { burst(0.5, 0.3, 300, 3200, 0.8); env('sawtooth', 120, 0.45, 0.16, 500, 1400); },
    mini: () => env('square', 780, 0.14, 0.15, 1400),
    hit: () => { burst(0.35, 0.34, 1800, 200, 0.9); env('square', 180, 0.25, 0.18, 60); },
    splash: () => burst(0.4, 0.3, 2600, 500, 0.6),
    banana: () => env('triangle', 320, 0.18, 0.2, 90),
    bump: () => { env('square', 90, 0.14, 0.18, 55, 600); burst(0.12, 0.16, 900, 300, 1); },
    wall: () => { burst(0.22, 0.24, 500, 120, 0.7); env('sine', 70, 0.2, 0.2, 40); },
    lap: () => { env('square', 880, 0.12, 0.2); setTimeout(() => env('square', 1170, 0.18, 0.2), 110); },
    pass: () => env('triangle', 620, 0.1, 0.13, 880),
    shield: () => { env('sine', 440, 0.3, 0.16, 880); env('sine', 660, 0.32, 0.12, 1320); },
    bolt: () => { burst(0.5, 0.3, 4000, 300, 0.5); env('sawtooth', 300, 0.4, 0.18, 60); },
    win: () => [0, 120, 240, 420].forEach((d, i) => setTimeout(() => env('square', [523, 659, 784, 1047][i], 0.35, 0.22), d)),
    lose: () => [0, 140, 300].forEach((d, i) => setTimeout(() => env('square', [523, 440, 330][i], 0.3, 0.18), d)),
    coin: () => { env('square', 1320, 0.08, 0.16); setTimeout(() => env('square', 1760, 0.14, 0.14), 70); },
    ui: () => env('square', 520, 0.07, 0.12),
  };
  function sfx(n) { if (!ctx) init(); if (S.snd && SFX[n]) SFX[n](); }

  // 배경음악 (2026-09-24 "코드로 음악 한번 다른거"): 바닷바람 부는 D장조 질주곡
  // 148bpm, 16분음표 격자, 16마디 한 바퀴 = A(8마디: D-A-Bm-G ×2) + B(8마디: G-A-F#m-Bm-G-A-D-D)
  // 베이스 8분 튕김 + 16분 아르페지오 + 리드(메아리) + 네 박 킥·박수. 옛 8비트 루프는 뺐다
  const BPM = 148, SPB = 60 / BPM / 4;
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  // 코드: [베이스 뿌리음, 아르페지오 음]
  const CH = {
    D: [38, [62, 66, 69, 74]], A: [45, [61, 64, 69, 73]], Bm: [47, [59, 62, 66, 71]],
    G: [43, [59, 62, 67, 71]], Fm: [42, [61, 66, 69, 73]],
  };
  const PROG = ['D', 'A', 'Bm', 'G', 'D', 'A', 'Bm', 'G', 'G', 'A', 'Fm', 'Bm', 'G', 'A', 'D', 'D'];
  // 리드: 마디마다 8분음표 8칸. 0 = 쉼, -1 = 앞 음 끌기
  const LEAD = [
    [74, -1, 76, 78, -1, 76, 74, -1], [73, -1, -1, 69, 71, 73, 76, -1],
    [78, -1, 76, 74, -1, 71, 74, -1], [71, -1, -1, -1, 67, 69, 71, -1],
    [74, -1, 76, 78, -1, 81, 78, -1], [76, -1, 73, -1, 76, 78, 81, -1],
    [83, -1, 81, 78, -1, 76, 78, -1], [79, -1, 78, 76, -1, 73, 76, -1],
    [79, 79, -1, 78, 79, -1, 81, -1], [81, -1, 78, -1, 76, -1, 73, -1],
    [78, 78, -1, 76, 78, -1, 81, -1], [83, -1, -1, 81, 78, -1, 76, -1],
    [79, 79, -1, 78, 79, -1, 83, -1], [85, -1, 83, -1, 81, -1, 76, -1],
    [78, -1, 81, -1, 86, -1, -1, -1], [0, 0, 86, 85, 83, 81, 78, 76],
  ];
  const BASSPAT = [0, 0, 12, 0, 0, 12, 0, 7];   // 8분음표마다 뿌리음에서 몇 반음 위

  // 소리 줄기: 본선 + 리드용 메아리(딜레이). 실시간·미리 굽기(OfflineAudioContext) 둘 다 쓴다
  function makeBus(c, dest) {
    const main = c.createGain();
    main.connect(dest);
    const dl = c.createDelay(1);
    dl.delayTime.value = SPB * 3;   // 점8분 메아리
    const fb = c.createGain();
    fb.gain.value = 0.32;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2400;
    const wet = c.createGain();
    wet.gain.value = 0.3;
    dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(wet); wet.connect(main);
    const nb = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate), d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return { c, main, send: dl, nb };
  }
  function voice(B, type, f, t, dur, vol, cut, send, detune) {
    const c = B.c, o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.value = f;
    if (detune) o.detune.value = detune;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.setTargetAtTime(vol * 0.6, t + 0.02, dur * 0.4);
    g.gain.setTargetAtTime(0, t + dur, 0.03);
    let n = o;
    if (cut) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = cut; o.connect(fl); n = fl; }
    n.connect(g); g.connect(B.main);
    if (send) g.connect(B.send);
    o.start(t); o.stop(t + dur + 0.2);
  }
  function noise(B, t, dur, vol, type, freq, q) {
    const c = B.c, n = c.createBufferSource();
    n.buffer = B.nb;
    const fl = c.createBiquadFilter();
    fl.type = type; fl.frequency.value = freq; if (q) fl.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    n.connect(fl); fl.connect(g); g.connect(B.main);
    n.start(t, Math.random() * 0.3); n.stop(t + dur + 0.02);
  }
  function kick(B, t, vol) {
    const c = B.c, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
    o.connect(g); g.connect(B.main);
    o.start(t); o.stop(t + 0.3);
  }
  // n 번째 16분음표 하나를 t 에 깐다
  function playStep(B, n, t) {
    const bar = (n >> 4) % 16, s = n % 16, ch = CH[PROG[bar]], hi = bar >= 8;
    // 리드 (8분음표 칸에서만): 사각파 두 겹 + 한 옥타브 위 반짝이, 메아리로 보낸다
    if (s % 2 === 0) {
      const e = s >> 1, m = LEAD[bar][e];
      if (m > 0) {
        let len = 1, bb = bar, ee = e;
        for (;;) { ee++; if (ee > 7) { ee = 0; bb = (bb + 1) % 16; } if (LEAD[bb][ee] !== -1 || len > 7) break; len++; }
        const dur = len * 2 * SPB * 0.9;
        voice(B, 'square', hz(m), t, dur, 0.075, 3200, true);
        voice(B, 'square', hz(m), t, dur, 0.04, 2600, false, 9);
        voice(B, 'triangle', hz(m + 12), t, dur, 0.035, 0, true);
      }
      // 베이스: 8분음표 튕김
      const r = ch[0] + BASSPAT[e];
      voice(B, 'triangle', hz(r), t, SPB * 1.6, 0.26, 0);
      voice(B, 'sawtooth', hz(r), t, SPB * 1.2, 0.05, 420);
    }
    // 아르페지오: 16분음표로 코드음을 오르내린다 (B 부분은 한 옥타브 위로 밝게)
    const ar = ch[1], k = [0, 1, 2, 3, 2, 1, 2, 3][s % 8];
    voice(B, 'square', hz(ar[k] + (hi ? 12 : 0)), t, SPB * 0.8, hi ? 0.026 : 0.03, hi ? 3600 : 2200);
    // 드럼
    const fill = (bar === 7 || bar === 15) && s >= 12;
    if (s % 4 === 0) kick(B, t, 0.34);
    if (hi && s === 14) kick(B, t, 0.22);
    if (s === 4 || s === 12) { noise(B, t, 0.16, 0.16, 'bandpass', 1500, 0.8); noise(B, t + 0.012, 0.12, 0.08, 'bandpass', 1100, 0.8); }
    if (fill) noise(B, t, 0.1, 0.07 + (s - 12) * 0.025, 'bandpass', 1300, 0.9);
    if (s % 4 === 2) noise(B, t, 0.14, 0.05, 'highpass', 7000);
    else noise(B, t, 0.035, s % 2 ? 0.03 : 0.02, 'highpass', 8000);
    if (bar % 8 === 0 && s === 0) noise(B, t, 1.4, 0.07, 'highpass', 5000);   // 8마디마다 심벌
  }

  let bgmTimer = null, step = 0, nextT = 0, bus = null;
  function tickBgm() {
    if (!ctx) return;
    while (nextT < ctx.currentTime + 0.3) {
      const t = Math.max(nextT, ctx.currentTime + 0.02);
      playStep(bus, step, t);
      nextT += SPB;
      step++;
    }
  }

  function bgmStart() {
    if (!ctx) init();
    if (bgmTimer) return;
    if (!bus) bus = makeBus(ctx, bgmGain);
    nextT = ctx.currentTime + 0.1;
    step = 0;
    bgmTimer = setInterval(tickBgm, 80);
  }
  function bgmStop() { if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; } }

  // 시험용: 배경음악을 소리 없이 미리 구워 wav 데이터 주소로 돌려준다 (sec 초)
  async function renderBgm(sec) {
    const sr = 44100, c = new OfflineAudioContext(1, sr * sec, sr);
    const g = c.createGain();
    g.gain.value = 0.34 * 0.9 * 1.6;
    g.connect(c.destination);
    const B = makeBus(c, g);
    for (let n = 0, t = 0.05; t < sec; n++, t += SPB) playStep(B, n, t);
    const d = (await c.startRendering()).getChannelData(0);
    const buf = new ArrayBuffer(44 + d.length * 2), v = new DataView(buf);
    const w = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + d.length * 2, true); w(8, 'WAVEfmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    w(36, 'data'); v.setUint32(40, d.length * 2, true);
    let peak = 0;
    for (let i = 0; i < d.length; i++) { const x = Math.max(-1, Math.min(1, d[i])); peak = Math.max(peak, Math.abs(d[i])); v.setInt16(44 + i * 2, x * 32767, true); }
    const u = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return { peak, url: 'data:audio/wav;base64,' + btoa(bin) };
  }

  function setSnd(v) {
    S.snd = v;
    localStorage.setItem('alleykart.snd', v ? '1' : '0');
    if (sfxGain) sfxGain.gain.value = v ? 1 : 0;
  }
  function setBgm(v) {
    S.bgm = v;
    localStorage.setItem('alleykart.bgm', v ? '1' : '0');
    if (bgmGain) bgmGain.gain.value = v ? 0.34 : 0;
    if (v) bgmStart();
  }
  // 경주가 끝나면 엔진·미끄럼 소리를 끈다 (결과 화면에서 계속 부릉거리던 것)
  function engineOff() {
    if (!ctx || !eng) return;
    const t = ctx.currentTime;
    eng.g.gain.setTargetAtTime(0, t, 0.15);
    if (skid) skid.g.gain.setTargetAtTime(0, t, 0.05);
  }
  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }
  function quiet(on) { if (master) master.gain.value = on ? 0 : 0.9; }

  window.AUD = {
    init, engine, engineOff, sfx, bgmStart, bgmStop, setSnd, setBgm, resume, quiet, S, renderBgm,
    // 시험용: 엔진 소리가 파일로 물렸는지 확인한다
    _dbg: () => ({
      ctx: ctx && ctx.state, file: !!(eng && eng.file), hasSrc: !!(eng && eng.src),
      secs: eng && eng.src ? +eng.src.buffer.duration.toFixed(2) : 0,
      rate: eng && eng.src ? +eng.src.playbackRate.value.toFixed(2) : 0,
      gain: eng ? +eng.g.gain.value.toFixed(3) : 0,
    }),
  };
})();
