/* 보아뱀 — 소리. 전부 WebAudio 로 만든다(파일 없음, file:// 로 열어도 된다). */
(function () {
  'use strict';
  var KEY = 'boa';
  var ac = null, master = null;
  var snd = load('snd', true);

  function load(k, def) { try { var v = localStorage.getItem(KEY + '.' + k); return v === null ? def : v === '1'; } catch (e) { return def; } }
  function save(k, v) { try { localStorage.setItem(KEY + '.' + k, v ? '1' : '0'); } catch (e) {} }

  function ensure() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (AC) { ac = new AC(); master = ac.createGain(); master.gain.value = 0.85; master.connect(ac.destination); }
  }
  function noiseBuf(sec) {
    var n = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function tone(freq, type, t0, dur, vol, slideTo) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function burst(t0, dur, vol, freq, q) {
    var s = ac.createBufferSource(); s.buffer = noiseBuf(dur + 0.05);
    var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1.2;
    var g = ac.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t0); s.stop(t0 + dur + 0.05);
  }
  function ok() { return snd && ac; }

  var A = {
    init: ensure,
    get snd() { return snd; },
    toggleSnd: function () { snd = !snd; save('snd', snd); return snd; },
    // 먹기 — 연속으로 먹으면 음이 올라간다
    eat: function (n) { if (!ok()) return; var t = ac.currentTime, f = 520 * Math.pow(1.06, Math.min(n || 0, 12)); tone(f, 'sine', t, 0.09, 0.22, f * 1.5); tone(f * 2, 'triangle', t + 0.05, 0.08, 0.08); burst(t, 0.03, 0.12, 2500, 2); },
    // 잘못 먹음
    wrong: function () { if (!ok()) return; var t = ac.currentTime; tone(300, 'square', t, 0.12, 0.12, 180); tone(220, 'square', t + 0.13, 0.18, 0.12, 120); },
    // 코끼리 꿀꺽
    gulp: function () { if (!ok()) return; var t = ac.currentTime; tone(240, 'sine', t, 0.35, 0.35, 70); burst(t + 0.05, 0.25, 0.25, 500, 0.8); tone(90, 'triangle', t + 0.3, 0.5, 0.3, 45); },
    // 술꾼 — 딸꾹
    hic: function () { if (!ok()) return; var t = ac.currentTime; tone(700, 'sine', t, 0.06, 0.2, 1100); tone(400, 'sine', t + 0.07, 0.08, 0.14, 300); },
    // 돌진
    dash: function () { if (!ok()) return; var t = ac.currentTime; burst(t, 0.18, 0.2, 1500, 0.7); tone(300, 'sine', t, 0.15, 0.1, 600); },
    // 왕의 명령(나팔)
    order: function () { if (!ok()) return; var t = ac.currentTime; tone(523, 'sawtooth', t, 0.12, 0.09); tone(659, 'sawtooth', t + 0.12, 0.12, 0.09); tone(784, 'sawtooth', t + 0.24, 0.25, 0.1); },
    // 점등인 — 불 켜기/끄기
    lamp: function (on) { if (!ok()) return; var t = ac.currentTime; if (on) { tone(1200, 'sine', t, 0.25, 0.14, 1800); } else { tone(900, 'sine', t, 0.2, 0.1, 400); } },
    // 사업가 — 째깍
    tick: function () { if (!ok()) return; var t = ac.currentTime; tone(1800, 'square', t, 0.03, 0.07); },
    // 바오밥 자람 / 금 감
    crack: function () { if (!ok()) return; var t = ac.currentTime; burst(t, 0.2, 0.4, 300, 0.6); tone(120, 'sawtooth', t, 0.3, 0.2, 40); },
    // 뱀 쉭
    hiss: function () { if (!ok()) return; var t = ac.currentTime; burst(t, 0.35, 0.18, 5000, 0.5); },
    clear: function () { if (!ok()) return; var t = ac.currentTime, f = [523, 659, 784, 1047], k; for (k = 0; k < 4; k++) tone(f[k], 'triangle', t + k * 0.11, 0.3, 0.2); tone(1047, 'sine', t + 0.46, 0.8, 0.16); tone(1319, 'sine', t + 0.7, 0.9, 0.1); },
    lose: function () { if (!ok()) return; var t = ac.currentTime; tone(392, 'triangle', t, 0.3, 0.22, 330); tone(262, 'triangle', t + 0.28, 0.6, 0.22, 196); },
    end: function () { if (!ok()) return; var t = ac.currentTime, f = [392, 523, 659, 784, 1047, 1319], k; for (k = 0; k < 6; k++) tone(f[k], 'sine', t + k * 0.16, 0.5, 0.16); tone(1568, 'sine', t + 1.0, 1.6, 0.12); }
  };
  window.BoaAudio = A;
})();
