// 한·영·중 글자 — ?lang=en 일 때만 영어, ?lang=zh 일 때만 중국어
(function () {
  const EN = /[?&]lang=en\b/.test(location.search);
  const ZH = !EN && new URLSearchParams(location.search).get('lang') === 'zh';
  const D = {
    title: ['핀볼', 'PINBALL', '弹珠台'],
    start: ['START', 'START', 'START'],
    cont: ['이어하기', 'CONTINUE', '继续'],
    stageN: ['{n}판', 'STAGE {n}', '第{n}关'],
    best: ['최고', 'BEST', '最高'],
    how: ['HOW TO PLAY', 'HOW TO PLAY', 'HOW TO PLAY'],
    how1: ['화면 왼쪽·오른쪽을 누르면 플리퍼가 올라가요.<br>PC는 ← → 키', 'Tap the left or right side to flip.<br>PC: ← → keys', '点屏幕左边或右边，挡板就会抬起来。<br>PC 用 ← → 键'],
    how2: ['공이 오른쪽 통로에 있으면 길게 눌렀다 떼서 쏘아요.<br>PC는 스페이스', 'Hold and release to launch the ball.<br>PC: Space', '球在右边通道里时，长按再松开就能发射。<br>PC 用空格键'],
    how3: ['판마다 목표를 깨면 다음 판.<br>10판 황금 표적을 12번 맞혀요', 'Clear each stage goal.<br>Hit the gold target 12 times on stage 10', '完成每关目标就过关。<br>第10关要打中金色靶12次'],
    ok: ['OK', 'OK', 'OK'],
    resume: ['계속', 'RESUME', '继续'],
    home: ['처음 화면', 'TITLE', '返回标题'],
    retry: ['RETRY', 'RETRY', 'RETRY'],
    over: ['GAME OVER', 'GAME OVER', 'GAME OVER'],
    save: ['저장', 'SAVE', '保存'],
    share: ['공유', 'SHARE', '分享'],
    copied: ['주소를 복사했습니다', 'Link copied', '链接已复制'],
    launch: ['발사', 'LAUNCH', '发射'],
    ball: ['BALL', 'BALL', 'BALL'],
    // 판 목표
    m1: ['위 레인 3개 다 켜기', 'Light all 3 top lanes', '点亮上方全部3条通道'],
    m2: ['범퍼 15번', 'Hit bumpers 15 times', '撞击撞柱15次'],
    m3: ['드롭 타깃 4개 쓰러뜨리기', 'Knock down all 4 drop targets', '击倒4个落靶'],
    m4: ['램프 2번', 'Shoot the ramps 2 times', '打上坡道2次'],
    m5: ['홀 2번', 'Sink the hole 2 times', '打进洞2次'],
    m6: ['빨간 타깃 3개', 'Hit all 3 red targets', '打中3个红靶'],
    m7: ['왼쪽 궤도 2번 + 램프 2번', 'Left orbit 2 times + ramps 2 times', '左侧轨道2次 + 坡道2次'],
    m8a: ['홀 3번 → 멀티볼', 'Sink the hole 3 times for MULTIBALL', '进洞3次 → 多球'],
    m8b: ['멀티볼 잭팟 2번(홀)', 'MULTIBALL: 2 jackpots (hole)', '多球大奖2次（进洞）'],
    m9: ['레인 3개 + 드롭 4개', 'All lanes + all drop targets', '3条通道 + 4个落靶'],
    m10: ['황금 표적 12번', 'Hit the gold target 12 times', '打中金色靶12次'],
    stageClear: ['STAGE CLEAR', 'STAGE CLEAR', 'STAGE CLEAR'],
    boss: ['황금 표적', 'GOLD TARGET', '金色靶'],
    bossDown: ['황금 표적 격파', 'GOLD TARGET DOWN', '金色靶被击破'],
    endName: ['핀볼 챔피언', 'PINBALL CHAMPION', '弹珠台冠军'],
    endLine: ['10판을 모두 깼다', 'All 10 stages cleared', '10关全部通关'],
    endingN: ['{n}번째 엔딩', 'Ending #{n}', '第{n}个结局'],
    firstEnd: ['첫 엔딩', 'First ending', '首个结局'],
    score: ['점수', 'SCORE', '分数'],
    time: ['시간', 'TIME', '用时'],
    bumpers: ['범퍼', 'BUMPERS', '撞柱'],
    jackpots: ['잭팟', 'JACKPOTS', '大奖'],
    stage: ['판', 'STAGE', '关卡'],
    ballsLeft: ['남은 공', 'BALLS LEFT', '剩余球数'],
    r1: ['핀볼 새내기', 'Rookie', '弹珠新手'], r2: ['동네 고수', 'Local Ace', '街坊高手'], r3: ['핀볼 도사', 'Pinball Sage', '弹珠大师'], r4: ['오락실 전설', 'Arcade Legend', '街机传说'],
    shareText: ['핀볼 {s}점 {r}', 'PINBALL {s} pts {r}', '弹珠台 {s}分 {r}'],
    shareOver: ['핀볼 {s}점 {n}판까지', 'PINBALL {s} pts, stage {n}', '弹珠台 {s}分，打到第{n}关'],
    rotate: ['폰을 세로로 들어 주세요', 'Please hold your phone upright', '请把手机竖过来']
  };
  window.EN = EN; window.ZH = ZH;
  window.L = function (k, v) { let s = (D[k] || [k, k, k])[EN ? 1 : ZH ? 2 : 0]; if (v) for (const n in v) s = s.split('{' + n + '}').join(v[n]); return s; };
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
})();
