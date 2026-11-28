/* =========================================================
   오름냥 - 말 담당 (한국어 / 영어)
   ---------------------------------------------------------
   화면에 나오는 문구는 전부 여기 모여 있습니다.
   코드에서는 T('열쇠말') 로 꺼내 씁니다.

   어느 말로 보여줄지는 이 순서로 정합니다.
     주소에 ?lang=en 이 있을 때만 영어, 없으면 한국어(기억하지 않는다, 2026-09-29)
   ========================================================= */
(function (global) {
  'use strict';

  var KEY = 'oreumnyang.lang';

  function pick() {
    try {
      var q = new URLSearchParams(location.search).get('lang');
      try { localStorage.removeItem(KEY); } catch (e) {}
      return ['en', 'zh', 'ja', 'pt', 'ru'].indexOf(q) >= 0 ? q : 'ko';
    } catch (e) { return 'ko'; }
  }

  var lang = pick();

  /* ---------------- 문구 ---------------- */
  var KO = {
    'app.title':    '오름냥 - 고양이 3매치 퍼즐게임 200판',
    'app.sub':      '오름냥 · 고양이 3매치 퍼즐게임 200판',
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
    'tip.first':    '같은 고양이 세 마리 이상 맞춰서 팡!',
    'tip.progress': '{n}판 클리어 · 별 {stars}개',
    'credit':       '소리 · Kenney (kenney.nl) · Pixabay · OpenGameArt',

    'howto.title':  '놀이 방법',
    'howto.1':      '이웃한 고양이 두 마리를 손가락으로 바꿔주세요.',
    'howto.2':      '같은 고양이가 가로나 세로로 <b>3마리 이상</b> 줄 서면 팡! 하고 사라져요.',
    'howto.3':      '4마리를 맞추면 <b>로켓냥</b>(줄 하나 통째로), ㄱ자·ㅜ자로 맞추면 <b>폭탄냥</b>(주변 9칸), 5마리를 한 줄로 맞추면 <b>무지개냥</b>(같은 색 전부)이 태어나요.',
    'howto.4':      '특수 고양이끼리 바꾸면 더 크게 터집니다.',
    'howto.5':      '정해진 <b>횟수 안</b>에 위쪽 목표를 다 채우면 클리어예요.',
    'howto.obs':    '방해꾼들',
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
    'app.sub':      'Oreumnyang · cat match-3 puzzle · 200 stages',
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
    'tip.first':    'Match three or more of the same cat and pop!',
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
    'ch.9': 'Cat star',

    'short.drop': 'tangerines', 'short.score': 'points'
  };

  var ZH = {
    'app.title':    '小岳猫 - 猫咪三消解谜 200关',
    'app.sub':      '小岳猫 · 猫咪三消解谜 200关',
    'btn.play':     '开始游戏',
    'btn.howto':    '玩法说明',
    'btn.gotit':    '知道了',
    'btn.start':    '出发！',
    'btn.map':      '地图',
    'btn.retry':    '重来',
    'btn.next':     '下一关',
    'nav.stages':   '关卡',
    'hud.moves':    '剩余步数',
    'hud.score':    '分数',
    'tool.shuffle': '洗牌',
    'tool.hint':    '提示',
    'aria.back':    '返回',
    'aria.exit':    '退出',
    'aria.music':   '音乐开关',
    'aria.sfx':     '音效开关',
    'aria.lang':    '切换语言',
    'tip.first':    '三只以上同样的猫连成一排，砰！',
    'tip.progress': '已通关 {n} 关 · 星星 {stars} 颗',
    'credit':       '音效 · Kenney (kenney.nl) · Pixabay · OpenGameArt',

    'howto.title':  '玩法说明',
    'howto.1':      '用手指交换相邻的两只猫。',
    'howto.2':      '同样的猫横着或竖着排成 <b>3只以上</b>，就会砰地消失。',
    'howto.3':      '连 4 只生出 <b>火箭喵</b>（整行清掉），拼成 L 形、T 形生出 <b>炸弹喵</b>（周围 9 格），一排连 5 只生出 <b>彩虹喵</b>（同色全清）。',
    'howto.4':      '两只特殊猫互换，会炸得更猛。',
    'howto.5':      '在规定的 <b>步数内</b> 完成上方的目标就算通关。',
    'howto.obs':    '<b>捣乱的家伙</b>',
    'howto.oreum':  '<b>小岳</b> 垫在猫咪下面的土层。在那一格上消除，就能往上爬一层。',
    'howto.wall':   '<b>石墙</b> 一动不动的玄武岩墙。在旁边消除就会倒塌。',
    'howto.carrot': '<b>胡萝卜</b> 猫被埋进胡萝卜地，动不了。在旁边消除把它救出来。',
    'howto.fruit':  '<b>柑橘</b> 送到最下面一行就算收获！清掉柑橘下面的格子，它就会掉下来。',

    'stage.n':      '第{n}关',
    'stage.boss':   '第{n}关 · BOSS',
    'chapter.n':    '第{n}章',
    'card.moves':   '可移动 {n} 步',
    'goal.done':    '完成',

    'goal.score':   '拿到 {n} 分',
    'goal.collect': '收集 {cat} {n} 只',
    'goal.jelly':   '爬完全部 {n} 处小岳',
    'goal.drop':    '把 {n} 个柑橘送到底部收获',
    'goal.left':    '{name}还差 {n}',

    'note.boss':    'BOSS 关！稍微难一点哦。',
    'note.oreum':   '新障碍：小岳 - 在那一格上消除猫咪，就能爬上一层。',
    'note.wall':    '新障碍：石墙 - 在旁边消除就会倒塌。',
    'note.carrot':  '新障碍：胡萝卜地 - 猫被埋住动不了。在旁边消除把它救出来。',
    'note.fruit':   '新目标：柑橘 - 送到最底下就是收获。',
    'note.oreum2':  '小岳变成两层了，要爬两次才行。',
    'note.shape':   '棋盘形状要变了。',
    'note.colors':  '猫咪种类变多了。',

    'fx.rocket':    '火箭喵！',
    'fx.bomb':      '炸弹喵！',
    'fx.rainbow':   '彩虹喵！',
    'fx.rainbowBig':'彩虹大爆炸！',
    'fx.rainbowMix':'彩虹合体！',
    'fx.cross':     '十字爆炸！',
    'fx.big':       '大爆炸！',
    'fx.mega':      '超级炸弹！',
    'fx.combo3':    '3 连锁！',
    'fx.comboN':    '{n} 连锁！！',
    'fx.harvest':   '柑橘收获！',
    'fx.noMove':    '没地方可走了，重新洗牌！',
    'fx.shuffled':  '洗好了！',

    'end.clear':    '通关！',
    'end.all':      '200关全部通关！',
    'end.fail':     '可惜了',
    'end.score':    '{n} 分',
    'end.toStar':   '离 ★★★ 还差 {n} 分',
    'end.perfect':  '完美！',
    'end.remain':   '还没完成：{list}',

    'cat.0': '柑橘喵', 'cat.1': '山茶喵', 'cat.2': '大海喵', 'cat.3': '森林喵',
    'cat.4': '星夜喵', 'cat.5': '晚霞喵', 'cat.6': '云朵喵',

    'ch.0': '小巷', 'ch.1': '港口', 'ch.2': '小岳', 'ch.3': '柑橘园', 'ch.4': '海女之海',
    'ch.5': '原始森林', 'ch.6': '城山日出', 'ch.7': '汉拿山', 'ch.8': '星夜', 'ch.9': '喵星国',

    'short.drop': '柑橘', 'short.score': '分数'
  };

  var JA = {
    'app.title':    'オルムニャン - ネコの3マッチパズル 200ステージ',
    'app.sub':      'オルムニャン · ネコの3マッチパズル 200ステージ',
    'btn.play':     'スタート',
    'btn.howto':    '遊び方',
    'btn.gotit':    'わかった',
    'btn.start':    '出発！',
    'btn.map':      'マップ',
    'btn.retry':    'もう一回',
    'btn.next':     '次へ',
    'nav.stages':   'ステージ',
    'hud.moves':    '残り手数',
    'hud.score':    'スコア',
    'tool.shuffle': 'シャッフル',
    'tool.hint':    'ヒント',
    'aria.back':    '戻る',
    'aria.exit':    'やめる',
    'aria.music':   '音楽オン・オフ',
    'aria.sfx':     '効果音オン・オフ',
    'aria.lang':    '言語を変える',
    'tip.first':    '同じネコを3匹以上そろえてポン！',
    'tip.progress': '{n}ステージクリア · 星{stars}個',
    'credit':       'サウンド · Kenney (kenney.nl) · Pixabay · OpenGameArt',

    'howto.title':  '遊び方',
    'howto.1':      'となり合ったネコ2匹を指で入れ替えよう。',
    'howto.2':      '同じネコが横か縦に<b>3匹以上</b>並ぶとポン！と消えるよ。',
    'howto.3':      '4匹そろえると<b>ロケットにゃん</b>（1列まるごと）、L字・T字でそろえると<b>バクダンにゃん</b>（まわり9マス）、5匹を1列にそろえると<b>にじにゃん</b>（同じ色ぜんぶ）が生まれるよ。',
    'howto.4':      'スペシャルネコ同士を入れ替えると、もっと大きく爆発するよ。',
    'howto.5':      '決められた<b>手数以内</b>に上の目標をぜんぶ達成したらクリア！',
    'howto.obs':    '<b>おじゃまキャラ</b>',
    'howto.oreum':  '<b>オルム</b> ネコの下にしいてある層。そのマスの上で消すと1段ずつ登れるよ。',
    'howto.wall':   '<b>石垣</b> 動かない玄武岩の石垣。すぐとなりで消すとくずれるよ。',
    'howto.carrot': '<b>ニンジン</b> ネコがニンジン畑にうまって動けない。となりで消して助け出そう。',
    'howto.fruit':  '<b>ミカン</b> いちばん下の段まで下ろせば収穫！ミカンの下をあけると落ちてくるよ。',

    'stage.n':      'ステージ{n}',
    'stage.boss':   'ステージ{n} · BOSS',
    'chapter.n':    '第{n}章',
    'card.moves':   '動かせる回数 {n}回',
    'goal.done':    '完了',

    'goal.score':   '{n}点を取る',
    'goal.collect': '{cat}を{n}匹集める',
    'goal.jelly':   'オルム{n}か所をぜんぶ登る',
    'goal.drop':    'ミカン{n}個を下まで下ろして収穫',
    'goal.left':    '{name} あと{n}',

    'note.boss':    'BOSSステージ！ちょっと難しいよ',
    'note.oreum':   '新しいおじゃま：オルム - そのマスの上でネコを消すと1段ずつ登れるよ',
    'note.wall':    '新しいおじゃま：石垣 - すぐとなりで消すとくずれるよ',
    'note.carrot':  '新しいおじゃま：ニンジン畑 - ネコがうまって動けない。となりで消して助け出そう',
    'note.fruit':   '新しい目標：ミカン - いちばん下まで下ろせば収穫だよ',
    'note.oreum2':  'オルムが2段になったよ。2回登らないとダメ',
    'note.shape':   'ボードの形が変わるよ',
    'note.colors':  'ネコの種類が増えたよ',

    'fx.rocket':    'ロケットにゃん！',
    'fx.bomb':      'バクダンにゃん！',
    'fx.rainbow':   'にじにゃん！',
    'fx.rainbowBig':'にじ大爆発！',
    'fx.rainbowMix':'にじ合体！',
    'fx.cross':     '十字爆発！',
    'fx.big':       '大爆発！',
    'fx.mega':      '超特大バクダン！',
    'fx.combo3':    '3連鎖！',
    'fx.comboN':    '{n}連鎖！！',
    'fx.harvest':   'ミカン収穫！',
    'fx.noMove':    '動かせる所がないよ。シャッフル！',
    'fx.shuffled':  'シャッフルしたよ！',

    'end.clear':    'クリア！',
    'end.all':      '200ステージぜんぶクリア！',
    'end.fail':     'ざんねん',
    'end.score':    '{n}点',
    'end.toStar':   '★★★まであと{n}点',
    'end.perfect':  'パーフェクト！',
    'end.remain':   '残りの目標：{list}',

    'cat.0': 'ミカンにゃん', 'cat.1': 'ツバキにゃん', 'cat.2': 'ウミにゃん', 'cat.3': 'モリにゃん',
    'cat.4': 'ホシゾラにゃん', 'cat.5': 'ユウヤケにゃん', 'cat.6': 'クモにゃん',

    'ch.0': '路地裏', 'ch.1': '港', 'ch.2': 'オルム', 'ch.3': 'ミカン畑', 'ch.4': '海女の海',
    'ch.5': 'コッチャワル', 'ch.6': '城山の日の出', 'ch.7': '漢拏山', 'ch.8': '星の夜', 'ch.9': 'にゃん星の国',

    'short.drop': 'ミカン', 'short.score': 'スコア'
  };

  var PT = {
    'app.title':    'Oreumnyang - quebra-cabeça de gatos 3 em linha, 200 fases',
    'app.sub':      'Oreumnyang · gatos 3 em linha · 200 fases',
    'btn.play':     'Jogar',
    'btn.howto':    'Como jogar',
    'btn.gotit':    'Entendi',
    'btn.start':    'Vamos!',
    'btn.map':      'Mapa',
    'btn.retry':    'De novo',
    'btn.next':     'Próxima',
    'nav.stages':   'Fases',
    'hud.moves':    'Jogadas',
    'hud.score':    'Pontos',
    'tool.shuffle': 'Misturar',
    'tool.hint':    'Dica',
    'aria.back':    'Voltar',
    'aria.exit':    'Sair',
    'aria.music':   'Ligar ou desligar a música',
    'aria.sfx':     'Ligar ou desligar os efeitos sonoros',
    'aria.lang':    'Mudar idioma',
    'tip.first':    'Junte três ou mais gatos iguais e... pop!',
    'tip.progress': '{n} fases concluídas · {stars} estrelas',
    'credit':       'Som · Kenney (kenney.nl) · Pixabay · OpenGameArt',

    'howto.title':  'Como jogar',
    'howto.1':      'Troque dois gatos vizinhos de lugar com o dedo.',
    'howto.2':      'Alinhe <b>três ou mais</b> gatos iguais na horizontal ou na vertical e eles estouram!',
    'howto.3':      'Quatro em linha criam um <b>Gato-foguete</b> (limpa uma linha inteira). Em forma de L ou T, nasce um <b>Gato-bomba</b> (9 casas em volta). Cinco em linha criam um <b>Gato arco-íris</b> (todos da mesma cor).',
    'howto.4':      'Troque dois gatos especiais entre si para uma explosão bem maior.',
    'howto.5':      'Complete os objetivos lá em cima <b>dentro das jogadas</b> para passar de fase.',
    'howto.obs':    '<b>Os atrapalhadores</b>',
    'howto.oreum':  '<b>Oreum</b> Uma camada debaixo dos gatos. Estoure gatos em cima dela para subir uma camada.',
    'howto.wall':   '<b>Muro de pedra</b> Um muro de basalto que não se mexe. Estoure bem do lado para derrubar.',
    'howto.carrot': '<b>Cenoura</b> O gato ficou enterrado na horta e não se mexe. Estoure do lado para tirá-lo de lá.',
    'howto.fruit':  '<b>Tangerina</b> Leve até a última linha para colher! Limpe as casas debaixo dela e ela desce.',

    'stage.n':      'Fase {n}',
    'stage.boss':   'Fase {n} · Chefão',
    'chapter.n':    'Cap.{n}',
    'card.moves':   '{n} jogadas',
    'goal.done':    'feito',

    'goal.score':   'Faça {n} pontos',
    'goal.collect': 'Junte {n} {cat}',
    'goal.jelly':   'Suba todos os {n} oreums',
    'goal.drop':    'Leve tangerinas até o fundo: {n}',
    'goal.left':    '{name}: mais {n}',

    'note.boss':    'Fase do chefão! Um pouco mais difícil.',
    'note.oreum':   'Novidade: Oreum - estoure os gatos em cima dele para subir uma camada',
    'note.wall':    'Novidade: Muro de pedra - estoure bem do lado e ele desmorona',
    'note.carrot':  'Novidade: Horta de cenoura - o gato fica preso. Estoure do lado para tirá-lo',
    'note.fruit':   'Novo objetivo: Tangerina - leve até a última linha para colher',
    'note.oreum2':  'Agora o oreum tem duas camadas. É preciso subir duas vezes.',
    'note.shape':   'O tabuleiro muda de formato a partir daqui.',
    'note.colors':  'Agora tem mais tipos de gato.',

    'fx.rocket':    'Gato-foguete!',
    'fx.bomb':      'Gato-bomba!',
    'fx.rainbow':   'Gato arco-íris!',
    'fx.rainbowBig':'Explosão arco-íris!',
    'fx.rainbowMix':'Fusão arco-íris!',
    'fx.cross':     'Explosão em cruz!',
    'fx.big':       'Explosão gigante!',
    'fx.mega':      'Megabomba!',
    'fx.combo3':    'Combo de 3!',
    'fx.comboN':    'Combo de {n}!!',
    'fx.harvest':   'Tangerina colhida!',
    'fx.noMove':    'Sem jogadas. Misturando!',
    'fx.shuffled':  'Misturado!',

    'end.clear':    'Passou!',
    'end.all':      'Todas as 200 fases concluídas!',
    'end.fail':     'Quase!',
    'end.score':    '{n} pontos',
    'end.toStar':   'Faltam {n} pontos para ★★★',
    'end.perfect':  'Perfeito!',
    'end.remain':   'Ainda falta: {list}',

    'cat.0': 'gatos tangerina', 'cat.1': 'gatos camélia', 'cat.2': 'gatos do mar',
    'cat.3': 'gatos da floresta', 'cat.4': 'gatos estrelados', 'cat.5': 'gatos do pôr do sol',
    'cat.6': 'gatos nuvem',

    'ch.0': 'Beco', 'ch.1': 'Porto', 'ch.2': 'Oreum',
    'ch.3': 'Pomar de tangerinas', 'ch.4': 'Mar das haenyeo', 'ch.5': 'Floresta Gotjawal',
    'ch.6': 'Amanhecer em Seongsan', 'ch.7': 'Monte Hallasan', 'ch.8': 'Noite estrelada',
    'ch.9': 'Planeta dos gatos',

    'short.drop': 'tangerinas', 'short.score': 'pontos'
  };

  var RU = {
    'app.title':    'Oreumnyang - кошачья головоломка «три в ряд», 200 уровней',
    'app.sub':      'Oreumnyang · коты «три в ряд» · 200 уровней',
    'btn.play':     'Играть',
    'btn.howto':    'Как играть',
    'btn.gotit':    'Понятно',
    'btn.start':    'Вперёд!',
    'btn.map':      'Карта',
    'btn.retry':    'Заново',
    'btn.next':     'Далее',
    'nav.stages':   'Уровни',
    'hud.moves':    'Ходы',
    'hud.score':    'Очки',
    'tool.shuffle': 'Смешать',
    'tool.hint':    'Подсказка',
    'aria.back':    'Назад',
    'aria.exit':    'Выйти',
    'aria.music':   'Включить или выключить музыку',
    'aria.sfx':     'Включить или выключить звуки',
    'aria.lang':    'Сменить язык',
    'tip.first':    'Собери трёх и больше одинаковых котов — и бах!',
    'tip.progress': 'Пройдено уровней: {n} · звёзд: {stars}',
    'credit':       'Звук · Kenney (kenney.nl) · Pixabay · OpenGameArt',

    'howto.title':  'Как играть',
    'howto.1':      'Меняй местами двух соседних котов пальцем.',
    'howto.2':      'Выстрой <b>трёх и больше</b> одинаковых котов в ряд по горизонтали или вертикали — и они лопнут!',
    'howto.3':      'Четыре в ряд дают <b>Кота-ракету</b> (убирает целую линию). Фигура L или T даёт <b>Кота-бомбу</b> (9 клеток вокруг). Пять в ряд дают <b>Радужного кота</b> (все коты одного цвета).',
    'howto.4':      'Поменяй местами двух особых котов — взрыв будет намного больше.',
    'howto.5':      'Выполни цели сверху <b>за отведённые ходы</b> — и уровень пройден.',
    'howto.obs':    '<b>Помехи</b>',
    'howto.oreum':  '<b>Орым</b> Слой под котами. Взрывай котов на этой клетке, чтобы подняться на один слой.',
    'howto.wall':   '<b>Каменная стена</b> Неподвижная стена из базальта. Взорви котов прямо рядом — и она рухнет.',
    'howto.carrot': '<b>Морковка</b> Кот закопан на грядке и не может двигаться. Взорви рядом, чтобы его вытащить.',
    'howto.fruit':  '<b>Мандарин</b> Опусти его до самого нижнего ряда — урожай! Убери клетки под ним, и он спустится.',

    'stage.n':      'Уровень {n}',
    'stage.boss':   'Уровень {n} · Босс',
    'chapter.n':    'Гл.{n}',
    'card.moves':   'Ходов: {n}',
    'goal.done':    'готово',

    'goal.score':   'Набери очков: {n}',
    'goal.collect': 'Собери: {cat} × {n}',
    'goal.jelly':   'Поднимись на все орымы: {n}',
    'goal.drop':    'Спусти мандарины вниз: {n}',
    'goal.left':    '{name}: ещё {n}',

    'note.boss':    'Уровень с боссом! Чуть сложнее.',
    'note.oreum':   'Новое: Орым — взрывай котов на этой клетке, чтобы подняться на слой',
    'note.wall':    'Новое: Каменная стена — взорви прямо рядом, и она рухнет',
    'note.carrot':  'Новое: Морковная грядка — кот застрял. Взорви рядом, чтобы вытащить',
    'note.fruit':   'Новая цель: Мандарин — опусти до самого низа, чтобы собрать урожай',
    'note.oreum2':  'Теперь у орыма два слоя. Подниматься нужно дважды.',
    'note.shape':   'Дальше поле меняет форму.',
    'note.colors':  'Видов котов стало больше.',

    'fx.rocket':    'Кот-ракета!',
    'fx.bomb':      'Кот-бомба!',
    'fx.rainbow':   'Радужный кот!',
    'fx.rainbowBig':'Радужный взрыв!',
    'fx.rainbowMix':'Радужное слияние!',
    'fx.cross':     'Взрыв крестом!',
    'fx.big':       'Большой взрыв!',
    'fx.mega':      'Мегабомба!',
    'fx.combo3':    'Цепочка ×3!',
    'fx.comboN':    'Цепочка ×{n}!!',
    'fx.harvest':   'Урожай мандаринов!',
    'fx.noMove':    'Ходов нет. Перемешиваем!',
    'fx.shuffled':  'Перемешано!',

    'end.clear':    'Пройдено!',
    'end.all':      'Все 200 уровней пройдены!',
    'end.fail':     'Почти получилось',
    'end.score':    'Очки: {n}',
    'end.toStar':   'До ★★★ ещё очков: {n}',
    'end.perfect':  'Идеально!',
    'end.remain':   'Осталось: {list}',

    'cat.0': 'мандариновые коты', 'cat.1': 'камелиевые коты', 'cat.2': 'морские коты',
    'cat.3': 'лесные коты', 'cat.4': 'звёздные коты', 'cat.5': 'закатные коты',
    'cat.6': 'облачные коты',

    'ch.0': 'Переулок', 'ch.1': 'Гавань', 'ch.2': 'Орым',
    'ch.3': 'Мандариновый сад', 'ch.4': 'Море хэнё', 'ch.5': 'Лес Котджавал',
    'ch.6': 'Рассвет в Сонсане', 'ch.7': 'Гора Халласан', 'ch.8': 'Звёздная ночь',
    'ch.9': 'Кошачья звезда',

    'short.drop': 'мандарины', 'short.score': 'очки'
  };

  /* 문구 하나 꺼내기. {n} 같은 자리에 값을 끼워 넣습니다.
     {s} 는 영어에서 여럿일 때 붙는 s 입니다 (1개면 안 붙습니다). */
  function T(key, vars) {
    var dict = lang === 'en' ? EN : lang === 'zh' ? ZH : lang === 'ja' ? JA : lang === 'pt' ? PT : lang === 'ru' ? RU : KO;
    var s = dict[key];
    if (s == null && (lang === 'ja' || lang === 'pt' || lang === 'ru')) s = EN[key];
    if (s == null) s = KO[key];
    if (s == null) return key;
    if (!vars) return s;
    return s.replace(/\{(\w+)\}/g, function (m, k) {
      if (k === 's') return (lang === 'en' && Number(vars.n) !== 1) ? 's' : '';
      return vars[k] == null ? '' : vars[k];
    });
  }

  function setLang(v) {   // 단추로 바꿀 때도 주소만 바꾼다
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
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang === 'pt' ? 'pt-BR' : lang;
    var fams = ['Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR'];
    if (lang === 'ja' && !document.getElementById('ja-font')) {
      // Japanese glyphs for the game font, limited to CJK and kana ranges
      var jf = "local('Hiragino Sans'),local('Hiragino Kaku Gothic ProN'),local('Yu Gothic UI'),local('Yu Gothic'),local('Yu Gothic Medium'),local('YuGothic-Medium'),local('Yu Gothic Regular'),local('YuGothic-Regular'),local('Yu Gothic Bold'),local('YuGothic-Bold'),local('MS PGothic'),local('MS Gothic'),local('Meiryo'),local('Noto Sans JP'),local('Noto Sans CJK JP'),local('Source Han Sans JP')";
      var jr = 'U+2E80-2FFF,U+3000-30FF,U+31F0-31FF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
      var js = document.createElement('style'); js.id = 'ja-font';
      js.textContent = fams.map(function (fm) {
        return "@font-face{font-family:'" + fm + "';src:" + jf + ';unicode-range:' + jr + '}';
      }).join('') + 'html[lang=ja] *{word-break:normal!important}';
      document.head.appendChild(js);
    }
    if ((lang === 'pt' || lang === 'ru') && !document.getElementById('lat-font')) {
      // Accented Latin and Cyrillic glyphs for the game font
      var lf = "local('Segoe UI'),local('Roboto'),local('Arial'),local('Helvetica Neue'),local('Helvetica')";
      var lr = 'U+00A0-024F,U+0400-04FF,U+1E00-1EFF,U+2010-2027';
      var ls = document.createElement('style'); ls.id = 'lat-font';
      ls.textContent = fams.map(function (fm) {
        return "@font-face{font-family:'" + fm + "';src:" + lf + ';unicode-range:' + lr + '}';
      }).join('');
      document.head.appendChild(ls);
    }
    if (lang === 'zh' && !document.getElementById('zh-font')) {
      // Chinese glyphs for the game font, limited to CJK ranges
      var zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
      var ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
      var st = document.createElement('style'); st.id = 'zh-font';
      st.textContent = ['Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR'].map(function (fm) {
        return "@font-face{font-family:'" + fm + "';src:" + zf + ';unicode-range:' + ur + '}';
      }).join('') + 'html[lang=zh-CN] *{word-break:normal!important}';
      document.head.appendChild(st);
    }
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
