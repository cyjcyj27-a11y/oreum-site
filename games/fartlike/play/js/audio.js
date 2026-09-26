/* 방귀라이크 — 소리. 전부 Web Audio 합성(파일 없음, file:// 에서도 난다).
 * 방귀는 방귀 뀌기(bangwi)처럼 한 방씩 끊어 터뜨린다(뿡 · 뿌우웅 · 뽁). 끝단 컴프레서로 겹쳐도 안 찢어진다.
 * 배경음은 와르르 볼링 틀(16분 스케줄러 + 킥·햇·스네어 + 옥타브 디스코 베이스 + 가끔 리드), 스테이지마다 곡이 다르다.
 * window.FA
 */
(function () {
  'use strict';
  var ctx = null, master = null, sfx = null, mus = null, noiseBuf = null;
  var sndOn = true, bgmOn = true;
  try { sndOn = localStorage.getItem('fartrogue.snd') !== '0'; bgmOn = localStorage.getItem('fartrogue.bgm') !== '0'; } catch (e) {}
  var FA = { get snd() { return sndOn; }, get bgm() { return bgmOn; }, paused: false };

  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9;
    var lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -8; lim.knee.value = 6; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.15;
    master.connect(lim); lim.connect(ctx.destination);
    sfx = ctx.createGain(); sfx.gain.value = sndOn ? 1 : 0; sfx.connect(master);
    mus = ctx.createGain(); mus.gain.value = bgmOn ? 0.42 : 0; mus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  function live() { var c = ensure(); if (!c) return null; if (c.state !== 'running' && c.state !== 'closed') { try { c.resume(); } catch (e) {} } return c; }
  FA.unlock = function () {
    var c = live(); if (!c) return;
    try { var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) {}
    if (!mTimer) startMusic();
  };
  var last = {};
  function gate(k, gap) { var t = ctx ? ctx.currentTime : 0; if (last[k] && t - last[k] < gap) return false; last[k] = t; return true; }
  function ok() { return ctx && sndOn && !FA.paused; }

  // ── 방귀 한 방: "ㅃ" 터짐 → 떨리며 내려앉는 톱니파
  function toot(at, len, base, vol, bright) {
    var c = ctx;
    var o = c.createOscillator(), o2 = c.createOscillator();
    o.type = 'sawtooth'; o2.type = 'square';
    o.frequency.setValueAtTime(base * 1.35, at);
    o.frequency.exponentialRampToValueAtTime(base, at + Math.min(0.06, len * 0.4));
    o.frequency.exponentialRampToValueAtTime(base * 0.72, at + len);
    o2.frequency.setValueAtTime(base * 0.675, at);
    o2.frequency.exponentialRampToValueAtTime(base * 0.36, at + len);
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 6;
    lp.frequency.setValueAtTime(bright || 1100, at); lp.frequency.exponentialRampToValueAtTime(360, at + len);
    var flap = c.createGain(); flap.gain.value = 0.55;
    var lfo = c.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 24 + Math.random() * 16;
    var lg = c.createGain(); lg.gain.value = 0.45; lfo.connect(lg); lg.connect(flap.gain);
    var env = c.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(vol, at + 0.012);
    env.gain.setValueAtTime(vol * 0.85, at + len * 0.7);
    env.gain.exponentialRampToValueAtTime(0.0001, at + len + 0.04);
    o.connect(lp); o2.connect(lp); lp.connect(flap); flap.connect(env); env.connect(sfx);
    var n = c.createBufferSource(); n.buffer = noiseBuf;
    var nl = c.createBiquadFilter(); nl.type = 'lowpass'; nl.frequency.value = 520;
    var ng = c.createGain(); ng.gain.setValueAtTime(vol * 1.3, at); ng.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
    n.connect(nl); nl.connect(ng); ng.connect(sfx);
    var end = at + len + 0.06;
    o.start(at); o2.start(at); lfo.start(at); n.start(at, Math.random());
    o.stop(end); o2.stop(end); lfo.stop(end); n.stop(at + 0.06);
  }
  function boom(at, vol, f0, len) {
    var c = ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f0 || 120, at); o.frequency.exponentialRampToValueAtTime(34, at + (len || 0.5));
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, at + (len || 0.5) + 0.1);
    o.connect(g); g.connect(sfx); o.start(at); o.stop(at + (len || 0.5) + 0.15);
    var n = c.createBufferSource(); n.buffer = noiseBuf;
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 240;
    var ng = c.createGain(); ng.gain.setValueAtTime(vol * 0.9, at); ng.gain.exponentialRampToValueAtTime(0.0001, at + (len || 0.5));
    n.connect(lp); lp.connect(ng); ng.connect(sfx); n.start(at, Math.random()); n.stop(at + (len || 0.5) + 0.05);
  }
  function tone(f, at, dur, type, vol, f2) {
    var c = ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type || 'triangle'; o.frequency.setValueAtTime(f, at); if (f2) o.frequency.exponentialRampToValueAtTime(f2, at + dur);
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(sfx); o.start(at); o.stop(at + dur + 0.03);
  }
  function noise(at, dur, vol, type, f, q) {
    var c = ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noiseBuf; fl.type = type; fl.frequency.value = f; fl.Q.value = q || 1;
    g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    s.connect(fl); fl.connect(g); g.connect(sfx); s.start(at, Math.random()); s.stop(at + dur + 0.02);
  }

  // 자동 뿡: 작게, 여러 가지로
  FA.puff = function () {
    if (!ok() || !gate('puff', 0.07)) return;
    var t = ctx.currentTime + 0.005, r = Math.random();
    if (r < 0.2) toot(t, 0.06 + Math.random() * 0.03, 190 + Math.random() * 60, 0.13);          // 뽁
    else toot(t, 0.09 + Math.random() * 0.07, 110 + Math.random() * 50, 0.15);                  // 뿡
  };
  // 모으는 중: 끄응— 올라가는 떨림 (한 번 켜고 세기만 바꾼다)
  var ch = null;
  FA.chargeStart = function () {
    if (!ok() || ch) return;
    var c = ctx, t = c.currentTime;
    var o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = 180;
    var vib = c.createOscillator(); vib.frequency.value = 9; var vg = c.createGain(); vg.gain.value = 10; vib.connect(vg); vg.connect(o.frequency);
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    var g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.08);
    o.connect(lp); lp.connect(g); g.connect(sfx); o.start(t); vib.start(t);
    ch = { o: o, vib: vib, vg: vg, g: g };
  };
  FA.chargeSet = function (p, danger) {
    if (!ch || !ctx) return;
    var t = ctx.currentTime;
    ch.o.frequency.setTargetAtTime(170 + p * 330 + (danger ? 120 : 0), t, 0.05);
    ch.vib.frequency.setTargetAtTime(danger ? 22 : 8 + p * 6, t, 0.05);
    ch.vg.gain.setTargetAtTime(danger ? 40 : 8 + p * 14, t, 0.05);
    ch.g.gain.setTargetAtTime(danger ? 0.09 : 0.04 + p * 0.03, t, 0.05);
  };
  FA.chargeStop = function () {
    if (!ch || !ctx) { ch = null; return; }
    var t = ctx.currentTime;
    ch.g.gain.cancelScheduledValues(t); ch.g.gain.setTargetAtTime(0.0001, t, 0.02);
    try { ch.o.stop(t + 0.15); ch.vib.stop(t + 0.15); } catch (e) {}
    ch = null;
  };
  // 큰 방귀: 세기 p(0~1)만큼 길고 굵게 + 쿵
  FA.blast = function (p) {
    FA.chargeStop();
    if (!ok()) return;
    var t = ctx.currentTime + 0.01;
    var n = 1 + Math.round(p * 4), at = t;
    for (var i = 0; i < n; i++) {
      var r = Math.random(), len, base;
      if (i === n - 1 && p > 0.5) { len = 0.35 + p * 0.3; base = 62 + Math.random() * 12; }        // 마지막 뿌우우웅
      else if (r < 0.25) { len = 0.07; base = 180 + Math.random() * 50; }
      else { len = 0.1 + Math.random() * 0.08; base = 90 + Math.random() * 40; }
      toot(at, len, base, 0.3 + p * 0.12, 900 + p * 500);
      at += len + 0.03;
    }
    boom(t, 0.35 + p * 0.55, 110 + p * 30, 0.35 + p * 0.4);
  };
  // 뿌지직: 길고 엉망인 방귀 + 철퍼덕
  FA.bujijik = function () {
    FA.chargeStop();
    if (!ok()) return;
    var t = ctx.currentTime + 0.01, at = t;
    for (var i = 0; i < 9; i++) { var len = 0.05 + Math.random() * 0.12; toot(at, len, 70 + Math.random() * 120, 0.34, 1400); at += len + 0.01; }
    toot(at, 0.6, 52, 0.4, 700);
    boom(t, 1.0, 140, 0.9);
    noise(t + 0.05, 0.4, 0.5, 'bandpass', 700, 0.8);
  };
  FA.perfect = function () { if (!ok()) return; var t = ctx.currentTime; [1047, 1319, 1568, 2093].forEach(function (f, i) { tone(f, t + i * 0.05, 0.22, 'square', 0.06); }); };
  FA.hit = function () { if (!ok() || !gate('hit', 0.045)) return; var t = ctx.currentTime; noise(t, 0.05, 0.16, 'bandpass', 900 + Math.random() * 400, 1.5); };
  FA.pop = function () { if (!ok() || !gate('pop', 0.05)) return; var t = ctx.currentTime; tone(520 + Math.random() * 200, t, 0.07, 'square', 0.05, 180); };
  var gemN = 0, gemT = 0;
  FA.gem = function () {
    if (!ok() || !gate('gem', 0.035)) return;
    var t = ctx.currentTime; if (t - gemT > 0.6) gemN = 0; gemT = t; gemN = Math.min(gemN + 1, 14);
    tone(880 * Math.pow(2, gemN / 24), t, 0.08, 'sine', 0.07);
  };
  FA.coin = function () { if (!ok() || !gate('coin', 0.05)) return; var t = ctx.currentTime; tone(1568, t, 0.08, 'square', 0.05); tone(2093, t + 0.06, 0.16, 'square', 0.05); };
  FA.levelup = function () { if (!ok()) return; var t = ctx.currentTime; [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, t + i * 0.07, 0.3, 'triangle', 0.16); tone(f / 2, t + i * 0.07, 0.25, 'square', 0.03); }); };
  FA.pick = function () { if (!ok()) return; var t = ctx.currentTime; tone(784, t, 0.12, 'triangle', 0.14); tone(1175, t + 0.08, 0.22, 'triangle', 0.14); };
  FA.click = function () { if (!ok()) return; var t = ctx.currentTime; tone(660, t, 0.06, 'triangle', 0.1); };
  FA.hurt = function () { if (!ok() || !gate('hurt', 0.25)) return; var t = ctx.currentTime; tone(420, t, 0.16, 'square', 0.08, 220); };
  FA.cough = function () {
    if (!ok() || !gate('cough', 0.22)) return;
    var t = ctx.currentTime;
    noise(t, 0.07, 0.14, 'bandpass', 600, 2); noise(t + 0.1, 0.06, 0.1, 'bandpass', 650, 2);
  };
  FA.splash = function () { if (!ok() || !gate('splash', 0.1)) return; var t = ctx.currentTime; noise(t, 0.12, 0.14, 'highpass', 2500); };
  FA.stomp = function () { if (!ok()) return; boom(ctx.currentTime, 0.8, 90, 0.5); };
  FA.warn = function () {
    if (!ok()) return; var t = ctx.currentTime;
    for (var i = 0; i < 3; i++) { tone(440, t + i * 0.5, 0.24, 'square', 0.09, 660); tone(660, t + i * 0.5 + 0.24, 0.24, 'square', 0.09, 440); }
  };
  FA.word = function (lv) {
    if (!ok()) return; var t = ctx.currentTime, base = [659, 784, 988][lv] || 659;
    tone(base, t, 0.12, 'square', 0.07); tone(base * 1.5, t + 0.08, 0.26, 'square', 0.07);
  };
  FA.evo = function () {
    if (!ok()) return; var t = ctx.currentTime;
    [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach(function (f, i) { tone(f, t + i * 0.08, 0.35, 'triangle', 0.14); });
    noise(t, 1.0, 0.08, 'highpass', 6000);
  };
  FA.bossDie = function () {
    if (!ok()) return; var t = ctx.currentTime;
    for (var i = 0; i < 5; i++) boom(t + i * 0.18, 0.7, 150 - i * 15, 0.5);
    [523, 659, 784, 1047].forEach(function (f, i) { tone(f, t + 1.0 + i * 0.12, 0.5, 'triangle', 0.18); });
  };
  FA.clear = function () {
    if (!ok()) return; var t = ctx.currentTime;
    [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, t + i * 0.12, i === 4 ? 0.9 : 0.3, 'triangle', 0.2); tone(f / 2, t + i * 0.12, 0.3, 'square', 0.04); });
  };
  FA.over = function () {
    if (!ok()) return; var t = ctx.currentTime, notes = [311, 294, 277, 262];
    notes.forEach(function (f, i) {
      var st = t + 0.08 + i * 0.36, dur = i === 3 ? 0.9 : 0.32;
      var o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 1100;
      if (i === 3) { var vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 6; vg.gain.value = 9; vib.connect(vg); vg.connect(o.frequency); vib.start(st); vib.stop(st + dur + 0.02); o.frequency.linearRampToValueAtTime(f * 0.92, st + dur); }
      g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(0.26, st + 0.04);
      g.gain.setValueAtTime(0.26, st + dur - 0.08); g.gain.exponentialRampToValueAtTime(0.0001, st + dur);
      o.connect(lp); lp.connect(g); g.connect(sfx); o.start(st); o.stop(st + dur + 0.02);
    });
  };

  // ─────────────── 배경음 ───────────────
  // [bpm, 진행(마디마다 근음·화음 MIDI), 리드 16스텝(-1 쉼)]
  var SONGS = [
    [118, [[48, 60, 64, 67], [45, 57, 60, 64], [41, 53, 57, 60], [43, 55, 59, 62]], [72, -1, 76, -1, 79, 76, -1, 72, 74, -1, 76, -1, 72, -1, -1, -1]],     // 운동장 C Am F G
    [112, [[45, 57, 60, 64], [41, 53, 57, 60], [48, 60, 64, 67], [43, 55, 59, 62]], [69, -1, 72, 71, 69, -1, 76, -1, 74, 72, -1, 71, 69, -1, -1, -1]],    // 지하철 Am F C G
    [108, [[50, 62, 65, 69], [43, 55, 59, 62], [48, 60, 64, 67], [45, 57, 61, 64]], [74, -1, -1, 77, 76, -1, 74, -1, 72, -1, 74, -1, 69, -1, -1, -1]],     // 찜질방 Dm G C A
    [124, [[41, 53, 57, 60], [43, 55, 59, 62], [40, 52, 55, 59], [45, 57, 60, 64]], [77, 76, 74, 72, -1, 72, 74, -1, 76, -1, 79, -1, 76, -1, -1, -1]],     // 놀이공원 F G Em Am
    [128, [[40, 52, 55, 59], [48, 60, 64, 67], [50, 62, 66, 69], [47, 59, 63, 66]], [71, -1, 74, -1, 76, -1, 74, 71, 69, -1, 71, -1, 67, -1, -1, -1]],     // 공장 Em C D B
    [136, [[45, 57, 60, 64], [41, 53, 57, 60], [40, 52, 56, 59], [40, 52, 56, 59]], [76, -1, 76, 77, 76, -1, 74, -1, 72, -1, 71, -1, 68, -1, 71, -1]]      // 보스 Am F E E
  ];
  var song = SONGS[0], mTimer = null, step = 0, nextT = 0, want = 0, playing = false;
  var mf = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
  function mNote(f, t, dur, type, vol, cut) {
    var o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    o.type = type; o.frequency.value = f;
    fl.type = 'lowpass'; fl.frequency.value = cut || 1800;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(fl); fl.connect(g); g.connect(mus); o.start(t); o.stop(t + dur + 0.05);
  }
  function mNoise(t, dur, vol, type, f) {
    var s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; fl.type = type; fl.frequency.value = f;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(mus); s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }
  function tickMusic() {
    if (!ctx) return;
    if (ctx.currentTime > nextT + 1) nextT = ctx.currentTime + 0.05;       // 멈췄다 돌아오면 밀린 박자를 버린다
    var S16 = 60 / song[0] / 4, boss = song === SONGS[5];
    while (nextT < ctx.currentTime + 0.2) {
      var t = nextT, s = step % 16, bar = Math.floor(step / 16) % 4, chd = song[1][bar];
      if (bgmOn && playing && !FA.paused) {
        if (s % 4 === 0) { var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); g.gain.setValueAtTime(0.85, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.connect(g); g.connect(mus); o.start(t); o.stop(t + 0.2); }
        if (s % 4 === 2 || (boss && s % 2 === 1)) mNoise(t, 0.08, boss ? 0.26 : 0.33, 'highpass', 7000);
        if (s === 4 || s === 12) mNoise(t, 0.16, 0.42, 'bandpass', 1800);
        mNote(mf(chd[0] - 12 + (s % 2 ? 12 : 0)), t, S16 * 0.9, 'sawtooth', 0.2, 700);
        if (s % 8 === 3 || s % 8 === 6) for (var k = 1; k < 4; k++) mNote(mf(chd[k]), t, S16 * 1.5, 'square', 0.032, 2400);
        var L = song[2][s];
        if (L > 0 && Math.floor(step / 64) % 2 === 1) mNote(mf(L + (bar === 1 ? -2 : bar === 3 ? -1 : 0)), t, S16 * 1.8, 'triangle', 0.085, 3000);
      }
      nextT += S16; step++;
    }
  }
  function startMusic() {
    if (!ctx) return;
    nextT = ctx.currentTime + 0.1;
    mTimer = setInterval(tickMusic, 50);
  }
  // n: 0~4 스테이지, 5 보스, -1 끔
  FA.music = function (n) {
    if (n < 0) { playing = false; return; }
    var s = SONGS[n] || SONGS[0];
    if (s !== song) { song = s; step = 0; }
    playing = true;
  };
  FA.setSnd = function (b) { sndOn = !!b; try { localStorage.setItem('fartrogue.snd', sndOn ? '1' : '0'); } catch (e) {} if (sfx) sfx.gain.value = sndOn ? 1 : 0; if (!sndOn) FA.chargeStop(); };
  FA.setBgm = function (b) { bgmOn = !!b; try { localStorage.setItem('fartrogue.bgm', bgmOn ? '1' : '0'); } catch (e) {} if (mus) mus.gain.value = bgmOn ? 0.42 : 0; };
  FA.suspend = function (b) { FA.paused = b; if (b) FA.chargeStop(); };
  window.FA = FA;
})();
