// 소리: 전부 코드로 만든다 (효과음 + 오르골 배경음)
(function () {
  const A = (window.AU = {});
  let ctx = null, sfx = null, mus = null;
  const load = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v === '1'; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) {} };
  A.snd = load('spotdiff.snd', true);
  A.bgm = load('spotdiff.bgm', true);

  function ensure() {
    if (ctx) return ctx;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    sfx = ctx.createGain();
    sfx.gain.value = A.snd ? 0.6 : 0;
    sfx.connect(ctx.destination);
    mus = ctx.createGain();
    mus.gain.value = A.bgm ? 0.16 : 0;
    mus.connect(ctx.destination);
    return ctx;
  }
  A.unlock = function () {
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (!timer) startMusic();
  };
  A.setSnd = function (v) { A.snd = v; save('spotdiff.snd', v); if (sfx) sfx.gain.value = v ? 0.6 : 0; };
  A.setBgm = function (v) { A.bgm = v; save('spotdiff.bgm', v); if (mus) mus.gain.value = v ? 0.16 : 0; };

  function tone(f, t0, dur, type, vol, out, f2) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.3, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(out || sfx);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  A.play = function (name, n) {
    if (!ensure() || !A.snd) return;
    const t = ctx.currentTime;
    switch (name) {
      case 'hit': {
        // 찾을수록 음이 올라간다
        const base = 660 * Math.pow(2, ((n || 0) * 2) / 12);
        tone(base, t, 0.18, 'triangle', 0.35);
        tone(base * 1.5, t + 0.07, 0.3, 'triangle', 0.3);
        tone(base * 3, t + 0.07, 0.25, 'sine', 0.08);
        break;
      }
      case 'miss':
        tone(180, t, 0.22, 'square', 0.12, null, 90);
        tone(140, t + 0.02, 0.22, 'sawtooth', 0.08, null, 70);
        break;
      case 'click':
        tone(900, t, 0.05, 'sine', 0.15);
        break;
      case 'hint':   // 돋보기 반짝 — 배경음에 묻히지 않게 크게(2026-09-17 사장님 "힌트버튼 누를때 소리나게")
        tone(420, t, 0.22, 'triangle', 0.22, null, 1400);
        [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, t + 0.08 + i * 0.07, 0.4, 'triangle', 0.32));
        [3136, 4186].forEach((f, i) => tone(f, t + 0.3 + i * 0.08, 0.35, 'sine', 0.12));
        break;
      case 'nohint':   // 힌트가 없다
        tone(330, t, 0.12, 'square', 0.1);
        tone(247, t + 0.13, 0.18, 'square', 0.1);
        break;
      case 'clear':
        [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.1, 0.35, 'triangle', 0.3));
        [1319, 1568].forEach((f, i) => tone(f, t + 0.45 + i * 0.12, 0.6, 'sine', 0.18));
        break;
      case 'star':
        tone(1200 + (n || 0) * 250, t, 0.3, 'sine', 0.25);
        tone(2400 + (n || 0) * 500, t, 0.2, 'sine', 0.06);
        break;
      case 'over':
        [440, 392, 330, 262].forEach((f, i) => tone(f, t + i * 0.16, 0.4, 'triangle', 0.25));
        break;
      case 'tick':
        tone(1400, t, 0.04, 'square', 0.05);
        break;
    }
  };

  // 오르골 배경음: 네 마디 되풀이
  let timer = null, step = 0, next = 0;
  const C = [261.6, 293.7, 329.6, 349.2, 392, 440, 493.9];
  const nt = (d) => C[((d % 7) + 7) % 7] * Math.pow(2, Math.floor(d / 7));
  const chords = [[0, 2, 4], [5, 7, 9], [3, 5, 7], [4, 6, 8]];
  const melody = [7, 9, 11, 9, 12, 11, 9, 7, 10, 9, 7, 5, 6, 7, 8, 11];
  function startMusic() {
    next = ctx.currentTime + 0.1;
    timer = setInterval(() => {
      if (!A.bgm || ctx.state !== 'running') { next = ctx.currentTime + 0.1; return; }
      while (next < ctx.currentTime + 0.4) {
        const bar = Math.floor(step / 8) % 4;
        const beat = step % 8;
        const ch = chords[bar];
        const len = 0.3;
        if (beat % 2 === 0) tone(nt(ch[(beat / 2) % 3]) / 2, next, 0.9, 'sine', 0.22, mus);
        if (beat % 2 === 0) {
          const m = melody[(bar * 4 + beat / 2) % melody.length];
          tone(nt(m), next, 0.8, 'triangle', 0.16, mus);
          tone(nt(m) * 2, next, 0.4, 'sine', 0.04, mus);
        } else if (beat === 7) {
          tone(nt(ch[2] + 7), next, 0.4, 'sine', 0.07, mus);
        }
        next += len;
        step++;
      }
    }, 100);
  }
})();
