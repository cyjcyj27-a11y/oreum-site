// 청기백기 — 소리: 선생님 목소리(mp3, 여자 음성) + 효과음·배경음(코드)
(function () {
  'use strict';
  const K = 'cheonggi.';
  const A = {
    snd: localStorage.getItem(K + 'snd') !== '0',
    bgm: localStorage.getItem(K + 'bgm') !== '0',
  };
  let ctx = null, master = null, sfxBus = null, bgmBus = null;

  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
      master = ctx.createGain(); master.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = A.snd ? 0.8 : 0; sfxBus.connect(master);
      bgmBus = ctx.createGain(); bgmBus.gain.value = A.bgm ? 0.16 : 0; bgmBus.connect(master);
      voiceBus = ctx.createGain(); voiceBus.gain.value = A.snd ? 1 : 0; voiceBus.connect(master);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // ---- 선생님 목소리: voice/voice.js 에 담긴 mp3 45개를 처음에 한꺼번에 풀어 두고(AudioBuffer)
  //      부를 때 바로 튼다. 파일을 매번 불러오면 한 박자 늦다. 배속을 올리면 빨리 감기처럼 음도 올라간다.
  const BUF = {};
  let voiceBus = null, cur = null, decoding = false;
  function decodeAll() {
    const c = ac(), src = window.CG_VOICE_DATA;
    if (!c || !src || decoding) return;
    decoding = true;
    for (const k in src) {
      const bin = atob(src[k]), u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const done = b => { BUF[k] = b; };
      try {
        const p = c.decodeAudioData(u8.buffer, done, () => {});   // 옛 사파리는 콜백만 된다
        if (p && p.then) p.then(done, () => {});
      } catch (e) {}
    }
  }
  function warmUp() { decodeAll(); }
  function unlock() {
    const c = ac(); if (!c) return;
    decodeAll();
    // 아이폰: 첫 터치 안에서 빈 소리를 한 번 내야 풀린다
    const s = c.createBufferSource(); s.buffer = c.createBuffer(1, 1, 22050); s.connect(c.destination); s.start(0);
  }
  // 목소리 재생. 소리가 나기 시작하면 onStart 를 부른다(아직 안 풀렸으면 조금 기다렸다가, 끝내 없으면 그냥)
  function say(key, rate, onStart) {
    const c = ac();
    let fired = false;
    const go = () => { if (!fired) { fired = true; onStart && onStart(); } };
    if (!c) { go(); return; }
    decodeAll();
    const play = () => {
      stopSrc();
      const s = c.createBufferSource(); s.buffer = BUF[key];
      s.playbackRate.value = rate || 1;
      s.connect(voiceBus); s.start(0);
      s.onended = () => { if (cur === s) { cur = null; duck(false); } };
      cur = s; duck(true); go();
    };
    if (BUF[key]) { play(); return; }
    let n = 0;
    const wait = setInterval(() => {
      if (BUF[key]) { clearInterval(wait); play(); } else if (++n > 25) { clearInterval(wait); go(); }
    }, 20);
  }
  function stopSrc() { if (cur) { try { cur.onended = null; cur.stop(); } catch (e) {} cur = null; } }
  function stopVoice() { stopSrc(); duck(false); }

  // ---- 효과음
  function env(g, t, a, d, v) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function tone(type, f0, f1, dur, v, delay) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + (delay || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.008, dur, v); o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + dur + 0.05);
  }
  let noiseBuf = null;
  function noise(dur, f, q, v, delay, sweep) {
    const c = ac(); if (!c) return;
    if (!noiseBuf) { noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const t = c.currentTime + (delay || 0);
    const s = c.createBufferSource(); s.buffer = noiseBuf;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q; bp.frequency.setValueAtTime(f, t);
    if (sweep) bp.frequency.exponentialRampToValueAtTime(sweep, t + dur);
    const g = c.createGain(); env(g, t, 0.01, dur, v);
    s.connect(bp); bp.connect(g); g.connect(sfxBus); s.start(t); s.stop(t + dur + 0.05);
  }
  const SFX = {
    swishUp() { noise(0.16, 700, 1.2, 0.5, 0, 2600); },     // 깃발 휙(올릴 때 높아짐)
    swishDown() { noise(0.16, 2200, 1.2, 0.45, 0, 600); },
    flap() { noise(0.07, 1400, 2, 0.12); },
    good(n) {                                               // 맞힘: 딩! (콤보 따라 음이 오른다)
      const b = 660 * Math.pow(2, Math.min(n, 12) / 24);
      tone('triangle', b, 0, 0.18, 0.35); tone('triangle', b * 1.5, 0, 0.25, 0.28, 0.07);
    },
    perfect(n) { SFX.good(n); tone('sine', 1760 * Math.pow(2, Math.min(n, 12) / 24), 0, 0.3, 0.12, 0.12); },
    wrong() { tone('square', 180, 120, 0.4, 0.22); tone('square', 186, 124, 0.4, 0.16); },  // 삐빅
    whistle() { tone('sine', 2300, 2250, 0.18, 0.2); tone('sine', 2500, 2450, 0.18, 0.12); tone('sine', 2300, 2350, 0.35, 0.2, 0.2); },
    heart() { tone('sine', 420, 180, 0.35, 0.3); },
    clear() { [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, 0, 0.25, 0.3, i * 0.11)); noise(0.9, 3000, 0.5, 0.18, 0.3, 1200); },
    over() { [392, 330, 262, 196].forEach((f, i) => tone('triangle', f, 0, 0.35, 0.28, i * 0.17)); },
    fanfare() { [[523, 0], [523, .12], [523, .24], [659, .36], [784, .6], [659, .84], [784, 1.0], [1047, 1.2]].forEach(([f, d]) => { tone('square', f, 0, 0.22, 0.12, d); tone('triangle', f / 2, 0, 0.25, 0.2, d); }); },
    click() { tone('sine', 900, 600, 0.05, 0.15); },
  };

  // ---- 배경음: 운동회 행진풍(직접 지은 가락), 목소리 나올 땐 줄인다
  const BPM = 132, STEP = 60 / BPM / 2;
  // 8마디 가락(8분음표 단위, 0 = 쉼)
  const MEL = [67, 0, 67, 69, 71, 0, 67, 0, 72, 0, 71, 69, 67, 0, 64, 0, 65, 0, 65, 67, 69, 0, 65, 0, 67, 0, 69, 67, 64, 0, 62, 0,
    67, 0, 67, 69, 71, 0, 72, 0, 74, 0, 72, 71, 69, 0, 67, 0, 65, 0, 69, 0, 67, 0, 64, 62, 60, 0, 64, 0, 60, 0, 0, 0];
  const BASS = [48, 55, 48, 55, 45, 52, 45, 52, 41, 48, 41, 48, 43, 50, 43, 50, 48, 55, 48, 55, 45, 52, 45, 52, 41, 48, 43, 50, 48, 43, 48, 0];
  let bgmOn = false, nextT = 0, step = 0, timer = null;
  const mf = n => 440 * Math.pow(2, (n - 69) / 12);
  function note(type, f, t, d, v) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f; env(g, t, 0.01, d, v); o.connect(g); g.connect(bgmBus); o.start(t); o.stop(t + d + 0.05);
  }
  function sched() {
    if (!ctx) return;
    while (nextT < ctx.currentTime + 0.25) {
      const m = MEL[step % MEL.length];
      if (m) note('square', mf(m), nextT, STEP * 0.8, 0.12);
      if (step % 2 === 0) { const b = BASS[(step / 2) % BASS.length]; if (b) note('triangle', mf(b), nextT, STEP * 1.6, 0.35); }
      if (step % 4 === 0) { // 작은북
        const s = ctx.createBufferSource(); if (!noiseBuf) SFX.flap(); s.buffer = noiseBuf;
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
        const g = ctx.createGain(); env(g, nextT, 0.003, 0.08, step % 8 === 4 ? 0.16 : 0.07); s.connect(hp); hp.connect(g); g.connect(bgmBus); s.start(nextT); s.stop(nextT + 0.12);
      }
      nextT += STEP; step++;
    }
  }
  function startBgm() {
    if (!ac() || bgmOn) return;
    bgmOn = true; nextT = ctx.currentTime + 0.1; step = 0;
    timer = setInterval(sched, 80);
  }
  function stopBgm() { bgmOn = false; clearInterval(timer); }
  function duck(on) {
    if (!ctx) return;
    const v = A.bgm ? (on ? 0.05 : 0.16) : 0;
    bgmBus.gain.setTargetAtTime(v, ctx.currentTime, 0.08);
  }

  function setSnd(on) { A.snd = on; localStorage.setItem(K + 'snd', on ? '1' : '0'); if (sfxBus) sfxBus.gain.value = on ? 0.8 : 0; if (voiceBus) voiceBus.gain.value = on ? 1 : 0; }
  function setBgm(on) { A.bgm = on; localStorage.setItem(K + 'bgm', on ? '1' : '0'); duck(false); }

  // 페이지를 열자마자 풀어 둔다(소리는 첫 터치 뒤에 난다)
  try { decodeAll(); } catch (e) {}

  window.CGAudio = { A, unlock, say, stopVoice, warmUp, SFX, startBgm, stopBgm, setSnd, setBgm };
})();
