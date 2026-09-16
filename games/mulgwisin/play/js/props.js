/* props.js — 물길 따라 놓인 것들
 * 버려진 캠핑 흔적·경고판·구명환·추모 자리(풍경), 물속에 가라앉은 유품(수집),
 * 석등 셋에 불 붙이기(퍼즐 → 쉼터), 수문 바퀴 돌려 급류 잠재우기(퍼즐) */
(function () {
  const W = window.WORLD;
  const EN = /[?&]lang=en/.test(location.search);
  const PR = {};
  W.used = new Set(); W.props = [];

  function mkRnd(seed) { let s = Math.abs(seed | 0) % 2147483647 || 1; return () => (s = s * 16807 % 2147483647, (s - 1) / 2147483646); }
  const bankX = (z, s, off) => W.cx(z) + s * (W.hw(z) + off);
  const faceDown = s => Math.atan2(-s, -1);   // 강 가운데와 아래쪽(오는 사람) 사이를 본다

  // ── 재질 ──
  const L = (color, o) => new THREE.MeshLambertMaterial(Object.assign({ color }, o || {}));
  const M = {
    stone: L(0x7d7f77, { flatShading: true }), stoneDk: L(0x55584f, { flatShading: true }), moss: L(0x46513e, { flatShading: true }),
    concrete: L(0x6f746f, { flatShading: true }), rust: L(0x6b4331), steel: L(0x4b5459),
    wood: L(0x5a4430), woodLt: L(0x7b6242), woodDk: L(0x3a2c1e),
    tent: L(0x9a5b2c, { side: THREE.DoubleSide, flatShading: true }), tentIn: L(0x1e150e, { side: THREE.DoubleSide }),
    cooler: L(0x2d6893), coolerLid: L(0xd8d4c8), tube: L(0xc94c7a, { flatShading: true }), slipper: L(0x2f5fae),
    cloth: L(0x3c5b40, { side: THREE.DoubleSide }), black: L(0x1b1b1b), pot: L(0x9aa0a4),
    flower: L(0xebe6d2, { emissive: 0x2a2820 }), paper: L(0xdcd8cc, { side: THREE.DoubleSide }), stem: L(0x3b5a2b),
    bottle: new THREE.MeshLambertMaterial({ color: 0x2f8050, transparent: true, opacity: .78 }),
    candle: L(0xf1ebd8, { emissive: 0x3a3020 }),
    gold: new THREE.MeshPhongMaterial({ color: 0xd9b25e, shininess: 90, specular: 0xffe6a8, emissive: 0x3a2a08 }),
    silver: new THREE.MeshPhongMaterial({ color: 0xc9cdd1, shininess: 90, specular: 0xffffff, emissive: 0x22262a }),
    glass: new THREE.MeshPhongMaterial({ color: 0x5aa0e0, shininess: 120, specular: 0xffffff, emissive: 0x10305a, transparent: true, opacity: .85 }),
  };

  // ── 그림(캔버스) ──
  function canvasTex(w, h, draw) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t; }
  const shadowTex = canvasTex(64, 64, (c) => { const g = c.createRadialGradient(32, 32, 4, 32, 32, 32); g.addColorStop(0, 'rgba(0,0,0,.75)'); g.addColorStop(.6, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); });
  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: .55 });
  const shadowGeo = (() => { const g = new THREE.PlaneGeometry(1, 1); g.rotateX(-Math.PI / 2); return g; })();
  function blob(parent, x, y, z, sx, sz) { const m = new THREE.Mesh(shadowGeo, shadowMat); m.position.set(x, y + .03, z); m.scale.set(sx, 1, sz || sx); parent.add(m); return m; }

  function signTex(big, small) {
    return canvasTex(256, 168, (c, w, h) => {
      c.fillStyle = '#e9e6dc'; c.fillRect(0, 0, w, h);
      const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(60,40,20,.28)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#b8231b'; c.lineWidth = 12; c.strokeRect(10, 10, w - 20, h - 20);
      c.fillStyle = '#b8231b'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = '900 ' + (EN ? 38 : 52) + 'px "Malgun Gothic", sans-serif'; c.fillText(big, w / 2, 66);
      c.fillStyle = '#26221c'; c.font = '700 ' + (EN ? 20 : 24) + 'px "Malgun Gothic", sans-serif'; c.fillText(small, w / 2, 122);
      for (let i = 0; i < 26; i++) { c.fillStyle = 'rgba(90,50,20,' + (Math.random() * .25) + ')'; c.beginPath(); c.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 6, 0, 6.283); c.fill(); }   // 녹물 얼룩
    });
  }
  const SIGN_SWIM = signTex(EN ? 'NO SWIMMING' : '수영금지', EN ? 'DROWNINGS REPORTED' : '익사사고 다발지역');
  const SIGN_RAPID = signTex(EN ? 'DANGER' : '급류 위험', EN ? 'STRONG CURRENT' : '물살이 셉니다');
  // 콘크리트 — 물때 줄과 아래쪽 이끼
  const concTex = canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#8b8f89'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) { c.fillStyle = 'rgba(' + (Math.random() < .5 ? '40,44,40' : '170,172,165') + ',' + Math.random() * .12 + ')'; c.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 5, 2 + Math.random() * 5); }
    for (let i = 0; i < 14; i++) { const x = Math.random() * w, len = 30 + Math.random() * 90; const g = c.createLinearGradient(0, 0, 0, len); g.addColorStop(0, 'rgba(30,30,26,.35)'); g.addColorStop(1, 'rgba(30,30,26,0)'); c.fillStyle = g; c.fillRect(x, 0, 2 + Math.random() * 4, len); }
    const m = c.createLinearGradient(0, h * .7, 0, h); m.addColorStop(0, 'rgba(40,60,40,0)'); m.addColorStop(1, 'rgba(40,60,36,.7)'); c.fillStyle = m; c.fillRect(0, h * .7, w, h * .3);
  });
  M.concrete = new THREE.MeshLambertMaterial({ map: concTex, color: 0x9a9e98 });
  // 녹슨 철판 — 가로 보강대와 흘러내린 녹
  const rustTex = canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#5a3a2a'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) { const v = Math.random(); c.fillStyle = v < .4 ? 'rgba(140,70,30,.25)' : v < .7 ? 'rgba(30,24,20,.3)' : 'rgba(90,96,96,.2)'; c.beginPath(); c.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 4, 0, 6.283); c.fill(); }
    for (let i = 0; i < 18; i++) { const x = Math.random() * w; c.fillStyle = 'rgba(150,72,28,.35)'; c.fillRect(x, Math.random() * h * .5, 2, 20 + Math.random() * 60); }
    for (const y of [22, 64, 106]) { c.fillStyle = 'rgba(20,16,14,.7)'; c.fillRect(0, y + 4, w, 3); c.fillStyle = 'rgba(120,110,100,.45)'; c.fillRect(0, y, w, 4); for (let x = 6; x < w; x += 16) { c.fillStyle = 'rgba(30,24,20,.8)'; c.beginPath(); c.arc(x, y + 2, 1.6, 0, 6.283); c.fill(); } }
  });
  M.rust = new THREE.MeshLambertMaterial({ map: rustTex, color: 0xc8a894 });
  // 수문 아래로 쏟아지는 물 — 세로 물줄기, 흘러내리게 움직인다
  const foamTex = canvasTex(128, 256, (c, w, h) => {
    c.filter = 'blur(2px)';
    for (let i = 0; i < 90; i++) { const x = Math.random() * w, y = Math.random() * h, l = 40 + Math.random() * 120, bw = 3 + Math.random() * 8; const g = c.createLinearGradient(0, y, 0, y + l); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(235,245,248,' + (.25 + Math.random() * .5) + ')'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(x, y, bw, l); c.save(); c.translate(0, -h); c.fillRect(x, y, bw, l); c.restore(); }
  });
  // 추모 자리 사진 — 빛바랜 흑백 증명사진
  const photoMat = L(0xffffff, { map: canvasTex(64, 84, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#cfc6b4'); g.addColorStop(1, '#9d937f'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#2e2a24'; c.beginPath(); c.ellipse(32, 34, 13, 16, 0, 0, 6.283); c.fill();   // 머리
    c.beginPath(); c.moveTo(6, h); c.quadraticCurveTo(10, 56, 32, 54); c.quadraticCurveTo(54, 56, 58, h); c.fill();   // 어깨
    c.fillStyle = '#5a5246'; c.beginPath(); c.ellipse(32, 38, 9, 11, 0, 0, 6.283); c.fill();   // 얼굴(어둡게 바랜)
    c.strokeStyle = '#1a1814'; c.lineWidth = 5; c.strokeRect(0, 0, w, h);
    c.fillStyle = '#1a1814'; c.beginPath(); c.moveTo(0, 0); c.lineTo(18, 0); c.lineTo(0, 18); c.fill(); c.beginPath(); c.moveTo(w, 0); c.lineTo(w - 18, 0); c.lineTo(w, 18); c.fill();   // 검은 띠
  }) });
  foamTex.wrapS = foamTex.wrapT = THREE.RepeatWrapping;
  const buoyTex =canvasTex(128, 16, (c) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#ece8de' : '#d8602a'; c.fillRect(i * 16, 0, 16, 16); } });
  const buoyMat = L(0xffffff, { map: buoyTex });
  // 비석 새김 글씨 — 석등 퍼즐 힌트(2026-09-16 사장님 "비석에서 힌트를 줘야 돼, 어두워서 안 보인다")
  // 한글은 옛 비석처럼 세로쓰기(오른쪽 줄부터), 영문은 가로. 글꼴(Griun)을 받은 뒤 다시 그린다
  const STELE_LINES = EN ? ['LIGHT', 'THE THREE', 'DARK', 'LANTERNS', 'WITH', 'YOUR FLAME'] : ['꺼진 석등 셋', '등불로 밝히면', '넋이 쉬어 가리라'];
  function drawStele(c, w, h) {
    c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffd89a'; c.shadowColor = 'rgba(255,190,110,.9)'; c.shadowBlur = 6; c.textAlign = 'center'; c.textBaseline = 'middle';
    if (EN) {
      c.font = '44px Griun, "Noto Sans KR", sans-serif';
      STELE_LINES.forEach((t, i) => c.fillText(t, w / 2, 70 + i * 74, w - 24));
    } else {
      const cols = STELE_LINES.length, gap = w / (cols + 1), size = 58;
      c.font = size + 'px Griun, "Noto Sans KR", sans-serif';
      STELE_LINES.forEach((t, ci) => {   // 오른쪽 줄부터 내려 읽는다
        const x = w - gap * (ci + 1), chars = [...t], step = Math.min(size * 1.05, (h - 60) / chars.length);
        chars.forEach((ch, k) => { if (ch !== ' ') c.fillText(ch, x, 40 + k * step + step / 2); });
      });
    }
  }
  const steleTex = canvasTex(256, 512, drawStele);
  if (document.fonts && document.fonts.load) document.fonts.load('40px Griun', '석등').then(() => { drawStele(steleTex.image.getContext('2d'), 256, 512); steleTex.needsUpdate = true; }).catch(() => { });
  const steleMat = new THREE.MeshLambertMaterial({ color: 0x4e504b, emissive: 0xffffff, emissiveMap: steleTex, emissiveIntensity: .5 });   // 캄캄해도 글씨가 희미하게 읽힌다
  const starTex = canvasTex(64, 64, (c) => { c.translate(32, 32); const g = c.createRadialGradient(0, 0, 0, 0, 0, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,245,210,.6)'); g.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = g; for (const a of [0, Math.PI / 2]) { c.save(); c.rotate(a); c.beginPath(); c.moveTo(-30, 0); c.lineTo(0, -3); c.lineTo(30, 0); c.lineTo(0, 3); c.fill(); c.restore(); } c.beginPath(); c.arc(0, 0, 9, 0, 6.283); c.fill(); });

  const mesh = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(m); return m; };
  const flameSprite = (col, sc) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: W.glowTex(), color: col, transparent: true, opacity: .9, depthWrite: false })); s.scale.set(sc, sc * 1.3, 1); return s; };

  // ── 급류 구간 — 물길이 좁아 물살이 센 곳 ──
  const ZONES = [];
  { let s = null; for (let z = 30; z < W.END - 40; z += 2) { const r = W.hw(z) < 13.5 * W.HWK; if (r && s === null) s = z; if (!r && s !== null) { if (z - s >= 14 * W.ZS) ZONES.push({ z0: s, z1: z }); s = null; } } }
  const nearMark = (z, pad) => W.MARKS.some(m => Math.abs(m.z - z) < pad);
  const SLUICE = ZONES.filter(zn => !W.MARKS.some(m => m.t !== 'seonang' && m.z > zn.z0 - 14 * W.ZS && m.z < zn.z1 + 14 * W.ZS))
    .map((zn, i) => ({ i, id: 'S' + i, z0: zn.z0, z1: zn.z1, s: i % 2 ? 1 : -1, wz: zn.z0 - 6, gz: zn.z1 + 4, prog: 0, k: 0 }));
  PR.SLUICE = SLUICE;
  W.calmAt = function (z) { for (const sl of SLUICE) if (z > sl.z0 - 14 && z < sl.gz + .5) return 1 - sl.k * .88; return 1; };

  // ── 석등 자리 — 서낭당 사이, 셋 다 밝히면 쉼터가 된다 ──
  const SITES = [390, 860, 1345].map(z => Math.round(z * W.ZS)).map((z0, i) => {
    let z = z0; while (nearMark(z, 26) || SLUICE.some(sl => z > sl.z0 - 30 && z < sl.gz + 30)) z += 12;
    const s = i % 2 ? -1 : 1;
    const st = { x: bankX(z, s, 3.4), z };
    const lan = [
      { x: bankX(z - 15, s, 1.9), z: z - 15 },
      { x: bankX(z + 3, -s, 2.3), z: z + 3 },      // 건너편 물가
      { x: bankX(z + 18, s, 4.6), z: z + 18 },     // 바위 뒤
    ];
    return { i, id: 'K' + i, z, s, st, lan };
  });
  PR.SITES = SITES;

  // ── 물속 유품 ──
  const RELIC_KIND = [
    { ko: '반지', en: 'RING' }, { ko: '동전', en: 'COIN' }, { ko: '머리핀', en: 'HAIRPIN' }, { ko: '손목시계', en: 'WATCH' },
    { ko: '안경', en: 'GLASSES' }, { ko: '호루라기', en: 'WHISTLE' }, { ko: '열쇠', en: 'KEY' }, { ko: '구슬', en: 'MARBLE' },
  ];
  const RELICS = [];
  { const rn = mkRnd(4242), N = 28, span = (W.END - 90) / N;
    for (let k = 0; k < N; k++) {
      let z = 50 + (k + .15 + rn() * .7) * span, x = 0, ok = false;
      for (let t = 0; t < 12 && !ok; t++) { x = W.cx(z) + (rn() - .5) * 1.5 * W.hw(z); ok = W.terrainH(x, z) < -.06 && !nearMark(z, 12); if (!ok) z += 3; }
      RELICS.push({ i: k, id: 'r' + k, x, z, kind: RELIC_KIND[k % 8] });
    } }
  PR.RELIC_N = RELICS.length; PR.RELICS = RELICS;
  // 유품 자막 — 종류(8) × 몇 번째로 주웠나(최대 4). 번호 = 종류 + 8 × 앞서 주운 같은 종류 수 (2026-09-16 사장님 수정안)
  const RELIC_SUBS = EN ? [
    ['I found a ring.', 'It still looks new...'],
    ['A rusty coin.', 'Has it been here a long time?'],
    ['A hairpin.', 'Did a child wear it?'],
    ['A stopped wristwatch.', '3:17...'],
    ['A pair of glasses.', 'What were they looking at?'],
    ['A whistle.', 'Was someone calling for help?'],
    ['A key.', 'Is there still a door it can open?'],
    ['A glass marble.', 'Did a child lose it?'],
    ['Another ring.', 'The same shape...'],
    ['Another rusty coin.', 'Why do they keep turning up?'],
    ['Another hairpin.', 'Just like the last one.'],
    ['Another stopped watch.', '3:17 again...'],
    ['More glasses.', 'Is someone throwing things into this river?'],
    ['Another whistle.', 'Did I just... hear it?'],
    ['Another key.', 'Is there a house under this river?'],
    ['Another marble.', "Unless it wasn't just one child..."],
    ['A third ring.', "There's a finger mark on this one."],
    ['A third coin.', 'Did someone pick it up underwater?'],
    ['A third hairpin.', 'This one is still wet.'],
    ['A third watch.', 'They all stopped at 3:17.'],
    ['A third pair of glasses.', 'Something strange in the lens.'],
    ['A third whistle.', 'Someone just blew it behind me.'],
    ['A third key.', "It isn't a key I'm looking for."],
    ['A third marble.', 'I think a child is standing over there...'],
    ['A fourth ring.', 'I know this ring.'],
    ['A fourth coin.', 'This coin... I dropped it?'],
    ['A fourth hairpin.', "I'm sure I just saw it."],
    ['A fourth wristwatch.', 'Every one stopped at the same time.'],
  ] : [
    ['반지를 주웠다', '아직 새것 같은데...'],
    ['녹슨 동전을 주웠다', '오래전부터 여기 있었던 걸까'],
    ['머리핀을 주웠다', '아이가 쓰던 것일까'],
    ['멈춘 손목시계를 주웠다', '3시 17분...'],
    ['안경을 주웠다', '이걸 쓰고 무엇을 보고 있었을까'],
    ['호루라기를 주웠다', '누군가 구조를 요청했던 걸까'],
    ['열쇠를 주웠다', '아직 열 수 있는 문이 있을까'],
    ['유리구슬을 주웠다', '아이가 잃어버린 걸까'],
    ['또 반지다', '같은 모양인데...'],
    ['또 녹슨 동전이다', '왜 계속 나오는 거지?'],
    ['또 머리핀이다', '아까 그거와 똑같다'],
    ['또 멈춘 시계다', '이번에도 3시 17분...'],
    ['또 안경이다', '누군가 계속 이 강에 물건을 버리는 걸까'],
    ['또 호루라기다', '방금... 소리가 난 것 같은데'],
    ['또 열쇠다', '이 강 아래에 집이라도 있는 걸까'],
    ['또 유리구슬이다', '아이 한 명이 아니라면...'],
    ['세 번째 반지다', '이번엔 손가락 자국이 남아 있다'],
    ['세 번째 동전이다', '물속에서 누군가 주운 걸까'],
    ['세 번째 머리핀이다', '이건 아직 젖어 있다'],
    ['세 번째 시계다', '3시 17분에 모두 멈췄다'],
    ['세 번째 안경이다', '렌즈에 이상한 게 비친다'],
    ['세 번째 호루라기다', '누가 방금 내 뒤에서 불었어'],
    ['세 번째 열쇠다', '내가 찾고 있는 건 열쇠가 아닌 것 같다'],
    ['세 번째 유리구슬이다', '저쪽에 아이가 서 있는 것 같은데...'],
    ['네 번째 반지다', '이건 내가 아는 반지다'],
    ['네 번째 동전이다', '이 동전... 내가 떨어뜨린 건데?'],
    ['네 번째 머리핀이다', '분명히 방금 전에도 봤다'],
    ['네 번째 손목시계다', '시계가 멈춘 시간이 모두 같다'],
  ];

  PR.relicCount = () => RELICS.reduce((n, r) => n + (W.used.has(r.id) ? 1 : 0), 0);

  // ── 풍경 소품 (칸마다 씨앗으로) ──
  function sceneryPlan(ci, z0, z1) {
    const rn = mkRnd(9001 + (ci + 50) * 131), out = [];
    if (ci < 0 || z0 > W.END - 40) return out;
    const busy = z => nearMark(z, 17) || (W.puzBusy && W.puzBusy(z)) || W.CHARM_SPOTS.some(c => Math.abs(c.z - z) < 4) || SITES.some(s => Math.abs(s.z - z) < 25) || SLUICE.some(sl => Math.abs(sl.wz - z) < 6 || Math.abs(sl.gz - z) < 6);
    const K = 7;
    for (let k = 0; k < K; k++) {
      const z = z0 + (k + .2 + rn() * .6) * ((z1 - z0) / K), s = rn() < .5 ? -1 : 1, r = rn();
      if (busy(z) || z < 20) continue;
      const rapid = SLUICE.some(sl => z > sl.z0 - 40 && z < sl.z0 + 10);
      const type = rapid && r < .35 ? 'rapidsign' : r < .15 ? 'tent' : r < .25 ? 'sign' : r < .34 ? 'buoy' : r < .47 ? 'memorial' : r < .6 ? 'pyeong' : r < .72 ? 'tube' : r < .86 ? 'fishing' : 'cooler';
      out.push({ id: 'p' + ci + '_' + k, type, z, s, off: 1.2 + rn() * 3.2, rot: rn() });
    }
    return out;
  }

  PR.plan = sceneryPlan;   // 시험용

  // 비탈에 놓으면 한쪽이 뜨므로 둘레에서 가장 낮은 땅에 맞춘다
  function groundMin(x, z, r) { let h = W.terrainH(x, z); for (let i = 0; i < 6; i++) { const a = i * 1.047; h = Math.min(h, W.terrainH(x + Math.cos(a) * r, z + Math.sin(a) * r)); } return h; }
  const tentTex = canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#b07038'; c.fillRect(0, 0, w, h);
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,220,170,.22)'); g.addColorStop(.6, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(40,30,20,.65)'); c.fillStyle = g; c.fillRect(0, 0, w, h);   // 위는 빛바래고 아래는 흙탕
    for (let i = 1; i < 4; i++) { c.fillStyle = 'rgba(60,34,16,.5)'; c.fillRect(i * w / 4, 0, 2, h); }   // 솔기
    c.fillStyle = 'rgba(230,200,120,.55)'; c.fillRect(0, h * .08, w, 5);   // 용마루 띠
    for (let i = 0; i < 70; i++) { c.fillStyle = 'rgba(40,28,18,' + Math.random() * .28 + ')'; c.beginPath(); c.arc(Math.random() * w, h * .55 + Math.random() * h * .45, 1 + Math.random() * 6, 0, 6.283); c.fill(); }
  });
  M.tent = new THREE.MeshLambertMaterial({ map: tentTex, color: 0xb8a090, side: THREE.DoubleSide, flatShading: true });
  // 삼각 텐트 — 앞은 1.36m 로 서 있고 뒤는 0.7m 로 꺼졌다. 앞면은 비워 두고 입구·덮개를 따로 붙인다
  let _tentGeo = null;
  function tentGeo() {
    if (_tentGeo) return _tentGeo;
    const FL = [-.95, 0, 1.1], FR = [.95, 0, 1.1], FT = [0, 1.36, 1.1], BL = [-.95, 0, -1.1], BR = [.95, 0, -1.1], BT = [.05, .7, -1.1], MT = [-.02, 1.02, -.1];
    const tri = [], uv = [];
    const face = (a, b, c, ua, ub, uc) => { tri.push(...a, ...b, ...c); uv.push(...ua, ...ub, ...uc); };
    // 왼쪽 지붕 (가운데가 한 번 꺾여 처졌다)
    face(FL, BL, MT, [0, 0], [1, 0], [.5, 1]); face(FL, MT, FT, [0, 0], [.5, 1], [0, 1]); face(BL, BT, MT, [1, 0], [1, 1], [.5, 1]);
    face(FR, MT, BR, [0, 0], [.5, 1], [1, 0]); face(FR, FT, MT, [0, 0], [0, 1], [.5, 1]); face(BR, MT, BT, [1, 0], [.5, 1], [1, 1]);
    face(BL, BR, BT, [0, 0], [1, 0], [.5, .6]);   // 뒷벽
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(tri, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
    return (_tentGeo = g);
  }
  const tentDoorGeo = (() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-.93, 0, 0, .93, 0, 0, 0, 1.33, 0], 3)); g.computeVertexNormals(); return g; })();
  const tentFlapGeo = (() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 1.3, 0, -.93, 0, 0, -.45, .05, .55], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([.5, 1, 0, 0, .3, 0], 2)); g.computeVertexNormals(); return g; })();   // 걷어 올린 덮개

  // ── 짓기 ──
  const B = {
    tent(p, g, u) {
      const x = bankX(p.z, p.s, p.off + 1), y = groundMin(x, p.z, 1.5) - .08, grp = new THREE.Group(); grp.position.set(x, y, p.z); grp.rotation.y = -p.s * Math.PI / 2 + (p.rot - .5) * .6; g.add(grp);
      mesh(tentGeo(), M.tent, 0, 0, 0, grp);   // 뒤쪽 폴대가 부러져 주저앉은 삼각 텐트
      mesh(tentDoorGeo, M.tentIn, 0, 0, 1.08, grp);   // 열린 입구 — 안이 캄캄하다
      const flap = new THREE.Group(); flap.position.set(-.02, 0, 1.12); grp.add(flap);
      mesh(tentFlapGeo, M.tent, 0, 0, 0, flap);
      mesh(new THREE.CylinderGeometry(.025, .025, 1.36, 5), M.black, 0, .68, 1.13, grp);   // 앞 폴대
      mesh(new THREE.CylinderGeometry(.006, .006, 1.64, 3), M.paper, 0, .68, 1.59, grp).rotation.x = -.594;   // 폴대 꼭대기에서 팩까지 당긴 줄
      mesh(new THREE.CylinderGeometry(.015, .015, .18, 4), M.steel, 0, .05, 2.05, grp);
      const chair = new THREE.Group(); chair.position.set(2.1, .22, 1.9); chair.rotation.set(-1.35, -.6, 0); grp.add(chair);   // 뒤로 넘어간 의자
      mesh(new THREE.BoxGeometry(.46, .04, .44), M.cloth, 0, .42, 0, chair); mesh(new THREE.BoxGeometry(.46, .5, .03), M.cloth, 0, .68, -.22, chair).rotation.x = -.2;
      for (const a of [-1, 1]) { mesh(new THREE.CylinderGeometry(.015, .015, .62, 4), M.black, a * .2, .2, 0, chair).rotation.x = .75; mesh(new THREE.CylinderGeometry(.015, .015, .62, 4), M.black, a * .2, .2, 0, chair).rotation.x = -.75; }
      mesh(new THREE.CylinderGeometry(.13, .15, .1, 10), M.black, -1.4, .05, 1.2, grp); mesh(new THREE.CylinderGeometry(.14, .12, .16, 10), M.pot, -1.4, .2, 1.2, grp);   // 버너·코펠
      blob(grp, 0, 0, 0, 2.8, 3.2); blob(grp, 2.1, 0, 1.9, .9);
      u.props.push({ kind: 'tent', id: p.id, x, z: p.z, flap, k: W.used.has(p.id) ? 1 : 0 }); if (W.used.has(p.id)) flap.rotation.y = -1.3;
      u.rocks.push({ x, z: p.z, r: 1.15 + 1.7 });
    },
    sign(p, g, u, tex) {
      const x = bankX(p.z, p.s, p.off * .5 + .8), y = groundMin(x, p.z, .7), grp = new THREE.Group(); grp.position.set(x, y, p.z); grp.rotation.y = faceDown(p.s) + (p.rot - .5) * .3; g.add(grp);
      for (const a of [-1, 1]) mesh(new THREE.CylinderGeometry(.045, .055, 2.1, 6), M.steel, a * .62, 1.05, -.04, grp);
      const board = mesh(new THREE.PlaneGeometry(1.5, .98), new THREE.MeshLambertMaterial({ map: tex || SIGN_SWIM, emissive: 0xffffff, emissiveMap: tex || SIGN_SWIM, emissiveIntensity: .07 }), 0, 1.55, 0, grp);
      board.rotation.z = (p.rot - .5) * .12;
      mesh(new THREE.BoxGeometry(1.54, 1.02, .04), M.steel, 0, 1.55, -.03, grp).rotation.z = board.rotation.z;
      blob(grp, 0, 0, 0, 1.8, .6);
      u.rocks.push({ x, z: p.z, r: .3 + 1.7 });
    },
    rapidsign(p, g, u) { B.sign(p, g, u, SIGN_RAPID); },
    buoy(p, g, u) {
      const x = bankX(p.z, p.s, p.off * .5 + .6), y = groundMin(x, p.z, .7), grp = new THREE.Group(); grp.position.set(x, y, p.z); grp.rotation.y = faceDown(p.s); g.add(grp);
      mesh(new THREE.CylinderGeometry(.06, .08, 2.3, 6), M.woodDk, 0, 1.15, 0, grp);
      mesh(new THREE.BoxGeometry(.5, .5, .06), M.rust, 0, 1.75, .07, grp);
      const ring = mesh(new THREE.TorusGeometry(.33, .085, 8, 24), buoyMat, 0, 1.5, .17, grp); ring.rotation.z = .3;
      if (p.rot < .35) { ring.position.set(.55, .09, .6); ring.rotation.set(-Math.PI / 2 + .15, 0, 0); }   // 걸이에서 떨어져 바닥에 뒹군다
      mesh(new THREE.CylinderGeometry(.03, .03, .16, 5), M.steel, 0, 1.86, .1, grp).rotation.x = Math.PI / 2;   // 걸이 못
      blob(grp, 0, 0, 0, 1.1);
      u.rocks.push({ x, z: p.z, r: .25 + 1.7 });
    },
    memorial(p, g, u) {
      const x = bankX(p.z, p.s, p.off * .6 + .6), y = groundMin(x, p.z, .7), grp = new THREE.Group(); grp.position.set(x, y, p.z); grp.rotation.y = faceDown(p.s); grp.scale.setScalar(1.45); g.add(grp);
      const rock = mesh(new THREE.DodecahedronGeometry(.62, 0), M.stoneDk, 0, .2, 0, grp); rock.scale.set(1.25, .5, .95); rock.rotation.y = p.rot * 3;
      const top = .47;
      const wrap = mesh(new THREE.ConeGeometry(.08, .34, 8, 1, true), M.paper, -.3, top + .05, .05, grp); wrap.rotation.set(0, .4, Math.PI / 2);   // 눕혀 둔 국화 다발 — 좁은 끝이 바깥
      for (let i = 0; i < 9; i++) { const f = mesh(new THREE.IcosahedronGeometry(.055, 1), M.flower, -.12 + Math.cos(i * 2.4) * .06 + i * .012, top + .07 + (i % 3) * .025, .12 + Math.sin(i * 2.4) * .08, grp); f.scale.set(1, .75, 1); }
      for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(.005, .005, .18, 3), M.stem, -.2 + i * .02, top + .05, .05 + (i - 1.5) * .03, grp).rotation.z = Math.PI / 2;
      const bt = new THREE.Group(); bt.position.set(.3, top, -.12); grp.add(bt);
      mesh(new THREE.CylinderGeometry(.045, .045, .2, 10), M.bottle, 0, .1, 0, bt); mesh(new THREE.CylinderGeometry(.016, .03, .09, 8), M.bottle, 0, .245, 0, bt);
      mesh(new THREE.BoxGeometry(.22, .28, .02), M.black, 0, top + .16, -.3, grp).rotation.x = -.25;   // 사진틀
      mesh(new THREE.PlaneGeometry(.16, .21), photoMat, 0, top + .165, -.288, grp).rotation.x = -.25;
      const cd = mesh(new THREE.CylinderGeometry(.035, .038, .14, 10), M.candle, .08, top + .07, .22, grp);
      const fl = flameSprite(0xffb050, .22); fl.position.set(.08, top + .22, .22); grp.add(fl);
      const li = new THREE.PointLight(0xffa850, 0, 9, 1.8); li.position.set(.08, top + .4, .22); grp.add(li);
      blob(grp, 0, 0, 0, 1.9, 1.5);
      const lit = W.used.has(p.id); fl.visible = li.visible = lit; li.intensity = lit ? 1.6 : 0;
      u.props.push({ kind: 'memorial', id: p.id, x, z: p.z, fl, li });
      u.rocks.push({ x, z: p.z, r: .8 + 1.7 });
    },
    pyeong(p, g, u) {   // 계곡 평상 — 올라설 수 있다
      const x = bankX(p.z, p.s, p.off + .6), y = groundMin(x, p.z, .7), grp = new THREE.Group(); grp.position.set(x, y, p.z); grp.rotation.y = p.rot * .6; g.add(grp);
      for (let i = 0; i < 7; i++) mesh(new THREE.BoxGeometry(2.1, .07, .31), i % 2 ? M.woodLt : M.wood, 0, .56, -1.02 + i * .34, grp).rotation.z = (i % 3 - 1) * .01;
      for (const a of [-1, 1]) for (const b of [-1, 1]) mesh(new THREE.BoxGeometry(.11, .54, .11), M.woodDk, a * .95, .27, b * 1.05, grp);
      for (const a of [-1, 1]) mesh(new THREE.BoxGeometry(.09, .09, 2.2), M.woodDk, a * .95, .47, 0, grp);
      mesh(new THREE.BoxGeometry(.11, .03, .26), M.slipper, .32, .015, 1.35, grp).rotation.y = .3; mesh(new THREE.BoxGeometry(.11, .03, .26), M.slipper, .55, .015, 1.5, grp).rotation.y = -.5;   // 벗어 둔 슬리퍼
      blob(grp, 0, 0, 0, 2.6, 2.8);
      u.decks.push({ x, z: p.z, r: 1.05, y: y + .6 });
    },
    tube(p, g, u) {
      const x = W.cx(p.z) + p.s * W.hw(p.z) * (.5 + p.rot * .3), rgrp = new THREE.Group(); rgrp.position.set(x, 0, p.z); g.add(rgrp);
      const rock = mesh(new THREE.DodecahedronGeometry(.75, 0), M.moss, 0, W.terrainH(x, p.z) + .15, 0, rgrp); rock.scale.set(1.2, .8, 1); rock.rotation.set(p.rot * 3, p.rot * 5, 0);
      const t = new THREE.Group(); t.position.set(-p.s * .2, 0, -1.05); rgrp.add(t);   // 바위에 걸린 튜브
      const tor = mesh(new THREE.TorusGeometry(.42, .17, 10, 20), M.tube, 0, 0, 0, t); tor.rotation.x = -Math.PI / 2 + .35;
      mesh(new THREE.BoxGeometry(.11, .03, .26), M.slipper, .9, 0, -.5, rgrp).rotation.y = 1.1;
      u.props.push({ kind: 'float', x, z: p.z, obj: t, base: 0 });
      u.rocks.push({ x, z: p.z, r: .8 + 1.7 });
    },
    fishing(p, g, u) {
      const x = bankX(p.z, p.s, .9), y = groundMin(x, p.z, .7), grp = new THREE.Group(); grp.position.set(x, y, p.z); grp.rotation.y = -p.s * Math.PI / 2; g.add(grp);
      mesh(new THREE.BoxGeometry(.42, .04, .4), M.cloth, 0, .3, -.5, grp); mesh(new THREE.BoxGeometry(.42, .42, .03), M.cloth, 0, .52, -.7, grp).rotation.x = -.25;
      for (const a of [-1, 1]) for (const b of [-1, 1]) mesh(new THREE.CylinderGeometry(.013, .013, .32, 4), M.black, a * .19, .15, -.5 + b * .18, grp);
      const rod = mesh(new THREE.CylinderGeometry(.008, .022, 3.2, 5), M.black, 0, .9, .7, grp); rod.rotation.x = 1.05;   // 꽂아 둔 낚싯대
      mesh(new THREE.CylinderGeometry(.003, .003, 2.4, 3), M.paper, 0, .5, 2.09, grp);   // 낚싯줄이 물로 늘어졌다
      mesh(new THREE.CylinderGeometry(.14, .11, .26, 10, 1, true), M.coolerLid, .45, .13, -.2, grp);   // 빈 양동이
      blob(grp, 0, 0, -.4, 1.2);
      u.rocks.push({ x, z: p.z, r: .3 + 1.7 });
    },
    cooler(p, g, u) {
      const x = bankX(p.z, p.s, p.off * .7 + .5), y = groundMin(x, p.z, .7), grp = new THREE.Group(); grp.position.set(x, y, p.z); grp.rotation.set(0, p.rot * 6, .08); g.add(grp);
      mesh(new THREE.BoxGeometry(.64, .36, .4), M.cooler, 0, .18, 0, grp);
      mesh(new THREE.BoxGeometry(.655, .05, .415), M.coolerLid, 0, .3, 0, grp);   // 흰 띠
      for (const a of [-1, 1]) mesh(new THREE.BoxGeometry(.04, .06, .18), M.black, a * .34, .27, 0, grp);   // 손잡이
      const lid = new THREE.Group(); lid.position.set(0, .36, -.2); lid.rotation.x = -.5; grp.add(lid);   // 뚜껑이 들린 채
      mesh(new THREE.BoxGeometry(.66, .07, .42), M.coolerLid, 0, .035, .21, lid);
      mesh(new THREE.CylinderGeometry(.035, .035, .12, 8), M.pot, .9, .06, .3, grp).rotation.z = 1.57;   // 굴러간 캔
      blob(grp, 0, 0, 0, 1.1, .8);
      u.rocks.push({ x, z: p.z, r: .38 + 1.7 });
    },
  };

  function buildStoneLantern(g, x, z, lit) {
    const y = groundMin(x, z, .6), grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = x * .7; g.add(grp);
    mesh(new THREE.CylinderGeometry(.5, .58, .24, 8), M.stone, 0, .12, 0, grp);
    mesh(new THREE.CylinderGeometry(.34, .46, .2, 8), M.stone, 0, .34, 0, grp);           // 연꽃 받침
    mesh(new THREE.CylinderGeometry(.14, .16, .78, 8), M.stone, 0, .83, 0, grp);
    mesh(new THREE.CylinderGeometry(.46, .34, .16, 8), M.stone, 0, 1.3, 0, grp);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + .785; mesh(new THREE.BoxGeometry(.1, .44, .1), M.stone, Math.cos(a) * .25, 1.6, Math.sin(a) * .25, grp); }
    const dish = mesh(new THREE.CylinderGeometry(.14, .1, .06, 10), M.stoneDk, 0, 1.42, 0, grp);
    mesh(new THREE.CylinderGeometry(.08, .62, .34, 8), M.stoneDk, 0, 1.98, 0, grp);          // 지붕돌
    mesh(new THREE.CylinderGeometry(.62, .58, .07, 8), M.stone, 0, 1.81, 0, grp);
    mesh(new THREE.SphereGeometry(.1, 8, 6), M.stone, 0, 2.2, 0, grp);
    const moss = mesh(new THREE.DodecahedronGeometry(.3, 0), M.moss, .35, .1, .2, grp); moss.scale.y = .4;
    const fl = flameSprite(0xffa040, .7); fl.position.y = 1.6; grp.add(fl);
    const li = new THREE.PointLight(0xffa850, 0, 17, 1.7); li.position.y = 1.65; grp.add(li);
    blob(grp, 0, 0, 0, 1.6);
    fl.visible = li.visible = lit; li.intensity = lit ? 2.6 : 0;
    return { fl, li, dish };
  }

  PR.build = function (ci, z0, z1, chunk) {
    const u = chunk.userData; u.props = u.props || [];
    // 30m 띠마다 묶어 두고 멀면 통째로 감춘다 (그리는 횟수를 줄인다)
    const bands = new Map(), band = z => { const k = Math.floor(z / 30); if (!bands.has(k)) { const b = new THREE.Group(); chunk.add(b); bands.set(k, b); u.props.push({ kind: 'band', x: 0, z: (k + .5) * 30, obj: b }); } return bands.get(k); };
    for (const p of sceneryPlan(ci, z0, z1)) B[p.type](p, p.type === 'memorial' ? chunk : band(p.z), u);   // 빛을 품은 것은 띠에 안 넣는다 (빛 개수가 흔들리지 않게)
    // 석등 자리
    for (const site of SITES) {
      if (site.st.z >= z0 && site.st.z < z1) {
        const x = site.st.x, z = site.st.z, y = groundMin(x, z, .7), grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = faceDown(site.s); chunk.add(grp);
        mesh(new THREE.BoxGeometry(1.5, .3, .8), M.stoneDk, 0, .15, 0, grp);
        const sm = steleMat.clone();
        const slab = mesh(new THREE.BoxGeometry(.95, 1.7, .26), [M.stone, M.stone, M.stone, M.stone, sm, M.stone], 0, 1.15, 0, grp); slab.rotation.z = .03;
        mesh(new THREE.BoxGeometry(1.1, .16, .4), M.stoneDk, 0, 2.06, 0, grp);
        const li = new THREE.PointLight(0xffc070, 0, 34, 1.6); li.position.set(0, 3.4, 3.2); grp.add(li);
        const done = W.used.has(site.id); li.visible = done;
        blob(grp, 0, 0, 0, 2.4, 1.6);
        u.props.push({ kind: 'stele', id: site.id, site, x, z, li, sm, k: done ? 1 : 0 });
        u.rocks.push({ x, z, r: .6 + 1.7 });
      }
      site.lan.forEach((p, j) => {
        if (p.z < z0 || p.z >= z1) return;
        const id = site.id + '_' + j, lit = W.used.has(id);
        const o = buildStoneLantern(chunk, p.x, p.z, lit);
        u.props.push({ kind: 'lantern', id, site, x: p.x, z: p.z, fl: o.fl, li: o.li });
        u.rocks.push({ x: p.x, z: p.z, r: .45 + 1.7 });
        if (j === 2) for (let b = 0; b < 3; b++) {   // 물길에서 바로 안 보이게 가리는 바위
          const bx = p.x - site.s * (2.2 + b * .3), bz = p.z - 2.2 + b * 2.2, r = 1.1 + (b % 2) * .4;
          const rk = mesh(new THREE.DodecahedronGeometry(r, 0), b % 2 ? M.moss : M.stoneDk, bx, W.terrainH(bx, bz) + r * .45, bz, band(bz)); rk.rotation.set(b, b * 2, b * .5); rk.scale.y = .9 + b * .15;
          u.rocks.push({ x: bx, z: bz, r: r + 1.5 });
        }
      });
    }
    // 수문 — 물가 바퀴, 관, 위쪽 보
    for (const sl of SLUICE) {
      const closed = W.used.has(sl.id); if (closed) sl.k = 1;
      if (sl.wz >= z0 && sl.wz < z1) {
        const x = bankX(sl.wz, sl.s, 1.5), y = groundMin(x, sl.wz, .5), grp = new THREE.Group(); grp.position.set(x, y, sl.wz); band(sl.wz).add(grp);
        mesh(new THREE.BoxGeometry(.75, .66, .75), M.concrete, 0, .33, 0, grp);          // 받침 — 아이 허리께라야 손이 닿는다
        mesh(new THREE.CylinderGeometry(.05, .05, .34, 6), M.steel, 0, .8, 0, grp);
        const wheel = new THREE.Group(); wheel.position.y = .92; grp.add(wheel);
        mesh(new THREE.TorusGeometry(.44, .045, 6, 22), M.rust, 0, 0, 0, wheel).rotation.x = Math.PI / 2;
        for (let i = 0; i < 3; i++) mesh(new THREE.BoxGeometry(.88, .045, .045), M.rust, 0, 0, 0, wheel).rotation.y = i * 1.047;
        mesh(new THREE.CylinderGeometry(.08, .08, .09, 8), M.steel, 0, 0, 0, wheel);
        const held = W.used.has(sl.id + 'h') || closed;
        const grip = mesh(new THREE.CylinderGeometry(.03, .03, .22, 6), M.steel, .44, .11, 0, wheel); grip.visible = held;   // 손잡이 — 끼워야 돌아간다
        blob(grp, 0, 0, 0, 1.3);
        // 빠진 손잡이 — 바퀴에서 몇 걸음 떨어진 물가에 떨어져 있다. 주워서 끼워야 수문을 돌릴 수 있다
        const bz = sl.wz - 3.6, bx = bankX(bz, sl.s, 2.2), by = groundMin(bx, bz, .5) + .05;
        const bar = new THREE.Group(); bar.position.set(bx, by, bz); bar.rotation.set(0, .7, .06); band(bz).add(bar); bar.visible = !held;
        mesh(new THREE.CylinderGeometry(.032, .032, .52, 6), M.rust, 0, 0, 0, bar).rotation.z = Math.PI / 2;
        mesh(new THREE.CylinderGeometry(.05, .05, .1, 8), M.steel, -.27, 0, 0, bar).rotation.z = Math.PI / 2;   // 바퀴에 끼우는 쪽
        mesh(new THREE.CylinderGeometry(.04, .04, .14, 8), M.rust, .28, 0, 0, bar).rotation.z = Math.PI / 2;    // 쥐는 쪽
        const star = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, color: 0xfff0c0, transparent: true, opacity: 0, depthWrite: false, depthTest: false })); star.renderOrder = 4; star.scale.set(.55, .55, 1); star.visible = !held; band(bz).add(star);   // 주운 손잡이는 다시 지어도 반짝이지 않는다
        u.props.push({ kind: 'crank', id: sl.id + 'h', x: bx, y: by + .22, z: bz, bar, grip, star });
        u.props.push({ kind: 'wheel', id: sl.id, sl, x, z: sl.wz, wheel, grip, turn: 0 });
        u.rocks.push({ x, z: sl.wz, r: .45 + 1.7 });
      }
      for (let zz = sl.wz; zz < sl.gz; zz += 6) {   // 바퀴에서 보까지 물가를 따라가는 관
        if (zz < z0 || zz >= z1) continue;
        const z2 = Math.min(sl.gz, zz + 6), off = zz === sl.wz ? 1.5 : 1.0;
        const a = new THREE.Vector3(bankX(zz, sl.s, off), W.terrainH(bankX(zz, sl.s, off), zz) + .12, zz), b = new THREE.Vector3(bankX(z2, sl.s, z2 >= sl.gz ? -.2 : 1.0), 0, z2);
        b.y = Math.max(W.terrainH(b.x, b.z), -.1) + .12;
        const len = a.distanceTo(b), pm = mesh(new THREE.CylinderGeometry(.045, .045, len, 6), M.steel, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, band(zz));
        pm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      }
      if (sl.gz >= z0 && sl.gz < z1) {
        const c = W.cx(sl.gz), hw = W.hw(sl.gz), grp = new THREE.Group(); grp.position.set(0, 0, sl.gz); chunk.add(grp);   // 보는 멀리서도 보이게 띠에 안 넣는다
        const piers = 4, span = hw * 2 / piers, panels = [], foams = [];
        for (let i = 0; i <= piers; i++) {
          const px = c - hw + i * span, gy = Math.max(W.terrainH(px, sl.gz), -.4);
          mesh(new THREE.BoxGeometry(.9, 3.9, 1.5), M.concrete, px, gy + 1.45, 0, grp);
          u.rocks.push({ x: px, z: sl.gz, r: .75 + 1.7 });
        }
        mesh(new THREE.BoxGeometry(hw * 2 + 1.2, .42, .9), M.concrete, c, 3.45, 0, grp);
        mesh(new THREE.BoxGeometry(hw * 2 + 1.2, .08, .08), M.rust, c, 3.75, .5, grp);   // 난간
        for (let i = 0; i < piers; i++) {
          const px = c - hw + (i + .5) * span, w = span - .95;
          const pn = mesh(new THREE.BoxGeometry(w, 1.7, .14), M.rust, px, 0, .1, grp); panels.push(pn);
          for (let r = 0; r < 3; r++) mesh(new THREE.BoxGeometry(w, .06, .05), M.steel, 0, -.55 + r * .55, .09, pn);
          const fm = mesh(new THREE.PlaneGeometry(w, 1.5), new THREE.MeshBasicMaterial({ map: foamTex, color: 0xe4eef0, transparent: true, opacity: .8, depthWrite: false, side: THREE.DoubleSide }), px, .55, -.82, grp); fm.renderOrder = 3; fm.rotation.x = -.35;
          const sheet = mesh(new THREE.PlaneGeometry(w, 3.2), new THREE.MeshBasicMaterial({ map: foamTex, color: 0xcfdfe2, transparent: true, opacity: .5, depthWrite: false }), px, .07, -2.3, grp); sheet.rotation.x = -Math.PI / 2; sheet.renderOrder = 3;   // 수면에 번지는 흰 거품
          const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: W.glowTex(), color: 0xc8dce0, transparent: true, opacity: .35, depthWrite: false })); gl.scale.set(w * 1.3, 1.8, 1); gl.position.set(px, .4, -1.4); gl.renderOrder = 3; grp.add(gl);
          foams.push(fm, sheet, gl);
        }
        u.props.push({ kind: 'weir', id: sl.id, sl, x: c, z: sl.gz, panels, foams });
      }
    }
    // 물속 유품
    for (const r of RELICS) {
      if (r.z < z0 || r.z >= z1 || W.used.has(r.id)) continue;
      let x = r.x; for (const rk of u.rocks) { const d = Math.hypot(x - rk.x, r.z - rk.z); if (d < rk.r - 1.2) x = rk.x + (x >= rk.x ? 1 : -1) * (rk.r - .9); }
      const grp = new THREE.Group(); grp.position.set(x, W.terrainH(x, r.z) + .04, r.z); grp.rotation.y = r.i; band(r.z).add(grp);
      const k = r.i % 8, sc = 2.2;
      if (k === 0) mesh(new THREE.TorusGeometry(.05, .016, 6, 14), M.gold, 0, .02, 0, grp).rotation.x = 1.3;
      else if (k === 1) mesh(new THREE.CylinderGeometry(.045, .045, .012, 14), M.gold, 0, .01, 0, grp);
      else if (k === 2) { mesh(new THREE.BoxGeometry(.14, .008, .018), M.silver, 0, .01, 0, grp); mesh(new THREE.SphereGeometry(.022, 8, 6), new THREE.MeshPhongMaterial({ color: 0xc03040, shininess: 80 }), .07, .02, 0, grp); }
      else if (k === 3) { mesh(new THREE.CylinderGeometry(.04, .04, .016, 14), M.silver, 0, .015, 0, grp); mesh(new THREE.TorusGeometry(.05, .01, 4, 12), M.black, 0, .01, 0, grp).rotation.x = 1.57; }
      else if (k === 4) { for (const a of [-1, 1]) mesh(new THREE.TorusGeometry(.035, .006, 4, 14), M.black, a * .045, .02, 0, grp).rotation.x = 1.4; }
      else if (k === 5) { mesh(new THREE.CylinderGeometry(.02, .02, .08, 8), M.silver, 0, .02, 0, grp).rotation.z = 1.57; mesh(new THREE.TorusGeometry(.02, .006, 4, 10), M.silver, .05, .02, 0, grp); }
      else if (k === 6) { mesh(new THREE.BoxGeometry(.08, .006, .02), M.gold, 0, .01, 0, grp); mesh(new THREE.TorusGeometry(.022, .007, 4, 10), M.gold, -.055, .01, 0, grp).rotation.x = 1.57; }
      else mesh(new THREE.SphereGeometry(.03, 10, 8), M.glass, 0, .03, 0, grp);
      grp.scale.setScalar(sc);
      const star = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, color: 0xfff0c0, transparent: true, opacity: 0, depthWrite: false, depthTest: false })); star.renderOrder = 4; star.scale.set(.6, .6, 1); band(r.z).add(star);
      u.props.push({ kind: 'relic', id: r.id, relic: r, x, z: r.z, obj: grp, star });
    }
  };

  // ── 매 프레임: 가까이 가면 벌어지는 일 ──
  // c = { P, G, dt, t, lit, frozen, A, toast, save, setLamp }
  PR.tick = function (c) {
    const { P, G, dt, A } = c;
    const NM = o => EN ? o.en : o.ko;
    G.wheel = null;   // 곁에 선 수문 바퀴 — 아래에서 다시 채운다
    for (const e of W.props) {
      const d = Math.hypot(P.x - e.x, P.z - e.z);
      if (d > 20) continue;
      switch (e.kind) {
        case 'tent':
          if (!W.used.has(e.id) && d < 2.6 && !c.frozen) { W.used.add(e.id); G.oil = Math.min(100, G.oil + 25); c.addSalt(2); A.rummage(); if (c.act) c.act('crouch', .8); c.toast('🏮 +25  🧂 +2'); if (!G.lamp) c.setLamp(true); c.save(); }
          if (W.used.has(e.id)) e.flap.rotation.y += (-1.3 - e.flap.rotation.y) * Math.min(1, dt * 5);
          break;
        case 'memorial':
          if (!W.used.has(e.id) && d < 2.4 && !c.frozen) { W.used.add(e.id); e.fl.visible = true; A.candle(); G.candles = (G.candles || 0) + 1; c.save(); }
          break;
        case 'relic':
          if (!W.used.has(e.id) && d < 1.35 && !c.frozen) { W.used.add(e.id); e.obj.visible = false; e.star.visible = false; A.pick(); G.spike = Math.max(G.spike || 0, .34); if (c.act) c.act('pick', 1.9); c.toast('💍 ' + PR.relicCount() + '/' + PR.RELIC_N); if (c.sub) { const k = e.relic.i % 8, n = RELICS.filter(r => r !== e.relic && r.i % 8 === k && W.used.has(r.id)).length; c.sub({ lines: RELIC_SUBS[Math.min(RELIC_SUBS.length - 1, k + 8 * n)] }); } c.save(); }   // 죽은 사람의 물건을 쥔 순간 — 소름이 한 번 돋는다
          break;
        case 'lantern':
          if (!W.used.has(e.id) && d < 2.5 && c.lit && !c.frozen) {   // 들고 있는 불을 옮겨 붙인다
            W.used.add(e.id); e.fl.visible = true; A.ignite(); if (c.act) c.act('pick', 1.6);
            const n = [0, 1, 2].filter(j => W.used.has(e.site.id + '_' + j)).length;
            if (n >= 3 && !W.used.has(e.site.id)) {
              W.used.add(e.site.id); setTimeout(() => A.clear(), 350); c.addSalt(3); G.shake = Math.max(G.shake || 0, .35);
              if (e.site.st.z > G.cpZ) { G.cpX = e.site.st.x - e.site.s * 3.2; G.cpZ = e.site.st.z - 1.5; }   // 비석 바로 앞 물가에서 다시 시작
              c.toast((EN ? 'STONE LANTERNS' : '석등') + '  🧂 +3');
            } else c.toast(n + '/3');
            c.save();
          }
          break;
        case 'stele':
          if (W.used.has(e.id) && d < 15) G.holy = true;   // 밝힌 석등 자리는 서낭당처럼 물귀신이 물러난다
          break;
        case 'crank':
          if (!W.used.has(e.id) && d < 1.6 && !c.frozen) {   // 손잡이를 주워 바퀴에 끼운다
            W.used.add(e.id); e.bar.visible = false; e.star.visible = false; e.grip.visible = true;
            A.pick(); if (c.act) c.act('pick', 1.9); c.toast(EN ? '🔧 CRANK' : '🔧 손잡이'); c.save();
          }
          break;
        case 'wheel':
          if (!W.used.has(e.id) && W.used.has(e.id + 'h') && d < 2.2 && !c.frozen) {
            G.wheel = e;                                     // 단추를 누른 만큼만 돈다 — 저절로 돌지 않는다
            const sl = e.sl;
            if (e.turn > 0) {
              sl.prog = Math.min(1, sl.prog + e.turn * .085); e.wheel.rotation.y -= e.turn * .62; e.turn = 0;
              sl.creakT = (sl.creakT || 0) - dt; if (sl.creakT <= 0) { sl.creakT = .22; A.creak(); }
              if (sl.prog >= 1) { W.used.add(e.id); G.wheel = null; A.clunk(); G.shake = Math.max(G.shake || 0, .6); c.toast(EN ? 'SLUICE GATE' : '수문'); c.save(); }
            } else sl.creakT = (sl.creakT || 0) - dt;
          }
          break;
      }
    }
  };

  const PANEL_OPEN = 2.25, PANEL_SHUT = -.92;
  PR.update = function (t, dt, P, lit) {
    for (const sl of SLUICE) { const want = W.used.has(sl.id) ? 1 : 0; sl.k += (want - sl.k) * Math.min(1, dt * .9); }
    for (const e of W.props) {
      switch (e.kind) {
        case 'band': e.obj.visible = Math.abs(P.z - e.z) < 105; break;
        case 'relic': {
          if (W.used.has(e.id)) { e.star.visible = e.obj.visible = false; break; }   // 주운 것은 어떤 경우에도 반짝이지 않는다
          if (!e.star.visible) break;
          const d = Math.hypot(P.x - e.x, P.z - e.z), reach = lit ? 7 : 3;   // 바로 곁에서만 반짝
          const tw = .55 + .45 * Math.sin(t * 3.1 + e.relic.i * 1.7) * Math.sin(t * 1.3 + e.relic.i);
          e.star.material.opacity = Math.max(0, 1 - d / reach) * (lit ? .6 : .35) * (.35 + tw * .65);
          e.star.position.set(e.x, W.height(e.x, e.z, t) + .06, e.z); const s = .38 + tw * .32; e.star.scale.set(s, s, 1); e.star.material.rotation = t * .4 + e.relic.i;
          break;
        }
        case 'crank': {
          if (W.used.has(e.id) || e.grip.visible) { e.star.visible = false; break; }
          if (!e.star.visible) break;
          const d = Math.hypot(P.x - e.x, P.z - e.z), reach = lit ? 9 : 4;
          const tw = .55 + .45 * Math.sin(t * 3.1 + e.z);
          e.star.position.set(e.x, e.y, e.z); e.star.material.opacity = Math.max(0, 1 - d / reach) * (lit ? .6 : .38) * (.35 + tw * .65);
          const s = .42 + tw * .3; e.star.scale.set(s, s, 1); e.star.material.rotation = t * .4;
          break;
        }
        case 'lantern': case 'memorial':   // 꺼진 불은 빛을 아예 뺀다. 거리로 켰다 껐다 하면 빛 개수가 바뀔 때마다 셰이더를 다시 짜서 끊긴다
          e.li.visible = e.fl.visible;
          if (e.fl.visible) { const f = .85 + Math.sin(t * 13 + e.x) * .08 + Math.sin(t * 7.3 + e.z) * .07; e.li.intensity = (e.kind === 'lantern' ? 2.6 : 1.6) * f; e.fl.material.opacity = .75 + f * .2; }
          break;
        case 'stele': {
          const want = W.used.has(e.id) ? 1 : 0; e.k += (want - e.k) * Math.min(1, dt * 1.2);
          e.sm.emissiveIntensity = .5 + e.k * .8;
          e.li.visible = W.used.has(e.id);
          e.li.intensity = e.k * (2.4 + Math.sin(t * 2.1) * .25);
          break;
        }
        case 'weir':
          e.panels.forEach((p, i) => { p.position.y = PANEL_OPEN + (PANEL_SHUT - PANEL_OPEN) * e.sl.k + Math.sin(t * 20 + i) * .004 * (1 - e.sl.k); });
          e.foams.forEach((f, i) => { const o = (1 - e.sl.k); f.visible = o > .03; f.material.opacity = [.8, .5, .35][i % 3] * o * (.8 + Math.sin(t * 9 + i * 1.3) * .2); });
          if (!foamTex.userData.t || foamTex.userData.t !== t) { foamTex.userData.t = t; foamTex.offset.y = t * 1.6; }
          break;
        case 'float':
          e.obj.position.y = W.height(e.x, e.z - 1.05, t) + .05; e.obj.rotation.z = Math.sin(t * 1.4 + e.x) * .08;
          break;
      }
    }
  };

  window.PROPS = PR;
})();
