// CPU 카트 몰기 — 코스 앞을 보고 꺾고, 코너에서 드리프트, 아이템은 때 맞춰 쓴다
(function () {
  function brain(skill) {
    return {
      skill,                  // 0.85 ~ 1.08
      line: (Math.random() - 0.5) * 0.7, // 좋아하는 레이싱 라인(중앙에서 벗어난 정도)
      wob: Math.random() * 6.28,
      itemWait: 0.4 + Math.random() * 1.6,
      mistake: 0,
      mistakeCd: 4 + Math.random() * 8,
      stuck: 0, rev: 0,       // 담장·소품에 박혀 못 나갈 때 잠깐 후진
    };
  }

  // 조종 입력 만들기
  function drive(S, B, T, dt, rubber) {
    B.wob += dt;
    // 박혔나? (달리려는데 속도가 안 붙으면) → 1초 후진하며 반대로 꺾는다
    if (B.rev > 0) {
      B.rev -= dt;
      return { thr: -1, steer: B.revSteer, drift: false, _bend: 0 };
    }
    if (Math.abs(S.vel) < 1.6 && S.time > 5 && !S.finished) B.stuck += dt; else B.stuck = Math.max(0, B.stuck - dt * 2);
    if (B.stuck > 1.1) {
      B.stuck = 0;
      B.rev = 0.9 + Math.random() * 0.4;
      // 코스 중심이 어느 쪽인지 보고 그 반대로 꺾어 후진 (후진은 조향이 뒤집힌다)
      B.revSteer = (S.loc && S.loc.t > 0) ? -1 : 1;
      return { thr: -1, steer: B.revSteer, drift: false, _bend: 0 };
    }
    if (B.mistakeCd > 0) B.mistakeCd -= dt;
    else if (B.mistake <= 0 && Math.random() < dt * 0.25) { B.mistake = 0.5 + Math.random(); B.mistakeCd = 6 + Math.random() * 10; }
    if (B.mistake > 0) B.mistake -= dt;

    const spd = Math.abs(S.vel);
    const look = 9 + spd * 0.72;
    const a1 = TRACK.at(T, S.lastS + look);
    const a2 = TRACK.at(T, S.lastS + look + 14);

    // 코너 급한 정도 (앞쪽 두 점의 방향 차)
    const cur = Math.abs(Math.atan2(a1.tan.x, a1.tan.z) - Math.atan2(a2.tan.x, a2.tan.z));
    const curv = Math.min(1, ((cur + Math.PI * 3) % (Math.PI * 2) - Math.PI + Math.PI * 2) % (Math.PI * 2));
    const bend = Math.min(1, Math.abs(((cur + Math.PI) % (Math.PI * 2)) - Math.PI) * 2.2);

    // 목표점: 중심에서 라인만큼 옆으로 + 코너 안쪽으로 파고들기
    const lane = B.line * a1.hw * 0.7 + Math.sin(B.wob * 0.5) * a1.hw * 0.18;
    const tx = a1.p.x + a1.side.x * lane, tz = a1.p.z + a1.side.z * lane;
    let want = Math.atan2(tx - S.pos.x, tz - S.pos.z);
    let d = want - S.yaw;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    let steer = Math.max(-1, Math.min(1, d * 1.9));
    if (B.mistake > 0) steer += Math.sin(B.wob * 9) * 0.5;

    // 속도: 코너가 급하면 살짝 놓는다
    let thr = 1;
    if (bend > 0.45 && spd > 15) thr = 0.55;
    if (bend > 0.75 && spd > 19) thr = 0.25;
    if (B.mistake > 0) thr *= 0.7;
    if (!S.onRoad) thr = 1;

    // 드리프트: 코너가 크고 빠를 때
    const drift = bend > 0.3 && spd > 12 && Math.abs(steer) > 0.2 && B.mistake <= 0;

    return { thr, steer, drift, _bend: bend };
  }

  // 실력 보정 (뒤처지면 조금 빨라지고, 너무 앞서면 조금 느려진다)
  function rubberFor(place, total, playerPlace) {
    const gap = place - playerPlace;
    if (gap > 0) return 1 - Math.min(0.06, gap * 0.012);
    return 1 + Math.min(0.07, -gap * 0.014);
  }

  window.AI = { brain, drive, rubberFor };
})();
