// quests.js — 할머니네 + 부탁 집 4채, 주민 5명마다 부탁 3개 (사장님 2026-09-17)
//   말풍선에 원하는 물건 그림과 개수만 띄운다(설명 글 없음). 15개를 다 들어줘야 쿠팔라의 밤이 열린다.
(function () {
  const L = U.L;
  const V3 = THREE.Vector3;

  // 가져오는 물건
  const GOODS = {
    water: { icon: '🪣', ko: '물', en: 'Water', max: 1 },
    wood: { icon: '🪵', ko: '장작', en: 'Firewood', max: 4 },
    honey: { icon: '🍯', ko: '꿀', en: 'Honey', max: 2 },
    berry: { icon: '🫐', ko: '블루베리', en: 'Blueberries', max: 12 },
    rye: { icon: '🌾', ko: '호밀', en: 'Rye', max: 6 },   // 들소 먹이 (ride.js)
    boar: { icon: '🐗', ko: '멧돼지', en: 'Boar', max: 1 },   // 잡아서 어깨에 멘 멧돼지 (hunt.js)
  };

  // 주민 5명 (사장님 2026-09-17 "npc 다 지우고 새로 5명, 외관에 어울리게 미션")
  //   할머니는 주인공 집(할머니네)에, 나머지 넷은 부탁 집 4채에 (장터에서 가까운 집부터 쉬운 사람).
//   모델은 assets/models/npc/<id>.glb — 없으면 말풍선만 뜬다.
  const PEOPLE = [
    { id: 'farmer', h: 1.78, ko: '표도르 아저씨', en: 'Uncle Fyodor' },      // 농부: 체크 셔츠·멜빵 작업복·납작 모자·수염
    { id: 'girl', h: 1.68, ko: '알레샤', en: 'Alesya' },                   // 빨간 머릿수건·수놓은 흰 블라우스·빨간 치마 · 1.58→1.68: 주인공(1.74) 곁에서 아이로 보이지 않게 (사장님 2026-09-27)
    { id: 'grandma', h: 1.56, ko: '할머니', en: 'Grandma', home: 1 },      // 주인공 할머니: 꽃무늬 머릿수건·자주 카디건
    { id: 'sportboy', h: 1.42, ko: '얀카', en: 'Yanka' },                  // 운동복·패딩 조끼·흰 운동화
    { id: 'winterboy', h: 1.42, ko: '미하스', en: 'Mikhas' },                 // 털모자(우샨카)·검은 점퍼·장화
  ];
  // 부탁(미션)은 전부 뺐다 (사장님 2026-09-20 "처음에 니가 설정했던 부탁미션을 다 빼버려")
  //   이제 할 일은 돈 벌기(버섯·물고기·장작·꿀 팔기) · 도감(버섯 12·들소 12·물고기 6) · 알레샤 러브스토리 · 얼음할아버지 엔딩.
  //   빈 목록이라 말풍선·전하기·도감 🏠 칸도 함께 사라진다. 자리는 남겨 둔다(저장 q9·되살릴 때를 위해)
  const QUESTS = [];
  // 대사 — 부탁이 없어져 ask/thx 는 비웠다. 곁에 서면 귀띔(TIPS)이나 제 이야기를 한다
  const TALK = [
    { ask: [], thx: [],
      done: ['밭일은 끝났다. 이제 쿠팔라의 밤 모닥불만 기다리면 돼.', 'The field work is done. Now we just wait for the Kupala bonfire.'],
      // 물건을 사 주는 사람이라 팔 것을 들고 오면 먼저 이렇게 (사장님 2026-09-20)
      buy: ['오늘은 뭘 가져왔니? 어디 보자.', 'What did you bring today? Let\'s have a look.'] },
    { ask: [], thx: [],
      done: ['화관 예쁘지? 쿠팔라의 밤에 쓰고 갈 거야.', 'Isn\'t my wreath pretty? I\'ll wear it on Kupala Night.'] },
    { ask: [], thx: [],
      hi: ['왔구나, 우리 강아지. 숲에서 버섯을 따 오면 맛있는 걸 해 주마.', 'There you are, sweetie. Bring me mushrooms from the forest and I\'ll cook you something good.'],
      got: ['오, 버섯 따 왔구나! 이리 다오, 금방 해 주마.', 'Oh, you picked mushrooms! Hand them over, I\'ll cook them right up.'],
      done: ['버섯을 따 오면 언제든 요리해 주마. 장터에 가져가면 버섯값 두 배는 받을 게다. 빨간 점박이 광대버섯은 안 된다!', 'Bring me mushrooms any time and I\'ll cook them. At the market a dish fetches twice the price. But never the red spotted fly agaric!'] },
    { ask: [], thx: [],
      done: ['우리 가게야. 필요한 거 있으면 골라 봐!', 'This is my shop. Take a look if you need anything!'] },
    { ask: [], thx: [],
      done: ['이 털모자? 할아버지가 주신 거야. 여름에도 벗기 싫어!', 'This fur hat? Grandpa gave it to me. I wear it even in summer!'] },
  ];
  const READY = ['오, 가져왔구나!', 'Oh, you brought it!'];
  const COOKING = ['금방 된다, 조금만 기다려라.', 'It\'ll be ready in a moment, just wait a little.'];

  // 장사꾼 둘이 할 일을 말풍선으로 알려 준다 (사장님 2026-09-20 "얀카와 표도르가 이 게임에서 할 일을 말풍선으로 많이 알려주는 거야")
  //   표도르(물건을 사 주는 사람) = 어떤 걸로 돈을 버는지와 위험을, 얀카(물건을 파는 아이) = 물건의 효과를.
  //   곁에 서 있으면 TIP_SECS 마다 다음 귀띔으로 넘어간다. if 가 참인 것만 돈다
  const TIP_SECS = 6;
  const shop = id => !!T.shop[id];
  const TIPS = {
    farmer: [
      { t: ['숲에서 버섯을 따 오면 내가 값을 쳐 주마. 그게 여기선 제일 큰 돈벌이야.', 'Bring me mushrooms from the forest and I\'ll pay for them. That\'s the best money around here.'] },
      { t: ['그물버섯이랑 숲의 왕은 값이 아주 좋다. 무당버섯은 싸고.', 'Porcini and the King Porcini fetch a fine price. Russula, not so much.'] },
      { t: ['호수에서 잡은 물고기도 사 준다. 강꼬치고기가 제일 비싸지.', 'I buy lake fish too. Pike brings the most.'] },
      { t: ['버섯을 할머니께 가져가 요리를 해 오면 값을 두 배로 쳐 준다.', 'Take mushrooms to your grandma — a cooked dish is worth double here.'] },
      { t: ['장작이랑 꿀, 블루베리도 사 준다. 갓 팬 장작이면 더 좋고.', 'I\'ll buy firewood, honey and blueberries too. Fresh-split logs are best.'] },
      { t: ['멧돼지를 잡아 메고 오면 한 마리에 300이다. 이 마을에서 제일 비싼 물건이지.', 'Bring me a boar over your shoulder and it\'s 300 a head. Priciest thing in this village.'], if: () => shop('rifle') },
      { t: ['멧돼지를 조심해라. 들이받히면 죽는다.', 'Watch out for the boars. If one charges you down, you\'re done for.'] },
      { t: ['풀숲엔 살무사가 있다. 장화 없이 늪에 들어가지 마라.', 'There are vipers in the grass. Don\'t go into the marsh without boots.'], if: () => !shop('boots') },
      { t: ['돈을 아주 많이 모으면 호수 가운데 섬에 헤엄쳐 갈 수 있다더라. 1만 코인쯤 된다던가.', 'They say if you save up enough, you can swim out to the island in the lake. Ten thousand coins, I heard.'], if: () => !(T.isl && T.isl.open) },
      { t: ['쿠팔라의 밤에는 고사리꽃이 핀단다. 그 전에 숲을 다 알아 둬야지.', 'The fern flower blooms on Kupala Night. Learn the whole forest before then.'] },
    ],
    sportboy: [
      { t: ['큰 바구니를 사면 버섯을 16개까지 담을 수 있어. 한 번에 더 많이 팔지.', 'With the big basket you can carry 16 mushrooms. More per trip, more coin.'], if: () => !shop('basket1') },
      { t: ['아주 큰 바구니는 30개까지 담겨! 장터에 한 번 가면 큰돈이야.', 'The huge basket holds 30! One trip to market and you\'re rich.'], if: () => shop('basket1') && !shop('basket2') },
      { t: ['장화를 신으면 뱀한테 물려도 끄떡없고 물속도 빨리 걸어.', 'In rubber boots a snake bite can\'t get you, and you wade much faster.'], if: () => !shop('boots') },
      { t: ['운동화를 신으면 훨씬 빨리 달려. 숲이 넓잖아.', 'Sneakers make you run much faster. The forest is big, you know.'], if: () => !shop('shoes') },
      { t: ['장총은 멧돼지 사냥용이야. 표도르 아저씨가 찾고 있을걸.', 'The rifle is for boar hunting. Uncle Fyodor is looking for someone with one.'], if: () => !shop('rifle') },
      { t: ['원시림 들소는 호밀을 좋아해. 세 번 먹이면 친구가 되고, 버티면 탈 수도 있어.', 'Forest bison love rye. Feed one three times and it\'s your friend — hold on long enough and you can ride it.'] },
      { t: ['멧돼지한테 들이받히면 죽어. 보이면 나무 뒤로 피해.', 'A boar will kill you if it charges. Get behind a tree when you see one.'] },
      { t: ['우리 가게 작살을 들고 물에 들어가면 물고기를 잡아.', 'Take a spear from my shop into the water and you can catch fish.'], if: () => !shop('spear') },
      { t: ['쿠팔라의 밤엔 다 같이 모닥불 둘레를 돌아. 너도 와!', 'On Kupala Night we all circle the bonfire together. Come along!'] },
    ],
    winterboy: [
      { t: ['원시림 들소한테 호밀을 세 번 먹이면 친구가 돼. 열두 마리 다 해 봤어?', 'Feed a forest bison rye three times and it\'s your friend. Have you done all twelve?'] },
      { t: ['어른 들소는 타면 날뛰어. ◀ ▶ 로 버티면 길들여진대.', 'A grown bison bucks when you climb on. Hold your balance with ◀ ▶ and it\'s tamed.'] },
      { t: ['들소를 타면 멧돼지도 뱀도 못 건드려. 등에서 버섯도 딸 수 있고.', 'On a bison no boar or snake can touch you — and you can still pick mushrooms from its back.'] },
      { t: ['호밀은 호밀밭에서 가져와. 여섯 단까지 들 수 있어.', 'Get the rye from the rye field. You can carry six bundles.'] },
      { t: ['이 털모자? 할아버지가 주신 거야. 여름에도 벗기 싫어!', 'This fur hat? Grandpa gave it to me. I wear it even in summer!'] },
    ],
  };
  // ── 알레샤 러브스토리 (사장님 2026-09-20 "미션할때마다 알레샤한테 가보라고 대사를 주고 하나에 한번씩 보상해야지") ──
  //   해낸 일 하나마다: 표도르가 "알레샤한테 가 봐라" → 알레샤에게 가면 그 일 이야기 한 줄 + 하트 (한 번씩만)
  //   알레샤는 돈을 주지 않는다 (사장님 2026-09-20 "알레샤가 돈주는거냐") — 삯은 물건을 사 주는 표도르 몫
  //   T.loved: 받은 일 id → true. 일곱 가지를 다 받으면 T.love 2(쿠팔라의 밤 약속) → 그날 밤 알레샤 곁에 가면 3
  const LOVE = [
    { id: 'sell', act: 'clap', ok: () => T.sold >= 12,
      t: ['버섯 한 바구니를 다 팔았다며. 숲에 혼자 들어가는 거 안 무서워?', 'A whole basket of mushrooms sold, they say. Aren\'t you scared, going into the forest alone?'] },
    { id: 'wood', act: 'shy', ok: () => T.did.wood,
      t: ['장작까지 팼어? 손 안 다쳤어? …보여 줘 봐. …됐어, 아무것도 아니네.', 'You chopped firewood too? Did you hurt your hands? …Let me see. …Fine, it\'s nothing.'] },
    { id: 'honey', act: 'clap', ok: () => T.did.honey,
      t: ['벌통에서 꿀을 떴다고? 난 벌이 제일 무서운데. 너 안 무서워?', 'You took honey from the hives? Bees scare me most of all. Aren\'t you afraid?'] },
    { id: 'ride', act: 'clap', ok: () => T.tame && Object.keys(T.tame).length > 0,
      t: ['들소를 탔다며. 진짜? …나 그거 한 번 보고 싶었는데.', 'You rode a bison? Really? …I always wanted to see that.'] },
    { id: 'boar', act: 'shy', ok: () => (T.kills || 0) >= 2,
      t: ['멧돼지… 안 무서웠어? 난 네가 안 돌아올까 봐 무서웠어.', 'The boars… weren\'t you scared? I was scared you wouldn\'t come back.'] },
    { id: 'fish', act: 'clap', ok: () => window.FISHING && FISHING.counts() >= FISHING.FISH.length,
      t: ['호수 물고기를 다 잡았다며. 강꼬치고기까지? …너 진짜 이상한 애야.', 'They say you caught every fish in the lake. Even the pike? …You really are something strange.'] },
    { id: 'herd', act: 'kiss', ok: () => window.ITEMS && ITEMS.counts().b >= 12,
      t: ['들소 열두 마리가 다 너를 알아본대. …나도 그중에 하나였으면.', 'All twelve bison know you now, they say. …I wish I were one of them.'] },
  ];
  // 표도르의 귀띔 — 아직 안 받은 일이 있으면
  const FYODOR_LOVE = ['알레샤가 너 찾더라. 네 얘기를 하고 싶은가 보더라. 가 봐라.',
    'Alesya was asking after you. Sounds like she wants to talk about you. Go on, go see her.'];
  const FYODOR_LAST = ['알레샤가 요새 네 얘기만 하더라. 이런 아이가 어딨냐고. 가 봐라, 지금.',
    'Alesya talks of nothing but you these days — says there\'s no one else like you. Go on, right now.'];
  // 일곱 가지를 다 받은 뒤 — 약속
  const LOVE_ASK = [
    ['쿠팔라의 밤에 모닥불 둘레를 손 잡고 돌면, 그 사람이랑 안 헤어진대.', 'They say if you circle the Kupala fire hand in hand, you never part.'],
    ['그날… 내 옆에 서 줄래?', 'That night… will you stand beside me?'],
  ];
  const LOVE_WAIT = ['모닥불에서 기다릴게.', 'I\'ll be waiting by the bonfire.'];
  const LOVE_NIGHT = ['왔구나. …손, 이리 줘.', 'You came. …Give me your hand.'];
  const LOVE_DONE = ['봐, 안 놓쳤지?', 'See? I didn\'t let go.'];

  function lovePend() {
    if (T.love >= 2) return null;
    for (const b of LOVE) if (!T.loved[b.id] && b.ok()) return b;
    return null;
  }
  // 하트는 지금 서 있는 자리 위로 (쿠팔라의 밤엔 모닥불 둘레를 돈다)
  function hearts(r) {
    if (!window.PLAY || !PLAY.hearts) return;
    const p = r.holder.position;
    PLAY.hearts({ x: p.x, z: p.z, h: { floor: p.y }, P: r.P });
  }
  // 알레샤 동작 하나 (kiss·shy·clap — girl_acts.glb)
  function loveAct(r, k) {
    const b = r.body;
    if (!b || !b.acts || !b.acts[k]) return;
    const a = b.acts[k];
    a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = false; a.play();
    if (b.cur) a.crossFadeFrom(b.cur, 0.3, false);
    const back = b.cur; b.cur = a;
    setTimeout(() => { if (b.cur === a && back) { back.reset(); back.play(); back.crossFadeFrom(a, 0.5, false); b.cur = back; } },
      Math.min(a.getClip().duration * 1000, 6000));
  }
  let loveT = 0, loveI = 0, loveVisit = -1, loveShow = null, askVisit = -1;
  function loveLine(r) {
    if (loveVisit !== r.visit) { loveVisit = r.visit; loveT = 0; loveShow = null; }   // 다시 다가오면 다음 줄
    const dt = T.dt || 0;
    // 쿠팔라의 밤: 약속한 그 밤
    if (T.kupala >= 1 && T.love >= 2) {
      if (T.love === 2) { T.love = 3; loveT = 0; U.save(); AUD.sfx('like'); hearts(r); loveAct(r, 'kiss'); }
      loveT += dt;
      return loveT > 6 ? LOVE_DONE : LOVE_NIGHT;
    }
    // 해낸 일 하나에 한 번씩 — 대사 + 하트 + 삯
    const b = loveShow || lovePend();
    if (b) {
      if (!loveShow) {
        loveShow = b; loveT = 0;
        T.loved[b.id] = true;
        if (b.id === 'fish' || b.id === 'herd') T.liked[b.id === 'herd' ? 'bison' : 'fish'] = true;   // 옛 호감 표시와 겹치지 않게
        U.save();
        AUD.sfx('like');
        hearts(r); loveAct(r, b.act);
      }
      return b.t;   // 이번 방문엔 이 한 줄 — 여럿 밀렸으면 다음에 와서 다음 것
    }
    // 일곱 가지를 다 받았으면 약속
    if (!LOVE.every(o => T.loved[o.id])) return null;
    if (T.love >= 2) return LOVE_WAIT;
    if (askVisit < 0) askVisit = r.visit;   // 약속 이야기가 시작된 방문
    loveI = Math.min(LOVE_ASK.length - 1, r.visit - askVisit);   // 방문마다 한 줄
    if (r.visit - askVisit >= LOVE_ASK.length) { T.love = 2; U.save(); AUD.sfx('like'); hearts(r); loveAct(r, 'shy'); return LOVE_WAIT; }
    return LOVE_ASK[loveI];
  }

  // ── 미하스: 길들인 들소를 타고 오면 한 마리마다 다른 대사 + 상 (사장님 2026-09-20 "들소길들이기 보상은 미하스가 주는거로", "1마리 갖다줄때마다 다르게") ──
  //   T.mik: 상을 준 들소 번호 → true. 열두 마리째는 크게
  const MIK_COIN = 150, MIK_LAST = 1500;
  // 미하스 할아버지는 원시림 감시원(егерь) — 들소 장부에 적고 산림청 수고비를 준다 (사장님 2026-09-27 "벨라루스애들이 봤을때 말이되는 스토리")
  const MIK = [
    ['진짜 들소를 타고 왔어?! 우리 할아버지가 원시림 감시원이거든. 들소 장부에 적어 두신대 — 자, 산림청 수고비야.', 'You actually rode a bison here?! My grandpa is the forest ranger. He’s logging it in his bison register — here, the forestry pays for it.'],
    ['두 마리째! 얘는 뿔이 더 굽었네. 할아버지가 장부에 한 줄 더 적으셨어. 수고비는 늘 똑같아.', 'The second one! This one’s horns curl more. Grandpa added another line to the register. Same fee every time.'],
    ['세 마리… 할아버지가 너한테 들소가 좋아하는 냄새라도 나냐고 물으셔.', 'Three… Grandpa wants to know if bison just like the way you smell.'],
    ['네 마리째! 나도 한 번만 타 보면 안 될까? …아니다, 할아버지한테 혼나.', 'Four! Could I ride one just once? …No. Grandpa would have my hide.'],
    ['다섯! 할아버지 말로는 해마다 들소를 셀 때 얘네는 늘 숨어 있었대.', 'Five! Grandpa says these ones always hid during the yearly bison count.'],
    ['절반이다, 여섯 마리! 얘는 눈이 순하네. 장부에 "순함"이라고 적어 드릴게.', 'Halfway — six! This one has gentle eyes. I’ll write “gentle” in the register.'],
    ['일곱 마리째. 할아버지가 그러는데 겨울엔 얘네가 호밀밭까지 내려온대.', 'Seven. Grandpa says in winter they come all the way down to the rye fields.'],
    ['여덟! 이제 할아버지가 들소 세러 갈 때 너를 데려가고 싶으시대.', 'Eight! Now Grandpa wants to take you along when he counts the bison.'],
    ['아홉 마리… 장부를 다 채우면 무슨 일이 날까?', 'Nine… I wonder what happens when the register is full.'],
    ['열 마리! 두 마리 남았어. 제일 큰 놈은 할아버지도 몇 년째 못 보셨대.', 'Ten! Two to go. Grandpa hasn’t seen the biggest one in years.'],
    ['열한 마리. 한 마리 남았어. …할아버지가 장부를 펴 놓고 기다리셔.', 'Eleven. One left. …Grandpa is waiting with the register open.'],
    ['열두 마리, 장부를 다 채웠어!! 할아버지가 평생 못 채운 장부야. 할아버지가 모아 두신 상금, 너 가져.', 'Twelve — the register is full!! Grandpa never filled it in his whole life. Take the prize money he put aside.'],
  ];
  // 지금 타고 있는 들소가 아직 상을 안 받았으면 그 번호
  function mikPend() {
    if (!PL.ride || !T.tame || !T.tame[PL.ride.id]) return null;
    return (T.mik && T.mik[PL.ride.id]) ? null : PL.ride.id;
  }
  const mikDone = () => Object.keys(T.mik || {}).length;
  let mikShow = null, mikVisit = -1;
  function mikLine(r) {
    if (mikVisit !== r.visit) { mikVisit = r.visit; mikShow = null; }
    const id = mikShow == null ? mikPend() : null;
    if (id != null) {
      const n = mikDone();                       // 이번이 몇 마리째
      const coin = n >= MIK.length - 1 ? MIK_LAST : MIK_COIN;
      T.mik[id] = true;
      T.coins += coin;
      U.save();
      AUD.sfx('new'); setTimeout(() => AUD.sfx('coin'), 350);
      HUD.praise('+' + coin + ' \ud83e\ude99');
      mikShow = MIK[Math.min(n, MIK.length - 1)];
    }
    return mikShow;
  }

  // 팔 수 있는 것을 들고 있나 (버섯·물고기·요리)
  function carrying() {
    let n = T.basket.length;   // 바구니는 늘 가지고 있다
    for (const k in T.fish) n += T.fish[k];
    for (const g of ['wood', 'honey', 'berry', 'boar']) n += T.items[g] || 0;   // 장작·꿀·블루베리·멧돼지도 사 준다
    return n + ((T.dishes || []).length);
  }
  //   first(지금 부탁)가 있으면 부탁 → 귀띔 → 부탁 → … 번갈아 띄운다
  // 지금 할 일 한 줄 — 빛기둥 대신 주민들이 늘 말로 알려 준다 (사장님 2026-09-20 "빛기둥은 없애고 대사로 알려줘 언제나")
  // 알림은 어울리는 사람만 제 말투로 한다. 다섯 명이 같은 말을 하던 것 (사장님 2026-10-01 "인물마다 대사를 다 다르게")
  //   who 로 부르면 그 사람 줄이 있는 알림만 고르고, 없으면 그 사람은 제 귀띔이나 제 이야기를 한다
  const HINTS = [
    // 1만 코인 목표 — 처음 판 뒤 사람마다 시간차를 두고 한 번씩만, 제 말투로 + 지금 모은 돈 (사장님 2026-10-01 "각자 시간차를 두고 1번씩만")
    { ok: () => T.did && T.did.isl10k && !(T.isl && T.isl.open),
      farmer: () => once10k('farmer') && withCoins(["섬에 가려면 1만 코인은 있어야 한다더라. 멧돼지 한 마리면 300이다.", "They say you need ten thousand coins to reach the island. A boar fetches 300."]),
      winterboy: () => once10k('winterboy') && withCoins(["1만 코인 모으는 중이야? 들소 데려오면 할아버지가 수고비 주잖아.", "Saving up ten thousand coins? Grandpa pays you for every bison you bring."]),
      grandma: () => once10k('grandma') && withCoins(["얼음 속 노인 이야기 들었니? 섬까지 가려면 1만 코인쯤 든다더라.", "Heard about the old man in the ice? Getting to the island takes about ten thousand coins, they say."]),
      sportboy: () => once10k('sportboy') && withCoins(T.shop.rifle ? ["1만 코인 모아서 섬에 가면 나도 데려가 줘!", "When you've got ten thousand and go to the island, take me with you!"] : ["1만 코인 모으려면 우리 가게 장총부터 사. 멧돼지가 제일 돈 돼.", "To save ten thousand, buy the rifle from my shop first. Boars pay best."]),
      girl: () => once10k('girl') && withCoins(["섬에 가려면 1만 코인이 필요하대. 다 모으면 나한테 제일 먼저 말해 줘.", "They say you need ten thousand coins for the island. Tell me first when you have it."]) },
    { ok: () => T.coins < 40 && ITEMS.counts().m < 2,
      t: ['숲에서 버섯을 따 와. 표도르 아저씨가 사 줘.', 'Pick mushrooms in the forest. Uncle Fyodor buys them.'],
      grandma: ["숲에 버섯이 한창이란다. 바구니 들고 가서 따다가 표도르한테 팔아 보렴.", "The forest is full of mushrooms right now. Take your basket, pick some and sell them to Fyodor."],
      farmer: ["버섯 따 오면 내가 사 주마. 마을 뒤 자작나무 숲부터 가 봐라.", "Bring me mushrooms and I'll buy them. Start with the birch wood behind the village."] },
    // sportboy: 얀카는 제 가게 이야기를 제 말로 한다 (사장님 2026-09-24 "표도르가 했는데 얀카도 똑같이하네")
    { ok: () => !T.shop.basket1, t: ['버섯을 팔아서 얀카네 가게에서 큰 바구니부터 사.', 'Sell mushrooms and buy the big basket at Yanka\'s shop first.'],
      sportboy: ['버섯 팔아서 돈 모이면 우리 가게 큰 바구니부터 사 가. 그 작은 걸론 금방 차.', 'Once you\'ve sold some mushrooms, get the big basket here first. That little one fills up fast.'],
      farmer: ["바구니가 작으면 몇 번을 오가야 한다. 얀카네서 큰 걸 사라.", "A small basket means walking back and forth. Get a bigger one at Yanka's."] },
    { ok: () => !T.shop.boots, t: ['숲엔 살무사가 있어. 얀카네 장화를 신어야 안 물려.', 'There are vipers in the forest. Wear boots from Yanka\'s shop or you\'ll get bitten.'],
      sportboy: ['숲에 살무사 있는 거 알지? 우리 가게 장화 신으면 안 물려.', 'You know there are vipers in the forest? Our rubber boots keep you from getting bitten.'],
      grandma: ["늪 쪽엔 살무사가 산단다. 얀카네서 장화부터 사 신으렴.", "Vipers live near the marsh, dear. Buy rubber boots at Yanka's first."] },
    { ok: () => ITEMS.counts().m < 12, t: ['버섯 열두 가지를 다 찾아 봐. 자작나무 숲·소나무 숲·풀밭·늪·원시림마다 다른 게 나.', 'Find all twelve mushrooms. Birch wood, pine wood, meadow, marsh and the old forest each grow different ones.'],
      grandma: ["버섯마다 나는 데가 달라. 자작나무 숲, 소나무 숲, 풀밭, 늪, 원시림을 다 돌아보렴. 열두 가지란다.", "Each mushroom grows in its own place. Walk the birch wood, the pine wood, the meadow, the marsh and the old forest. There are twelve kinds."],
      girl: ["버섯 이름 다 알아? 열두 가지래. 원시림 쪽엔 신기한 게 난대.", "Do you know all the mushroom names? There are twelve. Strange ones grow in the old forest, they say."] },
    // 작살이 없을 때만 작살 사라는 말 — 산 뒤에도 6종을 다 잡을 때까지 같은 말이 나왔다 (사장님 2026-10-01)
    { ok: () => !TOOLS.has('spear') && FISHING.counts() < FISHING.FISH.length,
      t: ['얀카네 가게에서 작살을 사서 호수에 뛰어들면 물고기 열두 가지를 잡을 수 있어.', 'Buy a spear at Yanka\'s shop and dive into the lake — twelve kinds of fish.'],
      sportboy: ['우리 가게 작살 사서 호수에 뛰어들어 봐. 물고기가 열두 가지야.', 'Buy a spear from my shop and dive into the lake. There are twelve kinds of fish.'],
      farmer: ["호수 물고기도 사 준다. 작살은 얀카네서 팔고.", "I buy lake fish too. Yanka sells the spear."] },
    // 작살이 있으면 남은 물고기 이야기
    { ok: () => TOOLS.has('spear') && FISHING.counts() < FISHING.FISH.length,
      t: ['호수 물고기 열두 가지를 다 잡아 봐.', 'Catch all twelve kinds of fish in the lake.'],
      sportboy: ["작살 잘 쓰고 있어? 물고기 열두 가지 다 잡으면 나한테도 보여 줘.", "How's the spear working out? Show me when you've caught all twelve kinds."],
      farmer: ["강꼬치고기는 깊은 데 산다. 잡아 오면 제일 비싸게 쳐 주마.", "Pike live in the deep water. Bring one in and I'll pay the most for it."] },
    { ok: () => ITEMS.counts().b < 12, t: ['호밀밭에서 호밀을 베어 원시림 들소 열두 마리와 친해져 봐. 타고 오면 미하스가 상을 줘.', 'Cut rye in the rye field and befriend all twelve bison in the old forest. Ride one to Mikhas for a reward.'],
      winterboy: ["원시림 들소 열두 마리, 다 친해져 봐. 호밀밭에서 호밀 베어 가면 돼.", "Make friends with all twelve bison in the old forest. Just bring rye from the rye field."] },
    { ok: () => !(T.isl && T.isl.open), t: ['1만 코인을 모으면 호수 섬에 헤엄쳐 갈 수 있대. 멧돼지 한 마리가 300, 들소를 타고 오면 미하스가 상을 줘.', 'Save ten thousand coins and you can swim to the island. A boar is 300, and Mikhas pays for every bison you ride in.'],
      farmer: ["1만 코인쯤 모으면 호수 섬에 헤엄쳐 갈 만하다더라. 멧돼지 한 마리면 300이다.", "Save around ten thousand coins and they say you can swim to the island. A boar fetches 300."],
      girl: ["호수 섬에 공주 석상이 있대. 언젠가 거기 가 보고 싶어.", "There's a princess statue on the lake island, they say. I want to see it someday."] },
    { ok: () => T.isl && T.isl.open && T.isl.key < 1, t: ['호수 섬의 공주 석상을 밀어서 미르 성을 바라보게 해 봐.', 'Push the princess statue on the island until she faces Mir Castle.'],
      girl: ["옛날이야기에선 공주 석상이 미르 성을 바라봐야 서랍이 열린대. 밀어서 돌려 봐.", "In the old tale the drawer opens when the princess statue faces Mir Castle. Push her around."],
      grandma: ["석상 이야기 들었니? 성을 바라보게 하면 서랍이 열린다더라.", "Heard about the statue? They say a drawer opens if she faces the castle."] },
    { ok: () => T.isl && T.isl.key === 1, t: ['석상 서랍에서 횃불이 나왔대. 가져가.', 'A torch came out of the statue\'s drawer. Take it.'],
      girl: ["석상 서랍에서 횃불이 나왔다며? 잊지 말고 챙겨.", "A torch came out of the statue's drawer? Don't forget to take it."],
      winterboy: ["횃불이다! 그거 들고 가면 뭔가 녹일 수 있을 것 같아.", "A torch! I bet you could melt something with that."] },
    { ok: () => T.isl && T.isl.key === 2, t: ['횃불을 얻으니 섬 반대편에 다리가 생겼대. 건너가서 횃불로 얼음을 녹여 봐. 누가 갇혀 있대.', 'The torch raised a bridge on the far side of the island. Cross it and melt the ice with the torch. Someone is trapped in there.'],
      grandma: ["섬 뒤쪽 얼음 속에 누가 갇혀 있다더라. 횃불로 녹여 보렴.", "They say someone is trapped in the ice behind the island. Melt it with the torch."],
      winterboy: ["섬 반대편에 다리가 생겼대! 얼음 속에 할아버지가 있다는 소문이야.", "A bridge appeared on the far side of the island! People say there's an old man in the ice."] },
  ];
  // 처음 판 때부터 몇 분 뒤에 말할 수 있나 (실제 시간, 게임을 껐다 켜도 이어진다). 한 번 말하면 T.did['k10' + 사람] 이 선다
  const K10_MIN = { grandma: 4, girl: 10, winterboy: 16, sportboy: 22, farmer: 28 };   // 6분 간격 (사장님 2026-10-01 "4분 10분 16분.....")
  function once10k(who) {
    if (T.did.isl10k && !T.did.isl10kAt) { T.did.isl10kAt = Date.now(); U.save(); }   // 시각 없는 옛 저장은 지금부터 센다
    const at = T.did.isl10kAt || 0;
    if (T.did['k10' + who] || !at) return false;
    return Date.now() - at >= K10_MIN[who] * 60000;
  }
  // 대사 끝에 지금 모은 돈 — 번역된 한 줄로 만들어 넘긴다 (러시아어 사전은 바뀌는 숫자를 못 찾는다)
  function withCoins(line) { const s = L(line[0], line[1]) + ' ' + L('(지금', '(now') + ' ' + T.coins.toLocaleString() + ' / 10,000)'; const r = [s, s]; r.k10 = true; return r; }
  // 처음 팔고 팔기 창을 닫으면 표도르가 1만 코인과 섬 이야기를 한 번 해 준다
  const FIRST_SALE = ["처음 판 돈이구나! 이렇게 모아서 1만 코인이 되면 호수 가운데 섬에 갈 수 있다더라. 얼음 속 노인이 소원을 들어준다는 그 섬 말이다.", "Your first coins! Save up ten thousand and they say you can get to the island in the lake. The one where the old man in the ice grants a wish."];
  function firstSaleTalk() {
    if (!T.did || T.did.isl10k || !(T.sold > 0) || (T.isl && T.isl.open)) return;
    T.did.isl10k = true; T.did.isl10kAt = Date.now(); U.save();
    say(0, FIRST_SALE, 9);
  }
  function hint(who) {
    if (!window.ITEMS || !window.FISHING || !window.TOOLS) return null;
    for (const h of HINTS) { try { if (h.ok()) { if (!who) { if (h.t) return h.t; continue; } if (h[who]) { const v = typeof h[who] === 'function' ? h[who]() : h[who]; if (v) return v; } } } catch (e) { } }
    return null;
  }
  function tipLine(r, first) {
    const tips = TIPS[r.P.id].filter(o => !o.if || o.if()).map(o => o.t);
    const k = (r.visit || 1) - 1;   // 다가간 횟수 — 한 번에 한 줄
    if (first && first.length) return (k % 2 && tips.length) ? tips[(k >> 1) % tips.length] : first[(k >> 1) % first.length];
    if (!tips.length) return TALK[r.p].done;
    return tips[k % tips.length];
  }

  const NAMES = QUESTS.map(q => [PEOPLE[q.p].ko, PEOPLE[q.p].en]);
  // 그 사람의 지금 부탁 번호 (다 했으면 마지막 번호)
  function curStep(p) {
    let last = -1;
    for (let i = 0; i < QUESTS.length; i++) if (QUESTS[i].p === p) { last = i; if (!T.quests[i]) return i; }
    return last;
  }

  // ── 말풍선 그림 ──
  const imgCache = {};
  function need(q) {
    if (q.g) return { icon: GOODS[q.g].icon, have: T.items[q.g] || 0 };
    if (q.m != null) return { img: ITEMS.ICONS.m[q.m], have: T.basket.filter(id => id === q.m).length };
    if (q.f != null) return { img: ITEMS.ICONS.f[q.f], have: T.fbag[q.f] || 0 };
    if (q.k != null) return { img: FISHING.icon(q.k), have: (T.fish && T.fish[q.k]) || 0 };
    if (q.hunt) return { icon: '🐗', have: T.hunted || 0 };
    if (q.ride) return { icon: '🦬', have: PL.ride && T.tame && T.tame[PL.ride.id] ? 1 : 0 };
    return { icon: '🪺', have: ITEMS.counts()[q.c] };
  }
  // 말풍선 상자 (꼬리까지)
  function bubbleBox(g) {
    g.fillStyle = 'rgba(255,252,244,.96)'; g.strokeStyle = '#6a4a2a'; g.lineWidth = 5;
    g.beginPath(); g.roundRect(8, 8, 240, 112, 30); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(112, 118); g.lineTo(128, 150); g.lineTo(144, 118); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(112, 120); g.lineTo(128, 150); g.lineTo(144, 120); g.stroke();
    g.fillStyle = 'rgba(255,252,244,1)'; g.fillRect(114, 110, 28, 10);
  }
  function drawBubble(r) {
    const c = r.cv, g = c.getContext('2d');
    g.clearRect(0, 0, 256, 160);
    if (r.step < 0 && r.P.id === 'winterboy') {   // 미하스: 들소를 타고 와 상을 받은 수
      bubbleBox(g);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = '64px sans-serif'; g.fillText('\ud83e\uddac', 74, 66);
      g.font = 'bold 50px "Ria", sans-serif';
      const n = mikDone();
      g.fillStyle = n >= 12 ? '#2f8a3a' : '#3a2a1a';
      g.fillText(n + '/12', 178, 68);
      r.tex.needsUpdate = true; r.key = 'mik' + n;
      return;
    }
    if (r.step < 0) {   // 부탁 없는 할머니: 버섯 → 요리
      bubbleBox(g);
      const src = ITEMS.ICONS.m[0]; let im = imgCache[src];
      if (!im) { im = imgCache[src] = new Image(); im.src = src; }
      if (im.complete) g.drawImage(im, 20, 22, 84, 84); else im.addEventListener('load', () => { drawBubble(r); }, { once: true });
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#6a4a2a';
      g.font = 'bold 44px sans-serif'; g.fillText('→', 128, 64);
      g.font = '64px sans-serif'; g.fillText('🍲', 190, 66);
      r.tex.needsUpdate = true; r.key = 'cook';
      return;
    }
    const q = QUESTS[r.step], nd = need(q), done = T.quests[r.step] && r.heartT > 0;
    g.fillStyle = 'rgba(255,252,244,.96)'; g.strokeStyle = '#6a4a2a'; g.lineWidth = 5;
    g.beginPath(); g.roundRect(8, 8, 240, 112, 30); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(112, 118); g.lineTo(128, 150); g.lineTo(144, 118); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(112, 120); g.lineTo(128, 150); g.lineTo(144, 120); g.stroke();
    g.fillStyle = 'rgba(255,252,244,1)'; g.fillRect(114, 110, 28, 10);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (done) { g.font = '72px sans-serif'; g.fillStyle = '#e04050'; g.fillText('❤', 128, 66); }
    else {
      if (nd.img) {
        let im = imgCache[nd.img];
        if (!im) { im = imgCache[nd.img] = new Image(); im.src = nd.img; }
        if (im.complete) g.drawImage(im, 26, 16, 96, 96);
        else im.addEventListener('load', () => { drawBubble(r); }, { once: true });
      } else {
        g.font = (nd.icon.length > 2 ? 50 : 70) + 'px sans-serif';
        g.fillText(nd.icon, 76, 66);
      }
      const ok = nd.have >= q.n;
      g.font = 'bold 50px "Ria", sans-serif';
      g.fillStyle = ok ? '#2f8a3a' : '#3a2a1a';
      g.fillText(Math.min(nd.have, q.n) + '/' + q.n, 184, 68);
    }
    r.tex.needsUpdate = true;
    r.key = r.step + (T.quests[r.step] ? 'D' : '') + nd.have;
  }

  const res = [];
  const box = new THREE.Box3();
  async function loadPerson(P) {
    const gl = await PLAYER.loadGLB('assets/models/npc/' + P.id + '.glb?v=2');
    const m = gl.scene;
    PLAYER.tidy(m);
    m.traverse(n => { if (n.isMesh) { n.castShadow = true; n.frustumCulled = false; } });
    const inner = new THREE.Group();
    inner.add(m);
    const mixer = new THREE.AnimationMixer(m);
    const clips = gl.animations.slice();
    // 알레샤는 호감 표시 동작(키스 날리기·부끄러움·박수)을 더 받는다 — 엉덩이 높이만 알레샤 idle 에 맞춘다
    if (P.id === 'girl') {
      try {
        const ex = await PLAYER.loadGLB('assets/models/girl_acts.glb?v=1');
        const base = clips.find(c => /idle/i.test(c.name));
        const hi = base && base.tracks.find(t => /Hips\.position$/.test(t.name));
        for (const c of ex.animations) {
          const tr = c.tracks.find(t => /Hips\.position$/.test(t.name));
          if (tr && hi) { const v = tr.values, h = hi.values, k = h[1] / v[1]; for (let i = 0; i < v.length; i += 3) { v[i] = h[0]; v[i + 1] *= k; v[i + 2] = h[2]; } }
          clips.push(c);
        }
      } catch (e) { console.warn('girl_acts', e); }
    }
    // 할머니는 주인공의 앉기 동작을 빌려 쓴다 — 엉덩이 이동만 할머니 키에 맞춘다
    //   (주인공의 sit 은 앉아 있는 자세가 이어지는 동작 — 일어서고 앉는 건 선 자세와 섞어서 한다)
    let sitClip = null;
    if (P.id === 'grandma' && PLAYER.CH.clips && PLAYER.CH.clips.sit) {
      const hipOf = c => c && c.tracks.find(t => /Hips\.position$/.test(t.name));
      const base = hipOf(clips.find(c => /idle/i.test(c.name))), heroBase = hipOf(PLAYER.CH.clips.idle);
      sitClip = PLAYER.CH.clips.sit.clone(); sitClip.name = 'sit';
      const hp = hipOf(sitClip);
      if (hp && base && heroBase) { const k = base.values[1] / heroBase.values[1], v = hp.values; for (let i = 0; i < v.length; i++) v[i] *= k; }
      clips.push(sitClip);
    }
    const all = clips.map(c => mixer.clipAction(c));
    const find = re => all.find(a => re.test(a.getClip().name));
    const idle = find(/idle|stand|breath/i) || all[0] || null;
    const walk = find(/walk/i) || idle;
    if (idle) { idle.play(); idle.time = Math.random() * idle.getClip().duration; }
    mixer.update(0);
    m.updateMatrixWorld(true);
    // 크기: 뼈를 반영한 상자로 잰다
    box.makeEmpty();
    m.traverse(o => {
      if (!o.isMesh) return;
      let b;
      if (o.isSkinnedMesh) { o.computeBoundingBox(); b = o.boundingBox.clone(); }
      else { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); b = o.geometry.boundingBox.clone(); }
      box.union(b.applyMatrix4(o.matrixWorld));
    });
    const hgt = box.max.y - box.min.y;
    const sc = hgt > 0.05 ? P.h / hgt : 1;
    inner.scale.setScalar(sc);
    inner.position.y = -box.min.y * sc;
    const sit = sitClip ? find(/^sit$/) : null;
    return { inner, mixer, idle, walk, cur: idle, sit, acts: { kiss: find(/^kiss$/), shy: find(/^shy$/), clap: find(/^clap$/) } };
  }
  function play(r, a, fade) {
    if (!r.body || !a || r.body.cur === a) return;
    a.reset(); a.play();
    if (r.body.cur) a.crossFadeFrom(r.body.cur, fade || 0.4, false);
    r.body.cur = a;
  }

  // 할머니 의자 (사장님 2026-09-24 "집앞 의자에 앉아있다가 주인공이 오면 자리에서 일어나고")
  //   sat(의자 위에 앉음) → rising → up(의자 앞에 섬) → sitting → sat
  //   앉은 자세 ↔ 선 자세를 SIT_FADE 초 동안 섞으면서 몸을 의자 위 ↔ 의자 앞으로 옮긴다
  const SIT_FADE = 0.8;
  function sitHold(r) {
    play(r, r.body.sit, 0.01);
    r.holder.position.set(r.seat.x, r.floor, r.seat.z);
    r.body.mixer.update(0.02);
    r.sitS = 'sat';
  }
  function seatStep(r, d, dt) {
    if (!r.body || !r.body.sit) return;
    const wantUp = r.busy || COOK.busy || d < 3.6;
    if (r.sitS === 'sat' && wantUp && T.mode === 'play') { play(r, r.body.idle, SIT_FADE); r.sitS = 'rising'; r.sitK = 0; }
    else if (r.sitS === 'up' && !wantUp && d > 4.6 && Math.hypot(r.holder.position.x - r.x, r.holder.position.z - r.z) < 0.08 && Math.abs(U.angDiff(r.holder.rotation.y, r.yaw)) < 0.08) {
      r.holder.rotation.y = r.yaw; play(r, r.body.sit, SIT_FADE); r.sitS = 'sitting'; r.sitK = 0;
    }
    if (r.sitS === 'rising' || r.sitS === 'sitting') {
      r.sitK = Math.min(1, r.sitK + dt / SIT_FADE);
      const e = r.sitK * r.sitK * (3 - 2 * r.sitK), k = r.sitS === 'rising' ? e : 1 - e;
      r.holder.position.set(U.lerp(r.seat.x, r.x, k), r.floor, U.lerp(r.seat.z, r.z, k));
      if (r.sitK >= 1) r.sitS = r.sitS === 'rising' ? 'up' : 'sat';
    }
  }

  async function build(scene) {
    let k = 0;
    PEOPLE.forEach((P, p) => {
      const h = P.home ? WORLD.HOME.h : WORLD.QHOUSES[k++];
      if (!h) return;
      const holder = new THREE.Group();
      // 집 앞마당에 선다 — 집 안은 닫았다 (사장님 2026-09-24). 표도르·얀카는 제 가판 뒤에 (사장님 2026-09-19)
      //   할머니는 앞벽 긴 의자에 앉아 있다가 주인공이 오면 일어난다 (world.js outdoorKitchen)
      const post = P.id === 'farmer' ? WORLD.NPCSPOT.farmer : (P.id === 'sportboy' ? WORLD.NPCSPOT.yanka : (h.stand || null));
      const [x, z] = [post.x, post.z];
      const floor = TER.H(x, z);
      holder.position.set(x, floor, z);
      const yaw = post.yaw;
      holder.rotation.y = yaw;
      COL.circle(x, z, 0.35, floor - 0.5, floor + 2, 'npc');
      scene.add(holder);
      // 말풍선
      const cv = GEO.canvas(256, 160);
      const tex = GEO.tex(cv);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: true, transparent: true, fog: false }));
      sp.scale.set(0.95, 0.6, 1);
      sp.position.set(x, floor + P.h + 0.6, z);
      sp.renderOrder = 5;
      scene.add(sp);
      const r = { p, P, h, holder, body: null, yaw, x, z, floor, sp, cv, tex, key: '', step: curStep(p), heartT: 0, seat: post.seat || null, sitS: post.seat ? 'sat' : null };
      drawBubble(r);
      res.push(r);
    });
    await Promise.all(res.map(async r => {
      try {
        r.body = await loadPerson(r.P); r.holder.add(r.body.inner);
        if (r.seat && r.body.sit) sitHold(r);
        else if (r.seat) { r.seat = false; r.sitS = null; }
      }
      catch (e) { console.warn('npc', r.P.id, e.message); }
    }));
  }

  function has(q) { return need(q).have >= q.n; }

  // 쿠팔라의 밤에는 다섯이 모닥불 둘레를 돈다(호로보드)
  let ring = false;
  function gather(on) { ring = !!on; }

  // 대화창: 가까운 주민의 지금 대사
  let talkEl = null, talkKey = '';
  function showTalk(r, line) {
    if (!talkEl) talkEl = document.getElementById('talk');
    const key = r ? r.p + '|' + line[0] + T.lang : '';
    if (key === talkKey) return;
    talkKey = key;
    const act = document.getElementById('act');
    if (!r) { talkEl.classList.remove('show'); act.style.bottom = ''; return; }
    talkEl.querySelector('b').textContent = L(r.P.ko, r.P.en);
    talkEl.querySelector('p').textContent = L(line[0], line[1]);
    talkEl.classList.remove('show'); void talkEl.offsetWidth; talkEl.classList.add('show');
    act.style.bottom = (talkEl.offsetHeight + parseFloat(getComputedStyle(talkEl).bottom) + 14) + 'px';   // 행동 안내는 대화창 위로
  }
  // 곁에 서 있으면 한 줄을 TALK_SECS 초만 띄우고 닫는다 — 서 있는 내내 대사가 이어 뜨지 않게 (사장님 2026-09-27 "모든인물 공통")
  //   말이 바뀌면(팔 것을 들고 옴·요리 중 등) 그 줄을 다시 띄우고, 멀어졌다 다시 오면 다음 줄
  const TALK_SECS = 5;
  let briefKey = '', briefT = 0, k10Who = null;
  function showBrief(r, line) {
    const key = r && line ? r.p + '|' + line[0] : '';
    if (key !== briefKey) {
      // 1만 코인 이야기는 사람마다 한 번 — 띄운 그 대화가 끝날 때(곁을 떠나거나 말이 바뀔 때) 들은 것으로 친다
      if (k10Who) { T.did['k10' + k10Who] = true; U.save(); k10Who = null; }
      briefKey = key; briefT = T.time;
      if (r && line && line.k10) k10Who = r.P.id;
    }
    showTalk(r && line && T.time - briefT < TALK_SECS ? r : null, line);
  }
  function lineFor(r, step, done) {
    const tk = TALK[r.p];
    const k = step < 0 ? -1 : QUESTS.slice(0, step + 1).filter(q => q.p === r.p).length - 1;   // 그 사람의 몇 번째 부탁
    if (k >= 0 && r.heartT > 0) return tk.thx[k];
    // 할머니: 요리하는 동안엔 "버섯 따 오면 해 주마" 대신 요리 중인 말만 (사장님 2026-09-25)
    if (r.P.id === 'grandma' && (r.busy || COOK.busy)) return COOKING;
    // 알레샤: 해낸 일 이야기·약속·그날 밤이 있으면 그것부터
    if (r.P.id === 'girl') {
      if (k >= 0 && !done && has(QUESTS[step])) return READY;
      const lv = loveLine(r); if (lv) return lv;
    }
    // 표도르: 팔 것을 들고 오면 사 주는 인사, 그 밖엔 지금 부탁과 돈벌이 귀띔을 돌아가며
    if (r.P.id === 'farmer') {
      if (k >= 0 && !done && has(QUESTS[step])) return READY;
      if (carrying()) return tk.buy;
      // 해낸 일마다 "알레샤한테 가 봐라" — 지금 부탁과 번갈아, 사이사이 귀띔
      const pend = lovePend();
      const first = [];
      { const h = hint(r.P.id); if (h) first.push(h); }
      if (pend) first.push(pend.id === 'herd' ? FYODOR_LAST : FYODOR_LOVE);
      if (k >= 0 && !done) first.push(tk.ask[k]);
      return tipLine(r, first);
    }
    // 미하스: 들소를 타고 왔으면 상부터
    if (r.P.id === 'winterboy') { const mk = mikLine(r); if (mk) return mk; }
    // 얀카·미하스: 지금 할 일 ↔ 물건의 효과·할 일 귀띔을 번갈아
    if (TIPS[r.P.id]) { const h = hint(r.P.id); return tipLine(r, h ? [h] : []); }
    if (step < 0) {
      const h = hint(r.P.id), k2 = ((r.visit || 1) - 1) % 2;
      if (!tk.hi) return (h && k2) ? h : tk.done;   // 알레샤: 잡담 ↔ 지금 할 일
      if (T.basket.length) return tk.got;
      const own = (T.dishes && T.dishes.length) || (T.cooked && Object.keys(T.cooked).length) ? tk.done : tk.hi;
      return (h && k2) ? h : own;   // 할머니: 제 말 ↔ 지금 할 일
    }
    if (done) return tk.done;
    if (has(QUESTS[step])) return READY;
    return tk.ask[k];
  }

  // 정해진 대사를 잠깐 띄운다 (알레샤 호감·할머니 요리)
  let sayR = null, sayLine = null, sayUntil = 0;
  // line 은 [한국어, 영어] — 이미 번역된 한 줄(문자열)을 주면 그대로 쓴다
  //   (사장님 2026-09-20 "알레샤 말이 짧다": 알레샤 호감·할머니 요리 이름이 문자열로 와서 첫 글자만 "성" 하고 보였다)
  function say(p, line, secs) { sayR = res.find(r => r.p === p) || null; sayLine = typeof line === 'string' ? [line, line] : line; sayUntil = T.time + secs; }

  let near = null, lastTalk = null;
  function update(dt, cam) {
    near = null;
    let talkR = null, talkD = PL.ride ? 9 : 2.8;   // 대사는 한 번 다가갈 때 한 줄 — 떨어졌다 다시 오면 다음 줄 (r.visit, 사장님 2026-09-20)
    const px = PL.pos.x, pz = PL.pos.z;
    const B = TER.Z.bonfire;
    for (const r of res) {
      if (r.heartT > 0) r.heartT -= dt;
      const step = r.heartT > 0 ? r.step : curStep(r.p);
      if (step !== r.step) { r.step = step; drawBubble(r); }
      const none = step < 0;   // 부탁이 없는 사람 (할머니)
      const q = QUESTS[step], done = none || T.quests[step];
      const d = Math.hypot(r.x - px, r.z - pz);
      if (ring) {
        const a = r.p / res.length * Math.PI * 2 + T.time * 0.14, R = 4.2;
        const bx = B.x + Math.cos(a) * R, bz = B.z + Math.sin(a) * R;
        r.holder.position.set(bx, TER.H(bx, bz), bz);
        r.holder.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a));   // 도는 쪽을 본다
        // 약속한 그 밤 — 모닥불 둘레를 도는 알레샤 곁에 가면 말을 건다 (러브스토리)
        if (r.P.id === 'girl' && T.love >= 2 && T.mode === 'play' && !T.paused) {
          const dh = Math.hypot(bx - px, bz - pz);
          if (dh < 3.6 && dh < talkD + 0.8) { talkD = dh; talkR = r; }
        }
        play(r, r.body && r.body.walk); if (r.seat) r.sitS = 'up';
        const cd = cam.position.distanceTo(r.holder.position);
        r.holder.visible = cd > 0.8;
        if (r.body && cd < 80) r.body.mixer.update(dt * 0.6);
      } else {
        if (!r.busy && r.holder.position.x !== r.x && (!r.seat || r.sitS === 'up')) { r.holder.position.set(r.x, r.floor, r.z); r.holder.rotation.y = r.yaw; play(r, r.body && r.body.idle); }
        const cd = Math.hypot(r.x - cam.position.x, r.z - cam.position.z);
        r.holder.visible = cd < 60 && cd > 0.6;
        if (r.seat) seatStep(r, d, dt);
        if (cd < 30) {
          if (r.body) r.body.mixer.update(dt);
          // 가까이 오면 주인공을 본다 (의자에 앉아 있거나 앉는 중엔 그대로)
          if (!r.busy && (!r.seat || r.sitS === 'up')) {   // 요리하러 걸어가는 동안은 cook.js 가 돌린다
            const want = d < 5 ? Math.atan2(px - r.x, pz - r.z) : r.yaw;
            r.holder.rotation.y += U.angDiff(r.holder.rotation.y, want) * Math.min(1, dt * 3);
          }
        }
      }
      const cd2 = Math.hypot(r.x - cam.position.x, r.z - cam.position.z);
      r.sp.visible = !ring && cd2 < 45 && (none ? ((r.P.id === 'grandma' && !r.busy && !COOK.busy) || (r.P.id === 'winterboy' && mikDone() < 12)) : (!done || r.heartT > 0));   // 부탁 없는 사람 중 할머니만 🍄→🍲 말풍선
      if (r.sp.visible) {
        const key = none ? (r.P.id === 'winterboy' ? 'mik' + mikDone() : 'cook') : step + (done ? 'D' : '') + need(q).have;
        if (key !== r.key) drawBubble(r);
        r.sp.position.y = r.floor + r.P.h + 0.6 + Math.sin(T.time * 2 + r.p) * 0.04;
      }
      // 들소를 타고 오면 문 앞 마당(9m)에서도 말을 건다 — 들소는 집에 못 들어간다
      const onB = !!PL.ride, reach = onB ? 9 : 1.9, lvl = onB || Math.abs(PL.pos.y - r.floor) < 1;
      if (!ring && T.mode === 'play' && !T.paused && d < talkD && lvl) { talkD = d; talkR = r; }
      if (!ring && T.mode === 'play' && d < reach && !done && lvl) {
        const nd = need(q);
        const lab = nd.have >= q.n ? 'E 🎁' : (nd.icon || '') + ' ' + Math.min(nd.have, q.n) + '/' + q.n;
        near = { kind: 'quest', r, label: lab.trim() };
      }
      // 할머니 부탁을 다 들어준 뒤엔 버섯을 가져오면 요리 (cook.js)
      else if (!ring && T.mode === 'play' && d < 1.9 && done && r.heartT <= 0 && lvl && r.P.id === 'grandma') { const cn = COOK.near(r); if (cn) near = cn; }
    }
    if (talkR && talkR.p === 2 && !T.met) { T.met = true; U.save(); }   // 할머니를 처음 만남
    // 알레샤: 놀이를 해낼 때마다 한 번씩 호감 (play.js LIKE)
    if (talkR && talkR.P.id === 'girl' && window.LIKE && LIKE.pending() && !(sayR && T.time < sayUntil)) LIKE.show(talkR);
    const ex = !talkR && window.ISLAND ? ISLAND.talk() : null;   // 얼음할아버지 (island.js)
    if (sayR && T.time < sayUntil && T.mode === 'play' && Math.hypot(sayR.x - px, sayR.z - pz) < 7) showTalk(sayR, sayLine);
    else if (ex) { sayR = null; if (ex.hold) { briefKey = ''; showTalk(ex.r, ex.line); } else showBrief(ex.r, ex.line); }   // 엔딩 대사는 끝까지 띄운다
    else {
      sayR = null;
      if (talkR !== lastTalk) { lastTalk = talkR; if (talkR) talkR.visit = (talkR.visit || 0) + 1; }
      showBrief(talkR, talkR && lineFor(talkR, talkR.step, talkR.step >= 0 && T.quests[talkR.step] && talkR.heartT <= 0));
    }
    return near;
  }

  function deliver(r) {
    const i = curStep(r.p), q = QUESTS[i];
    if (i < 0) return;
    if (r.heartT > 0 || T.quests[i] || !has(q)) { AUD.sfx('deny'); return; }
    if (q.g) T.items[q.g] -= q.n;
    else if (q.m != null) {
      let k = q.n; const used = [];
      T.basket = T.basket.filter(id => { if (id === q.m && k > 0) { k--; used.push(id); return false; } return true; });
      if (r.P.id === 'grandma') setTimeout(() => COOK.cook(r, used), 900);   // 받은 버섯으로 바로 요리
    }
    else if (q.k != null) T.fish[q.k] -= q.n;
    else if (q.hunt) T.hunted -= q.n;
    else if (q.f != null) T.fbag[q.f] -= q.n;
    const card = icon(i);
    T.quests[i] = true;
    T.coins += q.coin;
    r.step = i;                    // 하트를 잠깐 보여 준 뒤 다음 부탁으로
    r.heartT = 2.5;
    drawBubble(r);
    PL.yaw = Math.atan2(r.x - PL.pos.x, r.z - PL.pos.z);
    if (!PL.ride) PLAYER.doAct('wave', 1.0);
    AUD.sfx('new'); setTimeout(() => AUD.sfx('coin'), 350);
    HUD.card(card, L(r.P.ko, r.P.en), 'h');
    HUD.praise('+' + q.coin + ' 🪙');
    ITEMS.checkAll();
    U.save();
  }

  // 할 일이 채워진 집이 있으면 그 집을 가리킨다
  function ready() {
    let best = null, bd = 1e9;
    for (const r of res) {
      const i = curStep(r.p);
      if (i < 0 || T.quests[i] || !has(QUESTS[i])) continue;
      const d = Math.hypot(r.x - PL.pos.x, r.z - PL.pos.z);
      if (d < bd) { bd = d; best = { x: r.x, z: r.z }; }
    }
    return best;
  }
  // 아직 못 채운 부탁들
  function grandma() { const r = res.find(o => o.p === 2); return r ? { x: r.x, z: r.z } : null; }
  function mikSpot() { const r = res.find(o => o.P.id === 'winterboy'); return r ? { x: r.x, z: r.z } : null; }
  function needs() {
    const out = [];
    for (const r of res) { const i = curStep(r.p); if (i >= 0 && !T.quests[i] && !has(QUESTS[i])) out.push(QUESTS[i]); }
    return out;
  }
  function pending() {
    let best = null, bd = 1e9;
    for (const r of res) {
      const i = curStep(r.p);
      if (i < 0 || T.quests[i]) continue;
      const d = Math.hypot(r.x - PL.pos.x, r.z - PL.pos.z);
      if (d < bd) { bd = d; best = { x: r.x, z: r.z }; }
    }
    return best;
  }
  // 도감 카드 그림: i 번 부탁의 말풍선 (하트 말고 물건 그림으로)
  const iconR = { cv: null, tex: {}, step: 0, key: '' };
  function icon(i) {
    if (!iconR.cv) iconR.cv = GEO.canvas(256, 160);
    const done = T.quests[i];
    iconR.step = i;
    T.quests[i] = false; drawBubble(iconR); T.quests[i] = done;
    return iconR.cv.toDataURL();
  }

  function npcPlay(r, k) { play(r, r.body && r.body[k]); }
  window.QUESTS = { npcPlay, build, update, deliver, ready, pending, needs, grandma, icon, gather, say, firstSaleTalk, curStep, mikPend, mikSpot, hint, GOODS, QUESTS, NAMES, PEOPLE, TALK, res, get near() { return near; } };
})();
