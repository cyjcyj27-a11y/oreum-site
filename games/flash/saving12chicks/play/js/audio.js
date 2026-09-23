/* 집으로 가는 수탉 — 소리. 전부 WebAudio 합성(파일 없음, file:// 에서도 난다).
 * window.SND = { unlock, cluck, crow, peck, hop, coin, egg, peep, squawk, bark, caw, hiss, horn, splash, bounce, thud,
 *                clear, ding, setOn(b), on, setMusic(b), music, bgm(play) }
 * 시험할 때는 SND.setOn(false); SND.setMusic(false)
 */
(function () {
  'use strict';
  var ctx = null, master = null, sfx = null, mus = null, noiseBuf = null;
  var on = true, music = true;
  try { on = localStorage.getItem('rooster.snd') !== '0'; music = localStorage.getItem('rooster.bgm') !== '0'; } catch (e) {}

  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.85;
    var lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -10; lim.knee.value = 6; lim.ratio.value = 10; lim.attack.value = 0.003; lim.release.value = 0.15;
    master.connect(lim); lim.connect(ctx.destination);
    sfx = ctx.createGain(); sfx.gain.value = on ? 1 : 0; sfx.connect(master);
    mus = ctx.createGain(); mus.gain.value = music ? 0.4 : 0; mus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  function live() { var c = ensure(); if (!c) return null; if (c.state !== 'running' && c.state !== 'closed') { try { c.resume(); } catch (e) {} } return c; }
  function unlock() {
    var c = live(); if (!c) return;
    try { var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) {}
  }

  function noise(type, f, q, dur, vol, t0, f2) {
    var c = live(); if (!c || !on) return;
    var t = t0 || c.currentTime;
    var n = c.createBufferSource(); n.buffer = noiseBuf;
    n.playbackRate.value = 0.8 + Math.random() * 0.4;
    var fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    var g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(fl); fl.connect(g); g.connect(sfx);
    n.start(t, Math.random() * 1.5); n.stop(t + dur + 0.02);
  }
  // 음 하나: 종류·시작 주파수·끝 주파수·길이·크기
  function tone(type, f1, f2, dur, vol, t0, out, attack) {
    var c = live(); if (!c || (!on && out !== mus)) return null;
    var t = t0 || c.currentTime;
    var o = c.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f1, t); if (f2 && f2 !== f1) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    var g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (attack || 0.008)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out || sfx); o.start(t); o.stop(t + dur + 0.02);
    return o;
  }
  // 닭 목소리: 톱니파에 떨림(비브라토)과 콧소리 필터
  function voice(f1, f2, dur, vol, t0, wob, type) {
    var c = live(); if (!c || !on) return;
    var t = t0 || c.currentTime;
    var o = c.createOscillator(); o.type = type || 'sawtooth';
    o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    var lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = wob || 28; lg.gain.value = f1 * 0.06;
    lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur + 0.05);
    var fl = c.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.setValueAtTime(f1 * 2.2, t); fl.Q.value = 2.5;
    fl.frequency.exponentialRampToValueAtTime(f2 * 2.4, t + dur);
    var g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.setValueAtTime(vol, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(fl); fl.connect(g); g.connect(sfx); o.start(t); o.stop(t + dur + 0.05);
  }

  // ── 닭 ──
  function cluck() { var c = live(); if (!c) return; var t = c.currentTime; voice(520, 380, 0.09, 0.35, t, 30); voice(600, 420, 0.07, 0.25, t + 0.11, 30); }
  // 꼬끼오: 마디마다 음높이 곡선을 따로 그리고, 목 떨림은 30Hz 크기 떨림(트레몰로)로. 콧소리는 두 대역 필터.
  function syl(f0, f1, f2, dur, vol, t0) {
    var c = live(); if (!c || !on) return;
    var t = t0;
    var o = c.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.35); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    var b1 = c.createBiquadFilter(); b1.type = 'bandpass'; b1.frequency.value = 1900; b1.Q.value = 1.2;
    var b2 = c.createBiquadFilter(); b2.type = 'peaking'; b2.frequency.value = 3000; b2.Q.value = 2; b2.gain.value = 8;
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200;
    var trem = c.createGain(); trem.gain.value = 0.7;
    var lfo = c.createOscillator(), lg = c.createGain(); lfo.type = 'sine'; lfo.frequency.value = 31; lg.gain.value = 0.3;
    lfo.connect(lg); lg.connect(trem.gain); lfo.start(t); lfo.stop(t + dur + 0.05);
    var g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.035);
    g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(b1); b1.connect(b2); b2.connect(lp); lp.connect(trem); trem.connect(g); g.connect(sfx);
    o.start(t); o.stop(t + dur + 0.05);
    noise('bandpass', 2600, 1.5, dur, vol * 0.12, t);   // 숨소리
  }
  function crow() {   // 꼬 - 끼 - 오 - 오(내려감)
    var c = live(); if (!c) return; var t = c.currentTime + 0.02;
    syl(520, 640, 600, 0.2, 0.32, t);
    syl(700, 860, 820, 0.2, 0.36, t + 0.23);
    syl(880, 1040, 960, 0.5, 0.4, t + 0.46);
    syl(900, 720, 380, 0.55, 0.3, t + 1.0);
  }
  function cluck2() { var c = live(); if (!c) return; var t = c.currentTime; voice(560, 420, 0.08, 0.3, t, 30); voice(620, 440, 0.07, 0.25, t + 0.13, 30); voice(500, 380, 0.09, 0.2, t + 0.27, 30); }
  function peck() { var c = live(); if (!c) return; var t = c.currentTime; noise('bandpass', 2600, 6, 0.04, 0.45, t); tone('square', 900, 500, 0.03, 0.12, t); }
  function hop() { var c = live(); if (!c) return; var t = c.currentTime; noise('bandpass', 900, 2, 0.12, 0.25, t, 1800); voice(480, 640, 0.08, 0.2, t, 26); }
  function squawk() { var c = live(); if (!c) return; var t = c.currentTime; voice(900, 400, 0.28, 0.6, t, 40); voice(700, 300, 0.22, 0.4, t + 0.2, 40); noise('highpass', 2000, 1, 0.2, 0.2, t); }
  function coin() { var c = live(); if (!c) return; var t = c.currentTime; tone('sine', 1320, 1320, 0.08, 0.3, t); tone('sine', 1760, 1760, 0.16, 0.3, t + 0.07); }
  function egg() { var c = live(); if (!c) return; var t = c.currentTime; [880, 1108, 1318, 1760].forEach(function (f, i) { tone('triangle', f, f, 0.35, 0.3, t + i * 0.09); }); noise('highpass', 5000, 1, 0.5, 0.15, t); }
  function peep() { var c = live(); if (!c) return; var t = c.currentTime; voice(1800, 2400, 0.07, 0.25, t, 40, 'triangle'); voice(2200, 1700, 0.08, 0.2, t + 0.1, 40, 'triangle'); }
  function ding() { var c = live(); if (!c) return; var t = c.currentTime; tone('sine', 1568, 1568, 0.25, 0.3, t); tone('sine', 2093, 2093, 0.4, 0.25, t + 0.1); }
  function clear() { var c = live(); if (!c) return; var t = c.currentTime; [523, 659, 784, 1047].forEach(function (f, i) { tone('triangle', f, f, 0.4, 0.35, t + i * 0.12); tone('sine', f * 2, f * 2, 0.3, 0.12, t + i * 0.12); }); }
  // ── 동물·물건 ──
  function bark() { var c = live(); if (!c) return; var t = c.currentTime; voice(260, 180, 0.13, 0.55, t, 12); noise('lowpass', 900, 1, 0.12, 0.4, t); voice(300, 200, 0.12, 0.45, t + 0.18, 12); }
  function caw() { var c = live(); if (!c) return; var t = c.currentTime; voice(420, 300, 0.22, 0.4, t, 50); noise('bandpass', 1500, 3, 0.2, 0.3, t); }
  function hiss() { noise('highpass', 3500, 1, 0.5, 0.35); }
  function meow() { var c = live(); if (!c) return; var t = c.currentTime; voice(700, 900, 0.18, 0.3, t, 8, 'triangle'); voice(900, 600, 0.3, 0.3, t + 0.18, 8, 'triangle'); }
  function horn() { var c = live(); if (!c) return; var t = c.currentTime; tone('sawtooth', 330, 330, 0.35, 0.25, t); tone('sawtooth', 415, 415, 0.35, 0.22, t); }
  function splash() { var c = live(); if (!c) return; var t = c.currentTime; noise('lowpass', 1200, 1, 0.35, 0.5, t, 300); noise('bandpass', 3000, 2, 0.25, 0.2, t + 0.05); }
  function bounce() { var c = live(); if (!c) return; var t = c.currentTime; tone('sine', 180, 90, 0.18, 0.4, t); noise('lowpass', 600, 1, 0.1, 0.3, t); }
  function thud(p) { var c = live(); if (!c) return; var t = c.currentTime; tone('sine', 140 * (p || 1), 60, 0.14, 0.35, t); noise('lowpass', 700, 1, 0.08, 0.3, t); }
  function clink() { var c = live(); if (!c) return; var t = c.currentTime; tone('square', 2400 + Math.random() * 600, 1200, 0.06, 0.12, t); noise('highpass', 4000, 2, 0.08, 0.2, t); }
  function pop() { var c = live(); if (!c) return; var t = c.currentTime; tone('sine', 500, 900, 0.06, 0.25, t); noise('bandpass', 1800, 4, 0.05, 0.2, t); }

  // ── 음악: 시골길 걷는 박자의 짧은 민요풍 순환 ──
  var seq = null, BEAT = 0.26;
  var MEL = [0, 2, 4, 7, 4, 2, 0, -3, 0, 2, 4, 9, 7, 4, 2, 0, 4, 7, 9, 12, 9, 7, 4, 2, 0, -3, 0, 2, 0, -1, 0, null];
  var BASS = [0, 0, 7, 7, 5, 5, 7, 7, 0, 0, 4, 4, 5, 5, 7, 7, 0, 0, 7, 7, 9, 9, 7, 7, 5, 5, 4, 4, 7, 7, 0, 0];
  function nf(n) { return 440 * Math.pow(2, (n - 9) / 12); }
  function pluck(f, t, vol, dur) {
    var c = ctx; var o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(f * 5, t); lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + dur);
    var g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); lp.connect(g); g.connect(mus); o.start(t); o.stop(t + dur + 0.02);
  }
  function tick(t) {
    var c = ctx; var n = c.createBufferSource(); n.buffer = noiseBuf;
    var fl = c.createBiquadFilter(); fl.type = 'highpass'; fl.frequency.value = 6000;
    var g = c.createGain(); g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    n.connect(fl); fl.connect(g); g.connect(mus); n.start(t); n.stop(t + 0.05);
  }
  function bgm(play) {
    if (!play) { if (seq) { clearInterval(seq); seq = null; } return; }
    var c = live(); if (!c || seq) return;
    var i = 0, next = c.currentTime + 0.1;
    seq = setInterval(function () {
      while (next < c.currentTime + 0.5) {
        var m = MEL[i % MEL.length], b = BASS[i % BASS.length];
        if (m !== null) pluck(nf(m + 12), next, 0.22, BEAT * 1.6);
        if (i % 2 === 0) pluck(nf(b - 12), next, 0.18, BEAT * 1.9);
        if (i % 4 === 0) tick(next);
        next += BEAT; i++;
      }
    }, 120);
  }

  window.SND = {
    unlock: unlock, cluck: cluck, cluck2: cluck2, crow: crow, peck: peck, hop: hop, squawk: squawk, coin: coin, egg: egg, peep: peep, ding: ding, clear: clear,
    bark: bark, caw: caw, hiss: hiss, meow: meow, horn: horn, splash: splash, bounce: bounce, thud: thud, clink: clink, pop: pop, bgm: bgm,
    get on() { return on; }, get music() { return music; },
    setOn: function (b) { on = b; try { localStorage.setItem('rooster.snd', b ? '1' : '0'); } catch (e) {} if (sfx) sfx.gain.value = b ? 1 : 0; },
    setMusic: function (b) { music = b; try { localStorage.setItem('rooster.bgm', b ? '1' : '0'); } catch (e) {} if (mus) mus.gain.value = b ? 0.4 : 0; }
  };
})();
