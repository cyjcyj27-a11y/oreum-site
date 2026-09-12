// 부동산 — 재벌집 아들의 제주 땅 사기. 섬 전체에 매물을 따로 깔고(관광지와 무관, 이름만 가까운 명소에서 빌린다), 사면 짓고, 지은 건물이 매시간 수입을 낸다. 목표는 제주 전체.
// 돈은 만원 단위(100억 = 1,000,000). 땅값·수입은 자리 등급(1 시골 · 2 바다 조망/마을·명소 근처 · 3 이름난 곳)과 평수, 업종 궁합으로 갈린다 — 처음 투자를 잘해야 한다.
(function () {
  const I = ISLAND, H = I.H, { mergeGeos, T } = GEO;
  const rng = NOISE.makeRng(20260908); const R = () => rng();
  const el = id => document.getElementById(id);
  const E = { list: [], near: null, open: false, cur: null, lastHour: -1, scene: null, gainT: 0, end: false, total: 0, beams: [], pops: [], day: 1 };
  const BSCALE = 1;   // 부지 건물 크기 배수 = 원래 크기. 3배로 키웠던 걸 되돌렸다 (사장님 2026-09-11)
  const START = 1000000;   // 100억
  // 이름난 곳(억, 600평 기준). 이 근처 200m 안 매물은 3등급
  // 이름난 곳(억, 600평 기준). 한라산(백록담·영실)은 국립공원 국유지라 매물이 안 나온다 — 목록에서 뻐다 (사장님 2026-09-10)
  const FAMOUS = { seongsan: 600, jungmun: 480, hyeopjae: 420, shinhwa: 380, hamdeok: 360, seopjikoji: 300, aewol: 260, sanbangsan: 260, cheonjiyeon: 240, udo: 220, woljeong: 220, jeongbang: 200, jusangjeolli: 200, geumneung: 200, yongduam: 180, gwangchigi: 180, songaksan: 170, dongmun: 160, saebyeol: 150, hallim: 150 };
  const TIER_MUL = [0, 1, 3, 8];
  const MAX_LOTS = 31;     // 부지 수 = 건물 표 길이(LV50). 사장님이 표에서 빼면 부지도 준다 (2026-09-10)
  const PSCALE = 0.08;     // 땅값 배율 — 전부 사고 다 지었을 때 1,000억쯤 되게 맞춘 값
  // 업종: 짓는 값, 하루 수입(만원, 등급·궁합 곱하기 전), 어울리는 자리
  // 업종: 짓는 값, 월 수익률(하루 수입 = (땅값+건물값) × 비율 ÷ 30, 궁합 맞는 자리 기준; 안 맞으면 절반), 어울리는 자리. 사장님 2026-09-09: 주택 10 · 편의점 15 · 펜션 20 · 호텔 30 · 나이트클럽 40%(최대), 나머지는 그 이하
  const BUILD = [
    { k: 'house',   ic: '🏠', n: '주택',   cost: 5000,   rate: 0.10, like: ['nature', 'sight', 'city'] },
    { k: 'store',   ic: '🏪', n: '편의점', cost: 12000,   rate: 0.15, like: ['city'] },
    { k: 'cafe',    ic: '☕', n: '카페',   cost: 18000,   rate: 0.12, like: ['nature', 'sight'] },
    { k: 'pension', ic: '🏡', n: '펜션',   cost: 45000,   rate: 0.20, like: ['beach', 'nature'] },
    { k: 'hotel',   ic: '🏨', n: '호텔',   cost: 130000,  rate: 0.30, like: ['sight', 'city'] },
    { k: 'club',    ic: '🪩', n: '나이트클럽', cost: 100000, rate: 0.40, like: ['beach', 'city'], night: true },   // 밤 21~04시에만 돈이 들어온다(그 시간에 몰아서). 사장님 "함덕 앞 호텔 부지에 나이트클럽으로 떼돈"
    { k: 'resort',  ic: '🏖', n: '리조트', cost: 260000, rate: 0.35, like: ['beach'] },
  ];
  const BK = {}; for (const b of BUILD) BK[b.k] = b;
  // 사장님 표(2026-09-10). 땅값 싼 곳부터 1단계, 제일 비싼 함덕이 31단계 나이트클럽.
  // p: 정상 시세(만원, 급매는 그 절반) · c: 건축비 = 시세의 3배 · k: 그릴 모양 · ic: 아이콘 (값 25%로 낮춤, 사장님 2026-09-10)
  const LV50 = [
    { n: '작은 농가주택', p: 10000, c: 30000, k: 'house', ic: '🏠' },   // 1단계
    { n: '소형 카페', p: 17500, c: 52500, k: 'cafe', ic: '☕' },
    { n: '작은 펜션', p: 20000, c: 60000, k: 'pension', ic: '🏡' },
    { n: '제주 식당', p: 25000, c: 75000, k: 'store', ic: '🍚' },
    { n: '승마체험장', p: 30000, c: 90000, k: 'pension', ic: '🐴' },
    { n: '게스트하우스', p: 35000, c: 105000, k: 'pension', ic: '🛏' },
    { n: '소형 상가', p: 45000, c: 135000, k: 'store', ic: '🏪' },
    { n: '흑돼지 식당', p: 55000, c: 165000, k: 'store', ic: '🐷' },
    { n: '애견펜션', p: 65000, c: 195000, k: 'pension', ic: '🐶' },
    { n: '캠핑장', p: 75000, c: 225000, k: 'pension', ic: '⛺' },
    { n: '글램핑장', p: 85000, c: 255000, k: 'pension', ic: '🏕' },
    { n: '대형 카페', p: 95000, c: 285000, k: 'cafe', ic: '☕' },
    { n: '원룸 건물', p: 112500, c: 337500, k: 'hotel', ic: '🏢' },
    { n: '3층 상가', p: 125000, c: 375000, k: 'store', ic: '🏬' },
    { n: '스크린골프장', p: 162500, c: 487500, k: 'store', ic: '⛳' },
    { n: '피트니스센터', p: 175000, c: 525000, k: 'store', ic: '💪' },
    { n: '노래방 건물', p: 187500, c: 562500, k: 'store', ic: '🎤' },
    { n: 'PC방 건물', p: 200000, c: 600000, k: 'store', ic: '🖥' },
    { n: '병원 건물', p: 225000, c: 675000, k: 'hotel', ic: '🏥' },
    { n: '학원 건물', p: 250000, c: 750000, k: 'hotel', ic: '📚' },
    { n: '오피스텔', p: 325000, c: 975000, k: 'hotel', ic: '🏢' },
    { n: '주차빌딩', p: 400000, c: 1200000, k: 'hotel', ic: '🅿' },
    { n: '물류센터', p: 450000, c: 1350000, k: 'store', ic: '📦' },
    { n: '리조트', p: 550000, c: 1650000, k: 'resort', ic: '🏖' },
    { n: '대형 쇼핑몰', p: 650000, c: 1950000, k: 'store', ic: '🛍' },
    { n: '워터파크', p: 700000, c: 2100000, k: 'resort', ic: '🌊' },
    { n: '테마파크', p: 750000, c: 2250000, k: 'resort', ic: '🎢' },
    { n: '대형 리조트', p: 875000, c: 2625000, k: 'resort', ic: '🏝' },
    { n: '대형마트', p: 1250000, c: 3750000, k: 'store', ic: '🛒' },
    { n: '특급호텔', p: 1500000, c: 4500000, k: 'hotel', ic: '🏨' },
    { n: '나이트클럽', p: 1750000, c: 5250000, k: 'club', ic: '🪩' },   // 31단계
  ];
  const lvOf = p => LV50[Math.max(0, Math.min(49, (p.lv || 1) - 1))];
  const TAG_IC = { beach: '🏖', nature: '🌿', city: '🏙', sight: '📷' };

  // 영문판은 억·만 대신 원 단위(₩10B). 사람이 읽는 단위가 다르다
  function fmtEn(v, dec) {
    v = Math.round(v); const s = v < 0 ? '-' : ''; const w = Math.abs(v) * 10000;
    const cut = (n, d) => n.toFixed(d).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');   // 소수점 뒤 0 만 턴다 — 100 을 1 로 만들면 안 된다
    if (w >= 1e9) return s + '₩' + cut(w / 1e9, dec ? 2 : 1) + 'B';
    if (w >= 1e6) return s + '₩' + cut(w / 1e6, dec ? 1 : 0) + 'M';
    return w ? s + '₩' + cut(w / 1e3, 0) + 'K' : '₩0';
  }
  function fmt(v) {
    if (window.LANG && LANG.en) return fmtEn(v);
    v = Math.round(v); const s = v < 0 ? '-' : ''; v = Math.abs(v);
    if (v >= 1e8) return s + (v / 1e8).toFixed(2).replace(/\.?0+$/, '') + '조';
    if (v >= 10000) { const a = v / 10000; return s + (a >= 100 ? Math.round(a) : a.toFixed(1).replace(/\.0$/, '')) + '억'; }
    return s + v.toLocaleString() + '만';
  }
  // 자산 창처럼 자리가 넉넉한 곳에서 쓰는 긴 표기: 365000 → '36억 5천', 1120000 → '112억' (사장님 2026-09-09 "매입가 36억5천")
  function fmtLong(v) {
    if (window.LANG && LANG.en) return fmtEn(v, 1);
    v = Math.round(v); const sg = v < 0 ? '-' : ''; v = Math.abs(v);
    const jo = Math.floor(v / 1e8), r = v % 1e8, eok = Math.floor(r / 10000), man = r % 10000, out = [];
    if (jo) out.push(jo + '조');
    if (eok) out.push(eok + '억');
    if (man) out.push(man % 1000 === 0 ? (man / 1000) + '천' : man.toLocaleString() + '만');
    return sg + (out.join(' ') || '0');
  }
  // ── 시세(사장님 2026-09-09 "전부 가격이 시간 지나면 오르게, 랜덤으로") ──
  // 부지마다 하루 상승폭(rise)이 0.4~3.2% 로 다르다. mk 는 처음 값 대비 배수, 판 값·현재가 계산에 쓴다
  function marketDay() {
    E.day = (E.day || 1) + 1;
    for (const p of E.list) p.mk = Math.min(12, (p.mk || 1) * (1 + p.rise));
    if (E.assetsOpen) openAssets();
    if (window.ACT && ACT.save) ACT.save();   // 하루에 한 번 적어 둔다 — 비운 시간을 재는 기준점이다
  }
  // ── 팔 때 굴리는 가챠 (사장님 2026-09-11) ──
  // 팔기를 누르면 그 자리에서 감정가를 한 번 굴린다. 되돌리기 없다.
  // 굴림 폭은 들고 있던 기간만큼 벌어진다 — 산 그날 팔면 1.0 고정(급매로 샀으면 2배 확정),
  // 1년 들고 있으면 표가 다 열린다. 빈 땅은 좁게, 건물 올린 땅은 넓게.
  const ROLLS = [{ m: 0.5, w: 8 }, { m: 0.7, w: 14 }, { m: 1, w: 30 }, { m: 1.5, w: 26 }, { m: 3, w: 14 }, { m: 5, w: 6 }, { m: 10, w: 2 }];
  const GRADE_CAP = [2, 2, 2, 3, 3, 5, 5, 5, 10, 10];   // 지역 1~10등급이 볼 수 있는 최고 배수
  const HOLD_FULL = 365;                                // 이만큼 들고 있으면 표가 다 열린다(게임일)
  const holdDays = p => Math.max(0, (E.day || 1) - (p.buyDay || E.day || 1));
  const sureSell = p => holdDays(p) < 1;                // 산 그날은 굴림 없이 시세 그대로
  function rollPool(p) {
    const s2 = Math.min(1, holdDays(p) / HOLD_FULL);
    const cap = p.b ? GRADE_CAP[Math.max(0, Math.min(9, (p.grade || 5) - 1))] : 1.5;   // 빈 땅은 1.5배까지
    const lo = p.b ? 0.5 : 0.7;                                                        // 빈 땅은 크게 안 떨어진다(최악 −30%)
    const pool = [];
    for (const r of ROLLS) { if (r.m > cap || r.m < lo) continue; const w = (r.m === 1 ? 1 : s2) * r.w; if (w > 0) pool.push({ m: r.m, w: w }); }
    return pool;
  }
  // 오늘의 감정가 — 한 땅은 하루에 한 번만 굴린다.
  // 값을 보여 주고 팔지 말지 정하게 하되, 마음에 안 들면 다음 날(8분)까지 기다려야 새로 굴린다.
  // 그래야 창을 열었다 닫았다 하며 10배 나올 때까지 다시 누르는 일이 없다 (사장님 2026-09-11)
  function apprise(p) {
    if (sureSell(p)) return 1;                         // 산 그날은 굴림 없이 시세 그대로
    const d = E.day || 1;
    if (!p.apr || p.apr.day !== d) p.apr = { day: d, m: rollMult(p) };
    return p.apr.m;
  }
  const apprPrice = p => Math.max(500, Math.round(sellValue(p) * apprise(p) / 5000) * 5000);
  function rollMult(p) {
    const pool = rollPool(p); let tot = 0; for (const q of pool) tot += q.w;
    if (!tot) return 1;
    let k = Math.random() * tot;
    for (const q of pool) { k -= q.w; if (k <= 0) return q.m; }
    return 1;
  }
  // 현재가의 밑값은 **시세(땅값)** 이다 — 급매로 싸게 샀다고 땅이 싸지는 게 아니다
  const bookValue = p => p.price + (p.b ? lvOf(p).c : 0);
  // 매입가는 **실제로 낸 돈**. 급매 반값·되사기 웃돈이 그대로 남는다 (사장님 2026-09-11 "5천에 샀는데 왜 1억이라고 뜨냐")
  const paidValue = p => (p.paid != null ? p.paid : p.price) + (p.b ? lvOf(p).c : 0);
  const sellValue = p => Math.round(bookValue(p) * (p.mk || 1) / 5000) * 5000;
  // 총자산 = 현금 + 가진 부동산의 현재가. 엔딩(1,000억)은 이 값으로 본다 — 다 팔지 않아도 값이 오르면 닿는다
  // 엔딩은 현금 말고 **부동산만** 1,000억이어야 한다 (사장님 2026-09-11 "부동산으로 1000억을 채워야 엔딩")
  function estateWorth() { let v = 0; for (const p of E.list) if (p.own) v += sellValue(p); return v; }
  function netWorth() { let v = ACT.coins; for (const p of E.list) if (p.own) v += sellValue(p); return v; }            // 현재가 = 매입가 × 시세. 건물도 함께 오른다(값 깎지 않는다)
  function spotTag(s) {
    if (s.beach) return 'beach';
    if (s.kind === 'oreum' || s.kind === 'fly' || s.prop === 'forest' || s.ride === 'walk') return 'nature';
    if (s.kind === 'food' || s.prop === 'market' || s.prop === 'museum') return 'city';
    return 'sight';
  }
  function income(p, b) { return Math.round((p.price + lvOf(p).c) * b.rate / 30); }   // 만원/일 = 투자금(땅값+건축비) × 월 수익률 ÷ 30. 땅마다 건물이 고정이라 궁합은 안 본다
  function ownedCount() { let n = 0; for (const p of E.list) if (p.own) n++; return n; }
  function boughtCount() { let n = 0; for (const p of E.list) if (p.own || p.sold) n++; return n; }   // 100% 는 판 땅도 '사 봤다'로 친다

  // ── 매물 깔기: 섬을 130m 격자로 훑어 한 칸에 하나, 뭍·평지·건물과 길에서 떨어진 곳·길에서 260m 안 ──
  function steep(x, z) { return Math.hypot(H(x + 8, z) - H(x - 8, z), H(x, z + 8) - H(x, z - 8)) / 16 > 0.5; }
  // 매물 이름은 지명에서만 빌린다. 기업·브랜드 이름이 붙은 명소는 후보에서 뺀다 (사장님 2026-09-10)
  // 값 매기는 데는 그대로 쓴다 — 신화월드 옆 땅이 비싼 건 사실이니까
  const BRAND = new Set(['nexon', 'ecoland', 'aquaplanet', 'teddy', 'osulloc', 'innisfree', 'shinhwa',
    'kart_981', 'bontae', 'arte', 'letsrun', 'camellia', 'yeomiji', 'hallimpark', 'folkvillage',
    'maze', 'railbike', 'gotjawal',
    // 기업은 아니지만 지명도 아닌 시설 — 해녀박물관에 나이트클럽은 어울리지 않는다 (사장님 2026-09-10)
    'aerospace', 'haenyeo_museum', 'jeolmul', 'citrusmuseum', 'stonepark', 'horsepark', 'bangju']);
  function genParcels() {
    const B = I.BOUNDS, CP = 130, cand = [];   // 섬이 4.8km 라 130m 격자라야 150곳쯤 나온다
    const spots = ACT.spots.filter(s => !s.islet && s.kind !== 'ferry' && !BRAND.has(s.id));
    const towns = ROADS.towns || [];
    for (let gx = B.x0; gx < B.x1; gx += CP) for (let gz = B.z0; gz < B.z1; gz += CP) {
      const x = gx + 30 + R() * (CP - 60), z = gz + 30 + R() * (CP - 60);
      if (I.coastDist(x, z) < 18 || H(x, z) < 1 || I.inIslet(x, z) || steep(x, z) || H(x, z) > 600) continue;   // 해발 600m 위 = 한라산 국립공원, 매물 없음
      if (PLAYER.insideBox(x, z, 12)) continue;
      const rn = ROADS.nearest(x, z); if (rn.e && rn.d < 9) continue;   // 길 위는 안 된다
      { let rd = 1e9; for (const nd of ROADS.nodes) { if (!nd.out.length) continue; const d = Math.hypot(nd.x - x, nd.z - z); if (d < rd) rd = d; } if (rd > 260) continue; }   // 길에서 260m 안(차로 갈 수 있게)
      // 가장 가까운 명소(이름을 빌린다)와 이름난 곳
      let ns = null, nd = 1e9, fam = null, fd = 1e9;
      for (const s of spots) { const d = Math.hypot(s.x - x, s.z - z); if (d < nd) { nd = d; ns = s; } if (FAMOUS[s.id] && d < fd) { fd = d; fam = s; } }
      let tn = null, td = 1e9; for (const t of towns) { const d = Math.hypot(t.cx - x, t.cz - z); if (d < td) { td = d; tn = t; } }
      const coast = I.coastDist(x, z), inTown = !!(tn && Math.abs(x - tn.cx) < tn.cols * tn.cell / 2 + 60 && Math.abs(z - tn.cz) < tn.rows * tn.cell / 2 + 60);
      const elev = H(x, z);
      // 제주 땅값은 도심 > 이름난 관광지 > 해안가 > 해안 근처 > 벌판 > 중산간 > 산간 순이다.
      // 실제 시세(2026-09-10 조사): 신제주 연동 평당 2,386만 · 월정 해안 460만 · 위미 해안도로 300만 · 중산간 20~40만
      // 도심:해안:중산간 = 80:13:1. 산중턱은 아무도 안 산다 (사장님 2026-09-10)
      let mul = 1;
      if (inTown) mul = 8;                                                   // 도심
      else if (coast < 150) mul = 4;                                         // 해안가
      else if (coast < 400) mul = 2;                                         // 해안 근처
      if (fam && fd < 200) mul = Math.max(mul, 3 + FAMOUS[fam.id] / 120);    // 이름난 관광지는 그 몸값에 비례
      if (elev > 400) mul *= 0.15;                                           // 산간 — 아무도 안 산다
      else if (elev > 150) mul *= 0.4;                                       // 중산간
      const tier = mul >= 5 ? 3 : mul >= 1.5 ? 2 : 1;
      const tag = inTown ? 'city' : coast < 150 ? 'beach' : (ns && nd < 300) ? spotTag(ns) : elev > 150 ? 'nature' : 'sight';
      const area = Math.round((150 + R() * 1850) / 10) * 10;   // 평
      const k = area / 600;
      const price = Math.max(2000, Math.round(PSCALE * 120000 * k * mul * (0.75 + R() * 0.5) / 1000) * 1000);
      cand.push({ x, z, tier, tag, area, price, ns, score: mul + R() * 1.5 });
    }
    cand.sort((a, b) => b.score - a.score);
    // 한 자리에 하나만 — 이호테우 해변이 4개씩 나오던 걸 막는다. 자리마다 점수가 제일 높은 칸만 쓴다 (사장님 2026-09-10)
    const usedSpot = new Set(), uniq = [];
    for (const c of cand) { const key = c.ns ? c.ns.id : '제주'; if (usedSpot.has(key)) continue; usedSpot.add(key); uniq.push(c); }
    const picked = uniq.slice(0, LV50.length);
    // 땅값 싼 곳부터 1단계(작은 농가주택), 제일 비싼 도심·해안가가 50단계(나이트클럽) (사장님 2026-09-10)
    picked.sort((a, b) => a.price - b.price);
    // 지역 등급 1~10 — 팔 때 굴리는 가챠의 상한을 정한다. 31곳을 값 순위대로 고르게 나눈다
    // (제일 싼 땅 = 1등급 최대 2배 · 함덕·중문 같은 끝단 = 10등급 최대 10배)
    picked.forEach((q, i2) => { const lv = LV50[Math.min(i2, LV50.length - 1)]; q.lv = i2 + 1; q.price = lv.p; q.grade = 1 + Math.floor(i2 / LV50.length * 10); });
    // 나이트클럽(50단계)은 함덕해수욕장 자리에 — 바다 끝이면서 제주시가 가깝다 (사장님 2026-09-10)
    { const hd = ACT.spots.find(function (s) { return s.id === 'hamdeok'; });
      if (hd) {
        let near = null, nb = 1e9;
        // 이름까지 '함덕해수욕장'으로 붙는 땅을 고른다(그냥 가까운 땅을 고르면 서우봉으로 불린다)
        for (const q of picked) { if (!q.ns || q.ns.id !== 'hamdeok') continue; const d = Math.hypot(q.x - hd.x, q.z - hd.z); if (d < nb) { nb = d; near = q; } }
        if (!near) for (const q of picked) { const d = Math.hypot(q.x - hd.x, q.z - hd.z); if (d < nb) { nb = d; near = q; } }
        const top = picked.find(function (q) { return q.lv === LV50.length; });
        if (near && top && near !== top) {
          const a = near.lv, b = top.lv;
          const ga = near.grade, gb = top.grade;                    // 등급도 같이 바꾼다 — 함덕 나이트클럽이 끝단이어야 한다
          near.lv = b; near.price = LV50[b - 1].p; near.grade = gb;
          top.lv = a; top.price = LV50[a - 1].p; top.grade = ga;
        }
      } }
    // 이름: 가까운 명소 이름, 겹치면 번호
    const cnt = {}; for (const p of picked) { const nm = p.ns ? p.ns.name : '제주'; cnt[nm] = (cnt[nm] || 0) + 1; }
    const used = {};
    picked.forEach((p, i) => { const nm = p.ns ? p.ns.name : '제주'; used[nm] = (used[nm] || 0) + 1; p.name = cnt[nm] > 1 ? nm + ' ' + used[nm] : nm; p.id = 'p' + i; });
    return picked;
  }

  // ── 표식: 땅 테두리(평수만큼) + 값 팻말 ──
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  // 매물 팻말 — 부동산 앱 말풍선 카드(사장님 그림, 2026-09-09): 흰 카드에 굵은 값 한 줄 + 평수 한 줄, 아래 꼬리. 아이콘은 안 넣는다
  const CARD_INK = { buy: '#1d2a1c', own: '#b8860b', sold: '#8a97a6', deal: '#c82016', rival: '#6d4bd6', warn: '#b45309' };
  function spriteTex(line1, line2, tone) {
    // 글씨를 크게, 여백은 최소로 (사장님 2026-09-11 "여백 존나 많은데", "글씨 큼직하게")
    const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
    g.fillStyle = 'rgba(0,0,0,0.22)'; roundRect(g, 16, 14, 488, 190, 44); g.fill();                // 그림자
    g.fillStyle = '#ffffff'; roundRect(g, 8, 6, 488, 190, 44); g.fill(); g.lineWidth = 5; g.strokeStyle = 'rgba(30,40,50,0.25)'; g.stroke();
    g.beginPath(); g.moveTo(224, 192); g.lineTo(288, 192); g.lineTo(256, 250); g.closePath(); g.fill();   // 꼬리
    g.textAlign = 'center'; g.textBaseline = 'middle';
    // 칸에 꽉 차게 — 길면 글자를 눌러 담는다
    const fit = (txt, px, w) => { g.font = '900 ' + px + 'px "Ria", "Griun", "Malgun Gothic", sans-serif'; const m = g.measureText(txt).width; return m > w ? px * w / m : px; };
    g.fillStyle = CARD_INK[tone] || CARD_INK.buy;
    line1 = L(line1); line2 = L(line2);   // 영문판(?lang=en)
    const s1 = fit(line1, line2 ? 108 : 124, 448);
    g.font = '900 ' + s1 + 'px "Ria", "Griun", "Malgun Gothic", sans-serif';
    g.fillText(line1, 256, line2 ? 76 : 102);
    if (line2) { g.fillStyle = '#4b5563'; const s2 = fit(line2, 74, 448); g.font = s2 + 'px "Griun", "Malgun Gothic", sans-serif'; g.fillText(line2, 256, 158); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const pyeong = p => p.area.toLocaleString() + '평';
  // 팻말엔 그 땅에 지을 수 있는 건물 이름을 준다. 똥이 될지 금이 될지는 지어 봐야 안다 (사장님 2026-09-10)
  const lotName = p => lvOf(p).n + ' 부지';
  function sideOf(p) { return Math.round(Math.sqrt(p.area * 3.3) / 4) * 4; }   // 평 → 한 변(m), 4m 단위
  function refresh(p) {
    const gold = p.own;
    const dl = E.deal && E.deal.p === p ? E.deal : null;
    if (p.sp) { p.sp.material.map.dispose(); p.sp.material.map = p.rival ? spriteTex(RIVAL, lotName(p), 'rival') : p.sold ? spriteTex('SOLD', lotName(p), 'sold') : gold ? spriteTex('내 땅', lotName(p), 'own') : dl ? spriteTex('급매 ' + fmt(dl.price), lotName(p), 'deal') : spriteTex('매매 ' + fmt(p.price), lotName(p), 'buy'); p.sp.material.needsUpdate = true; p.sp.visible = p.sold || !p.b; }
  }
  // SOLD 간판은 건물 안에 묻히지 않게 마당 모서리에 세운다(값 팻말은 부지 한가운데)
  function signAt(p) {
    if (!p.sp) return;
    let x = p.x + (p.side || 16) / 2 - 2, z = p.z + (p.side || 16) / 2 - 2, y = p.y;
    if (p.bm) {
      // 건물은 길가에 붙여 세우므로 부지 한가운데가 아니다. 간판은 건물 상자 바깥, 마당(부지 가운데) 쪽에 꽂는다
      const bb = new THREE.Box3().setFromObject(p.bm), c = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3());
      let dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz);
      if (d < 1) { dx = 1; dz = 0; d = 1; }
      dx /= d; dz /= d;
      const out = Math.max(Math.abs(dx) * sz.x, Math.abs(dz) * sz.z) / 2 + 5;
      x = c.x + dx * out; z = c.z + dz * out; y = bb.min.y;
    }
    p.spBase = y + 13; p.sp.position.set(x, p.spBase, z);
  }
  function addMarker(p) {
    const w = Math.max(12, Math.min(44, sideOf(p))); p.side = w;
    p.sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: spriteTex('매매 ' + fmt(p.price), pyeong(p), 'buy'), transparent: true, depthWrite: false })); p.sp.scale.set(34, 17, 1); p.sp.position.set(p.x, p.y + 20, p.z);   // 크게, 높이 (사장님 2026-09-11 — 조금 올리지 말고 확 키운다) p.sp.renderOrder = 5; E.scene.add(p.sp);
  }

  // ── 건물(코드로 만든 소품): 몸체(정점색) + 간판(글자 캔버스) + 밤에 켜지는 창(발광) + 기단. 정면은 +z, 도로 쪽을 보게 돌린다 ──
  const LIT = new THREE.MeshStandardMaterial({ color: 0xfff2c8, emissive: 0xffd88a, emissiveIntensity: 0.15, roughness: 0.6 });   // 창 불빛(밤에 밝아진다)
  const NEON_M = new THREE.MeshStandardMaterial({ color: 0xff40a0, emissive: 0xff2a90, emissiveIntensity: 1.6, roughness: 0.5 });
  const NEON_C = new THREE.MeshStandardMaterial({ color: 0x40e8ff, emissive: 0x20d8ff, emissiveIntensity: 1.6, roughness: 0.5 });
  // 나이트클럽 조명(사장님 2026-09-09 "번쩍번쩍"): 네온 띠 색이 박자마다 바뀌고, 옥상 서치라이트 빛기둥이 돌아간다. 재질은 클럽끼리 함께 쓴다(한 번에 하나만 고치면 된다)
  const BEAM_M = new THREE.MeshBasicMaterial({ color: 0xff2a90, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const BEAM_C = new THREE.MeshBasicMaterial({ color: 0x20d8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  let BEAM_G = null;
  const beamGeo = () => { if (!BEAM_G) { BEAM_G = new THREE.ConeGeometry(1.7, 22, 12, 1, true); BEAM_G.rotateX(Math.PI); BEAM_G.translate(0, 11, 0); } return BEAM_G; };   // 꼭짓점이 램프, 위로 갈수록 벌어진다
  const CLUB_HUE = [0xff2a90, 0x20d8ff, 0x9a3cff, 0xffd23c, 0x30ff9a];
  const GLASS_M = new THREE.MeshStandardMaterial({ color: 0x6f8fa8, roughness: 0.15, metalness: 0.4, transparent: true, opacity: 0.85 });
  function signTex(text, bg, fg, w, h, font) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = (font || '900 ') + Math.floor(h * 0.62) + 'px "Ria", "Gasoek", "Malgun Gothic", sans-serif'; g.fillText(L(text), w / 2, h / 2 + h * 0.03);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  function signMesh(text, bg, fg, W, Hh, x, y, z, ry, glow) {
    const t = signTex(text, bg, fg, Math.round(W * 64), Math.round(Hh * 64));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W, Hh), new THREE.MeshStandardMaterial({ map: t, emissive: glow ? 0xffffff : 0x000000, emissiveMap: glow ? t : null, emissiveIntensity: glow ? 0.9 : 0, roughness: 0.7, side: THREE.FrontSide }));
    m.position.set(x, y, z); m.rotation.y = ry || 0; return m;
  }
  // 창 격자 무늬(어두운 벽에 노란 창): 호텔·리조트 벽면
  function gridTex(cols, rows, wall, lit) {
    const c = document.createElement('canvas'); c.width = cols * 32; c.height = rows * 32; const g = c.getContext('2d');
    g.fillStyle = wall; g.fillRect(0, 0, c.width, c.height);
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) { g.fillStyle = Math.random() < 0.75 ? lit : '#26303a'; g.fillRect(k * 32 + 6, r * 32 + 6, 20, 18); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function gridWall(W, Hh, cols, rows, x, y, z, ry) {
    const t = gridTex(cols, rows, '#8e949c', '#ffe9a8');
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W, Hh), new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.15, roughness: 0.8 }));
    m.position.set(x, y, z); m.rotation.y = ry || 0; m.userData.lit = true; return m;
  }
  const win = (W, Hh, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(W, Hh), LIT); m.position.set(x, y, z); m.rotation.y = ry || 0; return m; };
  const box = (w, h, d, x, y, z, c) => ({ g: new THREE.BoxGeometry(w, h, d), m: T(x, y, z), c: c || [0.95, 0.95, 0.92] });
  const cyl = (r0, r1, h, x, y, z, c, seg) => ({ g: new THREE.CylinderGeometry(r0, r1, h, seg || 10), m: T(x, y, z), c });
  const GL = [0.3, 0.45, 0.55], ROOF = [0.45, 0.2, 0.15], WOOD = [0.55, 0.4, 0.25], DARK = [0.12, 0.12, 0.14], CONC = [0.55, 0.55, 0.56];
  // 종류별: 몸체 부품 목록과 붙일 것들(간판·창) — 정면 +z
  const KINDS = {
    house: { size: [8, 7], build(G) {   // 주택: 크림색 몸체 + 짙은 지붕 + 문 + 굴뚝 + 창 두 개(밤에 켜짐)
      const WALL = [0.93, 0.88, 0.78], ROOF = [0.36, 0.22, 0.18], DOOR = [0.4, 0.26, 0.16];
      const L = [box(8, 3, 7, 0, 1.5, 0, WALL), box(8.8, 0.5, 7.8, 0, 3.25, 0, ROOF), box(6.4, 0.5, 5.8, 0, 3.75, 0, ROOF), box(4, 0.5, 3.8, 0, 4.25, 0, ROOF), box(0.8, 1.4, 0.8, 2.6, 4.4, -1.5, ROOF), box(1.1, 2.2, 0.12, 0, 1.1, 3.53, DOOR), box(8, 0.3, 7, 0, 0.15, 0, CONC)];
      for (const x of [-2.4, 2.4]) { const w = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 0.1), LIT); w.position.set(x, 1.8, 3.53); G.add(w); }
      return L;
    } },
    store: { size: [9, 7], build(G) {
      const GRN = [0.1, 0.62, 0.32], FR = [0.18, 0.2, 0.22];
      // 몸체 · 초록 띠(3.1~4.0, 네 면 간판 자리) · 지붕 슬래브 · 바닥 · 정면 기둥
      const L = [box(9, 3.6, 7, 0, 1.8, 0), box(9.3, 0.9, 7.3, 0, 3.55, 0, GRN), box(9.4, 0.15, 7.4, 0, 4.07, 0, [0.6, 0.6, 0.62]), box(9, 0.3, 7, 0, 0.15, 0, CONC), box(0.25, 2.6, 0.12, -3.7, 1.3, 3.53, CONC), box(0.25, 2.6, 0.12, 3.7, 1.3, 3.53, CONC)];
      L.push(box(9, 0.22, 0.5, 0, 2.85, 3.62, GRN));   // 차양: 문·창 위, 간판 띠는 가리지 않게
      // 창: 어두운 틀 + 유리(밤에 환하다). ry 로 네 벽 어디든
      const winF = (W, Hh, x, y, z, ry) => { L.push({ g: new THREE.BoxGeometry(W + 0.24, Hh + 0.24, 0.08), m: T(x, y, z, 0, ry || 0), c: FR }); const c = Math.cos(ry || 0), sn = Math.sin(ry || 0); G.add(win(W, Hh, x + sn * 0.05, y, z + c * 0.05, ry)); L.push({ g: new THREE.BoxGeometry(W, 0.06, 0.1), m: T(x + sn * 0.05, y + Hh * 0.18, z + c * 0.05, 0, ry || 0), c: FR }); };
      winF(5.4, 2.0, -1.1, 1.4, 3.52);                       // 정면 큰 유리
      winF(4.4, 1.5, 4.52, 1.7, 0.2, Math.PI / 2);           // 오른쪽 벽
      winF(4.4, 1.5, -4.52, 1.7, 0.2, -Math.PI / 2);         // 왼쪽 벽
      winF(2.2, 1.5, -2.0, 1.7, -3.52, Math.PI); winF(2.2, 1.5, 2.0, 1.7, -3.52, Math.PI);   // 뒷벽 둘
      // 문: 유리 여닫이 두 짝 + 틀 + 손잡이
      L.push(box(1.7, 2.6, 0.1, 2.6, 1.3, 3.53, FR), box(0.06, 2.4, 0.12, 2.6, 1.2, 3.56, FR));
      for (const dx of [-0.4, 0.4]) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 2.36), GLASS_M); d.position.set(2.6 + dx, 1.2, 3.585); G.add(d); L.push(box(0.05, 0.5, 0.05, 2.6 + dx * 0.35, 1.1, 3.64, [0.75, 0.75, 0.78])); }
      L.push(box(0.9, 0.06, 0.06, 2.6, 1.0, 3.62, FR));   // 문 가로 손잡이 바
      // 간판: 네 면 모두 초록 띠 위에, 정면은 '24 편의점'
      G.add(signMesh('24 편의점', '#0e8a44', '#ffffff', 8.9, 0.82, 0, 3.55, 3.67, 0, true));
      G.add(signMesh('편의점', '#0e8a44', '#ffffff', 8.9, 0.82, 0, 3.55, -3.67, Math.PI, true));
      G.add(signMesh('편의점', '#0e8a44', '#ffffff', 6.9, 0.82, 4.67, 3.55, 0, Math.PI / 2, true));
      G.add(signMesh('편의점', '#0e8a44', '#ffffff', 6.9, 0.82, -4.67, 3.55, 0, -Math.PI / 2, true));
      return L; } },
    cafe: { size: [8, 8], build(G) {
      const L = [box(8, 4, 8, 0, 2, 0, WOOD), box(8.6, 0.3, 8.6, 0, 4.1, 0, [0.3, 0.22, 0.15]), box(8, 0.3, 8, 0, 0.15, 0, CONC), box(1.2, 2.3, 0.08, 2.4, 1.15, 4.05, [0.25, 0.18, 0.12]), cyl(0.3, 0.3, 1.6, -2.8, 4.8, -2, [0.35, 0.35, 0.37])];
      L.push(box(6.4, 0.1, 2.4, 0, 2.95, 5.1, [0.85, 0.22, 0.2]), box(0.16, 2.9, 0.16, -3.0, 1.45, 6.2, WOOD), box(0.16, 2.9, 0.16, 3.0, 1.45, 6.2, WOOD));   // 차양·기둥
      for (const x of [-1.8, 1.6]) { L.push(cyl(0.45, 0.45, 0.05, x, 0.75, 5.3, [0.9, 0.9, 0.88], 12), cyl(0.05, 0.08, 0.7, x, 0.4, 5.3, [0.4, 0.4, 0.42], 8)); for (const dz of [-0.7, 0.7]) L.push(box(0.4, 0.05, 0.4, x, 0.45, 5.3 + dz, WOOD), box(0.05, 0.45, 0.05, x, 0.22, 5.3 + dz, [0.4, 0.4, 0.42])); }   // 야외 탁자·의자
      G.add(win(4.4, 1.7, -1.2, 1.6, 4.05)); G.add(win(2.2, 1.4, 0, 1.8, -4.05, Math.PI)); G.add(win(3, 1.4, 4.05, 1.8, 0, Math.PI / 2));
      G.add(signMesh('CAFE', '#3b2a1c', '#ffe9b0', 3.6, 0.9, 0, 3.55, 4.12, 0, true));
      return L; } },
    pension: { size: [11, 9], build(G) {
      const L = [box(11, 4.5, 9, 0, 2.25, 0, [0.96, 0.93, 0.86]), box(11, 0.3, 9, 0, 0.15, 0, CONC), box(1.4, 2.4, 0.1, 0, 1.2, 4.55, WOOD), { g: new THREE.CylinderGeometry(0, 8.6, 3, 4), m: T(0, 6, 0, 0, Math.PI / 4, 0, 1, 1, 0.78), c: ROOF }, box(0.6, 1.2, 0.6, 3.5, 6.2, -1.5, [0.5, 0.3, 0.25])];
      L.push(box(11.4, 0.2, 2.2, 0, 3.0, 5.6, [0.6, 0.45, 0.3]), box(11.4, 0.5, 0.08, 0, 3.4, 6.7, WOOD)); for (const x of [-5.3, -1.8, 1.8, 5.3]) L.push(box(0.16, 3.0, 0.16, x, 1.5, 6.6, WOOD));   // 2층 발코니 겸 현관 지붕
      for (const x of [-3.4, 3.4]) { G.add(win(2.2, 1.6, x, 1.8, 4.56)); G.add(win(2.2, 1.6, x, 1.8, -4.56, Math.PI)); }
      G.add(signMesh('펜션', '#ffffff', '#3b2a1c', 3.2, 0.8, 0, 4.05, 6.75, 0, false));
      for (let k = -5; k <= 5; k += 1) L.push(box(0.1, 0.8, 0.1, k, 0.4, 7.6, [0.9, 0.9, 0.88]));   // 앞 울타리
      L.push(box(11, 0.06, 0.06, 0, 0.7, 7.6, [0.9, 0.9, 0.88]));
      return L; } },
    hotel: { size: [16, 13], build(G) {
      const L = [box(14, 22, 11, 0, 11, 0, [0.9, 0.9, 0.9]), box(15, 1, 12, 0, 22.5, 0, [0.5, 0.5, 0.55]), box(16, 3.5, 13, 0, 1.75, 0, [0.35, 0.3, 0.3]), box(16, 0.3, 13, 0, 0.15, 0, CONC)];
      L.push(box(7, 0.3, 4, 0, 3.4, 7.5, [0.25, 0.25, 0.28]), box(0.25, 3.3, 0.25, -3, 1.65, 9.3, [0.6, 0.6, 0.62]), box(0.25, 3.3, 0.25, 3, 1.65, 9.3, [0.6, 0.6, 0.62]), box(2.6, 2.8, 0.1, 0, 1.4, 6.55, [0.2, 0.25, 0.3]));   // 현관 캐노피·회전문
      G.add(gridWall(13.6, 18, 8, 9, 0, 12.5, 5.52)); G.add(gridWall(13.6, 18, 8, 9, 0, 12.5, -5.52, Math.PI)); G.add(gridWall(10.6, 18, 6, 9, 7.02, 12.5, 0, Math.PI / 2)); G.add(gridWall(10.6, 18, 6, 9, -7.02, 12.5, 0, -Math.PI / 2));
      G.add(signMesh('HOTEL', '#101418', '#ffe08a', 9, 2.2, 0, 24.2, 0.2, 0, true)); G.add(signMesh('HOTEL', '#101418', '#ffe08a', 9, 2.2, 0, 24.2, -0.2, Math.PI, true)); L.push(box(9.2, 2.4, 0.3, 0, 24.2, 0, DARK));
      G.add(win(5.6, 2.4, 0, 1.7, 6.5));
      return L; } },
    club: { size: [17, 14], build(G) {
      const L = [box(16, 7, 13, 0, 3.5, 0, [0.08, 0.08, 0.1]), box(16.6, 0.6, 13.6, 0, 7.2, 0, [0.15, 0.15, 0.18]), box(16, 0.3, 13, 0, 0.15, 0, CONC), box(2.4, 3, 0.1, 0, 1.5, 6.56, [0.35, 0.05, 0.2]), box(5, 0.4, 3, 0, 3.6, 7.6, DARK), { g: new THREE.SphereGeometry(1.1, 12, 10), m: T(0, 10.6, 0), c: [0.85, 0.9, 1.0] }, cyl(0.12, 0.12, 2.6, 0, 8.7, 0, [0.5, 0.5, 0.55], 8)];
      const strip = (W, Hh, x, y, z, ry, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(W, Hh, 0.25), mat); m.position.set(x, y, z); m.rotation.y = ry || 0; G.add(m); };
      strip(12, 0.35, 0, 5.9, 6.65, 0, NEON_C); strip(12, 0.35, 0, 4.7, 6.65, 0, NEON_M); strip(0.35, 6, -7.6, 3, 6.65, 0, NEON_C); strip(0.35, 6, 7.6, 3, 6.65, 0, NEON_M);
      for (let k = 0; k < 5; k++) strip(0.3, 3.5, -6 + k * 3, 5.4, -6.65, Math.PI, k % 2 ? NEON_C : NEON_M);
      G.add(signMesh('CLUB', '#14000c', '#ff3fa8', 8, 2.2, 0, 8.7, 0.2, 0, true)); G.add(signMesh('CLUB', '#14000c', '#ff3fa8', 8, 2.2, 0, 8.7, -0.2, Math.PI, true)); L.push(box(8.2, 2.4, 0.3, 0, 8.7, 0, DARK));
      for (const [bx, dir] of [[-6, 1], [6, -1]]) {   // 옥상 서치라이트: 기울인 빛기둥이 반대 방향으로 돈다
        const piv = new THREE.Group(); piv.position.set(bx, 7.5, 0); piv.userData.beam = dir;
        const bm = new THREE.Mesh(beamGeo(), dir > 0 ? BEAM_M : BEAM_C); bm.rotation.z = dir * 0.5; bm.frustumCulled = false; piv.add(bm); G.add(piv);
        L.push(cyl(0.5, 0.6, 0.7, bx, 7.4, 0, [0.1, 0.1, 0.12], 8));
      }
      return L; } },
    resort: { size: [27, 30], build(G) {
      const L = [box(26, 9, 14, 0, 4.5, 0, [0.97, 0.95, 0.9]), box(27, 0.8, 15, 0, 9.4, 0, [0.6, 0.45, 0.3]), box(26, 0.3, 14, 0, 0.15, 0, CONC), box(22, 0.4, 14, 0, 0.05, 15, [0.85, 0.82, 0.75]), box(20, 0.2, 12, 0, 0.3, 15, [0.2, 0.6, 0.85]), box(3, 3.4, 0.1, 0, 1.7, 7.06, [0.2, 0.25, 0.3])];
      for (const x of [-9, -3, 3, 9]) L.push(cyl(0.15, 0.2, 6, x, 3, 16, WOOD, 6), { g: new THREE.SphereGeometry(1.6, 8, 6), m: T(x, 6.2, 16, 0, 0, 0, 1, 0.35, 1), c: [0.2, 0.55, 0.25] });
      for (const x of [-7, -3.5, 0, 3.5, 7]) L.push(box(1.6, 0.1, 0.6, x, 0.55, 9.2, [0.95, 0.95, 0.9]), box(1.6, 0.6, 0.05, x, 0.8, 9.5, [0.95, 0.95, 0.9]));   // 선베드
      G.add(gridWall(25, 6.4, 12, 3, 0, 5.5, 7.02)); G.add(gridWall(25, 6.4, 12, 3, 0, 5.5, -7.02, Math.PI));
      G.add(signMesh('RESORT', '#ffffff', '#2a6a8a', 12, 2.2, 0, 10.9, 0.2, 0, true)); G.add(signMesh('RESORT', '#ffffff', '#2a6a8a', 12, 2.2, 0, 10.9, -0.2, Math.PI, true)); L.push(box(12.2, 2.4, 0.3, 0, 10.9, 0, [0.35, 0.35, 0.38]));
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), new THREE.MeshStandardMaterial({ color: 0x3ab8e8, emissive: 0x1a6a90, emissiveIntensity: 0.3, roughness: 0.1, metalness: 0.2 })); pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.42, 15); G.add(pool);
      return L; } },
  };
  // 단계별 건물 모양(blds.js) — 31개 부지마다 생김새가 다르다. 없으면 업종 기본 모양으로 돌아간다
  const LVB = window.BLDS ? window.BLDS({ box: box, cyl: cyl, signMesh: signMesh, win: win, gridWall: gridWall, LIT: LIT, GLASS_M: GLASS_M, NEON_M: NEON_M, NEON_C: NEON_C, BEAM_M: BEAM_M, BEAM_C: BEAM_C, beamGeo: beamGeo }) : null;
  E.lit = []; E.bld = []; E.beams = [];
  // 정면이 가장 가까운 길을 보게
  // 가장 가까운 길 위의 점과 그 쪽을 보는 각도. 건물을 길가에 붙여 세울 때 쓴다
  // 바다 쪽을 보는 각도. coastDist 는 뭝으로 들어갈수록 커지므로 그 기울기의 반대쪽이 바다다.
  function seaYaw(x, z) {
    const e = 14;
    const gx = I.coastDist(x + e, z) - I.coastDist(x - e, z);
    const gz = I.coastDist(x, z + e) - I.coastDist(x, z - e);
    const L = Math.hypot(gx, gz);
    if (L < 1e-6) return 0;
    return Math.atan2(-gx / L, -gz / L);   // 로컬 +z(정면)가 바다를 향하게
  }
  function roadSpot(p) {
    const n = ROADS.nearest(p.x, p.z); if (!n.e) return null;
    const e = n.e, dx = e.b.x - e.a.x, dz = e.b.z - e.a.z, L2 = dx * dx + dz * dz || 1; const t = Math.max(0, Math.min(1, ((p.x - e.a.x) * dx + (p.z - e.a.z) * dz) / L2));
    const px = e.a.x + dx * t, pz = e.a.z + dz * t;
    return { x: px, z: pz, w: e.w || 8, yaw: Math.atan2(px - p.x, pz - p.z), d: Math.hypot(px - p.x, pz - p.z) };   // 정면(+z)이 길을 보게
  }
  function faceRoad(p) { const r = roadSpot(p); return r ? r.yaw : 0; }
  function addBuilding(p) {
    const K = (LVB && LVB[p.lv]) || KINDS[p.b]; if (!K) return;
    const G = new THREE.Group(); const parts = K.build(G);
    const [w0, d0] = K.size, w = w0 * BSCALE, d = d0 * BSCALE;
    // 길가에 붙여 세운다(사장님 2026-09-09 "건물이 도로를 접해서"): 길 가장자리에서 건물 깊이 절반 + 3m 만큼 안쪽. 길이 멀면(60m 초과 이동) 부지 자리 그대로
    // 정면은 바다 쪽 — 제주 건물은 바다를 보고 앉는다 (사장님 2026-09-11)
    // 자리는 그대로 길가에 붙이고(아래 rs 이동), 방향만 바다를 보게 돌린다.
    const rs = roadSpot(p); const ry = seaYaw(p.x, p.z);
    const cs = Math.cos(ry), sn = Math.sin(ry);
    // 발자국 아홉 점의 땅 높이차 — 여기가 얼마나 비탈인가
    const dropAt = (x, z) => {
      let a = -1e9, b = 1e9;
      for (const [lx, lz] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2], [0, -d / 2], [0, d / 2], [-w / 2, 0], [w / 2, 0], [0, 0]]) { const gy = H(x + lx * cs + lz * sn, z - lx * sn + lz * cs); a = Math.max(a, gy); b = Math.min(b, gy); }
      return { hi: a, lo: b, gap: a - b };
    };
    // 길가로 당겨 세우되 두 가지를 같이 본다 — **평평한가**, 그리고 **길에서 거기까지 갈 수 있는가**.
    // 예전엔 무조건 길까지 끌고 가서 비자림 집이 95m 떨어진 벼랑(높이차 16m)에 얹혔고
    // (사장님 2026-09-11 "말도 안되는 경사도"), 부지에 그냥 두면 숲 나무에 막혀 구경하러 못 갔다
    // (같은 날 "접근이 안되네"). 그래서 자리마다 점수를 매겨 제일 나은 곳에 앉힌다.
    let bx = p.x, bz = p.z;
    if (rs && rs.d > 1) {
      const want = d / 2 + 3, move = rs.d - want;
      if (move > 0 && move < 130) {
        const ux = (rs.x - p.x) / rs.d, uz = (rs.z - p.z) / rs.d;
        // 길에서 그 자리까지 곧장 갈 때 막히는가. 차를 실제로 막는 건 **소품 충돌상자와 물**이다 —
        // 주행 코드에는 경사 저항이 없어서 어지간한 비탈은 그냥 올라간다. 그래서 steep 은 보지 않는다.
        const reach = (cx, cz) => {
          const n = 16;
          for (let i = 1; i <= n; i++) {
            const t = i / n, x = rs.x + (cx - rs.x) * t, z = rs.z + (cz - rs.z) * t;
            if (H(x, z) < 0.4) return false;                                  // 물·갯바위
            if (PLAYER.insideBox && PLAYER.insideBox(x, z, 1.2, false)) return false;
          }
          return true;
        };
        // 길 쪽으로 훑으면서 **좌우로도** 본다 — 한 줄만 보면 숲이나 벼랑을 피할 길이 없다
        const px = -uz, pz2 = ux;                       // 길 방향과 직각
        let pick = null;
        for (let k = 10; k >= 0; k--) for (let j = -2; j <= 2; j++) {
          const m = move * k / 10, off = j * 12;
          const cx = p.x + ux * m + px * off, cz = p.z + uz * m + pz2 * off;
          const sc = dropAt(cx, cz).gap + (reach(cx, cz) ? 0 : 100) + (move - m) * 0.03 + Math.abs(off) * 0.05;
          if (!pick || sc < pick.sc) pick = { x: cx, z: cz, sc: sc };
        }
        if (pick) { bx = pick.x; bz = pick.z; }
      }
    }
    const D = dropAt(bx, bz); const hi = D.hi, lo = D.lo;
    // 기단이 건물보다 높으면 받침이 아니라 기둥이다 — 건물 높이까지만 세우고 그만큼 땅에 묻는다
    const bh = Math.max(3, Math.min(w0, d0) * 0.6) * BSCALE;   // 발자국이 클수록 기단도 높아도 되지만, 그 이상은 기둥이다
    const gap = Math.min(hi - lo, Math.max(1.2, bh));
    p.y = Math.max(0, lo + gap); const sk = (gap + 1.6) / BSCALE;   // 기단 두께는 로컬 값(건물이 BSCALE 배로 커진다)
    parts.push(box(w0 + 1.2, sk, d0 + 1.2, 0, 0.1 - sk / 2, 0, CONC));   // 기단
    const g = mergeGeos(parts); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 })); m.castShadow = true; m.receiveShadow = true; G.add(m);
    G.traverse(o => { if (o.isMesh && o !== m) { o.castShadow = false; } });
    G.scale.setScalar(BSCALE); G.position.set(bx, p.y, bz); G.rotation.y = ry; E.scene.add(G); p.bm = G; E.bld.push(G);
    G.traverse(o => { if (o.userData.lit) E.lit.push(o.material); if (p.b === 'club' && o.userData.beam) E.beams.push(o); });   // 매 프레임 훑지 않게 미리 모아 둔다
    // 충돌 상자는 발자국 그대로(돌린 네모 감싸기). 예전처럼 max(w,d) 정사각형으로 잡으면
    // 길직한 건물 옆으로 길까지 먹어 차가 밀려난다 (사장님 2026-09-11)
    const cs2 = Math.abs(Math.cos(ry)), sn2 = Math.abs(Math.sin(ry));
    const ew = (w * cs2 + d * sn2) / 2, ed = (w * sn2 + d * cs2) / 2;
    if (PLAYER.addObst) p.ob = PLAYER.addObst({ x0: bx - ew, z0: bz - ed, x1: bx + ew, z1: bz + ed });
    p.bx = bx; p.bz = bz; p.byaw = ry; p.bd = d;   // 정문 앞에 차를 세우려면 자리·방향·깊이가 있어야 한다 (사장님 2026-09-11)
  }
  // 건물을 세우면 그 자리에 있던 차·주인공이 상자 안에 갇힐다. 해안 부지에서는 바다 쪽으로 밀려나 절벽에 끼었다.
  // 길 쪽 뭝으로 빼 준다 (사장님 2026-09-11 "건물 지었더니 바다에 갇힘")
  // 건물을 다 지으면 차를 그 건물 정문 앞에 세운다 — 지은 것을 바로 보게 (사장님 2026-09-11)
  // 건물 정면은 로컬 +z 이라 세상에선 (sin byaw, cos byaw) 쪽. 거기서 깊이 절반만큼 나오면 정문 앞마당이다.
  // 앞이 물이거나 다른 건물에 막힐 때만 옆·뒤로 둘러본다.
  // 지은 건물 정문 앞자리. 정면은 로컬 +z 라 세상에선 (sin byaw, cos byaw) 쪽이다.
  // 거기서 깊이 절반만큼 나오면 정문 앞마당 — 길 위를 먼저 고르고, 막히면 옆·뒤로 둘러본다 (사장님 2026-09-11)
  function frontSpot(p) {
    if (!window.PLAYER || !PLAYER.insideBox || p.bx == null) return null;
    const bx = p.bx, bz = p.bz, ry = p.byaw || 0, half = (p.bd || 12) / 2;
    const dirs = [[Math.sin(ry), Math.cos(ry)]];                                   // 먼저 정문 쪽
    for (let k = 1; k < 12; k++) dirs.push([Math.sin(ry + k * Math.PI / 6), Math.cos(ry + k * Math.PI / 6)]);
    const ok = (x, z) => H(x, z) >= 1.2 && !PLAYER.insideBox(x, z, 1.6);
    const onRoad = (x, z) => { const n = ROADS.nearest(x, z); return n.e && n.d < -1; };   // 길 안쪽
    const scan = needRoad => {
      for (const dir of dirs) for (let r = half + 4; r <= half + 60; r += 2) {
        const x = bx + dir[0] * r, z = bz + dir[1] * r;
        if (!ok(x, z)) continue;
        if (needRoad && !onRoad(x, z)) continue;
        return { x: x, z: z, yaw: Math.atan2(dir[0], dir[1]) };                     // 건물을 바라보고 선다
      }
      return null;
    };
    return scan(true) || scan(false);
  }
  // 클럽 조명: 초당 2.4번(약 144 BPM) 박자로 네온 색·밝기가 바뀌고 빛기둥이 돈다. 낮에는 빛기둥을 끈다
  function clubTick(t) {
    const n = window.SKY ? SKY.night : 0, beat = t * 2.4, hit = Math.pow(1 - (beat % 1), 2);
    const i = Math.floor(beat) % CLUB_HUE.length, j = (i + 2) % CLUB_HUE.length, base = 0.4 + 3 * n;
    NEON_M.color.setHex(CLUB_HUE[i]); NEON_M.emissive.setHex(CLUB_HUE[i]); NEON_M.emissiveIntensity = base * (0.3 + hit);
    NEON_C.color.setHex(CLUB_HUE[j]); NEON_C.emissive.setHex(CLUB_HUE[j]); NEON_C.emissiveIntensity = base * (1 - hit * 0.7);
    if (!E.beams.length) return;
    const on = n > 0.06;
    BEAM_M.color.setHex(CLUB_HUE[i]); BEAM_M.opacity = 0.3 * n * (0.5 + hit * 0.7);
    BEAM_C.color.setHex(CLUB_HUE[j]); BEAM_C.opacity = 0.3 * n * (0.9 - hit * 0.5);
    for (const piv of E.beams) { piv.visible = on; if (on) piv.rotation.y = t * piv.userData.beam * 1.3; }
  }
  // 멀리 있는 건물은 아예 그리지 않는다(155채가 다 서면 무겁다). 0.4초마다 확인
  let cullT = 0;
  function cullTick(dt) {
    cullT += dt; if (cullT < 0.4) return; cullT = 0;
    const px = PLAYER.x, pz = PLAYER.z;
    for (const p of E.list) {
      if (!p.bm) continue;
      const on = Math.abs(p.x - px) + Math.abs(p.z - pz) < 1100;
      if (p.bm.visible !== on) p.bm.visible = on;
    }
  }
  function litTick() {
    const n = window.SKY ? SKY.night : 0; const v = 0.15 + 1.6 * n;
    LIT.emissiveIntensity = v;
    const w = 0.1 + 1.2 * n; for (const m of E.lit) m.emissiveIntensity = w;
  }

  // ── 자리를 비운 사이 ──
  // 게임 하루가 8분이라 실제 1시간이면 게임 7.5일이 간다.
  // 그대로 주면 하룻밤에 반년이 지나 시세가 천장(12배)을 친다.
  // 비운 시간만큼 날짜를 밀되 최대 게임 7일(실제 56분)까지만 쳐 준다 (사장님 2026-09-11)
  const OFF_DAYS = 7;
  function catchUp(atMs) {
    if (!atMs || !isFinite(atMs)) return;
    const dayMs = (window.SKY ? SKY.dayLen : 480) * 1000;
    const n = Math.min(OFF_DAYS, Math.floor((Date.now() - atMs) / dayMs));
    if (n < 1) return;
    let paid = 0;
    for (let k = 0; k < n; k++) {
      E.rent = (E.rent || 0) + Math.round(dayIncome());          // 하루치를 월세 통에
      E.day = (E.day || 1) + 1;
      for (const p of E.list) p.mk = Math.min(12, (p.mk || 1) * (1 + p.rise));   // 땅값도 하루치씩 오른다
      if ((E.day - 1) % MONTH === 0) { const sum = Math.round(E.rent || 0); E.rent = 0; if (sum > 0) { ACT.coins += sum; paid += sum; } }
    }
    E.awayN = n; E.awayGain = paid;                              // 카드는 게임이 시작된 뒤에 띄운다
    ACT.save(); ACT.hud();
  }

  // ── 저장 ──
  function state() { const own = [], sold = [], b = {}, mk = {}, rv = [], bd = {}, ap = {}, pd = {}; for (const p of E.list) { if (p.own) own.push(p.id); if (p.sold) sold.push(p.id); if (p.rival) rv.push(p.id); if (p.b) b[p.id] = p.b; if (p.mk && Math.abs(p.mk - 1) > 1e-6) mk[p.id] = +p.mk.toFixed(4); if (p.own && p.buyDay) bd[p.id] = p.buyDay; if (p.own && p.paid != null) pd[p.id] = p.paid; if (p.own && p.apr) ap[p.id] = [p.apr.day, p.apr.m]; } return { own, sold, b, mk, rv, bd, ap, pd, day: E.day || 1, rent: Math.round(E.rent || 0), end: E.end, v: 2, at: Date.now() }; }   // at: 마지막 저장 시각(부재 중 정산용)
  function init(scene) {
    E.scene = scene;
    for (const p of genParcels()) { p.y = Math.max(0, H(p.x, p.z)); p.own = false; p.b = null; p.ph = R() * 6; p.icon = '🏷'; p.mk = 1; p.rise = 0.004 + R() * 0.028; /* 하루 0.4~3.2% 오른다 */ addMarker(p); E.list.push(p); }
    E.total = E.list.reduce((a, p) => a + p.price, 0);
    let j = {}; try { j = JSON.parse(localStorage.getItem('jeju.prog') || '{}'); } catch (e) {}
    if (j.est && j.est.v === 2) {
      const own = new Set(j.est.own || []), sold = new Set(j.est.sold || []), rv = new Set(j.est.rv || []); E.end = !!j.est.end; E.day = j.est.day || 1; E.rent = j.est.rent || 0;
      for (const p of E.list) { if (own.has(p.id)) p.own = true; if (sold.has(p.id)) p.sold = true; if (rv.has(p.id)) p.rival = true; if (j.est.mk && j.est.mk[p.id]) p.mk = j.est.mk[p.id]; if (j.est.bd && j.est.bd[p.id]) p.buyDay = j.est.bd[p.id]; if (j.est.pd && j.est.pd[p.id] != null) p.paid = j.est.pd[p.id]; if (j.est.ap && j.est.ap[p.id]) p.apr = { day: j.est.ap[p.id][0], m: j.est.ap[p.id][1] }; const b = j.est.b && j.est.b[p.id]; if (b && BK[b]) { p.b = b; addBuilding(p); } if (p.sold) signAt(p); refresh(p); }
      catchUp(j.est.at);                                  // 비운 사이 지난 날짜·월세·시세 정산
    } else if (!j.est) { if (!(ACT.coins > 0)) ACT.coins = START; ACT.save(); }   // 첫 시작: 100억. 이미 돈이 있는 옛 저장(땅 기록 없던 판)에는 더 얹지 않는다 — 200억이 되던 문제
    E.lastHour = Math.floor(SKY.hour);
    // 시험용: 주소 뒤 ?fill=1 이면 모든 땅을 사고 자리에 어울리는 건물을 세운다(완성된 모습 보기). 이 모드에선 저장하지 않아 원래 진행이 안 덮인다
    try { if (new URLSearchParams(location.search).get('fill')) fillAll(); } catch (e) { console.warn('fill', e); }
    // 시험용: 주소 뒤 ?cash=1000 이면 그만큼(억) 들고 시작한다. 사장님이 직접 돌려 볼 때 쓴다 (2026-09-11)
    // 처음부터 1,000억이면 그 자리에서 엔딩 전화가 울리므로 이정표 전화는 이미 받은 것으로 해 둔다
    try {
      const q = new URLSearchParams(location.search).get('cash');
      if (q && window.ACT) {
        const eok = parseFloat(q); if (isFinite(eok) && eok > 0) ACT.coins = Math.round(eok * 10000);
        if (netWorth() >= 10000000) { ACT.calls = Object.assign({}, ACT.calls, { m150: 1, m300: 1, m600: 1, rich: 1 }); E.end = true; }
        ACT.save(); ACT.hud();
      }
    } catch (e) { console.warn('cash', e); }
    ACT.hud();
  }
  // 시험용: 주소 뒤 ?fill=1 이면 31곳을 모두 사서 건물까지 올린 모습을 보여 준다(완성된 섬 보기).
  // 이 판은 저장하지 않는다 — 원래 진행을 덮지 않게 ACT.save 를 막아 둔다
  function fillAll() {
    if (window.ACT) { ACT.save = function () {}; ACT.coins = 500000; ACT.calls = { m150: 1, m300: 1, m600: 1, rich: 1 }; }   // 이정표 전화·엔딩은 건너뛴다
    E.end = true;
    for (const p of E.list) { p.own = true; p.sold = false; p.rival = false; p.buyDay = 1; p.b = lvOf(p).k; addBuilding(p); refresh(p); }
    hud();
  }
  // 팔기: 오른 시세대로 받는다. 건물은 그대로 서 있고 SOLD 간판이 붙는다(사장님 2026-09-09) — 내 자산·수입에서는 빠진다
  function sell(p) {
    const mult = apprise(p);
    const v = apprPrice(p);
    ACT.coins += v;
    p.own = false; p.sold = true;
    signAt(p);
    refresh(p);
    ACT.save(); ACT.hud(); hud(); AUDIO.stamp();
    rollCard(p, v, mult);
    openAssets();
  }
  // 감정가가 드르르 돌다 멈춘다 — 굴렸다는 게 눈에 보여야 한다
  function rollCard(p, v, mult) {
    const stamp = mult >= 5 ? '대박' : mult >= 1.5 ? '이득' : mult === 1 ? 'SOLD' : '손해';
    card('💸', p.name, '+' + fmt(v), stamp);
  }
  // 감정할 때 단추에서 숫자가 드르르 돌다 멈춘다 — 굴렸다는 게 눈에 보여야 한다
  function spin(btn, p, v, tail) {
    const base = sellValue(p); let n2 = 0;
    const tm = setInterval(function () {
      n2++;
      if (n2 >= 7) { clearInterval(tm); btn.textContent = fmt(v) + tail; AUDIO.coin(2); return; }
      btn.textContent = fmt(base * ROLLS[Math.floor(Math.random() * ROLLS.length)].m) + tail;
      AUDIO.ping(520 + n2 * 70);
    }, 110);
  }
  function openAssets() {
    const own = E.list.filter(p => p.own);
    let paid = 0, now = 0, day = 0; const kinds = {};
    for (const p of own) { paid += paidValue(p); now += sellValue(p); if (p.b) { day += income(p, BK[p.b]); kinds[p.b] = (kinds[p.b] || 0) + 1; } }
    const up = paid ? Math.round((now / paid - 1) * 100) : 0;
    const badge = BUILD.filter(b => kinds[b.k]).map(b => b.ic + ' ' + b.n + ' ' + kinds[b.k]).join('  ');
    el('assetSum').innerHTML = '<div>🏝 땅 <b>' + own.length + '</b> / ' + E.list.length + '</div><div>🏗 건물 <b>' + Object.values(kinds).reduce((a, b) => a + b, 0) + '</b></div>' +
      '<div>💼 매입가 <b>' + fmtLong(paid) + '</b></div><div>💎 현재가 <b>' + fmtLong(now) + '</b> <span class="' + (up >= 0 ? 'up' : 'dn') + '">' + (up >= 0 ? '▲' : '▼') + Math.abs(up) + '%</span></div>' +
      '<div>📈 월세 <b>' + fmtLong(day * MONTH) + '</b> <span class="up">' + rentIn() + '일 뒤</span></div><div style="flex:1 0 100%">🏆 부동산 <b>' + fmtLong(estateWorth()) + '</b> / 1,000억</div>' + (badge ? '<div style="flex:1 0 100%">' + badge + '</div>' : '');
    const list = el('assetList'); list.innerHTML = '';
    if (!own.length) list.innerHTML = '<div class="none">아직 산 땅이 없다</div>';
    own.slice().sort((a, b) => sellValue(b) - sellValue(a)).forEach(p => {
      const b = p.b ? BK[p.b] : null, lv = lvOf(p), inc = b ? income(p, b) : 0;
      const paid1 = paidValue(p), now1 = sellValue(p), up1 = Math.round((now1 / paid1 - 1) * 100);
      const c2 = document.createElement('div'); c2.className = 'card';
      c2.innerHTML = '<div class="ic2">' + (b ? lv.ic : '🏷') + '</div>' +
        '<div class="nm"><b>' + p.name + '</b><span>' + TAG_IC[p.tag] + ' ' + p.area.toLocaleString() + '평 · ' + (b ? lv.n : lv.n + ' 부지') + (b ? ' · 월세 ' + fmtLong(inc * MONTH) : '') + '</span></div>' +
        '<div class="rt"><b>' + fmtLong(now1) + '</b><span>매입가 ' + fmtLong(paid1) + ' <i class="' + (up1 >= 0 ? 'up' : 'dn') + '">' + (up1 >= 0 ? '▲' : '▼') + Math.abs(up1) + '%</i></span></div>' +
        '<button class="sell" data-id="' + p.id + '">팔기</button>';
      list.appendChild(c2);
    });
    list.querySelectorAll('button.sell').forEach(bt => bt.addEventListener('click', () => {
      const p = E.list.find(x => x.id === bt.dataset.id); if (!p) return;
      if (bt.dataset.ok) { sell(p); return; }
      list.querySelectorAll('button.sell').forEach(o => { delete o.dataset.ok; o.textContent = '팔기'; o.classList.remove('ask'); });
      const fresh = !sureSell(p) && !(p.apr && p.apr.day === (E.day || 1));   // 오늘 처음 감정하는가
      const v = apprPrice(p);                                                 // 오늘의 감정가(하루에 한 번만 굴린다)
      bt.dataset.ok = '1'; bt.classList.add('ask');
      if (fresh) spin(bt, p, v, '에 팔기?'); else bt.textContent = fmt(v) + '에 팔기?';
      setTimeout(() => { if (bt.dataset.ok) { delete bt.dataset.ok; bt.textContent = '팔기'; bt.classList.remove('ask'); } }, 9000);
    }));
    el('assets').classList.add('show'); E.assetsOpen = true;
  }
  function closeAssets() { el('assets').classList.remove('show'); E.assetsOpen = false; }
  function hud() { const l = el('land'); if (l) l.textContent = ownedCount() + '/' + E.list.length; }

  // ── 매시간 수입 ──
  function gain(text) { const g = el('gain'); if (!g) return; g.textContent = text; g.classList.remove('on'); void g.offsetWidth; g.classList.add('on'); E.gainT = 1.8; }
  // 수입은 한 시간마다 찔끔 들어오지 않는다. 하루치를 모아 두었다가 **달이 바뀔 때 월세로 한 번에** 들어온다.
  // (사장님 2026-09-10) 한 달 = 30일, 게임 속 하루는 8분이라 실제로는 4시간에 한 번이다.
  // 버는 총액은 예전과 같다 — 들어오는 방식만 바뀐 것.
  const MONTH = 30;
  function tickHour() {
    const h = Math.floor(SKY.hour); if (h === E.lastHour) return; const prev = E.lastHour; E.lastHour = h;
    if (prev <= h) return;
    E.rent = (E.rent || 0) + Math.round(dayIncome());   // 하루치를 월세 통에 넣는다
    marketDay();                                        // 자정을 넘었다 = 하루가 지났다 → 시세가 오른다
    if ((E.day - 1) % MONTH !== 0) return;              // 매달 1일에만 준다
    const sum = Math.round(E.rent || 0); E.rent = 0;
    if (sum < 1) return;
    ACT.coins += sum; ACT.save(); ACT.hud();
    gain('월세 +' + fmt(sum)); popCoins();
    if (window.PET && PET.gfSay) setTimeout(function () { PET.gfSay('rent'); }, 2200);
    AUDIO.coin(Math.min(4, 1 + Math.floor(sum / 20000)));
  }
  // 이번 달 며칠째인가 / 다음 월세까지 며칠인가
  function monthDay() { return ((E.day - 1) % MONTH) + 1; }
  function monthNo() { return Math.floor((E.day - 1) / MONTH) + 1; }
  function rentIn() { return MONTH - monthDay() + 1; }
  function dayIncome() { let sum = 0; for (const p of E.list) if (p.own && p.b) sum += income(p, BK[p.b]); return sum; }

  // ── 매 프레임: 가까운 매물 → 단추 ──
  // ── 복덕방 하르방 급매 전화 ──
  // 하르방이 전화를 걸어 급매가 나왔다고 알려 준다. 시간 안에 그 땅에 닿아 사면 반값, 늦으면 탐라국개발이 가져간다.
  // 라디오 속보를 전화로 바꿈 — 소식을 전해 주는 사람이 있어야 달려갈 맛이 난다 (사장님 2026-09-10)
  // 넓은 섬을 달릴 이유를 만들고, 비어 있던 1분 간격에 긴장과 해소를 넣는다 (사장님 2026-09-10)
  const DEAL_SEC = 75, DEAL_GAP = [210, 420];   // 못 잴 때 쓰는 기본값, 다음 속보까지(3분30초~7분). 자주 뜨면 속보가 아니라 평상시
  // 제한시간은 **길 거리 ÷ 119km/h + 4초** 뿐이다. 코너 한계속도까지 재던 물리 모형을 뺐다
  // — 계산이 곧 속도 제한처럼 굴어 여유가 너무 컸다 (사장님 2026-09-12 "속도제한을 두지 말고 시간을 짧게 잡으라고").
  // 오픈카 최고속도가 198km/h 라 밟으면 닿고, 머뭇거리면 놓친다. 놓친 땅은 되사기(1.5배)로 살 수 있다.
  const DEAL_SPEED = 33, DEAL_MIN = 25, DEAL_MAX = 180, DEAL_PARK = 4;   // m/s · 초
  // 급매와 '곷 팔림'이 각자 돌아서 급매를 사자마자 또 떴다. 하나가 끝나면 한동안 조용하게 한다 (사장님 2026-09-10)
  const QUIET_SEC = 60;
  // 하르방 전화 대사 — {n} 땅 이름 · {b} 지을 건물 · {v} 급매가 · {p} 정상 시세
  const DEAL_LINES = [
    '허허, 총각! {n}에 {b} 급매 나왔어. {v}에 준대. 얼른 오게!',
    '여보세, {n} 땅 임자가 급해졌다는구먼. {b} 자리가 {v}여. 반값이여.',
    '복덕방이여. {n}에 {v}짜리 급매가 들어왔는디, 생각 있나?',
    '허허허, 자네 주려고 제일 먼저 전화했어. {n} {b} 부지, 원래 {p}인디 {v}에 내놓았어.',
    '자네 지금 어디에 있나? {n}에 {v} 급매여. 말 나오면 금방 빠져.',
    '허허, {n} 땅값이 {v}까지 내려갔어. {b} 올리면 딱이여.',
    '급하게 돈이 필요한 집이 있어. {n} {b} 부지, {v}. 오늘 안 오면 끝이여.',
    '허허, 이런 건 일 년에 한 번 나올까 말까. {n}, {v}. 놓치면 손해여.',
    '{n}에 임자가 서울 올라간다고 {v}에 내놓았어. 다른 사람도 전화 돌리는 중이여.',
    '자네한테만 먼저 알려주는 거여. {n} {b} 자리, {v}. 탐라국개발이 냄새 맡기 전에 오게.',
  ];
  const DEAL_CALL = DEAL_LINES.map(function (t) { return function (n, b, v, p) { return t.replace('{n}', n).replace('{b}', b).replace('{v}', v).replace('{p}', p); }; });
  // 제한시간 = 그 땅까지 **길 거리** ÷ DEAL_SPEED + 주차 몫. 75초 고정이던 때는 거리를 안 봐서
  // 먼 곳이 아무리 밟아도 못 닿았다(사장님 2026-09-11). 거리로 재면 멀수록 길게, 가까우면 짧게 잡힌다.
  function dealSec(p) {
    const R = window.ROADS, rt = R && R.route && R.route(PLAYER.x, PLAYER.z, p.x, p.z);
    let L = 0;
    if (rt && rt.length > 1) { for (let i = 1; i < rt.length; i++) L += Math.hypot(rt[i].x - rt[i - 1].x, rt[i].z - rt[i - 1].z); }
    else L = Math.hypot(p.x - PLAYER.x, p.z - PLAYER.z) * 1.3;   // 길을 못 찾으면 직선 거리에 굽이 몫만 얹는다
    return Math.max(DEAL_MIN, Math.min(DEAL_MAX, Math.round(L / DEAL_SPEED + DEAL_PARK)));
  }
  function dealSpawn() {
    // 급매는 **1단계부터 순차적으로** 뜨다 (사장님 2026-09-11).
    // 이미 산 땅·팔린 땅·건물 올린 땅은 건너뛰므로, 하나씩 치우면 그다음 단계가 나온다.
    const cand = E.list.filter(function (p) { return !p.own && !p.sold && !p.b; });
    if (!cand.length) return false;
    cand.sort(function (a, b) { return a.lv - b.lv; });
    const p = cand[0];
    E.deal = { p: p, left: dealSec(p), price: Math.max(500, Math.round(p.price / 2 / 500) * 500), was: ACT.dest };
    refresh(p);
    ACT.setDest(p);                                   // 큰 화살표가 그쪽을 가리킨다
    AUDIO.init(); AUDIO.ping(1180); setTimeout(function () { AUDIO.ping(1180); }, 260);   // 전화벨
    const f = DEAL_CALL[Math.floor(Math.random() * DEAL_CALL.length)];
    if (window.PET && PET.say) PET.say('📞 복덕방', f(p.name, lvOf(p).n, fmt(E.deal.price), fmt(p.price)), 6.4, true);
    el('deal').classList.add('show');
    return true;
  }
  function dealEnd(bought) {
    const d = E.deal; if (!d) return;
    E.deal = null;
    el('deal').classList.remove('show');
    // 놓첼을 땐 목적지를 그 땅에 그대로 둔다 — 탐라국개발한테 되사고 복덕방 하르방도 거기 서 있다.
    // 예전엕 급매가 끝나면 네비가 그냥 꺼져 가던 길을 잃었다 (사장님 2026-09-11)
    // 새다면 급매 전에 보던 목적지(was)로 되돌린다.
    if (bought && ACT.dest === d.p) {
      ACT.clearDest();                                                    // 지금 것 해제
      if (d.was && d.was !== d.p && !d.was.sold) ACT.setDest(d.was);      // 원래 가던 곳으로
    }
    // 시간 안에 못 가면 탐라국개발이 낚아챈다. 그냥 사라지면 놓친 게 아깝지가 않다 (사장님 2026-09-10)
    if (!bought && !d.p.own && !d.p.sold && !d.p.b) {
      const taken = E.list.filter(function (p) { return p.rival; }).length;
      if (taken < E.list.length * RIVAL_MAX) {
        d.p.sold = true; d.p.rival = true; signAt(d.p);
        card(BLD_IC, d.p.name, fmt(d.p.price), RIVAL); AUDIO.ping(200);
        // 놓친 그 순간에 알려 준다. 딱지만 뜨면 뭘 놓쳤는지 모르고 지나간다 (사장님 2026-09-11)
        hint(RIVAL + '이 먼저 사갔습니다. 아깝네요'); ACT.hintT = 3.6;
        // 여자친구 대사는 복덕방 할아버지가 한마디 한 다음에 받는다 (사장님 2026-09-10)
        if (window.PET && PET.brokerAt) PET.brokerAt(d.p.x + 3, d.p.z + 3);   // 복덕방 할아버지가 그 앞에 서 있는다
      }
    }
    refresh(d.p);
    if (!bought) AUDIO.ping(300);
    E.dealT = DEAL_GAP[0] + Math.random() * (DEAL_GAP[1] - DEAL_GAP[0]);
    E.quiet = QUIET_SEC;
  }
  function dealTick(dt) {
    if (E.deal) {
      E.deal.left -= dt;
      if (E.deal.left <= 0) { dealEnd(false); return; }
      const s = Math.max(0, Math.floor(E.deal.left));
      el('deal').innerHTML = '📞 급매 <b>' + E.deal.p.name + '</b> ' + lvOf(E.deal.p).n + ' ' + fmt(E.deal.price) +
        ' <span class="t">' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + '</span>';
      return;
    }
    if (E.quiet > 0) E.quiet -= dt;
    if (E.quiet > 0) return;                        // 속보 하나가 끝나면 한동안 조용하다 — 급매는 순차적으로 하나씩만 뜬다
    E.dealT = (E.dealT == null ? 40 : E.dealT) - dt;   // 첫 급매는 40초 안에 — 첫날부터 종잣돈 쓸 데가 있어야 한다
    if (E.dealT <= 0) { if (!dealSpawn()) E.dealT = 20; }
  }

  // ── 라이벌: 탐라국개발 ──
  // 급매가 떴을 때 내가 시간 안에 못 가면 탐라국개발이 그 반값에 사간다. 그게 전부다.
  // 예전엔 '곧 팔림' 예고가 급매와 따로 돌아서 급매를 사자마자 또 떴다 — 통째로 뺐다 (사장님 2026-09-10)
  const RIVAL = '탐라국개발', RIVAL_MAX = 0.4;   // 탐라국개발이 가져가는 땅은 전체의 40% 까지
  const BLD_IC = '🏢';

  // ── 월세 날: 내 건물마다 동전이 튀어오른다 ──
  // 숫자만 오르면 손에 잡히는 게 없다. 눈앞 건물에서 동전이 뛰어야 번 것 같다 (사장님 2026-09-10)
  let COIN_TEX = null;
  function coinTex() {
    if (COIN_TEX) return COIN_TEX;
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    g.beginPath(); g.arc(32, 32, 27, 0, 6.29); g.fillStyle = '#d9a520'; g.fill();
    g.lineWidth = 4; g.strokeStyle = '#8a6410'; g.stroke();
    g.beginPath(); g.arc(32, 32, 20, 0, 6.29); g.strokeStyle = '#f2d67a'; g.lineWidth = 3; g.stroke();
    g.beginPath(); g.arc(24, 24, 7, 0, 6.29); g.fillStyle = 'rgba(255,255,255,0.55)'; g.fill();
    COIN_TEX = new THREE.CanvasTexture(c); COIN_TEX.colorSpace = THREE.SRGBColorSpace; return COIN_TEX;
  }
  function popCoins() {
    const hp = (window.PET && PET.onFoot) ? PET.hero() : PLAYER;
    const mine = E.list.filter(function (p) { return p.own && p.b && Math.hypot(p.x - hp.x, p.z - hp.z) < 450; });
    mine.sort(function (a, b) { return Math.hypot(a.x - hp.x, a.z - hp.z) - Math.hypot(b.x - hp.x, b.z - hp.z); });
    for (const p of mine.slice(0, 14)) {
      for (let k = 0; k < 3; k++) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: coinTex(), transparent: true, depthWrite: false }));
        sp.scale.set(1.6, 1.6, 1); sp.renderOrder = 6;
        sp.position.set(p.x + (Math.random() - 0.5) * 4, p.y + 6 + Math.random(), p.z + (Math.random() - 0.5) * 4);
        E.scene.add(sp);
        E.pops.push({ sp: sp, t: -k * 0.12, v: 2.6 + Math.random() * 0.8 });
      }
    }
  }
  function popTick(dt) {
    if (!E.pops.length) return;
    for (let i = E.pops.length - 1; i >= 0; i--) {
      const o = E.pops[i]; o.t += dt;
      if (o.t < 0) { o.sp.visible = false; continue; }
      o.sp.visible = true;
      o.v -= 5.2 * dt; o.sp.position.y += o.v * dt;
      o.sp.material.opacity = o.t > 0.9 ? Math.max(0, 1 - (o.t - 0.9) / 0.5) : 1;
      if (o.t > 1.4) { E.scene.remove(o.sp); o.sp.material.dispose(); E.pops.splice(i, 1); }
    }
  }

  function update(dt, t) {
    if (E.awayN && window.__jj && __jj.started && __jj.started()) { const n = E.awayN, g = E.awayGain; E.awayN = 0; E.awayGain = 0;
      card('🗓️', '자리를 비운 사이 ' + n + '일', g > 0 ? '+' + fmt(g) : '월세 ' + fmt(E.rent), '정산'); AUDIO.coin(2); }
    tickHour(); litTick(); clubTick(t); cullTick(dt); popTick(dt);
    dealTick(dt);
    if (E.gainT > 0) { E.gainT -= dt; if (E.gainT <= 0) { const g = el('gain'); if (g) g.classList.remove('on'); } }
    const hp = (window.PET && PET.onFoot) ? PET.hero() : PLAYER;
    let best = null, bd = 1e9;
    for (const p of E.list) {
      if (p.sp.visible) { const d2 = (p.x - hp.x) * (p.x - hp.x) + (p.z - hp.z) * (p.z - hp.z); if (d2 < 640000) p.sp.position.y = (p.spBase != null ? p.spBase : p.y + 20) + Math.sin(t * 2 + p.ph) * 0.5; }
      const d = Math.hypot(p.x - hp.x, p.z - hp.z), rr = p.side / 2 + 12; if (d < rr && d < bd) { bd = d; best = p; }
      // 탐라국개발한테 넘어간 땅에 처음 가면 복덕방 하르방이 서 있다가 한마디 한다.
      // 예전엔 급매가 끝나는 그 순간에만 세워 둔데다 4분 뒤 사라져서, 뒤늦게 가 보면 아무도 없었다 (사장님 2026-09-11)
      if (p.rival && !p.b && !p.met && d < 45) { p.met = 1; if (window.PET && PET.brokerAt) PET.brokerAt(p.x + 3, p.z + 3); }
    }
    E.near = ACT.cur ? null : best;
    // 사고 나면 짓기 옆에 팔기도 같이 띄운다 — 자산 창을 안 열어도 팔 수 있게 (사장님 2026-09-11)
    const s2 = el('act2');
    if (s2) {
      const sellable = E.near && E.near.own && !E.near.sold && PLAYER.kmh < 12 && PLAYER.mode === 'ground' && !ACT.cur && !E.open && !E.assetsOpen;
      if (sellable) { if (E.askSell !== E.near.id) { s2.textContent = '💸 팔기'; s2.classList.remove('ask'); } s2.classList.add('show'); }
      else { s2.classList.remove('show'); s2.classList.remove('ask'); E.askSell = null; }
    }
    if (!E.near || ACT.near) return;
    const b = el('act');
    const dl2 = E.deal && E.deal.p === best ? E.deal : null;
    if (best.rival && !best.b && PLAYER.kmh < 12 && PLAYER.mode === 'ground') { b.textContent = '🏢 되사기 · ' + fmt(backPrice(best)); b.classList.add('show'); return; }
    if (!best.b && !best.sold && PLAYER.kmh < 12 && PLAYER.mode === 'ground') { b.textContent = !best.own ? (dl2 ? '📞 급매 · ' + fmt(dl2.price) + ' · ' + lotName(best) : '🏷 매입 · ' + fmt(best.price) + ' · ' + lotName(best)) : '🏗 짓기 · ' + lvOf(best).n; b.classList.add('show'); }
  }

  // ── 카드(도장) ──
  function card(icon, name, coin, stamp) {
    el('cardIcon').textContent = icon; el('cardName').textContent = name; el('cardCoin').textContent = coin;
    const st = el('cardStamp'); st.textContent = stamp; st.style.display = 'block';
    el('card').classList.add('on'); ACT.msgT = 2.4; setTimeout(() => { st.textContent = 'JEJU'; }, 2600);
  }
  function hint(text) { const h = el('hint'); if (!h) return; h.textContent = text; h.classList.add('on'); ACT.hintT = 1.8; }

  // ── 행동: 매입 / 짓기 ──
  const backPrice = p => Math.round(p.price * 1.5 / 500) * 500;   // 되사기: 웃돈 1.5배
  function act() {
    const p = E.near; if (!p || p.b || ACT.cur) return; AUDIO.init();
    if (p.rival) {                                               // 탐라국개발한테서 되사오기
      const pay = backPrice(p);
      if (ACT.coins < pay) { hint('💰 ' + fmt(pay)); AUDIO.ping(320); return; }
      ACT.coins -= pay; p.sold = false; p.rival = false; p.own = true; p.paid = pay; p.buyDay = E.day || 1;
      refresh(p); ACT.save(); ACT.hud(); hud(); AUDIO.fanfare(); AUDIO.coin(3);
      card('🏢', p.name + ' · ' + p.area.toLocaleString() + '평', '-' + fmt(pay), '되찾음');
      return;
    }
    if (p.sold) return;
    if (!p.own) {
      const dl = E.deal && E.deal.p === p ? E.deal : null;              // 급매면 반값
      const pay = dl ? dl.price : p.price;
      if (ACT.coins < pay) { hint('💰 ' + fmt(pay)); AUDIO.ping(320); return; }
      ACT.coins -= pay; p.own = true; p.paid = pay; p.buyDay = E.day || 1;   // 산 날 — 팔 때 굴림 폭을 정한다
      if (dl) dealEnd(true);
      refresh(p); ACT.save(); ACT.hud(); hud(); AUDIO.stamp();
      if (ACT.dest === p) ACT.clearDest();
      if (window.PET && PET.gfSay) setTimeout(function () { PET.gfSay(dl ? 'rise' : 'buy'); }, 2600);
      if (dl) { AUDIO.coin(3); card('📞', p.name + ' · ' + p.area.toLocaleString() + '평', '-' + fmt(pay), '급매'); }
      else card('🏷', p.name + ' · ' + p.area.toLocaleString() + '평', '-' + fmt(pay), 'SOLD');
      if (!E.end && boughtCount() === E.list.length) { E.end = true; ACT.save(); setTimeout(() => { card('🏝', 'JEJU 100%', fmt(ACT.coins), 'JEJU'); AUDIO.fanfare(); }, 2700); }
      return;
    }
    openBuild(p);
  }
  // 땅마다 지을 건물이 하나로 정해져 있다 — 고르는 게 아니라 지을지 말지만 정한다 (사장님 2026-09-10)
  function openBuild(p) {
    E.cur = p; const list = el('buildList'); list.innerHTML = '';
    const lv = lvOf(p), b = BK[lv.k], inc = income(p, b), ok = ACT.coins >= lv.c;
    el('buildName').textContent = lv.ic + ' ' + p.name + ' · ' + p.area.toLocaleString() + '평';
    const card = document.createElement('div'); card.className = 'card cur';
    card.innerHTML = '<div class="thumb">' + lv.ic + '</div><div class="info"><b>' + lv.n + '</b>' +
      '<div class="bars"><span>💰 ' + fmt(lv.c) + '</span><span>월세 ' + fmt(inc * MONTH) + (b.night ? ' 🌙' : '') + '</span></div></div>' +
      '<div class="act"><button' + (ok ? '' : ' disabled') + '>짓기</button></div>';
    list.appendChild(card);
    const bt = card.querySelector('button'); if (bt) bt.addEventListener('click', () => build(p));
    el('build').classList.add('show'); E.open = true;
  }
  function build(p) {
    const lv = lvOf(p), b = BK[lv.k]; if (!b || p.b || ACT.coins < lv.c) return;
    ACT.coins -= lv.c; p.b = lv.k; addBuilding(p); refresh(p); ACT.save(); ACT.hud(); close();
    AUDIO.fanfare(); card(lv.ic, lv.n + ' · ' + p.name, '월세 ' + fmt(income(p, b) * MONTH), 'OPEN');
    parkOutside(p);
    // 첫 나이트클럽을 올리면 여자친구가 한마디 한다 (사장님 2026-09-10). 전화 중이라 못 했으면 다음 클럽에 다시
    if (lv.k === 'club' && !E.clubSaid && window.PET && PET.gfSay) setTimeout(function () { if (PET.gfSay('club')) E.clubSaid = true; }, 3200);
  }
  // 건물을 올리면 차를 땅 옆 빈터(가장 가까운 길 위)로 옮긴다.
  // 안 그러면 새로 생긴 건물이나 옆 귤밭 돌담 안에 차가 갇힌다 (사장님 2026-09-10)
  // 다 지으면 차를 그 건물 정문 앞에 세운다 — 지은 걸 바로 보게 (사장님 2026-09-11)
  // 예전엕 그냥 부지 옆 차선에 놀려서 건물을 등지고 서 있기도 했다.
  function parkOutside(p) {
    if (!window.ROADS || !window.PLAYER || PLAYER.mode !== 'ground') return;
    const onFoot = !!(window.PET && PET.onFoot);
    let spot = frontSpot(p);
    if (!spot) {                                    // 정문 앞이 막히면 예전처럼 부지 옆 차선으로
      const n = ROADS.nearest(p.x, p.z); if (!n || !n.e) return;
      const e = n.e, ax = e.a.x, az = e.a.z, vx = e.b.x - ax, vz = e.b.z - az, L = vx * vx + vz * vz;
      const t = L > 0 ? Math.max(0, Math.min(1, ((p.x - ax) * vx + (p.z - az) * vz) / L)) : 0;
      const off = (e.w || 8) / 4;
      spot = { x: ax + vx * t + e.right.x * off, z: az + vz * t + e.right.z * off, yaw: Math.atan2(-e.dir.x, -e.dir.z) };
    }
    PLAYER.setVehicle(PLAYER.car, spot.x, spot.z, spot.yaw);
    PLAYER.safe = { x: spot.x, z: spot.z, yaw: spot.yaw };   // 되돌아올 자리도 여기로
    if (onFoot) { if (PET.state) { PET.state.x = spot.x + 1.6; PET.state.z = spot.z + 1.6; } }
    else if (window.PET && PET.board) PET.board();
  }
  function close() { el('build').classList.remove('show'); E.open = false; E.cur = null; }

  // ── 지도: 매물이 주인공. 흰 네모 = 매물(확대하면 값), 노란 = 내 땅, 아이콘 = 건물 ──
  function drawMap(g, X, Z, sc, fs) {
    const zoomed = sc > 0.42;
    // 멀리서 볼 때도 값이 보이게 값표를 붙인다. 매물이 90개가 넘어 다 붙이면 섬이 글씨로 덮이므로,
    // 이미 자리를 차지한 값표와 겹치면 그건 건너뛴다. 확대할수록 자리가 생겨 더 많이 보인다. (2026-09-10)
    const taken = [];
    // 지도에서 누를 자리 — 값표·카드가 그려진 네모 그대로다. 예전엔 땅 좌표에서 반지름으로만 재서
    // 말풍선 위쪽(값 글씨)을 누르면 안 먹고 조금 아래를 눌러야 했다 (사장님 2026-09-12)
    E.mapHit = [];
    const free = (x0, y0, x1, y1) => {
      for (const t of taken) if (x0 < t[2] && x1 > t[0] && y0 < t[3] && y1 > t[1]) return false;
      taken.push([x0, y0, x1, y1]); return true;
    };
    for (const p of E.list) {
      const x = X(p.x), y = Z(p.z); if (x < -30 || y < -30 || x > g.canvas.width + 30 || y > g.canvas.height + 30) continue;
      const r = Math.max(6, Math.min(18, p.side * sc * 0.5 + fs * 0.26));
      if (ACT.dest === p) { g.fillStyle = 'rgba(255,60,40,0.35)'; g.beginPath(); g.arc(x, y, r * 2.2, 0, 6.29); g.fill(); g.strokeStyle = '#ff3b2a'; g.lineWidth = 3; g.stroke(); }
      const label = (txt, color) => { g.font = 'bold ' + Math.round(fs * 0.55) + 'px "Ria", "Griun", "Malgun Gothic", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.75)'; txt = L(txt); g.strokeText(txt, x, y + r + fs * 0.45); g.fillStyle = color; g.fillText(txt, x, y + r + fs * 0.45); };
      // 확대하면 부동산 앱 카드로 (값 + 평수)
      const card = (l1, l2, tone) => {
        l1 = L(l1); l2 = L(l2);
        const f1 = Math.round(fs * 0.62), f2 = Math.round(fs * 0.5), pad = fs * 0.36;
        g.font = '900 ' + f1 + 'px "Ria", "Griun", "Malgun Gothic", sans-serif'; const w1 = g.measureText(l1).width;
        g.font = f2 + 'px "Griun", "Malgun Gothic", sans-serif'; const w2 = g.measureText(l2).width;
        const w = Math.max(w1, w2) + pad * 2, h = f1 + f2 + pad * 1.6, bx = x - w / 2, by = y - h - fs * 0.55, rr = h * 0.3;
        g.fillStyle = 'rgba(0,0,0,0.28)'; roundRect(g, bx + 1.5, by + 2, w, h, rr); g.fill();
        g.fillStyle = '#ffffff'; roundRect(g, bx, by, w, h, rr); g.fill();
        g.beginPath(); g.moveTo(x - fs * 0.2, by + h - 1); g.lineTo(x + fs * 0.2, by + h - 1); g.lineTo(x, by + h + fs * 0.42); g.closePath(); g.fill();
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = CARD_INK[tone] || CARD_INK.buy; g.font = '900 ' + f1 + 'px "Ria", "Griun", "Malgun Gothic", sans-serif'; g.fillText(l1, x, by + pad * 0.8 + f1 * 0.5);
        g.fillStyle = '#4b5563'; g.font = f2 + 'px "Griun", "Malgun Gothic", sans-serif'; g.fillText(l2, x, by + h - pad * 0.7 - f2 * 0.5);
        E.mapHit.push({ p: p, x0: bx, y0: by, x1: bx + w, y1: by + h + fs * 0.42 });
      };
      if (p.b) { g.font = Math.round(fs * 0.9) + 'px "Segoe UI Emoji", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(lvOf(p).ic, x, y); if (zoomed) label(p.sold ? 'SOLD · ' + lvOf(p).n : '내 ' + lvOf(p).n, p.sold ? '#c8d4e0' : '#ffd24a'); continue; }
      if (!zoomed) {   // 멀리서는 값표 하나만, 확대하면 부동산 카드
        // 네모를 따로 그릴 것 없다 — 값표 자체가 표식이다 (사장님 2026-09-11)
        const isDeal = E.deal && E.deal.p === p;
        const txt = p.own ? '내 땅' : p.rival ? RIVAL : p.sold ? 'SOLD' : isDeal ? '급매 ' + fmt(E.deal.price) : fmt(p.price);
        const f = Math.round(fs * 0.78), pad = f * 0.4; const txtL = L(txt);
        g.font = '900 ' + f + 'px "Ria", "Griun", "Malgun Gothic", sans-serif';
        const w = g.measureText(txtL).width + pad * 2, h = f + pad * 1.1;
        const bx = x - w / 2, by = y - h / 2;   // 땅 자리에 바로 올린다
        if (free(bx - 2, by - 2, bx + w + 2, by + h + 2)) {
          g.fillStyle = 'rgba(0,0,0,0.3)'; roundRect(g, bx + 1, by + 1.5, w, h, h * 0.34); g.fill();
          g.fillStyle = isDeal ? '#c82016' : p.rival ? '#6d4bd6' : p.own ? '#fff3d0' : p.sold ? '#e3e9ef' : '#ffffff'; roundRect(g, bx, by, w, h, h * 0.34); g.fill();
          g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillStyle = (isDeal || p.rival) ? '#ffffff' : CARD_INK[p.own ? 'own' : p.sold ? 'sold' : 'buy'] || CARD_INK.buy;
          g.fillText(txtL, x, by + h / 2);
          E.mapHit.push({ p: p, x0: bx, y0: by, x1: bx + w, y1: by + h });
        }
      }
      if (zoomed) card(p.own ? '내 땅' : p.sold ? 'SOLD' : '매매 ' + fmt(p.price), lotName(p), p.own ? 'own' : p.sold ? 'sold' : 'buy');
    }
  }
  // 지도에서 누른 자리의 매물 (목적지로)
  function parcelAt(mx, my, X, Z, rad) {
    const hit = E.mapHit || [];
    for (let i = hit.length - 1; i >= 0; i--) { const r = hit[i]; if (mx >= r.x0 && mx <= r.x1 && my >= r.y0 && my <= r.y1) return r.p; }   // 나중에 그린 것이 위에 있다
    let best = null, bd = rad;
    for (const p of E.list) { const d = Math.hypot(X(p.x) - mx, Z(p.z) - my); if (d < bd) { bd = d; best = p; } }
    return best;
  }

  // 화면 아래 팔기 단추: 한 번 누르면 묻고, 두 번째에 굴린다
  function sellNear() {
    const p = E.near; if (!p || !p.own || p.sold) return;
    const s2 = el('act2'); if (!s2) return;
    if (E.askSell === p.id) { E.askSell = null; s2.classList.remove('ask'); s2.textContent = '💸 팔기'; sell(p); return; }
    const fresh = !sureSell(p) && !(p.apr && p.apr.day === (E.day || 1));   // 오늘 처음 감정하는가
    const v = apprPrice(p);
    E.askSell = p.id; s2.classList.add('ask');
    if (fresh) spin(s2, p, v, '에 팔기?'); else { s2.textContent = fmt(v) + '에 팔기?'; AUDIO.ping(760); }
    // 얼마 넣었고 지금 얼마인지 옆에 띄운다 (사장님 2026-09-11)
    const put = paidValue(p), gap = Math.round((v / put - 1) * 100);
    card(p.b ? lvOf(p).ic : '🏷', p.name, '매입 ' + fmt(put) + ' → ' + fmt(v), (gap >= 0 ? '+' : '') + gap + '%');
    setTimeout(function () { if (E.askSell === p.id) { E.askSell = null; s2.classList.remove('ask'); s2.textContent = '💸 팔기'; } }, 9000);
  }
  window.ESTATE = Object.assign(E, { monthDay, monthNo, rentIn, openAssets, closeAssets, netWorth, init, update, act, sellNear, close, hud, fmt, state, drawMap, parcelAt, estateWorth, dayIncome, ownedCount, BUILD, income });
})();
