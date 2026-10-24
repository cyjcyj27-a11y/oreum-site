// 소리: 코드로 만든 날갯소리·빨기·찰싹·전기·스프레이와 여름밤 배경음. 밝기는 2kHz 아래로 편하게.
(function () {
  const A = (window.AU = { on: { bgm: true, sfx: true } });
  let ac = null, master, sfxG, bgmG, buzzO = [], buzzG, buzzF, suckG, noiseBuf;
  try { const s = JSON.parse(localStorage.getItem('mogiz.snd') || 'null'); if (s) A.on = s; } catch (e) {}
  A.init = function () {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
    sfxG = ac.createGain(); sfxG.gain.value = A.on.sfx ? 1 : 0; sfxG.connect(master);
    bgmG = ac.createGain(); bgmG.gain.value = A.on.bgm ? 0.5 : 0; bgmG.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // 날갯소리: 톱니 둘을 살짝 어긋나게, 낮은 통과
    buzzG = ac.createGain(); buzzG.gain.value = 0; buzzF = ac.createBiquadFilter(); buzzF.type = 'lowpass'; buzzF.frequency.value = 1100; buzzF.Q.value = 2;
    buzzF.connect(buzzG); buzzG.connect(sfxG);
    [470, 482].forEach((f) => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(buzzF); o.start(); buzzO.push(o); });
    // 빨기: 꿀렁꿀렁(낮은 사인 + 떨림)
    suckG = ac.createGain(); suckG.gain.value = 0; suckG.connect(sfxG);
    const so = ac.createOscillator(); so.type = 'sine'; so.frequency.value = 110; const lfo = ac.createOscillator(); lfo.frequency.value = 7; const lg = ac.createGain(); lg.gain.value = 40; lfo.connect(lg); lg.connect(so.frequency); so.connect(suckG); so.start(); lfo.start();
    startBgm();
  };
  A.set = function (k, v) { A.on[k] = v; try { localStorage.setItem('mogiz.snd', JSON.stringify(A.on)); } catch (e) {} if (!ac) return; if (k === 'sfx') sfxG.gain.setTargetAtTime(v ? 1 : 0, ac.currentTime, 0.05); else bgmG.gain.setTargetAtTime(v ? 0.5 : 0, ac.currentTime, 0.1); };
  A.mute = function (m) { if (ac) master.gain.setTargetAtTime(m ? 0 : 0.9, ac.currentTime, 0.05); };
  // 날갯소리 크기·높이
  A.buzz = function (sp, vol) {
    if (!ac) return; const t = ac.currentTime, k = Math.min(1.6, sp);
    buzzG.gain.setTargetAtTime(vol * (0.02 + k * 0.025), t, 0.05);
    buzzO[0].frequency.setTargetAtTime(440 + k * 120, t, 0.08); buzzO[1].frequency.setTargetAtTime(452 + k * 122, t, 0.08);
  };
  A.suck = function (on) { if (ac) suckG.gain.setTargetAtTime(on ? 0.12 : 0, ac.currentTime, 0.04); };
  function noise(t, dur, f, q, vol, type, f2) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf; const fl = ac.createBiquadFilter(); fl.type = type || 'lowpass'; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur); fl.Q.value = q || 1;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(sfxG); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  function tone(t, f, dur, vol, type, f2, dest) {
    const o = ac.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfxG); o.start(t); o.stop(t + dur + 0.05);
  }
  A.sfx = function (n) {
    if (!ac) return; const t = ac.currentTime;
    switch (n) {
      case 'stab': tone(t, 700, 0.06, 0.12, 'triangle', 300); noise(t, 0.05, 1500, 1, 0.08); break;
      case 'land': noise(t, 0.08, 900, 1, 0.05, 'bandpass', 1600); break;
      case 'gulp': tone(t, 180, 0.12, 0.14, 'sine', 90); break;
      case 'pop': tone(t, 380, 0.08, 0.1, 'triangle', 760); break;
      case 'done': [523, 659, 784, 1047].forEach((f, i) => tone(t + i * 0.08, f, 0.28, 0.1, 'triangle')); break;
      case 'wind': noise(t, 0.35, 300, 2, 0.08, 'bandpass', 900); break;
      case 'shake': for (let i = 0; i < 4; i++) noise(t + i * 0.09, 0.06, 1200, 2, 0.06, 'bandpass'); break;
      case 'slap': noise(t, 0.18, 900, 1, 0.5); tone(t, 140, 0.18, 0.4, 'sine', 50); break;
      case 'slapmiss': noise(t, 0.14, 800, 1, 0.3); tone(t, 120, 0.12, 0.2, 'sine', 60); break;
      case 'clap': noise(t, 0.1, 1400, 1, 0.35); break;
      case 'swat': noise(t, 0.12, 1000, 1, 0.4); break;
      case 'zapwind': tone(t, 60, 0.6, 0.06, 'square', 70); break;
      case 'zap': for (let i = 0; i < 7; i++) noise(t + i * 0.035, 0.03, 1700, 3, 0.25, 'bandpass'); tone(t, 55, 0.4, 0.15, 'square', 50); break;
      case 'zapmiss': for (let i = 0; i < 3; i++) noise(t + i * 0.04, 0.03, 1600, 3, 0.15, 'bandpass'); break;
      case 'spray': noise(t, 0.9, 1800, 0.7, 0.12, 'lowpass', 1200); break;
      case 'cough': [0, 0.22].forEach((d) => noise(t + d, 0.12, 500, 2, 0.25, 'bandpass')); break;
      case 'bonk': tone(t, 300, 0.12, 0.15, 'triangle', 180); break;
      case 'dash': noise(t, 0.2, 400, 1, 0.12, 'bandpass', 1500); break;
      case 'hatch': [392, 523, 659].forEach((f, i) => tone(t + 0.4 + i * 0.12, f, 0.4, 0.07, 'sine')); break;
      case 'card': noise(t, 0.08, 1200, 1, 0.08, 'bandpass'); tone(t, 520, 0.1, 0.05, 'triangle'); break;
      case 'gold': [784, 988, 1175, 1568].forEach((f, i) => tone(t + i * 0.06, f, 0.5, 0.06, 'sine')); break;
      case 'btn': noise(t, 0.05, 700, 1, 0.12, 'bandpass'); tone(t, 260, 0.06, 0.08, 'triangle', 200); break;
      case 'end': [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(t + i * 0.16, f, 0.5, 0.09, 'triangle')); break;
    }
  };
  // 엔딩 음악: 느린 라단조 오르골 + 낮은 현 패드(약간 슬프게). 영상 만들 때 tools/sadmusic.py 가 같은 음표를 씀
  A.SAD = { bpm: 60, chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [52, 56, 59]],
    mel: [76, -1, 72, 74, 76, -1, 69, -1, 77, -1, 76, 74, 72, -1, -1, -1, 72, -1, 71, 72, 74, -1, 67, -1, 71, -1, 68, 71, 69, -1, -1, -1] };
  let sadG = null, sadTimer = 0;
  A.sad = function (on) {
    if (!ac) return; const t = ac.currentTime;
    bgmG.gain.setTargetAtTime(on ? 0 : (A.on.bgm ? 0.5 : 0), t, 0.6);
    if (!on) { if (sadG) sadG.gain.setTargetAtTime(0, t, 0.5); clearInterval(sadTimer); return; }
    if (!sadG) { sadG = ac.createGain(); sadG.connect(master); }
    sadG.gain.cancelScheduledValues(t); sadG.gain.setValueAtTime(0, t); sadG.gain.linearRampToValueAtTime(A.on.bgm ? 0.6 : 0, t + 2);
    const S = A.SAD, half = 60 / S.bpm / 2, hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
    let next = t + 0.3, step = 0;
    const box = (tt, f, v, d) => { [1, 2.01, 3.98].forEach((k, i) => { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f * k; const g = ac.createGain(); g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(v * [1, 0.35, 0.12][i], tt + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, tt + d * [1, 0.6, 0.3][i]); o.connect(g); g.connect(sadG); o.start(tt); o.stop(tt + d + 0.05); }); };
    const pad = (tt, ch, d) => ch.forEach((m) => { const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = hz(m - 12); const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; const g = ac.createGain(); g.gain.setValueAtTime(0.0001, tt); g.gain.linearRampToValueAtTime(0.035, tt + 1.2); g.gain.linearRampToValueAtTime(0.0001, tt + d); o.connect(lp); lp.connect(g); g.connect(sadG); o.start(tt); o.stop(tt + d + 0.1); });
    const sched = () => { while (next < ac.currentTime + 0.5) { const s2 = step % 32; if (s2 % 8 === 0) { const ch = S.chords[s2 / 8]; pad(next, ch, half * 8 + 0.4); box(next, hz(ch[0] - 24), 0.09, 2.6); } const mm = S.mel[s2]; if (mm > 0) box(next, hz(mm), 0.07, 1.8); next += half; step++; } };
    clearInterval(sadTimer); sadTimer = setInterval(sched, 120); sched();
  };
  // 여름밤 배경음: 92 BPM, 마림바풍 펑 + 낮은 베이스 + 아주 작은 귀뚜라미
  function startBgm() {
    const bpm = 92, beat = 60 / bpm, bar = beat * 4;
    const chords = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]];
    const mel = [76, 74, 72, 74, 76, 79, 76, -1, 72, 74, 72, 69, 67, 69, 72, -1, 69, 72, 74, 72, 69, 67, 65, -1, 67, 71, 74, 72, 71, 67, 62, -1];
    const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
    let next = ac.currentTime + 0.2, step = 0;
    const pluck = (t, f, v, d) => { const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = f; const o2 = ac.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 4; const g2 = ac.createGain(); g2.gain.value = 0.15; o2.connect(g2);
      const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g2.connect(g); g.connect(bgmG); o.start(t); o2.start(t); o.stop(t + d + 0.05); o2.stop(t + d + 0.05); };
    function sched() {
      while (next < ac.currentTime + 0.4) {
        const s = step % 32, ch = chords[Math.floor(s / 8)];
        if (s % 2 === 0) pluck(next, hz(ch[(s / 2) % 3] - 12), 0.05, 0.4);
        if (s % 8 === 0) pluck(next, hz(ch[0] - 24), 0.09, 1.3);
        const m = mel[s]; if (m > 0 && s % 1 === 0) pluck(next, hz(m), 0.045, 0.5);
        if (s % 4 === 3) { const t = next; for (let i = 0; i < 3; i++) noise(t + i * 0.05, 0.03, 1800, 6, 0.006, 'bandpass'); }
        next += beat / 2; step++;
      }
    }
    // 귀뚜라미 소리는 bgm 쪽으로 보냄
    const sfxOld = sfxG; void sfxOld;
    setInterval(sched, 120); sched();
  }
})();
