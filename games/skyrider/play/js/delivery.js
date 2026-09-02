// 배달 — 주문, 짐 종류, 빛기둥, 착륙 판정, 돈, 주민 한 마디
(function () {
  const T = TERRAIN;
  const rng = NOISE.makeRng(6061);
  // 하늘 위에 사는 사람들은 만드는 사람들이다 — 화가·작가·감독·가수·배우·유튜버·축구선수·CEO (2026-09-02)
  const NAMES = ['아틀리에', '집필실', '촬영장', '녹음실', '연습실', '방송실', '대기업', '훈련장', '편집실', '스튜디오'];
  const WHO = ['화가', '작가', '영화감독', '가수', '배우', '유튜버', 'CEO', '축구선수', '웹툰작가', '사진작가'];
  // 주민 멘트 — 사장님이 직접 씀 (2026-09-02). 갈 때마다 1번부터 순서대로 나온다
  const LINES = [
    ['잠깐만요. 지금 색감 잡고 있으니까 조용히요.', '이거 놓고 가지 마세요. 작품의 일부예요.', '피자 박스가 너무 예쁜데요? 캔버스로 써도 돼요?', '방금 문 여는 순간 영감이 떠올랐어요.', '제 그림보다 배달원님이 더 입체적이네요.', '이거 빨간색으로 칠하면 더 맛있어 보이겠죠?', '잠깐, 움직이지 마세요. 당신을 그리고 싶어요.', '배달비요? 현금 말고 그림으로 드려도 되죠?', '오늘은 붓보다 젓가락을 잡겠습니다.', '이 음식… 구도가 완벽하네요.'],
    ['잠깐만요. 지금 주인공이 죽기 직전이에요.', '배달원님, 혹시 오늘 있었던 일 좀 이야기해주실래요?', '문 앞에 두고 가세요. 인간관계는 피곤해서요.', '방금 노크 소리, 소설에 넣어도 되겠네요.', '배달원님 이름이 어떻게 되죠? 등장인물로 쓰게요.', '오늘 마감인데 음식까지 늦으면 제 인생도 늦습니다.', '이 음식의 향기를 묘사할 단어가 없어요.', '잠깐만요. 지금 엄청난 문장이 떠올랐어요.', '배달비가 올랐군요. 인플레이션을 소재로 써야겠어요.', '감사합니다. 당신은 오늘 제 소설의 첫 문장입니다.'],
    ['컷! 다시 들어와 주세요. 그림이 안 나왔어요.', '좋아요. 문 여는 타이밍 완벽했습니다.', '잠깐! 배달원님, 카메라 쪽 한번 봐주세요.', '이 장면은 롱테이크로 갑니다.', '음식 내려놓고 3초만 정지해 주세요.', '좋습니다. 자연스러웠어요. 다시 한 번만.', '이 배달, 예산 초과인데요?', '오늘 촬영 끝났습니다. 이제 먹죠.', '이건 상업영화보다 예술영화 냄새가 나네요.', '배달원님, 방금 표정 좋았습니다. 배우 하실 생각 없어요?'],
    ['띵동~ 배달왔네~♪', '잠깐만요. 지금 노래 녹음 중이에요.', '배달비 대신 제 신곡 불러드릴까요?', '오늘 목 상태가 좋아서 음식도 맛있게 먹을 수 있겠네요.', '이 냄새… 멜로디가 떠오르는데요?', '팬이세요? 사인부터 해드릴까요?', '제가 지금 배고픔이라는 감정을 노래로 표현해볼게요.', '이거 먹고 바로 앵콜 갑니다.', '배달원님, 목소리 좋으시네요.', '잠깐만요. 이 음식 먹기 전에 한 소절만.'],
    ['잠깐만요. 지금 제가 죽는 장면 촬영 중이라.', '배달원님, 저 알아보시겠어요?', '죄송한데 지금 캐릭터에서 빠져나오질 못했어요.', '이 음식 보고 놀라는 연기 한번 해볼까요?', '배달원님도 배우 같으신데요?', '감정 잡고 있었는데 하필 지금 오셨네요.', '이건 제가 출연한 영화보다 맛있어 보이네요.', '카메라 없죠? 그럼 편하게 들어오세요.', '이 음식은 대본에 없던 건데요?', '좋아요. 자연스럽게 문 닫아주세요. 컷!'],
    ['잠깐! 구독자 여러분한테 인사 한번 해주세요!', '배달원님, 카메라 보고 ‘좋아요’ 한번만!', '오늘 콘텐츠는 배달음식 리뷰입니다.', '이거 협찬 아니죠?', '잠깐만요. 언박싱부터 해야 돼요.', '배달원님 닉네임이 어떻게 되세요?', '오늘 조회수 좀 나오겠는데요?', '구독자 100만 명이 보고 있습니다.', '이거 먹방 찍어야 해서 30분만 기다려주세요.', '잠깐! 썸네일용 표정 하나만 부탁드릴게요.'],
    ['몇 분 늦으셨죠?', '좋습니다. 우리 회사 배송 시스템보다 빠르네요.', '배달원님, 우리 회사로 스카우트하고 싶은데요.', '영수증 처리해주세요. 법인카드입니다.', '지금부터 이 음식은 회의 안건입니다.', '이 정도 서비스면 투자 검토해보겠습니다.', '배달비가 얼마죠? 협상 가능합니까?', '우리 회사도 이런 속도로 일했으면 좋겠네요.', '좋아요. 계약서 보내드리죠.', '잠깐만요. 혹시 배달 플랫폼 대표님이세요?'],
    ['나이스! 정확한 어시스트였습니다!', '이건 골대 앞까지 직접 와주시네요.', '배달원님 패스가 기가 막히네요.', '오늘 경기보다 이게 더 기다려졌습니다.', '잠깐! 사인부터 해드릴까요?', '이 음식 먹고 후반전 뛰어야 합니다.', '배달비요? 오늘은 제가 골 넣어서 벌었습니다.', '이건 완벽한 크로스네요.', '10분만 기다려주세요. 아직 샤워 안 했어요.', '배달원님, 우리 팀으로 오세요. 스피드가 좋네요.'],
    ['잠깐만요. 지금 마감 3일째입니다.', '배달원님 얼굴 참고해도 돼요?', '이 장면 웹툰에 넣겠습니다.', '지금 손이 너무 아파서 문도 못 열어요.', '오늘도 원고보다 배달이 먼저 왔네요.', '작가님이라고 불러주세요. 오늘은 기분 좋으니까.', '잠깐, 그 포즈 그대로 있어보세요.', '이 음식이 다음 화의 복선입니다.', '연재 마감이 5시간 남았는데 밥부터 먹겠습니다.', '배달원님, 혹시 악역 할 생각 없으세요?'],
    ['잠깐만요. 빛이 너무 좋아요.', '음식 내려놓기 전에 사진부터 찍을게요.', '배달원님, 거기 그대로 서주세요.', '오늘의 컨셉은 자연스러움입니다.', '이 음식 색감이 미쳤네요.', '잠깐만요. 그림자까지 완벽해요.', '이건 필터 없이도 나오겠는데요?', '배달원님 손만 찍어도 작품 나오겠어요.', '사진 한 장만 찍고 드세요.', '오늘 최고의 피사체는 음식이 아니었네요.'],
  ];
  const PKG = [
    { key: 'food', name: '음식', icon: '🍱', w: 1.0, pay: 1.0, time: 1.0, fragile: false },
  ];
  const D = { targets: [], cur: null, home: null, money: 10, done: 0, late: 0, t: 0, limit: 0, state: 'idle', best: 0, pkg: PKG[0], value: 1, broken: false, lastFrom: null, pay: 0 };
  D.startMoney = D.money;
  // 저장 판: 판이 바뀌면 옛 기록(시험용 코인 등)을 한 번 지운다
  try { if (localStorage.getItem('maedal.sv') !== '2') { for (const k of ['maedal.money', 'maedal.garage', 'maedal.last', 'maedal.deliv']) localStorage.removeItem(k); localStorage.setItem('maedal.sv', '2'); } } catch (e) { }
  try { D.lastName = localStorage.getItem('maedal.last') || null; } catch (e) { }   // 다시 해도 같은 집이 연속으로 안 나오게
  try { D.best = parseInt(localStorage.getItem('maedal.deliv') || '0') || 0; const m = parseInt(localStorage.getItem('maedal.money')); if (!isNaN(m)) D.money = m; } catch (e) { }   // 죽어도 번 돈은 그대로

  let beam, glow, padRing, signSp, padDisc;
  function init(scene) {
    const huts = SCENERY.S.huts;
    for (let i = 0; i < huts.length; i++) {
      const h = huts[i];
      const pad = h.group.position.clone().lerp(h.pos, 0.8); pad.y = h.pos.y;   // 집 문 앞
      D.targets.push({ name: NAMES[i % NAMES.length] + (i >= NAMES.length ? ' ' + (Math.floor(i / NAMES.length) + 1) : ''), who: WHO[i % WHO.length], lines: LINES[i % LINES.length], pos: h.pos.clone(), pad, hut: h });
    }
    D.home = { name: '식당', pos: new THREE.Vector3(0, T.SUMMIT, 0) };
    const bg = new THREE.CylinderGeometry(1.2, 1.6, 300, 12, 1, true).translate(0, 150, 0);
    beam = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false }));
    beam.visible = false; beam.renderOrder = 8;   // 빛기둥은 안 쓴다 (미니맵으로 대체)
    const c = document.createElement('canvas'); c.width = c.height = 128; const ctx = c.getContext('2d');
    const gr = ctx.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,120,90,1)'); gr.addColorStop(0.3, 'rgba(255,70,40,0.45)'); gr.addColorStop(1, 'rgba(255,50,30,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, 128, 128);
    glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false, opacity: 0.9 }));
    glow.visible = false; glow.renderOrder = 20; scene.add(glow);
    padRing = new THREE.Mesh(new THREE.RingGeometry(1.35, 1.5, 4).rotateZ(Math.PI / 4).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }));
    padRing.visible = false; scene.add(padRing);
    // 초록 발판: 여기 내리면 배달
    padDisc = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x3ddb55, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }));
    padDisc.visible = false; padDisc.renderOrder = 4; scene.add(padDisc);
    // 'DELIVERY' 표지: 배달 갈 집 위에
    const sc = document.createElement('canvas'); sc.width = 512; sc.height = 160; const x = sc.getContext('2d');
    x.fillStyle = '#d42a1a'; x.beginPath(); x.roundRect(8, 8, 496, 144, 28); x.fill(); x.strokeStyle = '#fff3d0'; x.lineWidth = 8; x.stroke();
    x.fillStyle = '#fff'; x.font = 'bold 84px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('DELIVERY', 256, 84);
    const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace;
    signSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: st, transparent: true, depthTest: false, fog: false })); signSp.scale.set(6.4, 2, 1); signSp.renderOrder = 21; signSp.visible = false; scene.add(signSp);
  }

  // 집 칠하기: 배달 갈 집은 빨갛게
  function paintHut(t, on) {
    if (!t || !t.hut || !t.hut.group) return;
    t.hut.group.traverse(m => {
      if (!m.isMesh || !m.material || Array.isArray(m.material) || !m.material.emissive) return;
      if (m.userData.win) return;
      if (m.material.emissiveIntensity > 1) { m.userData.win = true; return; }   // 창문·등불은 그대로
      if (on) { m.userData.eh = m.material.emissive.getHex(); m.userData.ei = m.material.emissiveIntensity; m.material.emissive.setHex(0xff2a1a); m.material.emissiveIntensity = 0.35; m.material.fog = false; m.material.needsUpdate = true; }
      else if (m.userData.eh !== undefined) { m.material.emissive.setHex(m.userData.eh); m.material.emissiveIntensity = m.userData.ei; m.material.fog = true; m.material.needsUpdate = true; }
    });
  }
  function pickPkg() { let r = rng(); for (const p of PKG) { if (r < p.w) return p; r -= p.w; } return PKG[0]; }
  function pickNext(from) {
    const reach = 70 + D.done * 25;
    const skip = t => t !== D.cur && t.name !== D.lastName;
    const flat = t => Math.hypot(t.pos.x - from.x, t.pos.z - from.z);   // 높이 차는 빼고 거리만
    const cands = D.targets.filter(t => skip(t) && flat(t) < reach);
    const pool = cands.length ? cands : D.targets.filter(skip);
    const t = pool[Math.floor(rng() * pool.length)];
    paintHut(D.cur, false); paintHut(t, true);
    D.lastName = t.name; try { localStorage.setItem('maedal.last', t.name); } catch (e) { }
    D.cur = t; D.state = 'carry'; D.t = 0; D.pkg = pickPkg(); D.value = 1; D.broken = false;
    const dist = t.pos.distanceTo(from);
    D.limit = (24 + dist / 5) * D.pkg.time;   // 236m 이면 71초. 스쿠터로도 닿는 여유
    const bk = (window.GAME && GAME.BIKES) ? GAME.BIKES[GAME.GARAGE.cur] : null;   // 배달비는 기종마다 정해져 있다 (10·20·30·50·100)
    D.pay = bk && bk.pay ? bk.pay : 10;
    glow.visible = true; glow.position.copy(t.pos); glow.position.y += 3;
    padRing.visible = true; padRing.position.copy(t.pad); padRing.position.y += 0.16;
    padDisc.visible = true; padDisc.position.copy(t.pad); padDisc.position.y += 0.15;
    if (window.AUDIO && AUDIO.order) AUDIO.order();   // 딩동 먼저, 자막은 살짝 뒤에
    if (window.UI) setTimeout(function () { if (D.cur === t) UI.pop('🥄 주문 → ' + t.name); }, 600);
  }
  function begin(from) { D.lastFrom = from.clone(); pickNext(from); }

  // 부딪혔을 때 (충격 m/s). 깨지기 쉬운 짐은 값이 깎인다
  function hit(impact) {
    if (D.state !== 'carry' || !D.pkg.fragile || D.broken) return;
    D.value *= impact > 7 ? 0.35 : 0.6;
    if (D.value < 0.2) { D.broken = true; D.value = 0; if (window.UI) UI.msg('짐이 깨졌다…', true); }
    else if (window.UI) UI.msg('짐이 흔들렸다!  값 ' + Math.round(D.value * 100) + '%');
  }

  function update(dt, bikePos, speed) {
    if (D.state !== 'carry' || !D.cur) return;
    D.t += dt;
    const t = D.cur;
    const dx = bikePos.x - t.pad.x, dz = bikePos.z - t.pad.z, dy = bikePos.y - t.pad.y;
    const hd = Math.hypot(dx, dz);
    const onPad = hd < 1.4 && dy > -1 && dy < 2.0;   // 초록 발판 위에 내렸을 때
    if (onPad && speed < 3.5) {
      D.hover = (D.hover || 0) + dt;
      if (D.hover > 0.8) {
        D.hover = 0;
        const late = D.t > D.limit;
        const pay = Math.round(D.pay * D.value * (late ? 0.5 : 1));   // 늦으면 반값
        D.done++; if (late) D.late++;
        if (D.done > D.best) { D.best = D.done; try { localStorage.setItem('maedal.deliv', String(D.best)); } catch (e) { } }
        // 멘트가 먼저, 동전은 1.2초 뒤에 올라간다. 멘트는 집마다 1번부터 순서대로
        t.lineIdx = t.lineIdx || 0;
        // 말풍선으로 멘트 (집마다 1번부터 순서대로). 제때면 그다음 코인, 늦으면 코인 대신 말풍선 한 번 더
        const line = t.lines[t.lineIdx % t.lines.length]; t.lineIdx++;
        const who = t.name + ' ' + t.who;
        if (window.UI) UI.bubble(who, line, late ? 2.6 : 2.8);
        const coin = function () { D.money += pay; if (window.UI) UI.pop('🪙 +' + pay); };
        if (late) {
          setTimeout(function () { if (window.UI) UI.bubble(who, '늦었으니까 음식값은 반만 받아요', 2.8); }, 2800);
          setTimeout(coin, 4300);
        } else {
          setTimeout(coin, 1500);
        }
        if (window.AUDIO && AUDIO.deliver) AUDIO.deliver(!late && !D.broken);
        if (window.FX) FX.dust({ x: t.pos.x, y: t.pos.y + 0.3, z: t.pos.z }, 20);
        D.lastFrom = t.pos.clone();
        D.state = 'idle'; glow.visible = padRing.visible = padDisc.visible = signSp.visible = false; paintHut(t, false);
        setTimeout(() => { if (D.state === 'idle') pickNext(D.lastFrom); }, late ? 7000 : 4500);   // 말풍선·코인 다 지나간 뒤 다음 주문
      }
    } else D.hover = 0;
    const gs = 4 + Math.min(30, bikePos.distanceTo(t.pos) * 0.08); glow.scale.set(gs, gs, 1);
    padDisc.material.opacity = 0.45 + 0.2 * Math.sin(performance.now() * 0.005);
  }

  // 다시 시작: 주문·표시를 걷는다 (코인·집 멘트 순서는 그대로)
  function reset() {
    paintHut(D.cur, false); D.cur = null; D.state = 'idle'; D.t = 0; D.hover = 0;
    glow.visible = padRing.visible = padDisc.visible = signSp.visible = false;
  }
  window.DELIVERY = { D, init, begin, update, hit, reset };
})();
