// 녹화용 임시 조종 장치 — 게임과 같은 창에서 돌아가므로 state·keys를 그대로 씁니다.
// (영상 촬영이 끝나면 이 파일과 _rec.html 은 지웁니다)
window.__drive = {
  ready() {
    return typeof fruitSpots !== 'undefined' && fruitSpots.length > 0
        && typeof state !== 'undefined';
  },
  skipIntro() {
    try { introSeen = true; } catch (e) {}
    try { tutorialSeen = true; } catch (e) {}
    const sp = document.getElementById('splash');
    if (sp) sp.remove();
  },
  begin() {
    const s = document.getElementById('start');
    if (s) s.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  },
  key(code, down) { keys[code] = !!down; },
  act() { try { handleActionKey(); } catch (e) {} },
  put(x, z) { state.x = x; state.z = z; },
  face(a) { state.facing = a; },
  cam(yaw, pitch, dist) {
    if (yaw !== undefined) camYaw = yaw;
    if (pitch !== undefined) camPitch = pitch;
    if (dist !== undefined) camDist = dist;
  },
  // 가장 가까운 귤 한 알
  nearestFruit() {
    let best = null, bd = 1e9;
    for (const s of fruitSpots) {
      if (s.gone) continue;
      const d = Math.hypot(s.x - state.x, s.z - state.z);
      if (d < bd) { bd = d; best = s; }
    }
    return best ? { x: best.x, y: best.y, z: best.z, d: bd } : null;
  },
  info() {
    return {
      x: +state.x.toFixed(1), z: +state.z.toFixed(1),
      coins: typeof coins !== 'undefined' ? coins : null,
      box: typeof basketCount !== 'undefined' ? basketCount : null,
      fruits: typeof fruitSpots !== 'undefined' ? fruitSpots.length : 0,
      startGone: !document.getElementById('start'),
    };
  },
};
