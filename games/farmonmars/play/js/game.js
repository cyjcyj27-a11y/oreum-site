/* 팜온마즈 — 방치형. 하늘에서 내려다보는 화성 지도. 곰돌이 로봇이 농장 구역에서 농사를 짓고, 로켓으로 지구에 보내면 물자가 돌아오고, 그걸로 척박한 땅을 개간해 농장·저수지·댐·도시를 끝없이 넓힌다. 휠·손가락 벌리기로 줌. */
(function () {
  'use strict';
  let W = 960; const H = 540;
  const $ = id => document.getElementById(id);
  const canvas = $('c'), ctx = canvas.getContext('2d');
  const EN = (() => { try { return new URLSearchParams(location.search).get('lang') === 'en'; } catch (_) { return false; } })();
  if (EN) { document.documentElement.lang = 'en'; document.title = '팜온마즈 — Oreum Games'; document.querySelectorAll('[data-en]').forEach(e => { e.innerHTML = e.getAttribute('data-en'); }); }
  const T = (ko, en) => EN ? en : ko;
  const isTouch = ('ontouchstart' in window) && matchMedia('(pointer: coarse)').matches;
  if (isTouch) document.body.classList.add('touch');
  const rnd = (a, b) => a + Math.random() * (b - a), clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t, pick = a => a[Math.floor(Math.random() * a.length)];
  const TAU = Math.PI * 2;

  // ── 곰돌이 그림: 옆(오른쪽)·정면·뒷모습 4장씩 + 포즈 ──
  const FRAMES = { side: [], down: [], up: [], idle: [] }, FPS = 7, POSE = {};
  Object.keys(FRAMES).forEach(a => { const probe = k => { const im = new Image(); im.onload = () => { im.ok = true; FRAMES[a].push(im); if (k < 12) probe(k + 1); }; im.onerror = () => { }; im.src = 'img/bear/' + a + '_' + String(k).padStart(2, '0') + '.png?v=2'; }; probe(1); });
  ['wave', 'jump', 'sit', 'face_01', 'face_02', 'face_03', 'face_04', 'face_05'].forEach(n => { const im = new Image(); im.onload = () => { im.ok = true; }; im.src = 'img/bear/' + n + '.png'; POSE[n] = im; });
  const pose = n => POSE[n] && POSE[n].ok ? POSE[n] : null;
  function frameOf(anim, clock) { const l = FRAMES[anim].length ? FRAMES[anim] : FRAMES.idle; if (!l.length) return null; return l[Math.floor(clock * FPS) % l.length]; }

  // ── 지도 자리 (세계 좌표) ──
  const POS = { drill: { x: 200, y: 250 }, solar: { x: 300, y: 250 }, pod: { x: 470, y: 330 }, pad: { x: 630, y: 330 }, wall: { x: 400, y: 372 }, dam: { x: 600, y: 900 }, res: { x: 330, y: 1110 }, sky: { x: 900, y: -300 } };   // sky: 로켓이 날아가 사라지는 곳(지도 밖)   // 사장님 스케치(2026-09-09): 위 한 줄 시설, 왼쪽 세로로 농장→댐→저수지, 오른쪽 전부 도시
  const FARM = { x: 150, y: 420, cols: 5, cw: 115, ch: 100 };   // 농장 5열(아래로 4줄까지)
  // 도시 구역 둘: 도심(오른쪽, 공공·산업·교통·고층)과 주거단지(아래 전체 폭, 아파트·공원). 두 칸마다 세로 도로, 줄마다 가로 도로
  const DIST = { dt: { x: 790, y: 200, cols: 8, cw: 140, ch: 150, rw: 26, maxRows: 6 }, res: { x: 150, y: 1290, cols: 13, cw: 140, ch: 150, rw: 26, maxRows: 4 } };
  const CITY = DIST.dt;
  const zoneOf = type => (type === 'hab' || type === 'park') ? 'res' : 'dt';
  const zcount = z => S.city.filter(c => c.z === z).length;
  const zrows = z => { const d = DIST[z]; return Math.ceil(Math.max(1, zcount(z)) / d.cols); };
  const dcolX = (d, c) => d.x + c * d.cw + Math.floor(c / 2) * d.rw, drowY = (d, r) => d.y + r * (d.ch + d.rw);
  const dW = d => d.cols * d.cw + Math.floor((d.cols - 1) / 2) * d.rw;
  const lotPosD = (d, k) => ({ x: dcolX(d, k % d.cols) + d.cw / 2, y: drowY(d, Math.floor(k / d.cols)) + d.ch / 2 + 12 });
  const drect = z => { const d = DIST[z]; return { x: d.x - d.rw, y: d.y - d.rw, w: dW(d) + 2 * d.rw, h: zrows(z) * (d.ch + d.rw) + d.rw }; };
  function zoneFor(type) { const z = zoneOf(type), o = z === 'dt' ? 'res' : 'dt'; if (!zfull(z)) return z; if (!zfull(o)) return o; return null; }   // 둘 다 차면 재개발
  const MAX_PLOT = 20;
  const plotPos = i => ({ x: FARM.x + 58 + (i % FARM.cols) * FARM.cw, y: FARM.y + 58 + Math.floor(i / FARM.cols) * FARM.ch });
  const lotPos = i => { const c = S.city[i]; return c ? lotPosD(DIST[c.z || 'dt'], c.k || 0) : lotPosD(DIST.dt, 0); };
  const farmRows = () => Math.ceil(Math.max(1, S.plots.length + S.q.filter(q => q.id === 'plot').length) / FARM.cols);
  const cityRows = () => zrows('dt');
  const farmRect = () => ({ x: FARM.x, y: FARM.y, w: FARM.cols * FARM.cw, h: farmRows() * FARM.ch });
  const cityRect = () => drect('dt');
  const MAPW = 2200, MAPH = 2110;   // 지도는 고정 크기. 밖으로 넘치지 않고 테두리로 마감한다
  const mapW = () => MAPW, mapH = () => MAPH;
  const zfull = z => zcount(z) >= DIST[z].maxRows * DIST[z].cols;

  // ── 저장 ──
  const CROPS = [['🥔', '감자', 'Potato'], ['🌾', '보리', 'Barley'], ['🌽', '옥수수', 'Corn'], ['🍞', '밀', 'Wheat'], ['🍚', '쌀', 'Rice']];   // 씨앗 단계 순서. 단가가 점점 오른다(사장님 2026-09-09)
  const YIELD = [3, 3, 4, 4, 5], PRICE = [1, 1.6, 2.4, 3.4, 5];   // 감자는 1대 1 — 10개 보내면 재료 10개. 위 씨앗은 단가가 오른다 (사장님 2026-09-10)
  function mkPlot() { return { t: 0, ripe: false, dust: false }; }
  function fresh() {
    return { sol: 1, clock: 8, crop: 0, mat: 0, water: 40, up: { plot: 0, drill: 0, res: 0, dam: 0, solar: 0, cargo: 0, auto: 0, wheels: 0, seed: 0, wall: 0, drone: 0, dish: 0, yield: 0, pine: 0 }, bought: {}, city: [], q: [], plots: [Object.assign(mkPlot(), { t: .9 }), Object.assign(mkPlot(), { t: .55 })], rate: 0, launches: 0, shipped: 0, built: 0, t: 0, lv: 0 };
  }
  let S = fresh();
  function load() { try { const s = JSON.parse(localStorage.getItem('farmonmars.save') || localStorage.getItem('farminmars.save') || 'null'); if (s && s.up) { S = Object.assign(fresh(), s); S.up = Object.assign(fresh().up, s.up); const kk = { dt: 0, res: 0 }; S.city.forEach(c => { if (c.b === undefined) c.b = pickBuilding(c.type); if (!c.z) { c.z = zoneOf(c.type); } c.k = kk[c.z]++; }); return true; } } catch (_) { } return false; }
  function save() { S.t = Date.now(); try { localStorage.setItem('farmonmars.save', JSON.stringify(S)); } catch (_) { } }

  // ── 수치 ──
  const cnt = t => S.city.filter(b => b.type === t && b.done).length;
  const GROW = () => 20;   // 한 판 익는 데 20초 고정(사장님 2026-09-10). 태양광·연구소는 속도 대신 수확량을 올린다
  const YLD = () => Math.round(YIELD[S.up.seed] * (1 + .25 * S.up.solar) * (1 + .05 * cnt('lab')) * (1 + .05 * cnt('park')) * (1 + .15 * S.up.yield));   // 수확량: 씨앗 × 태양광(+25%/단계) × 연구소(+5%/채) × 공원(+5%/채) × 수확량 강화(+15%/단계)
  const CAP = () => Math.round(60 * Math.pow(1.5, S.up.cargo));   // 화물칸: 작물로 사서 끝없이 넓힌다(60→90→135→…)
  const RATE = () => 1 + .1 * cnt('hab') + .2 * cnt('sky');
  const TRIP = () => Math.max(6, 15 * Math.pow(.9, cnt('port')) * Math.pow(.85, S.up.dish));   // 로켓 왕복 15초(사장님 2026-09-09 최종), 교통·안테나로 최소 6초
  const WCAP = () => 40 + 150 * S.up.res + 1000 * S.up.dam;
  const REGEN = () => .08 + .12 * S.up.drill * (1 + .25 * S.up.res) + .6 * S.up.dam;
  const SPEED = () => 70 + 35 * S.up.wheels;
  // 없는 동안 — 밭이 다 익어 있다. 그게 보상이고 동시에 일거리다. 시간은 보지 않는다 (사장님 2026-09-10)
  const AWAY_MIN = 20 * 60;
  const LAUNCH_MIN = 10;

  // ── 상점 ──
  const plotPrices = []; for (let i = 0; i < MAX_PLOT - 2; i++) plotPrices.push(Math.round(25 * Math.pow(1.42, i) / 5) * 5);
  const SHOP = [
    { id: 'plot', tab: 'farm', ic: '🌱', ko: '농장 돔 (개간)', en: 'Farm dome (reclaim)', price: plotPrices, dur: 4 },
    { id: 'yield', tab: 'farm', ic: '🧺', ko: '수확량', en: 'Yield', base: 300, mul: 1.4, max: 10, dur: 5, need: () => S.plots.length >= MAX_PLOT },
    { id: 'drill', tab: 'farm', ic: '⛏️', ko: '얼음 드릴', en: 'Ice drill', price: [30, 60, 120, 240, 480, 900], dur: 5 },
    { id: 'cargo', tab: 'farm', ic: '🚀', ko: '화물칸', en: 'Cargo bay', base: 40, mul: 1.5, max: 10, cur: 'crop', dur: 4 },   // 값은 작물(🌽). 10단계까지 — 오프라인 상한이 화물칸에 걸려 있어 끝없이 두면 자루가 너무 커진다
    { id: 'wheels', tab: 'farm', ic: '🛞', ko: '바퀴', en: 'Wheels', price: [35, 80, 180], dur: 3 },
    { id: 'seed', tab: 'farm', ic: '🌾', ko: '씨앗', en: 'Seeds', price: [50, 150, 400, 1000], dur: 3, need: () => S.launches >= 1 },
    { id: 'solar', tab: 'farm', ic: '☀️', ko: '태양광', en: 'Solar', price: [60, 120, 240, 480, 900], dur: 5, need: () => S.launches >= 1 },
    { id: 'res', tab: 'farm', ic: '💧', ko: '저수지', en: 'Reservoir', price: [80, 240, 600], dur: 8, need: () => S.up.drill >= 1 },
    { id: 'dish', tab: 'farm', ic: '📡', ko: '안테나', en: 'Antenna', price: [120, 300, 700], dur: 5, need: () => S.launches >= 1 },
    { id: 'auto', tab: 'farm', ic: '🤖', ko: '자동 발사', en: 'Autopilot', price: [150], dur: 5, need: () => S.launches >= 2 },
    { id: 'wall', tab: 'farm', ic: '🛡️', ko: '방풍벽', en: 'Wind wall', price: [200], dur: 6, need: () => S.up.res >= 1 },
    { id: 'drone', tab: 'farm', ic: '🛸', ko: '경비 드론', en: 'Guard drone', price: [250], dur: 5, need: () => S.up.res >= 1 },
    { id: 'dam', tab: 'farm', ic: '🏔️', ko: '댐', en: 'Dam', price: [700, 2000, 6000], dur: 14, need: () => S.up.res >= 1 },
    { id: 'hab', tab: 'city', ic: '🏠', ko: '주거', en: 'Housing', base: 240, mul: 1.35, dur: 6, need: () => S.up.res >= 1 },
    { id: 'park', tab: 'city', ic: '🌳', ko: '문화·녹지', en: 'Culture & Parks', base: 360, mul: 1.35, dur: 6, need: () => cnt('hab') >= 1 },
    { id: 'lab', tab: 'city', ic: '🏛️', ko: '공공·연구', en: 'Civic & Research', base: 500, mul: 1.4, dur: 7, need: () => cnt('hab') >= 1 },
    { id: 'factory', tab: 'city', ic: '🏭', ko: '산업·상업', en: 'Industry & Shops', base: 600, mul: 1.4, dur: 8, need: () => cnt('hab') >= 2 },
    { id: 'port', tab: 'city', ic: '🚉', ko: '교통', en: 'Transport', base: 1200, mul: 1.6, dur: 9, need: () => cnt('factory') >= 1 },
    { id: 'pine', tab: 'city', ic: '🌲', ko: '소나무 숲', en: 'Pine forest', price: [200, 400, 800, 1600, 3200, 6400], dur: 6, need: () => S.up.res >= 1 },
    { id: 'sky', tab: 'city', ic: '🏙️', ko: '고층', en: 'High-rise', base: 1800, mul: 1.5, dur: 12, need: () => S.up.dam >= 1 },
  ];
  const isCity = it => it.tab === 'city' && !it.price;   // 도시 탭이라도 단계형(소나무 숲)은 건물이 아니다
  // 건물 116종(buildings.js)을 여섯 갈래로 나눈다. 살 때마다 도시 수준에 맞는 시대의 건물이 하나씩 골라진다
  const CATN = {
    hab: '초가집 기와집 단독주택 연립주택 협소주택 통나무집 농가 한옥 별장 여인숙 여관 빌라 기숙사 요양원 호텔 아파트 오피스텔 펜트하우스',
    park: '비닐하우스 온실 식물원 수영장 체육관 경기장 박물관 미술관 영화관 콘서트홀 아쿠아리움 볼링장 헬스장 노래방 피시방 카페 식당 빵집 사찰 교회 천문대 꽃집 목욕탕',
    lab: '서당 학교 도서관 대학교 유치원 학원 독서실 어린이집 연구소 데이터센터 방송국 시청 법원 구청 세무서 대사관 은행 우체국 경찰서 소방서 병원 약국 치과 동물병원 한의원 교도소 증권사 부동산 시계탑 등대 사진관 문방구 서점',
    factory: '양조장 정미소 방앗간 풍차 대장간 창고 공장 급수탑 세탁소 정비소 발전소 물류창고 주유소 정유소 변전소 정수장 소각장 제철소 축사 철물점 정육점 어시장 시장 상가 마트 백화점 쇼핑몰 편의점 미용실',
    port: '기차역 버스터미널 격납고 컨벤션센터 주차타워 관제탑',
    sky: '오피스 초고층빌딩 전망대 지하벙커 금고 핵방공호',
  };
  const BL = (window.BUILDINGS || []).map((b, i) => { let cat = 'factory'; for (const k in CATN) if (CATN[k].split(' ').includes(b.ko)) cat = k; return Object.assign({ i, cat }, b); });
  function pickBuilding(cat) {
    const maxEra = Math.min(4, S.lv + 1), used = S.city.filter(c => c.type === cat).map(c => c.b);
    let pool = BL.filter(b => b.cat === cat && b.era[0] <= maxEra); if (!pool.length) pool = BL.filter(b => b.cat === cat); if (!pool.length) return 0;
    const fresh = pool.filter(b => !used.includes(b.i)).sort((a, b) => b.era[0] - a.era[0]);   // 지금 시대의 건물부터(도시가 크면 아파트·오피스가 먼저 나온다)
    const src = fresh.length ? fresh.slice(0, 5) : pool; return src[Math.floor(Math.random() * src.length)].i;
  }
  const bdOf = c => BL[c.b] || BL[0];
  function redevTarget(cat) {   // 재개발: 같은 갈래(주거·공원은 주거단지, 나머지는 도심) 중 가장 옛 시대 건물을 헌다
    let best = -1, be = 99; S.city.forEach((c, i) => { if (!c.done || zoneOf(c.type) !== zoneOf(cat) || S.q.some(q => q.ci === i)) return; const e = BL[c.b] ? BL[c.b].era[0] : 0; if (e < be) { be = e; best = i; } }); return best; }
  const _pv = {}; function pickPreview(cat) { const key = cat + ':' + S.city.length + ':' + S.lv; if (_pv.key !== key) { _pv.key = key; _pv.v = {}; } if (_pv.v[cat] === undefined) _pv.v[cat] = pickBuilding(cat); return _pv.v[cat]; }
  function priceOf(it) { const n = S.bought[it.id] || 0; if (it.price) return n < it.price.length ? it.price[n] : null; if (it.max && n >= it.max) return null; return Math.round(it.base * Math.pow(it.mul, n)); }
  const wallet = it => it.cur === 'crop' ? S.crop : S.mat;
  const curIc = it => it.cur === 'crop' ? CROPS[S.up.seed][0] : '🧱';
  const canBuy = it => { const p = priceOf(it); return p !== null && wallet(it) >= p && (!it.need || it.need()); };
  const visible = it => !it.need || it.need() || (S.bought[it.id] || 0) > 0;
  function sitePos(it) {
    if (isCity(it)) { const z = zoneFor(it.id); if (z) return lotPosD(DIST[z], zcount(z)); const r = redevTarget(it.id); return r >= 0 ? lotPos(r) : lotPosD(DIST.dt, 0); }
    if (it.id === 'plot') return plotPos(Math.min(MAX_PLOT - 1, 2 + (S.bought.plot || 0)));
    return { drill: POS.drill, res: POS.res, dam: POS.dam, solar: POS.solar, cargo: POS.pad, auto: POS.pad, wheels: POS.pod, seed: POS.pod, wall: POS.wall, drone: POS.pod, dish: { x: POS.pod.x + 20, y: POS.pod.y - 10 }, yield: { x: FARM.x + FARM.cols * FARM.cw / 2, y: FARM.y + farmRows() * FARM.ch + 40 }, pine: { x: 300 + (S.bought.pine || 0) * 300, y: 1110 } }[it.id];
  }
  function buy(it) {
    if (!canBuy(it)) return false;
    const p = priceOf(it); if (it.cur === 'crop') S.crop -= p; else S.mat -= p; const at = sitePos(it);
    let ci = -1;
    if (isCity(it)) { const z = zoneFor(it.id); if (z) { S.city.push({ type: it.id, done: false, b: pickPreview(it.id), z, k: zcount(z) }); ci = S.city.length - 1; } else { ci = redevTarget(it.id); if (ci < 0) return false; const c = S.city[ci]; c.type = it.id; c.b = pickPreview(it.id); c.done = false; } }
    S.bought[it.id] = (S.bought[it.id] || 0) + 1;
    S.q.push({ id: it.id, x: at.x, y: at.y, prog: 0, dur: it.dur * 2, ci });   // 건설도 2배 천천히(전체 속도 늦춤)
    SND.play('click'); save(); renderShop(); return true;
  }
  function finishSite(q) {
    S.built++;
    if (q.ci >= 0) { S.city[q.ci].done = true; cityCheck(); }
    else {
      S.up[q.id]++;
      if (q.id === 'plot' && S.plots.length < MAX_PLOT) S.plots.push(mkPlot());
      if (q.id === 'drill') { S.water = Math.min(WCAP(), S.water + 50); toast('ICE', 'blue', 1300); SND.play('ice'); for (let i = 0; i < 24; i++) sparkle(q.x + rnd(-20, 20), q.y - rnd(0, 40), '#bff4ff'); }
      if (q.id === 'res') { G.fill = 2.5; SND.play('water'); }
      if (q.id === 'dam') { G.fill = 4; toast('DAM', 'blue', 2000); SND.play('water'); setTimeout(() => SND.play('clear'), 700); fireworks(POS.dam.x - 200, 120, 8); }
      if (q.id === 'seed') $('cropIc').textContent = CROPS[S.up.seed][0];
    }
    if (!(q.id === 'drill' || q.id === 'dam')) { toast('COMPLETE', false, 900); SND.play('done'); }
    for (let i = 0; i < 14; i++) puff(q.x + rnd(-30, 30), q.y + rnd(-10, 20));
    if (Math.hypot(P.x - q.x, P.y - q.y) < 120) doPose('jump', 1);
    save(); renderShop();
  }
  function cityCheck() {
    const n = S.city.filter(b => b.done).length, lv = n >= 40 ? 6 : n >= 25 ? 5 : n >= 15 ? 4 : n >= 8 ? 3 : n >= 4 ? 2 : n >= 1 ? 1 : 0;
    if (lv > S.lv) { S.lv = lv; const at = lotPos(n - 1); setTimeout(() => { toast('CITY LV ' + lv, false, 1800); SND.play('clear'); fireworks(at.x, at.y - 80, 6); }, 500); }
    // 엔딩: 도심 48칸 + 주거단지 52칸이 다 지어지면 한 번(사장님 문구). '재개발' 을 누르면 그대로 이어서, 다음 건물부터는 옛 건물을 헐고 새로 짓는다
    const full = n >= DIST.dt.maxRows * DIST.dt.cols + DIST.res.maxRows * DIST.res.cols;
    if (full && !S.ended) { S.ended = true; save(); setTimeout(() => { for (let i = 0; i < 6; i++) setTimeout(() => fireworks(rnd(200, 1400), rnd(200, 600), 6), i * 250); SND.play('clear'); document.getElementById('ending').classList.add('show'); }, 900); }
  }

  // ── 시간 ──
  const G = { place: 'title', tab: 'farm', anim: 0, shown: { crop: 0, mat: 0 }, cam: { x: 600, y: 120 }, z: .9, free: 0, saveT: 0, secT: 0, secCrop: 0, hist: [], stormT: rnd(150, 220), storm: 0, warn: 0, bugT: rnd(45, 80), fill: 0, factT: 0 };
  const SOL = 300;   // 하루 = 5분
  function advance(dt) {
    const b = S.clock; S.clock += dt * 24 / SOL;
    if (S.clock >= 24) S.clock -= 24;
    if ((b < 6 && S.clock >= 6) || (b > S.clock && S.clock >= 6)) { S.sol++; toast('DAY ' + S.sol, false, 1400); SND.play('sol'); save(); }
  }
  const nightAt = () => { const h = S.clock; if (h >= 7 && h < 18) return 0; if (h >= 20 || h < 5) return 1; if (h < 7) return 1 - (h - 5) / 2; return (h - 18) / 2; };

  // ── 로봇·로켓·벌레 ──
  const P = { x: POS.pod.x, y: POS.pod.y + 70, dir: 'down', face: 1, clock: 0, moving: false, task: null, hold: 0, idleT: 2, hide: false, tx: null, ty: null, pose: null, poseT: 0, still: 0 };
  function doPose(n, t) { P.pose = n; P.poseT = t; }
  const R = { state: 'pad', t: 0, cargo: 0, y: 0 };
  let bug = null, floats = [], flys = [], parts = [], sand = [], rovers = [];
  const STORM_T = 12;

  // ── HUD ──
  const toastEl = $('toast'); let toastT = null;
  function toast(s, col, ms) { toastEl.textContent = s; toastEl.className = col === 'blue' ? 'blue' : col ? 'red' : ''; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), ms || 1100); }
  function hud() {
    $('solN').textContent = S.sol;
    ['crop', 'mat'].forEach(k => { const d = S[k] - G.shown[k]; G.shown[k] = Math.abs(d) < 1 ? S[k] : G.shown[k] + d * .18; });
    $('cropN').textContent = Math.floor(G.shown.crop); $('matN').textContent = Math.floor(G.shown.mat);
    $('waterN').textContent = Math.floor(S.water); $('waterBar').style.width = (100 * S.water / WCAP()) + '%'; $('water').classList.toggle('low', S.water < WCAP() * .15);
    $('btnShop').classList.toggle('on', SHOP.some(it => visible(it) && canBuy(it)));
    $('cropN').parentElement.classList.toggle('ready', R.state === 'pad' && S.crop >= LAUNCH_MIN);   // 발사할 수 있으면 작물 알약이 깜빡인다
  }
  function target(id) { try { const r = $(id).getBoundingClientRect(), c = canvas.getBoundingClientRect(); return { x: (r.left + r.width / 2 - c.left) / c.width * W, y: (r.top + r.height / 2 - c.top) / c.height * H }; } catch (_) { return { x: W / 2, y: 10 }; } }
  const toWorld = (sx, sy) => ({ x: G.cam.x + sx / G.z, y: G.cam.y + sy / G.z });
  function float(x, y, s, col) { floats.push({ x, y, s, col: col || '#ffd24a', t: 1.2 }); }
  function fly(x, y, ic, n, id) { const tg = target(id), k = Math.min(n, 10); for (let i = 0; i < k; i++) flys.push({ x, y, vx: rnd(-90, 90), vy: rnd(-180, -80), t: -i * .04, sx: tg.x, sy: tg.y, ic }); }
  function puff(x, y) { parts.push({ x, y, vx: rnd(-30, 30), vy: rnd(-40, -5), t: rnd(.5, .9), r: rnd(4, 9), col: 'rgba(230,170,120,.6)' }); }
  function sparkle(x, y, col) { parts.push({ x, y, vx: rnd(-60, 60), vy: rnd(-90, -20), t: rnd(.4, .8), r: rnd(1.5, 3), col: col || '#fff2a0', g: 120 }); }
  function fireworks(x, y, n) { for (let k = 0; k < n; k++) setTimeout(() => { const cx = x + rnd(-80, 80), cy = y - rnd(0, 80), col = ['#ff6a6a', '#ffd24a', '#7fdcff', '#9fff9f', '#ff9fe0'][k % 5]; for (let i = 0; i < 26; i++) { const a = rnd(0, TAU), v = rnd(30, 90); parts.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: rnd(.6, 1.1), r: 2, col, g: 40 }); } SND.play('fire'); }, k * 350); }

  // ── 농사 ──
  function harvest(p, i, byTap) {
    const at = plotPos(i), n = byTap ? Math.round(YLD() * 1.5) : YLD();
    S.crop += n; G.secCrop += n; p.t = 0; p.ripe = false;
    fly(at.x, at.y - 20, CROPS[S.up.seed][0], n, 'cropN'); float(at.x, at.y - 50, '+' + n); SND.play(byTap ? 'pops' : 'pop');
    if (byTap) for (let k = 0; k < 8; k++) sparkle(at.x + rnd(-24, 24), at.y - rnd(0, 40));
    if (Math.random() < .04) { S.mat += 10; fly(at.x, at.y - 20, '💎', 3, 'matN'); float(at.x, at.y - 70, '💎 +10', '#7fdcff'); SND.play('ice'); }
    SND.play('plant');
  }
  function launch() {
    if (R.state !== 'pad' || S.crop < LAUNCH_MIN) return false;
    R.cargo = Math.min(Math.floor(S.crop), CAP()); R.price = PRICE[S.up.seed]; S.crop -= R.cargo; S.shipped += R.cargo; S.launches++;
    R.state = 'up'; R.t = 0; R.y = 0; doPose('wave', 2.2); P.dir = 'down'; toast('LAUNCH', false, 1000); SND.play('launch'); save(); renderShop(); return true;
  }
  function supply(n) {
    S.mat += n; fly(POS.pad.x, POS.pad.y, '🧱', n / 4, 'matN'); float(POS.pad.x, POS.pad.y - 80, '+' + n, '#ffb070'); toast('SUPPLY +' + n, false, 1400); SND.play('crates'); setTimeout(() => SND.play('nice'), 300);
    for (let i = 0; i < 10; i++) puff(POS.pad.x + rnd(-30, 30), POS.pad.y + rnd(-10, 10));
    save(); renderShop();
  }

  // ── 로봇 ──
  function goTo(x, y) { P.tx = x; P.ty = y; }
  const standAt = (x, y) => goTo(x, y + 50);   // 물건 앞(아래)에 선다
  function walkStep(dt) {
    if (P.tx === null) { P.moving = false; return true; }
    const dx = P.tx - P.x, dy = P.ty - P.y, d = Math.hypot(dx, dy), sp = SPEED() * dt;
    if (d <= sp) { P.x = P.tx; P.y = P.ty; P.tx = null; P.moving = false; return true; }
    P.x += dx / d * sp; P.y += dy / d * sp; P.moving = true; P.clock += dt;
    if (Math.abs(dx) > Math.abs(dy) * 1.2) { P.dir = 'side'; P.face = dx > 0 ? 1 : -1; } else P.dir = dy > 0 ? 'down' : 'up';
    return false;
  }
  function pickTask() {
    if (G.storm > 0 || G.warn > 0) { P.task = { kind: 'hide' }; goTo(POS.pod.x, POS.pod.y + 46); return; }
    const site = S.q.filter(q => q.prog < q.dur).sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y))[0];
    if (site) { P.task = { kind: 'build', q: site }; standAt(site.x, site.id === 'dam' ? 780 : site.y); return; }
    let best = -1, bd = 1e9;
    S.plots.forEach((p, i) => { if (p.ripe && !(bug && bug.plot === i)) { const a = plotPos(i), d = Math.hypot(a.x - P.x, a.y - P.y); if (d < bd) { bd = d; best = i; } } });
    if (best >= 0) { P.task = { kind: 'harvest', i: best }; const a = plotPos(best); standAt(a.x, a.y); return; }
    best = -1; bd = 1e9;
    S.plots.forEach((p, i) => { if (p.dust) { const a = plotPos(i), d = Math.hypot(a.x - P.x, a.y - P.y); if (d < bd) { bd = d; best = i; } } });
    if (best >= 0) { P.task = { kind: 'clean', i: best }; const a = plotPos(best); standAt(a.x, a.y); return; }
    if (bug && bug.state === 'eat' && !S.up.drone) { P.task = { kind: 'shoo' }; const a = plotPos(bug.plot); standAt(a.x, a.y); return; }
    P.task = null;
  }
  // 곰돌이를 탭하면 그 자리에서 가장 가까운 일을 잡는다
  function orderBear() {
    P.task = null; P.tx = null; P.idleT = rnd(2, 5); P.still = 0;
    pickTask();
    const ic = { build: '🔨', harvest: '🧺', clean: '🧹', shoo: '!', hide: '🏠' }[P.task && P.task.kind];
    if (P.task) { SND.play('click'); float(P.x, P.y - 96, ic || '💪'); doPose('wave', .6); }
    else { SND.play('click'); float(P.x, P.y - 96, '💤', '#cfd6dd'); }
  }
  function robot(dt) {
    P.hide = false; if (P.poseT > 0) { P.poseT -= dt; if (P.poseT <= 0) P.pose = null; }
    P.still = (!P.task && !P.moving && P.tx === null) ? P.still + dt : 0;
    if (!P.task) { P.idleT -= dt; if (P.idleT <= 0) { P.idleT = rnd(2, 5); if (P.tx === null && P.still < 8 && Math.random() < .5) goTo(clamp(P.x + rnd(-80, 80), 140, 700), clamp(P.y + rnd(-40, 40), 330, 390)); } walkStep(dt); if (!P.moving) pickTask(); return; }
    const t = P.task;
    if (t.kind === 'hide') { if (walkStep(dt)) { P.hide = true; if (G.storm <= 0 && G.warn <= 0) P.task = null; } return; }
    if (t.kind === 'build') { if (t.q.prog >= t.q.dur || !S.q.includes(t.q)) { P.task = null; return; } if (walkStep(dt)) { P.dir = 'up'; P.hold += dt; if (P.hold > .3) { P.hold = 0; SND.play('hammer'); for (let i = 0; i < 4; i++) sparkle(t.q.x + rnd(-14, 14), t.q.y - rnd(0, 30)); } t.q.prog += dt; if (t.q.prog >= t.q.dur) { S.q.splice(S.q.indexOf(t.q), 1); finishSite(t.q); P.task = null; } } return; }
    if (t.kind === 'harvest') { const p = S.plots[t.i]; if (!p || !p.ripe) { P.task = null; return; } if (walkStep(dt)) { P.dir = 'up'; P.hold += dt; if (P.hold >= 1.1) { P.hold = 0; harvest(p, t.i, false); P.task = null; } } return; }
    if (t.kind === 'clean') { const p = S.plots[t.i]; if (!p || !p.dust) { P.task = null; return; } if (walkStep(dt)) { P.dir = 'up'; P.hold += dt; if (P.hold > .4 && P.hold < .45) SND.play('brush'); if (P.hold >= 1.4) { P.hold = 0; p.dust = false; const a = plotPos(t.i); for (let i = 0; i < 8; i++) puff(a.x + rnd(-25, 25), a.y - rnd(0, 40)); P.task = null; } } return; }
    if (t.kind === 'shoo') { if (!bug || bug.state !== 'eat') { P.task = null; return; } if (walkStep(dt)) { shoo(true); P.task = null; } return; }
  }

  // ── 벌레 ──
  function spawnBug() {
    const ripe = S.plots.map((p, i) => p.ripe ? i : -1).filter(i => i >= 0); if (!ripe.length) return;
    const i = ripe[Math.floor(Math.random() * ripe.length)], a = plotPos(i);
    bug = { x: FARM.x - 130, y: a.y + 10, plot: i, state: 'in', t: 0, hop: 0, eat: 0, z: 0 }; SND.play('squeak');
  }
  function shoo(byRobot) {
    if (!bug || bug.state !== 'eat') return;
    bug.state = 'flip'; bug.t = 0; SND.play('shoo'); float(bug.x, bug.y - 40, '!?', '#fff');
    if (!byRobot) { S.crop += 2; fly(bug.x, bug.y - 10, CROPS[S.up.seed][0], 2, 'cropN'); float(bug.x, bug.y - 60, '+2'); }
  }
  function bugStep(dt) {
    if (!bug) { G.bugT -= dt; if (G.bugT <= 0) { G.bugT = rnd(60, 120); spawnBug(); } return; }
    const b = bug; b.hop += dt;
    if (b.state === 'in') { const a = plotPos(b.plot), tx = a.x - 30; b.x += (tx - b.x > 0 ? 1 : -1) * 120 * dt; b.z = Math.abs(Math.sin(b.hop * 9)) * 14; if (Math.abs(tx - b.x) < 4) { b.state = 'eat'; b.t = 0; b.z = 0; } if (!S.plots[b.plot] || !S.plots[b.plot].ripe) b.state = 'out'; }
    else if (b.state === 'eat') { b.t += dt; b.eat += dt; if (b.eat > .5) { b.eat = 0; SND.play('munch'); puff(b.x - 10, b.y - 10); } if (S.up.drone && b.t > 2) { b.state = 'flip'; b.t = 0; SND.play('zap'); for (let i = 0; i < 10; i++) sparkle(b.x, b.y - 10, '#9fe8ff'); float(b.x, b.y - 40, '⚡', '#9fe8ff'); } else if (b.t >= 8) { const p = S.plots[b.plot]; if (p && p.ripe) { p.t = 0; p.ripe = false; const a = plotPos(b.plot); float(a.x, a.y - 50, '💨', '#ccc'); SND.play('eaten'); } b.state = 'out'; b.t = 0; } }
    else if (b.state === 'flip') { b.t += dt; b.z = Math.max(0, Math.sin(b.t * 5) * 20); if (b.t > 1.2) { b.state = 'out'; b.t = 0; } }
    else if (b.state === 'out') { b.x -= 220 * dt; b.z = Math.abs(Math.sin(b.hop * 14)) * 10; if (b.x < FARM.x - 260) bug = null; }
  }

  // ── 폭풍 ──
  function stormStep(dt) {
    if (G.storm > 0) {
      G.storm -= dt; SND.wind(.3);
      if (sand.length < 160) for (let i = 0; i < 6; i++) sand.push({ x: W + rnd(0, 60), y: rnd(-40, H), v: rnd(320, 520), l: rnd(8, 20) });
      if (G.storm <= 0) { SND.wind(0); if (!S.up.wall) S.plots.forEach(p => { p.dust = true; }); }
    } else if (G.warn > 0) { G.warn -= dt; SND.wind(.12); if (G.warn <= 0) { G.storm = STORM_T; } }
    else { G.stormT -= dt; if (G.stormT <= 0) { G.stormT = rnd(150, 240); G.warn = 5 + 2 * S.up.dish; SND.play('warn'); } }
    for (const s of sand) { s.x -= s.v * dt; s.y += s.v * .25 * dt; }
    sand = sand.filter(s => s.x > -40);
  }

  // ── 카메라: 손대지 않으면 곰을 따라간다(줌은 손대지 않음 — 확대·축소는 휠·손가락 벌리기로만) ──
  function camera(dt) {
    if (G.free > 0) { G.free -= dt; }
    else { const k = 1 - Math.pow(.15, dt); G.cam.x += (P.x - W / 2 / G.z - G.cam.x) * k; G.cam.y += (P.y - 20 - H / 2 / G.z - G.cam.y) * k; }
    clampCam();
  }
  function clampCam() { if (!isFinite(G.z)) G.z = .9; if (!isFinite(G.cam.x)) G.cam.x = 0; if (!isFinite(G.cam.y)) G.cam.y = 0; G.z = clamp(G.z, Math.min(W / (mapW() + 40), H / (mapH() + 40)), 1.6); const vw = W / G.z, vh = H / G.z; G.cam.x = vw >= mapW() ? (mapW() - vw) / 2 : clamp(G.cam.x, 0, mapW() - vw); G.cam.y = vh >= mapH() ? (mapH() - vh) / 2 : clamp(G.cam.y, -64 / G.z, mapH() - vh); }   // 위쪽은 상단바 높이만큼 더 내려올 수 있게(강이 HUD 에 가리지 않게)
  function zoomAt(sx, sy, f) { const before = toWorld(sx, sy); G.z = G.z * f; G.cam.x = before.x - sx / G.z; G.cam.y = before.y - sy / G.z; G.free = 8; clampCam(); }

  // ── 갱신 ──
  function update(dt) {
    G.anim += dt; if (G.place !== 'play') { draw(); return; }
    advance(dt);
    const growing = S.plots.filter(p => !p.ripe).length;
    S.water = clamp(S.water + (REGEN() - .04 * growing * (G.storm > 0 ? 0 : 1)) * dt, 0, WCAP());   // 물: 자라는 판당 초당 0.04(50초 기준, 한 판 키우는 물은 20초 때와 같게)
    const gmul = (G.storm > 0 ? 0 : 1) * (S.water <= 0 ? .3 : 1);
    S.plots.forEach(p => { if (!p.ripe) { p.t += dt / GROW() * gmul * (p.dust ? .5 : 1); if (p.t >= 1) { p.t = 1; p.ripe = true; } } });
    if (R.state === 'pad' && S.up.auto && S.crop >= CAP()) launch();
    if (R.state === 'up') { R.t += dt; R.y = R.t * R.t * 90; const lp = lanePos(clamp(R.y / 420, 0, 1)); if (R.t > .1 && Math.random() < .8) parts.push({ x: lp.x + rnd(-8, 8), y: lp.y + rnd(-6, 6), vx: rnd(-40, 40), vy: rnd(-20, 20), t: rnd(.6, 1.2), r: rnd(6, 12), col: 'rgba(240,230,220,.6)' }); if (R.y > 420) { R.state = 'away'; R.t = 0; } }
    else if (R.state === 'away') { R.t += dt; if (R.t >= TRIP()) { R.state = 'down'; R.t = 0; R.y = 420; } }
    // 재료 = 보낸 작물 × 도시 보너스(주거·고층) × 씨앗 단가. 감자 단가가 1 이라 맨처음은 1대 1 (사장님 2026-09-10)
    else if (R.state === 'down') { R.t += dt; R.y = Math.max(0, 420 - R.t * 110); const lp2 = lanePos(clamp(R.y / 420, 0, 1)); if (Math.random() < .6) parts.push({ x: lp2.x + rnd(-6, 6), y: lp2.y + rnd(-4, 4), vx: rnd(-50, 50), vy: rnd(-30, 30), t: .5, r: rnd(3, 7), col: 'rgba(255,190,120,.7)' }); if (R.y <= 0) { R.state = 'pad'; SND.play('land'); for (let i = 0; i < 12; i++) puff(POS.pad.x + rnd(-30, 30), POS.pad.y + rnd(-10, 10)); const n = Math.round(R.cargo * RATE() * (R.price || 1)); R.cargo = 0; setTimeout(() => supply(n), 500); } }
    const nf = cnt('factory'); if (nf) { G.factT += dt; if (G.factT >= 10) { G.factT = 0; const n = Math.round(1.5 * nf); S.mat += n; const b = S.city.findIndex(c => c.type === 'factory' && c.done), a = lotPos(b); float(a.x, a.y - 70, '+' + n, '#ffb070'); } }
    robot(dt); bugStep(dt); stormStep(dt); camera(dt); roverStep(dt);
    if (G.fill > 0) G.fill -= dt;
    G.secT += dt; if (G.secT >= 5) { G.hist.push(G.secCrop / G.secT); if (G.hist.length > 12) G.hist.shift(); S.rate = G.hist.reduce((a, b) => a + b, 0) / G.hist.length; G.secT = 0; G.secCrop = 0; }
    for (const f of floats) { f.t -= dt; f.y -= 28 * dt; } floats = floats.filter(f => f.t > 0);
    for (const f of flys) { f.t += dt; if (f.t < 0) continue; if (f.t < .35) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 500 * dt; } else { const tg = toWorld(f.sx, f.sy), k = 1 - Math.pow(.001, dt); f.x += (tg.x - f.x) * k * 1.4; f.y += (tg.y - f.y) * k * 1.4; if (Math.hypot(tg.x - f.x, tg.y - f.y) < 8 / G.z) f.t = 9; } } flys = flys.filter(f => f.t < 9);
    for (const p of parts) { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.g) p.vy += p.g * dt; } parts = parts.filter(p => p.t > 0);
    G.saveT += dt; if (G.saveT > 10) { G.saveT = 0; save(); }
    hud(); draw();
  }

  // ── 떠나 있던 동안 ──
  function offline(sec) {
    if (sec < AWAY_MIN) return { plots: 0, crop: 0 };
    const n = S.plots.filter(p => !p.ripe).length;
    return { plots: S.plots.length, crop: S.plots.length * YLD() };   // 밭 전체가 익은 만큼
  }
  const BONUS = [
    { ic: '☄️', ko: '밭에 운석이 떨어졌다', en: 'A meteorite fell on the farm', mat: 2 },
    { ic: '📦', ko: '지구에서 소포가 왔다', en: 'A parcel came from Earth', mat: 1.5 },
    { ic: '🌱', ko: '돌연변이 작물이 한 판 자랐다', en: 'A mutant crop grew overnight', crop: 1 },
    { ic: '🏺', ko: '모래 속에서 유물이 나왔다', en: 'A relic turned up in the sand', mat: 3 },
  ];
  function checkBack(away) {
    if (G.place !== 'play' || away < 60) return;
    const o = offline(away); if (o.crop <= 0) return;
    o.away = away;
    o.bonus = Math.random() < .15 ? Object.assign({}, pick(BONUS)) : null;
    if (o.bonus) {
      o.bonus.matN = o.bonus.mat ? Math.max(8, Math.round(o.crop * PRICE[S.up.seed] * o.bonus.mat)) : 0;
      o.bonus.cropN = o.bonus.crop ? Math.max(8, Math.round(o.crop * o.bonus.crop)) : 0;
    }
    o.mess = { dust: away > 1800 ? 2 + Math.floor(Math.random() * 3) : 0, bug: (away > 7200 && Math.random() < .5) ? 1 : 0 };
    G.back = o; showBack(o);
  }
  const fmtAway = s => { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? h + 'h ' + m + 'm' : m + 'm'; };
  function showBack(o) {
    const ic = CROPS[S.up.seed][0];
    $('backRow').innerHTML = '⏱ ' + fmtAway(o.away) + '<br>🌾 ' + T('밭 ' + o.plots + '칸이 다 익었다', 'All ' + o.plots + ' plots are ripe') + ' <b>' + ic + ' ~' + o.crop + '</b>'
      + (o.mess.dust || o.mess.bug ? '<br>' + (o.mess.dust ? '🌫️ ' + o.mess.dust + '  ' : '') + (o.mess.bug ? '🐛 ' + o.mess.bug : '') : '');
    const bb = $('backBonus');
    if (o.bonus) { bb.hidden = false; bb.innerHTML = o.bonus.ic + ' ' + T(o.bonus.ko, o.bonus.en) + ' <b>' + (o.bonus.matN ? '🧱 +' + o.bonus.matN : ic + ' +' + o.bonus.cropN) + '</b>'; }
    else bb.hidden = true;
    $('back').classList.add('show');
  }
  // 받기 — 자루가 밭에 쏟아진다. 주워야 내 것이 된다
  function takeBack() {
    const o = G.back; G.back = null; $('back').classList.remove('show');
    if (!o) return;
    S.plots.forEach(p => { p.t = 1; p.ripe = true; });   // 보상은 이것 — 밭이 다 익어 있다
    if (o.bonus && o.bonus.matN) { S.mat += o.bonus.matN; fly(POS.pad.x, POS.pad.y - 40, '🧱', 8, 'matN'); float(POS.pad.x, POS.pad.y - 90, '+' + o.bonus.matN, '#ffb070'); }
    if (o.bonus && o.bonus.cropN) { S.crop += o.bonus.cropN; const a = plotPos(0); fly(a.x, a.y - 20, CROPS[S.up.seed][0], 8, 'cropN'); float(a.x, a.y - 60, '+' + o.bonus.cropN); }
    if (!S.up.wall) { let d = o.mess.dust; S.plots.forEach(p => { if (d > 0 && !p.dust) { p.dust = true; d--; } }); }
    if (o.mess.bug && !bug) setTimeout(() => { if (!bug) spawnBug(); }, 1200);
    SND.play('crates'); if (o.bonus) SND.play('nice'); save(); renderShop();
  }
  $('btnBack').addEventListener('click', takeBack);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (G.place === 'play') save(); } else if (S.t && G.place === 'play') checkBack((Date.now() - S.t) / 1000); });

  // ── 입력: 탭 = 행동, 끌기 = 화면, 휠·손가락 벌리기 = 줌 ──
  const ptrs = new Map(); const drag = { on: false, moved: false, x0: 0, y0: 0, cx0: 0, cy0: 0, pinch: 0, z0: 1, mx: 0, my: 0 };
  const toLocal = e => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; };
  canvas.addEventListener('pointerdown', e => {
    if (G.place !== 'play') return; e.preventDefault(); const p = toLocal(e); ptrs.set(e.pointerId, p); try { canvas.setPointerCapture(e.pointerId); } catch (_) { }
    if (ptrs.size === 1) { drag.on = true; drag.moved = false; drag.x0 = p.x; drag.y0 = p.y; drag.cx0 = G.cam.x; drag.cy0 = G.cam.y; }
    else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; drag.pinch = Math.hypot(a.x - b.x, a.y - b.y); drag.z0 = G.z; drag.mx = (a.x + b.x) / 2; drag.my = (a.y + b.y) / 2; drag.moved = true; }
  });
  canvas.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return; const p = toLocal(e); ptrs.set(e.pointerId, p);
    if (ptrs.size >= 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (drag.pinch > 0) { const before = toWorld(drag.mx, drag.my); G.z = drag.z0 * d / drag.pinch; G.cam.x = before.x - drag.mx / G.z; G.cam.y = before.y - drag.my / G.z; G.free = 8; clampCam(); } return; }
    if (!drag.on) return;
    if (Math.hypot(p.x - drag.x0, p.y - drag.y0) > 6) drag.moved = true;
    if (drag.moved) { G.cam.x = drag.cx0 - (p.x - drag.x0) / G.z; G.cam.y = drag.cy0 - (p.y - drag.y0) / G.z; G.free = 8; clampCam(); }
  });
  const endPtr = e => { if (!ptrs.has(e.pointerId)) return; const p = ptrs.get(e.pointerId); ptrs.delete(e.pointerId); if (ptrs.size === 0) { const was = drag.on; drag.on = false; drag.pinch = 0; if (was && !drag.moved && e.type === 'pointerup') { const w = toWorld(p.x, p.y); tap(w.x, w.y); } } else if (ptrs.size === 1) { const q = [...ptrs.values()][0]; drag.x0 = q.x; drag.y0 = q.y; drag.cx0 = G.cam.x; drag.cy0 = G.cam.y; drag.pinch = 0; } };
  canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('wheel', e => { if (G.place !== 'play') return; e.preventDefault(); const p = toLocal(e); zoomAt(p.x, p.y, e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
  function tap(wx, wy) {
    if (Math.abs(wx - P.x) < 36 && wy > P.y - 96 && wy < P.y + 24) { orderBear(); return; }   // 곰돌이를 누르면 일하러 간다
    if (bug && bug.state === 'eat' && Math.hypot(wx - bug.x, wy - (bug.y - 12)) < 30) { shoo(false); return; }
    for (const q of S.q) if (Math.abs(wx - q.x) < 50 && Math.abs(wy - q.y) < 50) { q.prog = Math.min(q.dur, q.prog + q.dur / 3); /* 망치 3번이면 완공(사장님). 안 두드리면 곰이 천천히 짓는다 */ SND.play('hammer'); for (let i = 0; i < 6; i++) sparkle(q.x + rnd(-16, 16), q.y - rnd(0, 30)); if (q.prog >= q.dur) { S.q.splice(S.q.indexOf(q), 1); finishSite(q); if (P.task && P.task.q === q) P.task = null; } return; }
    if (Math.abs(wx - POS.pad.x) < 44 && wy > POS.pad.y - 130 && wy < POS.pad.y + 40) { if (R.state === 'pad') { if (!launch()) { SND.play('click'); float(POS.pad.x, POS.pad.y - 90, CROPS[S.up.seed][0] + ' ' + LAUNCH_MIN, '#fff'); } } return; }
    for (let i = 0; i < S.plots.length; i++) { const p = S.plots[i], a = plotPos(i); if (Math.abs(wx - a.x) < 42 && wy > a.y - 60 && wy < a.y + 30) { if (p.dust) { p.dust = false; SND.play('brush'); for (let k = 0; k < 8; k++) puff(a.x + rnd(-25, 25), a.y - rnd(0, 40)); } else if (p.ripe) { harvest(p, i, true); if (P.task && P.task.kind === 'harvest' && P.task.i === i) P.task = null; } else SND.play('click'); return; } }
  }
  const keys = {};
  addEventListener('keydown', e => {
    if (e.key.startsWith('Arrow')) keys[e.key] = true;
    if (G.place !== 'play') return;
    if (e.key === 'b' || e.key === 'B') openShop();
    if (e.key === 'm' || e.key === 'M') $('btnBgm').click();
    if (e.key === 'k' || e.key === 'K') $('btnSfx').click();
    if (e.key === '+' || e.key === '=') zoomAt(W / 2, H / 2, 1.2);
    if (e.key === '-' || e.key === '_') zoomAt(W / 2, H / 2, 1 / 1.2);
    if (e.key === 'Escape') closeShop();
  });
  addEventListener('keyup', e => { keys[e.key] = false; });
  setInterval(() => { if (G.place !== 'play') return; const v = 14 / G.z; let m = false; if (keys.ArrowLeft) { G.cam.x -= v; m = true; } if (keys.ArrowRight) { G.cam.x += v; m = true; } if (keys.ArrowUp) { G.cam.y -= v; m = true; } if (keys.ArrowDown) { G.cam.y += v; m = true; } if (m) { G.free = 8; clampCam(); } }, 30);
  $('btnShop').addEventListener('click', () => { if (G.place === 'play') openShop(); });
  $('btnClose').addEventListener('click', closeShop);
  $('shop').addEventListener('click', e => { if (e.target === $('shop')) closeShop(); });
  $('btnBgm').addEventListener('click', () => { $('btnBgm').classList.toggle('off', !SND.toggleBgm()); });
  $('btnSfx').addEventListener('click', () => { $('btnSfx').classList.toggle('off', !SND.toggleSfx()); });
  $('btnBgm').classList.toggle('off', !SND.bgm); $('btnSfx').classList.toggle('off', !SND.sfx);
  $('rotGo').addEventListener('click', () => { if (window.OL) OL.go(); });
  $('rotSkip').addEventListener('click', e => { e.preventDefault(); document.body.classList.remove('portrait'); });
  function orient() { document.body.classList.toggle('portrait', innerHeight > innerWidth && !document.documentElement.classList.contains('ol-land')); }
  function resize() { const s = innerHeight / H; W = Math.round(clamp(innerWidth / s, 480, 1400)); if (!isFinite(W)) W = 960; canvas.width = W * 2; canvas.height = H * 2; canvas.style.width = Math.round(W * s) + 'px'; canvas.style.height = innerHeight + 'px'; clampCam(); orient(); }
  addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 150)); resize();

  // ── 상점 ──
  function openShop() { if (G.place !== 'play') return; G.place = 'shop'; renderShop(); $('shop').classList.add('show'); SND.play('click'); }
  function closeShop() { if (G.place !== 'shop') return; G.place = 'play'; $('shop').classList.remove('show'); }
  $('tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; G.tab = b.dataset.tab; renderShop(); });
  document.getElementById('btnRedev').addEventListener('click', () => { document.getElementById('ending').classList.remove('show'); SND.play('click'); });
  // ── 사면 뭘 얻는지 (사장님 2026-09-10) ──
  // 지금 값 → 사고 난 값을 그대로 보여준다. 말로만 "+15%" 하면 그게 얼마인지 모른다.
  const r1 = v => (Math.round(v * 100) / 100).toString();
  const s1 = v => (Math.round(v * 10) / 10).toString();
  function gainOf(it) {
    const n = S.bought[it.id] || 0, u = S.up, C = cnt;
    const yld = (seed, solar, yl, lab, park) => Math.round(YIELD[seed] * (1 + .25 * solar) * (1 + .05 * lab) * (1 + .05 * park) * (1 + .15 * yl));
    const regen = (dr, res, dam) => .08 + .12 * dr * (1 + .25 * res) + .6 * dam;
    const wcap = (res, dam) => 40 + 150 * res + 1000 * dam;
    const trip = (port, dish) => Math.max(6, 15 * Math.pow(.9, port) * Math.pow(.85, dish));
    const rate = (hab, sky) => 1 + .1 * hab + .2 * sky;
    const A = (ko, en) => T(ko, en);
    switch (it.id) {
      case 'plot': return A('밭 ' + S.plots.length + '칸 → ' + (S.plots.length + 1) + '칸', 'Plots ' + S.plots.length + ' → ' + (S.plots.length + 1));
      case 'yield': return A('한 판 수확 ' + yld(u.seed, u.solar, u.yield, C('lab'), C('park')) + ' → ' + yld(u.seed, u.solar, u.yield + 1, C('lab'), C('park')),
                             'Harvest ' + yld(u.seed, u.solar, u.yield, C('lab'), C('park')) + ' → ' + yld(u.seed, u.solar, u.yield + 1, C('lab'), C('park')));
      case 'solar': return A('한 판 수확 ' + yld(u.seed, u.solar, u.yield, C('lab'), C('park')) + ' → ' + yld(u.seed, u.solar + 1, u.yield, C('lab'), C('park')),
                             'Harvest ' + yld(u.seed, u.solar, u.yield, C('lab'), C('park')) + ' → ' + yld(u.seed, u.solar + 1, u.yield, C('lab'), C('park')));
      case 'seed': { const a = CROPS[u.seed], b = CROPS[Math.min(CROPS.length - 1, u.seed + 1)];
        return A(a[0] + ' ' + a[1] + ' → ' + b[0] + ' ' + b[1] + ' · 단가 ' + r1(PRICE[u.seed]) + ' → ' + r1(PRICE[Math.min(4, u.seed + 1)]),
                 a[0] + ' ' + a[2] + ' → ' + b[0] + ' ' + b[2] + ' · price ' + r1(PRICE[u.seed]) + ' → ' + r1(PRICE[Math.min(4, u.seed + 1)])); }
      case 'drill': return A('물 회복 ' + r1(regen(u.drill, u.res, u.dam)) + ' → ' + r1(regen(u.drill + 1, u.res, u.dam)) + '/초',
                             'Water ' + r1(regen(u.drill, u.res, u.dam)) + ' → ' + r1(regen(u.drill + 1, u.res, u.dam)) + '/s');
      case 'res': return A('물통 ' + wcap(u.res, u.dam) + ' → ' + wcap(u.res + 1, u.dam), 'Tank ' + wcap(u.res, u.dam) + ' → ' + wcap(u.res + 1, u.dam));
      case 'dam': return A('물통 ' + wcap(u.res, u.dam) + ' → ' + wcap(u.res, u.dam + 1), 'Tank ' + wcap(u.res, u.dam) + ' → ' + wcap(u.res, u.dam + 1));
      case 'cargo': return A('자루 ' + CAP() + ' → ' + Math.round(60 * Math.pow(1.5, u.cargo + 1)), 'Bay ' + CAP() + ' → ' + Math.round(60 * Math.pow(1.5, u.cargo + 1)));
      case 'wheels': return A('이동 ' + SPEED() + ' → ' + (70 + 35 * (u.wheels + 1)), 'Speed ' + SPEED() + ' → ' + (70 + 35 * (u.wheels + 1)));
      case 'dish': return A('로켓 왕복 ' + s1(trip(C('port'), u.dish)) + '초 → ' + s1(trip(C('port'), u.dish + 1)) + '초', 'Trip ' + s1(trip(C('port'), u.dish)) + 's → ' + s1(trip(C('port'), u.dish + 1)) + 's');
      case 'port': return A('로켓 왕복 ' + s1(trip(C('port'), u.dish)) + '초 → ' + s1(trip(C('port') + 1, u.dish)) + '초', 'Trip ' + s1(trip(C('port'), u.dish)) + 's → ' + s1(trip(C('port') + 1, u.dish)) + 's');
      case 'auto': return A('자루가 차면 알아서 발사', 'Auto-launch when full');
      case 'wall': return A('모래폭풍에 밭이 안 덮인다', 'Storms cannot bury plots');
      case 'drone': return A('벌레를 알아서 쫓는다', 'Zaps bugs for you');
      case 'hab': return A('작물 값 ×' + r1(rate(C('hab'), C('sky'))) + ' → ×' + r1(rate(C('hab') + 1, C('sky'))), 'Crop value ×' + r1(rate(C('hab'), C('sky'))) + ' → ×' + r1(rate(C('hab') + 1, C('sky'))));
      case 'sky': return A('작물 값 ×' + r1(rate(C('hab'), C('sky'))) + ' → ×' + r1(rate(C('hab'), C('sky') + 1)), 'Crop value ×' + r1(rate(C('hab'), C('sky'))) + ' → ×' + r1(rate(C('hab'), C('sky') + 1)));
      case 'lab': return A('한 판 수확 ' + yld(u.seed, u.solar, u.yield, C('lab'), C('park')) + ' → ' + yld(u.seed, u.solar, u.yield, C('lab') + 1, C('park')) + ' (+5%)', 'Harvest +5%');
      case 'park': return A('한 판 수확 ' + yld(u.seed, u.solar, u.yield, C('lab'), C('park')) + ' → ' + yld(u.seed, u.solar, u.yield, C('lab'), C('park') + 1) + ' (+5%)', 'Harvest +5%');
      case 'factory': return A('10초마다 🧱 ' + Math.round(1.5 * C('factory')) + ' → ' + Math.round(1.5 * (C('factory') + 1)), 'Bricks per 10s ' + Math.round(1.5 * C('factory')) + ' → ' + Math.round(1.5 * (C('factory') + 1)));
      case 'pine': return A('화성이 초록으로 물든다 (경치)', 'Greens the planet (scenery)');
    }
    return '';
  }
  function renderShop() {
    if (G.place !== 'shop') return;
    $('tabs').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.tab === G.tab));
    $('shopMat').textContent = Math.floor(S.mat);
    const list = SHOP.filter(it => it.tab === G.tab && visible(it));
    $('shopBody').innerHTML = '<div class="items">' + list.map(it => {
      const p = priceOf(it), n = S.bought[it.id] || 0, max = p === null, lvl = it.price ? 'Lv ' + n + '/' + it.price.length : (it.id === 'cargo' ? 'Lv ' + n + (it.max ? '/' + it.max : '') + ' · ' + CAP() : '×' + n) + (isCity(it) && BL.length ? ' · ' + T(BL[pickPreview(it.id)].ko, BL[pickPreview(it.id)].en) : '');
      const cls = max ? 'max' : canBuy(it) ? '' : 'no';
      // 도시는 설명을 안 붙인다 — 작물 팔아 도시를 짓는 것 자체가 목표다 (사장님 2026-09-10)
      const gain = (max || it.tab === 'city') ? '' : gainOf(it);
      return '<div class="item ' + cls + '" data-id="' + it.id + '"><span class="ic">' + it.ic + '</span>' + '<span class="n">' + T(it.ko, it.en) + '<small>' + lvl + '</small>' + (gain ? '<em>' + gain + '</em>' : '') + '</span>' + '<span class="p">' + (max ? 'MAX' : curIc(it) + ' ' + p) + '</span></div>';
    }).join('') + (list.length ? '' : '<div style="opacity:.5;text-align:center;padding:30px">🔒</div>') + '</div>';
    // 사는 건 오른쪽 값(돈 표시)을 눌러야 된다 — 칸 아무 데나 눌러 잘못 사는 일이 없게 (사장님 2026-09-10)
    $('shopBody').querySelectorAll('.item .p').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); const it = SHOP.find(i => i.id === el.parentNode.dataset.id); if (it) buy(it); }));
  }

  // ── 시작 ──
  function begin(away) {
    SND.init(); $('title').classList.add('hide'); $('cropIc').textContent = CROPS[S.up.seed][0];
    G.shown.crop = S.crop; G.shown.mat = S.mat; P.x = POS.pod.x; P.y = POS.pod.y + 70; P.task = null; P.tx = null; P.pose = null; P.still = 0; R.state = 'pad'; R.cargo = 0; R.y = 0; G.storm = 0; G.warn = 0; G.stormT = rnd(150, 220); G.free = 0; G.z = .9; G.cam.x = P.x - W / 2 / G.z; G.cam.y = P.y - 20 - H / 2 / G.z; clampCam(); bug = null; floats = []; flys = []; parts = []; sand = [];
    G.place = 'play'; document.body.classList.add('playing'); $('topbar').classList.add('show'); $('keys').classList.add('show');
    toast('DAY ' + S.sol, false, 1400); SND.play('bell'); hud();
    if (away) checkBack(away); save();
  }
  function newGame() { if (!$('btnCont').hidden && !newGame.armed) { newGame.armed = true; $('btnNew').querySelector('span').textContent = T('지우고 새로', 'ERASE & START'); return; } S = fresh(); begin(0); }
  function contGame() { load(); const away = S.t ? (Date.now() - S.t) / 1000 : 0; begin(away); }
  $('btnNew').addEventListener('click', newGame); $('btnCont').addEventListener('click', contGame);
  if (load()) { $('btnCont').hidden = false; $('contInfo').textContent = 'DAY ' + S.sol + ' · 🧱 ' + Math.floor(S.mat) + ' · 🏗 ' + S.built; }

  // ── 그리기 ──
  const seedRnd = (() => { let s = 7; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
  const ROCKS = []; for (let i = 0; i < 700; i++) ROCKS.push({ x: seedRnd() * 2400, y: 110 + seedRnd() * 2600, r: 3 + seedRnd() * 10, k: seedRnd() });
  const CRATERS = []; for (let i = 0; i < 70; i++) CRATERS.push({ x: seedRnd() * 2400, y: 110 + seedRnd() * 2600, r: 18 + seedRnd() * 50 });
  const CANYON = []; for (let i = 0; i <= 24; i++) CANYON.push(seedRnd());
  const PINES = []; for (let k = 0; k < 540; k++) PINES.push({ x: 120 + seedRnd() * 2020, y: 985 + seedRnd() * 280, r: 9 + seedRnd() * 9 }); PINES.sort((a, b) => a.x - b.x);   // 도심과 주거단지 사이 소나무 숲(사장님 지시 2026-09-09)
  const RIVER = (() => { const pts = [[POS.res.x - 30, POS.res.y - 30], [150, 1040]]; for (let y = 1000; y >= 180; y -= 30) pts.push([52 + Math.sin(y * .013) * 14 + Math.sin(y * .04) * 5, y]); pts.push([56, 120], [110, 82]); for (let x = 150; x <= MAPW - 120; x += 30) pts.push([x, 80 + Math.sin(x * .011) * 20 + Math.sin(x * .031) * 7]); pts.push([MAPW - 105, 96]); const seg = [0]; for (let i = 1; i < pts.length; i++) seg.push(seg[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, seg, len: seg[seg.length - 1] }; })();   // 강: 저수지에서 출발 → 협곡 → 왼쪽 가장자리 → 위쪽 → 끝 호수
  function riverAt(t) { const L = clamp(t, 0, 1) * RIVER.len; let i = 1; while (i < RIVER.seg.length - 1 && RIVER.seg[i] < L) i++; const a = RIVER.pts[i - 1], b = RIVER.pts[i], u = (L - RIVER.seg[i - 1]) / (RIVER.seg[i] - RIVER.seg[i - 1] || 1); return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u }; }
  function riverPath(f) { ctx.beginPath(); const L = f * RIVER.len; ctx.moveTo(RIVER.pts[0][0], RIVER.pts[0][1]); for (let i = 1; i < RIVER.pts.length; i++) { if (RIVER.seg[i] <= L) ctx.lineTo(RIVER.pts[i][0], RIVER.pts[i][1]); else { const e = riverAt(f); ctx.lineTo(e.x, e.y); break; } } }
  const RTREES = []; for (let k = 0; k < 170; k++) RTREES.push({ t: seedRnd(), o: (seedRnd() < .5 ? -1 : 1) * (38 + seedRnd() * 30), r: 6 + seedRnd() * 8 });   // 강가 숲: 강 위치(t)와 옆 거리
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
  function txt(s, x, y, col, size) { ctx.font = 'bold ' + (size || 10) + "px 'Ria', 'Griun', sans-serif"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText(s, x, y); ctx.fillStyle = col || '#fff'; ctx.fillText(s, x, y); }
  function icon(s, x, y, size) { ctx.font = (size || 11) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(s, x, y); }
  function bar(x, y, w, v, col) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, 6); ctx.fillStyle = col; ctx.fillRect(x - w / 2, y, Math.max(0, w * v), 4); }
  function shadow(x, y, r) { ctx.fillStyle = 'rgba(30,10,0,.28)'; ctx.beginPath(); ctx.ellipse(x + r * .35, y + 3, r * 1.05, r * .42, 0, 0, TAU); ctx.fill(); }
  const darker = (h, k) => mix(h, '#101018', k || .35), lighter = (h, k) => mix(h, '#ffffff', k || .35);
  const mix = (a, b, t) => { const c = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)], A = c(a), B = c(b); return 'rgb(' + A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',') + ')'; };
  const inRect = (r, x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  let V = { x: 0, y: 0, w: 0, h: 0 }, NRAW = 0;   // 지금 보이는 세계 영역, 밤 정도(0~1)
  const vis = (x, y, m) => x > V.x - m && x < V.x + V.w + m && y > V.y - m && y < V.y + V.h + m;

  function dome(x, y, r, tint, n) { ctx.save(); ctx.beginPath(); ctx.ellipse(x, y + 2, r * 1.05, r * .55, 0, 0, TAU); ctx.fillStyle = 'rgba(40,10,0,.22)'; ctx.fill(); ctx.beginPath(); ctx.arc(x, y - r * .35, r, 0, TAU); const g = ctx.createRadialGradient(x - r * .4, y - r * .8, r * .1, x, y - r * .35, r); g.addColorStop(0, 'rgba(255,255,255,.7)'); g.addColorStop(.5, tint || 'rgba(190,230,255,.28)'); g.addColorStop(1, 'rgba(160,200,240,.35)'); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = 'rgba(20,20,60,.16)'; ctx.beginPath(); ctx.arc(x, y - r * .35, r, .2, 1.6); ctx.arc(x + r * .18, y - r * .5, r * .8, 1.6, .2, true); ctx.fill(); ctx.restore(); }

  function drawGround(n) {
    ctx.fillStyle = mix('#cc8a44', '#6a4834', n); ctx.fillRect(V.x, V.y, V.w, V.h);
    const fr = farmRect(), cr = cityRect(), rr2 = drect('res');
    for (const c of CRATERS) { if (!vis(c.x, c.y, 60) || inRect(fr, c.x, c.y) || inRect(cr, c.x, c.y) || inRect(rr2, c.x, c.y)) continue; ctx.fillStyle = mix('#a86238', '#3e2028', n); ctx.beginPath(); ctx.ellipse(c.x, c.y, c.r, c.r * .7, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = mix('#e8b060', '#5a2c3c', n); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(c.x, c.y, c.r, c.r * .7, 0, Math.PI, TAU); ctx.stroke(); }
    for (const r of ROCKS) { if (!vis(r.x, r.y, 20) || inRect(fr, r.x, r.y) || inRect(cr, r.x, r.y) || inRect(rr2, r.x, r.y)) continue; ctx.fillStyle = mix(r.k > .5 ? '#5e3220' : '#7a4028', '#2a1420', n); ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r, r.r * .65, 0, 0, TAU); ctx.fill(); ctx.fillStyle = mix('#e8b868', '#5a2a38', n); ctx.beginPath(); ctx.ellipse(r.x - r.r * .3, r.y - r.r * .3, r.r * .4, r.r * .25, 0, 0, TAU); ctx.fill(); }
    drawPines(n, true);
    if (vis(340, 900, 700)) {
      const cy1 = 840, cy2 = 960, cx2 = 680;
      const path = () => { ctx.beginPath(); ctx.moveTo(0, cy1 + 10); for (let i = 0; i <= 17; i++) ctx.lineTo(i * 40, cy1 + CANYON[i] * 24); ctx.lineTo(cx2, cy1 + 30); ctx.lineTo(cx2, cy2 - 30); for (let i = 17; i >= 0; i--) ctx.lineTo(i * 40, cy2 - CANYON[(i + 7) % 25] * 24); ctx.closePath(); };
      ctx.fillStyle = mix('#5a2418', '#180a14', n); path(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2; ctx.stroke();
      if (S.up.dam) {
        const lv = clamp(clamp(S.water / WCAP(), 0, 1) * (G.fill > 0 ? 1 - Math.max(0, G.fill / 4) : 1), 0, 1), wx = POS.dam.x - 10, ww = wx * lv;
        ctx.save(); path(); ctx.clip(); ctx.fillStyle = mix('#2f90d8', '#182e60', n); ctx.fillRect(wx - ww, cy1 - 10, ww, cy2 - cy1 + 20);
        ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.5; for (let k = 0; k < 4; k++) { ctx.beginPath(); for (let x = wx - ww; x <= wx; x += 6) ctx.lineTo(x, cy1 + 18 + k * 26 + Math.sin(G.anim * 2 + x * .08 + k) * 3); ctx.stroke(); } ctx.restore();
        const h = 26 + S.up.dam * 8, g = ctx.createLinearGradient(wx, 0, wx + h, 0); g.addColorStop(0, mix('#e0dcd4', '#6a6070', n)); g.addColorStop(1, mix('#9a948c', '#3a3040', n)); ctx.fillStyle = g; rr(wx - 4, cy1 - 4, h, cy2 - cy1 + 8, 6); ctx.fill(); ctx.fillStyle = '#ffd24a'; for (let k = 0; k < 5; k++) ctx.fillRect(wx + h / 2 - 3, cy1 + 4 + k * 24, 6, 12); ctx.fillStyle = Math.sin(G.anim * 4) > 0 ? '#ff4040' : '#601010'; ctx.beginPath(); ctx.arc(wx + h / 2, cy1 - 8, 3, 0, TAU); ctx.fill();
      }
    }

    // 강과 숲: 저수지를 키우면(2단계) 강이 뻗어 나가고, 3단계면 위쪽 끝 호수까지 이어진다. 강가 숲은 강이 자란 만큼
    const RF = S.up.res >= 3 ? 1 : S.up.res === 2 ? .5 : 0;
    if (RF > 0) {
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = mix('#7fb85a', '#2c4a30', n); ctx.lineWidth = 160; riverPath(RF); ctx.stroke();
      ctx.strokeStyle = mix('#5aa050', '#22402a', n); ctx.lineWidth = 110; riverPath(RF); ctx.stroke();
      ctx.strokeStyle = mix('#d8c8a0', '#5a5048', n); ctx.lineWidth = 66; riverPath(RF); ctx.stroke();
      ctx.strokeStyle = mix('#2f90d8', '#182e60', n); ctx.lineWidth = 52; riverPath(RF); ctx.stroke();
      ctx.strokeStyle = mix('#5fb8f0', '#2a4a80', n); ctx.lineWidth = 30; ctx.globalAlpha = .5; riverPath(RF); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.restore();
      if (RF >= 1) {   // 강 끝 저수지: 화면 오른쪽 끝, 구덩이 테두리 + 물 + 잔물결
        const e = RIVER.pts[RIVER.pts.length - 1], ex = e[0], ey = e[1]; ctx.fillStyle = mix('#5a2a18', '#1a0c14', n); ctx.beginPath(); ctx.ellipse(ex, ey, 92, 62, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(ex, ey - 3, 86, 58, 0, Math.PI, TAU); ctx.fill(); ctx.fillStyle = mix('#2f90d8', '#182e60', n); ctx.beginPath(); ctx.ellipse(ex, ey, 82, 54, 0, 0, TAU); ctx.fill(); ctx.fillStyle = mix('#5fb8f0', '#2a4a80', n); ctx.beginPath(); ctx.ellipse(ex - 12, ey - 8, 44, 26, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1.5; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(ex, ey, 24 + k * 18, 15 + k * 12, 0, Math.PI * .1 + Math.sin(G.anim * 2 + k) * .3, Math.PI * .9 + Math.sin(G.anim * 2 + k) * .3); ctx.stroke(); } }
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5;
      for (let k = 0; k < 60; k++) { const t = (G.anim * .012 + k * .0371) % 1; if (t >= RF) continue; const q = riverAt(t), q2 = riverAt(Math.min(1, t + .004)), dx = q2.x - q.x, dy = q2.y - q.y, L = Math.hypot(dx, dy) || 1, o = ((k * 37) % 30) - 15, px = q.x - dy / L * o, py = q.y + dx / L * o; if (!vis(px, py, 20)) continue; ctx.beginPath(); ctx.arc(px, py, 6, Math.atan2(dy, dx) + .4, Math.atan2(dy, dx) + 2.7); ctx.stroke(); }
      for (const t of RTREES) { if (t.t >= RF) continue; const q = riverAt(t.t), q2 = riverAt(Math.min(1, t.t + .004)), dx = q2.x - q.x, dy = q2.y - q.y, L = Math.hypot(dx, dy) || 1, tx = q.x - dy / L * t.o, ty = q.y + dx / L * t.o; if (!vis(tx, ty, 30) || tx < 16 || ty < 16 || Math.hypot(tx - POS.res.x, ty - POS.res.y) < 130) continue; tree(tx, ty, t.r, n); }
    }
    // 농장 구역: 개간한 줄만 갈아엎은 흙, 그 바깥은 척박한 땅
    if (vis(fr.x + fr.w / 2, fr.y + fr.h / 2, 600)) { ctx.fillStyle = mix('#5a2e1c', '#241018', n); rr(fr.x, fr.y, fr.w, fr.h, 14); ctx.fill(); ctx.strokeStyle = mix('#7a4228', '#3a2028', n); ctx.lineWidth = 2; for (let y = fr.y + 14; y < fr.y + fr.h; y += 12) { ctx.beginPath(); ctx.moveTo(fr.x + 10, y); ctx.lineTo(fr.x + fr.w - 10, y); ctx.stroke(); } ctx.strokeStyle = 'rgba(255,220,180,.25)'; ctx.setLineDash([8, 8]); rr(fr.x - 6, fr.y - 6, fr.w + 12, fr.h + 12, 18); ctx.stroke(); ctx.setLineDash([]); }
    // 도시 구역: 테라포밍(잔디·가로수) + 도로 격자 + 구획 + 로버
    if (zcount('dt')) drawHalo('dt', n);
    if (zcount('res')) drawHalo('res', n);
    if (zcount('dt')) drawDistrict('dt', n);
    if (zcount('res')) drawDistrict('res', n);
    drawPines(n, false);
    // 저수지 (구덩이)
    if (S.up.res && vis(POS.res.x, POS.res.y, 200)) { const r = 40 + S.up.res * 14, lv = clamp(clamp(S.water / WCAP(), 0, 1) * (G.fill > 0 ? 1 - Math.max(0, G.fill / 2.5) * .8 : 1), 0, 1); ctx.fillStyle = mix('#5a2a18', '#1a0c14', n); ctx.beginPath(); ctx.ellipse(POS.res.x, POS.res.y, r + 8, (r + 8) * .7, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(POS.res.x, POS.res.y - 3, r + 4, (r + 4) * .7, 0, Math.PI, TAU); ctx.fill(); ctx.fillStyle = mix('#2f90d8', '#182e60', n); ctx.beginPath(); ctx.ellipse(POS.res.x, POS.res.y, r * (.35 + .65 * lv), r * .7 * (.35 + .65 * lv), 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1.5; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(POS.res.x, POS.res.y, r * (.2 + k * .2) * lv + 4, r * .7 * (.2 + k * .2) * lv + 2, 0, Math.PI * .1 + Math.sin(G.anim * 2 + k) * .3, Math.PI * .9 + Math.sin(G.anim * 2 + k) * .3); ctx.stroke(); } }
    // 태양광
    for (let k = 0; k < S.up.solar; k++) { const px = POS.solar.x - 40 + (k % 3) * 40, py = POS.solar.y - 30 + Math.floor(k / 3) * 46; if (!vis(px, py, 60)) continue; ctx.fillStyle = mix('#2a4a8a', '#182040', n); rr(px - 16, py - 12, 32, 26, 3); ctx.fill(); ctx.strokeStyle = 'rgba(160,200,255,.6)'; ctx.lineWidth = 1; ctx.strokeRect(px - 16, py - 12, 32, 26); ctx.beginPath(); ctx.moveTo(px, py - 12); ctx.lineTo(px, py + 14); ctx.moveTo(px - 16, py + 1); ctx.lineTo(px + 16, py + 1); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(px - 14, py - 10, 10, 4); }
    // 로켓 발사대 바닥
    if (vis(POS.pad.x, POS.pad.y, 120)) { ctx.fillStyle = mix('#6c7078', '#2a2a34', n); ctx.beginPath(); ctx.ellipse(POS.pad.x, POS.pad.y + 8, 58, 30, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 3; ctx.setLineDash([12, 10]); ctx.beginPath(); ctx.ellipse(POS.pad.x, POS.pad.y + 8, 44, 22, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
  }
  function drawPlot(p, i, n) {
    const a = plotPos(i), x = a.x, y = a.y; if (!vis(x, y, 80)) return;
    const g = p.ripe ? 1 : p.t, dry = S.water <= 0, cinfo = CROPS[S.up.seed];
    ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(x - 41, y - 25, 88, 60, 10); ctx.fill(); ctx.fillStyle = mix('#4a2412', '#180a10', n); rr(x - 44, y - 28, 88, 60, 10); ctx.fill(); ctx.strokeStyle = 'rgba(255,200,150,.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 42, y + 30); ctx.lineTo(x - 42, y - 26); ctx.lineTo(x + 42, y - 26); ctx.stroke();
    const leaf = dry ? '#8a7a40' : mix('#4fbf5a', '#2a6a44', n), leaf2 = dry ? '#6a5a30' : mix('#2e8a3e', '#1c4a30', n);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const px = x - 24 + c * 24, py = y - 14 + r * 18, s = 3 + g * 8; ctx.fillStyle = (r + c) % 2 ? leaf : leaf2; ctx.beginPath(); ctx.ellipse(px + Math.sin(G.anim * 1.5 + r + c) * g, py, s, s * .8, 0, 0, TAU); ctx.fill(); if (p.ripe) icon(cinfo[0], px + ((r + c) % 2 ? 4 : -4), py - 4, 11); }
    if (p.ripe) { ctx.save(); ctx.globalAlpha = .35 + Math.sin(G.anim * 5) * .25; ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y - 12, 40, 0, TAU); ctx.stroke(); ctx.restore(); }
    dome(x, y + 2, 38, p.ripe ? 'rgba(255,230,150,.22)' : null, n);
    if (p.dust) { ctx.save(); ctx.beginPath(); ctx.arc(x, y - 11, 38, 0, TAU); ctx.fillStyle = 'rgba(160,90,50,.55)'; ctx.fill(); ctx.strokeStyle = 'rgba(120,60,30,.6)'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - 24 + k * 12, y - 36 + k * 4); ctx.lineTo(x - 18 + k * 12, y - 14 + k * 3); ctx.stroke(); } ctx.restore(); }
    if (!p.ripe) bar(x, y - 58, 34, g, dry ? '#ffb040' : '#7fe08a');
  }
  function drawPod(n) {
    const x = POS.pod.x, y = POS.pod.y; if (!vis(x, y, 140)) return;
    shadow(x, y + 30, 56);
    ctx.fillStyle = '#8a8f98'; for (const dx of [-38, 38]) ctx.fillRect(x + dx - 4, y + 10, 8, 20);
    const body = ctx.createRadialGradient(x - 20, y - 24, 6, x, y - 4, 64); body.addColorStop(0, mix('#ffffff', '#9a90a0', n)); body.addColorStop(1, mix('#b8b2ac', '#4a4050', n)); ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(x, y - 4, 60, 40, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = mix('#e04a3a', '#7a2a30', n); ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(x, y - 4, 52, 33, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = mix('#6c7078', '#3a3a44', n); rr(x - 14, y + 18, 28, 20, 4); ctx.fill(); ctx.fillStyle = '#9aa'; ctx.fillRect(x - 10, y + 22, 20, 3);
    ctx.fillStyle = NRAW > .4 ? '#ffe9a0' : '#8fd0ff'; ctx.beginPath(); ctx.arc(x - 22, y - 8, 10, 0, TAU); ctx.fill(); ctx.strokeStyle = '#666'; ctx.lineWidth = 2; ctx.stroke();
    if (P.hide) { ctx.save(); ctx.beginPath(); ctx.arc(x - 22, y - 8, 9, 0, TAU); ctx.clip(); const fr = pose(G.storm > 0 ? 'face_03' : 'face_01'); if (fr) { const fh = 19, fw = fh * fr.width / fr.height; ctx.drawImage(fr, x - 22 - fw / 2, y - 17, fw, fh); } ctx.restore(); }
    ctx.fillStyle = '#4a4e56'; ctx.beginPath(); ctx.arc(x + 20, y - 14, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#9aa'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 20, y - 14); ctx.lineTo(x + 20, y - 44); ctx.stroke(); ctx.fillStyle = Math.sin(G.anim * 4) > 0 ? '#ff4040' : '#601010'; ctx.beginPath(); ctx.arc(x + 20, y - 46, 3, 0, TAU); ctx.fill();
    const dr = 9 + 4 * S.up.dish; ctx.strokeStyle = '#ccc'; ctx.lineWidth = 2 + S.up.dish * .5; ctx.beginPath(); ctx.arc(x + 20, y - 34, dr, -2.6, -.5); ctx.stroke();
    if (R.state === 'away') { ctx.save(); ctx.strokeStyle = '#7fdcff'; ctx.lineWidth = 1.5; for (let k = 0; k < 3; k++) { const t = (G.anim * .8 + k / 3) % 1; ctx.globalAlpha = (1 - t) * .7; ctx.beginPath(); ctx.arc(x + 20, y - 38, dr + 6 + t * 40, -2.3, -.8); ctx.stroke(); } ctx.restore(); }
  }
  function lanePos(t) { const ax = POS.pad.x, ay = POS.pad.y - 20, bx = POS.sky.x, by = POS.sky.y, mx = ax + 20, my = (ay + by) / 2, u = 1 - t; return { x: u * u * ax + 2 * u * t * mx + t * t * bx, y: u * u * ay + 2 * u * t * my + t * t * by, dx: 2 * u * (mx - ax) + 2 * t * (bx - mx), dy: 2 * u * (my - ay) + 2 * t * (by - my) }; }
  function drawRocket(n) {
    const x = POS.pad.x, y = POS.pad.y; if (R.state === 'pad' && !vis(x, y, 200)) return;
    if (R.state === 'away') { if (vis(x, y, 100)) { bar(x, y - 70, 60, 1 - R.t / TRIP(), '#7fdcff'); icon('🌍', x, y - 88, 18); } return; }
    const t = R.state === 'pad' ? 0 : clamp(R.y / 420, 0, 1), P0 = lanePos(t), s = 1 - .55 * t, ang = R.state === 'pad' ? 0 : Math.atan2(P0.dy, P0.dx) + Math.PI / 2;   // 내려올 때도 발사 때와 같은 방향 — 꼬리(불꽃)부터 착륙(사장님, 2026-09-09)
    if (!vis(P0.x, P0.y, 120)) return;
    ctx.save(); ctx.translate(P0.x, P0.y); ctx.rotate(ang); ctx.scale(s, s);
    if (R.state !== 'pad') { ctx.fillStyle = 'rgba(255,176,48,.9)'; ctx.beginPath(); ctx.ellipse(0, 12, 12 + rnd(0, 4), 16 + rnd(0, 6), 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff3a0'; ctx.beginPath(); ctx.ellipse(0, 10, 6, 8, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#c8433a'; ctx.beginPath(); ctx.moveTo(-14, 6); ctx.lineTo(-24, 12); ctx.lineTo(-12, -12); ctx.fill(); ctx.beginPath(); ctx.moveTo(14, 6); ctx.lineTo(24, 12); ctx.lineTo(12, -12); ctx.fill();
    const g = ctx.createLinearGradient(-14, 0, 14, 0); g.addColorStop(0, '#fff'); g.addColorStop(1, '#b8b4b0'); ctx.fillStyle = g; rr(-14, -56, 28, 64, 7); ctx.fill();
    ctx.fillStyle = '#c8433a'; ctx.beginPath(); ctx.moveTo(-14, -54); ctx.quadraticCurveTo(0, -88, 14, -54); ctx.fill();
    ctx.fillStyle = '#8fd0ff'; ctx.beginPath(); ctx.arc(0, -40, 6, 0, TAU); ctx.fill(); ctx.strokeStyle = '#888'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#c8433a'; ctx.fillRect(-14, -22, 28, 4);
    ctx.restore();
    if (R.state === 'pad' && S.crop >= LAUNCH_MIN) { ctx.save(); ctx.globalAlpha = .5 + Math.sin(G.anim * 5) * .3; ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 2; rr(x - 26, y - 116, 52, 116, 10); ctx.stroke(); ctx.restore(); txt('LAUNCH', x, y - 128, '#ffd24a', 12); }
  }
  function drawDrill(n) {
    if (!S.up.drill) return; const x = POS.drill.x, y = POS.drill.y, h = 34 + S.up.drill * 6; if (!vis(x, y, 80)) return;
    shadow(x, y + 8, 18); ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 14, y + 6); ctx.lineTo(x, y - h); ctx.lineTo(x + 14, y + 6); ctx.stroke(); ctx.fillStyle = '#6c7078'; ctx.fillRect(x - 7, y - h - 6, 14, 8); ctx.fillStyle = '#b8bcc4'; ctx.fillRect(x - 2, y - h, 4, h + Math.sin(G.anim * 10) * 2); ctx.fillStyle = '#7fdcff'; ctx.beginPath(); ctx.ellipse(x, y + 5, 7, 4, 0, 0, TAU); ctx.fill();
    if (Math.random() < .3) parts.push({ x: x + rnd(-3, 3), y: y + 3, vx: rnd(-20, 20), vy: rnd(-40, -10), t: .4, r: 1.5, col: '#bff4ff', g: 100 });
  }
  function drawWall(n) {
    if (!S.up.wall) return; const fr = farmRect(), y = fr.y - 22; if (!vis(fr.x + fr.w / 2, y, 400)) return;
    for (let x = fr.x - 10; x <= fr.x + fr.w + 10; x += 24) { ctx.fillStyle = mix('#b8bcc4', '#4a4a58', n); rr(x - 5, y - 16, 10, 22, 2); ctx.fill(); ctx.fillStyle = '#ffb030'; ctx.fillRect(x - 5, y - 16, 10, 3); }
  }
  function drawDrone(n) {
    if (!S.up.drone) return; const fr = farmRect(), dx = fr.x + fr.w / 2 + Math.sin(G.anim * .5) * fr.w * .4, dy = fr.y + 40 + Math.sin(G.anim * .9) * 30, z = 60 + Math.sin(G.anim * 2.3) * 6; if (!vis(dx, dy, 60)) return;
    shadow(dx, dy + 6, 8); ctx.fillStyle = '#c0c8d0'; ctx.beginPath(); ctx.ellipse(dx, dy - z, 12, 5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#7fdcff'; ctx.beginPath(); ctx.arc(dx, dy - z - 3, 5, Math.PI, 0); ctx.fill(); ctx.fillStyle = Math.sin(G.anim * 8) > 0 ? '#ff5050' : '#50ff70'; ctx.beginPath(); ctx.arc(dx, dy - z + 1, 1.8, 0, TAU); ctx.fill();
  }
  function drawSite(q, n) {
    const x = q.x, y = q.y; if (!vis(x, y, 80)) return;
    ctx.fillStyle = mix('#7a4a30', '#2a1820', n); rr(x - 40, y - 26, 80, 56, 8); ctx.fill();
    ctx.strokeStyle = mix('#c8a060', '#6a5030', n); ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - 30 + k * 30, y + 26); ctx.lineTo(x - 30 + k * 30, y - 44); ctx.stroke(); } for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - 30, y + 4 - k * 22); ctx.lineTo(x + 30, y + 4 - k * 22); ctx.stroke(); }
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(x - 40, y - 50, 80, 5); ctx.fillStyle = '#222'; for (let k = 0; k < 6; k++) ctx.fillRect(x - 40 + k * 13 + 6, y - 50, 6, 5);
    const it = SHOP.find(i => i.id === q.id); if (it) { ctx.save(); ctx.globalAlpha = .6; icon(it.ic, x, y - 12, 24); ctx.restore(); }
    bar(x, y - 62, 60, q.prog / q.dur, '#ffb040');
  }
  // ── 도시: 테라포밍된 땅, 도로 격자, 구획, 건물 116종, 로버 ──
  const RW = () => CITY.rw;
  const HALO = []; for (let k = 0; k < 90; k++) HALO.push({ a: seedRnd() * TAU, d: seedRnd(), r: 6 + seedRnd() * 8 });
  function road(x, y, w, h, n, vert) {   // 아스팔트 + 양쪽 인도 + 중앙 점선
    ctx.fillStyle = mix('#c4bcb0', '#4a4448', n); ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
    ctx.fillStyle = mix('#4c4c56', '#1c1c24', n); ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; if (vert) ctx.fillRect(x - 6, y - 6, 2, h + 12); else ctx.fillRect(x - 6, y - 6, w + 12, 2); ctx.fillStyle = 'rgba(0,0,0,.35)'; if (vert) ctx.fillRect(x + w + 4, y - 6, 2, h + 12); else ctx.fillRect(x - 6, y + h + 4, w + 12, 2);
    ctx.fillStyle = mix('#e8c85a', '#6a5a30', n);
    if (vert) { for (let yy = y + 6; yy < y + h - 8; yy += 22) ctx.fillRect(x + w / 2 - 1, yy, 2, 12); } else { for (let xx = x + 6; xx < x + w - 8; xx += 22) ctx.fillRect(xx, y + h / 2 - 1, 12, 2); }
  }
  function crosswalk(x, y, n, vert) { ctx.fillStyle = mix('#e8e4dc', '#8a8690', n); for (let k = 0; k < 5; k++) { if (vert) ctx.fillRect(x + 3 + k * 5, y, 3, RW()); else ctx.fillRect(x, y + 3 + k * 5, RW(), 3); } }
  function lamp(x, y, n) { const lit = NRAW > .4; ctx.fillStyle = mix('#6c7078', '#2a2a34', n); ctx.fillRect(x - 1.5, y - 22, 3, 22); ctx.fillStyle = lit ? '#ffe9a0' : '#d8dce4'; ctx.beginPath(); ctx.arc(x, y - 24, 3.5, 0, TAU); ctx.fill(); if (lit) { ctx.save(); ctx.globalAlpha = .28 * NRAW; ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.ellipse(x, y - 4, 22, 14, 0, 0, TAU); ctx.fill(); ctx.restore(); } }
  function pine(x, y, r, n) { shadow(x, y + 2, r * .7); ctx.fillStyle = mix('#5a3a22', '#241810', n); ctx.fillRect(x - 2, y - 6, 4, 8); for (let k = 0; k < 3; k++) { const w = r * (1 - k * .25), yy = y - 6 - k * r * .7; ctx.fillStyle = mix(k % 2 ? '#2f7a3e' : '#256a34', '#163a22', n); ctx.beginPath(); ctx.moveTo(x - w, yy); ctx.lineTo(x, yy - r * 1.1); ctx.lineTo(x + w, yy); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(x, yy - r * 1.1); ctx.lineTo(x + w, yy); ctx.lineTo(x + w * .4, yy); ctx.closePath(); ctx.fill(); } }
  function tree(x, y, r, n) { shadow(x, y + 2, r * .8); ctx.fillStyle = mix('#6a4a30', '#2a2018', n); ctx.fillRect(x - 2, y - 4, 4, 8); ctx.fillStyle = mix('#4fa85a', '#2a6a44', n); ctx.beginPath(); ctx.arc(x, y - 8, r, 0, TAU); ctx.fill(); ctx.fillStyle = mix('#8ad880', '#3a7a50', n); ctx.beginPath(); ctx.arc(x - r * .3, y - 8 - r * .3, r * .45, 0, TAU); ctx.fill(); }
  function drawHalo(z, n) {   // 테라포밍: 구역 둘레가 초록으로 물든다. 도로·구획보다 먼저, 두 구역 다 그린다(안 그러면 주거단지 물듦이 도심 아랫줄을 덮는다)
    const cr = drect(z), built = S.city.filter(b => b.z === z && b.done).length; if (!vis(cr.x + cr.w / 2, cr.y + cr.h / 2, Math.max(cr.w, cr.h) + 300)) return;
    const halo = 60 + Math.min(220, built * 8), cx = cr.x + cr.w / 2, cy = cr.y + cr.h / 2;
    ctx.save(); const g = ctx.createRadialGradient(cx, cy, Math.min(cr.w, cr.h) * .45, cx, cy, Math.max(cr.w, cr.h) * .6 + halo); g.addColorStop(0, mix('#6fae4f', '#2c4a30', n)); g.addColorStop(.7, mix('#8fb85a', '#3a5236', n)); g.addColorStop(1, 'rgba(140,180,90,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, cr.w * .75 + halo, cr.h * .75 + halo, 0, 0, TAU); ctx.fill(); ctx.restore();
    ctx.fillStyle = mix('#6fae4f', '#2c4a30', n); rr(cr.x, cr.y, cr.w, cr.h, 16); ctx.fill();
    for (let k = 0; k < Math.min(HALO.length, built * 3); k++) { const t = HALO[k], tx = cx + Math.cos(t.a) * (cr.w * .5 + 30 + t.d * halo * .8), ty = cy + Math.sin(t.a) * (cr.h * .5 + 24 + t.d * halo * .8); if (vis(tx, ty, 30)) tree(tx, ty, t.r, n); }
  }
  function drawPines(n, bg) {
    // 소나무 숲: 도심·주거단지 사이. 건물이 늘수록 빽빽해진다
    {
      const lv = S.up.pine; if (!lv) return; const N = Math.min(PINES.length, lv * 90), dr = zcount('dt') ? cityRect() : null, rr3 = zcount('res') ? drect('res') : null;
      if (bg) { ctx.fillStyle = mix('#5a8a44', '#243a28', n); ctx.globalAlpha = Math.min(1, lv / 6) * .85; rr(110, 975, Math.min(2040, 340 * lv), 300, 40); ctx.fill(); ctx.globalAlpha = 1; return; }
      for (let k = 0; k < N; k++) { const t = PINES[k]; if (t.x > 110 + Math.min(2040, 340 * lv) || !vis(t.x, t.y, 30) || (dr && inRect(dr, t.x, t.y)) || (rr3 && inRect(rr3, t.x, t.y)) || Math.hypot(t.x - POS.res.x, t.y - POS.res.y) < 150) continue; pine(t.x, t.y, t.r, n); }
    }
  }
  function drawDistrict(z, n) {
    const d = DIST[z], cr = drect(z); if (!vis(cr.x + cr.w / 2, cr.y + cr.h / 2, Math.max(cr.w, cr.h))) return;
    const rows = zrows(z), cnt = zcount(z), W0 = dW(d), x0 = d.x, y0 = d.y, built = S.city.filter(b => b.z === z && b.done).length, rw = d.rw;
    // 구획 바닥 — 산 칸만 포장(공원 칸은 잔디 그대로)
    const ents = S.city.filter(c => c.z === z);
    for (let k = 0; k < cnt; k++) { const e = ents[k], c = k % d.cols, r = Math.floor(k / d.cols), lx = dcolX(d, c), ly = drowY(d, r); if (e.type === 'park' && z === 'res') continue; ctx.fillStyle = 'rgba(0,0,0,.22)'; rr(lx + 9, ly + 9, d.cw - 12, d.ch - 12, 6); ctx.fill(); ctx.fillStyle = mix('#d4c8b6', '#4e4650', n); rr(lx + 6, ly + 6, d.cw - 12, d.ch - 12, 6); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(lx + 8, ly + d.ch - 8); ctx.lineTo(lx + 8, ly + 8); ctx.lineTo(lx + d.cw - 8, ly + 8); ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,.07)'; ctx.lineWidth = 1; for (let gx = lx + 26; gx < lx + d.cw - 6; gx += 20) { ctx.beginPath(); ctx.moveTo(gx, ly + 6); ctx.lineTo(gx, ly + d.ch - 6); ctx.stroke(); } }
    // 도로 격자
    const mainX = x0 - rw, top = y0 - rw, bottom = drowY(d, rows - 1) + d.ch + rw;
    if (z === 'dt') road(POS.pad.x + 60, POS.pod.y - rw / 2, mainX - POS.pad.x - 60 + rw, rw, n, false);
    else road(mainX + rw, top - 60, rw, 60, n, true);
    road(mainX, top, rw, bottom - top, n, true);
    for (let c = 2; c < d.cols; c += 2) road(dcolX(d, c) - rw, top, rw, bottom - top, n, true);
    road(x0 + W0, top, rw, bottom - top, n, true);
    road(mainX, top, W0 + 3 * rw, rw, n, false);
    for (let r = 0; r < rows; r++) road(mainX, drowY(d, r) + d.ch, W0 + 3 * rw, rw, n, false);
    const vxs = [mainX]; for (let c = 2; c < d.cols; c += 2) vxs.push(dcolX(d, c) - rw); vxs.push(x0 + W0);
    const hys = [top]; for (let r = 0; r < rows; r++) hys.push(drowY(d, r) + d.ch);
    for (const hy of hys) for (const vx of vxs) { crosswalk(vx - rw, hy, n, false); crosswalk(vx + rw, hy, n, false); crosswalk(vx, hy - rw, n, true); crosswalk(vx, hy + rw, n, true); }
    for (const hy of hys) for (const vx of vxs) { lamp(vx - 9, hy - 9, n); lamp(vx + rw + 9, hy + rw + 9, n); }
    for (let k = 0; k < cnt; k++) { if (!ents[k].done) continue; const c = k % d.cols, r = Math.floor(k / d.cols), lx = dcolX(d, c), ly = drowY(d, r); tree(lx + 14, ly + d.ch - 6, 7, n); tree(lx + d.cw - 14, ly + d.ch - 6, 7, n); }
    drawRovers(z, n);
  }
  function roverStep(dt) {
    for (const z of ['dt', 'res']) {
      const d = DIST[z], rows = zrows(z), mine = rovers.filter(v => v.z === z);
      const want = zcount(z) ? Math.min(8, 1 + Math.floor(S.city.filter(b => b.z === z && b.done).length / 3)) : 0;
      while (mine.length < want) { const v = { z, r: Math.floor(rnd(0, rows + 1)), x: rnd(d.x, d.x + dW(d)), v: rnd(40, 70) * (Math.random() < .5 ? 1 : -1), col: ['#e8e4dc', '#ff7a5a', '#7fdcff', '#ffd24a', '#9fe08a'][mine.length % 5] }; rovers.push(v); mine.push(v); }
      while (mine.length > want) { rovers.splice(rovers.indexOf(mine.pop()), 1); }
      const x1 = d.x - d.rw + 8, x2 = d.x + dW(d) + d.rw - 8;
      for (const v of mine) { if (v.r > rows) v.r = rows; v.x += v.v * dt; if (v.x > x2) { v.x = x2; v.v = -Math.abs(v.v); } if (v.x < x1) { v.x = x1; v.v = Math.abs(v.v); } }
    }
  }
  function drawRovers(z, n) {
    const d = DIST[z];
    for (const v of rovers) { if (v.z !== z) continue; const y = (v.r === 0 ? d.y - d.rw : drowY(d, v.r - 1) + d.ch) + d.rw / 2 + (v.v > 0 ? 5 : -5), x = v.x; if (!vis(x, y, 40)) continue; shadow(x, y + 6, 10); ctx.fillStyle = '#2a2a30'; ctx.fillRect(x - 9, y - 6, 4, 12); ctx.fillRect(x + 5, y - 6, 4, 12); ctx.fillStyle = mix(v.col, '#6a6a70', n * .6); rr(x - 8, y - 5, 16, 10, 3); ctx.fill(); ctx.fillStyle = '#8fd0ff'; ctx.fillRect(x - 3, y - 4, 6, 3); if (NRAW > .4) { ctx.fillStyle = '#fff3a0'; ctx.fillRect(v.v > 0 ? x + 7 : x - 9, y - 4, 2, 8); ctx.save(); ctx.globalAlpha = .25; ctx.beginPath(); ctx.moveTo(v.v > 0 ? x + 8 : x - 8, y); ctx.lineTo(v.v > 0 ? x + 30 : x - 30, y - 8); ctx.lineTo(v.v > 0 ? x + 30 : x - 30, y + 8); ctx.fill(); ctx.restore(); } }
  }
  // 주거단지의 공원: 잔디·구불길·연못·나무·벤치·놀이터
  function drawPark(x, y, i, n) {
    const W2 = 62, H2 = 66;
    ctx.fillStyle = 'rgba(0,0,0,.2)'; rr(x - W2 + 4, y - H2 + 4, W2 * 2, H2 * 2, 12); ctx.fill(); ctx.fillStyle = mix('#5aa050', '#22402a', n); rr(x - W2, y - H2, W2 * 2, H2 * 2, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - W2 + 2, y + H2 - 4); ctx.lineTo(x - W2 + 2, y - H2 + 2); ctx.lineTo(x + W2 - 4, y - H2 + 2); ctx.stroke();
    ctx.fillStyle = mix('#7fc060', '#2e5a38', n); for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(x - 50 + ((k * 37 + i * 13) % 100), y - 55 + ((k * 53 + i * 7) % 110), 7, 4, 0, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = mix('#d8c8a8', '#5a5048', n); ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - W2, y + 14); ctx.quadraticCurveTo(x - 10, y + 50, x + 26, y - 6); ctx.quadraticCurveTo(x + 50, y - 40, x + W2, y - 30); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = mix('#3aa0e0', '#1a3a70', n); ctx.beginPath(); ctx.ellipse(x + 22, y - 34, 26, 16, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x + 22, y - 34, 16 + Math.sin(G.anim * 2 + i) * 2, 9, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = mix('#d8c8a8', '#5a5048', n); ctx.beginPath(); ctx.ellipse(x - 30, y - 34, 18, 12, 0, 0, TAU); ctx.fill();   // 놀이터 모래
    ctx.fillStyle = mix('#e04a3a', '#7a2a30', n); ctx.fillRect(x - 42, y - 48, 3, 18); ctx.fillRect(x - 20, y - 48, 3, 18); ctx.fillRect(x - 42, y - 48, 25, 3); ctx.fillStyle = mix('#ffd24a', '#6a5020', n); ctx.fillRect(x - 33, y - 45, 2, 10); ctx.fillRect(x - 27, y - 45, 2, 10); ctx.fillRect(x - 35, y - 35, 6, 2); ctx.fillRect(x - 29, y - 35, 6, 2);
    ctx.fillStyle = mix('#3a8ad8', '#1a3a70', n); ctx.beginPath(); ctx.moveTo(x - 12, y - 30); ctx.lineTo(x + 2, y - 44); ctx.lineTo(x + 2, y - 30); ctx.fill();   // 미끄럼틀
    tree(x - 48, y + 44, 11, n); tree(x - 8, y + 50, 9, n); tree(x + 46, y + 34, 12, n); tree(x + 50, y - 2, 8, n); tree(x - 50, y + 6, 8, n);
    ctx.fillStyle = mix('#8a5a30', '#3a2818', n); ctx.fillRect(x + 4, y + 20, 18, 4); ctx.fillRect(x + 6, y + 24, 2, 4); ctx.fillRect(x + 18, y + 24, 2, 4); ctx.fillRect(x - 40, y - 8, 18, 4); ctx.fillRect(x - 38, y - 4, 2, 4); ctx.fillRect(x - 26, y - 4, 2, 4);
    if (NRAW > .4) { lamp(x + 40, y + 60, n); lamp(x - 44, y - 56, n); }
  }
  // 건물 하나: 벽돌깨기 목록의 설명(폭·층·지붕·부속물·벽)으로 위에서 비스듬히 본 모습을 그린다
  // 벽 색 16가지, 지붕 색 10가지: 건물마다 다르게 (자리 번호와 건물 종류로 정해진다)
  const WALLS = [['#f6efe4', '#d8c4a8'], ['#f2d9c4', '#d8a07a'], ['#f9e2b8', '#e2b860'], ['#e2f0d6', '#9fc48a'], ['#d6ecf2', '#7fb6cc'], ['#e6ddf2', '#a894cc'], ['#f8d6d6', '#d88888'], ['#dcece4', '#88b8a0'], ['#f2e4c4', '#c8a870'], ['#e4e8f0', '#9aa8c0'], ['#f8e0cc', '#e0946a'], ['#e0e8d0', '#a8b880'], ['#f4f4f4', '#b8b8c0'], ['#f0d4e4', '#c88ab0'], ['#d8e8f8', '#78a0d8'], ['#efe6d4', '#c0a888']];
  const ROOFS = [['#c8574a', '#8a3a30'], ['#4f8a5a', '#2e5a3a'], ['#4a78b8', '#2c4a78'], ['#8a7a70', '#5a4e48'], ['#d89a48', '#a06a28'], ['#7a5a48', '#4e3828'], ['#6a8aa0', '#3e5a6a'], ['#b06a8a', '#7a4060'], ['#a8a898', '#6a6a60'], ['#5a9a90', '#347068']];
  function drawBuilding(b, i, n) {
    const a = lotPos(i), x = a.x, y = a.y; if (!vis(x, y, 160)) return;
    if (b.type === 'park' && b.z === 'res') { drawPark(x, y, i, n); return; }
    const bd = bdOf(b); if (!bd) return;
    const lit = NRAW > .4, w = Math.min(122, bd.cols * 11), d = 30 + Math.min(22, bd.cols * 2), fl = bd.fl[0] + (i * 7) % (bd.fl[1] - bd.fl[0] + 1), h = fl * 15;
    const base = y + 40, top = base - h, ry = top - d;   // base: 앞면 바닥, top: 앞면 위, ry: 지붕 윗변
    const wc = bd.wall === 'wood' ? ['#d8a870', '#a06838'] : bd.wall === 'glass' ? ['#cfe6ff', '#8fb8e0'] : bd.wall === 'concrete' ? ['#d0ccc4', '#9a968e'] : bd.wall === 'steel' ? ['#c0c8d4', '#7a8494'] : WALLS[(i * 7 + bd.i * 3) % WALLS.length], rc = ROOFS[(i * 5 + bd.i) % ROOFS.length];
    const wall = mix(wc[1], '#3a3444', n), roofC = mix(rc[0], '#5a5468', n), roofD = mix(rc[1], '#3a3040', n), dark = mix('#8a7a70', '#2a2430', n);
    shadow(x + 6, base + 2, w * .56);
    // 부속: 캐노피(주유소) — 건물 앞
    if (bd.ex.includes('canopy')) { ctx.fillStyle = mix('#e04a3a', '#7a2a30', n); rr(x - w / 2 - 4, base + 2, w + 8, 10, 3); ctx.fill(); ctx.fillStyle = dark; ctx.fillRect(x - w / 2 + 6, base + 10, 4, 12); ctx.fillRect(x + w / 2 - 10, base + 10, 4, 12); }
    // 오른쪽 옆면(빛은 왼쪽 위에서): 앞면보다 어둡게, 위로 갈수록 살짝 안쪽
    const SX = 9, SY = 5; ctx.fillStyle = darker(wall, .38); ctx.beginPath(); ctx.moveTo(x + w / 2, top); ctx.lineTo(x + w / 2 + SX, top - SY); ctx.lineTo(x + w / 2 + SX, base - SY + 2); ctx.lineTo(x + w / 2, base + 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = darker(roofC, .25); ctx.beginPath(); ctx.moveTo(x + w / 2, ry); ctx.lineTo(x + w / 2 + SX, ry - SY); ctx.lineTo(x + w / 2 + SX, top - SY); ctx.lineTo(x + w / 2, top); ctx.closePath(); ctx.fill();
    // 앞면
    ctx.fillStyle = wall; rr(x - w / 2, top, w, h, [0, 0, 4, 4]); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x - w / 2, top, w, 3); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x - w / 2, top, 3, h);
    if (bd.wall === 'wood') { ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 1; for (let yy = top + 6; yy < base; yy += 7) { ctx.beginPath(); ctx.moveTo(x - w / 2, yy); ctx.lineTo(x + w / 2, yy); ctx.stroke(); } }
    // 창문
    const cols = Math.max(1, Math.floor((w - 14) / 16)), off = (w - cols * 16) / 2;
    for (let f = 0; f < fl; f++) for (let c = 0; c < cols; c++) { if (f === fl - 1 && c === Math.floor(cols / 2) && fl === 1) continue; const wx = x - w / 2 + off + c * 16 + 3, wy = top + 4 + f * 15; ctx.fillStyle = (lit && ((f * cols + c + i) % 5 !== 0)) ? '#ffe9a0' : (bd.wall === 'glass' ? '#eef6ff' : '#8fd0ff'); ctx.fillRect(wx, wy, 10, 8); }
    if (bd.ex.includes('balcony')) { ctx.fillStyle = dark; for (let f = 1; f < fl; f++) ctx.fillRect(x - w / 2 + 2, top + f * 15 - 2, w - 4, 3); }
    if (bd.ex.includes('columns')) { ctx.fillStyle = mix('#ffffff', '#9a96a0', n); for (let k = 0; k < 4; k++) ctx.fillRect(x - w / 2 + 6 + k * ((w - 12) / 3) - 2, top + 2, 4, h - 2); }
    // 문·차고·간판·시계·십자
    if (bd.ex.includes('garage')) { ctx.fillStyle = mix('#5a5a64', '#22222a', n); rr(x - w / 2 + 8, base - 18, w - 16, 18, [3, 3, 0, 0]); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.25)'; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - w / 2 + 8, base - 18 + k * 4.5); ctx.lineTo(x + w / 2 - 8, base - 18 + k * 4.5); ctx.stroke(); } }
    else { ctx.fillStyle = mix('#5a4a44', '#2a2430', n); rr(x - 6, base - 13, 12, 13, [3, 3, 0, 0]); ctx.fill(); }
    if (bd.ex.includes('sign')) { const sc = ['#ff5a7a', '#ffd24a', '#5fd8ff', '#9fe08a'][i % 4]; ctx.fillStyle = mix(sc, '#5a3040', n * .5); rr(x - w / 2 + 4, top - 8, w - 8, 9, 2); ctx.fill(); if (lit) { ctx.save(); ctx.globalAlpha = .5 + Math.sin(G.anim * 6 + i) * .4; ctx.fillStyle = '#fff'; for (let k = 0; k < 5; k++) ctx.fillRect(x - w / 2 + 8 + k * ((w - 16) / 4), top - 5, 3, 3); ctx.restore(); } }
    if (bd.ex.includes('clock')) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, top + 10, 6, 0, TAU); ctx.fill(); ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, top + 10); ctx.lineTo(x, top + 6); ctx.moveTo(x, top + 10); ctx.lineTo(x + 3, top + 12); ctx.stroke(); }
    if (bd.ex.includes('cross')) { ctx.fillStyle = bd.ko === '약국' || bd.ko === '동물병원' ? '#3ac860' : '#ff3a3a'; ctx.fillRect(x - 2, top + 3, 4, 12); ctx.fillRect(x - 6, top + 7, 12, 4); }
    // 지붕 (위에서 본 면)
    ctx.fillStyle = roofC; ctx.fillRect(x - w / 2, ry, w, d);
    const rf = bd.roof;
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x - w / 2, ry, w, 2); ctx.fillRect(x - w / 2, ry, 2, d); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x - w / 2, ry + d - 2, w, 2);
    if (rf === 'gable' || rf === 'hip') { ctx.fillStyle = roofD; ctx.fillRect(x - w / 2, ry, w, d / 2); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - w / 2, ry + d / 2 - 1, w, 2); if (rf === 'hip') { ctx.fillStyle = roofD; ctx.beginPath(); ctx.moveTo(x - w / 2, ry); ctx.lineTo(x - w / 2 + 14, ry + d / 2); ctx.lineTo(x - w / 2, ry + d); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + w / 2, ry); ctx.lineTo(x + w / 2 - 14, ry + d / 2); ctx.lineTo(x + w / 2, ry + d); ctx.fill(); } }
    else if (rf === 'twin') { ctx.fillStyle = roofD; ctx.fillRect(x - w / 2, ry, w, d / 2); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - w / 2, ry + d / 2 - 1, w, 2); ctx.fillRect(x - 1, ry, 2, d); }
    else if (rf === 'arch') { const g = ctx.createLinearGradient(0, ry, 0, ry + d); g.addColorStop(0, roofD); g.addColorStop(.5, mix('#ffffff', '#8a8498', n)); g.addColorStop(1, roofD); ctx.fillStyle = g; ctx.fillRect(x - w / 2, ry, w, d); if (bd.wall === 'glass') { ctx.strokeStyle = 'rgba(80,120,160,.35)'; ctx.lineWidth = 1; for (let k = 1; k < 6; k++) { ctx.beginPath(); ctx.moveTo(x - w / 2 + k * w / 6, ry); ctx.lineTo(x - w / 2 + k * w / 6, ry + d); ctx.stroke(); } } }
    else if (rf === 'shed') { const g = ctx.createLinearGradient(0, ry, 0, ry + d); g.addColorStop(0, roofD); g.addColorStop(1, mix('#ffffff', '#8a8498', n)); ctx.fillStyle = g; ctx.fillRect(x - w / 2, ry, w, d); }
    else if (rf === 'saw') { for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? mix('#8fd0ff', '#2a3a60', n) : roofD; ctx.fillRect(x - w / 2, ry + k * d / 4, w, d / 4); } }
    else if (rf === 'flat' || rf === 'dome' || rf === 'spire' || rf === 'step') { ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 2; ctx.strokeRect(x - w / 2 + 3, ry + 3, w - 6, d - 6); if (rf === 'flat' && !bd.ex.includes('tank')) { ctx.fillStyle = dark; ctx.fillRect(x + w / 2 - 20, ry + 6, 10, 8); } }
    if (rf === 'dome') { const r = Math.min(w, d) * .42; ctx.save(); ctx.beginPath(); ctx.arc(x, ry + d / 2, r, 0, TAU); const g = ctx.createRadialGradient(x - r * .4, ry + d / 2 - r * .5, r * .1, x, ry + d / 2, r); g.addColorStop(0, mix('#ffffff', '#a0a0b0', n)); g.addColorStop(1, mix('#7fa8d0', '#2a3a58', n)); ctx.fillStyle = g; ctx.fill(); ctx.restore(); }
    if (rf === 'spire') { ctx.fillStyle = wall; ctx.fillRect(x - 7, ry - 26, 14, 26 + d / 2); ctx.fillStyle = mix('#5a4a6a', '#241c30', n); ctx.beginPath(); ctx.moveTo(x - 9, ry - 26); ctx.lineTo(x, ry - 58); ctx.lineTo(x + 9, ry - 26); ctx.fill(); }
    if (rf === 'step') { const w2 = w * .6, h2 = 16; ctx.fillStyle = wall; rr(x - w2 / 2, ry - h2 + d * .2, w2, h2, 2); ctx.fill(); ctx.fillStyle = roofC; ctx.fillRect(x - w2 / 2, ry - h2 - d * .5, w2, d * .7); ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.strokeRect(x - w2 / 2 + 3, ry - h2 - d * .5 + 3, w2 - 6, d * .7 - 6); }
    // 지붕 위 부속
    if (bd.ex.includes('chimney')) { ctx.fillStyle = dark; ctx.fillRect(x + w / 2 - 16, ry - 8, 7, 12 + d / 3); if (Math.random() < .12) parts.push({ x: x + w / 2 - 12, y: ry - 10, vx: rnd(-6, 6), vy: rnd(-24, -12), t: rnd(.8, 1.4), r: rnd(3, 5), col: 'rgba(230,230,235,.5)' }); }
    if (bd.ex.includes('stack')) { ctx.fillStyle = mix('#6a5a50', '#26202a', n); ctx.fillRect(x + w / 2 - 18, ry - 40, 10, 44 + d / 3); ctx.fillStyle = '#ff5050'; ctx.fillRect(x + w / 2 - 18, ry - 40, 10, 3); if (Math.random() < .3) parts.push({ x: x + w / 2 - 13, y: ry - 42, vx: rnd(-8, 8), vy: rnd(-30, -15), t: rnd(1, 1.6), r: rnd(4, 8), col: 'rgba(220,220,230,.5)' }); }
    if (bd.ex.includes('tank')) { ctx.fillStyle = mix('#c8ccd4', '#5a6070', n); ctx.beginPath(); ctx.arc(x + w / 2 - 20, ry + d / 2, 9, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 2; ctx.stroke(); }
    if (bd.ex.includes('silo')) { ctx.fillStyle = mix('#c8ccd4', '#5a6070', n); ctx.fillRect(x - w / 2 - 22, ry + d / 2, 16, h + d / 2); ctx.beginPath(); ctx.ellipse(x - w / 2 - 14, ry + d / 2, 8, 4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = mix('#e04a3a', '#7a2a30', n); ctx.beginPath(); ctx.ellipse(x - w / 2 - 14, ry + d / 2 - 3, 8, 4, 0, Math.PI, 0); ctx.fill(); }
    if (bd.ex.includes('tower')) { ctx.fillStyle = wall; ctx.fillRect(x + w / 2 - 22, ry - 30, 16, 30 + d); ctx.fillStyle = roofC; ctx.fillRect(x + w / 2 - 22, ry - 34, 16, 6); ctx.fillStyle = '#8fd0ff'; ctx.fillRect(x + w / 2 - 18, ry - 24, 8, 6); }
    if (bd.ex.includes('antenna')) { ctx.strokeStyle = '#9aa'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, ry + d / 2); ctx.lineTo(x, ry - 34); ctx.stroke(); ctx.fillStyle = Math.sin(G.anim * 5 + i) > 0 ? '#ff4040' : '#500'; ctx.beginPath(); ctx.arc(x, ry - 36, 2.5, 0, TAU); ctx.fill(); }
    if (bd.ex.includes('lamp')) { ctx.fillStyle = Math.sin(G.anim * 3 + i) > 0 ? '#fff3a0' : '#a08a40'; ctx.beginPath(); ctx.arc(x, ry + d / 2, 6, 0, TAU); ctx.fill(); if (lit) { ctx.save(); ctx.globalAlpha = .3 + Math.sin(G.anim * 3 + i) * .2; ctx.fillStyle = '#fff3a0'; ctx.beginPath(); ctx.arc(x, ry + d / 2, 18, 0, TAU); ctx.fill(); ctx.restore(); } }
    if (bd.ex.includes('bell')) { ctx.fillStyle = dark; ctx.fillRect(x - 8, ry - 14, 16, 4); ctx.fillRect(x - 8, ry - 14, 3, 14 + d / 2); ctx.fillRect(x + 5, ry - 14, 3, 14 + d / 2); ctx.fillStyle = mix('#d8b040', '#6a5020', n); ctx.beginPath(); ctx.arc(x, ry - 4, 5, 0, TAU); ctx.fill(); }
    if (bd.ex.includes('blades')) { ctx.save(); ctx.translate(x, top + 14); ctx.rotate(G.anim * 1.2); ctx.fillStyle = mix('#f4f0e8', '#8a8690', n); for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); rr(-3, -30, 6, 28, 3); ctx.fill(); } ctx.restore(); ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(x, top + 14, 4, 0, TAU); ctx.fill(); }
    if (lit) { ctx.save(); ctx.globalAlpha = .12 * NRAW; ctx.fillStyle = '#ffd890'; ctx.beginPath(); ctx.ellipse(x, base - 4, w * .8, 40, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  }
  function drawBear() {
    if (P.hide) return; const x = P.x, y = P.y; if (!vis(x, y, 80)) return;
    shadow(x, y + 2, 18);
    const busy = P.task && !P.moving && (P.task.kind === 'build' || P.task.kind === 'harvest' || P.task.kind === 'clean');
    let fr = null, h = 66, jump = 0, face = 1;
    if (P.pose === 'jump') { fr = pose('jump'); jump = Math.abs(Math.sin(Math.min(1, 1 - P.poseT) * Math.PI)) * 22; }
    else if (P.pose === 'wave') fr = pose('wave');
    else if (P.still > 8 && !P.moving) { fr = pose('sit'); h = 52; }
    if (!fr) { const anim = busy ? 'up' : (P.moving ? P.dir : (P.dir === 'side' ? 'side' : P.dir === 'up' ? 'up' : 'idle')); fr = P.moving || busy ? frameOf(anim, busy ? 0 : P.clock) : (FRAMES[anim][0] || frameOf('idle', 0)); if (P.dir === 'side') face = P.face; }
    if (!fr) return;
    // 걸을 때는 그림을 바꾸지 않고(얼굴이 돌아가지 않게) 위아래로 살짝 튀고 좌우로 기우뚱만 한다
    const w = h * fr.width / fr.height, step = P.clock * 9, bob = busy ? Math.abs(Math.sin(G.anim * 8)) * 3 : (P.moving ? Math.abs(Math.sin(step)) * 3 : Math.sin(G.anim * 2) * 1), tilt = P.moving && !P.pose ? Math.sin(step) * .06 : 0;
    ctx.save(); ctx.translate(Math.round(x), Math.round(y + 4 - bob - jump)); ctx.rotate(tilt); if (face < 0) ctx.scale(-1, 1); ctx.drawImage(fr, -w / 2, -h, w, h); ctx.restore();
    if (busy && P.task.kind === 'build') { ctx.save(); ctx.translate(x + 20, y - 40); ctx.rotate(Math.sin(G.anim * 8) * .9 - .6); icon('🔨', 0, -8, 16); ctx.restore(); }
    if (busy && P.task.kind === 'clean') { ctx.save(); ctx.translate(x + 18, y - 36 + Math.sin(G.anim * 12) * 4); icon('🧹', 0, 0, 16); ctx.restore(); }
  }
  function drawBug() {
    if (!bug) return; const x = bug.x, y = bug.y - 8 - bug.z; if (!vis(x, y, 40)) return;
    shadow(bug.x, bug.y, 12);
    ctx.save(); ctx.translate(x, y); if (bug.state === 'flip') ctx.rotate(Math.PI + Math.sin(bug.t * 12) * .3);
    ctx.fillStyle = '#7c6a70'; for (let k = 0; k < 3; k++) ctx.fillRect(-12 + k * 10 + Math.sin(bug.hop * 20 + k) * 2, 4, 3, 7); ctx.beginPath(); ctx.ellipse(0, 0, 15, 11, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#9a8890'; ctx.beginPath(); ctx.ellipse(-3, -4, 6, 4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-6, -3, 4, 0, TAU); ctx.arc(5, -3, 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#222'; const ex = bug.state === 'flip' ? 0 : -1.5; ctx.beginPath(); ctx.arc(-6 + ex, -3, 2, 0, TAU); ctx.arc(5 + ex, -3, 2, 0, TAU); ctx.fill();
    if (bug.state === 'eat') { ctx.fillStyle = '#c04040'; ctx.beginPath(); ctx.ellipse(-2, 5, 5, 2 + Math.abs(Math.sin(bug.eat * 12)) * 3, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
    if (bug.state === 'eat') bar(x, y - 24, 30, 1 - bug.t / 8, '#ff6a4a');
  }
  function draw() {
    NRAW = nightAt(); const n = NRAW * .5, storm = G.storm > 0 ? clamp(G.storm / 2, 0, 1) * clamp((STORM_T - G.storm) / 2, 0, 1) : (G.warn > 0 ? .3 * (1 - G.warn / (5 + 2 * S.up.dish)) : 0);
    V = { x: G.cam.x, y: G.cam.y, w: W / G.z, h: H / G.z };
    ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.setTransform(2 * G.z, 0, 0, 2 * G.z, -G.cam.x * 2 * G.z, -G.cam.y * 2 * G.z);
    ctx.fillStyle = mix('#3a1c14', '#120a10', n); ctx.fillRect(V.x - 50, V.y - 50, V.w + 100, V.h + 100);
    ctx.save(); rr(0, 0, mapW(), mapH(), 48); ctx.clip();
    drawGround(n);
    // 깊이 정렬: 아래쪽(y 큰 것)이 앞에
    const L = [];
    L.push({ y: POS.pod.y + 30, f: () => drawPod(n) }); L.push({ y: R.state === 'pad' ? POS.pad.y + 10 : 1e8, f: () => drawRocket(n) }); L.push({ y: POS.drill.y + 6, f: () => drawDrill(n) }); L.push({ y: FARM.y - 22, f: () => drawWall(n) });
    S.plots.forEach((p, i) => L.push({ y: plotPos(i).y + 2, f: () => drawPlot(p, i, n) }));
    S.q.forEach(q => L.push({ y: q.y + 4, f: () => drawSite(q, n) }));
    S.city.forEach((b, i) => { if (b.done) L.push({ y: lotPos(i).y + 36, f: () => drawBuilding(b, i, n) }); });
    L.push({ y: P.y + 4, f: drawBear }); if (bug) L.push({ y: bug.y + 1, f: drawBug }); L.push({ y: 1e9, f: () => drawDrone(n) });
    L.sort((a, b) => a.y - b.y); for (const o of L) o.f();
    ctx.restore();
    ctx.strokeStyle = mix('#7a3a22', '#2a1418', n); ctx.lineWidth = 14; rr(0, 0, mapW(), mapH(), 48); ctx.stroke(); ctx.strokeStyle = 'rgba(255,200,140,.35)'; ctx.lineWidth = 3; rr(7, 7, mapW() - 14, mapH() - 14, 42); ctx.stroke();
    for (const p of parts) { if (!vis(p.x, p.y, 20)) continue; ctx.save(); ctx.globalAlpha = clamp(p.t * 1.5, 0, 1); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); ctx.restore(); }
    for (const f of flys) { if (f.t < 0) continue; icon(f.ic, f.x, f.y, 15 / G.z); }
    for (const f of floats) { ctx.save(); ctx.globalAlpha = clamp(f.t * 1.5, 0, 1); txt(f.s, f.x, f.y, f.col, 13 / Math.max(.6, G.z)); ctx.restore(); }
    // 화면 좌표: 밤·폭풍·미니맵
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.fillStyle = 'rgba(255,220,100,' + (.16 * (1 - NRAW)) + ')'; ctx.fillRect(0, 0, W, H);
    if (NRAW > 0) { ctx.fillStyle = 'rgba(30,10,50,' + (NRAW * .2) + ')'; ctx.fillRect(0, 0, W, H); }
    if (storm > 0) { ctx.fillStyle = 'rgba(150,80,30,' + storm * .45 + ')'; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = 'rgba(240,190,140,.7)'; ctx.lineWidth = 1.5; for (const s of sand) { ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + s.l, s.y + s.l * .25); ctx.stroke(); } }
  }

  // ── 루프 ──
  let last = performance.now();
  function frame(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; update(dt); requestAnimationFrame(frame); }
  requestAnimationFrame(frame);
  window.__fm = { offline, checkBack, takeBack, tick(n) { for (let i = 0; i < (n || 1); i++) update(1 / 60); }, G, P, R, POS, plotPos, lotPos, get S() { return S; }, get bug() { return bug; }, tap, launch, buy, SHOP, newGame, contGame, openShop, closeShop, spawnBug, storm() { G.warn = .1; }, finishAll() { while (S.q.length) { const q = S.q.shift(); finishSite(q); } }, zoomAt, zrows, zcount, drect, DIST, save, load, loaded: () => FRAMES.side.length + FRAMES.down.length + FRAMES.up.length };
})();