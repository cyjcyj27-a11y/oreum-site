/* =========================================================
   오름냥 - 소리 담당
   ---------------------------------------------------------
   assets/audio/ 폴더에 아래 이름으로 파일을 넣으면 자동으로 씁니다.
   파일이 없으면 코드로 만든 임시 소리(삐용~)가 대신 납니다.

     pop.mp3      : 고양이 팡! 터지는 기본 소리
     combo.mp3    : 연쇄로 또 터질 때
     rocket.mp3   : 로켓냥 발사
     bomb.mp3     : 폭탄냥 폭발
     rainbow.mp3  : 무지개냥
     swap.mp3     : 고양이 자리 바꿈
     invalid.mp3  : 안 되는 자리 (뿌우)
     goal.mp3     : 목표 하나 채움
     star.mp3     : 별 획득
     win.mp3      : 판 클리어
     lose.mp3     : 실패
     click.mp3    : 버튼 누름
     bgm_map.mp3  : 지도 화면 배경음악
     bgm_play.mp3 : 게임 중 배경음악

   확장자는 mp3 / ogg / wav / m4a 다 됩니다. (자동으로 찾아봄)

   파일을 넣은 뒤 `python 소리목록.py` 를 한 번 돌리면
   assets/audio/manifest.json 이 갱신되어, 없는 파일을 헛되이 부르지 않습니다.
   (manifest.json 이 없으면 예전처럼 하나씩 찾아봅니다)
   ========================================================= */
(function (global) {
  'use strict';

  var DIR = 'assets/audio/';
  var EXTS = ['mp3', 'ogg', 'wav', 'm4a'];

  var SFX_NAMES = ['pop', 'combo', 'rocket', 'bomb', 'rainbow', 'swap',
                   'invalid', 'goal', 'star', 'win', 'lose', 'click'];
  var BGM_NAMES = ['bgm_map', 'bgm_play'];

  /* -------------------------------------------------------
     소리별 크기 (0 = 무음, 1 = 원래 크기)
     자주 나는 소리를 작게 해야 가끔 나는 소리가 묻히지 않는다.
     귀에 거슬리면 이 숫자만 고치면 된다. 파일은 안 건드려도 됨.
     ------------------------------------------------------- */
  var VOL = {
    pop:     0.30,   // 고양이 터짐 - 제일 자주 난다. 부드러운 소리로 바꾸고 작게
    combo:   0.44,   // 연쇄
    swap:    0,      // 자리 바꿈 - 지금은 꺼둠 (되살리려면 0.26)
    click:   0.40,   // 버튼
    invalid: 0.45,   // 안 되는 자리
    goal:    0.34,   // 오름 오름 / 감귤 배달
    rocket:  0.95,   // 로켓냥 - 가끔이니 크게
    bomb:    1.00,   // 폭탄냥
    rainbow: 1.00,   // 무지개냥
    star:    0.70,   // 특수냥 탄생
    win:     1.00,
    lose:    1.00
  };

  /* 화면별 배경음악 크기. 게임 중에는 효과음이 묻히지 않게 조금 낮춘다 */
  var BGM_VOL = { bgm_map: 1.00, bgm_play: 0.70 };

  /* 같은 소리가 이 시간 안에 또 나면 건너뛴다 (연쇄 때 소리가 겹쳐 뭉개지는 것 방지) */
  var MIN_GAP_MS = 55;
  var lastAt = {};

  var buffers = {};     // 이름 -> AudioBuffer (파일이 있을 때)
  var bgmEls = {};      // 이름 -> HTMLAudioElement
  var ctx = null;
  var masterGain = null;
  var ready = false;

  var state = {
    mutedSfx: false,      // 효과음 끔
    mutedBgm: false,      // 배경음악 끔
    sfxVol: 0.85,
    bgmVol: 0.35,
    curBgm: null
  };

  /* ---------- 초기화 ---------- */
  function ensureCtx() {
    if (ctx) return ctx;
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = state.sfxVol;
    masterGain.connect(ctx.destination);
    return ctx;
  }

  /* 브라우저는 사용자가 화면을 한 번 건드리기 전에는 소리를 못 내게 막는다.
     그래서 아무 데나 눌렀을 때 소리를 깨우는데,
     음소거 상태에서는 깨우면 안 된다. (끄는 그 터치가 다시 켜버린다) */
  function unlock() {
    ensureCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    if (state.mutedBgm) return;
    if (state.curBgm && bgmEls[state.curBgm]) {
      var el = bgmEls[state.curBgm];
      if (el.paused) el.play().catch(function () {});
    }
  }

  /* 파일 하나를 확장자 후보로 돌려가며 찾아본다 */
  function fetchFirst(base, i, cb) {
    if (i >= EXTS.length) { cb(null); return; }
    var url = DIR + base + '.' + EXTS[i];
    fetch(url).then(function (res) {
      if (!res.ok) throw 0;
      return res.arrayBuffer();
    }).then(function (buf) {
      ensureCtx();
      if (!ctx) throw 0;
      ctx.decodeAudioData(buf,
        function (decoded) { cb(decoded); },
        function () { fetchFirst(base, i + 1, cb); });
    }).catch(function () {
      fetchFirst(base, i + 1, cb);
    });
  }

  function probeBgm(base, i) {
    if (i >= EXTS.length) return;
    var url = DIR + base + '.' + EXTS[i];
    fetch(url, { method: 'HEAD' }).then(function (res) {
      if (!res.ok) throw 0;
      var el = new Audio(url);
      el.loop = true;
      el.volume = state.bgmVol;
      el.preload = 'auto';
      bgmEls[base] = el;
      if (state.curBgm === base && !state.mutedBgm) el.play().catch(function () {});
    }).catch(function () { probeBgm(base, i + 1); });
  }

  /* 어떤 소리 파일이 있는지 목록(manifest.json)이 있으면 그것만 읽고,
     없으면 확장자를 하나씩 넣어보며 직접 찾는다.
     목록이 있으면 없는 파일을 헛되이 부르지 않아 배포본이 깔끔하다. */
  function loadFromManifest(man) {
    var sfx = man.sfx || {}, bgm = man.bgm || {};
    Object.keys(sfx).forEach(function (n) {
      fetch(DIR + sfx[n]).then(function (r) {
        if (!r.ok) throw 0; return r.arrayBuffer();
      }).then(function (buf) {
        ensureCtx();
        if (ctx) ctx.decodeAudioData(buf, function (d) { buffers[n] = d; }, function () {});
      }).catch(function () {});
    });
    var byFile = {};
    Object.keys(bgm).forEach(function (n) {
      var file = bgm[n];
      // 두 화면이 같은 곡이면 하나만 만들어 같이 쓴다.
      // 그래야 화면을 넘어가도 노래가 처음부터 다시 시작되지 않는다.
      if (!byFile[file]) {
        var el = new Audio(DIR + file);
        // 배경음악은 파일이 크다. 켜기 전에는 받아오지 않는다(폰 데이터 아끼려고)
        el.loop = true; el.volume = state.bgmVol; el.preload = 'none';
        byFile[file] = el;
      }
      bgmEls[n] = byFile[file];
      if (state.curBgm === n && !state.mutedBgm) bgmEls[n].play().catch(function () {});
    });

    // 배경음악은 파일이 커서, 트는 순간에 받기 시작하면 한참 기다린다.
    // 게임에 필요한 것들이 먼저 다 뜬 뒤에 조용히 미리 받아둔다.
    setTimeout(function () {
      Object.keys(byFile).forEach(function (f) {
        var el = byFile[f];
        el.preload = 'auto';
        try { el.load(); } catch (e) {}
      });
    }, 1200);
  }

  function probeEverything() {
    SFX_NAMES.forEach(function (n) {
      fetchFirst(n, 0, function (buf) { if (buf) buffers[n] = buf; });
    });
    BGM_NAMES.forEach(function (n) { probeBgm(n, 0); });
  }

  function init() {
    if (ready) return;
    ready = true;
    ensureCtx();

    fetch(DIR + 'manifest.json').then(function (r) {
      if (!r.ok) throw 0;
      return r.json();
    }).then(function (man) {
      loadFromManifest(man || {});
    }).catch(function () {
      probeEverything();
    });

    ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
      global.addEventListener(ev, unlock, { passive: true });
    });
  }

  /* ---------- 파일 재생 ---------- */
  function playBuffer(name, rate, vol) {
    var buf = buffers[name];
    if (!buf || !ctx) return false;
    var src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate || 1;
    var g = ctx.createGain();
    g.gain.value = (vol == null ? (VOL[name] == null ? 1 : VOL[name]) : vol);
    src.connect(g); g.connect(masterGain);
    src.start(0);
    return true;
  }

  /* ---------- 임시 합성음 (파일 없을 때) ---------- */
  var synthName = null;   // 지금 합성 중인 소리 이름 (크기표 적용용)

  function tone(freq, dur, type, vol, slideTo, delay) {
    if (!ctx) return;
    if (synthName && VOL[synthName] != null) vol = (vol == null ? 0.3 : vol) * VOL[synthName];
    var t0 = ctx.currentTime + (delay || 0);
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol == null ? 0.3 : vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(masterGain);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, vol, filtFreq, delay) {
    if (!ctx) return;
    if (synthName && VOL[synthName] != null) vol = (vol == null ? 0.25 : vol) * VOL[synthName];
    var t0 = ctx.currentTime + (delay || 0);
    var len = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ctx.createBufferSource(); src.buffer = buf;
    var flt = ctx.createBiquadFilter();
    flt.type = 'lowpass'; flt.frequency.value = filtFreq || 2000;
    var g = ctx.createGain(); g.gain.value = vol == null ? 0.25 : vol;
    src.connect(flt); flt.connect(g); g.connect(masterGain);
    src.start(t0);
  }

  var synth = {
    pop: function (r) {
      var f = 620 * (r || 1);
      tone(f, 0.10, 'sine', 0.30, f * 2.1);
      noise(0.06, 0.10, 3200);
    },
    combo: function (r) {
      var f = 700 * (r || 1);
      tone(f, 0.09, 'triangle', 0.26, f * 1.6);
      tone(f * 1.5, 0.10, 'sine', 0.18, f * 2.6, 0.04);
    },
    rocket: function () {
      tone(300, 0.30, 'sawtooth', 0.20, 1900);
      noise(0.28, 0.16, 5000);
    },
    bomb: function () {
      tone(150, 0.38, 'sine', 0.34, 42);
      noise(0.34, 0.32, 1000);
    },
    rainbow: function () {
      [0, 1, 2, 3, 4, 5].forEach(function (i) {
        tone(520 * Math.pow(1.16, i), 0.16, 'sine', 0.20, null, i * 0.045);
      });
      noise(0.4, 0.10, 6000);
    },
    swap: function () { tone(430, 0.06, 'sine', 0.14, 560); },
    invalid: function () { tone(190, 0.14, 'square', 0.13, 130); },
    goal: function () { tone(880, 0.10, 'sine', 0.22, 1180); },
    star: function () {
      tone(900, 0.13, 'sine', 0.24, 1400);
      tone(1350, 0.16, 'sine', 0.16, 1800, 0.07);
    },
    win: function () {
      [523, 659, 784, 1047].forEach(function (f, i) {
        tone(f, 0.26, 'triangle', 0.26, null, i * 0.11);
      });
    },
    lose: function () {
      [420, 350, 280, 200].forEach(function (f, i) {
        tone(f, 0.24, 'sine', 0.22, null, i * 0.13);
      });
    },
    click: function () { tone(680, 0.04, 'square', 0.10); }
  };

  /* ---------- 공개 API ---------- */
  function play(name, opts) {
    if (state.mutedSfx) return;
    ensureCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    // 같은 소리가 너무 촘촘히 겹치면 건너뛴다
    var now = ctx.currentTime * 1000;
    if (lastAt[name] != null && now - lastAt[name] < MIN_GAP_MS) return;
    lastAt[name] = now;

    opts = opts || {};
    var rate = opts.rate || 1;
    if (playBuffer(name, rate, opts.vol)) return;
    var fn = synth[name];
    if (fn) { synthName = name; fn(rate); synthName = null; }
  }

  function bgm(name) {
    state.curBgm = name;
    var want = bgmEls[name];
    Object.keys(bgmEls).forEach(function (k) {
      var el = bgmEls[k];
      if (el === want) return;              // 같은 곡이면 끊지 않는다
      el.pause();
    });
    if (!want) return;
    var target = state.bgmVol * (BGM_VOL[name] == null ? 1 : BGM_VOL[name]);
    if (state.mutedBgm) return;
    // 갑자기 툭 튀어나오지 않게 0.6초 동안 서서히 키운다
    var from = want.paused ? 0 : want.volume;
    want.volume = from;
    want.play().catch(function () {});
    var t0 = null;
    function ramp(now) {
      if (t0 === null) t0 = now;
      var k = Math.min(1, (now - t0) / 600);
      want.volume = from + (target - from) * k;
      if (k < 1 && state.curBgm === name) global.requestAnimationFrame(ramp);
    }
    global.requestAnimationFrame(ramp);
  }

  function stopBgm() {
    state.curBgm = null;
    Object.keys(bgmEls).forEach(function (k) { bgmEls[k].pause(); });
  }

  /* ---------- 효과음 / 배경음악을 따로 끄고 켠다 ---------- */
  function setSfxMuted(m) {
    state.mutedSfx = !!m;
    if (masterGain) masterGain.gain.value = state.mutedSfx ? 0 : state.sfxVol;
    save('sfx', state.mutedSfx);
    return state.mutedSfx;
  }

  function setBgmMuted(m) {
    state.mutedBgm = !!m;
    Object.keys(bgmEls).forEach(function (k) {
      var el = bgmEls[k];
      if (state.mutedBgm) el.pause();
    });
    if (!state.mutedBgm && state.curBgm) bgm(state.curBgm);
    save('bgm', state.mutedBgm);
    return state.mutedBgm;
  }

  function save(which, v) {
    try { localStorage.setItem('oreumnyang.muted.' + which, v ? '1' : '0'); } catch (e) {}
  }

  function toggleSfx() { return setSfxMuted(!state.mutedSfx); }
  function toggleBgm() { return setBgmMuted(!state.mutedBgm); }
  function isSfxMuted() { return state.mutedSfx; }
  function isBgmMuted() { return state.mutedBgm; }

  try {
    // 버튼을 둘로 나누기 전에 쓰던 설정이 남아 있으면 지웁니다.
    // 이걸 계속 참고하면, 소리를 켜도 새로고침할 때마다 다시 꺼집니다.
    // (그 시절 끄기 버튼은 고장나 있었으니 값 자체도 믿을 게 못 됩니다)
    localStorage.removeItem('oreumnyang.muted');
    state.mutedSfx = localStorage.getItem('oreumnyang.muted.sfx') === '1';
    state.mutedBgm = localStorage.getItem('oreumnyang.muted.bgm') === '1';
  } catch (e) {}

  /* 지금 소리가 어떤 상태인지 (확인·문제 찾기용) */
  function status() {
    var el = state.curBgm ? bgmEls[state.curBgm] : null;
    return {
      mutedSfx: state.mutedSfx,
      mutedBgm: state.mutedBgm,
      bgm: state.curBgm,
      playing: !!(el && !el.paused),
      volume: el ? Math.round(el.volume * 100) / 100 : null,
      buffered: el && el.buffered.length ? Math.round(el.buffered.end(0)) : 0,
      duration: el && el.duration ? Math.round(el.duration) : 0
    };
  }

  global.Sound = {
    status: status,
    init: init,
    play: play,
    bgm: bgm,
    stopBgm: stopBgm,
    toggleSfx: toggleSfx,
    toggleBgm: toggleBgm,
    isSfxMuted: isSfxMuted,
    isBgmMuted: isBgmMuted
  };
})(window);
