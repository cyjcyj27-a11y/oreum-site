// 소리: 전부 코드 합성. 밝기 2kHz 아래, 궁상각치우(5음) 가락
(function () {
  let ac = null, master = null, bgmGain = null, sfxGain = null, bgmOn = true, sfxOn = true, bgmTimer = 0;
  try { bgmOn = localStorage.getItem('nara.bgm') !== '0'; sfxOn = localStorage.getItem('nara.snd') !== '0'; } catch (e) {}
  function init() {
    if (ac) return;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0.8; master.connect(ac.destination);
    sfxGain = ac.createGain(); sfxGain.gain.value = sfxOn ? 1 : 0; sfxGain.connect(master);
    bgmGain = ac.createGain(); bgmGain.gain.value = bgmOn ? 0.32 : 0; bgmGain.connect(master);
  }
  function lp(f) { const n = ac.createBiquadFilter(); n.type = 'lowpass'; n.frequency.value = f; return n; }
  // 가야금처럼 튕기는 소리
  function pluck(freq, t, dur, vol, out) {
    const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), f = lp(1800);
    o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = freq; o2.frequency.value = freq * 2.001;
    const g2 = ac.createGain(); g2.gain.value = 0.25;
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(f); f.connect(out || sfxGain);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    // 줄을 누르는 농현: 살짝 내려왔다 돌아감
    o.frequency.setValueAtTime(freq * 1.01, t); o.frequency.exponentialRampToValueAtTime(freq, t + 0.08);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  function noise(t, dur, vol, freq, q, out) {
    const len = Math.max(1, Math.floor(ac.sampleRate * dur)), b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ac.createBufferSource(); s.buffer = b;
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q;
    const g = ac.createGain(); g.gain.value = vol;
    s.connect(bp); bp.connect(g); g.connect(out || sfxGain); s.start(t);
  }
  function drum(t, f0, vol, out) { // 북
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.5, t + 0.25);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g); g.connect(out || sfxGain); o.start(t); o.stop(t + 0.4);
    noise(t, 0.05, vol * 0.4, 600, 1, out);
  }
  const P = [196, 220, 261.6, 293.7, 329.6, 392, 440, 523.3]; // 솔 라 도 레 미 (5음)
  const S = {
    tap() { init(); const t = ac.currentTime; noise(t, 0.04, 0.5, 900, 3); }, // 나무 똑
    stamp() { init(); const t = ac.currentTime; drum(t, 110, 0.9); noise(t + 0.01, 0.08, 0.6, 400, 0.8); },
    right() { init(); const t = ac.currentTime + 0.05; [2, 4, 5, 7].forEach((k, i) => pluck(P[k], t + i * 0.09, 0.9, 0.35)); },
    wrong() { init(); const t = ac.currentTime; drum(t, 70, 1); pluck(P[1] / 2, t + 0.05, 1.2, 0.3); pluck(P[0] / 2 * 0.94, t + 0.3, 1.4, 0.28); },
    pop() { init(); const t = ac.currentTime; noise(t, 0.12, 0.5, 300, 0.7); pluck(P[5], t + 0.02, 0.3, 0.15); },
    era() { init(); const t = ac.currentTime; drum(t, 90, 0.8); drum(t + 0.35, 90, 0.6); [0, 2, 3, 5, 7].forEach((k, i) => pluck(P[k], t + 0.6 + i * 0.13, 1.2, 0.3)); },
    end() { init(); const t = ac.currentTime; [0, 2, 4, 5, 7, 5, 7].forEach((k, i) => pluck(P[k], t + i * 0.18, 1.5, 0.3)); drum(t, 100, 0.6); drum(t + 1.1, 100, 0.7); }
  };
  // 빵빠레: 나팔 같은 소리(톱니파를 2kHz 아래로 깎음), 가락은 직접 지음
  function brass(freq, t, dur, vol) {
    const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), f = lp(1900);
    o.type = 'sawtooth'; o2.type = 'square'; o.frequency.value = freq; o2.frequency.value = freq * 1.003;
    const g2 = ac.createGain(); g2.gain.value = 0.35; o2.connect(g2); g2.connect(g); o.connect(g); g.connect(f); f.connect(sfxGain);
    f.frequency.setValueAtTime(600, t); f.frequency.linearRampToValueAtTime(1900, t + 0.05);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.03); g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  S.fanfare = function () {
    init(); const t = ac.currentTime + 0.05;
    const N = [[392, 0, 0.13], [392, 0.15, 0.13], [523.3, 0.3, 0.3], [659.3, 0.62, 0.14], [587.3, 0.78, 0.14], [659.3, 0.94, 0.14], [784, 1.1, 1.3]];
    N.forEach(([f, d, l]) => brass(f, t + d, l, 0.16));
    [[261.6, 1.1], [329.6, 1.1], [392, 1.1]].forEach(([f, d]) => brass(f, t + d, 1.3, 0.08));
    for (let i = 0; i < 10; i++) drum(t + i * 0.06, 150, 0.25);
    drum(t + 1.1, 90, 0.9); noise(t + 1.1, 1.2, 0.35, 1500, 0.6);
    [0, 2, 4, 5, 7].forEach((k, i) => pluck(P[k] * 2, t + 1.3 + i * 0.09, 1.2, 0.2));
  };
  // 배경음: 느린 가락 + 장구 비슷한 장단
  const MEL = [0, 2, 3, 2, 5, 3, 2, -1, 3, 5, 6, 5, 3, 2, 0, -1, 2, 3, 5, 3, 2, 0, 1, -1, 0, 2, 3, 5, 3, 2, 0, -1];
  let step = 0;
  function bgmTick() {
    if (!ac) return;
    const t = ac.currentTime + 0.05, beat = 0.42;
    const k = MEL[step % MEL.length];
    if (k >= 0) pluck(P[k], t, 1.6, 0.22, bgmGain);
    if (step % 4 === 0) pluck(P[0] / 2, t, 2.2, 0.2, bgmGain);
    if (step % 2 === 0) drum(t, step % 4 === 0 ? 85 : 120, 0.25, bgmGain); else noise(t, 0.05, 0.12, 700, 2, bgmGain);
    step++;
    bgmTimer = setTimeout(bgmTick, beat * 1000);
  }
  S.startBgm = function () { init(); if (ac.state === 'suspended') ac.resume(); if (!bgmTimer) bgmTick(); };
  S.setBgm = function (on) { bgmOn = on; try { localStorage.setItem('nara.bgm', on ? '1' : '0'); } catch (e) {} if (bgmGain) bgmGain.gain.value = on ? 0.32 : 0; };
  S.setSfx = function (on) { sfxOn = on; try { localStorage.setItem('nara.snd', on ? '1' : '0'); } catch (e) {} if (sfxGain) sfxGain.gain.value = on ? 1 : 0; };
  S.state = () => ({ bgm: bgmOn, sfx: sfxOn });
  window.SFX = S;
})();
