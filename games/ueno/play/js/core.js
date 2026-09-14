// core.js — 공용 상태·수학 도우미
(function () {
  const T = {
    scene: null, camera: null, renderer: null,
    dt: 0, time: 0, paused: true, mode: 'load',   // load | title | play | over | clear
    save: 'ueno',
    sfx: true, bgm: true,
    coins: 0,
    taken: {},          // 먹은 구역 id → true
    slow: 1, slowT: 0,  // 느린 화면(KO 순간)
    stopT: 0,           // 타격 멈춤
  };

  const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const damp = (a, b, rate, dt) => b + (a - b) * Math.exp(-rate * dt);
  const TAU = Math.PI * 2;
  function angDiff(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
  function angTo(a, b, step) { const d = angDiff(a, b); return a + clamp(d, -step, step); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function mulberry(seed) {
    let t = seed >>> 0;
    return function () {
      t = (t + 0x6D2B79F5) >>> 0;
      let x = Math.imul(t ^ (t >>> 15), 1 | t);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function save() {
    try { localStorage.setItem(T.save + '.prog', JSON.stringify({ coins: T.coins, taken: T.taken, seen: T.seen || {}, puz: T.puz || {}, cans: T.cans || 0, seeds: T.seeds || 0, bones: T.bones || 0 })); } catch (e) { }
  }
  function loadSave() {
    try { return JSON.parse(localStorage.getItem(T.save + '.prog') || 'null'); } catch (e) { return null; }
  }
  function wipe() { try { localStorage.removeItem(T.save + '.prog'); } catch (e) { } }

  window.T = T;
  window.U = { clamp, lerp, damp, TAU, angDiff, angTo, rand, pick, mulberry, save, loadSave, wipe };
})();
