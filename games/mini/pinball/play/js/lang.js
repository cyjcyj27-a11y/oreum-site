// 한·영 글자 — ?lang=en 일 때만 영어
(function () {
  const EN = /[?&]lang=en\b/.test(location.search);
  const D = {
    title: ['핀볼', 'PINBALL'],
    start: ['START', 'START'],
    cont: ['이어하기', 'CONTINUE'],
    stageN: ['{n}판', 'STAGE {n}'],
    best: ['최고', 'BEST'],
    how: ['HOW TO PLAY', 'HOW TO PLAY'],
    how1: ['화면 왼쪽·오른쪽을 누르면 플리퍼가 올라가요.<br>PC는 ← → 키', 'Tap the left or right side to flip.<br>PC: ← → keys'],
    how2: ['공이 오른쪽 통로에 있으면 길게 눌렀다 떼서 쏘아요.<br>PC는 스페이스', 'Hold and release to launch the ball.<br>PC: Space'],
    how3: ['판마다 목표를 깨면 다음 판.<br>10판 황금 표적을 12번 맞혀요', 'Clear each stage goal.<br>Hit the gold target 12 times on stage 10'],
    ok: ['OK', 'OK'],
    resume: ['계속', 'RESUME'],
    home: ['처음 화면', 'TITLE'],
    retry: ['RETRY', 'RETRY'],
    over: ['GAME OVER', 'GAME OVER'],
    save: ['저장', 'SAVE'],
    share: ['공유', 'SHARE'],
    copied: ['주소를 복사했습니다', 'Link copied'],
    launch: ['발사', 'LAUNCH'],
    ball: ['BALL', 'BALL'],
    // 판 목표
    m1: ['위 레인 3개 다 켜기', 'Light all 3 top lanes'],
    m2: ['범퍼 15번', 'Hit bumpers 15 times'],
    m3: ['드롭 타깃 4개 쓰러뜨리기', 'Knock down all 4 drop targets'],
    m4: ['램프 2번', 'Shoot the ramps 2 times'],
    m5: ['홀 2번', 'Sink the hole 2 times'],
    m6: ['빨간 타깃 3개', 'Hit all 3 red targets'],
    m7: ['왼쪽 궤도 2번 + 램프 2번', 'Left orbit 2 times + ramps 2 times'],
    m8a: ['홀 3번 → 멀티볼', 'Sink the hole 3 times for MULTIBALL'],
    m8b: ['멀티볼 잭팟 2번(홀)', 'MULTIBALL: 2 jackpots (hole)'],
    m9: ['레인 3개 + 드롭 4개', 'All lanes + all drop targets'],
    m10: ['황금 표적 12번', 'Hit the gold target 12 times'],
    stageClear: ['STAGE CLEAR', 'STAGE CLEAR'],
    boss: ['황금 표적', 'GOLD TARGET'],
    bossDown: ['황금 표적 격파', 'GOLD TARGET DOWN'],
    endName: ['핀볼 챔피언', 'PINBALL CHAMPION'],
    endLine: ['10판을 모두 깼다', 'All 10 stages cleared'],
    endingN: ['{n}번째 엔딩', 'Ending #{n}'],
    firstEnd: ['첫 엔딩', 'First ending'],
    score: ['점수', 'SCORE'],
    time: ['시간', 'TIME'],
    bumpers: ['범퍼', 'BUMPERS'],
    jackpots: ['잭팟', 'JACKPOTS'],
    stage: ['판', 'STAGE'],
    ballsLeft: ['남은 공', 'BALLS LEFT'],
    r1: ['핀볼 새내기', 'Rookie'], r2: ['동네 고수', 'Local Ace'], r3: ['핀볼 도사', 'Pinball Sage'], r4: ['오락실 전설', 'Arcade Legend'],
    shareText: ['핀볼 {s}점 {r}', 'PINBALL {s} pts {r}'],
    shareOver: ['핀볼 {s}점 {n}판까지', 'PINBALL {s} pts, stage {n}'],
    rotate: ['폰을 세로로 들어 주세요', 'Please hold your phone upright']
  };
  window.EN = EN;
  window.L = function (k, v) { let s = (D[k] || [k, k])[EN ? 1 : 0]; if (v) for (const n in v) s = s.split('{' + n + '}').join(v[n]); return s; };
  if (EN) document.documentElement.lang = 'en';
})();
