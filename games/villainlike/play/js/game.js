// 빌런라이크 — 1호선 빌런 그림으로 만든 뱀서라이크. 막는 쪽 다섯 명이 승강장에서 빌런 떼를 버티고, 막차(12분)에 1호선 대악마를 검거하면 퇴근
(function () {
'use strict';
const $ = s => document.querySelector(s);
const LANG = /[?&]lang=en/.test(location.search) ? 'en' : 'ko';
const EN = LANG === 'en';
const DICT = {
  ko: { start: '출근', levelup: 'LEVEL UP', pause: 'PAUSE', resume: '계속', home: '처음으로', time: 'TIME', level: 'LEVEL', kills: '검거', unlock: 'NEW', t2: '빌런라이크', clear: '퇴근', over: 'GAME OVER', evo: '진화', max: 'MAX', newW: '새 무기', newP: '새 아이템', locked: '잠김', heal: '회복', shop: '상점', dex: '도감', coin: '코인', close: '닫기', tabE: '빌런', tabW: '무기', tabI: '아이템', tabG: '직원', unknown: '아직 못 봤습니다', last: '막차', boss: '보스', gold: '금테', hint: 'WASD / ←↑↓→ 이동 · SPACE 경적 · Esc 일시정지', theEnd: 'THE END', ending: '엔딩', dex100: '도감 100%', owned: '보유' },
  en: { start: 'START', levelup: 'LEVEL UP', pause: 'PAUSE', resume: 'RESUME', home: 'HOME', time: 'TIME', level: 'LEVEL', kills: 'ARREST', unlock: 'NEW', t2: 'VILLAIN LIKE', clear: 'CLOCK OUT', over: 'GAME OVER', evo: 'EVOLVE', max: 'MAX', newW: 'NEW WEAPON', newP: 'NEW ITEM', locked: 'LOCKED', heal: 'HEAL', shop: 'SHOP', dex: 'COLLECTION', coin: 'COIN', close: 'CLOSE', tabE: 'VILLAINS', tabW: 'WEAPONS', tabI: 'ITEMS', tabG: 'STAFF', unknown: 'Not seen yet', last: 'LAST TRAIN', boss: 'BOSS', gold: 'GOLD', hint: 'WASD / Arrows move · SPACE horn · Esc pause', theEnd: 'THE END', ending: 'ENDING', dex100: 'COLLECTION 100%', owned: 'OWNED' },
};
const L = k => DICT[LANG][k];
const T2 = a => a[EN ? 1 : 0];
document.querySelectorAll('[data-l]').forEach(e => { const v = L(e.dataset.l); if (typeof v === 'string') e.textContent = v; });
document.title = EN ? 'Villain Like' : '빌런라이크';
if (EN) document.body.classList.add('en');
// 막는 쪽 다섯(한 명으로 막차까지 버티면 다음 사람이 열림). 첫 사람은 사회복무요원(10/10 사장님)
const GUARDS = [
  { n: ['사회복무요원', 'Service Worker'], spr: 'g_gongik', w: 'stick' },
  { n: ['역무원', 'Station Staff'], spr: 'g_staff', w: 'whistle' },
  { n: ['지하철 보안관', 'Subway Marshal'], spr: 'g_guard', w: 'cuffs' },
  { n: ['청소 여사님', 'Cleaning Lady'], spr: 'g_cleaner', w: 'mop' },
  { n: ['철도경찰', 'Railway Police'], spr: 'g_police', w: 'stamp' }];
const NG = GUARDS.length;
// 무기: dmg 는 1레벨 값, 레벨마다 +25%, 쿨다운 -8%, 개수는 2레벨마다 +1. icon 'o:N' = 물건 시트 N번 칸
const WEAPONS = {
  whistle: { n: ['호루라기', 'Whistle'], evo: ['비상 호루라기', 'Emergency Whistle'], icon: 'i_whistle', cd: 1.1, dmg: 10, type: 'fan', n0: 3, speed: 420, life: 0.9, r: 22, look: 'wave', snd: 'whistle' },
  stick: { n: ['경광봉', 'Light Baton'], evo: ['쌍 경광봉', 'Twin Batons'], icon: 'i_stick', cd: 1.0, dmg: 24, type: 'slash', r: 100, snd: 'slash' },
  cuffs: { n: ['수갑', 'Handcuffs'], evo: ['쇠사슬 수갑', 'Chain Cuffs'], icon: 'o:11', cd: 0.95, dmg: 16, type: 'homing', n0: 1, speed: 430, life: 2.5, r: 18, snd: 'cuff' },
  mop: { n: ['물걸레', 'Wet Mop'], evo: ['대걸레 회오리', 'Mop Tornado'], icon: 'i_mop', cd: 4.0, dmg: 12, type: 'orbit', n0: 2, life: 2.8, r: 32, orbit: 96, snd: 'mop' },
  stamp: { n: ['검거 도장', 'Arrest Stamp'], evo: ['왕 도장', 'Giant Stamp'], icon: 'o:10', cd: 1.5, dmg: 24, type: 'lob', n0: 1, speed: 260, life: 0.8, r: 66, snd: 'stamp' },
  speaker: { n: ['안내방송', 'Announcement'], evo: ['대합실 방송', 'Hall Broadcast'], icon: 'o:3', cd: 0.5, dmg: 5, type: 'aura', r: 100 },
  cctv: { n: ['CCTV', 'CCTV'], evo: ['CCTV 관제실', 'CCTV Control'], icon: 'o:2', cd: 1.5, dmg: 9, type: 'slowshot', n0: 1, speed: 320, life: 2.2, r: 20, look: 'beam', snd: 'card' },
  card: { n: ['교통카드', 'Transit Card'], evo: ['정기권', 'Commuter Pass'], icon: 'i_card', cd: 1.6, dmg: 17, type: 'boomerang', n0: 1, speed: 410, life: 1.5, r: 24, snd: 'shoot' },
  fence: { n: ['바리케이드', 'Barricade'], evo: ['안전 펜스', 'Safety Fence'], icon: 'o:0', cd: 1.5, dmg: 15, type: 'bounce', n0: 1, speed: 320, life: 4, r: 28, snd: 'fence' },
  gloves: { n: ['고무장갑', 'Rubber Gloves'], evo: ['황금 장갑', 'Golden Gloves'], icon: 'o:8', cd: 0.42, dmg: 9, type: 'punch', r: 82, snd: 'punch' },
  danso: { n: ['압수한 단소', 'Seized Danso'], evo: ['전설의 단소', 'Legendary Danso'], icon: 'i_danso', cd: 2.5, dmg: 34, type: 'strike', n0: 1, r: 80 },
};
const PASSIVES = {
  coffee: { n: ['캔커피', 'Canned Coffee'], icon: 'i_coffee', d: ['공격 +12%', 'DAMAGE +12%'] },
  gimbap: { n: ['삼각김밥', 'Rice Triangle'], icon: 'i_gimbap', d: ['최대 체력 +25', 'MAX HP +25'] },
  sneakers: { n: ['운동화', 'Sneakers'], icon: 'i_sneakers', d: ['이동 속도 +8%', 'SPEED +8%'] },
};
const WDESC = { slash: ['앞뒤 휘두르기', 'Swings front and back'], bounce: ['미끄러지며 튕김', 'Slides and bounces'], homing: ['가까운 빌런을 쫓음', 'Homes in'], boomerang: ['던졌다 돌아옴', 'Returns'], orbit: ['주위를 돎', 'Orbits'], fan: ['부채꼴 소리', 'Fan of sound'], punch: ['가까운 빌런 연타', 'Rapid punches'], strike: ['위에서 내려침', 'Smacks from above'], aura: ['주위 지속 피해', 'Hurts around you'], slowshot: ['맞으면 느려짐', 'Slows villains'], lob: ['쾅 찍음', 'Stamps an area'] };
// 빌런: spr 는 1호선 빌런 시트(앞 0~3, 뒤 4~7, 옆 8~11, 옆은 오른쪽을 봄). 비둘기는 걷기 0~3·날기 4~7·쪼기 8~9·앞 10~11, 모두 오른쪽을 봄
const ENEMIES = {
  preacher: { spr: 'v_preacher', n: ['예수천국 전도사', 'Street Preacher'], d: ['확성기 들고 다가옴', 'Comes at you with a megaphone'], hp: 20, sp: 70, dmg: 5, r: 18, xp: 1 },
  vendor: { spr: 'v_vendor', n: ['잡상인', 'Peddler'], d: ['물건 보따리를 메고 옴', 'Hauls a bag of goods'], hp: 26, sp: 64, dmg: 5, r: 18, xp: 1 },
  pigeon: { spr: 'v_pigeon', n: ['비둘기', 'Pigeon'], d: ['빠르게 날아듦', 'Flies in fast'], hp: 8, sp: 140, dmg: 3, r: 14, xp: 1, bird: 1 },
  drunk: { spr: 'v_drunk', n: ['등산복 취객', 'Hiker Drunk'], d: ['갈지자로 걸음', 'Zigzags'], hp: 18, sp: 96, dmg: 5, r: 17, xp: 1, zig: 1 },
  phone: { spr: 'v_phone', n: ['스피커폰 아줌마', 'Speakerphone Lady'], d: ['통화하며 빠르게 옴', 'Fast, on the phone'], hp: 28, sp: 92, dmg: 6, r: 17, xp: 2 },
  spread: { spr: 'v_spread', n: ['쩍벌남', 'Manspreader'], d: ['자리를 넓게 차지함', 'Takes up space'], hp: 46, sp: 58, dmg: 7, r: 26, xp: 2 },
  trot: { spr: 'v_trot', n: ['트로트 할아버지', 'Trot Grandpa'], d: ['노래로 주위 빌런을 빠르게', 'Speeds up villains near him'], hp: 32, sp: 78, dmg: 6, r: 18, xp: 2, haste: 1 },
  chicken: { spr: 'v_chicken', n: ['치킨 청년', 'Chicken Guy'], d: ['냄새 구름을 남김', 'Leaves a smell cloud'], hp: 50, sp: 70, dmg: 7, r: 20, xp: 3, smell: 1 },
  sleep: { spr: 'v_sleep', n: ['드러누운 아저씨', 'Floor Sleeper'], d: ['가끔 드러누워 버팀', 'Lies down and stays put'], hp: 72, sp: 56, dmg: 8, r: 20, xp: 3, nap: 1 },
  sashimi: { spr: 'v_sashimi', n: ['회에 소주 아저씨', 'Sashimi & Soju Guy'], d: ['냄새 구름을 남김', 'Leaves a smell cloud'], hp: 58, sp: 66, dmg: 8, r: 20, xp: 3, smell: 1 },
  lecture: { spr: 'v_lecture', n: ['훈계 할아버지', 'Lecturing Grandpa'], d: ['느리지만 단단함', 'Slow but tough'], hp: 95, sp: 54, dmg: 10, r: 19, xp: 4 },
  dog: { spr: 'v_dog', n: ['강아지 승객', 'Dog Walker'], d: ['강아지와 함께 빠르게', 'Quick, with a dog'], hp: 42, sp: 104, dmg: 7, r: 20, xp: 3 },
  shirtless: { spr: 'v_shirtless', n: ['웃통 아저씨', 'Shirtless Guy'], d: ['덥다며 달려듦', 'Charges, too hot'], hp: 78, sp: 86, dmg: 9, r: 21, xp: 4 },
  bar: { spr: 'v_bar', n: ['철봉남', 'Pull-up Guy'], d: ['껑충껑충 뜀', 'Hops around'], hp: 62, sp: 108, dmg: 9, r: 19, xp: 4, hop: 1 },
  trunk: { spr: 'v_trunk', n: ['트렁크 팬티 아저씨', 'Boxer Shorts Guy'], d: ['덩치 크고 아픔', 'Big and hits hard'], hp: 135, sp: 60, dmg: 12, r: 26, xp: 5 },
  // 보스
  hikers: { spr: 'v_hikers', n: ['등산 동호회', 'Hiking Club'], d: ['2:00 넷이 한꺼번에', '2:00, four at once'], hp: 320, sp: 74, dmg: 9, r: 22, xp: 15, boss: 1, hiker: 1, sc: 1.3 },
  armor: { spr: 'b_armor', n: ['황금 갑옷 장군', 'Golden Armor General'], d: ['4:00 장창 들고 돌진', '4:00, charges with a spear'], hp: 2300, sp: 62, dmg: 13, r: 30, xp: 70, boss: 1, dash: 1 },
  bpreacher: { spr: 'b_preacher', n: ['전도대장', 'Preacher Chief'], d: ['5:30 앰프로 발을 묶고 전도사를 부름', '5:30, slows you and calls preachers'], hp: 3000, sp: 56, dmg: 16, r: 30, xp: 90, boss: 1, slowAura: 1, summon: 'preacher' },
  bvendor: { spr: 'b_vendor', n: ['잡상인 왕', 'Peddler King'], d: ['7:00 잡상인을 몰고 옴', '7:00, brings peddlers'], hp: 3900, sp: 60, dmg: 18, r: 32, xp: 110, boss: 1, summon: 'vendor' },
  bpigeon: { spr: 'b_pigeon', n: ['비둘기 왕', 'Pigeon King'], d: ['8:30 날아다니며 비둘기 떼를 부름', '8:30, flies and calls a flock'], hp: 4300, sp: 96, dmg: 18, r: 30, xp: 120, boss: 1, bird: 1, summon: 'pigeon' },
  danso: { spr: 'b_danso', n: ['단소살인마', 'Danso Slasher'], d: ['10:00 빠르게 돌진', '10:00, fast charges'], hp: 5200, sp: 112, dmg: 22, r: 28, xp: 150, boss: 1, dash: 1 },
  demon: { spr: 'b_demon', n: ['1호선 대악마', 'Line 1 Archfiend'], d: ['12:00 막차, 앞 보스들의 기술을 다 씀', '12:00 last train, uses every boss move'], hp: 10000, sp: 66, dmg: 24, r: 36, xp: 300, boss: 1, demon: 1 },
};
const WAVES = [['preacher', 'vendor', 'pigeon'], ['preacher', 'vendor', 'pigeon', 'drunk', 'phone'], ['drunk', 'phone', 'spread', 'trot', 'pigeon'], ['spread', 'trot', 'chicken', 'sleep', 'phone'], ['chicken', 'sleep', 'sashimi', 'lecture', 'dog'], ['sashimi', 'lecture', 'dog', 'shirtless', 'bar'], ['lecture', 'shirtless', 'bar', 'trunk', 'dog']];
const BOSS_AT = [[120, 'hikers'], [240, 'armor'], [330, 'bpreacher'], [420, 'bvendor'], [510, 'bpigeon'], [600, 'danso'], [720, 'demon']];
const NIGHT = 720; // 12분, 그때 막차와 함께 대악마
// 정차역(시간 따라 LED 에 뜸): 소요산에서 신창까지
const STATIONS = [['소요산', 'Soyosan'], ['동두천', 'Dongducheon'], ['의정부', 'Uijeongbu'], ['도봉산', 'Dobongsan'], ['창동', 'Chang-dong'], ['청량리', 'Cheongnyangni'], ['종로3가', 'Jongno 3-ga'], ['서울역', 'Seoul Station'], ['영등포', 'Yeongdeungpo'], ['구로', 'Guro'], ['수원', 'Suwon'], ['병점', 'Byeongjeom'], ['천안', 'Cheonan'], ['신창', 'Sinchang']];

// ---------- 그림 ----------
const A = window.VL_ATLAS, IC = window.VL_ICONS, atlas = new Image(), icons = new Image();
let ready = 0, white = null;
atlas.onload = () => { white = document.createElement('canvas'); white.width = atlas.width; white.height = atlas.height; const c = white.getContext('2d'); c.drawImage(atlas, 0, 0); c.globalCompositeOperation = 'source-in'; c.fillStyle = '#fff'; c.fillRect(0, 0, white.width, white.height); ready++; if (ready >= 2 && G.phase === 'title') buildTitle(); };
icons.onload = () => { ready++; if (ready >= 2 && G.phase === 'title') buildTitle(); };
atlas.src = 'img/atlas.png?v=1'; icons.src = 'img/icons.png?v=1';
const PXS = 2.4; // 시트 한 칸(화면 단위) -> 마당 크기
// 시트 칸 f 의 원본 사각형 [sx, sy, sw, sh, 화면폭, 화면높이]
function fr(name, f) { const m = A[name]; if (!m) return null; const n = m[4], r = m[5] || 1; f = ((f % n) + n) % n; return [m[0] + f * m[2] * r, m[1], m[2] * r, m[3] * r, m[2], m[3]]; }
const cv = $('#cv'), ctx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1, ZOOM = 1;
function resize() { DPR = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); cv.style.width = W + 'px'; cv.style.height = H + 'px'; ZOOM = Math.max(0.62, Math.min(1, Math.min(W, H * 1.4) / 920)); }
addEventListener('resize', resize); resize();
const TOUCH = 'ontouchstart' in window; if (TOUCH) document.body.classList.add('touch');
// 인물 한 칸을 발끝(아래 가운데)이 (x,y)에 오게, 화면 높이 h 로
function sprF(name, f, x, y, h, flip, wh, alpha) {
  const q = fr(name, f); if (!q) return; const w = q[4] / q[5] * h;
  ctx.save(); if (alpha != null) ctx.globalAlpha = alpha; ctx.translate(Math.round(x), Math.round(y)); if (flip) ctx.scale(-1, 1);
  ctx.drawImage(wh ? white : atlas, q[0], q[1], q[2], q[3], -w / 2, -h, w, h); ctx.restore();
}
// 아이콘: 'i_xxx' 는 icons.png, 'o:N' 은 물건 시트 N번 칸. 가운데 (x,y), 크기 s
function iconSrc(spec) { if (spec.startsWith('o:')) { const q = fr('o_items', +spec.slice(2)); return [atlas, q[0], q[1], q[2], q[3]]; } const c = IC[spec]; return c ? [icons, c[0], c[1], c[2], c[3]] : null; }
function iconC(spec, x, y, s, rot, alpha) { const q = iconSrc(spec); if (!q) return; ctx.save(); if (alpha != null) ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot || 0); ctx.drawImage(q[0], q[1], q[2], q[3], q[4], -s / 2, -s / 2, s, s); ctx.restore(); }
function drawIcon(c, spec) { const x = c.getContext('2d'); x.imageSmoothingEnabled = false; if (spec === 'auto') return drawAutoIcon(c, x); const q = iconSrc(spec); if (!q) return; const s = c.width - 12; x.drawImage(q[0], q[1], q[2], q[3], q[4], 6, 6, s, s); }
// 자동 근무 아이콘: 승강장 천장에 매달린 LED 안내판에 AUTO, 오른쪽 위 초록 운행등(도트)
function drawAutoIcon(c, x) {
  const u = c.width / 16, px = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(Math.round(a * u), Math.round(b * u), Math.ceil(w * u), Math.ceil(h * u)); };
  px(4, 0, 1, 4, '#7f8790'); px(11, 0, 1, 4, '#7f8790'); px(5, 0, 1, 4, '#c2c8cf'); px(12, 0, 1, 4, '#c2c8cf');
  px(0, 4, 16, 10, '#1e2128'); px(1, 5, 14, 8, '#0d0e10'); px(0, 14, 16, 1, '#7f8790'); px(1, 4, 14, 1, '#5a6068');
  for (let i = 0; i < 14; i += 2) for (let j = 0; j < 8; j += 2) px(1 + i, 5 + j, 1, 1, '#1a1208');
  x.save(); x.font = Math.round(5 * u) + 'px DOSSaemmul, monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = 'rgba(255,154,42,.85)'; x.shadowBlur = u * 1.4; x.fillStyle = '#ff9a2a'; x.fillText('AUTO', 8 * u, 9.4 * u); x.restore();
  px(13, 6, 1, 1, '#6fd88a'); px(12, 6, 1, 1, '#2fa84f');
}
function drawPortrait(c, name, f) { const x = c.getContext('2d'); x.clearRect(0, 0, c.width, c.height); const q = fr(name, f || 0); if (!q) return; const sc = Math.min((c.width - 10) / q[4], (c.height - 8) / q[5]); const w = q[4] * sc, h = q[5] * sc; x.imageSmoothingEnabled = true; x.drawImage(atlas, q[0], q[1], q[2], q[3], (c.width - w) / 2, c.height - 4 - h, w, h); }

// ---------- 저장 ----------
const SAVE = { unlock: 1, best: {}, coins: 0, shop: {}, seen: {}, clears: 0 };
try { const s = JSON.parse(localStorage.getItem('villainlike.save') || 'null'); if (s) Object.assign(SAVE, s); if (!SAVE.shop) SAVE.shop = {}; if (!SAVE.seen) SAVE.seen = {}; if (!SAVE.coins) SAVE.coins = 0; } catch (e) {}
const SHOP = [
  // 맨 위(PC 720 높이에서 일곱째 칸은 밑으로 숨어서). 자동 근무(10/10 사장님 "아이템을 구입하면 자동사냥"): 한 번 사면 위쪽 AUTO 단추로 이동을 맡김. 공격은 원래 자동
  { k: 'auto', n: ['자동근무', 'Auto Shift'], icon: 'auto', d: ['알아서 피하고 줍기', 'Dodges and collects for you'], base: 2000, max: 1 },
  { k: 'atk', n: ['캔커피한박스', 'Coffee Case'], icon: 'i_coffee', d: ['공격 +6%', 'DAMAGE +6%'], base: 40 },
  { k: 'hp', n: ['삼각김밥묶음', 'Rice Triangle Pack'], icon: 'i_gimbap', d: ['최대체력 +10', 'MAX HP +10'], base: 40 },
  { k: 'spd', n: ['새운동화', 'New Sneakers'], icon: 'i_sneakers', d: ['이동속도 +3%', 'SPEED +3%'], base: 40 },
  { k: 'mag', n: ['교통카드지갑', 'Card Wallet'], icon: 'i_card', d: ['승차권자석 +20', 'TICKET MAGNET +20'], base: 40 },
  { k: 'gas', n: ['경적정비', 'Horn Tune-up'], icon: 'o:3', d: ['경적게이지 +12%', 'HORN GAUGE +12%'], base: 50 },
  { k: 'xp', n: ['근무수당', 'Overtime Pay'], icon: 'o:10', d: ['승차권경험치 +6%', 'TICKET XP +6%'], base: 50 },
];
const SHOP_MAX = 5;
const shopLv = k => SAVE.shop[k] || 0;
const shopCost = (it, lv) => Math.round(it.base * Math.pow(1.6, lv));
const hasAuto = () => shopLv('auto') > 0;
function seen(k) { if (!SAVE.seen[k]) { SAVE.seen[k] = 1; save(); } }
function save() { try { localStorage.setItem('villainlike.save', JSON.stringify(SAVE)); } catch (e) {} }

// ---------- 상태 ----------
const G = { phase: 'title', sel: 0, t: 0, time: 0, P: null, E: [], B: [], GEM: [], FLY: [], FX: [], DN: [], AURA: [], CLOUD: [], TRAIN: null, kills: 0, spawnT: 0, bossI: 0, cam: { x: 0, y: 0 }, keys: {}, pad: { x: 0, y: 0 }, shake: 0, flash: 0, dawn: 0, paused: false, run: 0, coins: 0, demonDown: false };
window.__vl = { G, SAVE };
function rnd(a, b) { return a + Math.random() * (b - a); }
function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967296; }
function dist2(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; }
function nearestEnemy(x, y, maxD) { let best = null, bd = (maxD || 1e9) * (maxD || 1e9); for (const e of G.E) { const d = (e.x - x) ** 2 + (e.y - y) ** 2; if (d < bd) { bd = d; best = e; } } return best; }
// ---------- 주인공·무기 ----------
function newPlayer(gi) {
  const g = GUARDS[gi];
  seen('w_' + g.w); seen('g_' + gi); const hpB = 100 + 10 * shopLv('hp'), atk = 1 + 0.06 * shopLv('atk'), spd = 1 + 0.03 * shopLv('spd');
  return { gi, g, x: 0, y: 0, hp: hpB, maxhp: hpB, hpBase: hpB, speed: 165, lv: 1, xp: 0, need: 12, inv: 0, face: 1, dir: 0, moving: 0, walkT: 0, actT: 0, dmgBase: atk, dmgMul: atk, spBase: spd, spMul: spd, slowT: 0, gasMul: 1 + 0.12 * shopLv('gas'), xpMul: 1 + 0.06 * shopLv('xp'), weapons: [{ k: g.w, lv: 1, cd: 0 }], passives: {}, magnet: 80 + 20 * shopLv('mag'), hurtT: 0, gas: 40, charge: 0, charging: false, held: false, capT: 0 };
}
function wstat(w) { const d = WEAPONS[w.k]; const evo = w.lv >= 6; const Lv = Math.min(w.lv, 5) - 1; return { dmg: d.dmg * (1 + 0.25 * Lv) * (evo ? 2 : 1) * G.P.dmgMul, cd: d.cd * Math.pow(0.92, Lv) * (evo ? 0.85 : 1), n: (d.n0 || 1) + Math.floor(Lv / 2) + (evo ? 1 : 0), r: (d.r || 0) * (1 + 0.1 * Lv) * (evo ? 1.3 : 1), speed: d.speed || 0, life: d.life || 0, evo, d }; }
function proj(o) { o.hits = new Map(); o.age = 0; G.B.push(o); return o; }
function fireWeapon(w) {
  const P = G.P, s = wstat(w), d = s.d, t = d.type;
  if (t !== 'aura') P.actT = 0.16;
  if (d.snd && SND[d.snd]) SND[d.snd]();
  if (t === 'slash') { const dirs = [P.face, -P.face]; for (let i = 0; i < Math.min(s.n, 2); i++) { const dir = dirs[i]; G.AURA.push({ r: s.r, life: 0.22, max: 0.22, kind: 'slash', dir, icon: d.icon, dmg: s.dmg, hits: new Set(), ox: dir * 20, evo: s.evo }); } return; }
  if (t === 'punch') { const e = nearestEnemy(P.x, P.y, s.r + 40); if (!e) { w.cd = 0.12; w.burst = 0; return; } hurtEnemy(e, s.dmg, P.x, 180); G.FX.push({ x: e.x + rnd(-10, 10), y: e.y - 40, icon: d.icon, life: 0.18, max: 0.18, sc: s.evo ? 0.62 : 0.46, kind: 'icon', gold: s.evo }); if (!w.burst) w.burst = s.n - 1; else w.burst--; if (w.burst > 0) w.cd = -0.0899; return; }
  if (t === 'aura') { for (const e of G.E) if (dist2(e, { x: P.x, y: P.y - 20 }) < s.r * s.r) hurtEnemy(e, s.dmg, P.x, 20, true); w.auraR = s.r; w.auraEvo = s.evo; if ((G.t % 4) < 0.5 && !w.chime) { w.chime = 1; SND.speaker(); } if ((G.t % 4) >= 0.5) w.chime = 0; return; }
  if (t === 'strike') { for (let i = 0; i < s.n; i++) { const e = G.E.length ? G.E[Math.floor(Math.random() * G.E.length)] : null; const tx = e ? e.x : P.x + rnd(-200, 200), ty = e ? e.y : P.y + rnd(-200, 200); G.FX.push({ x: tx, y: ty, kind: 'smack', icon: d.icon, life: 0.45, max: 0.45, r: s.r, dmg: s.dmg, evo: s.evo, delay: i * 0.15 }); } return; }
  if (t === 'orbit') { for (let i = 0; i < s.n; i++) proj({ kind: 'orbit', k: w.k, icon: d.icon, a: (Math.PI * 2 / s.n) * i, orbit: d.orbit * (s.evo ? 1.3 : 1), dmg: s.dmg, r: s.r, life: s.life, x: P.x, y: P.y, spin: 0, evo: s.evo }); return; }
  const tgt = nearestEnemy(P.x, P.y, 900);
  for (let i = 0; i < s.n; i++) {
    let ang; if (tgt) ang = Math.atan2(tgt.y - 20 - (P.y - 30), tgt.x - P.x); else ang = P.face > 0 ? 0 : Math.PI;
    if (t === 'fan') ang += (i - (s.n - 1) / 2) * 0.26; else if (t === 'bounce') ang = tgt ? ang + rnd(-0.5, 0.5) : rnd(0, Math.PI * 2); else ang += (i - (s.n - 1) / 2) * 0.22;
    const sp = s.speed * (s.evo ? 1.15 : 1);
    const b = proj({ kind: t, k: w.k, icon: d.icon, look: d.look, x: P.x, y: P.y - 30, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, dmg: s.dmg, r: s.r, life: s.life, evo: s.evo, spin: 0, tgt, multi: t === 'bounce' || t === 'boomerang' ? 0.35 : 0, bounces: 0 });
    if (t === 'lob') { b.tx = tgt ? tgt.x : P.x + Math.cos(ang) * 220; b.ty = tgt ? tgt.y : P.y + Math.sin(ang) * 220; b.sx = b.x; b.sy = b.y; b.life = 0.7; }
  }
}
function hurtEnemy(e, dmg, fromX, kb, quiet) {
  if (e.dead) return;
  e.hp -= dmg; e.flash = 0.12; if (kb && !e.boss) { e.kx = (e.x >= fromX ? 1 : -1) * kb; } else if (kb && e.boss) { e.kx = (e.x >= fromX ? 1 : -1) * kb * 0.1; }
  G.DN.push({ x: e.x + rnd(-8, 8), y: e.y - e.h * 0.9, v: Math.round(dmg), life: 0.7, max: 0.7, big: dmg >= 40 }); if (G.DN.length > 90) G.DN.shift();
  if (!quiet) SND.hit();
  if (e.hp <= 0) killEnemy(e);
}
function killEnemy(e) {
  e.dead = true; G.kills++; $('#hKill').textContent = G.kills; G.coins += e.boss ? 40 : e.xp; seen('e_' + e.key); SND.catch();
  const nG = e.boss ? (e.def.hiker ? 4 : 14) : 1;
  for (let i = 0; i < nG; i++) G.GEM.push({ x: e.x + rnd(-14, 14), y: e.y + rnd(-10, 10), v: e.boss ? Math.ceil(e.xp / nG) : e.xp, t: rnd(0, 6) });
  if (Math.random() < (e.boss ? 1 : 0.012)) G.GEM.push({ x: e.x + 10, y: e.y, heal: 30, t: 0 });
  // 잡히면 수갑 + 빨간 검거 도장
  G.FX.push({ x: e.x, y: e.y - e.h * 0.5, kind: 'caught', life: 0.4, max: 0.4, name: e.def.spr, f: enemyFrame(e), h: e.h, flip: enemyFlip(e) });
  if (e.boss) { G.shake = 0.6; SND.bossdown(); G.FX.push({ x: e.x, y: e.y - e.h * 0.6, kind: 'arrest', life: 1.6, max: 1.6 }); if (!G.E.some(o => o.boss && !o.dead)) SND.boss(false); if (e.def.demon) { G.demonDown = true; } }
}
function updateWeapons(dt) {
  const P = G.P; for (const w of P.weapons) { w.cd -= dt; if (w.cd <= 0) { const before = w.cd; fireWeapon(w); if (w.burst > 0 && w.cd < 0) { w.cd = 0.09; } else { w.cd = before + wstat(w).cd; if (w.cd < 0.05) w.cd = 0.05; } } }
}
function updateProjectiles(dt) {
  const P = G.P;
  for (const b of G.B) {
    b.age += dt; b.spin += dt * 9;
    if (b.kind === 'orbit') { b.a += dt * 2.6; b.x = P.x + Math.cos(b.a) * b.orbit; b.y = P.y - 28 + Math.sin(b.a) * b.orbit * 0.6; if (Math.random() < dt * 14) G.FX.push({ x: b.x + rnd(-8, 8), y: b.y + 26, kind: 'drop', life: 0.5, max: 0.5 }); }
    else if (b.kind === 'homing') { if (!b.tgt || b.tgt.dead) b.tgt = nearestEnemy(b.x, b.y, 700); if (b.tgt) { const ang = Math.atan2(b.tgt.y - 20 - b.y, b.tgt.x - b.x), cur = Math.atan2(b.vy, b.vx); let da = ang - cur; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2; const na = cur + Math.max(-4 * dt, Math.min(4 * dt, da)); const sp = Math.hypot(b.vx, b.vy); b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp; } b.x += b.vx * dt; b.y += b.vy * dt; }
    else if (b.kind === 'boomerang') { const half = b.life / 2; if (b.age > half) { const ang = Math.atan2(P.y - 30 - b.y, P.x - b.x); const sp = Math.hypot(b.vx, b.vy) * 1.1; b.vx = Math.cos(ang) * sp; b.vy = Math.sin(ang) * sp; if (b.age > half + 0.15 && !b.back) { b.back = 1; b.hits.clear(); } } b.x += b.vx * dt; b.y += b.vy * dt; }
    else if (b.kind === 'lob') { const t = Math.min(1, b.age / b.life); b.x = b.sx + (b.tx - b.sx) * t; b.y = b.sy + (b.ty - b.sy) * t - Math.sin(t * Math.PI) * 130; if (t >= 1 && !b.done) { b.done = true; b.dead = true; explode(b.tx, b.ty, b.r, b.dmg, b.evo, 'ink'); } }
    else { b.x += b.vx * dt; b.y += b.vy * dt; if (b.kind === 'bounce') { const vw = W / ZOOM / 2, vh = H / ZOOM / 2; if (b.x < G.cam.x - vw + 20 && b.vx < 0 || b.x > G.cam.x + vw - 20 && b.vx > 0) { b.vx *= -1; b.hits.clear(); b.bounces++; } if (b.y < G.cam.y - vh + 20 && b.vy < 0 || b.y > G.cam.y + vh - 20 && b.vy > 0) { b.vy *= -1; b.hits.clear(); b.bounces++; } } }
    if (b.kind !== 'lob') for (const e of G.E) {
      if (e.dead) continue;
      if (b.hits.has(e)) { if ((b.kind === 'orbit' || b.evo) && b.age - b.hits.get(e) > 0.45) b.hits.delete(e); else continue; }
      const rr = b.r + e.r; if ((e.x - b.x) ** 2 + (e.y - 20 - b.y) ** 2 < rr * rr) {
        b.hits.set(e, b.age); hurtEnemy(e, b.dmg, b.x, b.kind === 'homing' ? 60 : 120); if (b.kind === 'slowshot') e.slow = 2.5;
        if (b.multi) { /* 관통 */ } else if (b.kind !== 'orbit' && b.kind !== 'boomerang' && b.kind !== 'fan' && !b.evo) { b.dead = true; break; } else if (b.kind === 'fan' && !b.evo) { b.pierce = (b.pierce || 0) + 1; if (b.pierce >= 2) { b.dead = true; break; } }
      }
    }
    if (b.age > b.life) b.dead = true;
  }
  G.B = G.B.filter(b => !b.dead);
}
function explode(x, y, r, dmg, evo, kind) { for (const e of G.E) if ((e.x - x) ** 2 + (e.y - y) ** 2 < r * r) hurtEnemy(e, dmg, x, evo ? 320 : 200, true); G.FX.push({ x, y, kind: kind || 'burst', life: 0.5, max: 0.5, r, evo }); G.shake = Math.max(G.shake, evo ? 0.3 : 0.15); SND.boom(); }
// 경적: 모았다 떼면 1호선 열차가 주인공 줄을 가로질러 달려 지나간다
function horn(pwr, perfect) {
  const P = G.P; const hb = (46 + pwr * 120) * (perfect ? 1.4 : 1), dmg = (40 + pwr * 150) * (perfect ? 2 : 1) * P.dmgMul;
  const dirR = P.face >= 0; const vw = W / ZOOM / 2 + 60;
  G.TRAIN = { y: P.y - 20, hb, dmg, dir: dirR ? 1 : -1, x: dirR ? G.cam.x - vw - 40 : G.cam.x + vw + 40, trav: 0, total: vw * 2 + 1400, sp: 2600, hits: new Set(), perfect, len: 1240 };
  SND.horn(pwr); G.shake = Math.max(G.shake, 0.35 + pwr * 0.3); if (perfect) toast('PERFECT');
}
function updateTrain(dt) {
  const T = G.TRAIN; if (!T) return;
  T.x += T.dir * T.sp * dt; T.trav += T.sp * dt;
  for (const e of G.E) { if (e.dead || T.hits.has(e)) continue; if (Math.abs(e.y - 10 - T.y) < T.hb + e.r * 0.5 && (T.dir > 0 ? e.x < T.x && e.x > T.x - T.len : e.x > T.x && e.x < T.x + T.len)) { T.hits.add(e); hurtEnemy(e, T.dmg, e.x - T.dir * 50, 380, true); e.ky = (e.y >= T.y ? 1 : -1) * 220; } }
  if (Math.random() < 0.6) G.FX.push({ x: T.x - T.dir * rnd(0, 300), y: T.y + T.hb * rnd(-1, 1), kind: 'spark', life: 0.3, max: 0.3 });
  if (T.trav > T.total) G.TRAIN = null;
}
// ---------- 빌런 ----------
function spawnEnemy(key, x, y, v) {
  const d = ENEMIES[key]; const min = G.time / 60; const mul = 1 + min * 0.14;
  if (x == null) { const vw = W / ZOOM / 2 + 80, vh = H / ZOOM / 2 + 80; const side = Math.floor(Math.random() * 4); x = G.cam.x + (side === 0 ? -vw : side === 1 ? vw : rnd(-vw, vw)); y = G.cam.y + (side === 2 ? -vh : side === 3 ? vh : rnd(-vh, vh)); }
  const m = A[d.spr]; const sc = (d.sc || 1) * (d.boss && !d.hiker ? 1.45 : 1);
  const e = { key, def: d, x, y, hp: d.hp * (d.boss ? 1 : mul), maxhp: d.hp * (d.boss ? 1 : mul), sp: d.sp * (1 + min * 0.015), dmg: d.dmg, r: d.r * (d.boss && !d.hiker ? 1.2 : 1), xp: d.xp, h: (m ? m[3] : 41) * PXS * sc, boss: !!d.boss, flash: 0, kx: 0, ky: 0, slow: 0, hitCd: 0, face: 1, dir: 0, ft: rnd(0, 2), fr: rnd(0, 4), dashT: rnd(2, 4), sumT: 3, napT: rnd(3, 7), nap: 0, cloudT: rnd(1, 3), v: v || 0, mode: 0, modeT: 6, zig: rnd(0, 6) };
  G.E.push(e);
  if (e.boss && !(d.hiker && v)) { SND.roar(); SND.boss(true); G.shake = 0.4; toast(L('boss') + ' · ' + T2(d.n)); }
  return e;
}
function spawnBoss(key) {
  if (key === 'hikers') { const vw = W / ZOOM / 2 + 80; const x = G.cam.x + (Math.random() < 0.5 ? -vw : vw), y = G.cam.y + rnd(-120, 120); for (let i = 0; i < 4; i++) spawnEnemy('hikers', x + (i % 2) * 50, y + Math.floor(i / 2) * 50, i); return; }
  if (key === 'demon') { G.lastTrain = true; toast(L('last')); if (G.auto) { G.autoLock = true; syncAuto(); if (G.AI) G.AI.hold = 0; G.sp = false; setTimeout(() => { if (G.phase === 'play') toast(L('last') + ' · AUTO OFF'); }, 1500); } }
  spawnEnemy(key);
}
function updateEnemies(dt) {
  const P = G.P; const min = G.time / 60;
  G.spawnT -= dt;
  if (G.spawnT <= 0 && G.E.length < 230 && !G.demonDown) { const pool = WAVES[Math.min(WAVES.length - 1, Math.floor(min / 1.8))]; const n = 1 + Math.floor(min / 2.4); for (let i = 0; i < n; i++) spawnEnemy(pool[Math.floor(Math.random() * pool.length)]); G.spawnT = Math.max(0.22, 1.0 - min * 0.07); }
  while (G.bossI < BOSS_AT.length && G.time >= BOSS_AT[G.bossI][0]) { spawnBoss(BOSS_AT[G.bossI][1]); G.bossI++; }
  // 트로트 할아버지 주위는 빨라짐
  const hasteSrc = G.E.filter(e => e.def.haste && !e.dead);
  const grid = new Map(); const CS = 48;
  for (const e of G.E) { const k = ((e.x / CS) | 0) + ',' + ((e.y / CS) | 0); (grid.get(k) || grid.set(k, []).get(k)).push(e); }
  P.slowT = Math.max(0, P.slowT - dt);
  for (const e of G.E) {
    const d = e.def; e.flash -= dt; e.hitCd -= dt; e.ft += dt; if (e.slow > 0) e.slow -= dt;
    let sp = e.sp * (e.slow > 0 ? 0.45 : 1); const dx = P.x - e.x, dy = (P.y - 10) - e.y; const dd = Math.hypot(dx, dy) || 1;
    if (!d.haste) for (const h of hasteSrc) if ((h.x - e.x) ** 2 + (h.y - e.y) ** 2 < 140 * 140) { sp *= 1.3; break; }
    let mx = dx / dd, my = dy / dd;
    // 대악마는 6초마다 기술을 바꾼다: 0 돌진, 1 앰프(느리게)+전도사, 2 잡상인, 3 비둘기 떼
    let dash = d.dash, slowA = d.slowAura, summon = d.summon;
    if (d.demon) { e.modeT -= dt; if (e.modeT < 0) { e.mode = (e.mode + 1) % 4; e.modeT = 6; e.sumT = 0.5; } dash = e.mode === 0; slowA = e.mode === 1; summon = e.mode === 1 ? 'preacher' : e.mode === 2 ? 'vendor' : e.mode === 3 ? 'pigeon' : null; }
    if (dash) { e.dashT -= dt; if (e.dashT < 0) { e.dashing = 0.5; e.dashT = rnd(2.6, 4.2); e.dvx = mx * 540; e.dvy = my * 540; G.FX.push({ x: e.x, y: e.y, kind: 'dust', life: 0.4, max: 0.4 }); } if (e.dashing > 0) { e.dashing -= dt; e.x += e.dvx * dt; e.y += e.dvy * dt; sp = 0; } }
    if (summon) { e.sumT -= dt; if (e.sumT < 0) { e.sumT = d.demon ? 3 : 4.5; const k = summon; for (let i = 0; i < (k === 'pigeon' ? 5 : 3); i++) spawnEnemy(k, e.x + rnd(-70, 70), e.y + rnd(-50, 50)); if (k === 'pigeon') SND.coo(); } }
    if (slowA && dd < 230) P.slowT = 0.3;
    if (d.hop) sp *= (Math.sin(e.ft * 7) > 0 ? 1.7 : 0.25);
    if (d.zig) { const a = Math.sin(e.ft * 3 + e.zig) * 1.1; const c = Math.cos(a), s = Math.sin(a); const nx = mx * c - my * s, ny = mx * s + my * c; mx = nx; my = ny; }
    if (d.nap) { if (e.nap > 0) { e.nap -= dt; sp = 0; } else { e.napT -= dt; if (e.napT < 0 && dd < 420) { e.nap = rnd(2, 3.5); e.napT = rnd(5, 9); } } }
    if (d.smell) { e.cloudT -= dt; if (e.cloudT < 0) { e.cloudT = rnd(3, 5); G.CLOUD.push({ x: e.x, y: e.y - 10, r: 46, life: 4, max: 4, col: d.spr === 'v_chicken' ? 'chicken' : 'soju' }); } }
    e.x += mx * sp * dt; e.y += my * sp * dt;
    // 보는 쪽: 옆(2)·앞(0)·뒤(1)
    const ax = Math.abs(mx), ay = Math.abs(my); e.dir = ax > ay * 0.8 ? 2 : my > 0 ? 0 : 1; e.face = mx >= 0 ? 1 : -1; if (sp > 0) e.fr += dt * 7 * Math.max(0.6, sp / 90);
    if (e.kx) { e.x += e.kx * dt; e.kx *= Math.pow(0.001, dt); if (Math.abs(e.kx) < 2) e.kx = 0; }
    if (e.ky) { e.y += e.ky * dt; e.ky *= Math.pow(0.001, dt); if (Math.abs(e.ky) < 2) e.ky = 0; }
    const gx = (e.x / CS) | 0, gy = (e.y / CS) | 0;
    for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) { const arr = grid.get((gx + ox) + ',' + (gy + oy)); if (!arr) continue; for (const o of arr) { if (o === e) continue; const ddx = e.x - o.x, ddy = e.y - o.y, d2 = ddx * ddx + ddy * ddy, mr = (e.r + o.r) * 0.9; if (d2 < mr * mr && d2 > 0.01) { const l = Math.sqrt(d2), push = (mr - l) * 0.5 * (o.boss ? 1 : 0.5); e.x += ddx / l * push; e.y += ddy / l * push; } } }
    if (e.hitCd <= 0 && P.inv <= 0) { const rr = e.r + 16; if (dx * dx + dy * dy < rr * rr) { hurtPlayer(e.dmg); e.hitCd = 0.8; } }
  }
  G.E = G.E.filter(e => !e.dead);
  // 냄새 구름: 들어가면 느려지고 조금씩 아픔
  for (const c of G.CLOUD) { c.life -= dt; if ((P.x - c.x) ** 2 + (P.y - 20 - c.y) ** 2 < c.r * c.r) { P.slowT = Math.max(P.slowT, 0.25); if (P.inv <= 0 && Math.random() < dt * 1.5) hurtPlayer(2); } }
  G.CLOUD = G.CLOUD.filter(c => c.life > 0);
}
function hurtPlayer(d) { const P = G.P; P.hp -= d; P.inv = 0.5; P.hurtT = 0.3; G.flash = 0.25; SND.hurt(); if (P.hp <= 0) { P.hp = 0; gameOver(false); } }
// ---------- 주인공 움직임·경험치 ----------
function updatePlayer(dt) {
  const P = G.P; let mx = 0, my = 0; const K = G.keys;
  if (K.ArrowLeft || K.a || K.A) mx -= 1; if (K.ArrowRight || K.d || K.D) mx += 1; if (K.ArrowUp || K.w || K.W) my -= 1; if (K.ArrowDown || K.s || K.S) my += 1;
  if (G.pad.x || G.pad.y) { mx = G.pad.x; my = G.pad.y; }
  if (G.auto) { const a = autoSteer(dt, !!(mx || my)); if (!(mx || my)) { mx = a[0]; my = a[1]; } }
  const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; }
  const slow = P.slowT > 0 ? 0.62 : 1;
  P.moving = l > 0.05;
  if (P.moving) { P.x += mx * P.speed * P.spMul * slow * dt; P.y += my * P.speed * P.spMul * slow * dt; P.walkT += dt * slow; if (Math.abs(mx) > 0.3) P.face = mx > 0 ? 1 : -1; P.dir = Math.abs(mx) > Math.abs(my) * 0.8 ? 2 : my > 0 ? 0 : 1; }
  P.inv -= dt; P.hurtT -= dt; P.actT -= dt;
  // 경적: 스페이스(폰은 오른쪽 아래 단추)를 누르고 있으면 모으고, 떼면 열차가 지나간다. 게이지는 저절로 찬다
  if (!P.charging) {
    P.gas = Math.min(100, P.gas + 9 * P.gasMul * dt);
    if (G.sp && !P.held) { P.held = true; if (P.gas >= 15 && !G.TRAIN) { P.charging = true; P.charge = 0; P.capT = 0; } }
  } else {
    P.charge = Math.min(P.gas, P.charge + 70 * dt); const capped = P.charge >= P.gas - 0.01; if (capped) P.capT += dt;
    SND.charge(P.charge / 100);
    if (!G.sp || P.capT > 1.5) { P.charging = false; const pwr = P.charge / 100, perfect = capped && P.gas >= 99 && P.capT < 0.5; P.gas -= P.charge; P.charge = 0; horn(pwr, perfect); }
  }
  if (!G.sp) P.held = false;
  // 승차권 줍기
  for (const g of G.GEM) { g.t += dt; const dx = P.x - g.x, dy = P.y - 20 - g.y, d = Math.hypot(dx, dy) || 1; if (d < P.magnet) { const sp = 320 + (P.magnet - d) * 6; g.x += dx / d * sp * dt; g.y += dy / d * sp * dt; } if (d < 22) { g.dead = true; if (!g.heal && G.FLY.length < 30) G.FLY.push({ x: sx(g.x), y: sy(g.y), t: 0, big: g.v >= 3 }); if (g.heal) { P.hp = Math.min(P.maxhp, P.hp + g.heal); toast('+' + g.heal); SND.levelup(); } else { P.xp += g.v * P.xpMul; SND.gem(); } } }
  G.GEM = G.GEM.filter(g => !g.dead); if (G.GEM.length > 400) G.GEM.splice(0, G.GEM.length - 400);
  if (P.xp >= P.need) { P.xp -= P.need; P.lv++; P.hp = Math.min(P.maxhp, P.hp + 15); P.need = Math.round(10 + P.lv * 7 + P.lv * P.lv * 1.3); $('#hLv').textContent = P.lv; openLevelUp(); }
  $('#xpfill').style.width = Math.min(100, P.xp / P.need * 100) + '%';
}
// 자동 근무 길찾기: 0.12초마다 둘러보고(사람처럼 조금 늦게) 빌런 무리 반대쪽으로, 안전하면 승차권, 체력이 낮으면 회복 먼저. 경적은 꽉 차고 빌런이 많을 때
// 실력: 0.35초마다 둘러보고 200 안쪽만 봄(10/10 봇으로 잼: 상점 0단계 4~10분, 2단계부터 막차까지 버팀). 막차 대악마는 손으로(자동이 꺼짐)
const AUTO_CFG = { look: 0.35, R: 200, greed: 0.03, safe: 110, horn: 1 };
function autoSteer(dt, manual) {
  const P = G.P, A = G.AI || (G.AI = { x: 0, y: 0, tx: 0, ty: 0, t: 0, hold: 0 });
  if (manual) { A.t = 0.3; A.x = A.y = 0; return [0, 0]; }
  A.t -= dt;
  if (A.t <= 0) {
    const C = AUTO_CFG; A.t = C.look; let fx = 0, fy = 0, near = 1e9;
    for (const e of G.E) { const dx = P.x - e.x, dy = P.y - 10 - e.y, d2 = dx * dx + dy * dy + 1; if (d2 < near) near = d2; if (d2 < C.R * C.R) { let w = (e.boss ? 3 : 1) * (e.dmg / 6) / d2; if (e.dashing > 0) w *= 4; fx += dx * w; fy += dy * w; } }
    for (const c of G.CLOUD) { const dx = P.x - c.x, dy = P.y - 20 - c.y, d2 = dx * dx + dy * dy + 1; if (d2 < (c.r + 60) ** 2) { fx += dx / d2 * 2; fy += dy / d2 * 2; } }
    const low = P.hp < P.maxhp * 0.45; let g = null, gd = 1e9;
    for (const q of G.GEM) { let d = (q.x - P.x) ** 2 + (q.y - P.y) ** 2; if (q.heal) d *= low ? 0.05 : 0.5; if (d < gd) { gd = d; g = q; } }
    if (g && gd < 600 * 600) { const d = Math.hypot(g.x - P.x, g.y - P.y) + 1, k = near > C.safe * C.safe ? C.greed : g.heal && low ? 0.02 : 0.006; fx += (g.x - P.x) / d * k; fy += (g.y - P.y) / d * k; }
    fx += -P.x * 1e-7; fy += -P.y * 1e-7;
    const l = Math.hypot(fx, fy); A.tx = l > 1e-9 ? fx / l : 0; A.ty = l > 1e-9 ? fy / l : 0;
  }
  const k = Math.min(1, dt * 9); A.x += (A.tx - A.x) * k; A.y += (A.ty - A.y) * k;
  // 경적: 손으로 스페이스를 안 누를 때만
  if (A.hold > 0) { A.hold -= dt; G.sp = A.hold > 0; } else if (AUTO_CFG.horn && P.gas >= 99 && G.E.length > 15 && !G.TRAIN) { A.hold = 1.3; G.sp = true; }
  return [A.x, A.y];
}
// ---------- 레벨업 카드(가끔 금테: 두 단계 한꺼번에) ----------
function cardPool() {
  const P = G.P, pool = [];
  for (const w of P.weapons) { if (w.lv < 5) pool.push({ kind: 'w', k: w.k, lv: w.lv + 1 }); else if (w.lv === 5 && Object.values(P.passives).some(v => v >= 3)) pool.push({ kind: 'w', k: w.k, lv: 6, evo: true }); }
  if (P.weapons.length < 5) for (const k of Object.keys(WEAPONS)) if (!P.weapons.some(w => w.k === k) && !GUARDS.some((g, i) => g.w === k && i !== P.gi)) pool.push({ kind: 'w', k, lv: 1 });
  for (const k of Object.keys(PASSIVES)) if ((P.passives[k] || 0) < 5) pool.push({ kind: 'p', k, lv: (P.passives[k] || 0) + 1 });
  if (!pool.length) pool.push({ kind: 'heal' });
  return pool;
}
function openLevelUp() {
  G.phase = 'levelup'; SND.levelup(); SND.duck(true); const pool = cardPool(); const picks = [];
  const evo = pool.find(c => c.evo); if (evo) picks.push(evo);
  while (picks.length < 3 && pool.length) { const i = Math.floor(Math.random() * pool.length); const c = pool.splice(i, 1)[0]; if (!picks.includes(c)) picks.push(c); }
  // 금테: 12% 로 한 장, 올릴 수 있는 무기·아이템이면 두 단계
  for (const c of picks) if (!c.evo && c.kind !== 'heal' && c.lv <= 4 && Math.random() < 0.12) { c.gold = true; c.lv = Math.min(5, c.lv + 1); break; }
  const box = $('#cards'); box.innerHTML = ''; $('#luLv').textContent = 'LV ' + G.P.lv;
  picks.forEach((c, idx) => {
    const el = document.createElement('div'); el.className = 'card' + (c.evo ? ' evo' : '') + (c.gold ? ' gold' : '');
    el.style.animationDelay = (idx * 0.07) + 's';
    const def = c.kind === 'w' ? WEAPONS[c.k] : c.kind === 'p' ? PASSIVES[c.k] : null;
    const ic = document.createElement('canvas'); ic.width = ic.height = 96; drawIcon(ic, def ? def.icon : 'i_milk'); el.appendChild(ic);
    const t = document.createElement('div'); t.className = 't';
    const name = c.kind === 'heal' ? L('heal') : c.evo ? T2(def.evo) : T2(def.n);
    const cur = c.kind === 'w' ? ((G.P.weapons.find(w => w.k === c.k) || {}).lv || 0) : c.kind === 'p' ? (G.P.passives[c.k] || 0) : 0;
    const desc = c.kind === 'heal' ? (EN ? 'HP +50' : '체력 +50') : c.kind === 'p' ? def.d[EN ? 1 : 0] + (c.gold ? ' ×2' : '') : cur === 0 ? T2(WDESC[def.type]) : c.evo ? (EN ? 'DAMAGE x2' : '피해 2배') : (EN ? 'DAMAGE +' : '피해 +') + (25 * (c.lv - Math.max(1, cur))) + '%';
    const tag = c.kind === 'heal' ? '' : c.evo ? L('evo') : c.gold ? L('gold') + ' LV ' + c.lv : c.lv === 1 ? (c.kind === 'w' ? L('newW') : L('newP')) : 'LV ' + c.lv;
    t.innerHTML = '<div class="n"></div><div class="d"></div>'; t.firstChild.textContent = name; t.lastChild.textContent = desc;
    const lv = document.createElement('div'); lv.className = 'lv'; lv.textContent = tag;
    el.append(t, lv); el.onclick = () => { applyCard(c); $('#levelup').hidden = true; G.phase = 'play'; SND.duck(false); if (c.gold) SND.gold(); else SND.blip(); }; box.appendChild(el);
  });
  if (picks.some(c => c.gold)) SND.gold();
  $('#levelup').hidden = false;
}
function applyCard(c) {
  const P = G.P;
  if (c.kind === 'heal') { P.hp = Math.min(P.maxhp, P.hp + 50); return; }
  if (c.kind === 'w') { const w = P.weapons.find(x => x.k === c.k); if (w) w.lv = c.lv; else P.weapons.push({ k: c.k, lv: c.lv, cd: 0 }); seen('w_' + c.k); if (c.evo) seen('w_' + c.k + '_evo'); return; }
  P.passives[c.k] = c.lv; seen('i_' + c.k);
  if (c.k === 'coffee') P.dmgMul = P.dmgBase * (1 + 0.12 * c.lv); if (c.k === 'gimbap') { P.maxhp = P.hpBase + 25 * c.lv; P.hp = Math.min(P.maxhp, P.hp + 25); } if (c.k === 'sneakers') P.spMul = P.spBase * (1 + 0.08 * c.lv);
}
// ---------- 그리기 ----------
function sx(x) { return (x - G.cam.x) * ZOOM + W / 2; }
function sy(y) { return (y - G.cam.y) * ZOOM + H / 2; }
function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
// 구간(2분마다) 바닥 색: 낮 승강장 -> 밤 막차
const ZONES = [
  { a: '#c9ccc7', b: '#c1c4bf', s: '#a7aaa5', v: 'rgba(20,24,40,' },
  { a: '#cfc8bb', b: '#c6bfb2', s: '#aaa396', v: 'rgba(20,24,40,' },
  { a: '#bfc6cc', b: '#b6bdc4', s: '#9aa1a8', v: 'rgba(16,22,44,' },
  { a: '#c6c0c8', b: '#bcb6be', s: '#a29ca4', v: 'rgba(18,18,40,' },
  { a: '#b2b8bc', b: '#aab0b4', s: '#8e9498', v: 'rgba(10,14,36,' },
  { a: '#9ea4ab', b: '#979ca3', s: '#7c8188', v: 'rgba(6,10,30,' },
  { a: '#8a8f98', b: '#848990', s: '#6b7078', v: 'rgba(4,6,24,' }];
function zone() { return ZONES[Math.min(ZONES.length - 1, Math.floor((G.phase === 'play' || G.phase === 'levelup' || G.phase === 'pause' || G.phase === 'over' ? G.time : 0) / 120))]; }
function station() { return STATIONS[Math.min(STATIONS.length - 1, Math.floor(G.time / NIGHT * (STATIONS.length - 1)))]; }
function drawGround() {
  const z = zone(), TS = 64, ts = TS * ZOOM;
  const x0 = Math.floor((G.cam.x - W / 2 / ZOOM) / TS) - 1, x1 = Math.ceil((G.cam.x + W / 2 / ZOOM) / TS) + 1, y0 = Math.floor((G.cam.y - H / 2 / ZOOM) / TS) - 1, y1 = Math.ceil((G.cam.y + H / 2 / ZOOM) / TS) + 1;
  R(0, 0, W, H, z.s);
  const u = Math.max(2, Math.round(3 * ZOOM));
  for (let j = y0; j <= y1; j++) {
    const yel = ((j % 9) + 9) % 9 === 0; // 노란 점자블록 띠
    for (let i = x0; i <= x1; i++) {
      const px = sx(i * TS), py = sy(j * TS), h = hash(i, j);
      if (yel) { R(px, py, ts - 2, ts - 2, '#e2bd34'); R(px, py, ts - 2, u, '#f2d460'); for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) R(px + (a + 0.5) * ts / 4 - u / 2, py + (b + 0.5) * ts / 4 - u / 2, u + 1, u + 1, '#b8941e'); continue; }
      R(px, py, ts - 2, ts - 2, h < 0.5 ? z.a : z.b); R(px, py, ts - 2, u * 0.7, 'rgba(255,255,255,.18)');
      if (h > 0.93) R(px + ts * 0.3, py + ts * 0.55, ts * 0.22, u, 'rgba(0,0,0,.12)'); // 긁힌 자국
      if (h > 0.985) R(px + ts * 0.5, py + ts * 0.3, u * 2, u * 2, 'rgba(60,40,20,.25)'); // 껌 자국
    }
  }
}
// 마당 소품: 기둥(역 이름판), 의자, 손잡이 기둥, 바리케이드
function propsNear() {
  const out = []; const CS = 560; const vw = W / ZOOM / 2 + 300, vh = H / ZOOM / 2 + 420;
  const gx0 = Math.floor((G.cam.x - vw) / CS), gx1 = Math.floor((G.cam.x + vw) / CS), gy0 = Math.floor((G.cam.y - vh) / CS), gy1 = Math.floor((G.cam.y + vh) / CS);
  for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
    if (gx === 0 && gy === 0) continue; const h = hash(gx, gy); if (h < 0.1) continue;
    const kind = h < 0.45 ? 'pillar' : h < 0.65 ? 'bench' : h < 0.78 ? 'pole' : h < 0.9 ? 'bench2' : 'fence';
    out.push({ kind, x: gx * CS + hash(gx + 1, gy) * CS * 0.7 + CS * 0.15, y: gy * CS + hash(gx, gy + 1) * CS * 0.7 + CS * 0.15, h });
  }
  return out;
}
function drawPillar(p) {
  const x = sx(p.x), y = sy(p.y), w = 64 * ZOOM, h = 250 * ZOOM, u = Math.max(1, Math.round(2 * ZOOM));
  R(x - w / 2 - 6 * ZOOM, y - 6 * ZOOM, w + 12 * ZOOM, 10 * ZOOM, 'rgba(0,0,0,.25)');
  R(x - w / 2, y - h, w, h, '#eef0ee'); R(x + w * 0.22, y - h, w * 0.28, h, '#d6d9d6'); R(x - w / 2, y - h, w * 0.12, h, '#ffffff');
  for (let k = 1; k < 12; k++) R(x - w / 2, y - h + k * h / 12, w, u, '#c9ccc9');
  R(x - u / 2, y - h, u, h, '#d0d3d0');
  R(x - w / 2, y - 14 * ZOOM, w, 14 * ZOOM, '#5d636b'); R(x - w / 2, y - h, w, 10 * ZOOM, '#5d636b');
  // 역 이름판: 흰 판 + 남색 띠 + 동그라미
  const bw = 132 * ZOOM, bh = 44 * ZOOM, by = y - h * 0.68;
  R(x - bw / 2, by + 4 * ZOOM, bw, bh, 'rgba(0,0,0,.25)'); R(x - bw / 2, by, bw, bh, '#1e2128'); R(x - bw / 2 + u, by + u, bw - u * 2, bh - u * 2, '#fbfaf5');
  R(x - bw / 2 + u, by + bh - 12 * ZOOM, bw - u * 2, 8 * ZOOM, '#0052a4');
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, by + bh - 8 * ZOOM, 7 * ZOOM, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#0052a4'; ctx.lineWidth = 3 * ZOOM; ctx.stroke();
  const st = station(), nm = T2(st); ctx.fillStyle = '#1b1d21'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = Math.round((EN ? 13 : 17) * ZOOM) + 'px DOSSaemmul, monospace'; ctx.fillText(nm, x, by + 15 * ZOOM);
}
function drawProp(p) {
  if (p.kind === 'pillar') return drawPillar(p);
  const x = sx(p.x), y = sy(p.y);
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x, y, 60 * ZOOM, 12 * ZOOM, 0, 0, Math.PI * 2); ctx.fill();
  ctx.imageSmoothingEnabled = false;
  if (p.kind === 'bench' || p.kind === 'bench2') { const s = 150 * ZOOM; iconC(p.kind === 'bench' ? 'o:4' : 'o:5', x - s * 0.48, y - s * 0.4, s); iconC(p.kind === 'bench' ? 'o:4' : 'o:5', x + s * 0.48, y - s * 0.4, s); }
  else if (p.kind === 'pole') iconC('o:6', x, y - 110 * ZOOM, 230 * ZOOM);
  else { const s = 120 * ZOOM; iconC('o:0', x - s * 0.45, y - s * 0.45, s); iconC(p.h > 0.95 ? 'o:1' : 'o:0', x + s * 0.45, y - s * 0.45, s); }
  ctx.imageSmoothingEnabled = true;
}
function enemyFrame(e) {
  const d = e.def, step = (e.fr | 0) % 4;
  if (d.hiker) return ((e.fr | 0) % 2 ? 4 : 0) + e.v;
  if (d.bird) return 4 + step;
  if (d.nap && e.nap > 0) return 11;
  if (e.dashing > 0) return e.dir === 2 ? 11 : e.dir === 1 ? 7 : 3;
  return (e.dir === 2 ? 8 : e.dir === 1 ? 4 : 0) + step;
}
function enemyFlip(e) { const d = e.def; if (d.hiker) return false; if (d.bird) return e.face < 0; if (e.dir !== 2 && !(d.nap && e.nap > 0)) return false; return e.face < 0; }
function drawEnemy(e) {
  const d = e.def, x = sx(e.x), lift = d.bird ? (12 + Math.sin(e.ft * 9) * 4) * ZOOM : 0, hopY = d.hop ? Math.max(0, Math.sin(e.ft * 7)) * 18 * ZOOM : 0;
  const y = sy(e.y) - lift - hopY, h = e.h * ZOOM, f = enemyFrame(e), fl = enemyFlip(e);
  if (d.haste) { const ph = (G.t * 1.6 + e.ft) % 1; ctx.globalAlpha = 1 - ph; ctx.fillStyle = '#ff5ac8'; ctx.font = Math.round(16 * ZOOM) + 'px DOSGothic, monospace'; ctx.textAlign = 'center'; ctx.fillText('♪', x + 18 * ZOOM + ph * 8, y - h * 0.8 - ph * 20 * ZOOM); ctx.fillText('♫', x - 20 * ZOOM, y - h * 0.65 - ph * 14 * ZOOM); ctx.globalAlpha = 1; }
  if ((d.slowAura || (d.demon && e.mode === 1))) { const ph = (G.t * 1.2) % 1; ctx.strokeStyle = 'rgba(255,224,74,' + (0.5 * (1 - ph)) + ')'; ctx.lineWidth = 3 * ZOOM; ctx.setLineDash([8 * ZOOM, 8 * ZOOM]); ctx.beginPath(); ctx.ellipse(x, sy(e.y), 230 * ZOOM * ph, 230 * ZOOM * ph * 0.6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
  sprF(d.spr, f, x, y, h, fl);
  if (e.flash > 0) sprF(d.spr, f, x, y, h, fl, true, 0.75);
  if (e.slow > 0) { ctx.fillStyle = 'rgba(255,59,48,.85)'; ctx.fillRect(x - 3 * ZOOM, y - h - 4 * ZOOM, 6 * ZOOM, 6 * ZOOM); } // CCTV 빨간 점
  if (d.nap && e.nap > 0) { ctx.fillStyle = '#fff'; ctx.font = Math.round(14 * ZOOM) + 'px DOSSaemmul, monospace'; ctx.textAlign = 'center'; const z = (G.t * 1.5) % 1; ctx.globalAlpha = 1 - z; ctx.fillText('Z', x + 20 * ZOOM + z * 10, y - h * 0.6 - z * 24 * ZOOM); ctx.globalAlpha = 1; }
  if (e.boss && (!d.hiker || e.v === 0)) {
    const nm = T2(d.n); ctx.font = Math.round(13 * ZOOM) + 'px DOSGothic, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tw = ctx.measureText(nm).width + 14 * ZOOM, ny = y - h - 30 * ZOOM;
    R(x - tw / 2, ny, tw, 18 * ZOOM, '#0052a4'); R(x - tw / 2, ny, tw, 2 * ZOOM, '#4f8ae0'); R(x - tw / 2, ny + 16 * ZOOM, tw, 2 * ZOOM, '#002f63'); ctx.fillStyle = '#fff'; ctx.fillText(nm, x, ny + 10 * ZOOM);
    const bw = 96 * ZOOM, bh = 7 * ZOOM, by = y - h - 9 * ZOOM; let hp = e.hp, mx = e.maxhp;
    if (d.hiker) { hp = 0; mx = 0; for (const o of G.E) if (o.def.hiker) { hp += Math.max(0, o.hp); mx += o.maxhp; } mx = Math.max(mx, e.maxhp * 4); }
    R(x - bw / 2 - 2, by - 2, bw + 4, bh + 4, '#15131a'); R(x - bw / 2, by, bw, bh, '#3a1714'); R(x - bw / 2, by, bw * Math.max(0, hp / mx), bh, '#ff3b30');
  }
}
function drawPlayer() {
  const P = G.P, x = sx(P.x), m = A[P.g.spr], h = m[3] * PXS * ZOOM; const st = Math.floor(P.walkT * 8) % 2;
  let f = P.dir === 2 ? 8 : P.dir === 1 ? 4 : 0; if (P.moving) f += st; if (P.actT > 0) f = P.dir === 2 ? 11 : P.dir === 1 ? 7 : 3;
  const bob = P.moving ? Math.abs(Math.sin(P.walkT * 12)) * 4 * ZOOM : 0, y = sy(P.y) - bob;
  const flip = P.dir === 2 ? P.face < 0 : (P.actT > 0 && P.dir === 0 && P.face < 0);
  if (P.inv > 0 && Math.floor(P.inv * 20) % 2) ctx.globalAlpha = 0.45;
  sprF(P.g.spr, f, x, y, h, flip); if (P.hurtT > 0) sprF(P.g.spr, f, x, y, h, flip, true, 0.6);
  ctx.globalAlpha = 1;
  if (P.slowT > 0) { ctx.fillStyle = 'rgba(255,224,74,.85)'; for (let i = 0; i < 3; i++) { const a = G.t * 5 + i * 2.1; ctx.fillRect(x + Math.cos(a) * 16 * ZOOM - 2, y - h - 6 * ZOOM + Math.sin(a) * 4 * ZOOM, 4 * ZOOM, 4 * ZOOM); } }
}
function drawTrain(T) {
  const yC = sy(T.y), hh = Math.max(60, T.hb) * ZOOM * 1.15, top = yC - hh, bot = yC + hh * 0.55, H2 = bot - top, u = Math.max(2, 3 * ZOOM);
  const front = sx(T.x), dir = T.dir, carL = 400 * ZOOM, gap = 14 * ZOOM;
  // 선로 그림자 + 바람 줄
  R(Math.min(front, front - dir * T.len * ZOOM), bot, T.len * ZOOM, 10 * ZOOM, 'rgba(0,0,0,.35)');
  for (let c = 0; c < 3; c++) {
    const a = front - dir * (c * (carL + gap)), b = a - dir * carL, x0 = Math.min(a, b), w = carL;
    R(x0, top, w, H2, '#1e2128'); R(x0 + u, top + u, w - u * 2, H2 - u * 2, '#cfd4da'); R(x0 + u, top + u, w - u * 2, H2 * 0.08, '#eef1f3'); R(x0 + u, bot - H2 * 0.18, w - u * 2, H2 * 0.18 - u, '#9aa1a9');
    R(x0 + u, top + H2 * 0.62, w - u * 2, H2 * 0.09, '#0052a4'); R(x0 + u, top + H2 * 0.74, w - u * 2, H2 * 0.03, '#0052a4');
    for (let k = 0; k < 5; k++) { const wx = x0 + w * (0.06 + k * 0.19), ww = w * 0.13; R(wx, top + H2 * 0.18, ww, H2 * 0.32, '#1e2128'); R(wx + u, top + H2 * 0.18 + u, ww - u * 2, H2 * 0.32 - u * 2, '#3b4f6e'); R(wx + u, top + H2 * 0.18 + u, ww * 0.35, H2 * 0.32 - u * 2, '#6f8fb5'); }
    for (let k = 0; k < 4; k++) { const dx = x0 + w * (0.2 + k * 0.19) - u; R(dx, top + H2 * 0.12, u, H2 * 0.75, '#7f8790'); }
  }
  // 앞머리: 전조등 + 행선 LED
  const nx = front - (dir > 0 ? 0 : 0); R(dir > 0 ? nx - 26 * ZOOM : nx, top + H2 * 0.18, 26 * ZOOM, H2 * 0.3, '#2a3a52');
  R(dir > 0 ? nx - 10 * ZOOM : nx + 2 * ZOOM, top + H2 * 0.56, 8 * ZOOM, 8 * ZOOM, '#fff6b0');
  const gl = ctx.createRadialGradient(nx, top + H2 * 0.6, 4, nx, top + H2 * 0.6, 140 * ZOOM); gl.addColorStop(0, 'rgba(255,246,176,.55)'); gl.addColorStop(1, 'rgba(255,246,176,0)'); ctx.fillStyle = gl; ctx.fillRect(nx - 140 * ZOOM, top + H2 * 0.6 - 140 * ZOOM, 280 * ZOOM, 280 * ZOOM);
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; for (let i = 0; i < 8; i++) { const ly = top + H2 * (0.1 + i * 0.12), lx = front - dir * (T.len * ZOOM + 20 + (i * 53 % 160) * ZOOM); ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx - dir * 160 * ZOOM, ly); ctx.stroke(); }
}
function drawWorld() {
  const P = G.P; drawGround();
  const u = Math.max(2, 3 * ZOOM);
  // 냄새 구름
  for (const c of G.CLOUD) { const t = c.life / c.max, x = sx(c.x), y = sy(c.y), r = c.r * ZOOM; ctx.globalAlpha = Math.min(1, t * 2) * 0.55; ctx.fillStyle = c.col === 'chicken' ? '#c9a65a' : '#9fc48a'; for (let i = 0; i < 7; i++) { const a = i * 0.9 + G.t * 0.8; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.35, r * 0.45, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1; }
  // 안내방송 범위
  for (const w of P.weapons) if (w.auraR) { const r = w.auraR * ZOOM, cx = sx(P.x), cy = sy(P.y - 20), ph = (G.t * 0.8) % 1; ctx.strokeStyle = w.auraEvo ? 'rgba(255,154,42,.55)' : 'rgba(255,224,74,.45)'; ctx.lineWidth = 3 * ZOOM; for (let k = 0; k < 2; k++) { const q = (ph + k * 0.5) % 1; ctx.globalAlpha = 1 - q; ctx.beginPath(); ctx.ellipse(cx, cy, r * q, r * q * 0.7, 0, 0, Math.PI * 2); ctx.stroke(); } ctx.globalAlpha = 1; }
  // 승차권(경험치)·바나나우유
  for (const g of G.GEM) { const x = sx(g.x), y = sy(g.y) + Math.sin(g.t * 5) * 3 * ZOOM; if (g.heal) { ctx.imageSmoothingEnabled = false; iconC('i_milk', x, y - 10 * ZOOM, 36 * ZOOM); ctx.imageSmoothingEnabled = true; continue; } const big = g.v >= 3, w = (big ? 16 : 12) * ZOOM, h = (big ? 10 : 8) * ZOOM; R(x - w / 2 - 1, y - h - 1, w + 2, h + 2, '#1e2128'); R(x - w / 2, y - h, w, h, big ? '#f2c744' : '#0052a4'); R(x - w / 2, y - h * 0.45, w, Math.max(1, h * 0.18), '#fff'); R(x + w * 0.18, y - h * 0.85, u * 0.8, u * 0.8, big ? '#fff' : '#ffd84a'); }
  // 그림자
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  for (const e of G.E) { ctx.beginPath(); ctx.ellipse(sx(e.x), sy(e.y) + 2, e.r * 1.1 * ZOOM, e.r * 0.35 * ZOOM, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(sx(P.x), sy(P.y) + 2, 20 * ZOOM, 7 * ZOOM, 0, 0, Math.PI * 2); ctx.fill();
  // 경적 모으는 중: 열차가 지나갈 줄을 점선으로
  if (P.charging) { const hb = (46 + P.charge / 100 * 120) * ZOOM, cy = sy(P.y - 20), full = P.charge >= P.gas - 0.01 && P.gas >= 99; ctx.fillStyle = full ? 'rgba(255,240,160,.16)' : 'rgba(255,224,74,.1)'; ctx.fillRect(0, cy - hb, W, hb * 2); ctx.strokeStyle = full && Math.floor(G.t * 10) % 2 ? '#fff6b0' : '#ffd84a'; ctx.lineWidth = 3; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -G.t * 80 * P.face; ctx.beginPath(); ctx.moveTo(0, cy - hb); ctx.lineTo(W, cy - hb); ctx.moveTo(0, cy + hb); ctx.lineTo(W, cy + hb); ctx.stroke(); ctx.setLineDash([]); }
  // 깊이 정렬: 소품 + 빌런 + 주인공
  const items = propsNear().map(p => ({ y: p.y, draw: () => drawProp(p) }));
  for (const e of G.E) items.push({ y: e.y, draw: () => drawEnemy(e) });
  items.push({ y: P.y, draw: drawPlayer });
  items.sort((a, b) => a.y - b.y); for (const it of items) it.draw();
  // 투사체
  ctx.imageSmoothingEnabled = false;
  for (const b of G.B) {
    const x = sx(b.x), y = sy(b.y);
    if (b.look === 'wave') { const a = Math.atan2(b.vy, b.vx), t = b.age / b.life; ctx.strokeStyle = b.evo ? '#ff9a2a' : '#ffe04a'; ctx.lineWidth = 4 * ZOOM; ctx.globalAlpha = 1 - t * 0.6; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x - Math.cos(a) * k * 9 * ZOOM, y - Math.sin(a) * k * 9 * ZOOM, (12 + k * 5) * ZOOM * (b.evo ? 1.3 : 1), a - 0.8, a + 0.8); ctx.stroke(); } ctx.globalAlpha = 1; continue; }
    if (b.look === 'beam') { const a = Math.atan2(b.vy, b.vx); ctx.strokeStyle = 'rgba(255,59,48,.55)'; ctx.lineWidth = 5 * ZOOM; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - Math.cos(a) * 40 * ZOOM, y - Math.sin(a) * 40 * ZOOM); ctx.stroke(); R(x - 4 * ZOOM, y - 4 * ZOOM, 8 * ZOOM, 8 * ZOOM, '#ff3b30'); R(x - 2 * ZOOM, y - 2 * ZOOM, 4 * ZOOM, 4 * ZOOM, '#fff'); continue; }
    if (b.kind === 'lob') { const t = Math.min(1, b.age / b.life); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(sx(b.sx + (b.tx - b.sx) * t), sy(b.sy + (b.ty - b.sy) * t) + 20 * ZOOM, 18 * ZOOM * t + 6, 6 * ZOOM, 0, 0, Math.PI * 2); ctx.fill(); }
    const s = (b.kind === 'orbit' ? 58 : b.kind === 'lob' ? 52 : b.kind === 'bounce' ? 56 : 42) * ZOOM * (b.evo ? 1.3 : 1);
    const rot = b.kind === 'orbit' ? b.a + Math.PI / 2 : b.kind === 'homing' ? Math.atan2(b.vy, b.vx) : b.kind === 'lob' || b.kind === 'bounce' ? 0 : b.spin;
    if (b.evo) { ctx.globalAlpha = 0.35 + 0.15 * Math.sin(G.t * 12 + b.age * 7); ctx.fillStyle = '#ff9a2a'; ctx.beginPath(); ctx.arc(x, y, s * 0.6, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; } // 진화 무기는 주황 빛(흐림 효과는 무거워서 원으로)
    iconC(b.icon, x, y, s, rot);
  }
  // 휘두르기
  for (const a of G.AURA) { const t = a.life / a.max, x = sx(P.x + a.ox), y = sy(P.y - 30); ctx.save(); ctx.globalAlpha = Math.min(1, t * 1.6); const r = a.r * ZOOM * (1.1 - t * 0.3); const a0 = a.dir > 0 ? -1.1 : Math.PI - 1.1; ctx.strokeStyle = 'rgba(255,179,71,.35)'; ctx.lineWidth = 18 * ZOOM; ctx.beginPath(); ctx.arc(x, y, r, a0, a0 + 2.2); ctx.stroke(); ctx.strokeStyle = a.evo ? '#ff5a2a' : '#ff9a2a'; ctx.lineWidth = 8 * ZOOM; ctx.beginPath(); ctx.arc(x, y, r, a0, a0 + 2.2); ctx.stroke(); iconC(a.icon, x + a.dir * r * 0.55, y - r * 0.2, 60 * ZOOM, a.dir > 0 ? 0.8 - (1 - t) * 1.6 : -0.8 + (1 - t) * 1.6); ctx.restore(); }
  ctx.imageSmoothingEnabled = true;
  if (G.TRAIN) { drawTrain(G.TRAIN); drawPlayer(); } // 직원은 열차 앞에 남는다
  drawFX();
  // 피해 숫자
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const d of G.DN) { const t = d.life / d.max; const fs = Math.round((d.big ? 20 : 15) * ZOOM); ctx.font = fs + 'px DOSSaemmul, monospace'; ctx.globalAlpha = Math.min(1, t * 2); const x = sx(d.x), y = sy(d.y) - (1 - t) * 34 * ZOOM; ctx.fillStyle = '#15131a'; ctx.fillText(d.v, x + 2, y + 2); ctx.fillStyle = d.big ? '#ff9a2a' : '#fff'; ctx.fillText(d.v, x, y); }
  ctx.globalAlpha = 1;
  // 머리 위 막대: 체력(빨강) + 경적(주황 LED)
  const m = A[P.g.spr], bx = sx(P.x), by = sy(P.y) - (m[3] * PXS + 22) * ZOOM, bw = 56 * ZOOM, bh = 7 * ZOOM;
  R(bx - bw / 2 - 2, by - 2, bw + 4, bh + 4, '#15131a'); R(bx - bw / 2, by, bw, bh, '#3a1714'); R(bx - bw / 2, by, bw * Math.max(0, P.hp / P.maxhp), bh, P.hp / P.maxhp > 0.35 ? '#5ad66a' : '#ff3b30');
  const gy = by + bh + 3 * ZOOM, gh = 5 * ZOOM; R(bx - bw / 2 - 2, gy - 2, bw + 4, gh + 4, '#15131a'); R(bx - bw / 2, gy, bw, gh, '#3a2410'); R(bx - bw / 2, gy, bw * P.gas / 100, gh, P.gas >= 99 ? '#fff0a0' : '#ff9a2a');
  if (P.charging) R(bx - bw / 2, gy, bw * P.charge / 100, gh, 'rgba(255,255,255,.85)');
  // 조명·피격·퇴근
  const z = zone(); const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, z.v + '0)'); vg.addColorStop(1, z.v + (G.time > 600 ? '.78)' : '.55)')); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  if (G.flash > 0) { ctx.fillStyle = 'rgba(224,69,58,' + (G.flash * 1.4) + ')'; ctx.fillRect(0, 0, W, H); }
  if (G.dawn > 0) { ctx.fillStyle = 'rgba(255,226,170,' + Math.min(0.8, G.dawn * 0.5) + ')'; ctx.fillRect(0, 0, W, H); }
  drawFly();
}
// 주운 승차권이 위쪽 경험치 줄 끝으로 날아가 꽂힌다(10/10 사장님 "모인 게 화면에 안 보인다")
function drawFly() {
  if (!G.FLY.length) return; const dt = G.phase === 'play' ? G.dtLast || 0.016 : 0; const P = G.P, tx = W * Math.min(1, P.xp / P.need), ty = 6; let hit = 0;
  for (const f of G.FLY) {
    f.t += dt / 0.42; const t = Math.min(1, f.t), e = t * t * (3 - 2 * t);
    const cx = (f.x + tx) / 2 + (f.x < tx ? -60 : 60), cy = Math.min(f.y, ty) - 40; const u = 1 - e;
    const x = u * u * f.x + 2 * u * e * cx + e * e * tx, y = u * u * f.y + 2 * u * e * cy + e * e * ty;
    const s = 1.5 - e * 0.6, w = (f.big ? 16 : 12) * s, h = (f.big ? 10 : 8) * s;
    ctx.save(); ctx.translate(x, y); ctx.rotate(e * 6.3); R(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2, '#1e2128'); R(-w / 2, -h / 2, w, h, f.big ? '#f2c744' : '#0052a4'); R(-w / 2, -h * 0.05, w, Math.max(1, h * 0.18), '#fff'); ctx.restore();
    if (f.t >= 1) { f.dead = true; hit++; }
  }
  G.FLY = G.FLY.filter(f => !f.dead);
  if (hit && G.t - (G.xpHitT || 0) > 0.12) { G.xpHitT = G.t; const b = $('#xpbar'); b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); }
}
function drawFX() {
  for (const f of G.FX) {
    if (f.delay > 0) continue; const t = Math.max(0, f.life / f.max), x = sx(f.x), y = sy(f.y);
    if (f.kind === 'icon') { ctx.imageSmoothingEnabled = false; iconC(f.icon, x, y, 70 * f.sc * ZOOM * (1.4 - t * 0.4), 0, t); ctx.imageSmoothingEnabled = true; }
    else if (f.kind === 'spark') { R(x - 2, y - (1 - t) * 20 * ZOOM, 4 * ZOOM, 4 * ZOOM, t > 0.5 ? '#fff6b0' : '#ff9a2a'); }
    else if (f.kind === 'drop') { ctx.globalAlpha = t; R(x - 2 * ZOOM, y + (1 - t) * 10 * ZOOM, 4 * ZOOM, 4 * ZOOM, '#6fb4ff'); R(x - 1 * ZOOM, y + (1 - t) * 10 * ZOOM, 2 * ZOOM, 2 * ZOOM, '#e0f0ff'); ctx.globalAlpha = 1; }
    else if (f.kind === 'dust') { ctx.globalAlpha = t * 0.7; ctx.fillStyle = '#d8d4c8'; for (let i = 0; i < 6; i++) { const a = i * 1.05; ctx.beginPath(); ctx.arc(x + Math.cos(a) * (1 - t) * 40 * ZOOM, y + Math.sin(a) * (1 - t) * 14 * ZOOM, 8 * ZOOM * t + 2, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1; }
    else if (f.kind === 'burst') { const r = f.r * ZOOM * (1.2 - t * 0.5); ctx.globalAlpha = t * 0.35; ctx.fillStyle = f.evo ? '#ff9a2a' : '#ffe27a'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = Math.min(1, t * 1.5); ctx.strokeStyle = '#fff3c0'; ctx.lineWidth = 3 * ZOOM; ctx.beginPath(); ctx.ellipse(x, y, r * 1.2, r * 0.84, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
    else if (f.kind === 'ink') { // 검거 도장 자국: 빨간 동그라미 + 튄 잉크
      const r = f.r * ZOOM; ctx.globalAlpha = Math.min(1, t * 2) * 0.85; ctx.strokeStyle = '#d12a1e'; ctx.lineWidth = 6 * ZOOM; ctx.beginPath(); ctx.ellipse(x, y, r * 0.8, r * 0.56, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#d12a1e'; for (let i = 0; i < 10; i++) { const a = i * 0.63; const d = r * (0.85 + (i % 3) * 0.12) * (1.3 - t * 0.3); ctx.fillRect(x + Math.cos(a) * d - 3 * ZOOM, y + Math.sin(a) * d * 0.7 - 3 * ZOOM, 6 * ZOOM, 6 * ZOOM); }
      ctx.font = Math.round(r * 0.5) + 'px DOSSaemmul, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(EN ? 'NAB' : '검거', x, y + 2); ctx.globalAlpha = 1; }
    else if (f.kind === 'smack') { const r = f.r * ZOOM; if (!f.done) { ctx.imageSmoothingEnabled = false; iconC(f.icon, x, y - 260 * ZOOM * t, 70 * ZOOM * (f.evo ? 1.4 : 1), 2.4 - t * 3); ctx.imageSmoothingEnabled = true; ctx.strokeStyle = 'rgba(255,224,74,.6)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); } }
    else if (f.kind === 'caught') { const hh = f.h * ZOOM; sprF(f.name, f.f, x, y + hh * 0.5, hh, f.flip, true, t * 0.9); ctx.globalAlpha = t; ctx.imageSmoothingEnabled = false; iconC('o:11', x, y - hh * 0.1 - (1 - t) * 20 * ZOOM, 40 * ZOOM); ctx.imageSmoothingEnabled = true; ctx.globalAlpha = 1; }
    else if (f.kind === 'arrest') { const s = Math.min(1, (1 - t) * 6); const sc = 2.2 - s * 1.2; ctx.save(); ctx.translate(x, y); ctx.rotate(-0.18); ctx.globalAlpha = Math.min(1, t * 2.5); ctx.strokeStyle = '#d12a1e'; ctx.lineWidth = 6 * ZOOM * sc; const bw = 150 * ZOOM * sc, bh = 64 * ZOOM * sc; ctx.strokeRect(-bw / 2, -bh / 2, bw, bh); ctx.fillStyle = '#d12a1e'; ctx.font = Math.round(46 * ZOOM * sc) + 'px DOSSaemmul, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(EN ? 'ARREST' : '검거', 0, 3 * ZOOM); ctx.restore(); ctx.globalAlpha = 1; }
  }
}
// ---------- 흐름 ----------
function show(id, on) { $(id).hidden = !on; }
function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('show'); clearTimeout(toast.tm); toast.tm = setTimeout(() => e.classList.remove('show'), 1400); }
function fmt(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
const unlocked = i => !!(SAVE.unlock & (1 << i));
function buildTitle() {
  const box = $('#guards'); box.innerHTML = '';
  GUARDS.forEach((g, i) => { const d = document.createElement('div'); const locked = !unlocked(i); d.className = 'guard' + (i === G.sel ? ' on' : '') + (locked ? ' lock' : '') + (SAVE.best[i] >= NIGHT ? ' done' : ''); const c = document.createElement('canvas'); c.width = 112; c.height = 136; drawPortrait(c, g.spr, 0); d.appendChild(c); d.onclick = () => { if (locked) { SND.back(); toast(L('locked')); return; } G.sel = i; SND.blip(); buildTitle(); }; box.appendChild(d); });
  const g = GUARDS[G.sel], w = WEAPONS[g.w], best = SAVE.best[G.sel];
  $('#gname').textContent = T2(g.n) + ' · ' + T2(w.n) + (best ? ' · BEST ' + (best >= NIGHT ? L('clear') : fmt(best)) : '');
  $("#gcoin").innerHTML = "<i class=\"coinI\"></i>" + SAVE.coins.toLocaleString();
}
function toTitle() { show('#ending', false); G.phase = 'title'; document.body.classList.remove('playing'); show('#title', true); show('#over', false); show('#pause', false); show('#levelup', false); show('#shop', false); show('#dex', false); if (ready >= 2) buildTitle(); G.titleT = 0; SND.boss(false); }
function startGame() {
  G.phase = 'play'; document.body.classList.add('playing'); show('#title', false); show('#over', false); show('#pause', false);
  G.P = newPlayer(G.sel); G.E = []; G.B = []; G.GEM = []; G.FX = []; G.DN = []; G.AURA = []; G.CLOUD = []; G.TRAIN = null; G.FLY = []; G.kills = 0; G.coins = 0; G.coinShown = -1; document.body.classList.remove('tight'); G.time = 0; G.spawnT = 0.6; G.bossI = 0; G.cam = { x: 0, y: -30 }; G.shake = 0; G.flash = 0; G.dawn = 0; G.run++; G.demonDown = false; G.lastTrain = false; G.endT = 0;
  $('#hKill').textContent = 0; $('#hLv').textContent = 1; $('#hTime').textContent = fmt(NIGHT); $('#xpfill').style.width = '0%'; $('#hSta').textContent = T2(STATIONS[0]);
  SND.boss(false); SND.bgm(true); G.AI = null; G.autoLock = false; syncAuto();
}
function gameOver(cleared) {
  if (G.phase === 'over') return; G.phase = 'over'; SND.duck(true); G.P.charging = false;
  const P = G.P; let title = cleared ? L('clear') : L('over');
  $('#ovTime').textContent = fmt(G.time); $('#ovLv').textContent = P.lv; $('#ovKill').textContent = G.kills; $('#ovSta').textContent = T2(station());
  const prev = SAVE.best[G.sel] || 0; SAVE.best[G.sel] = Math.max(prev, cleared ? NIGHT : Math.floor(Math.min(G.time, NIGHT - 1)));
  let unlockName = '';
  if (cleared) {
    const nx = G.sel + 1; if (nx < NG && !unlocked(nx)) { SAVE.unlock |= (1 << nx); unlockName = T2(GUARDS[nx].n); }
    const before = SAVE.clears || 0; SAVE.clears = before | (1 << G.sel); if (SAVE.clears === (1 << NG) - 1 && before !== SAVE.clears) title = L('theEnd');
    SND.bell(); setTimeout(() => SND.cheer(), 500);
  } else SND.fail();
  $('#ovTitle').textContent = title; $('#over').classList.toggle('win', !!cleared);
  SAVE.coins += G.coins; $('#ovCoin').textContent = '+' + G.coins; save(); $('#ovUnlockRow').hidden = !unlockName; $('#ovUnlock').textContent = unlockName;
  const trueEnd = cleared && dexDone() && !SAVE.trueEnd; if (trueEnd) { SAVE.trueEnd = 1; save(); }
  setTimeout(() => { if (trueEnd) openEnding(); else show('#over', true); SND.bgm(false); }, cleared ? 2600 : 900);
}
// ---------- 상점 ----------
function openShop() {
  G.phase = 'shop'; show('#shop', true); const box = $('#shopList'); box.innerHTML = ''; $('#shopCoin').textContent = SAVE.coins.toLocaleString();
  for (const it of SHOP) {
    const top = it.max || SHOP_MAX, lv = shopLv(it.k), max = lv >= top, cost = max ? 0 : shopCost(it, lv);
    const el = document.createElement('div'); el.className = 'card shoprow' + (max ? ' max' : (SAVE.coins < cost ? ' poor' : ''));
    const ic = document.createElement('canvas'); ic.width = ic.height = 96; drawIcon(ic, it.icon); el.appendChild(ic);
    const t = document.createElement('div'); t.className = 't'; t.innerHTML = '<div class="n"></div><div class="d"></div>'; t.firstChild.textContent = T2(it.n); t.lastChild.textContent = T2(it.d) + (top > 1 ? ' ×' + lv : '');
    const r = document.createElement('div'); r.className = 'lv'; r.innerHTML = top > 1 ? (max ? L('max') : '<i class="coinI"></i>' + cost.toLocaleString()) + '<b>LV ' + lv + '/' + top + '</b>' : max ? L('owned') : '<i class="coinI"></i>' + cost.toLocaleString();
    el.append(t, r);
    el.onclick = () => { if (max) { SND.back(); return; } if (SAVE.coins < cost) { SND.back(); toast(L('coin') + ' ' + cost); return; } SAVE.coins -= cost; SAVE.shop[it.k] = lv + 1; if (it.k === 'auto') SAVE.autoOn = 1; save(); SND.levelup(); openShop(); buildTitle(); syncAuto(); };
    box.appendChild(el);
  }
}
// ---------- 도감 ----------
const DEX_TABS = ['E', 'W', 'I', 'G']; let dexTab = 'E';
function dexItems(tab) {
  if (tab === 'E') return Object.keys(ENEMIES).map(k => ({ spr: ENEMIES[k].spr, f: ENEMIES[k].bird ? 10 : 0, boss: !!ENEMIES[k].boss, name: T2(ENEMIES[k].n), desc: T2(ENEMIES[k].d), ok: !!SAVE.seen['e_' + k] }));
  if (tab === 'W') return Object.keys(WEAPONS).map(k => { const w = WEAPONS[k], evo = !!SAVE.seen['w_' + k + '_evo']; return { icon: w.icon, name: evo ? T2(w.evo) : T2(w.n), desc: T2(WDESC[w.type]) + (evo ? '' : ' · ' + L('evo') + ': ' + T2(w.evo)), ok: !!SAVE.seen['w_' + k], evo }; });
  if (tab === 'I') return Object.keys(PASSIVES).map(k => ({ icon: PASSIVES[k].icon, name: T2(PASSIVES[k].n), desc: T2(PASSIVES[k].d), ok: !!SAVE.seen['i_' + k] }));
  return GUARDS.map((g, i) => ({ spr: g.spr, f: 0, name: T2(g.n), desc: T2(WEAPONS[g.w].n) + (SAVE.best[i] ? ' · BEST ' + (SAVE.best[i] >= NIGHT ? L('clear') : fmt(SAVE.best[i])) : ''), ok: unlocked(i) }));
}
function dexDone() { for (const t of DEX_TABS) if (dexItems(t).some(x => !x.ok)) return false; return true; }
function openDex(tab) {
  G.phase = 'dex'; show('#dex', true); dexTab = tab || dexTab;
  const tabs = $('#dexTabs'); tabs.innerHTML = '';
  for (const t of DEX_TABS) { const b = document.createElement('button'); b.className = 'btn small' + (t === dexTab ? ' on' : ''); b.textContent = L('tab' + t); b.onclick = () => { SND.blip(); openDex(t); }; tabs.appendChild(b); }
  const items = dexItems(dexTab); const grid = $('#dexGrid'); grid.innerHTML = ''; $('#dxInfo').textContent = '';
  let all = 0, got = 0; for (const t of DEX_TABS) { const it = dexItems(t); all += it.length; got += it.filter(x => x.ok).length; }
  $('#dexCount').textContent = got + ' / ' + all; $('#bEnding').hidden = !(got === all && SAVE.trueEnd);
  items.forEach(it => {
    const d = document.createElement('div'); d.className = 'dx' + (it.ok ? '' : ' unk') + (it.evo ? ' evo' : '') + (it.boss ? ' boss' : '');
    const c = document.createElement('canvas'); c.width = c.height = 112; if (it.spr) drawPortrait(c, it.spr, it.f); else drawIcon(c, it.icon); d.appendChild(c);
    const i = document.createElement('i'); i.textContent = it.ok ? it.name : '???'; d.appendChild(i);
    d.onclick = () => { SND.blip(); grid.querySelectorAll('.dx.on').forEach(x => x.classList.remove('on')); d.classList.add('on'); $('#dxInfo').textContent = it.ok ? it.name + ' — ' + it.desc : L('unknown'); };
    grid.appendChild(d);
  });
}
$('#bShop').onclick = () => { SND.unlock(); SND.blip(); openShop(); };
$('#bDex').onclick = () => { SND.unlock(); SND.blip(); openDex(); };
$('#bShopClose').onclick = () => { SND.back(); show('#shop', false); G.phase = 'title'; };
$('#bEnding').onclick = () => { SND.unlock(); SND.blip(); openEnding(); };
$('#bEndHome').onclick = () => { SND.back(); show('#ending', false); toTitle(); };
$('#bDexClose').onclick = () => { SND.back(); show('#dex', false); G.phase = 'title'; };
$('#bStart').onclick = () => { SND.unlock(); SND.blip(); startGame(); };
$('#bRetry').onclick = () => { SND.unlock(); SND.blip(); startGame(); };
$('#bHome').onclick = () => { SND.back(); SND.bgm(false); toTitle(); };
$('#bQuit').onclick = () => { SND.back(); SND.bgm(false); G.paused = false; toTitle(); };
$('#bResume').onclick = () => { SND.blip(); show('#pause', false); G.phase = 'play'; SND.duck(false); };
// 자동 근무: 상점에서 사면 AUTO 단추가 생기고, 켜 두면 손을 뗀 동안 알아서 피하고 줍는다
function syncAuto() { G.auto = hasAuto() && !!SAVE.autoOn && !G.autoLock; document.body.classList.toggle('hasauto', hasAuto()); $('#tAuto').classList.toggle('on', G.auto); }
$('#tAuto').onclick = () => { if (!hasAuto()) return; SND.unlock(); if (G.autoLock && G.phase === 'play') { SND.back(); toast(L('last') + ' · AUTO OFF'); return; } SAVE.autoOn = SAVE.autoOn ? 0 : 1; save(); syncAuto(); SND.blip(); toast('AUTO ' + (G.auto ? 'ON' : 'OFF')); if (!G.auto && G.AI) { G.AI.hold = 0; G.sp = false; } };
syncAuto();
function pause() { if (G.phase !== 'play') return; G.phase = 'pause'; show('#pause', true); SND.blip(); SND.duck(true); G.sp = false; }
$('#tPause').onclick = pause;
$('#tBgm').onclick = () => { SND.unlock(); $('#tBgm').classList.toggle('off', !SND.toggleBgm()); if (G.phase !== 'play' && G.phase !== 'levelup' && G.phase !== 'pause') SND.bgm(false); };
$('#tSfx').onclick = () => { SND.unlock(); $('#tSfx').classList.toggle('off', !SND.toggleSfx()); };
$('#tBgm').classList.toggle('off', !SND.bgmOn); $('#tSfx').classList.toggle('off', !SND.on);
addEventListener('keydown', e => {
  G.keys[e.key] = true; if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault(); if (e.key === ' ' && G.phase === 'play') G.sp = true;
  if (e.key === 'Enter') { if (G.phase === 'title') $('#bStart').click(); else if (G.phase === 'over' && !$('#over').hidden) $('#bRetry').click(); else if (G.phase === 'pause') $('#bResume').click(); }
  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { if (G.phase === 'play') pause(); else if (G.phase === 'pause') $('#bResume').click(); else if (G.phase === 'shop') $('#bShopClose').click(); else if (G.phase === 'dex') $('#bDexClose').click(); }
  if (G.phase === 'levelup' && /^[123]$/.test(e.key)) { const c = $('#cards').children[+e.key - 1]; if (c) c.click(); }
  if (G.phase === 'title' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { let i = G.sel; for (let k = 0; k < NG; k++) { i = (i + (e.key === 'ArrowRight' ? 1 : NG - 1)) % NG; if (unlocked(i)) break; } G.sel = i; buildTitle(); SND.blip(); }
});
addEventListener('keyup', e => { G.keys[e.key] = false; if (e.key === ' ') G.sp = false; });
addEventListener('blur', () => { G.keys = {}; G.pad.x = G.pad.y = 0; G.sp = false; });
const actB = $('#act'); if (actB) { actB.addEventListener('pointerdown', e => { e.preventDefault(); SND.unlock(); G.sp = true; try { actB.setPointerCapture(e.pointerId); } catch (x) {} }); const aEnd = () => { G.sp = false; }; actB.addEventListener('pointerup', aEnd); actB.addEventListener('pointercancel', aEnd); }
// 폰 패드(왼쪽 아래) + 패드 밖 아무 데나 끌어도 움직임
const pad = $('#pad'), knob = $('#knob'); let padId = null;
function padMove(e) { const r = pad.getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); const m = r.width / 2; const l = Math.hypot(dx, dy); if (l > m) { dx = dx / l * m; dy = dy / l * m; } knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; G.pad.x = Math.abs(dx / m) > 0.1 ? dx / m : 0; G.pad.y = Math.abs(dy / m) > 0.1 ? dy / m : 0; }
pad.addEventListener('pointerdown', e => { padId = e.pointerId; pad.setPointerCapture(padId); padMove(e); });
pad.addEventListener('pointermove', e => { if (e.pointerId === padId) padMove(e); });
const padEnd = e => { if (e.pointerId === padId) { padId = null; G.pad.x = G.pad.y = 0; knob.style.transform = ''; } };
pad.addEventListener('pointerup', padEnd); pad.addEventListener('pointercancel', padEnd);
let freeId = null, freeX = 0, freeY = 0;
cv.addEventListener('pointerdown', e => { if (!TOUCH || G.phase !== 'play') return; freeId = e.pointerId; freeX = e.clientX; freeY = e.clientY; cv.setPointerCapture(freeId); });
cv.addEventListener('pointermove', e => { if (e.pointerId !== freeId) return; let dx = e.clientX - freeX, dy = e.clientY - freeY; const m = 60, l = Math.hypot(dx, dy); if (l > m) { dx = dx / l * m; dy = dy / l * m; } G.pad.x = Math.abs(dx / m) > 0.12 ? dx / m : 0; G.pad.y = Math.abs(dy / m) > 0.12 ? dy / m : 0; });
const freeEnd = e => { if (e.pointerId === freeId) { freeId = null; G.pad.x = G.pad.y = 0; } };
cv.addEventListener('pointerup', freeEnd); cv.addEventListener('pointercancel', freeEnd);
// ---------- 타이틀 그림: 승강장에 고른 직원이 서 있고 빌런들이 줄지어 지나간다 ----------
function drawTitle(dt) {
  G.titleT = (G.titleT || 0) + dt;
  ZOOM = Math.max(0.62, Math.min(1, Math.min(W, H * 1.4) / 920));
  G.cam.x = G.titleT * 24; G.cam.y = 0; G.time = 0; drawGround();
  // 직원은 고르는 칸 바로 위에 선다. 위가 좁으면(폰 가로) 왼쪽 아래 구석에, 빌런 줄은 글자 아래로
  const gb = $('#guards').getBoundingClientRect(), lb = $('#logo').getBoundingClientRect(), tz = Math.max(0.7, Math.min(1.3, H / 700));
  const g = GUARDS[G.sel], m = A[g.spr]; let hh = m[3] * PXS * tz * 1.35, gxp = W / 2, feet = gb.top - 10, lane = feet - 20 * tz;
  if (feet - hh < 70) { hh = Math.min(hh, H * 0.5); gxp = Math.max(70, W * 0.12); feet = H - 18; lane = Math.min(H - 40, Math.max(lb.bottom + 70, H * 0.8)); }
  if (!G.tw) { G.tw = []; const ks = Object.keys(ENEMIES).filter(k => !ENEMIES[k].boss); for (let i = 0; i < 8; i++) G.tw.push({ k: ks[i % ks.length], x: W + i * 150 + 60, sp: 46 + (i % 3) * 8, ft: i, lane: i % 2 }); }
  for (const t of G.tw) { t.x -= t.sp * dt * tz; t.ft += dt; if (t.x < -120) { t.x = Math.max(W + 100, Math.max(...G.tw.map(q => q.x)) + 140 + Math.random() * 70); t.k = Object.keys(ENEMIES).filter(k => !ENEMIES[k].boss)[Math.floor(Math.random() * 15)]; } }
  const list = G.tw.slice().sort((a, b) => a.lane - b.lane);
  for (const t of list) { const d = ENEMIES[t.k], mm = A[d.spr], h = mm[3] * PXS * tz * 0.95, y = lane - 26 * tz + t.lane * 30 * tz; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(t.x, y, 20 * tz, 6 * tz, 0, 0, Math.PI * 2); ctx.fill(); sprF(d.spr, (d.bird ? 4 : 8) + (Math.floor(t.ft * 7) % 4), t.x, y - (d.bird ? 12 * tz : 0), h, true); }
  const pose = Math.floor(G.titleT / 1.6) % 3 === 2 ? 3 : 0;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(gxp, feet, 28 * tz, 9 * tz, 0, 0, Math.PI * 2); ctx.fill();
  sprF(g.spr, pose, gxp, feet, hh, false);
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(10,14,30,0)'); vg.addColorStop(1, 'rgba(10,14,30,.6)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}
// ---------- 도감 100% 엔딩: 막차 객차 안, 직원 다섯과 빌런들이 같이 타고 간다 ----------
function openEnding() {
  G.phase = 'ending'; G.endT = 0; show('#over', false); show('#dex', false); show('#title', false); document.body.classList.remove('playing');
  $('#endTitle').textContent = L('theEnd'); $('#endSub').textContent = L('dex100'); show('#ending', true);
  SND.bell(); setTimeout(() => SND.cheer(), 700);
}
function drawEnding(dt) {
  G.endT += dt; const t = G.endT, sway = Math.round(Math.sin(t * 7) * 1.5);
  ctx.save(); ctx.translate(0, sway);
  // 객차 벽·창(밤 도시 불빛이 흐름)·의자·바닥
  R(0, -4, W, H + 8, '#e6e2d6'); const PT = W < H, wy = H * (PT ? 0.13 : 0.14), wh = H * (PT ? 0.14 : 0.26);
  R(0, wy - 8, W, wh + 16, '#9aa1a9');
  const nw = Math.max(2, Math.round(W / 300)), ww = W / nw;
  for (let k = 0; k < nw; k++) {
    const x0 = k * ww + 14, w0 = ww - 28; R(x0, wy, w0, wh, '#141a33');
    ctx.save(); ctx.beginPath(); ctx.rect(x0, wy, w0, wh); ctx.clip();
    for (let i = 0; i < 40; i++) { const h = hash(i, k), x = x0 + ((h * 997 - t * (60 + h * 160)) % w0 + w0) % w0, y = wy + wh * (0.35 + hash(k, i) * 0.6); R(x, y, 3 + h * 4, 3, h > 0.6 ? '#ffd76a' : h > 0.3 ? '#fff1c2' : '#ff9a6a'); }
    R(x0, wy, w0 * 0.25, wh, 'rgba(255,255,255,.06)'); ctx.restore();
  }
  R(0, wy + wh + 8, W, 10, '#0052a4'); R(0, wy + wh + 22, W, 4, '#0052a4');
  const seatY = H * (PT ? 0.42 : 0.6); R(0, seatY - H * 0.05, W, H * 0.07, '#2a4f9a'); R(0, seatY - H * 0.05, W, 6, '#4f7ad0'); R(0, seatY + H * 0.02, W, H * 0.03, '#7f8790');
  R(0, seatY + H * 0.05, W, H, '#b9bcb2'); for (let x = 0; x < W; x += 80) R(x, seatY + H * 0.05, 2, H, '#a7aaa2');
  // 손잡이
  ctx.imageSmoothingEnabled = false; for (let x = 60; x < W; x += 160) iconC('o:6', x, H * 0.07, 110); ctx.imageSmoothingEnabled = true;
  // 빌런 15 + 대악마가 의자에 나란히
  const vs = Object.keys(ENEMIES).filter(k => !ENEMIES[k].boss), row = vs.slice(0, 7).concat(['demon']).concat(vs.slice(7));
  // 폰 세로는 두 줄(의자 줄 + 그 앞에 선 줄)로 나눠 크게
  const lines = PT ? [vs.slice(0, 3).concat(['demon'], vs.slice(3, 7)), vs.slice(7)] : [row], per = Math.max(...lines.map(l => l.length)), sp = W / (per + 0.5), vh = Math.min(H * (PT ? 0.15 : 0.2), sp * 2.1);
  lines.forEach((ln, li) => ln.forEach((k, i) => { const d = ENEMIES[k], m = A[d.spr], h = vh * (k === 'demon' ? 1.15 : 1) * m[3] / 41, x = sp * (i + 0.75), bob = Math.abs(Math.sin(t * 2 + i + li)) * 2; sprF(d.spr, d.bird ? 10 : 0, x, seatY + H * 0.02 + li * vh * 0.95 - bob, h, false); }));
  // 앞줄: 직원 다섯이 손잡이 잡고 서 있음(가끔 손 흔들기)
  const gsp = Math.min(W / 5.5, 220), gh = Math.min(H * (PT ? 0.2 : 0.28), gsp * 1.9), gy = H * 0.85;
  GUARDS.forEach((g, i) => { const x = W / 2 + (i - 2) * gsp, wave = Math.floor(t * 1.2 + i * 0.7) % 4 === 0; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, gy, gh * 0.22, gh * 0.06, 0, 0, Math.PI * 2); ctx.fill(); sprF(g.spr, wave ? 2 : 0, x, gy, gh, false); });
  ctx.restore();
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.8); vg.addColorStop(0, 'rgba(10,14,30,0)'); vg.addColorStop(1, 'rgba(10,14,30,.45)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  if (t < 1.2) { ctx.fillStyle = 'rgba(0,0,0,' + (1 - t / 1.2) + ')'; ctx.fillRect(0, 0, W, H); }
}
// ---------- 루프 ----------
let lastT = 0;
function frame(now) { requestAnimationFrame(frame); tick(now); }
function tick(now) {
  const dt = Math.max(0, Math.min(0.05, (now - lastT) / 1000 || 0.016)); lastT = now; G.t += dt; G.dtLast = dt;
  if (ready < 2) return;
  const inM = G.phase !== 'play'; if (inM !== G._inM) { G._inM = inM; document.body.classList.toggle('inmenu', inM); } // 창이 열리면 패드·경적 단추 숨김
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.imageSmoothingEnabled = true;
  if (G.phase === 'ending') { drawEnding(dt); return; }
  if (G.phase === 'title' || G.phase === 'shop' || G.phase === 'dex') { drawTitle(dt); return; }
  if (G.phase === 'play') {
    if (G.t - (G.fitT || 0) > 1) { G.fitT = G.t; const last = $('#tSfx').getBoundingClientRect(), t0 = $('#hTime').getBoundingClientRect(), c0 = $('#hCoin').getBoundingClientRect(); if (!document.body.classList.contains('tight') && (last.right > innerWidth + 0.5 || c0.top > t0.top + 4)) document.body.classList.add('tight'); }
    if (G.coins !== G.coinShown) { G.coinShown = G.coins; const c = $('#hCoin'); c.textContent = G.coins.toLocaleString(); if (G.t - (G.coinBumpT || 0) > 0.15) { G.coinBumpT = G.t; const b = c.parentNode; b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); } }
    G.time += dt; $('#hTime').textContent = G.time >= NIGHT ? L('last') : fmt(NIGHT - G.time); const st = T2(station()); if ($('#hSta').textContent !== st) $('#hSta').textContent = st;
    const PF = G.prof, q0 = PF ? performance.now() : 0;
    updatePlayer(dt); const q1 = PF ? performance.now() : 0;
    updateWeapons(dt); updateProjectiles(dt); const q2 = PF ? performance.now() : 0; updateEnemies(dt); updateTrain(dt);
    if (PF) { const q3 = performance.now(); PF.pl = Math.max(PF.pl || 0, q1 - q0); PF.wp = Math.max(PF.wp || 0, q2 - q1); PF.en = Math.max(PF.en || 0, q3 - q2); }
    for (const a of G.AURA) { a.life -= dt; if (a.kind === 'slash') { const P = G.P; const cx = P.x + a.ox, cy = P.y - 30; for (const e of G.E) { if (a.hits.has(e) || e.dead) continue; const dx = e.x - cx; if ((a.dir > 0 ? dx > -20 : dx < 20) && dx * dx + (e.y - 20 - cy) ** 2 < a.r * a.r) { a.hits.add(e); hurtEnemy(e, a.dmg, cx, 160); } } } }
    G.AURA = G.AURA.filter(a => a.life > 0);
    for (const f of G.FX) { if (f.delay > 0) { f.delay -= dt; continue; } f.life -= dt; if (f.kind === 'smack' && !f.done && f.life <= 0) { f.done = true; explode(f.x, f.y, f.r, f.dmg, f.evo); } }
    G.FX = G.FX.filter(f => f.life > 0 || f.delay > 0);
    for (const d of G.DN) d.life -= dt; G.DN = G.DN.filter(d => d.life > 0);
    if (G.demonDown) { G.endT += dt; if (G.endT > 1.4 && G.phase === 'play') { G.dawn = 0.01; G.E = []; horn(1, false); gameOver(true); } }
  } else if (G.phase === 'over') { updateTrain(dt); for (const f of G.FX) f.life -= dt; G.FX = G.FX.filter(f => f.life > 0); }
  if (G.phase === 'over' && G.dawn > 0) G.dawn = Math.min(1.6, G.dawn + dt * 0.5);
  G.flash = Math.max(0, G.flash - dt); G.shake = Math.max(0, G.shake - dt);
  const P = G.P; const k = 1 - Math.pow(0.002, dt); G.cam.x += (P.x - G.cam.x) * k; G.cam.y += (P.y - 30 - G.cam.y) * k;
  if (G.shake > 0) { G.cam.x += rnd(-1, 1) * G.shake * 12; G.cam.y += rnd(-1, 1) * G.shake * 12; }
  const d0 = G.prof ? performance.now() : 0; drawWorld(); if (G.prof) G.prof.dr = Math.max(G.prof.dr || 0, performance.now() - d0);
}
requestAnimationFrame(frame);
toTitle();
// 시험용(로컬만): ?auto=1&guard=N&t=초&frames=N&key=d&dbg=1, __vl.tick(n)
const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
const qa = new URLSearchParams(location.search);
window.__vl.tick = (n, ms) => { for (let i = 0; i < (n || 1); i++) tick((lastT || performance.now()) + (ms || 16)); };
window.__vl.start = i => { if (i != null) G.sel = i; startGame(); }; window.__vl.lu = openLevelUp; window.__vl.shop = openShop; window.__vl.dex = openDex; window.__vl.spawn = spawnEnemy; window.__vl.boss = spawnBoss; window.__vl.over = gameOver; window.__vl.horn = horn; window.__vl.ending = openEnding; window.__vl.dexDone = () => dexDone(); window.__vl.WEAPONS = WEAPONS; window.__vl.AUTO_CFG = AUTO_CFG;
if (LOCAL && qa.get('dbg')) window.onerror = (m, src, l, c) => { document.title = 'ERR ' + m + ' @' + l + ':' + c; };
if (LOCAL && qa.get('auto')) { const w = () => { if (ready < 2) return setTimeout(w, 60); SAVE.unlock = 31; G.sel = +(qa.get('guard') || 0); startGame(); if (qa.get('t')) { G.time = +qa.get('t'); G.bossI = BOSS_AT.filter(b => b[0] < G.time).length; } const n = +qa.get('frames') || 0; if (qa.get('key')) G.keys[qa.get('key')] = true; for (let i = 0; i < n; i++) tick((lastT || performance.now()) + 16); if (qa.get('dbg')) document.title = JSON.stringify({ kills: G.kills, lv: G.P.lv, E: G.E.length, B: G.B.length, hp: Math.round(G.P.hp), phase: G.phase, w: G.P.weapons.map(w => w.k + w.lv) }); }; w(); }
})();
