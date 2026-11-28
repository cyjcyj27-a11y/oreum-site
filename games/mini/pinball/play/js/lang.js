// 한·영·중·일·포·러 글자 — ?lang= 값이 있을 때만 그 언어
(function () {
  const EN = /[?&]lang=en\b/.test(location.search);
  const QL = new URLSearchParams(location.search).get('lang');
  const ZH = !EN && QL === 'zh';
  const JA = !EN && QL === 'ja', PT = !EN && QL === 'pt', RU = !EN && QL === 'ru';
  const D = {
    title: ['핀볼', 'PINBALL', '弹珠台', 'ピンボール', 'PINBALL', 'ПИНБОЛ'],
    start: ['START', 'START', 'START', 'START', 'START', 'START'],
    cont: ['이어하기', 'CONTINUE', '继续', 'つづきから', 'CONTINUAR', 'ПРОДОЛЖИТЬ'],
    stageN: ['{n}판', 'STAGE {n}', '第{n}关', '{n}面', 'FASE {n}', 'УРОВЕНЬ {n}'],
    best: ['최고', 'BEST', '最高', 'ベスト', 'RECORDE', 'РЕКОРД'],
    how: ['HOW TO PLAY', 'HOW TO PLAY', 'HOW TO PLAY', 'HOW TO PLAY', 'HOW TO PLAY', 'HOW TO PLAY'],
    how1: ['화면 왼쪽·오른쪽을 누르면 플리퍼가 올라가요.<br>PC는 ← → 키', 'Tap the left or right side to flip.<br>PC: ← → keys', '点屏幕左边或右边，挡板就会抬起来。<br>PC 用 ← → 键', '画面の左・右をタップするとフリッパーが上がるよ。<br>PCは ← → キー', 'Toque no lado esquerdo ou direito da tela para levantar o flíper.<br>PC: teclas ← →', 'Жми на левую или правую часть экрана — флиппер поднимется.<br>ПК: клавиши ← →'],
    how2: ['공이 오른쪽 통로에 있으면 길게 눌렀다 떼서 쏘아요.<br>PC는 스페이스', 'Hold and release to launch the ball.<br>PC: Space', '球在右边通道里时，长按再松开就能发射。<br>PC 用空格键', 'ボールが右の通路にあるときは、長押しして離すと発射。<br>PCはスペース', 'Quando a bola estiver no corredor da direita, segure e solte para lançar.<br>PC: Espaço', 'Когда шар в правом жёлобе, зажми и отпусти, чтобы запустить.<br>ПК: Пробел'],
    how3: ['판마다 목표를 깨면 다음 판.<br>10판 황금 표적을 12번 맞혀요', 'Clear each stage goal.<br>Hit the gold target 12 times on stage 10', '完成每关目标就过关。<br>第10关要打中金色靶12次', '面ごとの目標をクリアすると次の面へ。<br>10面は金の標的に12回当てよう', 'Cumpra a meta de cada fase para avançar.<br>Na fase 10, acerte o alvo dourado 12 vezes', 'Выполни цель уровня — и вперёд.<br>На 10-м уровне попади в золотую мишень 12 раз'],
    ok: ['OK', 'OK', 'OK', 'OK', 'OK', 'OK'],
    resume: ['계속', 'RESUME', '继续', 'つづける', 'CONTINUAR', 'ДАЛЬШЕ'],
    home: ['처음 화면', 'TITLE', '返回标题', 'タイトルへ', 'INÍCIO', 'В МЕНЮ'],
    retry: ['RETRY', 'RETRY', 'RETRY', 'RETRY', 'RETRY', 'RETRY'],
    over: ['GAME OVER', 'GAME OVER', 'GAME OVER', 'GAME OVER', 'GAME OVER', 'GAME OVER'],
    save: ['저장', 'SAVE', '保存', '保存', 'SALVAR', 'СОХРАНИТЬ'],
    share: ['공유', 'SHARE', '分享', 'シェア', 'COMPARTILHAR', 'ПОДЕЛИТЬСЯ'],
    copied: ['주소를 복사했습니다', 'Link copied', '链接已复制', 'リンクをコピーしました', 'Link copiado', 'Ссылка скопирована'],
    launch: ['발사', 'LAUNCH', '发射', '発射', 'LANÇAR', 'ПУСК'],
    ball: ['BALL', 'BALL', 'BALL', 'BALL', 'BALL', 'BALL'],
    // 판 목표
    m1: ['위 레인 3개 다 켜기', 'Light all 3 top lanes', '点亮上方全部3条通道', '上のレーン3つを全部点灯', 'Acenda as 3 raias de cima', 'Зажги все 3 верхние дорожки'],
    m2: ['범퍼 15번', 'Hit bumpers 15 times', '撞击撞柱15次', 'バンパー15回', 'Bata nos bumpers 15 vezes', 'Бамперы: 15 ударов'],
    m3: ['드롭 타깃 4개 쓰러뜨리기', 'Knock down all 4 drop targets', '击倒4个落靶', 'ドロップターゲット4つを倒す', 'Derrube os 4 alvos móveis', 'Сбей все 4 падающие мишени'],
    m4: ['램프 2번', 'Shoot the ramps 2 times', '打上坡道2次', 'ランプ2回', 'Suba as rampas 2 vezes', 'Рампы: 2 раза'],
    m5: ['홀 2번', 'Sink the hole 2 times', '打进洞2次', 'ホール2回', 'Acerte o buraco 2 vezes', 'Лунка: 2 раза'],
    m6: ['빨간 타깃 3개', 'Hit all 3 red targets', '打中3个红靶', '赤いターゲット3つ', 'Acerte os 3 alvos vermelhos', 'Попади во все 3 красные мишени'],
    m7: ['왼쪽 궤도 2번 + 램프 2번', 'Left orbit 2 times + ramps 2 times', '左侧轨道2次 + 坡道2次', '左オービット2回 + ランプ2回', 'Órbita esquerda 2 vezes + rampas 2 vezes', 'Левая орбита 2 раза + рампы 2 раза'],
    m8a: ['홀 3번 → 멀티볼', 'Sink the hole 3 times for MULTIBALL', '进洞3次 → 多球', 'ホール3回 → マルチボール', 'Buraco 3 vezes → MULTIBALL', 'Лунка 3 раза → МУЛЬТИБОЛ'],
    m8b: ['멀티볼 잭팟 2번(홀)', 'MULTIBALL: 2 jackpots (hole)', '多球大奖2次（进洞）', 'マルチボールでジャックポット2回（ホール）', 'MULTIBALL: 2 jackpots (buraco)', 'МУЛЬТИБОЛ: 2 джекпота (лунка)'],
    m9: ['레인 3개 + 드롭 4개', 'All lanes + all drop targets', '3条通道 + 4个落靶', 'レーン3つ + ドロップ4つ', '3 raias + 4 alvos móveis', '3 дорожки + 4 падающие мишени'],
    m10: ['황금 표적 12번', 'Hit the gold target 12 times', '打中金色靶12次', '金の標的12回', 'Acerte o alvo dourado 12 vezes', 'Золотая мишень: 12 попаданий'],
    stageClear: ['STAGE CLEAR', 'STAGE CLEAR', 'STAGE CLEAR', 'STAGE CLEAR', 'STAGE CLEAR', 'STAGE CLEAR'],
    boss: ['황금 표적', 'GOLD TARGET', '金色靶', '金の標的', 'ALVO DOURADO', 'ЗОЛОТАЯ МИШЕНЬ'],
    bossDown: ['황금 표적 격파', 'GOLD TARGET DOWN', '金色靶被击破', '金の標的を撃破', 'ALVO DOURADO DERRUBADO', 'ЗОЛОТАЯ МИШЕНЬ СБИТА'],
    endName: ['핀볼 챔피언', 'PINBALL CHAMPION', '弹珠台冠军', 'ピンボールチャンピオン', 'CAMPEÃO DO PINBALL', 'ЧЕМПИОН ПИНБОЛА'],
    endLine: ['10판을 모두 깼다', 'All 10 stages cleared', '10关全部通关', '10面をすべてクリアした', 'Você zerou as 10 fases', 'Все 10 уровней пройдены'],
    endingN: ['{n}번째 엔딩', 'Ending #{n}', '第{n}个结局', '{n}回目のエンディング', '{n}º final', 'Концовка №{n}'],
    firstEnd: ['첫 엔딩', 'First ending', '首个结局', 'はじめてのエンディング', 'Primeiro final', 'Первая концовка'],
    score: ['점수', 'SCORE', '分数', 'スコア', 'PONTOS', 'ОЧКИ'],
    time: ['시간', 'TIME', '用时', 'タイム', 'TEMPO', 'ВРЕМЯ'],
    bumpers: ['범퍼', 'BUMPERS', '撞柱', 'バンパー', 'BUMPERS', 'БАМПЕРЫ'],
    jackpots: ['잭팟', 'JACKPOTS', '大奖', 'ジャックポット', 'JACKPOTS', 'ДЖЕКПОТЫ'],
    stage: ['판', 'STAGE', '关卡', '面', 'FASE', 'УРОВЕНЬ'],
    ballsLeft: ['남은 공', 'BALLS LEFT', '剩余球数', '残りボール', 'BOLAS RESTANTES', 'ОСТАЛОСЬ ШАРОВ'],
    r1: ['핀볼 새내기', 'Rookie', '弹珠新手', 'ピンボール初心者', 'Novato', 'Новичок'], r2: ['동네 고수', 'Local Ace', '街坊高手', '町のうで自慢', 'Fera do bairro', 'Местный ас'], r3: ['핀볼 도사', 'Pinball Sage', '弹珠大师', 'ピンボール仙人', 'Mestre do pinball', 'Мастер пинбола'], r4: ['오락실 전설', 'Arcade Legend', '街机传说', 'ゲーセンの伝説', 'Lenda do fliperama', 'Легенда игровых автоматов'],
    shareText: ['핀볼 {s}점 {r}', 'PINBALL {s} pts {r}', '弹珠台 {s}分 {r}', 'ピンボール {s}点 {r}', 'PINBALL {s} pts {r}', 'ПИНБОЛ {s} очк. {r}'],
    shareOver: ['핀볼 {s}점 {n}판까지', 'PINBALL {s} pts, stage {n}', '弹珠台 {s}分，打到第{n}关', 'ピンボール {s}点 {n}面まで', 'PINBALL {s} pts, até a fase {n}', 'ПИНБОЛ {s} очк., до уровня {n}'],
    rotate: ['폰을 세로로 들어 주세요', 'Please hold your phone upright', '请把手机竖过来', 'スマホを縦向きにしてね', 'Segure o celular na vertical', 'Держи телефон вертикально']
  };
  window.EN = EN; window.ZH = ZH; window.JA = JA; window.PT = PT; window.RU = RU;
  window.L = function (k, v) { const a = D[k] || [k, k, k]; let s = a[EN ? 1 : ZH ? 2 : JA ? 3 : PT ? 4 : RU ? 5 : 0]; if (s === undefined) s = a[1]; if (v) for (const n in v) s = s.split('{' + n + '}').join(v[n]); return s; };
  if (EN) document.documentElement.lang = 'en';
  if (ZH) {
    document.documentElement.lang = 'zh-CN';
    // 게임 글꼴엔 한자가 없어 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const zb = "local('PingFang SC Semibold'),local('PingFangSC-Semibold'),local('Microsoft YaHei Bold'),local('Microsoft YaHei UI Bold'),local('Noto Sans SC Bold'),local('NotoSansSC-Bold'),local('Source Han Sans SC Bold')," + zf;
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Ttl';src:${zb};unicode-range:${ur}}@font-face{font-family:'Black Han Sans';src:${zb};unicode-range:${ur}}html[lang=zh-CN] *{word-break:normal!important}`;
    document.head.appendChild(st);
  }
  if (JA) {
    document.documentElement.lang = 'ja';
    // 게임 글꼴엔 가나·한자가 없어 같은 이름에 일본어 기기 글꼴을 그 범위로만 덧붙인다
    const jf = "local('Hiragino Sans'),local('Hiragino Kaku Gothic ProN'),local('Yu Gothic UI'),local('Yu Gothic'),local('Yu Gothic Medium'),local('YuGothic-Medium'),local('Yu Gothic Regular'),local('YuGothic-Regular'),local('Yu Gothic Bold'),local('YuGothic-Bold'),local('MS PGothic'),local('MS Gothic'),local('Meiryo'),local('Noto Sans JP'),local('Noto Sans CJK JP'),local('Source Han Sans JP')";
    const ur = 'U+2E80-2FFF,U+3000-30FF,U+31F0-31FF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Ttl';src:${jf};unicode-range:${ur}}@font-face{font-family:'Black Han Sans';src:${jf};unicode-range:${ur}}html[lang=ja] *{word-break:normal!important}`;
    document.head.appendChild(st);
  }
  if (PT || RU) {
    document.documentElement.lang = PT ? 'pt-BR' : 'ru';
    // 게임 글꼴에 없는 악센트 라틴·키릴 글자만 기기 글꼴로 채운다
    const lf = "local('Segoe UI'),local('Roboto'),local('Arial'),local('Helvetica Neue'),local('Helvetica')";
    const ur = 'U+00A0-024F,U+0400-04FF,U+1E00-1EFF,U+2010-2027';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Ttl';src:${lf};unicode-range:${ur}}@font-face{font-family:'Black Han Sans';src:${lf};unicode-range:${ur}}`;
    document.head.appendChild(st);
  }
})();
