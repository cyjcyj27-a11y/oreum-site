/* 3D 장면 — 주차장 · 차 · 효과. 판 좌표(칸 0..6)를 월드 X = bx - 3, Z = by - 3 으로 놓는다 */
(function(){
const { ACCENT, BODY, FLOOR_COL } = LOOK;
const T = THREE, PI = Math.PI;
const W = { S:null, drag:null, hint:true, t:0, exit:0, onWin:null, onMove:null };
const cv = document.getElementById('cv');
const MOBILE = matchMedia('(pointer:coarse)').matches;

/* ---------- 렌더러 · 카메라 · 빛 ---------- */
const renderer = new T.WebGLRenderer({ canvas:cv, antialias:true, alpha:false, preserveDrawingBuffer:true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, MOBILE ? 1.5 : 2));
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.LinearToneMapping; renderer.toneMappingExposure = 0.86;   // ACES 는 차 색을 바래게 해서 선형으로
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFShadowMap;
const BG = new T.Color('#ded8ce');
renderer.setClearColor(BG);
const scene = new T.Scene(); scene.background = BG;
const cam = new T.PerspectiveCamera(30, 1, 0.5, 80);

// 부드러운 주변광: 하늘 그라데이션 + 위에 넓은 빛판 두 장을 구워 환경맵으로
(function env(){
  const es = new T.Scene();
  const g = new T.SphereGeometry(20, 32, 16), col = [], p = g.attributes.position;
  const top = new T.Color('#ffffff'), mid = new T.Color('#ece8e2'), bot = new T.Color('#a9a49c');
  for(let i = 0; i < p.count; i++){ const y = p.getY(i) / 20; const c = y > 0 ? mid.clone().lerp(top, y) : mid.clone().lerp(bot, -y); col.push(c.r, c.g, c.b); }
  g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  es.add(new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors:true, side:T.BackSide })));
  const pm = new T.MeshBasicMaterial({ color:new T.Color(2.2, 2.2, 2.2), side:T.DoubleSide });
  for(const x of [-5, 5]){ const m = new T.Mesh(new T.PlaneGeometry(9, 4), pm); m.position.set(x, 12, 0); m.rotation.x = PI/2; es.add(m); }
  const pmrem = new T.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(es, 0.04).texture;
})();
const hemi = new T.HemisphereLight('#ffffff', '#c9c2b6', 0.4); scene.add(hemi);
const sun = new T.DirectionalLight('#fffaf2', 3.3);
sun.position.set(-6, 10, -4.5);   // 왼쪽 뒤에서: 그림자가 앞·오른쪽으로 떨어져 보이게
 sun.target.position.set(0.6, 0, 0); scene.add(sun, sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left:-9, right:9, top:9, bottom:-9, near:1, far:35 }); sun.shadow.camera.updateProjectionMatrix();
sun.shadow.radius = 5; sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.035;

/* ---------- 작은 도구 ---------- */
const matCache = {};
function mat(color, o){ const k = color + JSON.stringify(o || {}); if(!matCache[k]) matCache[k] = new T.MeshStandardMaterial(Object.assign({ color, roughness:.55, metalness:0, envMapIntensity:.6 }, o)); return matCache[k]; }
const geoCache = {};
// 둥근 모서리 상자: 바닥 y=0, 가운데 x·z=0, 길이 L(x) 폭 Wd(z) 높이 H, 위에서 본 모서리 r, 옆 모서리 b
function rbox(L, Wd, H, r, b){
  const k = [L, Wd, H, r, b].map(n => n.toFixed(3)).join(',');
  if(geoCache[k]) return geoCache[k];
  const l = L/2 - b, w = Wd/2 - b, rr = Math.max(0.01, Math.min(r - b, l - .001, w - .001));
  const s = new T.Shape();
  s.moveTo(-l + rr, -w); s.lineTo(l - rr, -w); s.quadraticCurveTo(l, -w, l, -w + rr); s.lineTo(l, w - rr); s.quadraticCurveTo(l, w, l - rr, w);
  s.lineTo(-l + rr, w); s.quadraticCurveTo(-l, w, -l, w - rr); s.lineTo(-l, -w + rr); s.quadraticCurveTo(-l, -w, -l + rr, -w);
  const g = new T.ExtrudeGeometry(s, { depth:Math.max(.001, H - 2*b), bevelEnabled:b > 0, bevelThickness:b, bevelSize:b, bevelSegments:3, curveSegments:6 });
  g.rotateX(-PI/2); g.translate(0, b, 0); g.computeVertexNormals();
  return geoCache[k] = g;
}
// 유리칸: 옆에서 본 사다리꼴(바닥 길이 lb, 윗면 길이 lt, 윗면 중심 어긋남 to, 높이 h, 폭 wd). 바닥 y=0
function cabin(lb, lt, to, h, wd){
  const k = ['cab', lb, lt, to, h, wd].map(n => typeof n === 'number' ? n.toFixed(3) : n).join(',');
  if(geoCache[k]) return geoCache[k];
  const b = .035, s = new T.Shape();
  s.moveTo(-lb/2 + b, b); s.lineTo(lb/2 - b, b); s.lineTo(to + lt/2 - b, h - b); s.lineTo(to - lt/2 + b, h - b); s.closePath();
  const g = new T.ExtrudeGeometry(s, { depth:wd - 2*b, bevelEnabled:true, bevelThickness:b, bevelSize:b, bevelSegments:3 });
  g.translate(0, -b + b, -(wd - 2*b)/2); g.computeVertexNormals();
  return geoCache[k] = g;
}
function canvasTex(w, h, draw){ const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }
function rrect(g, x, y, w, h, r){ g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

// 차 밑 접지 그림자(흐린 둥근 네모)
const contactTex = canvasTex(128, 128, (g, w, h) => { g.filter = 'blur(10px)'; g.fillStyle = 'rgba(30,26,22,1)'; rrect(g, 22, 22, 84, 84, 26); g.fill(); });
const contactMat = new T.MeshBasicMaterial({ map:contactTex, transparent:true, opacity:.7, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2, toneMapped:false });
const quad = new T.PlaneGeometry(1, 1); quad.rotateX(-PI/2);

/* ---------- 주차장 ---------- */
// 바닥 한 장(판 + 둘레 통로 + 출구 통로)을 캔버스로 그린다
const LOT = { x0:-4.4, x1:8.6, z0:-4.4, z1:4.4 }, PPU = 110;
const floorMat = new T.MeshStandardMaterial({ roughness:.92, metalness:0, envMapIntensity:.22 });
const floorMesh = new T.Mesh(new T.PlaneGeometry(LOT.x1 - LOT.x0, LOT.z1 - LOT.z0), floorMat);
floorMesh.rotation.x = -PI/2; floorMesh.position.set((LOT.x0 + LOT.x1)/2, 0, (LOT.z0 + LOT.z1)/2); floorMesh.receiveShadow = true; scene.add(floorMesh);
const outer = new T.Mesh(new T.PlaneGeometry(80, 80), new T.MeshStandardMaterial({ color:'#d9d6d1', roughness:.95, envMapIntensity:.22 }));
outer.rotation.x = -PI/2; outer.position.y = -0.02; outer.receiveShadow = true; scene.add(outer);
const floorTex = {};
function paintFloor(floor){
  if(floorTex[floor]) return floorTex[floor];
  const Wp = Math.round((LOT.x1 - LOT.x0)*PPU), Hp = Math.round((LOT.z1 - LOT.z0)*PPU);
  const X = x => (x - LOT.x0)*PPU, Z = z => (z - LOT.z0)*PPU;
  const t = canvasTex(Wp, Hp, (g) => {
    g.fillStyle = '#dedbd6'; g.fillRect(0, 0, Wp, Hp);
    // 콘크리트 결: 아주 옅은 얼룩과 잔점
    let sd = 7 + floor*31; const rnd = () => (sd = (sd*16807) % 2147483647) / 2147483647;
    for(let i = 0; i < 70; i++){ const x = rnd()*Wp, y = rnd()*Hp, r = 40 + rnd()*160; const gr = g.createRadialGradient(x, y, 0, x, y, r);
      const a = .025 + rnd()*.03, dark = rnd() < .5; gr.addColorStop(0, dark ? `rgba(120,110,98,${a})` : `rgba(255,255,255,${a*1.4})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2*r, 2*r); }
    for(let i = 0; i < 9000; i++){ g.fillStyle = rnd() < .5 ? 'rgba(90,82,72,.07)' : 'rgba(255,255,255,.12)'; g.fillRect(rnd()*Wp, rnd()*Hp, 1.5, 1.5); }
    // 콘크리트 줄눈(타설 경계)
    g.strokeStyle = 'rgba(120,112,100,.16)'; g.lineWidth = 2;
    for(let x = -4; x <= 8; x += 4){ g.beginPath(); g.moveTo(X(x), 0); g.lineTo(X(x), Hp); g.stroke(); }
    // 판 바닥: 살짝 밝은 판
    g.fillStyle = 'rgba(255,255,255,.22)'; rrect(g, X(-3.06), Z(-3.06), 6.12*PPU, 6.12*PPU, 10); g.fill();
    // 주차선(칸 경계): 흰 페인트
    g.fillStyle = 'rgba(255,255,255,.92)';
    const lw = 0.045*PPU;
    for(let i = 0; i <= 6; i++){ g.fillRect(X(-3 + i) - lw/2, Z(-3), lw, 6*PPU); g.fillRect(X(-3), Z(-3 + i) - lw/2, 6*PPU, lw); }
    // 판 테두리는 굵게(주차 구역 경계)
    g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 0.09*PPU; g.strokeRect(X(-3), Z(-3), 6*PPU, 6*PPU);
    // 출구 쪽 열린 자리: 판 오른쪽 경계의 2번 줄을 지운다
    g.fillStyle = '#dedbd6'; g.fillRect(X(3) - 0.06*PPU, Z(-1) + lw, 0.12*PPU, PPU - 2*lw);
    // 출구 통로: 진행 화살표 셋
    g.fillStyle = 'rgba(255,255,255,.9)';
    for(const ax of [4.0, 5.6, 7.2]){ const cx = X(ax), cz = Z(-0.5), s = 0.22*PPU;
      g.beginPath(); g.moveTo(cx + s, cz); g.lineTo(cx - s*.2, cz - s*.85); g.lineTo(cx - s*.2, cz - s*.35); g.lineTo(cx - s*1.2, cz - s*.35);
      g.lineTo(cx - s*1.2, cz + s*.35); g.lineTo(cx - s*.2, cz + s*.35); g.lineTo(cx - s*.2, cz + s*.85); g.closePath(); g.fill(); }
    // 엘리베이터 앞 빗금(안전지대)
    g.save(); rrect(g, X(-3.2), Z(-4.0), 1.4*PPU, 0.5*PPU, 6); g.clip();
    g.fillStyle = 'rgba(255,255,255,.75)'; for(let k = -10; k < 30; k++){ g.save(); g.translate(X(-3.2) + k*0.16*PPU, Z(-4.0)); g.rotate(-PI/4); g.fillRect(0, 0, 0.05*PPU, PPU*2); g.restore(); }
    g.restore();
    // 층 이름을 바닥에 크게(판 아래 통로)
    g.fillStyle = 'rgba(60,62,68,.11)'; g.font = `900 ${0.62*PPU}px Paperlogy, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(DP.FLOORS[floor], X(0), Z(3.52));
    // 벽 밑 그늘(AO)
    const ao = (x0, z0, x1, z1, dir) => { const gr = dir === 'h' ? g.createLinearGradient(0, Z(z0), 0, Z(z1)) : g.createLinearGradient(X(x0), 0, X(x1), 0);
      gr.addColorStop(0, 'rgba(70,60,50,.22)'); gr.addColorStop(1, 'rgba(70,60,50,0)'); g.fillStyle = gr; g.fillRect(X(Math.min(x0, x1)), Z(Math.min(z0, z1)), Math.abs(x1 - x0)*PPU, Math.abs(z1 - z0)*PPU); };
    ao(-4.4, -4.0, 4.0, -3.55, 'h');
    ao(-4.0, -4.0, -3.6, 4.0, 'v');
    // 출구 통로 끝은 오르막 그늘
    const gr = g.createLinearGradient(X(6.4), 0, X(8.6), 0); gr.addColorStop(0, 'rgba(60,56,50,0)'); gr.addColorStop(1, 'rgba(60,56,50,.35)'); g.fillStyle = gr; g.fillRect(X(6.4), 0, 2.2*PPU, Hp);
  });
  return floorTex[floor] = t;
}

// 벽·기둥·엘리베이터·차단기
const wallMat = mat('#e9e5df', { roughness:.85 });
const bandMat = new T.MeshStandardMaterial({ color:FLOOR_COL[0], roughness:.8, metalness:0, envMapIntensity:.5 });
const lot = new T.Group(); scene.add(lot);
function wall(x0, z0, x1, z1, h, band){
  const L = Math.max(x1 - x0, z1 - z0), along = x1 - x0 >= z1 - z0, th = .22;
  const m = new T.Mesh(rbox(along ? L : th, along ? th : L, h, .05, .03), wallMat);
  m.position.set((x0 + x1)/2, 0, (z0 + z1)/2); m.castShadow = m.receiveShadow = true; lot.add(m);
  if(band){ const b = new T.Mesh(new T.BoxGeometry(along ? L - .1 : th + .012, band[1], along ? th + .012 : L - .1), bandMat); b.position.set((x0 + x1)/2, band[0], (z0 + z1)/2); lot.add(b); }
}
const IN = 4.0;                                          // 안쪽 벽 선
wall(-IN - .11, -IN - .11, 4.11, -IN - .11, 1.15, [.72, .16]);  // 뒷벽(높음, 층 색 띠)
wall(-IN - .11, -IN, -IN - .11, IN + .11, .34, [.22, .08]);     // 왼벽
wall(-IN - .11, IN + .11, 4.11, IN + .11, .30);                 // 앞벽(낮게, 판을 안 가림)
wall(4.11, -IN - .11, 4.11, -1.05, .9, [.56, .14]);             // 오른벽 위쪽
wall(4.11, .05, 4.11, IN + .11, .34, [.22, .08]);               // 오른벽 아래쪽
wall(4.11, -1.16, 8.8, -1.16, .9, [.56, .14]);                  // 출구 통로 벽
wall(4.11, .16, 8.8, .16, .34);
// 기둥(뒷벽 쪽만 높게)
for(const x of [-1.5, 1.5]){ const m = new T.Mesh(rbox(.42, .42, 1.25, .06, .03), wallMat); m.position.set(x, 0, -IN - .05); m.castShadow = true; lot.add(m);
  const b = new T.Mesh(rbox(.44, .44, .16, .06, .02), bandMat); b.position.set(x, .72, -IN - .05); lot.add(b); }
// 엘리베이터(뒷벽, 문이 판을 바라봄)
const ELEV = { x:-2.5, z:-IN + .02 };
const elevFrame = new T.Mesh(rbox(.92, .1, .98, .03, .02), mat('#c9ccd1', { roughness:.5 })); elevFrame.position.set(ELEV.x, 0, ELEV.z + .02); lot.add(elevFrame);
const doorMat = mat('#9aa1ab', { roughness:.42 });
const doorL = new T.Mesh(rbox(.34, .05, .86, .01, .008), doorMat), doorR = doorL.clone();
doorL.position.set(ELEV.x - .17, 0, ELEV.z + .08); doorR.position.set(ELEV.x + .17, 0, ELEV.z + .08); lot.add(doorL, doorR);
const elevLamp = new T.Mesh(rbox(.16, .04, .06, .02, .01), new T.MeshStandardMaterial({ color:'#ffffff', emissive:'#ffd9a0', emissiveIntensity:0 }));
elevLamp.position.set(ELEV.x, .9, ELEV.z + .09); lot.add(elevLamp);
// 출구 안내판(오른벽 위쪽 끝)
const signTex = canvasTex(256, 112, (g, w, h) => { g.fillStyle = '#2b2d31'; rrect(g, 0, 0, w, h, 22); g.fill();
  g.fillStyle = '#fff'; g.font = '800 52px Paperlogy, sans-serif'; g.textBaseline = 'middle'; g.fillText(L('출구', 'EXIT'), 30, h/2 + 3);
  g.beginPath(); g.moveTo(232, h/2); g.lineTo(196, h/2 - 26); g.lineTo(196, h/2 + 26); g.closePath(); g.fillStyle = ACCENT; g.fill(); g.fillRect(166, h/2 - 9, 34, 18); });
// 폰 세로(출구가 위)용: 화살표가 위로
const signTexUp = canvasTex(256, 112, (g, w, h) => { g.fillStyle = '#2b2d31'; rrect(g, 0, 0, w, h, 22); g.fill();
  g.fillStyle = '#fff'; g.font = '800 52px Paperlogy, sans-serif'; g.textBaseline = 'middle'; g.fillText(L('출구', 'EXIT'), 30, h/2 + 3);
  g.beginPath(); g.moveTo(198, 18); g.lineTo(172, 50); g.lineTo(224, 50); g.closePath(); g.fillStyle = ACCENT; g.fill(); g.fillRect(189, 48, 18, 44); });
const sign = new T.Mesh(new T.PlaneGeometry(.72, .315), new T.MeshStandardMaterial({ map:signTex, roughness:.6 }));
sign.position.set(5.0, 1.1, -1.24); sign.rotation.x = -.12; lot.add(sign);
const signPost = new T.Mesh(rbox(.76, .05, .36, .05, .015), mat('#2b2d31')); signPost.position.set(5.0, .92, -1.28); lot.add(signPost);
// 차단기: 받침은 통로 아래쪽 벽 옆, 팔은 통로를 가로질러 위쪽으로
const BAR = { x:4.75, z:.0 };
const barPost = new T.Mesh(rbox(.2, .2, .5, .05, .02), mat('#2b2d31', { roughness:.6 })); barPost.position.set(BAR.x, 0, BAR.z); barPost.castShadow = true; lot.add(barPost);
const barPivot = new T.Group(); barPivot.position.set(BAR.x, .42, BAR.z - .02); lot.add(barPivot);
const armTex = canvasTex(256, 16, (g, w, h) => { for(let i = 0; i < 8; i++){ g.fillStyle = i % 2 ? ACCENT : '#ffffff'; g.fillRect(i*w/8, 0, w/8, h); } });
const arm = new T.Mesh(new T.BoxGeometry(.06, .06, 1.02), new T.MeshStandardMaterial({ map:armTex, roughness:.5 }));
arm.position.z = -.53; arm.castShadow = true; barPivot.add(arm);
{ const uv = arm.geometry.attributes.uv, p = arm.geometry.attributes.position; for(let i = 0; i < uv.count; i++) uv.setXY(i, (p.getZ(i) + .51)/1.02, .5); uv.needsUpdate = true; }

/* ---------- 차 ---------- */
// 차 종류마다 비율(앞이 +x). l 길이, w 폭, hb 몸통 높이, cl 유리칸 길이, co 유리칸 앞뒤 자리(-면 뒤로), hc 유리칸 높이
// cl 유리칸 바닥 길이, ct 윗면(지붕) 길이, co 유리칸 자리, cto 지붕이 뒤로 물러난 정도
const KIND = {
  compact:{ l:1.50, w:.70, hb:.24, cl:.92, ct:.62, co:-.06, cto:-.05, hc:.26, r:.22 },
  sedan:  { l:1.82, w:.74, hb:.22, cl:1.0,  ct:.56, co:-.1,  cto:-.06, hc:.21, r:.16 },
  hero:   { l:1.80, w:.76, hb:.21, cl:.94,  ct:.48, co:-.12, cto:-.1,  hc:.19, r:.2 },
  sports: { l:1.84, w:.78, hb:.18, cl:.84,  ct:.36, co:-.2,  cto:-.12, hc:.16, r:.2 },
  suv:    { l:1.86, w:.78, hb:.30, cl:1.24, ct:1.0, co:-.16, cto:-.1,  hc:.25, r:.14 },
  van:    { l:1.88, w:.76, hb:.28, cl:1.56, ct:1.3, co:-.1,  cto:-.12, hc:.32, r:.13 },
  bus:    { l:2.84, w:.78, hb:.30, cl:2.62, ct:2.48, co:-.04, cto:-.04, hc:.30, r:.12 },
  truck:  { l:2.84, w:.78, hb:.28, cl:.56, ct:.4, co:.95, cto:-.06, hc:.24, r:.12 },
};
const glassMat = mat('#2c3846', { roughness:.16, envMapIntensity:1.3 });
const tireMat = mat('#2a2c30', { roughness:.85 });
const trimMat = mat('#4a4e56', { roughness:.7 });
const cargoMat = mat('#eeece8', { roughness:.7 });
const wheelGeo = new T.CylinderGeometry(.13, .13, .1, 18); wheelGeo.rotateX(PI/2);
// 한 차의 부품을 재질별로 한 덩어리로 합친다(그리기 횟수 줄이기). 판을 지을 때만 부른다
function mergeParts(g){
  const buckets = new Map();
  for(const o of g.children){ o.updateMatrix(); const key = o.material.uuid + (o.castShadow ? 'c' : '') + (o.receiveShadow ? 'r' : '');
    if(!buckets.has(key)) buckets.set(key, { mat:o.material, cast:o.castShadow, recv:o.receiveShadow, list:[] }); buckets.get(key).list.push(o); }
  const out = [];
  for(const b of buckets.values()){
    const pos = [], nor = [], uv = [];
    for(const o of b.list){ const geo = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()); geo.applyMatrix4(o.matrix);
      pos.push(geo.attributes.position.array); nor.push(geo.attributes.normal.array); uv.push(geo.attributes.uv ? geo.attributes.uv.array : new Float32Array(geo.attributes.position.count*2)); geo.dispose(); }
    const cat = arr => { let n = 0; for(const a of arr) n += a.length; const r = new Float32Array(n); let o = 0; for(const a of arr){ r.set(a, o); o += a.length; } return r; };
    const m = new T.BufferGeometry(); m.setAttribute('position', new T.BufferAttribute(cat(pos), 3)); m.setAttribute('normal', new T.BufferAttribute(cat(nor), 3)); m.setAttribute('uv', new T.BufferAttribute(cat(uv), 2));
    const mesh = new T.Mesh(m, b.mat); mesh.castShadow = b.cast; mesh.receiveShadow = b.recv; out.push(mesh);
  }
  g.clear(); for(const m of out) g.add(m);
}
function makeCar(v){
  const k = KIND[v.kind] || KIND.sedan, color = BODY[v.col] || '#888', body = mat(color, { roughness:.42, envMapIntensity:.7 });
  const car = new T.Group(), g = new T.Group(); car.add(g);
  const cl = .07, add = (geo, m, x, y, z, shadow) => { const o = new T.Mesh(geo, m); o.position.set(x, y, z); if(shadow !== false){ o.castShadow = true; o.receiveShadow = shadow !== 'c'; } g.add(o); return o; };
  const headM = new T.MeshStandardMaterial({ color:'#fffaf0', emissive:'#fff1d0', emissiveIntensity:.25, roughness:.3 });
  const tailM = new T.MeshStandardMaterial({ color:'#d8352c', emissive:'#ff2a1a', emissiveIntensity:.15, roughness:.4 });
  // 바퀴
  const wx = k.l/2 - (v.kind === 'compact' ? .3 : .38);
  for(const sx of [-1, 1]) for(const sz of [-1, 1]) add(wheelGeo, tireMat, sx*wx + (v.kind === 'truck' && sx < 0 ? .25 : 0), .13, sz*(k.w/2 - .05), false);   // 바퀴는 몸통 밑이라 그림자 안 드리움
  if(v.kind === 'truck'){
    add(rbox(k.l - .1, k.w - .12, .1, .05, .02), trimMat, 0, .08, 0);                                  // 차대
    add(rbox(.9, k.w, k.hb, k.r, .06), body, k.l/2 - .45, cl, 0);                                        // 운전칸 아래
    add(cabin(.56, .4, -.06, k.hc, k.w - .1), glassMat, k.l/2 - .5, cl + k.hb - .03, 0, 'c');           // 운전칸 유리
    add(rbox(.4, k.w - .14, .05, .08, .02), body, k.l/2 - .56, cl + k.hb + k.hc - .07, 0);
    add(rbox(1.84, k.w + .02, .62, .06, .03), v.cargo ? mat(v.cargo, { roughness:.75 }) : cargoMat, -k.l/2 + .94, .12, 0);
    add(rbox(1.7, .05, .04, .01, .01), body, -k.l/2 + .94, .58, k.w/2 + .005, false);                    // 짐칸 옆 색 띠
    add(rbox(1.7, .05, .04, .01, .01), body, -k.l/2 + .94, .58, -k.w/2 - .005, false);
  } else {
    add(rbox(k.l, k.w, k.hb, k.r, .07), body, 0, cl, 0);
    add(cabin(k.cl, k.ct, k.cto, k.hc, k.w - .1), glassMat, k.co, cl + k.hb - .03, 0, 'c');
    add(rbox(k.ct + .02, k.w - .13, .05, Math.min(.12, k.r), .022), body, k.co + k.cto, cl + k.hb + k.hc - .075, 0);
    if(v.kind === 'bus') for(const sz of [-1, 1]) add(rbox(k.cl - .2, .02, .025, .01, .005), mat('#ffffff', { roughness:.4 }), k.co, cl + k.hb + .06, sz*(k.w/2 - .02), false);
    if(v.taxi) add(rbox(.14, .34, .08, .03, .015), mat('#fbfaf6', { emissive:'#fff2c0', emissiveIntensity:.15 }), k.co + k.cto, cl + k.hb + k.hc - .03, 0);
    if(v.kind === 'suv') for(const sz of [-1, 1]) add(rbox(k.ct - .1, .04, .035, .01, .008), trimMat, k.co + k.cto, cl + k.hb + k.hc - .03, sz*(k.w/2 - .1), false);
  }
  // 앞등(흰)·뒷등(빨강): 몸통 윗면 끝에 걸쳐 위에서도 보이게
  const ly = cl + k.hb - .07, hx = k.l/2 - .05;
  for(const sz of [-1, 1]){
    add(rbox(.1, .17, .07, .03, .015), headM, hx, ly, sz*(k.w/2 - .14), false);
    add(rbox(.07, .16, .07, .03, .015), tailM, -hx + (v.kind === 'truck' ? .02 : 0), v.kind === 'truck' ? .12 : ly, sz*(k.w/2 - .13), false);
  }
  mergeParts(g);
  // 접지 그림자
  const sh = new T.Mesh(quad, contactMat); sh.scale.set(k.l + .34, 1, k.w + .34); sh.position.y = .012; sh.renderOrder = 1; car.add(sh);
  // 누르기 판정 상자(보이지 않음): 칸 크기 그대로
  const hitBox = new T.Mesh(new T.BoxGeometry(v.len - .04, .7, .96), new T.MeshBasicMaterial({ visible:false })); hitBox.position.y = .35; car.add(hitBox);
  car.userData = { g, headM, tailM, hitBox, k };
  return car;
}
// 내 차 표시: 바닥에 은은한 테
const heroRingTex = canvasTex(256, 128, (g, w, h) => { g.fillStyle = 'rgba(242,72,58,.22)'; rrect(g, 8, 8, w - 16, h - 16, 30); g.fill();
  g.strokeStyle = ACCENT; g.lineWidth = 10; rrect(g, 8, 8, w - 16, h - 16, 30); g.stroke(); });
// 내 차 위에 뜨는 표시: 빨간 동그라미 + 출구 쪽을 가리키는 흰 화살표
const heroTex = canvasTex(128, 128, (g) => { g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.arc(64, 70, 54, 0, 2*PI); g.fill();
  g.fillStyle = ACCENT; g.beginPath(); g.arc(64, 64, 54, 0, 2*PI); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 7; g.beginPath(); g.arc(64, 64, 50, 0, 2*PI); g.stroke();
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(98, 64); g.lineTo(66, 34); g.lineTo(66, 52); g.lineTo(32, 52); g.lineTo(32, 76); g.lineTo(66, 76); g.lineTo(66, 94); g.closePath(); g.fill(); });
const heroMark = new T.Sprite(new T.SpriteMaterial({ map:heroTex, depthTest:false, toneMapped:false })); heroMark.renderOrder = 11; heroMark.scale.set(.7, .7, 1); scene.add(heroMark);
const scrA = new T.Vector3(), scrB = new T.Vector3();
const heroRing = new T.Mesh(quad, new T.MeshBasicMaterial({ map:heroRingTex, transparent:true, depthWrite:false, toneMapped:false }));
heroRing.position.y = .014; heroRing.renderOrder = 2; scene.add(heroRing);

/* ---------- 효과: 먼지 · 종이꽃 ---------- */
const puffTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
const puffs = []; for(let i = 0; i < 40; i++){ const s = new T.Sprite(new T.SpriteMaterial({ map:puffTex, color:'#cbc5bb', transparent:true, depthWrite:false, opacity:0 })); s.visible = false; scene.add(s); puffs.push({ s, t:9, life:1 }); }
let puffI = 0;
function dust(bx, by, n){ for(let k = 0; k < n; k++){ const p = puffs[puffI++ % puffs.length]; p.t = 0; p.life = .45 + Math.random()*.3;
  p.x = bx - 3 + (Math.random() - .5)*.2; p.z = by - 3 + (Math.random() - .5)*.2; p.vx = (Math.random() - .5)*.8; p.vz = (Math.random() - .5)*.8; p.y = .06 + Math.random()*.08; p.s0 = .14 + Math.random()*.1; p.s.visible = true; } }
const CONF_COL = [ACCENT, '#3f7be8', '#f4bf34', '#38a872', '#ffffff'].map(c => new T.MeshStandardMaterial({ color:c, roughness:.6, side:T.DoubleSide }));
const confGeo = new T.PlaneGeometry(.07, .11);
const conf = []; for(let i = 0; i < 90; i++){ const m = new T.Mesh(confGeo, CONF_COL[i % 5]); m.visible = false; m.castShadow = true; scene.add(m); conf.push({ m, live:false }); }
function confetti(){ for(const c of conf){ c.live = true; c.m.visible = true; c.m.position.set(-3.5 + Math.random()*8, 3.5 + Math.random()*2.5, -3.5 + Math.random()*7);
  c.vy = -(1 + Math.random()*1.2); c.vx = (Math.random() - .5)*.6; c.spin = [Math.random()*8, Math.random()*8, Math.random()*8]; c.landed = false; } }
function clearConfetti(){ for(const c of conf){ c.live = false; c.m.visible = false; } }

/* ---------- 판 짓기 ---------- */
const cars = []; let builtFor = null, builtFloor = -1;
const carRoot = new T.Group(); scene.add(carRoot);
function rebuild(S){
  for(const c of cars){ carRoot.remove(c.obj); c.obj.userData.g.children.forEach(m => m.geometry.dispose()); c.obj.userData.headM.dispose(); c.obj.userData.tailM.dispose(); c.obj.userData.hitBox.geometry.dispose(); }
  cars.length = 0;
  S.V.forEach((v, i) => { const obj = makeCar(v); carRoot.add(obj); const c = { obj, i };
    cars.push(c); });
  if(S.floor !== builtFloor){ builtFloor = S.floor; floorMat.map = paintFloor(S.floor); floorMat.needsUpdate = true; bandMat.color.set(FLOOR_COL[S.floor]);
    // 바닥 그림은 지금 층 ± 1 만 들고 있는다(10층 다 들면 그림 메모리 55MB), 다음 층은 미리 그려 둔다
    for(const k in floorTex) if(Math.abs(k - S.floor) > 1){ floorTex[k].dispose(); delete floorTex[k]; }
    const nf = S.floor + 1; if(nf < DP.FLOORS.length) setTimeout(() => { if(!floorTex[nf]){ paintFloor(nf); renderer.initTexture(floorTex[nf]); } }, 600); }
  clearConfetti(); for(const p of puffs){ p.t = 9; p.s.visible = false; }
  builtFor = S;
}
// 글꼴이 늦게 오면 바닥 글자를 다시 그린다
function prepaint(){ let f = 0; const next = () => { if(f > 1) return; paintFloor(f); renderer.initTexture(floorTex[f]); f++; setTimeout(next, 120); }; setTimeout(next, 300); }   // 층 바닥은 놀기 전에 미리
if(document.fonts) document.fonts.load('900 40px Paperlogy').then(() => { for(const k in floorTex){ floorTex[k].dispose(); delete floorTex[k]; } builtFloor = -1; if(builtFor){ floorMat.map = paintFloor(builtFor.floor); builtFloor = builtFor.floor; floorMat.needsUpdate = true; } prepaint(); });
else prepaint();

function vRect(v){ const x = v.h ? v.vis : v.f, y = v.h ? v.f : v.vis; return [x, y, v.h ? v.len : 1, v.h ? 1 : v.len]; }
const ROT = { R:0, L:PI, D:-PI/2, U:PI/2 };

/* ---------- 카메라 맞추기: 주차장 전체가 화면에 꼭 들어오게 ----------
   가로·PC 는 앞(+z)에서, 폰 세로는 왼쪽(-x)에서 본다(출구가 위로, 판이 화면 폭을 거의 다 쓰게) */
const V3 = a => new T.Vector3(...a);
const FIT_WIDE = [[-4.3, 0, -4.3], [-4.3, 1.15, -4.3], [5.6, 1.15, -4.3], [5.6, 0, -4.3], [-4.3, 0, 4.35], [5.6, 0, 4.35], [-4.3, .3, 4.35], [5.6, .3, 4.35]].map(V3);
const FIT_TALL = [[-3.6, 0, -3.62], [-3.6, 0, 3.62], [5.05, 0, -3.62], [5.05, 0, 3.62], [4.75, .5, 0], [-3.6, .35, 3.62]].map(V3);
const PITCH = 89.9*PI/180;   // 10/9 사장님 "공중정면": 바로 위에서 내려다봄(90도 정확히는 lookAt 이 흔들려 89.9)
const target = new T.Vector3(.6, 0, 0); let dist = 22, yaw = 0;
function place(){ const c = Math.cos(PITCH)*dist; cam.position.set(target.x - Math.sin(yaw)*c, target.y + Math.sin(PITCH)*dist, target.z + Math.cos(yaw)*c); cam.lookAt(target); cam.updateMatrixWorld(); }
function fit(){
  const r = cv.parentNode.getBoundingClientRect(), w = Math.max(50, Math.round(r.width)), h = Math.max(50, Math.round(r.height));
  renderer.setSize(w, h, false); cv.style.width = w + 'px'; cv.style.height = h + 'px';
  cam.aspect = w/h; cam.updateProjectionMatrix();
  const tall = w/h < 0.8; yaw = tall ? PI/2 : 0;
  const FIT = tall ? FIT_TALL : FIT_WIDE;
  // 바로 위에서 보므로 출구 안내판은 출구 통로 위쪽 벽 꼭대기에 눕혀 붙인다(글자 위쪽이 화면 위로)
  sign.rotation.set(-PI/2, -yaw, 0, 'YXZ'); sign.material.map = tall ? signTexUp : signTex; sign.material.needsUpdate = true; sign.position.set(5.25, .915, -1.16); signPost.visible = false;
  target.set(.65, 0, 0); dist = 22;
  const rx = Math.cos(yaw), rz = Math.sin(yaw), fx = Math.sin(yaw), fz = -Math.cos(yaw);   // 화면 오른쪽 · 화면 위쪽(바닥 위 방향)
  for(let it = 0; it < 10; it++){
    place(); let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
    for(const p of FIT){ const q = p.clone().project(cam); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }
    const half = Math.tan(cam.fov*PI/360)*dist, cx = (x0 + x1)/2*half*cam.aspect, cy = (y0 + y1)/2*half/Math.sin(PITCH);
    target.x += rx*cx + fx*cy; target.z += rz*cx + fz*cy;
    dist *= Math.max((x1 - x0)/1.96, (y1 - y0)/1.96);
  }
  place();
}
addEventListener('resize', fit);
if(window.ResizeObserver) new ResizeObserver(fit).observe(cv.parentNode);

/* ---------- 누르기: 화면 → 판 ---------- */
const ray = new T.Raycaster(), ndc = new T.Vector2(), plane = new T.Plane(new T.Vector3(0, 1, 0), -.25), hitP = new T.Vector3();
function setRay(cx, cy){ const r = cv.getBoundingClientRect(); ndc.set((cx - r.left)/r.width*2 - 1, -((cy - r.top)/r.height)*2 + 1); ray.setFromCamera(ndc, cam); }
function toBoard(cx, cy){ setRay(cx, cy); if(!ray.ray.intersectPlane(plane, hitP)) return [-99, -99]; return [hitP.x + 3, hitP.z + 3]; }
function pick(cx, cy){ scene.updateMatrixWorld(); setRay(cx, cy); const hs = ray.intersectObjects(cars.map(c => c.obj.userData.hitBox), false); if(!hs.length) return -1; const c = cars.find(c => c.obj.userData.hitBox === hs[0].object); return c ? c.i : -1; }
const tmpV = new T.Vector3();
function screenOf(x, y, z){ tmpV.set(x, y, z).project(cam); const r = cv.getBoundingClientRect(); return [r.left + (tmpV.x + 1)/2*r.width, r.top + (1 - tmpV.y)/2*r.height]; }

/* ---------- 매 프레임 그리기 ---------- */
const hintEl = document.getElementById('hint');
function render(dt){
  dt = dt || 0;
  const S = W.S; if(!S){ renderer.render(scene, cam); return; }
  if(builtFor !== S) rebuild(S);
  const t = W.t;
  // 차
  for(const c of cars){ const v = S.V[c.i], [x, y, w, h] = vRect(v), o = c.obj;
    let px = x + w/2 - 3, pz = y + h/2 - 3;
    if(v.shake > 0){ const a = Math.sin(t*70)*v.shake*.16; if(v.h) px += a; else pz += a; }
    o.position.set(px, 0, pz); o.rotation.y = ROT[v.dir];
    o.userData.g.position.y = (W.drag && W.drag.i === c.i) ? .025 : 0;      // 잡으면 살짝 들림
    const blink = v.blink > 0 && (t*8 % 2) < 1;
    o.userData.headM.emissiveIntensity = blink ? 1.6 : .25; o.userData.tailM.emissiveIntensity = blink ? 1.4 : .15;
    o.visible = !(S.won && c.i === 0 && v.vis > DP.N + 3.6); }
  // 내 차 테
  const hv = S.V[0], [hx, hy, hw, hh] = vRect(hv);
  heroRing.visible = !S.won; heroRing.position.set(hx + hw/2 - 3, .014, hy + hh/2 - 3); heroRing.scale.set(hw + .02, 1, hh + .02);
  heroRing.material.opacity = .75 + .25*Math.sin(t*3);
  // 위 표시: 차 위에서 출구 쪽으로 살짝 들썩, 화살표는 화면에서 출구(+x) 방향으로 돌림
  const mx = hx + hw/2 - 3, mz = hy + hh/2 - 3, bob = (Math.sin(t*4) + 1)/2;
  heroMark.visible = !S.won; heroMark.position.set(mx + bob*.12, .62, mz);
  scrA.set(mx, .5, mz).project(cam); scrB.set(mx + 1, .5, mz).project(cam); heroMark.material.rotation = Math.atan2((scrB.y - scrA.y), (scrB.x - scrA.x)*cam.aspect);
  // 차단기
  barPivot.rotation.x = Math.min(1, W.exit*2.4)*PI*.47;
  // 먼지
  for(const p of puffs){ if(p.t >= p.life){ if(p.s.visible) p.s.visible = false; continue; } p.t += dt; const k = Math.min(1, p.t/p.life);
    p.x += p.vx*dt; p.z += p.vz*dt; p.s.position.set(p.x, p.y + k*.1, p.z); const sc = p.s0*(1 + k*2.2); p.s.scale.set(sc, sc, 1); p.s.material.opacity = (1 - k)*.75; }
  // 종이꽃: 떨어져서 바닥에 쌓인다
  for(const c of conf){ if(!c.live || c.landed) continue; const m = c.m;
    m.position.x += c.vx*dt; m.position.y += c.vy*dt; m.position.z += Math.sin(t*3 + c.spin[0])*dt*.3;
    m.rotation.x += c.spin[0]*dt; m.rotation.y += c.spin[1]*dt; m.rotation.z += c.spin[2]*dt;
    if(m.position.y <= .016){ m.position.y = .016 + Math.random()*.004; m.rotation.set(-PI/2, 0, Math.random()*PI); c.landed = true; } }
  // 첫 판 손가락(동그라미가 내 차를 오른쪽으로 민다)
  if(hintEl){ const on = W.hint && S.idx === 0 && !W.drag && document.body.dataset.mode === 'play';
    hintEl.style.display = on ? 'block' : 'none';
    if(on){ const k = (Math.sin(t*2.6) + 1)/2; const [sx, sy] = screenOf(hx + hw/2 - 3 - .45 + k*.9, .3, hy + hh/2 - 3); hintEl.style.transform = `translate(${sx}px,${sy}px)`; hintEl.style.opacity = (.3 + .7*Math.min(1, k*3)).toFixed(2); } }
  renderer.render(scene, cam);
}
fit();
// 처음 나오는 것(먼지·종이꽃·차주·전화 표시)의 셰이더를 미리 만든다
(function warm(){ const on = [...puffs.map(p => p.s), ...conf.map(c => c.m)]; on.forEach(o => o.visible = true);
  renderer.compile(scene, cam); on.forEach(o => o.visible = false); })();
window.W = W;
window.R = { render, vRect, dust, confetti, toBoard, pick, screenOf, fit, renderer, scene, cam };
})();
