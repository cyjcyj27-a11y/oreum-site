/* =========================================================
   오름냥 - 화면 흐름 / 지도 / 저장
   ========================================================= */
(function (global) {
  'use strict';

  var SAVE_KEY = 'oreumnyang.progress';
  var $ = function (id) { return document.getElementById(id); };

  var progress = { stars: {}, unlocked: 1 };
  var game = null;
  var curStage = 1;
  var lastTime = 0;

  /* ---------------- 저장 ---------------- */
  function load() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        var o = JSON.parse(raw);
        progress.stars = o.stars || {};
        progress.unlocked = Math.max(1, Math.min(Stages.TOTAL, o.unlocked || 1));
      }
    } catch (e) {}
  }
  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(progress)); } catch (e) {}
  }
  function totalStars() {
    var t = 0;
    for (var k in progress.stars) t += progress.stars[k];
    return t;
  }

  /* ---------------- 화면 전환 ---------------- */
  function show(id) {
    ['screen-title', 'screen-map', 'screen-game'].forEach(function (s) {
      $(s).classList.toggle('active', s === id);
    });
    if (game) game.resize();
  }
  function overlay(id, on) { $(id).classList.toggle('show', !!on); }

  /* ---------------- 지도 ---------------- */
  function buildMap() {
    var wrap = $('map-scroll');
    wrap.innerHTML = '';
    Stages.CHAPTERS.forEach(function (ch, ci) {
      var sec = document.createElement('div');
      sec.className = 'chapter';
      var head = document.createElement('div');
      head.className = 'chapter-head';
      head.innerHTML = '<span class="cnum">' + T('chapter.n', { n: ci + 1 }) + '</span> ' +
        T('ch.' + ci) + ' <small style="font-weight:700;opacity:.6">' + ch.from + '~' + ch.to + '</small>';
      sec.appendChild(head);
      var grid = document.createElement('div');
      grid.className = 'nodes';
      for (var n = ch.from; n <= ch.to; n++) {
        grid.appendChild(makeNode(n));
      }
      sec.appendChild(grid);
      wrap.appendChild(sec);
    });
    $('star-count').textContent = totalStars();
    $('star-total') && 0;
    // 현재 판이 보이도록 스크롤
    var cur = wrap.querySelector('.node.current');
    if (cur) setTimeout(function () {
      wrap.scrollTop = Math.max(0, cur.offsetTop - wrap.clientHeight * 0.4);
    }, 30);
  }

  function makeNode(n) {
    var b = document.createElement('button');
    var st = progress.stars[n] || 0;
    var locked = n > progress.unlocked;
    b.className = 'node' + (locked ? ' locked' : st ? ' cleared' : '') +
      (n === progress.unlocked && !st ? ' current' : '') +
      ((n % 25 === 0) ? ' boss' : '');
    b.innerHTML = locked ? '🔒' : n + (st ? '<span class="ns">' + '★'.repeat(st) + '</span>' : '');
    if (!locked) {
      b.addEventListener('click', function () { Sound.play('click'); openStage(n); });
    }
    return b;
  }

  /* ---------------- 판 시작 안내 ---------------- */
  function openStage(n) {
    curStage = n;
    var cfg = Stages.get(n);
    $('ovs-stage').textContent = T(cfg.boss ? 'stage.boss' : 'stage.n', { n: n });
    $('ovs-title').textContent = cfg.chapterName;
    var list = $('ovs-goals');
    list.innerHTML = '';
    cfg.goals.forEach(function (g) {
      var row = document.createElement('div');
      row.className = 'goal-row';
      row.appendChild(goalIcon(g, 30));
      var span = document.createElement('span');
      span.textContent = Stages.goalText(g);
      row.appendChild(span);
      list.appendChild(row);
    });
    var mv = document.createElement('div');
    mv.className = 'goal-row';
    mv.innerHTML = '<span class="gi">👣</span><span>' + T('card.moves', { n: cfg.moves }) + '</span>';
    list.appendChild(mv);

    $('ovs-note').textContent = Stages.stageNote(cfg);
    overlay('ov-start', true);
  }

  /* 실패 화면에서 '무엇이 몇 개 모자란지'만 짧게 보여줍니다 */
  function goalShort(g) {
    if (g.type === 'collect') return Cats.nameOf(g.color);
    if (g.type === 'jelly')   return T('ch.2');            // 오름
    if (g.type === 'drop')    return isEn() ? 'tangerines' : '감귤';
    return isEn() ? 'points' : '점';
  }

  function goalIcon(g, px) {
    if (g.type === 'collect') return Cats.icon(g.color, px);
    if (g.type === 'jelly')   return Cats.iconObstacle('oreum', px);
    if (g.type === 'drop')    return Cats.iconObstacle('tangerine', px);
    var s = document.createElement('span');
    s.className = 'gi';
    s.textContent = '⭐';
    return s;
  }

  /* ---------------- 게임 시작 ---------------- */
  function startStage(n) {
    var cfg = Stages.get(n);
    curStage = n;
    $('hud-stage').textContent = T('stage.n', { n: n }) + (cfg.boss ? ' 👑' : '');
    $('hud-chapter').textContent = cfg.chapterName;
    show('screen-game');
    if (!game) {
      game = new Game($('board'));
      game.on.onHud = updateHud;
      game.on.onEnd = onEnd;
      game.on.onToast = toast;
    }
    game.start(cfg);
    setTimeout(function () { game.resize(); }, 0);
    updateHud(game);
    Sound.bgm('bgm_play');
  }

  /* ---------------- HUD ---------------- */
  function updateHud(gm) {
    $('hud-moves').textContent = gm.movesLeft;
    $('hud-moves').parentElement.classList.toggle('low', gm.movesLeft <= 5);
    $('hud-score').textContent = gm.score.toLocaleString();

    var s = gm.cfg.star;
    var pct = Math.min(100, gm.score / s.s3 * 100);
    $('score-bar-fill').style.width = pct + '%';
    document.querySelector('.score-bar .m1').style.left = (s.s1 / s.s3 * 100) + '%';
    document.querySelector('.score-bar .m2').style.left = (s.s2 / s.s3 * 100) + '%';

    var box = $('hud-goals');
    var prog = gm.goalProgress();
    if (box.childElementCount !== prog.length) {
      box.innerHTML = '';
      prog.forEach(function (p) {
        var d = document.createElement('div');
        d.className = 'goal';
        d.appendChild(goalIcon(p.goal, 26));
        var n = document.createElement('div');
        n.className = 'gn';
        d.appendChild(n);
        box.appendChild(d);
      });
    }
    prog.forEach(function (p, i) {
      var d = box.children[i];
      d.classList.toggle('done', p.done);
      d.querySelector('.gn').textContent = p.done ? T('goal.done') : (p.goal.count - p.cur);
    });

    $('shuffle-badge').textContent = gm.shufflesLeft;
    $('btn-shuffle').disabled = gm.shufflesLeft <= 0;
  }

  var toastT = null;
  function toast(text) {
    var el = $('toast');
    el.textContent = text;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(function () { el.classList.remove('show'); }, 1000);
  }

  /* ---------------- 결과 ---------------- */
  function onEnd(win, gm) {
    setTimeout(function () {
      var stars = win ? gm.stars() : 0;
      if (win) {
        var prev = progress.stars[curStage] || 0;
        if (stars > prev) progress.stars[curStage] = stars;
        if (curStage + 1 > progress.unlocked && curStage < Stages.TOTAL) {
          progress.unlocked = curStage + 1;
        }
        save();
      }
      var box = $('ovr-stars').children;
      for (var i = 0; i < 3; i++) box[i].classList.toggle('on', i < stars);
      $('ovr-title').textContent = win
        ? T(curStage === Stages.TOTAL ? 'end.all' : 'end.clear')
        : T('end.fail');
      $('ovr-score').textContent = T('end.score', { n: gm.score.toLocaleString() });

      var note = '';
      if (win) {
        var s = gm.cfg.star;
        if (stars < 3) note = T('end.toStar', { n: Math.max(0, (stars < 2 ? s.s2 : s.s3) - gm.score).toLocaleString() });
        else note = T('end.perfect');
      } else {
        var left = gm.goalProgress().filter(function (p) { return !p.done; });
        note = T('end.remain', { list: left.map(function (p) {
          return T('goal.left', { name: goalShort(p.goal), n: p.goal.count - p.cur });
        }).join(', ') });
      }
      $('ovr-note').textContent = note;
      $('ovr-next').style.display = win && curStage < Stages.TOTAL ? '' : 'none';
      overlay('ov-result', true);
    }, 620);
  }

  /* ---------------- 타이틀 그림 ---------------- */
  function drawTitleArt() {
    var cv = $('title-cats');
    if (!cv) return;
    var g = cv.getContext('2d');
    g.clearRect(0, 0, cv.width, cv.height);
    var xs = [70, 170, 270, 370], ys = [120, 88, 100, 78];
    for (var i = 0; i < 4; i++) {
      var idx = [0, 1, 2, 4][i];
      g.save();
      g.translate(xs[i], ys[i]);
      g.rotate((i - 1.5) * 0.09);
      Cats.draw(g, 0, 0, 118, idx, null, 0);
      g.restore();
    }
  }

  /* ---------------- 반복 루프 ---------------- */
  function loop(now) {
    var dt = lastTime ? (now - lastTime) / 1000 : 0;
    lastTime = now;
    if (game && $('screen-game').classList.contains('active')) {
      game.update(dt);
      game.render(now);
    }
    requestAnimationFrame(loop);
  }

  /* ---------------- 시작 ---------------- */
  function init() {
    if (window.applyStatic) applyStatic();
    load();
    Sound.init();
    // 그림을 다 읽은 뒤에만 그린다.
    // 먼저 한 번 그리면 잠깐 빈 칸이 보이는 게 아니라 없어진 예 그림이 보였다.
    Cats.tryLoadImages(function () { drawTitleArt(); });

    var done = Object.keys(progress.stars).length;
    $('title-progress').textContent = done
      ? T('tip.progress', { n: done, stars: totalStars() })
      : T('tip.first');

    var lb = $('btn-lang');
    if (lb) {
      lb.textContent = isEn() ? '한국어' : 'English';
      lb.addEventListener('click', function () { setLang(isEn() ? 'ko' : 'en'); });
    }

    $('btn-play').addEventListener('click', function () {
      Sound.play('click'); buildMap(); show('screen-map'); Sound.bgm('bgm_map');
    });
    $('btn-howto').addEventListener('click', function () { Sound.play('click'); overlay('ov-howto', true); });
    $('howto-close').addEventListener('click', function () { Sound.play('click'); overlay('ov-howto', false); });

    $('btn-map-back').addEventListener('click', function () { Sound.play('click'); show('screen-title'); Sound.bgm('bgm_map'); });
    $('btn-game-back').addEventListener('click', function () {
      Sound.play('click'); buildMap(); show('screen-map'); Sound.bgm('bgm_map');
    });

    $('ovs-go').addEventListener('click', function () {
      Sound.play('click'); overlay('ov-start', false); startStage(curStage);
    });

    $('ovr-map').addEventListener('click', function () {
      Sound.play('click'); overlay('ov-result', false); buildMap(); show('screen-map'); Sound.bgm('bgm_map');
    });
    $('ovr-retry').addEventListener('click', function () {
      Sound.play('click'); overlay('ov-result', false); startStage(curStage);
    });
    $('ovr-next').addEventListener('click', function () {
      Sound.play('click'); overlay('ov-result', false);
      curStage = Math.min(Stages.TOTAL, curStage + 1);
      openStage(curStage);
    });

    $('btn-shuffle').addEventListener('click', function () { if (game) game.useShuffle(); });
    $('btn-hint').addEventListener('click', function () { if (game) game.useHint(); });

    /* 음악 버튼과 효과음 버튼은 따로 논다. 화면마다 한 벌씩 있어서 모두 묶어준다. */
    function paintSoundButtons() {
      document.querySelectorAll('[data-snd]').forEach(function (b) {
        var off = b.dataset.snd === 'bgm' ? Sound.isBgmMuted() : Sound.isSfxMuted();
        b.classList.toggle('off', off);
        b.setAttribute('aria-pressed', off ? 'false' : 'true');
      });
    }
    document.querySelectorAll('[data-snd]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.snd === 'bgm') Sound.toggleBgm();
        else { Sound.toggleSfx(); Sound.play('click'); }
        paintSoundButtons();
      });
    });
    paintSoundButtons();

    global.addEventListener('resize', function () { if (game) game.resize(); });
    global.addEventListener('orientationchange', function () {
      setTimeout(function () { if (game) game.resize(); }, 200);
    });

    // 주소창에 ?stage=37 처럼 붙이면 그 판으로 바로 들어갑니다 (확인용)
    var q = new URLSearchParams(location.search).get('stage');
    if (q) {
      var qn = Math.max(1, Math.min(Stages.TOTAL, parseInt(q, 10) || 1));
      progress.unlocked = Math.max(progress.unlocked, qn);
      startStage(qn);
    }

    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else init();

  /* 개발용: 콘솔에서 oreumnyang.jump(150) 으로 판 이동 */
  global.oreumnyang = {
    jump: function (n) {
      progress.unlocked = Math.max(progress.unlocked, Math.min(Stages.TOTAL, n));
      save(); buildMap(); openStage(n);
    },
    reset: function () { progress = { stars: {}, unlocked: 1 }; save(); location.reload(); },
    peek: function (n) { return Stages.get(n); },
    board: function () { return game; }
  };
})(window);
