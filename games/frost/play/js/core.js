// core.js — 공용 상태·수학·저장·잡음
(function () {
  const T = {
    scene: null, camera: null, renderer: null,
    dt: 0, time: 0, paused: true, mode: 'load',   // load | title | play | over
    save: 'fernflower',
    sfx: true,
    lang: (location.search.match(/[?&]lang=(en|ru)/) || [0, 'ko'])[1],

    // 진행
    coins: 0,
    basket: [],          // 들고 있는 버섯 종류 id 목록
    got: {},             // 모으기 기록: 'm3' 'f5' 'n2' 'b7' → true
    bison: {},           // 들소 번호 → 먹인 횟수 (ride.js, 3이면 친구 = got 'b'+i)
    tame: {},            // 길들인(로데오 버틴) 들소 번호 → true
    shop: {},            // 산 물건 id → true
    fbag: {},            // 들고 있는 꽃 종류 id → 개수
    items: {},           // 들고 있는 물·장작·꿀·블루베리
    quests: {},          // 들어준 부탁 번호 → true
    places: {},          // 찾은 명소 번호 → true
    met: false,          // 할머니를 만났나
    bag: null,           // 바구니 { held, x, z } (feel.js)
    fish: {},            // 잡은 물고기 종류 id → 마리 (fishing.js)
    did: {},             // 해낸 놀이 fire·fern·fish·castle (like.js)
    liked: {},           // 알레샤가 호감을 보인 놀이
    story: 0,            // 1 할머니 옛이야기 차례 · 2 들음
    love: 0,             // 알레샤 러브스토리: 0~1 해낸 일마다 한 줄씩 · 2 쿠팔라의 밤 약속 · 3 그날 밤 손을 잡음 (quests.js)
    loved: {},           // 알레샤가 갚은 일 id → true
    mik: {},             // 미하스가 상을 준 들소 번호 → true
    tool: null, rest: {}, stow: {},   // 손에 든 도구·땅에 놓인 도구·가방에 넣은 도구 (tools.js)
    sold: 0, playT: 0,
    clock: 7.2,          // 게임 속 시각(시)
    ended: false, kupala: 0,   // 0 아직 · 1 모닥불로 · 2 고사리꽃 찾기 · 3 끝
  };

  const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const damp = (a, b, rate, dt) => b + (a - b) * Math.exp(-rate * dt);
  const TAU = Math.PI * 2;
  function angDiff(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
  function smoothstep(a, b, x) { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function mulberry(seed) {
    let t = seed >>> 0;
    return function () {
      t = (t + 0x6D2B79F5) >>> 0;
      let x = Math.imul(t ^ (t >>> 15), 1 | t);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ── 값 잡음 ──
  const P = new Uint8Array(512);
  (function () {
    const r = mulberry(1991);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) { const j = (r() * (i + 1)) | 0; const t = p[i]; p[i] = p[j]; p[j] = t; }
    for (let i = 0; i < 512; i++) P[i] = p[i & 255];
  })();
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  function grad(h, x, y) { switch (h & 3) { case 0: return x + y; case 1: return -x + y; case 2: return x - y; default: return -x - y; } }
  function n2(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y);
    const a = P[X] + Y, b = P[X + 1] + Y;
    return lerp(lerp(grad(P[a], x, y), grad(P[b], x - 1, y), u),
      lerp(grad(P[a + 1], x, y - 1), grad(P[b + 1], x - 1, y - 1), u), v);
  }
  function fbm(x, y, oct) {
    let s = 0, a = 0.5, f = 1;
    for (let i = 0; i < (oct || 4); i++) { s += a * n2(x * f, y * f); a *= 0.5; f *= 2; }
    return s;
  }

  function save() {
    try {
      localStorage.setItem(T.save + '.prog', JSON.stringify({
        coins: T.coins, basket: T.basket, got: T.got, shop: T.shop, sold: T.sold, fbag: T.fbag, items: T.items, q9: T.quests, dishes: T.dishes, cooked: T.cooked, isl: T.isl, hunted: T.hunted, kills: T.kills, map: 3, fish: T.fish, did: T.did, liked: T.liked, love: T.love, loved: T.loved, mik: T.mik, tool: T.tool, rest: T.rest, stow: T.stow, places: T.places, met: T.met, bag: T.bag, bison: T.bison, tame: T.tame,
        t: T.playT | 0, clock: T.clock, ended: T.ended, kupala: T.kupala,
        pos: window.PL ? [+PL.pos.x.toFixed(1), +PL.pos.y.toFixed(1), +PL.pos.z.toFixed(1), +PL.yaw.toFixed(2)] : null,
      }));
    } catch (e) { }
  }
  function loadSave() {
    try {
      const s = JSON.parse(localStorage.getItem(T.save + '.prog') || 'null');
      localStorage.removeItem(T.save + '.photos');   // 사진기 뺀 뒤 옛 사진 지움 (2026-09-18)
      return s;
    } catch (e) { return null; }
  }
  function wipe() { try { localStorage.removeItem(T.save + '.prog'); localStorage.removeItem(T.save + '.photos'); } catch (e) { } }

  // 한·영 낱말
  function L(ko, en) { return T.lang === 'ko' ? ko : (T.lang === 'ru' ? ((window.RU && RU[ko]) || en) : en); }

  window.T = T;
  window.U = { clamp, lerp, damp, TAU, angDiff, smoothstep, mulberry, save, loadSave, wipe, L };
  window.N = { n2, fbm };
})();
