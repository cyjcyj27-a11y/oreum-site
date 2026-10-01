// tools.js — 손에 드는 도구는 한 번에 하나 (사장님 2026-09-20 "도구는 항상 한번에 하나씩만 갖게해서 e하나로 들기 내려놓기 가능하게")
//   도구 = 바구니(feel.js 가 제 동작으로 들고 놓는다) · 작살 · 장총 · 횃불 (물통은 물 긷기와 함께 뺐다, 사장님 2026-09-25 "우물은 장식으로")
//   T.tool: 'spear' | 'rifle' | 'torch' | null (바구니는 T.bag.held 로 따로) · T.rest: { 도구: {x, z} } = 땅에 놓인 것
//   E 하나로: 놓인 도구 곁에서 E = 들기, 할 일이 없을 때 E = 가방에 넣기
//   도구를 내려놓으면 땅이 아니라 가방(T.stow)에 들어간다 — 땅에 두면 다시 찾기 힘들었다 (사장님 2026-09-27 "추천")
//   가방 창(hud.js)에서 누르면 꺼내 든다. 들고 있던 도구는 가방으로. 바구니만 땅에 내려놓는다
//   횃불(석상 서랍)·장총·작살(상점)은 얻자마자 손에 — 들고 있던 것은 가방으로
(function () {
  const V3 = THREE.Vector3;
  const DEF = {
    spear: { icon: '🔱', ko: '작살', en: 'Spear', y: 0.06 },
    rifle: { icon: '🎯', ko: '장총', en: 'Rifle', y: 0.07 },
    torch: { icon: '🔥', ko: '횃불', en: 'Torch', y: 0.08 },
  };
  const restM = {};
  let scene = null;

  function build(sc) {
    scene = sc;
    if (!T.rest) T.rest = {};
    const mk = { spear: () => FISHING.spearMesh(), rifle: () => HUNT.gunMesh(), torch: () => ISLAND.torchMesh(true) };
    for (const k in DEF) {
      const m = mk[k]();
      m.visible = false;
      m.traverse(o => { if (o.isMesh) o.castShadow = true; });
      scene.add(m); restM[k] = m;
    }
  }

  const held = k => k === 'basket' ? FEEL.held() : T.tool === k;
  const has = k => T.tool === k || !!(T.rest && T.rest[k]) || !!(T.stow && T.stow[k]);   // 손에든 땅에든 가방에든 있나
  const stowed = k => !!(T.stow && T.stow[k]);
  const any = () => T.tool || (FEEL.held() ? 'basket' : null);

  // 발 앞 빈 땅 (물속·벽 속엔 못 놓는다)
  function spotAhead() {
    const x = PL.pos.x + Math.sin(PL.yaw) * 0.6, z = PL.pos.z + Math.cos(PL.yaw) * 0.6;
    if (TER.H(x, z) < 0.15 || COL.inside(x, TER.H(x, z) + 0.3, z, 0.25)) return null;
    return { x, z };
  }
  // 들고 있던 것을 내려놓는다 (바구니는 feel.js 동작으로). 못 놓으면 false
  function free() {
    if (FEEL.held()) return FEEL.dropBag();
    if (T.tool) return putDown(T.tool, true);
    return true;
  }
  // 든 도구를 가방에 넣는다 (이름은 옛 그대로 putDown — feel.js 등이 부른다)
  function putDown(k, quiet) {
    if (!k) return true;
    T.stow = T.stow || {}; T.stow[k] = true; T.tool = null;
    if (!quiet) AUD.sfx('page', 0.7);
    U.save();
    return true;
  }
  // 가방에서 꺼내 든다 — 들고 있던 도구는 가방으로, 바구니는 발 앞에
  function equip(k) {
    if (T.tool === k) return putDown(k);
    if (!stowed(k)) return false;
    if (PL.swim || PL.ride || PL.climb || PL.aim || PL.act) { AUD.sfx('deny'); return false; }
    if (!free()) return false;
    delete T.stow[k]; T.tool = k;
    AUD.sfx('pick'); U.save();
    return true;
  }
  function pick(k) {
    const r = T.rest[k]; if (!r) return false;
    if (!free()) return false;
    PL.yaw = Math.atan2(r.x - PL.pos.x, r.z - PL.pos.z);
    PLAYER.doAct('pick', 1.0, { speed: 2.2, from: 0.6 });
    T.tool = k; delete T.rest[k];
    AUD.sfx('pick'); U.save();
    return true;
  }
  // 얻자마자 손에 (횃불·상점 장총)
  function take(k) {
    if (T.tool === k) return;
    if (!free()) { T.stow = T.stow || {}; T.stow[k] = true; delete T.rest[k]; U.save(); return; }
    T.tool = k; delete T.rest[k]; if (T.stow) delete T.stow[k]; U.save();
  }

  function near() {
    if (T.mode !== 'play' || PL.swim || PL.ride || PL.climb || PL.aim) return null;
    for (const k in DEF) {
      const r = T.rest && T.rest[k]; if (!r) continue;
      const d = Math.hypot(r.x - PL.pos.x, r.z - PL.pos.z);
      if (d < 1.6 && Math.abs(TER.H(r.x, r.z) - PL.pos.y) < 1.2) return { kind: 'tool', k, label: 'E ' + DEF[k].icon };
    }
    return null;
  }
  // 할 일이 없을 때: 든 도구는 가방에 넣기, 바구니는 내려놓기
  function dropNear() {
    if (T.mode !== 'play' || PL.swim || PL.ride || PL.climb || PL.aim || PL.act) return null;
    if (T.tool) return { kind: 'tooldrop', label: DEF[T.tool].icon + ' ⬇' };
    if (FEEL.held()) return { kind: 'tooldrop', label: '🧺 ⬇', hide: true };   // E 로 내려놓되 화면엔 안 띄운다 (사장님 2026-09-24)
    return null;
  }
  function act(n) {
    if (n.kind === 'tool') pick(n.k);
    else if (n.kind === 'tooldrop') { if (FEEL.held()) FEEL.dropBag(); else putDown(T.tool); }
  }

  function update(dt) {
    if (!scene) return;
    for (const k in DEF) {
      const m = restM[k], r = T.rest && T.rest[k];
      m.visible = !!r && T.mode !== 'title';
      if (!r) continue;
      const y = TER.H(r.x, r.z) + DEF[k].y;
      m.position.set(r.x, y, r.z);
      if (k === 'torch') { m.rotation.set(0, 0, 1.25); if (m.userData.flames) ISLAND.flicker(m, 0.8); }
      else m.rotation.set(0, (r.x * 3 + r.z) % 6.28, 0.04);   // 작살·장총은 땅에 눕는다
    }
  }

  // 새 판·옛 저장: 도구가 있을 자리를 채운다
  function migrate() {
    if (!T.rest) T.rest = {};
    if (!T.stow) T.stow = {};
    if (T.tool === undefined) T.tool = null;
    if (T.tool && !DEF[T.tool]) T.tool = null;
    // 옛 저장의 물통·물은 치운다 (물 긷기를 뺐다)
    delete T.rest.pail; T.items.water = 0;
    // 작살은 상점에서 산다 (사장님 2026-09-26). 옛 저장: 이미 들고 다니던 작살은 산 것으로, 선착장에 그대로 놓인 것은 치운다
    if (!T.shop.spear) {
      const p = FISHING.restSpot(), r = T.rest.spear;
      const atPier = r && p && Math.hypot(r.x - p.x, r.z - p.z) < 0.5;
      if (T.tool === 'spear' || (r && !atPier)) T.shop.spear = true; else delete T.rest.spear;
    }
    // 꼬치 도구를 샀던 옛 저장은 값을 돌려준다 (꼬치구이를 뺐다, 2026-09-27)
    if (T.shop.skewer) { delete T.shop.skewer; T.coins += 80; }
    // 산 작살·장총이 땅에 놓여 있거나 어디에도 없으면 가방으로 (가방 방식으로 바꾼 뒤 옛 저장)
    for (const k of ['spear', 'rifle']) if (T.shop[k] && T.tool !== k) { delete T.rest[k]; T.stow[k] = true; }
    // 옛 저장: 땅에 놓인 바구니는 가방으로 (바구니는 늘 소지, 2026-10-01)
    if (!T.bag || (!T.bag.held && T.bag.x != null)) T.bag = T.bag && !T.bag.held ? { held: false, stow: true, x: null, z: null } : { held: true, x: null, z: null };
    if (T.isl && T.isl.key === 2 && !has('torch')) { const s = ISLAND.S; if (s) T.rest.torch = { x: s.x + 1.4, z: s.z }; }
    if (T.isl && T.isl.key >= 3) { delete T.rest.torch; delete T.stow.torch; if (T.tool === 'torch') T.tool = null; }   // 다 탄 횃불
  }

  window.TOOLS = { build, update, near, dropNear, act, pick, putDown, equip, stowed, take, free, held, has, any, migrate, DEF };
})();
