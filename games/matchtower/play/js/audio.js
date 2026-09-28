// 소리: 전부 코드로 만든다 (성냥 톡톡, 성냥갑 사각, 와르르, 다방 라운지 오르간)
(function () {
  const A = (window.AU = {});
  let ctx = null, sfx = null, mus = null, noiseBuf = null;
  const load = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v === '1'; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) {} };
  A.snd = load('matchtower.snd', true);
  A.bgm = load('matchtower.bgm', true);
  const SV = 0.8, MV = 0.16;

  function ensure() {
    if (ctx) return ctx;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    sfx = ctx.createGain();
    sfx.gain.value = A.snd ? SV : 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 6;
    sfx.connect(comp); comp.connect(ctx.destination);
    mus = ctx.createGain();
    mus.gain.value = A.bgm ? MV : 0;
    // 배경음 리미터: 소리가 한꺼번에 겹쳐도 찢어지지 않게
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -10; lim.knee.value = 6; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.2;
    mus.connect(lim); lim.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  A.unlock = function () {
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (!mTimer) startMusic();
  };
  A.setSnd = function (v) { A.snd = v; save('matchtower.snd', v); if (sfx) sfx.gain.value = v ? SV : 0; };
  A.setBgm = function (v) { A.bgm = v; save('matchtower.bgm', v); if (mus) mus.gain.value = v ? MV : 0; };

  function tone(f, t0, dur, type, vol, out, f2) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.3, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(out || sfx);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur, vol, type, freq, q, out, attack) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    s.playbackRate.value = 0.8 + Math.random() * 0.4;
    f.type = type; f.frequency.value = freq; f.Q.value = q || 1;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + (attack || 0.002));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(out || sfx);
    s.start(t0, Math.random() * 1.5); s.stop(t0 + dur + 0.05);
  }

  // 성냥개비 톡: 가볍고 높은 나무 소리
  let lastK = 0, kN = 0;
  A.knock = function (v) {
    if (!ensure() || !A.snd) return;
    const now = ctx.currentTime;
    if (now - lastK > 0.03) kN = 0;
    if (kN > 5) return;
    kN++; lastK = now;
    const t = now + Math.random() * 0.012;
    const vol = Math.min(0.32, 0.04 + v * 0.08);
    const f = 2600 + Math.random() * 1800;
    noise(t, 0.022, vol, 'bandpass', f * 1.3, 5);
    tone(f, t, 0.035, 'triangle', vol * 0.45);
    tone(f * 0.52, t, 0.05, 'sine', vol * 0.3);
  };
  // 내려놓기: 톡 + 작은 울림
  A.drop = function () {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime + 0.05;
    noise(t, 0.03, 0.22, 'bandpass', 3800, 4);
    tone(2400, t, 0.05, 'triangle', 0.12);
    tone(900, t, 0.08, 'sine', 0.1);
  };
  // 성냥갑 사각 (속갑이 미끄러지고 성냥들이 흔들림)
  A.rattle = function () {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    noise(t, 0.14, 0.2, 'bandpass', 2200, 1.2, null, 0.02);
    for (let i = 0; i < 5; i++) noise(t + 0.02 + i * 0.025 + Math.random() * 0.01, 0.02, 0.1, 'bandpass', 3000 + Math.random() * 2000, 6);
  };
  A.pick = function () {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    noise(t, 0.025, 0.16, 'bandpass', 4200, 5);
    tone(1800, t, 0.06, 'sine', 0.08, null, 2600);
  };
  A.tick = function () {
    if (!ensure() || !A.snd) return;
    noise(ctx.currentTime, 0.015, 0.08, 'highpass', 5000, 1);
  };
  A.click = function () {
    if (!ensure() || !A.snd) return;
    tone(900, ctx.currentTime, 0.05, 'triangle', 0.16);
  };
  // 심사 별: 줄마다 한 음씩 올라가고, 별이 많을수록 반짝임이 많다
  A.star = function (k, v) {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime, base = [659, 784, 988][k] || 659;
    tone(base, t, 0.3, 'triangle', 0.16);
    for (let i = 0; i < Math.round(v); i++) tone(base * 2 * (1 + i * 0.12), t + 0.06 + i * 0.05, 0.25, 'sine', 0.06);
  };
  A.best = function () {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.09, 0.4, 'sine', 0.16));
    tone(2349, t + 0.36, 0.6, 'sine', 0.08);
  };
  A.crash = function (k) {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    noise(t, 0.35, 0.1 + k * 0.15, 'bandpass', 2600, 0.8, null, 0.01);
    for (let i = 0; i < 8 + k * 10; i++) setTimeout(() => A.knock(0.6 + Math.random() * 2.2), 20 + i * (25 + Math.random() * 40));
  };
  A.sweep = function () {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    noise(t, 0.5, 0.18, 'bandpass', 1800, 0.7, null, 0.08);
    for (let i = 0; i < 16; i++) setTimeout(() => A.knock(0.5 + Math.random() * 1.5), 30 + i * 22);
  };

  // ---------- 배경음: 코드로 작곡한 다방 재즈 (F장조 16마디 느린 스윙, 108bpm) ----------
  // 워킹 베이스 + 로즈 피아노 엇박 반주 + 라이드·하이햇 + 색소폰 선율(다음 바퀴는 비브라폰), 작은 클럽 울림
  let mTimer = null, bar = 0, rev = null, dry = null;
  const mf = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const BPM = 108, BEAT = 60 / BPM;
  const sw = (b) => { const i = Math.floor(b), f = b - i; return i + (f >= 0.5 ? 2 / 3 + (f - 0.5) * (2 / 3) : f * (4 / 3)); }; // 스윙 8분
  // 마디: [시작박, 베이스 뿌리, 3도(3=단,4=장), 로즈 화음]
  const G7 = [[0, 43, 3, [58, 62, 65, 69]]], C7 = [[0, 36, 4, [58, 62, 64, 69]]], F7M = [[0, 41, 4, [57, 60, 64, 67]]];
  const BARS = [
    G7, C7, F7M, [[0, 38, 4, [60, 63, 66, 69]]],
    G7, C7, [[0, 45, 3, [60, 64, 67, 71]], [2, 38, 4, [60, 64, 66, 69]]], [[0, 43, 3, [58, 62, 65, 69]], [2, 36, 4, [58, 62, 64, 69]]],
    [[0, 36, 3, [63, 67, 70, 74]]], [[0, 41, 4, [63, 67, 69, 74]]], [[0, 34, 4, [62, 65, 69, 72]]], [[0, 34, 3, [61, 65, 67, 70]]],
    [[0, 45, 3, [60, 64, 67, 71]]], [[0, 38, 4, [60, 64, 66, 69]]], G7, [[0, 36, 4, [58, 62, 64, 69]], [2, 36, 4, [58, 62, 64, 70]]],
  ];
  // 선율: [박, 음, 길이]
  const MEL = [
    [[1, 70, .5], [1.5, 69, .5], [2, 67, 1], [3, 65, .5], [3.5, 67, .5]],
    [[0, 70, 1.5], [2, 69, .5], [2.5, 67, .5], [3, 64, 1]],
    [[0, 69, 2], [2.5, 72, .5], [3, 76, 1]],
    [[0, 75, 1], [1, 74, .5], [1.5, 72, .5], [2, 66, 1.5]],
    [[0, 67, .5], [.5, 70, .5], [1, 74, 1], [2, 72, .5], [2.5, 70, .5], [3, 69, 1]],
    [[0, 67, 1], [1, 64, .5], [1.5, 67, .5], [2, 70, 1.5]],
    [[0, 72, 1], [1, 69, 1], [2, 72, .5], [2.5, 74, .5], [3, 78, 1]],
    [[0, 77, 1.5], [2, 76, 1.5]],
    [[0, 75, .5], [.5, 74, .5], [1, 72, 1], [2, 70, 1], [3, 67, 1]],
    [[0, 69, 1.5], [1.5, 72, .5], [2, 75, 1.5]],
    [[0, 74, 2], [2, 69, 1], [3, 70, 1]],
    [[0, 73, 2], [2, 72, .5], [2.5, 70, .5], [3, 67, 1]],
    [[0, 72, 1], [1, 76, 1], [2, 79, 1.5]],
    [[0, 78, .5], [.5, 76, .5], [1, 74, 1], [2, 72, .5], [2.5, 69, .5], [3, 66, 1]],
    [[0, 67, 1], [1, 70, 1], [2, 74, 1], [3, 72, .5], [3.5, 70, .5]],
    [[0, 69, 1], [1, 67, .5], [1.5, 64, .5], [2, 65, 2]],
  ];
  function bus() {
    if (dry) return;
    dry = ctx.createGain(); dry.gain.value = 1; dry.connect(mus);
    rev = ctx.createConvolver();
    const len = ctx.sampleRate * 1.8, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    rev.buffer = ir;
    const rg = ctx.createGain(); rg.gain.value = 0.28;
    rev.connect(rg); rg.connect(mus);
  }
  const out = (node, wet) => { node.connect(dry); if (wet) { const g = ctx.createGain(); g.gain.value = wet; node.connect(g); g.connect(rev); } };
  function bass(n, t, dur) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = 'triangle'; o.frequency.value = mf(n); o2.type = 'sine'; o2.frequency.value = mf(n) * 2;
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    lp.type = 'lowpass'; lp.frequency.value = 700;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.75, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); out(g, 0.08);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  // 떨림(트레몰로)은 음량 봉투 '뒤'에 따로 곱한다 — 봉투가 0 이면 떨림도 0 (예전엔 봉투에 더해져서 음 끝마다 '틱' 하고 끊겼다)
  function tremolo(t, dur, rate, depth) {
    const tn = ctx.createGain(), lfo = ctx.createOscillator(), d = ctx.createGain();
    tn.gain.value = 1 - depth; lfo.frequency.value = rate; d.gain.value = depth;
    lfo.connect(d); d.connect(tn.gain);
    lfo.start(t); lfo.stop(t + dur);
    return tn;
  }
  // 로즈 화음: 화음 하나에 봉투·떨림 하나
  function rhodesChord(notes, t, dur, v) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.012);
    g.gain.exponentialRampToValueAtTime(v * 0.4, t + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const tn = tremolo(t, dur + 0.1, 4.5, 0.12);
    g.connect(tn); out(tn, 0.35);
    notes.forEach((n, k) => {
      const tk = t + k * 0.008;
      const o = ctx.createOscillator(), b = ctx.createOscillator(), bg = ctx.createGain();
      o.type = 'sine'; o.frequency.value = mf(n);
      b.type = 'sine'; b.frequency.value = mf(n) * 7.02;
      bg.gain.setValueAtTime(0.0001, tk); bg.gain.exponentialRampToValueAtTime(0.3, tk + 0.004); bg.gain.exponentialRampToValueAtTime(0.0001, tk + 0.12); // 딩 하는 첫 소리
      o.connect(g); b.connect(bg); bg.connect(g);
      o.start(tk); b.start(tk); o.stop(t + dur + 0.05); b.stop(tk + 0.15);
    });
  }
  function sax(n, t, dur, v) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter(), bp = ctx.createBiquadFilter();
    o.type = 'sawtooth'; o2.type = 'square'; o.frequency.value = mf(n); o2.frequency.value = mf(n) * 1.003;
    const g2 = ctx.createGain(); g2.gain.value = 0.35;
    lp.type = 'lowpass'; lp.Q.value = 2;
    lp.frequency.setValueAtTime(900, t); lp.frequency.linearRampToValueAtTime(2200, t + 0.08); lp.frequency.linearRampToValueAtTime(1500, t + dur);
    bp.type = 'peaking'; bp.frequency.value = 1100; bp.gain.value = 6;
    // 길게 부는 음에만 늦게 비브라토
    const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 5.2; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(dur > 0.6 ? mf(n) * 0.012 : 0, t + Math.min(dur, 0.5));
    vib.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
    // 살짝 아래에서 밀어 올려 부는 맛
    o.frequency.setValueAtTime(mf(n) * 0.97, t); o.frequency.linearRampToValueAtTime(mf(n), t + 0.05);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.04);
    g.gain.linearRampToValueAtTime(v * 0.85, t + Math.max(0.05, dur * 0.7));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
    o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(bp); bp.connect(g); out(g, 0.4);
    for (const x of [o, o2, vib]) { x.start(t); x.stop(t + dur + 0.15); }
  }
  function vibes(n, t, dur, v) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = ctx.createGain();
    o.frequency.value = mf(n); o2.frequency.value = mf(n) * 4; g2.gain.value = 0.15;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.9);
    const tn = tremolo(t, dur + 1, 5.5, 0.3);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(tn); out(tn, 0.5);
    for (const x of [o, o2]) { x.start(t); x.stop(t + dur + 1); }
  }
  function ride(t, v) {
    noise(t, 0.35, v, 'bandpass', 7800, 1.2, dry, 0.002);
    const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 5200 + Math.random() * 60;
    g.gain.setValueAtTime(v * 0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(g); g.connect(dry); o.start(t); o.stop(t + 0.45);
  }
  function startMusic() {
    bus();
    let next = ctx.currentTime + 0.3;
    const sched = () => {
      while (next < ctx.currentTime + 1.5) {
        const t = next, bi = bar % 16, chorus = Math.floor(bar / 16) % 3, segs = BARS[bi];
        // 워킹 베이스: 뿌리 → 3도/5도 → 반음 다가가기
        const nb = BARS[(bi + 1) % 16][0][1];
        segs.forEach((sg, si) => {
          const end = si + 1 < segs.length ? segs[si + 1][0] : 4, len = end - sg[0], r = sg[1];
          const nextR = si + 1 < segs.length ? segs[si + 1][1] : nb;
          const walk = len >= 4 ? [r, r + sg[2], r + 7, nextR + (nextR > r ? -1 : 1)] : [r, nextR + (nextR > r ? -1 : 1)];
          walk.forEach((n, k) => bass(n, t + (sg[0] + k) * BEAT, BEAT * 0.95));
          // 로즈: 첫 박 짧게 + 둘째 박 엇박(찰스턴) 길게, 둘째 바퀴는 조금 더 촘촘히
          const hits = len >= 4 ? (chorus === 1 ? [[0, .6], [1.5, 1], [3.5, .5]] : [[0, .8], [1.5, 1.4]]) : [[0, 1.2]];
          for (const [hb, hd] of hits) rhodesChord(sg[3], t + sw(sg[0] + hb) * BEAT, hd * BEAT, 0.07);
        });
        // 드럼: 라이드 딩 딩다 딩 딩다, 하이햇은 2·4
        for (const [b, v] of [[0, .09], [1, .09], [1.5, .06], [2, .09], [3, .09], [3.5, .06]]) ride(t + sw(b) * BEAT, v);
        for (const b of [1, 3]) noise(t + b * BEAT, 0.05, 0.07, 'highpass', 6500, 1, dry, 0.002);
        if (bi % 4 === 3) noise(t + sw(3.5) * BEAT, 0.12, 0.05, 'bandpass', 2000, 0.8, dry, 0.01); // 마디 끝 스네어 살짝
        // 선율: 첫 바퀴 색소폰, 둘째 바퀴는 선율 쉬고 반주만, 셋째 바퀴 비브라폰
        if (chorus !== 1) for (const [b, n, d] of MEL[bi]) (chorus === 0 ? sax : vibes)(chorus === 0 ? n - 12 : n, t + sw(b) * BEAT, d * BEAT, chorus === 0 ? 0.11 : 0.09);
        next += BEAT * 4;
        bar++;
      }
    };
    sched();
    mTimer = setInterval(sched, 300);
  }
})();
