/* 고양이용 게임 — 소리. 전부 WebAudio 로 합성한다(파일 없음, file:// 에서도 난다).
 * window.CMAudio = { unlock, squeak(size), tap(), setOn(b), on }
 */
(function () {
  'use strict';
  var ctx = null, master = null;
  var on = true;
  try { on = localStorage.getItem('catmobile.snd') !== '0'; } catch (e) {}

  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    return ctx;
  }
  function unlock() {
    var c = ensure();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    // 아이폰: 무음 버퍼를 한 번 울려야 이후 소리가 난다
    try {
      var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource();
      s.buffer = b; s.connect(c.destination); s.start(0);
    } catch (e) {}
  }

  // 고무 오리 "뾱": 음이 확 올라갔다 내려온다. size 0~1 (클수록 낮은 소리)
  function squeak(size) {
    if (!on) return;
    var c = ensure(); if (!c) return;
    if (c.state === 'suspended') c.resume();
    var t = c.currentTime;
    var base = 520 + (1 - size) * 620 + (Math.random() - .5) * 120; // 520~1140Hz
    var dur = 0.16 + size * 0.08;

    var o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(base * 0.8, t);
    o.frequency.exponentialRampToValueAtTime(base * 1.9, t + 0.035);
    o.frequency.exponentialRampToValueAtTime(base * 0.95, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.55, t + 0.012);
    g.gain.setValueAtTime(0.55, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.08);

    // 위에 얹는 얇은 배음 — 삑삑이 질감
    var o2 = c.createOscillator(), g2 = c.createGain();
    o2.type = 'triangle';
    o2.frequency.setValueAtTime(base * 1.6, t);
    o2.frequency.exponentialRampToValueAtTime(base * 3.8, t + 0.035);
    o2.frequency.exponentialRampToValueAtTime(base * 1.9, t + dur);
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.exponentialRampToValueAtTime(0.14, t + 0.012);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.8);
    o2.connect(g2); g2.connect(master);
    o2.start(t); o2.stop(t + dur);

    // 맨 앞의 "뽁" 클릭
    var n = c.createBufferSource(), nb = c.createBuffer(1, 1200, c.sampleRate), d = nb.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    n.buffer = nb;
    var ng = c.createGain(); ng.gain.value = 0.18;
    var f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.8;
    n.connect(f); f.connect(ng); ng.connect(master);
    n.start(t);
  }

  // 빈 곳을 눌렀을 때 — 작고 낮은 "뽁"
  function tap() {
    if (!on) return;
    var c = ensure(); if (!c) return;
    if (c.state === 'suspended') c.resume();
    var t = c.currentTime;
    var o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(180, t + 0.09);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.14);
  }

  function setOn(b) {
    on = !!b;
    try { localStorage.setItem('catmobile.snd', on ? '1' : '0'); } catch (e) {}
  }

  window.CMAudio = { unlock: unlock, squeak: squeak, tap: tap, setOn: setOn, get on() { return on; } };
})();
