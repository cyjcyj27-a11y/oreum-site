/* =========================================================
   오름냥 - 말 담당 (한국어 / 영어)
   ---------------------------------------------------------
   화면에 나오는 문구는 전부 여기 모여 있습니다.
   코드에서는 T('열쇠말') 로 꺼내 씁니다.

   어느 말로 보여줄지는 이 순서로 정합니다.
     1) 주소에 ?lang=en  또는  ?lang=ko
     2) 전에 고른 값 (기억해 둡니다)
     3) 브라우저 언어가 한국어면 한국어, 아니면 영어
   ========================================================= */
(function (global) {
  'use strict';

  var KEY = 'oreumnyang.lang';

  function pick() {
    try {
      var q = new URLSearchParams(location.search).get('lang');
      if (q === 'en' || q === 'ko') { localStorage.setItem(KEY, q); return q; }
      var saved = localStorage.getItem(KEY);
      if (saved === 'en' || saved === 'ko') return saved;
    } catch (e) {}
    var nav = (navigator.language || 'en').toLowerCase();
    return nav.indexOf('ko') === 0 ? 'ko' : 'en';
  }

  var lang = pick();

  /* ---------------- 문구 ---------------- */
  var KO = {
    'app.title':    '오름냥 - 제주 고양이 퍼즐 200판',
    'app.sub':      '오름냥 · 제주 고양이 퍼즐 200판',
    'btn.play':     '시작하기',
    'btn.howto':    '놀이 방법',
    'btn.gotit':    '알겠어요',
    'btn.start':    '출발!',
    'btn.map':      '지도',
    'btn.retry':    '다시',
    'btn.next':     '다음',
    'nav.stages':   '스테이지',
    'hud.moves':    '남은 횟수',
    'hud.score':    '점수',
    'tool.shuffle': '섞기',
    'tool.hint':    '힌트',
    'aria.back':    '뒤로',
    'aria.exit':    '나가기',
    'aria.music':   '음악 켜기 끄기',
    'aria.sfx':     '효과음 켜기 끄기',
    'aria.lang':    '언어 바꾸기',
    'tip.first':    '고양이를 세 마리씩 맞춰서 팡!',
    'tip.progress': '{n}판 클리어 · 별 {stars}개',
    'credit':       '소리 · Kenney (kenney.nl) · Pixabay · OpenGameArt',

    'howto.title':  '놀이 방법',
    'howto.1':      '이웃한 고양이 두 마리를 손가락으로 바꿔주세요.',
    'howto.2':      '같은 고양이가 가로나 세로로 <b>3마리 이상</b> 줄 서면 팡! 하고 사라져요.',
    'howto.3':      '4마리를 맞추면 <b>로켓냥</b>(줄 하나 통째로), ㄱ자·ㅜ자로 맞추면 <b>폭탄냥</b>(주변 9칸), 5마리를 한 줄로 맞추면 <b>무지개냥</b>(같은 색 전부)이 태어나요.',
    'howto.4':      '특수 고양이끼리 바꾸면 더 크게 터집니다.',
    'howto.5':      '정해진 <b>횟수 안</b>에 위쪽 목표를 다 채우면 클리어예요.',
    'howto.obs':    '제주 방해꾼들',
    'howto.oreum':  '<b>오름</b> 고양이 밑에 깔린 층. 그 칸 위에서 터뜨리면 한 겹씩 올라갑니다.',
    'howto.wall':   '<b>돌담</b> 움직이지 않는 현무암 담. 바로 옆에서 터뜨리면 무너져요.',
    'howto.carrot': '<b>당근</b> 고양이가 당근밭에 파묻혀 못 움직여요. 옆에서 터뜨려 꺼내주세요.',
    'howto.fruit':  '<b>감귤</b> 맨 아랫줄까지 내려보내면 수확! 감귤 밑을 치워주면 내려옵니다.',

    'stage.n':      '{n}판',
    'stage.boss':   '{n}판 · 보스',
    'chapter.n':    '{n}장',
    'card.moves':   '움직일 수 있는 횟수 {n}번',
    'goal.done':    '완료',

    'goal.score':   '{n}점 모으기',
    'goal.collect': '{cat} {n}마리 모으기',
    'goal.jelly':   '오름 {n}곳 모두 오르기',
    'goal.drop':    '감귤 {n}개 아래로 내려 수확하기',
    'goal.left':    '{name} {n} 더',

    'note.boss':    '보스 판! 조금 더 어려워요',
    'note.oreum':   '새 장애물: 오름 - 그 칸 위에서 고양이를 터뜨리면 한 겹씩 올라가요',
    'note.wall':    '새 장애물: 돌담 - 바로 옆에서 터뜨리면 무너져요',
    'note.carrot':  '새 장애물: 당근밭 - 고양이가 파묻혀 못 움직여요. 옆에서 터뜨려 꺼내주세요',
    'note.fruit':   '새 목표: 감귤 - 맨 아래까지 내려보내면 수확이에요',
    'note.oreum2':  '오름이 두 겹이 되었어요. 두 번 올라야 해요',
    'note.shape':   '보드 모양이 달라집니다',
    'note.colors':  '고양이 종류가 늘어났어요',

    'fx.rocket':    '로켓냥!',
    'fx.bomb':      '폭탄냥!',
    'fx.rainbow':   '무지개냥!',
    'fx.rainbowBig':'무지개 대폭발!',
    'fx.rainbowMix':'무지개 합체!',
    'fx.cross':     '십자 폭발!',
    'fx.big':       '대폭발!',
    'fx.mega':      '초대형 폭탄!',
    'fx.combo3':    '연쇄 3콤보!',
    'fx.comboN':    '{n}연쇄!!',
    'fx.harvest':   '감귤 수확!',
    'fx.noMove':    '움직일 곳이 없어요. 섞습니다!',
    'fx.shuffled':  '섞었어요!',

    'end.clear':    '클리어!',
    'end.all':      '200판 전부 클리어!',
    'end.fail':     '아쉬워요',
    'end.score':    '{n}점',
    'end.toStar':   '★★★까지 {n}점 남았어요',
    'end.perfect':  '완벽해요!',
    'end.remain':   '남은 목표: {list}',

    'cat.0': '감귤냥', 'cat.1': '동백냥', 'cat.2': '바당냥', 'cat.3': '곶자왈냥',
    'cat.4': '별밤냥', 'cat.5': '노을냥', 'cat.6': '구름냥',

    'ch.0': '골목길', 'ch.1': '항구', 'ch.2': '오름', 'ch.3': '감귤밭', 'ch.4': '해녀바당',
    'ch.5': '곶자왈', 'ch.6': '성산일출', 'ch.7': '한라산', 'ch.8': '별밤', 'ch.9': '냥별나라'
  };

  var EN = {
    'app.title':    'Oreumnyang - Jeju cat puzzle, 200 stages',
    'app.sub':      'Oreumnyang · Jeju cat puzzle · 200 stages',
    'btn.play':     'Play',
    'btn.howto':    'How to play',
    'btn.gotit':    'Got it',
    'btn.start':    'Start!',
    'btn.map':      'Map',
    'btn.retry':    'Retry',
    'btn.next':     'Next',
    'nav.stages':   'Stages',
    'hud.moves':    'Moves left',
    'hud.score':    'Score',
    'tool.shuffle': 'Shuffle',
    'tool.hint':    'Hint',
    'aria.back':    'Back',
    'aria.exit':    'Quit',
    'aria.music':   'Music on or off',
    'aria.sfx':     'Sound effects on or off',
    'aria.lang':    'Change language',
    'tip.first':    'Match three cats and pop!',
    'tip.progress': '{n} stages cleared · {stars} stars',
    'credit':       'Sound · Kenney (kenney.nl) · Pixabay · OpenGameArt',

    'howto.title':  'How to play',
    'howto.1':      'Swap two neighbouring cats with your finger.',
    'howto.2':      'Line up <b>three or more</b> of the same cat and they pop.',
    'howto.3':      'Four in a row makes a <b>Rocket cat</b> — clears a line. An L or T makes a <b>Bomb cat</b> — 9 tiles. Five makes a <b>Rainbow cat</b> — every cat of one colour.',
    'howto.4':      'Swap two special cats for a much bigger blast.',
    'howto.5':      'Clear the goals up top <b>within the moves given</b>.',
    'howto.obs':    'What gets in your way',
    'howto.oreum':  '<b>Oreum</b> A Jeju hill under the cats. Pop cats on it to climb a layer.',
    'howto.wall':   '<b>Stone wall</b> Jeju basalt. Pop right beside it to break it.',
    'howto.carrot': '<b>Carrots</b> The cat is buried and cannot move. Pop beside it to dig it out.',
    'howto.fruit':  '<b>Tangerine</b> Clear the tiles below it and it drops. Reach the bottom row to harvest.',

    'stage.n':      'Stage {n}',
    'stage.boss':   'Stage {n} · Boss',
    'chapter.n':    'Ch.{n}',
    'card.moves':   '{n} moves',
    'goal.done':    'done',

    'goal.score':   'Score {n} points',
    'goal.collect': 'Collect {n} {cat}',
    'goal.jelly':   'Climb all {n} oreum tiles',
    'goal.drop':    'Bring {n} tangerine{s} to the bottom',
    'goal.left':    '{n} more {name}',

    'note.boss':    'Boss stage! A bit tougher.',
    'note.oreum':   'New: Oreum — pop the cats on top of it and you climb one layer',
    'note.wall':    'New: Stone wall — pop right beside it and it breaks down',
    'note.carrot':  'New: Carrot patch — the cat is stuck. Pop beside it to dig it out',
    'note.fruit':   'New goal: Tangerine — send it down to the bottom row to harvest',
    'note.oreum2':  'Oreum comes in two layers now. You have to climb it twice.',
    'note.shape':   'The board changes shape from here.',
    'note.colors':  'More kinds of cat from here.',

    'fx.rocket':    'Rocket cat!',
    'fx.bomb':      'Bomb cat!',
    'fx.rainbow':   'Rainbow cat!',
    'fx.rainbowBig':'Rainbow blast!',
    'fx.rainbowMix':'Rainbow combo!',
    'fx.cross':     'Cross blast!',
    'fx.big':       'Big blast!',
    'fx.mega':      'Mega bomb!',
    'fx.combo3':    '3 in a row!',
    'fx.comboN':    '{n} in a row!!',
    'fx.harvest':   'Harvested!',
    'fx.noMove':    'No moves left. Shuffling!',
    'fx.shuffled':  'Shuffled!',

    'end.clear':    'Cleared!',
    'end.all':      'All 200 stages cleared!',
    'end.fail':     'So close',
    'end.score':    '{n} points',
    'end.toStar':   '{n} points to ★★★',
    'end.perfect':  'Perfect!',
    'end.remain':   'Still needed: {list}',

    'cat.0': 'tangerine cats', 'cat.1': 'camellia cats', 'cat.2': 'ocean cats',
    'cat.3': 'forest cats',    'cat.4': 'starry cats',   'cat.5': 'sunset cats',
    'cat.6': 'cloud cats',

    'ch.0': 'Alleyway',        'ch.1': 'Harbour',    'ch.2': 'Oreum',
    'ch.3': 'Tangerine grove', 'ch.4': 'Haenyeo sea', 'ch.5': 'Gotjawal forest',
    'ch.6': 'Seongsan sunrise','ch.7': 'Mt. Hallasan','ch.8': 'Starry night',
    'ch.9': 'Cat star'
  };

  /* 문구 하나 꺼내기. {n} 같은 자리에 값을 끼워 넣습니다.
     {s} 는 영어에서 여럿일 때 붙는 s 입니다 (1개면 안 붙습니다). */
  function T(key, vars) {
    var dict = lang === 'en' ? EN : KO;
    var s = dict[key];
    if (s == null) s = KO[key];
    if (s == null) return key;
    if (!vars) return s;
    return s.replace(/\{(\w+)\}/g, function (m, k) {
      if (k === 's') return (lang === 'en' && Number(vars.n) !== 1) ? 's' : '';
      return vars[k] == null ? '' : vars[k];
    });
  }

  function setLang(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
    var u = new URL(location.href);
    u.searchParams.set('lang', v);
    location.href = u.toString();
  }

  global.T = T;
  global.LANG = lang;
  global.setLang = setLang;
  global.isEn = function () { return lang === 'en'; };

  /* 화면에 박혀 있는 글자들을 바꿔 끼웁니다 (data-t 가 붙은 것) */
  global.applyStatic = function () {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-t]').forEach(function (el) {
      var k = el.getAttribute('data-t');
      if (el.hasAttribute('data-t-html')) el.innerHTML = T(k);
      else el.textContent = T(k);
    });
    document.querySelectorAll('[data-t-aria]').forEach(function (el) {
      el.setAttribute('aria-label', T(el.getAttribute('data-t-aria')));
    });
    document.title = T('app.title');
  };
})(window);
