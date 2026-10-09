// 할 거리 (2026-10-09 "할 게 없대") — 바람에 날아간 주민 물건 줍기, 바람 고리(바람길), 부스트, 도감, 단골, 엔딩
(function () {
  const T = TERRAIN;
  const KEY = 'maedal.x';
  const X = { gifts: [], heard: [], rings: [], total: 0, time: 0, ended: false };
  try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o) for (const k in X) if (o[k] !== undefined) X[k] = o[k]; } catch (e) { }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(X)); } catch (e) { } }

  // 주민 열 명(delivery.js WHO 순서)이 바람에 잃어버린 물건 — 한 사람에 세 개
  const ITEMS = TX([
    '닳은 붓', '물감 묻은 팔레트', '그리다 만 초상화',
    '첫 원고', '잉크 마른 만년필', '부치지 못한 편지',
    '슬레이트', '낡은 필름통', '감독 의자',
    '첫 음반', '은색 마이크', '기타 피크',
    '밑줄 친 대본', '소품 왕관', '무대 가면',
    '실버 버튼', '링라이트', '고장 난 웹캠',
    '금박 명함', '첫 계약서', '넥타이핀',
    '사인 축구공', '우승 메달', '정강이 보호대',
    '태블릿 펜', '1화 콘티', '다 쓴 지우개',
    '필름 카메라', '렌즈 뚜껑', '바랜 인화지',
  ], [
    'Worn Brush', 'Paint-stained Palette', 'Unfinished Portrait',
    'First Manuscript', 'Dried Fountain Pen', 'Unsent Letter',
    'Clapperboard', 'Old Film Can', "Director's Chair",
    'First Record', 'Silver Mic', 'Guitar Pick',
    'Marked Script', 'Prop Crown', 'Stage Mask',
    'Silver Button', 'Ring Light', 'Broken Webcam',
    'Gold Business Card', 'First Contract', 'Tie Pin',
    'Signed Football', 'Winner Medal', 'Shin Guards',
    'Tablet Pen', 'Episode 1 Storyboard', 'Used-up Eraser',
    'Film Camera', 'Lens Cap', 'Faded Print',
  ]);
  const WHO = TX(['화가', '작가', '영화감독', '가수', '배우', '유튜버', 'CEO', '축구선수', '웹툰작가', '사진작가'],
    ['Painter', 'Novelist', 'Film Director', 'Singer', 'Actor', 'YouTuber', 'CEO', 'Footballer', 'Webtoon Artist', 'Photographer']);
  // 엔딩 인사 (주민마다 한 줄)
  const THANKS = TX([
    '당신이 오는 길이 제일 좋은 그림이었어요.',
    '마지막 장은 배달원 이야기로 쓸게요.',
    '컷. 오케이. 오늘은 한 번에 갔네요.',
    '앵콜은 당신 몫이에요.',
    '주연은 처음부터 당신이었어요.',
    '오늘 영상 제목은 하늘 위 배달원입니다.',
    '정규직 제안은 아직 유효합니다.',
    '오늘 경기 MVP는 당신이에요.',
    '완결 후기에 이름 넣을게요.',
    '이건 필터 없이 남길게요.',
  ], [
    'The road you flew was my best painting.',
    'The last chapter is about the delivery rider.',
    'Cut. Okay. Got it in one take today.',
    'The encore is yours.',
    'You were the lead from the start.',
    "Today's video: The Rider in the Sky.",
    'The full-time offer still stands.',
    "You're today's MVP.",
    "I'll put your name in the afterword.",
    'This one stays without a filter.',
  ]);
  const BOX_COL = [0xd9534f, 0x4f7fd9, 0x2f2f36, 0xb04fd9, 0xd9a24f, 0xe0e0e0, 0x2f6b4f, 0x4fb3d9, 0xd96fa8, 0x8a6a4a];

  const E = { ending: false, endT: 0 };
  let scene, gifts = [], rings = [], chains = [];
  let coins, fire, steam, streak;

  // ── 입자 (색 있는 점) ──────────────────────────────
  let dotTex = null;
  function dotTexture() {   // 둥근 점 (네모 점 대신)
    if (dotTex) return dotTex;
    const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d');
    const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 32, 32); dotTex = new THREE.CanvasTexture(c); return dotTex;
  }
  function Parts(max, size, grav, additive, opacity) {
    const pos = new Float32Array(max * 3), col = new Float32Array(max * 3), vel = new Float32Array(max * 3), life = new Float32Array(max);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.PointsMaterial({ size, map: dotTexture(), vertexColors: true, transparent: true, opacity: opacity || 0.95, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: false });
    const mesh = new THREE.Points(g, m); mesh.frustumCulled = false; mesh.renderOrder = 9; scene.add(mesh);
    for (let i = 0; i < max; i++) pos[i * 3 + 1] = -9999;
    let next = 0, live = false, colDirty = false; const c = new THREE.Color();
    return {
      emit(x, y, z, vx, vy, vz, lf, hex) {
        const i = next; next = (next + 1) % max;
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz; life[i] = lf;
        c.setHex(hex); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; live = true; colDirty = true;
      },
      update(dt) {
        if (!live) return; let any = false;
        const drag = Math.exp(-dt * 0.9);
        for (let i = 0; i < max; i++) {
          if (life[i] <= 0) continue; any = true; life[i] -= dt;
          vel[i * 3 + 1] -= grav * dt; vel[i * 3] *= drag; vel[i * 3 + 2] *= drag;
          pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
          if (life[i] <= 0) pos[i * 3 + 1] = -9999;
        }
        g.attributes.position.needsUpdate = true; if (colDirty) { g.attributes.color.needsUpdate = true; colDirty = false; }
        live = any;
      },
    };
  }

  // ── 소리: 배경음과 같은 둥근 소리(사인·삼각), 4kHz 위는 깎는다 ──
  let sbus = null;
  function snd() {
    const r = window.AUDIO && AUDIO.raw && AUDIO.raw(); if (!r) return null;
    if (!sbus) {
      const g = r.ctx.createGain(); g.gain.value = 0.9;
      const lp = r.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4000;
      const cp = r.ctx.createDynamicsCompressor(); cp.threshold.value = -14; cp.ratio.value = 4;
      g.connect(lp).connect(cp).connect(r.bus); sbus = g;
    }
    return r;
  }
  function note(f, at, dur, vol, type) {
    const r = snd(); if (!r) return; const t = r.ctx.currentTime + (at || 0);
    const o = r.ctx.createOscillator(); o.type = type || 'triangle'; o.frequency.value = f;
    const g = r.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(sbus); o.start(t); o.stop(t + dur + 0.05);
    if (type !== 'sine') { const o2 = r.ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2; const g2 = r.ctx.createGain(); g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(vol * 0.15, t + 0.006); g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.4); o2.connect(g2).connect(sbus); o2.start(t); o2.stop(t + dur); }
  }
  function whoosh(dur, f0, f1, vol, at) {
    const r = snd(); if (!r) return; const t = r.ctx.currentTime + (at || 0);
    const s = r.ctx.createBufferSource(); s.buffer = r.noise(dur + 0.1);
    const f = r.ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.4); f.frequency.exponentialRampToValueAtTime(f0 * 0.8, t + dur);
    const g = r.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(sbus); s.start(t); s.stop(t + dur + 0.05);
  }
  function sweep(f0, f1, dur, vol) {
    const r = snd(); if (!r) return; const t = r.ctx.currentTime;
    const o = r.ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6);
    const g = r.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(sbus); o.start(t); o.stop(t + dur + 0.05);
  }
  const SFX = {
    gift() { [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.07, 0.5, 0.09)); note(262, 0, 0.9, 0.12, 'sine'); },
    ring(k) { const P = [392, 440, 523, 587, 659]; note(P[k % 5], 0, 0.45, 0.1); note(P[k % 5] / 2, 0, 0.6, 0.08, 'sine'); whoosh(0.5, 300, 900, 0.18); },
    chain() { [523, 659, 784].forEach(f => note(f, 0, 1.2, 0.07)); note(1047, 0.18, 1.0, 0.08); note(131, 0, 1.4, 0.14, 'sine'); },
    perfect() { [523, 659, 784].forEach((f, i) => note(f, i * 0.04, 0.7, 0.08)); note(1047, 0.14, 0.6, 0.07); },
    regular() { [392, 494, 587, 784].forEach((f, i) => note(f, i * 0.1, 0.9, 0.08)); note(196, 0, 1.4, 0.12, 'sine'); },
    boost(p) { whoosh(0.7 + p * 0.4, 220, 900, 0.22 + p * 0.18); sweep(90, 200, 0.6, 0.05 + 0.2 * p); },
    full() { note(784, 0, 0.25, 0.06); },
    squash() { sweep(170, 80, 0.25, 0.22); },
    firework() { whoosh(0.35, 120, 400, 0.25); for (let i = 0; i < 5; i++) note([523, 587, 659, 784, 880][Math.floor(Math.random() * 5)], 0.08 + Math.random() * 0.3, 0.35, 0.025); },
    fanfare() { [[392, 0], [523, 0.22], [659, 0.44], [784, 0.66], [659, 0.9], [784, 1.05]].forEach(([f, a]) => note(f, a, 0.6, 0.09)); [262, 330, 392].forEach(f => note(f, 1.05, 2.4, 0.06, 'sine')); note(1047, 1.05, 1.8, 0.06); },
  };

  // ── 배치 도우미: 바위·석주·건물 밖으로 밀어낸다 ──
  function clearOfRock(v, margin) {
    for (let it = 0; it < 8; it++) {
      const p = { x: v.x, y: v.y, z: v.z }; const c = T.collidePoint(p, margin);
      let moved = !!(c && c.push > 0); v.set(p.x, p.y, p.z);
      for (const pl of SCENERY.S.pillars) {
        const dx = v.x - pl.x, dz = v.z - pl.z, hd = Math.hypot(dx, dz);
        if (hd < pl.r + margin && v.y < pl.h + margin + 2) { const k = (pl.r + margin) / (hd || 1); v.x = pl.x + dx * k; v.z = pl.z + dz * k; moved = true; }
      }
      for (const bd of SCENERY.S.buildings) {
        if (v.y < bd.y0 - margin || v.y > bd.y1 + margin) continue;
        const dx = v.x - bd.x, dz = v.z - bd.z, hd = Math.hypot(dx, dz);
        if (hd < bd.r + margin) { const k = (bd.r + margin) / (hd || 1); v.x = bd.x + dx * k; v.z = bd.z + dz * k; moved = true; }
      }
      if (!moved) break;
    }
    return v;
  }
  let glowTex = null;
  function glowTexture() {
    if (glowTex) return glowTex;
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,230,150,1)'); gr.addColorStop(0.35, 'rgba(255,200,90,.45)'); gr.addColorStop(1, 'rgba(255,180,60,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); glowTex = new THREE.CanvasTexture(c); return glowTex;
  }

  // ── 선물 상자 30개: 주민 물건이 바람에 날려 석주 곳곳에 걸려 있다 ──
  function makeGifts() {
    const rng = NOISE.makeRng(7071);
    const spots = [];
    const D = DELIVERY.D;
    const farFromYards = v => D.targets.every(t => t.pos.distanceTo(v) > 9) && v.distanceTo(new THREE.Vector3(0, T.SUMMIT, 0)) > 12;
    const farFromSpots = v => spots.every(s => s.distanceTo(v) > 14);
    // 첫 하나는 식당에서 바로 보이는 자리 (이런 게 있다는 걸 알게)
    spots.push(clearOfRock(new THREE.Vector3(14, T.SUMMIT - 3, -14), 2.2));
    const pls = SCENERY.S.pillars.filter(p => Math.hypot(p.x, p.z) < 238);
    let guard = 0;
    while (spots.length < ITEMS.length && guard++ < 3000) {
      const kind = rng();
      let v;
      if (kind < 0.62) {   // 석주 옆구리 (벽에 붙어야 줍는다)
        const p = pls[Math.floor(rng() * pls.length)]; const a = rng() * Math.PI * 2;
        const y = 30 + rng() * (Math.min(p.h, T.SUMMIT) - 36); if (y < 30) continue;
        v = new THREE.Vector3(p.x + Math.cos(a) * (p.r + 2.2), y, p.z + Math.sin(a) * (p.r + 2.2));
      } else if (kind < 0.82) {   // 뾰족한 꼭대기 위
        const tops = pls.filter(p => !p.flat); if (!tops.length) continue;
        const p = tops[Math.floor(rng() * tops.length)]; v = new THREE.Vector3(p.x, p.h + 3.2, p.z);
      } else {   // 구름 속
        const a = rng() * Math.PI * 2, d = 40 + rng() * 190; v = new THREE.Vector3(Math.cos(a) * d, SCENERY.CLOUD_Y - 4 + rng() * 10, Math.sin(a) * d);
      }
      if (v.y > T.SUMMIT + 30 || v.y < T.BASE + 30) continue;
      clearOfRock(v, 2.0);
      if (!farFromYards(v) || !farFromSpots(v)) continue;
      spots.push(v);
    }
    const boxG = new THREE.BoxGeometry(0.9, 0.9, 0.9), rib1 = new THREE.BoxGeometry(0.96, 0.96, 0.22), rib2 = new THREE.BoxGeometry(0.22, 0.96, 0.96), bowG = new THREE.TorusGeometry(0.16, 0.06, 6, 12);
    const ribM = new THREE.MeshStandardMaterial({ color: 0xffd27a, roughness: 0.4, metalness: 0.3, emissive: 0x4a3510, emissiveIntensity: 0.6 });
    const boxM = BOX_COL.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, emissive: c, emissiveIntensity: 0.18 }));
    const gm = new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 });
    spots.forEach((v, i) => {
      const g = new THREE.Group(); g.position.copy(v);
      const box = new THREE.Mesh(boxG, boxM[Math.floor(i / 3) % 10]); box.castShadow = true; g.add(box);
      g.add(new THREE.Mesh(rib1, ribM)); g.add(new THREE.Mesh(rib2, ribM));
      const b1 = new THREE.Mesh(bowG, ribM); b1.position.set(-0.13, 0.55, 0); b1.rotation.set(0, 0, 0.6); g.add(b1);
      const b2 = new THREE.Mesh(bowG, ribM); b2.position.set(0.13, 0.55, 0); b2.rotation.set(0, 0, -0.6); g.add(b2);
      const glow = new THREE.Sprite(gm); glow.scale.set(3.4, 3.4, 1); glow.renderOrder = 7; g.add(glow);
      const got = X.gifts.includes(i); g.visible = !got;
      scene.add(g); gifts.push({ i, g, pos: v.clone(), got, ph: i * 1.7 });
    });
  }

  // ── 바람길 6개: 집과 집 사이 고리 다섯 개. 지나가면 확 밀어 준다 ──
  function makeRings() {
    const D = DELIVERY.D, tg = D.targets; if (tg.length < 2) return;
    const pairs = [];
    for (let a = 0; a < tg.length; a++) for (let b = a + 1; b < tg.length; b++) { const d = Math.hypot(tg[a].pos.x - tg[b].pos.x, tg[a].pos.z - tg[b].pos.z); if (d > 45 && d < 160 && Math.abs(tg[a].pos.y - tg[b].pos.y) < d * 0.45) pairs.push([a, b, d]); }   // 너무 가파른 길은 뺀다
    pairs.sort((p, q) => p[2] - q[2]);
    const used = {}; const pick = [];
    for (const p of pairs) { if (pick.length >= 6) break; if ((used[p[0]] || 0) >= 2 || (used[p[1]] || 0) >= 2) continue; pick.push(p); used[p[0]] = (used[p[0]] || 0) + 1; used[p[1]] = (used[p[1]] || 0) + 1; }
    const torG = new THREE.TorusGeometry(3.0, 0.2, 8, 40);
    pick.forEach(([a, b], ci) => {
      const A = tg[a].pos.clone(), B = tg[b].pos.clone(); A.y += 8; B.y += 8;
      const pts = [];
      for (let k = 0; k < 5; k++) { const t = 0.18 + k * 0.16; const v = A.clone().lerp(B, t); v.y += Math.sin(Math.PI * t) * 14; pts.push(clearOfRock(v, 4.5)); }
      const ch = { ci, from: tg[a], to: tg[b], rings: [], next: 0, last: 0, done: X.rings.includes(ci) };
      pts.forEach((v, k) => {
        const prev = k ? pts[k - 1] : A, nxt = k < 4 ? pts[k + 1] : B;
        const dir = nxt.clone().sub(prev).normalize();
        const m = new THREE.Mesh(torG, new THREE.MeshBasicMaterial({ color: ch.done ? 0xffd27a : 0x8fe6ff, transparent: true, opacity: 0.6, depthWrite: false }));
        m.position.copy(v); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir); m.renderOrder = 6; scene.add(m);
        const r = { m, pos: v, dir, k, ch, prev: null };
        ch.rings.push(r); rings.push(r);
      });
      chains.push(ch);
    });
  }

  // ── 부스트: 누르고 있으면 모이고, 떼면 튀어 나간다 ──
  const BO = { hold: false, charge: 0, t: 0, pow: 0, full: false };
  function fire_(p) {
    BO.t = 0.5 + p * 0.9; BO.pow = p; SFX.boost(p);
    const G = window.GAME; if (!G) return;
    const sp = G.BIKES[G.GARAGE.cur]; if (!sp.solar) G.FUEL.fuel = Math.max(0, G.FUEL.fuel - 2.5 * p * sp.eff);
    G.RIDE.vel.addScaledVector(G.RIDE.fwd, 8 * p);
  }
  function setHold(on) {
    if (!window.GAME || !GAME.isStarted() || GAME.DEAD.on || E.ending || GAME.isPaused()) { BO.hold = false; BO.charge = 0; return; }
    if (on === BO.hold) return; BO.hold = on;
    if (!on && BO.charge > 0.18) fire_(BO.charge);
    if (!on) { BO.charge = 0; BO.full = false; }
  }
  window.addEventListener('keydown', e => { if (e.code === 'KeyE' && !e.repeat) setHold(true); });
  window.addEventListener('keyup', e => { if (e.code === 'KeyE') setHold(false); });
  window.addEventListener('blur', () => { BO.hold = false; BO.charge = 0; BO.full = false; });

  // ── 도감·부스트 막대·엔딩 화면 ─────────────────────
  let elBoost, elBoostBar, elDex, elDexBody, elEnd, dexTab = 0, dexOpen = false;
  function buildDom() {
    elBoost = document.getElementById('boost'); elBoostBar = elBoost.querySelector('i');
    const bo = document.getElementById('bo');
    bo.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); setHold(true); });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) bo.addEventListener(ev, () => setHold(false));
    elDex = document.getElementById('dex'); elDexBody = document.getElementById('dexBody');
    document.getElementById('btnDex').addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); toggleDex(); });
    document.getElementById('dexClose').addEventListener('pointerdown', e => { e.stopPropagation(); closeDex(); });
    elDex.addEventListener('pointerdown', e => {
      e.stopPropagation();
      const tb = e.target.closest('[data-tab]'); if (tb) { dexTab = +tb.dataset.tab; renderDex(); return; }
      const row = e.target.closest('[data-who]'); if (row) row.classList.toggle('open');
    });
    elEnd = document.getElementById('ending');
    elEnd.addEventListener('pointerdown', e => e.stopPropagation());
    document.getElementById('endAgain').addEventListener('click', e => {
      e.stopPropagation();
      try { const ks = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('maedal.') && k !== 'maedal.music' && k !== 'maedal.sfx') ks.push(k); } ks.forEach(k => localStorage.removeItem(k)); } catch (er) { }
      location.reload();
    });
    window.addEventListener('keydown', e => {
      if (e.code === 'KeyB' && window.GAME && GAME.isStarted() && !E.ending) toggleDex();
      if (e.code === 'Escape' && dexOpen) closeDex();
    });
  }
  function regulars() { return DELIVERY.D.targets.filter(t => (X.heard[t.idx] || 0) >= 10).length; }
  function renderDex() {
    const D = DELIVERY.D, nT = D.targets.length;
    const tabs = [TX('단골', 'Regulars'), TX('물건', 'Items'), TX('바람길', 'Wind Roads')];
    const cnt = [regulars() + '/' + nT, X.gifts.length + '/' + gifts.length, X.rings.length + '/' + chains.length];
    let h = '<div class="tabs">' + tabs.map((t, i) => '<button data-tab="' + i + '" class="' + (i === dexTab ? 'on' : '') + '">' + t + ' <small>' + cnt[i] + '</small></button>').join('') + '</div>';
    if (dexTab === 0) {
      h += '<p class="goal">' + TX('열 집 모두 단골이 되면 호버바이크로 마지막 주문', 'All homes regular, then the last order on the Hoverbike') + '</p>';
      for (const t of D.targets) {
        const n = Math.min(10, X.heard[t.idx] || 0);
        let dots = ''; for (let k = 0; k < 10; k++) dots += '<i class="' + (k < n ? 'on' : '') + '"></i>';
        let lines = ''; for (let k = 0; k < 10; k++) lines += '<li>' + (k < n ? t.lines[k] : '???') + '</li>';
        h += '<div class="who' + (n >= 10 ? ' reg' : '') + '" data-who="' + t.idx + '"><div class="top"><b>' + t.name + '</b><span>' + t.who + '</span>' + (n >= 10 ? '<em>' + TX('단골', 'REGULAR') + '</em>' : '') + '<u>' + dots + '</u></div><ol>' + lines + '</ol></div>';
      }
    } else if (dexTab === 1) {
      h += '<div class="items">';
      gifts.forEach(g => {
        const got = X.gifts.includes(g.i), r = Math.floor(g.i / 3);
        h += '<div class="it' + (got ? ' got' : '') + '"><span class="bx" style="background:#' + BOX_COL[r % 10].toString(16).padStart(6, '0') + '"></span><b>' + (got ? ITEMS[g.i] : '?') + '</b><small>' + WHO[r] + '</small></div>';
      });
      h += '</div>';
    } else {
      for (const ch of chains) h += '<div class="road' + (ch.done ? ' done' : '') + '"><b>' + ch.from.name + ' → ' + ch.to.name + '</b><em>' + (ch.done ? TX('완주', 'CLEAR') : '') + '</em></div>';
    }
    elDexBody.innerHTML = h;
  }
  function toggleDex() { if (dexOpen) closeDex(); else { dexOpen = true; renderDex(); elDex.classList.add('show'); } }
  function closeDex() { dexOpen = false; if (elDex) elDex.classList.remove('show'); }

  function init(sc) {
    scene = sc;
    coins = Parts(500, 0.22, 14, false); fire = Parts(1600, 1.1, 3.5, false); steam = Parts(200, 0.32, -1.4, false, 0.45); streak = Parts(400, 0.09, 0, true);
    makeGifts(); makeRings(); buildDom();
  }

  // ── 매 프레임 ─────────────────────────────────────
  let saveT = 0, steamT = 0, streakT = 0, fov = 58;
  const _v = new THREE.Vector3();
  function update(dt, now) {
    const G = window.GAME; const B = SCENERY.S.bike; const bp = B.g.position;
    X.time += dt; saveT += dt; if (saveT > 10) { saveT = 0; save(); }
    // 선물
    for (const g of gifts) {
      if (g.got) continue;
      g.g.rotation.y += dt * 0.9; g.g.position.y = g.pos.y + Math.sin(now * 1.6 + g.ph) * 0.25;
      if (Math.abs(g.pos.x - bp.x) < 3 && Math.abs(g.pos.z - bp.z) < 3) {
        _v.set(bp.x, bp.y + 0.6, bp.z);
        if (_v.distanceTo(g.g.position) < 2.3) collectGift(g);
      }
    }
    // 바람 고리
    for (const r of rings) {
      const ch = r.ch, isNext = r.k === ch.next;
      r.m.material.opacity = isNext ? 0.75 + 0.2 * Math.sin(now * 6) : 0.42;
      const s = isNext ? 1 + 0.05 * Math.sin(now * 6) : 1; r.m.scale.set(s, s, s);
      const dx = bp.x - r.pos.x, dy = bp.y + 0.5 - r.pos.y, dz = bp.z - r.pos.z;
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8 || Math.abs(dz) > 8) { r.prev = null; continue; }
      const along = dx * r.dir.x + dy * r.dir.y + dz * r.dir.z;
      const rad = Math.hypot(dx - along * r.dir.x, dy - along * r.dir.y, dz - along * r.dir.z);
      if (r.prev !== null && (r.prev < 0) !== (along < 0) && rad < 3.3) passRing(r, along > r.prev ? 1 : -1, now);
      r.prev = along;
    }
    for (const ch of chains) if (ch.next > 0 && now - ch.last > 14) ch.next = 0;   // 너무 오래 끊기면 처음부터
    // 부스트
    if (BO.hold) {
      BO.charge = Math.min(1, BO.charge + dt / 1.1);
      G.RIDE.vel.multiplyScalar(Math.exp(-dt * 1.4));
      if (BO.charge >= 1 && !BO.full) { BO.full = true; SFX.full(); }
    }
    if (BO.t > 0) {
      BO.t -= dt; G.RIDE.vel.addScaledVector(G.RIDE.fwd, 30 * BO.pow * dt);
      streakT -= dt;
      if (streakT <= 0) { streakT = 0.016; for (let k = 0; k < 4; k++) { const a = Math.random() * Math.PI * 2, rr = 1.2 + Math.random() * 1.6; streak.emit(bp.x + Math.cos(a) * rr + G.RIDE.fwd.x * 6, bp.y + 0.8 + Math.sin(a) * rr, bp.z + Math.sin(a) * rr * 0.5 + G.RIDE.fwd.z * 6, -G.RIDE.fwd.x * 46, 0, -G.RIDE.fwd.z * 46, 0.3, 0xdff6ff); } }
    }
    elBoost.classList.toggle('on', BO.hold); elBoost.classList.toggle('full', BO.full); elBoostBar.style.width = (BO.charge * 100).toFixed(1) + '%';
    const want = 58 + (BO.t > 0 ? 16 * BO.pow * Math.min(1, BO.t * 2) : 0) - BO.charge * 4;
    fov += (want - fov) * (1 - Math.exp(-dt * 6));
    if (Math.abs(G.camera.fov - fov) > 0.02) { G.camera.fov = fov; G.camera.updateProjectionMatrix(); }
    // 짐 모양: 색·크기, 뜨거운 피자는 김
    const D = DELIVERY.D, pk = G.pack;
    const carry = D.state === 'carry' && D.pkg;
    pk.material.color.setHex(carry ? D.pkg.color : 0xd42a1a);
    const sc = carry && D.pkg.heavy ? 1.6 : 1; pk.scale.set(sc, sc, sc); G.packLid.scale.set(sc, 1, sc);
    if (carry && D.pkg.hot && D.t < D.limit) { steamT -= dt; if (steamT <= 0) { steamT = 0.09; steam.emit(pk.position.x + (Math.random() - 0.5) * 0.2, pk.position.y + 0.3, pk.position.z + (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.4, 0.6, (Math.random() - 0.5) * 0.4, 1.0, 0xf4f4f4); } }
  }
  function parts(dt) { coins.update(dt); fire.update(dt); steam.update(dt); streak.update(dt); }

  function collectGift(g) {
    g.got = true; g.g.visible = false; if (!X.gifts.includes(g.i)) X.gifts.push(g.i); save();
    SFX.gift();
    for (let k = 0; k < 40; k++) { const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 4; coins.emit(g.pos.x, g.pos.y, g.pos.z, Math.cos(a) * s, 3 + Math.random() * 5, Math.sin(a) * s, 0.9 + Math.random() * 0.5, k % 3 ? 0xffcf4a : BOX_COL[Math.floor(g.i / 3) % 10]); }
    DELIVERY.D.money += 10;
    if (window.UI) { UI.pop(ITEMS[g.i] + '  🪙 +10'); UI.sub(WHO[Math.floor(g.i / 3)] + TX('의 물건  ', "'s item  ") + X.gifts.length + '/' + gifts.length); }
  }
  function passRing(r, way, now) {
    const ch = r.ch, G = window.GAME;
    fire_(0.65); G.RIDE.vel.addScaledVector(r.dir, 6 * way);
    SFX.ring(r.k);
    for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; const ux = Math.cos(a) * 3, uy = Math.sin(a) * 3; streak.emit(r.pos.x + ux, r.pos.y + uy, r.pos.z, ux * 1.5, uy * 1.5, 0, 0.5, ch.done ? 0xffd27a : 0x8fe6ff); }
    if (r.k === ch.next) { ch.next++; ch.last = now; }
    else if (r.k === 0) { ch.next = 1; ch.last = now; }
    if (ch.next >= 5) {
      ch.next = 0;
      if (!ch.done) {
        ch.done = true; X.rings.push(ch.ci); save(); SFX.chain();
        for (const q of ch.rings) q.m.material.color.setHex(0xffd27a);
        DELIVERY.D.money += 30;
        if (window.UI) UI.pop(TX('바람길 완주  🪙 +30', 'WIND ROAD CLEAR  🪙 +30'));
      }
    }
  }

  // ── 배달·단골 ─────────────────────────────────────
  function heard(idx) { return X.heard[idx] || 0; }
  function allRegular() { const tg = DELIVERY.D.targets; return tg.length > 0 && tg.every(t => (X.heard[t.idx] || 0) >= 10); }
  function regulars_() { return regulars(); }
  function onOrder(pkg) {
    if (window.UI && pkg.note) setTimeout(() => UI.sub(pkg.name + '  ' + pkg.note), 1700);
    if (allRegular() && !X.ended && window.GAME && !GAME.BIKES[GAME.GARAGE.cur].hover && window.UI) setTimeout(() => UI.sub(TX('열 집 모두 단골! 호버바이크를 타면 마지막 주문이 온다', 'All regulars! Ride the Hoverbike for the last order')), 4200);
  }
  function onDeliver(t, info) {
    const before = X.heard[t.idx] || 0;
    X.heard[t.idx] = before + 1; X.total++; save();
    if (info.perfect) SFX.perfect();
    if (before + 1 === 10) setTimeout(() => { SFX.regular(); if (window.UI) UI.sub(t.name + ' ' + t.who + TX(' 단골 완성  ', ' is now a REGULAR  ') + regulars_() + '/' + DELIVERY.D.targets.length); }, 3200);
  }
  function finalReady() { return !X.ended && allRegular() && !!window.GAME && !!GAME.BIKES[GAME.GARAGE.cur].hover; }
  function coinBurst(pad, perfect) {
    const n = perfect ? 70 : 28;
    for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * (perfect ? 4 : 2.5); coins.emit(pad.x, pad.y + 0.6, pad.z, Math.cos(a) * s, 5 + Math.random() * 5, Math.sin(a) * s, 1.0 + Math.random() * 0.5, 0xffcf4a); }
  }
  function cakeHit() { SFX.squash(); }
  function extraSpeed() { return BO.t > 0 ? 14 * BO.pow : 0; }
  function heavy() { const D = DELIVERY.D; return D.state === 'carry' && !!D.pkg && !!D.pkg.heavy; }
  function charging() { return BO.charge; }
  function resetBoost() { BO.hold = false; BO.charge = 0; BO.t = 0; BO.full = false; }

  // ── 엔딩: 식당 마당 위 불꽃, 주민마다 인사 한 줄, 끝 ──
  let fwT = 0;
  function startEnding() {
    E.ending = true; E.endT = 0; resetBoost(); closeDex();
    document.body.classList.add('ending');
    if (window.GAME) GAME.park();
    SFX.fanfare();
    const tg = DELIVERY.D.targets;
    tg.forEach((t, i) => setTimeout(() => { if (window.UI) UI.bubble(t.name + ' ' + t.who, THANKS[t.idx % 10], 2.3); }, 2500 + i * 2500));
    setTimeout(showEndCard, 2500 + tg.length * 2500 + 800);
  }
  function showEndCard() {
    X.ended = true; save();
    const m = Math.floor(X.time / 60);
    document.getElementById('endStat').innerHTML =
      TX('배달 ', 'Deliveries ') + X.total + '<br>' + TX('주민 물건 ', 'Items ') + X.gifts.length + '/' + gifts.length + '<br>' + TX('바람길 ', 'Wind Roads ') + X.rings.length + '/' + chains.length + '<br>' + TX('하늘에 있던 시간 ', 'Time in the sky ') + (m >= 60 ? Math.floor(m / 60) + TX('시간 ', 'h ') : '') + (m % 60) + TX('분', 'm');
    elEnd.classList.add('show');
  }
  function endCam(cam, dt) {
    E.endT += dt;
    const a = 0.6 + E.endT * 0.12, R = 30 - Math.min(6, E.endT * 0.3);
    cam.position.set(Math.sin(a) * R, T.SUMMIT + 6 + Math.sin(E.endT * 0.2) * 2, Math.cos(a) * R);
    cam.lookAt(0, T.SUMMIT + 10, 0);
    fwT -= dt;
    if (fwT <= 0) {
      fwT = 0.45 + Math.random() * 0.6;
      const ba = a + Math.PI + (Math.random() - 0.5) * 1.6, bd = 14 + Math.random() * 22;   // 식당 너머, 카메라 반대쪽에서 터진다
      const cx = Math.sin(ba) * bd, cy = T.SUMMIT + 12 + Math.random() * 14, cz = Math.cos(ba) * bd;
      const PAL = [0xffd27a, 0xff7a5a, 0x8fe6ff, 0xb98cff, 0x9cff8a, 0xff9ad2];
      const c1 = PAL[Math.floor(Math.random() * PAL.length)], c2 = PAL[Math.floor(Math.random() * PAL.length)];
      for (let k = 0; k < 110; k++) { const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, s = 9 + Math.random() * 5, q = Math.sqrt(1 - u * u); fire.emit(cx, cy, cz, q * Math.cos(th) * s, u * s, q * Math.sin(th) * s, 1.3 + Math.random() * 0.8, k % 2 ? c1 : c2); }
      SFX.firework();
    }
  }
  function mapRings(ctx, toXY, big) {
    for (const r of rings) { const [x, y] = toXY(r.pos.x, r.pos.z); ctx.beginPath(); ctx.arc(x, y, big ? 7 : 2.2, 0, Math.PI * 2); ctx.fillStyle = r.ch.done ? 'rgba(255,210,122,.85)' : 'rgba(143,230,255,.85)'; ctx.fill(); }
  }

  // 이미 엔딩을 본 판: 시작하면 엔딩 카드만 (무한 모드 없음, 처음부터만)
  function showEndAgain() { E.ending = true; E.endT = 0; document.body.classList.add('ending'); if (window.GAME) GAME.park(); showEndCard(); }
  window.EXTRA = { X, E, init, showEndAgain, update, parts, heard, onOrder, onDeliver, finalReady, coinBurst, cakeHit, extraSpeed, heavy, charging, resetBoost, startEnding, endCam, closeDex, mapRings, _gifts: gifts, _rings: rings, _chains: chains, _collect: g => collectGift(g), _pass: (r, now) => passRing(r, 1, now) };
})();
