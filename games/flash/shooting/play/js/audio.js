// 소리: 맞는 소리·깨지는 소리·함성은 Pixabay 녹음(js/sfx.js), 단추·배경 가락은 코드
(function () {
  const A = (window.AU = {});
  let ctx = null, sfx = null, mus = null, noiseBuf = null;
  const load = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v === '1'; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) {} };
  A.snd = load('shooting.snd', true);
  A.bgm = load('shooting.bgm', true);
  const SV = 0.85, MV = 0.1;
  const last = {};

  function ensure() {
    if (ctx) return ctx;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    sfx = ctx.createGain(); sfx.gain.value = A.snd ? SV : 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 6;
    sfx.connect(comp); comp.connect(ctx.destination);
    mus = ctx.createGain(); mus.gain.value = A.bgm ? MV : 0; mus.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    loadSamples();
    return ctx;
  }
  // 녹음 효과음(Pixabay): js/sfx.js 의 base64 를 풀어 둔다
  const BUF = {};
  function loadSamples() {
    const D = window.SFXDATA || {};
    for (const k in D) {
      const bin = atob(D[k]), u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      ctx.decodeAudioData(u.buffer).then((b) => (BUF[k] = b)).catch(() => {});
    }
  }
  function smp(name, vol, rate) {
    const b = BUF[name]; if (!b) return false;
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = b; s.playbackRate.value = (rate || 1) * (0.95 + Math.random() * 0.1);
    g.gain.value = vol == null ? 1 : vol;
    s.connect(g); g.connect(sfx); s.start();
    return true;
  }
  const pick = (a) => a[(Math.random() * a.length) | 0];
  A._buf = BUF;
  A.unlock = function () { if (!ensure()) return; if (ctx.state === 'suspended') ctx.resume(); if (!mTimer) startMusic(); };
  A.setSnd = function (v) { A.snd = v; save('shooting.snd', v); if (sfx) sfx.gain.value = v ? SV : 0; };
  A.setBgm = function (v) { A.bgm = v; save('shooting.bgm', v); if (mus) mus.gain.value = v ? MV : 0; };
  function gate(k, ms) { const t = performance.now(); if (last[k] && t - last[k] < ms) return false; last[k] = t; return true; }
  const ok = () => ctx && A.snd && ctx.state === 'running';

  function tone(f, t0, dur, type, vol, out, f2, att) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.3, t0 + (att || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(out || sfx);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur, vol, type, freq, q, out, attack) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.playbackRate.value = 0.8 + Math.random() * 0.4;
    f.type = type; f.frequency.value = freq; f.Q.value = q || 1;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + (attack || 0.002));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(out || sfx);
    s.start(t0, Math.random() * 1.5); s.stop(t0 + dur + 0.05);
  }
  // 쇠붙이 울림: 서로 안 맞는 배음 여러 개가 따로 사라진다
  function ring(parts, t0, vol, decay) {
    for (const p of parts) tone(p[0] * (0.97 + Math.random() * 0.06), t0, (decay || 0.4) * p[2], 'sine', vol * p[1], null, null, 0.002);
  }

  A.shot = function (kind) {
    if (!ok()) return;
    if (kind === 'cannon') { smp('cannon', 1, 0.8); return; }
    if (kind === 'shot') { smp('cannon', 0.8, 1.15); smp('shot', 0.7, 0.9); return; }
    smp('shot', 0.9);
  };
  A.can = function (v) { if (!ok() || !gate('can', 30)) return; smp(pick(['can1', 'can2', 'can3']), 0.25 + 0.75 * Math.min(1, v)); };
  A.thud = function (v) { if (!ok() || !gate('thud', 40)) return; smp('wood2', 0.12 + 0.3 * Math.min(1, v), 0.7); };
  A.drop = function (v) { if (!ok() || !gate('drop', 60)) return; smp('drop', 0.3 + 0.6 * Math.min(1, v)); };
  A.wood = function (v) { if (!ok() || !gate('wood', 30)) return; smp(pick(['wood1', 'wood2']), 0.25 + 0.7 * Math.min(1, v), 1.2); };
  A.glass = function (v) { if (!ok() || !gate('glass', 40)) return; smp('tink', 0.15 + 0.45 * Math.min(1, v), 1.5); };
  A.shatter = function (v) { if (!ok() || !gate('shatter', 60)) return; smp(pick(['shatter1', 'shatter2']), 0.6 + 0.4 * Math.min(1, v || 1)); };
  A.ding = function (v) { if (!ok() || !gate('ding', 50)) return; smp('ding', 0.3 + 0.6 * Math.min(1, v || 1)); };
  A.pop = function () { if (!ok() || !gate('pop', 25)) return; smp(pick(['pop1', 'pop2']), 0.9); };
  A.boom = function () { if (!ok()) return; smp('boom', 1); };
  A.hit = function (kind, v) {
    if (kind === 'can') A.can(v); else if (kind === 'bottle' || kind === 'shard') A.glass(v); else if (kind === 'popper') A.ding(v); else A.wood(v);
  };
  A.down = function () {};
  A.coin = function () { if (!ok()) return; const t = ctx.currentTime; tone(988, t, 0.08, 'square', 0.06); tone(1319, t + 0.07, 0.22, 'square', 0.06); };
  A.click = function () { if (!ok()) return; const t = ctx.currentTime; tone(520, t, 0.05, 'triangle', 0.14); };
  A.praise = function (n) { if (!ok() || !gate('praise', 400)) return; smp('cheer', Math.min(0.9, 0.3 + n * 0.12)); };
  A.clear = function () { if (!ok()) return; smp('cheer', 1); };
  A.fail = function () { if (!ok()) return; const t = ctx.currentTime; [392, 349, 311, 262].forEach((f, i) => tone(f, t + i * 0.18, 0.35, 'triangle', 0.16)); };
  A.prize = function () { if (!ok()) return; smp('cheer', 1, 1.05); setTimeout(() => smp('cheer', 0.7, 0.95), 900); };
  A.laugh = function () {
    if (!ok()) return; const t = ctx.currentTime;
    for (let i = 0; i < 5; i++) { const tt = t + i * 0.13; tone(520 - i * 18, tt, 0.09, 'triangle', 0.14, null, 380 - i * 15); noise(tt, 0.07, 0.05, 'bandpass', 1300, 3); }
  };
  A.grumble = function () {
    if (!ok()) return; const t = ctx.currentTime;
    tone(220, t, 0.5, 'sawtooth', 0.05, null, 150); noise(t, 0.45, 0.04, 'bandpass', 500, 2, null, 0.05);
  };
  A.empty = function () { if (!ok()) return; const t = ctx.currentTime; tone(1800, t, 0.03, 'square', 0.05); noise(t, 0.03, 0.1, 'highpass', 4000, 1); };

  // ---------- 배경음: 야시장 뽕짝 메들리(140bpm, 쿵짝 두 박자, 트로트 음계). 새로 지은 가락 ----------
  let mTimer = null, step = 0, nextT = 0;
  const BPM = 140, S16 = 60 / BPM / 4;
  const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
  // 마디별 화음: [베이스 근음, 5도, 반주 세 음]
  const CH = {
    Am: [45, 52, [57, 60, 64]], Dm: [38, 45, [57, 62, 65]], E: [40, 47, [56, 59, 64]],
    F: [41, 48, [57, 60, 65]], G: [43, 50, [55, 59, 62]], C: [48, 55, [55, 60, 64]],
  };
  const A_CH = ['Am', 'Am', 'Dm', 'Am', 'E', 'E', 'Am', 'Am'];
  const B_CH = ['F', 'G', 'C', 'Am', 'Dm', 'Am', 'E', 'Am'];
  // 가락: 8분음표 8칸씩(−1 쉼표). 트로트 음계(라·시·도·미·파) 중심
  const A_MEL = [
    76, -1, 76, 77, 76, -1, 72, 71,  69, -1, -1, -1, -1, -1, 71, 72,
    74, -1, 74, 77, 81, -1, 77, 76,  76, -1, -1, -1, 72, 71, 69, 71,
    71, -1, 71, 72, 71, -1, 68, 64,  71, -1, 72, 74, 76, -1, -1, -1,
    77, 76, 74, 72, 71, 72, 71, 68,  69, -1, -1, -1, -1, -1, -1, -1,
  ];
  const B_MEL = [
    72, -1, 72, 74, 77, -1, 77, -1,  79, -1, 77, 76, 74, -1, -1, -1,
    76, -1, 76, 77, 79, -1, 81, -1,  76, -1, -1, -1, -1, -1, 72, 74,
    77, -1, 77, 76, 74, -1, 72, -1,  76, -1, 72, -1, 69, -1, 72, 74,
    76, -1, 77, 76, 74, 72, 71, 68,  69, -1, -1, -1, 69, 71, 72, 76,
  ];
  // 한 바퀴 = A · A(화음 얹음) · B · A(화음 얹음) = 32마디
  const FORM = [['A', 0], ['A', 1], ['B', 1], ['A', 1]];
  function mNote(f, t, dur, type, vol, cut, det) {
    const o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    o.type = type; o.frequency.value = f; if (det) o.detune.value = det;
    fl.type = 'lowpass'; fl.frequency.value = cut || 1800;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(fl); fl.connect(g); g.connect(mus);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function mNoise(t, dur, vol, type, f) {
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; fl.type = type; fl.frequency.value = f;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(mus);
    s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }
  // 가락 음색: 톱니 두 개를 살짝 어긋나게(아코디언·브라스) + 늦게 걸리는 떨림 + 첫머리 꺾기
  function lead(m, t, dur, vol, bend) {
    const f = mf(m);
    const g = ctx.createGain(), fl = ctx.createBiquadFilter();
    fl.type = 'lowpass'; fl.frequency.setValueAtTime(1400, t); fl.frequency.linearRampToValueAtTime(3200, t + 0.05);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.setValueAtTime(vol * 0.85, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 6; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.009, t + Math.min(0.25, dur * 0.6));
    lfo.connect(lg);
    for (const det of [-7, 7]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.detune.value = det;
      if (bend) { o.frequency.setValueAtTime(f * 0.944, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.06); } else o.frequency.value = f;
      lg.connect(o.frequency); o.connect(fl); o.start(t); o.stop(t + dur + 0.05);
    }
    lfo.start(t); lfo.stop(t + dur + 0.05);
    fl.connect(g); g.connect(mus);
  }
  function tickMusic() {
    if (!ctx) return;
    while (nextT < ctx.currentTime + 0.2) {
      const t = nextT, s16 = step % 16, barAll = Math.floor(step / 16) % 32;
      const sec = FORM[Math.floor(barAll / 8)], bar = barAll % 8;
      const ch = CH[(sec[0] === 'A' ? A_CH : B_CH)[bar]], mel = sec[0] === 'A' ? A_MEL : B_MEL;
      if (A.bgm && !A.paused) {
        // 쿵(킥) 짝(스네어+손뼉) 치(하이햇)
        if (s16 % 4 === 0) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.1); g.gain.setValueAtTime(s16 % 8 === 0 ? 0.9 : 0.6, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16); o.connect(g); g.connect(mus); o.start(t); o.stop(t + 0.18); }
        if (s16 === 4 || s16 === 12) { mNoise(t, 0.13, 0.42, 'bandpass', 1900); mNoise(t + 0.008, 0.08, 0.25, 'highpass', 2500); }
        if (s16 % 4 === 2) mNoise(t, 0.05, 0.28, 'highpass', 7500);
        if (s16 % 2 === 1) mNoise(t, 0.02, 0.08, 'highpass', 9000);
        // 트로트 베이스: 근음·옥타브·5도·옥타브
        if (s16 % 2 === 0) { const k = (s16 / 2) % 4, m = [ch[0], ch[0] + 12, ch[1], ch[1] + 12][k]; mNote(mf(m), t, S16 * 1.7, 'sawtooth', 0.2, 650); }
        // 뒷박 오르간(짝 자리)
        if (s16 % 4 === 2) for (const m of ch[2]) mNote(mf(m), t, S16 * 1.3, 'square', 0.025, 2200);
        // 가락(8분 칸)
        if (s16 % 2 === 0) {
          const i = bar * 8 + s16 / 2, m = mel[i];
          if (m > 0) {
            let len = 1; while (i + len < mel.length && mel[i + len] === -1 && len < 6) len++;
            const bend = i === 0 || mel[i - 1] === -1;
            lead(m, t, S16 * 2 * len * 0.92, 0.055, bend);
            if (sec[1]) mNote(mf(m - 12), t, S16 * 2 * len * 0.9, 'triangle', 0.05, 2500); // 되풀이 때 아래 옥타브 겹침
          }
        }
        // 8마디 끝마다 뿅 하고 내려가는 꾸밈
        if (bar === 7 && s16 === 12) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.setValueAtTime(1600, t); o.frequency.exponentialRampToValueAtTime(300, t + 0.25); g.gain.setValueAtTime(0.03, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28); o.connect(g); g.connect(mus); o.start(t); o.stop(t + 0.3); }
      }
      nextT += S16;
      step++;
    }
  }
  function startMusic() {
    nextT = ctx.currentTime + 0.1;
    mTimer = setInterval(tickMusic, 50);
  }
})();
