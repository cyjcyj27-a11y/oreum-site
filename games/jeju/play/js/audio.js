// 소리 — WebAudio 합성(타이어·경적·효과음) + 파일(assets/sfx/, 픽사베이 무료 효과음, 사장님 2026-09-09):
//   엔진 주행 engine.mp3(반복, 속도에 따라 재생 속도), 충돌 crash.mp3(무엇에 부딪히든 한 가지), 경적 horn.mp3(누르는 동안 반복). 파일이 없으면 합성음으로.
(function () {
  const A = { ctx: null, on: true, master: null, buf: {}, engSrc: null, engG: null };
  // 충돌음은 무엇에 부딪히든 한 가지로 통일(사장님 2026-09-09). 매번 재생 속도를 조금 흔들어 같은 소리가 반복돼 들리지 않게 한다
  const FILES = { engine: 'assets/sfx/engine.mp3', crash: 'assets/sfx/crash.mp3', horn: 'assets/sfx/horn.mp3' };
  function loadFiles() {
    const seen = new Set();
    for (const k in FILES) { const u = FILES[k]; if (seen.has(u)) continue; seen.add(u);
      fetch(u + '?v=1').then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status)).then(ab => A.ctx.decodeAudioData(ab)).then(b => { A.buf[u] = b; if (k === 'engine') startEngineFile(); }).catch(() => {}); }
  }
  function startEngineFile() {   // 파일 엔진: 반복 재생, engine() 이 재생 속도·볼륨을 만진다. 합성 엔진은 끈다
    const ctx = A.ctx, s = ctx.createBufferSource(); s.buffer = A.buf[FILES.engine]; s.loop = true;
    const g = ctx.createGain(); g.gain.value = 0; s.connect(g); g.connect(A.master); s.start(); A.engSrc = s; A.engG = g;
  }
  try { A.on = localStorage.getItem('jeju.snd') !== '0'; } catch (e) {}
  function init() {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    const ctx = new (window.AudioContext || window.webkitAudioContext)(); A.ctx = ctx;
    A.master = ctx.createGain(); A.master.gain.value = A.on ? 1 : 0; A.master.connect(ctx.destination);
    // 엔진은 파일(engine.mp3)만 쓴다 — 코드로 만든 엔진 소리(톱니+사각파)는 뺐다(사장님 2026-09-09)
    // 타이어: 잡음 → 밴드패스
    const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    A.noise = nb;
    const ns = ctx.createBufferSource(); ns.buffer = nb; ns.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 3;
    const sg = ctx.createGain(); sg.gain.value = 0; ns.connect(bp); bp.connect(sg); sg.connect(A.master); ns.start();
    A.skidG = sg;
    // 경적
    const hg = ctx.createGain(); hg.gain.value = 0; hg.connect(A.master);
    for (const f of [392, 494]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const lp2 = ctx.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 1400; o.connect(lp2); lp2.connect(hg); o.start(); }
    A.hornG = hg;
    loadFiles();
  }
  // 엔진: 파일 하나를 반복 재생하고 속도에 따라 재생 속도·볼륨만 바꾼다. 파일이 아직 안 읽혔으면 아무 소리도 안 낸다
  function engine(kmh, throttle, vol) {
    if (!A.engSrc) return; if (vol == null) vol = 1;
    const t = A.ctx.currentTime, k = Math.min(1, kmh / 160);
    A.engSrc.playbackRate.setTargetAtTime(0.7 + k * 1.1 + throttle * 0.1, t, 0.08);
    A.engG.gain.setTargetAtTime((0.12 + throttle * 0.18 + k * 0.15) * vol, t, 0.1);
  }
  function skid(amount) { if (A.skidG) A.skidG.gain.setTargetAtTime(Math.min(0.25, amount * 0.25), A.ctx.currentTime, 0.05); }
  // 경적: 파일이 있으면 누르는 동안 반복 재생, 없으면 합성음
  function horn(on) {
    const b = A.buf[FILES.horn];
    if (b) {
      const ctx = A.ctx;
      if (on && !A.hornSrc) {
        const s = ctx.createBufferSource(); s.buffer = b; s.loop = true;
        const g = ctx.createGain(); g.gain.value = 0.55; s.connect(g); g.connect(A.master); s.start();
        A.hornSrc = { s, g };
      } else if (!on && A.hornSrc) {
        const h = A.hornSrc; A.hornSrc = null;
        h.g.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
        setTimeout(() => { try { h.s.stop(); } catch (e) {} }, 200);
      }
      return;
    }
    if (A.hornG) A.hornG.gain.setTargetAtTime(on ? 0.12 : 0, A.ctx.currentTime, 0.02);
  }
  function crash(strength, kind) {
    if (!A.ctx) return;
    const u = FILES.crash, b = A.buf[u];
    if (b) {   // 파일 충돌음: 세게 부딪힐수록 크게, 살짝 다르게 들리도록 재생 속도 약간 흔듦
      const ctx = A.ctx, s = ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = 0.9 + Math.random() * 0.2;
      const g = ctx.createGain(); g.gain.value = Math.min(1, 0.25 + strength * 0.08) * 0.7; s.connect(g); g.connect(A.master); s.start(); return;   // 0.7 = 사장님 요청으로 30% 줄인 충돌음
    }
    const ctx = A.ctx, s = ctx.createBufferSource(); s.buffer = A.noise;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500 + strength * 200;
    const g = ctx.createGain(); const v = Math.min(0.6, 0.08 + strength * 0.06);
    g.gain.setValueAtTime(v, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25 + Math.min(0.4, strength * 0.03));
    s.connect(lp); lp.connect(g); g.connect(A.master); s.start(); s.stop(ctx.currentTime + 0.8);
  }
  function splash() {
    if (!A.ctx) return;
    const ctx = A.ctx, s = ctx.createBufferSource(); s.buffer = A.noise;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(3000, ctx.currentTime); lp.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 1.2);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.4, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.3);
    s.connect(lp); lp.connect(g); g.connect(A.master); s.start(); s.stop(ctx.currentTime + 1.5);
  }

  // ── 차 안 라디오 (사장님 곡 5개, assets/bgm/) ──
  // 차에 타고 있을 때만 흐른다. ♪(M)로 켜고 끄고, ⏭(N)로 다음 곡. WebAudio 가 아니라 <audio> 라 효과음(K)과 따로 논다
  // 곡은 사장님이 만든 것 — 시작할 때 제목을 화면에 띄운다
  const TRACKS = [
    { u: 'assets/bgm/radio1.mp3', t: 'The Luxury of Love' },
    { u: 'assets/bgm/radio2.mp3', t: 'Awesome Breeze' },
    { u: 'assets/bgm/radio3.mp3', t: 'Dance Till Dawn' },
    { u: 'assets/bgm/radio4.mp3', t: 'Should I' },
    { u: 'assets/bgm/radio5.mp3', t: 'useless' },
  ];

  // 첫 곡은 시작 인트로 영상에 깔린 곡으로 고정한다 — 영상이 끝나고 차에 타면 그 곡이 이어진다 (사장님 2026-09-10)
  const FIRST = Math.max(0, TRACKS.findIndex(t => t.t === 'Dance Till Dawn'));
  const RD = { on: true, i: FIRST, el: null, want: false, onTrack: null };
  try { RD.on = localStorage.getItem('jeju.bgm') !== '0'; } catch (e) {}
  function nowPlaying() { return { index: RD.i + 1, total: TRACKS.length, title: TRACKS[RD.i].t }; }
  function announce() { if (RD.onTrack) RD.onTrack(nowPlaying()); }
  function radioEl() {
    if (!RD.el) {
      const a = new Audio(); a.preload = 'none'; a.volume = 0.42;
      a.addEventListener('ended', () => { RD.i = (RD.i + 1) % TRACKS.length; a.src = TRACKS[RD.i].u; if (RD.on && RD.want) { a.play().catch(() => {}); announce(); } });
      RD.el = a;
    }
    return RD.el;
  }
  // 매 프레임 game.js 가 부른다: 차에 타고 있으면 want=true
  function radio(want) {
    RD.want = !!want; const a = radioEl();
    if (RD.on && RD.want) {
      if (!a.src) a.src = TRACKS[RD.i].u;
      if (a.paused) { const p = a.play(); if (p && p.catch) p.catch(() => {}); if (a.currentTime < 0.5) announce(); }   // 곡을 처음부터 틀 때만 제목을 띄운다
    } else if (!a.paused) a.pause();
  }
  function radioToggle() { RD.on = !RD.on; try { localStorage.setItem('jeju.bgm', RD.on ? '1' : '0'); } catch (e) {} radio(RD.want); return RD.on; }
  function radioNext() {
    const a = radioEl(); RD.i = (RD.i + 1) % TRACKS.length; a.src = TRACKS[RD.i].u;
    if (RD.on && RD.want) { const p = a.play(); if (p && p.catch) p.catch(() => {}); }
    return nowPlaying();
  }

  function tone(f, dur, type, vol, when) { if (!A.ctx) return; const ctx = A.ctx, t = ctx.currentTime + (when || 0); const o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.value = f; const g = ctx.createGain(); g.gain.setValueAtTime(vol || 0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(g); g.connect(A.master); o.start(t); o.stop(t + dur + 0.05); }
  function shutter() { if (!A.ctx) return; const ctx = A.ctx, s = ctx.createBufferSource(); s.buffer = A.noise; const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500; const g = ctx.createGain(); g.gain.setValueAtTime(0.35, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08); s.connect(hp); hp.connect(g); g.connect(A.master); s.start(); s.stop(ctx.currentTime + 0.1); tone(1800, 0.05, 'square', 0.05, 0.09); }
  function stamp() { tone(220, 0.12, 'square', 0.12); tone(110, 0.2, 'triangle', 0.2, 0.02); }
  function ping(f) { tone(f || 880, 0.18, 'sine', 0.12); tone((f || 880) * 1.5, 0.25, 'sine', 0.06, 0.05); }
  function fanfare() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, 'triangle', 0.14, i * 0.12)); }
  // 라디오 속보 신호음 — 짧은 세 음. 급매가 뜰 때 (2026-09-10)
  function news() { tone(1046, 0.12, 'square', 0.07); tone(1318, 0.12, 'square', 0.07, 0.13); tone(1568, 0.3, 'square', 0.08, 0.26); }
  // 동전 소리 — 짧고 맑은 두 음(마리오식). 월세가 들어올 때 쓴다 (사장님 2026-09-10)
  function coin(n) {
    for (let k = 0; k < (n || 1); k++) {
      const d = k * 0.075;
      tone(1319, 0.07, 'square', 0.09, d);          // E6
      tone(1976, 0.34, 'square', 0.07, d + 0.06);   // B6
    }
  }
  function toggle() { A.on = !A.on; try { localStorage.setItem('jeju.snd', A.on ? '1' : '0'); } catch (e) {} if (A.master) A.master.gain.setTargetAtTime(A.on ? 1 : 0, A.ctx.currentTime, 0.05); return A.on; }
  function pause(p) { if (p && RD.el && !RD.el.paused) RD.el.pause(); if (!A.ctx) return; if (p) A.ctx.suspend(); else A.ctx.resume(); }
  window.AUDIO = Object.assign(A, { init, engine, skid, horn, crash, splash, toggle, pause, radio, radioToggle, radioNext, nowPlaying, set onTrack(f) { RD.onTrack = f; }, radioVol(v) { RD.el && (RD.el.volume = v); }, shutter, stamp, ping, fanfare, coin, news, tone });
  Object.defineProperty(window.AUDIO, 'radioOn', { get() { return RD.on; } });
})();
