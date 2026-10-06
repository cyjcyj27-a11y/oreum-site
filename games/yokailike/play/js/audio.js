// 소리: 8비트 칩튠 배경음(Web Audio) + 효과음(픽셀 세계라 UI 는 합성 삑, 발소리·환호·드럼·폭죽은 Pixabay 녹음 mp3)
// file:// 에서도 돌아가게 mp3 는 <audio> 요소로 튼다(fetch 없음)
window.SND = (function () {
  const S = { ctx: null, on: true, bgmOn: true, master: null, sfxG: null, bgmG: null, bgmOnAir: false, next: 0, step: 0, timer: null, el: {} };
  try { S.on = localStorage.getItem('yokailike.snd') !== '0'; S.bgmOn = localStorage.getItem('yokailike.bgm') !== '0'; } catch (e) {}
  const MP3 = { cheer: 1, drum: 1, pop: 1, pop2: 1 };
  function ctx() {
    if (!S.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      S.ctx = new AC(); S.master = S.ctx.createGain(); S.master.connect(S.ctx.destination);
      S.sfxG = S.ctx.createGain(); S.sfxG.gain.value = 0.5; S.sfxG.connect(S.master);
      S.bgmG = S.ctx.createGain(); S.bgmG.gain.value = 0.22; S.bgmG.connect(S.master);
    }
    if (S.ctx.state === 'suspended') S.ctx.resume();
    return S.ctx;
  }
  function el(name) {
    if (!S.el[name]) { S.el[name] = []; for (let i = 0; i < 3; i++) { const a = new Audio('sfx/' + name + '.mp3'); a.preload = 'auto'; S.el[name].push(a); } }
    const pool = S.el[name]; const a = pool.find(x => x.paused || x.ended) || pool[0]; return a;
  }
  function mp3(name, vol) { if (!S.on) return; const a = el(name); try { a.currentTime = 0; a.volume = vol == null ? 0.7 : vol; a.play().catch(() => {}); } catch (e) {} }
  // ---- 합성 ----
  function tone(type, f0, f1, t0, dur, vol, slide) {
    const c = ctx(); if (!c || !S.on) return;
    const o = c.createOscillator(), g = c.createGain(); o.type = type;
    const t = c.currentTime + (t0 || 0);
    o.frequency.setValueAtTime(f0, t); if (f1) o.frequency[slide ? 'linearRampToValueAtTime' : 'setValueAtTime'](f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(S.sfxG); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(t0, dur, vol, hp) {
    const c = ctx(); if (!c || !S.on) return;
    const n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(); s.buffer = b; const f = c.createBiquadFilter(); f.type = hp ? 'highpass' : 'lowpass'; f.frequency.value = hp || 900;
    const g = c.createGain(); g.gain.value = vol; s.connect(f); f.connect(g); g.connect(S.sfxG); s.start(c.currentTime + (t0 || 0));
  }
  const api = {
    get on() { return S.on; }, get bgmOn() { return S.bgmOn; },
    unlock() { ctx(); Object.keys(MP3).forEach(el); },
    blip() { tone('square', 880, 1320, 0, 0.07, 0.18); },
    back() { tone('square', 660, 440, 0, 0.09, 0.15, true); },
    turn() { tone('square', 740, 0, 0, 0.05, 0.14); tone('square', 1110, 0, 0.055, 0.07, 0.14); },
    step() { S.step = (S.step + 1) % 4; mp3('step' + (S.step + 1), 0.55); },
    stamp() { noise(0, 0.12, 0.5); tone('triangle', 160, 60, 0, 0.18, 0.5, true); },
    cheer() { mp3('cheer', 0.8); },
    pop() { mp3(Math.random() < 0.5 ? 'pop' : 'pop2', 0.5); },
    drum() { mp3('drum', 0.7); },
    fail() { tone('sawtooth', 392, 370, 0, 0.22, 0.12, true); tone('sawtooth', 349, 330, 0.24, 0.22, 0.12, true); tone('sawtooth', 311, 294, 0.48, 0.26, 0.12, true); tone('sawtooth', 262, 180, 0.76, 0.6, 0.12, true); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone('square', f, 0, i * 0.09, 0.12, 0.16)); },
    hit() { if (S.hitT && performance.now() - S.hitT < 40) return; S.hitT = performance.now(); noise(0, 0.05, 0.25, 1800); },
    slash() { noise(0, 0.09, 0.22, 2500); tone('triangle', 900, 300, 0, 0.08, 0.1, true); },
    shoot() { tone('square', 1200, 700, 0, 0.06, 0.08, true); },
    gem() { S.gemN = ((S.gemN || 0) + 1) % 8; tone('square', 880 * Math.pow(2, S.gemN / 12), 0, 0, 0.05, 0.08); },
    hurt() { tone('sawtooth', 220, 110, 0, 0.18, 0.2, true); noise(0, 0.1, 0.2); },
    levelup() { [587, 740, 880, 1175, 1480].forEach((f, i) => tone('triangle', f, 0, i * 0.07, 0.16, 0.2)); },
    boom() { noise(0, 0.5, 0.8, 400); tone('sine', 120, 40, 0, 0.5, 0.6, true); },
    roar() { tone('sawtooth', 90, 60, 0, 0.7, 0.3, true); noise(0, 0.6, 0.3, 300); },
    bell() { [1320, 1320 * 1.5, 1320 * 2.4].forEach(f => tone('sine', f, 0, 0, 2.2, 0.12)); },
    toggleSfx() { S.on = !S.on; try { localStorage.setItem('yokailike.snd', S.on ? '1' : '0'); } catch (e) {} if (S.on) api.blip(); return S.on; },
    toggleBgm() { S.bgmOn = !S.bgmOn; try { localStorage.setItem('yokailike.bgm', S.bgmOn ? '1' : '0'); } catch (e) {} if (S.bgmOn) api.bgm(true); else api.bgm(false); return S.bgmOn; },
    bgm(play) {
      if (play === false) { S.bgmOnAir = false; if (S.timer) { clearInterval(S.timer); S.timer = null; } return; }
      if (!S.bgmOn) return; const c = ctx(); if (!c || S.bgmOnAir) return;
      S.bgmOnAir = true; S.next = c.currentTime + 0.05; S.pos = 0;
      S.timer = setInterval(sched, 90); sched();
    },
    duck(v) { if (S.bgmG) S.bgmG.gain.setTargetAtTime(v ? 0.08 : 0.22, S.ctx.currentTime, 0.1); },
  };
  // 축제 가락(오하야시 느낌): 132bpm, 레 단조 5음계 피리 두 겹 + 큰북·작은북 + 딱따기
  const BPM = 132, STEP = 60 / BPM / 2;
  const FLUTE = [ // 16스텝 x 4마디 (미디, 0 = 쉼)
    [74, 0, 77, 79, 81, 0, 79, 77, 74, 0, 72, 74, 0, 0, 69, 0],
    [74, 0, 77, 79, 81, 84, 81, 79, 77, 0, 79, 77, 74, 0, 0, 0],
    [81, 0, 84, 81, 79, 0, 77, 79, 81, 0, 79, 77, 74, 72, 74, 0],
    [69, 0, 72, 74, 77, 0, 74, 72, 69, 0, 72, 0, 74, 0, 0, 0]];
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  function osc(type, f, t, dur, vol, g2) {
    const c = S.ctx; const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.015); g.gain.setValueAtTime(vol * 0.8, t + dur * 0.6); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(g2 || S.bgmG); o.start(t); o.stop(t + dur + 0.01);
  }
  function taiko(t, big) {
    const c = S.ctx; const o = c.createOscillator(), g = c.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(big ? 150 : 220, t); o.frequency.exponentialRampToValueAtTime(big ? 45 : 90, t + 0.18);
    g.gain.setValueAtTime(big ? 0.9 : 0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + (big ? 0.35 : 0.2));
    o.connect(g); g.connect(S.bgmG); o.start(t); o.stop(t + 0.4);
    hat(t, big ? 0.12 : 0.07, 3000);
  }
  function hat(t, vol, fq) {
    const c = S.ctx; const n = Math.floor(c.sampleRate * 0.04), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(); s.buffer = b; const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = fq || 6000;
    const g = c.createGain(); g.gain.value = vol; s.connect(f); f.connect(g); g.connect(S.bgmG); s.start(t);
  }
  function sched() {
    if (!S.bgmOnAir) return; const c = S.ctx;
    while (S.next < c.currentTime + 0.25) {
      const p = S.pos % 64, bar = Math.floor(p / 16), st = p % 16, t = S.next;
      const n = FLUTE[bar][st]; if (n) { osc('triangle', mf(n), t, STEP * 0.95, 0.16); osc('square', mf(n + 12), t, STEP * 0.6, 0.025); }
      if (st === 0 || st === 8) taiko(t, true); if (st === 4 || st === 12 || st === 14) taiko(t, false);
      if (st % 2 === 1) hat(t, 0.04, 7000); if (st === 6 || st === 10) hat(t, 0.1, 5000);
      S.next += STEP; S.pos++;
    }
  }
  return api;
})();
