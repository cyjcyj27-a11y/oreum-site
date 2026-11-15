// 명품관 · 여친 가방 사 주기 (사장님 2026-11-16)
// "빽 사러 가는 명품관을 해수욕장 근처에 하나" — 고양이 츄르는 같은 날 뺐다("고양이 츄르는 빼자")
// "자산 10억 플러스될 때마다 여친한테 빽 사 주기가 뜬다. 안 사 주면 여친이 떠나 버림"
(function () {
  const I = ISLAND, H = I.H;
  const KEY = 'jeju.lux';
  const STEP = 100000;          // 10억(만원 단위)
  // 가방 값 — 처음 100억에서 얼마나 늘었는지로 정한다(사장님 2026-11-16)
  // "처음에 10억 늘 때 천, 100억 늘 때 2천, 200억 늘 때 3천, 300억 늘 때 5천, 500억 늘 때 7천" → 500억은 1억으로(같은 날 "500억은 1억으로 하자") (만원 단위)
  const START = 1000000;
  const TIERS = [[5000000, 10000], [3000000, 5000], [2000000, 3000], [1000000, 2000], [0, 1000]];   // [늘어난 자산, 가방 값]
  const priceAt = nw => { const g = nw - START; for (const t of TIERS) if (g >= t[0]) return t[1]; return 1000; };
  const bagPrice = () => L.pend && L.pend.price ? L.pend.price : priceAt(ESTATE.netWorth());
  const SLACK = 45;             // 길 따라 걸리는 시간에 얹어 주는 여유(초)
  const L = { gone: false, bags: 0, next: 0, pend: null, store: null, near: false, ready: false };
  const el = id => document.getElementById(id);
  const fmt = v => (window.ESTATE && ESTATE.fmt) ? ESTATE.fmt(v) : String(v);

  function load() { try { const j = JSON.parse(localStorage.getItem(KEY) || '{}'); L.gone = !!j.gone; L.s700 = !!j.s700; L.bags = j.bags || 0; L.next = j.next || 0; L.pend = j.pend || null; } catch (e) {} }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ gone: L.gone, s700: L.s700, bags: L.bags, next: L.next, pend: L.pend })); } catch (e) {} }
  if (new URLSearchParams(location.search).get('reset')) { try { localStorage.removeItem(KEY); } catch (e) {} }

  // ── 명품관 자리: 중문 색달해변 곁, 길에 붙은 평지 ──
  function pickSite() {
    const s = SPOTS.list.find(x => x.id === 'jungmun') || SPOTS.list.find(x => x.beach);
    const W = 26, D = 18, lots = (window.ESTATE && ESTATE.list) || [];
    let best = null, bs = 1e9;
    for (const e of ROADS.edges) {
      if (Math.hypot(e.a.x - s.x, e.a.z - s.z) > 420) continue;
      const len = Math.hypot(e.b.x - e.a.x, e.b.z - e.a.z) || 1, ux = (e.b.x - e.a.x) / len, uz = (e.b.z - e.a.z) / len;
      for (let t = 4; t < len - 4; t += 6) for (const sd of [1, -1]) {
        const off = e.w / 2 + 4 + D / 2;
        const rx = e.a.x + ux * t, rz = e.a.z + uz * t, cx = rx - uz * off * sd, cz = rz + ux * off * sd;
        const dS = Math.hypot(cx - s.x, cz - s.z); if (dS < 70) continue;
        if (I.coastDist(cx, cz) < 30 || I.inIslet(cx, cz)) continue;
        if (PLAYER.insideBox(cx, cz, 16)) continue;
        let bad = false; for (const p of lots) if (Math.hypot(p.x - cx, p.z - cz) < p.side / 2 + 22) { bad = true; break; }
        if (bad) continue;
        // 발자국 안에 다른 길이 들어오면 안 된다
        let lo = 1e9, hi = -1e9, road = false;
        for (let i = -1; i <= 1; i += 0.5) for (let j = -1; j <= 1; j += 0.5) {
          const px = cx + ux * i * W / 2 + (-uz * sd) * j * D / 2, pz = cz + uz * i * W / 2 + (ux * sd) * j * D / 2;
          const h = H(px, pz); lo = Math.min(lo, h); hi = Math.max(hi, h);
          const n = ROADS.nearest(px, pz); if (n.e && n.e !== e && n.d < 1) road = true;
        }
        if (road || hi - lo > 5) continue;
        const sc = dS + (hi - lo) * 25;
        if (sc < bs) { bs = sc; best = { x: cx, z: cz, rx, rz, yaw: Math.atan2(rx - cx, rz - cz), lo, hi, W, D, ux, uz, sd }; }
      }
    }
    return best;
  }

  function canvasTex(w, h, draw) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
  function bagMesh(col, sc) {
    const g = new THREE.Group();
    const m = new THREE.MeshStandardMaterial({ color: col, roughness: 0.35, metalness: 0.1 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xd8b25a, roughness: 0.25, metalness: 1 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.13), m); body.position.y = 0.12; g.add(body);
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.345, 0.1, 0.135), m); flap.position.y = 0.2; flap.scale.set(1, 1, 1.01); g.add(flap);
    const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.02), gold); clasp.position.set(0, 0.16, 0.07); g.add(clasp);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 6, 16, Math.PI), gold); handle.position.y = 0.24; g.add(handle);
    g.scale.setScalar(sc || 1); return g;
  }
  const BAG_COL = [0xc0392b, 0x1b1b1b, 0xf3e6d0, 0x8e44ad, 0xe67e22, 0x2c6e49, 0xd35d8a, 0x34495e];

  function buildStore(scene, st) {
    const g = new THREE.Group();
    const base = st.lo - 0.6, top = st.hi + 0.25, W = st.W, D = st.D, HT = 12;
    const stone = new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.6 });
    // 겉벽: 짙은 숯빛 판에 금실 마름모 누빔 무늬(어느 상표도 아닌 우리 무늬)
    const wallT = canvasTex(512, 512, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1d1a17'); gr.addColorStop(1, '#2a2520'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(214,176,92,.55)'; c.lineWidth = 3; const st = 64;
      for (let i = -h; i < w + h; i += st) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + h, h); c.stroke(); c.beginPath(); c.moveTo(i, h); c.lineTo(i + h, 0); c.stroke(); }
      c.fillStyle = 'rgba(240,206,120,.9)'; for (let x = 0; x <= w; x += st) for (let y = 0; y <= h; y += st) { c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill(); }
    });
    wallT.wrapS = wallT.wrapT = THREE.RepeatWrapping; wallT.repeat.set(5, 2.5);
    const glass = new THREE.MeshStandardMaterial({ color: 0xffffff, map: wallT, roughness: 0.35, metalness: 0.35 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xe0b45a, roughness: 0.32, metalness: 0.65, emissive: 0x4a3410, emissiveIntensity: 0.6 });
    // 쇼윈도 속: 따뜻한 조명 아래 선반과 가방 그림자
    const winT = canvasTex(512, 256, (c, w, h) => {
      const gr = c.createRadialGradient(w / 2, h * 0.25, 10, w / 2, h * 0.4, w * 0.6); gr.addColorStop(0, '#fff6dc'); gr.addColorStop(1, '#c98f4a'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(90,55,25,.55)'; c.fillRect(0, h * 0.52, w, 8); c.fillRect(0, h * 0.86, w, 10);
      const cols = ['#7b1e2b', '#222', '#e8dcc4', '#5d2f6e', '#b5651d', '#1f4d3a'];
      for (let k = 0; k < 6; k++) { const x = 30 + k * 82, y = k % 2 ? h * 0.52 : h * 0.86; c.fillStyle = cols[k]; c.fillRect(x, y - 46, 58, 46); c.strokeStyle = '#d8b25a'; c.lineWidth = 4; c.beginPath(); c.arc(x + 29, y - 46, 16, Math.PI, 0); c.stroke(); }
      for (let k = 0; k < 4; k++) { c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(64 + k * 128, 12, 10, 0, 7); c.fill(); }
    });
    const warm = new THREE.MeshStandardMaterial({ color: 0xffffff, map: winT, emissive: 0xffffff, emissiveMap: winT, emissiveIntensity: 0.75, roughness: 0.2 });
    const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
    // 기단(비탈을 메운다) · 몸통 · 금테
    box(W + 3, top - base, D + 3, stone, 0, (top + base) / 2, 0);
    box(W, HT, D, glass, 0, top + HT / 2, 0);
    box(W + 0.6, 0.6, D + 0.6, gold, 0, top + HT + 0.3, 0);
    box(W + 0.4, 0.35, D + 0.4, gold, 0, top + 4.6, 0);
    for (let i = 0; i <= 8; i++) { const x = -W / 2 + i * W / 8; box(0.28, HT, 0.28, gold, x, top + HT / 2, D / 2 + 0.05); }
    // 앞면 쇼윈도(1층, 따뜻한 불빛) + 진열 가방
    for (let i = 0; i < 4; i++) {
      const x = -W / 2 + W / 8 + i * W / 4; if (i === 1 || i === 2) continue;
      box(W / 4 - 1.2, 3.6, 0.12, warm, x, top + 2.2, D / 2 + 0.08);
      for (let k = 0; k < 3; k++) { const b = bagMesh(BAG_COL[(i * 3 + k) % BAG_COL.length], 3); b.position.set(x - 1.5 + k * 1.5, top + 1.0, D / 2 + 0.5); g.add(b); const ped = box(0.9, 0.5, 0.6, gold, x - 1.5 + k * 1.5, top + 0.75, D / 2 + 0.5); ped.castShadow = false; }
    }
    // 입구: 유리문 + 차양 + 레드카펫
    box(5.6, 3.8, 0.12, warm, 0, top + 2.0, D / 2 + 0.08);
    const can = box(8, 0.35, 3.4, new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 }), 0, top + 4.1, D / 2 + 1.7);
    box(8.1, 0.12, 3.5, gold, 0, top + 3.9, D / 2 + 1.7);
    box(3.2, 0.06, 3.4, new THREE.MeshStandardMaterial({ color: 0x9b1020, roughness: 0.8 }), 0, top + 0.03, D / 2 + 1.7);
    for (const sx of [-3.8, 3.8]) box(0.18, 3.9, 0.18, gold, sx, top + 1.95, D / 2 + 3.3);
    // 옥상 금빛 띠 조명(밤에 멀리서도 보이게)
    box(W + 0.7, 0.25, 0.25, new THREE.MeshBasicMaterial({ color: 0xffd877 }), 0, top + HT + 0.72, D / 2 + 0.35);
    // 간판: 검은 판에 금글씨 '명품관'
    const sign = canvasTex(1024, 256, (c, w, h) => {
      c.fillStyle = '#0b0b0d'; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#d8b25a'; c.lineWidth = 8; c.strokeRect(14, 14, w - 28, h - 28);
      const gr = c.createLinearGradient(0, 40, 0, 200); gr.addColorStop(0, '#fff2c4'); gr.addColorStop(0.5, '#e2bc5c'); gr.addColorStop(1, '#a87b22');
      c.fillStyle = gr; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = '900 150px "Ria","Griun","Malgun Gothic",serif'; const t = typeof window.L === 'function' ? window.L('명 품 관') : '명 품 관'; if (t !== '명 품 관') c.font = '900 120px "Ria","Griun","Malgun Gothic",serif'; c.fillText(t, w / 2, h / 2 + 6);
    });
    const sm = new THREE.MeshStandardMaterial({ map: sign, emissive: 0xffffff, emissiveMap: sign, emissiveIntensity: 0.55, roughness: 0.4 });
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.5), sm); sg.position.set(0, top + 8.6, D / 2 + 0.2); g.add(sg);
    const sg2 = sg.clone(); sg2.rotation.y = Math.PI; sg2.position.z = -D / 2 - 0.2; g.add(sg2);
    // 위층 창: 세로 금빛 띠 사이 은은한 불빛
    for (let i = 0; i < 8; i++) { const x = -W / 2 + W / 16 + i * W / 8; const w2 = box(W / 8 - 0.7, 1.6, 0.1, warm, x, top + 6.2, D / 2 + 0.07); w2.material = warm; }
    g.position.set(st.x, 0, st.z); g.rotation.y = st.yaw;
    scene.add(g);
    // 충돌 상자(돌린 발자국)
    const c = Math.cos(st.yaw), s = Math.sin(st.yaw), hw = (W + 3) / 2, hd = (D + 3) / 2;
    const ew = Math.abs(c) * hw + Math.abs(s) * hd, ed = Math.abs(s) * hw + Math.abs(c) * hd;
    if (PLAYER.addObst) PLAYER.addObst({ x0: st.x - ew, z0: st.z - ed, x1: st.x + ew, z1: st.z + ed, rot: { cx: st.x, cz: st.z, c: Math.cos(st.yaw), s: Math.sin(st.yaw), hw, hd } });
    if (window.ROADS && ROADS.dirty) ROADS.dirty();
    // 문 앞(길 쪽) — 여기서 산다
    const fx = Math.sin(st.yaw), fz = Math.cos(st.yaw);
    st.door = { x: st.x + fx * (D / 2 + 6), z: st.z + fz * (D / 2 + 6) };
    st.g = g;
  }

  // ── 화면: 분홍 띠(남은 시간) · 카드 · 알림 ──
  function card(icon, name, coin, stamp) {
    el('cardIcon').textContent = icon; el('cardName').textContent = name; el('cardCoin').textContent = coin;
    const st = el('cardStamp'); st.textContent = stamp; st.style.display = 'block';
    el('card').classList.add('on'); ACT.msgT = 2.8; setTimeout(() => { st.textContent = 'JEJU'; }, 3000);
  }
  function hint(t) { const h = el('hint'); if (!h) return; h.textContent = t; h.classList.add('on'); ACT.hintT = 2.2; }
  function say(t, sec) { if (window.PET && PET.say) PET.say('여친', t, sec || 5, false); }

  // 조르는 대사 — 가방 값 단계마다 따로(사장님 2026-11-16 "자산에 맞게 대사 바꾸는거지??")
  const ASK = {
    1000: [
      '오빠, 자산 10억 또 늘었지? 나 가방 하나만 사 줘. 중문 명품관!',
      '10억 벌었으면 나한테도 뭐 있어야지. 명품관 가자. 지금.',
      '오빠 통장만 살찌우지 말고 내 어깨도 좀 채워 줘. 가방!',
      '이번에 10억 오른 거 다 봤어. 명품관 안 가면 나 진짜 삐진다?',
      '가방 값 정도는 오빠한테 껌이잖아. 지금 10억 벌었는데. 계산 끝났지?',
    ],
    2000: [
      '우리 벌써 100억 넘게 벌었어. 이제 천만 원짜리는 좀 그렇지 않아? 2천만 원!',
      '오빠 땅값 오르는 거 보니까 내 가방 값도 올라야 할 것 같아. 2천.',
      '친구가 2천만 원짜리 들고 왔더라. 나만 천만 원짜리 들 순 없잖아.',
    ],
    3000: [
      '200억 넘게 번 남자 여친이 아무 가방이나 들면 오빠 체면이 뭐가 돼. 3천만 원.',
      '오빠, 이번 건 3천만 원이야. 놀라지 마. 오빠 이제 그 정도 사람이야.',
      '명품관 언니가 오빠 이름 외웠대. 3천만 원짜리 빼 놨대.',
    ],
    5000: [
      '300억 넘게 벌었으면 가방도 한 단계 올라가야지. 5천만 원!',
      '5천만 원이 비싸? 오빠 땅 한 번 오르면 그거 몇 배야.',
      '나 이 가방 들고 탐라국개발 사장 부인 앞을 지나갈 거야. 5천만 원.',
    ],
    10000: [
      '500억 넘은 남자 여친이면 1억짜리는 들어야지. 명품관 가자.',
      '오빠, 이번이 마지막일지도 몰라. 1억짜리 하나만.',
      '매장에 하나 남은 1억짜리, 다른 여자가 먼저 사면 나 울 거야.',
    ],
  };
  const THANK = ['꺄! 오빠 최고! 이거 진짜 갖고 싶었던 거야.', '역시 우리 오빠. 이 가방 들고 해변 걸을래.', '사랑해 오빠. 다음 10억도 기대할게.', '이 색 너무 예쁘다. 오빠 센스 인정!'];

  function bar() {
    const b = el('lux'); if (!b) return;
    if (!L.pend) { b.classList.remove('show'); return; }
    const s = Math.max(0, Math.floor(L.pend.left));
    b.innerHTML = '👜 여친 가방 <b>명품관</b> ' + fmt(bagPrice()) + ' <span class="t">' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + '</span>';
    b.classList.add('show');
  }
  function dest() { if (L.store) ACT.setDest({ id: 'lux', name: '명품관', icon: '👜', x: L.store.door.x, z: L.store.door.z }); }
  function ask() {
    const st = L.store; let sec = 180;
    if (st && ESTATE.dealSec) sec = ESTATE.dealSec({ x: st.door.x, z: st.door.z, side: 0 }) + SLACK;
    L.pend = { left: Math.max(90, sec), price: priceAt(ESTATE.netWorth()) };   // 조른 그 순간 값으로 묶는다
    save(); bar(); dest();
    AUDIO.init(); AUDIO.ping(1320); setTimeout(() => AUDIO.ping(1560), 160);
    const pool = ASK[L.pend.price] || ASK[1000];
    say(pool[Math.floor(Math.random() * pool.length)], 6.5);
  }
  function leave() {
    L.pend = null; L.gone = true; save(); bar();
    if (ACT.dest && ACT.dest.id === 'lux') ACT.clearDest();
    AUDIO.ping(220); setTimeout(() => AUDIO.ping(165), 260);
    if (window.PET && PET.say) PET.say('여친', '됐어. 가방 하나 못 사 주는 남자랑은 끝이야. 나 간다.', 6, false);
    setTimeout(() => card('💔', '여친이 떠났다', '', '이별'), 900);
  }
  function buy() {
    const BAG = bagPrice();
    if (ACT.coins < BAG) { hint('💰 ' + fmt(BAG)); AUDIO.ping(320); return; }
    ACT.coins -= BAG; L.bags++; const had = !!L.pend; L.pend = null; save(); bar();
    ACT.save(); ACT.hud(); if (ESTATE.hud) ESTATE.hud();
    if (ACT.dest && ACT.dest.id === 'lux') ACT.clearDest();
    AUDIO.init(); AUDIO.stamp(); AUDIO.coin(3); AUDIO.fanfare();
    card('👜', '가방 ' + L.bags + '번째', '-' + fmt(BAG), had ? '선물' : '깜짝 선물');
    setTimeout(() => say(THANK[Math.floor(Math.random() * THANK.length)], 5), 1200);
    holdBag(true);
  }

  // 여친 왼손에 가장 최근 가방 — 산 순간 눈에 보이게 (상점은 즉시 보상)
  let held = null;
  function holdBag(force) {
    const gf = window.PET && PET.gfM; if (!gf || !gf.g || L.bags <= 0 || L.gone) return;
    if (held && !force) return;
    const hand = gf.g.getObjectByName('mixamorigLeftHand') || gf.g.getObjectByName('LeftHand'); if (!hand) return;
    if (held && held.parent) held.parent.remove(held);
    held = bagMesh(BAG_COL[(L.bags - 1) % BAG_COL.length], 1);
    // 손뼈 축척을 되돌려 실제 크기로 든다
    hand.updateWorldMatrix(true, false); const ws = new THREE.Vector3(); hand.getWorldScale(ws); const gs = new THREE.Vector3(); gf.g.parent.getWorldScale(gs);
    held.scale.setScalar((gs.x || 1) / (ws.x || 1));
    held.position.set(0, -0.12 / (ws.x || 1) * (gs.x || 1), 0);
    held.rotation.set(Math.PI, 0, 0);
    hand.add(held);
  }

  function init(scene) {
    L.scene = scene; load();
    try { const st = pickSite(); if (st) { buildStore(scene, st); L.store = st; } } catch (e) { console.warn('명품관', e); }
  }
  let chk = 0;
  function update(dt) {
    if (!window.ESTATE || !ESTATE.ready || !(window.__jj && __jj.started && __jj.started())) return;
    holdBag(false);
    const nw = ESTATE.netWorth();
    if (!L.ready) { L.ready = true; if (!L.next) { L.next = (Math.floor(nw / STEP) + 1) * STEP; save(); } if (L.pend) { bar(); dest(); } }
    if (L.pend) {
      L.pend.left -= dt; chk += dt; if (chk > 1) { chk = 0; save(); }
      if (L.pend.left <= 0) leave(); else bar();
    } else if (!L.gone && !L.s700 && nw >= 7000000) {
      // 700억이 되면 여친이 더는 가방을 조르지 않고, 주인공이 혼잣말을 한다(사장님 2026-11-16 문구 그대로)
      L.s700 = true; save();
      if (window.PET && PET.say) PET.say(window.LANG && LANG.en ? 'Me' : '나', '이상하다 왜 가방사달라고 안하지....', 6, false);
    } else if (!L.gone && !L.s700 && nw >= L.next) {
      L.next = (Math.floor(nw / STEP) + 1) * STEP;
      ask();
    }
    // 문 앞에 서면 사 주기 단추
    L.near = false;
    const st = L.store; if (!st || L.gone || ACT.cur) return;
    const hp = (window.PET && PET.onFoot) ? PET.hero() : PLAYER;
    if (Math.hypot(hp.x - st.door.x, hp.z - st.door.z) < 16 && PLAYER.kmh < 12 && !ESTATE.near) {
      L.near = true; const b = el('act'); b.textContent = '👜 가방 사 주기 · ' + fmt(bagPrice()); b.classList.add('show');
    }
  }
  function act() { if (L.near) buy(); }
  window.LUX = Object.defineProperties({ init, update, act, state: L }, {
    gone: { get: () => L.gone }, near: { get: () => L.near }, store: { get: () => L.store },
  });
})();
