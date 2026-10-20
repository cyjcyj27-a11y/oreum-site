// 소리: 전부 코드 합성. 밝기 2kHz 아래. 오르골(그림자 인형극 무대 옆 태엽 상자) 가락
(function () {
  let ac = null, master = null, bgmGain = null, sfxGain = null, bgmOn = true, sfxOn = true, bgmTimer = 0, bgmStep = 0, bgmNext = 0;
  try { bgmOn = localStorage.getItem('nonri.bgm') !== '0'; sfxOn = localStorage.getItem('nonri.snd') !== '0'; } catch (e) {}
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0.8; master.connect(ac.destination);
    sfxGain = ac.createGain(); sfxGain.gain.value = sfxOn ? 1 : 0; sfxGain.connect(master);
    bgmGain = ac.createGain(); bgmGain.gain.value = bgmOn ? 0.26 : 0; bgmGain.connect(master);
  }
  function lp(f) { const n = ac.createBiquadFilter(); n.type = 'lowpass'; n.frequency.value = f; return n; }
  // 오르골 빗살: 사인 + 살짝 어긋난 배음, 짧게 울리고 길게 사라짐
  function comb(freq, t, dur, vol, out) {
    const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), g2 = ac.createGain(), f = lp(1900);
    o.type = 'sine'; o2.type = 'sine'; o.frequency.value = freq; o2.frequency.value = freq * 3.01; g2.gain.value = 0.12;
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(f); f.connect(out || sfxGain);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  function noise(t, dur, vol, freq, q, out) {
    const len = Math.max(1, Math.floor(ac.sampleRate * dur)), b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const s = ac.createBufferSource(); s.buffer = b;
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q;
    const g = ac.createGain(); g.gain.value = vol;
    s.connect(bp); bp.connect(g); g.connect(out || sfxGain); s.start(t);
  }
  function thump(t, f0, vol) { // 판지가 바닥에 탁 놓이는 둔한 소리
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.55, t + 0.18);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.3);
    noise(t, 0.06, vol * 0.5, 500, 0.9);
  }
  function swish(t, dur, vol) { // 종이가 스치며 올라오는 소리
    const len = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / len);
    const s = ac.createBufferSource(); s.buffer = b;
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(400, t); bp.frequency.exponentialRampToValueAtTime(1600, t + dur);
    const g = ac.createGain(); g.gain.value = vol; s.connect(bp); bp.connect(g); g.connect(sfxGain); s.start(t);
  }
  // 다장조 오음: 도 레 미 솔 라
  const P = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880];
  const S = {
    tap() { init(); const t = ac.currentTime; noise(t, 0.035, 0.45, 1100, 2.5); },
    flip() { init(); const t = ac.currentTime; swish(t, 0.12, 0.35); },
    right(combo) { init(); const t = ac.currentTime + 0.03, up = Math.min(combo || 0, 4);
      [0, 2, 4].forEach((k, i) => comb(P[k + up], t + i * 0.07, 1.4, 0.32)); },
    wrong() { init(); const t = ac.currentTime; thump(t, 90, 0.7); comb(P[2] / 2, t + 0.05, 1.2, 0.22); comb(P[1] / 2 * 0.97, t + 0.28, 1.4, 0.2); },
    rise() { init(); const t = ac.currentTime; swish(t, 0.35, 0.4); thump(t + 0.33, 120, 0.6); },
    big() { init(); const t = ac.currentTime; swish(t, 0.7, 0.5); thump(t + 0.7, 80, 0.9); thump(t + 0.95, 70, 0.6); },
    light() { init(); const t = ac.currentTime; comb(P[5 + Math.floor(Math.random() * 5)], t, 1.6, 0.18); },
    fail() { init(); const t = ac.currentTime; [4, 2, 1, 0].forEach((k, i) => comb(P[k] / 2, t + i * 0.22, 1.6, 0.25)); },
    fanfare() { init(); const t = ac.currentTime + 0.05;
      [[0, 0], [2, .12], [4, .24], [5, .36], [4, .6], [5, .72], [7, .84]].forEach(([k, d]) => { comb(P[k], t + d, 1.8, 0.3); comb(P[k] / 2, t + d, 1.8, 0.14); });
      thump(t, 100, 0.5); thump(t + 0.84, 100, 0.6); },
    ending() { init(); const t = ac.currentTime + 0.05;
      [0, 2, 4, 7, 5, 4, 2, 4, 5, 7, 9, 7].forEach((k, i) => { comb(P[k], t + i * 0.26, 2.2, 0.28); if (i % 2 === 0) comb(P[k] / 2, t + i * 0.26, 2.2, 0.15); }); }
  };
  // 배경음: 느린 오르골 왈츠(3박), 화음 진행 C-Am-F-G
  const PROG = [[0, 2, 4], [4, 0, 2], [3, 5, 0], [1, 3, 4]], BASS = [130.8, 110, 87.3, 98];
  function tickBgm() {
    if (!ac) return;
    const spb = 0.62;
    while (bgmNext < ac.currentTime + 0.4) {
      const bar = Math.floor(bgmStep / 6) % 4, beat = bgmStep % 6, ch = PROG[bar];
      if (beat === 0) comb(BASS[bar], bgmNext, 2.4, 0.22, bgmGain);
      if (beat === 2 || beat === 4) { comb(P[ch[1]], bgmNext, 1.0, 0.1, bgmGain); }
      const mel = [ch[0] + 5, -1, ch[1] + 5, ch[2] + 5, -1, ch[1] + 5][beat];
      const mm = (Math.floor(bgmStep / 24) % 2) ? [ch[2] + 5, -1, ch[0] + 5, -1, ch[1] + 5, -1][beat] : mel;
      if (mm >= 0) { const f = mm < P.length ? P[mm] : P[mm - 5] * 2; comb(Math.min(f, 1000), bgmNext, 1.3, 0.12, bgmGain); }
      bgmNext += spb / 2; bgmStep++;
    }
  }
  S.startBgm = function () { init(); if (bgmTimer) return; bgmNext = ac.currentTime + 0.1; bgmTimer = setInterval(tickBgm, 120); };
  S.setBgm = function (on) { bgmOn = on; try { localStorage.setItem('nonri.bgm', on ? '1' : '0'); } catch (e) {} if (bgmGain) bgmGain.gain.value = on ? 0.26 : 0; };
  S.setSfx = function (on) { sfxOn = on; try { localStorage.setItem('nonri.snd', on ? '1' : '0'); } catch (e) {} if (sfxGain) sfxGain.gain.value = on ? 1 : 0; };
  S.on = function () { return { bgm: bgmOn, sfx: sfxOn }; };
  S.mute = function () { S.setBgm(false); S.setSfx(false); };
  window.SFX = S;
})();
