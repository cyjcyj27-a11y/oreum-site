// 소리: 전부 코드로 합성(밝기 2kHz 아래로 편하게). 철판 지글거림은 걸러 낸 잡음
(function () {
  const A = (window.SND = {});
  let ctx = null, master = null, sfx = null, bgm = null, noiseB = null, comp = null;
  A.sfxOn = localStorage.getItem('hotteok.snd') !== '0';
  A.bgmOn = localStorage.getItem('hotteok.bgm') !== '0';
  A.ensure = function () {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ctx = new AC();
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
    master = ctx.createGain(); master.gain.value = A._muted ? 0 : 0.9; master.connect(lp); lp.connect(comp); comp.connect(ctx.destination);
    sfx = ctx.createGain(); sfx.gain.value = A.sfxOn ? 1 : 0; sfx.connect(master);
    bgm = ctx.createGain(); bgm.gain.value = A.bgmOn ? 0.3 : 0; bgm.connect(master);
    noiseB = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseB.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  };
  A.setSfx = (on) => { A.sfxOn = on; localStorage.setItem('hotteok.snd', on ? '1' : '0'); if (sfx) sfx.gain.value = on ? 1 : 0; };
  A.mute = () => { if (master) master.gain.value = 0; A._muted = true; };

  function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function osc(type, f, t, a, peak, d, out, f2) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    env(g, t, a, peak, d); o.connect(g); g.connect(out || sfx); o.start(t); o.stop(t + a + d + 0.05); return o;
  }
  function noise(t, dur, peak, type, f, q, out, f2, att) {
    const s = ctx.createBufferSource(); s.buffer = noiseB;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q || 1;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = ctx.createGain(); env(g, t, att || 0.005, peak, dur);
    s.connect(fl); fl.connect(g); g.connect(out || sfx); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  const ok = () => A.ensure() && ctx;

  // 철판 지글거림: 계속 도는 잡음, 세기만 바꿈
  let siz = null;
  A.sizzle = function (k) {
    if (!ctx) return;
    if (!siz) {
      const s = ctx.createBufferSource(); s.buffer = noiseB; s.loop = true;
      const hp = ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 1400; hp.Q.value = 0.6;
      const g = ctx.createGain(); g.gain.value = 0;
      // 탁탁 튀는 느낌: 빠르게 떨리는 세기
      const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 17; const lg = ctx.createGain(); lg.gain.value = 0; lfo.connect(lg); lg.connect(g.gain);
      s.connect(hp); hp.connect(g); g.connect(sfx); s.start(); lfo.start(); siz = { g, lg, hp };
    }
    const v = Math.min(0.11, k * 0.035);
    siz.g.gain.setTargetAtTime(v, ctx.currentTime, 0.2); siz.lg.gain.setTargetAtTime(v * 0.35, ctx.currentTime, 0.2);
  };
  // 반죽 철퍽
  A.plop = function () { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.09, 0.5, 'lowpass', 700, 1, null, 200); osc('sine', 180, t, 0.004, 0.45, 0.12, null, 70); };
  // 숟가락 달각 + 설탕 사르르
  A.spoon = function () { if (!ok()) return; const t = ctx.currentTime; osc('triangle', 1250, t, 0.002, 0.08, 0.12); osc('sine', 1870, t, 0.002, 0.03, 0.08); noise(t + 0.08, 0.22, 0.12, 'bandpass', 1500, 1.5, null, 900, 0.03); };
  // 오므리기: 쫀득
  let rubT = 0;
  A.rub = function () { if (!ok()) return; const t = ctx.currentTime; if (t - rubT < 0.12) return; rubT = t; noise(t, 0.08, 0.1, 'lowpass', 520, 2, null, 300, 0.02); osc('sine', 140 + Math.random() * 40, t, 0.01, 0.08, 0.07); };
  A.closed = function () { if (!ok()) return; const t = ctx.currentTime; osc('sine', 330, t, 0.006, 0.2, 0.1, null, 520); osc('triangle', 660, t + 0.08, 0.006, 0.12, 0.2); };
  // 철판에 올림: 치이익
  A.drop = function () { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.9, 0.32, 'bandpass', 1500, 0.7, null, 1100, 0.01); osc('sine', 150, t, 0.004, 0.35, 0.12, null, 60); };
  // 뒤집기: 휙 + 치익
  A.flip = function () { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.16, 0.18, 'bandpass', 600, 1, null, 1500, 0.04); noise(t + 0.24, 0.6, 0.26, 'bandpass', 1500, 0.7, null, 1100); osc('sine', 130, t + 0.24, 0.004, 0.3, 0.1, null, 60); };
  // 누르기: 꾹(낮게) + 치익
  A.press = function () { if (!ok()) return; const t = ctx.currentTime; osc('sine', 110, t, 0.01, 0.35, 0.18, null, 70); noise(t, 0.5, 0.2, 'bandpass', 1200, 0.8, null, 900, 0.02); };
  // 설탕 터짐: 부글 + 치이익
  A.burst = function () { if (!ok()) return; const t = ctx.currentTime; for (let i = 0; i < 6; i++) osc('sine', 220 + Math.random() * 180, t + i * 0.05, 0.004, 0.12, 0.06, null, 120); noise(t, 1.0, 0.3, 'bandpass', 1300, 0.6, null, 800, 0.01); osc('triangle', 196, t + 0.1, 0.01, 0.16, 0.3, null, 147); };
  // 가위 싹둑(두 번 낮은 딸깍)
  A.snip = function () { if (!ok()) return; const t = ctx.currentTime; [0, 0.11].forEach((d) => { noise(t + d, 0.05, 0.35, 'bandpass', 1700, 3); osc('triangle', 820, t + d, 0.002, 0.1, 0.05, null, 500); }); };
  // 씨앗 쏟아짐: 작은 톡톡 여러 번
  A.seeds = function () { if (!ok()) return; const t = ctx.currentTime; for (let i = 0; i < 22; i++) { const d = i * 0.022 + Math.random() * 0.02; noise(t + d, 0.02, 0.18 * (1 - i / 26), 'bandpass', 1300 + Math.random() * 500, 4); } };
  // 기름 쭉 + 치익
  A.oil = function () { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.25, 0.18, 'lowpass', 900, 1, null, 400, 0.03); noise(t + 0.2, 0.7, 0.24, 'bandpass', 1600, 0.6, null, 1100); };
  // 종이컵에 담아 건넴
  A.serve = function () { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.07, 0.25, 'bandpass', 1100, 1.4); osc('triangle', 523, t + 0.05, 0.005, 0.14, 0.15); osc('triangle', 784, t + 0.13, 0.005, 0.12, 0.22); };
  A.coin = function () { if (!ok()) return; const t = ctx.currentTime; osc('triangle', 784, t, 0.004, 0.16, 0.12); osc('triangle', 1175, t + 0.07, 0.004, 0.14, 0.22); };
  A.perfect = function () { if (!ok()) return; const t = ctx.currentTime; [659, 784, 988, 1318].forEach((f, i) => { osc('triangle', f, t + i * 0.06, 0.004, 0.17, 0.3); osc('sine', f / 2, t + i * 0.06, 0.004, 0.06, 0.25); }); };
  A.no = function () { if (!ok()) return; const t = ctx.currentTime; osc('triangle', 262, t, 0.01, 0.2, 0.14); osc('triangle', 220, t + 0.15, 0.01, 0.2, 0.22); };
  A.angry = function () { if (!ok()) return; const t = ctx.currentTime; osc('sawtooth', 120, t, 0.02, 0.06, 0.35, null, 90); osc('triangle', 196, t, 0.01, 0.2, 0.35, null, 150); };
  // 손님 옴: 문 종 대신 노점 앞 작은 방울
  A.bell = function () { if (!ok()) return; const t = ctx.currentTime; [0, 0.12].forEach((d, i) => { osc('sine', 880 - i * 110, t + d, 0.003, 0.14, 0.6); osc('sine', 1320 - i * 165, t + d, 0.003, 0.04, 0.35); }); };
  A.ui = function () { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.03, 0.25, 'bandpass', 900, 2); osc('sine', 520, t, 0.002, 0.12, 0.05); };
  A.clear = function () { if (!ok()) return; const t = ctx.currentTime; [523, 659, 784, 1046].forEach((f, i) => { osc('triangle', f, t + i * 0.09, 0.006, 0.18, 0.35); }); };
  A.fail = function () { if (!ok()) return; const t = ctx.currentTime; [392, 330, 262].forEach((f, i) => osc('triangle', f, t + i * 0.16, 0.01, 0.18, 0.3)); };
  A.honey = function () { if (!ok()) return; const t = ctx.currentTime; [523, 659, 784, 1046, 1318].forEach((f, i) => { osc('triangle', f, t + i * 0.07, 0.006, 0.18, 0.4); osc('sine', f * 0.5, t + i * 0.07, 0.006, 0.08, 0.4); }); };
  A.fanfare = function () { if (!ok()) return; const t = ctx.currentTime; const n = [523, 659, 784, 1046, 784, 1046, 1318]; n.forEach((f, i) => { osc('triangle', f, t + i * 0.13, 0.01, 0.2, i === n.length - 1 ? 1.2 : 0.3); osc('sine', f / 2, t + i * 0.13, 0.01, 0.1, 0.3); }); };
  A.pop = function () { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.25, 0.25, 'lowpass', 600, 1, null, 150); osc('sine', 90, t, 0.004, 0.3, 0.3, null, 50); };

  // 배경음: 저작권 끝난 캐롤 두 곡을 코드로 연주해 번갈아 튼다(곡마다 두 바퀴, 사이에 한 마디 쉼)
  //  · 고요한 밤(Stille Nacht, 1818 그루버) — 8분의 6박자, 첼레스타 선율 → 둘째 바퀴 플루트, 오르간 화음 + 하프 펼침 + 낮은 베이스
  //  · 징글벨(Jingle Bells, 1857 피어폰트) — 4분의 4박자, 앞소리(Dashing through the snow) + 후렴, 첼레스타 선율 + 쿵짝 베이스·화음 + 썰매 방울
  // 밝기는 2kHz 아래(방울 소리도 1.8kHz 띠로 걸러 작게)
  const BGM_VOL = 0.3;
  const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const C = [48, 52, 55], G = [43, 47, 50], G7 = [43, 47, 50, 53], F = [41, 45, 48], D7 = [38, 42, 45, 48];
  // 선율은 [음(미디, 0 = 쉼), 8분음표 몇 개]
  const SONGS = [
    { // 고요한 밤
      unit: 60 / 66 / 2, perBar: 6,
      mel: [[67, 3], [69, 1], [67, 2], [64, 6], [67, 3], [69, 1], [67, 2], [64, 6], [74, 4], [74, 2], [71, 6], [72, 4], [72, 2], [67, 6],
        [69, 4], [69, 2], [72, 3], [71, 1], [69, 2], [67, 3], [69, 1], [67, 2], [64, 6], [69, 4], [69, 2], [72, 3], [71, 1], [69, 2], [67, 3], [69, 1], [67, 2], [64, 6],
        [74, 4], [74, 2], [77, 3], [74, 1], [71, 2], [72, 6], [76, 6], [72, 3], [67, 1], [64, 2], [67, 3], [65, 1], [62, 2], [60, 6], [0, 6]],
      bars: [C, C, C, C, G, G, C, C, F, F, C, C, F, F, C, C, G, G7, C, C, C, G7, C, C],
      acc(beat, ch, t, u) {
        if (beat === 0) { osc('sine', mf(ch[0] - 12), t, 0.02, 0.16, u * 5.5, bgm); pad(ch, t, u * 6, 0.022); }
        if (beat === 3) osc('sine', mf(ch[0] - 12 + 7), t, 0.02, 0.09, u * 2.6, bgm);
        const arp = [0, 1, 2, 1, 2, 1][beat]; osc('triangle', mf(ch[Math.min(arp, ch.length - 1)] + 12), t, 0.005, 0.045, u * 1.6, bgm);
      },
      voice: (pass) => (pass % 2 ? 'flute' : 'celesta'),
    },
    { // 징글벨
      unit: 60 / 132 / 2, perBar: 8,
      mel: [
        // 앞소리 1: Dashing through the snow ~ laughing all the way
        [67, 2], [76, 2], [74, 2], [72, 2], [67, 6], [67, 1], [67, 1], [67, 2], [76, 2], [74, 2], [72, 2], [69, 8],
        [69, 2], [77, 2], [76, 2], [74, 2], [71, 8], [79, 2], [79, 2], [77, 2], [74, 2], [76, 8],
        // 앞소리 2: Bells on bob-tail ring ~ sleighing song tonight
        [67, 2], [76, 2], [74, 2], [72, 2], [67, 8], [67, 2], [76, 2], [74, 2], [72, 2], [69, 6], [69, 2],
        [69, 2], [77, 2], [76, 2], [74, 2], [79, 2], [79, 2], [79, 2], [79, 2], [81, 2], [79, 2], [77, 2], [74, 2], [72, 4], [79, 4],
        // 후렴: Jingle bells, jingle bells, jingle all the way
        [76, 2], [76, 2], [76, 4], [76, 2], [76, 2], [76, 4], [76, 2], [79, 2], [72, 3], [74, 1], [76, 8],
        [77, 2], [77, 2], [77, 3], [77, 1], [77, 2], [76, 2], [76, 2], [76, 1], [76, 1], [76, 2], [74, 2], [74, 2], [76, 2], [74, 4], [79, 4],
        [76, 2], [76, 2], [76, 4], [76, 2], [76, 2], [76, 4], [76, 2], [79, 2], [72, 3], [74, 1], [76, 8],
        [77, 2], [77, 2], [77, 2], [77, 2], [77, 2], [76, 2], [76, 2], [76, 1], [76, 1], [79, 2], [79, 2], [77, 2], [74, 2], [72, 6], [0, 2],
      ],
      bars: [C, C, C, F, F, G, G7, C, C, C, C, F, F, G, G7, C, C, C, C, C, F, C, D7, G, C, C, C, C, F, C, G7, C],
      acc(beat, ch, t, u) {
        // 쿵(베이스) 짝(짧은 화음) 4박, 8분음표마다 썰매 방울
        if (beat === 0 || beat === 4) osc('sine', mf(ch[0] - 12 + (beat === 4 ? 7 : 0)), t, 0.01, 0.17, u * 1.6, bgm);
        if (beat === 2 || beat === 6) ch.forEach((n) => osc('triangle', mf(n + 12), t, 0.005, 0.03, u * 1.2, bgm));
        noise(t, 0.05, beat % 2 ? 0.018 : 0.03, 'bandpass', 1800, 3, bgm);
      },
      voice: () => 'celesta',
    },
  ];
  SONGS.forEach((s) => { s.start = new Map(); let k = 0; s.mel.forEach(([n, l]) => { s.start.set(k, [n, l]); k += l; }); s.total = s.bars.length * s.perBar; });
  // 첼레스타: 사인 + 짧게 사라지는 배음 2·3·4배(맑은 종소리)
  function celesta(f, t, d, v) {
    [[1, 1, 1.0], [2, 0.32, 0.35], [3, 0.12, 0.2], [4, 0.06, 0.12]].forEach(([m, a, dd]) => {
      if (f * m > 2600) return;
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f * m;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * a, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.25, d * dd * 2.2));
      o.connect(g); g.connect(bgm); o.start(t); o.stop(t + Math.max(0.3, d * 2.4) + 0.1);
    });
  }
  // 플루트: 사인 + 떨림(비브라토), 부드러운 시작과 끝
  function flute(f, t, d, v) {
    const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f; lfo.frequency.value = 5.2; lg.gain.value = f * 0.008; lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.08); g.gain.setValueAtTime(v * 0.85, t + d * 0.8); g.gain.linearRampToValueAtTime(0.0001, t + d * 1.05);
    const o2 = ctx.createOscillator(), g2 = ctx.createGain(); o2.type = 'triangle'; o2.frequency.value = f * 2; g2.gain.value = 0.08; o2.connect(g2); g2.connect(g);
    o.connect(g); g.connect(bgm); [o, o2, lfo].forEach((x) => { x.start(t); x.stop(t + d * 1.1 + 0.05); });
  }
  // 오르간 화음: 세모파, 천천히 커졌다 작아짐
  function pad(notes, t, d, v) {
    notes.forEach((n) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = mf(n + 12); o.detune.value = (Math.random() - 0.5) * 8;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + d * 0.3); g.gain.linearRampToValueAtTime(v * 0.7, t + d * 0.8); g.gain.linearRampToValueAtTime(0.0001, t + d * 1.02);
      o.connect(g); g.connect(bgm); o.start(t); o.stop(t + d * 1.05); });
  }
  let bgmT = 0, song = 0, step = 0, pass = 0, rest = 0, playing = false, timer = 0;
  A.song = () => ({ song, pass, step });
  function sched() {
    if (!playing) return;
    while (bgmT < ctx.currentTime + 0.8) {
      const S = SONGS[song], u = S.unit;
      if (rest > 0) { rest--; bgmT += u; continue; } // 곡 사이 쉼
      const bar = Math.floor(step / S.perBar), beat = step % S.perBar;
      S.acc(beat, S.bars[bar], bgmT, u);
      const m = S.start.get(step);
      if (m && m[0]) { const d = u * m[1]; if (S.voice(pass) === 'flute') flute(mf(m[0]), bgmT, d, 0.1); else celesta(mf(m[0]), bgmT, d, 0.13); }
      bgmT += u; step++;
      if (step >= S.total) { step = 0; pass++; if (pass >= 2) { pass = 0; song = (song + 1) % SONGS.length; rest = SONGS[song].perBar; } }
    }
    timer = setTimeout(sched, 200);
  }
  A.setBgm = (on) => { A.bgmOn = on; localStorage.setItem('hotteok.bgm', on ? '1' : '0'); if (bgm) bgm.gain.setTargetAtTime(on && !A._muted ? BGM_VOL : 0, ctx.currentTime, 0.1); };
  A.startBgm = function () { if (!ok() || playing) return; bgm.gain.value = A.bgmOn ? BGM_VOL : 0; playing = true; bgmT = ctx.currentTime + 0.15; song = 0; step = 0; pass = 0; rest = 0; sched(); };
  A.songs = SONGS;
})();
