// 소리 — 코드로 만든 것 + assets/*.mp3 녹음 몇 개 (녹음이 없으면 코드 소리로 넘어간다)
(function () {
  var KEY = 'bungeoppang.snd';
  var on = localStorage.getItem(KEY) !== '0';
  var ac = null, master = null, noiseBuf = null;

  function ctx() {
    if (ac) return ac;
    var C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    ac = new C();
    master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);
    var n = ac.sampleRate * 0.6; noiseBuf = ac.createBuffer(1, n, ac.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return ac;
  }
  function tone(f, t0, dur, type, vol, f2) {
    var a = ctx(); if (!a) return;
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.3, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(t0, dur, freq, q, vol) {
    var a = ctx(); if (!a) return;
    var s = a.createBufferSource(); s.buffer = noiseBuf;
    var bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q || 1;
    var g = a.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.25, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(bp); bp.connect(g); g.connect(master); s.start(t0); s.stop(t0 + dur + 0.02);
  }

  // ---------- 녹음 파일 소리 ----------
  // 몇 개만 실제 녹음을 쓴다. <audio> 로 틀어야 file:// 에서도 난다.
  // from/len 은 긴 녹음에서 쓸 토막(초). 없으면 끝까지 튼다
  // vol 은 귀로 맞춘 값이 아니라 파형(RMS)을 재서 서로 비슷하게 들리도록 잡은 값이다.
  // 원본 RMS — meow .052 / pour .022 / broth .140 / coin .046.
  // broth 가 유난히 커서 많이 깎았다. 파일을 갈아 끼우면 RMS 를 다시 재서 맞출 것
  var FILES = {
    meow: { src: 'assets/meow.mp3', vol: 0.45 },   // 길냥이 야옹
    pour: { src: 'assets/pour.mp3', vol: 0.95 },   // 무쇠판에 반죽 붓는 지글지글
    fill: { src: 'assets/broth.mp3', vol: 0.16 },  // 오뎅 새로 담글 때만
    sell: { src: 'assets/coin.mp3', vol: 0.48 }    // 돈통에 동전 떨어지는 소리
  };
  (function () {
    for (var k in FILES) {
      var f = FILES[k];
      try {
        f.el = new Audio(f.src);
        f.el.preload = 'auto';
        f.el.volume = f.vol;
        f.el.load();
      } catch (e) { f.el = null; }
    }
  })();
  function filePlay(name) {
    var f = FILES[name];
    if (!f || !f.el || f.el.readyState < 2) return false;
    try {
      var a = f.el.cloneNode();                          // 겹쳐 나도 끊기지 않게
      a.volume = f.vol;
      if (f.from) a.currentTime = f.from;
      var p = a.play();
      if (p && p.catch) p.catch(function () {});
      if (f.len) {                                       // 긴 녹음은 필요한 만큼만 — 끝은 살살 줄인다
        var fade = f.fade || 0, steps = fade ? 6 : 0, i = 0;
        if (steps) setTimeout(function step() {
          i++;
          try { a.volume = Math.max(0, f.vol * (1 - i / steps)); } catch (e) {}
          if (i < steps) setTimeout(step, (fade / steps) * 1000);
        }, (f.len - fade) * 1000);
        setTimeout(function () { try { a.pause(); } catch (e) {} }, f.len * 1000);
      }
      return true;
    } catch (e) { return false; }
  }

  var SFX = {
    // 반죽 붓기 — 무쇠판에 닿아 지글거리는 녹음(assets/pour.mp3)
    pour: function (t) {
      if (filePlay('pour')) return;
      noise(t, 0.34, 1500, 0.8, 0.16); tone(180, t, 0.1, 'sine', 0.1, 120);
    },
    // 오뎅을 국물에 담그기 — 보글보글(assets/broth.mp3)
    fill: function (t) {
      if (filePlay('fill')) return;
      noise(t, 0.42, 700, 0.7, 0.13); tone(140, t, 0.16, 'sine', 0.08, 100);
    },
    // 돈통에 동전 떨어지는 소리 (assets/coin.mp3)
    sell: function (t) {
      if (filePlay('sell')) return;
      tone(1046, t, 0.09, 'triangle', 0.22); tone(1568, t + 0.045, 0.2, 'triangle', 0.18);
    },
    big: function (t) { [784, 1046, 1318, 1568].forEach(function (f, i) { tone(f, t + i * 0.055, 0.3, 'triangle', 0.2); }); },
    // 야옹 — 녹음 파일(assets/meow.mp3)이 있으면 그걸 쓰고, 없으면 아래 소리로 대신한다
    meow: function (t) {
      if (filePlay('meow')) return;
      tone(620, t, 0.16, 'sawtooth', 0.07, 880);
      tone(880, t + 0.14, 0.30, 'sawtooth', 0.08, 430);
      tone(1240, t + 0.02, 0.12, 'sine', 0.03, 1680);
      noise(t, 0.10, 1100, 2.4, 0.03);
    },
    sweep: function (t) { noise(t, 0.28, 800, 0.6, 0.14); },
    buy: function (t) { tone(660, t, 0.06, 'square', 0.1); tone(990, t + 0.05, 0.12, 'square', 0.09); },
    rank: function (t) { [523, 659, 784, 1046, 1318].forEach(function (f, i) { tone(f, t + i * 0.11, 0.5, 'triangle', 0.22); }); },
    no: function (t) { tone(220, t, 0.12, 'square', 0.09, 160); }
  };

  // ---------- 배경 음악: 징글벨 ----------
  // 1857년 곡이라 저작권이 끝났다. 남의 음원도 남의 편곡도 쓰지 않고
  // 음표만 적어 코드로 울린다 — 그래서 파일이 필요 없고 걸릴 데도 없다
  var NOTE = { C: 261.63, D: 293.66, E: 329.63, F: 349.23, G: 392.00 };
  var TUNE = [                                       // 후렴 한 바퀴 (음이름, 박자)
    ['E', 1], ['E', 1], ['E', 2],
    ['E', 1], ['E', 1], ['E', 2],
    ['E', 1], ['G', 1], ['C', 1.5], ['D', 0.5], ['E', 4],
    ['F', 1], ['F', 1], ['F', 1.5], ['F', 0.5], ['F', 1], ['E', 1], ['E', 1], ['E', 0.5], ['E', 0.5],
    ['G', 1], ['G', 1], ['F', 1], ['D', 1], ['C', 4]
  ];
  var BEAT = 0.40, REST = 26;                        // 한 박 · 한 바퀴 돌고 쉬는 시간
  var bgmOn = false, bgmTimer = 0, bgmGain = null;
  var BGM_VOL = 0.30;

  // 녹음된 배경 음악(assets/bgm.mp3)이 있으면 그걸 돌리고, 없으면 위 음표로 연주한다
  var BGM_FILE_VOL = 0.13;                           // 새 곡이 옛 곡보다 4.8dB 크다 — 그만큼 낮춰 잡았다
  var bgmEl = null;
  (function () {
    try {
      // 곡을 갈면 번호를 올린다 — 안 그러면 옛 곡이 캐시에서 나온다.
      // file:// 로 열었을 때는 물음표를 붙이지 않는다 (경로로 읽히면 파일을 못 찾는다)
      bgmEl = new Audio('assets/bgm.mp3' + (location.protocol === 'file:' ? '' : '?v=2'));
      bgmEl.preload = 'auto';
      bgmEl.loop = true;
      bgmEl.volume = 0;                              // 켤 때 서서히 올린다
      bgmEl.addEventListener('error', function () { bgmEl = null; });   // 파일이 없거나 깨졌으면 코드 연주로
      bgmEl.load();
    } catch (e) { bgmEl = null; }
  })();
  // 아직 다 안 받아졌어도 play() 를 걸어 두면 받는 대로 울린다.
  // readyState 를 기다리면 첫 판에는 늘 코드 연주로 새 버렸다
  function bgmFileReady() { return !!bgmEl; }
  var fadeT = 0;
  function bgmFade(to, done) {                       // 뚝 끊기지 않게 살살
    clearInterval(fadeT);
    if (!bgmEl) return;
    var from = bgmEl.volume, i = 0, n = 10;
    fadeT = setInterval(function () {
      i++;
      try { bgmEl.volume = Math.max(0, Math.min(1, from + (to - from) * (i / n))); } catch (e) {}
      if (i >= n) { clearInterval(fadeT); if (done) done(); }
    }, 40);
  }

  function bgmBus() {
    var a = ctx(); if (!a) return null;
    if (!bgmGain) {
      bgmGain = a.createGain();
      bgmGain.gain.value = on ? BGM_VOL : 0;
      bgmGain.connect(master);
    }
    return bgmGain;
  }
  function bell(f, t0, dur, vol) {                   // 종소리 — 사인 + 높은 배음, 길게 사라진다
    var a = ctx(), bus = bgmBus(); if (!a || !bus) return;
    var o = a.createOscillator(), o2 = a.createOscillator();
    var g1 = a.createGain(), g2 = a.createGain();
    o.type = 'sine'; o.frequency.value = f;
    o2.type = 'sine'; o2.frequency.value = f * 2.76;
    g2.gain.value = 0.22;
    g1.gain.setValueAtTime(0.0001, t0);
    g1.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
    g1.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g1); o2.connect(g2); g2.connect(g1); g1.connect(bus);
    o.start(t0); o.stop(t0 + dur + 0.02);
    o2.start(t0); o2.stop(t0 + dur + 0.02);
  }
  function shake(t0) {                               // 썰매 방울 — 박마다 살짝
    var a = ctx(), bus = bgmBus(); if (!a || !bus) return;
    var s = a.createBufferSource(); s.buffer = noiseBuf;
    var bp = a.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.value = 5200; bp.Q.value = 1.1;
    var g1 = a.createGain();
    g1.gain.setValueAtTime(0.0001, t0);
    g1.gain.exponentialRampToValueAtTime(0.05, t0 + 0.006);
    g1.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.13);
    s.connect(bp); bp.connect(g1); g1.connect(bus);
    s.start(t0); s.stop(t0 + 0.16);
  }
  // 배경 음악을 실제로 켜고 끄는 자리 — 파일이 있으면 파일, 없으면 코드 연주
  function bgmRun(go) {
    if (bgmFileReady()) {
      clearTimeout(bgmTimer);
      if (go) {
        var p = bgmEl.play();
        if (p && p.catch) p.catch(function () {});
        // 먼저 반쯤 올려 두고 나머지를 살살 — 타이머가 늦는 화면에서도 소리가 난다
        try { bgmEl.volume = Math.max(bgmEl.volume, BGM_FILE_VOL * 0.5); } catch (e) {}
        bgmFade(BGM_FILE_VOL);
      } else {
        bgmFade(0, function () { try { bgmEl.pause(); } catch (e) {} });
      }
      return;
    }
    if (go) bgmPass(); else clearTimeout(bgmTimer);
  }
  function bgmPass() {
    clearTimeout(bgmTimer);
    var a = ctx(); if (!a || !bgmOn) return;
    if (a.state === 'suspended') a.resume();
    var t0 = a.currentTime + 0.12, beat = 0;
    for (var i = 0; i < TUNE.length; i++) {
      var f = NOTE[TUNE[i][0]], len = TUNE[i][1];
      bell(f, t0 + beat * BEAT, Math.min(len * BEAT * 1.4, 1.7), 0.20);
      for (var k = 0; k < len; k++) shake(t0 + (beat + k) * BEAT);
      beat += len;
    }
    bgmTimer = setTimeout(bgmPass, (beat * BEAT + REST) * 1000);
  }
  function bgmMute(v) {                              // 음소거 — 이미 울리던 음까지 바로 재운다
    var a = ctx(), bus = bgmBus(); if (!a || !bus) return;
    bus.gain.cancelScheduledValues(a.currentTime);
    bus.gain.setTargetAtTime(v ? 0 : BGM_VOL, a.currentTime, 0.05);
  }

  var last = {};
  window.SND = {
    play: function (name) {
      if (!on || !SFX[name]) return;
      var a = ctx(); if (!a) return;
      if (a.state === 'suspended') a.resume();
      var now = a.currentTime;
      if (last[name] && now - last[name] < 0.035) return;   // 같은 소리가 겹쳐 터지는 것 막기
      last[name] = now; SFX[name](now);
    },
    get on() { return on; },
    toggle: function () {
      on = !on; localStorage.setItem(KEY, on ? '1' : '0');
      bgmMute(!on);                                      // 배경 음악도 같은 단추에 걸린다
      bgmRun(on && bgmOn);
      if (on) this.play('buy');
      return on;
    },
    // 배경 음악 켜고 끄기 (게임이 시작될 때 켠다)
    bgm: function (v) {
      if (v === bgmOn) return bgmOn;
      bgmOn = !!v;
      bgmMute(!on);
      bgmRun(on && bgmOn);
      return bgmOn;
    },
    unlock: function () {
      var a = ctx(); if (a && a.state === 'suspended') a.resume();
      var els = [];                                      // 아이폰은 손가락이 닿아야 소리가 열린다
      for (var k in FILES) if (FILES[k].el) els.push(FILES[k].el);
      // 배경 음악은 여기서 건드리지 않는다 — 무음으로 틀었다 멈추는 사이에
      // bgm(true) 가 켠 음악까지 같이 멈춰 버린다. 어차피 손가락이 닿은 자리에서 바로 켜진다
      for (var i2 = 0; i2 < els.length; i2++) {
        var f = { el: els[i2] };
        if (!f.el || f.el.__un) continue;
        f.el.__un = 1;
        (function (el) {
          try {
            el.muted = true;
            var p = el.play();
            var done = function () { el.pause(); el.currentTime = 0; el.muted = false; };
            if (p && p.then) p.then(done, function () { el.muted = false; });
            else done();
          } catch (e) { el.muted = false; }
        })(f.el);
      }
    }
  };
})();
