// story.js — 켄·히로미의 1주년 데이트. 가는 곳마다 류지·에리와 말다툼하다 싸움이 난다
(function () {
  const NAME = { ken: '켄', hiromi: '히로미', ryuji: '류지', eri: '에리' };
  if (window.L) for (const k in NAME) NAME[k] = L(NAME[k]);   // 영문판(?lang=en)이면 이름도 영어로
  const F = { flash: true };   // 회상 줄 표시
  const DANCE = { cue: 'dance' };   // 이 줄에서 히로미·에리가 분수 앞에서 춤춘다 (zone.js 가 받는다)
  const COLOR = { ken: '#ffd24a', hiromi: '#ff8fc0', ryuji: '#7fc4ff', eri: '#c9a2ff' };

  // 장소는 차례로 열린다: 사쿠라길 → 시노바즈 연못 → 도쇼궁 → 동물원 정문 → 분수 광장
  const LINES = {
    intro: [
      ['hiromi', '켄. 오늘 무슨 날인지 알아?'],
      ['ken', '…월요일.'],
      ['hiromi', '우리 처음 만난 지 딱 1년 되는 날이거든?!'],
      ['ken', '…벌써 그렇게 됐나.'],
      // ── 회상: 주제가 가사의 첫 만남 ──
      [null, '— 작년 봄, 우에노 공원 벚꽃길.', F],
      [null, '켄은 걷다가 길바닥에 침을 뱉었다. 하필 지나가던 여고생 신발 위로.', F],
      ['hiromi', '야! 너 지금 뭐 한 거야?!', F],
      [null, '짝! 성질 더러운 여고생의 싸대기 한 방.', F],
      [null, '그런데 휘두른 기세에 미끄러져, 여고생은 그대로 기절해 버렸다.', F],
      [null, '켄은 속으로 놀랐지만, 옆에 앉아 태연한 척 기다렸다.', F],
      ['hiromi', '…으으. 양아치야, 어따 대고 손찌검이야!', F],
      ['ken', '난 손 안 댔는데.', F],
      ['hiromi', '폭행죄로 신고하기 전에… 딸기 우유 사 줘.', F],
      [null, '그날 둘은 벤치에 나란히 앉아 딸기 우유를 마셨다.', F],
      // ── 다시 지금 ──
      ['hiromi', '그러니까 오늘은 그날 코스 그대로 데이트야.'],
      ['ken', '귀찮은데.'],
      ['hiromi', '딸기 우유 사 줄게.'],
      ['ken', '…가자.'],
    ],
    pre: [
      [ // 1 사쿠라길 — 그 벤치
        ['hiromi', '저기! 우리 그 벤치… 어?'],
        ['ryuji', '뭘 봐. 여기 우리 자리다.'],
        ['eri', '어머, 히로미잖아? 아직도 이 공원 오는구나.'],
        ['hiromi', '에리… 하필 너냐.'],
        ['ken', '딱 잠깐만 앉으면 돼. 비켜.'],
        ['ryuji', '딸기 우유 들고 데이트? 애기냐?'],
        [null, '툭. 류지가 켄 손의 딸기 우유를 쳐서 떨어뜨렸다.'],
        ['hiromi', '그거… 1주년 딸기 우유거든?!'],
        ['ken', '…너 지금 선 넘었다.'],
      ],
      [ // 2 시노바즈 연못 — 오리배 새치기
        ['hiromi', '다음은 오리배! 작년에도 탔잖아.'],
        ['ken', '줄이 길다.'],
        ['eri', '실례~ 우리 먼저 탈게.'],
        ['ryuji', '어이, 또 너희냐.'],
        ['hiromi', '새치기하지 마. 줄은 뒤로 서.'],
        ['eri', '벤치에서 이겼다고 기고만장하네?'],
        ['ryuji', '줄 순서는 주먹으로 정하자고.'],
        ['ken', '…오리배 한 번 타기 힘드네.'],
      ],
      [ // 3 도쇼궁 — 소원판
        ['hiromi', '소원판 쓰자. "켄이랑 내년에도 여기 오기."'],
        ['ken', '…크게 읽지 마.'],
        ['eri', '"켄이랑 내년에도"~? 아하하, 오글거려!'],
        ['ryuji', '에리, 그거 이리 줘 봐.'],
        ['hiromi', '돌려줘! 남의 소원을 왜 읽어!'],
        ['eri', '아직도 그렇게 순진하니? 분수 앞에서 KPOP 커버댄스 추던 애가.'],
        ['hiromi', '…!'],
        ['ken', '에리라고 했지. 그 판, 내려놔.'],
        ['ryuji', '에리 건드리면 나도 가만 안 있는다.'],
        ['ken', '먼저 건드린 건 너네야.'],
      ],
      [ // 4 동물원 정문 — 가짜 사과
        ['hiromi', '판다 보고 싶었는데… 오늘 쉬는 날이래.'],
        ['ryuji', '…야. 켄.'],
        ['ken', '또.'],
        ['ryuji', '아까는… 우리가 좀 심했다. 사과하러 왔다.'],
        ['eri', '화해의 판다빵이야. 받아.'],
        ['hiromi', '어… 고, 고마워?'],
        ['ryuji', '…라고 할 줄 알았냐!'],
        [null, '퍽! 판다빵이 켄의 얼굴에 날아들었다.'],
        ['ken', '…음식 가지고 장난치지 마라.'],
      ],
      [ // 5 분수 광장 — 춤
        ['hiromi', '마지막은 분수 광장. 여기서 KPOP 커버댄스 출 거야. 중학교 때 못 끝낸 그 춤.'],
        ['eri', '…여기서는 안 돼.'],
        ['ryuji', '에리가 여기서 댄스 연습한다. 비켜.'],
        ['hiromi', '에리가… KPOP을?'],
        ['eri', '그때 네가 박수받는 게 싫었어. 그래서 류지랑 스피커를 찼던 거야.'],
        ['hiromi', '…그랬구나.'],
        ['eri', '그래도 오늘은 안 비켜. 이 자리는 이제 내 거야.'],
        ['ken', '말로는 안 끝나겠네.'],
        ['ryuji', '끝내고 싶으면 이겨 봐.'],
      ],
    ],
    post: [
      [ // 1
        ['ryuji', '…제법이네.'],
        ['eri', '벤치 가져가. 대신 이걸로 끝 아니야, 히로미!'],
        ['ken', '딸기 우유값은 받는다.'],
        ['hiromi', '…새로 사 줄게. 두 개.'],
      ],
      [ // 2
        ['eri', '오리배 따위… 다음엔 안 져!'],
        ['ken', '에리랑 무슨 사이야.'],
        ['hiromi', '…중학교 때 분수 광장에서 KPOP 댄스 연습했거든. 사람들이 박수도 쳐 줬고.'],
        ['hiromi', '그날 류지랑 에리가 스피커를 차 버렸어. 그 뒤로 거기서 못 췄지.'],
        ['ken', '…그래서 아까부터 그 눈빛이었구나.'],
      ],
      [ // 3
        ['ryuji', '…소원판은 돌려주마.'],
        ['eri', '흥. 내년에도 오기나 해.'],
        ['hiromi', '켄. 아까 화내 줘서 고마워.'],
        ['ken', '딸기 우유값이다.'],
      ],
      [ // 4
        ['ryuji', '비겁한 수까지 썼는데…'],
        ['eri', '…분수 광장으로 와. 거기서 진짜로 끝내.'],
        ['hiromi', '좋아. 어차피 거기 갈 거였어.'],
        ['ken', '판다빵은 맛있었다.'],
      ],
      [ // 5 — 엔딩
        ['ryuji', '…오늘은 졌다.'],
        ['eri', '오늘만 진 거야. 내일 또 붙어.'],
        ['ken', '…귀찮은데.'],
        ['hiromi', '에리. 그 곡 너도 다 외우고 있지? 같이 출래?'],
        ['eri', '…누, 누가 너랑! …이번 한 번만이야.'],
        [null, '스피커에서 KPOP이 흘러나온다. 분수 앞에서 히로미가 춤을 춘다. 슬쩍 에리도 똑같은 동작으로 따라 춘다. 사람들이 모여든다.', DANCE],
        ['ryuji', '너, 이름 뭐냐.'],
        ['ken', '켄.'],
        ['ryuji', '우에노 공원 켄이라… 우에노짱이라고 불러 주지.'],
        ['ken', '그 이름 촌스러.'],
        ['hiromi', '난 좋은데? 우에노짱.'],
        ['ken', '…딸기 우유 하나 더.'],
      ],
    ],
  };

  const S = { on: false, list: null, i: 0, done: null, speakers: {}, typeT: 0, full: '' };
  const $ = id => document.getElementById(id);

  function play(lines, speakers, done) {
    S.on = true; S.list = lines; S.i = -1; S.done = done; S.speakers = speakers || {};
    // 대화 카메라: 우리 편(켄·히로미)과 상대 편 사이를 옆에서 보는 방향 하나로 고정
    {
      const sp = S.speakers, ours = [sp.ken, sp.hiromi].filter(Boolean), theirs = [sp.ryuji, sp.eri].filter(Boolean);
      const avg = arr => { const v = { x: 0, z: 0 }; arr.forEach(f => { v.x += f.pos.x; v.z += f.pos.z; }); v.x /= arr.length; v.z /= arr.length; return v; };
      const A = theirs.length ? avg(ours) : avg(ours.slice(0, 1)), B = theirs.length ? avg(theirs) : avg(ours.slice(1).length ? ours.slice(1) : ours);
      const center = avg(ours.concat(theirs));
      let dx = B.x - A.x, dz = B.z - A.z; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
      // 두 편을 잇는 선에 수직인 쪽 — 지금 카메라가 있는 쪽을 고른다
      let px = -dz, pz = dx;
      if (px * Math.sin(CAM.yaw) + pz * Math.cos(CAM.yaw) < 0) { px = -px; pz = -pz; }
      CAM.talk = { center, yaw: Math.atan2(px, pz) };
    }
    T.prevMode = T.mode === 'talk' ? T.prevMode : T.mode;
    T.mode = 'talk';
    document.body.classList.add('talking');
    if (document.pointerLockElement) document.exitPointerLock();
    $('talk').classList.add('show');
    next();
  }

  function next() {
    // 글자가 다 안 나왔으면 먼저 다 보여 준다
    if (S.i >= 0 && S.shown < S.full.length) { S.shown = S.full.length; $('talkLine').textContent = S.full; return; }
    S.i++;
    if (S.i >= S.list.length) { end(); return; }
    const [who, text, opt] = S.list[S.i];
    document.body.classList.toggle('flashback', !!(opt && opt.flash));
    if (opt && opt.cue && S.onCue) S.onCue(opt.cue, S.speakers);
    const tag = $('talkWho');
    if (who) { tag.textContent = NAME[who]; tag.style.background = COLOR[who]; tag.style.display = ''; $('talk').classList.remove('narr'); }
    else { tag.style.display = 'none'; $('talk').classList.add('narr'); }
    // 한 글자씩 찍으므로 관찰자 번역이 반쪽 글을 본다 → 찍기 전에 통째로 바꾼다
    S.full = window.L ? L(text) : text; S.shown = 0; S.typeT = 0;
    $('talkLine').textContent = '';
    CAM.focus = who ? S.speakers[who] || null : null;
    const f = S.speakers[who];
    if (f && !f.dead && (f.state === 'free' || f.state === 'taunt')) {
      if (who === 'ryuji' || who === 'eri') { if (Math.random() < 0.45) { f.state = 'taunt'; f.t = 0; f.ch.play('taunt', 0.15, { force: true, once: true }); } }
    }
    AUD.sfx('page');
  }

  function end() {
    S.on = false;
    $('talk').classList.remove('show');
    document.body.classList.remove('talking'); document.body.classList.remove('flashback');
    CAM.focus = null; CAM.talk = null;
    T.mode = T.prevMode || 'play';
    const d = S.done; S.done = null;
    if (d) d();
  }

  function skip() { if (!S.on) return; S.i = S.list.length; S.shown = S.full.length; end(); }

  function update(dt) {
    if (!S.on) return;
    if (S.shown < S.full.length) {
      S.typeT += dt * 38;
      const n = Math.min(S.full.length, Math.floor(S.typeT));
      if (n !== S.shown) { S.shown = n; $('talkLine').textContent = S.full.slice(0, n); }
    }
  }

  function bind() {
    $('talk').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); next(); });
    $('talkSkip').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); skip(); });
    addEventListener('keydown', e => {
      if (!S.on || e.repeat) return;
      if (['Space', 'Enter', 'KeyJ', 'KeyE'].includes(e.code)) { e.preventDefault(); next(); }
      if (e.code === 'Escape') skip();
    });
    $('c').addEventListener('mousedown', () => { if (S.on) next(); });
  }

  Object.assign(S, { LINES, NAME, play, next, skip, update, bind });
  window.STORY = S;
})();
