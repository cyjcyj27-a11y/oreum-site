// joy.js — 쾌락 요소: 구역 등급·기록(합격·칭찬·성취), 숨은 고양이(발견·여행), 딸기우유 떨굼(해소), GAME OVER 남은 체력(아쉬움)
(function () {
  const $ = id => document.getElementById(id);
  const J = { cats: [], found: {}, milk: [], st: null };
  const CAT_N = 12;
  const RANKS = ['C', 'B', 'A', 'S'];
  const _v = new THREE.Vector3();
  let scene;

  function load(key, def) { try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v == null ? def : v; } catch (e) { return def; } }
  function store(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { } }

  function init(sc) {
    scene = sc;
    // 밥 준 고양이만 센다. 예전(닿기만 하면 모이던) 기록 ueno.cats 는 쓰지 않는다
    J.found = load('ueno.catsFed', {});
    J.best = load('ueno.best', {});
    J.stamped = load('ueno.stamps', {});
    J.charmGot = load('ueno.charms', {});
    J.trashGot = load('ueno.trash', {});
    placeStamps();
    placeCharms();
    placeTrash();
    placeCats();
  }

  // 막히지 않은 가까운 빈자리 (싸움 구역·노란 띠 밖)
  function freeSpot(x0, z0, r, needLand) {
    const C = PARK.C;
    for (let d = 0; d < 8; d += 0.5) for (let i = 0; i < (d ? 16 : 1); i++) {
      const x = x0 + Math.cos(i / 16 * U.TAU) * d, z = z0 + Math.sin(i / 16 * U.TAU) * d;
      if (needLand !== false && PARK.blocked(x, z, r)) continue;
      if (C.circles.some(c => Math.hypot(c.x - x, c.z - z) < c.r + r)) continue;
      if (C.boxes.some(b => { const dx = x - b.x, dz = z - b.z; return Math.abs(dx * b.c - dz * b.s) < b.hw + r && Math.abs(dx * b.s + dz * b.c) < b.hd + r; })) continue;
      if (DATA.ZONES.some(zn => Math.hypot(zn.x - x, zn.z - z) < zn.r + 2.5)) continue;
      return { x, z };
    }
    return { x: x0, z: z0 };
  }
  // done = 이미 찍은 도장대: 붉은 도장이 찍힌 모양 + ✓ (흐리게 하면 고장 난 것처럼 보였다)
  function iconTex(sym, ring, done) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
    g.fillStyle = done ? '#ffe3e3' : '#ffffff'; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill();
    g.lineWidth = done ? 10 : 7; g.strokeStyle = ring || '#d8262a'; g.stroke();
    g.font = '70px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(sym, 64, 70);
    if (done) {
      g.fillStyle = '#d8262a'; g.beginPath(); g.arc(100, 100, 24, 0, 7); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(89, 101); g.lineTo(97, 109); g.lineTo(112, 92); g.stroke();
    }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function iconSprite(sym, size, ring) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTex(sym, ring), depthWrite: false, transparent: true }));
    s.scale.setScalar(size); return s;
  }

  // ── 스탬프 랠리: 명소마다 도장대. 닿으면 찍힌다 ─────────
  const STAMPS = [
    { id: 'gate', icon: '🌸', x: 24, z: 106 },
    { id: 'saigo', icon: '🗿', x: 38, z: 87 },
    { id: 'benten', icon: '🛕', x: -58, z: 39 },
    { id: 'toshogu', icon: '⛩️', x: -62, z: -19 },
    { id: 'zoo', icon: '🐼', x: -8, z: -64.5 },
    { id: 'pagoda', icon: '🏯', x: -38, z: -84 },
    { id: 'museum', icon: '🏛️', x: 11, z: -84 },
    { id: 'tree', icon: '🗼', x: 71, z: 10 },
    // 9/14 12개로
    { id: 'dock', icon: '🦆', x: -36, z: 72 },
    { id: 'stall', icon: '🏮', x: 41, z: 60 },
    { id: 'fount', icon: '⛲', x: 31, z: -17 },
    { id: 'frog', icon: '🐸', x: -102, z: 44 },
  ];
  J.stamps = [];
  function placeStamps() {
    const red = new THREE.MeshStandardMaterial({ color: 0xb8352a, roughness: 0.7 }), wood = new THREE.MeshStandardMaterial({ color: 0x6b4a32, roughness: 0.9 });
    const ink = new THREE.MeshStandardMaterial({ color: 0xd8262a, roughness: 0.5 });
    const box = new THREE.BoxGeometry(1, 1, 1), cyl = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
    for (const s of STAMPS) {
      const p = freeSpot(s.x, s.z, 0.9);
      const g = new THREE.Group(); g.position.set(p.x, PARK.groundY(p.x, p.z), p.z); scene.add(g);
      const add = (geo, m, x, y, z, sx, sy, sz) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; g.add(o); return o; };
      add(box, wood, 0, 0.5, 0, 0.9, 1.0, 0.6);
      add(box, red, 0, 1.05, 0, 1.1, 0.1, 0.8);
      add(cyl, ink, 0, 1.2, 0, 0.32, 0.2, 0.32);
      add(cyl, wood, 0, 1.42, 0, 0.1, 0.3, 0.1);
      const spr = iconSprite(s.icon, 1.2); spr.position.set(0, 2.5, 0); g.add(spr);
      PARK.C.circles.push({ x: p.x, z: p.z, r: 0.55 });
      J.stamps.push({ ...s, x: p.x, z: p.z, g, spr, got: !!J.stamped[s.id] });
    }
    J.stamps.forEach(paintStamp);
  }
  function paintStamp(s) {
    if (s.got && !s.doneTex) { s.doneTex = iconTex(s.icon, '#d8262a', true); s.spr.material.map = s.doneTex; s.spr.material.needsUpdate = true; }
  }
  function stampsUpdate(dt) {
    const f = PL.f; if (!f || T.mode !== 'play' || ZONE.active) return;
    for (const s of J.stamps) {
      s.spr.position.y = 2.5 + Math.sin(T.time * 2 + s.x) * 0.12;
      const near = Math.hypot(f.pos.x - s.x, f.pos.z - s.z) < 2.2;
      // 이미 찍은 도장대에 다시 오면 카드만 보여 준다
      if (s.got) { if (near && !s.near) { showCard(null); AUD.sfx('page'); } s.near = near; continue; }
      if (!near) continue;
      s.near = true;
      s.got = true; J.stamped[s.id] = 1; store('ueno.stamps', J.stamped); paintStamp(s);
      AUD.sfx('stamp');
      FX.coins(new THREE.Vector3(s.x, 0, s.z), 2, 5);   // 🪙10
      showCard(s.id);
      const n = J.stamps.filter(q => q.got).length;
      if (n === J.stamps.length) setTimeout(() => { FX.banner('🔖 ' + n + '/' + n, 2.2); AUD.sfx('clear'); }, 1500);
      ZONE.missionDone();
    }
  }
  // 도장 카드: 6칸 두 줄(12칸), 방금 찍은 칸이 쾅
  let cardT = 0;
  function showCard(newId) {
    const el = $('stampCard');
    el.innerHTML = J.stamps.map(s => '<span class="sc' + (s.got ? ' got' : '') + (s.id === newId ? ' new' : '') + '">' + s.icon + '</span>').join('');
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(cardT); cardT = setTimeout(() => el.classList.remove('show'), 2600);
  }

  // ── 행운 부적: 연못 연잎 위(오리배로만) · 섬 · 건물 뒤 · 공원 구석 ─────────
  const CHARMS = [
    { id: 'lotus1', x: -80, z: 62, water: true },
    { id: 'lotus2', x: -50, z: 28, water: true },
    { id: 'lotus3', x: -88, z: 30, water: true },
    { id: 'island', x: -71, z: 46 },
    { id: 'museum', x: 40, z: -113 },
    { id: 'shrine', x: -85, z: -11 },
    { id: 'corner', x: -108, z: -104 },
    { id: 'ne', x: 72, z: 112 },
    // 9/14 12개로
    { id: 'pagoda', x: -60, z: -102 },
    { id: 'saigo', x: 49, z: 77 },
    { id: 'east', x: 72, z: -66 },
    { id: 'west', x: -110, z: 80 },
  ];
  J.charms = [];
  let charmTex = null;
  function placeCharms() {
    if (!charmTex) {
      const cv = document.createElement('canvas'); cv.width = 96; cv.height = 128; const g = cv.getContext('2d');
      g.fillStyle = '#d8262a'; g.strokeStyle = '#7a1010'; g.lineWidth = 5;
      g.beginPath(); g.moveTo(18, 40); g.lineTo(48, 26); g.lineTo(78, 40); g.lineTo(78, 118); g.lineTo(18, 118); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = '#f2c230'; g.lineWidth = 4; g.beginPath(); g.moveTo(48, 26); g.lineTo(48, 6); g.stroke();
      g.fillStyle = '#f2c230'; g.beginPath(); g.arc(48, 8, 6, 0, 7); g.fill();
      g.fillStyle = '#fff2c0'; g.fillRect(30, 56, 36, 46);
      g.fillStyle = '#d8262a'; g.font = 'bold 30px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('福', 48, 80);
      charmTex = new THREE.CanvasTexture(cv); charmTex.colorSpace = THREE.SRGBColorSpace;
    }
    const leaf = new THREE.MeshStandardMaterial({ color: 0x5a9a44, side: THREE.DoubleSide, roughness: 0.8 });
    for (const c of CHARMS) {
      const p = c.water ? { x: c.x, z: c.z } : freeSpot(c.x, c.z, 0.6);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: charmTex, transparent: true, depthWrite: false }));
      s.scale.set(0.6, 0.8, 1); scene.add(s);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffd060, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.7 }));
      glow.scale.setScalar(1.8); scene.add(glow);
      if (c.water) { const l = new THREE.Mesh(new THREE.CircleGeometry(1.1, 12), leaf); l.rotation.x = -Math.PI / 2; l.position.set(p.x, 0.2, p.z); scene.add(l); }
      const ch = { ...c, x: p.x, z: p.z, s, glow, got: !!J.charmGot[c.id] };
      s.visible = glow.visible = !ch.got;
      J.charms.push(ch);
    }
  }
  let _glowT = null;
  function glowTex() {
    if (_glowT) return _glowT;
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(255,240,180,1)'); gr.addColorStop(1, 'rgba(255,200,80,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    _glowT = new THREE.CanvasTexture(cv); return _glowT;
  }
  function charmsUpdate(dt) {
    const f = PL.f; if (!f) return;
    for (const c of J.charms) {
      if (c.got) continue;
      const y = (c.water ? 0.75 : 0.9) + Math.sin(T.time * 2.4 + c.x) * 0.12;
      c.s.position.set(c.x, y, c.z); c.glow.position.set(c.x, y, c.z);
      c.glow.material.opacity = 0.45 + Math.sin(T.time * 4 + c.z) * 0.25;
      if (T.mode !== 'play' || ZONE.active || Math.hypot(f.pos.x - c.x, f.pos.z - c.z) > (c.water ? 2.6 : 1.6)) continue;
      c.got = true; J.charmGot[c.id] = 1; store('ueno.charms', J.charmGot);
      c.s.visible = c.glow.visible = false;
      AUD.sfx('charm');
      FX.coins(new THREE.Vector3(c.x, 0, c.z), 2, 5);   // 🪙10
      const n = J.charms.filter(q => q.got).length;
      FX.praise('🧧 ' + n + '/' + J.charms.length);
      if (n === J.charms.length) setTimeout(() => { FX.banner('🧧 ' + n + '/' + n, 2.2); AUD.sfx('clear'); }, 900);
      ZONE.missionDone();
    }
  }

  // ── 쓰레기 줍기: 포장마차 옆 4곳 + 공원 여기저기 8곳 = 12. 닿으면 줍고 🪙10 (새 자리는 끝에 붙여 옛 기록 t0~t9 유지) ─────────
  const TRASH_SPOTS = [[10, 80], [-30, 62], [-97, 12], [50, -62], [-6, -80], [63, 45], [-62, -40], [-100, -62]];
  J.trash = [];
  function placeTrash() {
    const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8, flatShading: true }, o || {}));
    // 종이는 누런 신문지 빛 — 흰 꽃잎과 헷갈리지 않게
    const white = M(0xd9d2b8), red = M(0xd8262a, { metalness: 0.4, roughness: 0.4 }), silver = M(0xc8ccd0, { metalness: 0.6, roughness: 0.35 });
    const clear = M(0xbfe6f2, { transparent: true, opacity: 0.6, roughness: 0.2 }), blue = M(0x2f7fd8), bag = M(0xf2a33a), cup = M(0xfafafa);
    const kinds = [
      g => { const o = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), white); o.position.y = 0.14; o.scale.set(1, 0.85, 1.1); g.add(o); },                         // 구긴 종이
      g => { const o = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.24, 12), red); o.rotation.z = Math.PI / 2; o.position.y = 0.07; g.add(o);
             const t = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 12), silver); t.rotation.z = Math.PI / 2; t.position.set(0.12, 0.07, 0); g.add(t); }, // 빈 캔
      g => { const o = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.34, 10), clear); o.rotation.z = Math.PI / 2; o.position.y = 0.08; g.add(o);
             const c = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 8), blue); c.rotation.z = Math.PI / 2; c.position.set(0.2, 0.08, 0); g.add(c); }, // 페트병
      g => { const o = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.22), bag); o.position.y = 0.03; o.rotation.set(0.1, 0, -0.08); g.add(o); },                   // 과자 봉지
      g => { const o = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.055, 0.18, 12, 1, true), cup); o.rotation.z = Math.PI / 2 + 0.2; o.position.y = 0.08; g.add(o); }, // 종이컵
    ];
    const spots = PARK.C.stalls.map(s => ({ x: s.x + Math.cos(s.a) * 2.2, z: s.z - Math.sin(s.a) * 2.2 })).concat(TRASH_SPOTS.map(([x, z]) => ({ x, z })));
    spots.forEach((s0, i) => {
      const p = freeSpot(s0.x, s0.z, 0.5);
      const g = new THREE.Group(); g.position.set(p.x, PARK.groundY(p.x, p.z), p.z); g.rotation.y = i * 1.3;
      g.scale.setScalar(1.7);   // 떨어진 꽃잎에 묻히지 않게 조금 크게
      kinds[i % kinds.length](g);
      g.traverse(o => { if (o.isMesh) o.castShadow = true; });
      scene.add(g);
      const id = 't' + i, got = !!J.trashGot[id];
      g.visible = !got;
      J.trash.push({ id, x: p.x, z: p.z, g, got });
    });
  }
  function trashUpdate() {
    const f = PL.f; if (!f || T.mode !== 'play' || ZONE.active || PL.ride) return;
    for (const t of J.trash) {
      if (t.got || Math.hypot(f.pos.x - t.x, f.pos.z - t.z) > 1.3) continue;
      t.got = true; J.trashGot[t.id] = 1; store('ueno.trash', J.trashGot);
      t.g.visible = false;
      AUD.sfx('trash');
      FX.coins(new THREE.Vector3(t.x, 0, t.z), 2, 5);   // 🪙10
      const n = J.trash.filter(q => q.got).length;
      FX.praise('🗑 ' + n + '/' + J.trash.length);
      if (n === J.trash.length) setTimeout(() => { FX.banner('🗑 ' + n + '/' + n, 2.2); AUD.sfx('clear'); }, 900);
      ZONE.missionDone();
    }
  }

  // 큰 지도 옆 모음판
  function collectionHTML() {
    const row = (items) => '<div class="crow">' + items.map(([sym, got]) => '<span class="ci' + (got ? ' got' : '') + '">' + sym + '</span>').join('') + '</div>';
    return row(J.cats.map(c => ['🐱', c.found]))
      + row(J.stamps.map(s => [s.icon, s.got]))
      + row(J.charms.map(c => ['🧧', c.got]))
      + row(J.trash.map(t => ['🗑', t.got]))
      + (window.PETS ? row(PETS.pups.map(p => ['🐶', p.state === 'home' || p.state === 'reunite'])) + row(PETS.flocks.map(f => ['🕊', f.fed])) : '');
  }

  // ── 숨은 고양이 ─────────────────────────────
  // 벚나무 밑·건물 뒤처럼 길에서 조금 벗어난 곳. 싸움 구역·출발점은 피한다
  function placeCats() {
    const rnd = U.mulberry(20260913);
    const C = PARK.C, picks = [];
    const clear = (x, z) => !PARK.blocked(x, z, 0.8)
      && !C.circles.some(c => Math.hypot(c.x - x, c.z - z) < c.r + 0.7)
      && !C.boxes.some(b => { const dx = x - b.x, dz = z - b.z; return Math.abs(dx * b.c - dz * b.s) < b.hw + 0.7 && Math.abs(dx * b.s + dz * b.c) < b.hd + 0.7; })
      && !DATA.ZONES.some(zn => Math.hypot(zn.x - x, zn.z - z) < zn.r + 3)
      && Math.hypot(PARK.start.x - x, PARK.start.z - z) > 14;
    for (let pass = 0; pass < 3 && picks.length < CAT_N; pass++) {
      const gap = [26, 18, 12][pass];
      for (let i = 0; i < 6000 && picks.length < CAT_N; i++) {
        const x = U.lerp(PARK.X0 + 8, PARK.X1 - 8, rnd()), z = U.lerp(PARK.Z0 + 8, PARK.Z1 - 6, rnd());
        if (!clear(x, z) || picks.some(p => Math.hypot(p.x - x, p.z - z) < gap)) continue;
        // 나무 줄기 옆일수록 좋다 (숨어 있는 느낌)
        const tree = C.circles.some(c => c.r > 0.25 && Math.hypot(c.x - x, c.z - z) < c.r + 2.2);
        if (!tree && pass === 0 && rnd() < 0.85) continue;
        picks.push({ x, z });
      }
    }
    const COATS = [[0xe8a050, 0xf6e6cc], [0x2a2a2e, 0x2a2a2e], [0xf2efe8, 0xf2efe8], [0x8a8a90, 0xd8d8dc], [0xf2efe8, 0xe8a050], [0x6b5040, 0xc8a888]];
    picks.forEach((p, i) => J.cats.push(makeCat(i, p.x, p.z, COATS[i % COATS.length], rnd() * U.TAU)));
  }

  function makeCat(id, x, z, coat, yaw) {
    const g = new THREE.Group();
    const m1 = new THREE.MeshStandardMaterial({ color: coat[0], roughness: 0.9, flatShading: true });
    const m2 = new THREE.MeshStandardMaterial({ color: coat[1], roughness: 0.9, flatShading: true });
    const eyeM = new THREE.MeshBasicMaterial({ color: 0x1b1b1f });
    const pinkM = new THREE.MeshBasicMaterial({ color: 0xff8fa8 });
    const sph = new THREE.SphereGeometry(1, 10, 8);
    const add = (geo, mat, px, py, pz, sx, sy, sz, parent) => { const o = new THREE.Mesh(geo, mat); o.position.set(px, py, pz); o.scale.set(sx, sy, sz); o.castShadow = true; (parent || g).add(o); return o; };
    const body = add(sph, m1, 0, 0.19, 0, 0.17, 0.18, 0.27);
    add(sph, m2, 0, 0.15, 0.1, 0.13, 0.12, 0.16);                         // 가슴
    const head = new THREE.Group(); head.position.set(0, 0.36, 0.2); g.add(head);
    add(sph, m1, 0, 0, 0, 0.13, 0.115, 0.12, head);
    add(sph, m2, 0, -0.035, 0.08, 0.07, 0.05, 0.05, head);                 // 주둥이
    const ear = new THREE.ConeGeometry(0.05, 0.1, 4);
    for (const s of [-1, 1]) { const e = add(ear, m1, s * 0.07, 0.11, -0.01, 1, 1, 1, head); e.rotation.z = -s * 0.25; }
    const eyes = [];
    for (const s of [-1, 1]) eyes.push(add(sph, eyeM, s * 0.05, 0.02, 0.105, 0.018, 0.024, 0.01, head));
    add(sph, pinkM, 0, -0.02, 0.13, 0.014, 0.01, 0.008, head);             // 코
    const tail = new THREE.Group(); tail.position.set(0, 0.12, -0.24); g.add(tail);
    const tseg = new THREE.CylinderGeometry(0.025, 0.035, 0.3, 6);
    const t1 = add(tseg, m1, 0, 0.12, -0.05, 1, 1, 1, tail); t1.rotation.x = -0.5;
    const t2 = add(tseg, m1, 0, 0.36, -0.1, 0.9, 0.9, 0.9, tail); t2.rotation.x = 0.2;
    g.position.set(x, PARK.groundY(x, z), z); g.rotation.y = yaw;
    scene.add(g);
    const cat = { id, x, z, g, head, tail, body, eyes, yaw, ph: Math.random() * 6, found: !!J.found[id] };
    if (cat.found) { curl(cat); putBowl(cat, false); }
    return cat;
  }
  // 찾은 고양이는 식빵 자세로 눈을 감는다
  function curl(c) { c.body.scale.y = 0.13; c.body.position.y = 0.14; c.head.position.y = 0.26; for (const e of c.eyes) e.scale.y = 0.004; c.tail.rotation.y = 1.3; c.tail.position.y = 0.05; }

  function catsUpdate(dt) {
    const f = PL.f; if (!f) return;
    for (const c of J.cats) {
      const d = Math.hypot(f.pos.x - c.x, f.pos.z - c.z);
      if (d > 40) continue;
      c.ph += dt;
      c.tail.rotation.z = Math.sin(c.ph * (c.found ? 1.2 : 3)) * (c.found ? 0.1 : 0.45);
      if (c.eatT > 0) {
        // 냠냠: 그릇에 고개를 박았다 들었다
        c.eatT -= dt;
        c.head.rotation.x = 0.55 + Math.sin(c.eatT * 14) * 0.18;
        c.head.rotation.y = U.damp(c.head.rotation.y, 0, 8, dt);
        if ((c.crunch = (c.crunch || 0) - dt) <= 0) { c.crunch = 0.38; AUD.sfx('crunch'); }
        if (c.eatT <= 0) { c.head.rotation.x = 0; find(c); }
        continue;
      }
      if (!c.found && d < 7) {
        // 고개를 돌려 본다 · 배고프면 야옹
        const want = U.angDiff(c.yaw, Math.atan2(f.pos.x - c.x, f.pos.z - c.z));
        c.head.rotation.y = U.damp(c.head.rotation.y, U.clamp(want, -1.1, 1.1), 6, dt);
        if (T.mode === 'play' && (c.meowT = (c.meowT || 0) - dt) <= 0) { c.meowT = 4 + Math.random() * 2.5; AUD.sfx('meow', 0.6); c.bubbleT = 2.2; }
      } else if (!c.found) c.meowT = Math.min(c.meowT || 0, 0.6);
    }
    bubbles(dt);
  }

  // 배고픈 고양이 머리 위 말풍선 "냐옹~ 밥줘!"
  function bubbles(dt) {
    const cam = T.camera, W = innerWidth, H = innerHeight, layer = $('fxl');
    for (const c of J.cats) {
      const on = c.bubbleT > 0 && !c.found && !(c.eatT > 0) && T.mode === 'play' && !T.paused;
      if (c.bubbleT > 0) c.bubbleT -= dt;
      if (!on) { if (c.bub) c.bub.style.display = 'none'; continue; }
      if (!c.bub) { c.bub = document.createElement('div'); c.bub.className = 'bubble'; c.bub.textContent = window.L ? L('냐옹~ 밥줘!') : '냐옹~ 밥줘!'; layer.appendChild(c.bub); }
      _v.set(c.x, 0.95, c.z).project(cam);
      if (_v.z > 1 || Math.abs(_v.x) > 1.2 || Math.abs(_v.y) > 1.2) { c.bub.style.display = 'none'; continue; }
      const pop = Math.min(1, (2.2 - c.bubbleT) * 8), fade = Math.min(1, c.bubbleT * 3);
      c.bub.style.display = '';
      c.bub.style.opacity = fade;
      c.bub.style.transform = 'translate(' + ((_v.x * 0.5 + 0.5) * W) + 'px,' + ((-_v.y * 0.5 + 0.5) * H) + 'px) translate(-50%,-100%) scale(' + (0.6 + pop * 0.4) + ')';
    }
  }

  // ── 고양이 밥: 캔은 자판기에서 산다(🪙10 에 1개). 처음엔 0개 — 싸움·퍼즐·스탬프·부적으로 번 코인으로 산다
  //    개수는 T.cans (진행 저장과 함께, 새로 시작하면 0)
  let bowlGeo = null;
  // 고양이 앞 밥그릇. 빈 그릇은 계속 남아 "밥 준 고양이"라는 표시가 된다 (9/14 사장님 — 불러온 뒤에도 놓아 둔다)
  function putBowl(c, full) {
    if (!bowlGeo) bowlGeo = new THREE.CylinderGeometry(0.16, 0.12, 0.08, 14);
    const bowl = new THREE.Group();
    const b = new THREE.Mesh(bowlGeo, new THREE.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 0.6 }));
    b.position.y = 0.04; b.castShadow = true; bowl.add(b);
    const food = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.03, 14), new THREE.MeshStandardMaterial({ color: 0xb8704a, roughness: 1 }));
    food.position.y = 0.085; food.visible = !!full; bowl.add(food);
    bowl.position.set(c.x + Math.sin(c.yaw) * 0.52, PARK.groundY(c.x, c.z), c.z + Math.cos(c.yaw) * 0.52);
    scene.add(bowl); c.bowl = bowl; c.food = food;
  }
  function feed(c) {
    if (!(T.cans > 0)) { AUD.sfx('deny'); return; }
    T.cans--; U.save();
    putBowl(c, true);
    c.eatT = 2.6; c.crunch = 0.3;
    AUD.sfx('can');
    const f = PL.f; f.yaw = Math.atan2(c.x - f.pos.x, c.z - f.pos.z);
  }
  function nearCat() {
    const f = PL.f; let best = null, bd = 1.9;
    for (const c of J.cats) { if (c.found || c.eatT > 0) continue; const d = Math.hypot(f.pos.x - c.x, f.pos.z - c.z); if (d < bd) { bd = d; best = c; } }
    return best;
  }
  function canAct() { return T.mode === 'play' && !T.paused && !ZONE.active && !PL.ride && PL.f && !PL.f.dead; }
  // 캔은 자판기에서 산다 (game.js 자판기 고르기)
  function nearAct() {
    if (!canAct()) return null;
    const c = nearCat(); if (c) return { icon: '[can]', dim: !(T.cans > 0) };
    return null;
  }
  function act() {
    if (!canAct() || PL.f.state !== 'free') return false;
    const c = nearCat(); if (c) { feed(c); return true; }
    return false;
  }

  function find(c) {
    c.found = true; J.found[c.id] = 1; store('ueno.catsFed', J.found);
    curl(c);
    if (c.food) c.food.visible = false;   // 빈 그릇은 옆에 남긴다 (9/14 치웠다가 사장님 "고양이그릇은 냅둬"로 되돌림)
    const n = count();
    AUD.sfx('meow');
    hearts(c);   // 밥 주기는 코인을 주지 않는다 (코인은 미션으로 번다)
    FX.praise('🐱 ' + n + '/' + J.cats.length);
    if (n === J.cats.length) setTimeout(() => { FX.banner('🐱 ' + n + '/' + n, 2.2); AUD.sfx('clear'); }, 900);   // 코인은 주지 않는다
    ZONE.missionDone();
  }
  function count() { return J.cats.filter(c => c.found).length; }

  let heartTex = null;
  function hearts(c) {
    if (!heartTex) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
      g.fillStyle = '#ff5a8a'; g.beginPath(); g.moveTo(32, 56); g.bezierCurveTo(-6, 30, 12, -2, 32, 18); g.bezierCurveTo(52, -2, 70, 30, 32, 56); g.fill();
      heartTex = new THREE.CanvasTexture(cv); heartTex.colorSpace = THREE.SRGBColorSpace;
    }
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTex, transparent: true, depthWrite: false }));
      s.position.set(c.x + U.rand(-0.3, 0.3), 0.5, c.z + U.rand(-0.3, 0.3)); s.scale.setScalar(0.3);
      scene.add(s);
      J.milk.push({ fx: true, s, t: -i * 0.12, vy: U.rand(1.2, 1.8) });
    }
  }

  // ── 딸기우유: 내 체력이 반 아래일 때 BREAK 시키면 상대 주머니에서 떨어진다 ──
  let milkTex = null;
  function milkSprite() {
    if (!milkTex) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(64, 120, 34, 7, 0, 0, 7); g.fill();
      ICON.draw('milk', g, 8, 2, 112);   // 단추·자판기와 같은 우유갑 그림
      milkTex = new THREE.CanvasTexture(cv); milkTex.colorSpace = THREE.SRGBColorSpace;
    }
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: milkTex, transparent: true, depthWrite: false }));
    s.scale.setScalar(0.85);
    return s;
  }
  function onBreak(foe) {
    if (!J.st || J.st.milk >= 2) return;
    const lowest = [T.ken, T.hiromi].filter(h => !h.dead).sort((a, b) => a.hp / a.hpMax - b.hp / b.hpMax)[0];
    if (!lowest || lowest.hp / lowest.hpMax > 0.5) return;
    J.st.milk++;
    const s = milkSprite();
    const a = Math.random() * U.TAU;
    const m = { s, x: foe.pos.x, z: foe.pos.z, vx: Math.cos(a) * 2.2, vz: Math.sin(a) * 2.2, y: 1.2, vy: 5, t: 0 };
    s.position.set(m.x, m.y, m.z); scene.add(s);
    J.milk.push(m);
  }
  function milkUpdate(dt) {
    for (let i = J.milk.length - 1; i >= 0; i--) {
      const m = J.milk[i]; m.t += dt;
      if (m.fx) {   // 고양이 하트
        if (m.t < 0) continue;
        m.s.position.y += m.vy * dt; m.s.material.opacity = Math.max(0, 1 - m.t / 1.1);
        if (m.t > 1.1) { scene.remove(m.s); m.s.material.dispose(); J.milk.splice(i, 1); }
        continue;
      }
      if (m.y > 0.45 || m.vy > 0) {
        m.vy -= 16 * dt; m.y = Math.max(0.45, m.y + m.vy * dt);
        const p = { x: m.x + m.vx * dt, z: m.z + m.vz * dt };
        if (!PARK.blocked(p.x, p.z, 0.3)) { m.x = p.x; m.z = p.z; }
        if (m.y <= 0.45 && m.vy < 0) { m.vy = m.vy < -3 ? -m.vy * 0.35 : 0; m.vx *= 0.5; m.vz *= 0.5; }
      } else m.y = 0.45 + Math.sin(m.t * 5) * 0.08;
      m.s.position.set(m.x, m.y, m.z);
      m.s.material.opacity = m.t > 11 ? (Math.sin(m.t * 20) > 0 ? 1 : 0.2) : 1;
      let took = null;
      if (m.t > 0.35) for (const h of [PL.f, ALLY.f]) if (!h.dead && Math.hypot(h.pos.x - m.x, h.pos.z - m.z) < 1.1 && h.hp < h.hpMax) { took = h; break; }
      if (took) {
        took.hp = Math.min(took.hpMax, took.hp + 50);
        FX.num(took, '+50', true); AUD.sfx('drink');
      }
      if (took || m.t > 14) { scene.remove(m.s); m.s.material.dispose(); J.milk.splice(i, 1); }
    }
  }
  function clearMilk() {
    for (let i = J.milk.length - 1; i >= 0; i--) if (!J.milk[i].fx) { scene.remove(J.milk[i].s); J.milk.splice(i, 1); }
  }

  // ── 싸움 기록 → 등급 ─────────────────────────
  function begin(zn) {
    J.st = { zn, t: 0, lost: 0, combo: 0, counter: 0, brk: 0, ko: 0, milk: 0, hp: { k: T.ken.hp, h: T.hiromi.hp }, dead: { k: false, h: false } };
  }
  function note(kind) { if (J.st) J.st[kind]++; }
  function fightUpdate(dt) {
    const s = J.st; if (!s || ZONE.phase !== 'fight') return;
    s.t += dt;
    s.combo = Math.max(s.combo, PL.combo);
    for (const [k, h] of [['k', T.ken], ['h', T.hiromi]]) {
      if (h.hp < s.hp[k]) s.lost += s.hp[k] - h.hp;
      s.hp[k] = h.hp;
      if (h.dead && !s.dead[k]) s.ko++;
      s.dead[k] = h.dead;
    }
  }
  function grade(s) {
    const par = 32 + DATA.ZONES.indexOf(s.zn) * 6;
    let p = s.t <= par ? 30 : s.t <= par * 1.6 ? 20 : 10;
    const lossK = s.lost / (T.ken.hpMax + T.hiromi.hpMax);
    p += lossK < 0.15 ? 30 : lossK < 0.35 ? 20 : lossK < 0.6 ? 10 : 0;
    p += s.combo >= 15 ? 20 : s.combo >= 8 ? 12 : s.combo >= 4 ? 6 : 0;
    const tech = s.counter + s.brk * 0.5;
    p += tech >= 3 ? 20 : tech >= 1 ? 10 : 0;
    p -= s.ko * 15;
    return p >= 85 ? 'S' : p >= 65 ? 'A' : p >= 45 ? 'B' : 'C';
  }
  function finish(zn) {
    const s = J.st; J.st = null; clearMilk();
    if (!s || s.zn !== zn) return;
    const r = grade(s);
    const old = J.best[zn.id];
    const better = !old || RANKS.indexOf(r) > RANKS.indexOf(old.r) || (r === old.r && s.t < old.t);
    if (better) { J.best[zn.id] = { r, t: Math.round(s.t), c: s.combo }; store('ueno.best', J.best); }
    const secs = Math.round(s.t);
    const card = $('rank');
    card.innerHTML = '<div class="rk r' + r + '">' + r + '</div>'
      + '<div class="rrow">⏱ ' + ((secs / 60) | 0) + ':' + String(secs % 60).padStart(2, '0') + '</div>'
      + '<div class="rrow">💥 ' + s.combo + ' HIT</div>'
      + '<div class="rrow">❤ -' + Math.round(s.lost) + '</div>'
      + (better && old ? '<div class="rnew">NEW RECORD</div>' : '');
    card.classList.remove('show'); void card.offsetWidth; card.classList.add('show');
    setTimeout(() => AUD.sfx(r === 'S' ? 'clear' : 'stamp'), 520);
    setTimeout(() => card.classList.remove('show'), 4200);
  }
  function abort() { J.st = null; clearMilk(); }

  // 엔딩 화면: 구역별 최고 등급 + 고양이
  function summary() {
    return DATA.ZONES.map(zn => { const b = J.best[zn.id]; return '<span class="rs r' + (b ? b.r : 'C') + '">' + (b ? b.r : '-') + '</span>'; }).join('')
      + '<span class="rcat">🐱 ' + count() + '/' + J.cats.length
      + ' 🔖 ' + J.stamps.filter(s => s.got).length + '/' + J.stamps.length
      + ' 🧧 ' + J.charms.filter(c => c.got).length + '/' + J.charms.length
      + ' 🗑 ' + J.trash.filter(t => t.got).length + '/' + J.trash.length
      + (window.PETS ? ' 🐶 ' + PETS.countDogs() + '/' + PETS.pups.length + ' 🕊 ' + PETS.countPigeons() + '/' + PETS.flocks.length : '') + '</span>';
  }

  // GAME OVER: 상대가 얼마 남았었는지 — 한 끗 차이가 보이게
  function overBars() {
    const box = $('ovBars'); box.innerHTML = '';
    for (const o of ZONE.foes) {
      const row = document.createElement('div'); row.className = 'orow';
      row.innerHTML = '<div class="oname"></div><div class="obar"><i></i></div>';
      row.querySelector('.oname').textContent = STORY.NAME[o.key];
      row.querySelector('i').style.width = (Math.max(0, o.hp) / o.hpMax * 100) + '%';
      box.appendChild(row);
    }
  }

  function update(dt) {
    catsUpdate(dt);
    stampsUpdate(dt);
    charmsUpdate(dt);
    trashUpdate();
    milkUpdate(dt);
    fightUpdate(dt);
  }

  Object.assign(J, { init, update, begin, note, finish, abort, onBreak, summary, overBars, count, collectionHTML, act, nearAct, hearts });
  window.JOY = J;
})();
