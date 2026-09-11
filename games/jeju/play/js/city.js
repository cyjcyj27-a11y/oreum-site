// 도시·시골 — 마을 격자 블록 건물, 간판, 지붕, 신호등, 가로등, 야자수, 돌담 밭, 감귤밭, 숲, 돌하르방. 충돌 목록(obst)
(function () {
  const I = ISLAND, H = I.H, smooth = I.smooth;
  const rng = NOISE.makeRng(20260903);
  const R = () => rng();
  const Mtx = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3(), COL = new THREE.Color();
  const YUP = new THREE.Vector3(0, 1, 0);

  function mergeGeos(list) {
    const P = [], Nn = [], U = [], Cc = [], Ac = [];
    for (const it of list) {
      let g = it.g.index ? it.g.toNonIndexed() : it.g.clone();
      if (it.m) g.applyMatrix4(it.m);
      const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
      const col = it.c || [1, 1, 1], ac = it.a || [0, 0];
      for (let i = 0; i < p.count; i++) { P.push(p.getX(i), p.getY(i), p.getZ(i)); Nn.push(n.getX(i), n.getY(i), n.getZ(i)); U.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0); Cc.push(col[0], col[1], col[2]); Ac.push(ac[0], ac[1]); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setAttribute('aCar', new THREE.Float32BufferAttribute(Ac, 2));
    return g;
  }
  function T(x, y, z, rx, ry, rz, sx, sy, sz) { const m = new THREE.Matrix4(); m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), new THREE.Vector3(sx == null ? 1 : sx, sy == null ? 1 : sy, sz == null ? 1 : sz)); return m; }
  function instOne(geo, mat, items, opts) {
    const n = items.length; if (!n) return null;
    const m = new THREE.InstancedMesh(geo, mat, n);
    let cx = 0, cy = 0, cz = 0, ms = 1;
    for (let i = 0; i < n; i++) {
      const it = items[i]; Q.setFromAxisAngle(YUP, it.yaw || 0); V.set(it.x, it.y, it.z); SC.set(it.sx || 1, it.sy || 1, it.sz || 1);
      Mtx.compose(V, Q, SC); m.setMatrixAt(i, Mtx); if (it.color != null) m.setColorAt(i, COL.set(it.color));
      cx += it.x; cy += it.y; cz += it.z; ms = Math.max(ms, SC.x, SC.y, SC.z);
    }
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.castShadow = !(opts && opts.noShadow); m.receiveShadow = true;
    // 셀 하나면 경계 구를 손으로 재서 시야 밖·그림자 밖이면 안 그린다 (GTA 식 컬링)
    if (opts && opts.cull) {
      if (!geo.boundingSphere) geo.computeBoundingSphere();
      cx /= n; cy /= n; cz /= n; let r = 0;
      for (const it of items) r = Math.max(r, Math.hypot(it.x - cx, it.y - cy, it.z - cz));
      m.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), r + geo.boundingSphere.radius * ms); m.frustumCulled = true;
    } else m.frustumCulled = false;
    return m;
  }
  // opts.chunk: 셀 크기(m). 셀마다 인스턴스 메시 하나. opts.far: 그 거리 밖은 안 그림. opts.lod + opts.lodDist: 멀면 저폴리로
  function inst(geo, mat, items, opts) {
    const n = items.length; if (!n) return null;
    if (!(opts && opts.chunk)) return instOne(geo, mat, items, opts);
    const cs = opts.chunk, groups = new Map();
    for (const it of items) { const k = Math.floor(it.x / cs) * 100003 + Math.floor(it.z / cs); let a = groups.get(k); if (!a) { a = []; groups.set(k, a); } a.push(it); }
    const grp = new THREE.Group(); grp.frustumCulled = false; const o2 = Object.assign({}, opts, { cull: true });
    for (const a of groups.values()) {
      const m = instOne(geo, mat, a, o2); grp.add(m);
      let lo = null; if (opts.lod) { lo = instOne(opts.lod, mat, a, o2); lo.visible = false; grp.add(lo); }
      const b = m.boundingSphere; S.chunks.push({ hi: m, lo, cx: b.center.x, cz: b.center.z, r: b.radius, near: opts.lodDist || 0, far: opts.far || 0 });
    }
    return grp;
  }
  // 카메라 거리로 셀마다 보이기·저폴리 고르기 (매 프레임)
  function updateChunks(cam) {
    if (!cam) return;
    for (const c of S.chunks) {
      const d = Math.hypot(c.cx - cam.x, c.cz - cam.z) - c.r;
      if (c.far && d > c.far) { c.hi.visible = false; if (c.lo) c.lo.visible = false; continue; }
      if (c.lo) { const hi = d < c.near; c.hi.visible = hi; c.lo.visible = !hi; } else c.hi.visible = true;
    }
  }
  window.GEO = { mergeGeos, T, inst };

  function windowTex() {
    const W = 512, cw = W / 8;
    const c = document.createElement('canvas'), e = document.createElement('canvas'), rc = document.createElement('canvas'); c.width = c.height = e.width = e.height = rc.width = rc.height = W;
    const g = c.getContext('2d'), ge = e.getContext('2d'), gr = rc.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, W); ge.fillStyle = '#000'; ge.fillRect(0, 0, W, W); gr.fillStyle = '#e0e0e0'; gr.fillRect(0, 0, W, W);
    // 벽 바탕: 콘크리트 사진 (있으면). 창은 그 위에 그린다
    // 벽 사진: painted_plaster_wall(회벽). 예전 concrete_wall_003 은 곰팡이 얼룩·균열이 심해
    // 건물마다 폭격 맞은 것처럼 보였다 (사장님 2026-09-10). 사진이 없으면 예전 것으로 물러난다
    const wall = TEX.P.painted_plaster_wall || TEX.P.beige_wall_001 || TEX.P.concrete_wall_003;
    if (wall && wall.map && wall.map.image) { g.drawImage(wall.map.image, 0, 0, W, W); g.fillStyle = 'rgba(255,255,255,0.24)'; g.fillRect(0, 0, W, W); }
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
      const x = i * cw, y = j * cw;
      g.fillStyle = 'rgba(0,0,0,' + (0.02 + R() * 0.05) + ')'; g.fillRect(x, y, cw, cw);
      const wx = x + cw * 0.22, wy = y + cw * 0.2, ww = cw * 0.56, wh = cw * 0.52;
      g.fillStyle = '#2c3540'; g.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);
      const sh = R(); g.fillStyle = 'rgb(' + Math.floor(22 + sh * 26) + ',' + Math.floor(28 + sh * 28) + ',' + Math.floor(36 + sh * 30) + ')'; g.fillRect(wx, wy, ww, wh);
      g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(wx, wy, ww * 0.5, wh * 0.4); g.fillStyle = '#4a4f55'; g.fillRect(wx + ww / 2 - 1, wy, 2, wh);
      if (R() < 0.35) { g.fillStyle = 'rgba(230,225,215,0.55)'; g.fillRect(wx + 2, wy + 2, ww - 4, wh * (0.3 + R() * 0.4)); }   // 블라인드·커튼
      g.fillStyle = 'rgba(0,0,0,0.14)'; g.fillRect(x, y + cw - 3, cw, 3);
      g.fillStyle = 'rgba(0,0,0,' + (0.05 + R() * 0.07) + ')'; g.fillRect(wx - 3, wy + wh + 2, ww + 6, 4 + R() * 6);   // 창틀 아래 얼룩
      for (let q = 0; q < 2; q++) if (R() < 0.6) { const sx = wx + R() * ww, sw = 1 + R() * 3, sl = cw * (0.15 + R() * 0.3); g.fillStyle = 'rgba(20,20,25,' + (0.05 + R() * 0.08) + ')'; g.fillRect(sx, wy + wh, sw, sl); }   // 물때
      gr.fillStyle = '#262626'; gr.fillRect(wx, wy, ww, wh);
      if (R() < 0.45) { const warm = R() < 0.8; ge.fillStyle = warm ? 'rgb(255,' + (190 + Math.floor(R() * 40)) + ',' + (110 + Math.floor(R() * 50)) + ')' : 'rgb(200,225,255)'; ge.fillRect(wx, wy, ww, wh); }
    }
    { const img = g.getImageData(0, 0, W, W); const d = img.data; for (let k = 0; k < d.length; k += 4) { const n = (R() - 0.5) * 14; d[k] += n; d[k + 1] += n; d[k + 2] += n; } g.putImageData(img, 0, 0); }   // 콘크리트 알갱이
    const t = new THREE.CanvasTexture(c), te = new THREE.CanvasTexture(e), tr = new THREE.CanvasTexture(rc);
    t.wrapS = t.wrapT = te.wrapS = te.wrapT = tr.wrapS = tr.wrapT = THREE.RepeatWrapping; t.colorSpace = te.colorSpace = THREE.SRGBColorSpace; t.anisotropy = te.anisotropy = tr.anisotropy = 4;
    return { map: t, emissive: te, rough: tr };
  }
  const SIGN_WORDS = ['횟집', '흑돼지', '카페', '감귤', '편의점', '노래방', 'PC방', '약국', '치킨', '해장국', '올레', '고기국수', '마트', '호텔', '은행', '빵집'];
  function signTex() {
    const W = 1024, Hh = 512, tw = W / 4, th = Hh / 4;
    const c = document.createElement('canvas'); c.width = W; c.height = Hh; const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, Hh); g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let k = 0; k < 16; k++) {
      const x = (k % 4) * tw, y = Math.floor(k / 4) * th;
      g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x, y, tw, 4); g.fillRect(x, y, 4, th);
      g.fillStyle = '#111'; if (k % 3 === 0) { g.fillRect(x + 6, y + 6, tw - 12, th - 12); g.fillStyle = '#fff'; }
      g.font = '900 ' + (SIGN_WORDS[k].length > 3 ? 72 : 92) + 'px "Ria", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
      g.fillText(SIGN_WORDS[k], x + tw / 2, y + th / 2 + 4);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  function frondTex() {
    const W = 256, Hh = 64; const c = document.createElement('canvas'); c.width = W; c.height = Hh; const g = c.getContext('2d');
    g.strokeStyle = '#3b6b2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, Hh / 2); g.lineTo(W, Hh / 2); g.stroke();
    for (let i = 0; i < 40; i++) {
      const x = 8 + i * 6.2, len = (Hh / 2 - 4) * (0.5 + 0.5 * Math.sin(i / 40 * Math.PI)) * (0.85 + R() * 0.3);
      g.strokeStyle = 'rgb(' + (40 + Math.floor(R() * 30)) + ',' + (110 + Math.floor(R() * 50)) + ',' + (40 + Math.floor(R() * 20)) + ')'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(x, Hh / 2); g.lineTo(x + 10, Hh / 2 - len); g.stroke(); g.beginPath(); g.moveTo(x, Hh / 2); g.lineTo(x + 10, Hh / 2 + len); g.stroke();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  const S = { chunks: [], obst: { boxes: [], circles: [] }, lampMesh: null, lampState: 0, lampT: 0, wallMat: null, streetLampMat: null, palmSh: [], parked: [], trees: [], walls: [], oranges: [], harubang: [] };
  const WALLC = [0xcfc8b8, 0xbdb5a5, 0xa9a49a, 0xd6cfc0, 0x9c968c, 0xb9ad98, 0xa3a8ad, 0xc9bfb2, 0x8e8880, 0x7f8790, 0xb08a6a, 0xc4bfb6];
  const HIPC = [0xffffff, 0xe8e2da, 0xbfc9d8, 0xc9cfbe, 0xd8bcae, 0x9aa3b0, 0xf0e8dc];   // 기와 사진 위에 곱하는 색조 (제주 지붕: 붉은 기와·파란 함석·회색)
  const SIGNC = [0xd42a2a, 0x1f5fd0, 0x1d8a4a, 0xf0c020, 0xf4f4f4, 0xe8712a, 0xd42a2a, 0x1f5fd0, 0xffffff];
  const CARC = [0xf4f4f4, 0xf4f4f4, 0xf4f4f4, 0x1a1a1c, 0x9aa0a6, 0x9aa0a6, 0x2a3f7a, 0x8a2a2a, 0xe8e8e8];

  function init(scene) {
    const tex = windowTex();
    const boxG = new THREE.BoxGeometry(1, 1, 1); boxG.translate(0, 0.5, 0);
    const bCount = 7000;
    const aRep = new Float32Array(bCount * 3), aOff = new Float32Array(bCount * 2);
    boxG.setAttribute('aRep', new THREE.InstancedBufferAttribute(aRep, 3)); boxG.setAttribute('aOff', new THREE.InstancedBufferAttribute(aOff, 2));
    const wallMat = new THREE.MeshStandardMaterial({ map: tex.map, emissiveMap: tex.emissive, emissive: 0xffdca0, emissiveIntensity: 0, roughness: 1.0, metalness: 0.0, roughnessMap: tex.rough, normalMap: TEX.windowN, normalScale: new THREE.Vector2(0.9, 0.9) });
    wallMat.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aRep; attribute vec2 aOff; varying vec2 vWUv; varying float vAO;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\n{ float cx = abs(normal.x) > 0.5 ? aRep.z : aRep.x; float isTop = step(0.5, abs(normal.y)); vWUv = mix(vec2(uv.x * cx, uv.y * aRep.y) + aOff, vec2(0.02, 0.98), isTop); vAO = mix(0.55 + 0.45 * smoothstep(0.0, 3.2, position.y * aRep.y * 25.6), 1.0, isTop); }');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vWUv; varying float vAO;')
        .replace('#include <map_fragment>', 'vec4 sampledDiffuseColor = texture2D( map, vWUv ); diffuseColor *= sampledDiffuseColor; diffuseColor.rgb *= vAO;')
        .replace('#include <emissivemap_fragment>', 'vec4 emissiveColor = texture2D( emissiveMap, vWUv ); totalEmissiveRadiance *= emissiveColor.rgb;')
        .replace('#include <normal_fragment_maps>', '{ vec3 mapN = texture2D( normalMap, vWUv ).xyz * 2.0 - 1.0; mapN.xy *= normalScale; normal = normalize( tbn * mapN ); }')
        .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = roughness * texture2D( roughnessMap, vWUv ).g;');
    };
    S.wallMat = wallMat;
    const bld = new THREE.InstancedMesh(boxG, wallMat, bCount); bld.castShadow = true; bld.receiveShadow = true; bld.frustumCulled = false;
    let bi = 0;
    const roofs = [], tanks = [], signs = [], hips = [], cars = [], lamps = [], palms = [], trees = S.trees, walls = S.walls, oranges = S.oranges, harubang = S.harubang, acs = [];
    function addBuilding(x, z, w, d, floors, opts) {
      if (bi >= bCount) return;
      for (const sp of SPOTS.list) { const rr = sp.kind === 'shop' ? 70 : 30; if (Math.abs(sp.x - x) < rr + w / 2 && Math.abs(sp.z - z) < rr + d / 2) return; }
      // 도로 위에는 세우지 않는다. 블록을 채우다 보면 길 한복판에 건물이 얹혔다
      // (2026-09-10: 공항 앞 해안도로에 26m 건물이 있어 차가 그대로 통과했다)
      // ROADS.nearest 의 d 는 이미 도로 폭 절반을 뺀 값이라, 0 보다 작으면 도로 안이다.
      // 가운데만 보면 큰 건물이 모서리로 길을 물고 있는 것을 놓쳐서, 아홉 자리를 찍어 본다.
      if (window.ROADS) { const hw = w / 2, hd = d / 2;
        for (const [sx, sz] of [[0, 0], [-1, -1], [1, -1], [-1, 1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const n = ROADS.nearest(x + sx * hw, z + sz * hd); if (n.e && n.d < 1) return; } }
      const y = H(x, z) - 0.4, h = floors * 3.2 + 0.4;
      S.obst.boxes.push({ x0: x - w / 2, z0: z - d / 2, x1: x + w / 2, z1: z + d / 2 });
      Q.identity(); V.set(x, y, z); SC.set(w, h, d); Mtx.compose(V, Q, SC); bld.setMatrixAt(bi, Mtx); bld.setColorAt(bi, COL.set(opts.color));
      aRep[bi * 3] = Math.max(1, Math.round(w / 3.4)) / 8; aRep[bi * 3 + 1] = floors / 8; aRep[bi * 3 + 2] = Math.max(1, Math.round(d / 3.4)) / 8;
      aOff[bi * 2] = Math.floor(R() * 8) / 8; aOff[bi * 2 + 1] = Math.floor(R() * 8) / 8; bi++;
      const top = y + h;
      if (opts.hip) hips.push({ x, y: top - 0.05, z, sx: w / 2 + 0.6, sy: 1.6 + Math.min(w, d) * 0.12, sz: d / 2 + 0.6, color: HIPC[Math.floor(R() * HIPC.length)] });
      else {
        roofs.push({ x, y: top, z, sx: w + 0.3, sy: 0.4, sz: d + 0.3, color: 0x57534e });
        if (R() < 0.5) tanks.push({ x: x + (R() - 0.5) * w * 0.5, y: top + 0.4, z: z + (R() - 0.5) * d * 0.5, color: R() < 0.6 ? 0xe8c530 : 0x2a6fc0 });
        if (floors >= 6 && R() < 0.5) roofs.push({ x: x + (R() - 0.5) * w * 0.4, y: top + 0.4, z: z + (R() - 0.5) * d * 0.4, sx: 3, sy: 2.6, sz: 3, color: 0x8d8983 });
      }
      // 실외기: 길 쪽 면 창 아래
      if (floors >= 2 && opts.face != null && R() < 0.7) {
        const n = 1 + Math.floor(R() * Math.min(3, floors - 1));
        for (let k = 0; k < n; k++) {
          const fl = 1 + Math.floor(R() * (floors - 1)); const ay = y + 0.4 + fl * 3.2 + 0.9; const dir = opts.face; const off = (R() - 0.5) * (dir < 2 ? w : d) * 0.7;
          let ax = x, az = z, yaw = 0;
          if (dir === 0) { az = z + d / 2 + 0.25; ax = x + off; } else if (dir === 1) { az = z - d / 2 - 0.25; ax = x + off; yaw = Math.PI; } else if (dir === 2) { ax = x + w / 2 + 0.25; az = z + off; yaw = Math.PI / 2; } else { ax = x - w / 2 - 0.25; az = z + off; yaw = -Math.PI / 2; }
          acs.push({ x: ax, y: ay, z: az, yaw, sx: 0.8, sy: 0.6, sz: 0.34, color: R() < 0.7 ? 0xd9d9d2 : 0xb8b4ac });
        }
      }
      if (opts.signs) {
        const nS = 1 + Math.floor(R() * Math.min(3, floors));
        for (let k = 0; k < nS; k++) {
          const sy = y + 0.4 + k * 3.2 + 2.1, sw = w * (0.55 + R() * 0.35), dir = opts.face;
          let sx = x, sz = z, yaw = 0;
          if (dir === 0) { sz = z + d / 2 + 0.12; } else if (dir === 1) { sz = z - d / 2 - 0.12; yaw = Math.PI; } else if (dir === 2) { sx = x + w / 2 + 0.12; yaw = Math.PI / 2; } else { sx = x - w / 2 - 0.12; yaw = -Math.PI / 2; }
          signs.push({ x: sx, y: sy, z: sz, yaw, sx: sw, sy: 0.9, sz: 0.2, color: SIGNC[Math.floor(R() * SIGNC.length)], tile: Math.floor(R() * 16) });
        }
      }
    }
    S.addBuilding = addBuilding;
    // ── 마을 블록 ──
    for (const t of ROADS.towns) {
      const cell = t.cell, rw = t.road, half = rw / 2;
      for (let c = 0; c < t.cols; c++) for (let r = 0; r < t.rows; r++) {
        const bx0 = t.x0 + c * cell + half + 3 + (c === t.mainCol ? 5 : 0), bz0 = t.z0 + r * cell + half + 3 + (r === t.mainRow && t.big ? 5 : 0);
        const bx1 = t.x0 + (c + 1) * cell - half - 3 - (c + 1 === t.mainCol ? 5 : 0), bz1 = t.z0 + (r + 1) * cell - half - 3 - (r + 1 === t.mainRow && t.big ? 5 : 0);
        const cx = (bx0 + bx1) / 2, cz = (bz0 + bz1) / 2;
        if (I.coastDist(cx, cz) < 20) continue;
        const rr = I.hash2((c + 11 + t.x0) | 0, (r + 7 + t.z0) | 0);
        const nearMain = r === t.mainRow || c === t.mainCol || r + 1 === t.mainRow || c + 1 === t.mainCol;
        let kind;
        if (!t.big) kind = rr < 0.5 ? 'house' : rr < 0.85 ? 'mixed' : 'park';
        else if (r >= t.rows - 2 && rr < 0.25) kind = 'apt'; else if (rr < 0.08) kind = 'park'; else if (nearMain || r <= 0) kind = 'commercial'; else kind = rr < 0.55 ? 'mixed' : 'house';
        if (kind === 'park') { for (let k = 0; k < 10; k++) { const x = bx0 + 3 + R() * (bx1 - bx0 - 6), z = bz0 + 3 + R() * (bz1 - bz0 - 6); trees.push({ x, y: H(x, z), z, sc: 2.2 + R() * 1.6, dark: true }); } if (R() < 0.5) harubang.push({ x: cx, z: cz, yaw: R() * 6.28 }); continue; }
        if (kind === 'apt') { const n = 2 + Math.floor(R() * 2), fl = 15 + Math.floor(R() * 6); for (let k = 0; k < n; k++) { const z = bz0 + 8 + (k + 0.5) * ((bz1 - bz0 - 16) / n); addBuilding(cx, z, bx1 - bx0 - 8, 11, fl, { color: 0xe6dfd2 }); } continue; }
        const sides = [{ face: 0, len: bx1 - bx0, ax: 1, x: bx0, z: bz1 }, { face: 1, len: bx1 - bx0, ax: 1, x: bx0, z: bz0 }, { face: 2, len: bz1 - bz0, ax: 0, x: bx1, z: bz0 }, { face: 3, len: bz1 - bz0, ax: 0, x: bx0, z: bz0 }];
        const depth = kind === 'commercial' ? 15 : 12;
        for (const sd of sides) {
          const inset = sd.ax === 0 ? depth + 1.5 : 0; let p = inset;
          while (p < sd.len - inset - 6) {
            const L = Math.min(8 + R() * 8, sd.len - inset - p); if (L < 6) break;
            let x, z, w, d;
            if (sd.ax === 1) { x = sd.x + p + L / 2; w = L - 0.8; d = depth - 2 + R() * 3; z = sd.face === 0 ? sd.z - d / 2 - 0.5 : sd.z + d / 2 + 0.5; }
            else { z = sd.z + p + L / 2; d = L - 0.8; w = depth - 2 + R() * 3; x = sd.face === 2 ? sd.x - w / 2 - 0.5 : sd.x + w / 2 + 0.5; }
            let floors, hip = false, sg = false;
            if (kind === 'commercial') { floors = 4 + Math.floor(R() * (r === 0 && R() < 0.3 ? 10 : 6)); sg = true; }
            else if (kind === 'mixed') { floors = 2 + Math.floor(R() * (t.big ? 4 : 2)); sg = R() < 0.6; hip = floors <= 2 && R() < 0.5; }
            else { floors = 1 + Math.floor(R() * (t.big ? 3 : 2)); hip = R() < 0.65; sg = R() < 0.15; }
            if (R() < 0.08) { p += L; continue; }
            addBuilding(x, z, w, d, floors, { color: WALLC[Math.floor(R() * WALLC.length)], hip, signs: sg, face: sd.face });
            if (R() < 0.3) { const cx2 = sd.ax === 1 ? x : (sd.face === 2 ? sd.x + 3 + 1.1 : sd.x - 3 - 1.1), cz2 = sd.ax === 1 ? (sd.face === 0 ? sd.z + 3 + 1.1 : sd.z - 3 - 1.1) : z; cars.push({ x: cx2, z: cz2, yaw: sd.ax === 1 ? Math.PI / 2 : 0, color: CARC[Math.floor(R() * CARC.length)] }); }
            p += L;
          }
        }
        if (R() < 0.6) for (let k = 0; k < 3; k++) { const x = cx + (R() - 0.5) * 16, z = cz + (R() - 0.5) * 16; trees.push({ x, y: H(x, z), z, sc: 1.4 + R() * 1.4, dark: false }); }
      }
    }
    // ── 마을 밖 길가 집들 ──
    for (const pl of ROADS.polylines) {
      if (pl.type !== 'ring' && pl.type !== 'mid') continue;
      for (let i = 0; i < pl.nodes.length; i += 2) {
        const nd = pl.nodes[i]; if (nd.town || nd.deg > 2 || R() < 0.55) continue;
        const nx = pl.nodes[(i + 1) % pl.nodes.length]; const dx = nx.x - nd.x, dz = nx.z - nd.z, L = Math.hypot(dx, dz) || 1; const rx = -dz / L, rz = dx / L;
        const side = R() < 0.5 ? 1 : -1, off = pl.w / 2 + 9;
        const x = nd.x + rx * off * side, z = nd.z + rz * off * side;
        if (I.coastDist(x, z) < 12 || H(x, z) > 240) continue;
        addBuilding(x, z, 10 + R() * 4, 9 + R() * 3, 1 + Math.floor(R() * 2), { color: WALLC[Math.floor(R() * WALLC.length)], hip: R() < 0.7, signs: R() < 0.4, face: side > 0 ? 1 : 0 });
      }
    }
    S.finishBuildings = function () { bld.count = bi; bld.instanceMatrix.needsUpdate = true; if (bld.instanceColor) bld.instanceColor.needsUpdate = true; boxG.attributes.aRep.needsUpdate = true; boxG.attributes.aOff.needsUpdate = true; };
    S.finishBuildings(); scene.add(bld);
    S.roofs = roofs; S.hips = hips; S.tanks = tanks; S.signs = signs; S.acs = acs;
    S.finishRoofs = function () {
      const plain = new THREE.MeshStandardMaterial({ roughness: 0.9 });
      scene.add(inst(boxG, plain, roofs, { chunk: 500 }));
      const tankG = new THREE.CylinderGeometry(0.8, 0.8, 1.4, 10); tankG.translate(0, 0.7, 0); if (tanks.length) scene.add(inst(tankG, new THREE.MeshStandardMaterial({ roughness: 0.6 }), tanks, { chunk: 500, far: 700 }));
      const hipG = new THREE.ConeGeometry(Math.SQRT2, 1, 4, 1); hipG.rotateY(Math.PI / 4); hipG.translate(0, 0.5, 0);
      const roof = TEX.P.roof_09; const hipMat = roof && roof.map ? new THREE.MeshStandardMaterial({ roughness: 1, map: TEX.rep(roof.map, 6, 2), normalMap: TEX.rep(roof.normal, 6, 2), roughnessMap: TEX.rep(roof.rough, 6, 2) }) : new THREE.MeshStandardMaterial({ roughness: 0.8, flatShading: true });
      if (hips.length) scene.add(inst(hipG, hipMat, hips, { chunk: 500 }));
      const sgG = new THREE.BoxGeometry(1, 1, 1); const sgTile = new Float32Array(signs.length * 2);
      signs.forEach((s, i) => { sgTile[i * 2] = (s.tile % 4) / 4; sgTile[i * 2 + 1] = 1 - Math.floor(s.tile / 4) / 4 - 0.25; });
      sgG.setAttribute('aTile', new THREE.InstancedBufferAttribute(sgTile, 2));
      const sgT = signTex(); const sgMat = new THREE.MeshStandardMaterial({ map: sgT, emissiveMap: sgT, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.55, metalness: 0.05 }); S.signMat = sgMat;
      sgMat.onBeforeCompile = sh => {
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aTile; varying vec2 vSUv;').replace('#include <uv_vertex>', '#include <uv_vertex>\n{ float front = step(0.5, normal.z); vSUv = mix(vec2(0.01, 0.99), aTile + vec2(uv.x * 0.25, uv.y * 0.25), front); }');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vSUv;').replace('#include <map_fragment>', 'vec4 sampledDiffuseColor = texture2D( map, vSUv ); diffuseColor *= sampledDiffuseColor;').replace('#include <emissivemap_fragment>', 'totalEmissiveRadiance *= texture2D( emissiveMap, vSUv ).rgb;');
      };
      if (signs.length) scene.add(inst(sgG, sgMat, signs, { noShadow: true, chunk: 500, far: 900 }));
      if (acs.length) scene.add(inst(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.2 }), acs, { noShadow: true, chunk: 500, far: 500 }));
    };
    S.parked = cars.map(c => ({ x: c.x, y: H(c.x, c.z), z: c.z, yaw: c.yaw, color: c.color }));
    for (const c of cars) S.obst.circles.push({ x: c.x, z: c.z, r: 1.6, kind: 'car' });

    // ── 신호등 (큰 도시 교차로) ──
    const poleG = mergeGeos([{ g: new THREE.CylinderGeometry(0.14, 0.18, 6.2, 8), m: T(0, 3.1, 0), c: [0.35, 0.36, 0.38] }, { g: new THREE.CylinderGeometry(0.1, 0.12, 5.5, 8), m: T(2.75, 5.9, 0, 0, 0, Math.PI / 2), c: [0.35, 0.36, 0.38] }, { g: new THREE.BoxGeometry(1.9, 0.55, 0.4), m: T(4.2, 5.5, 0), c: [0.12, 0.12, 0.13] }]);
    const lampItems = [], poleItems = [];
    for (const nd of ROADS.lightNodes) {
      let wx = 12, wz = 12; for (const e of nd.out) { if (e.ns) wx = Math.max(wx, e.w); else wz = Math.max(wz, e.w); }
      const x = nd.x, z = nd.z, y = H(x, z);
      const ps = [{ x: x - wx / 2 - 1.5, z: z + wz / 2 + 1.5, yaw: 0, ns: true }, { x: x + wx / 2 + 1.5, z: z - wz / 2 - 1.5, yaw: Math.PI, ns: true }, { x: x + wx / 2 + 1.5, z: z + wz / 2 + 1.5, yaw: Math.PI / 2, ns: false }, { x: x - wx / 2 - 1.5, z: z - wz / 2 - 1.5, yaw: -Math.PI / 2, ns: false }];
      for (const p of ps) {
        p.y = y; poleItems.push(p); S.obst.circles.push({ x: p.x, z: p.z, r: 0.3, kind: 'pole' });
        for (let k = 0; k < 3; k++) { const lx = 4.2 + (k - 1) * 0.6, lz = 0.22; lampItems.push({ x: p.x + Math.cos(p.yaw) * lx + Math.sin(p.yaw) * lz, y: y + 5.5, z: p.z - Math.sin(p.yaw) * lx + Math.cos(p.yaw) * lz, sx: 0.2, sy: 0.2, sz: 0.2, color: 0x222222, ns: p.ns, k }); }
      }
    }
    if (poleItems.length) { scene.add(inst(poleG, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.4 }), poleItems, { noShadow: true, chunk: 500, far: 900 })); S.lampMesh = inst(new THREE.SphereGeometry(1, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }), lampItems, { noShadow: true }); S.lampItems = lampItems; scene.add(S.lampMesh); applyLamps(); }

    // ── 가로등 ──
    const slG = mergeGeos([{ g: new THREE.CylinderGeometry(0.1, 0.16, 9, 8), m: T(0, 4.5, 0), c: [0.4, 0.42, 0.45] }, { g: new THREE.CylinderGeometry(0.07, 0.09, 2.6, 6), m: T(1.2, 8.9, 0, 0, 0, Math.PI / 2 - 0.25), c: [0.4, 0.42, 0.45] }]);
    const headItems = [];
    function lampPost(x, z, yaw) { if (I.coastDist(x, z) < 8) return; const y = H(x, z); lamps.push({ x, y, z, yaw }); S.obst.circles.push({ x, z, r: 0.25, kind: 'pole' }); headItems.push({ x: x + Math.cos(yaw) * 2.35, y: y + 9.15, z: z - Math.sin(yaw) * 2.35, sx: 0.7, sy: 0.25, sz: 0.35, yaw }); }
    for (const e of ROADS.edges) {
      if (!(e.type === 'city' || e.type === 'town') || e.a.id > e.b.id) continue;
      if (e.lanes !== 2 && !(e.type === 'town' && !e.ns)) continue;
      const n = Math.floor(e.len / 30); for (let i = 1; i <= n; i++) { const t = i / (n + 1), x = e.a.x + (e.b.x - e.a.x) * t, z = e.a.z + (e.b.z - e.a.z) * t; const o = e.w / 2 + 1.5; lampPost(x + e.right.x * o, z + e.right.z * o, Math.atan2(-e.right.z, -e.right.x) + Math.PI); }
    }
    if (lamps.length) { scene.add(inst(slG, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.4 }), lamps, { noShadow: true, chunk: 500, far: 900 })); S.streetLampMat = new THREE.MeshStandardMaterial({ color: 0xfff2d0, emissive: 0xffd890, emissiveIntensity: 0 }); scene.add(inst(new THREE.BoxGeometry(1, 1, 1), S.streetLampMat, headItems, { noShadow: true })); }

    // ── 야자수 ──
    for (const s of SPOTS.list) if (s.palms) { for (let k = 0; k < 24; k++) { const a = R() * 6.28, d = 20 + R() * 120; const x = s.x + Math.cos(a) * d, z = s.z + Math.sin(a) * d; const cd = I.coastDist(x, z); if (cd > 12 && cd < 90) palms.push({ x, z }); } }
    for (const e of ROADS.edges) { if (e.lanes === 2 && e.a.id < e.b.id) { const n = Math.floor(e.len / 14); for (let i = 1; i < n; i++) { const t = i / n; palms.push({ x: e.a.x + (e.b.x - e.a.x) * t + (R() - 0.5) * 0.6, z: e.a.z + (e.b.z - e.a.z) * t }); } } }
    S.palms = palms;

    // ── 시골: 돌담 밭·감귤밭·숲 ──
    const HC = I.HC;
    for (let gx = I.BOUNDS.x0; gx < I.BOUNDS.x1; gx += 70) for (let gz = I.BOUNDS.z0; gz < I.BOUNDS.z1; gz += 70) {
      const cx = gx + 35, cz = gz + 35;
      const d = I.coastDist(cx, cz); if (d < 40) continue;
      const t = Math.hypot((cx - HC.x) / 1750, (cz - HC.z) / 950);
      let inTown = false; for (const tw of ROADS.towns) if (Math.abs(cx - tw.cx) < tw.cols * tw.cell / 2 + 50 && Math.abs(cz - tw.cz) < tw.rows * tw.cell / 2 + 50) { inTown = true; break; } if (inTown) continue;
      let steep = false; for (const o of I.OREUMS) { if (Math.hypot(cx - o.x, cz - o.z) < o.r * 1.05) { steep = true; break; } } if (steep) continue;
      const r = I.hash2(Math.floor(cx / 70), Math.floor(cz / 70));
      if (t < 0.62) { if (t > 0.28 && r < 0.75) { const n = 8 + Math.floor(R() * 10); for (let k = 0; k < n; k++) { const x = gx + R() * 70, z = gz + R() * 70; if (onRoadish(x, z, 3)) continue; trees.push({ x, y: H(x, z), z, sc: 2 + R() * 2.6, dark: true }); } } continue; }
      if (r >= 0.42 && r < 0.62) orchard(gx + 6, gz + 6, gx + 64, gz + 64, walls, trees, oranges, true);
      else if (r < 0.42 && R() < 0.5) { fieldWall(gx + 4, gz + 4, gx + 66, gz + 66, walls); if (R() < 0.3) { const x = cx + (R() - 0.5) * 40, z = cz + (R() - 0.5) * 40; if (!onRoadish(x, z, 3)) trees.push({ x, y: H(x, z), z, sc: 3 + R() * 2, dark: true }); } }
      else if (R() < 0.12) fieldWall(gx + 4, gz + 4, gx + 66, gz + 66, walls);
    }
    for (const o of I.OREUMS) for (let k = 0; k < 60; k++) { const a = R() * 6.28, dd = Math.pow(R(), 0.6) * o.r * 0.95; const x = o.x + Math.cos(a) * dd, z = o.z + Math.sin(a) * dd; if (I.coastDist(x, z) < 5) continue; if (onRoadish(x, z, 3)) continue; trees.push({ x, y: H(x, z), z, sc: 2 + R() * 2.5, dark: true }); }
    for (const s of I.ISLETS) for (let k = 0; k < 12; k++) { const a = R() * 6.28, d = R() * 0.8; const x = s.x + Math.cos(a) * d * s.rx, z = s.z + Math.sin(a) * d * s.rz; trees.push({ x, y: H(x, z), z, sc: 1.5 + R() * 1.5, dark: true }); }

    // ── 돌하르방: 큰 도시 큰길 끝 ──
    S.hbG = mergeGeos([{ g: new THREE.CylinderGeometry(0.55, 0.7, 2.2, 10), m: T(0, 1.1, 0) }, { g: new THREE.SphereGeometry(0.62, 10, 8), m: T(0, 2.55, 0, 0, 0, 0, 1, 1.05, 0.95) }, { g: new THREE.CylinderGeometry(0.72, 0.6, 0.4, 10), m: T(0, 3.05, 0) },
      { g: new THREE.SphereGeometry(0.16, 6, 5), m: T(-0.24, 2.62, 0.5) }, { g: new THREE.SphereGeometry(0.16, 6, 5), m: T(0.24, 2.62, 0.5) }, { g: new THREE.SphereGeometry(0.14, 6, 5), m: T(0, 2.42, 0.58, 0, 0, 0, 0.8, 1.4, 1) }, { g: new THREE.SphereGeometry(0.26, 8, 6), m: T(-0.42, 1.45, 0.45) }, { g: new THREE.SphereGeometry(0.26, 8, 6), m: T(0.42, 1.15, 0.5) }]);
    for (const t of ROADS.towns) { if (!t.big) continue; const x = t.x0 + t.mainCol * t.cell, z = t.z0 + t.rows * t.cell + 16; harubang.push({ x: x - 14, z, yaw: 0 }, { x: x + 14, z, yaw: 0 }); const zr = t.z0 + t.mainRow * t.cell; harubang.push({ x: t.x0 - 16, z: zr - 14, yaw: Math.PI / 2 }, { x: t.x0 - 16, z: zr + 14, yaw: Math.PI / 2 }, { x: t.x0 + t.cols * t.cell + 16, z: zr - 14, yaw: -Math.PI / 2 }, { x: t.x0 + t.cols * t.cell + 16, z: zr + 14, yaw: -Math.PI / 2 }); }
  }
  // 나무·돌담·감귤·돌하르방·야자수 메시 — landmarks 가 소품을 더 얹은 뒤 부른다
  function finishProps(scene) {
    S.finishBuildings(); S.finishRoofs();
    const trees = S.trees, walls = S.walls, oranges = S.oranges;
    const wallG = new THREE.BoxGeometry(1, 1, 1); wallG.translate(0, 0.5, 0);
    const rk = TEX.P.aerial_rocks_02;
    const wallMat2 = rk && rk.map ? new THREE.MeshStandardMaterial({ color: 0x5a5a5e, roughness: 1, map: TEX.rep(rk.map, 1.2, 0.35), normalMap: TEX.rep(rk.normal, 1.2, 0.35), normalScale: new THREE.Vector2(1.2, 1.2) }) : new THREE.MeshStandardMaterial({ color: 0x232325, roughness: 1 });
    wallMat2.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vAO;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvAO = 0.45 + 0.55 * smoothstep(0.0, 0.7, position.y);'); sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vAO;').replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vAO;'); };
    if (walls.length) scene.add(inst(wallG, wallMat2, walls, { noShadow: true, chunk: 250, far: 1100 }));
    for (const t of trees) S.obst.circles.push({ x: t.x, z: t.z, r: 0.25 * t.sc, kind: 'tree' });
    const Nn = NOISE.makeNoise(99);
    function lump(r, ox, oy, oz, seed) { const g = new THREE.SphereGeometry(r, 9, 7); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = 1 + 0.38 * Nn.fbm3(x * 2.1 + seed, y * 2.1, z * 2.1, 4, 2, 0.5) - 0.1 * Math.max(0, -y / r); p.setXYZ(i, x * k, y * k * 0.85, z * k); } g.computeVertexNormals(); return { g, m: T(ox, oy, oz), c: [1, 1, 1] }; }
    const parts = [{ g: new THREE.CylinderGeometry(0.11, 0.2, 1.5, 7), m: T(0, 0.7, 0), c: [0.26, 0.19, 0.12] }, { g: new THREE.CylinderGeometry(0.05, 0.08, 0.9, 5), m: T(0.25, 1.6, 0.1, 0, 0, -0.5), c: [0.26, 0.19, 0.12] },
      lump(1.0, 0, 1.75, 0, 0), lump(0.72, 0.5, 1.95, 0.15, 3), lump(0.68, -0.48, 1.85, 0.3, 7), lump(0.62, 0.1, 1.7, -0.55, 11), lump(0.6, -0.05, 2.35, 0.05, 15)];
    function lumpLo(r, ox, oy, oz) { const g = new THREE.SphereGeometry(r, 6, 5); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = 1 + 0.3 * Nn.fbm3(x * 2.1, y * 2.1, z * 2.1, 2, 2, 0.5); p.setXYZ(i, x * k, y * k * 0.85, z * k); } g.computeVertexNormals(); return { g, m: T(ox, oy, oz), c: [1, 1, 1] }; }
    const treeG = mergeGeos(parts);
    const treeLoG = mergeGeos([{ g: new THREE.CylinderGeometry(0.11, 0.2, 1.5, 5), m: T(0, 0.7, 0), c: [0.26, 0.19, 0.12] }, lumpLo(1.25, 0, 1.95, 0)]);
    for (const gg of [treeG, treeLoG]) { const p = gg.attributes.position, c = gg.attributes.color; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < 1.05 && c.getX(i) > 0.9) continue; if (c.getX(i) < 0.9) continue; const t = Math.min(1, Math.max(0, (y - 0.9) / 2.1)); const s = 0.42 + 0.58 * t; c.setXYZ(i, s, s, s); } }
    const tCol = new THREE.Color();
    const treeItems = trees.map(t => { const base = t.color != null ? t.color : (t.dark ? (R() < 0.5 ? 0x22401a : 0x2b4f22) : (R() < 0.5 ? 0x3d6b2a : 0x4a7a31)); tCol.set(base); const v = 0.8 + R() * 0.4; tCol.multiplyScalar(v); tCol.r *= 0.9 + R() * 0.25; return { x: t.x, y: t.y, z: t.z, yaw: R() * 6.28, sx: t.sc, sy: t.sc, sz: t.sc, color: tCol.getHex() }; });
    scene.add(inst(treeG, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, map: TEX.leaf, normalMap: TEX.leafN, normalScale: new THREE.Vector2(1.1, 1.1) }), treeItems, { chunk: 220, lod: treeLoG, lodDist: 300, far: 2300 }));
    buildTufts(scene);
    for (const red of [false, true]) { const list = oranges.filter(o => !!o.red === red); if (!list.length) continue; const og = new THREE.BufferGeometry(); const arr = new Float32Array(list.length * 3); list.forEach((o, i) => { arr[i * 3] = o.x; arr[i * 3 + 1] = o.y; arr[i * 3 + 2] = o.z; }); og.setAttribute('position', new THREE.BufferAttribute(arr, 3)); const mat = new THREE.PointsMaterial({ color: red ? 0xd8202a : 0xf08a1e, size: red ? 0.5 : 0.42, sizeAttenuation: true }); if (!red) S.orangeMat = mat; const pts = new THREE.Points(og, mat); pts.frustumCulled = false; scene.add(pts); }
    const hb = S.harubang; for (const h of hb) S.obst.circles.push({ x: h.x, z: h.z, r: 0.9, kind: 'stone' });
    if (hb.length) scene.add(inst(S.hbG, new THREE.MeshStandardMaterial({ color: 0x3a3a3c, roughness: 1 }), hb.map(h => ({ x: h.x, y: H(h.x, h.z), z: h.z, yaw: h.yaw, sx: 1.1, sy: 1.1, sz: 1.1 })), { chunk: 400, far: 600 }));
    buildPalms(scene, S.palms);
  }
  // 잔풀: 길가와 풀밭에 십자 판 수만 장 (알파 질감, 바람에 흔들린다)
  function buildTufts(scene) {
    const items = []; const HC = I.HC;
    for (const e of ROADS.edges) {
      if (e.a.id > e.b.id || e.type === 'city' || e.type === 'town') continue;
      const n = Math.floor(e.len / 5);
      for (let i = 0; i < n; i++) { const t = (i + R()) / n; for (const side of [-1, 1]) { const o = side * (e.w / 2 + 1.5 + R() * 7); const x = e.a.x + (e.b.x - e.a.x) * t + e.right.x * o, z = e.a.z + (e.b.z - e.a.z) * t + e.right.z * o; if (I.coastDist(x, z) < 6) continue; items.push({ x, z }); } }
    }
    for (let gx = I.BOUNDS.x0; gx < I.BOUNDS.x1; gx += 70) for (let gz = I.BOUNDS.z0; gz < I.BOUNDS.z1; gz += 70) {
      const cx = gx + 35, cz = gz + 35; const d = I.coastDist(cx, cz); if (d < 30) continue;
      const t = Math.hypot((cx - HC.x) / 1750, (cz - HC.z) / 950); if (t < 0.3) continue;
      const r = I.hash2(Math.floor(cx / 70), Math.floor(cz / 70)); if (r >= 0.42 && r < 0.7) continue;
      let inTown = false; for (const tw of ROADS.towns) if (Math.abs(cx - tw.cx) < tw.cols * tw.cell / 2 + 50 && Math.abs(cz - tw.cz) < tw.rows * tw.cell / 2 + 50) { inTown = true; break; } if (inTown) continue;
      const n = t < 0.62 ? 8 : 22; for (let k = 0; k < n; k++) { const x = gx + R() * 70, z = gz + R() * 70; if (I.coastDist(x, z) < 6) continue; items.push({ x, z }); }
    }
    if (!items.length) return;
    const q = new THREE.PlaneGeometry(1.3, 1.0); q.translate(0, 0.45, 0);
    const g = mergeGeos([{ g: q, m: T(0, 0, 0) }, { g: q, m: T(0, 0, 0, 0, Math.PI / 2, 0) }]);
    const mat = new THREE.MeshStandardMaterial({ map: TEX.tuft, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 1, vertexColors: true });
    mat.onBeforeCompile = sh => { sh.uniforms.uT = { value: 0 }; S.palmSh.push(sh); sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT;').replace('#include <begin_vertex>', '#include <begin_vertex>\n{ vec4 wp = instanceMatrix * vec4(position,1.0); float sw = sin(uT * 2.1 + wp.x * 0.35 + wp.z * 0.27) * 0.12 * uv.y; transformed.x += sw; transformed.z += sw * 0.5; }'); };
    const list = items.map(p => ({ x: p.x, y: H(p.x, p.z) - 0.05, z: p.z, yaw: R() * 6.28, sx: 0.7 + R() * 0.8, sy: 0.6 + R() * 0.8, sz: 0.7 + R() * 0.8 }));
    scene.add(inst(g, mat, list, { noShadow: true, chunk: 260, far: 420 }));
  }
  // 길 위에는 돌담도 귀나무도 놓지 않는다.
  // 예전엔 충돌 상자만 빼고 그림은 그대로 깔아, 밭담이 도로를 가로질러 길이 끊겨 보였다 (사장님 2026-09-11 "도로와 귀밭 구분을 못하냐")
  const onRoadish = (x, z, pad) => { const n = (window.ROADS && ROADS.nearest) ? ROADS.nearest(x, z) : null; return !!(n && n.e && n.d < (pad == null ? 2.5 : pad)); };
  function orchard(x0, z0, x1, z1, walls, trees, oranges, rural) {
    fieldWall(x0, z0, x1, z1, walls);
    const gap = rural ? 6 : 4.5;
    for (let x = x0 + 4; x < x1 - 2; x += gap) for (let z = z0 + 4; z < z1 - 2; z += gap) {
      if (rural && R() < 0.1) continue;
      if (onRoadish(x, z, 3)) continue;                 // 길 위에 귀나무를 심지 않는다
      const y = H(x, z), sc = 1.1 + R() * 0.5;
      trees.push({ x: x + (R() - 0.5), y, z: z + (R() - 0.5), sc, dark: true });
      if (R() < 0.7) for (let k = 0; k < 4; k++) { const a = R() * 6.28, rr = sc * (0.6 + R() * 0.4); oranges.push({ x: x + Math.cos(a) * rr, y: y + sc * 1.6 + (R() - 0.5) * sc * 0.9, z: z + Math.sin(a) * rr }); }
    }
  }
  function fieldWall(x0, z0, x1, z1, walls) {
    const seg = 4; const push = (x, z, yaw) => {
      if (onRoadish(x, z, 2.5)) return;                  // 길과 겹치는 토막은 아예 안 놓는다
      walls.push({ x, y: H(x, z) - 0.2, z, yaw, sx: seg + 0.2, sy: 1.2 + R() * 0.3, sz: 0.55 });
      // 돌담 충돌(사장님 2026-09-09 "차로 다 통과되네"): 토막마다 상자 하나. 길과 겹치는 토막은 빼서 도로를 막지 않는다
      const rn = window.ROADS && ROADS.nearest ? ROADS.nearest(x, z) : null; if (rn && rn.e && rn.d < 7) return;
      const hx = yaw ? 0.3 : seg / 2 + 0.1, hz = yaw ? seg / 2 + 0.1 : 0.3;
      S.obst.boxes.push({ x0: x - hx, z0: z - hz, x1: x + hx, z1: z + hz, wall: true, kind: 'stone' });
    };
    // 밭마다 입구를 하나 낸다(토막 둘, 8m). 사방이 다 막혀 있어서 안으로 들어간 차가 갇혔다 (사장님 2026-09-10)
    const nX = Math.max(1, Math.round((x1 - x0) / seg)), nZ = Math.max(1, Math.round((z1 - z0) / seg));
    const side = Math.floor(R() * 4), gate = Math.floor(R() * Math.max(1, (side < 2 ? nX : nZ) - 1));
    const open = (sd, i) => sd === side && (i === gate || i === gate + 1);
    let i = 0;
    for (let x = x0; x < x1; x += seg, i++) { if (!open(0, i)) push(x + seg / 2, z0, 0); if (!open(1, i)) push(x + seg / 2, z1, 0); }
    i = 0;
    for (let z = z0; z < z1; z += seg, i++) { if (!open(2, i)) push(x0, z + seg / 2, Math.PI / 2); if (!open(3, i)) push(x1, z + seg / 2, Math.PI / 2); }
  }
  function buildPalms(scene, list) {
    if (!list.length) return;
    const trunkParts = []; for (let i = 0; i < 9; i++) { const t = i / 9; trunkParts.push({ g: new THREE.CylinderGeometry(0.16 - t * 0.05, 0.19 - t * 0.05, 1.05, 7), m: T(t * t * 0.9, i * 0.95 + 0.47, 0, 0, 0, -t * 0.25), c: [0.42, 0.34, 0.24] }); }
    const trunkG = mergeGeos(trunkParts); const ft = frondTex(); const frondParts = [];
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; frondParts.push({ g: new THREE.PlaneGeometry(3.4, 0.9).translate(1.7, 0, 0), m: T(0.75, 8.6, 0, 0, a, 0).multiply(T(0, 0, 0, 0, 0, -0.55 - (k % 2) * 0.3)) }); }
    const frondG = mergeGeos(frondParts);
    for (const p of list) S.obst.circles.push({ x: p.x, z: p.z, r: 0.35 });
    const items = list.map(p => ({ x: p.x, y: H(p.x, p.z) - 0.2, z: p.z, yaw: R() * 6.28, sx: 0.85 + R() * 0.35, sy: 0.8 + R() * 0.5, sz: 0.85 + R() * 0.35 }));
    scene.add(inst(trunkG, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), items, { chunk: 300, far: 1500 }));
    const fm = new THREE.MeshStandardMaterial({ map: ft, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.9 });
    fm.onBeforeCompile = sh => { sh.uniforms.uT = { value: 0 }; S.palmSh.push(sh); sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT;').replace('#include <begin_vertex>', '#include <begin_vertex>\n{ vec4 wp = instanceMatrix * vec4(position,1.0); float sw = sin(uT * 1.3 + wp.x * 0.07 + wp.z * 0.05) * 0.18 * uv.x; transformed.x += sw; transformed.y -= abs(sw) * 0.4; }'); };
    scene.add(inst(frondG, fm, items, { chunk: 300, far: 1500 }));
  }
  const LAMPC = [0xff2a1a, 0xffb020, 0x22e04a], OFF = 0x1c1c1e;
  function applyLamps() {
    if (!S.lampMesh) return;
    const st = S.lampState, m = S.lampMesh;
    for (let i = 0; i < S.lampItems.length; i++) { const it = S.lampItems[i]; let on; if (it.ns) on = st === 0 ? 2 : st === 1 ? 1 : 0; else on = st === 2 ? 2 : st === 3 ? 1 : 0; m.setColorAt(i, COL.set(it.k === on ? LAMPC[on] : OFF)); }
    m.instanceColor.needsUpdate = true;
  }
  function update(dt, t, sky, cam) {
    updateChunks(cam);
    S.lampT += dt; const DUR = [9, 2.5, 9, 2.5];
    if (S.lampT > DUR[S.lampState]) { S.lampT = 0; S.lampState = (S.lampState + 1) % 4; applyLamps(); }
    const night = sky.night;
    S.wallMat.emissiveIntensity = night * 1.6; if (S.signMat) S.signMat.emissiveIntensity = night * 1.1;
    if (S.streetLampMat) S.streetLampMat.emissiveIntensity = night * 3;
    if (S.orangeMat) S.orangeMat.color.setRGB(0.94 - 0.8 * night, 0.54 - 0.46 * night, 0.12 - 0.08 * night);
    for (const sh of S.palmSh) sh.uniforms.uT.value = t;
  }
  window.CITY = Object.assign(S, { init, update, orchard, fieldWall, buildPalms, finishProps });
})();
