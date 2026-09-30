// 개구리 점프 — 소리는 전부 Web Audio 로 만든다(파일 없음)
(function () {
  'use strict';
  // 폴더 이름을 jump → controlking 으로 바꾸면서 저장 키도 바꿨다. 옛 기록이 있으면 새 키로 옮겨 담는다
  try {
    ['save', 'save.dog', 'snd', 'bgm', 'char'].forEach(k => {
      const o = localStorage.getItem('jump.' + k);
      if (o !== null && localStorage.getItem('controlking.' + k) === null) localStorage.setItem('controlking.' + k, o);
    });
  } catch (e) {}
  const AU = { ctx: null, sfxOn: true, bgmOn: true, band: -1, want: 0, nextT: 0, step: 0, chargeO: null };
  try { AU.sfxOn = localStorage.getItem('controlking.snd') !== '0'; AU.bgmOn = localStorage.getItem('controlking.bgm') !== '0'; } catch (e) {}

  function init() {
    if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    const c = AU.ctx = new C();
    AU.master = c.createGain(); AU.master.gain.value = 0.85; AU.master.connect(c.destination);
    AU.sfx = c.createGain(); AU.sfx.gain.value = AU.sfxOn ? 1 : 0; AU.sfx.connect(AU.master);
    AU.bgm = c.createGain(); AU.bgm.gain.value = AU.bgmOn ? 0.32 : 0; AU.bgm.connect(AU.master);
    AU.verb = c.createConvolver(); AU.verb.buffer = impulse(2.2, 2.6);
    AU.verbG = c.createGain(); AU.verbG.gain.value = 0.3; AU.verb.connect(AU.verbG); AU.verbG.connect(AU.master);
    AU.nextT = c.currentTime + 0.1;
  }
  function impulse(sec, decay) {
    const c = AU.ctx, n = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
    return b;
  }
  let nb = null;
  function noise() {
    if (!nb) { const c = AU.ctx, n = c.sampleRate; nb = c.createBuffer(1, n, c.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; }
    return nb;
  }
  function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  function out(node, dest, wet) { node.connect(dest || AU.sfx); if (wet) { const w = AU.ctx.createGain(); w.gain.value = wet; node.connect(w); w.connect(AU.verb); } }
  function tone(t, f, dur, type, peak, f2, dest, wet) {
    const c = AU.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    env(g, t, 0.005, peak, dur); o.connect(g); out(g, dest, wet); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function nz(t, dur, f, q, peak, type, dest, wet) {
    const c = AU.ctx, s = c.createBufferSource(); s.buffer = noise();
    const fl = c.createBiquadFilter(); fl.type = type || 'bandpass'; fl.frequency.value = f; fl.Q.value = q;
    const g = c.createGain(); env(g, t, 0.004, peak, dur);
    s.connect(fl); fl.connect(g); out(g, dest, wet); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
    return fl;
  }
  const wetNow = () => AU.band === 0 ? 0.5 : 0.12;   // 우물 안은 울린다

  // ── 효과음 ──
  const S = {
    chargeOn(dur) {
      if (!AU.ctx || AU.chargeO) return;
      const c = AU.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain(), o2 = c.createOscillator(), g2 = c.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(170, t); o.frequency.exponentialRampToValueAtTime(560, t + dur);
      o2.type = 'sine'; o2.frequency.value = 22; g2.gain.value = 10; o2.connect(g2); g2.connect(o.frequency);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.05);
      o.connect(g); out(g); o.start(t); o2.start(t);
      AU.chargeO = { o, o2, g };
    },
    chargeOff() {
      if (!AU.chargeO) return;
      const { o, o2, g } = AU.chargeO, t = AU.ctx.currentTime;
      g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      o.stop(t + 0.08); o2.stop(t + 0.08); AU.chargeO = null;
    },
    jump(c) {
      if (!AU.ctx) return; S.chargeOff(); const t = AU.ctx.currentTime, w = wetNow();
      tone(t, 260 + c * 120, 0.16 + c * 0.1, 'sine', 0.22, 620 + c * 500, null, w);
      nz(t, 0.14 + c * 0.1, 1800 + c * 1500, 0.8, 0.07 + c * 0.06, 'bandpass', null, w);
    },
    land(f) {
      if (!AU.ctx) return; const t = AU.ctx.currentTime, k = Math.min(1, f / 500), w = wetNow();
      tone(t, 150, 0.1 + k * 0.08, 'sine', 0.16 + k * 0.2, 55, null, w);
      nz(t, 0.06 + k * 0.08, 500, 0.7, 0.05 + k * 0.12, 'lowpass', null, w);
      tone(t + 0.01, 520, 0.05, 'sine', 0.05, 300);
    },
    splat() {
      if (!AU.ctx) return; const t = AU.ctx.currentTime, w = wetNow();
      tone(t, 120, 0.3, 'sine', 0.5, 40, null, w);
      nz(t, 0.28, 380, 0.6, 0.35, 'lowpass', null, w);
      nz(t + 0.02, 0.12, 1400, 2, 0.12, 'bandpass', null, w);
      tone(t + 0.12, 900, 0.5, 'sine', 0.05, 300, null, w);
      for (let i = 0; i < 3; i++) tone(t + 0.35 + i * 0.12, 1200 - i * 150, 0.08, 'triangle', 0.05, null, null, w);
    },
    bonk(sp) {
      if (!AU.ctx) return; const t = AU.ctx.currentTime, k = Math.min(1, sp / 250), w = wetNow();
      nz(t, 0.05, 900, 3, 0.08 + k * 0.1, 'bandpass', null, w); tone(t, 240, 0.08, 'triangle', 0.08 + k * 0.08, 150, null, w);
    },
    eat() {
      if (!AU.ctx) return; const t = AU.ctx.currentTime;
      nz(t, 0.04, 4000, 1, 0.08, 'highpass');
      tone(t + 0.07, 540, 0.07, 'sine', 0.2, 980); tone(t + 0.15, 300, 0.09, 'sine', 0.12, 180);
    },
    gold() {
      if (!AU.ctx) return; const t = AU.ctx.currentTime;
      [523, 659, 784, 1047, 1319].forEach((f, i) => { tone(t + i * 0.08, f, 0.5, 'triangle', 0.12, null, null, 0.5); tone(t + i * 0.08, f * 2, 0.3, 'sine', 0.04, null, null, 0.5); });
    },
    spring() {
      if (!AU.ctx) return; const t = AU.ctx.currentTime, c = AU.ctx, o = c.createOscillator(), g = c.createGain(), lf = c.createOscillator(), lg = c.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(620, t + 0.35);
      lf.frequency.value = 16; lg.gain.value = 40; lf.connect(lg); lg.connect(o.frequency);
      env(g, t, 0.01, 0.25, 0.4); o.connect(g); out(g); o.start(t); lf.start(t); o.stop(t + 0.5); lf.stop(t + 0.5);
    },
    crumble() {
      if (!AU.ctx) return; const t = AU.ctx.currentTime;
      for (let i = 0; i < 6; i++) nz(t + i * 0.035 + Math.random() * 0.02, 0.05, 700 + Math.random() * 1500, 2, 0.1, 'bandpass');
      nz(t + 0.1, 0.3, 300, 0.7, 0.12, 'lowpass');
    },
    back() { if (!AU.ctx) return; nz(AU.ctx.currentTime, 0.2, 1200, 0.8, 0.04, 'bandpass'); },
    zone() {
      if (!AU.ctx) return; const t = AU.ctx.currentTime;
      [392, 523, 659, 784, 1047].forEach((f, i) => tone(t + i * 0.11, f, i === 4 ? 0.9 : 0.22, 'square', 0.05, null, null, 0.3));
      [523, 659, 784].forEach(f => tone(t + 0.44, f, 1.0, 'triangle', 0.08, null, null, 0.4));
    },
    magic() { if (!AU.ctx) return; const t = AU.ctx.currentTime; for (let i = 0; i < 10; i++) tone(t + i * 0.06, 800 + i * 140, 0.4, 'sine', 0.06, null, null, 0.6); },
    crow() {
      if (!AU.ctx) return; const c = AU.ctx, t0 = c.currentTime;
      for (let k = 0; k < 2; k++) {
        const t = t0 + k * 0.28, o = c.createOscillator(), g = c.createGain(), f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(620, t); o.frequency.linearRampToValueAtTime(520, t + 0.08); o.frequency.exponentialRampToValueAtTime(380, t + 0.2);
        f1.type = 'bandpass'; f1.frequency.value = 1300; f1.Q.value = 4; f2.type = 'bandpass'; f2.frequency.value = 2600; f2.Q.value = 6;
        env(g, t, 0.01, 0.22, 0.2); o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); out(g, null, 0.2);
        nz(t, 0.18, 2200, 2, 0.05, 'bandpass'); o.start(t); o.stop(t + 0.26);
      }
    },
    ribbit() {
      if (!AU.ctx) return; const c = AU.ctx, t0 = c.currentTime;
      for (let k = 0; k < 2; k++) {
        const t = t0 + k * 0.16, o = c.createOscillator(), g = c.createGain(), am = c.createOscillator(), ag = c.createGain(), f = c.createBiquadFilter();
        o.type = 'square'; o.frequency.setValueAtTime(k ? 150 : 170, t); o.frequency.linearRampToValueAtTime(k ? 130 : 200, t + 0.11);
        am.frequency.value = 38; ag.gain.value = 0.5; am.connect(ag);
        f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 2.5;
        env(g, t, 0.01, 0.16, 0.11); ag.connect(g.gain); o.connect(f); f.connect(g); out(g, null, wetNow());
        o.start(t); am.start(t); o.stop(t + 0.14); am.stop(t + 0.14);
      }
    },
    hatch() {                                  // 나무 뚜껑문이 탁 열림
      if (!AU.ctx) return; const t = AU.ctx.currentTime;
      nz(t, 0.06, 700, 2, 0.14, 'bandpass', null, wetNow()); tone(t, 180, 0.09, 'triangle', 0.12, 110, null, wetNow());
      nz(t + 0.28, 0.05, 900, 2, 0.06, 'bandpass'); tone(t + 0.28, 220, 0.06, 'triangle', 0.05, 140);
    },
    magpie() {                                 // 까치 떼 푸드덕 + 깍깍
      if (!AU.ctx) return; const t = AU.ctx.currentTime;
      for (let i = 0; i < 8; i++) nz(t + i * 0.035, 0.05, 1200 + Math.random() * 800, 1.2, 0.06, 'bandpass');
      for (let i = 0; i < 3; i++) tone(t + 0.05 + i * 0.09, 2400 - i * 200, 0.06, 'square', 0.03, 1600);
    },
    thunder() {                                // 우르릉
      if (!AU.ctx) return; const t = AU.ctx.currentTime;
      nz(t, 0.08, 3000, 0.6, 0.08, 'highpass');
      nz(t + 0.05, 1.6, 180, 0.7, 0.35, 'lowpass', null, 0.4); tone(t + 0.05, 60, 1.4, 'sine', 0.25, 35);
    },
    servo() { if (!AU.ctx) return; const t = AU.ctx.currentTime; tone(t, 420, 0.12, 'sawtooth', 0.04, 900); nz(t, 0.08, 3000, 3, 0.03, 'bandpass'); },
    zap(big) {                                 // 배터리 충전: 지지직 + 위로 올라가는 전자음
      if (!AU.ctx) return; const t = AU.ctx.currentTime;
      nz(t, 0.08, 5000, 2, 0.05, 'bandpass');
      tone(t + 0.03, big ? 500 : 700, big ? 0.35 : 0.14, 'square', big ? 0.06 : 0.045, big ? 2200 : 1600);
      tone(t + 0.03, big ? 1000 : 1400, big ? 0.35 : 0.14, 'sine', 0.04, big ? 4400 : 3200);
    },
    beep() { if (!AU.ctx) return; const t = AU.ctx.currentTime; tone(t, 1320, 0.07, 'square', 0.05); tone(t + 0.1, 1760, 0.09, 'square', 0.05); },
    crash() {                                  // 쇳덩이가 와장창
      if (!AU.ctx) return; const t = AU.ctx.currentTime, w = wetNow();
      tone(t, 90, 0.35, 'sine', 0.45, 40, null, w); nz(t, 0.3, 2500, 1.2, 0.25, 'bandpass', null, w);
      for (let i = 0; i < 7; i++) { const tt = t + 0.05 + Math.random() * 0.4; tone(tt, 1200 + Math.random() * 2400, 0.12, 'triangle', 0.05, null, null, w); }
      tone(t + 0.3, 600, 0.5, 'square', 0.04, 120);
    },
    repair() {                                 // 수리 삐빅삐빅 + 윙
      if (!AU.ctx) return; const t = AU.ctx.currentTime;
      [880, 1175, 988, 1320, 1568].forEach((f, i) => tone(t + i * 0.12, f, 0.08, 'square', 0.045));
      tone(t + 0.3, 300, 0.6, 'sawtooth', 0.03, 1200); nz(t + 0.3, 0.6, 4000, 2, 0.03, 'bandpass', null, 0.4);
    },
    step() { if (!AU.ctx) return; nz(AU.ctx.currentTime, 0.03, 1500, 1.5, 0.03, 'bandpass'); },
    end() {
      if (!AU.ctx) return; const t = AU.ctx.currentTime;
      const mel = [523, 587, 659, 784, 880, 784, 1047];
      mel.forEach((f, i) => { tone(t + i * 0.18, f, 0.5, 'triangle', 0.1, null, null, 0.5); tone(t + i * 0.18, f / 2, 0.5, 'sine', 0.06); });
      [523, 659, 784, 1047].forEach(f => tone(t + 1.3, f, 2.4, 'triangle', 0.07, null, null, 0.6));
    }
  };

  // ── 배경음: 높이에 따라 네 가지 결 ──
  // 0 우물(울리는 뜯는 소리) · 1 마을·나무(밝은 오음계) · 2 언덕·폭포(힘찬 북) · 3 구름·꼭대기(꿈결)
  const BANDS = [
    { bpm: 84, root: 57, scale: [0, 3, 5, 7, 10], chords: [0, 0, -4, -2], lead: 'triangle', drum: 0, wet: 0.7 },
    { bpm: 112, root: 60, scale: [0, 2, 4, 7, 9], chords: [0, 5, -3, 7], lead: 'square', drum: 1, wet: 0.15 },
    { bpm: 124, root: 57, scale: [0, 3, 5, 7, 10], chords: [0, -4, -2, -5], lead: 'sawtooth', drum: 2, wet: 0.15 },
    { bpm: 92, root: 62, scale: [0, 2, 4, 7, 9], chords: [0, -5, -3, 2], lead: 'sine', drum: 0, wet: 0.6 },
    { bpm: 118, root: 64, scale: [0, 2, 4, 7, 9], chords: [0, 5, 7, 4], lead: 'triangle', drum: 1, wet: 0.3 },
    { bpm: 76, root: 59, scale: [0, 2, 4, 7, 11], chords: [0, -3, 5, -5], lead: 'sine', drum: 0, wet: 0.85 }
  ];
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let phrase = [];
  function makePhrase(B) {
    seed = 11 + AU.band * 31; phrase = [];
    for (let i = 0; i < 32; i++) {
      const on = B.drum === 0 ? (i % 4 === 0 || rnd() < 0.18) : (i % 2 === 0 ? rnd() < 0.8 : rnd() < 0.3);
      phrase.push(on ? Math.floor(rnd() * B.scale.length) + (rnd() < 0.3 ? 5 : 0) : -1);
    }
  }
  function note(B, deg) { const oct = Math.floor(deg / B.scale.length); return B.root + B.scale[deg % B.scale.length] + 12 * oct; }
  function schedule() {
    if (!AU.ctx || AU.band < 0) return;
    const c = AU.ctx, B = BANDS[AU.band], sp = 60 / B.bpm / 4;
    while (AU.nextT < c.currentTime + 0.2) {
      const t = AU.nextT, i = AU.step % 32, bar = Math.floor(AU.step / 16) % 4, ch = B.chords[bar];
      if (AU.bgmOn) {
        const d = phrase[i];
        if (d >= 0) {
          const f = mtof(note(B, d) + ch + 12);
          const o = tone(t, f, B.drum === 0 ? 0.6 : 0.16, B.lead, B.lead === 'sine' ? 0.12 : B.lead === 'triangle' ? 0.1 : 0.035, null, AU.bgm, B.wet);
          if (B.drum === 1 && d % 2 === 0) tone(t, f * 1.5, 0.12, 'triangle', 0.03, null, AU.bgm);
        }
        if (i % 8 === 0) { const f = mtof(B.root + ch - 12); tone(t, f, sp * 7, 'triangle', 0.14, null, AU.bgm); tone(t, f * 2, sp * 7, 'sine', 0.05, null, AU.bgm); }
        if (B.drum === 1) { if (i % 8 === 0) tone(t, 120, 0.12, 'sine', 0.3, 45, AU.bgm); if (i % 4 === 2) nz(t, 0.04, 8000, 1, 0.05, 'highpass', AU.bgm); if (i % 8 === 4) nz(t, 0.1, 1800, 0.8, 0.08, 'bandpass', AU.bgm); }
        if (B.drum === 2) { if (i % 4 === 0) tone(t, 110, 0.16, 'sine', 0.35, 40, AU.bgm); if (i % 2 === 1) nz(t, 0.03, 9000, 1, 0.04, 'highpass', AU.bgm); if (i % 8 === 4) nz(t, 0.14, 1500, 0.7, 0.12, 'bandpass', AU.bgm); }
        if (B.drum === 0 && AU.band >= 3 && i % 16 === 0) [0, 4, 7].forEach(k => tone(t, mtof(B.root + ch + k), sp * 15, 'sine', 0.035, null, AU.bgm, 0.8));
        if (AU.band === 0 && i % 16 === 6 && rnd() < 0.6) tone(t, 1800 + rnd() * 900, 0.08, 'sine', 0.04, 900, AU.bgm, 0.9);  // 물방울
      }
      AU.nextT += sp; AU.step++;
    }
  }
  function setBand(b) { if (b === AU.band) return; AU.band = b; AU.step = 0; if (AU.ctx) AU.nextT = AU.ctx.currentTime + 0.05; makePhrase(BANDS[b]); }
  const bandOf = zone => zone <= 3 ? 0 : zone <= 7 ? 1 : zone <= 9 ? 2 : zone <= 11 ? 3 : zone <= 17 ? 4 : 5;

  // 바람 소리(바람 언덕)
  let windN = null;
  function wind(v) {
    if (!AU.ctx) return;
    if (!windN) {
      const c = AU.ctx, s = c.createBufferSource(); s.buffer = noise(); s.loop = true;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = 0.8;
      const g = c.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(AU.sfx); s.start();
      windN = { f, g };
    }
    const t = AU.ctx.currentTime, a = Math.min(1, Math.abs(v) / 520);
    windN.g.gain.setTargetAtTime(a * 0.12, t, 0.2); windN.f.frequency.setTargetAtTime(300 + a * 700, t, 0.2);
  }

  function setSfx(on) { AU.sfxOn = on; try { localStorage.setItem('controlking.snd', on ? '1' : '0'); } catch (e) {} if (AU.sfx) AU.sfx.gain.value = on ? 1 : 0; }
  function setBgm(on) { AU.bgmOn = on; try { localStorage.setItem('controlking.bgm', on ? '1' : '0'); } catch (e) {} if (AU.bgm) AU.bgm.gain.value = on ? 0.32 : 0; }

  window.AU = { init, S, schedule, setBand, bandOf, wind, setSfx, setBgm, get sfxOn() { return AU.sfxOn; }, get bgmOn() { return AU.bgmOn; } };
})();
