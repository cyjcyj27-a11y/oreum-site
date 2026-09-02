// ===== 루루냥의 제주 들판 — Three.js 3D 프로토타입 =====
// 들판(풀·돌담·돌하르방·나무)은 전부 코드로 만들고,
// 루루와 성산일출봉은 직접 그리신 그림 파일을 가져다 씁니다.
// 구성: 하늘 → 바다 → 섬 지형 → 성산일출봉/한라산 → 풀·유채꽃·억새 → 돌담/돌하르방/나무 → 루루

// 그림 파일을 화면에 입히려면(WebGL 텍스처) 브라우저 보안 규칙상 "서버로 열기"가 필요합니다.
// html 파일을 그냥 더블클릭하면(file://) 그림을 못 쓰기 때문에, 그때는 코드로 만든 루루/산으로 대신 보여줍니다.
const CAN_USE_IMAGES = location.protocol !== 'file:';

// 폰·태블릿에서 열었는지. 폰은 그래픽 성능이 PC보다 훨씬 약해서 화면 해상도와 그림자를 낮추고,
// 키보드가 없으니 화면에 조이스틱과 버튼을 띄웁니다.
const IS_TOUCH = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

// ---------- 0. 기본 세팅 ----------
// 섬 배치(나무·바위·밭·풀 위치)는 접속할 때마다 바뀌면 안 됩니다 — 항상 같은 우리 섬이어야죠.
// 그래서 세계를 만드는 동안은 "씨앗 있는 난수"를 씁니다: 씨앗이 같으면 결과가 늘 같습니다.
// 세계가 다 만들어지면(스크립트 맨 아래) 원래 난수로 되돌려서,
// 경마 승패나 이장님 잡담 같은 게임 중의 우연은 진짜 랜덤으로 굴러갑니다.
const trueRandom = Math.random;
{
  let seed = 20260807;   // 이 숫자를 바꾸면 완전히 새로운 섬이 나옵니다
  Math.random = function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xd2e6ee, 150, 700);   // 멀수록 하늘색에 잠기게 (수평선을 부드럽게)

const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 2000);

const renderer = new THREE.WebGLRenderer({ antialias: !IS_TOUCH });
renderer.setSize(innerWidth, innerHeight);
// 폰은 화면이 촘촘해서(devicePixelRatio 3 이상) 그대로 그리면 픽셀 수가 9배가 되어 뚝뚝 끊깁니다
renderer.setPixelRatio(Math.min(devicePixelRatio, IS_TOUCH ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = IS_TOUCH ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// 빛: 태양(그림자용) + 하늘/땅 반사광
const sun = new THREE.DirectionalLight(0xfff2d8, 2.1);
sun.castShadow = true;
sun.shadow.mapSize.set(IS_TOUCH ? 1024 : 2048, IS_TOUCH ? 1024 : 2048);
sun.shadow.camera.left = -26;
sun.shadow.camera.right = 26;
sun.shadow.camera.top = 26;
sun.shadow.camera.bottom = -26;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 160;
sun.shadow.bias = -0.0012;
scene.add(sun);
// 물질할 때 물속 분위기로 바꿔야 해서 이름을 붙여둡니다
const hemi = new THREE.HemisphereLight(0xbcdcf5, 0x6c8a4a, 1.15);
scene.add(hemi);

// ---------- 1. 하늘 (위아래 색이 다른 큰 돔) ----------
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(900, 32, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x2f7fd0) },
      bottomColor: { value: new THREE.Color(0xe2eff8) },
    },
    vertexShader: `
      varying float vH;
      void main() {
        vH = normalize(position).y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      #include <common>
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      varying float vH;
      void main() {
        float t = clamp(pow(max(vH, 0.0), 0.55), 0.0, 1.0);
        gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
        #include <colorspace_fragment>
      }`,
  })
);
scene.add(sky);

// ---------- 2. 지형 높이 함수 ----------
// 이 함수 하나로 (1) 땅 메시 모양 (2) 풀·돌 배치 높이 (3) 루루가 걷는 높이를 모두 결정합니다.
const ISLAND_R = 108;   // 잔디 들판 반지름
const WALK_R = 96;      // 루루가 돌아다닐 수 있는 범위

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// 오름(작은 화산 언덕) — 가우시안 봉우리
function bump(x, z, cx, cz, amp, size) {
  const dx = x - cx, dz = z - cz;
  return amp * Math.exp(-(dx * dx + dz * dz) / (2 * size * size));
}

// 물질하는 곳 — 포구(배 대는 자리) 앞바다입니다.
// 지형 높이 함수보다 먼저 정해둬야, 이 자리를 움푹 파낸 지형을 만들 수 있습니다.
//
// ※ 처음에는 바닷속 바닥을 따로 만들어 -13에 깔았는데, 섬 지형 판이 그 위(-6.5)를 덮고 있어서
//    물에 들어가면 지형 판만 보이고 루루도 미역도 하나도 안 보였습니다.
//    그래서 바닥을 따로 만들지 않고 지형 자체를 파내는 방식으로 바꿨습니다.
// 포구는 물가에 바짝 붙은 마른 땅에 둡니다. (0,92)는 물가에서 1.2미터 위,
// 여기서 두 걸음만 나가면 바로 물이라 "여기서 바다로 들어간다"는 게 한눈에 보입니다.
const PORT = { x: 0, z: 92 };
// 루루의 집터 — 남쪽 비탈을 완만하게 다져 평평한 터를 만듭니다.
// (지형 함수보다 먼저 정해둬야 집터를 다진 지형을 만들 수 있습니다. 집 좌표도 여기서 나옵니다)
const HOUSE_SITE = { x: 64, z: -58, flatR: 10, blendR: 20, h: 6.5 };
// 물질장은 물가(z≈93)에서 충분히 떨어뜨려야 합니다. 가장자리가 뭍에 닿으면
// 마른 땅 위에서도 잠수 상태로 서 있게 됩니다.
const DIVE = { x: 0, z: 118, r: 20 };    // 물질장 (포구 앞바다)
const DIVE_DEPTH = 9;                    // 이만큼 더 파 내려갑니다
const SEA_Y = -0.5;                      // 바다 표면 높이 (아래 4번에서 만드는 바다 판과 같은 값)

// ---------- 밭 격자와 올레길 ----------
// 섬은 33미터짜리 네모 칸으로 나뉘고, 칸마다 26미터짜리 밭이 하나씩 들어갑니다.
// 남는 7미터가 밭과 밭 사이 골목이고, 올레길은 그 골목 한가운데로만 지나갑니다.
// (밭을 실제로 만드는 곳은 아래 8번입니다. 여기서는 길을 먼저 정해 둡니다 —
//  풀·꽃·바위를 흩뿌릴 때 길 위를 비워두려면 길이 먼저 있어야 하기 때문입니다)
const PLOT_CELL = 33;    // 격자 한 칸
const PLOT_SIZE = 26;    // 밭 한 변
// 밭을 만들지 않고 비워두는 칸. 마당과, 건물이 들어선 칸들입니다.
// 밭 한가운데 건물이 박히면 돌담에 갇혀 문 앞까지 갈 수가 없습니다.
const EMPTY_CELLS = new Set([
  '0,1',    // 마당 — 상점(동쪽)과 택배사(서쪽)가 이 한 마당을 나란히 씁니다
  '-2,0',   // 마구간과 경마장
  '0,-2',   // 무남이네
  '2,-2',   // 루루의 헌집
]);

const olleSegs = [];   // 길 한 구간씩 {x1,z1,x2,z2,w}
function pointOnOlle(x, z, extra) {
  for (const s of olleSegs) {
    const vx = s.x2 - s.x1, vz = s.z2 - s.z1;
    const len2 = vx * vx + vz * vz;
    let t = len2 ? ((x - s.x1) * vx + (z - s.z1) * vz) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const px = s.x1 + vx * t, pz = s.z1 + vz * t;
    if (Math.hypot(x - px, z - pz) < s.w / 2 + (extra || 0)) return true;
  }
  return false;
}
// 그 자리에서 가장 가까운 길까지의 거리 (밭담 어귀를 길 쪽으로 돌려 세울 때 씁니다)
function distToOlle(x, z) {
  let best = Infinity;
  for (const s of olleSegs) {
    const vx = s.x2 - s.x1, vz = s.z2 - s.z1;
    const len2 = vx * vx + vz * vz;
    let t = len2 ? ((x - s.x1) * vx + (z - s.z1) * vz) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(x - (s.x1 + vx * t), z - (s.z1 + vz * t)) - s.w / 2;
    if (d < best) best = d;
  }
  return best;
}
{
  // g번 칸과 g+1번 칸 사이 골목의 한가운데
  const LANE = (g) => g * PLOT_CELL + PLOT_CELL / 2;
  const YARD = { x: 0, z: 33 };     // 상점·택배사 앞 마당
  const W = 4.0;                    // 골목(7미터) 한가운데 놓이는 길 너비
  const NORTH = LANE(1) + 1.5;      // 마당에서 북쪽으로 나갈 수 있는 끝 (그 위는 밭)
  // 건물 좌표는 한참 아래에서 정해지므로, 길을 먼저 놓는 여기서는 같은 값을 그대로 적습니다
  const SHOP_AT = { x: 6, z: 45 }, DEPOT_AT = { x: -8, z: 46 };
  const STABLE_AT = { x: -79, z: 8 }, MUNAM_AT = { x: 12, z: -64 };
  // 길에는 따로 돌담을 세우지 않습니다.
  // 밭 사이 골목에는 이미 밭 돌담이 양옆에 서 있고,
  // 길마다 담을 또 세우면 길이 갈라지는 자리에서 담이 옆길을 가로막습니다.
  const path = (x1, z1, x2, z2, w) => olleSegs.push({ x1, z1, x2, z2, w: w || 3.4 });

  // 마당 안 — 상점과 택배사 문 앞으로 짧게 두 갈래
  path(YARD.x, YARD.z + 3, SHOP_AT.x, SHOP_AT.z - 4.5, 3.6);
  path(YARD.x, YARD.z + 3, DEPOT_AT.x, DEPOT_AT.z - 3.5, 3.6);
  // 마당 → 포구 (물질 가는 길). 북쪽 밭을 동쪽 골목으로 돌아서 넘어갑니다
  path(YARD.x, YARD.z + 3, YARD.x, NORTH, W);
  path(YARD.x, NORTH, LANE(0), NORTH, W);
  path(LANE(0), NORTH, LANE(0), PORT.z - 6, W);
  path(LANE(0), PORT.z - 6, PORT.x, PORT.z - 6, W);
  path(PORT.x, PORT.z - 6, PORT.x, PORT.z - 1, W);
  // 마당 → 마구간·경마장 (서쪽 골목으로 내려가 서쪽 끝까지)
  path(YARD.x - 4, YARD.z, LANE(-1), YARD.z, W);
  path(LANE(-1), YARD.z, LANE(-1), LANE(0), W);
  path(LANE(-1), LANE(0), STABLE_AT.x, LANE(0), W);
  path(STABLE_AT.x, LANE(0), STABLE_AT.x, STABLE_AT.z + 6, W);
  // 마당 → 남쪽 (헌집·무남이네로 갈라지는 큰길)
  path(YARD.x + 4, YARD.z, LANE(0), YARD.z, W);
  path(LANE(0), YARD.z, LANE(0), LANE(-2), W);
  // 남쪽 → 헌집
  path(LANE(0), LANE(-2), LANE(1), LANE(-2), W);
  path(LANE(1), LANE(-2), HOUSE_SITE.x, HOUSE_SITE.z + 10, W);
  // 남쪽 → 무남이네
  path(LANE(0), LANE(-2), MUNAM_AT.x, MUNAM_AT.z + 6, 3.4);
}

let pierTopY = null;   // 포구 축대 윗면 높이 (처음 밟을 때 한 번 재서 기억합니다)
function groundHeight(x, z) {
  // 집 내부·상점 내부는 섬에서 멀리 떨어진 곳에 지은 별도의 방들입니다 — 그 안은 평평한 방바닥
  if (x > 380 && x < 480 && z > 380 && z < 420) return 20;
  // 포구 축대 위 — 바다 쪽으로 걸어나가도 축대 윗면 높이로 평평합니다
  // (이게 없으면 축대 끝으로 갈수록 지형이 바다로 꺼져서 루루가 돌 밑에 파묻힙니다)
  if (x > -2.6 && x < 2.6 && z > 92.5 && z < 102.4) {
    if (pierTopY === null) pierTopY = groundHeight(0, 92);
    return pierTopY;
  }
  let h = 0;
  h += Math.sin(x * 0.032) * 1.3 + Math.cos(z * 0.027) * 1.5;   // 완만한 기복
  h += Math.sin((x + z) * 0.012) * 2.0;
  h += Math.sin(x * 0.11) * Math.cos(z * 0.09) * 0.35;          // 잔주름
  h += bump(x, z, -48, -52, 15, 20);                            // 오름 1
  h += bump(x, z, 62, -34, 11, 17);                             // 오름 2
  h += bump(x, z, 24, 66, 7, 14);                               // 오름 3
  h += 2.5;

  // 섬 가장자리는 바다 쪽으로 서서히 내려가게
  const r = Math.sqrt(x * x + z * z);
  const edge = 1 - smoothstep(ISLAND_R - 22, ISLAND_R + 16, r);
  let y = h * edge - (1 - edge) * 7;

  // 물질장은 우묵한 웅덩이로 파냅니다. 가장자리는 완만하게 이어져야
  // 포구에서 헤엄쳐 들어갈 때 벽에 막히지 않습니다.
  const dr = Math.hypot(x - DIVE.x, z - DIVE.z);
  y -= DIVE_DEPTH * (1 - smoothstep(0, DIVE.r + 8, dr));

  // 루루의 집터 — 비탈을 다져 평평하게. 안쪽은 완전 평지, 바깥쪽은 언덕과 부드럽게 이어집니다.
  // (집이 경사면에 반쯤 떠 보이던 것을 지형 쪽에서 해결)
  const hs = Math.hypot(x - HOUSE_SITE.x, z - HOUSE_SITE.z);
  if (hs < HOUSE_SITE.blendR) {
    const t = smoothstep(HOUSE_SITE.flatR, HOUSE_SITE.blendR, hs);
    y = HOUSE_SITE.h * (1 - t) + y * t;
  }
  return y;
}

// 해저 바닥 높이 = 그냥 지형 높이입니다 (지형을 파냈으므로 따로 계산할 게 없습니다)
const seabedHeight = groundHeight;

// 화면에 실제로 그려지는 땅의 높이.
// 땅 메시는 340미터를 190칸으로 나눈 격자(한 칸 1.79m)의 꼭짓점에서만 groundHeight를 재고,
// 그 사이는 삼각형으로 곧게 이어붙입니다. 그래서 우묵한 자리에서는 그려진 땅이
// groundHeight보다 위로 솟습니다 — 밭 흙판을 groundHeight에 맞춰 깔면 그 솟은 땅에
// 대각선으로 잘려 보였습니다. 여기서는 두 갈래 삼각분할 중 높은 쪽을 골라,
// 어느 쪽으로 쪼개졌든 그려진 땅보다 낮아지지 않게 합니다.
const TERRAIN_STEP = 340 / 190;
function meshGroundHeight(x, z) {
  const g = TERRAIN_STEP;
  const gx = Math.floor((x + 170) / g), gz = Math.floor((z + 170) / g);
  const x0 = -170 + gx * g, z0 = -170 + gz * g;
  const u = (x - x0) / g, v = (z - z0) / g;
  const h00 = groundHeight(x0, z0),     h10 = groundHeight(x0 + g, z0);
  const h01 = groundHeight(x0, z0 + g), h11 = groundHeight(x0 + g, z0 + g);
  const a = (u + v <= 1) ? h00 + (h10 - h00) * u + (h01 - h00) * v
                         : h11 + (h01 - h11) * (1 - u) + (h10 - h11) * (1 - v);
  const b = (u <= v) ? h00 + (h11 - h01) * u + (h01 - h00) * v
                     : h00 + (h10 - h00) * u + (h11 - h10) * v;
  return Math.max(a, b);
}

// ---------- 3. 땅 메시 ----------
{
  const geo = new THREE.PlaneGeometry(340, 340, 190, 190);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = [];
  const cGrass = new THREE.Color(0x74a24d);
  const cHill = new THREE.Color(0x93b25b);
  const cSand = new THREE.Color(0xd8c79b);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const y = groundHeight(x, z);
    pos.setY(i, y);

    const c = new THREE.Color();
    if (y < 1.0) {
      c.copy(cSand).lerp(cGrass, smoothstep(-0.4, 1.0, y));       // 해안 모래밭
    } else {
      c.copy(cGrass).lerp(cHill, smoothstep(2, 14, y));           // 언덕은 밝은 풀색
      c.offsetHSL(0, 0, (Math.sin(x * 0.4) * Math.cos(z * 0.35)) * 0.025); // 얼룩덜룩하게
    }
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const ground = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
  ground.receiveShadow = true;
  scene.add(ground);
}

// ---------- 4. 바다 (잔잔한 물결) ----------
// 바다는 항상 카메라를 따라다니므로, 판 한가운데가 늘 발밑입니다.
// 그래서 가운데는 진한 청록, 바깥(=수평선 쪽)으로 갈수록 하늘빛으로 옅어지게 색을 칠해두면
// 어디를 가든 수평선이 자연스럽게 흐려집니다.
const sea = new THREE.Mesh(
  new THREE.PlaneGeometry(1700, 1700, 70, 70),
  // 양면(DoubleSide)으로 그려야 합니다 — 한쪽 면만 그리면 수면에 떠 있을 때
  // 카메라가 물보다 조금만 낮아져도 바다가 사라져서, 루루가 허공에 서 있는 것처럼 보입니다.
  new THREE.MeshPhongMaterial({ color: 0xffffff, vertexColors: true, shininess: 80, transparent: true, opacity: 0.94, side: THREE.DoubleSide })
);
sea.geometry.rotateX(-Math.PI / 2);
{
  const pos = sea.geometry.attributes.position;
  const near = new THREE.Color(0x2f88a8);    // 가까운 바다 (성산일출봉 그림의 청록빛에 맞춤)
  const far = new THREE.Color(0xcfe3ec);     // 수평선 근처 (하늘빛)
  const cols = [];
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getZ(i));
    c.copy(near).lerp(far, smoothstep(60, 620, r));
    cols.push(c.r, c.g, c.b);
  }
  sea.geometry.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
}
sea.position.y = SEA_Y;
scene.add(sea);
const seaBase = sea.geometry.attributes.position.array.slice();

// ---------- 5. 성산일출봉(그림)과 먼 산들 ----------
const texLoader = new THREE.TextureLoader();

function loadTexture(path) {
  const t = texLoader.load(path);
  t.colorSpace = THREE.SRGBColorSpace;   // 그림 파일 색을 그대로 보이게
  return t;
}

// 물속에 들어가면 감춰야 하는 "하늘 쪽" 것들 — 수평선 너머 풍경입니다.
// 물속에서 이것들이 보이면 물이 유리처럼 투명해 보여서 분위기가 깨집니다.
const skyStuff = [];

function makeMountain(x, z, baseR, topR, h, color) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(topR, baseR, h, 40, 1),
    new THREE.MeshLambertMaterial({ color, flatShading: true })
  );
  m.position.set(x, h / 2 - 6, z);
  scene.add(m);
  skyStuff.push(m);
  return m;
}

if (CAN_USE_IMAGES) {
  // 직접 그리신 성산일출봉 그림(far_island_v2.webp)을 수평선에 세워 둡니다.
  // 그림 원본이 1952x544 이고, 섬과 바다가 맞닿는 물가 선이 위에서 약 63% 지점에 있어서
  // 그 선이 실제 바다 높이(y=0)와 맞도록 판의 위치를 계산합니다.
  const IMG_W = 1952, IMG_H = 544, WATERLINE = 345 / IMG_H;
  const W = 936, H = W * IMG_H / IMG_W;   // 실제 성산일출봉을 들판에서 바라본 정도의 크기 (780에서 20% 키움)
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.MeshBasicMaterial({
      map: loadTexture('../assets/stage1/far_island_v2.webp'),
      transparent: true,
      depthWrite: false,
    })
  );
  backdrop.position.set(0, H * (WATERLINE - 0.5), -480);   // 물가 선이 바다 높이(y=0)에 오도록
  backdrop.renderOrder = -1;
  scene.add(backdrop);
  skyStuff.push(backdrop);

  makeMountain(-360, -300, 120, 14, 74, 0x6f9295);   // 멀리 보이는 한라산
  // (오른쪽 바다에 있던 뾰족한 섬은 성산일출봉과 겹쳐 보여서 없앴습니다)
} else {
  makeMountain(-60, -430, 150, 16, 92, 0x64878a);
  makeMountain(170, -360, 58, 8, 32, 0x6f9088);
  makeMountain(-260, -300, 50, 6, 26, 0x789787);
  makeMountain(260, -220, 38, 5, 20, 0x7d9b8a);
}

// ---------- 6. 바람에 흔들리는 식물 재질 ----------
// MeshLambertMaterial의 셰이더에 흔들림 코드를 살짝 끼워 넣습니다.
const windMaterials = [];
function makeWindMaterial(color) {
  const mat = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide });
  mat.onBeforeCompile = (shader) => {
    // 양면(DoubleSide) 재질은 뒷면을 그릴 때 빛 방향을 뒤집어서 새까맣게 나옵니다.
    // 풀잎은 어느 쪽에서 봐도 "위에서 빛을 받는" 것으로 고정합니다.
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_begin>',
      '#include <normal_fragment_begin>\n normal = vec3(0.0, 1.0, 0.0);'
    );
    shader.uniforms.uTime = { value: 0 };
    shader.vertexShader = 'uniform float uTime;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       #ifdef USE_INSTANCING
         vec3 wp = instanceMatrix[3].xyz;
       #else
         vec3 wp = vec3(0.0);
       #endif
       float sway = sin(uTime * 1.4 + wp.x * 0.22 + wp.z * 0.35)
                  + 0.45 * sin(uTime * 2.6 + wp.x * 0.7);
       float bend = max(transformed.y, 0.0);
       transformed.x += sway * 0.15 * bend;
       transformed.z += sway * 0.06 * bend;`
    );
    mat.userData.shader = shader;
  };
  windMaterials.push(mat);
  return mat;
}

// 밭은 두 가지입니다 — 루루가 귤을 따는 귤밭과, 이장님 소유의 빈 농지.
// 농지는 처음엔 아무것도 없는 황무지입니다. 이장님께 한 필지씩 빌려서 씨앗을 심어야
// 비로소 루루의 밭이 됩니다. 그마저도 수확의 절반은 소작료로 나갑니다.
// (서울에서 집값에 밀려 내려왔는데, 여기서도 남의 땅을 빌려 짓습니다)
const ORCHARDS = [];      // 귤밭
const FARMS = [];         // 농지 (이장님 땅 → 임대 → 매입)
const ALL_FIELDS = [];    // 돌담은 둘 다 똑같이 두릅니다
// 농지는 딱 네 필지입니다 (2026-08-09: 여덟에서 줄임).
// 한 필지에 1,000만원씩 네 필지면 4,000만원 — 재산 1억의 한 조각이 딱 맞습니다.
// 마당(0,1)을 가운데 두고 동서남북 사방에 한 필지씩 붙여 놓았습니다.
// 그래서 「북쪽땅」「남쪽땅」처럼 방향만으로 부를 수 있고, 어느 쪽으로 나가도 바로 밭입니다.
// 여기 적히지 않은 자리는 전부 귤밭이 됩니다.
const FARM_CELLS = new Set([
  '0,2',    // 북쪽땅 — 포구 가는 쪽
  '0,0',    // 남쪽땅 — 헌집 가는 쪽
  '1,1',    // 동쪽땅 — 상점 옆
  '-1,1',   // 서쪽땅 — 마구간 가는 쪽
]);
for (let gx = -3; gx <= 3; gx++) {
  for (let gz = -3; gz <= 3; gz++) {
    if (EMPTY_CELLS.has(gx + ',' + gz)) continue;
    // 골목이 곧아야 올레길이 지나갈 수 있어서, 칸 안에서 흔들리는 폭은 조금만 둡니다
    const cx = gx * PLOT_CELL + (Math.random() - 0.5) * 1.2;
    const cz = gz * PLOT_CELL + (Math.random() - 0.5) * 1.2;
    if (Math.hypot(cx, cz) > 78.5) continue;          // 밭 전체가 걸어다닐 수 있는 범위 안에 들어와야 함
    if (groundHeight(cx, cz) > 11) continue;          // 오름(화산 언덕) 꼭대기는 밭으로 덮지 않고 남겨둡니다
    // 네 귀퉁이까지 모두 판판한 뭍이어야 밭을 앉힙니다.
    // 해안 벼랑에 걸치면 땅이 뚝 떨어져서, 밭바닥이 지형에 파묻혀 비뚜름하게 잘려 보입니다.
    {
      const half = PLOT_SIZE / 2;
      let lo = Infinity, hi = -Infinity, dry = true;
      for (const [dx, dz] of [[-half, -half], [half, -half], [half, half], [-half, half]]) {
        const h = groundHeight(cx + dx, cz + dz);
        if (h < 0.9) { dry = false; break; }
        if (h < lo) lo = h;
        if (h > hi) hi = h;
      }
      if (!dry || hi - lo > 11) continue;
    }
    const f = {
      x: cx, z: cz,
      w: PLOT_SIZE, h: PLOT_SIZE,
      rot: (Math.random() - 0.5) * 0.09,              // 칸마다 살짝 비뚤어야 조각보처럼 보입니다
      gap: 5.3,
      cols: 5, rows: 5,
      open: (Math.random() * 4) | 0,                  // 네 변 중 아무 데나 한 곳을 입구로 터놓기
    };
    // 정해둔 네 칸만 농지, 나머지는 전부 귤밭
    f.kind = FARM_CELLS.has(gx + ',' + gz) ? 'farm' : 'citrus';
    if (f.kind === 'farm') {
      f.no = FARMS.length;      // 몇 번째 농지인가
      f.rented = false;         // 빌렸는가
      f.rentedDay = 0;          // 년세를 낸 날 (dayCount) — 1년 지나면 다시 냅니다
      f.owned = false;          // 아예 샀는가
      f.crop = null;            // 심어둔 씨앗
      f.planted = 0;            // 심은 날 (dayCount)
      f.spots = [];             // 포기 자리 (아래 8-3b에서 채웁니다)
      f.sign = null;            // 밭 앞 팻말
      FARMS.push(f);
    } else {
      ORCHARDS.push(f);
    }
    ALL_FIELDS.push(f);
  }
}

// ----- 필지 이름 붙이기 -----
// 네 필지가 마당 사방에 하나씩 붙어 있어서, "몇 번 밭"이 아니라 방향으로 부릅니다.
// 마당 한가운데(0, 33)에서 어느 쪽으로 더 치우쳤는지만 보면 됩니다.
const YARD_MID = { x: 0, z: 33 };
{
  for (const f of FARMS) {
    const dx = f.x - YARD_MID.x, dz = f.z - YARD_MID.z;
    f.side = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? '동' : '서') : (dz > 0 ? '북' : '남');
  }
}
// 팻말과 안내에 쓰는 이름 — 「동쪽땅」
function farmName(f) { return `${f.side}쪽땅`; }

// 갈아엎은 농지 안인가 — 황무지에 풀이 무성하면 묵정밭으로 보입니다
function inFarmPlot(x, z, margin) {
  const m = margin || 0;
  for (const f of FARMS) {
    const c = Math.cos(-f.rot), s = Math.sin(-f.rot);
    const dx = x - f.x, dz = z - f.z;
    const lx = dx * c - dz * s, lz = dx * s + dz * c;
    if (Math.abs(lx) < f.w / 2 + m && Math.abs(lz) < f.h / 2 + m) return true;
  }
  return false;
}

// ---------- 7. 들판에 흩뿌리기 (풀·꽃·억새·나무 공통) ----------
function scatter(count, maxR, minHeight, callback) {
  let placed = 0, guard = 0;
  while (placed < count && guard < count * 40) {
    guard++;
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * maxR;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    // 포구 축대 위는 걸어다니는 길이라 바위·풀을 심지 않습니다
    // (축대 바닥을 평평하게 만든 뒤로 여기가 "땅"으로 인식되어 바위가 길을 막는 일이 있었습니다)
    if (x > -3.4 && x < 3.4 && z > 90.5 && z < 103.5) continue;
    // 올레길 위도 마찬가지입니다 — 흙길에 풀이 무성하면 길로 보이지 않습니다
    if (pointOnOlle(x, z, -0.3)) continue;
    // 갈아엎은 농지도 맨흙이어야 합니다
    if (inFarmPlot(x, z, -0.8)) continue;
    const y = groundHeight(x, z);
    if (y < minHeight) continue;
    callback(x, y, z, r);
    placed++;
  }
}

const dummy = new THREE.Object3D();

function buildInstanced(geo, mat, spots, place) {
  const mesh = new THREE.InstancedMesh(geo, mat, spots.length);
  spots.forEach((s, i) => {
    place(s, i);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.frustumCulled = false;
  scene.add(mesh);
  return mesh;
}

// 풀잎처럼 세로로 선 판은 빛을 옆에서 받아 새까맣게 보입니다.
// 법선(빛 계산용 방향)을 전부 위쪽으로 바꿔주면 땅과 같은 밝기로 보입니다.
function normalsUp(geo) {
  const n = geo.attributes.normal;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  n.needsUpdate = true;
  return geo;
}

// 위로 갈수록 뾰족해지게 (풀잎 모양)
function taper(geo, height) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    p.setX(i, p.getX(i) * (1 - (p.getY(i) / height) * 0.75));
  }
  p.needsUpdate = true;
  return geo;
}

// 7-1. 풀 — 한 뭉텅이씩 모여 자라게 심습니다 (드문드문 꽂힌 느낌을 없애려고)
{
  const spots = [[], [], []];
  scatter(16000, ISLAND_R - 4, 0.9, (x, y, z) => {
    for (let i = 0; i < 8; i++) {                       // 한 자리에 8포기씩
      const ox = x + (Math.random() - 0.5) * 0.9;
      const oz = z + (Math.random() - 0.5) * 0.9;
      spots[(Math.random() * 3) | 0].push([ox, groundHeight(ox, oz), oz]);
    }
  });
  const greens = [0x6ba044, 0x7cb051, 0x8dbe5e];
  const H = 0.42;
  spots.forEach((group, gi) => {
    const blade = normalsUp(taper(new THREE.PlaneGeometry(0.11, H, 1, 3), H));
    blade.translate(0, H / 2, 0);
    buildInstanced(blade, makeWindMaterial(greens[gi]), group, (s) => {
      dummy.position.set(s[0], s[1] - 0.03, s[2]);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.scale.set(1, 0.7 + Math.random() * 0.8, 1);
    });
  });
}

// 7-2. 유채꽃 (줄기 + 노란 꽃송이 — 두 덩어리가 같은 자리에 놓입니다)
{
  const spots = [];
  scatter(3200, ISLAND_R - 10, 1.2, (x, y, z) => spots.push([x, y, z, 0.42 + Math.random() * 0.3]));
  // 유채밭 두 군데는 더 빽빽하게
  [[-30, 30], [55, 20]].forEach(([cx, cz]) => {
    for (let i = 0; i < 2600; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 17;
      const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      const y = groundHeight(x, z);
      if (y > 1.2) spots.push([x, y, z, 0.5 + Math.random() * 0.3]);
    }
  });

  const stemGeo = normalsUp(new THREE.CylinderGeometry(0.016, 0.024, 1, 4));
  stemGeo.translate(0, 0.5, 0);
  // 인스턴스마다 세로로 눌리기 때문에(줄기 길이 조절) 꽃송이는 미리 세로로 늘려둡니다
  const headGeo = new THREE.IcosahedronGeometry(0.085, 0);
  headGeo.scale(1, 1.9, 1);
  headGeo.translate(0, 1.0, 0);

  const place = (s) => {
    dummy.position.set(s[0], s[1], s[2]);
    dummy.rotation.set(0, Math.random() * Math.PI, 0);
    dummy.scale.set(1, s[3], 1);
  };
  buildInstanced(stemGeo, makeWindMaterial(0x6d9a46), spots, place);
  buildInstanced(headGeo, makeWindMaterial(0xf5cf3c), spots, place);
}

// 7-3. 억새 (해안 쪽에 키 큰 은빛 풀)
{
  const spots = [];
  scatter(900, ISLAND_R - 2, 0.9, (x, y, z, r) => {
    if (r > ISLAND_R - 34) spots.push([x, y, z, 0.7 + Math.random() * 0.4]);
  });
  const stalk = normalsUp(new THREE.PlaneGeometry(0.09, 1.6, 1, 3));
  stalk.translate(0, 0.8, 0);
  const plume = new THREE.SphereGeometry(0.1, 6, 5);
  plume.scale(1, 2.4, 1);
  plume.translate(0, 1.75, 0);

  const place = (s) => {
    dummy.position.set(s[0], s[1], s[2]);
    dummy.rotation.set(0, Math.random() * Math.PI, 0);
    dummy.scale.set(1, s[3], 1);
  };
  buildInstanced(stalk, makeWindMaterial(0x9faa62), spots, place);
  buildInstanced(plume, makeWindMaterial(0xe8dfc4), spots, place);
}

// ---------- 8. 장애물 목록 (루루가 통과하지 못하는 것들) ----------
// { x, z, r, topY } — topY는 "이 높이보다 위로 뜨면 그냥 지나갈 수 있다"는 뜻입니다.
// 돌담처럼 낮은 것은 점프해서 뛰어넘을 수 있고, 나무나 건물은 넘을 수 없게 아주 높게 둡니다.
// 매 프레임 장애물 1700개를 훑으므로, 땅 높이를 그때그때 계산하지 않고 만들 때 미리 적어둡니다.
const NO_JUMP = 9999;
const obstacles = [];

// 건물이 루루(1.73m)에 비해 낮아 보인다고 하셔서 전부 한 번에 키웁니다.
// 세워둔 그룹째로 늘리는 방식이라 문·지붕·간판의 자리 관계는 그대로 유지됩니다.
// 대신 부딪히는 반경과 말을 걸 수 있는 거리도 같은 비율로 늘려줘야 벽에 파묻히지 않습니다.
const BUILD_SCALE = 1.3;

// 8-1. 돌담 — 제주 밭담처럼 구멍 숭숭한 낮은 현무암 담장
const stoneMat = new THREE.MeshLambertMaterial({ color: 0x6f6f6d, flatShading: true });
const darkStoneMat = new THREE.MeshLambertMaterial({ color: 0x5c5c5b, flatShading: true });

// 돌 하나하나를 따로 만들면 그릴 것이 수백 개로 늘어나 느려집니다.
// 그래서 위치만 모아뒀다가 마지막에 InstancedMesh(같은 모양을 한 번에 여러 개 그리는 방식)로 만듭니다.
const stoneSpots = { light: [], dark: [] };

function buildStoneWall(x1, z1, x2, z2) {
  const dx = x2 - x1, dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  const step = 0.72;
  const n = Math.floor(len / step);

  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x1 + dx * t, z = z1 + dz * t;
    const y = groundHeight(x, z);
    if (y < 1.0) continue;
    // 올레길이 지나는 자리는 담을 터놓습니다 — 제주 밭담에도 드나드는 어귀가 있습니다
    if (pointOnOlle(x, z, 0.5)) continue;

    const layers = 2 + ((Math.random() * 2) | 0);
    for (let L = 0; L < layers; L++) {
      (Math.random() < 0.4 ? stoneSpots.dark : stoneSpots.light).push({
        x: x + (Math.random() - 0.5) * 0.22,
        y: y + 0.25 + L * 0.42,
        z: z + (Math.random() - 0.5) * 0.22,
        s: (0.3 + Math.random() * 0.16) / 0.35,
        rx: Math.random() * 3, ry: Math.random() * 3, rz: Math.random() * 3,
      });
    }
    // 돌담은 낮으니 점프로 넘을 수 있게 합니다. 담 꼭대기는 돌을 layers장 쌓은 높이입니다.
    if (i % 2 === 0) obstacles.push({ x, z, r: 0.62, topY: y + 0.25 + (layers - 1) * 0.42 + 0.3 });
  }
}

// 섬 바깥 자투리 땅에만 남겨두는 자유 돌담 (밭담 격자가 닿지 않는 해안 쪽 풍경용)
buildStoneWall(-92, 22, -66, 44);
buildStoneWall(66, 60, 92, 44);
buildStoneWall(-58, -74, -22, -84);
// 헌집으로 안내하는 남쪽 돌담길 — 밭 사이에서 시작해 언덕 끝 집 앞까지 죽 내려갑니다
buildStoneWall(46, -18, 52, -44);
buildStoneWall(52, -44, 53, -66);

// 감귤밭을 두르는 밭담. 네 변 중 한 곳은 터놓아야 루루가 들어갈 수 있습니다
// (돌담은 낮아 보여도 통과가 막혀 있어서, 막아두면 밭 안으로 못 들어갑니다)
//
// 제주 들판은 밭담으로 잘게 나뉜 조각보처럼 생겼습니다. 그 느낌을 내려고 밭을 하나씩
// 손으로 적지 않고, 섬 전체에 격자를 깔아 한 칸에 밭 하나씩 앉힙니다.
// 칸(PLOT_CELL)보다 밭(PLOT_SIZE)을 작게 잡은 만큼이 밭과 밭 사이의 길이 됩니다.
// (격자 크기 PLOT_CELL·PLOT_SIZE와 비워둘 칸 EMPTY_CELLS는 위쪽 올레길 대목에서 정해 뒀습니다)
// (밭 격자는 풀보다 먼저 정해야 해서 위쪽 7번 앞으로 옮겨 두었습니다)

function fieldCorners(f) {
  const c = Math.cos(f.rot), s = Math.sin(f.rot);
  const pt = (lx, lz) => [f.x + lx * c - lz * s, f.z + lx * s + lz * c];
  return [pt(-f.w / 2, -f.h / 2), pt(f.w / 2, -f.h / 2), pt(f.w / 2, f.h / 2), pt(-f.w / 2, f.h / 2)];
}

// 터놓을 변을 고릅니다. 아무 데나 트면 반대쪽에서 온 루루가 26미터를 빙 돌아야 하고,
// 상자를 끌 때는 담을 뛰어넘을 수도 없어 아예 못 들어갑니다.
// 그래서 네 변 중 길에 가장 가까운 쪽을 어귀로 삼습니다 — 길 따라 걷다 보면 바로 들어가집니다.
for (const f of ALL_FIELDS) {
  const p = fieldCorners(f);
  let best = f.open, bestD = Infinity;
  for (let i = 0; i < 4; i++) {
    const a = p[i], b = p[(i + 1) % 4];
    const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;   // 그 변의 한가운데
    const ox = mx - f.x, oz = mz - f.z, L = Math.hypot(ox, oz) || 1;
    const d = distToOlle(mx + ox / L * 2.5, mz + oz / L * 2.5);   // 변 바깥으로 한 발 나가서 잽니다
    if (d < bestD) { bestD = d; best = i; }
  }
  f.open = best;
}

for (const f of ALL_FIELDS) {
  const p = fieldCorners(f);
  for (let i = 0; i < 4; i++) {
    if (i === f.open) continue;                 // 이 변은 입구로 터놓습니다
    const a = p[i], b = p[(i + 1) % 4];
    buildStoneWall(a[0], a[1], b[0], b[1]);
  }
}

// 모아둔 돌 위치를 한 번에 그리기
{
  const rock = new THREE.DodecahedronGeometry(0.35, 0);
  [[stoneSpots.light, stoneMat], [stoneSpots.dark, darkStoneMat]].forEach(([spots, mat]) => {
    const mesh = buildInstanced(rock, mat, spots, (s) => {
      dummy.position.set(s.x, s.y, s.z);
      dummy.rotation.set(s.rx, s.ry, s.rz);
      dummy.scale.setScalar(s.s);
    });
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });
}

// 8-2. 돌하르방
// 실제 제주 돌하르방 사진을 보고 다시 깎았습니다.
// 특징은 넷입니다 — ①챙 넓은 벙거지 ②주먹만 한 뭉툭코 ③지그시 감은 눈
// ④배에 포갠 두 주먹(오른손이 위). 현무암이라 표면이 곰보처럼 얽어 있어야 합니다.
const HARU_STONE = (() => {
  // 곰보 현무암 무늬 — 회색 바탕에 검은 구멍을 촘촘히 찍습니다
  // 무늬 자체를 밝게 그리고, 재질 색은 흰색으로 둡니다.
  // (텍스처와 재질색을 둘 다 어둡게 잡으면 서로 곱해져서 새까매집니다 — 실제로 한 번 그랬습니다)
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#c3c0b8'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) {
    const r = 0.6 + Math.random() * 2.2;
    const v = 0x74 + ((Math.random() * 0x24) | 0);
    g.fillStyle = `rgba(${v},${v},${v - 3},${0.3 + Math.random() * 0.4})`;
    g.beginPath();
    g.arc(Math.random() * 128, Math.random() * 128, r, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 260; i++) {   // 밝게 튀는 알갱이도 조금
    g.fillStyle = `rgba(236,234,226,${0.2 + Math.random() * 0.3})`;
    g.beginPath();
    g.arc(Math.random() * 128, Math.random() * 128, 0.5 + Math.random(), 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshLambertMaterial({ map: t });
})();
// 벙거지와 새겨넣은 홈은 한 톤 어둡게 (그늘진 자리라 티가 나야 합니다)
const HARU_DARK = new THREE.MeshLambertMaterial({ map: HARU_STONE.map, color: 0xdcd9d1 });

function buildDolharubang(x, z, rotY) {
  const g = new THREE.Group();
  // 밑면이 평평한 석상이라, 경사면에 중심 높이로만 세우면 아래쪽 모서리가 공중에 뜹니다.
  // 밑면 둘레(반경 0.72)에서 가장 낮은 지점에 맞추고, 살짝 파묻어(−0.15) 어디서도 안 뜨게 합니다.
  let y = groundHeight(x, z);
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
    y = Math.min(y, groundHeight(x + Math.cos(a) * 0.72, z + Math.sin(a) * 0.72));
  }
  g.position.set(x, y - 0.15, z);
  g.rotation.y = rotY;

  const add = (mesh, px, py, pz, mat) => {
    mesh.position.set(px, py, pz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  };

  // ----- 몸통 — 아래로 갈수록 퍼지는 통짜 돌기둥 (사진처럼 따로 받침돌이 없습니다) -----
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.72, 1.5, 14), HARU_STONE), 0, 0.75, 0);
  // 어깨 — 몸통에서 머리로 넘어가는 완만한 둔덕
  add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), HARU_STONE), 0, 1.5, 0)
    .scale.set(1.05, 0.6, 0.95);

  // ----- 머리 -----
  const head = add(new THREE.Mesh(new THREE.SphereGeometry(0.44, 16, 14), HARU_STONE), 0, 1.98, 0);
  head.scale.set(1.02, 1.08, 0.95);
  // 볼이 넓고 턱이 두툼합니다
  add(new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), HARU_STONE), 0, 1.74, 0.06)
    .scale.set(1.12, 0.72, 1.0);

  // 벙거지 — 챙 넓은 판 + 그 위에 얹힌 둥근 통
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.1, 16), HARU_DARK), 0, 2.34, 0);   // 챙
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.44, 0.3, 16), HARU_DARK), 0, 2.53, 0);    // 통
  add(new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), HARU_DARK), 0, 2.66, 0)
    .scale.set(1, 0.55, 1);                                                                       // 꼭대기 둥근 뚜껑

  // 지그시 감은 눈 — 도톰한 눈두덩 위에 가느다란 눈매를 새깁니다
  [-0.18, 0.18].forEach((ex) => {
    const lid = add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), HARU_STONE), ex, 2.04, 0.33);
    lid.scale.set(1.15, 0.85, 0.7);
    const slit = add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.035, 0.05), HARU_DARK), ex, 2.02, 0.42);
    slit.rotation.z = ex < 0 ? 0.14 : -0.14;
  });

  // 뭉툭코 — 돌하르방의 얼굴은 코가 다 합니다. 크고 아래로 처지게
  const nose = add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), HARU_STONE), 0, 1.9, 0.4);
  nose.scale.set(0.9, 1.35, 1.25);
  add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), HARU_STONE), 0, 1.78, 0.44)
    .scale.set(1.25, 0.8, 1.0);                                                                   // 콧방울

  // 꾹 다문 입 — 살짝 웃는 듯 양끝이 올라갑니다
  add(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.045, 0.05), HARU_DARK), 0, 1.66, 0.4);
  [-0.13, 0.13].forEach((mx) => {
    const cor = add(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.05), HARU_DARK), mx, 1.675, 0.39);
    cor.rotation.z = mx < 0 ? -0.5 : 0.5;
  });

  // 길쭉한 귀
  [-0.42, 0.42].forEach((ex) => {
    add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), HARU_STONE), ex, 1.94, 0.02)
      .scale.set(0.55, 1.5, 0.85);
  });

  // ----- 배에 포갠 두 주먹 (사진처럼 오른손이 위, 왼손이 아래) -----
  const fist = (fx, fy) => {
    add(new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), HARU_STONE), fx, fy, 0.42)
      .scale.set(1.0, 1.15, 0.85);
    // 손가락 세 마디를 옆으로 나란히 새깁니다
    for (let i = -1; i <= 1; i++) {
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.17, 6), HARU_STONE),
          fx + i * 0.075, fy + 0.02, 0.53).rotation.x = Math.PI / 2;
    }
  };
  fist(-0.2, 1.06);   // 위쪽 주먹
  fist(0.2, 0.86);    // 아래쪽 주먹
  // 팔 — 몸통 옆구리를 타고 내려와 주먹으로 이어집니다
  [[-0.42, 1.3, 0.42], [0.42, 1.24, -0.42]].forEach(([ax, ay, tilt]) => {
    const arm = add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.66, 8), HARU_STONE), ax, ay, 0.16);
    arm.rotation.set(0.28, 0, tilt);
  });

  scene.add(g);
  obstacles.push({ x, z, r: 1.0, topY: NO_JUMP });
}

buildDolharubang(-8, -18, 0.4);
buildDolharubang(34, 12, -1.1);
buildDolharubang(-52, 20, 2.2);
buildDolharubang(12, 58, 3.1);

// 간판 글씨 도우미 — 영어 번역이 칸보다 길면 글자 크기를 줄여서 맞춥니다
const SIGN_T = window.T || ((s) => s);
function fitSignText(ctx, text, maxW) {
  const w = ctx.measureText(text).width;
  if (w > maxW) {
    const size = parseInt(ctx.font.match(/(\d+)px/)[1], 10);
    ctx.font = ctx.font.replace(size + 'px', Math.max(10, Math.floor(size * maxW / w)) + 'px');
  }
}
function signText(ctx, korean, x, y, maxW) {
  const t = SIGN_T(korean);
  fitSignText(ctx, t, maxW);
  ctx.fillText(t, x, y);
}

// ---------- 8-2b. 상점 「이장님 만물상」 (당근·망사리·가구·인테리어를 파는 곳)
// 제주 돌집 그대로 — 현무암 벽에 초가지붕을 얹고, 문을 활짝 열어 안쪽 진열장이 보이게 합니다.
// 순수한 배경 오브젝트라 돌하르방처럼 모양만 만들고 장애물 목록에 등록해둡니다.
// "살 수 있는지/샀는지" 같은 상호작용 로직은 여기 두지 않고 경제(코인) 쪽(12-1c)에서 처리합니다.
// 귤나무·팽나무보다 먼저 만들어야, 나무들이 이 자리를 피해서 심어집니다.
// 귤 색은 가게 진열대(여기)와 귤나무(8-3) 양쪽에서 쓰므로 먼저 만들어 둡니다
const tangerineMat = new THREE.MeshLambertMaterial({ color: 0xf0871c });
const shopWoodMat = new THREE.MeshLambertMaterial({ color: 0x8a6038, flatShading: true });
const shopWoodDarkMat = new THREE.MeshLambertMaterial({ color: 0x5e3f24, flatShading: true });
const shopThatchMat = new THREE.MeshLambertMaterial({ color: 0xd3b97e, flatShading: true });
const shopDarkMat = new THREE.MeshLambertMaterial({ color: 0x2b1d12 });      // 문 안쪽 그늘
const shopRopeMat = new THREE.MeshLambertMaterial({ color: 0xd8a34a });
const shopLeafMat = new THREE.MeshLambertMaterial({ color: 0x4f8a3c, flatShading: true });
const shopPotMat = new THREE.MeshLambertMaterial({ color: 0xb56a3c, flatShading: true });

// 현무암 벽 무늬 — 검은 돌을 모르타르로 붙인 제주 돌담벽을 캔버스에 직접 그려 텍스처로 씁니다
function makeBasaltTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8d8b85';           // 돌 사이를 메운 회반죽
  ctx.fillRect(0, 0, 128, 128);
  for (let row = 0; row < 6; row++) {
    const off = (row % 2) * 11;         // 벽돌처럼 한 줄씩 엇갈리게
    for (let col = -1; col < 7; col++) {
      const cx = col * 22 + off + 11, cy = row * 22 + 11;
      const g = 0x50 + ((Math.random() * 0x22) | 0);
      ctx.fillStyle = `rgb(${g},${g - 4},${g - 8})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 9.5 + Math.random() * 1.5, 8.5 + Math.random() * 1.5, Math.random(), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const shopStoneMat = new THREE.MeshLambertMaterial({ map: makeBasaltTexture() });

// 지붕에 걸린 나무 간판 — 글씨는 캔버스에 그려 붙입니다
function makeSignTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 160;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c08a4e';
  ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = 'rgba(90, 55, 20, 0.5)';   // 나뭇결
  ctx.lineWidth = 2;
  for (let y = 12; y < 160; y += 19) {
    ctx.beginPath();
    ctx.moveTo(0, y + Math.sin(y) * 3);
    ctx.bezierCurveTo(170, y - 5, 340, y + 6, 512, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#3d2410';
  ctx.textAlign = 'center';
  // 가게 이름만 큼직하게 — 위 작은 글씨는 뺐습니다
  ctx.font = 'bold 62px "맑은 고딕", Malgun Gothic, sans-serif';
  ctx.textBaseline = 'middle';
  signText(ctx, '이장님 만물상', 256, 84, 480);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildShop(x, z, rotY) {
  const g = new THREE.Group();
  const y = groundHeight(x, z);
  g.position.set(x, y, z);
  g.rotation.y = rotY;   // 이 그룹 안에서는 +z 쪽이 가게 정면입니다

  const add = (mesh, px, py, pz) => {
    mesh.position.set(px, py, pz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  };

  const W = 4.4, D = 3.0, H = 2.6;   // 돌집 몸통 크기

  // 돌벽: 뒤 한 면 + 옆 두 면 + 정면 문 위 인방. 정면 가운데는 뚫어두어 진열장이 보입니다
  add(new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.34), shopStoneMat), 0, H / 2, -D / 2);
  add(new THREE.Mesh(new THREE.BoxGeometry(0.34, H, D), shopStoneMat), -W / 2, H / 2, 0);
  add(new THREE.Mesh(new THREE.BoxGeometry(0.34, H, D), shopStoneMat), W / 2, H / 2, 0);
  add(new THREE.Mesh(new THREE.BoxGeometry(1.0, H, 0.34), shopStoneMat), -1.7, H / 2, D / 2);   // 정면 왼쪽 기둥
  add(new THREE.Mesh(new THREE.BoxGeometry(1.0, H, 0.34), shopStoneMat), 1.7, H / 2, D / 2);    // 정면 오른쪽 기둥
  add(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 0.34), shopStoneMat), 0, H - 0.25, D / 2); // 문 위 인방

  // 가게 안쪽 그늘 — 문 안이 뻥 뚫려 보이지 않게 어두운 판을 세워둡니다
  add(new THREE.Mesh(new THREE.BoxGeometry(W - 0.7, H - 0.5, 0.1), shopDarkMat), 0, (H - 0.5) / 2, -D / 2 + 0.35);

  // 진열장 선반 3단과 그 위에 올린 물건들 (화분·항아리·바구니)
  for (let s = 0; s < 3; s++) {
    add(new THREE.Mesh(new THREE.BoxGeometry(W - 1.0, 0.09, 0.42), shopWoodMat), 0, 0.5 + s * 0.62, -D / 2 + 0.55);
    for (let i = -1; i <= 1; i++) {
      const px = i * 0.95 + (Math.random() - 0.5) * 0.2;
      const py = 0.55 + s * 0.62, pz = -D / 2 + 0.55;
      if (Math.random() < 0.5) {
        add(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.09, 0.2, 7), shopPotMat), px, py + 0.1, pz);
        add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 0), shopLeafMat), px, py + 0.3, pz);
      } else {
        add(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.26, 8), shopPotMat), px, py + 0.13, pz);
      }
    }
  }

  // 활짝 열어둔 두 짝 문 — 바깥쪽으로 젖혀 놓아 안이 들여다보입니다
  [-1, 1].forEach((side) => {
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.0, 0.1), shopWoodMat);
    const pivot = new THREE.Group();
    pivot.position.set(side * 1.2, 1.0, D / 2 + 0.05);
    pivot.rotation.y = side * -1.15;        // 안쪽 경첩을 축으로 바깥으로 열림
    door.position.x = side * 0.55;
    door.castShadow = true;
    pivot.add(door);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), shopWoodDarkMat);
    knob.position.set(side * 1.0, 0, 0.08);
    pivot.add(knob);
    g.add(pivot);
  });

  // 초가지붕 — 볏짚을 두툼하게 얹은 모임지붕.
  // 8각 원뿔을 세 단으로 겹쳐 쌓으면 짚단을 층층이 올린 제주 초가처럼 도톰하게 보입니다.
  [[0.30, 3.30, 2.90, 0.75], [0.95, 2.75, 2.05, 0.70], [1.50, 1.85, 0.85, 0.75]].forEach(
    ([dy, rBot, rTop, h]) => {
      const tier = add(new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 8), shopThatchMat), 0, H + dy, 0);
      tier.scale.set(1.0, 1, 0.85);     // 집이 가로로 길어서 지붕도 앞뒤로 눌러줍니다
      tier.rotation.y = Math.PI / 8;
    }
  );
  const cap = add(new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), shopThatchMat), 0, H + 1.9, 0);
  cap.scale.set(1.0, 0.7, 0.85);        // 꼭대기를 둥글게 여며 마무리한 용마름

  // 지붕 앞에 매단 간판
  const sign = add(
    new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.0, 0.12), new THREE.MeshLambertMaterial({ map: makeSignTexture() })),
    0, H + 0.95, D / 2 + 1.15   // 지붕 처마보다 앞으로 내밀어야 글씨가 짚에 안 가립니다
  );
  sign.rotation.x = -0.18;

  // 지붕 위에 굴러다니는 귤 몇 알 (레퍼런스 그림의 그 귤들)
  [[-1.85, 0.45], [1.7, 0.3], [2.1, -0.35]].forEach(([px, pz]) => {
    add(new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), tangerineMat), px, H + 0.55, pz);
  });

  // 처마에 걸린 풍경 두 개
  [-1.5, 1.5].forEach((px) => {
    add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshLambertMaterial({ color: 0x9fc4cf })), px, H + 0.02, D / 2 + 0.35);
    const tag = add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.34, 0.02), new THREE.MeshLambertMaterial({ color: 0xf2ead6 })), px, H - 0.25, D / 2 + 0.35);
    tag.castShadow = false;
  });

  // 가게 앞 손수레 — 여기 위에 파는 물건(끈)과 귤 바구니를 올려둡니다
  const cart = new THREE.Group();
  cart.position.set(-2.7, 0, D / 2 + 0.2);
  cart.rotation.y = 0.35;
  const cartAdd = (mesh, px, py, pz) => {
    mesh.position.set(px, py, pz);
    mesh.castShadow = true;
    cart.add(mesh);
    return mesh;
  };
  cartAdd(new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 1.0), shopWoodMat), 0, 0.72, 0);         // 상판
  [[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]].forEach(([px, pz]) => {
    cartAdd(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.72, 6), shopWoodDarkMat), px, 0.36, pz);
  });
  const wheel = cartAdd(new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 6, 14), shopWoodDarkMat), 0.85, 0.3, 0);
  wheel.rotation.y = Math.PI / 2;
  // 귤이 담긴 바구니
  const bowl = cartAdd(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.22, 0.2, 10), shopWoodMat), -0.45, 0.88, 0);
  bowl.receiveShadow = true;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    cartAdd(new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), tangerineMat),
      -0.45 + Math.cos(a) * 0.15, 1.0, Math.sin(a) * 0.15);
  }
  g.add(cart);


  // 문 앞 디딤돌
  for (let i = 0; i < 3; i++) {
    const step = add(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.4, 0.12, 7), stoneMat),
      (i - 1) * 0.85, 0.06, D / 2 + 1.15);
    step.rotation.y = Math.random();
  }

  g.scale.setScalar(BUILD_SCALE);
  scene.add(g);
  obstacles.push({ x, z, r: 2.6 * BUILD_SCALE, topY: NO_JUMP });   // 가게 건물은 뛰어넘을 수 없습니다
  return { group: g };
}
// 루루가 시작하는 트인 마당(HOME 칸) 안, 시작 지점 바로 북쪽에 두어 처음부터 눈에 띄게 합니다.
// 시작 지점이 z=34라 가게는 -z(남쪽)를 바라봐야 정면이 보입니다.
const shop = buildShop(6, 45, Math.PI);
const SHOP_RANGE = 4.2 * BUILD_SCALE;   // 건물이 커진 만큼 말을 걸 수 있는 거리도 넓힙니다
buildDolharubang(2.2, 45.4, Math.PI);   // 가게를 지키는 돌하르방 (손수레 반대편에 세워 겹치지 않게)

// ---------- 8-2c. 택배사 「제주택배 : 이장님네 분소」
// 녹슨 함석(골함석)으로 지은 시골 택배 창고입니다. 가득 찬 귤 상자를 여기까지 끌고 오면
// 육지로 부칠 수 있습니다. 상점과 마찬가지로 모양만 만들고, 배송 처리는 12-1d에서 합니다.
const depotTinDarkMat = new THREE.MeshLambertMaterial({ color: 0x6a7276, flatShading: true });
const depotWoodMat = new THREE.MeshLambertMaterial({ color: 0x9a7748, flatShading: true });
const depotBoxMat = new THREE.MeshLambertMaterial({ color: 0xc79a63 });
const depotDarkMat = new THREE.MeshLambertMaterial({ color: 0x241c16 });
const truckBodyMat = new THREE.MeshLambertMaterial({ color: 0xe8e6e0, flatShading: true });
const truckGlassMat = new THREE.MeshLambertMaterial({ color: 0x4a6a72 });
const tireMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2c });

// 골함석 무늬 — 세로 골이 파인 함석판에 녹이 번진 모습을 캔버스에 그립니다
function makeTinTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8d9aa0';
  ctx.fillRect(0, 0, 128, 128);
  for (let x = 0; x < 128; x += 8) {          // 세로로 반복되는 골
    ctx.fillStyle = 'rgba(40, 55, 62, 0.28)';
    ctx.fillRect(x, 0, 3, 128);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.fillRect(x + 4, 0, 2, 128);
  }
  for (let i = 0; i < 26; i++) {              // 녹슨 얼룩
    ctx.fillStyle = `rgba(150, ${70 + Math.random() * 30 | 0}, 30, ${0.18 + Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(Math.random() * 128, Math.random() * 128,
      4 + Math.random() * 13, 3 + Math.random() * 9, Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const depotTinMat = new THREE.MeshLambertMaterial({ map: makeTinTexture() });

// 택배사 간판 — 상호와 배달문의 전화번호
function makeDepotSignTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 200;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#cfa76d';
  ctx.fillRect(0, 0, 512, 200);
  ctx.strokeStyle = 'rgba(95, 60, 25, 0.42)';
  ctx.lineWidth = 2;
  for (let y = 10; y < 200; y += 21) {        // 나뭇결
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(170, y - 6, 340, y + 7, 512, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#3b2410';
  ctx.textAlign = 'center';
  ctx.font = '600 30px "맑은 고딕", Malgun Gothic, sans-serif';
  signText(ctx, '제주택배 :', 256, 52, 480);
  ctx.font = 'bold 58px "맑은 고딕", Malgun Gothic, sans-serif';
  signText(ctx, '이장님네 분소', 256, 118, 480);
  ctx.font = '500 26px "맑은 고딕", Malgun Gothic, sans-serif';
  signText(ctx, '배달문의 : 064-XXX-XXXX', 256, 165, 480);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 「제주감귤」이라고 인쇄된 골판지 상자 겉면
function makeParcelTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c9a06a';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = 'rgba(120, 80, 40, 0.5)';   // 상자 테두리
  ctx.lineWidth = 4;
  ctx.strokeRect(3, 3, 122, 122);
  ctx.fillStyle = '#f0871c';                    // 귤 그림
  [[30, 40], [98, 44]].forEach(([x, y]) => {
    ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.fill();
  });
  ctx.fillStyle = '#5a3a18';
  ctx.textAlign = 'center';
  ctx.font = 'bold 26px "맑은 고딕", Malgun Gothic, sans-serif';
  signText(ctx, '제주감귤', 64, 88, 118);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const parcelMat = new THREE.MeshLambertMaterial({ map: makeParcelTexture() });

function buildDepot(x, z, rotY) {
  const g = new THREE.Group();
  const y = groundHeight(x, z);
  g.position.set(x, y, z);
  g.rotation.y = rotY;   // 이 그룹 안에서는 +z 쪽이 택배사 정면입니다

  const add = (mesh, px, py, pz, parent) => {
    mesh.position.set(px, py, pz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    (parent || g).add(mesh);
    return mesh;
  };

  const W = 7.2, D = 5.0, H = 4.0;   // 창고라 상점보다 훨씬 큽니다

  // 함석 벽 — 뒤·양옆은 막고, 정면은 왼쪽(창고 입구)과 오른쪽(사무실 창)만 남기고 채웁니다
  add(new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.2), depotTinMat), 0, H / 2, -D / 2);
  add(new THREE.Mesh(new THREE.BoxGeometry(0.2, H, D), depotTinMat), -W / 2, H / 2, 0);
  add(new THREE.Mesh(new THREE.BoxGeometry(0.2, H, D), depotTinMat), W / 2, H / 2, 0);
  add(new THREE.Mesh(new THREE.BoxGeometry(W, 1.5, 0.2), depotTinMat), 0, H - 0.75, D / 2);   // 정면 윗부분(간판이 붙는 면)
  add(new THREE.Mesh(new THREE.BoxGeometry(1.4, H - 1.5, 0.2), depotTinMat), 0, (H - 1.5) / 2, D / 2);       // 가운데 문 기둥
  add(new THREE.Mesh(new THREE.BoxGeometry(0.5, H - 1.5, 0.2), depotTinMat), -W / 2 + 0.25, (H - 1.5) / 2, D / 2);
  add(new THREE.Mesh(new THREE.BoxGeometry(1.6, H - 1.5, 0.2), depotTinMat), W / 2 - 0.8, (H - 1.5) / 2, D / 2);
  add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.2), depotTinMat), 1.6, H - 2.0, D / 2);               // 창문 위 벽

  // 안쪽 어둠 (뻥 뚫려 보이지 않게)
  add(new THREE.Mesh(new THREE.BoxGeometry(W - 0.5, H - 0.5, 0.1), depotDarkMat), 0, (H - 0.5) / 2, -D / 2 + 0.25);

  // 살짝 기울어진 함석 지붕
  const roof = add(new THREE.Mesh(new THREE.BoxGeometry(W + 0.9, 0.16, D + 0.9), depotTinMat), 0, H + 0.25, 0);
  roof.rotation.x = -0.06;
  add(new THREE.Mesh(new THREE.BoxGeometry(W + 0.9, 0.3, 0.16), depotTinDarkMat), 0, H + 0.36, (D + 0.9) / 2);

  // 간판
  const sign = add(
    new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.35, 0.1), new THREE.MeshLambertMaterial({ map: makeDepotSignTexture() })),
    1.2, H - 0.72, D / 2 + 0.14
  );
  sign.rotation.z = 0.015;   // 오래된 간판이라 살짝 삐뚤게

  // 가운데 출입문 차양 (양철 처마)
  const awning = add(new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.1, 1.3), depotTinMat), -0.7, 2.75, D / 2 + 0.6);
  awning.rotation.x = 0.22;
  [-2.2, 0.8].forEach((px) => {
    const brace = add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.1), depotWoodMat), px, 2.2, D / 2 + 1.1);
    brace.rotation.x = -0.4;
  });

  // 가운데 방충망 문 (안이 살짝 비치는 어두운 판)
  add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.4, 0.06), depotDarkMat), -0.7, 1.2, D / 2 + 0.02);
  [-1.5, 0.1].forEach((px) => {
    add(new THREE.Mesh(new THREE.BoxGeometry(0.09, 2.4, 0.12), depotWoodMat), px, 1.2, D / 2 + 0.06);
  });

  // 왼쪽 창고 입구 — 위로 걷어올린 나무 셔터와, 그 안에 쌓인 상자들
  add(new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.45, 0.24), depotWoodMat), -2.5, H - 1.85, D / 2 + 0.06);
  add(new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.9, 0.08), depotDarkMat), -2.5, 1.0, D / 2 - 0.02);
  for (let i = 0; i < 5; i++) {
    add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.5, 0.5), parcelMat),
      -3.3 + (i % 3) * 0.72, 0.3 + ((i / 3) | 0) * 0.54, D / 2 - 0.35);
  }

  // 오른쪽 사무실 창 + 안에 보이는 책상·서류함
  add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.4, 0.06), truckGlassMat), 1.6, 1.9, D / 2 + 0.02);
  add(new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.4, 0.1), depotWoodMat), 1.6, 1.9, D / 2 + 0.06);
  add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 0.5), depotTinDarkMat), 1.6, 0.9, D / 2 - 0.5);   // 서류함

  // 벽에 걸린 우편함
  add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.3), depotTinDarkMat), -3.9, 2.3, D / 2 + 0.15);

  // 마당에 쌓아둔 감귤 상자 더미 (팔레트 위 + 바닥에 흩어진 것)
  const stack = (bx, bz, cols, rows, layers) => {
    for (let L = 0; L < layers; L++) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const b = add(new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.56, 0.62), parcelMat),
            bx + c * 0.82, 0.3 + L * 0.58, bz + r * 0.66);
          b.rotation.y = (Math.random() - 0.5) * 0.12;   // 손으로 쌓아서 조금씩 삐뚤
        }
      }
    }
  };
  stack(-6.4, D / 2 + 1.2, 3, 2, 3);    // 왼쪽 큰 더미
  stack(-2.2, D / 2 + 2.4, 2, 1, 2);    // 문 앞 작은 더미
  // (트럭 옆에 두 개 더 흩어놨었는데, 다니는 길에 걸리적거려서 치웠습니다)

  // 바닥에 굴러다니는 귤 몇 알
  for (let i = 0; i < 6; i++) {
    add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), tangerineMat),
      -4.5 + Math.random() * 3.5, 0.16, D / 2 + 3.6 + Math.random() * 1.2);
  }

  // 마당에 세워둔 낡은 1톤 트럭 (짐칸에 상자를 실어 육지로 나갑니다)
  const truck = new THREE.Group();
  truck.position.set(5.6, 0, D / 2 + 1.6);
  truck.rotation.y = -0.25;
  const tAdd = (m, px, py, pz) => add(m, px, py, pz, truck);
  tAdd(new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.25, 1.75), truckBodyMat), 0, 1.25, 1.0);      // 운전실
  tAdd(new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.7, 0.1), truckGlassMat), 0, 1.5, 1.9);       // 앞유리
  tAdd(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.35, 3.0), truckBodyMat), 0, 0.62, -0.3);      // 차대
  tAdd(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 2.0), depotTinDarkMat), 0, 1.05, -0.9);   // 짐칸 바닥틀
  [[0, -1.9, 0.55], [-1.0, -0.9, 0.0], [1.0, -0.9, 0.0]].forEach(([px, pz, _]) => {              // 짐칸 옆판
    const panel = tAdd(new THREE.Mesh(new THREE.BoxGeometry(px === 0 ? 2.0 : 0.1, 0.6, px === 0 ? 0.1 : 2.0), truckBodyMat), px, 1.55, pz);
    panel.receiveShadow = true;
  });
  for (let i = 0; i < 3; i++) {                                                                   // 짐칸에 실린 상자
    tAdd(new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.52, 0.58), parcelMat), -0.55 + i * 0.6, 1.58, -0.9);
  }
  [[-0.95, 1.15], [0.95, 1.15], [-0.95, -1.35], [0.95, -1.35]].forEach(([px, pz]) => {
    const w = tAdd(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.28, 12), tireMat), px, 0.42, pz);
    w.rotation.z = Math.PI / 2;
  });
  g.add(truck);

  g.scale.setScalar(BUILD_SCALE);
  scene.add(g);
  obstacles.push({ x, z, r: 4.6 * BUILD_SCALE, topY: NO_JUMP });      // 건물
  obstacles.push({                                                   // 트럭도 부딪히면 못 지나갑니다
    x: x + (5.6 * Math.cos(rotY) + (D / 2 + 1.6) * Math.sin(rotY)) * BUILD_SCALE,
    z: z + (-5.6 * Math.sin(rotY) + (D / 2 + 1.6) * Math.cos(rotY)) * BUILD_SCALE,
    r: 1.9 * BUILD_SCALE, topY: NO_JUMP,
  });
  return { group: g, truck };
}
// 시작 마당의 서쪽, 상점(6,45) 바로 옆에 나란히 세웁니다.
// 상점과 14미터 떨어져 있어 F키 인식 범위(상점 4.2 + 택배사 6.5)가 서로 겹치지 않습니다.
const depot = buildDepot(-8, 46, Math.PI);   // 상점과 똑같이 남쪽(-z)을 바라보게
const DEPOT_RANGE = 6.5;   // 이 거리 안에서 F를 누르면 배송할 수 있습니다

// 나무 줄기 색 — 헌집의 팻말·세간과 귤나무(8-3) 양쪽에서 쓰므로 먼저 만들어 둡니다
const citrusTrunkMat = new THREE.MeshLambertMaterial({ color: 0x6f5540, flatShading: true });

// ---------- 8-2d. 헌집 (사서 고치는 제주 돌집) ----------
// 남쪽 돌담길을 죽 내려가면, 바다가 내려다보이는 언덕 끝에 버려진 돌집이 서 있습니다.
// 사서 세 번 고치면(벽→지붕→페인트) 내 집이 됩니다.
// 집은 직접 그리신 그림을 판에 세워 쓰고, 수리 단계마다 그림만 바꿔 끼웁니다.
//   old_house_0: 폐가 / 1: 벽 고침 / 2: 지붕 고침 / 3: 완성 (원본 그대로)
const HOUSE = { x: HOUSE_SITE.x, z: HOUSE_SITE.z };   // 평평하게 다진 집터 한가운데.
// 바다에서 물러난 자리 + 귤밭 돌담(동쪽 x≈53)과 간격. 집 뒤(남쪽)는 야자수 자리입니다.
const HOUSE_RANGE = 5.5 * BUILD_SCALE;
const HOUSE_W = 8.5, HOUSE_H = 8.5 * 520 / 1110;   // 그림 비율 그대로
let houseStage = 0;    // 루루가 처음부터 살고 있는 집입니다. 0~2 = 수리 중(허름함), 3 = 완성
let roofUpgraded = false;    // 상점의 "새 지붕"을 샀는가 — 사기 전엔 낡아 거뭇한 지붕입니다
let hasHouseDoor = false;    // 「대문」을 샀는가 — 사기 전엔 문간이 뻥 뚫려 있습니다
let hasHouseWindow = false;  // 「창문」을 샀는가 — 사기 전엔 시커먼 구멍 두 개뿐입니다
let housePaintColor = 0;     // 공구대에서 고른 외벽 페인트 색 (0 = 아직 안 칠함)
const house = (() => {
  const g = new THREE.Group();
  // 절벽 비탈 위의 집 — 발밑 네 귀퉁이 땅높이 중 "가장 높은 곳"에 바닥을 맞추고,
  // 낮은 쪽으로 생기는 틈은 현무암 기단으로 받칩니다. (가운데 높이에 맞추면
  // 내리막 쪽 벽이 공중에 둥둥 떠서, 집이 절벽에서 날아가는 것처럼 보였습니다)
  let floorY = -Infinity, lowY = Infinity;
  for (const [dx, dz] of [[-3.9, -2.8], [3.9, -2.8], [-3.9, 2.8], [3.9, 2.8], [0, 0]]) {
    const h = groundHeight(HOUSE.x + dx, HOUSE.z + dz);
    floorY = Math.max(floorY, h); lowY = Math.min(lowY, h);
  }
  floorY += 0.05;
  g.position.set(HOUSE.x, floorY, HOUSE.z);

  // ----- 제주 돌집 본채 (그림판 대신 진짜 입체) -----
  // 현무암 몸통 + 초가 맞배지붕 + 북쪽(마을 쪽)으로 문과 창 둘.
  // 수리 단계에 따라: 0 허름(어두운 벽·주저앉은 지붕·삐딱한 문) → 1 벽 고침(밝아짐)
  // → 2 지붕 고침(반듯한 새 지붕) → 3 완성(칠한 문·창틀).
  const W = 7.4, D = 5.2, WALL = 2.55;

  // 기단 — 집보다 한 뼘 넓은 받침. 비탈 아래쪽까지 내려가 땅에 닿습니다. (흙갈색)
  const fh = (floorY - lowY) + 1.4;
  const foundationMat = new THREE.MeshLambertMaterial({ color: 0x7d5f42, flatShading: true });
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(W + 0.7, fh, D + 0.7), foundationMat);
  foundation.position.y = -fh / 2 + 0.06;
  foundation.castShadow = true;
  g.add(foundation);

  // 현무암 몸통 — 허름할 때는 그을린 듯 어두운 재질을 씁니다
  const wallDarkMat = shopStoneMat.clone();
  wallDarkMat.color = new THREE.Color(0x9a9a9a);   // 곱하기 색이라 어둡게 눌립니다
  const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(W, WALL, D), shopStoneMat);
  wallMesh.position.y = WALL / 2;
  wallMesh.castShadow = true;
  g.add(wallMesh);

  // 지붕 재질 둘 — 기본은 세월에 거뭇해진 낡은 짚, 상점의 "새 지붕"을 사면 환한 새 짚빛
  const roofOldMat = new THREE.MeshLambertMaterial({ color: 0x5f5340, flatShading: true });
  const roofNewMat = new THREE.MeshLambertMaterial({ color: 0xdcbd6a, flatShading: true });
  // 반듯한 지붕 골조 (수리 2단계부터)
  const roofFine = makeGableRoof(W + 1.3, D + 0.9, 1.5, roofOldMat);
  roofFine.position.y = WALL;
  g.add(roofFine);
  // 주저앉은 옛 지붕 — 살짝 기울고, 마루가 처지고, 군데군데 뚫려 있습니다
  const roofBad = new THREE.Group();
  const rb = makeGableRoof(W + 1.3, D + 0.9, 1.15, roofOldMat);
  rb.rotation.z = 0.055;                       // 한쪽으로 살짝 주저앉음
  rb.position.y = -0.12;
  roofBad.add(rb);
  [[-2.2, 0.72, -1.1], [1.6, 0.8, 1.2], [3.0, 0.55, -0.4]].forEach(([px, py, pz]) => {
    const hole = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.3, 0.9),
      new THREE.MeshLambertMaterial({ color: 0x17130e }));
    hole.position.set(px, py, pz);
    hole.rotation.set(0.2, 0.4, 0.15);
    roofBad.add(hole);
  });
  roofBad.position.y = WALL;
  g.add(roofBad);

  // 문간 — 처음엔 문짝이 없어 시커멓게 뻥 뚫려 있습니다. 상점에서 「대문」을 사면 문짝이 달립니다.
  const doorway = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.05, 0.06),
    new THREE.MeshLambertMaterial({ color: 0x15110c }));
  doorway.position.set(0, 1.0, D / 2 + 0.03);
  g.add(doorway);
  const doorFine = new THREE.Mesh(new THREE.BoxGeometry(1.25, 2.05, 0.1), shopWoodMat);
  doorFine.position.set(0, 1.02, D / 2 + 0.06);
  g.add(doorFine);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), shopWoodDarkMat);
  knob.position.set(0.42, 1.0, D / 2 + 0.13);
  doorFine.userData.knob = knob;
  g.add(knob);
  // 문 위 처마 그늘 띠 — 문간이 벽에 묻히지 않게
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.16, 0.2), shopWoodDarkMat);
  lintel.position.set(0, 2.14, D / 2 + 0.08);
  g.add(lintel);

  // 창 두 짝 — 처음엔 창도 없이 시커먼 구멍만. 상점에서 「창문」을 사면 틀·유리·창살이 달립니다.
  const winHoles = [];
  const winGroup = new THREE.Group();
  const winFrames = [];
  [-2.35, 2.35].forEach((wx) => {
    const hole = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.95, 0.05),
      new THREE.MeshLambertMaterial({ color: 0x15110c }));
    hole.position.set(wx, 1.45, D / 2 + 0.03);
    g.add(hole);
    winHoles.push(hole);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.1, 0.12), shopWoodDarkMat);
    frame.position.set(wx, 1.45, D / 2 + 0.05);
    winGroup.add(frame);
    winFrames.push(frame);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.85, 0.1), truckGlassMat);
    glass.position.set(wx, 1.45, D / 2 + 0.08);
    winGroup.add(glass);
    // 창살 十자
    const barV = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.85, 0.12), shopWoodDarkMat);
    barV.position.set(wx, 1.45, D / 2 + 0.09);
    winGroup.add(barV);
    const barH = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.07, 0.12), shopWoodDarkMat);
    barH.position.set(wx, 1.45, D / 2 + 0.09);
    winGroup.add(barH);
  });
  g.add(winGroup);

  // 문 앞 돌계단 — 기단 위의 문과 마당 땅 사이를 잇습니다
  {
    const gy = groundHeight(HOUSE.x, HOUSE.z + 3.4) - floorY;   // 마당이 바닥보다 얼마나 낮은가 (음수)
    const steps = Math.max(1, Math.min(3, Math.round(-gy / 0.35)));
    for (let i = 0; i < steps; i++) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.22, 0.55), shopStoneMat);
      st.position.set(0, -0.11 - i * 0.24, D / 2 + 0.45 + i * 0.5);
      st.castShadow = true;
      g.add(st);
    }
  }

  // 앞마당의 버려진 세간 — 폐가 시절에만 보이고, 다 고치면 치워집니다
  const junk = new THREE.Group();
  [[-2.6, 1.6, 0.5], [2.2, 2.0, 0.4], [0.6, 2.6, 0.3]].forEach(([px, pz, s]) => {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), darkStoneMat);
    rock.position.set(px, s * 0.5, pz);
    rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    rock.castShadow = true;
    junk.add(rock);
  });
  const plank = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.5), citrusTrunkMat);
  plank.position.set(-1.2, 0.1, 2.4);
  plank.rotation.y = 0.6;
  junk.add(plank);
  g.add(junk);

  // 「팝니다」 팻말 — 사고 나면 사라집니다
  const saleC = document.createElement('canvas');
  saleC.width = 192; saleC.height = 96;
  {
    const c2 = saleC.getContext('2d');
    c2.fillStyle = '#c9a06a'; c2.fillRect(0, 0, 192, 96);
    c2.fillStyle = '#3b2410'; c2.textAlign = 'center';
    c2.font = 'bold 40px "맑은 고딕", Malgun Gothic, sans-serif';
    signText(c2, '팝니다', 96, 46, 180);
    c2.font = '500 28px "맑은 고딕", Malgun Gothic, sans-serif';
    signText(c2, '50,000원', 96, 82, 180);
  }
  const saleTex = new THREE.CanvasTexture(saleC);
  saleTex.colorSpace = THREE.SRGBColorSpace;
  const sale = new THREE.Group();
  const salePost = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.22, 6), citrusTrunkMat);
  salePost.position.set(-3.6, 0.61, 3.2);   // 판 아래까지만
  sale.add(salePost);
  const saleBoard = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.75, 0.08),
    new THREE.MeshLambertMaterial({ map: saleTex }));
  saleBoard.position.set(-3.6, 1.6, 3.2);
  saleBoard.rotation.y = -0.2;
  sale.add(saleBoard);
  g.add(sale);

  g.scale.setScalar(BUILD_SCALE);
  scene.add(g);
  obstacles.push({ x: HOUSE.x, z: HOUSE.z, r: 3.4 * BUILD_SCALE, topY: NO_JUMP });
  // 지붕 널빤지들(구멍 제외)을 모아둡니다 — "새 지붕"을 사면 이것들만 환한 재질로 바뀝니다
  const roofMeshes = [...roofFine.children, ...rb.children].filter((o) => o.isMesh);
  // 외벽 페인트용 재질 — 칠을 마치면 골라 둔 색이 여기 입혀집니다
  const paintMat = new THREE.MeshLambertMaterial({ color: 0xe8e2d4, flatShading: true });
  return { group: g, wallMesh, wallDarkMat, paintMat, roofFine, roofBad, roofMeshes, roofOldMat, roofNewMat,
           doorway, doorFine, winGroup, winHoles, winFrames, junk, sale };
})();
// (예전의 "그림판 + 뒤채 몸통" 조합은 뺐습니다 — 옆·뒤에서 보면 그림 위로 뒤채 지붕이
//  뚫고 나와 보였고, 비탈에서 뒤채가 공중에 떠 보였습니다. 이제 위의 진짜 돌집 하나입니다)

function applyHouseLook() {
  const s = houseStage;
  // 외벽 — 페인트칠(s>=3)을 마치면 골라 둔 색으로, 그 전엔 그을린 현무암
  if (s >= 3 && housePaintColor) {
    house.paintMat.color.setHex(housePaintColor);
    house.wallMesh.material = house.paintMat;
  } else {
    house.wallMesh.material = house.wallDarkMat;
  }
  // 지붕 — 상점의 "새 지붕"을 사면 주저앉은 골조가 반듯해지고 환한 새 짚빛이 됩니다
  house.roofFine.visible = roofUpgraded;
  house.roofBad.visible = !roofUpgraded;
  const rm = roofUpgraded ? house.roofNewMat : house.roofOldMat;
  for (const m of house.roofMeshes) m.material = rm;
  // 대문·창문은 상점에서 사야 달립니다 — 사기 전엔 시커먼 구멍
  house.doorFine.visible = hasHouseDoor;
  house.doorFine.userData.knob.visible = hasHouseDoor;
  house.winGroup.visible = hasHouseWindow;
  for (const h of house.winHoles) h.visible = !hasHouseWindow;
  for (const f of house.winFrames) f.material = s >= 3 ? shopWoodMat : shopWoodDarkMat;   // 칠 끝나면 창틀도 밝게
  house.junk.visible = s < 3;             // 칠까지 끝나면 마당의 잡동사니가 치워집니다
  house.sale.visible = s < 0;             // 처음부터 루루의 집이라 팻말은 안 보입니다
}
applyHouseLook();

// ---------- 8-2e. 마구간과 조랑말 ----------
// 서쪽 벌판에 초가 마구간이 있고, 안에 제주 조랑말이 서 있습니다 (직접 그리신 그림).
// 이장님 상점에서 당근(1,000원)을 사다 먹이면 애정이 쌓입니다 — 나중에 경마의 밑천이 됩니다.
// 맞배 초가지붕 한 채 — 길이 방향이 X축. 마구간과 헌집 몸통 양쪽에서 돌려 씁니다.
function makeGableRoof(len, span, peak, mat) {
  const g = new THREE.Group();
  const s = span / 2;
  const slope = Math.hypot(s, peak) + 0.25;
  const tilt = Math.atan2(peak, s);
  [1, -1].forEach((side) => {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(len, 0.22, slope), mat);
    panel.position.set(0, peak / 2, side * s / 2);
    panel.rotation.x = side * tilt;
    panel.castShadow = true;
    g.add(panel);
  });
  const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, len, 6), mat);
  ridge.rotation.z = Math.PI / 2;
  ridge.position.y = peak;
  g.add(ridge);
  return g;
}

const STABLE = { x: -79, z: 8 };   // 서쪽 벌판 (바다에 걸치지 않게 물가에서 한 발 물림)
const STABLE_RANGE = 6.0;
const FEED_RANGE = 3.0;   // 당근은 조랑말 앞까지 가까이 가야 먹일 수 있습니다
const PONY_PRICE = 100000;   // 처음 조랑말은 공짜지만, 죽으면 새로 데려오는 데 이만큼 듭니다
// 말을 잃으면 이장님이 만물상 앞에 새 말을 매어 둡니다 — 마구간이 아니라 여기서 삽니다.
// 가게 건물(지붕 처마까지 x 10.1 · z 41.1까지)을 비켜 앞마당 동쪽에 세웁니다.
// 문 앞(6, 42.2)과 이장님 자리(6, 41.6)에서도 떨어져 있어 드나드는 길을 막지 않습니다.
const PONY_SALE = { x: 10.5, z: 39.5 };
const PONY_SALE_RANGE = 3.0;
const STABLE_W = 9.0, STABLE_H = 9.0 * 684 / 1019;   // 그림 비율 그대로
// 예전에는 그림 한 장을 세워 뒀는데, 옆에서 보면 종이처럼 얇았습니다.
// 이제 돌벽·나무 기둥·초가지붕의 진짜 헛간을 짓고, 그 안에 조랑말도 통통하게 빚어 세웁니다.
const stable = (() => {
  const g = new THREE.Group();
  const y = groundHeight(STABLE.x, STABLE.z);
  g.position.set(STABLE.x, y, STABLE.z);

  // ----- 초가 헛간 (동쪽으로 열린 마구간) -----
  const dirt = new THREE.Mesh(new THREE.CircleGeometry(3.6, 18),
    new THREE.MeshLambertMaterial({ color: 0x8a6f4d }));
  dirt.rotation.x = -Math.PI / 2;
  dirt.position.y = 0.02;
  g.add(dirt);
  // 뒷벽(서쪽) — 현무암
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.7, 6.6), shopStoneMat);
  back.position.set(-2.2, 1.35, 0);
  back.castShadow = true;
  g.add(back);
  // 옆의 낮은 돌담 두 장
  [-3.3, 3.3].forEach((z) => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.9, 0.45), shopStoneMat);
    w.position.set(-0.2, 0.95, z);
    w.castShadow = true;
    g.add(w);
  });
  // 앞 기둥 두 개 (나무)
  [-3.1, 3.1].forEach((z) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 2.9, 7), shopWoodDarkMat);
    p.position.set(2.0, 1.45, z);
    p.castShadow = true;
    g.add(p);
  });
  // 초가 지붕 — 용마루가 남북(z)으로 걸린 맞배지붕
  const roof = makeGableRoof(7.8, 6.0, 1.6, shopThatchMat);
  roof.rotation.y = Math.PI / 2;
  roof.position.set(-0.1, 2.7, 0);
  g.add(roof);
  // 구석의 건초 더미
  const hay = new THREE.Mesh(new THREE.SphereGeometry(0.55, 9, 7),
    new THREE.MeshLambertMaterial({ color: 0xd8b45e, flatShading: true }));
  hay.scale.y = 0.6;
  hay.position.set(-1.4, 0.33, -2.2);
  hay.castShadow = true;
  g.add(hay);

  // ----- 제주 조랑말 — 통통한 몸에 짙은 갈기, 동쪽(섬 안쪽)을 바라봅니다 -----
  const pony = new THREE.Group();
  const coatMat = new THREE.MeshLambertMaterial({ color: 0xa5713f, flatShading: true });
  const maneMat = new THREE.MeshLambertMaterial({ color: 0x46331f, flatShading: true });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.52, 1.05, 5, 10), coatMat);
  body.rotation.z = Math.PI / 2;
  body.position.set(0, 1.15, 0);
  body.castShadow = true;
  pony.add(body);
  const neckM = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.55, 4, 8), coatMat);
  neckM.position.set(0.78, 1.62, 0);
  neckM.rotation.z = -0.7;
  pony.add(neckM);
  const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.42, 4, 8), coatMat);
  head.position.set(1.13, 1.86, 0);
  head.rotation.z = Math.PI / 2 - 0.25;   // 코가 앞으로 살짝 숙인 자세
  head.castShadow = true;
  pony.add(head);
  [-0.11, 0.11].forEach((dz) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 5), maneMat);
    ear.position.set(0.98, 2.08, dz);
    pony.add(ear);
  });
  const mane = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.12), maneMat);
  mane.position.set(0.68, 1.82, 0);
  mane.rotation.z = -0.7;
  pony.add(mane);
  [[0.55, -0.26], [0.55, 0.26], [-0.55, -0.26], [-0.55, 0.26]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.85, 6), coatMat);
    leg.position.set(lx, 0.42, lz);
    leg.castShadow = true;
    pony.add(leg);
    const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.1, 6), maneMat);
    hoof.position.set(lx, 0.05, lz);
    pony.add(hoof);
  });
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.75, 6), maneMat);
  tail.position.set(-0.95, 1.0, 0);
  tail.rotation.z = 0.5;
  pony.add(tail);
  pony.position.set(0.1, 0, 0);
  g.add(pony);

  g.scale.setScalar(BUILD_SCALE);
  scene.add(g);
  obstacles.push({ x: STABLE.x, z: STABLE.z, r: 2.0 * BUILD_SCALE, topY: NO_JUMP });   // 조랑말 앞까지 바짝 갈 수 있게 좁힘
  obstacles.push({ x: STABLE.x - 0.2 * BUILD_SCALE, z: STABLE.z - 3.3 * BUILD_SCALE, r: 1.4 * BUILD_SCALE, topY: NO_JUMP });   // 옆 돌담
  obstacles.push({ x: STABLE.x - 0.2 * BUILD_SCALE, z: STABLE.z + 3.3 * BUILD_SCALE, r: 1.4 * BUILD_SCALE, topY: NO_JUMP });
  return { group: g, pony };
})();

// 공구 — 헌집을 고치는 데 필요한 망치·톱·페인트. 이장님 상점 앞 공구대에서 팝니다.
// 공구대 → 페인트 판매대. 망치·톱은 뺐습니다 (벽·지붕은 이제 상점에서 사서 해결).
// 페인트는 색을 골라 사고, 집 앞에서 직접 칠합니다 — 외벽이 고른 색으로 바뀝니다.
const tools = { paint: false };
const PAINT_PRICE = 3000000;      // 외벽 페인트 — 집공사 5,999만의 한 조각입니다
const FLOOR_PRICE = 2400000;      // 바닥재 (색 고르기)
const WALL_PRICE  = 3600000;      // 벽지 (색 고르기)
const PAINT_COLORS = [
  { name: '회벽 하양', color: 0xe8e2d4 },
  { name: '귤빛 노랑', color: 0xe0c368 },
  { name: '노을 주황', color: 0xd98d5a },
  { name: '바다 하늘', color: 0x9fc0d8 },
  { name: '들판 연두', color: 0xa8c078 },
  { name: '동백 분홍', color: 0xd8a8b0 },
  { name: '한라 초록', color: 0x6a9a6a },
  { name: '자주 포도', color: 0x9a6a9a },
  { name: '깊은 바다', color: 0x4a6a8a },
  { name: '벽돌 빨강', color: 0xb05a4a },
  { name: '까망 먹빛', color: 0x4a4a48 },
  { name: '보리 베이지', color: 0xcab894 },
];
// (예전에는 상점 앞 공구대에서 페인트를 팔았지만, 이제 상점 안 인테리어 코너에서 팝니다)

let carrots = 0;      // 들고 있는 당근
let ponyLove = 0;     // 조랑말과 쌓은 애정 (당근 하나에 1씩)
const CARROT_PRICE = 1000;

// ----- 농사 -----
// 이장님 땅을 한 필지씩 년세 내고 빌려 씨앗을 심습니다. 수확할 때마다 절반이 소작료로 나가고,
// 목돈을 모아 아예 사버리면 그때부터 전부 루루 몫입니다.
// 씨앗은 상점 진열대에서 벽지 고르듯 종류를 골라 삽니다.
// 씨앗은 한 봉지가 1킬로그램이고, 밭 한 칸에 딱 맞습니다.
// 씨앗값은 싸지만 거두기까지가 깁니다. 오래 기다리는 작물일수록 크게 법니다.
// 차나무만 다릅니다. 벌이는 가장 적어도 한 번 심으면 날마다 계속 땁니다.
// 자라는 날수는 2026-08-09에 확 줄였습니다 (7·10·20·3 → 3·5·7·1).
// 하루가 10분이라 스무 날을 기다리면 세 시간쯤입니다 — 심어놓고 잊어버릴 지경이었습니다.
const SEEDS = {
  buckwheat: { name: '메밀',   emoji: '🌾', price: 30000,  days: 3,  yield: 3000000,
               tip: '가을이면 밭이 하얗게 됩니다' },
  potato:    { name: '감자',   emoji: '🥔', price: 50000,  days: 5,  yield: 5000000,
               tip: '한 포기에 여러 알이 달립니다' },
  radish:    { name: '월동무', emoji: '🥬', price: 100000, days: 7,  yield: 10000000,
               tip: '제주 겨울 무. 오래 기다리는 만큼 크게 법니다' },
  tea:       { name: '차나무', emoji: '🍃', price: 100000, days: 1,  yield: 500000,
               tip: '한 번 심으면 베지 않고 날마다 계속 땁니다', perennial: true },
};
const SEED_ORDER = ['buckwheat', 'potato', 'radish', 'tea'];
let seeds = {};                       // 가지고 있는 씨앗 봉지
const FARM_RENT = 500000;             // 한 필지 1년 년세. 몇 필지를 빌리든 한 필지에 이 값입니다
const FARM_BUY_PRICE = 10000000;      // 한 필지를 아예 사는 값
const TENANT_SHARE = 0.5;             // 이장님이 가져가는 몫
// 년세는 어느 필지든 똑같습니다 (예전엔 필지를 늘릴수록 올랐는데 사용자 지정으로 통일했습니다).
// 년세는 이장님께 내고 사라지는 돈이라 재산(assetTotal)에는 들어가지 않습니다 — 아예 사버린 땅만 재산입니다.
function rentPrice() { return FARM_RENT; }
// 말 그대로 1년치입니다. 하루가 10분이니 365일이면 예순 시간쯤 — 그때 이장님이 또 받으러 옵니다.
const RENT_YEAR = 365;
function rentDaysLeft(f) {
  if (!f.rented || f.owned) return 0;
  return Math.max(0, f.rentedDay + RENT_YEAR - dayCount);
}
function rentExpired(f) { return f.rented && !f.owned && rentDaysLeft(f) <= 0; }
function rentedCount() { return FARMS.filter((f) => f.rented || f.owned).length; }

// 가게 앞에 있던 당근 바구니는 치웠습니다 (상점 안에서 삽니다).
// 둘 다 상점 안 진열대에서 사면 되니, 문 앞이 물건으로 어수선할 이유가 없습니다.

// ---------- 8-2h. 실내 방들 (집 내부 · 상점 내부) ----------
// 문 앞에 서면 화면이 어두워지며 안으로 들어갑니다. 방은 섬에서 멀리 떨어진
// 좌표에 지어두고 루루를 순간이동시키는 방식이라, 밖의 섬과 서로 보이지 않습니다.
// (groundHeight가 이 좌표 범위에서는 방바닥 높이 20을 돌려줍니다)
// 벽은 안쪽 면만 그려서, 카메라가 벽 밖에 있어도 인형의 집처럼 안이 들여다보입니다.
const ROOM = { cx: 400, cz: 400, y: 20, w: 12, d: 9 };        // 루루의 집 내부
const SHOP_ROOM = { cx: 450, cz: 400, y: 20, w: 13, d: 9 };   // 이장님 상점 내부

function buildRoom(R, floorColor, wallColor) {
  const g = new THREE.Group();
  const y0 = R.y;
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(R.w, R.d),
    new THREE.MeshLambertMaterial({ color: floorColor })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(R.cx, y0 + 0.01, R.cz);
  floor.receiveShadow = true;
  g.add(floor);
  const wallMat = new THREE.MeshLambertMaterial({ color: wallColor });
  const WALL_H = 3.2;
  const mkWall = (wdt, x, z, ry) => {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(wdt, WALL_H), wallMat);
    w.position.set(x, y0 + WALL_H / 2, z);
    w.rotation.y = ry;
    g.add(w);
  };
  mkWall(R.w, R.cx, R.cz - R.d / 2, 0);            // 북쪽 벽 (안쪽 = +z)
  mkWall(R.w, R.cx, R.cz + R.d / 2, Math.PI);      // 남쪽 벽 (문이 있는 쪽)
  mkWall(R.d, R.cx - R.w / 2, R.cz, Math.PI / 2);  // 서쪽 벽
  mkWall(R.d, R.cx + R.w / 2, R.cz, -Math.PI / 2); // 동쪽 벽
  const ceil = new THREE.Mesh(
    new THREE.PlaneGeometry(R.w, R.d),
    new THREE.MeshLambertMaterial({ color: 0x4a4038 })
  );
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(R.cx, y0 + WALL_H, R.cz);
  g.add(ceil);
  // 남쪽 벽의 문 — 밖으로 나가는 자리 표시
  const doorMark = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 2.5),
    new THREE.MeshLambertMaterial({ color: 0x2b1d12 })
  );
  doorMark.position.set(R.cx, y0 + 1.25, R.cz + R.d / 2 - 0.03);
  doorMark.rotation.y = Math.PI;
  g.add(doorMark);
  // 문틀 — 어두운 문이 벽에 묻히지 않게 밝은 테두리를 두릅니다
  const frame = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 2.9),
    new THREE.MeshLambertMaterial({ color: 0xc9a86a })
  );
  frame.position.set(R.cx, y0 + 1.4, R.cz + R.d / 2 - 0.02);
  frame.rotation.y = Math.PI;
  g.add(frame);
  // 문 위의 안내 팻말 — 여기로 걸어가면 밖으로 나갑니다
  const signC = document.createElement('canvas');
  signC.width = 256; signC.height = 64;
  const sg = signC.getContext('2d');
  sg.fillStyle = '#5e3f24'; sg.fillRect(0, 0, 256, 64);
  sg.strokeStyle = '#c9a86a'; sg.lineWidth = 5; sg.strokeRect(2, 2, 252, 60);
  sg.fillStyle = '#f6edd8'; sg.textAlign = 'center';
  sg.font = 'bold 32px "맑은 고딕", Malgun Gothic, sans-serif';
  signText(sg, '나가는 곳', 128, 43, 240);
  const signTex = new THREE.CanvasTexture(signC);
  signTex.colorSpace = THREE.SRGBColorSpace;
  const doorSign = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.42),
    new THREE.MeshBasicMaterial({ map: signTex }));
  doorSign.position.set(R.cx, y0 + 3.0, R.cz + R.d / 2 - 0.04);
  doorSign.rotation.y = Math.PI;
  g.add(doorSign);
  // 방을 밝히는 따뜻한 등불
  const lamp = new THREE.PointLight(0xffe0b0, 1.2, 22);
  lamp.position.set(R.cx, y0 + 2.6, R.cz);
  g.add(lamp);
  scene.add(g);
  // 바닥·벽 재질을 돌려줘서, 나중에 바닥재·벽지를 사서 갈 수 있게 합니다
  return { group: g, floorMat: floor.material, wallMat };
}
const houseRoomLook = buildRoom(ROOM, 0x7a6a52, 0x8d8b85);   // 집 안 — 다져진 흙바닥에 돌벽 (폐가답게)
buildRoom(SHOP_ROOM, 0x9a7748, 0xd3b97e);                    // 상점 안 — 나무 바닥에 초가빛 벽

// ---------- 8-2h-2. 가구 (상점에서 사서 집을 꾸밉니다) ----------
// 처음엔 집이 텅 비어서 맨땅에서 잡니다. 상점 안에서 가구를 사면 집 안에 놓입니다.
const FURN_ORDER = ['bed', 'chair', 'closet', 'rug', 'lamp', 'cot', 'shelf', 'painting', 'window', 'tv', 'tvstand', 'kitchen',
                    'island', 'sofa', 'sink', 'coffeetable', 'washer', 'fridge', 'roof', 'door',
                    'palm', 'lawn', 'stones', 'gardenlight', 'cycad'];
// 마당 조경 아이템 — 방 안이 아니라 집 앞마당(실제 지형 위)에 심습니다
const YARD_KEYS = new Set(['palm', 'lawn', 'stones', 'gardenlight', 'cycad']);
// 집 자체에 다는 것들 — 방에 놓는 물건이 아니라 집의 겉모습을 바꿉니다 (처음엔 지붕은 낡고, 문·창문은 아예 없음)
const HOUSE_PART_KEYS = new Set(['roof', 'door', 'window']);
// 루루의 꿈은 이제 "집 꾸미기"가 아니라 **재산 1억 만들기**입니다 (2026-08-09 개편).
// 서울의 20억 아파트 대신 제주에서 모으는 1억. 그 1억은 셋으로 나뉩니다:
//   집공사 5,999만 + 밭 4칸 매입 4,000만(한 칸 1,000만 · FARM_BUY_PRICE) + 살림(망사리·감귤상자·컨테이너).
//   딱 1억에 맞출 필요는 없습니다 — 넘기기만 하면 꿈이 이루어집니다.
// 집공사 5,999만의 속내용:
//   실내 17종 2,879만 + 창문·지붕·대문 780만 + 마당 조경 5종 1,440만
//   + 외벽 페인트 300만 + 바닥 240만 + 벽지 360만.
// 값은 전부 만원 단위로 떨어지는데 러그만 39만원입니다 —
// 예전에 딱 1억을 맞추려고 21만원을 이 한 줄에 몰아넣은 흔적입니다.
// (예전에는 집공사만으로 1억이었는데, 밭을 사서 땅을 늘리는 것도 재산인데
//  꿈에 하나도 안 보태지는 게 이상해서 다시 나눴습니다)
const FURNITURE = {
  bed:      { name: '침대',        price: 2400000 },
  chair:    { name: '의자',        price: 900000 },
  closet:   { name: '옷장',        price: 2100000 },
  rug:      { name: '러그',        price: 390000 },
  lamp:     { name: '스탠드 조명', price: 1200000 },
  cot:      { name: '간이침대',    price: 500000 },   // 라꾸라꾸 접이식 — 텅 빈 집에 제일 먼저 들이는 물건
  shelf:    { name: '책장',        price: 1500000 },
  painting: { name: '벽걸이 그림', price: 900000 },
  window:   { name: '창문',        price: 2400000 },
  tv:       { name: '텔레비전',    price: 3000000 },   // 티비다이가 먼저 있어야 놓을 수 있습니다
  tvstand:  { name: '티비다이',    price: 900000 },
  kitchen:  { name: '부엌 찬장',   price: 3000000 },
  island:   { name: '아일랜드 식탁', price: 1500000 },
  sofa:     { name: '소파',        price: 2700000 },
  sink:     { name: '싱크대',      price: 1800000 },
  coffeetable: { name: '소파 테이블', price: 1200000 },
  washer:   { name: '세탁기',      price: 2100000 },
  fridge:   { name: '냉장고',      price: 2700000 },
  roof:     { name: '새 지붕',     price: 3000000 },   // 낡아 거뭇한 지붕이 환한 새 짚빛으로
  door:     { name: '대문',        price: 2400000 },   // 처음엔 문짝 없이 뻥 뚫려 있습니다
  palm:        { name: '야자수',    price: 4200000 },
  lawn:        { name: '잔디밭',    price: 3000000 },
  stones:      { name: '조경석',    price: 2400000 },
  gardenlight: { name: '마당 조명', price: 3000000 },
  cycad:       { name: '소철나무',  price: 1800000 },   // 잔디 마당에 심는 둥근 소철
};
function emptyFurnOwned() {
  const o = {};
  for (const k of FURN_ORDER) o[k] = false;
  return o;
}
let furnitureOwned = emptyFurnOwned();

// 가구 만들기 — 집 배치용과 상점 진열용 양쪽에서 씁니다
const furnWoodMat = new THREE.MeshLambertMaterial({ color: 0x8a6038, flatShading: true });
const furnDarkMat = new THREE.MeshLambertMaterial({ color: 0x5e3f24, flatShading: true });
const furnClothMat = new THREE.MeshLambertMaterial({ color: 0xf6ebd8, flatShading: true });
const furnBlanketMat = new THREE.MeshLambertMaterial({ color: 0xe09a52, flatShading: true });
function makeBedMesh() {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 1.4), furnWoodMat);
  frame.position.y = 0.18;
  g.add(frame);
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.2, 1.25), furnClothMat);
  mattress.position.y = 0.45;
  g.add(mattress);
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 1.28), furnBlanketMat);
  blanket.position.set(-0.4, 0.58, 0);
  g.add(blanket);
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.8), furnClothMat);
  pillow.position.set(0.8, 0.6, 0);
  g.add(pillow);
  return g;
}
function makeChairMesh() {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.55), furnWoodMat);
  seat.position.y = 0.45;
  g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, 0.08), furnWoodMat);
  back.position.set(0, 0.78, 0.24);
  g.add(back);
  [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.45, 0.07), furnDarkMat);
    leg.position.set(lx, 0.22, lz);
    g.add(leg);
  });
  return g;
}
function makeTableMesh() {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 1.1), furnWoodMat);
  top.position.y = 0.78;
  g.add(top);
  [[-0.8, -0.42], [0.8, -0.42], [-0.8, 0.42], [0.8, 0.42]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.78, 0.1), furnDarkMat);
    leg.position.set(lx, 0.39, lz);
    g.add(leg);
  });
  return g;
}
function makeClosetMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.5, 0.7), furnWoodMat);
  body.position.y = 1.25;
  g.add(body);
  const split = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.3, 0.04), furnDarkMat);
  split.position.set(0, 1.25, 0.36);
  g.add(split);
  [-0.28, 0.28].forEach((hx) => {
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), furnDarkMat);
    knob.position.set(hx, 1.25, 0.38);
    g.add(knob);
  });
  return g;
}
function makeRugMesh() {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.04, 20),
    new THREE.MeshLambertMaterial({ color: 0xc96a4a }));
  outer.position.y = 0.02;
  g.add(outer);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.05, 20),
    new THREE.MeshLambertMaterial({ color: 0xe8b88a }));
  inner.position.y = 0.025;
  g.add(inner);
  return g;
}
function makeLampMesh() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.08, 10), furnDarkMat);
  base.position.y = 0.04;
  g.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6), furnDarkMat);
  pole.position.y = 0.8;
  g.add(pole);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.45, 10, 1, true),
    new THREE.MeshLambertMaterial({ color: 0xf2d8a0, side: THREE.DoubleSide }));
  shade.position.y = 1.65;
  g.add(shade);
  const glow = new THREE.PointLight(0xffe0b0, 0.7, 7);
  glow.position.y = 1.5;
  g.add(glow);
  return g;
}
// 간이침대 — 이른바 라꾸라꾸. 접이식 알루미늄 뼈대에 천을 팽팽하게 걸친 물건입니다.
// 진짜 침대와 달리 낮고 좁고 다리가 X자로 벌어져 있어, 한눈에도 "임시로 눕는 자리"로 보입니다.
// 텅 빈 집에 제일 먼저 들이는 물건이라, 이게 들어오는 날부터 루루가 맨바닥을 면합니다.
function makeCotMesh() {
  const g = new THREE.Group();
  const frameMat = new THREE.MeshLambertMaterial({ color: 0xb8bcc2, flatShading: true });   // 알루미늄 파이프
  const clothMat = new THREE.MeshLambertMaterial({ color: 0x3f6f8c, flatShading: true });   // 남색 천
  const L = 1.85, W = 0.66, H = 0.34;      // 길이·폭·높이 (진짜 침대보다 훨씬 낮고 좁습니다)
  // 누울 면 — 천을 팽팽하게 걸친 판
  const bed = new THREE.Mesh(new THREE.BoxGeometry(L, 0.06, W), clothMat);
  bed.position.y = H;
  g.add(bed);
  // 가장자리를 두르는 파이프 뼈대
  [[0, H + 0.04, W / 2], [0, H + 0.04, -W / 2]].forEach(([x, y, z]) => {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, L, 6), frameMat);
    rail.rotation.z = Math.PI / 2;
    rail.position.set(x, y, z);
    g.add(rail);
  });
  [[L / 2, H + 0.04, 0], [-L / 2, H + 0.04, 0]].forEach(([x, y, z]) => {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, W, 6), frameMat);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(x, y, z);
    g.add(bar);
  });
  // X자로 벌어진 접이식 다리 — 라꾸라꾸를 라꾸라꾸로 보이게 하는 대목입니다
  [-L / 2 + 0.34, L / 2 - 0.34].forEach((px) => {
    [1, -1].forEach((tilt) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, H * 1.28, 6), frameMat);
      leg.position.set(px, H / 2, 0);
      leg.rotation.x = tilt * 0.42;
      g.add(leg);
      // 다리 밑을 잇는 발판
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, W + 0.1, 6), frameMat);
      foot.rotation.x = Math.PI / 2;
      foot.position.set(px + tilt * 0.14, 0.03, 0);
      g.add(foot);
    });
  });
  // 머리맡에 접어둔 얇은 담요 한 장
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.09, W - 0.08), furnBlanketMat);
  blanket.position.set(-L / 2 + 0.3, H + 0.08, 0);
  g.add(blanket);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
function makeShelfMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 0.45), furnWoodMat);
  body.position.y = 1.0;
  g.add(body);
  const bookCols = [0xc0574f, 0x4f7ac0, 0x5a9a55, 0xd9a441, 0x8a5fa0];
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 5; i++) {
      const book = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.4, 0.3),
        new THREE.MeshLambertMaterial({ color: bookCols[(row * 2 + i) % 5] }));
      book.position.set(-0.55 + i * 0.27, 0.5 + row * 0.6, 0.1);
      g.add(book);
    }
  }
  return g;
}
function makePaintingMesh() {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.1, 0.08), furnDarkMat);
  frame.position.y = 2.0;
  g.add(frame);
  const canvasMat = CAN_USE_IMAGES
    ? new THREE.MeshLambertMaterial({ map: loadTexture('../assets/farmcat/scene_farm.webp') })
    : new THREE.MeshLambertMaterial({ color: 0xf6ebd8 });
  const art = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 0.94), canvasMat);
  art.position.set(0, 2.0, 0.05);
  g.add(art);
  return g;
}
function makeWindowMesh() {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.3, 0.1), furnWoodMat);
  frame.position.y = 1.9;
  g.add(frame);
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.1),
    new THREE.MeshBasicMaterial({ color: 0xa9d3ea }));
  pane.position.set(0, 1.9, 0.06);
  g.add(pane);
  const barV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.15, 0.04), furnWoodMat);
  barV.position.set(0, 1.9, 0.08);
  g.add(barV);
  const barH = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.06, 0.04), furnWoodMat);
  barH.position.set(0, 1.9, 0.08);
  g.add(barH);
  return g;
}
function makeTvMesh() {
  const g = new THREE.Group();
  const stand = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 0.5), furnDarkMat);
  stand.position.y = 0.25;
  g.add(stand);
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 0.12),
    new THREE.MeshLambertMaterial({ color: 0x22242a, flatShading: true }));
  body.position.y = 1.05;
  g.add(body);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.34, 0.76),
    new THREE.MeshBasicMaterial({ color: 0x3a5a7a }));
  screen.position.set(0, 1.05, 0.07);
  g.add(screen);
  return g;
}
function makeKitchenMesh() {
  const g = new THREE.Group();
  const lower = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 0.7), furnWoodMat);
  lower.position.y = 0.45;
  g.add(lower);
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 0.78),
    new THREE.MeshLambertMaterial({ color: 0x8d8b85 }));
  top.position.y = 0.94;
  g.add(top);
  const sink = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.06, 12),
    new THREE.MeshLambertMaterial({ color: 0xc9ccd0 }));
  sink.position.set(-0.5, 0.99, 0);
  g.add(sink);
  const upper = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 0.4), furnWoodMat);
  upper.position.set(0, 2.0, -0.15);
  g.add(upper);
  [-0.5, 0.5].forEach((x) => {
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), furnDarkMat);
    knob.position.set(x, 0.55, 0.36);
    g.add(knob);
  });
  return g;
}
// ----- 아일랜드 식탁 (부엌 앞에 놓는 조리대 겸 식탁) -----
function makeIslandMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.72, 0.7), furnWoodMat);
  body.position.y = 0.36;
  g.add(body);
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.07, 0.9),
    new THREE.MeshLambertMaterial({ color: 0xd8cdb8, flatShading: true }));
  top.position.y = 0.76;
  g.add(top);
  [-0.45, 0.45].forEach((x) => {                          // 앞에 걸린 등받이 없는 의자 둘
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.42, 8), furnDarkMat);
    stool.position.set(x, 0.21, 0.62);
    g.add(stool);
  });
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0xc9762e, flatShading: true }));
  bowl.position.set(0.3, 0.85, 0);
  bowl.scale.y = 0.55;
  g.add(bowl);
  return g;
}
// ----- 마당 조경 — 야자수·잔디밭·조경석·마당 조명 (집 밖 지형 위에 놓입니다) -----
function makePalmMesh() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 2.8, 7), furnWoodMat);
  trunk.position.set(0.08, 1.4, 0);
  trunk.rotation.z = -0.1;
  trunk.castShadow = true;
  g.add(trunk);
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x3f8a4a, flatShading: true });
  for (let i = 0; i < 6; i++) {
    const arm = new THREE.Group();
    arm.rotation.y = (i / 6) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.8, 4), leafMat);
    leaf.position.x = 0.8;
    leaf.rotation.z = Math.PI / 2 + 0.55;   // 바깥으로 뻗으며 살짝 처진 잎
    leaf.scale.z = 0.35;
    leaf.castShadow = true;
    arm.add(leaf);
    arm.position.y = 2.85;
    g.add(arm);
  }
  const nutMat = new THREE.MeshLambertMaterial({ color: 0x6b4a26, flatShading: true });
  [[0.2, 0.1], [-0.12, 0.18], [0, -0.2]].forEach(([x, z]) => {
    const nut = new THREE.Mesh(new THREE.SphereGeometry(0.12, 7, 6), nutMat);
    nut.position.set(x, 2.7, z);
    g.add(nut);
  });
  return g;
}
function makeLawnMesh() {
  const g = new THREE.Group();
  const pad = new THREE.Mesh(new THREE.CircleGeometry(2.1, 20),
    new THREE.MeshLambertMaterial({ color: 0x69b04a }));
  pad.rotation.x = -Math.PI / 2;
  pad.position.y = 0.05;
  g.add(pad);
  const flowerMat = new THREE.MeshLambertMaterial({ color: 0xfff3d6 });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), flowerMat);
    f.position.set(Math.cos(a) * (0.6 + (i % 3) * 0.4), 0.1, Math.sin(a) * (0.6 + (i % 3) * 0.4));
    g.add(f);
  }
  return g;
}
function makeStonesMesh() {
  const g = new THREE.Group();
  const stoneMat2 = new THREE.MeshLambertMaterial({ color: 0xb9b4a8, flatShading: true });
  [[0, 0, 0.55, 0.4], [0.75, 0.25, 0.36, 1.9], [-0.62, 0.3, 0.42, 3.1]].forEach(([px, pz, s, r]) => {
    const st = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), stoneMat2);
    st.position.set(px, s * 0.55, pz);
    st.rotation.set(r, r * 1.3, r * 0.7);
    st.castShadow = true;
    g.add(st);
  });
  return g;
}
function makeGardenLightMesh() {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.0, 7), furnDarkMat);
  post.position.y = 1.0;
  post.castShadow = true;
  g.add(post);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 9, 7),
    new THREE.MeshBasicMaterial({ color: 0xffdca0 }));   // 스스로 빛나는 갓
  head.position.y = 2.08;
  g.add(head);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.16, 8), furnDarkMat);
  cap.position.y = 2.26;
  g.add(cap);
  const glow = new THREE.PointLight(0xffdca0, 0.9, 9);
  glow.position.y = 2.08;
  g.add(glow);
  return g;
}
// 상점 진열용 모형 — 새 지붕(견본 지붕 조각)과 대문(문짝)
function makeRoofItemMesh() {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: 0xdcbd6a, flatShading: true });
  const r = makeGableRoof(1.6, 1.2, 0.5, mat);
  r.position.y = 0.55;
  g.add(r);
  [-0.6, 0.6].forEach((x) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 6), shopWoodDarkMat);
    p.position.set(x, 0.28, 0);
    g.add(p);
  });
  return g;
}
function makeDoorItemMesh() {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.62, 0.05), shopWoodDarkMat);
  frame.position.set(0, 0.78, -0.03);
  g.add(frame);
  const plank = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.5, 0.08), shopWoodMat);
  plank.position.y = 0.75;
  g.add(plank);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), shopWoodDarkMat);
  knob.position.set(0.28, 0.72, 0.08);
  g.add(knob);
  return g;
}
// ----- 거실 세간 — 소파·소파 테이블·티비다이, 부엌의 싱크대 -----
function makeSofaMesh() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.42, 0.75), furnClothMat);
  base.position.y = 0.32;
  g.add(base);
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 0.22), furnClothMat);
  back.position.set(0, 0.72, -0.28);
  g.add(back);
  [-0.78, 0.78].forEach((x) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 0.7), furnClothMat);
    arm.position.set(x, 0.62, 0);
    g.add(arm);
  });
  [-0.42, 0.42].forEach((x) => {                        // 방석 자국
    const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.1, 0.6),
      new THREE.MeshLambertMaterial({ color: 0xc9a86a, flatShading: true }));
    cushion.position.set(x, 0.56, 0.04);
    g.add(cushion);
  });
  return g;
}
function makeCoffeeTableMesh() {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.07, 0.6), furnWoodMat);
  top.position.y = 0.38;
  g.add(top);
  [[-0.46, -0.22], [0.46, -0.22], [-0.46, 0.22], [0.46, 0.22]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.38, 0.07), furnDarkMat);
    leg.position.set(x, 0.19, z);
    g.add(leg);
  });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.09, 8),
    new THREE.MeshLambertMaterial({ color: 0xe8e0cc }));
  cup.position.set(0.25, 0.46, 0.1);
  g.add(cup);
  return g;
}
function makeTvStandMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 0.5), furnWoodMat);
  body.position.y = 0.32;
  g.add(body);
  [[-0.6, 0], [0.6, 0]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.4), furnDarkMat);
    leg.position.set(x, 0.06, z);
    g.add(leg);
  });
  const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.22, 0.04), furnDarkMat);
  drawer.position.set(0, 0.32, 0.26);
  g.add(drawer);
  return g;
}
function makeSinkMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 0.6), furnWoodMat);
  body.position.y = 0.4;
  g.add(body);
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.68),
    new THREE.MeshLambertMaterial({ color: 0xc7c9c4, flatShading: true }));
  top.position.y = 0.83;
  g.add(top);
  const basin = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.4),
    new THREE.MeshLambertMaterial({ color: 0x9aa0a2, flatShading: true }));
  basin.position.set(-0.25, 0.85, 0);
  g.add(basin);
  const faucet = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6),
    new THREE.MeshLambertMaterial({ color: 0x8a9094 }));
  faucet.position.set(-0.25, 1.0, -0.2);
  g.add(faucet);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 6),
    new THREE.MeshLambertMaterial({ color: 0x8a9094 }));
  spout.rotation.x = Math.PI / 2;
  spout.position.set(-0.25, 1.13, -0.1);
  g.add(spout);
  return g;
}
// ----- 가전 — 세탁기·냉장고 -----
const applianceMat = new THREE.MeshLambertMaterial({ color: 0xe6e4de, flatShading: true });
const applianceDarkMat = new THREE.MeshLambertMaterial({ color: 0x8f948f, flatShading: true });
function makeWasherMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.85, 0.7), applianceMat);
  body.position.y = 0.43;
  g.add(body);
  const doorRing = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 14), applianceDarkMat);
  doorRing.rotation.x = Math.PI / 2;
  doorRing.position.set(0, 0.45, 0.36);
  g.add(doorRing);
  const glassM = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 12),
    new THREE.MeshLambertMaterial({ color: 0x5a6a72 }));
  glassM.rotation.x = Math.PI / 2;
  glassM.position.set(0, 0.45, 0.38);
  g.add(glassM);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.04), applianceDarkMat);
  panel.position.set(0, 0.8, 0.34);
  g.add(panel);
  return g;
}
function makeFridgeMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.7, 0.7), applianceMat);
  body.position.y = 0.85;
  g.add(body);
  const split = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.03, 0.72), applianceDarkMat);
  split.position.y = 1.15;
  g.add(split);
  [[1.32, 0.5], [0.85, 0.45]].forEach(([hy, hl]) => {   // 손잡이 둘 (냉장/냉동)
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.05, hl, 0.05), applianceDarkMat);
    h.position.set(-0.3, hy, 0.39);
    g.add(h);
  });
  return g;
}
// ----- 소철나무 — 잔디 마당에 심는 둥근 소철 -----
function makeCycadMesh() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.55, 8),
    new THREE.MeshLambertMaterial({ color: 0x7a6244, flatShading: true }));
  trunk.position.y = 0.28;
  trunk.castShadow = true;
  g.add(trunk);
  const frondMat = new THREE.MeshLambertMaterial({ color: 0x2f6e38, flatShading: true });
  for (let i = 0; i < 10; i++) {
    const arm = new THREE.Group();
    arm.rotation.y = (i / 10) * Math.PI * 2;
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.11, 1.0, 4), frondMat);
    frond.position.x = 0.42;
    frond.rotation.z = Math.PI / 2 + 0.85;   // 낮게 활처럼 휘어진 잎
    frond.scale.z = 0.3;
    frond.castShadow = true;
    arm.add(frond);
    arm.position.y = 0.55;
    g.add(arm);
  }
  return g;
}
const FURN_BUILDERS = {
  bed: makeBedMesh, chair: makeChairMesh, closet: makeClosetMesh,
  rug: makeRugMesh, lamp: makeLampMesh, cot: makeCotMesh, shelf: makeShelfMesh,
  painting: makePaintingMesh, window: makeWindowMesh, tv: makeTvMesh, tvstand: makeTvStandMesh,
  kitchen: makeKitchenMesh, island: makeIslandMesh, sofa: makeSofaMesh, sink: makeSinkMesh,
  coffeetable: makeCoffeeTableMesh, washer: makeWasherMesh, fridge: makeFridgeMesh,
  roof: makeRoofItemMesh, door: makeDoorItemMesh,
  palm: makePalmMesh, lawn: makeLawnMesh, stones: makeStonesMesh, gardenlight: makeGardenLightMesh,
  cycad: makeCycadMesh,
};

// 집 안에 실제로 놓이는 가구 — 사기 전에는 숨겨져 있습니다
const furnitureMeshes = {};
{
  const spots = {
    bed:      [ROOM.cx - 4.2, ROOM.cz - 2.4, 0],
    chair:    [ROOM.cx - 1.6, ROOM.cz - 1.0, 0],           // 아일랜드 식탁 곁
    closet:   [ROOM.cx + 4.4, ROOM.cz - 3.7, 0],
    rug:      [ROOM.cx + 2.4, ROOM.cz + 0.6, 0],           // 소파와 테이블 아래 깔개
    lamp:     [ROOM.cx - 4.6, ROOM.cz + 2.6, 0],           // 남서쪽 구석
    cot:      [ROOM.cx + 4.6, ROOM.cz + 2.6, -Math.PI / 2],// 남동쪽 구석 — 진짜 침대가 오기 전까지 몸 누일 자리
    shelf:    [ROOM.cx - 1.4, ROOM.cz - 3.9, 0],           // 북쪽 벽
    painting: [ROOM.cx - 3.2, ROOM.cz - 4.4, 0],           // 북쪽 벽에 걸림
    window:   [ROOM.cx + 1.0, ROOM.cz - 4.4, 0],           // 북쪽 벽 창문
    tv:       [ROOM.cx + 4.9, ROOM.cz + 0.8, -Math.PI / 2],// 동쪽 벽을 등지고 — 티비다이 위에 올라갑니다
    tvstand:  [ROOM.cx + 4.9, ROOM.cz + 0.8, -Math.PI / 2],// 티비 받침장 (같은 자리 아래)
    kitchen:  [ROOM.cx - 4.5, ROOM.cz - 3.9, 0],           // 북서쪽 부엌 자리
    sink:     [ROOM.cx - 2.9, ROOM.cz - 3.9, 0],           // 부엌 찬장 옆 싱크대
    island:   [ROOM.cx - 3.0, ROOM.cz - 2.0, 0],           // 부엌 앞의 조리대 겸 식탁
    sofa:     [ROOM.cx + 2.4, ROOM.cz + 1.9, Math.PI],     // 거실 — 방 안쪽을 바라보는 소파
    coffeetable: [ROOM.cx + 2.4, ROOM.cz + 0.6, 0],        // 소파 앞 테이블
    fridge:   [ROOM.cx - 4.8, ROOM.cz - 0.6, Math.PI / 2], // 서쪽 벽 — 부엌 가까이 냉장고
    washer:   [ROOM.cx - 4.8, ROOM.cz + 0.9, Math.PI / 2], // 그 옆에 세탁기
  };
  // 마당 조경은 방이 아니라 집 바깥 실제 지형 위에 심습니다
  const yardSpots = {
    palm:        [HOUSE.x - 1.5, HOUSE.z - 5.4, 0.5],      // 집 뒤(남쪽 바다 쪽) 야자수
    lawn:        [HOUSE.x + 4.6, HOUSE.z + 5.2, 0],        // 앞마당 잔디밭
    stones:      [HOUSE.x - 4.6, HOUSE.z + 5.8, 0.9],      // 앞마당 조경석
    gardenlight: [HOUSE.x + 2.6, HOUSE.z + 4.0, 0],        // 문 앞 돌계단 옆 마당 조명
    cycad:       [HOUSE.x + 5.5, HOUSE.z + 4.4, 1.2],      // 잔디밭 가장자리의 소철나무
  };
  for (const k of FURN_ORDER) {
    if (k === 'roof' || k === 'door') continue;   // 지붕·대문은 물건이 아니라 집 자체를 바꿉니다 (applyHouseLook)
    const g = FURN_BUILDERS[k]();
    const ys = yardSpots[k];
    if (ys) {
      g.position.set(ys[0], groundHeight(ys[0], ys[1]), ys[1]);
      g.rotation.y = ys[2];
    } else {
      // 텔레비전은 티비다이 위에 올라갑니다 (다이 높이만큼 띄움)
      const lift = k === 'tv' ? 0.48 : 0;
      g.position.set(spots[k][0], ROOM.y + lift, spots[k][1]);
      g.rotation.y = spots[k][2];
    }
    g.visible = false;
    scene.add(g);
    furnitureMeshes[k] = g;
  }
}
function applyFurniture() {
  for (const k of FURN_ORDER) {
    if (furnitureMeshes[k]) furnitureMeshes[k].visible = furnitureOwned[k];
  }
  // 지붕·대문·창문은 놓는 물건이 아니라 집 자체의 모습을 바꿉니다
  roofUpgraded = !!furnitureOwned.roof;
  hasHouseDoor = !!furnitureOwned.door;
  hasHouseWindow = !!furnitureOwned.window;
  applyHouseLook();
}

// ---------- 8-2h-3. 망사리 (물질 필수품 — 등에 메고 다니는 실물) ----------
// 해녀는 망사리(그물 자루)에 잡은 것을 담습니다. 이게 있어야 물질을 나갈 수 있고,
// 상자처럼 실제 물건이라 등에 메고 다니다가 내려놓을 수도 있습니다. 상점 안에서 팝니다.
let hasNet = false;       // 망사리를 샀는지
let netCarried = false;   // 지금 등에 메고 있는지 (내려놓으면 그 자리에 놓입니다)
const NET_PRICE = 10000;
const CRATE_PRICE = 10000;   // 감귤상자 한 개 — 여러 개 사서 밭마다 놔둘 수 있습니다
const NET_PICK_RANGE = 2.2;

// 망사리 한 개 — 그물을 씌운 자루에, 해녀들이 쓰는 주황 부표(테왁)를 달았습니다
function makeNetBag() {
  const g = new THREE.Group();
  const bagMat = new THREE.MeshLambertMaterial({ color: 0xc9a86a, flatShading: true });
  const netMat = new THREE.MeshBasicMaterial({ color: 0x6b5537, wireframe: true });
  const tewakMat = new THREE.MeshLambertMaterial({ color: 0xe0762e, flatShading: true });
  const bag = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 7), bagMat);
  bag.scale.set(1, 1.25, 1);
  bag.position.y = 0.34;
  bag.castShadow = true;
  g.add(bag);
  const netOver = new THREE.Mesh(new THREE.SphereGeometry(0.29, 8, 7), netMat);
  netOver.scale.copy(bag.scale);
  netOver.position.copy(bag.position);
  g.add(netOver);
  const tewak = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 7), tewakMat);
  tewak.position.set(0.17, 0.76, 0);
  tewak.castShadow = true;
  g.add(tewak);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.028, 6, 10), shopRopeMat);
  ring.position.y = 0.7;
  g.add(ring);
  return g;
}
// 루루가 실제로 들고 다니는 망사리 — 사기 전에는 숨겨져 있습니다
const netObj = makeNetBag();
netObj.visible = false;
scene.add(netObj);

// (내려놓은 망사리 위에 노란 화살표를 띄웠었는데 걷어냈습니다.
//  전체 지도에 자리가 찍히니 화면까지 어지럽힐 필요가 없습니다)

// 등에서 내려 발 앞에 놓기 / 다시 주워 메기
function dropNet() {
  // 집·상점 안에서는 내려놓지 않습니다 — 실내에선 망사리가 안 그려져서 찾을 수 없게 됩니다
  if (state.inside || state.inShop) {
    spawnMoneyPopup(state.x, groundHeight(state.x, state.z) + 1.4, state.z,
      '망사리는 바깥에서 내려놓을 수 있어요');
    return;
  }
  netCarried = false;
  const fx = state.x + Math.sin(state.facing) * 0.8;
  const fz = state.z + Math.cos(state.facing) * 0.8;
  netObj.position.set(fx, groundHeight(fx, fz), fz);
  netObj.rotation.y = state.facing;
  netObj.visible = true;      // 내려놨으면 무조건 보여야 합니다 (안 그러면 못 찾습니다)
  playDropSound();
  spawnMoneyPopup(fx, groundHeight(fx, fz) + 1.2, fz,
    '망사리를 내려놨어요\n어디 뒀는지는 전체 지도에서 봅니다');
}
function pickUpNet() {
  netCarried = true;
  playPickSound();
  spawnMoneyPopup(state.x, groundHeight(state.x, state.z) + 1.4, state.z, '망사리를 챙겼어요');
}
// 메고 있는 동안 루루 등(허리께)에 딱 붙어 다닙니다 (매 프레임 호출)
const netFollow = new THREE.Vector3();
function updateNet(dt, t) {
  // 내려놓은 망사리 — 놔둔 자리에 그대로 보입니다 (어디 뒀는지는 전체 지도에서 봅니다)
  if (!netCarried) {
    netObj.visible = hasNet && !state.diving && !state.inside && !state.inShop;
    return;
  }
  // 잠수복 차림 그림(물속·포구)에는 망사리가 이미 그려져 있어서,
  // 실물까지 보이면 루루를 가립니다 — 그때는 실물을 숨깁니다.
  netObj.visible = hasNet && !state.diving && !inWetsuitZone();
  if (!netObj.visible) return;
  const back = state.facing + Math.PI;
  // 몸에 살짝 겹칠 만큼 바짝(0.28), 허리 높이(0.35)에 붙입니다 — 허공에 떠 보이지 않게
  netFollow.set(
    state.x + Math.sin(back) * 0.28,
    lulu.position.y + 0.35 + Math.sin(t * 5) * 0.015,
    state.z + Math.cos(back) * 0.28
  );
  netObj.position.lerp(netFollow, 1 - Math.pow(0.000001, dt));   // 거의 즉시 따라붙습니다
  netObj.rotation.y = state.facing;
}

// 돈을 우리가 말하는 대로 적습니다 — 4,000,000원이 아니라 4백만원.
// 0이 여섯 개 늘어서면 얼마인지 한눈에 안 들어옵니다.
function formatWon(n) {
  n = Math.round(n);
  // 영어 모드에서는 ₩1,234,567 꼴로 적습니다 — 만·억 단위는 한국어에만 있으니까요
  if (window.GAME_LANG === 'en') {
    return (n < 0 ? '-' : '') + '₩' + Math.abs(n).toLocaleString('en-US');
  }
  if (n === 0) return '0원';
  const sign = n < 0 ? '-' : '';
  n = Math.abs(n);
  const parts = [];
  const eok = Math.floor(n / 100000000);          // 억
  let rest = n % 100000000;
  if (eok) parts.push(eok.toLocaleString() + '억');
  const man = Math.floor(rest / 10000);           // 만
  rest = rest % 10000;
  if (man) {
    // 딱 떨어질 때만 '천만·백만'으로 읽고, 어중간하면 '4,500만'처럼 만 단위로 적습니다
    if (man % 1000 === 0) parts.push((man / 1000) + '천만');
    else if (man < 1000 && man % 100 === 0) parts.push((man / 100) + '백만');
    else parts.push(man.toLocaleString() + '만');
  }
  if (rest) {
    if (rest % 1000 === 0) parts.push((rest / 1000) + '천');
    else parts.push(rest.toLocaleString());
  }
  return sign + parts.join('') + '원';
}

// ---------- 8-2h-4. 상점 안 진열대 (가격표 달고, F로 구입) ----------
// 상점 문으로 들어오면 당근·씨앗·망사리·가구가 가격표와 함께 진열되어 있습니다.
// 물건 앞에 서서 F(🐾)를 누르면 삽니다.
function makePriceSign(name, price, suffix) {
  const TT = window.T || ((s) => s);   // 영어 모드면 진열대 이름표도 번역해서 그립니다
  const dispName = TT(name);
  const c = document.createElement('canvas');
  c.width = 192; c.height = 96;
  const g = c.getContext('2d');
  g.fillStyle = '#f0e4c8'; g.fillRect(0, 0, 192, 96);
  g.strokeStyle = '#8a6038'; g.lineWidth = 6; g.strokeRect(3, 3, 186, 90);
  g.fillStyle = '#3b2410'; g.textAlign = 'center';
  g.font = `bold ${dispName.length > 9 ? 24 : 34}px "맑은 고딕", Malgun Gothic, sans-serif`;
  g.fillText(dispName, 96, 40);
  g.fillStyle = '#b3541e';
  g.font = 'bold 30px "맑은 고딕", Malgun Gothic, sans-serif';
  g.fillText(TT(formatWon(price) + (suffix || '')), 96, 78);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 망사리 그림 — 이모지에는 이게 없습니다.
// (🧺 바구니를 갖다 쓰니 달걀 담는 소쿠리처럼 보였습니다)
// 주황 테왁(부표)에 그물 자루가 달린, 해녀가 실제로 쓰는 모양으로 그립니다.
const NET_ICON_SVG = `<svg viewBox="0 0 100 100" width="100%" height="100%" aria-label="망사리">
  <!-- 테왁 — 물 위에 뜨는 주황 부표 -->
  <ellipse cx="50" cy="26" rx="26" ry="15" fill="#e8762a"/>
  <ellipse cx="42" cy="21" rx="9" ry="4.5" fill="#f7a462" opacity=".75"/>
  <!-- 자루 입구를 잡아주는 테 -->
  <ellipse cx="50" cy="40" rx="24" ry="7" fill="none" stroke="#8a5a32" stroke-width="3.5"/>
  <!-- 그물 자루 -->
  <path d="M26,40 C24,66 34,86 50,86 C66,86 76,66 74,40 Z"
        fill="#cfe0d4" fill-opacity=".5" stroke="#5e7a66" stroke-width="2.5"/>
  <!-- 그물코 -->
  <g stroke="#5e7a66" stroke-width="1.6" fill="none" opacity=".85">
    <path d="M34,42 C33,62 39,80 50,84"/>
    <path d="M42,42 C41,64 45,82 50,85"/>
    <path d="M58,42 C59,64 55,82 50,85"/>
    <path d="M66,42 C67,62 61,80 50,84"/>
    <path d="M27,52 C38,58 62,58 73,52"/>
    <path d="M29,64 C39,70 61,70 71,64"/>
    <path d="M34,75 C41,79 59,79 66,75"/>
  </g>
</svg>`;

// 판매 물품 목록 — 진열 위치는 북쪽 벽을 따라 한 줄입니다
const SHOP_GOODS = [
  // 당근은 말먹이 소모품이라 구석에 둡니다 (왼쪽 벽 인테리어 견본 팻말과 겹치는 자리)
  { key: 'carrot', name: '당근',   emoji: '🥕', get price() { return CARROT_PRICE; },
    x: SHOP_ROOM.cx - 6.0, z: SHOP_ROOM.cz - 3.4 },
  { key: 'net',    name: '망사리', emoji: NET_ICON_SVG, get price() { return NET_PRICE; },
    x: SHOP_ROOM.cx - 1.4, z: SHOP_ROOM.cz - 3.4 },
  // 상자는 여러 개 살 수 있습니다 — 밭마다 하나씩 놔두면 왕복하지 않아도 됩니다
  { key: 'crate',  name: '감귤상자', emoji: '📦', repeat: true, get price() { return CRATE_PRICE; },
    x: SHOP_ROOM.cx - 3.0, z: SHOP_ROOM.cz - 3.4 },
  // 씨앗은 종류가 여럿이라, 누르면 고르는 창이 뜹니다 (벽지·페인트와 같은 방식).
  // 농사가 이 섬 살이의 큰 축이라, 들어서면 바로 보이도록 북쪽 진열대 맨 앞에 둡니다.
  { key: 'seeds',  name: '씨앗', emoji: '🌱', seedShelf: true, get price() { return SEEDS.buckwheat.price; },
    x: SHOP_ROOM.cx - 4.6, z: SHOP_ROOM.cz - 3.4 },
  { key: 'bed',    name: '침대',   emoji: '🛏', get price() { return FURNITURE.bed.price; },
    x: SHOP_ROOM.cx + 0.6, z: SHOP_ROOM.cz - 3.3 },
  { key: 'sofa',   name: '소파',   emoji: '🛋', get price() { return FURNITURE.sofa.price; },
    x: SHOP_ROOM.cx + 2.4, z: SHOP_ROOM.cz - 3.3 },
  { key: 'chair',  name: '의자',   emoji: '🪑', get price() { return FURNITURE.chair.price; },
    x: SHOP_ROOM.cx + 3.9, z: SHOP_ROOM.cz - 3.3 },
  { key: 'closet', name: '옷장',   emoji: '🧥', get price() { return FURNITURE.closet.price; },
    x: SHOP_ROOM.cx + 5.3, z: SHOP_ROOM.cz - 3.3 },
  // ----- 동쪽 벽 — 집꾸미기 소품 코너 -----
  { key: 'rug',      name: '러그',        emoji: '🧶', get price() { return FURNITURE.rug.price; },
    x: SHOP_ROOM.cx + 5.5, z: SHOP_ROOM.cz - 2.2, rot: -Math.PI / 2 },
  { key: 'lamp',     name: '스탠드 조명', emoji: '💡', get price() { return FURNITURE.lamp.price; },
    x: SHOP_ROOM.cx + 5.5, z: SHOP_ROOM.cz - 1.25, rot: -Math.PI / 2 },
  { key: 'cot',      name: '간이침대',    emoji: '🛌', get price() { return FURNITURE.cot.price; },
    x: SHOP_ROOM.cx + 5.5, z: SHOP_ROOM.cz - 0.3, rot: -Math.PI / 2 },
  { key: 'shelf',    name: '책장',        emoji: '📚', get price() { return FURNITURE.shelf.price; },
    x: SHOP_ROOM.cx + 5.5, z: SHOP_ROOM.cz + 0.65, rot: -Math.PI / 2 },
  { key: 'painting', name: '벽걸이 그림', emoji: '🖼', get price() { return FURNITURE.painting.price; },
    x: SHOP_ROOM.cx + 5.5, z: SHOP_ROOM.cz + 1.6, rot: -Math.PI / 2 },
  { key: 'window',   name: '창문',        emoji: '🪟', get price() { return FURNITURE.window.price; },
    x: SHOP_ROOM.cx + 5.5, z: SHOP_ROOM.cz + 2.55, rot: -Math.PI / 2 },
  { key: 'tv',       name: '텔레비전',    emoji: '📺', get price() { return FURNITURE.tv.price; },
    x: SHOP_ROOM.cx + 5.5, z: SHOP_ROOM.cz + 3.5, rot: -Math.PI / 2 },
  { key: 'kitchen',  name: '부엌 찬장',   emoji: '🍳', get price() { return FURNITURE.kitchen.price; },
    x: SHOP_ROOM.cx + 4.2, z: SHOP_ROOM.cz + 3.6, rot: Math.PI },
  { key: 'island',   name: '아일랜드 식탁', emoji: '🍽', get price() { return FURNITURE.island.price; },
    x: SHOP_ROOM.cx + 2.6, z: SHOP_ROOM.cz + 3.6, rot: Math.PI },
  { key: 'roof',     name: '새 지붕',     emoji: '🛖', get price() { return FURNITURE.roof.price; },
    x: SHOP_ROOM.cx + 1.2, z: SHOP_ROOM.cz + 3.6, rot: Math.PI },
  { key: 'door',     name: '대문',        emoji: '🚪', get price() { return FURNITURE.door.price; },
    x: SHOP_ROOM.cx - 0.4, z: SHOP_ROOM.cz - 3.4 },
  // ----- 매장 가운데 통로 — 거실·부엌 세간 진열 -----
  { key: 'tvstand',     name: '티비다이',    emoji: '🗄', get price() { return FURNITURE.tvstand.price; },
    x: SHOP_ROOM.cx + 1.4, z: SHOP_ROOM.cz + 1.9, rot: Math.PI },
  { key: 'coffeetable', name: '소파 테이블', emoji: '🫖', get price() { return FURNITURE.coffeetable.price; },
    x: SHOP_ROOM.cx + 3.6, z: SHOP_ROOM.cz + 1.9, rot: Math.PI },
  { key: 'sink',        name: '싱크대',      emoji: '🚰', get price() { return FURNITURE.sink.price; },
    x: SHOP_ROOM.cx - 3.4, z: SHOP_ROOM.cz + 1.8 },
  // ----- 남쪽 벽(문 서쪽) — 마당 조경 코너 -----
  { key: 'palm',        name: '야자수',    emoji: '🌴', get price() { return FURNITURE.palm.price; },
    x: SHOP_ROOM.cx - 5.6, z: SHOP_ROOM.cz + 3.5, rot: Math.PI },
  { key: 'lawn',        name: '잔디밭',    emoji: '🌱', get price() { return FURNITURE.lawn.price; },
    x: SHOP_ROOM.cx - 4.5, z: SHOP_ROOM.cz + 3.5, rot: Math.PI },
  { key: 'stones',      name: '조경석',    emoji: '🪨', get price() { return FURNITURE.stones.price; },
    x: SHOP_ROOM.cx - 3.4, z: SHOP_ROOM.cz + 3.5, rot: Math.PI },
  { key: 'gardenlight', name: '마당 조명', emoji: '🏮', get price() { return FURNITURE.gardenlight.price; },
    x: SHOP_ROOM.cx - 2.3, z: SHOP_ROOM.cz + 3.5, rot: Math.PI },
  { key: 'cycad',       name: '소철나무',  emoji: '🌵', get price() { return FURNITURE.cycad.price; },
    x: SHOP_ROOM.cx - 1.2, z: SHOP_ROOM.cz + 3.5, rot: Math.PI },
  // ----- 매장 가운데 통로 — 가전 -----
  { key: 'washer', name: '세탁기', emoji: '👕', get price() { return FURNITURE.washer.price; },
    x: SHOP_ROOM.cx - 1.2, z: SHOP_ROOM.cz + 1.9 },
  { key: 'fridge', name: '냉장고', emoji: '🧊', get price() { return FURNITURE.fridge.price; },
    x: SHOP_ROOM.cx - 2.3, z: SHOP_ROOM.cz + 2.0 },
];

// 진열: 받침대 + 물건 + 가격표
{
  const y0 = SHOP_ROOM.y;
  for (const good of SHOP_GOODS) {
    const stand = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 0.8), shopWoodMat);
    stand.position.set(good.x, y0 + 0.08, good.z);
    scene.add(stand);
    let item = null;
    if (good.key === 'carrot') {
      item = new THREE.Group();
      const carrotMat = new THREE.MeshLambertMaterial({ color: 0xe06a1d, flatShading: true });
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const cn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.34, 6), carrotMat);
        cn.position.set(Math.cos(a) * 0.16, 0.3, Math.sin(a) * 0.16);
        cn.rotation.set((Math.random() - 0.5) * 0.9, 0, (Math.random() - 0.5) * 0.9);
        item.add(cn);
      }
    } else if (good.key === 'net') {
      item = makeNetBag();
      item.scale.setScalar(0.9);
    } else if (good.key === 'crate') {
      // 진열대에는 작게 줄인 빈 감귤상자를 하나 올려둡니다
      item = new THREE.Group();
      const cw = 0.62, ch = 0.42, cd = 0.5, ct = 0.05;
      // 상자 재질(crateSideMat)은 이 파일 한참 아래에서 만들어지므로 여기서는 따로 씁니다
      const boxWood = new THREE.MeshLambertMaterial({ color: 0xb2762f, flatShading: true });
      const boxIn = new THREE.MeshLambertMaterial({ color: 0x8a4d16 });
      const put = (geo, px, py, pz, mat) => {
        const m = new THREE.Mesh(geo, mat || boxWood);
        m.position.set(px, py, pz); m.castShadow = true; item.add(m);
      };
      put(new THREE.BoxGeometry(cw, ct, cd), 0, ct / 2 + 0.16, 0, boxIn);
      const fr = new THREE.BoxGeometry(cw, ch, ct);
      put(fr, 0, ch / 2 + 0.16, (cd - ct) / 2);
      put(fr, 0, ch / 2 + 0.16, -(cd - ct) / 2);
      const sd = new THREE.BoxGeometry(ct, ch, cd - ct * 2);
      put(sd, (cw - ct) / 2, ch / 2 + 0.16, 0);
      put(sd, -(cw - ct) / 2, ch / 2 + 0.16, 0);
    } else if (good.key === 'seeds') {
      // 씨앗 봉지를 담은 나무 상자 (누르면 종류를 고르는 창이 뜹니다)
      item = new THREE.Group();
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.42, 0.6),
        new THREE.MeshLambertMaterial({ color: 0x8a6a45, flatShading: true }));
      crate.position.y = 0.21;
      item.add(crate);
      // 누런 종이봉지 넉 장을 상자에 기대 세웁니다 (작물 넷)
      const bagCols = [0xd9c48f, 0xcbb47a, 0xe0cd9c, 0xc4ac6f];
      for (let i = 0; i < 4; i++) {
        const bag = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.4, 0.14),
          new THREE.MeshLambertMaterial({ color: bagCols[i], flatShading: true }));
        bag.position.set(-0.33 + i * 0.22, 0.62, 0);
        bag.rotation.z = (Math.random() - 0.5) * 0.24;
        item.add(bag);
        // 봉지 앞면에 붙인 작물 딱지 — 무엇이 든 봉지인지 색으로 알아봅니다
        const label = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.15, 0.02),
          new THREE.MeshLambertMaterial({ color: [0xf2efe4, 0xc9a165, 0xe8f0dc, 0x2d5f2c][i], flatShading: true }));
        label.position.set(bag.position.x, 0.66, 0.08);
        label.rotation.z = bag.rotation.z;
        item.add(label);
      }
    } else {
      item = FURN_BUILDERS[good.key]();
      item.scale.setScalar(0.55);   // 진열용은 아담하게
    }
    item.position.set(good.x, y0 + 0.16, good.z);
    if (good.rot) item.rotation.y = good.rot;
    scene.add(item);
    // 가격표 — 물건 위에 걸린 나무 팻말 (벽 방향에 맞춰 돌립니다)
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.58),
      // 씨앗은 종류마다 값이 달라서 "부터"를 붙입니다
      new THREE.MeshBasicMaterial({ map: makePriceSign(good.name, good.price, good.seedShelf ? '부터' : '') }));
    const sdx = good.rot === -Math.PI / 2 ? -0.1 : 0;
    const sdz = good.rot ? (good.rot === Math.PI ? -0.1 : 0) : 0.1;
    sign.position.set(good.x + sdx, y0 + 2.0, good.z + sdz);
    if (good.rot) sign.rotation.y = good.rot;
    scene.add(sign);
  }
}

// ---------- 8-2h-4b. 상점 왼쪽 인테리어 코너 — 바닥재·벽지 (누르면 색 고르기 팝업) ----------
// 견본대 앞에서 F를 누르면 색 고르기 창이 뜨고, 색을 고르면 그 자리에서 결제·시공됩니다.
const RENO_GOODS = [
  { type: 'floor', name: '바닥재',      price: FLOOR_PRICE, dz: -1.6 },
  { type: 'wall',  name: '벽지',        price: WALL_PRICE, dz: 0 },
  { type: 'paint', name: '외벽 페인트', get price() { return PAINT_PRICE; }, dz: 1.6 },
];
const FLOOR_COLORS = [
  { name: '원목',     color: 0x9a7748 },
  { name: '밝은나무', color: 0xc9a86a },
  { name: '현무암',   color: 0x8d8b85 },
  { name: '붉은흙',   color: 0x9a6a4d },
  { name: '쪽빛',     color: 0x6a8a9a },
  { name: '먹빛',     color: 0x55504a },
  { name: '흰대리석', color: 0xdcd8d0 },
  { name: '체리목',   color: 0x8a4a3a },
  { name: '올리브',   color: 0x7a7a52 },
  { name: '모래빛',   color: 0xc0ac88 },
];
const WALL_COLORS = [
  { name: '크림',   color: 0xf0e4c8 },
  { name: '하늘',   color: 0xa8c8e0 },
  { name: '연분홍', color: 0xe8b8c0 },
  { name: '연두',   color: 0xbcd8a0 },
  { name: '라벤더', color: 0xc8b8e0 },
  { name: '미색',   color: 0xe8e0d0 },
  { name: '민트',   color: 0xa8d8c8 },
  { name: '레몬',   color: 0xe8dc9a },
  { name: '살구',   color: 0xe8c0a0 },
  { name: '잿빛',   color: 0xb0b0ac },
  { name: '청록',   color: 0x7ab0b0 },
  { name: '흰색',   color: 0xf2f0ea },
];
let houseFloorColor = 0;   // 0 = 아직 기본 (폐가 흙바닥·돌벽)
let houseWallColor = 0;
{
  const y0 = SHOP_ROOM.y, x = SHOP_ROOM.cx - 5.3;
  for (const rg of RENO_GOODS) {
    rg.x = x;
    rg.z = SHOP_ROOM.cz + rg.dz;
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.9), shopWoodMat);
    stand.position.set(rg.x, y0 + 0.25, rg.z);
    scene.add(stand);
    // 색 견본 부채 — 여러 색을 늘어놓아 "골라 살 수 있음"을 보여줍니다
    const colors = rg.type === 'floor' ? FLOOR_COLORS : rg.type === 'wall' ? WALL_COLORS : PAINT_COLORS;
    colors.slice(0, 4).forEach((c, i) => {
      const chip = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.34),
        new THREE.MeshLambertMaterial({ color: c.color }));
      chip.position.set(rg.x + (i % 2 ? 0.2 : -0.2), y0 + 0.56 + Math.floor(i / 2) * 0.11, rg.z + (i % 2 ? 0.16 : -0.14));
      chip.rotation.y = i * 0.35;
      scene.add(chip);
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.58),
      new THREE.MeshBasicMaterial({ map: makePriceSign(rg.name, rg.price) }));
    sign.position.set(rg.x + 0.1, y0 + 2.0, rg.z);
    sign.rotation.y = Math.PI / 2;
    scene.add(sign);
  }
}
function applyRoomLook() {
  if (houseFloorColor) houseRoomLook.floorMat.color.setHex(houseFloorColor);
  if (houseWallColor) houseRoomLook.wallMat.color.setHex(houseWallColor);
}
function nearestReno() {
  let best = null, bestD = 0.9;
  for (const rg of RENO_GOODS) {
    const d = Math.hypot(state.x - rg.x, state.z - rg.z);
    if (d < bestD) { bestD = d; best = rg; }
  }
  return best;
}
function buyReno(rg) {
  const py = SHOP_ROOM.y + 1.6;
  const price = rg.price;
  // 한 번 사면 그것으로 끝 — 이미 시공(또는 페인트 보유)했으면 다시 안 삽니다 (재구입 없음, 사용자 지정)
  if (rg.type === 'paint' && tools.paint) {
    spawnMoneyPopup(state.x, py, state.z, '이미 페인트가 있어요\n집 앞에서 칠하세요');
    return;
  }
  if (rg.type === 'floor' && houseFloorColor !== 0) {
    spawnMoneyPopup(state.x, py, state.z, '바닥재는 이미 시공했어요');
    return;
  }
  if (rg.type === 'wall' && houseWallColor !== 0) {
    spawnMoneyPopup(state.x, py, state.z, '벽지는 이미 시공했어요');
    return;
  }
  // 색 고르기 창을 띄우고, 색을 고른 뒤 가격 단추를 눌러야 결제됩니다
  const colors = rg.type === 'floor' ? FLOOR_COLORS : rg.type === 'wall' ? WALL_COLORS : PAINT_COLORS;
  openColorPicker(`${rg.name}\n색을 고르세요`, colors, (c) => {
    if (coins < price) {
      spawnMoneyPopup(state.x, py, state.z, `${formatWon((price - coins))} 부족`);
      return;
    }
    coins -= price;
    updateCoinBadge();
    if (rg.type === 'floor') { houseFloorColor = c.color; applyRoomLook(); }
    else if (rg.type === 'wall') { houseWallColor = c.color; applyRoomLook(); }
    else { tools.paint = true; housePaintColor = c.color; }
    playShipSound();
    spawnMoneyPopup(state.x, py, state.z, rg.type === 'paint'
      ? `${c.name} 페인트 구입! 집 앞에서 칠해보세요`
      : `${c.name} ${rg.name} 시공 완료! 집이 바뀌었어요`);
    saveGame(true);
    lonelyCheck();   // 바닥·벽지·페인트로 자산 문턱을 넘으면 외로움 독백 즉시
  }, price);
}

// 물건 하나 사기 — 물건 앞에서 F를 눌렀을 때.
// 바로 사지지 않고, 물건과 가격을 크게 보여주는 창이 먼저 뜹니다.
// 창 안의 가격 단추를 눌러야 최종 구입됩니다 (잘못 눌러 사지는 일 방지).
function buyShopGood(good) {
  const px = state.x, pz = state.z;
  const py = SHOP_ROOM.y + 1.6;
  if (good.seedShelf) { openSeedShop(); return; }   // 씨앗은 종류부터 고릅니다
  const already =
    (good.key === 'net' && hasNet) ||
    (FURNITURE[good.key] && furnitureOwned[good.key]);
  if (already) {
    spawnMoneyPopup(px, py, pz, `이미 ${good.name}가 있어요`);
    return;
  }
  // 텔레비전은 올려놓을 티비다이가 먼저 있어야 합니다
  if (good.key === 'tv' && !furnitureOwned.tvstand) {
    spawnMoneyPopup(px, py, pz, '티비다이가 먼저 있어야 놓을 수 있어요 (매장 가운데 진열)');
    return;
  }
  const price = good.price;
  openBuyDialog(good.emoji, good.name, price, () => doBuyShopGood(good, price, px, py, pz));
}
function doBuyShopGood(good, price, px, py, pz) {
  if (coins < price) {
    spawnMoneyPopup(px, py, pz, `${formatWon((price - coins))} 부족`);
    return;
  }
  coins -= price;
  updateCoinBadge();
  if (good.key === 'carrot') {
    carrots++;
    updateCarrotBadge();
    playPickSound();
    spawnMoneyPopup(px, py, pz, `당근 구입! (${carrots}개)`);
  } else if (good.key === 'net') {
    hasNet = true;
    netCarried = true;
    netObj.visible = true;
    netObj.position.set(px, SHOP_ROOM.y + 1, pz);
    playShipSound();
    spawnMoneyPopup(px, py, pz, '망사리 구입! 등에 메고 포구로 가면 물질할 수 있어요');
  } else if (good.key === 'crate') {
    buyCrate(px, py, pz);
  } else {
    furnitureOwned[good.key] = true;
    applyFurniture();
    playShipSound();
    spawnMoneyPopup(px, py, pz,
      good.key === 'roof'   ? '새 지붕 구입! 지붕이 환한 새 짚빛이 됐어요'
      : good.key === 'door' ? '대문 구입! 뚫려 있던 문간에 문짝을 달았어요'
      : good.key === 'window' ? '창문 구입! 시커먼 구멍에 창을 달았어요'
      : YARD_KEYS.has(good.key) ? `${good.name} 구입! 집 마당에 심어뒀어요`
      : `${good.name} 구입! 집 안에 놓아뒀어요`);
    lonelyCheck();   // 집이 채워질수록 혼자라는 게 더 크게 느껴집니다
  }
  saveGame(true);   // 어떤 물건이든 산 즉시 저장 (탭이 꺼져도 잃지 않게)
}
// 지금 서 있는 자리에서 살 수 있는 물건 (없으면 null)
function nearestShopGood() {
  let best = null, bestD = 1.5;
  for (const good of SHOP_GOODS) {
    const d = Math.hypot(state.x - good.x, state.z - good.z);
    if (d < bestD) { bestD = d; best = good; }
  }
  return best;
}

// ---------- 8-2h-5. 문 드나들기 (집 · 상점) ----------
// 밖에서 문 앞에 서면 안으로, 안에서 남쪽 문 쪽으로 걸어가면 밖으로.
// 화면이 잠깐 어두워졌다 밝아지는 사이 순간이동합니다.
const SHOP_DOOR = { x: 6, z: 42.2 };    // 상점 문 앞 (밖)
let transitioning = false;
const sceneFade = document.getElementById('sceneFade');
function fadeTeleport(fn) {
  transitioning = true;
  if (sceneFade) sceneFade.classList.add('show');
  setTimeout(() => {
    fn();
    if (sceneFade) sceneFade.classList.remove('show');
    setTimeout(() => { transitioning = false; }, 300);
  }, 380);
}
function teleportInto(R, insideFlagName, greet) {
  fadeTeleport(() => {
    state[insideFlagName] = true;
    state.x = R.cx; state.z = R.cz + 2.2;
    state.vy = 0; state.onGround = true;
    state.facing = Math.PI;   // 방 안쪽을 바라봅니다
    state.idleTime = 0; state.sit = 0;
    lulu.position.set(state.x, R.y, state.z);
    camYaw = 0;               // 카메라는 문 쪽(남쪽)에서 방 안을 들여다봅니다
    camera.position.set(state.x, R.y + 4, state.z + 8);
    if (greet) spawnMoneyPopup(state.x, R.y + 2, state.z, greet, 3, 'big');
  });
}
function teleportOut(outX, outZ) {
  fadeTeleport(() => {
    state.inside = false; state.inShop = false;
    state.x = outX; state.z = outZ;
    state.vy = 0;
    state.facing = 0;         // 마을 쪽(북쪽)을 바라봅니다
    state.idleTime = 0; state.sit = 0;
    lulu.position.set(state.x, groundHeight(state.x, state.z), state.z);
    camYaw = Math.PI;
    camera.position.set(state.x, groundHeight(state.x, state.z) + 5, state.z - 8);
  });
}
// 매 프레임 문 앞에 서 있는지 확인합니다
function updateDoors() {
  if (transitioning || state.diving) return;
  if (state.inside) {
    if (Math.hypot(state.x - ROOM.cx, state.z - (ROOM.cz + ROOM.d / 2 - 0.3)) < 1.0) {
      teleportOut(HOUSE.x, HOUSE.z + 5.4);
    }
    return;
  }
  if (state.inShop) {
    if (Math.hypot(state.x - SHOP_ROOM.cx, state.z - (SHOP_ROOM.cz + SHOP_ROOM.d / 2 - 0.3)) < 1.0) {
      teleportOut(SHOP_DOOR.x, SHOP_DOOR.z - 1.6);
    }
    return;
  }
  // 밖: 집 문 앞 (내 집이니 자동으로 들어갑니다)
  if (Math.hypot(state.x - HOUSE.x, state.z - (HOUSE.z + 3.6)) < 1.2) {
    const empty = !FURN_ORDER.some((k) => furnitureOwned[k]);
    teleportInto(ROOM, 'inside',
      empty ? '텅 빈 집… 맨땅이라도 몸 누일 곳은 되네요' : '내 집에 왔어요');
    return;
  }
  // (상점은 자동 입장이 아닙니다 — 이장님이 문 앞에 와서 열어줘야 F로 들어갑니다)
}

// 상점 문 앞에서 F — 이장님이 계셔야 문을 열어줍니다
const SHOP_DOOR_RANGE = 1.8;
function mayorAtShop() {
  return Math.hypot(mayor.x - MAYOR_POSTS.shop.x, mayor.z - MAYOR_POSTS.shop.z) < 2.5;
}
function tryEnterShop() {
  const y = groundHeight(SHOP_DOOR.x, SHOP_DOOR.z) + 2.2;
  if (!mayorAtShop()) {
    spawnMoneyPopup(SHOP_DOOR.x, y, SHOP_DOOR.z, '이장님이 오고 계세요\n잠깐만요');
    return;
  }
  teleportInto(SHOP_ROOM, 'inShop', '어서 오세요! 물건 앞에서 사면 됩니다');
}

// ---------- 8-2i. 컨테이너 창고 ----------
// 택배사 앞마당 한켠에 낡은 해상 컨테이너가 놓여 있습니다.
// 20만원에 사면 딴 귤을 서늘하게 갈무리해 둘 수 있어서,
// 이장님이 상자값을 두 배로 쳐줍니다 (칸수는 그대로 20칸입니다).
// 마구간 쪽으로 난 길 남쪽 잔디밭에, 길과 직각으로 가로 놓았습니다.
// 길과 나란히 두면 길에서 봤을 때 끝면만 보여 그냥 네모난 상자처럼 보입니다.
const CONTAINER = { x: -12.5, z: 26.5, rot: Math.PI / 2 + 0.18 };
const CONTAINER_PRICE = 200000;
const CONTAINER_RANGE = 3.6;
let hasContainer = false;
let containerSign = null;
{
  const g = new THREE.Group();
  const y = groundHeight(CONTAINER.x, CONTAINER.z);
  g.position.set(CONTAINER.x, y, CONTAINER.z);
  g.rotation.y = CONTAINER.rot;
  const W = 5.2, H = 2.4, D = 2.2;                          // 20피트 컨테이너 정도
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x9a5236, flatShading: true });   // 바랜 주황빛 철판
  const ribMat = new THREE.MeshLambertMaterial({ color: 0x83432b, flatShading: true });
  const doorMat = new THREE.MeshLambertMaterial({ color: 0x7d3f29, flatShading: true });
  const barMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a, flatShading: true });
  const put = (mesh, px, py, pz) => {
    mesh.position.set(px, py, pz);
    mesh.castShadow = true; mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  };
  put(new THREE.Mesh(new THREE.BoxGeometry(W, H, D), bodyMat), 0, H / 2, 0);
  // 옆면 골판 — 세로 주름이 있어야 컨테이너로 보입니다
  for (let i = 0; i < 11; i++) {
    const px = -W / 2 + 0.35 + i * ((W - 0.7) / 10);
    put(new THREE.Mesh(new THREE.BoxGeometry(0.1, H - 0.28, D + 0.06), ribMat), px, H / 2, 0);
  }
  // 위아래 테두리 골조
  [0.09, H - 0.09].forEach((py) => {
    put(new THREE.Mesh(new THREE.BoxGeometry(W + 0.1, 0.18, D + 0.12), ribMat), 0, py, 0);
  });
  // 앞쪽 문 두 짝과 잠금봉
  put(new THREE.Mesh(new THREE.BoxGeometry(W / 2 - 0.08, H - 0.34, 0.08), doorMat), -W / 4, H / 2, D / 2 + 0.04);
  put(new THREE.Mesh(new THREE.BoxGeometry(W / 2 - 0.08, H - 0.34, 0.08), doorMat), W / 4, H / 2, D / 2 + 0.04);
  [-W / 4 - 0.4, -W / 4 + 0.4, W / 4 - 0.4, W / 4 + 0.4].forEach((px) => {
    put(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, H - 0.5, 6), barMat), px, H / 2, D / 2 + 0.11);
  });
  // 바닥에 괴어둔 침목
  [-W / 2 + 0.6, W / 2 - 0.6].forEach((px) => {
    put(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.16, D + 0.2), shopWoodDarkMat), px, 0.08, 0);
  });
  // 값 팻말 — 사고 나면 떼어냅니다
  containerSign = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.85),
    new THREE.MeshBasicMaterial({ map: makePriceSign('컨테이너 창고', CONTAINER_PRICE), transparent: true }));
  containerSign.position.set(0, H + 0.75, D / 2 + 0.15);
  g.add(containerSign);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.72, 6), citrusTrunkMat);
  post.position.set(0, H - 0.04, D / 2 + 0.08);   // 판 아래까지만, 판 뒤로
  containerSign.userData.post = post;
  g.add(post);
  scene.add(g);
  obstacles.push({ x: CONTAINER.x, z: CONTAINER.z, r: 2.6, topY: NO_JUMP });
}
// ----- 귤상자 모으는 자리 -----
// 컨테이너 바로 앞, 밧줄로 네 귀퉁이를 둘러친 자리입니다.
// 가득 찬 상자를 여기 끌어다 쌓아두면, 택배사에서 한 번에 넘길 때 개수만큼 값을 더 받습니다.
// (상자를 아무 데나 흩어놓으면 이장님 트럭이 못 찾으니, 한군데 모아두는 자리를 정해둔 것입니다)
const CRATE_ZONE = { x: -8.5, z: 26.5, r: 5.0 };
let crateZoneGroup = null;
let crateZoneSign = null;
{
  const g = new THREE.Group();
  const gy = groundHeight(CRATE_ZONE.x, CRATE_ZONE.z);
  g.position.set(CRATE_ZONE.x, gy, CRATE_ZONE.z);
  // 바닥을 다져놓은 자리 (풀보다 살짝 높게 깔아 흙바닥처럼)
  const pad = new THREE.Mesh(new THREE.CircleGeometry(CRATE_ZONE.r, 28),
    new THREE.MeshLambertMaterial({ color: 0x9a7c56 }));
  pad.rotation.x = -Math.PI / 2;
  pad.position.y = 0.05;
  pad.receiveShadow = true;
  g.add(pad);
  // 네 귀퉁이 말뚝과 그 사이를 잇는 밧줄
  const postMat = new THREE.MeshLambertMaterial({ color: 0x6f5540, flatShading: true });
  const ropeMat = new THREE.MeshLambertMaterial({ color: 0xd8b57a });
  const R = CRATE_ZONE.r - 0.3;
  const corners = [];
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2;
    const px = Math.cos(a) * R, pz = Math.sin(a) * R;
    corners.push([px, pz]);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.0, 6), postMat);
    post.position.set(px, 0.5, pz);
    post.castShadow = true;
    g.add(post);
  }
  for (let i = 0; i < 4; i++) {
    const [ax, az] = corners[i], [bx, bz] = corners[(i + 1) % 4];
    const len = Math.hypot(bx - ax, bz - az);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, len, 5), ropeMat);
    rope.position.set((ax + bx) / 2, 0.78, (az + bz) / 2);
    rope.rotation.z = Math.PI / 2;
    rope.rotation.y = -Math.atan2(bz - az, bx - ax);
    g.add(rope);
  }
  // 「귤상자 두는 곳」 팻말 — 컨테이너를 사기 전과 후의 문구가 다릅니다
  const c = document.createElement('canvas');
  c.width = 256; c.height = 96;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  crateZoneSign = { canvas: c, tex };
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
  // 팻말은 존 앞쪽(남쪽) 밧줄에 답니다 — 뒤쪽에 두면 컨테이너에 가려 글씨가 안 보입니다
  board.position.set(0, 1.5, -(CRATE_ZONE.r - 0.3));
  board.rotation.y = Math.PI;          // 글씨가 바깥(다가오는 쪽)을 향하게
  g.add(board);
  const bpost = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.06, 6), postMat);
  bpost.position.set(0, 0.53, -(CRATE_ZONE.r - 0.3) + 0.08);   // 판 아래까지만, 판 뒤로
  g.add(bpost);
  // 컨테이너를 사기 전에도 자리는 보여둡니다.
  // 뭘 얻는지 미리 보여야 살 마음이 생깁니다 —
  // 밧줄 친 자리와 팻말이 곧 광고판 노릇을 합니다.
  crateZoneGroup = g;
  scene.add(g);
  updateCrateZoneSign();      // 팻말 글씨를 처음 한 번 그려둡니다
}

// 「귤상자 두는 곳」 팻말 글씨. 사기 전에는 컨테이너를 사라고 알려주는 광고판입니다.
function updateCrateZoneSign() {
  if (!crateZoneSign) return;
  const g = crateZoneSign.canvas.getContext('2d');
  g.clearRect(0, 0, 256, 96);
  g.fillStyle = hasContainer ? '#e8d6a8' : '#ddd3bd';
  g.fillRect(0, 0, 256, 96);
  g.strokeStyle = '#8a6a3a'; g.lineWidth = 6; g.strokeRect(3, 3, 250, 90);
  g.textAlign = 'center';
  g.fillStyle = '#3b2410';
  g.font = 'bold 34px "맑은 고딕", Malgun Gothic, sans-serif';
  signText(g, '귤상자 두는 곳', 128, 44, 240);
  g.font = 'bold 21px "맑은 고딕", Malgun Gothic, sans-serif';
  g.fillStyle = hasContainer ? '#7a4a1a' : '#8a7a5c';
  signText(g, hasContainer ? '5개마다 두 배 · 20개까지' : '컨테이너 창고를 사면 열립니다', 128, 76, 240);
  crateZoneSign.tex.needsUpdate = true;
}

function applyContainer() {
  updateCrateZoneSign();   // 팻말 문구가 산 뒤로 바뀝니다
  if (!containerSign) return;
  containerSign.visible = !hasContainer;
  if (containerSign.userData.post) containerSign.userData.post.visible = !hasContainer;
}
function tryBuyContainer() {
  const y = groundHeight(CONTAINER.x, CONTAINER.z) + 3.2;
  if (hasContainer) {
    spawnMoneyPopup(CONTAINER.x, y, CONTAINER.z,
      '컨테이너 창고\n값이 비쌀 때 팔아 상자 하나에 2만원');
    return;
  }
  const price = CONTAINER_PRICE;
  // 사기 전에 무엇에 쓰는 물건인지부터 알려줍니다.
  // 왜 사야 하는지 모르면 그냥 지나칩니다.
  if (!tryBuyContainer.told) {
    tryBuyContainer.told = true;
    startTalk('컨테이너 창고', [
      `낡은 해상 컨테이너입니다. ${formatWon(price)}.`,
      '사두면 감귤을 서늘하게 갈무리했다가 값이 비쌀 때 팝니다.\n귤 상자 하나에 1만원이던 것이 2만원이 됩니다.',
      '앞마당 「귤상자 두는 곳」에 가득 찬 상자를 모아두세요.\n다섯 개 단위로만 부치는 대신, 다섯 개마다 값이 두 배가 됩니다.',
      '5상자면 두 배, 10상자면 네 배, 15상자면 여덟 배,\n20상자면 열여섯 배. 한 번에 스무 상자까지 받습니다.',
      '대신 컨테이너를 사고 나면 한 상자씩은 못 팝니다.\n다섯 개를 채워야 이장님이 받아줍니다.',
      '한 번 더 누르면 삽니다.',
    ]);
    return;
  }
  if (coins < price) {
    spawnMoneyPopup(CONTAINER.x, y, CONTAINER.z,
      `컨테이너 창고 ${formatWon(price)}\n${formatWon(price - coins)} 모자라요`);
    return;
  }
  coins -= price;
  hasContainer = true;
  applyContainer();
  updateCoinBadge();
  updateBasketBadge();
  playShipSound();
  saveGame(true);
  spawnMoneyPopup(CONTAINER.x, y, CONTAINER.z,
    '이제 감귤을 보관해놨다가 값이 비쌀 때 팝니다\n귤 상자 하나에 2만원', 6);
}

// 8-3. 감귤나무 (밭담 안에 줄지어 심는 귤밭)
// 귤은 나무마다 따로 만들면 수백 개가 되어 느려지므로, 위치만 모아뒀다가
// 마지막에 InstancedMesh(같은 모양을 한 번에 여러 개 그리는 방식)로 한꺼번에 그립니다.
const citrusLeafMat = new THREE.MeshLambertMaterial({ color: 0x336b33, flatShading: true });
const fruitSpots = [];

// 나무 한 그루도 줄기 1 + 잎덩이 5 = 메시 6개입니다. 500그루면 3000개가 되어 화면이 멈춥니다.
// 그래서 나무를 만들 때는 모양을 바로 만들지 않고 "어디에 어떤 크기로 놓을지"만 아래 두 목록에
// 적어두었다가, 밭을 다 심은 뒤 InstancedMesh 두 개로 한꺼번에 그립니다 (그리기 명령 2번으로 끝).
const trunkSpots = [];
const leafSpots = [];

function buildTangerineTree(x, y, z) {
  const treeRotY = Math.random() * Math.PI * 2;

  const trunkH = 1.4 + Math.random() * 0.4;
  trunkSpots.push({ x, y, z, h: trunkH, rot: treeRotY });

  // 잎: 팽나무와 달리 둥글고 낮게 퍼지는 모양
  // 잎덩이 5개의 위치·반지름을 먼저 기억해둡니다 — 귤은 반드시 이 잎덩이들의 "실제 겉면"에만 심습니다.
  // (예전엔 잎과 상관없는 이상적인 구 표면에 귤을 흩뿌려서, 잎이 없는 빈 공간에 귤이 붕 떠 보이거나
  //  반대로 잎 속에 파묻혀 안 보이는 자리에도 귤이 "있는 척"하는 경우가 있었습니다)
  const R = 1.45 + Math.random() * 0.3;
  const cy = trunkH + R * 0.5;
  const rotC = Math.cos(treeRotY), rotS = Math.sin(treeRotY);
  const leafBlobs = [];
  for (let i = 0; i < 5; i++) {
    const br = R * (0.6 + Math.random() * 0.3);
    const bx = (Math.random() - 0.5) * R * 1.15;
    const by = cy + (Math.random() - 0.5) * R * 0.45;
    const bz = (Math.random() - 0.5) * R * 1.15;
    leafBlobs.push({ x: bx, y: by, z: bz, r: br });
    leafSpots.push({
      x: x + bx * rotC + bz * rotS,   // 나무 회전만큼 돌려서 월드 좌표로
      y: y + by,
      z: z - bx * rotS + bz * rotC,
      r: br,
    });
  }

  // 귤: 잎덩이 중 하나를 골라 그 겉면(살짝 바깥쪽)에만 심습니다 → 눈에 보이는 잎이 있는 자리에만 귤이 생깁니다
  // 나무 전체가 랜덤 각도(treeRotY)로 돌아가 있으므로, 잎덩이의 로컬 좌표를 그 각도만큼
  // 직접 회전시켜야 실제로 화면에 그려지는 잎의 월드 위치와 정확히 일치합니다.
  const n = 8 + ((Math.random() * 5) | 0);
  for (let i = 0; i < n; i++) {
    const b = leafBlobs[(Math.random() * leafBlobs.length) | 0];
    const a = Math.random() * Math.PI * 2;
    const p = Math.acos(1 - Math.random() * 1.3);   // 위쪽보다 옆·아래에 더 많이 달리게
    const rr = b.r * (0.94 + Math.random() * 0.1);  // 잎덩이 겉면 반지름 (가로/세로 방향)
    const lx = b.x + Math.sin(p) * Math.cos(a) * rr;   // 잎덩이 로컬 좌표 기준의 귤 위치
    const lz = b.z + Math.sin(p) * Math.sin(a) * rr;
    fruitSpots.push({
      x: x + lx * rotC + lz * rotS,                  // 나무 회전만큼 같이 돌려서 월드 좌표로
      y: y + b.y + Math.cos(p) * rr * 0.78,           // 잎덩이는 세로로만 0.78배 눌려있어서 y에만 곱해줌
      z: z - lx * rotS + lz * rotC,
      s: 0.75 + Math.random() * 0.4,
      picked: false,   // 따 먹으면 true — 인스턴스를 숨기고 다시는 안 딸 수 있게
    });
  }

  obstacles.push({ x, z, r: 0.55, topY: NO_JUMP });
}

// 건물 곁에는 나무를 심지 않습니다 — 걸어다니는 충돌 반경(일부러 좁게 둠)보다
// 건물 지붕이 훨씬 커서, 그 반경만 피하면 나무가 지붕을 뚫고 자라기 때문입니다.
const NO_PLANT = [
  { x: STABLE.x, z: STABLE.z, r: 9 },              // 마구간 (지붕 폭 6m + 잎 반경)
  { x: STABLE.x + 1, z: STABLE.z + 8, r: 9 },      // 마구간 앞마당 — 귤나무에 말이 가리면 안 됩니다
  { x: STABLE.x + 2, z: STABLE.z + 15, r: 7 },     // 마구간으로 걸어오는 길목
  { x: HOUSE.x, z: HOUSE.z, r: 8 },                // 헌집 (그림 폭 8.5m + 뒤채)
  { x: 12, z: -64, r: 12 },                        // 무남이네 (집 + 바다를 보는 앞마당까지)
];
function plantBlocked(x, z) {
  for (const n of NO_PLANT) {
    if (Math.hypot(n.x - x, n.z - z) < n.r) return true;
  }
  return false;
}

for (const f of ORCHARDS) {
  const c = Math.cos(f.rot), s = Math.sin(f.rot);
  for (let i = 0; i < f.cols; i++) {
    for (let j = 0; j < f.rows; j++) {
      const lx = (i - (f.cols - 1) / 2) * f.gap + (Math.random() - 0.5) * 0.9;
      const lz = (j - (f.rows - 1) / 2) * f.gap + (Math.random() - 0.5) * 0.9;
      const x = f.x + lx * c - lz * s;
      const z = f.z + lx * s + lz * c;
      const y = groundHeight(x, z);
      if (y < 1.5) continue;                  // 바닷가 모래밭에는 안 심습니다
      if (plantBlocked(x, z)) continue;       // 마구간·헌집 곁은 비워둡니다
      // 밭담·돌하르방처럼 이미 자리를 차지한 것 위에는 겹쳐 심지 않습니다
      let blocked = false;
      for (const o of obstacles) {
        if (Math.hypot(o.x - x, o.z - z) < o.r + 1.1) { blocked = true; break; }
      }
      if (blocked) continue;
      buildTangerineTree(x, y, z);
    }
  }
}

// 모아둔 줄기·잎덩이·귤을 각각 한 번에 그리기
{
  // 줄기: 높이 1짜리를 기준으로 만들어두고, 나무마다 세로로만 늘려 씁니다
  const trunkGeo = new THREE.CylinderGeometry(0.15, 0.26, 1, 7);
  trunkGeo.translate(0, 0.5, 0);
  const trunkMesh = buildInstanced(trunkGeo, citrusTrunkMat, trunkSpots, (s) => {
    dummy.position.set(s.x, s.y, s.z);
    dummy.rotation.set(0, s.rot, 0);
    dummy.scale.set(1, s.h, 1);
  });
  trunkMesh.castShadow = true;

  // 잎덩이: 반지름 1짜리를 기준으로 만들어두고, 덩이마다 크기를 곱해 씁니다 (세로만 0.78배로 눌림)
  const leafGeo = new THREE.IcosahedronGeometry(1, 1);
  const leafMesh = buildInstanced(leafGeo, citrusLeafMat, leafSpots, (s) => {
    dummy.position.set(s.x, s.y, s.z);
    dummy.rotation.set(0, Math.random() * Math.PI, 0);
    dummy.scale.set(s.r, s.r * 0.78, s.r);
  });
  leafMesh.castShadow = true;
}

let fruitMesh;
{
  const fruit = new THREE.SphereGeometry(0.17, 8, 6);
  fruitMesh = buildInstanced(fruit, tangerineMat, fruitSpots, (s) => {
    dummy.position.set(s.x, s.y, s.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(s.s);
  });
  fruitMesh.castShadow = true;
}

// 귤 하나를 따서 숨긴다 (스케일을 0으로 만드는 방식 — 인스턴스는 개수를 못 줄이므로 이렇게 감춤)
// day를 넘겨주면 "딴 날"을 기록합니다 — 야생 귤은 1년(FRUIT_REGROW_DAYS) 뒤에 그 자리에 다시 열립니다.
function hideFruit(i, day) {
  const s = fruitSpots[i];
  s.picked = true;
  if (day !== undefined) s.pickedDay = day;   // 플레이어가 딴 것만 날짜를 남깁니다 (개간으로 지운 건 −1로 둠)
  dummy.position.set(s.x, s.y, s.z);
  dummy.rotation.set(0, 0, 0);
  dummy.scale.setScalar(0);
  dummy.updateMatrix();
  fruitMesh.setMatrixAt(i, dummy.matrix);
  fruitMesh.instanceMatrix.needsUpdate = true;
}
// 다시 열린 귤을 도로 보이게 (딴 지 1년 지났을 때)
function showFruit(i) {
  const s = fruitSpots[i];
  s.picked = false;
  s.pickedDay = -1;
  dummy.position.set(s.x, s.y, s.z);
  dummy.rotation.set(0, 0, 0);
  dummy.scale.setScalar(s.s);
  dummy.updateMatrix();
  fruitMesh.setMatrixAt(i, dummy.matrix);
  fruitMesh.instanceMatrix.needsUpdate = true;
}
const FRUIT_REGROW_DAYS = 365;   // 야생 귤나무는 1년에 한 번 열립니다 (제철 과일)
// 자정마다 — 딴 지 1년이 지난 귤을 그 자리에 다시 열어줍니다
function regrowFruits() {
  for (let i = 0; i < fruitSpots.length; i++) {
    const s = fruitSpots[i];
    if (!s.picked || s.pickedDay === undefined || s.pickedDay < 0) continue;   // 개간으로 지운 건 안 되살림
    if (dayCount - s.pickedDay >= FRUIT_REGROW_DAYS) showFruit(i);
  }
}

// ---------- 8-3b. 농지 (이장님 땅) ----------
// 처음엔 갈아엎어 놓은 맨흙뿐입니다. 밭 앞 팻말에 년세가 적혀 있고,
// 빌리고 나서 씨앗을 심어야 뭐라도 자랍니다.
// 자리(spots)는 밭마다 미리 잡아 두고, 무엇을 심었는지에 따라 다른 그림을 그 자리에 세웁니다.
const FARM_SOIL_MAT = new THREE.MeshLambertMaterial({ color: 0x7d6247 });
const farmSpots = [];              // 모든 농지의 포기 자리를 한 줄로 모은 것
{
  for (const f of FARMS) {
    const c = Math.cos(f.rot), s = Math.sin(f.rot);
    // 밭 하나에 고랑 12줄, 줄마다 19포기 — 촘촘해야 들꽃밭이 아니라 밭으로 보입니다
    for (let r = 0; r < 12; r++) {
      for (let k = 0; k < 19; k++) {
        const lx = (r - 5.5) * 2.1 + (Math.random() - 0.5) * 0.35;
        const lz = (k - 9) * 1.28 + (Math.random() - 0.5) * 0.3;
        const x = f.x + lx * c - lz * s;
        const z = f.z + lx * s + lz * c;
        const y = groundHeight(x, z);
        if (y < 1.5) continue;
        let blocked = false;
        for (const o of obstacles) {
          if (Math.hypot(o.x - x, o.z - z) < o.r + 0.7) { blocked = true; break; }
        }
        if (blocked) continue;
        const spot = { x, y, z, rot: Math.random() * Math.PI, s: 0.9 + Math.random() * 0.3, farm: f };
        spot.i = farmSpots.length;
        farmSpots.push(spot);
        f.spots.push(spot);
      }
    }
    // 갈아엎은 맨흙 — 밭 넓이만큼 흙빛 바닥을 깝니다.
    // 비탈에 걸친 밭도 있어서, 평평한 판을 얹으면 땅을 뚫고 나옵니다.
    // 그래서 판을 잘게 나눠 꼭짓점마다 그 자리의 땅 높이를 넣어 지형을 따라 휘게 합니다.
    // 칸을 잘게 나눠야 굽은 땅을 제대로 따라갑니다.
    // 성글게 나누면 두 꼭짓점 사이에서 땅이 판 위로 솟아, 밭이 대각선으로 잘려 보입니다.
    const soilGeo = new THREE.PlaneGeometry(f.w - 1.5, f.h - 1.5, 30, 30);
    soilGeo.rotateX(-Math.PI / 2);
    {
      const pos = soilGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const lx = pos.getX(i), lz = pos.getZ(i);
        // ※ 여기서 쓰는 회전은 three.js가 rotation.y로 실제로 돌리는 방향과 같아야 합니다.
        //   (x' = x·cos + z·sin, z' = -x·sin + z·cos)
        //   예전에는 부호가 반대라, 24미터짜리 밭의 가장자리가 2미터쯤 어긋난 자리의
        //   땅 높이를 깔았습니다. 그래서 밭 한쪽이 땅에 파묻혀 대각선으로 잘려 보였습니다.
        const wx = f.x + lx * c + lz * s;
        const wz = f.z - lx * s + lz * c;
        // 그려진 땅(메시) 위로 깔아야 네모반듯하게 보입니다 — groundHeight로 깔면 잘립니다
        pos.setY(i, meshGroundHeight(wx, wz) + 0.10);
      }
      // 법선을 모두 위로 세웁니다 — 굽은 땅에서도 흙빛이 고르게 보입니다
      normalsUp(soilGeo);
    }
    const soil = new THREE.Mesh(soilGeo, FARM_SOIL_MAT);
    soil.position.set(f.x, 0, f.z);
    soil.rotation.y = f.rot;
    soil.receiveShadow = true;
    scene.add(soil);
    f.soil = soil;
  }
}

// 갈아엎었으니 밭 안에 있던 풀·꽃·바위는 걷어냅니다.
// 심을 때 자리마다 걸러내긴 했지만, 풀과 유채는 한 자리에 여러 포기가 뭉쳐 자라서
// 뭉텅이의 중심만 밭 밖이면 나머지가 밭 안으로 넘어와 있습니다.
{
  const m = new THREE.Matrix4(), v = new THREE.Vector3();
  scene.traverse((o) => {
    if (!o.isInstancedMesh) return;
    let changed = false;
    for (let i = 0; i < o.count; i++) {
      o.getMatrixAt(i, m);
      v.setFromMatrixPosition(m);
      if (!inFarmPlot(v.x, v.z, -0.4)) continue;
      m.makeScale(0, 0, 0);
      o.setMatrixAt(i, m);
      changed = true;
    }
    if (changed) o.instanceMatrix.needsUpdate = true;
  });
}

// ----- 밭 앞 팻말 -----
// 누구 땅인지, 무엇이 자라는지, 언제 거둘 수 있는지가 여기에 적힙니다.
const SIGN_MAT_CACHE = [];
function farmSignText(f) {
  if (!f.rented && !f.owned) {
    // 무남이가 팔아넘긴 필지에도 이장님은 똑같은 년세 팻말을 꽂아둡니다.
    // 내 땅이었던 자리에 「이장님 밭 년세 50만원」이 서 있는 것, 그게 이 대목의 아픔입니다.
    return ['이장님 밭', farmName(f), '년세 ' + formatWon(FARM_RENT)];
  }
  if (rentExpired(f)) return ['년세가 끝났어요', farmName(f), '다시 ' + formatWon(FARM_RENT)];
  const head = f.owned ? '루루의 땅' : '루루가 빌린 밭';
  if (!f.crop) return [head, farmName(f), '씨앗을 심으세요'];
  const sd = SEEDS[f.crop];
  const left = sd.days - (dayCount - f.planted);
  return [head, `${farmName(f)} · ${sd.name}`, left > 0 ? left + '일 뒤 수확' : '거둘 때가 됐어요'];
}
function drawFarmSign(f) {
  if (!f.sign) return;
  const TT = window.T || ((s) => s);   // 영어 모드면 팻말 글씨도 번역해서 그립니다
  const lines = farmSignText(f).map(TT);
  const cv = f.sign.userData.canvas;
  const g = cv.getContext('2d');
  g.clearRect(0, 0, 256, 168);
  // 팻말 색으로 밭 신분이 한눈에 갈립니다.
  // 아예 산 땅은 빨간 팻말, 빌린 밭은 초록, 이장님 땅과 년세 끝난 밭은 누런 팻말입니다.
  const mine = (f.owned || f.rented) && !rentExpired(f);
  const st = (f.owned && mine)
    ? { bg: '#fbe7e0', edge: '#b3372b', t1: '#b3372b', t2: '#c25746', t3: '#b3372b' }
    : mine
      ? { bg: '#e4f3d8', edge: '#3f7a34', t1: '#255c22', t2: '#3d7a3a', t3: '#2f7a3a' }
      : { bg: '#e6ddc8', edge: '#7a5636', t1: '#4a3a26', t2: '#6b5a3e', t3: '#c2571d' };
  g.fillStyle = st.bg;
  g.fillRect(0, 0, 256, 168);
  g.strokeStyle = st.edge;
  g.lineWidth = 8; g.strokeRect(4, 4, 248, 160);
  g.textAlign = 'center';
  g.fillStyle = st.t1;
  g.font = 'bold 38px "맑은 고딕", sans-serif';
  g.fillText(lines[0], 128, 54);
  g.font = 'bold 34px "맑은 고딕", sans-serif';
  g.fillStyle = st.t2;
  g.fillText(lines[1], 128, 100);
  g.fillStyle = st.t3;
  g.font = 'bold 30px "맑은 고딕", sans-serif';
  g.fillText(lines[2], 128, 144);
  f.sign.userData.tex.needsUpdate = true;
}
{
  const postMat = new THREE.MeshLambertMaterial({ color: 0x7a5636, flatShading: true });
  for (const f of FARMS) {
    // 팻말은 밭의 남쪽 변 한가운데 — 길에서 다가오면 정면으로 보입니다
    const c = Math.cos(f.rot), s = Math.sin(f.rot);
    const lz = -(f.h / 2) - 1.2;
    const sx = f.x - lz * s, sz = f.z + lz * c;
    const y = groundHeight(sx, sz);
    const g = new THREE.Group();
    g.position.set(sx, y, sz);
    g.rotation.y = f.rot + Math.PI;
    // 기둥은 판 아래에서 끊고 판 뒤로 물립니다 — 판 높이까지 올리면 글씨를 덮습니다
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.15, 0.12), postMat);
    post.position.set(0, 0.575, -0.1);
    post.castShadow = true;
    g.add(post);
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 168;
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.85),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
    board.position.y = 1.55;
    g.add(board);
    g.userData.canvas = cv;
    g.userData.tex = tex;
    scene.add(g);
    f.sign = g;
    f.signPos = { x: sx, z: sz };
    obstacles.push({ x: sx, z: sz, r: 0.35, topY: y + 1.2 });
    drawFarmSign(f);
  }
}

// ----- 작물 그림 -----
// 작물마다 본체(잎·줄기)와 열매를 따로 세웁니다.
// 인스턴스는 모든 자리만큼 미리 만들어 두고, 심지 않은 자리는 크기를 0으로 눌러 감춥니다.
function makeTuft(count, r, h, spread) {
  // 밑동에서 여러 갈래가 부챗살처럼 뻗어 올라오는 잎 다발.
  // three에 지오메트리 합치기 도구가 없어서 손으로 엮습니다.
  const parts = [];
  for (let k = 0; k < count; k++) {
    const blade = new THREE.ConeGeometry(r, h * (0.85 + Math.random() * 0.3), 4);
    blade.translate(0, h / 2, 0);
    blade.rotateZ((Math.random() - 0.5) * spread);
    blade.rotateY((k / count) * Math.PI * 2 + Math.random() * 0.4);
    parts.push(blade);
  }
  const out = new THREE.BufferGeometry();
  let pn = 0;
  parts.forEach((g) => { pn += g.attributes.position.count; });
  const pos = new Float32Array(pn * 3);
  const nor = new Float32Array(pn * 3);
  const uv = new Float32Array(pn * 2);
  const idx = [];
  let vo = 0, po = 0, uo = 0;
  parts.forEach((g) => {
    pos.set(g.attributes.position.array, po);
    nor.set(g.attributes.normal.array, po);
    uv.set(g.attributes.uv.array, uo);
    const gi = g.index.array;
    for (let i = 0; i < gi.length; i++) idx.push(gi[i] + vo);
    vo += g.attributes.position.count;
    po += g.attributes.position.array.length;
    uo += g.attributes.uv.array.length;
  });
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setIndex(idx);
  return out;
}
// 열매(꽃·알)를 한 포기에 여러 개 흩어 놓은 덩어리
function makeCluster(n, r, spreadX, spreadY) {
  const parts = [];
  for (let k = 0; k < n; k++) {
    const b = new THREE.IcosahedronGeometry(r, 0);
    b.translate((Math.random() - 0.5) * spreadX, spreadY + (Math.random() - 0.5) * 0.18,
                (Math.random() - 0.5) * spreadX);
    parts.push(b);
  }
  const out = new THREE.BufferGeometry();
  let pn = 0;
  parts.forEach((g) => { pn += g.attributes.position.count; });
  const pos = new Float32Array(pn * 3);
  const nor = new Float32Array(pn * 3);
  const uv = new Float32Array(pn * 2);
  let po = 0, uo = 0;
  parts.forEach((g) => {
    pos.set(g.attributes.position.array, po);
    nor.set(g.attributes.normal.array, po);
    uv.set(g.attributes.uv.array, uo);
    po += g.attributes.position.array.length;
    uo += g.attributes.uv.array.length;
  });
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return out;
}

const cropMeshes = {};   // 작물키 → { body, fruit }
{
  const leafGreen = 0x3f7a35, teaGreen = 0x2d5f2c, radishLeaf = 0x4e8a3a;
  const shapes = {
    // 메밀 — 가는 줄기 다발에 하얀 꽃이 소복하게
    buckwheat: {
      body: [makeTuft(5, 0.028, 0.62, 0.5), new THREE.MeshLambertMaterial({ color: 0x6b8f4a, flatShading: true })],
      fruit: [makeCluster(7, 0.055, 0.3, 0.62), new THREE.MeshLambertMaterial({ color: 0xf5f2e8, flatShading: true })],
    },
    // 감자 — 낮고 두툼한 초록 덤불. 캐기 전에는 알이 안 보입니다
    potato: {
      body: [makeTuft(7, 0.075, 0.4, 1.1), new THREE.MeshLambertMaterial({ color: leafGreen, flatShading: true })],
      fruit: [makeCluster(3, 0.1, 0.26, 0.06), new THREE.MeshLambertMaterial({ color: 0xc9a165, flatShading: true })],
    },
    // 월동무 — 큼직한 잎에 흰 어깨가 흙 위로 쑥
    radish: {
      body: [makeTuft(6, 0.055, 0.84, 0.8), new THREE.MeshLambertMaterial({ color: radishLeaf, flatShading: true })],
      fruit: [(() => { const g = new THREE.ConeGeometry(0.13, 0.34, 8); g.rotateX(Math.PI); g.translate(0, 0.1, 0); return g; })(),
              new THREE.MeshLambertMaterial({ color: 0xf3f0e4, flatShading: true })],
    },
    // 차나무 — 둥글게 다듬은 낮은 덤불
    tea: {
      body: [(() => { const g = new THREE.IcosahedronGeometry(0.34, 0); g.scale(1.2, 0.72, 1.2); g.translate(0, 0.26, 0); return g; })(),
             new THREE.MeshLambertMaterial({ color: teaGreen, flatShading: true })],
      fruit: [makeCluster(4, 0.05, 0.4, 0.42), new THREE.MeshLambertMaterial({ color: 0x8fc16a, flatShading: true })],
    },
  };
  const hidden = (s) => { dummy.position.set(s.x, s.y, s.z); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(0); };
  for (const key of SEED_ORDER) {
    const sh = shapes[key];
    const body = buildInstanced(sh.body[0], sh.body[1], farmSpots, hidden);
    body.castShadow = true;
    const fruit = buildInstanced(sh.fruit[0], sh.fruit[1], farmSpots, hidden);
    cropMeshes[key] = { body, fruit };
  }
}

// 한 밭의 그림을 지금 상태에 맞춰 다시 세웁니다
function refreshFarm(f) {
  const sd = f.crop ? SEEDS[f.crop] : null;
  const age = sd ? Math.min(1, (dayCount - f.planted) / sd.days) : 0;
  const grown = sd && age >= 1;
  // 자란 정도를 크기로 보여줍니다 — 심은 날은 겨우 싹입니다
  const scale = sd ? 0.25 + age * 0.75 : 0;
  for (const spot of f.spots) {
    for (const key of SEED_ORDER) {
      const mine = key === f.crop;
      const m = cropMeshes[key];
      dummy.position.set(spot.x, spot.y, spot.z);
      dummy.rotation.set(0, spot.rot, 0);
      dummy.scale.setScalar(mine ? scale * spot.s : 0);
      dummy.updateMatrix();
      m.body.setMatrixAt(spot.i, dummy.matrix);
      // 열매는 다 자라야 보입니다 (심자마자 감자가 달려 있으면 이상하니까요)
      dummy.scale.setScalar(mine && grown ? spot.s : 0);
      dummy.updateMatrix();
      m.fruit.setMatrixAt(spot.i, dummy.matrix);
    }
  }
  for (const key of SEED_ORDER) {
    cropMeshes[key].body.instanceMatrix.needsUpdate = true;
    cropMeshes[key].fruit.instanceMatrix.needsUpdate = true;
  }
  // 흙은 늘 보입니다 — 고랑 사이로 흙이 비쳐야 들판이 아니라 밭으로 보입니다
  drawFarmSign(f);
}
function refreshAllFarms() { for (const f of FARMS) refreshFarm(f); }

// ---------- 8-3c. 올레길 — 일터로 이어지는 흙길 ----------
// 제주 올레는 큰길에서 집으로 들어가는 좁은 골목입니다.
// 길이 어디로 나는지는 맨 위(밭 격자와 올레길)에서 이미 정해 뒀습니다.
// 여기서는 그 길을 실제로 깔기만 합니다 — 밟은 흙빛 바닥에, 구간에 따라 양옆 돌담을 세웁니다.
const OLLE_MAT = new THREE.MeshLambertMaterial({ color: 0xa8906a });
{
  // 길바닥은 짧은 판을 이어 붙여 만듭니다.
  // 판을 그냥 수평으로 놓으면 비탈에서 층계처럼 턱이 지므로,
  // 판마다 땅 기울기에 맞춰 눕혀서 비탈을 미끄러지듯 따라가게 합니다.
  const T = new THREE.Vector3(), B = new THREE.Vector3(), N = new THREE.Vector3();
  for (const s of olleSegs) {
    const { x1, z1, x2, z2, w } = s;
    const dx = x2 - x1, dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    const n = Math.max(1, Math.round(len / 1.4));
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      const ax = x1 + dx * t0, az = z1 + dz * t0;
      const bx = x1 + dx * t1, bz = z1 + dz * t1;
      const ay = groundHeight(ax, az), by = groundHeight(bx, bz);
      const flat = Math.hypot(bx - ax, bz - az);
      const slope = Math.hypot(flat, by - ay);        // 비탈을 따라 잰 실제 길이
      T.set(bx - ax, by - ay, bz - az).normalize();   // 길이 나아가는 방향
      B.set(-(bz - az), 0, bx - ax).normalize();      // 길 폭 방향 (늘 수평)
      N.crossVectors(B, T).normalize();               // 길바닥이 바라보는 쪽
      const seg = new THREE.Mesh(new THREE.PlaneGeometry(w, slope + 0.35), OLLE_MAT);
      seg.matrixAutoUpdate = false;
      seg.matrix.makeBasis(B, T, N);
      // 잔디 바로 위에 살짝 얹습니다
      seg.matrix.setPosition((ax + bx) / 2, (ay + by) / 2 + 0.05, (az + bz) / 2);
      seg.receiveShadow = true;
      scene.add(seg);
    }
  }
}
// 8-4. 팽나무 (바람에 한쪽으로 쏠린 제주 들판 나무)
function buildTree(x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.z = (Math.random() - 0.5) * 0.25;   // 바람에 기울어진 느낌

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.42, 3.4, 8),
    new THREE.MeshLambertMaterial({ color: 0x6b513a, flatShading: true })
  );
  trunk.position.y = 1.7;
  trunk.castShadow = true;
  g.add(trunk);

  const leafMat = new THREE.MeshLambertMaterial({ color: 0x3f7a3a, flatShading: true });
  for (let i = 0; i < 6; i++) {
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0 + Math.random() * 0.5, 0), leafMat);
    blob.position.set(
      (Math.random() - 0.5) * 2.6,
      3.3 + Math.random() * 1.0,
      (Math.random() - 0.5) * 2.6
    );
    blob.scale.y = 0.68;
    blob.castShadow = true;
    g.add(blob);
  }
  scene.add(g);
  obstacles.push({ x, z, r: 0.7, topY: NO_JUMP });
}


// 돌담·귤나무·상점 위에 겹쳐 심지 않도록, 이미 뭔가 있는 자리는 건너뜁니다.
// 상점처럼 덩치가 큰 것(o.r이 큰 것) 앞은 더 넓게 비워야 건물이 가려지지 않습니다.
scatter(16, ISLAND_R - 26, 2.5, (x, y, z) => {
  for (const o of obstacles) {
    if (Math.hypot(o.x - x, o.z - z) < o.r + 4.5) return;
  }
  if (plantBlocked(x, z)) return;   // 마구간·헌집 곁은 비워둡니다
  if (pointOnOlle(x, z, 2.5)) return;   // 올레길 위에는 나무를 심지 않습니다
  if (inFarmPlot(x, z, 1.5)) return;    // 갈아엎은 농지 한복판에 나무가 서 있으면 안 됩니다
  buildTree(x, y, z);
});

// ---------- 8-6. 해녀 물질 — 포구와 바닷속 ----------
// 포구는 배를 대는 작은 선착장입니다. 물질의 들고나는 문 역할을 합니다:
// 여기서 F를 누르면 바다로 들어가고, 나올 때도 여기로 올라옵니다.
// 물가에 바짝 붙여 두어야 "여기서 바다로 들어간다"는 게 한눈에 보입니다.
const BULTEOK = PORT;   // 예전 이름 — 코드 곳곳에서 쓰고 있어 그대로 둡니다

// 바닷속 재료들. 포구의 그물 더미에도 쓰므로 먼저 만들어 둡니다.
const kelpMat = new THREE.MeshLambertMaterial({ color: 0x3f6b4a, side: THREE.DoubleSide });
const abaloneMat = new THREE.MeshLambertMaterial({ color: 0x4a5f6b, flatShading: true });
const conchMat = new THREE.MeshLambertMaterial({ color: 0xd9b98c, flatShading: true });

// 8-6a. 포구 — 바다로 뻗은 돌 축대, 계류 기둥, 매어둔 테왁, 그리고 작은 나무배
{
  const y = groundHeight(PORT.x, PORT.z);
  const deckMat = new THREE.MeshLambertMaterial({ color: 0x9a9689, flatShading: true });

  // 바다 쪽으로 뻗어나간 돌 축대(부두).
  // 윗면을 물가 땅높이에 딱 맞춰야 잔디밭에서 그대로 이어져 보입니다.
  // (예전에는 축대를 바다 표면에 맞춰 놓아서, 잔디밭보다 3미터 아래로 파묻혀 보였습니다)
  const DECK_TOP = y;                       // y = 포구 자리의 땅높이
  const DECK_H = DECK_TOP - SEA_Y + 5;       // 물 밑으로 5미터 더 내려가 바닥에 닿게
  const deck = new THREE.Mesh(new THREE.BoxGeometry(5.0, DECK_H, 11), deckMat);
  deck.position.set(PORT.x, DECK_TOP - DECK_H / 2, PORT.z + 5.0);
  deck.castShadow = true; deck.receiveShadow = true;
  scene.add(deck);
  // 축대 옆면을 두른 현무암 — 제주 포구의 거친 돌쌓기
  for (let i = 0; i < 44; i++) {
    const side = i % 2 ? 1 : -1;
    const t = (i / 44) * 11;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), i % 3 ? darkStoneMat : stoneMat);
    rock.position.set(PORT.x + side * 2.5, DECK_TOP - 0.25 - Math.random() * 0.5, PORT.z - 0.5 + t);
    rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    rock.castShadow = true;
    scene.add(rock);
  }
  // 배 매는 기둥 네 개
  [[-1.9, 2.0], [1.9, 2.0], [-1.9, 8.4], [1.9, 8.4]].forEach(([px, pz]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 1.5, 7), citrusTrunkMat);
    post.position.set(PORT.x + px, DECK_TOP + 0.75, PORT.z + pz);
    post.castShadow = true;
    scene.add(post);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 6), shopRopeMat);
    cap.position.set(PORT.x + px, DECK_TOP + 1.5, PORT.z + pz);
    scene.add(cap);
  });
  // 물에 띄워둔 테왁(해녀가 붙잡고 뜨는 주황 부표) — 물질하는 곳임을 알려주는 표식
  [[-4.0, 7.0], [4.2, 9.0], [-3.0, 11.5], [4.6, 4.5]].forEach(([px, pz]) => {
    const tewak = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 10),
      new THREE.MeshLambertMaterial({ color: 0xf2a03c }));
    tewak.position.set(PORT.x + px, SEA_Y + 0.2, PORT.z + pz);
    tewak.scale.y = 0.8;
    tewak.castShadow = true;
    scene.add(tewak);
  });
  // 축대 옆에 매어둔 작은 나무배
  {
    const boat = new THREE.Group();
    boat.position.set(PORT.x + 3.6, SEA_Y - 0.1, PORT.z + 6.0);
    boat.rotation.y = 0.22;
    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 3.8), citrusTrunkMat);
    hull.castShadow = true;
    boat.add(hull);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.5, 3.3), shopDarkMat);
    inner.position.y = 0.28;
    boat.add(inner);
    scene.add(boat);
  }
  // 축대 위에 쌓아둔 그물 더미
  const netPile = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), kelpMat);
  netPile.position.set(PORT.x - 1.4, DECK_TOP + 0.2, PORT.z + 2.4);
  netPile.scale.y = 0.5;
  netPile.castShadow = true;
  scene.add(netPile);

  // 「해녀 물질」 나무 푯말 — 밝은 바탕에 큼직한 글씨로, 멀리서도 또렷하게
  const signC = document.createElement('canvas');
  signC.width = 320; signC.height = 110;
  {
    const g2 = signC.getContext('2d');
    g2.fillStyle = '#f0e4c8'; g2.fillRect(0, 0, 320, 110);
    g2.strokeStyle = '#8a6038'; g2.lineWidth = 8; g2.strokeRect(4, 4, 312, 102);
    g2.fillStyle = '#2b1a0c'; g2.textAlign = 'center';
    g2.font = '900 44px "맑은 고딕", Malgun Gothic, sans-serif';
    signText(g2, '해녀물질', 160, 70, 300);
  }
  const signTex = new THREE.CanvasTexture(signC);
  signTex.colorSpace = THREE.SRGBColorSpace;
  // 기둥은 판 아래까지만 (예전엔 판을 뚫고 올라가 글씨를 가렸습니다)
  const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.25, 6), citrusTrunkMat);
  signPost.position.set(PORT.x - 3.6, y + 1.125, PORT.z - 1.4);
  signPost.castShadow = true;
  scene.add(signPost);
  const signBoard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.85, 0.1),
    new THREE.MeshLambertMaterial({ map: signTex }));
  signBoard.position.set(PORT.x - 3.6, y + 2.65, PORT.z - 1.4);
  signBoard.rotation.y = 0.3;
  signBoard.castShadow = true;
  scene.add(signBoard);
}

// 8-6b. 바닷속 — 바위, 미역, 그리고 전복·소라
// (해저 바닥은 따로 만들지 않습니다. 지형 함수가 이 자리를 이미 우묵하게 파냈습니다)

// 채집물 한 종류의 설명. 값이 비쌀수록 드물게 놓습니다.
// 물질장에 모두 133개를 깔되, 절반(66개)은 가장 싼 미역입니다.
// 나머지 절반 67개는 값에 반비례해 나눕니다 — 쌀수록 많이 깔립니다.
//   1/1만 : 1/2만 : 1/3만 : 1/5만 = 소라 33 · 전복 17 · 해삼 11 · 문어 6
// (2026-08-09 개편: 예전에는 미역이 86개로 전체의 65%를 차지해 물질이 미역 줍기였습니다)
const CATCH_KINDS = {
  octopus:  { name: '문어', price: 50000, count: 6 },
  cucumber: { name: '해삼', price: 30000, count: 11 },
  abalone:  { name: '전복', price: 20000, count: 17 },
  conch:    { name: '소라', price: 10000, count: 33 },
  kelp:     { name: '미역', price: 1000,  count: 66 },
};
// ----- 여러 조각을 한 덩어리 기하로 합치기 -----
// 한 번에 여러 개를 그리는 방식(InstancedMesh)은 기하 하나·재질 하나만 받습니다.
// 그래서 머리·다리·눈처럼 여러 부품으로 된 모형은 미리 하나로 합치고,
// 부품마다 다른 색은 꼭짓점 색으로 심어둡니다.
function mergeParts(parts) {
  const P = [], N = [], C = [];
  const m = new THREE.Matrix4(), nm = new THREE.Matrix3(), col = new THREE.Color();
  const q = new THREE.Quaternion(), e = new THREE.Euler();
  const vp = new THREE.Vector3(), vs = new THREE.Vector3(), v = new THREE.Vector3(), n = new THREE.Vector3();
  for (const p of parts) {
    const g = p.geo.index ? p.geo.toNonIndexed() : p.geo;
    vp.set(...(p.pos || [0, 0, 0]));
    e.set(...(p.rot || [0, 0, 0]));
    vs.set(...(p.scale || [1, 1, 1]));
    m.compose(vp, q.setFromEuler(e), vs);
    nm.getNormalMatrix(m);
    col.set(p.color);
    const pa = g.attributes.position, na = g.attributes.normal;
    for (let i = 0; i < pa.count; i++) {
      v.fromBufferAttribute(pa, i).applyMatrix4(m);
      P.push(v.x, v.y, v.z);
      n.fromBufferAttribute(na, i).applyMatrix3(nm).normalize();
      N.push(n.x, n.y, n.z);
      C.push(col.r, col.g, col.b);
    }
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  out.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  return out;
}

// ----- 바닷속 해산물 다섯 가지 (저폴리 3D) -----
// 예전에 쓰던 그림을 레퍼런스 삼아 모양과 색을 땄습니다.
// 전부 밑면이 y=0이라, 놓인 자리에 그대로 얹으면 바닥에 딱 붙습니다.

// 문어 — 동그란 머리에 큰 눈, 짧은 다리 여덟 개
function buildOctopus() {
  const SKIN = 0xd9603f, LEG = 0xcb5334;
  const parts = [
    { geo: new THREE.SphereGeometry(0.19, 10, 8), color: SKIN, pos: [0, 0.24, 0], scale: [1, 0.94, 1] },
  ];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    parts.push({ geo: new THREE.CapsuleGeometry(0.042, 0.13, 2, 6), color: LEG,
      pos: [Math.cos(a) * 0.135, 0.085, Math.sin(a) * 0.135],
      rot: [Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45] });
  }
  for (const sx of [-1, 1]) {
    parts.push({ geo: new THREE.SphereGeometry(0.055, 8, 6), color: 0xfdf7ef,
      pos: [sx * 0.072, 0.275, 0.145] });
    parts.push({ geo: new THREE.SphereGeometry(0.03, 6, 5), color: 0x241a16,
      pos: [sx * 0.078, 0.275, 0.185] });
  }
  return mergeParts(parts);
}

// 해삼 — 검붉은 길쭉한 몸에 등에 난 돌기
function buildCucumber() {
  const BODY = 0x6b4a3a, PAP = 0xa8825e;
  const parts = [
    { geo: new THREE.CapsuleGeometry(0.072, 0.26, 3, 8), color: BODY,
      pos: [0, 0.072, 0], rot: [0, 0, Math.PI / 2] },
  ];
  for (let i = 0; i < 7; i++) {
    const t = (i / 6 - 0.5);
    parts.push({ geo: new THREE.ConeGeometry(0.03, 0.07, 5), color: PAP,
      pos: [t * 0.30, 0.132, (i % 2 ? 0.022 : -0.022)] });
  }
  return mergeParts(parts);
}

// 전복 — 납작한 껍데기 아래로 자개빛 속살이 비죽 나옵니다
function buildAbalone() {
  const SHELL = 0x4a5f6b, PEARL = 0xe2d2b2;
  const parts = [
    { geo: new THREE.SphereGeometry(0.175, 12, 8), color: PEARL, pos: [0, 0.05, 0], scale: [1, 0.26, 0.8] },
    { geo: new THREE.SphereGeometry(0.2, 12, 8),   color: SHELL, pos: [0, 0.075, 0], scale: [1, 0.34, 0.78] },
  ];
  for (let i = 0; i < 4; i++) {   // 껍데기 등에 난 숨구멍 줄
    parts.push({ geo: new THREE.SphereGeometry(0.021, 5, 4), color: 0x33454d,
      pos: [-0.09 + i * 0.055, 0.135, -0.05] });
  }
  return mergeParts(parts);
}

// 소라 — 뾰족뾰족한 나선 껍데기
function buildConch() {
  const SHELL = 0x5a5348, SPIKE = 0x6f6757;
  const whorl = [[0.125, 0.105, 0], [0.098, 0.19, 0.014], [0.072, 0.255, 0.024], [0.046, 0.305, 0.03]];
  const parts = whorl.map(([r, y, dx]) =>
    ({ geo: new THREE.SphereGeometry(r, 9, 7), color: SHELL, pos: [dx, y, 0] }));
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    parts.push({ geo: new THREE.ConeGeometry(0.028, 0.07, 5), color: SPIKE,
      pos: [Math.cos(a) * 0.12, 0.125, Math.sin(a) * 0.12],
      rot: [Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2] });
  }
  parts.push({ geo: new THREE.SphereGeometry(0.075, 8, 6), color: 0xe6dcc4,
    pos: [-0.06, 0.075, 0.055], scale: [0.8, 0.7, 0.55] });   // 벌어진 아가리
  return mergeParts(parts);
}

// 미역 — 잎사귀 여러 장이 한 무더기로
function buildKelpClump() {
  const parts = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    const h = 0.34 + (i % 3) * 0.07;
    const blade = normalsUp(taper(new THREE.PlaneGeometry(0.12, h, 1, 3), h));
    blade.translate(0, h / 2, 0);
    parts.push({ geo: blade, color: i % 2 ? 0x37624a : 0x47765a,
      pos: [Math.cos(a) * 0.05, 0, Math.sin(a) * 0.05],
      rot: [Math.sin(a) * 0.5, a, -Math.cos(a) * 0.5] });
  }
  return mergeParts(parts);
}

const catchSpots = [];        // { x, y, z, kind, picked, pickedDay }
const catchMeshes = {};       // 종류별 InstancedMesh
const seaRocks = [];          // 바닷속 바위 자리 — 전복이 다시 붙을 때 여기서 고릅니다
// 딴 자리는 3일 뒤에 바다 아무 데나 새로 생깁니다 (사용자 지정, 2026-08-11 일주일→3일).
// 기억은 이번 판에서만 합니다 — 게임을 다시 열면 바다는 가득 차 있습니다.
const CATCH_REGROW_DAYS = 3;

{
  // 바위 무더기 — 전복이 붙어 살 자리이자 물속 지형지물
  const rockSpots = seaRocks;
  for (let i = 0; i < 70; i++) {
    const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * DIVE.r;
    const x = DIVE.x + Math.cos(a) * rr, z = DIVE.z + Math.sin(a) * rr;
    const s = 0.7 + Math.random() * 1.5;
    // 포구 축대 끝 앞은 비워둡니다 — 얕은 데 큰 바위가 서면 수면 위로 머리를 내밀어
    // 축대 길과 입수 자리를 가로막습니다 (실제로 길을 막고 서 있었습니다)
    if (x > -5 && x < 5 && z < 108) continue;
    rockSpots.push({ x, y: seabedHeight(x, z), z, s });
  }
  const rockMesh = buildInstanced(new THREE.DodecahedronGeometry(1, 0), darkStoneMat, rockSpots, (s) => {
    dummy.position.set(s.x, s.y + s.s * 0.35, s.z);
    dummy.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    dummy.scale.setScalar(s.s);
  });
  rockMesh.castShadow = true;
  rockMesh.receiveShadow = true;

  // 미역 숲 — 물살에 흔들리도록 풀과 같은 바람 재질을 씁니다.
  // 판 한 장만 세우면 옆에서 볼 때 종잇장처럼 납작해 보이므로, 십자로 두 장을 겹칩니다.
  const kelpSpots = [];
  for (let i = 0; i < 380; i++) {
    const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * DIVE.r;
    const x = DIVE.x + Math.cos(a) * rr, z = DIVE.z + Math.sin(a) * rr;
    const h = 1.4 + Math.random() * 1.8, ry = Math.random() * Math.PI;
    // 축대 끝 앞 얕은 구역은 비웁니다 — 바위처럼 미역도 여기서는 수면 위로 삐져나옵니다
    if (x > -5 && x < 5 && z < 108) continue;
    kelpSpots.push([x, seabedHeight(x, z), z, h, ry]);
  }
  const blade = normalsUp(new THREE.PlaneGeometry(0.34, 1, 1, 4));
  blade.translate(0, 0.5, 0);
  const kelpWindMat = makeWindMaterial(0x37624a);
  for (const turn of [0, Math.PI / 2]) {
    buildInstanced(blade, kelpWindMat, kelpSpots, (s) => {
      dummy.position.set(s[0], s[1], s[2]);
      dummy.rotation.set(0, s[4] + turn, 0);
      dummy.scale.set(1, s[3], 1);
    });
  }

  // 채집물 놓기 — 전복은 바위에, 소라와 미역은 모래바닥에
  for (const [kind, info] of Object.entries(CATCH_KINDS)) {
    for (let i = 0; i < info.count; i++) {
      let x, z, y;
      if (kind === 'abalone') {
        const r = rockSpots[(Math.random() * rockSpots.length) | 0];
        const a = Math.random() * Math.PI * 2;
        x = r.x + Math.cos(a) * r.s * 0.8;
        z = r.z + Math.sin(a) * r.s * 0.8;
        y = r.y + r.s * 0.45;
      } else {
        // 축대 끝 앞 얕은 구역에 걸리면 자리를 다시 뽑습니다 (채집물 개수는 지켜야 하므로)
        do {
          const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * (DIVE.r - 2);
          x = DIVE.x + Math.cos(a) * rr;
          z = DIVE.z + Math.sin(a) * rr;
        } while (x > -5 && x < 5 && z < 108);
        y = seabedHeight(x, z) + 0.12;
      }
      catchSpots.push({ x, y, z, kind, picked: false });
    }
  }
  // 종류별로 한 번에 그리기. 인스턴스 번호와 catchSpots 번호를 맞춰두어야 딸 때 숨길 수 있습니다.
  // 예전에는 그림 한 장을 판에 붙여 세웠는데, 물속을 돌며 보면 종잇장이 빙글 도는 게 보였습니다.
  // 이제 다섯 가지 모두 저폴리 3D로 빚습니다 (그림을 레퍼런스 삼아 모양과 색을 땄습니다).
  const CATCH_GEO = { octopus: buildOctopus(), cucumber: buildCucumber(),
    abalone: buildAbalone(), conch: buildConch(), kelp: buildKelpClump() };
  const catchMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true,
    side: THREE.DoubleSide });   // 미역 잎이 판이라 뒷면도 보여야 합니다
  for (const kind of Object.keys(CATCH_KINDS)) {
    const mine = catchSpots.map((s, i) => ({ s, i })).filter((o) => o.s.kind === kind);
    const m = new THREE.InstancedMesh(CATCH_GEO[kind], catchMat, mine.length);
    mine.forEach((o, j) => {
      o.s.slot = j;
      dummy.position.set(o.s.x, o.s.y, o.s.z);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);   // 아무 방향이나 보고 놓입니다
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      m.setMatrixAt(j, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    m.frustumCulled = false;
    m.castShadow = true;
    scene.add(m);
    catchMeshes[kind] = m;
  }
}

// ---------- 9. 구름과 나비 ----------
const clouds = [];
{
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.92, fog: false });
  for (let i = 0; i < 16; i++) {
    const g = new THREE.Group();
    const n = 4 + ((Math.random() * 4) | 0);
    for (let j = 0; j < n; j++) {
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(4 + Math.random() * 4, 1), cloudMat);
      puff.position.set((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 10);
      puff.scale.y = 0.55;
      g.add(puff);
    }
    g.position.set((Math.random() - 0.5) * 500, 55 + Math.random() * 35, (Math.random() - 0.5) * 500);
    scene.add(g);
    clouds.push(g);
  }
}

const butterflies = [];
{
  const wingGeo = new THREE.PlaneGeometry(0.3, 0.22);
  for (let i = 0; i < 14; i++) {
    const mat = new THREE.MeshLambertMaterial({
      color: Math.random() < 0.5 ? 0xfff3b0 : 0xffd0e0,
      side: THREE.DoubleSide,
    });
    const g = new THREE.Group();
    const wl = new THREE.Mesh(wingGeo, mat); wl.position.x = -0.15; g.add(wl);
    const wr = new THREE.Mesh(wingGeo, mat); wr.position.x = 0.15; g.add(wr);
    g.userData = {
      wl, wr,
      cx: (Math.random() - 0.5) * 120,
      cz: (Math.random() - 0.5) * 120,
      rad: 4 + Math.random() * 10,
      spd: 0.4 + Math.random() * 0.5,
      off: Math.random() * 10,
    };
    scene.add(g);
    butterflies.push(g);
  }
}

// ---------- 10. 루루 만들기 ----------
const CREAM = new THREE.MeshLambertMaterial({ color: 0xf6ebd8 });
const ORANGE = new THREE.MeshLambertMaterial({ color: 0xe09a52 });
const PINK = new THREE.MeshLambertMaterial({ color: 0xef9aa6 });
const DARK = new THREE.MeshLambertMaterial({ color: 0x2b2622 });
const WHITE = new THREE.MeshBasicMaterial({ color: 0xffffff });

const lulu = new THREE.Group();          // 월드 위치 / 바라보는 방향
const luluBody = new THREE.Group();      // 걸을 때 위아래 흔들림, 앉는 자세
lulu.add(luluBody);
scene.add(lulu);

function part(geo, mat, x, y, z, parent) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  (parent || luluBody).add(m);
  return m;
}

// 몸통 (+Z 방향이 루루의 앞쪽입니다)
const torso = part(new THREE.CapsuleGeometry(0.36, 0.62, 6, 14), CREAM, 0, 0.74, 0);
torso.rotation.x = Math.PI / 2;

// 등에 있는 주황 줄무늬
for (let i = 0; i < 3; i++) {
  const s = part(new THREE.SphereGeometry(0.15, 10, 8), ORANGE, 0, 1.02, 0.24 - i * 0.26);
  s.scale.set(1.5, 0.35, 0.55);
}

// 머리
const head = new THREE.Group();
head.position.set(0, 1.04, 0.6);
luluBody.add(head);
part(new THREE.SphereGeometry(0.34, 16, 14), CREAM, 0, 0, 0, head);
part(new THREE.SphereGeometry(0.3, 14, 12), ORANGE, 0, 0.14, -0.06, head).scale.set(1.02, 0.62, 0.9); // 머리 위 주황 무늬
part(new THREE.SphereGeometry(0.2, 12, 10), CREAM, 0, -0.09, 0.26, head).scale.set(1.25, 0.85, 1);    // 주둥이
part(new THREE.SphereGeometry(0.055, 8, 6), PINK, 0, -0.03, 0.41, head);                              // 코

// 귀 (겉 + 안쪽 분홍)
[-1, 1].forEach((side) => {
  const ear = part(new THREE.ConeGeometry(0.16, 0.3, 5), ORANGE, side * 0.19, 0.32, -0.02, head);
  ear.rotation.set(-0.2, 0, side * 0.28);
  part(new THREE.ConeGeometry(0.09, 0.2, 5), PINK, 0, -0.01, 0.06, ear);
});

// 눈
[-1, 1].forEach((side) => {
  const eye = part(new THREE.SphereGeometry(0.075, 10, 8), DARK, side * 0.15, 0.05, 0.28, head);
  part(new THREE.SphereGeometry(0.028, 6, 5), WHITE, side * 0.02, 0.03, 0.06, eye);
});

// 다리 4개 (엉덩이/어깨에 회전축을 두고 앞뒤로 흔듭니다)
const legs = [];
[[-0.21, 0.4], [0.21, 0.4], [-0.21, -0.36], [0.21, -0.36]].forEach(([lx, lz]) => {
  const pivot = new THREE.Group();
  pivot.position.set(lx, 0.52, lz);
  luluBody.add(pivot);
  const leg = part(new THREE.CapsuleGeometry(0.1, 0.26, 4, 8), CREAM, 0, -0.2, 0, pivot);
  part(new THREE.SphereGeometry(0.12, 10, 8), CREAM, 0, -0.19, 0.03, leg).scale.set(1, 0.75, 1.2); // 발
  legs.push(pivot);
});

// 꼬리 (마디를 이어 붙여 흔들리게)
const tailSegs = [];
{
  let parent = luluBody;
  for (let i = 0; i < 6; i++) {
    const seg = new THREE.Group();
    seg.position.set(0, i === 0 ? 0.92 : 0, i === 0 ? -0.52 : -0.19);
    parent.add(seg);
    part(new THREE.CapsuleGeometry(0.095 - i * 0.008, 0.14, 4, 8), i >= 4 ? ORANGE : CREAM, 0, 0, -0.09, seg)
      .rotation.x = Math.PI / 2;
    tailSegs.push(seg);
    parent = seg;
  }
}

// ---------- 10-2. 그림으로 된 루루 (참고 영상에서 뽑은 스프라이트) ----------
// 3D 입체 대신, 그림 한 장을 세워두고 항상 카메라 쪽을 보게 돌립니다.
// (종이 인형을 세워둔 것과 같은 방식이고, 2D 캐릭터를 3D 배경에 넣을 때 흔히 쓰는 방법입니다)
const spriteLulu = new THREE.Group();      // 위치 + 카메라 쪽으로 돌아가는 회전
const spriteBoard = new THREE.Group();     // 걸을 때 위아래로 통통 튀는 부분
spriteLulu.add(spriteBoard);
scene.add(spriteLulu);

let spriteCard = null;                     // 그림이 붙은 판
let spriteBlob = null;                     // 발밑 그림자
const SPRITE_H = 1.5;                      // 화면에 보이는 루루 키(월드 단위)
let mayorGroup = null, mayorCard = null;   // 이장님 (상점·택배사를 오가는 NPC)
let ponyCard = null;                       // 조랑말 (웃는 평소 / 우는 배고픔 — 경마 영상에서 오려낸 그림)
let salePonyCard = null;                   // 팔려고 나온 새 조랑말 (마구간이 비었을 때만 상점 앞에 섭니다)
const PONY_H = 2.3;                        // 조랑말 키 (미터) — 루루(1.73m)보다 확실히 크게
let halmangCard = null;                    // 해녀 할망 (포구 옆에 앉아 있는 흰 고양이 할머니)
const HALMANG_H = 1.7;
const MAYOR_H = 1.9;                       // 이장님 키 — 어른이라 루루보다 큼직합니다

// assets/farmcat/ 스프라이트 시트. 한 장에 여러 칸이 가로로 이어붙어 있습니다.
// 칸 높이는 전부 256이고 위아래 8px이 여백이라, 캐릭터는 240px, 발바닥은 아래에서 8px 지점.
const CELL_H = 256, CELL_PAD = 8;
const SHEETS = {};

// stand = 멈췄을 때 쓸 칸 (두 발이 가장 모인 자세), leap = 점프 중에 쓸 칸 (다리가 가장 벌어진 자세)
function loadSheet(key, file, frames, frameW, stand, leap) {
  const t = loadTexture('../assets/farmcat/' + file);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.generateMipmaps = false;               // 칸 경계에서 옆 칸 색이 번지는 것을 막습니다
  t.minFilter = THREE.LinearFilter;
  t.repeat.set(1 / frames, 1);             // 가로로 1/frames 만큼만 잘라 보여줍니다
  SHEETS[key] = { tex: t, frames, frameW, stand, leap };
}

// 그림 한 칸을 골라 보여주기
function setCell(sheet, i) {
  sheet.tex.offset.x = (((i % sheet.frames) + sheet.frames) % sheet.frames) / sheet.frames;
}

// 1→N→1 로 갔다 되돌아오는 번호 (대기·만세처럼 주기가 없는 동작용)
function pingpong(i, n) {
  const m = (n - 1) * 2;
  const k = ((i % m) + m) % m;
  return k < n ? k : m - k;
}

if (CAN_USE_IMAGES) {
  loadSheet('idle',      'idle_front.webp', 8,  212);          // 서 있기 (정면)
  loadSheet('walkSide',  'walk_side.webp',  10, 208, 6, 8);    // 걷기 (옆모습, 원본은 왼쪽을 봄)
  loadSheet('walkBack',  'walk_back.webp',  10, 195, 3, 4);    // 걷기 (뒷모습)
  loadSheet('walkFront', 'walk_front.webp', 10, 198, 4, 5);    // 걷기 (카메라를 마주 보고 다가올 때)
  loadSheet('cheer',     'cheer.webp',      8,  192);          // 만세 (카메라를 보고 점프할 때)
  loadSheet('sleep',     'sleep.webp',      8,  299);          // 낮잠 (오래 가만히 있으면)
  loadSheet('harvest',   'harvest.webp',   10,  181);          // 감귤 따기 (F키로 딸 때, 한 번만 재생)
  loadSheet('pullSide',  'pull_side.webp', 10,  255);          // 끈 없이 상자를 몸으로 밀어 끌 때 (옆모습, 원본은 왼쪽을 봄)
  // 해녀 물질 — 헤엄·둥둥·수면은 영상에서 뽑아 8칸씩이라 훨씬 부드럽게 움직입니다
  loadSheet('diveSwim',  'dive_swim.webp?v=2',  8,  259);          // 물속 활공 (옆모습, 원본은 왼쪽을 봄)
  loadSheet('diveIdle',  'dive_idle.webp?v=2',  8,  180);          // 물속에 가만히 떠 있기 (정면)
  loadSheet('diveFloat', 'dive_float.webp?v=2', 8,  180);          // 수면에 떠서 숨 고르기 — 입수 첫 모습 (직접 뽑으신 영상)
  loadSheet('divePick',  'dive_pick.webp',  6,  190);          // 전복·소라를 딸 때 (한 번만 재생)
  loadSheet('diveUp',    'dive_up.webp',    8,  165);          // 수면으로 떠오를 때 (직접 뽑으신 영상)
  loadSheet('diveDown',  'dive_down.webp?v=2',  8,  137);          // 아래로 잠수할 때 (직접 뽑으신 영상에서 변환)
  loadSheet('ponyHappy', 'pony_happy.webp', 8,  128);          // 조랑말 — 웃는 평소 모습 (경마 1등 영상에서)
  loadSheet('ponySad',   'pony_sad.webp',   8,  227);          // 조랑말 — 굶어서 우는 모습 (경마 꼴등 영상에서)
  loadSheet('halmang',   'halmang.webp',    8,  185);          // 해녀 할망 — 포구 옆에 앉아 같은 말만 되뇌입니다
  loadSheet('wetsuitLand', 'wetsuit_land.webp', 5, 204);       // 잠수복 차림 서 있기 (해녀 시트에서: 뒤0·뒤1·옆2·옆3·정면4)
  // 해녀 차림으로 뭍을 걷는 모습 — 태왁과 망사리를 들고 갑니다 (직접 뽑으신 영상 세 편).
  // 다섯 번째 값은 "멈춰 섰을 때 쓸 칸" — 두 발이 가장 모인 컷을 골랐습니다.
  loadSheet('wetsuitSide',  'wetsuit_side.webp',  10, 171, 2);  // 옆모습 (원본은 오른쪽을 봄)
  loadSheet('wetsuitFront', 'wetsuit_front.webp', 10, 174, 0);  // 이쪽으로 걸어올 때
  loadSheet('wetsuitBack',  'wetsuit_back.webp',  10, 132, 8);  // 저쪽으로 걸어갈 때
  // 헌집 고치기 — 망치질(0) · 톱질(1) · 페인트칠(2). 수리 단계에 맞는 칸 하나를 보여줍니다
  loadSheet('fixHouse',  'fix_house.webp',  3,  167);
  // 이장님 (상점과 택배사를 오가는 NPC). 걷기 원본은 루루와 반대로 "오른쪽"을 봅니다
  // ?v=2 — 다리 사이 흰 여백을 지운 새 그림. 주소가 바뀌어야 폰들이 캐시 대신 새로 받습니다
  loadSheet('mayorIdle', 'mayor_idle.webp?v=2', 8,  194);
  loadSheet('mayorWalk', 'mayor_walk.webp?v=2', 8,  202);

  // 판은 1x1 로 만들고, 어느 그림을 쓰느냐에 따라 매 프레임 크기를 바꿉니다.
  // 아래쪽 끝을 기준점으로 옮겨두면 세로로 늘였다 줄여도 발이 땅에서 안 떨어집니다.
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.translate(0, 0.5, 0);

  spriteCard = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({          // 그림 색을 그대로 살리려고 빛 계산을 하지 않는 재질
      map: SHEETS.idle.tex,
      transparent: true,
      alphaTest: 0.08,                     // 거의 투명한 가장자리는 아예 안 그림
    })
  );
  spriteCard.userData.sheet = SHEETS.idle;
  spriteCard.userData.headingRight = false;
  // 칸 높이 전체(256) 중 캐릭터는 240이므로 그만큼 키워야 실제 키가 SPRITE_H가 됩니다
  spriteCard.userData.planeH = SPRITE_H * CELL_H / (CELL_H - CELL_PAD * 2);
  // 칸 아래 여백(8px)만큼 판을 내려서 발바닥이 y=0 에 오게 합니다
  spriteCard.position.y = -(CELL_PAD / CELL_H) * spriteCard.userData.planeH;
  spriteBoard.add(spriteCard);

  // 발밑 그림자 (그림 판은 카메라를 따라 돌기 때문에 진짜 그림자를 쓰면 모양이 계속 변합니다.
  //  그래서 바닥에 타원을 하나 깔아주는 쪽이 더 자연스럽습니다)
  spriteBlob = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 22),
    new THREE.MeshBasicMaterial({ color: 0x1d2b17, transparent: true, opacity: 0.4, depthWrite: false })
  );
  spriteBlob.rotation.x = -Math.PI / 2;
  scene.add(spriteBlob);

  // ----- 이장님 그림판 (루루와 같은 방식의 서 있는 종이 인형) -----
  const mGeo = new THREE.PlaneGeometry(1, 1);
  mGeo.translate(0, 0.5, 0);
  mayorCard = new THREE.Mesh(
    mGeo,
    new THREE.MeshBasicMaterial({ map: SHEETS.mayorIdle.tex, transparent: true, alphaTest: 0.08 })
  );
  mayorCard.userData.planeH = MAYOR_H * CELL_H / (CELL_H - CELL_PAD * 2);
  mayorCard.position.y = -(CELL_PAD / CELL_H) * mayorCard.userData.planeH;
  mayorGroup = new THREE.Group();
  mayorGroup.add(mayorCard);
  scene.add(mayorGroup);

  // ----- 해녀 할망 그림판 — 포구 옆에 앉아 있습니다 -----
  if (SHEETS.halmang) {
    const hGeo = new THREE.PlaneGeometry(1, 1);
    hGeo.translate(0, 0.5, 0);
    halmangCard = new THREE.Mesh(
      hGeo,
      new THREE.MeshBasicMaterial({ map: SHEETS.halmang.tex, transparent: true, alphaTest: 0.08 })
    );
    halmangCard.userData.planeH = HALMANG_H * CELL_H / (CELL_H - CELL_PAD * 2);
    scene.add(halmangCard);
  }

  // ----- 조랑말 그림판 — 마구간 안에 서 있습니다 (그림띠가 있을 때만) -----
  if (SHEETS.ponyHappy) {
    const pGeo = new THREE.PlaneGeometry(1, 1);
    pGeo.translate(0, 0.5, 0);
    ponyCard = new THREE.Mesh(
      pGeo,
      new THREE.MeshBasicMaterial({ map: SHEETS.ponyHappy.tex, transparent: true, alphaTest: 0.08 })
    );
    ponyCard.userData.planeH = PONY_H * CELL_H / (CELL_H - CELL_PAD * 2);
    scene.add(ponyCard);
    if (stable.pony) stable.pony.visible = false;   // 그림이 있으면 3D 조랑말은 숨깁니다

    // ----- 팔려고 나온 새 조랑말 — 이장님 만물상 앞 (마구간이 비었을 때만 보입니다) -----
    const sGeo = new THREE.PlaneGeometry(1, 1);
    sGeo.translate(0, 0.5, 0);
    salePonyCard = new THREE.Mesh(
      sGeo,
      new THREE.MeshBasicMaterial({ map: SHEETS.ponyHappy.tex, transparent: true, alphaTest: 0.08 })
    );
    salePonyCard.userData.planeH = PONY_H * CELL_H / (CELL_H - CELL_PAD * 2);
    salePonyCard.visible = false;
    scene.add(salePonyCard);
  }
  const mBlob = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 22),
    new THREE.MeshBasicMaterial({ color: 0x1d2b17, transparent: true, opacity: 0.4, depthWrite: false })
  );
  mBlob.rotation.x = -Math.PI / 2;
  mBlob.position.y = 0.06;
  mayorGroup.add(mBlob);
}

// 어느 쪽 루루를 보여줄지.
// 예전에는 T키로 그림 루루와 3D 모형 루루를 오갈 수 있었지만, 그림 쪽이 훨씬 보기 좋아서
// 전환 기능을 없앴습니다. 3D 모형은 그림 파일을 못 읽는 경우(파일을 그냥 더블클릭했을 때)의
// 대비책으로만 남겨둡니다.
const useSprite = CAN_USE_IMAGES;
function applyLuluMode() {
  lulu.visible = !useSprite;
  spriteLulu.visible = useSprite;
  if (spriteBlob) spriteBlob.visible = useSprite;
}
applyLuluMode();

// ---------- 10-3. 3D 루루·할망 (걷어냄) ----------
// 직접 만드신 GLB 모델 두 개(lulu.glb·halmang.glb)는 쓰지 않기로 하여
// 모델 파일과 불러오기 코드를 2026-08-15에 함께 걷어냈습니다.
// 루루도 할망도 지금은 원래의 그림(종이 인형)으로 나옵니다.
// 다시 쓰고 싶어지면 깃 기록의 "안 쓰는 파일 15개 정리" 커밋 직전 판에서
// 모델 파일과 loadGlbCharacter()·loadLuluModel()·loadHalmangModel()·updateLuluModel()을
// 통째로 꺼내 오시면 됩니다.

// 그냥 더블클릭으로 연 경우 안내문을 띄웁니다
if (!CAN_USE_IMAGES) {
  const warn = document.getElementById('fileWarn');
  if (warn) {
    warn.style.display = 'block';
    warn.addEventListener('click', () => { warn.style.display = 'none'; });
  }
}

// ---------- 11. 조작 ----------
// 한글 입력 상태(IME)에서는 브라우저가 e.code를 비워서 보내는 일이 있습니다.
// 그때는 글자(e.key)와 옛 키번호(keyCode)까지 함께 봐야 키가 먹습니다.
// 한글 자판에서 F 자리는 'ㄹ', M 자리는 'ㅡ' 입니다.
const KEY_ALIAS = {
  KeyF: ['f', 'F', 'ㄹ', 70],
  KeyM: ['m', 'M', 'ㅡ', 77],
  Escape: ['Escape', 'Esc', 27],
};
function isKey(e, code) {
  if (e.code === code) return true;
  const alias = KEY_ALIAS[code];
  if (!alias) return false;
  return alias.includes(e.key) || alias.includes(e.keyCode);
}
const keys = {};
addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', (e) => { keys[e.code] = false; });

// 카메라 조작
// - 키보드: A D로 시야를 좌우로 돌리고, W S로 올려다보거나 내려다보고, Z/X로 줌
//   (이동은 방향키이므로, W A S D는 전부 "보는 방향"에만 씁니다)
// - 마우스: 드래그로 회전, 휠로 줌 — 예전 방식도 그대로 둡니다
let camYaw = 0, camPitch = 0.34, camDist = 9.5;
const CAM_TURN = 2.2;    // 초당 회전 속도(라디안). 한 바퀴 도는 데 약 3초
const CAM_PITCH = 1.1;   // 초당 올려다보기/내려다보기 속도
const CAM_ZOOM = 9.0;    // 초당 줌 속도

// 키를 누르고 있는 동안 매 프레임 조금씩 돌립니다 (톡톡 끊기지 않고 부드럽게 돕니다)
// (걷는 방향을 따라 도는 자동 추적은 써봤다가 뺐습니다 — 시야는 온전히 플레이어의 것)
function updateCamera(dt) {
  if (keys['KeyA']) camYaw += CAM_TURN * dt;
  if (keys['KeyD']) camYaw -= CAM_TURN * dt;
  if (keys['KeyW']) camPitch -= CAM_PITCH * dt;     // W = 시선을 눕혀 멀리 보기
  if (keys['KeyS']) camPitch += CAM_PITCH * dt;     // S = 위에서 내려다보기
  if (keys['KeyZ']) camDist += CAM_ZOOM * dt;       // 멀리
  if (keys['KeyX']) camDist -= CAM_ZOOM * dt;       // 가까이
  camPitch = Math.max(pitchMin(), Math.min(1.0, camPitch));
  camDist = Math.max(4, Math.min(22, camDist));
}

// 물속에서는 위를 올려다볼 수 있어야 "보는 방향으로 헤엄"이 됩니다. 뭍에서는 예전 그대로.
function pitchMin() { return state.diving ? -0.85 : 0.05; }

// 포구에 들어서면 루루가 잠수복으로 갈아입습니다 — 물질 나갈 채비!
function inWetsuitZone() {
  if (state.diving || state.inside || state.inShop) return false;
  // 망사리를 챙겨 들었으면 섬 어디에 있든 해녀 차림입니다 (사용자 지정).
  // 물질하러 가는 길도, 돌아오는 길도 잠수복 그대로입니다.
  if (hasNet && netCarried) return true;
  return Math.hypot(state.x - PORT.x, state.z - PORT.z) < 9 ||
         (state.z > 92 && Math.abs(state.x - PORT.x) < 4);   // 축대 위 전체
}

let dragging = false, lastX = 0, lastY = 0;
renderer.domElement.addEventListener('mousedown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
addEventListener('mouseup', () => { dragging = false; });
addEventListener('mousemove', (e) => {
  if (!dragging) return;
  camYaw -= (e.clientX - lastX) * 0.005;
  camPitch = Math.max(pitchMin(), Math.min(1.0, camPitch + (e.clientY - lastY) * 0.003));
  lastX = e.clientX; lastY = e.clientY;
});
addEventListener('wheel', (e) => {
  camDist = Math.max(4, Math.min(22, camDist + e.deltaY * 0.01));
}, { passive: true });

// ---------- 11-2. 손가락 조작 (폰·태블릿) ----------
// 폰에는 키보드가 없으니 화면을 반으로 나눠 씁니다.
//   왼쪽 절반 : 누른 자리에 조이스틱이 생기고, 끄는 방향으로 루루가 걸어갑니다
//   오른쪽 절반: 손가락을 끌면 시야가 돌아갑니다 (마우스 드래그와 같은 역할)
//   두 손가락으로 벌리고 오므리면 줌
// 손가락 여러 개를 동시에 쓰므로, 어느 손가락이 무슨 역할인지 번호(identifier)로 기억해둡니다.
const touchMove = { f: 0, r: 0 };     // 조이스틱이 만들어내는 앞뒤(f)·좌우(r) 입력 (-1 ~ 1)
let touchJump = false, touchRun = false;   // 화면 버튼을 누르고 있는 동안 true
let stickId = null, stickX = 0, stickY = 0;    // 이동용 손가락
let lookId = null, lookX = 0, lookY = 0;       // 시야용 손가락
let pinchDist = 0;                             // 줌용 두 손가락 사이 거리
const STICK_MAX = 55;                          // 이만큼 끌면 최대 속도 (화면 픽셀)

// ----- 손가락 조작 -----
// 왼쪽 절반을 짚으면 이동, 오른쪽 절반을 짚으면 시야입니다.
// 조이스틱 그림은 따로 그리지 않습니다. 처음 짚은 자리가 곧 가운데이고,
// 거기서 끄는 방향과 거리가 그대로 걷는 방향과 속도가 됩니다.
function handleTouchStart(e) {
  for (const t of e.changedTouches) {
    if (t.clientX < innerWidth * 0.5 && stickId === null) {
      stickId = t.identifier; stickX = t.clientX; stickY = t.clientY;
    } else if (lookId === null) {
      lookId = t.identifier; lookX = t.clientX; lookY = t.clientY;
    }
  }
  if (e.touches.length === 2) {
    pinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                           e.touches[0].clientY - e.touches[1].clientY);
  }
}

function handleTouchMove(e) {
  for (const t of e.changedTouches) {
    if (t.identifier === stickId) {
      // 처음 누른 자리에서 얼마나 끌었는지를 그대로 걷는 방향으로 씁니다
      let dx = t.clientX - stickX, dy = t.clientY - stickY;
      const d = Math.hypot(dx, dy);
      if (d > STICK_MAX) { dx *= STICK_MAX / d; dy *= STICK_MAX / d; }
      touchMove.r = dx / STICK_MAX;
      touchMove.f = -dy / STICK_MAX;          // 화면 위로 끌면 앞으로
    } else if (t.identifier === lookId) {
      camYaw -= (t.clientX - lookX) * 0.006;
      camPitch = Math.max(pitchMin(), Math.min(1.0, camPitch + (t.clientY - lookY) * 0.004));
      lookX = t.clientX; lookY = t.clientY;
    }
  }
  if (e.touches.length === 2 && pinchDist > 0) {
    const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                         e.touches[0].clientY - e.touches[1].clientY);
    camDist = Math.max(4, Math.min(22, camDist - (d - pinchDist) * 0.05));
    pinchDist = d;
  }
  e.preventDefault();   // 손가락을 끌 때 화면이 같이 스크롤되지 않게
}

function handleTouchEnd(e) {
  for (const t of e.changedTouches) {
    if (t.identifier === stickId) { stickId = null; touchMove.f = 0; touchMove.r = 0; }
    else if (t.identifier === lookId) lookId = null;
  }
  if (e.touches.length < 2) pinchDist = 0;
}

if (IS_TOUCH) {
  const c = renderer.domElement;
  c.addEventListener('touchstart', handleTouchStart, { passive: false });
  c.addEventListener('touchmove', handleTouchMove, { passive: false });
  c.addEventListener('touchend', handleTouchEnd);
  c.addEventListener('touchcancel', handleTouchEnd);
  document.body.classList.add('touch');   // 화면의 버튼들이 이때만 보이게
}

// 화면 버튼: 누르고 있는 동안 키를 누른 것과 똑같이 처리합니다.
// (점프처럼 한 번만 반응하는 것도 keys를 켜주면 게임 쪽 코드가 알아서 처리합니다)
function bindTouchButton(id, onPress) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.classList.add('on'); onPress(true); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) =>
    el.addEventListener(ev, () => { el.classList.remove('on'); onPress(false); }));
}

// ---------- 12. 루루 상태 ----------
const state = {
  // 시작 위치. 카메라는 루루보다 9미터쯤 뒤에 서므로, 상점(6,45)에 너무 붙여 두면
  // 게임을 켜자마자 카메라가 가게 간판 속에 박혀 화면이 나무판으로 가려집니다.
  x: 6, z: 28,
  vy: 0,
  onGround: true,
  facing: 0,     // 시작할 때 카메라를 마주 봅니다 — 등 뒤 멀리 성산일출봉이 보이는 구도

  walkPhase: 0,
  speed: 0,      // 0~1, 애니메이션 세기
  idleTime: 0,
  sit: 0,        // 0 = 서 있음, 1 = 앉음
  harvestT: -1,  // 0 이상이면 감귤 따는 애니메이션 재생 중 (초 단위로 증가)
  grabbing: false, // true면 상자를 직접 손으로 잡고 있는 중 (E키로 잡기/놓기)
  diving: false,   // true면 물질 중 (바닷속에 있음)
  inside: false,   // true면 집 안에 있음 (문 앞에 서면 드나듭니다)
  inShop: false,   // true면 상점 안에 있음
  pickT: -1,       // 0 이상이면 전복 따는 동작 재생 중 (물속 전용)
  fixT: -1,        // 0 이상이면 집 고치는 동작 재생 중
};
lulu.position.set(state.x, groundHeight(state.x, state.z), state.z);
camera.position.set(state.x, 8, state.z + 12);

// ---------- 12-1. 감귤 따기 (F키) ----------
const HARVEST_RANGE = 2.0;     // 이 거리 안의 귤만 딸 수 있음
const HARVEST_DURATION = 0.6;  // 애니메이션 길이(초). 이 동안은 못 움직임
let coins = 0;
const hasRope = false;            // 끈 아이템은 게임에서 뺐습니다. 상자는 E로 손잡고 끕니다
                                  // (상자 물리 코드 곳곳이 이 이름을 참조해서 변수만 남겨둡니다)
const coinBadge = document.getElementById('coinBadge');
const clockBadge = document.getElementById('clockBadge');
const ropeBadge = document.getElementById('ropeBadge');
const boxBadge = document.getElementById('boxBadge');
function updateCoinBadge() {
  if (!coinBadge) return;
  // 빚을 지면 '빚'이라고 못박아 보여줍니다 — 마이너스 부호만으로는 잘 안 보입니다
  coinBadge.textContent = coins < 0 ? `💸 빚 ${formatWon(-coins)}` : `💵 ${formatWon(coins)}`;
  coinBadge.classList.toggle('debt', coins < 0);
}
// 상자에 귤이 몇 개 담겼는지 (가득 차면 색이 바뀌어 배송할 때가 됐음을 알립니다)
// basketCount·BASKET_CAP은 아래 12-1b에서 만들어지지만, 이 함수는 그 뒤에야 불리므로 괜찮습니다.
// 상자를 끌고 다닐 때만 보입니다 — 평소에는 화면 구석을 차지하지 않게.
function updateBasketBadge() {
  if (!boxBadge) return;
  // 물속에서는 상자를 끌 수 없으니 이 배지도 쉽니다 (물질 안내와 겹쳐 화면이 지저분해집니다)
  const dragging = (hasRope || state.grabbing) && !state.diving;
  boxBadge.style.display = dragging ? 'block' : 'none';
  if (!dragging) return;
  const full = basketCount >= BASKET_CAP;
  boxBadge.textContent = full
    ? `📦 상자 가득! ${basketCount}/${BASKET_CAP}\n택배사의 이장님께 (${formatWon(boxValue())})`
    : `📦 상자 ${basketCount}/${BASKET_CAP}\n지금까지 ${formatWon(boxValue())}`;
  boxBadge.classList.toggle('full', full);
}
// 상자(basketPos)와 잡기 범위(GRAB_RANGE)는 아래 12-1b에서 정의되므로,
// 이 배지 내용은 그쪽 값들이 다 준비된 뒤(매 프레임 updateBasket 안에서) 갱신합니다.
// 안내 문구에 쓸 조작 이름. 폰에는 키보드가 없으므로 화면 버튼 이름으로 바꿔 말해줍니다.
// (예전에는 폰에서도 "F를 누르세요"라고만 해서, 누를 F가 없어 물질하러 못 들어갔습니다)
const KEY_ACTION = IS_TOUCH ? '행동 버튼' : 'F';
// "F으로"는 읽기 어색해서 조사까지 붙인 형태를 따로 둡니다
const KEY_ACTION_RO = IS_TOUCH ? '행동 버튼으로' : 'F로';
const KEY_GRAB = KEY_ACTION;   // 상호작용 키를 하나로 통일했습니다
const KEY_UP = IS_TOUCH ? '점프 버튼' : 'Space';

function updateRopeBadge() {
  if (!ropeBadge) return;
  // 구입 창·자산 창·대화가 떠 있는 동안은 뒤쪽 안내 배지를 감춥니다 (화면이 겹쳐 지저분해집니다)
  const popupOpen =
    (pickWrap && pickWrap.style.display === 'flex') ||
    (bookWrap && bookWrap.style.display === 'flex') ||
    (talkBoxEl && talkBoxEl.style.display === 'block');
  if (popupOpen) { ropeBadge.style.display = 'none'; return; }
  ropeBadge.style.display = 'block';   // 아래 분기 중 하나가 걸리면 보입니다 (없으면 끝에서 숨김)
  // 물속에서는 상자 안내 대신 물질 안내를 보여줍니다
  if (state.diving) {
    // 조이스틱 그림을 없앤 뒤로 "조이스틱"이라는 말이 화면에 없는 것을 가리켰습니다.
    // 지금 조작 그대로 말합니다 — 왼쪽 화면을 끄는 것이 곧 헤엄입니다.
    ropeBadge.textContent = IS_TOUCH
      ? '행동 버튼으로 채집\n왼쪽 화면을 위로 끌면 떠오르고 아래로 끌면 잠수'
      : 'F로 채집\n↑ 떠오르기 ↓ 잠수 ←→ 헤엄 수면에서 F로 나가기';
    return;
  }
  // 상점 안: 앞에 있는 물건의 이름·가격을 알려줍니다
  if (state.inShop) {
    const rg = nearestReno();
    if (rg) {
      // 이미 시공했는지 봅니다 — 바닥재·벽지는 색이 정해졌으면(0이 아니면) 시공된 것입니다
      const done = rg.type === 'floor' ? houseFloorColor !== 0
                 : rg.type === 'wall'  ? houseWallColor !== 0
                 : tools.paint;
      ropeBadge.textContent = (rg.type === 'paint' && tools.paint)
        ? '페인트 보유 중\n집 앞에서 칠하세요'
        : done
          ? `${rg.name} 보유 중`
          : `${rg.name}\n${formatWon(rg.price)} (${KEY_ACTION_RO} 색 고르기)`;
      return;
    }
    const good = nearestShopGood();
    if (good) {
      const owned =
            (good.key === 'net' && hasNet) ||
        (FURNITURE[good.key] && furnitureOwned[good.key]);
      ropeBadge.textContent = owned
        ? `${good.name}\n보유 중`
        : `${good.name} ${formatWon(good.price)}\n${KEY_ACTION_RO} 구입`;
    } else {
      ropeBadge.textContent = '상점 안\n물건 앞에 서면 살 수 있어요 (문 쪽으로 가면 밖으로)';
    }
    return;
  }
  // 집 안: 꾸미기 안내 — 하나라도 들여놨으면 더는 "텅 빈 집"이라 부르지 않습니다
  if (state.inside) {
    const missing = FURN_ORDER.filter((k) => !furnitureOwned[k]).length;
    const owned = FURN_ORDER.length - missing;
    ropeBadge.textContent = missing === 0
      ? '아늑한 내 집\n문 쪽으로 걸어가면 밖으로 나갑니다'
      : owned === 0
        ? '텅 빈 집\n상점 안에서 가구를 사서 꾸며보세요 (문 쪽으로 가면 밖으로)'
        : `점점 집다워지네요\n상점에 가구 ${missing}가지가 더 있어요 (문 쪽으로 가면 밖으로)`;
    return;
  }
  // 해녀 할망 — 포구 안내보다 먼저 (할망 곁에 서 있을 때)
  if (typeof HALMANG_SPOT !== 'undefined' &&
      Math.hypot(state.x - HALMANG_SPOT.x, state.z - HALMANG_SPOT.z) < HALMANG_RANGE) {
    ropeBadge.textContent = `해녀 할망과 이야기 (${KEY_ACTION})`;
    return;
  }
  // 무남이 — 집 앞에서 마주쳤을 때 (경마장에 가 있는 동안은 빈 평상뿐입니다)
  if (typeof munam !== 'undefined' && !munamAway() &&
      Math.hypot(state.x - munam.x, state.z - munam.z) < MUNAM_RANGE) {
    const ignoring = romanceStage === 0 && assetTotal() < MUNAM_MIN_COINS;
    ropeBadge.textContent = ignoring
      ? `무남이에게 인사하기 (${KEY_ACTION})`
      : (romanceUnlocked() > romanceStage
        ? `무남이가 할 말이 있어 보여요 (${KEY_ACTION})`
        : `무남이와 이야기 (${KEY_ACTION})`);
    return;
  }
  // 포구 가까이 오면 물질하러 들어가는 법을 알려줍니다 (망사리가 없으면 그것부터)
  if (typeof PORT !== 'undefined' &&
      Math.hypot(state.x - PORT.x, state.z - PORT.z) < BULTEOK_RANGE + 5) {
    const nearEnd = Math.hypot(state.x - DIVE_ENTRY.x, state.z - DIVE_ENTRY.z) < DIVE_ENTRY_RANGE;
    if (dayEvent === 'storm') {
      ropeBadge.textContent = '태풍이 몰아쳐요\n오늘은 물질을 쉽니다';
    } else if (!nearEnd) {
      ropeBadge.textContent = '포구 끝까지 걸어나가면 물질하러 들어갈 수 있어요';
    } else {
      ropeBadge.textContent = netCarried
        ? `${KEY_ACTION}을 누르면 바다로 물질하러 들어갑니다` +
          (isNight() ? '\n야간물질은 값을 2배로 쳐줘요\n대신 숨이 빨리 차요' : '')
        : (hasNet
          ? '망사리를 두고 왔어요\n메고 와야 물질할 수 있어요'
          : `망사리가 있어야 물질합니다\n상점 안에서 ${formatWon(NET_PRICE)}`);
    }
    return;
  }
  // 헌집 가까이 오면 지금 할 수 있는 일(구입/수리)을 알려줍니다
  if (typeof HOUSE !== 'undefined' &&
      Math.hypot(state.x - HOUSE.x, state.z - HOUSE.z) < HOUSE_RANGE + 3) {
    ropeBadge.textContent = houseBadgeText();
    return;
  }
  // 컨테이너 창고
  if (typeof CONTAINER !== 'undefined' &&
      Math.hypot(state.x - CONTAINER.x, state.z - CONTAINER.z) < CONTAINER_RANGE) {
    ropeBadge.textContent = hasContainer
      ? '컨테이너 창고\n귤 상자 하나에 2만원으로 팝니다'
      : `컨테이너 창고\n${KEY_ACTION_RO} 사기 (${formatWon(CONTAINER_PRICE)}) · 귤 상자값이 두 배`;
    return;
  }
  // 상점 앞에 매어 둔 새 조랑말 (마구간이 비었을 때만)
  if (!ponyAlive && typeof PONY_SALE !== 'undefined' &&
      Math.hypot(state.x - PONY_SALE.x, state.z - PONY_SALE.z) < PONY_SALE_RANGE) {
    ropeBadge.textContent = `${KEY_ACTION_RO} 새 조랑말 사기 (${formatWon(PONY_PRICE)})`;
    return;
  }
  // 상점 문 앞 안내 — 이장님이 오셨는지에 따라
  if (typeof SHOP_DOOR !== 'undefined' &&
      Math.hypot(state.x - SHOP_DOOR.x, state.z - SHOP_DOOR.z) < SHOP_DOOR_RANGE) {
    ropeBadge.textContent = mayorAtShop()
      ? `${KEY_ACTION_RO} 상점에 들어가기\n이장님이 문을 열어줍니다`
      : '이장님이 오고 계세요\n문 앞에서 잠깐 기다려주세요';
    return;
  }
  // 이장님·돌하르방 안내 (이장님 바로 곁에서는 이야기가 우선입니다)
  if (typeof mayor !== 'undefined' && mayorGroup &&
      Math.hypot(state.x - mayor.x, state.z - mayor.z) < MAYOR_TALK_RANGE) {
    ropeBadge.textContent = `이장님과 이야기 (${KEY_ACTION})`;
    return;
  }
  if (typeof TUTOR_SPOT !== 'undefined' &&
      Math.hypot(state.x - TUTOR_SPOT.x, state.z - TUTOR_SPOT.z) < TUTOR_RANGE) {
    ropeBadge.textContent = `돌하르방과 이야기 (${KEY_ACTION})`;
    return;
  }
  // 택배사 앞 안내 — 이장님이 계셔야 정산이 됩니다
  if (typeof depot !== 'undefined' &&
      Math.hypot(state.x - depot.group.position.x, state.z - depot.group.position.z) < DEPOT_RANGE) {
    const mayorHere = Math.hypot(mayor.x - MAYOR_POSTS.depot.x, mayor.z - MAYOR_POSTS.depot.z) < 2.5;
    ropeBadge.textContent = mayorHere
      ? (() => {
        // 컨테이너를 사기 전에는 끌고 온 상자 하나씩 팝니다
        if (!hasContainer) {
          return basketCount >= BASKET_CAP
            ? `${KEY_ACTION_RO} 귤 박스 부치기 (${formatWon(boxValue())})\n이장님이 계세요`
            : `택배사\n상자를 가득 채워 오면 이장님이 사 줍니다 (${basketCount}/${BASKET_CAP})`;
        }
        const piled = cratesPiled();
        const ready = cratesReadyToShip();
        if (!ready.length) {
          return piled.length
            ? `택배사\n「귤상자 두는 곳」에 ${piled.length}상자\n${BULK_STEP - piled.length}상자만 더 채우면 부칠 수 있어요`
            : `택배사\n가득 찬 상자를 컨테이너 앞 「귤상자 두는 곳」에 쌓아두세요 (${basketCount}/${BASKET_CAP})`;
        }
        let sum = 0;
        for (const c of ready) sum += (c === curCrate ? boxValue() : crateValue(c));
        const mult = bulkMultiplier(ready.length);
        const left = piled.length - ready.length;
        return `${KEY_ACTION_RO} 귤 ${ready.length}박스 한 번에 부치기\n` +
          `${formatWon(sum * mult)} · ${mult}배` + (left ? ` (${left}상자는 남습니다)` : '');
      })()
      : '이장님이 오고 계세요\n문 앞에서 잠깐 기다려주세요';
    return;
  }
  // 밭 팻말 앞 — 밭 상태에 따라 할 일을 알려줍니다
  if (typeof nearestFarmSign === 'function') {
    const f = nearestFarmSign();
    if (f) {
      if (!f.rented && !f.owned) {
        ropeBadge.textContent = f.stolen
          ? `내 땅이었던 ${farmName(f)}\n${KEY_ACTION_RO} 되사기 ${formatWon(FARM_BUY_PRICE)} · 년세 ${formatWon(FARM_RENT)}`
          : `이장님 밭 ${farmName(f)}\n${KEY_ACTION_RO} 년세 내고 빌리기 (${formatWon(FARM_RENT)})`;
      } else if (rentExpired(f)) {
        ropeBadge.textContent = `${farmName(f)} 년세가 끝났어요\n${KEY_ACTION_RO} 다시 내기 (${formatWon(FARM_RENT)})`;
      } else if (farmRipe(f)) {
        ropeBadge.textContent = `${SEEDS[f.crop].name}를 거둘 때가 됐어요\n${KEY_ACTION_RO} 수확하기` +
          (f.owned ? '' : '\n절반은 이장님 몫입니다');
      } else if (f.crop) {
        const left = SEEDS[f.crop].days - (dayCount - f.planted);
        ropeBadge.textContent = `${SEEDS[f.crop].name}가 자라는 중\n${left}일 남았어요`;
      } else {
        ropeBadge.textContent = seedBagCount()
          ? `${f.owned ? '루루의 땅' : '빌린 밭'}\n${KEY_ACTION_RO} 씨앗 심기`
          : `${f.owned ? '루루의 땅' : '빌린 밭'}\n씨앗은 이장님 상점에서 삽니다`;
      }
      return;
    }
  }
  // 마구간 안내 (당근은 상점 안에서 삽니다)
  // 경마장이 눈에 들어오면 경주 영상을 미리 받아둡니다 — 출전할 때 안 기다리도록
  if (typeof RACE_SPOT !== 'undefined' && typeof preloadRaceVideos === 'function' &&
      Math.hypot(state.x - RACE_SPOT.x, state.z - RACE_SPOT.z) < 30) preloadRaceVideos();
  if (typeof RACE_SPOT !== 'undefined' &&
      Math.hypot(state.x - RACE_SPOT.x, state.z - RACE_SPOT.z) < RACE_RANGE) {
    ropeBadge.textContent = ponyLove < RACE_LOVE
      ? `경마\n애정 ${RACE_LOVE} 이상부터 출전 (지금 ${ponyLove})`
      : `경마 출전 ${formatWon(raceFee())} · 한 판에 애정 ${RACE_LOVE} 소모\n1등 상금 ${formatWon(racePrize())} · 승률은 반반 (${KEY_ACTION})`;
    return;
  }
  if (typeof STABLE !== 'undefined' &&
      Math.hypot(state.x - STABLE.x, state.z - STABLE.z) < STABLE_RANGE) {
    if (!ponyAlive) {
      ropeBadge.textContent = '마구간이 비었어요\n이장님 만물상 앞에 새 말이 와 있어요';
    } else if (ponyFedToday()) {
      ropeBadge.textContent = `오늘 몫은 다 줬어요\n애정 ${ponyLove}`;
    } else if (carrots > 0) {
      ropeBadge.textContent = `${KEY_ACTION_RO} 당근 먹이기 (${carrots}개 있음)\n오늘 아직 안 먹였어요 · 애정 ${ponyLove}`;
    } else {
      ropeBadge.textContent = `조랑말한테 당근을 주세요 (애정 ${ponyLove})\n당근은 이장님 상점에서`;
    }
    return;
  }
  if (state.grabbing) {
    ropeBadge.style.display = 'block';
    ropeBadge.textContent = `상자를 끄는 중 (${KEY_ACTION}로 놓기)`;
    return;
  }
  // 알려줄 것이 없으면 배지를 아예 숨깁니다 (화면을 어지럽히지 않게)
  ropeBadge.style.display = 'none';
}
updateCoinBadge();

// 화면에 잠깐 떴다 사라지는 "+1000원" 표시. 3D 좌표를 화면 좌표로 투영해서
// 일반 HTML 글자로 띄우는 방식이라(WebGL 텍스트보다 간단), 매 프레임 위치만 갱신해주면 됩니다.
const popups = [];
// life를 주면 그 시간(초)만큼 떠 있습니다 — 중요한 문구는 길게 (기본 1.1초)
// cls를 넘기면 그 꾸밈을 덧입힙니다 (예: 'big' — 할망 말씀처럼 크게 보여야 하는 알림)
function spawnMoneyPopup(worldX, worldY, worldZ, text, life, cls) {
  const el = document.createElement('div');
  el.className = cls ? 'moneyPopup ' + cls : 'moneyPopup';
  el.textContent = text;
  document.getElementById('ui').appendChild(el);
  popups.push({ el, x: worldX, y: worldY, z: worldZ, t: 0, life: life || 1.1 });
}

// ---------- 12-1a. 효과음 ----------
// 소리 파일을 따로 두지 않고, 브라우저에 들어 있는 웹 오디오로 짧은 소리를 그때그때 만들어 냅니다.
// (파일이 없으니 받을 것도, 경로가 틀릴 일도 없습니다)
//
// 브라우저는 사용자가 키를 누르거나 화면을 클릭하기 전에는 소리를 못 내게 막아둡니다.
// 그래서 첫 입력이 들어온 순간에 오디오를 깨웁니다 — 소리를 내는 순간이 곧 키를 누른 순간이라
// 아래 blip()에서 매번 깨우기만 해도 충분합니다.
let audioCtx = null;
function wakeAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;                                  // 아주 오래된 브라우저면 그냥 소리 없이 진행
  if (!audioCtx) audioCtx = new AC();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return true;
}
addEventListener('keydown', wakeAudio, { once: true });
addEventListener('mousedown', wakeAudio, { once: true });

// 짧은 소리 한 번. f0에서 f1로 음이 미끄러지며 스르르 사라집니다.
function blip(f0, f1, dur, gain, type) {
  if (!wakeAudio()) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.linearRampToValueAtTime(gain, t + 0.012);          // 아주 짧게 커졌다가
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);     // 여운을 남기며 사라짐
  osc.connect(amp).connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// 귤을 딸 때: 가지에서 톡 떼어내는 맑고 높은 소리.
// 딸 때마다 음을 조금씩 다르게 해야 여러 번 따도 기계음처럼 안 들립니다.
function playPickSound() {
  const p = 0.92 + Math.random() * 0.18;
  blip(760 * p, 1420 * p, 0.09, 0.13, 'triangle');
}
// 상자에 담길 때: 나무통 바닥에 툭 떨어지는 낮고 둔한 소리
function playDropSound() {
  const p = 0.94 + Math.random() * 0.14;
  blip(300 * p, 92 * p, 0.12, 0.2, 'sine');
}
// 택배 부칠 때: 트럭이 떠나는 "빵— 빵—" 두 번 울리는 경적
function playShipSound() {
  blip(330, 320, 0.18, 0.16, 'square');
  setTimeout(() => blip(262, 255, 0.28, 0.16, 'square'), 200);
}

// 배경음악 — 한 곡이 끝나면 다음 곡으로 넘어갑니다.
// 소리를 못 내게 막는 브라우저가 있으므로, 첫 조작이 들어온 뒤에 틀고 실패해도 게임은 그대로 돌아갑니다.
// 배경음악 5곡 — 수노에서 직접 뽑으신 곡들 (사용자 제공, 2026-08-13).
// 시작 곡은 매번 랜덤입니다.
//
// 2026-08-21: 한국어 곡 셋을 목록에서 뺐습니다.
//   bgm4 그대는 필리핀으로 · bgm6 오늘이 제일 젊은날 · bgm8 장가계 디스코
// 파일은 assets/farmcat/ 에 그대로 있습니다. 되돌리려면 아래에 줄만 다시 넣으면 됩니다.
const BGM_LIST = [
  '../assets/farmcat/bgm2.mp3',   // Grandma's warm hug
  '../assets/farmcat/bgm3.mp3',   // Countryside
  '../assets/farmcat/bgm5.mp3',   // The church bells
  '../assets/farmcat/bgm7.mp3',   // Whiskey rides the midnight wind
  '../assets/farmcat/bgm9.mp3',   // Feet on the dirt
];
let bgmIdx = Math.floor(Math.random() * BGM_LIST.length);   // 들어올 때마다 첫 곡이 달라집니다
const bgm = new Audio(BGM_LIST[bgmIdx]);
bgm.preload = 'none';   // 파일이 커서 미리 받지 않습니다 — 실제로 틀 때 받아옵니다
bgm.volume = 0.8;       // 80% (사용자 지정 2026-08-13 — 폰에서 너무 작게 들려 키움, 효과음 여지로 2할만 남김)
let bgmStarted = false;
let bgmFails = 0;      // 연달아 못 받은 곡 수 — 전부 실패하면 조용히 포기합니다
function bgmNext() {
  bgmIdx = (bgmIdx + 1) % BGM_LIST.length;
  bgm.src = BGM_LIST[bgmIdx];
  bgm.play().catch(() => {});
}
bgm.addEventListener('ended', () => { bgmFails = 0; bgmNext(); });
bgm.addEventListener('playing', () => { bgmFails = 0; });
// 한 곡을 못 받아오더라도 음악이 끊기지 않게 다음 곡으로 넘깁니다.
// 다만 인터넷이 끊기면 모든 곡이 실패하는데, 그때 계속 다음 곡을 부르면
// 실패가 실패를 부르며 초당 수백 번씩 요청이 나갑니다(폰이 뜨거워지고 데이터가 샙니다).
// 그래서 곡 수만큼만 시도하고 그 뒤에는 음악 없이 게임을 계속합니다.
let bgmDead = false;   // 전부 실패해서 포기한 상태
bgm.addEventListener('error', () => {
  if (!bgmStarted) return;
  if (++bgmFails >= BGM_LIST.length) { bgmStarted = false; bgmDead = true; return; }
  bgmNext();
});
let bgmRetryAt = 0;    // 다시 받아보기를 허용할 시각 — 끊긴 인터넷에 매달려 계속 두드리지 않게
function startBgm() {
  if (bgmStarted || document.hidden) return;   // 화면이 안 보이는 상태면 아예 틀지 않습니다
  if (bgm.muted) return;                       // 꺼둔 사람에게 화면 한 번 만졌다고 다시 틀면 안 됩니다
  // 한 번 실패한 소리 파일은 그대로 다시 틀면 브라우저가 바로 거절합니다.
  // 인터넷이 돌아왔을 때 살아나려면 주소를 다시 넣어야 하는데, 게임 중에는 손가락이
  // 초당 여러 번 화면에 닿습니다. 그때마다 다시 받으면 실패가 실패를 부릅니다.
  // 그래서 포기한 뒤에는 30초에 한 번만 다시 시도합니다.
  if (bgmDead) {
    if (performance.now() < bgmRetryAt) return;
    bgmRetryAt = performance.now() + 30000;
    bgmDead = false;
    bgm.src = BGM_LIST[bgmIdx];
    bgm.load();
  }
  bgmStarted = true;
  bgmFails = 0;                                 // 다시 시도할 땐 실패 기록을 지웁니다
  bgm.play().catch(() => { bgmStarted = false; });   // 막히면 다음 조작 때 다시 시도
}
addEventListener('keydown', startBgm);
addEventListener('mousedown', startBgm);
// 폰은 화면을 손가락으로 눌러도 mousedown이 안 나오는 경우가 있어 따로 받습니다
addEventListener('touchstart', startBgm, { passive: true });

// 게임 화면이 안 보이면(다른 탭으로 넘어갔거나 창을 내렸으면) 음악을 멈춥니다.
// 이게 없으면 게임을 보고 있지 않은데도 배경음악만 계속 흘러나옵니다.
// 다시 돌아오면 껐던 게 아닌 이상 이어서 재생됩니다.
addEventListener('visibilitychange', () => {
  if (document.hidden) bgm.pause();
  else if (bgmStarted && !bgm.muted) bgm.play().catch(() => {});
});
// 창을 닫거나 다른 페이지로 넘어갈 때도 확실히 정리합니다
addEventListener('pagehide', () => { bgm.pause(); });

// 배경음악 켜고 끄기 — 키보드는 M, 폰은 배지를 손가락으로 누르면 됩니다.
// (화면 안내표는 전부 pointer-events: none 이라 손가락 입력을 안 받습니다.
//  이 배지만 auto로 되돌려 놔야 눌러도 반응합니다 — CSS의 .tappable 이 그 일을 합니다)
const musicBadge = document.getElementById('musicBadge');
function updateMusicBadge() {
  if (musicBadge) musicBadge.textContent = bgm.muted ? '🔇' : '🎵';
}
function toggleMusic() {
  bgm.muted = !bgm.muted;
  if (bgm.muted) {
    // 소리만 끄고 재생을 두면 안 들리는 노래를 계속 받아옵니다(폰 데이터가 샙니다).
    bgm.pause();
  } else {
    startBgm();                 // 아직 한 번도 안 틀었으면 이참에 틀어줍니다
    // 음소거한 채로 다른 탭에 다녀오면 음악이 멈춰 있습니다. 켤 때 다시 이어줍니다.
    if (bgm.paused && !document.hidden) bgm.play().catch(() => {});
  }
  updateMusicBadge();
}
// M키는 지도가 가져갔습니다. 음악은 왼쪽 아래 🎵 배지를 눌러 켜고 끕니다.
if (musicBadge) {
  musicBadge.classList.add('tappable');
  musicBadge.addEventListener('pointerdown', (e) => { e.preventDefault(); toggleMusic(); });
}
updateMusicBadge();
// ⏭ 다음 곡 — 누를 때마다 다음 배경음악으로 넘어갑니다. 꺼져 있었으면 켜면서 넘어갑니다.
const nextSongBadge = document.getElementById('nextSongBadge');
if (nextSongBadge) {
  nextSongBadge.classList.add('tappable');
  nextSongBadge.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (document.hidden) return;
    if (bgm.muted) { bgm.muted = false; updateMusicBadge(); }
    bgmStarted = true;
    bgmFails = 0;
    bgmDead = false;
    bgmNext();
  });
}

const harvestVec = new THREE.Vector3();
function updatePopups(dt) {
  for (let i = popups.length - 1; i >= 0; i--) {
    const p = popups[i];
    p.t += dt;
    if (p.t > p.life) { p.el.remove(); popups.splice(i, 1); }
  }
  // 알림은 세계 좌표를 따라다니지 않고, 화면 가운데 위쪽에 차곡차곡 쌓입니다
  let stackTop = 64;
  for (let i = 0; i < popups.length; i++) {
    const p = popups[i];
    p.el.style.left = '50%';
    p.el.style.top = stackTop + 'px';
    stackTop += (p.el.offsetHeight || 34) + 8;
    // 수명의 마지막 30% 구간에서만 서서히 사라집니다
    p.el.style.opacity = p.t < p.life * 0.7 ? 1 : Math.max(0, 1 - (p.t - p.life * 0.7) / (p.life * 0.3));
  }
}

// 플레이어와 가장 가까운, 아직 안 딴 귤을 찾는다 (나무 높이는 대부분 손 닿는 범위라 2D 거리만 봅니다)
// 더 현실감 있게: 바로 발밑 수준으로 가깝지 않으면, 루루가 "보고 있는 방향"에 있는 귤만 손이 닿습니다.
// (등 뒤에 있는 귤을 안 보고 딸 수는 없으니까요)
function nearestFruit() {
  let best = -1, bestD = HARVEST_RANGE;
  const fwdX = Math.sin(state.facing), fwdZ = Math.cos(state.facing);
  for (let i = 0; i < fruitSpots.length; i++) {
    const s = fruitSpots[i];
    if (s.picked) continue;
    const dx = s.x - state.x, dz = s.z - state.z;
    const d = Math.hypot(dx, dz);
    if (d >= bestD) continue;
    if (d > 0.45) {
      const facingDot = (dx / d) * fwdX + (dz / d) * fwdZ;   // 1=정면, 0=옆, -1=등 뒤
      if (facingDot < 0.35) continue;                        // 대략 앞쪽 70도 안에 있어야 손이 닿음
    }
    bestD = d; best = i;
  }
  return best;
}

// 지금 손 뻗으면 딸 수 있는 귤 하나를 눈에 보이게 표시합니다 (반짝이는 고리).
// 이게 없으면 "어떤 귤을 딴 건지" 안 보여서, 딴 순간 마법처럼 코인만 생기는 느낌이 됩니다.
const targetRingMat = new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.9, depthTest: false });
const targetRing = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.028, 8, 20), targetRingMat);
targetRing.renderOrder = 999;
targetRing.visible = false;
scene.add(targetRing);

// ----- 밭 팻말 앞에서 하는 일 (임대 · 심기 · 수확 · 매입) -----
const FARM_SIGN_RANGE = 2.6;
function nearestFarmSign() {
  let best = null, bestD = FARM_SIGN_RANGE;
  for (const f of FARMS) {
    if (!f.signPos) continue;
    const d = Math.hypot(f.signPos.x - state.x, f.signPos.z - state.z);
    if (d < bestD) { bestD = d; best = f; }
  }
  return best;
}
// 이 밭이 지금 거둘 수 있는 상태인가
function farmRipe(f) {
  return !!f.crop && (dayCount - f.planted) >= SEEDS[f.crop].days;
}
function seedBagCount() {
  return SEED_ORDER.reduce((n, k) => n + (seeds[k] || 0), 0);
}
// 필지 하나 빌리기 (년세 내기 · 1년 지나 다시 낼 때도 이 함수를 씁니다)
function rentFarm(f) {
  const price = FARM_RENT;
  const py = groundHeight(f.signPos.x, f.signPos.z) + 2.2;
  if (coins < price) {
    spawnMoneyPopup(f.signPos.x, py, f.signPos.z, `${formatWon(price - coins)} 부족`);
    return;
  }
  const renew = rentExpired(f);   // 처음 빌리는 것인지, 1년이 지나 다시 내는 것인지
  coins -= price;
  f.rented = true;
  f.rentedDay = dayCount;
  if (!renew) stat.rented = (stat.rented || 0) + 1;
  stat.rentPaid = (stat.rentPaid || 0) + price;
  updateCoinBadge();
  playShipSound();
  refreshFarm(f);
  saveGame(true);   // 년세를 낸 즉시 저장
  spawnMoneyPopup(f.signPos.x, py, f.signPos.z, renew
    ? `${farmName(f)} 년세를 다시 냈어요\n또 1년 부칠 수 있습니다`
    : `${farmName(f)}를 빌렸어요 (년세 ${formatWon(price)})\n씨앗을 사다 심으면 됩니다\n수확할 때 절반은 이장님 몫입니다`);
}
// 빌린 밭을 아예 사기
function buyFarm(f) {
  const py = groundHeight(f.signPos.x, f.signPos.z) + 2.2;
  if (coins < FARM_BUY_PRICE) {
    spawnMoneyPopup(f.signPos.x, py, f.signPos.z, `${formatWon(FARM_BUY_PRICE - coins)} 부족`);
    return;
  }
  coins -= FARM_BUY_PRICE;
  const back = f.stolen;
  f.owned = true;
  f.rented = true;
  f.stolen = false;
  stat.owned = (stat.owned || 0) + 1;
  updateCoinBadge();
  playShipSound();
  refreshFarm(f);
  saveGame(true);   // 밭을 산 즉시 저장 (큰돈이 나갔으니 잃으면 안 됩니다)
  lonelyCheck();    // 땅을 사서 자산 문턱을 넘으면 외로움 독백이 즉시 뜹니다
  spawnMoneyPopup(f.signPos.x, py, f.signPos.z, back
    ? '밭을 도로 사왔어요\n두 번 산 땅이라 더 내 것 같습니다'
    : '내 땅이 생겼어요\n이제 이 밭에서 나는 건 전부 루루 몫입니다');
  // 무남이가 팔았던 밭을 되사온 거면, 매듭은 무남이 앞에서 짓습니다 — 갈 곳을 알려줍니다
  if (back) setTimeout(() => spawnMoneyPopup(f.signPos.x, py + 0.9, f.signPos.z,
    '무남이에게 가서 말을 걸어보세요', 7), 1400);
}
// 씨앗 심기
function plantSeed(f, key) {
  const py = groundHeight(f.signPos.x, f.signPos.z) + 2.2;
  if (!seeds[key]) {
    spawnMoneyPopup(f.signPos.x, py, f.signPos.z, `${SEEDS[key].name} 씨앗이 없어요`);
    return;
  }
  seeds[key]--;
  f.crop = key;
  f.planted = dayCount;
  refreshFarm(f);
  playPickSound();
  saveGame(true);   // 심은 즉시 저장 (씨앗 소모·작물 상태를 잃지 않게)
  spawnMoneyPopup(f.signPos.x, py, f.signPos.z,
    `${SEEDS[key].name}를 심었어요
${SEEDS[key].days}일 뒤에 거둡니다`);
}
// 수확 — 임대한 밭이면 절반이 소작료로 나갑니다
function harvestFarm(f) {
  const sd = SEEDS[f.crop];
  const py = groundHeight(f.signPos.x, f.signPos.z) + 2.4;
  // 만원 단위로 떨어뜨립니다 (1,005,000원처럼 지저분한 숫자가 안 나오게)
  const total = Math.round(sd.yield * (0.9 + Math.random() * 0.2) / 20000) * 20000;
  const rent = f.owned ? 0 : total * TENANT_SHARE;
  const mine = total - rent;
  coins += mine;
  stat.harvest = (stat.harvest || 0) + 1;
  stat.rentPaid = (stat.rentPaid || 0) + rent;
  updateCoinBadge();
  playShipSound();
  // 차나무는 베지 않고 잎만 땁니다 — 다시 자라기 시작합니다
  if (sd.perennial) f.planted = dayCount;
  else f.crop = null;
  refreshFarm(f);
  // 며칠을 기다려 거둔 것이라 잠깐 스치면 얼마 받았는지도 못 봅니다.
  // 글씨를 키우고(big) 6초 동안 띄워 둡니다.
  spawnMoneyPopup(f.signPos.x, py, f.signPos.z, f.owned
    ? `${sd.name} 수확 ${formatWon(total)}
전부 내 몫입니다`
    : `${sd.name} 수확 ${formatWon(total)}
이장님 몫 ${formatWon(rent)}
내 몫 ${formatWon(mine)}`, 6, 'big');
  saveGame(true);   // 거둔 즉시 저장 (수익·밭 상태를 잃지 않게)
}
// 팻말 앞에서 F — 밭 상태에 따라 할 일이 갈립니다
function tryFarmSign() {
  const f = nearestFarmSign();
  if (!f) return false;
  if (!f.rented && !f.owned) {
    // 이장님이 무남이한테 사간 밭 — 빌려 쓰든 되사오든 루루가 고릅니다.
    // 되사올 때는 임대 절차를 거치지 않고 바로 1천만원입니다 (원래 루루 땅이었으니까요).
    if (f.stolen) {
      openChoiceDialog(`내 땅이었던 ${farmName(f)}`, [
        { emoji: '🏷', name: '되사오기', note: formatWon(FARM_BUY_PRICE),
          price: FARM_BUY_PRICE, onPick: () => buyFarm(f) },
        { emoji: '🪧', name: '년세 내고 빌리기', note: formatWon(FARM_RENT),
          price: FARM_RENT, onPick: () => rentFarm(f) },
      ], '되사야 내 재산이 됩니다\n빌리면 거둘 때 절반이 이장님 몫으로 나갑니다');
      return true;
    }
    openBuyDialog('🪧', `${farmName(f)} 1년 년세`, FARM_RENT, () => rentFarm(f));
    return true;
  }
  // 1년이 지났습니다 — 년세를 다시 내야 계속 부칠 수 있습니다
  if (rentExpired(f)) {
    openBuyDialog('🪧', `${farmName(f)} 년세 다시 내기`, FARM_RENT, () => rentFarm(f));
    return true;
  }
  if (farmRipe(f)) {
    // 차나무 같은 다년생은 작물이 영영 안 비어서, 딸 때 사기 선택지를 함께 줘야 그 땅을 살 수 있습니다
    if (SEEDS[f.crop].perennial && !f.owned) {
      openChoiceDialog(`${farmName(f)} · ${SEEDS[f.crop].name}밭`, [
        { emoji: SEEDS[f.crop].emoji, name: '잎 따기', note: '오늘 몫을 거둡니다',
          onPick: () => harvestFarm(f) },
        { emoji: '🏷', name: '이 땅 사기', note: formatWon(FARM_BUY_PRICE),
          price: FARM_BUY_PRICE, onPick: () => buyFarm(f) },
      ], '빌린 땅입니다. 거둘 때 절반이 이장님 몫으로 나갑니다');
      return true;
    }
    harvestFarm(f);
    return true;
  }
  if (f.crop) {
    const left = SEEDS[f.crop].days - (dayCount - f.planted);
    spawnMoneyPopup(f.signPos.x, groundHeight(f.signPos.x, f.signPos.z) + 2.2, f.signPos.z,
      `${SEEDS[f.crop].name}가 자라는 중이에요
${left}일만 더 기다리세요`);
    return true;
  }
  openFarmDialog(f);
  return true;
}

function updateHarvestTarget(dt, t) {
  if (state.harvestT >= 0) { targetRing.visible = false; return; }   // 따는 중엔 표식 끔
  // 물속에는 표식을 두지 않습니다 — 어두운 바다를 더듬어 찾는 것이 물질입니다
  const i = nearestFruit();
  const s = i >= 0 ? fruitSpots[i] : null;
  if (!s) { targetRing.visible = false; return; }
  targetRing.visible = true;
  targetRing.position.set(s.x, s.y, s.z);
  targetRing.rotation.set(Math.PI / 2, t * 2.2, 0);           // 살짝 돌아가며 반짝이는 느낌
  const pulse = 1 + Math.sin(t * 6) * 0.12;                    // 맥박처럼 커졌다 작아졌다
  targetRing.scale.setScalar(pulse);
}

// ---------- 12-1b. 귤 바구니 — 딴 귤이 실제로 포물선을 그리며 날아가 떨어지는 통 ----------
// 루루를 항상 따라다니되(등 뒤에 위치), 걷는 방향으로 돌지는 않고 살짝 뒤에 얌전히 놓여있게 합니다.
// 실제 오렌지색 플라스틱 과일 상자(옆면에 통풍 구멍이 송송 뚫리고 가운데 손잡이 띠가 있는 모양)를
// 캔버스에 직접 그려서 텍스처로 씁니다.
function makeCrateTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e2861f';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = 'rgba(110, 55, 8, 0.55)';
  for (let y = 12; y < 128; y += 18) {
    for (let x = 8; x < 128; x += 15) {
      ctx.beginPath();
      ctx.arc(x, y, 3.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = 'rgba(95, 46, 8, 0.6)';   // 가운데를 가로지르는 손잡이 띠
  ctx.fillRect(0, 56, 128, 12);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const crateSideMat = new THREE.MeshLambertMaterial({ map: makeCrateTexture() });
const crateTopMat = new THREE.MeshLambertMaterial({ color: 0xcf7a1a });
const crateInsideMat = new THREE.MeshLambertMaterial({ color: 0x8a4d16 });
const BASKET_SCALE = 1.2;   // 상자를 기존보다 20% 더 크게
// 상자 바깥 크기 (루루 몸통만해야 "무거워서 힘들게 끈다"는 느낌이 삽니다)
const CRATE_W = 0.85 * BASKET_SCALE;   // 가로
const CRATE_H = 0.62 * BASKET_SCALE;   // 높이 (이 높이가 상자 아가리 = 귤이 여기까지 차오릅니다)
const CRATE_D = 0.68 * BASKET_SCALE;   // 세로
const CRATE_T = 0.07 * BASKET_SCALE;   // 판 두께
// ----- 귤의 종류와 값 -----
// 보통 귤 한 알이 500원이고, 상자 20칸을 채우면 10,000원입니다.
// 이벤트 날에만 나오는 특별한 귤은 칸은 똑같이 하나만 차지하고, 값만 몇 배로 쳐줍니다.
const FRUIT_UNIT = 500;
const FRUITS = {
  normal: { name: '감귤',   mult: 1, color: 0xf0871c, size: 1.00 },
  gold:   { name: '황금향', mult: 2, color: 0xffc21f, size: 1.10 },
  halla:  { name: '한라봉', mult: 3, color: 0xff7a12, size: 1.26 },
  cheon:  { name: '천혜향', mult: 4, color: 0xff5327, size: 1.18 },
};
const fruitMats = {};
for (const k in FRUITS) {
  fruitMats[k] = k === 'normal' ? tangerineMat
    : new THREE.MeshLambertMaterial({ color: FRUITS[k].color });
}
const BASKET_CAP = 20;          // 상자 하나에 담기는 개수 (창고는 칸이 아니라 값을 올립니다)

// 상자 한 개 찍어내기 — 예전에는 딱 하나만 만들었는데, 이제 사서 늘릴 수 있어 함수로 뽑았습니다.
// 속이 꽉 찬 네모가 아니라 바닥 + 벽 네 장으로 진짜 뚫린 상자입니다 (위에서 보면 귤이 들여다보입니다).
function buildCrateMesh() {
  const g = new THREE.Group();
  const fruits = [];
  const panel = (geo, px, py, pz, mat) => {
    const m = new THREE.Mesh(geo, mat || crateSideMat);
    m.position.set(px, py, pz);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  };
  panel(new THREE.BoxGeometry(CRATE_W, CRATE_T, CRATE_D), 0, CRATE_T / 2, 0, crateInsideMat);   // 바닥
  const front = new THREE.BoxGeometry(CRATE_W, CRATE_H, CRATE_T);
  panel(front, 0, CRATE_H / 2, (CRATE_D - CRATE_T) / 2);                                        // 앞판
  panel(front, 0, CRATE_H / 2, -(CRATE_D - CRATE_T) / 2);                                       // 뒤판
  const side = new THREE.BoxGeometry(CRATE_T, CRATE_H, CRATE_D - CRATE_T * 2);
  panel(side, (CRATE_W - CRATE_T) / 2, CRATE_H / 2, 0);                                         // 오른쪽 판
  panel(side, -(CRATE_W - CRATE_T) / 2, CRATE_H / 2, 0);                                        // 왼쪽 판
  // 네 귀퉁이 테두리 — 판만 세우면 종이상자처럼 얇아 보여서 굵은 모서리를 덧대줍니다
  const rim = new THREE.BoxGeometry(CRATE_W + 0.03, 0.06 * BASKET_SCALE, CRATE_T + 0.03);
  panel(rim, 0, CRATE_H - 0.03 * BASKET_SCALE, (CRATE_D - CRATE_T) / 2, crateTopMat);
  panel(rim, 0, CRATE_H - 0.03 * BASKET_SCALE, -(CRATE_D - CRATE_T) / 2, crateTopMat);
  // 상자에 쌓이는 귤 자리 48개를 미리 만들어 두고, 담긴 개수만큼만 켭니다
  const COLS = 4, ROWS = 3, LAYERS = 4;
  const GAP = 0.21, RADIUS = 0.115;
  const packedGeo = new THREE.SphereGeometry(RADIUS, 8, 6);
  const yBottom = CRATE_T + RADIUS;
  const yStep = (CRATE_H - yBottom) / 2;
  for (let L = 0; L < LAYERS; L++) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const m = new THREE.Mesh(packedGeo, fruitMats.normal);
        const shift = (L % 2) * 0.5;   // 층마다 반 칸씩 어긋나게 쌓아야 서로 얹힌 것처럼 보입니다
        m.position.set(
          (c - (COLS - 1) / 2 + shift * 0.5) * GAP + (Math.random() - 0.5) * 0.03,
          yBottom + L * yStep,
          (r - (ROWS - 1) / 2 + shift * 0.5) * GAP + (Math.random() - 0.5) * 0.03
        );
        m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
        m.castShadow = true;
        m.visible = false;
        g.add(m);
        fruits.push({ mesh: m, pop: 0, base: 1 });
      }
    }
  }
  scene.add(g);
  return { group: g, fruits };
}

// ----- 상자 여러 개 -----
// 귤밭이 섬 여기저기 흩어져 있어서, 상자 하나를 끌고 왕복하면 하루가 다 갑니다.
// 상점에서 상자를 더 사서 밭마다 하나씩 놔두면 그 자리에서 바로 담을 수 있습니다.
// 끌고 다니는 건 늘 하나뿐(=basket)이고, 나머지는 놔둔 자리에 그대로 서 있습니다.
// 다른 상자 곁에서 귤을 따거나 F를 누르면 그 상자가 '지금 쓰는 상자'로 바뀝니다.
const crates = [];
function makeCrate(x, z) {
  const built = buildCrateMesh();
  const c = { group: built.group, fruits: built.fruits, x, z, facing: 0, count: 0, kinds: [] };
  c.group.position.set(x, groundHeight(x, z), z);
  crates.push(c);
  return c;
}
// 놔둔 상자의 겉모습 갱신 — 담긴 개수·종류만큼 귤을 켜줍니다
function renderCrate(c) {
  c.group.position.set(c.x, groundHeight(c.x, c.z), c.z);
  c.group.rotation.y = c.facing;
  c.group.scale.set(1, 1, 1);
  for (let i = 0; i < c.fruits.length; i++) {
    const f = c.fruits[i];
    const on = i < c.count;
    f.mesh.visible = on;
    if (!on) continue;
    const k = FRUITS[c.kinds[i]] ? c.kinds[i] : 'normal';
    f.mesh.material = fruitMats[k];
    f.base = FRUITS[k].size;
    f.mesh.scale.setScalar(f.base);
    f.pop = 0;
  }
}
// 지금 쓰는 상자 (맨 처음 것은 루루가 갖고 시작합니다)
let curCrate = makeCrate(0, 0);
let basket = curCrate.group;
let filledFruits = curCrate.fruits;
let basketCount = 0;
let basketKinds = [];

// 지금 상자에 담긴 것들의 값을 다 더합니다.
// 컨테이너 창고가 있으면 서늘하게 갈무리해 두었다가 부치는 셈이라 값이 두 배입니다.
function crateValue(c) {
  let v = 0;
  for (const k of (c.kinds || [])) v += FRUIT_UNIT * (FRUITS[k] || FRUITS.normal).mult;
  return hasContainer ? v * 2 : v;
}
function boxValue() { return crateValue({ kinds: basketKinds }); }

// 귤 한 알을 상자에 담습니다 (가득 차면 더 안 담기고 false를 돌려줍니다)
// 종류를 안 적으면 보통 감귤입니다. 한라봉·천혜향은 색도 크기도 달라 상자만 봐도 티가 납니다.
function addFruitToBasket(kind) {
  if (basketCount >= BASKET_CAP) return false;
  const k = FRUITS[kind] ? kind : 'normal';
  const f = filledFruits[basketCount];
  f.mesh.material = fruitMats[k];
  f.base = FRUITS[k].size;
  f.mesh.scale.setScalar(f.base);
  f.mesh.visible = true;
  f.pop = 1;                    // 톡 튀어오르며 자리잡는 연출
  basketKinds[basketCount] = k;
  basketCount++;
  updateBasketBadge();
  return true;
}

// 상자를 비웁니다 (나중에 택배사에 배송하면 여기서 다시 0으로 되돌립니다)
function emptyBasket() {
  for (const f of filledFruits) { f.mesh.visible = false; f.pop = 0; }
  basketCount = 0;
  basketKinds = [];
  updateBasketBadge();
}

updateBasketBadge();   // 시작할 때 "0/36"으로 한 번 표시

// 방금 담긴 귤이 제자리를 찾아 내려앉는 움직임
function updateFilledFruits(dt) {
  for (let i = 0; i < basketCount; i++) {
    const f = filledFruits[i];
    if (f.pop <= 0) continue;
    f.pop = Math.max(0, f.pop - dt * 4);
    const k = 1 + Math.sin(f.pop * Math.PI) * 0.45;   // 커졌다가 원래 크기로
    f.mesh.scale.setScalar(f.base * k);
  }
}

// (예전에는 상자를 잡으면 발밑에 노란 고리가 떴습니다. 루루가 상자를 붙잡은 자세로 바뀌는 것만으로
//  잡았다는 게 충분히 보여서, 화면을 어지럽히는 그 고리는 없앴습니다. 안내는 왼쪽 아래 배지가 합니다)

const flyingFruits = [];
const FLY_TIME = 0.45;     // 나무에서 바구니까지 날아가는 시간(초)
let basketPunch = 0;       // 귤이 떨어질 때 살짝 눌렸다 튀는 애니메이션 진행도

// 컨테이너는 게임 진행에 따라 움직이는 방식 자체가 바뀌는 "물리 오브젝트"입니다.
// - 끈을 사기 전(hasRope=false): 로프 없이 몸으로 부딪혀야만 밀려나는 무거운 상자 (힘들게 끌기)
// - 끈을 산 후(hasRope=true)  : 로프로 묶여 자동으로 뒤따라오는 견인 물리 (편하게 끌기)
// 배경 장식물(나무·돌담 등)과 달리 매 프레임 위치/속도가 갱신되는 게 이 오브젝트의 특징입니다.
const ROPE_LEN = 0.95 * BASKET_SCALE;      // 끈으로 묶었을 때 유지되는 거리 (상자 크기에 맞춰 늘림)
const GRAB_LEN = 0.55 * BASKET_SCALE;      // 손으로 직접 잡았을 때 유지되는 거리 (더 바짝 붙여서 실제로 붙잡은 것처럼)
const PUSH_MIN_DIST = 0.95 * BASKET_SCALE; // 끈이 없을 때, 루루 몸통 반지름 + 상자 반지름 정도의 충돌 거리
const basketPos = {
  x: state.x - Math.sin(state.facing) * ROPE_LEN,
  z: state.z - Math.cos(state.facing) * ROPE_LEN,
};
const basketVel = { x: 0, z: 0 };   // 끈 없이 밀 때만 쓰는 속도(무거운 상자라 마찰로 금방 멈춤)
let basketFacing = state.facing;

function currentBasketPos() {
  return { x: basketPos.x, y: groundHeight(basketPos.x, basketPos.z), z: basketPos.z };
}

function turnBasketToward(wantFacing, dt, speed) {
  let diff = wantFacing - basketFacing;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  basketFacing += diff * Math.min(1, dt * speed);
}

// 끈 없이: 루루가 몸으로 부딪힌 만큼만 밀려납니다 (자동으로 안 따라오고, 계속 부딪혀줘야 움직임)
function updateBasketPushed(dt) {
  const dx = basketPos.x - lulu.position.x, dz = basketPos.z - lulu.position.z;
  const dist = Math.hypot(dx, dz);
  if (dist < PUSH_MIN_DIST && dist > 0.0001) {
    const push = (PUSH_MIN_DIST - dist) * 22;
    basketVel.x += (dx / dist) * push * dt;
    basketVel.z += (dz / dist) * push * dt;
  }
  basketVel.x *= 0.86;   // 무거운 상자라 마찰로 금방 멈춥니다
  basketVel.z *= 0.86;
  basketPos.x += basketVel.x * dt;
  basketPos.z += basketVel.z * dt;

  if (Math.hypot(basketVel.x, basketVel.z) > 0.05) {
    turnBasketToward(Math.atan2(basketVel.x, basketVel.z), dt, 6);
  }

  // 그래도 깊이 겹치면 루루 쪽을 밀어냅니다 — 상자가 밀려나는 속도보다 루루 걸음이
  // 빨라서(특히 달리기) 몸이 상자를 뚫고 지나가던 오류를 여기서 막습니다.
  const px = basketPos.x - state.x, pz = basketPos.z - state.z;
  const pd = Math.hypot(px, pz);
  const minD = PUSH_MIN_DIST * 0.72;
  if (pd < minD && pd > 0.0001) {
    state.x = basketPos.x - (px / pd) * minD;
    state.z = basketPos.z - (pz / pd) * minD;
  }
}

// 끈으로 묶었거나 손으로 잡은 상태: 항상 루루로부터 정확히 ROPE_LEN만큼 떨어진 거리를 유지합니다.
// (너무 멀어지면 당겨오는 것뿐 아니라, 루루가 상자 쪽으로 다가가면 상자도 같이 밀려나야
//  캐릭터가 상자 속으로 뚫고 들어가는 일이 없습니다 — 팽팽한 막대를 쥐고 있는 것과 같은 느낌)
function updateBasketRoped(dt) {
  const len = state.grabbing ? GRAB_LEN : ROPE_LEN;   // 손으로 잡았을 땐 더 바짝, 끈으로 끌 땐 원래 거리
  const dx = basketPos.x - lulu.position.x, dz = basketPos.z - lulu.position.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.0001) {
    // 완전히 같은 자리에 겹치면 방향을 정할 수 없으므로, 루루가 보는 방향의 등 뒤로 둡니다
    basketPos.x = lulu.position.x - Math.sin(lulu.rotation.y) * len;
    basketPos.z = lulu.position.z - Math.cos(lulu.rotation.y) * len;
  } else {
    const k = len / dist;
    basketPos.x = lulu.position.x + dx * k;
    basketPos.z = lulu.position.z + dz * k;
  }
  // 상자가 있는 방향을 바구니가 바라보게 (급하게 돌지 않고 부드럽게)
  turnBasketToward(Math.atan2(basketPos.x - lulu.position.x, basketPos.z - lulu.position.z), dt, 10);
}

function updateBasket(dt) {
  // 끈을 샀거나(자동으로 따라옴), 지금 직접 손으로 잡고 있으면 → 항상 팽팽하게 뒤따르는 물리
  // 둘 다 아니면 → 몸으로 부딪혀야만 밀려나는 무거운 상자
  if (hasRope || state.grabbing) updateBasketRoped(dt); else updateBasketPushed(dt);

  const p = currentBasketPos();
  basket.position.set(p.x, p.y, p.z);
  basket.rotation.y = basketFacing;
  basketPunch = Math.max(0, basketPunch - dt * 4);   // 눌렸다 되돌아오는 정도가 시간에 따라 줄어듦
  basket.scale.set(1, Math.max(0.62, 1 - basketPunch * 0.32), 1);
  // 지금 쓰는 상자의 자리를 기록해 둡니다 (다른 상자로 갈아탈 때 여기 그대로 남습니다)
  curCrate.x = basketPos.x; curCrate.z = basketPos.z; curCrate.facing = basketFacing;
  updateRopeBadge();
}

// ----- 상자 갈아타기 -----
// 놔둔 상자 곁으로 가면 그 상자가 '지금 쓰는 상자'가 됩니다.
// 끌고 있던 상자는 있던 자리에 그대로 서 있고, 담아둔 귤도 그대로 남습니다.
function switchCrate(c) {
  if (c === curCrate) return false;
  // 쓰던 상자를 그 자리에 놓아둡니다
  curCrate.x = basketPos.x; curCrate.z = basketPos.z; curCrate.facing = basketFacing;
  curCrate.count = basketCount;
  curCrate.kinds = basketKinds.slice();
  renderCrate(curCrate);
  // 새 상자를 집어 듭니다
  curCrate = c;
  basket = c.group;
  filledFruits = c.fruits;
  basketCount = c.count;
  basketKinds = c.kinds.slice();
  basketPos.x = c.x; basketPos.z = c.z;
  basketFacing = c.facing;
  basketVel.x = 0; basketVel.z = 0;
  basketPunch = 0;
  renderCrate(c);
  updateBasketBadge();
  return true;
}
// 루루한테서 range 안에 있는 놔둔 상자 중 가장 가까운 것
function nearestOtherCrate(range) {
  let best = null, bd = range;
  for (const c of crates) {
    if (c === curCrate) continue;
    const d = Math.hypot(state.x - c.x, state.z - c.z);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}
// 상점에서 상자를 사면 상점 문 앞에 새 상자가 놓입니다 (방 안에 두면 끌고 나올 수가 없습니다)
function buyCrate(px, py, pz) {
  const c = makeCrate(SHOP_DOOR.x + (crates.length % 3) * 1.4 - 1.4, SHOP_DOOR.z - 2.6);
  renderCrate(c);
  playShipSound();
  spawnMoneyPopup(px, py, pz,
    `감귤상자를 샀어요 (모두 ${crates.length}개)\n상점 문 앞에 놓아뒀습니다`, 5);
}

// 끈이 없어도, 가까이 가서 E를 누르면 상자를 직접 손으로 잡고 원하는 방향으로 끌 수 있습니다.
// 잡은 동안은 끈으로 묶은 것과 똑같이 항상 팽팽하게 따라오므로(updateBasketRoped), 어느 방향으로
// 걷든 상자가 정확히 그 방향으로 딸려옵니다. 다시 E를 누르면 놓습니다.
const GRAB_RANGE = 1.8 * BASKET_SCALE;   // 이 거리 안에 있어야 잡을 수 있음
function tryToggleGrab() {
  if (hasRope) return;   // 끈을 산 뒤에는 항상 자동으로 따라오므로 따로 잡을 필요가 없습니다
  if (state.grabbing) {
    state.grabbing = false;   // 루루가 붙잡은 자세를 풀고 배지 문구가 바뀌는 것으로 놓았음을 보여줍니다
    return;
  }
  // 놔둔 상자가 더 가까우면 그 상자로 갈아탑니다 (밭마다 하나씩 놔뒀을 때 자연스럽게 이어집니다)
  const near = nearestOtherCrate(GRAB_RANGE);
  if (near && Math.hypot(near.x - state.x, near.z - state.z)
            < Math.hypot(basketPos.x - state.x, basketPos.z - state.z)) switchCrate(near);
  const dist = Math.hypot(basketPos.x - state.x, basketPos.z - state.z);
  if (dist > GRAB_RANGE) return;   // 너무 멀면 못 잡음
  state.grabbing = true;          // 잡는 순간부터 상자를 향해 몸을 돌리고, 항상 팽팽히 따라오기 시작합니다
  state.idleTime = 0;
}
// E키는 상황에 따라 다르게 씁니다: 뭍에서는 상자 잡기, 물속에서는 물질 끝내고 나오기.
// 상호작용 키는 F 하나로 통일했습니다. E는 손에 익은 분들을 위한 같은 기능의 별칭입니다.
// (E 별칭은 뺐습니다 — 상호작용은 F 하나뿐입니다)

// 딴 귤 하나를 나무 위치에서 바구니까지 실제 중력으로 포물선을 그리며 날려보냅니다
// (도착 시점의 위치를 미리 정해두고, 그 지점에 정확히 떨어지도록 초기 속도를 역산합니다)
function spawnFlyingFruit(x, y, z) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), tangerineMat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  scene.add(mesh);

  const p = currentBasketPos();
  const targetX = p.x, targetY = p.y + 0.56 * BASKET_SCALE, targetZ = p.z;   // 커진 상자의 입구 높이에 맞춤
  const vx = (targetX - x) / FLY_TIME;
  const vz = (targetZ - z) / FLY_TIME;
  const vy = (targetY - y) / FLY_TIME + 0.5 * GRAVITY * FLY_TIME;   // 포물선 도착 지점을 맞추기 위한 역산

  flyingFruits.push({
    mesh, vx, vy, vz, t: 0,
    spinX: (Math.random() - 0.5) * 14, spinZ: (Math.random() - 0.5) * 14,
  });
}

function updateFlyingFruits(dt) {
  for (let i = flyingFruits.length - 1; i >= 0; i--) {
    const f = flyingFruits[i];
    f.t += dt;
    f.vy -= GRAVITY * dt;               // 실제 중력 가속
    f.mesh.position.x += f.vx * dt;
    f.mesh.position.y += f.vy * dt;
    f.mesh.position.z += f.vz * dt;
    f.mesh.rotation.x += f.spinX * dt;   // 날아가며 데굴데굴 회전
    f.mesh.rotation.z += f.spinZ * dt;

    const p = currentBasketPos();
    const landed = f.t >= FLY_TIME * 0.85 && f.mesh.position.y <= p.y + 0.36;
    if (landed || f.t > FLY_TIME + 0.5) {   // 시간이 너무 지나도 안전하게 정리
      scene.remove(f.mesh);
      flyingFruits.splice(i, 1);
      basketPunch = 1;                      // 바구니가 귤 받는 순간 살짝 눌리는 반응
      // 날아온 귤이 여기서 비로소 "상자 안에 쌓인 귤" 한 알로 바뀝니다.
      // 수확하는 날엔 열 알에 하나꼴로 그날의 귤이 섞여 있습니다.
      // 칸은 똑같이 하나만 차지하고, 상자를 팔 때 값을 몇 배로 쳐줍니다.
      const special = EVENT_FRUIT[dayEvent];
      const kind = (special && Math.random() < SPECIAL_RATE) ? special : 'normal';
      if (addFruitToBasket(kind)) {
        playDropSound();                            // 나무통에 툭 떨어지는 소리
        if (kind !== 'normal') {
          const F = FRUITS[kind];
          stat[kind] = (stat[kind] || 0) + 1;
          playShipSound();
          spawnMoneyPopup(p.x, p.y + 1.1, p.z,
            `${F.name}! 보통 귤 ${F.mult}배 값이에요\n이 한 알만 ${formatWon(FRUIT_UNIT * F.mult)}`, 4);
        } else {
          spawnMoneyPopup(p.x, p.y + 0.9, p.z, '🍊 +1');   // 한 알 담겼습니다 (돈은 박스로 팔 때 한꺼번에)
        }
      }
      if (basketCount >= BASKET_CAP) {
        spawnMoneyPopup(p.x, p.y + 1.1, p.z, '상자가 가득 찼어요!');
      }
    }
  }
}

function tryHarvest() {
  if (state.harvestT >= 0 || !state.onGround) return;   // 이미 따는 중이거나 공중이면 못 땀
  const i = nearestFruit();
  if (i < 0) return;
  // 곁에 놔둔 상자가 있으면 그쪽에 담습니다 — 밭에 미리 갖다 둔 상자가 바로 쓰이도록.
  // 끌고 있는 중에는 갈아타지 않습니다 (손에 쥔 걸 놓칠 리 없으니까요)
  if (!state.grabbing) {
    const near = nearestOtherCrate(6);
    if (near && (basketCount >= BASKET_CAP ||
        Math.hypot(near.x - state.x, near.z - state.z)
          < Math.hypot(basketPos.x - state.x, basketPos.z - state.z))) switchCrate(near);
  }
  // 상자가 가득 차면 더 딸 수 없습니다 — 택배사에 보내고 빈 상자로 돌아와야 합니다
  if (basketCount + flyingFruits.length >= BASKET_CAP) {
    const p = currentBasketPos();
    spawnMoneyPopup(p.x, p.y + 1.1, p.z, '상자가 가득 찼어요 · 택배사로!');
    return;
  }
  const s = fruitSpots[i];
  state.facing = Math.atan2(s.x - state.x, s.z - state.z);   // 정확히 그 귤 쪽으로 몸을 돌린 다음
  targetRing.visible = false;
  playPickSound();                   // 가지에서 톡 떼어내는 소리
  spawnFlyingFruit(s.x, s.y, s.z);   // 나무에 매달려 있던 바로 그 자리에서 손으로 따서 날려보냄
  hideFruit(i, dayCount);            // 딴 날을 남깁니다 — 1년 뒤 이 자리에 다시 열립니다
  // 딸 때는 돈을 바로 받지 않습니다. 상자에 한 알씩 쌓이고, 가득 채워 배송해야 박스값을 받습니다.
  // 택배사에서 이장님과 정산해야 비로소 현금이 됩니다.
  state.harvestT = 0;
  state.idleTime = 0;
  state.sit = 0;
}

// (예전에는 상점에서 10만원짜리 끈을 팔았고, 사면 상자가 자동으로 따라왔습니다.
//  상자는 E로 손잡고 끄는 것으로 충분해서 끈 아이템은 뺐습니다. 이제 상점 앞에서는
//  당근과 씨앗, 망사리, 가구를 팝니다.)

// ---------- 12-1d. 택배사 — 이장님과 정산하고 육지로 부치기 ----------
// 상자를 가득 채워 가면 이장님이 담긴 것을 하나하나 보고 값을 쳐줍니다.
// 보통 감귤만 20칸이면 10,000원, 그 안에 황금향·한라봉·천혜향이 섞여 있으면 그만큼 더 받습니다.
// (덜 찬 상자는 안 사 줍니다 — "가득 채워서 오게!")
// 이장님이 택배사에 계셔야 정산이 됩니다 — 루루가 문앞에 서면 이장님이 걸어오니 잠깐 기다리세요.
// ----- 다섯 개 단위로 모아 팔기 -----
// 컨테이너 앞 「귤상자 두는 곳」에 가득 찬 상자를 쌓아두고 다섯 개 단위로 넘깁니다.
// 다섯 개마다 값이 두 배씩 뜁니다: 5개 ×2 · 10개 ×4 · 15개 ×8 · 20개 ×16.
// 한 번에 부칠 수 있는 것은 스무 상자까지입니다 — 그 위로는 아무리 쌓아도 ×16입니다.
// 상자 하나를 채우려면 귤 스무 알을 따야 하니 스무 상자면 사백 알입니다.
// 쌩노가다인 만큼 값을 크게 쳐주되, 한 번에 640만원까지로 묶어둡니다.
const BULK_STEP = 5, BULK_CAP = 20;
function bulkMultiplier(n) {
  return Math.pow(2, Math.floor(Math.min(BULK_CAP, Math.max(0, n)) / BULK_STEP));
}
// 상자가 지금 어디 있는지 (끌고 있는 것은 basketPos, 놔둔 것은 제 자리)
function crateSpot(c) {
  return c === curCrate ? { x: basketPos.x, z: basketPos.z, n: basketCount }
                        : { x: c.x, z: c.z, n: c.count };
}
function inCrateZone(c) {
  const p = crateSpot(c);
  return Math.hypot(p.x - CRATE_ZONE.x, p.z - CRATE_ZONE.z) < CRATE_ZONE.r;
}
// 「귤상자 두는 곳」에 쌓인, 가득 찬 상자들.
// 컨테이너를 사기 전에는 모아 파는 방식 자체가 없습니다 — 그때는 끌고 온 상자 하나씩 팝니다.
function cratesPiled() {
  if (!hasContainer) return [];
  return crates.filter((c) => crateSpot(c).n >= BASKET_CAP && inCrateZone(c));
}
// 실제로 넘어가는 것은 다섯 개 단위로, 한 번에 스무 개까지입니다.
// 일곱 개를 쌓아뒀으면 다섯 개만 나가고 두 개는 존에 그대로 남습니다.
// 스물세 개를 쌓아뒀으면 스무 개가 나가고 세 개가 남습니다 — 남은 것은 다음 밑천입니다.
function cratesReadyToShip() {
  const piled = cratesPiled();
  const n = Math.min(BULK_CAP, Math.floor(piled.length / BULK_STEP) * BULK_STEP);
  return piled.slice(0, n);
}

function tryShipBox() {
  const dp = depot.group.position;
  const popupY = dp.y + 3.2;
  // 컨테이너를 사기 전 — 끌고 온 상자 하나를 그 자리에서 넘깁니다 (예전 방식 그대로)
  const ready = hasContainer ? cratesReadyToShip() : (basketCount >= BASKET_CAP ? [curCrate] : []);
  if (!ready.length) {
    if (basketCount === 0) {
      spawnMoneyPopup(dp.x, popupY, dp.z, '상자가 비었어요 · 귤을 담아 오세요');
    } else if (hasContainer) {
      spawnMoneyPopup(dp.x, popupY, dp.z,
        `가득 찬 상자를 컨테이너 앞 「귤상자 두는 곳」에 쌓아두세요\n지금 상자 ${basketCount}/${BASKET_CAP}`);
    } else {
      spawnMoneyPopup(dp.x, popupY, dp.z,
        `상자를 가득 채워서 오게 (${basketCount}/${BASKET_CAP})\n지금까지 ${formatWon(boxValue())}`);
    }
    return;
  }
  // 이장님이 아직 오는 중이면 정산할 사람이 없습니다
  const mayorHere = Math.hypot(mayor.x - MAYOR_POSTS.depot.x, mayor.z - MAYOR_POSTS.depot.z) < 2.5;
  if (!mayorHere) {
    spawnMoneyPopup(dp.x, popupY, dp.z, '이장님이 오고 계세요\n잠깐만요');
    return;
  }
  // 담긴 것을 하나하나 세어 값을 매깁니다 — 특별한 귤이 섞였으면 그만큼 더 받습니다
  let base = 0, special = 0;
  for (const c of ready) {
    const kinds = c === curCrate ? basketKinds : c.kinds;
    base += c === curCrate ? boxValue() : crateValue(c);
    special += kinds.filter((k) => k !== 'normal').length;
  }
  // 배수는 컨테이너를 산 뒤 다섯 개 단위로 넘길 때만 붙습니다 (그 전에는 한 박스씩 제값)
  const mult = hasContainer ? bulkMultiplier(ready.length) : 1;
  const bonus = base * mult - base;
  coins += base + bonus;
  stat.boxes += ready.length;
  // 넘긴 상자는 전부 비워집니다 (상자 자체는 그 자리에 그대로 남습니다)
  for (const c of ready) {
    if (c === curCrate) { emptyBasket(); continue; }
    c.count = 0; c.kinds = [];
    renderCrate(c);
  }
  updateCoinBadge();
  playShipSound();
  // 스무 상자를 채우기까지 귤 사백 알을 딴 셈입니다. 그 결과를 잠깐 스치게 두지 않습니다.
  spawnMoneyPopup(dp.x, popupY, dp.z, ready.length === 1
    ? `이장님이 귤 한 박스를 사셨어요! +${formatWon(base)}`
    : `귤 ${ready.length}박스를 한 번에 넘겼어요! +${formatWon(base + bonus)}`, 6, 'big');
  if (bonus > 0) {
    const left = cratesPiled().length;
    setTimeout(() => spawnMoneyPopup(dp.x, popupY + 1.0, dp.z,
      `${ready.length}상자를 한 번에 넘겨서 ${mult}배로 쳐주셨어요 (+${formatWon(bonus)})` +
      (left ? `\n존에 ${left}상자가 남았어요` : ''), 5), 3200);
  } else if (special > 0) {
    setTimeout(() => spawnMoneyPopup(dp.x, popupY + 1.0, dp.z,
      `좋은 귤 ${special}알이 섞여 있어 값을 더 쳐주셨어요`, 5), 3200);
  }
}

// ---------- 12-1e. 해녀 물질 ----------
// 불턱에서 F를 누르면 바닷속으로 들어갑니다. 숨은 한정돼 있어서, 다 떨어지기 전에
// 수면으로 올라와야 합니다. 딴 것은 망사리에 담기고, 뭍으로 나올 때 한꺼번에 팝니다.
// 물질은 포구 축대 끝(바다 쪽 끝자락)에서 들어갑니다 — 축대를 끝까지 걸어나가야 합니다.
const DIVE_ENTRY = { x: 0, z: 101 };
const DIVE_ENTRY_RANGE = 2.6;
// 포구는 축대가 넓어서 인식 범위도 넉넉해야 합니다.
// ※ 예전에는 안내 문구가 5.2미터부터 뜨는데 실제 인식은 3.2미터라, 그 사이 2미터 구간에서
//   "누르세요"라고 해놓고 눌러도 아무 일이 안 일어났습니다. 이제 둘을 같은 값으로 맞춥니다.
const BULTEOK_RANGE = 6.0;
const BREATH_MAX = 60;         // 한 번 잠수해서 버틸 수 있는 시간(초)
const NET_CAP = 10;            // 망사리에 담을 수 있는 개수 (가득 차면 뭍으로 나가 팔아야 합니다)
const CATCH_RANGE = 1.7;       // 이 거리 안의 것만 딸 수 있음
let breath = BREATH_MAX;
let net = [];                  // 이번 물질에서 딴 것들의 종류 목록
let netNight = [];             // 각각을 밤에 땄는가 — 야간물질은 값을 2배로 쳐줍니다
let breathLow = false;         // 숨이 얼마 안 남아 몸이 무거워진 상태
let surfacing = 0;             // (예전 "저절로 떠오르기"의 잔재 — 이제 안 쓰지만 다른 코드가 참조합니다)
let drowning = 0;              // 0보다 크면 숨이 다해 정신을 잃는 중 (남은 시간)
const vignette = document.getElementById('vignette');

const breathBar = document.getElementById('breathFill');
const breathBox = document.getElementById('breathBar');
const netBadge = document.getElementById('netBadge');

function updateDiveUI() {
  if (breathBox) breathBox.style.display = state.diving ? 'block' : 'none';
  if (breathBar) {
    const pct = Math.max(0, breath / BREATH_MAX);
    breathBar.style.width = (pct * 100) + '%';
    breathBar.style.background = pct > 0.4 ? '#5fc6e8' : pct > 0.18 ? '#f0b429' : '#e2553d';
  }
  if (netBadge) {
    netBadge.style.display = state.diving || net.length ? 'block' : 'none';
    // 배지에도 바구니(🧺) 대신 그린 망사리를 씁니다 — 글자 높이에 맞춰 작게
    netBadge.innerHTML =
      `<span style="display:inline-block;width:1.15em;height:1.15em;vertical-align:-.25em;margin-right:.25em">${NET_ICON_SVG}</span>` +
      `망사리 ${net.length}/${NET_CAP}`;
    netBadge.classList.toggle('full', net.length >= NET_CAP);
  }
}

// 물속과 뭍은 안개 색과 빛만 바꿔도 완전히 다른 곳처럼 보입니다
const LAND_FOG = { color: 0xd2e6ee, near: 150, far: 700, sun: 2.1 };
// 물빛 — 수면 가까이는 볕이 들어 밝은 청록, 깊이 내려갈수록 짙푸르게 잠깁니다
const SEA_SHALLOW = new THREE.Color(0x1d7d92);
const SEA_DEEP = new THREE.Color(0x093243);
function applyDiveLook() {
  if (state.diving) {
    scene.fog.color.copy(SEA_SHALLOW);
    scene.fog.near = 1;
    scene.fog.far = 40;                 // 멀리 못 보게 해서 물속 답답함을 냅니다
    sun.intensity = 0.75;               // 물속은 볕이 잘 안 들지만, 아주 캄캄하면 아무것도 안 보입니다
    hemi.intensity = 1.0;
    // 하늘·구름·나비·성산일출봉을 감춥니다. 물속에서 이것들이 비치면
    // 물이 유리처럼 투명해 보여서 "잠수했다"는 느낌이 사라집니다.
    // 하늘을 그냥 끄면 그 자리가 시커먼 빈 공간으로 남으므로, 화면 바탕을 물빛으로 칠해둡니다.
    scene.background = SEA_SHALLOW.clone();
    sky.visible = false;
    for (const o of skyStuff) o.visible = false;
    for (const c of clouds) c.visible = false;
    for (const b of butterflies) b.visible = false;
    // 수면을 아래에서 올려다보면 은빛 천장처럼 보여야 합니다
    sea.material.side = THREE.DoubleSide;
    sea.material.opacity = 0.75;
  } else {
    scene.fog.color.setHex(LAND_FOG.color);
    scene.fog.near = LAND_FOG.near;
    scene.fog.far = LAND_FOG.far;
    sun.intensity = LAND_FOG.sun;
    hemi.intensity = 1.15;
    scene.background = null;   // 뭍에서는 하늘 구가 배경 노릇을 합니다
    sky.visible = true;
    for (const o of skyStuff) o.visible = true;
    for (const c of clouds) c.visible = true;
    for (const b of butterflies) b.visible = true;
    sea.material.side = THREE.FrontSide;
    sea.material.opacity = 0.94;
  }
  sea.material.needsUpdate = true;
}

// 물질하다 정신을 잃으면 닥터헬기가 실어 갑니다. 병원비는 늘 이만큼 나가고,
// 가진 돈이 모자라면 그만큼 빚으로 남습니다 (자산이 마이너스가 됩니다).
const HOSPITAL_FEE = 300000;

function enterDive() {
  stat.dives++;
  // 물질하러 갈 때마다 할망 잔소리가 다음 순서로 넘어갑니다 (20까지 순서대로, 그 뒤엔 랜덤)
  if (halmangDiveIdx < HALMANG_DIVE_LINES.length) { halmangDiveIdx++; saveGame(true); }
  state.diving = true;
  breath = BREATH_MAX;
  breathLow = false;
  surfacing = 0;
  drowning = 0;
  swimVel.x = 0; swimVel.z = 0;
  // 망사리는 여기서 비우지 않습니다 — 덜 채우고 나왔던 것을 이어서 채웁니다
  state.x = DIVE.x;
  state.z = DIVE.z - DIVE.r * 0.6;
  state.vy = 0;
  lulu.position.set(state.x, SEA_Y, state.z);   // 수면에서 시작해 가라앉습니다
  state.grabbing = false;
  state.idleTime = 0; state.sit = 0;
  applyDiveLook();
  updateDiveUI();
  // 야간물질 안내는 포구 배지가 이미 해줍니다 — 입수 알림은 하나로 통일
  spawnMoneyPopup(state.x, SEA_Y + 1.5, state.z, '물질 시작! 숨 조심하세요');
}

// 뭍으로 나올 때 — 망사리 열 칸을 가득 채웠을 때만 팝니다.
// 덜 채웠으면 담은 채로 나오고, 다시 들어가 마저 채우면 됩니다.
// 단, 숨이 다해 정신을 잃고 나온 것(reason === 'drown')이면 망사리를 통째로 잃습니다.
function leaveDive(reason) {
  let pay = 0;
  const tally = {};
  let nightSold = false;
  net.forEach((kind, i) => {
    // 밤에 딴 것은 값을 2배로 쳐줍니다 (야간물질 보너스)
    pay += CATCH_KINDS[kind].price * (netNight[i] ? 2 : 1);
    if (netNight[i]) nightSold = true;
    tally[kind] = (tally[kind] || 0) + 1;
  });
  const full = net.length >= NET_CAP;
  const caught = reason === 'drown' ? 0 : net.length;
  const lost = net.length;
  state.diving = false;
  // 가득 채워 팔 때와 물에 빠뜨렸을 때만 비웁니다 — 덜 찼으면 그대로 들고 나옵니다
  if (reason === 'drown' || full) {
    net = [];
    netNight = [];
  }
  breath = BREATH_MAX;
  breathLow = false;
  surfacing = 0;
  drowning = 0;
  state.pickT = -1;
  swimVel.x = 0; swimVel.z = 0;
  if (vignette) vignette.style.opacity = 0;
  state.x = PORT.x; state.z = PORT.z - 1.5;      // 포구의 마른 땅 쪽으로 올라옵니다
  state.vy = 0;
  lulu.position.set(state.x, groundHeight(state.x, state.z), state.z);
  state.onGround = true;
  state.idleTime = 0; state.sit = 0;
  applyDiveLook();
  updateDiveUI();

  const py = groundHeight(BULTEOK.x, BULTEOK.z) + 2.2;
  if (reason === 'drown') {
    // 정신을 잃으면 닥터헬기가 실어 갑니다 — 병원비는 30만원, 모자라면 빚으로 남습니다.
    // 그게 숨을 아껴야 하는 진짜 이유입니다. (죽는 순간 바로 저장해 새로고침 꼼수도 안 통합니다)
    coins -= HOSPITAL_FEE;
    const inDebt = coins < 0;
    stat.drowns++;
    // 망사리도 바다에 놓칩니다 — 물질을 다시 하려면 상점에서 새로 사야 합니다.
    // 돈까지 잃은 판이라, 그 돈은 귤을 따서 벌 수밖에 없습니다.
    const lostNet = hasNet;
    hasNet = false;
    netCarried = false;
    if (netObj) netObj.visible = false;
    updateCoinBadge();
    saveGame(true);
    // DIE 화면은 뭍에서 깨어난 뒤에도 한동안 머물다가 천천히 걷힙니다
    if (deathOverlay) setTimeout(() => deathOverlay.classList.remove('show'), 2800);
    spawnMoneyPopup(BULTEOK.x, py, BULTEOK.z,
      inDebt
        ? `의식을 잃고 닥터헬기가 나를 구조해줬다.\n병원비 ${formatWon(HOSPITAL_FEE)}이 없어 빚을 졌다.`
        : `의식을 잃고 닥터헬기가 나를 구조해줬다.\n병원비로 ${formatWon(HOSPITAL_FEE)}이 나갔다.`, 5.5);
    if (lost > 0) {
      setTimeout(() => spawnMoneyPopup(BULTEOK.x, py + 0.9, BULTEOK.z,
        `망사리에 담았던 ${lost}개도 바다에 흘렸습니다`, 5), 2600);
    }
    if (lostNet) {
      setTimeout(() => spawnMoneyPopup(BULTEOK.x, py + 1.8, BULTEOK.z,
        `망사리도 놓쳤어요\n다시 물질하려면 상점에서 사야 해요 (${formatWon(NET_PRICE)})`, 6), 4200);
    }
  } else if (caught > 0 && full) {
    coins += pay;
    for (const [k, n] of Object.entries(tally)) stat[k] = (stat[k] || 0) + n;
    updateCoinBadge();
    playShipSound();
    const list = Object.entries(tally).map(([k, n]) => `${CATCH_KINDS[k].name} ${n}`).join(' · ');
    // 숨 참아가며 건진 것이라 한 줄로 스치면 뭘 땄는지도 못 봅니다
    spawnMoneyPopup(BULTEOK.x, py, BULTEOK.z,
      `${list}\n+${formatWon(pay)}` +
      (nightSold ? '\n(야간물질 2배!)' : ''), 6, 'big');
  } else if (caught > 0) {
    // 덜 채웠으면 팔지 않습니다 — 담은 것은 그대로, 다시 들어가 마저 채우면 됩니다
    spawnMoneyPopup(BULTEOK.x, py, BULTEOK.z,
      `망사리 ${net.length}/${NET_CAP}\n열 칸을 가득 채워야 팔 수 있어요`, 5);
  } else {
    spawnMoneyPopup(BULTEOK.x, py, BULTEOK.z, '뭍으로 나왔어요');
  }
}

// 물속에서 정신을 잃을 때 — 낮게 잦아드는 소리
function playDrownSound() {
  blip(220, 55, 0.9, 0.18, 'sine');
}

// 손 닿는 곳에 있는, 아직 안 딴 채집물 찾기
function nearestCatch() {
  let best = -1, bestD = CATCH_RANGE;
  for (let i = 0; i < catchSpots.length; i++) {
    const s = catchSpots[i];
    if (s.picked) continue;
    const d = Math.hypot(s.x - state.x, s.z - state.z, );
    const dy = Math.abs(s.y - lulu.position.y);
    if (d < bestD && dy < 2.0) { bestD = d; best = i; }
  }
  return best;
}

function hideCatch(i) {
  const s = catchSpots[i];
  s.picked = true;
  s.pickedDay = dayCount;        // 이 날로부터 일주일 뒤에 바다 어딘가에 다시 생깁니다
  dummy.position.set(s.x, s.y, s.z);
  dummy.rotation.set(0, 0, 0);
  dummy.scale.setScalar(0);
  dummy.updateMatrix();
  const m = catchMeshes[s.kind];
  m.setMatrixAt(s.slot, dummy.matrix);
  m.instanceMatrix.needsUpdate = true;
}

// ----- 딴 자리는 일주일 뒤에 다시 생깁니다 -----
// 같은 자리가 아니라 물질장 아무 데나 새로 놓습니다. 외운 자리가 아니라
// 매번 새로 찾아다녀야 물질할 맛이 납니다.
// 전복만은 바위에 붙어 사니 바위 자리 중에서 고릅니다.
function rollCatchSpot(kind) {
  if (kind === 'abalone' && seaRocks.length) {
    const r = seaRocks[(Math.random() * seaRocks.length) | 0];
    const a = Math.random() * Math.PI * 2;
    return { x: r.x + Math.cos(a) * r.s * 0.8, y: r.y + r.s * 0.45, z: r.z + Math.sin(a) * r.s * 0.8 };
  }
  let x, z;
  // 축대 끝 앞 얕은 구역은 피합니다 (거기 놓이면 수면 위로 삐져나옵니다)
  do {
    const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * (DIVE.r - 2);
    x = DIVE.x + Math.cos(a) * rr;
    z = DIVE.z + Math.sin(a) * rr;
  } while (x > -5 && x < 5 && z < 108);
  return { x, y: seabedHeight(x, z) + 0.12, z };
}
function showCatch(s) {
  dummy.position.set(s.x, s.y, s.z);
  dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);   // 모형이 이미 바로 서 있어 방향만 돌립니다
  dummy.scale.set(1, 1, 1);
  dummy.updateMatrix();
  const m = catchMeshes[s.kind];
  m.setMatrixAt(s.slot, dummy.matrix);
  m.instanceMatrix.needsUpdate = true;
}
// 아침마다 한 번 — 일주일이 지난 자리를 되살립니다
function regrowCatches() {
  let back = 0;
  for (const s of catchSpots) {
    if (!s.picked) continue;
    if (dayCount - s.pickedDay < CATCH_REGROW_DAYS) continue;
    const p = rollCatchSpot(s.kind);
    s.x = p.x; s.y = p.y; s.z = p.z;
    s.picked = false;
    s.pickedDay = -1;
    showCatch(s);
    back++;
  }
  return back;
}

function tryCollect() {
  if (drowning > 0) return;   // 정신을 잃는 중
  if (net.length >= NET_CAP) {
    spawnMoneyPopup(state.x, lulu.position.y + 1.2, state.z, '망사리가 가득 찼어요 · 뭍으로!');
    return;
  }
  if (state.pickT >= 0) return;          // 이미 따는 중
  const i = nearestCatch();
  if (i < 0) return;
  const s = catchSpots[i];
  state.facing = Math.atan2(s.x - state.x, s.z - state.z);
  state.pickT = 0;                       // 손 뻗어 떼어내는 동작 시작
  hideCatch(i);
  net.push(s.kind);
  // 야간물질 보너스 — 밤에 딴 것은 팔 때 값을 2배로 쳐줍니다
  const night = isNight();
  netNight.push(night);
  playPickSound();
  updateDiveUI();
  spawnMoneyPopup(s.x, s.y + 0.6, s.z,
    night ? `${CATCH_KINDS[s.kind].name} (야간 2배)` : CATCH_KINDS[s.kind].name);
  state.idleTime = 0;
}

// 매 프레임 숨을 관리합니다. 수면 가까이 올라오면 숨을 다시 채웁니다.
//
// 숨이 다했을 때 툭 하고 뭍으로 순간이동시키면 너무 갑작스럽습니다. 「인사이드」처럼
// 서서히 조여오게 만듭니다: 숨이 얼마 안 남으면 화면 가장자리가 어두워지고 몸이 무거워지고,
// 다 떨어지면 루루가 스스로 수면을 향해 떠오른 다음 뭍으로 나옵니다.
const BREATH_LOW = 0.3;        // 이 아래로 떨어지면 "숨이 차는" 구간
const PICK_DURATION = 0.55;    // 전복 따는 동작이 재생되는 시간(초)
// 숨이 다하면 화면이 어두워지며 제주 속담과 DIE 자막이 떠오릅니다
const deathOverlay = document.getElementById('deathOverlay');
// 물속 부유물(플랑크톤 티끌) — 물이 텅 비어 있으면 옆으로 헤엄쳐도 화면에
// 아무 변화가 없어서 "키가 안 먹는다"고 느껴집니다. 작은 티끌들이 곁을
// 스쳐 지나가면 내가 어느 쪽으로 얼마나 움직이는지 눈에 보입니다.
let motes = null;
// 점(Points)은 그냥 두면 네모로 그려집니다. 물속 티끌·기포가 흰 사각형으로 보이면
// 아주 어색하므로, 가장자리가 부드럽게 흐려지는 동그란 그림을 만들어 씌웁니다.
function makeRoundSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.45, 'rgba(255,255,255,0.85)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.beginPath();
  g.arc(32, 32, 32, 0, Math.PI * 2);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  return t;
}
const ROUND_SPRITE = makeRoundSprite();
function buildMotes() {
  const n = 140, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * DIVE.r;
    pos[i * 3] = DIVE.x + Math.cos(a) * rr;
    pos[i * 3 + 1] = SEA_Y - 0.6 - Math.random() * (DIVE_DEPTH - 0.5);
    pos[i * 3 + 2] = DIVE.z + Math.sin(a) * rr;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  motes = new THREE.Points(g, new THREE.PointsMaterial({
    color: 0xcdeae6, size: 0.15, transparent: true, opacity: 0.6,
    map: ROUND_SPRITE, alphaTest: 0.02,
    sizeAttenuation: true, depthWrite: false,
  }));
  motes.visible = false;
  scene.add(motes);
}
buildMotes();

// ---------- 물속 풍경 — 빛줄기·기포·해초 ----------
// 안개 색 하나만으로는 "불 꺼진 방"처럼 보입니다. 물속답게 보이려면 겹이 필요합니다:
// 수면에서 비스듬히 내려오는 빛줄기, 떠오르는 기포, 앞뒤로 겹친 해초.
// 폰에서도 돌아가도록 전부 단순한 판·점으로만 만듭니다.
let seaRays = null, bubbles = null, weeds = null;
const bubbleData = [];
const weedData = [];

function buildSeaRays() {
  seaRays = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color: 0xbdf0f4, transparent: true, opacity: 0.16,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false,
  });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + Math.random() * 0.4;
    const rr = 3 + Math.random() * (DIVE.r - 5);
    // 위는 넓고 아래는 좁은 사다리꼴 판 — 수면에서 쏟아지는 빛기둥
    const w = 1.6 + Math.random() * 2.4;
    const g = new THREE.PlaneGeometry(w, DIVE_DEPTH + 3);
    const p = g.attributes.position;
    for (let v = 0; v < p.count; v++) {
      if (p.getY(v) < 0) p.setX(v, p.getX(v) * 0.35);   // 아래쪽을 좁혀 빛기둥 모양으로
    }
    p.needsUpdate = true;
    // 빛줄기마다 따로 일렁이게 하려면 재질을 각자 하나씩 가져야 합니다
    const m = new THREE.Mesh(g, mat.clone());
    m.position.set(DIVE.x + Math.cos(a) * rr, SEA_Y - DIVE_DEPTH * 0.45, DIVE.z + Math.sin(a) * rr);
    m.rotation.set(0.22 + Math.random() * 0.1, a, 0);   // 비스듬히 기울여 내리꽂히게
    m.userData.spin = a;
    seaRays.add(m);
  }
  seaRays.visible = false;
  scene.add(seaRays);
}

function buildBubbles() {
  const n = 90, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * DIVE.r;
    const x = DIVE.x + Math.cos(a) * rr, z = DIVE.z + Math.sin(a) * rr;
    const y = SEA_Y - Math.random() * DIVE_DEPTH;
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    bubbleData.push({ x, z, speed: 0.35 + Math.random() * 0.75, sway: Math.random() * Math.PI * 2 });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  bubbles = new THREE.Points(g, new THREE.PointsMaterial({
    color: 0xdff4f8, size: 0.2, transparent: true, opacity: 0.55,
    map: ROUND_SPRITE, alphaTest: 0.02,
    sizeAttenuation: true, depthWrite: false, fog: false,
  }));
  bubbles.visible = false;
  scene.add(bubbles);
}

function buildWeeds() {
  weeds = new THREE.Group();
  // 물속은 볕이 약해 그림자 지는 재질을 쓰면 새까맣게 묻힙니다.
  // 빛을 안 타는 재질에 밝은 물풀 색을 직접 입혀야 형체가 보입니다.
  const mats = [
    new THREE.MeshBasicMaterial({ color: 0x1f6b57, transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
    new THREE.MeshBasicMaterial({ color: 0x2a7a48, transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
    new THREE.MeshBasicMaterial({ color: 0x4a7a33, transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
  ];
  // 미역 잎 한 장 — 밑동은 넓고 끝으로 갈수록 가늘어지며 살짝 휩니다.
  // (그냥 네모 판을 세우면 초록 막대기처럼 보여서 물풀로 안 보입니다)
  function makeBlade(w, h) {
    const g = new THREE.PlaneGeometry(w, h, 1, 6);
    const p = g.attributes.position;
    for (let v = 0; v < p.count; v++) {
      const ratio = (p.getY(v) + h / 2) / h;          // 0 = 밑동, 1 = 잎끝
      p.setX(v, p.getX(v) * (1 - ratio * 0.82));      // 끝으로 갈수록 가늘게
      p.setY(v, p.getY(v) + h / 2);                   // 밑동을 원점에 맞춥니다
      p.setZ(v, p.getZ(v) + ratio * ratio * h * 0.18); // 물살에 밀린 듯 살짝 휘게
    }
    p.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }
  for (let i = 0; i < 34; i++) {
    const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * (DIVE.r - 3);
    const x = DIVE.x + Math.cos(a) * rr, z = DIVE.z + Math.sin(a) * rr;
    const gy = groundHeight(x, z);
    if (gy > SEA_Y - 2.5) continue;   // 물이 얕은 가장자리에는 심지 않습니다 (수면 위로 솟아 보입니다)
    // 한 포기에서 잎 서너 장이 부챗살처럼 뻗어 나옵니다
    const clump = new THREE.Group();
    clump.position.set(x, gy, z);
    const mat = mats[i % mats.length];
    const blades = 3 + Math.floor(Math.random() * 2);
    for (let b = 0; b < blades; b++) {
      const h = 1.2 + Math.random() * 2.2;
      const m = new THREE.Mesh(makeBlade(0.3 + Math.random() * 0.22, h), mat);
      m.rotation.y = (b / blades) * Math.PI * 2 + Math.random() * 0.5;
      m.rotation.z = (Math.random() - 0.5) * 0.4;     // 제각기 다른 쪽으로 기울어지게
      clump.add(m);
    }
    weeds.add(clump);
    weedData.push({ mesh: clump, phase: Math.random() * Math.PI * 2, amp: 0.08 + Math.random() * 0.13 });
  }
  weeds.visible = false;
  scene.add(weeds);
}
buildSeaRays();
buildBubbles();
buildWeeds();

// 물속 풍경을 살아 움직이게 합니다 — 기포는 떠오르고, 해초는 물결에 흔들리고,
// 빛줄기는 수면 물결처럼 아주 천천히 일렁입니다.
function updateSeaScenery(dt, t) {
  if (bubbles) {
    const p = bubbles.geometry.attributes.position;
    for (let i = 0; i < bubbleData.length; i++) {
      const b = bubbleData[i];
      let y = p.getY(i) + b.speed * dt;
      if (y > SEA_Y - 0.15) {                       // 수면에 닿으면 바닥에서 다시 올라옵니다
        y = SEA_Y - DIVE_DEPTH + Math.random() * 0.8;
      }
      p.setY(i, y);
      p.setX(i, b.x + Math.sin(t * 0.8 + b.sway) * 0.12);   // 오르며 살랑살랑
      p.setZ(i, b.z + Math.cos(t * 0.7 + b.sway) * 0.12);
    }
    p.needsUpdate = true;
  }
  for (const w of weedData) {
    w.mesh.rotation.z = Math.sin(t * 0.9 + w.phase) * w.amp;
    w.mesh.rotation.x = Math.cos(t * 0.6 + w.phase) * w.amp * 0.5;
  }
  if (seaRays) {
    for (const m of seaRays.children) {
      m.material.opacity = 0.12 + (Math.sin(t * 0.55 + m.userData.spin) + 1) * 0.045;
    }
  }
}

function updateDiving(dt) {
  if (state.pickT >= 0) {
    state.pickT += dt;
    if (state.pickT >= PICK_DURATION) state.pickT = -1;
  }
  if (motes) motes.visible = state.diving;
  if (seaRays) seaRays.visible = state.diving;
  if (bubbles) bubbles.visible = state.diving;
  if (weeds) weeds.visible = state.diving;
  if (state.diving) updateSeaScenery(dt, performance.now() * 0.001);
  if (!state.diving) { if (vignette) vignette.style.opacity = 0; return; }
  const atSurface = lulu.position.y > SEA_Y - 1.2;

  if (drowning > 0) {
    // 숨이 다해 정신을 잃는 중 — 몸이 축 처져 가라앉고, 화면이 조여들다가 뭍에서 깨어납니다.
    // 이 동안 딴 것(망사리)은 전부 바다에 흘려보냅니다. 그게 숨을 아껴야 하는 이유입니다.
    drowning -= dt;
    state.vy = Math.min(state.vy, -0.35);   // 몸에 힘이 빠져 아주 천천히 가라앉습니다
    swimVel.x *= 0.9; swimVel.z *= 0.9;
    if (vignette) vignette.style.opacity = Math.min(1, 1.4 - drowning * 0.6);
    if (drowning <= 0) { leaveDive('drown'); return; }
    updateDiveUI();
    return;
  }

  if (atSurface) {
    breath = Math.min(BREATH_MAX, breath + dt * 12);   // 수면에서 숨을 몰아쉽니다
    // 그림의 물결선(가슴께)이 실제 수면과 맞도록, 떠 있으면 그 높이에 살며시 붙습니다
    const goingDown = keys['ArrowDown'] || touchMove.f < -0.3;
    if (!goingDown && drowning <= 0) {
      // 물결 따라 몸이 천천히 오르내려야 "떠 있다"는 느낌이 납니다 (붙박이면 서 있는 것처럼 보입니다)
      const floatY = SEA_Y - 0.8 + Math.sin(performance.now() * 0.0016) * 0.09;
      lulu.position.y += (floatY - lulu.position.y) * Math.min(1, dt * 5);
      if (state.vy > 0.3) state.vy = 0.3;
    }
  } else {
    // 밤에는 물이 차고 어두워 숨이 1.5배 빨리 닳습니다 (야간물질 값 2배의 대가)
    breath -= dt * (isNight() ? 1.5 : 1);
    if (breath <= 0) {
      breath = 0;
      drowning = 4.2;                                   // 정신을 잃습니다 — 문구를 읽을 만큼 천천히 가라앉습니다
      if (deathOverlay) deathOverlay.classList.add('show');   // '욕심내민 바당이 데려간다' + DIE
      playDrownSound();
    }
  }

  const ratio = breath / BREATH_MAX;
  breathLow = ratio < BREATH_LOW;
  // 숨이 줄수록 화면 가장자리가 조여오고 물빛이 어두워집니다
  if (vignette) vignette.style.opacity = breathLow ? (1 - ratio / BREATH_LOW) * 0.75 : 0;
  if (atSurface) {
    // 수면에 떠 있을 때는 멀리까지 보여야 물과 하늘의 경계(수평선)가 삽니다
    scene.fog.color.setHex(0xd2e6ee);
    scene.fog.near = 150;
    scene.fog.far = 700;
    for (const o of skyStuff) o.visible = true;
    for (const c of clouds) c.visible = true;
  } else {
    // 물속 — 얕은 곳은 볕이 들어 밝고, 깊이 내려갈수록 짙푸르게 잠깁니다.
    // 이 깊이 그라데이션이 "얼마나 깊이 왔는지"를 눈으로 알려줍니다.
    const depth = Math.min(1, Math.max(0, (SEA_Y - lulu.position.y) / DIVE_DEPTH));
    scene.fog.color.copy(SEA_SHALLOW).lerp(SEA_DEEP, depth);
    if (scene.background && scene.background.copy) {
      scene.background.copy(SEA_SHALLOW).lerp(SEA_DEEP, depth);
    }
    scene.fog.near = 1;
    scene.fog.far = (40 - depth * 12) - (breathLow ? (1 - ratio / BREATH_LOW) * 16 : 0);
    for (const o of skyStuff) o.visible = false;
    for (const c of clouds) c.visible = false;
  }
  updateDiveUI();
}

// ---------- 12-1f. 페인트칠 — 집수리의 마지막 손길 ----------
// (망치·톱 수리는 뺐습니다 — 벽·지붕·문·창은 이제 상점 구매로 해결하고,
//  집에서 직접 하는 일은 골라 온 색으로 외벽을 칠하는 것 하나입니다)
// 공구대에서 페인트(색 고르기)를 사 온 뒤, 집 앞에서 F를 눌러 여섯 번 칠하면 완성.
const SWINGS_PER_STAGE = 6;    // 페인트칠을 끝내는 데 드는 붓질 횟수
const FIX_DURATION = 0.9;      // 한 번 휘두르는 동작 시간(초)
let fixSwings = 0;             // 붓질 몇 번 했나

function houseBadgeText() {
  if (endingState >= 2) return '곧 카페가 들어선다는 내 집… · 문 앞에 서면 안으로';
  // ("창고 30알"은 집수리로 상자가 커지던 옛 시스템의 잔재라 지웠습니다 — 지금 상자는 늘 20칸)
  if (houseStage >= 3) return '내 집! 문 앞에 서면 안으로 들어갑니다';
  if (!tools.paint) {
    return `외벽 페인트칠을 하려면 공구대에서 페인트를 사 오세요 (${formatWon(PAINT_PRICE)} · 색 고르기)`;
  }
  return `페인트칠 ${fixSwings}/${SWINGS_PER_STAGE}\n${KEY_ACTION_RO} 계속 · 문 앞에 서면 안으로`;
}

function tryFixHouse() {
  const py = groundHeight(HOUSE.x, HOUSE.z) + HOUSE_H * BUILD_SCALE + 0.6;
  if (houseStage >= 3) {
    spawnMoneyPopup(HOUSE.x, py, HOUSE.z,
      endingState >= 2 ? '…이 집도 곧 카페가 된다고 한다' : '다 고쳤어요. 좋은 집이네요!');
    return;
  }
  if (!tools.paint) {
    spawnMoneyPopup(HOUSE.x, py, HOUSE.z, '페인트가 필요해요\n상점 안 인테리어 코너에서 색을 골라 사 오세요');
    return;
  }
  // 붓질 한 번 — 동작이 끝나는 순간(updateHouse) 횟수가 올라갑니다
  state.fixT = 0;
  state.facing = Math.atan2(HOUSE.x - state.x, HOUSE.z - state.z);
  state.idleTime = 0; state.sit = 0;
  playHammerSound();
}

// 휘두르는 동작이 끝날 때마다 한 번으로 칩니다 (매 프레임 호출)
function updateHouse(dt) {
  if (state.fixT < 0) return;
  state.fixT += dt;
  if (state.fixT < FIX_DURATION) return;
  state.fixT = -1;
  fixSwings++;
  const py = groundHeight(HOUSE.x, HOUSE.z) + HOUSE_H * BUILD_SCALE + 0.6;
  if (fixSwings < SWINGS_PER_STAGE) {
    spawnMoneyPopup(HOUSE.x, py, HOUSE.z, `페인트칠 ${fixSwings}/${SWINGS_PER_STAGE}`);
    return;
  }
  // 칠 완성!
  fixSwings = 0;
  houseStage = 3;
  applyHouseLook();
  updateBasketBadge();
  playShipSound();
  spawnMoneyPopup(HOUSE.x, py, HOUSE.z, '페인트칠이 끝났어요\n거뭇하던 벽이 환해졌습니다');
}

// 망치질 소리 — 탕, 탕, 탕 세 번
function playHammerSound() {
  for (let i = 0; i < 3; i++) {
    setTimeout(() => blip(190, 90, 0.09, 0.22, 'square'), i * 420);
  }
}

// ---------- 12-1f-2. 이장님 (상점 ↔ 택배사를 오가는 NPC) ----------
// 이장님은 상점과 택배사 두 집 문앞을 오갑니다. 평소에는 느긋하게 왔다갔다 산책하고,
// 루루가 어느 집 문앞으로 다가가면 장사하러 그쪽으로 걸어옵니다.
const MAYOR_POSTS = {
  shop:  { x: 6.0, z: 41.6 },     // 상점 문앞
  depot: { x: -7.3, z: 42.2 },    // 택배사 문앞
};
const mayor = {
  x: MAYOR_POSTS.shop.x, z: MAYOR_POSTS.shop.z,
  post: 'shop',        // 지금 향하는 집
  stroll: 9,           // 손님이 없을 때, 이 시간이 지나면 반대편으로 산책
  headingRight: false,
};
const MAYOR_SPEED = 1.7;   // 뚱뚱한 어른의 느긋한 걸음

function updateMayor(dt, t) {
  if (!mayorGroup) return;
  // 루루가 어느 집 가까이에 있으면 그쪽으로 (손님이 먼저입니다)
  const nearShop = Math.hypot(state.x - MAYOR_POSTS.shop.x, state.z - MAYOR_POSTS.shop.z) < 6;
  const nearDepot = Math.hypot(state.x - MAYOR_POSTS.depot.x, state.z - MAYOR_POSTS.depot.z) < 6;
  if (nearShop) mayor.post = 'shop';
  else if (nearDepot) mayor.post = 'depot';
  else {
    mayor.stroll -= dt;
    if (mayor.stroll <= 0) {
      mayor.post = mayor.post === 'shop' ? 'depot' : 'shop';
      mayor.stroll = 8 + Math.random() * 10;
    }
  }

  // 목표 지점으로 걷기
  const goal = MAYOR_POSTS[mayor.post];
  const dx = goal.x - mayor.x, dz = goal.z - mayor.z;
  const d = Math.hypot(dx, dz);
  const walking = d > 0.25;
  if (walking) {
    mayor.x += (dx / d) * MAYOR_SPEED * dt;
    mayor.z += (dz / d) * MAYOR_SPEED * dt;
  }

  // 그림판 놓기 + 카메라 쪽으로 돌리기 (루루와 같은 방식)
  const gy = groundHeight(mayor.x, mayor.z);
  mayorGroup.position.set(mayor.x, gy, mayor.z);
  mayorGroup.rotation.y = Math.atan2(camera.position.x - mayor.x, camera.position.z - mayor.z);

  // 걷는 중이면 걷기 그림, 서 있으면 몸을 흔드는 그림
  const sheet = walking ? SHEETS.mayorWalk : SHEETS.mayorIdle;
  if (mayorCard.material.map !== sheet.tex) {
    mayorCard.material.map = sheet.tex;
    mayorCard.material.needsUpdate = true;
  }
  setCell(sheet, Math.floor(t * (walking ? 9 : 6)) % sheet.frames);

  // 걷는 방향이 화면상 왼쪽인지 오른쪽인지 (걷기 원본은 오른쪽을 봅니다 — 루루와 반대)
  if (walking) {
    camera.getWorldDirection(camFwd);
    const rightX = -camFwd.z, rightZ = camFwd.x;
    const toRight = dx / d * rightX + dz / d * rightZ;
    if (Math.abs(toRight) > 0.12) mayor.headingRight = toRight > 0;
  }
  const Hp = mayorCard.userData.planeH;
  const Wp = Hp * sheet.frameW / CELL_H;
  const mirrorM = walking && !mayor.headingRight;   // 왼쪽으로 갈 때 뒤집기
  mayorCard.scale.set(mirrorM ? -Wp : Wp, Hp, 1);
}


// ---------- 12-1f-2z. 무남이 (마을길의 백수 한량) ----------
// 하는 일은 없는데 이상하게 품격이 있어 보이는 남자. 제주 촌구석에서도 매일 수트 차림입니다.
// 루루가 집을 꾸며갈수록 한 단계씩 가까워지는데, 처음엔 젠틀하다가 갈수록
// "오늘은 물질 안 가냐"는 재촉만 늘어납니다. 그래도 곁에 있으면 묘하게 기분이 좋습니다.
// 무남이네 집 — 마구간과 헌집 사이, 섬 남쪽 바닷가.
// 백수인데 집은 그럴듯하고, 심지어 오션뷰입니다. 마당이 바다를 마주 봅니다.
// 무남이는 이 집 앞을 좀처럼 벗어나지 않습니다 (갈 데가 없으니까).
const MUNAM_HOUSE = { x: 12.0, z: -64.0, rot: Math.PI };   // 정면(마당)이 남쪽 바다를 향합니다
// 무남이는 걸어다니지 않습니다. 마당 끝에 의자를 내놓고 앉아 바다만 봅니다.
// 루루가 처음 그를 보는 것도 이 모습입니다 — 하는 일은 없는데 이상하게 품격이 있는 뒷모습.
// 집 앞마당 — 돌담으로 두른 안쪽입니다 (집이 남쪽을 보고 있어 마당도 남쪽)
const MUNAM_SEAT = { x: MUNAM_HOUSE.x - 1.6 * BUILD_SCALE, z: MUNAM_HOUSE.z - 3.4 * BUILD_SCALE };
const munam = {
  x: MUNAM_SEAT.x, z: MUNAM_SEAT.z,
  facing: Math.PI,   // 남쪽 바다 쪽
  group: null,
};
// 무남이가 대꾸를 해주기 시작하는 자산 — 가구·땅으로 이만큼은 갖춰야 사람 취급을 해줍니다.
// 현금이 아니라 산 것(assetTotal) 기준입니다. 야박하지만 그게 이 남자입니다.
const MUNAM_MIN_COINS = 10000000;
let munamIgnored = 0;                // 몇 번이나 무시당했나 — 루루의 속마음이 조금씩 바뀝니다

// 무남이네 돌집 — 루루의 헌집과 달리 처음부터 멀쩡합니다
function buildMunamHouse() {
  const g = new THREE.Group();
  const y = groundHeight(MUNAM_HOUSE.x, MUNAM_HOUSE.z);
  g.position.set(MUNAM_HOUSE.x, y, MUNAM_HOUSE.z);
  g.rotation.y = MUNAM_HOUSE.rot || 0;   // 마당이 바다를 향하도록 돌려 세웁니다
  const add = (mesh, px, py, pz) => {
    mesh.position.set(px, py, pz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  };
  const W = 6.2, D = 4.4, H = 3.4;   // 무남이 덩치에 맞춘 크기
  add(new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.36), shopStoneMat), 0, H / 2, -D / 2);
  add(new THREE.Mesh(new THREE.BoxGeometry(0.36, H, D), shopStoneMat), -W / 2, H / 2, 0);
  add(new THREE.Mesh(new THREE.BoxGeometry(0.36, H, D), shopStoneMat), W / 2, H / 2, 0);
  add(new THREE.Mesh(new THREE.BoxGeometry(1.5, H, 0.36), shopStoneMat), -1.75, H / 2, D / 2);
  add(new THREE.Mesh(new THREE.BoxGeometry(1.5, H, 0.36), shopStoneMat), 1.75, H / 2, D / 2);
  add(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 0.36), shopStoneMat), 0, H - 0.28, D / 2);
  // 닫힌 문 — 안이 들여다보이지 않습니다
  add(new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.05, 0.12), shopWoodMat), 0, 1.03, D / 2 + 0.02);
  add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0xb8892e, flatShading: true })), 0.62, 1.05, D / 2 + 0.1);
  // 초가지붕
  [[0.30, 3.55, 3.10, 0.78], [0.98, 2.95, 2.20, 0.72], [1.56, 2.00, 0.90, 0.78]].forEach(
    ([dy, rBot, rTop, h]) => {
      const tier = add(new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 8), shopThatchMat), 0, H + dy, 0);
      tier.rotation.y = Math.PI / 8;
    });
  // (마당에 있던 접이의자는 치웠습니다 — 무남이가 밭담 앞으로 자리를 옮겼거든요)
  scene.add(g);
  return g;   // 집을 막는 충돌은 빈터를 다 치운 뒤에 세웁니다 (아래 참고)
}

// 집터에 이미 자란 나무·돌은 걷어냅니다.
// (나무는 이 파일 앞쪽에서 벌써 다 심어놓은 뒤라, 자리를 비켜달라고 할 수가 없습니다.
//  풀과 꽃은 그대로 둡니다 — 마당이 휑해 보이면 안 되니까요)
let munamHouseGroup = null;
function clearTreesAround(cx, cz, r) {
  const m = new THREE.Matrix4(), v = new THREE.Vector3();
  // 반경 안의 귤나무(줄기 기준) 목록 — 잎은 줄기에서 2m, 귤은 3m 가까이 벗어날 수 있어서,
  // 낱개 좌표가 아니라 "소속 나무가 지워졌는가"로 함께 지워야 경계에서 조각이 안 남습니다
  const gone = [];
  for (const t of trunkSpots) {
    if (Math.hypot(t.x - cx, t.z - cz) < r) { t.cleared = true; gone.push(t); }   // cleared는 지도에서도 씁니다
  }
  const nearGoneTrunk = (x, z) => {
    for (const t of gone) if (Math.hypot(t.x - x, t.z - z) < 3.4) return true;
    return false;
  };
  const inHouse = (o) => {                       // 무남이네 집은 건드리지 않습니다
    for (let p = o; p; p = p.parent) if (p === munamHouseGroup) return true;
    return false;
  };
  scene.traverse((o) => {
    if (o.isInstancedMesh) {
      if (o.geometry.type === 'PlaneGeometry') return;   // 풀·유채꽃·억새는 남깁니다
      let changed = false;
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, m);
        v.setFromMatrixPosition(m);
        if (Math.hypot(v.x - cx, v.z - cz) < r || nearGoneTrunk(v.x, v.z)) {
          m.makeScale(0, 0, 0);
          o.setMatrixAt(i, m);
          changed = true;
        }
      }
      if (changed) o.instanceMatrix.needsUpdate = true;
      return;
    }
    // 한 그루씩 따로 세워둔 나무들 — 나무 그룹의 뿌리 좌표로 판정합니다.
    // (잎덩이 하나가 걸렸다고 통째로 지우면, 줄기가 경계 밖일 때 충돌만 남는 투명 벽이 됩니다)
    if (!o.isMesh || !o.geometry || inHouse(o)) return;
    if (o.geometry.type !== 'CylinderGeometry' && o.geometry.type !== 'IcosahedronGeometry') return;
    const tree = (o.parent && o.parent !== scene && !inHouse(o.parent)) ? o.parent : o;
    tree.getWorldPosition(v);
    if (v.y > 20) return;   // 구름처럼 하늘에 떠 있는 것은 나무가 아닙니다
    if (Math.hypot(v.x - cx, v.z - cz) >= r) return;
    tree.visible = false;
  });
  // 눈에서만 지우면 보이지 않는 벽이 남습니다 — 부딪히는 판정도 같이 걷어냅니다
  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (Math.hypot(obstacles[i].x - cx, obstacles[i].z - cz) < r) obstacles.splice(i, 1);
  }
  // 지워진 나무에 달려 있던 귤도 딴 것으로 표시합니다 — 안 하면 허공에 따기 고리가 뜹니다 (실제 발생한 버그)
  for (const s of fruitSpots) {
    if (!s.picked && (Math.hypot(s.x - cx, s.z - cz) < r || nearGoneTrunk(s.x, s.z))) s.picked = true;
  }
}
munamHouseGroup = buildMunamHouse();
// 집 둘레를 시원하게 틔웁니다 — 바다가 보이는 빈터라야 오션뷰 소리를 듣죠
clearTreesAround(MUNAM_HOUSE.x, MUNAM_HOUSE.z, 16);
for (let i = 1; i <= 4; i++) clearTreesAround(MUNAM_HOUSE.x, MUNAM_HOUSE.z - i * 6, 13);
// 빈터를 다 치운 뒤에야 집 자체를 막습니다 (먼저 세우면 위에서 같이 지워집니다).
// 반경은 벽에 닿을 만큼만 — 마당의 무남이 곁까지는 걸어갈 수 있어야 합니다.
obstacles.push({ x: MUNAM_HOUSE.x, z: MUNAM_HOUSE.z, r: 2.8 * BUILD_SCALE, topY: NO_JUMP });
// (평상에 앉아 있다가, 하루에 한 번 수트를 빼입고 큰길로 나갑니다 — updateMunamTrip)
const MUNAM_RANGE = 3.0;   // 마당이 넓어 조금 멀리서도 말을 걸 수 있게
let romanceStage = 0;                // 0 = 아직 못 만남, 6 = 프로포즈까지
let romanceSeen = {};                // 단계별 이벤트를 봤는지
let lonelySeen = {};                 // 외로움 독백을 봤는지
// 프로포즈 다음 아침, 무남이가 밭 하나를 몰래 팔아넘긴 것이 드러납니다.
// 수트를 빼입고 매일 어딜 가나 했더니 비트코인 설명회였습니다 (전재산을 냥코인에 넣었습니다).
// 0 = 아직 · 1 = 팔려서 되사와야 함 · 2 = 되사왔고 찐엔딩까지 봄
let munamSold = 0;

// 수트 입은 미남 — 갈색 줄무늬 고양이에 검은 쓰리피스, 흰 셔츠, 감색 넥타이.
// (평소엔 assets/farmcat/munam_sit.webp 그림이 쓰이고, 그림을 못 불러올 때만 아래 3D가 나섭니다)
function buildMunam() {
  const g = new THREE.Group();
  const suit = new THREE.MeshLambertMaterial({ color: 0x232630, flatShading: true });
  const shirt = new THREE.MeshLambertMaterial({ color: 0xf4f2ec, flatShading: true });
  const tie = new THREE.MeshLambertMaterial({ color: 0x33455e, flatShading: true });
  const fur = new THREE.MeshLambertMaterial({ color: 0x9c8a72, flatShading: true });      // 갈색 줄무늬
  const cream = new THREE.MeshLambertMaterial({ color: 0xeae2d4, flatShading: true });    // 얼굴·발 흰 부분
  const dark = new THREE.MeshLambertMaterial({ color: 0x1b1d24, flatShading: true });
  const add = (mesh, px, py, pz, parent) => {
    mesh.position.set(px, py, pz);
    mesh.castShadow = true;
    (parent || g).add(mesh);
    return mesh;
  };
  // 다리 — 잘 빠진 정장 바지에 흰 양말 같은 발
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.74, 8), suit), -0.13, 0.42, 0);
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.74, 8), suit), 0.13, 0.42, 0);
  add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.11, 0.3), cream), -0.13, 0.06, 0.04);
  add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.11, 0.3), cream), 0.13, 0.06, 0.04);
  // 상체 — 어깨가 넓은 재킷
  add(new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.72, 0.3), suit), 0, 1.13, 0);
  add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.12), shirt), 0, 1.17, 0.15);
  add(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.34, 0.05), tie), 0, 1.23, 0.21);
  // 팔 — 늘 주머니에 손을 꽂은 듯 느긋하게
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.08, 0.64, 8), suit), -0.34, 1.12, 0.02).rotation.z = 0.14;
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.08, 0.64, 8), suit), 0.34, 1.12, 0.02).rotation.z = -0.14;
  // 꼬리 — 줄무늬 꼬리를 뒤로 늘어뜨립니다
  const tail = new THREE.Group();
  tail.position.set(0, 0.82, -0.16);
  tail.rotation.x = -0.5;
  g.add(tail);
  for (let i = 0; i < 4; i++) {
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.045, 0.17, 6), i % 2 ? dark : fur),
      0, -0.09 - i * 0.16, 0, tail);
  }
  // 머리 — 몸에 견주어 아담하게. 고양이 얼굴에 무쌍 눈매입니다
  const head = new THREE.Group();
  head.position.y = 1.62;
  g.add(head);
  add(new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 12), fur), 0, 0, 0, head);
  add(new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), cream), 0, -0.05, 0.11, head).scale.set(1, 0.8, 0.55);
  add(new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.15, 6), fur), -0.12, 0.2, 0, head).rotation.z = 0.28;
  add(new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.15, 6), fur), 0.12, 0.2, 0, head).rotation.z = -0.28;
  // 무쌍 — 쌍꺼풀 없이 가로로 길게 그은 눈
  add(new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.02, 0.02), dark), -0.075, 0.03, 0.2, head);
  add(new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.02, 0.02), dark), 0.075, 0.03, 0.2, head);
  add(new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), dark), 0, -0.04, 0.21, head);
  // 살짝 넘긴 앞머리 — 품격은 여기서 나옵니다
  add(new THREE.Mesh(new THREE.SphereGeometry(0.213, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.42), dark), 0, 0.015, 0, head);
  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(0.42, 20),
    new THREE.MeshBasicMaterial({ color: 0x1d2b17, transparent: true, opacity: 0.36, depthWrite: false })
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.05;
  g.add(blob);
  g.userData.head = head;
  scene.add(g);
  return g;
}
munam.group = buildMunam();

// 무남이가 걸터앉은 평상 — 마당에 내놓은 넓적한 나무 마루입니다.
// 지붕과 같은 초가빛이라 집과 한 벌로 보이고, 낮고 평평해서 무남이를 하나도 가리지 않습니다.
// (예전에는 ㄷ자 돌담을 둘렀는데, 검은 돌이 무남이 앉은 몸을 잘라 먹었습니다.
//  그림 속 바닥색인 잿빛으로도 맞춰봤는데, 초가빛 쪽이 훨씬 예뻐서 되돌렸습니다)
const MUNAM_DECK_H = 0.36;   // 평상 마루 높이 — 무남이 그림도 이만큼 올라앉습니다
let munamWall = null;
{
  const g = new THREE.Group();
  const y = groundHeight(MUNAM_SEAT.x, MUNAM_SEAT.z);
  g.position.set(MUNAM_SEAT.x, y, MUNAM_SEAT.z);
  munamWall = g;
  const W = 3.4, D = 2.4, TOP = MUNAM_DECK_H, T = 0.12;   // 평상 크기와 마루 높이
  const topMat = shopThatchMat;                                                             // 마루널 — 지붕과 같은 초가빛
  const edgeMat = new THREE.MeshLambertMaterial({ color: 0xb99f66, flatShading: true });    // 테두리는 한 톤 어둡게
  const add = (mesh, px, py, pz) => {
    mesh.position.set(px, py, pz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  };
  // 마루널 일곱 장을 나란히 — 판 하나로 두면 밋밋해서 널을 갈라 깝니다
  const PLANKS = 7, gap = 0.03;
  const pw = (W - gap * (PLANKS - 1)) / PLANKS;
  for (let i = 0; i < PLANKS; i++) {
    add(new THREE.Mesh(new THREE.BoxGeometry(pw, T, D), topMat),
        -W / 2 + pw / 2 + i * (pw + gap), TOP - T / 2, 0);
  }
  // 마루를 두르는 테두리 — 앞뒤로 한 줄씩
  [D / 2 - 0.05, -D / 2 + 0.05].forEach((pz) => {
    add(new THREE.Mesh(new THREE.BoxGeometry(W + 0.12, T + 0.05, 0.1), edgeMat), 0, TOP - T / 2, pz);
  });
  // 네 귀퉁이 다리 — 땅에서 마루까지 짧게 받칩니다
  [[-W / 2 + 0.24, D / 2 - 0.24], [W / 2 - 0.24, D / 2 - 0.24],
   [-W / 2 + 0.24, -D / 2 + 0.24], [W / 2 - 0.24, -D / 2 + 0.24]].forEach(([px, pz]) => {
    add(new THREE.Mesh(new THREE.BoxGeometry(0.16, TOP - T, 0.16), edgeMat), px, (TOP - T) / 2, pz);
  });
  scene.add(g);
  // 평상은 낮아서 올라설 수 있습니다 (topY = 마루 높이)
  obstacles.push({ x: MUNAM_SEAT.x, z: MUNAM_SEAT.z, r: 1.7, topY: y + TOP });
}

// 무남이 그림(스프라이트)이 준비되면 3D 대신 그 그림을 세웁니다.
// MUNAM_H는 "서 있을 때의 키"입니다. 걷는 그림이 이 키로 섭니다.
// 루루는 머리가 그림 키의 45%, 무남이는 42%라 이 값에서 둘의 머리 크기가 같아집니다.
const MUNAM_H = 1.73;
// 평상에 앉은 그림은 8칸짜리 한 장입니다 (가로로 8칸). 숨 쉬듯 몸이 아주 조금 흔들립니다.
// 앞뒤로 오갔다 하며 트니(0→7→0) 끝이 처음으로 이어지는 자리를 안 찾아도 이음새가 없습니다.
// 앉은 키는 서 있는 키의 0.915배입니다 — 두 그림의 머리 폭이 화면에서 같아지는 값이라,
// 걸어와서 자리에 앉아도 같은 덩치로 보입니다.
const MUNAM_SIT_IMG = '../assets/farmcat/munam_sit.webp?v=5';   // 폰 서비스워커 캐시 때문에 ?v= 필수
const MUNAM_SIT_COLS = 8, MUNAM_SIT_FPS = 6;
const MUNAM_SIT_H = MUNAM_H * 0.915;
let munamCard = null, munamSitTex = null;
(function tryMunamSheet() {
  const img = new Image();
  img.onload = () => {
    munamSitTex = loadTexture(MUNAM_SIT_IMG);
    munamSitTex.repeat.set(1 / MUNAM_SIT_COLS, 1);
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.translate(0, 0.5, 0);      // 발밑을 기준으로 세웁니다
    munamCard = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      map: munamSitTex,
      transparent: true, alphaTest: 0.08,
      side: THREE.DoubleSide,      // 어느 쪽에서 다가와도 보이게
    }));
    munamCard.userData.ratio = (img.width / MUNAM_SIT_COLS) / img.height;

    munam.group.add(munamCard);
    // 그림이 붙었으니 3D 몸은 감춥니다 (그림자만 남깁니다)
    for (const c of munam.group.children) {
      if (c !== munamCard && c.type === 'Mesh' && c.geometry.type !== 'CircleGeometry') c.visible = false;
      if (c.type === 'Group') c.visible = false;
    }
  };
  img.onerror = () => {};   // 그림이 아직 없으면 3D 무남이 그대로
  img.src = MUNAM_SIT_IMG;
})();

// ----- 수트를 빼입고 걸어가는 무남이 -----
// 걷는 모습을 한 장에 몰아 담았습니다. 가로 6칸이 한 걸음 주기, 세로 3줄이 방향입니다.
//   0번 줄 = 이쪽으로 걸어옴 · 1번 줄 = 옆으로 지나감 · 2번 줄 = 저쪽으로 걸어감
// 카메라가 어디 있느냐에 따라 줄을 골라 붙이니, 돌아가며 봐도 뒤통수가 앞으로 오지 않습니다.
const MUNAM_WALK_IMG = '../assets/farmcat/munam_walk.webp?v=2';
const MUNAM_WALK_COLS = 6, MUNAM_WALK_ROWS = 3, MUNAM_WALK_FPS = 9;
let munamWalkCard = null, munamWalkTex = null;
(function tryMunamWalk() {
  const img = new Image();
  img.onload = () => {
    munamWalkTex = loadTexture(MUNAM_WALK_IMG);
    munamWalkTex.repeat.set(1 / MUNAM_WALK_COLS, 1 / MUNAM_WALK_ROWS);
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.translate(0, 0.5, 0);      // 발밑을 기준으로 세웁니다
    munamWalkCard = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      map: munamWalkTex, transparent: true, alphaTest: 0.08, side: THREE.DoubleSide,
    }));
    munamWalkCard.userData.ratio = (img.width / MUNAM_WALK_COLS) / (img.height / MUNAM_WALK_ROWS);
    munamWalkCard.visible = false;
    munam.group.add(munamWalkCard);
  };
  img.onerror = () => {};
  img.src = MUNAM_WALK_IMG;
})();

// ----- 무남이의 외출 -----
// 하루에 한 번, 점심때쯤 수트를 빼입고 큰길로 걸어나갔다가 저녁 전에 돌아옵니다.
// 어디 가느냐고 물어도 대답이 없습니다. 나중에 알게 됩니다 — 비트코인 설명회였다는 걸.
// 밭을 팔아먹은 게 들통난 뒤로는(munamSold >= 1) 두 번 다시 나가지 않습니다.
const MUNAM_ROUTE = [
  { x: MUNAM_SEAT.x,          z: MUNAM_SEAT.z },        // 평상
  { x: MUNAM_HOUSE.x - 4.2,   z: MUNAM_HOUSE.z },       // 집 옆을 돌아
  { x: MUNAM_HOUSE.x - 2.0,   z: MUNAM_HOUSE.z + 7 },   // 마당을 나서서
  { x: 16.5,                  z: -49.5 },               // 큰길 — 여기서 멀어지며 사라집니다
];
const MUNAM_OUT_AT = 0.34;      // 하루의 34% 지점에 나섭니다 (점심때)
const MUNAM_BACK_AT = 0.46;     // 46% 지점에 돌아옵니다
const MUNAM_WALK_SPEED = 1.6;   // 초당 미터
let munamTrip = 0;              // 0 = 평상 · 1 = 나가는 길 · 2 = 경마장(안 보임) · 3 = 돌아오는 길
let munamTripDay = -1;          // 오늘 벌써 나갔다 왔는지
let munamLeg = 0;               // 지금 몇 번째 구간을 걷는 중인지
let munamWalkT = 0;             // 걷는 그림을 넘기는 시계
let munamSeenOut = false;       // 나서는 모습을 처음 봤을 때만 한마디 띄웁니다
function munamAway() { return munamTrip === 2; }
function munamCanGoOut() {
  return romanceStage >= 1 && munamSold === 0 && !talkOpen();
}

// 무남이는 현금이 아니라 "산 것"을 봅니다 — 집에 들인 가구·수리와 사버린 땅(assetTotal).
// 통장에 돈만 쌓아둔 것은 안 쳐줍니다. 자산이 늘 때마다 만남의 단계가 열립니다.
// 1천만 → 2천만 → 3천만 → 5천만 → 7천만 → 1억 (사용자 지정, 2026-08-11).
// 단계가 열려도 무남이를 직접 찾아가 말을 걸어야 그 이야기를 봅니다.
function romanceUnlocked() {
  const a = assetTotal();
  if (a >= 100000000) return 6;   // 1억 — 결혼생활 → 서류가방 외출 영상
  if (a >= 70000000) return 5;    // 7천만 — 소파 낮잠 영상
  if (a >= 50000000) return 4;    // 5천만 — 바닷가 데이트
  if (a >= 30000000) return 3;    // 3천만 — 밥을 얻어먹음
  if (a >= 20000000) return 2;    // 2천만 — 집 앞에 찾아옴
  if (a >= 10000000) return 1;    // 1천만 — 마을길에서 첫 대답
  return 0;                       // 그 전에는 인사해도 "....."
}

// 무시당할 때 — 자산이 1천만 미만이면 인사를 해도 대답이 없습니다 (말 걸 때마다 순환).
const MUNAM_IGNORE = [
  ['루루: 안녕하세요.',
   '"....."',
   '(무남이는 대답하지 않았다)',
   '루루: 뭐하는 사람인데 저렇게 양복을 빼입고 있지. 근데 잘생겼다.......'],
  ['루루: 저기, 안녕하세요.',
   '"....."',
   '(무남이는 하늘만 보고 있었다)',
   '루루: 돈이나 벌러가야겠다.'],
];

// 무남이 미션 — 각 단계는 [대사 → 영상 → 대사] 순서로 이어집니다 (사용자 대본, 2026-08-12).
// talk = 대사 한 묶음, clip = 그 자리에서 재생할 영상 파일 이름.
const MUNAM_SEQ = {
  1: [
    { talk: ['루루: 안녕하세요.',
             '"…음."',
             '(처음으로 대답이 돌아왔다)',
             '"인생 뭐 있냥…\n오늘도 바람 좋네."'] },
    { clip: 'munam_stage1' },
    { talk: ['루루: …안녕하세요.',
             '"....."',
             '(또 대답을 안하네)',
             '우리집이 너무 후져서 상대도 안 해주나.',
             '루루: 집을 빨리 꾸며야겠다.'] },
  ],
  2: [
    { talk: ['"혼자 집을 고치는 모양이던데. 대단하군."'] },
    { clip: 'munam_stage2' },
    { talk: ['"집고치는게 쉬운일이 아닌데 여자 혼자 대단하시네요."'] },
  ],
  3: [
    { talk: ['루루: 저기 무슨일 하시는 분이세요?',
             '"하는 일은… 뭐, 특별히 없소."',
             '(마을 사람들도 무남이가 무슨 일을 하는지 모른다고 했다)',
             '루루: 백수면 어때. 잘생겼으면 됐지.'] },
    { clip: 'munam_stage3' },
    { talk: ['"오늘 날씨가 참 좋군."',
             '"이런 날은 아무것도 안 하기 좋지."',
             '"밥은 먹었소? 나는 아직인데."'] },
  ],
  4: [
    { talk: ['"배가 좀 고픈데."',
             '(무남이는 루루가 차린 밥상을 아주 맛있게 먹었다)',
             '"잘 먹었소. 손맛이 좋군."',
             '루루: 얻어먹으면서 저렇게 당당할 일인가.\n…근데 왜 기분이 좋지.'] },
    { clip: 'munam_stage4' },
    { talk: ['"매일 집고치느라 힘들텐데 오늘은 나랑 바다나 보러 가지."',
             '(둘은 말없이 바닷가를 걸었다)',
             '"나는 가진 게 없소."',
             '"그래도 옆에 있는 건 할 수 있지."'] },
  ],
  5: [
    { talk: ['"집에 소파가 아주 편안하더군. 낮잠 자기 딱 좋겠어."',
             '(무남이는 정말로 낮잠을 잤다)'] },
    { clip: 'munam_nap' },      // 소파에서 낮잠 자는 무남이 (사용자 제공, 2026-08-12)
    { talk: ['"…그런데 너 오늘은 물질하러 안 가냐?"',
             '루루: 방금 자고 일어난 사람이 할 말인가.',
             '루루: 그런데 이 집에 누가 있다는 게…\n생각보다 나쁘지 않다.'] },
  ],
  6: [
    { talk: ['루루: 집도 완성됐고 멋진 냥자친구도 생겼네. 저남자가 내남자라니!',
             '"근데 경마 우승상금이 얼마라 그랬지?"',
             '"아니, 그냥 궁금해서 물어본 거야."'] },
    { clip: 'munam_stage6' },   // 서류가방 외출 영상 (배신 복선)
    { talk: ['"오늘 귤은 몇 상자 부쳤어?"',
             '"아니, 사랑한다고. 관심보여주는건데 왜 화를 내."'] },
  ],
};
// 한 단계의 대사·영상을 순서대로 재생합니다 (talk → clip → talk …)
function playMunamSeq(steps, done) {
  let i = 0;
  (function step() {
    if (i >= steps.length) { if (done) done(); return; }
    const s = steps[i++];
    if (s.talk) startTalk('무남이', s.talk, step);
    else if (s.clip) playClip(s.clip, '무남이와의 추억', step);
    else step();
  })();
}
// 그 단계에서 다시 말을 걸면 보여줄 마지막 대사 토막
function munamTailTalk(stage) {
  const seq = MUNAM_SEQ[Math.max(1, stage)] || [];
  for (let i = seq.length - 1; i >= 0; i--) if (seq[i].talk) return seq[i].talk;
  return ['"…"'];
}

function munamTalk() {
  // 자산(산 것)이 모자라면 인사를 해도 받아주지 않습니다.
  // 야박하지만, 루루가 집과 땅을 늘려야 할 이유가 하나 더 생기는 셈입니다.
  if (romanceStage === 0 && assetTotal() < MUNAM_MIN_COINS) {
    const lines = MUNAM_IGNORE[Math.min(munamIgnored, MUNAM_IGNORE.length - 1)];
    munamIgnored++;
    startTalk('무남이', lines, () => saveGame(true));
    return;
  }
  // 밭을 팔아먹은 상태 — 되사왔고 1억도 다시 찼으면 여기서 찐엔딩이 이어집니다
  if (munamSold === 1) {
    if (tryTrueEndingNow()) return;
    // 아직 못 되사왔으면, 무슨 말을 걸어도 사과뿐입니다
    startTalk('무남이', MUNAM_SORRY[(munamIgnored++) % MUNAM_SORRY.length], () => saveGame(true));
    return;
  }
  const open = romanceUnlocked();
  // 아직 못 본 단계가 있으면 그 단계의 [대사→영상→대사] 순서를 통째로 들려줍니다
  if (open > romanceStage) {
    const next = romanceStage + 1;
    romanceStage = next;
    romanceSeen[next] = true;
    saveGame(true);
    playMunamSeq(MUNAM_SEQ[next] || [{ talk: ['"…"'] }], () => saveGame(true));
    return;
  }
  // 프로포즈(6단계)까지 다 봤고 산 것으로 1억을 채웠으면, 다시 말을 걸 때 배신이 터집니다 (사용자 지정)
  if (romanceStage >= 6 && munamSold === 0 && dreamDone() && tryBetrayalNow()) return;
  // 그 단계에서 다시 말 걸면 마지막 대사를 다시 보여줍니다
  startTalk('무남이', munamTailTalk(romanceStage));
}

// 하루 흐름에 맞춰 무남이를 평상에서 일으켰다 앉혔다 합니다.
// 걷는 동안에는 munam.x·z가 실제로 움직이므로, 말을 거는 거리도 저절로 따라옵니다.
function updateMunamTrip(dt) {
  const day01 = gameT / DAY_LEN;
  // 나설 시간 — 오늘 아직 안 나갔다면 자리에서 일어납니다
  if (munamTrip === 0 && munamTripDay !== dayCount &&
      day01 >= MUNAM_OUT_AT && day01 < MUNAM_BACK_AT && munamCanGoOut()) {
    munamTrip = 1; munamLeg = 0; munamTripDay = dayCount;
    if (!munamSeenOut && Math.hypot(state.x - munam.x, state.z - munam.z) < 22) {
      munamSeenOut = true;
      spawnMoneyPopup(munam.x, groundHeight(munam.x, munam.z) + 2.6, munam.z,
        '무남이가 수트를 빼입고 어디론가 나선다', 5);
    }
  }
  // 경마장에 가 있는 동안 — 돌아올 때가 되면 큰길 끝에서 다시 나타납니다.
  // 날이 바뀌도록 안 돌아왔으면(어딘가에서 밤을 새웠으면) 그때도 집으로 돌립니다.
  if (munamTrip === 2) {
    if (day01 >= MUNAM_BACK_AT || dayCount !== munamTripDay) {
      munamTrip = 3; munamLeg = MUNAM_ROUTE.length - 1;
      const p = MUNAM_ROUTE[munamLeg];
      munam.x = p.x; munam.z = p.z;
    }
    return;
  }
  if (munamTrip === 0) return;
  if (talkOpen()) return;              // 말을 거는 동안에는 멈춰 섭니다
  // 다음 목적지를 향해 한 걸음
  const dir = munamTrip === 1 ? 1 : -1;
  const goal = MUNAM_ROUTE[munamLeg + dir];
  if (!goal) { munamTrip = 0; return; }
  let dx = goal.x - munam.x, dz = goal.z - munam.z;
  const d = Math.hypot(dx, dz);
  const step = MUNAM_WALK_SPEED * dt;
  munam.facing = Math.atan2(dx, dz);
  munamWalkT += dt;
  if (d <= step) {
    munam.x = goal.x; munam.z = goal.z;
    munamLeg += dir;
    if (munamTrip === 1 && munamLeg >= MUNAM_ROUTE.length - 1) munamTrip = 2;   // 큰길 끝 — 사라집니다
    if (munamTrip === 3 && munamLeg <= 0) {                                     // 평상에 도착 — 다시 앉습니다
      munamTrip = 0; munam.facing = Math.PI;
    }
  } else {
    munam.x += dx / d * step;
    munam.z += dz / d * step;
  }
}

// 걷는 무남이를 화면에 세웁니다.
// 종잇장 한 장이라 늘 카메라를 정면으로 보게 돌려 세우고,
// 대신 "가는 방향과 보는 방향이 얼마나 어긋났는가"로 앞·옆·뒤 줄을 골라 붙입니다.
function drawMunamWalk() {
  const gy = groundHeight(munam.x, munam.z);
  munam.group.position.set(munam.x, gy, munam.z);
  munam.group.rotation.y = 0;
  const toCam = Math.atan2(camera.position.x - munam.x, camera.position.z - munam.z);
  munamWalkCard.rotation.y = toCam;
  // 가는 방향에서 카메라 방향을 뺀 각 — 0도면 이쪽으로 오고, 180도면 저쪽으로 갑니다
  const rel = Math.atan2(Math.sin(munam.facing - toCam), Math.cos(munam.facing - toCam));
  const a = Math.abs(rel);
  const row = a < Math.PI * 0.30 ? 0 : (a > Math.PI * 0.70 ? 2 : 1);
  const frame = Math.floor(munamWalkT * MUNAM_WALK_FPS) % MUNAM_WALK_COLS;
  munamWalkTex.offset.set(frame / MUNAM_WALK_COLS, 1 - (row + 1) / MUNAM_WALK_ROWS);
  // 옆모습 그림은 왼쪽을 보고 걷습니다. 오른쪽으로 지나갈 때는 좌우를 뒤집습니다.
  const w = MUNAM_H * munamWalkCard.userData.ratio;
  munamWalkCard.scale.set(row === 1 && rel > 0 ? -w : w, MUNAM_H, 1);
  if (munamWall) munamWall.rotation.y = Math.PI;
}

function updateMunam(dt, t) {
  if (!munam.group) return;
  updateMunamTrip(dt);
  // 집 안이나 물속에 있으면 굳이 그리지 않습니다. 경마장에 가 있는 동안에도 안 보입니다.
  munam.group.visible = !state.inside && !state.inShop && !state.diving && !munamAway();
  if (!munam.group.visible) return;
  // 걷는 중이면 걷는 그림으로, 아니면 평상에 앉은 그림으로 갈아 끼웁니다
  if (munamWalkCard) {
    const walking = munamTrip === 1 || munamTrip === 3;
    munamWalkCard.visible = walking;
    if (munamCard) munamCard.visible = !walking;
    if (walking) { drawMunamWalk(); return; }
  }
  // 나가 있는 때 말고는 하루 종일 여기 평상에 다리를 꼬고 앉아 있습니다.
  const gy = groundHeight(munam.x, munam.z);
  // 평상 마루 위에 걸터앉아 있습니다. 숨 쉬듯 아주 조금만 오르내립니다.
  munam.group.position.set(munam.x, gy + MUNAM_DECK_H + Math.sin(t * 1.4) * 0.008, munam.z);
  munam.group.rotation.y = munam.facing;
  if (munam.group.userData.head) {
    munam.group.userData.head.rotation.x = Math.sin(t * 0.5) * 0.1;   // 가끔 수평선을 훑습니다
  }
  // 앉은 그림은 앞모습이라, 종잇장을 늘 카메라 쪽으로 돌려 세웁니다.
  // 어느 쪽에서 다가와도 무남이와 눈이 마주칩니다 (옆에서 봐도 선처럼 얇아지지 않습니다).
  if (munamCard) {
    munamCard.scale.set(MUNAM_SIT_H * munamCard.userData.ratio, MUNAM_SIT_H, 1);
    munam.group.rotation.y = 0;
    munamCard.rotation.y = Math.atan2(camera.position.x - munam.x, camera.position.z - munam.z);
    // 8칸을 0→7→0으로 오갑니다. 되돌아오니 첫 칸과 끝 칸이 안 부딪칩니다.
    if (munamSitTex) {
      const span = MUNAM_SIT_COLS * 2 - 2;
      const k = Math.floor(t * MUNAM_SIT_FPS) % span;
      munamSitTex.offset.x = (k < MUNAM_SIT_COLS ? k : span - k) / MUNAM_SIT_COLS;
    }
    if (munamWall) munamWall.rotation.y = Math.PI;   // 담은 그 자리에 붙박이 — 집 쪽만 터놓습니다
  }
}

// 집을 꾸며갈수록 혼자라는 게 더 크게 느껴집니다 — 가구를 살 때마다 가끔 새어 나오는 속마음
// 외로움 독백 — 이제 무남이 단계와 같은 자산 문턱(현금을 집·땅으로 바꿀 때마다)에서 새어 나옵니다.
// 1~5단계만 있고 6단계(1억)엔 없습니다 (사용자 지정, 2026-08-12).
const LONELY_LINES = {
  1: '이제 돈버는건 익숙해졌는데 어쩐지 쓸쓸하네',
  2: '집이 허전한데 고양이라도 키워볼까.',
  3: '바닷가 그남자 누굴까?',
  4: '언제까지 혼자살순 없잖아.',
  5: '무남이는 매일 어딜 그렇게 가는거지?',
};
const LONELY_COINS = [10000000, 20000000, 30000000, 50000000, 70000000];   // 1~5단계 (무남이 해금과 같은 문턱)
function lonelyCheck() {
  const a = assetTotal();
  let stage = 0;
  for (let i = 0; i < LONELY_COINS.length; i++) if (a >= LONELY_COINS[i]) stage = i + 1;
  if (!stage || lonelySeen[stage]) return;
  for (let s = 1; s <= stage; s++) lonelySeen[s] = true;   // 건너뛴 낮은 단계도 본 것으로 (팝업이 한꺼번에 안 뜨게)
  const line = LONELY_LINES[stage];
  if (line) setTimeout(() => spawnMoneyPopup(state.x, lulu.position.y + 2.2, state.z, line, 5, 'big'), 1200);
}

// ---------- 12-1f-2a. 게임 시간 — 해가 뜨고 지는 하루, 그리고 말의 끼니 ----------
// 하루는 10분. 해뜰녘에 하루가 바뀌면서 "말에게 당근을 주세요" 알림이 옵니다.
// 당근은 하루 한 개만 줄 수 있고, 그 한 개에 애정이 1 오릅니다.
// 하루를 통째로 거르면 이튿날 아침에 애정이 1 식고,
// 굶긴 날이 3일·6일 되면 경고가 오고, 7일이 되면 죽습니다.
const DAY_LEN = 600;                 // 하루 길이 (초) — 10분. 게임 속 한 시간이 실제 25초입니다
// 게임 속 시계 — 하루 10분을 스물네 시간으로 압축해 보여줍니다.
// gameT가 0인 순간이 자정입니다. 날짜도 자정에 넘어갑니다.
// 루루가 제주에 닿은 것은 1일차 오전 9시. 그래서 게임은 9시에서 시작합니다.
const START_HOUR = 9;                // 루루가 제주 땅을 밟은 시각
const SUNRISE_HOUR = 6, SUNSET_HOUR = 20;   // 해뜸·해짐 (그 사이가 낮)
const MORNING_HOUR = 8;              // 아침 알림이 오는 시각 (말먹이·오늘의 소식)
let gameT = DAY_LEN * (START_HOUR / 24);
let dayCount = 1;
function gameHour() { return (gameT / DAY_LEN) * 24; }   // 0~24
// 지금 게임 속 시각 — { day: 1일차, h: 0~23, m: 0~59, text: '오전 9시' }
// 분까지 보여주면 숫자가 쉴 새 없이 넘어가 정신 사나워서, 시 단위로만 보여줍니다.
function gameClock() {
  const t = gameHour();
  const h = Math.floor(t), m = Math.floor((t - h) * 60);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const text = (window.GAME_LANG === 'en')
    ? `${h12} ${h < 12 ? 'AM' : 'PM'}`
    : `${h < 12 ? '오전' : '오후'} ${h12}시`;
  return { day: dayCount, h, m, text };
}
let lastFedDay = 0;                  // 마지막으로 당근을 준 날 (0 = 아직 한 번도 안 줌)
let ponyAlive = true;
let ponyDeaths = 0;   // 이번 게임에서 말을 굶겨 죽인 횟수 (기록용 — 새드엔딩은 이제 누구에게나 옵니다)
// 애정은 하루아침에 쌓이지 않습니다 — 하루에 한 개, 애정도 하루에 1.
// 거른 날만큼 도로 식으니, 경마에 나가려면 사흘은 꼬박 챙겨야 합니다.
const FEED_PER_DAY = 1;              // 하루에 줄 수 있는 당근
const LOVE_DECAY = 1;                // 하루 굶길 때마다 식는 애정
let fedToday = 0;                    // 오늘 몇 개 먹였나
function ponyFedToday() { return lastFedDay >= dayCount; }
function hungerDays() { return Math.max(0, dayCount - lastFedDay); }
// 정말로 굶긴 날수. 어제 챙겨줬으면 0입니다.
// (아침이 밝으면 hungerDays는 1이 되는데, 그건 "어제 먹였다"는 뜻이지 굶긴 게 아닙니다.
//  이걸 굶은 걸로 세는 바람에, 저녁에 먹이고 자도 아침에 애정이 깎이곤 했습니다)
function starveDays() { return Math.max(0, hungerDays() - 1); }

function applyPonyAlive() {
  // 그림 조랑말(ponyCard)이 있으면 3D 조랑말은 숨기고, 죽었으면 마구간을 비웁니다
  if (stable.pony) stable.pony.visible = ponyAlive && !ponyCard;
  if (ponyCard) ponyCard.visible = ponyAlive;
  if (salePonyCard) salePonyCard.visible = !ponyAlive;   // 마구간이 비면 상점 앞에 새 말이 옵니다
}

// ----- 자정 — 하루가 넘어가는 순간의 셈 -----
// 말을 굶겼는지는 여기서 따집니다 (날짜가 바뀌는 그 순간이 기준입니다).
// 애정이 식는 것도, 이레를 굶겨 떠나보내는 것도 자정에 일어납니다.
// 「밥 주세요」 하는 알림만 아침 8시에 따로 옵니다 — 한밤중에 깨울 일은 아니니까요.
function midnightTally() {
  fedToday = 0;                      // 날이 바뀌었습니다 — 오늘 몫이 다시 채워집니다
  if (!ponyAlive) return;
  const px = state.x, py = lulu.position.y + 2.4, pz = state.z;
  const s = starveDays();
  if (s >= 7) {
    // 7일을 굶겼습니다 — 마구간이 빕니다
    ponyAlive = false;
    ponyDeaths++;
    applyPonyAlive();
    saveGame(true);
    spawnMoneyPopup(px, py, pz, '조랑말이 굶어 죽었습니다…', 8);
    setTimeout(() => spawnMoneyPopup(px, py + 0.9, pz,
      '이장님 만물상 앞에 새 말이 와 있대요', 7), 2600);
    return;
  }
  // 어제 하루를 통째로 굶겼으면 애정이 하나 식습니다 — 0 밑으로도 계속 내려갑니다
  if (s >= 1) {
    ponyLove -= LOVE_DECAY;
    setTimeout(() => spawnMoneyPopup(px, py + 0.9, pz,
      `어제 말먹이를 주지 않았어요\n애정이 하나 식었어요 (애정 ${ponyLove})`, 6), 1400);
  }
}

// ----- 아침 8시 — 오늘 말먹이를 주라고 알려줍니다 -----
// 굶긴 날이 쌓였으면 말투가 점점 다급해집니다.
function morningNotice() {
  if (!ponyAlive || fedToday) return;
  const px = state.x, py = lulu.position.y + 2.4, pz = state.z;
  const s = starveDays();
  if (s >= 6) spawnMoneyPopup(px, py, pz, '오늘도 말먹이를 주지 않으면 말이 죽어요', 7);
  else if (s >= 3) spawnMoneyPopup(px, py, pz, '말이 배고파서 죽을지도 몰라요', 7);
  else spawnMoneyPopup(px, py, pz, '아침이에요\n말에게 당근을 하나 주세요', 6);
}

// ----- 오늘의 사건 — 아침마다 그날만의 일이 벌어집니다 (접속할 이유!) -----
// 수확하는 날은 이틀에 한 번, 짝숫날마다 어김없이 돌아옵니다.
// 어떤 귤인지는 운이 아니라 정해진 차례입니다: 천혜향 → 한라봉 → 황금향 → 다시 천혜향.
// 운에 맡기지 않는 이유는, 다음에 뭐가 오는지 알아야 기다릴 맛이 나기 때문입니다.
// 수확하는 날이 아닌 홀숫날은 태풍 30% · 평온 70%.
let dayEvent = null;
// 그날 나무에 섞여 열리는 특별한 귤 (사건 이름 → 귤 종류)
const EVENT_FRUIT = { gold: 'gold', halla: 'halla', cheon: 'cheon' };
const SPECIAL_RATE = 0.10;   // 수확하는 날, 열 알에 한 알꼴로 그 귤이 나옵니다
const HARVEST_CYCLE = ['cheon', 'halla', 'gold'];   // 천혜향 → 한라봉 → 황금향
function rollDayEvent() {
  if (dayCount % 2 === 0) {
    // 2일=천혜향 · 4일=한라봉 · 6일=황금향 · 8일=천혜향 …
    dayEvent = HARVEST_CYCLE[(dayCount / 2 - 1) % HARVEST_CYCLE.length];
    return;
  }
  const r = Math.random();
  dayEvent = r < 0.3 ? 'storm' : null;
}
function dayEventNotice() {
  if (!dayEvent) return;
  const fruit = EVENT_FRUIT[dayEvent];
  const msg = fruit
    ? `오늘은 ${FRUITS[fruit].name}을 수확하는 날이에요\n${FRUITS[fruit].name}은 일반 귤의 ${FRUITS[fruit].mult}배 가격을 받습니다`
    : '태풍이 와요\n오늘은 물질을 쉽니다';
  spawnMoneyPopup(state.x, lulu.position.y + 3.0, state.z, msg, 7);
}

// ----- 엔딩 — 꿈의 완성, 그리고 땅주인의 등장 -----
// 0 = 진행 중 · 1 = 해피엔딩(제주 최고의 집) · 2 = 새드엔딩(땅주인 등장 — 이야기의 끝)
let endingState = 0;
let happyDay = 0;          // 해피엔딩을 본 날 (며칠 뒤 땅주인이 옵니다)
// 루루의 꿈 = 총자산 1억 넘기기.
// 집에 들인 값 + 사버린 밭 + 살림(망사리·감귤상자·컨테이너) + 지갑에 든 현금입니다.
// 아무것도 안 사고 돈만 모아도 어쨌든 그건 루루의 돈이니 함께 셉니다 (사용자 지정).
// 빚을 지면 현금이 마이너스라 총자산도 그만큼 깎입니다.
// 딱 1억에 맞출 필요는 없습니다 — 1억 이상이면 엔딩 조건을 채운 것입니다.
const DREAM_GOAL = 100000000;
function assetTotal() {
  let v = 0;
  for (const k of FURN_ORDER) if (furnitureOwned[k]) v += FURNITURE[k].price;
  if (tools.paint) v += PAINT_PRICE;                        // 외벽 페인트
  if (houseFloorColor !== 0) v += FLOOR_PRICE;              // 바닥재
  if (houseWallColor !== 0) v += WALL_PRICE;                // 벽지
  for (const f of FARMS) if (f.owned) v += FARM_BUY_PRICE;  // 사버린 밭 (빌린 밭은 남의 땅)
  if (hasNet) v += NET_PRICE;                               // 망사리
  v += crates.length * CRATE_PRICE;                         // 갖고 있는 감귤상자
  if (hasContainer) v += CONTAINER_PRICE;                   // 컨테이너 창고
  return v;
}
// 현금까지 다 더한 값 (참고용). 꿈의 저울은 현금을 뺀 자산(assetTotal)입니다 — 돈만 쌓아선 안 되고
// 집·땅·살림으로 바꿔야 꿈이 완성됩니다. (무남이 연애 해금도 같은 자산 기준이라 앞뒤가 맞습니다)
function netWorth() { return coins + assetTotal(); }
function dreamDone() {
  return houseStage >= 3 && assetTotal() >= DREAM_GOAL;
}
// ----- 무남이가 밭을 팔아넘긴 아침 -----
// 처음으로 1억을 채우고 프로포즈를 받은, 바로 그 다음 아침에 딱 한 번만 벌어집니다.
// 재산이 1억에서 9천만원으로 실제로 줄어듭니다.
// 판 돈은 무남이가 냥코인(-97%)에 다 날렸으니, 루루 주머니로는 한 푼도 들어오지 않습니다.
// 산 사람은 이장님입니다 — 무허가 집을 판 그 사람이, 이번엔 밭을 받아 챙깁니다.
// 집에서 가장 먼 밭을 고릅니다 — 매일 가보지 않는 밭이라야 몰래 팔 수 있으니까요.
function munamStealFarm() {
  let pick = null, far = -1;
  for (const f of FARMS) {
    if (!f.owned) continue;
    const d = Math.hypot(f.x - HOUSE.x, f.z - HOUSE.z);
    if (d > far) { far = d; pick = f; }
  }
  if (!pick) return null;
  pick.owned = false;
  pick.rented = false;      // 빌린 것도 아닌, 완전히 남의 땅이 되었습니다
  pick.crop = null;         // 심어둔 것도 땅과 함께 넘어갔습니다
  pick.stolen = true;       // 되사올 때는 빌리는 절차 없이 바로 삽니다
  refreshFarm(pick);
  return pick;
}
// 배신 이야기 첫 토막 — "어딜 가나 했더니" 다음 토막(ENDING_BETRAYAL2)으로 바로 이어집니다.
const ENDING_BETRAYAL = [
  '아침에 밭에 나가보니, 팻말이 하나 꽂혀 있었다.',
  '「이장님 밭 100평\n년세 50만원」',
  '루루: …여기 제 밭인데요.',
  '이장님: "허, 지난주에 샀네. 자네 신랑 될 사람한테."',
  '이장님: "급하게 현금이 필요하다길래\n내가 싸게 잘 받았지."',
  '루루: 수트 입고 맨날 어딜 가나 했더니.',
];
const ENDING_BETRAYAL2 = [
  '비트코인 설명회였다',
  '그런데 알고 보니 잡코인에 전재산을 넣은 것.',
  '무남이는 확신에 차 있었다.',
  '"이게 다음 비트코인이다. 아직 아무도 모르는 보석이야"',
  '"비트코인 초기와 똑같다"',
  '"지금 1원이지만 100원이 될 수 있다"',
  '루루: 그래서 밭을 왜 팔았는데?',
  '"코인 이름이… 냥코인이야."',
  '루루: …….',
  '"냥코인이잖아. 안 오를 수가 없지."',
  '그리고 다음 날.',
  '-97%',
];
// "-97%" 다음에 무남이가 차트를 넋 놓고 바라보는 영상(ending_coin)이 끼고, 그다음 대사가 이어집니다.
const ENDING_BETRAYAL3 = [
  '무남이는 차트를 바라보며 중얼거린다.',
  '"최회장님이 무조건 오른다고 했는데....코인 대박나면 자기도 고생끝인데. 잘해보려고 했는데......."',
  '루루: 내 밭 내놔.',
  '이장님: "되사겠다면 천만원일세.\n빌려 쓰는 거면 50만원에 해줌세."',
  '내 땅이었던 밭을, 50만원에 빌려 쓰라고 한다.',
  '되사와야 한다.\n1천만원을 다시 만들어야 1억이 채워진다.',
];
// 무남이가 밭을 팔아먹은 뒤로는 말을 걸어도 이 소리뿐입니다
const MUNAM_SORRY = [
  ['"…밥은 먹었소?"',
   '루루: 밭.',
   '"…"'],
  ['"코인은 끊었소. 진짜요."',
   '루루: 밭.',
   '"…돈이 없소."'],
  ['"내가 일을 하겠소. 뭐든."',
   '루루: 지금 그 말을 몇 번째 하는지 알아?',
   '"…세 번째쯤."'],
];
const ENDING_HAPPY = [
  '집 수리가 끝났다. 가구가 들어오고, 벽지와 바닥도 새로 갈았다.',
  '담 너머 밭도 이제 남의 땅이 아니다.\n소작료를 떼어주던 그 밭이 전부 루루의 이름으로 되어 있다.',
  '집과 땅과 살림을 합해 1억.\n서울에서는 현관 하나도 못 살 돈이었다.',
  '이장님도, 해녀 할망도 구경을 왔다. "허, 제주에서 제일가는 집이구먼!"',
  '서울에서는 이룰 수 없던 꿈을, 루루는 제주에서 이뤘다. \n꿈 달성!',
];
// 새드엔딩은 세 토막으로 나눠, 사이에 두 편의 영상이 낍니다.
// ①할망이 서울사람을 데려온 절벽 영상 → "어느 아침" 자막 → ②벤치의 무남이에게 다가오는 영상 → 대사.
const ENDING_SAD = [
  '어느 아침, 해녀할망이 서울사람을 데려왔다.',
];
const ENDING_SAD2 = [
  '서울사람이 벤치에 앉은 무남이에게 다가왔다.',
  '"이집 주인이십니까?"',
  '무남이: 제가 아니고 제 와이프가 주인인데요.',
  '"서울에서 내려왔습니다.\n이 땅, 등기부에 제 이름으로 되어 있는데요."',
  '루루: …땅요? 저는 이 집을 샀는데요.',
  '"집은 사셨겠죠. 무허가 건물이니까."',
  '"남의 땅에 얹혀 있는 집을 파신 겁니다.\n땅은 처음부터 제 것이고요."',
  '"비워주세요. 여기다 카페를 지을 겁니다. …오션뷰 카페요."',
];
const ENDING_SAD3 = [
  '그리고 그 뒤에\n낯익은 밀짚모자가 서 있었다.',
  '이 집을 4천만원에 판 사람. …이장님이었다.',
];
// "이장님이었다" 다음 — 만물상 앞의 이장님 영상(ending_mayor)이 끼고, 그다음 대사가 이어집니다.
const ENDING_SAD4 = [
  '이장님: "미안하게 됐네. 조상님 대대로 내려온 집터라 나도 팔기 아까웠어."',
  '서울 집값에 밀려 여기까지 내려왔는데,\n제주 땅 주인도 서울 사람이었다.',
  '4천만원에 사서, 평생 모은 걸 다 들여 고친 집이… 루루는 눈앞이 캄캄해졌다. ㅠㅠ',
  '서울에는, 내가 살 수 있는 집이 없었다.',
  '…제주에도, 내 집은 없었다.',
  '끝',
];
// ----- 그리고 다시 처음부터 (루프) -----
// 집은 서울 땅주인에게 넘어갑니다. 집에 들인 것은 전부 사라지고,
// 루루가 제 돈 주고 산 밭 네 칸만 남습니다. 재산 1억에서 4천만원으로.
// 처음 제주에 내려올 때 손에 쥐고 있던 것과 같은 4천만원인데, 이번엔 땅입니다.
const ENDING_SAD_LOOP = [
  '…그래도, 밭은 남았다.',
  '이장님한테 제 돈 주고 산 땅이다.\n그건 누구도 못 가져간다.',
  '루루: 다시 하면 되지.',
  '루루: 이번엔 땅부터 샀으니까.',
  '재산 4천만원.\n루루의 두 번째 제주살이가 시작된다.',
];
let lifeCount = 1;    // 몇 번째 제주살이인가
function restartAfterSad() {
  // 집에 들인 것은 전부 넘어갑니다 (재산에서 집 몫 5,999만원이 통째로 빠집니다)
  houseStage = 0;
  fixSwings = 0;
  furnitureOwned = emptyFurnOwned();
  houseFloorColor = 0;
  houseWallColor = 0;
  housePaintColor = 0;
  tools.paint = false;
  // 컨테이너 창고는 집이 아니라 루루가 따로 산 물건이라 그대로 남습니다
  // 새드엔딩은 누구에게나 옵니다 — 1억을 채울 때마다 땅주인이 옵니다. 이 루프에는 출구가 없습니다.
  lifeCount++;
  endingState = 0;          // 다시 1억을 향해
  happyDay = 0;
  applyHouseLook();
  applyFurniture();
  updateBasketBadge();
  saveGame(true);
}
// 되사온 뒤에 보는 엔딩에는, 두 번 산 땅 이야기가 한 대목 더 붙습니다
function endingHappyLines() {
  const lines = ENDING_HAPPY.slice();
  if (munamSold === 2) {
    lines.splice(2, 0,
      '무남이가 팔아넘긴 밭도 도로 사왔다.\n두 번 산 땅이라 그런지 더 내 것 같았다.',
      '"…이번엔 진짜 안 하겠소. 코인."',
      '루루: 한 번만 더 하면 그땐 진짜 끝이야.');
  }
  return lines;
}
// 밭을 되사서 1억이 다시 찼으면, 무남이에게 말을 걸었을 때 찐엔딩을 틀어줍니다 (munamTalk에서 호출).
function tryTrueEndingNow() {
  if (endingState !== 0 || munamSold !== 1) return false;
  if (FARMS.some((f) => f.stolen)) return false;        // 아직 안 되사왔습니다
  if (!dreamDone()) return false;                       // 1억이 다시 차야 이야기가 닫힙니다
  if (talkOpen()) return false;                         // 다른 대화 중에는 끼어들지 않습니다
  if (document.getElementById('start')) return false;   // 시작 화면 앞에서는 틀지 않습니다
  munamSold = 2;
  endingState = 1;
  happyDay = dayCount;
  // afterHappyEnding으로 이어야 말을 굶겨 죽인 적 있으면 곧바로 새드엔딩이 따라옵니다 (예전엔 저장만 하고 끝나 새드엔딩이 안 떴음)
  startTalk('루루의 이야기', endingHappyLines(), afterHappyEnding);
  return true;
}
// 서류가방 외출(6단계)까지 본 뒤, 무남이에게 다시 말을 걸면 배신이 터집니다 (munamTalk에서 호출, 사용자 지정 2026-08-12).
// 이장님 영상 → 밭 팻말 자막 → 코인 설명 → -97% 영상 → 되사기 안내 순으로 이어집니다.
function tryBetrayalNow() {
  if (talkOpen()) return false;
  const f = munamStealFarm();
  if (!f) {
    // 팔아먹을 밭이 없는 예외 상황이면 배신 없이 바로 찐엔딩으로 넘어갑니다
    munamSold = 2;
    endingState = 1;
    happyDay = dayCount;
    startTalk('루루의 이야기', endingHappyLines(), afterHappyEnding);
    return true;
  }
  munamSold = 1;
  saveGame(true);
  playClip('ending_mayor', '이장님 만물상 앞', () => {
    startTalk('루루의 이야기', ENDING_BETRAYAL, () => {
      startTalk('루루의 이야기', ENDING_BETRAYAL2, () => {
        playClip('ending_coin', '냥코인 -97%', () => {
          startTalk('루루의 이야기', ENDING_BETRAYAL3, () => { updateCoinBadge(); saveGame(true); });
        });
      });
    });
  });
  return true;
}
// 아침마다 엔딩 차례가 됐는지 확인합니다. 엔딩이 나오는 아침에는 다른 알림을 쉽니다.
function checkEndingMorning() {
  if (endingState === 0) {
    if (!dreamDone()) return false;
    // 1억을 채웠어도, 무남이의 프로포즈를 받기 전에는 이야기가 끝나지 않습니다
    // (꿈은 현금 포함 1억이지만 무남이 해금은 산 것 기준이라, 현금 부자면 안내를 다르게 해줍니다)
    if (romanceStage < 6) {
      spawnMoneyPopup(state.x, lulu.position.y + 3.0, state.z,
        romanceUnlocked() >= 6
          ? '집도 땅도 다 갖췄어요\n무남이에게 가보세요'
          : '현금을 집과 땅으로 바꾸면\n무남이와의 이야기가 이어져요', 7);
      return false;
    }
    // 배신은 이제 아침 자동이 아니라, 무남이에게 다시 말을 걸 때 터집니다 (tryBetrayalNow, 사용자 지정).
    // 아침에는 무남이에게 가보라고만 알려줍니다.
    if (munamSold === 0) {
      spawnMoneyPopup(state.x, lulu.position.y + 3.0, state.z,
        '무남이가 요즘 뭔가 수상해요\n무남이에게 가보세요', 7);
      return false;
    }
    // 되사온 뒤의 매듭은 무남이 앞에서 짓습니다 — 아침에는 갈 곳만 알려줍니다
    if (munamSold === 1) {
      if (!FARMS.some((fm) => fm.stolen)) {
        spawnMoneyPopup(state.x, lulu.position.y + 3.0, state.z,
          '밭도 되찾았어요\n무남이에게 가서 말을 걸어보세요', 7);
      }
      return false;
    }
    // (팔 밭이 없던 예외) — 바로 찐엔딩
    munamSold = 2;
    endingState = 1;
    happyDay = dayCount;
    startTalk('루루의 이야기', endingHappyLines(), afterHappyEnding);
    return true;
  }
  return false;
}
// 새드엔딩 — 해피엔딩 대사가 끝나는 즉시 누구에게나 이어집니다 (기본 엔딩, 사용자 지정 2026-08-13).
// (엔딩을 보고 나서 3일이나 더 플레이할 사람은 없으니, 곧바로 나오게 합니다.)
function playSadEnding() {
  if (endingState === 2) return;   // 이미 진행 중이면 겹치지 않게
  endingState = 2;
  saveGame(true);
  // 집을 뺏기고, 밭만 남은 채 다시 1억을 향해 걷습니다 (루프).
  // ①할망이 데려온 절벽 영상이 먼저 나오고 → "어느 아침" 자막 → ②벤치의 무남이 영상 순서입니다.
  playClip('ending_sad1', '해녀할망이 서울사람을 데려왔다', () => {
    startTalk('루루의 이야기', ENDING_SAD, () => {
      playClip('ending_sad2', '이집 주인이십니까?', () => {
        startTalk('루루의 이야기', ENDING_SAD2, () => {
          startTalk('루루의 이야기', ENDING_SAD3, () => {
            // "이장님이었다" 다음 — 만물상 앞 이장님 영상
            playClip('ending_mayor', '이장님 만물상 앞', () => {
              startTalk('루루의 이야기', ENDING_SAD4, () => {
                startTalk('루루의 이야기', ENDING_SAD_LOOP, () => restartAfterSad());
              });
            });
          });
        });
      });
    });
  });
}
// 해피엔딩 대사가 끝난 뒤 부르는 마무리 — 말을 죽인 적 있으면 곧바로 새드엔딩으로 넘어갑니다.
function afterHappyEnding() {
  saveGame(true);
  setTimeout(playSadEnding, 700);   // 잠깐 여운을 두고 바로 이어집니다 (새드엔딩이 기본 — 사용자 지정 2026-08-13)
}

// 하늘·해·안개를 시간에 맞춰 물들입니다
const SKY_DAY_TOP = new THREE.Color(0x2f7fd0), SKY_DAY_BOT = new THREE.Color(0xe2eff8);
const SKY_NGT_TOP = new THREE.Color(0x0a1230), SKY_NGT_BOT = new THREE.Color(0x1c2a4a);
const SKY_DUSK = new THREE.Color(0xf2a35e);
const FOG_DAY = new THREE.Color(0xd2e6ee), FOG_NGT = new THREE.Color(0x101a2c);
let morningShownDay = 1;             // 아침 알림을 이미 띄운 날 (하루에 한 번만)
let sunAngCur = Math.PI / 2;         // 해의 각도 (동쪽 0 → 정오 π/2 → 서쪽 π, 밤이면 -1)
function updateDayNight(dt) {
  gameT += dt;
  if (gameT >= DAY_LEN) {
    gameT -= DAY_LEN;
    dayCount++;
    rollDayEvent();
    refreshAllFarms();     // 하룻밤 사이에 작물이 그만큼 자랐습니다
    regrowCatches();       // 일주일 전에 딴 자리는 바다 어딘가에 다시 생깁니다
    regrowFruits();        // 딴 지 1년 지난 야생 귤이 그 자리에 다시 열립니다
    // 년세 낼 때가 된 필지 알리기 (빌린 날로부터 365일 = 실제로 예순 시간쯤)
    {
      const due = FARMS.filter((f) => rentExpired(f));
      if (due.length) {
        setTimeout(() => spawnMoneyPopup(state.x, lulu.position.y + 2.8, state.z,
          `${due.map(farmName).join(' · ')} 년세 낼 때가 됐어요\n한 필지에 ${formatWon(FARM_RENT)}`, 7), 3600);
      }
    }
    midnightTally();        // 말을 굶겼는지 따지는 것은 자정 기준입니다
  }
  // 아침 8시 — 오늘 할 일을 알려줍니다. 하루에 한 번만 옵니다.
  if (gameHour() >= MORNING_HOUR && morningShownDay !== dayCount) {
    morningShownDay = dayCount;
    // 엔딩이 나오는 아침에는 다른 알림을 쉬고 이야기에 집중합니다
    if (!checkEndingMorning()) {
      morningNotice();
      setTimeout(dayEventNotice, 2200);   // 말먹이 알림 다음에 오늘의 소식
    }
  }
  // 화면 왼쪽 위 시계 — 시가 바뀔 때만 글씨를 갈아 끼웁니다 (매 프레임 고칠 일이 아닙니다)
  if (clockBadge) {
    const c = gameClock();
    const stamp = c.day * 100 + c.h;
    if (stamp !== clockBadge.userStamp) {
      clockBadge.userStamp = stamp;
      // 달력 그림과 숫자를 한 덩어리로 두면, 폰이 뒤따르는 "1"까지 이모지 글꼴로
      // 그려서 혼자 시커멓게 나옵니다. 그림을 따로 감싸 글자와 떼어놓습니다.
      clockBadge.innerHTML = `<span class="cbIcon">\u{1F5D3}\u{FE0F}</span>` +
        (window.GAME_LANG === 'en' ? `Day ${c.day} · ${c.text}` : `${c.day}일차 · ${c.text}`);
      clockBadge.classList.toggle('night', isNight());
    }
  }
  // 해는 아침 6시에 떠서 저녁 8시에 집니다. 그 사이가 낮입니다.
  const hour = gameHour();
  let daylight;
  if (hour >= SUNRISE_HOUR && hour < SUNSET_HOUR) {
    sunAngCur = ((hour - SUNRISE_HOUR) / (SUNSET_HOUR - SUNRISE_HOUR)) * Math.PI;
    daylight = Math.max(0, Math.sin(sunAngCur));
  } else {
    sunAngCur = -1;
    daylight = 0;
  }
  // 해뜰녘·해질녘의 주황기 — 해가 낮게 걸렸을 때만
  const dusk = Math.max(0, 1 - Math.abs(daylight - 0.18) / 0.18) * 0.6;
  // 물속에서는 applyDiveLook이 정한 물속 조명을 그대로 둡니다 (매 프레임 덮어쓰면 물속이 쨍해집니다)
  if (!state.diving) {
    sun.intensity = 0.12 + 1.95 * daylight;
    hemi.intensity = 0.22 + 0.95 * daylight;
  }
  const top = sky.material.uniforms.topColor.value;
  const bot = sky.material.uniforms.bottomColor.value;
  top.copy(SKY_NGT_TOP).lerp(SKY_DAY_TOP, daylight);
  bot.copy(SKY_NGT_BOT).lerp(SKY_DAY_BOT, daylight).lerp(SKY_DUSK, dusk);
  if (!state.diving) scene.fog.color.copy(FOG_NGT).lerp(FOG_DAY, daylight).lerp(SKY_DUSK, dusk * 0.5);
  // 태풍이 오는 날은 종일 잿빛으로 어둑합니다
  if (dayEvent === 'storm') {
    sun.intensity *= 0.5;
    hemi.intensity *= 0.65;
    top.lerp(STORM_GRAY, 0.55);
    bot.lerp(STORM_GRAY, 0.4);
    if (!state.diving) scene.fog.color.lerp(STORM_GRAY, 0.5);
  }
}
const STORM_GRAY = new THREE.Color(0x6a7078);

// 조랑말 그림 갱신 — 오늘 당근을 먹었으면 웃는 모습, 아니면 우는 모습 (매 프레임)
function updatePony(t) {
  updateSalePony(t);
  if (!ponyCard || !ponyAlive) return;
  const sheet = ponyFedToday() ? SHEETS.ponyHappy : SHEETS.ponySad;
  if (!sheet) return;
  if (ponyCard.material.map !== sheet.tex) ponyCard.material.map = sheet.tex;
  // 웃는 그림띠의 첫 칸에는 '1ST' 리본 조각이 남아 있어 건너뜁니다
  const cellIdx = sheet === SHEETS.ponyHappy ? 1 + (Math.floor(t * 7) % 7) : Math.floor(t * 8) % sheet.frames;
  setCell(sheet, cellIdx);
  const gy = groundHeight(STABLE.x, STABLE.z);
  ponyCard.position.set(STABLE.x + 0.2, gy, STABLE.z);
  // 루루 그림과 같은 종이 인형 방식 — 항상 카메라를 바라봅니다
  ponyCard.rotation.y = Math.atan2(camera.position.x - STABLE.x, camera.position.z - STABLE.z);
  const Hp = ponyCard.userData.planeH;
  const Wp = Hp * sheet.frameW / CELL_H;
  ponyCard.scale.set(Wp, Hp, 1);
}

// 상점 앞에 매어 둔 새 조랑말 — 마구간이 비었을 때만 서 있습니다.
// 마구간 조랑말과 그림띠(ponyHappy)를 같이 쓰는데, 둘이 동시에 보이는 일이 없어 서로 방해하지 않습니다.
function updateSalePony(t) {
  if (!salePonyCard) return;
  salePonyCard.visible = !ponyAlive;
  if (ponyAlive) return;
  const sheet = SHEETS.ponyHappy;
  if (!sheet) return;
  setCell(sheet, 1 + (Math.floor(t * 7) % 7));   // 첫 칸에는 '1ST' 리본 조각이 남아 있어 건너뜁니다
  const gy = groundHeight(PONY_SALE.x, PONY_SALE.z);
  salePonyCard.position.set(PONY_SALE.x, gy, PONY_SALE.z);
  salePonyCard.rotation.y = Math.atan2(camera.position.x - PONY_SALE.x, camera.position.z - PONY_SALE.z);
  const Hp = salePonyCard.userData.planeH;
  salePonyCard.scale.set(Hp * sheet.frameW / CELL_H, Hp, 1);
}

// ---------- 12-1f-2a3. 대화 — 이장님·돌하르방과 이야기 ----------
// NPC 앞에서 F(🐾)를 누르면 화면 아래 종이 카드에 대사가 뜨고,
// 다시 누르면 다음 줄로 넘어갑니다. 이장님은 지금 섬 상황을 보고 말합니다.
const talkBoxEl = document.getElementById('talkBox');
const talkNameEl = document.getElementById('talkName');
const talkTextEl = document.getElementById('talkText');
let talkLines = [], talkIdx = -1, talkDone = null;
function talkOpen() { return talkIdx >= 0; }
function startTalk(name, lines, onDone) {
  talkLines = lines;
  talkIdx = 0;
  talkDone = onDone || null;
  if (talkNameEl) talkNameEl.textContent = name;
  if (talkBoxEl) talkBoxEl.style.display = 'block';
  if (talkTextEl) talkTextEl.textContent = talkLines[0];
}
function advanceTalk() {
  talkIdx++;
  if (talkIdx >= talkLines.length) {
    talkIdx = -1;
    if (talkBoxEl) talkBoxEl.style.display = 'none';
    if (talkDone) { const f = talkDone; talkDone = null; f(); }
    return;
  }
  if (talkTextEl) talkTextEl.textContent = talkLines[talkIdx];
}
if (talkBoxEl) talkBoxEl.addEventListener('pointerdown', (e) => { e.preventDefault(); advanceTalk(); });

function isNight() { const h = gameHour(); return h < SUNRISE_HOUR || h >= SUNSET_HOUR; }

// 이장님 대사 — 급한 일부터 챙겨주는 참견쟁이 어른입니다
const MAYOR_TALK_RANGE = 2.2;
function mayorTalkLines() {
  if (!ponyAlive) return [
    '말이 그리 되다니… 마음이 아프네.',
    '마침 우리 가게 앞에 한 마리 매어 뒀네. 순하고 발도 빠른 놈일세.',
    `${formatWon(PONY_PRICE)}만 주면 자네 것이야. 어떤가?`,
    '이번엔 하루에 당근 하나씩, 꼭 챙겨주게나.',
  ];
  // 년세 낼 때가 된 필지가 있으면 이장님이 먼저 꺼냅니다 (365일마다 돌아옵니다)
  {
    const due = FARMS.filter((f) => rentExpired(f));
    if (due.length) return [
      `자네, ${due.map(farmName).join('하고 ')} 년세 낼 때가 됐네.`,
      '벌써 한 해가 다 갔구먼.',
      `한 필지에 ${formatWon(FARM_RENT)}일세.\n팻말 앞에서 내면 되네.`,
    ];
  }
  // 밭을 사간 사람이 바로 이 양반입니다. 미안한 기색이 없습니다.
  if (munamSold === 1) return [
    '자네 밭 말인가? 이제 내 땅일세.',
    '자네 신랑 될 사람이 급하다길래 받아준 걸세.\n좋은 일 한 셈 아닌가.',
    '되사겠다면 천만원. 그게 값일세.',
    '…빌려 쓰는 거면 50만원에 해줌세.\n섭섭잖게.',
  ];
  if (starveDays() >= 3) return [
    '자네 말이 며칠째 울던데… 당근은 줬는가?',
    '산 것은 끼니를 거르면 못 버티네. 어서 가보게.',
  ];
  if (basketCount >= BASKET_CAP) return [
    '오, 귤이 실하네! 상자가 가득이야.',
    '택배사 앞으로 가져오게\n하나하나 보고 후하게 쳐줌세.',
  ];
  if (!ponyFedToday()) return [
    '오늘 말한테 당근은 줬는가?',
    '아침마다 한 개씩\n그게 말 키우는 법이라네.',
  ];
  if (isNight()) return [
    '밤바람이 차다, 얼른 들어가게.',
    '별 보며 걷는 것도 제주 맛이긴 하지만 말이야.',
  ];
  if (!hasNet) return [
    '물질을 해보고 싶으면 상점 안에서 망사리부터 사게.',
    '망사리 없이 바다에 드는 건 안 될 말이지.',
  ];
  // 아직 한 필지도 안 빌렸으면 소작 이야기부터 꺼냅니다
  if (rentedCount() === 0) return [
    '섬에 놀리는 밭이 여럿 있네. 다 내 땅이지.',
    '팻말 앞에서 말만 하면 한 필지씩 빌려줌세.',
    '동쪽땅 서쪽땅 남쪽땅 북쪽땅,\n마당 사방에 하나씩 있네.',
    '년세는 어느 땅이든 한 필지에 50만원일세.',
    '씨앗은 우리 상점에 있고,\n거둘 때 절반만 나한테 주면 되네.',
    '…절반이 많다고? 땅값이 원래 그런 걸세.',
  ];
  // 거둘 밭이 있으면 그 이야기가 먼저입니다
  if (FARMS.some((f) => farmRipe(f))) return [
    '자네 밭에 거둘 때가 된 게 있던데.',
    '팻말 앞에 서서 거두게.\n내 몫은 알아서 떼어가겠네.',
  ];
  const idle = [
    ['혼저 옵서예~ 오늘도 부지런하구만.'],
    ['귤은 알이 굵을 때 따야 제값을 받네.'],
    ['우리 섬 바다는 인심이 좋아. 욕심만 안 부리면 말이야.'],
    // ("다 고치면 창고가 생긴다"던 옛 시스템 언급을 지웠습니다 — 지금은 없는 기능입니다
    ['집은 좀 고쳐놨는가? 집이 훤해야 복도 들어온다네.'],
    ['자네 말, 요즘 눈빛이 다르던데? 경마에 한번 내보내 보게.'],
    ['바닥재랑 벽지도 들여놨네. 상점 왼쪽을 둘러보게.'],
    ['자네 집 말인가? …좋은 집이지. 아무렴, 좋은 집이고말고.', '(이장님은 왠지 눈을 피했다)'],
    ['땅은 빌려 쓰는 것보다 사두는 게 낫지.', '뭐, 목돈이 있어야 하는 이야기지만 말이야.'],
    ['소작료가 아깝거든 밭을 사버리게.', '그럼 거둔 게 다 자네 것이 되지 않는가.'],
  ];
  return idle[Math.floor(Math.random() * idle.length)];
}

// 해녀 할망 — 포구 축대 중간에 앉아 계십니다. 물질하러 축대 끝까지 걸어나가려면
// 반드시 할망 곁을 지나게 되고, 지날 때마다 등 뒤로 잔소리 한마디를 듣고 갑니다.
// 물질하다 숨이 다하면 나오는 바로 그 말입니다. 새겨들읍시다.
const HALMANG_SPOT = { x: 0, z: 97.3 };   // 축대 한가운데 — 물질 가는 길목을 지키고 앉아 계십니다
const HALMANG_RANGE = 1.6;
let halmangNear = false;   // 곁을 지나는 중인가 — 범위에 새로 들어설 때 한 번만 말씀하십니다
let halmangDiveIdx = 0;    // 물질하러 갈 때마다 순서대로 넘어가는 할망 대사 번호 (20을 넘으면 랜덤)
// 물질하러 포구에 갈 때마다 순서대로 나오는 할망 잔소리 (20회 이후엔 랜덤).
// 7번째는 제주 사내를 조심하라는 무남이 복선입니다. "욕심내민 바당이 데려간다"는 죽을 때만 나옵니다.
const HALMANG_DIVE_LINES = [
  '해녀옷 입었다고 해녀 다 된 줄 알암냐?',
  '육지것아, 숨 참는다고 오래 잠수허는 게 아니여.',
  '허우적허우적 허지 말앙 천천히 들어가.',
  '그렇게 허면 전복이 니 얼굴 보고 도망가겄다.',
  '눈은 뒀다가 뭐햄? 성게가 발로 걸어오길 기다리냐?',
  '바당에 들어오면서 물때도 안 보고 왔쪄?',
  '제주도남자는 만나지말어랑',
  '욕심내지 말앙 딱 먹을 만큼만 하라.',
  '니가 잡는 건지 바당이 니를 잡는 건지 모르켜.',
  '물질허러 왔으믄 물질이나 햄쪄. 바당 구경허러 왔나?',
  '그물은 그렇게 잡아당기는 게 아니여. 찢어지믄 누가 고칠 건디?',
  '물 밖에선 그렇게 씩씩허더니 바당만 들어가믄 겁쟁이가 됐네.',
  '숨비소리도 제대로 못 내면서 해녀허겠다고?',
  '오늘은 물질 그만허라. 니 얼굴이 벌써 지쳤쪄.',
  '물질 끝나믄 장비부터 정리허라. 누가 대신해줄 줄 알았나?',
  '제주 와서 해녀허겠다고 허더니 밥은 또 육지식으로 먹네.',
  '바당에선 혼자 잘난 척허면 안 돼. 서로 봐줘야 사는 거여.',
  '니가 잡은 거 보라. 이걸 누구 코에 붙이젠?',
  '내가 몇 번 말허냐. 바당은 니 놀이터가 아니여.',
  '그래도 오늘은 좀 해녀 다워졌쪄. 내일은 더 잘허라.',
];
obstacles.push({ x: HALMANG_SPOT.x, z: HALMANG_SPOT.z, r: 0.7, topY: NO_JUMP });
// 그날 그때에 맞는 한마디를 고릅니다 — 말을 걸었을 때와 곁을 지날 때 같은 말을 하십니다
function halmangLine() {
  // 태풍이 오는 날은 아예 바다에 나갈 생각을 말리십니다
  if (dayEvent === 'storm') return '야이, 태풍 온댄허는데 무신 바당이여! 미쳔!';
  // 밤에는 야간물질을 나서는 이에게 한마디 — "까불다간 이어도(저승 섬)에 간다"는 제주 말
  if (isNight()) return '까불다 이어도 가주.';
  // 평상시엔 물질하러 온 횟수대로 잔소리가 넘어갑니다 (20을 넘으면 랜덤)
  return (halmangDiveIdx < HALMANG_DIVE_LINES.length)
    ? HALMANG_DIVE_LINES[halmangDiveIdx]
    : HALMANG_DIVE_LINES[Math.floor(Math.random() * HALMANG_DIVE_LINES.length)];
}
function halmangTalk() {
  startTalk('해녀 할망', [halmangLine()]);
}
// 매 프레임 — 포구 옆에 그림 판으로 서 계십니다
function updateHalmang() {
  const gy = groundHeight(HALMANG_SPOT.x, HALMANG_SPOT.z);
  if (halmangCard) {
    halmangCard.visible = true;
    halmangCard.position.set(HALMANG_SPOT.x, gy, HALMANG_SPOT.z);
    halmangCard.rotation.y = Math.atan2(camera.position.x - HALMANG_SPOT.x, camera.position.z - HALMANG_SPOT.z);
    const sheet = SHEETS.halmang;
    setCell(sheet, Math.floor(performance.now() * 0.004) % sheet.frames);
    const Hp = halmangCard.userData.planeH;
    halmangCard.scale.set(Hp * sheet.frameW / CELL_H, Hp, 1);
  }
  // 곁을 지나면 잔소리 한마디 — 물질 나가는 길에 반드시 듣게 됩니다
  const near = !state.diving &&
    Math.hypot(state.x - HALMANG_SPOT.x, state.z - HALMANG_SPOT.z) < 3.2;
  if (near && !halmangNear) {
    spawnMoneyPopup(HALMANG_SPOT.x, gy + HALMANG_H + 0.5, HALMANG_SPOT.z,
      `"${halmangLine()}"`, 4, 'big');
  }
  halmangNear = near;
}

// 루루의 이야기 — 처음 시작할 때 딱 한 번 들려줍니다.
// 게임이 0원에서 시작하는 이유이자, 낡은 집을 고치는 이유이자, 이 섬에서 사는 이유입니다.
let introSeen = false;
// 문장마다 줄을 바꿔(\n) 읽기 편하게 보여줍니다 (#talkBox p 의 white-space: pre-line)
const INTRO_LINES = [
  '루루는 제주에서 태어난 고양이가 아니다.\n원래는 서울에서 살았다.',
  '스무 살의 루루가 눈여겨본 서울의 작은 아파트는 5억이었다.\n"10년만 열심히 모으면, 대출 끼고 살 수 있을 거야."',
  '10년을 쉬지 않고 일하고 아끼고 모았으나,\n서른 살이 된 루루의 전 재산은 겨우 4천만원.',
  '그사이 그 아파트는 20억이 되어 있었다.\n집값은 월급보다, 저축보다, 꿈보다 훨씬 빨랐다.',
  '루루는 꿈을 접었다.\n그리고 마지막 희망을 품고\n마을 이장이 소개해 준 제주 외딴 마을의 빈집 하나를, 전 재산을 털어 샀다.',
  '집은 비가 새고, 전기는 끊겼고, 잡초는 허리까지 자라 있었다.\n하지만 루루는 웃었다.',
  '"적어도… 여긴 내 집이다."',
  '서른 살, 루루의 두 번째 인생이 시작된다.\n언젠가 이 낡은 집을 제주 최고의 집으로 만드는 것\n그것이 루루의 새로운 꿈이다.',
];

// 돌하르방 — 상점 앞을 지키는 안내석. 처음 온 사람에게 섬 사는 법을 알려줍니다
const TUTOR_SPOT = { x: 2.2, z: 45.4 };
const TUTOR_RANGE = 2.6;
let tutorialSeen = false;
const TUTOR_LINES = [
  '안녕하세요! 저는 이 섬을 지키는 돌하르방입니다. 섬에서 사는 법을 알려드릴게요.',
  '귤나무 앞에서 (F)를 누르면 귤을 딸 수 있어요. 상자를 가득 채워 택배사에 가져가면 한 박스 1만원에 팔립니다.',
  '상점 문 앞에 서면 안으로 들어갑니다. 당근을 사서 말에게 매일 한 개씩 먹여주세요\n굶기면 위험해요!',
  '마당 사방으로 동쪽땅·서쪽땅·남쪽땅·북쪽땅이 놀고 있어요. 전부 이장님 땅입니다.\n밭 앞 팻말에서 (F)를 누르면 한 필지씩 빌립니다. 년세는 한 필지에 50만원이에요.',
  '빌린 밭에는 상점에서 산 씨앗을 심습니다. 며칠 지나 다 자라면 팻말 앞에서 거두세요\n다만 절반은 이장님 몫으로 나갑니다.',
  '소작료가 아까우면 밭을 아예 살 수도 있어요. 목돈이 들지만, 그 뒤로는 거둔 것이 전부 루루 몫이 됩니다.',
  '물질을 하려면 상점에서 망사리를 사고, 포구 끝까지 걸어가세요. 물속에서는 ↑ 떠오르기 · ↓ 잠수 · ←→ 헤엄이에요. 숨이 다하면 죽을 위험이 있어요!',
  '남쪽 언덕의 돌집이 루루의 집입니다. 문 앞에 서면 들어가지고, 가구를 사서 꾸밀 수도 있어요.',
  '당근은 하루에 한 개, 애정도 하루에 하나씩 쌓입니다.\n애정이 3이 되면 마구간 옆 팻말에서 경마에 나갈 수 있어요.',
  '말을 일주일동안 굶기면 말이 죽습니다.\n그때는 이장님 만물상 앞에서 새 말을 살 수 있어요. 좋은 하루 되세요!',
];
function tutorTalk() {
  startTalk('돌하르방', TUTOR_LINES, () => {
    if (!tutorialSeen) { tutorialSeen = true; saveGame(true); }
  });
}

// ---------- 12-1f-2a4. 섬 살이 셈 ----------
// 게임 곳곳에서 한 일을 세어둡니다. 경마 출전 횟수(참가비·상금이 오릅니다)와
// 가방에 뜨는 누적 소작료가 여기서 나옵니다.
const stat = { boxes: 0, dives: 0, drowns: 0, races: 0, raceWins: 0,
               abalone: 0, conch: 0, kelp: 0, octopus: 0, cucumber: 0, gold: 0,
               rented: 0, owned: 0, harvest: 0, rentPaid: 0 };
// 무남이 이야기 진행도 — 자산이 늘수록 다음 이야기가 열린다는 걸 가방에서 알려줍니다
const MUNAM_STAGE_COINS = [10000000, 20000000, 30000000, 50000000, 70000000, 100000000];
function munamTip() {
  // 무남이 이야기도 메인 퀘스트라, 일일 할 일과 같은 급의 카드로 크게 보여줍니다.
  // 글은 한국어로 짜고 화면에 찍힐 때 번역기가 바꿔줍니다 (하트는 따로 줄을 빼서 사전이 안 헷갈리게)
  const seen = Math.min(6, Math.max(0, romanceStage));
  const hearts = '❤️'.repeat(seen) + '🤍'.repeat(6 - seen);
  let msg;
  if (munamSold === 1) {
    const boughtBack = !FARMS.some((f) => f.stolen);
    msg = !boughtBack ? '밭을 되사오면 이야기가 이어져요'
      : (dreamDone() ? '되사왔어요! 무남이에게 가서 말을 걸어보세요'
                     : '되사왔어요! 자산 1억을 다시 채우면 이야기가 이어져요');
  } else if (seen >= 6) msg = '이야기 완결';
  else if (romanceUnlocked() > seen) msg = '새 이야기! 무남이를 찾아가 보세요';
  else msg = `다음 이야기: 자산 ${formatWon(MUNAM_STAGE_COINS[seen])}`;
  return `<div class="bagCard"><div class="bagCardTitle munam">💛 무남이와의 이야기</div>` +
    `<div class="bagHearts">${hearts}</div>` +
    `<div class="bagSub"><b>${msg}</b></div></div>`;
}

// 가방 화면 (🎒 버튼) — 예전의 업적 도감 자리를 "갖고 있는 아이템 보기"로 바꿨습니다
const bookWrap = document.getElementById('bookWrap');
const bookList = document.getElementById('bookList');
const bookBadge = document.getElementById('bookBadge');
function openBag() {
  if (!bookWrap || !bookList) return;
  // 모을 수 있는 것 전부를 아이콘으로 — 가진 것은 또렷하게(개수는 ×N), 없는 것은 회색으로
  const items = [];
  // price를 적어주면 이름 아래에 값이 같이 붙습니다 (창문 3백만원 하는 식으로)
  const add = (owned, emoji, name, count, price) =>
    items.push({ owned, emoji, name, count: count || 0, price: price || 0 });
  // 칸 차례는 사용자 지정: 밭 → 당근 → 감귤상자 (여기까지 자리 고정, 나머지는 가격순)
  const ownedPlots = FARMS.filter((f) => f.owned).length;
  add(ownedPlots > 0, '🌾', ownedPlots ? `밭 ${ownedPlots}필지` : '밭',
    0, ownedPlots * FARM_BUY_PRICE);
  add(carrots > 0, '🥕', '당근', carrots, carrots * CARROT_PRICE);
  // 시작 상자도 자산(1만원)에 들어가므로 보유로 표시해야 계산과 표시가 맞습니다
  add(crates.length > 0, '📦', '감귤상자', crates.length, crates.length * CRATE_PRICE);
  add(tools.paint, '🖌', '페인트', 0, PAINT_PRICE);
  add(hasContainer, '🏗', '컨테이너 창고', 0, CONTAINER_PRICE);
  if (state.diving && net.length) {
    const em = { kelp: '🌿', conch: '🐚', abalone: '🦪', octopus: '🐙' };
    const cnt = {};
    for (const k of net) cnt[k] = (cnt[k] || 0) + 1;
    for (const [k, n] of Object.entries(cnt))
      add(true, em[k] || '🌊', CATCH_KINDS[k].name, n, CATCH_KINDS[k].price * n);
  }
  for (const k of FURN_ORDER) {
    const g = SHOP_GOODS.find((s) => s.key === k);
    add(!!furnitureOwned[k], g ? g.emoji : '🛋', g ? g.name : k, 0, FURNITURE[k].price);
  }
  add(houseFloorColor !== 0, '🟫', '바닥재', 0, FLOOR_PRICE);
  add(houseWallColor !== 0, '🎨', '벽지', 0, WALL_PRICE);
  // 밭만 맨 앞에 고정, 나머지는 당근부터 싼 것 순서로 진열 (사용자 지정)
  const sortedItems = items.slice(0, 1).concat(items.slice(1).sort((a, b) => a.price - b.price));
  items.length = 0;
  items.push(...sortedItems);
  // 총자산 = 집에 들인 값 + 사버린 땅 + 살림(망사리·감귤상자·컨테이너) + 지갑의 현금.
  // 딱 1억에 맞출 필요는 없습니다. 1억을 넘기면 다음 날 아침 꿈을 이룬 엔딩이 찾아옵니다.
  const spent = assetTotal();
  const worth = assetTotal();   // 꿈의 저울은 현금을 뺀 자산입니다 (현금은 위에 따로 표시)
  const landSpent = FARMS.filter((f) => f.owned).length * FARM_BUY_PRICE;
  const gearSpent = (hasNet ? NET_PRICE : 0) + crates.length * CRATE_PRICE
                  + (hasContainer ? CONTAINER_PRICE : 0);
  const houseSpent = spent - landSpent - gearSpent;
  // 밭 살림 — 빌린 땅, 산 땅, 지금까지 낸 소작료
  const rentedN = FARMS.filter((f) => f.rented && !f.owned).length;
  const ownedN = FARMS.filter((f) => f.owned).length;
  const growing = FARMS.filter((f) => f.crop).length;
  const ripe = FARMS.filter((f) => farmRipe(f)).length;
  // 밭 현황 한 줄씩 — 칸을 나눠 아이콘과 함께 보여줍니다
  const farmRow = (rentedN || ownedN)
    ? `<span>🪧 빌린 땅 ${rentedN}필지</span><span>🌱 내 땅 ${ownedN}필지</span><span>🌾 자라는 중 ${growing}필지</span>` +
      (ripe ? `<span>✨ 거둘 땅 ${ripe}필지</span>` : '')
    : `<span>🌱 아직 빌린 땅이 없어요</span>`;
  // 씨앗 봉지
  const seedLine = SEED_ORDER.filter((k) => seeds[k])
    .map((k) => `${SEEDS[k].emoji} ${SEEDS[k].name} ${seeds[k]}봉지`).join(' · ');
  bookList.innerHTML =
    `<div class="bookHead">🎒 자산${lifeCount > 1 ? ` (${lifeCount}번째 제주살이)` : ''}</div>` +
    `<div class="bagMoney">💵 현금 ${formatWon(coins)}</div>` +
    `<div class="bagTotal">💰 총자산 ${formatWon(worth)} / ${formatWon(DREAM_GOAL)}</div>` +
    `<div class="bagCard">` +
      `<div class="bagRow">${farmRow}</div>` +
      ((rentedN || ownedN)
        ? (stat.rentPaid ? `<div class="bagSub">🌳 지금까지 낸 소작료 ${formatWon(stat.rentPaid)}</div>` : '')
        : `<div class="bagSub">밭 팻말 앞에서 이장님께 년세를 냅니다</div>`) +
      (seedLine ? `<div class="bagSub">${seedLine}</div>` : '') +
      `<hr>` +
      `<div class="bagSub">🏠 집 ${formatWon(houseSpent)} · 땅 ${formatWon(landSpent)}` +
      (gearSpent ? ` · 살림 ${formatWon(gearSpent)}` : '') + ` · 현금 ${formatWon(coins)}</div>` +
      `<div class="bagSub"><b>${worth >= DREAM_GOAL ? '꿈을 이뤘어요!' : '총자산 1억을 넘기면 루루의 꿈 완성 (현금 제외)'}</b></div>` +
    `</div>` +
    munamTip() +
    `<div class="bagGrid">` + items.map((it) =>
      `<div class="bagItem${it.owned ? '' : ' off'}">` +
      `${it.owned && it.count > 0 ? `<div class="ct">×${it.count}</div>` : ''}` +
      `<div class="em">${it.emoji}</div><div class="nm">${it.name}</div>` +
      (it.price ? `<div class="pr">${formatWon(it.price)}</div>` : '') + `</div>`
    ).join('') + `</div>` +
    `<div class="bookTip" style="margin-top:10px">바깥을 누르면 닫힘</div>`;
  bookWrap.style.display = 'flex';
}
// 🎒 버튼은 여닫이 — 열려 있으면 닫고, 닫혀 있으면 엽니다
if (bookBadge) bookBadge.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (bookWrap && bookWrap.style.display === 'flex') bookWrap.style.display = 'none';
  else openBag();
});
// 목록 안을 만지면 스크롤, 바깥(어두운 곳)을 누르면 닫기
if (bookWrap) bookWrap.addEventListener('pointerdown', (e) => {
  if (bookList && bookList.contains(e.target)) return;   // 목록 안 — 스크롤하게 둡니다
  bookWrap.style.display = 'none';
});
// 게임의 손가락 조작(조이스틱·시야)이 목록 스크롤을 가로채지 않게 막습니다
if (bookList) {
  ['touchstart', 'touchmove', 'pointermove'].forEach((ev) =>
    bookList.addEventListener(ev, (e) => e.stopPropagation()));
}

// ---------- 색 고르기 팝업 — 벽지(집 안)·바닥재·외벽 페인트가 함께 씁니다 ----------
const pickWrap = document.getElementById('pickWrap');
const pickBox = document.getElementById('pickBox');
const pickTitle = document.getElementById('pickTitle');
const pickPrice = document.getElementById('pickPrice');
const pickGrid = document.getElementById('pickGrid');
// 색을 누르면 일단 골라두기만 하고(테두리 표시), 아래 가격 단추를 눌러야 실제로 삽니다.
// 실수로 색을 잘못 눌러 바로 결제되는 일을 막습니다.
const pickTip = document.getElementById('pickTip');
function openColorPicker(title, colors, onPick, price) {
  if (!pickWrap) return;
  pickTitle.textContent = title;
  pickGrid.innerHTML = '';
  pickPrice.innerHTML = '';
  if (pickTip) pickTip.textContent = IS_TOUCH
    ? '관광지라 물가가 비싸구나 ㅠㅠ'
    : '관광지라 물가가 비싸구나 ㅠㅠ (가격을 누르면 구입 · ESC 나가기)';
  let selected = null;
  const swatches = [];
  const buyBtn = document.createElement('button');
  buyBtn.className = 'buyBtn';
  const refreshBtn = () => {
    buyBtn.disabled = !selected;
    buyBtn.textContent = selected
      ? `${selected.name} · ${formatWon(price)}\n눌러서 구입`
      : '먼저 색을 골라주세요';
  };
  for (const c of colors) {
    const item = document.createElement('div');
    item.className = 'swItem';
    const b = document.createElement('button');
    b.className = 'swatch';
    b.style.background = '#' + c.color.toString(16).padStart(6, '0');
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      selected = c;
      swatches.forEach((x) => x.classList.remove('sel'));
      b.classList.add('sel');
      refreshBtn();
    });
    swatches.push(b);
    const nm = document.createElement('div');
    nm.className = 'swName';
    nm.textContent = c.name;
    item.appendChild(b);
    item.appendChild(nm);
    pickGrid.appendChild(item);
  }
  buyBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!selected) return;
    pickWrap.style.display = 'none';
    onPick(selected);
  });
  refreshBtn();
  pickPrice.appendChild(buyBtn);
  pickWrap.style.display = 'flex';
}

// 여러 갈래 중 하나를 고르는 창 (씨앗 고르기 · 밭 앞에서 할 일 고르기).
// 색 고르기 창과 같은 모양인데, 색칠한 네모 대신 그림글자를 크게 보여줍니다.
// items: [{ emoji, name, note, price, disabled, onPick }]
function openChoiceDialog(title, items, tip) {
  if (!pickWrap) return;
  pickTitle.textContent = title;
  pickGrid.innerHTML = '';
  pickPrice.innerHTML = '';
  if (pickTip) pickTip.textContent = tip || (IS_TOUCH
    ? '관광지라 물가가 비싸구나 ㅠㅠ'
    : '관광지라 물가가 비싸구나 ㅠㅠ (아래 단추를 누르면 결정 · ESC 나가기)');
  let selected = null;
  const swatches = [];
  const okBtn = document.createElement('button');
  okBtn.className = 'buyBtn';
  const refreshBtn = () => {
    okBtn.disabled = !selected;
    okBtn.textContent = selected
      ? (selected.price
        ? `${selected.name} · ${formatWon(selected.price)}\n눌러서 결정`
        : `${selected.name}\n눌러서 결정`)
      : '먼저 하나 골라주세요';
  };
  for (const it of items) {
    const item = document.createElement('div');
    item.className = 'swItem';
    const b = document.createElement('button');
    b.className = 'swatch';
    b.style.background = it.disabled ? '#6b6b6b' : '#f7edd8';
    b.style.fontSize = '28px';
    b.style.lineHeight = '1';
    b.textContent = it.emoji;
    if (it.disabled) b.style.opacity = '0.45';
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (it.disabled) return;
      selected = it;
      swatches.forEach((x) => x.classList.remove('sel'));
      b.classList.add('sel');
      refreshBtn();
    });
    swatches.push(b);
    const nm = document.createElement('div');
    nm.className = 'swName';
    nm.textContent = it.note ? it.name + '\n' + it.note : it.name;
    nm.style.whiteSpace = 'pre-line';
    item.appendChild(b);
    item.appendChild(nm);
    pickGrid.appendChild(item);
  }
  okBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!selected) return;
    pickWrap.style.display = 'none';
    selected.onPick();
  });
  refreshBtn();
  pickPrice.appendChild(okBtn);
  pickWrap.style.display = 'flex';
}

// 상점 씨앗 진열대 — 벽지 고르듯 씨앗 종류를 고릅니다
function openSeedShop() {
  const items = SEED_ORDER.map((k) => {
    const sd = SEEDS[k];
    return {
      emoji: sd.emoji, name: sd.name,
      // 다년생은 "며칠마다", 한 해살이는 "며칠 뒤".
      // 다년생은 밭이 비지 않아 그 필지를 영영 붙잡으니, 사기 전에 미리 알려줍니다.
      note: sd.perennial
        ? `1kg\n${sd.days}일마다 ${formatWon(sd.yield)}\n심으면 그 밭은 못 바꿔요`
        : `1kg\n${sd.days}일 뒤 ${formatWon(sd.yield)}`,
      price: sd.price,
      onPick: () => {
        const price = sd.price;
        if (coins < price) {
          spawnMoneyPopup(state.x, SHOP_ROOM.y + 1.6, state.z, `${formatWon(price - coins)} 부족`);
          return;
        }
        coins -= price;
        seeds[k] = (seeds[k] || 0) + 1;
        updateCoinBadge();
        playPickSound();
        saveGame(true);   // 산 즉시 저장 — 폰 브라우저가 탭을 죽여도 씨앗이 안 날아가게
        spawnMoneyPopup(state.x, SHOP_ROOM.y + 1.6, state.z,
          `${sd.name} 씨앗 한 봉지 (${seeds[k]}봉지)\n밭 하나에 심을 수 있어요`);
      },
    };
  });
  openChoiceDialog('씨앗', items);
}

// 빌린 밭 앞에서 뜨는 창 — 심을 씨앗을 고르거나, 아예 사버립니다
function openFarmDialog(f) {
  const items = SEED_ORDER.map((k) => {
    const sd = SEEDS[k];
    const n = seeds[k] || 0;
    return {
      emoji: sd.emoji, name: sd.name,
      // 차나무는 한 번 심으면 그 필지가 영영 차나무밭입니다 (베지 않고 계속 따는 작물이라
      // 밭이 비지 않습니다). 고르기 전에 그 사실을 못박아 둡니다.
      note: (n ? `${n}봉지 있음` : '없음') + (sd.perennial ? '\n한 번 심으면 못 바꿔요' : ''),
      disabled: !n,
      onPick: () => plantSeed(f, k),
    };
  });
  if (!f.owned) {
    items.push({
      emoji: '🏷', name: '이 땅 사기', note: formatWon(FARM_BUY_PRICE),
      price: FARM_BUY_PRICE,
      onPick: () => buyFarm(f),
    });
  }
  openChoiceDialog(
    (f.owned ? '루루의 땅 ' : '루루가 빌린 땅 ') + farmName(f),
    items,
    f.owned ? '내 땅입니다. 거둔 것은 전부 루루 몫입니다'
            : '빌린 땅입니다. 거둘 때 절반이 이장님 몫으로 나갑니다');
}

// 물건 하나짜리 구입 확인 창 — 물건을 크게 미리 보여주고, 가격을 눌러야 사집니다
// tip·btnLabel을 주면 "구입" 말고 다른 확인 창으로도 씁니다 (경마 출전 같은 것)
function openBuyDialog(emoji, name, price, onBuy, tip, btnLabel) {
  if (!pickWrap) return;
  pickTitle.textContent = name;
  pickGrid.innerHTML = '';
  pickPrice.innerHTML = '';
  if (pickTip) pickTip.textContent = tip || (IS_TOUCH
    ? '관광지라 물가가 비싸구나 ㅠㅠ'
    : '관광지라 물가가 비싸구나 ㅠㅠ (가격을 누르면 구입 · ESC 나가기)');
  const prev = document.createElement('div');
  prev.className = 'bigPreview';
  // 이모지에 없는 물건(망사리처럼)은 직접 그린 그림을 넘깁니다
  if (typeof emoji === 'string' && emoji.trim().startsWith('<svg')) {
    prev.classList.add('drawn');
    prev.innerHTML = emoji;
  } else {
    prev.textContent = emoji;
  }
  pickGrid.appendChild(prev);
  const buyBtn = document.createElement('button');
  buyBtn.className = 'buyBtn';
  buyBtn.textContent = `${formatWon(price)}\n${btnLabel || '눌러서 구입'}`;
  buyBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation();
    pickWrap.style.display = 'none';
    onBuy();
  });
  pickPrice.appendChild(buyBtn);
  pickWrap.style.display = 'flex';
}
// 상자 바깥(어두운 곳)을 누르면 취소
if (pickWrap) pickWrap.addEventListener('pointerdown', (e) => {
  if (pickBox && pickBox.contains(e.target)) return;
  pickWrap.style.display = 'none';
});
// 지금 떠 있는 창을 닫습니다 (닫을 것이 있었으면 true).
// 컴퓨터에서는 F·ESC로, 폰에서는 ✕ 단추와 바깥 누르기로 빠져나갑니다.
function closeOpenPopup() {
  if (pickWrap && pickWrap.style.display === 'flex') { pickWrap.style.display = 'none'; return true; }
  if (bookWrap && bookWrap.style.display === 'flex') { bookWrap.style.display = 'none'; return true; }
  if (mapWrap && mapWrap.style.display === 'flex') { toggleMap(); return true; }
  return false;
}
addEventListener('keydown', (e) => { if (isKey(e, 'Escape')) closeOpenPopup(); });
// 창 오른쪽 위 ✕ — 어느 기기에서든 눈에 보이는 빠져나가기
if (pickBox) {
  const x = document.createElement('button');
  x.className = 'closeX';
  x.textContent = '✕';
  x.title = '닫기';
  x.addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation();
    pickWrap.style.display = 'none';
  });
  pickBox.appendChild(x);
}
if (pickBox) {
  ['touchstart', 'touchmove', 'pointermove'].forEach((ev) =>
    pickBox.addEventListener(ev, (e) => e.stopPropagation()));
}

// ---------- 12-1f-2b. 저장 · 처음부터 · 종료 ----------
// 진행 상황을 브라우저 안(localStorage)에 남깁니다. 게임을 켜면 자동으로 이어집니다.
// (바다 채집물은 저장 안 함 — 켤 때마다 새로 참. 하지만 야생 귤은 1년에 한 번 열리는 제철 과일이라,
//  딴 자리를 저장해서 껐다 켜도 유지됩니다. 그래야 "한 번 따면 1년"이 진짜로 지켜집니다.)
const SAVE_KEY = 'lulu_jeju_save';
let gameRestarting = false;   // "처음부터 다시하기" 중에는 저장을 막습니다 (안 그러면 지운 저장이 다시 써집니다)
let saveLocked = false;       // 불러오기가 실패했을 때 — 멀쩡한 기록을 덮어쓰지 않게 잠급니다
let saveWarned = false;       // 저장이 막힌 브라우저라고 한 번만 알려줍니다
function saveGame(quiet) {
  if (gameRestarting || saveLocked) return;
  try {
    // 실내(집·상점)에 있을 때는 그 집 문 앞, 물속이면 포구 물가 위치로 저장합니다
    // (잠수 좌표를 그대로 저장하면 다시 켰을 때 바다 밑바닥에서 걸어다니게 됩니다 — 실제 발생한 버그)
    const outX = state.diving ? BULTEOK.x : (state.inside ? HOUSE.x : (state.inShop ? SHOP_DOOR.x : state.x));
    const outZ = state.diving ? BULTEOK.z : (state.inside ? HOUSE.z + 5.4 : (state.inShop ? SHOP_DOOR.z - 1.6 : state.z));
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      coins, carrots, ponyLove, houseStage, fixSwings, seeds,
      net, netNight,   // 덜 채운 망사리 내용물 — 안 넣으면 새로고침에 채집물이 증발합니다
      tools, basketCount, basketKinds, hasContainer, x: outX, z: outZ,
      // 상자 전부 — 지금 끌고 있는 것과 밭에 놔둔 것들의 자리·내용물
      crates: crates.map((c) => (c === curCrate
        ? { x: basketPos.x, z: basketPos.z, f: basketFacing, n: basketCount, k: basketKinds, cur: true }
        : { x: c.x, z: c.z, f: c.facing, n: c.count, k: c.kinds })),
      hasNet, netCarried, netX: netObj.position.x, netZ: netObj.position.z,
      furn: furnitureOwned,
      gameT, dayCount, lastFedDay, fedToday, ponyAlive, ponyDeaths, tutorialSeen, introSeen, dayEvent,
      endingState, happyDay,
      floorC: houseFloorColor, wallC: houseWallColor, paintC: housePaintColor,
      stat,
      romanceStage, romanceSeen, lonelySeen, munamIgnored, munamSold, lifeCount,
      munamSeenOut, munamTripDay, halmangDiveIdx,
      farms: FARMS.map((f) => ({ r: f.rented, o: f.owned, c: f.crop, p: f.planted, s: f.stolen, rd: f.rentedDay })),
      // 플레이어가 딴 야생 귤 — [칸번호, 딴날] 쌍만 저장 (개간으로 지운 건 pickedDay<0이라 제외)
      fruit: fruitSpots.reduce((a, s, i) => { if (s.picked && s.pickedDay >= 0) a.push(i, s.pickedDay); return a; }, []),
    }));
    if (!quiet) spawnMoneyPopup(state.x, lulu.position.y + 1.6, state.z, '저장했어요');
  } catch (e) {
    // 시크릿 창·앱 안의 브라우저·저장공간 부족이면 저장이 막힙니다.
    // 예전에는 조용히 넘어가서, 플레이어는 몇 시간 뒤 다시 켤 때에야 기록이 없는 걸 알았습니다.
    if (!saveWarned) {
      saveWarned = true;
      spawnMoneyPopup(state.x, lulu.position.y + 1.6, state.z,
        '이 브라우저에서는 기록을 저장할 수 없어요\n시크릿 창이면 일반 창에서 열어주세요', 7);
    } else if (!quiet) {
      spawnMoneyPopup(state.x, lulu.position.y + 1.6, state.z, '저장하지 못했어요', 4);
    }
  }
}
function loadGame() {
  let d;
  try { d = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return; }
  if (!d) return;
  coins = d.coins || 0;
  carrots = d.carrots || 0;
  ponyLove = d.ponyLove || 0;
  houseStage = (d.houseStage === undefined) ? 0 : Math.max(0, d.houseStage);   // 집은 처음부터 루루의 것
  fixSwings = d.fixSwings || 0;
  if (d.tools) Object.assign(tools, d.tools);
  hasContainer = !!d.hasContainer;
  applyContainer();
  applyHouseLook();
  // 상자들 — 자리와 담긴 귤까지 그대로 되살립니다.
  // 상자를 하나만 쓰던 예전 저장은 basketCount·basketKinds만 있어서, 그것도 받아줍니다.
  if (Array.isArray(d.crates) && d.crates.length) {
    while (crates.length < d.crates.length) makeCrate(0, 0);
    let want = curCrate;
    d.crates.forEach((sv, i) => {
      const c = crates[i];
      c.x = sv.x || 0; c.z = sv.z || 0; c.facing = sv.f || 0;
      c.kinds = Array.isArray(sv.k) ? sv.k.slice() : [];
      c.count = Math.min(sv.n || 0, BASKET_CAP);
      renderCrate(c);
      if (sv.cur) want = c;
    });
    // 끌고 있던 상자를 다시 손에 쥡니다 (switchCrate는 지금 것을 놓고 저것을 잡는 식이라 순서를 맞춰줍니다)
    curCrate = crates[0]; basket = curCrate.group; filledFruits = curCrate.fruits;
    basketCount = curCrate.count; basketKinds = curCrate.kinds.slice();
    basketPos.x = curCrate.x; basketPos.z = curCrate.z; basketFacing = curCrate.facing;
    if (want !== curCrate) switchCrate(want);
    renderCrate(curCrate);
    updateBasketBadge();
  } else {
    const savedKinds = Array.isArray(d.basketKinds) ? d.basketKinds : [];
    for (let i = 0; i < (d.basketCount || 0); i++) addFruitToBasket(savedKinds[i]);
  }
  // 망사리 — 메고 있었으면 다시 등에, 내려놨었으면 그 자리에 그대로
  hasNet = !!d.hasNet;
  if (hasNet) {
    netObj.visible = true;
    netCarried = d.netCarried !== false;
    if (!netCarried && typeof d.netX === 'number' && typeof d.netZ === 'number') {
      netObj.position.set(d.netX, groundHeight(d.netX, d.netZ), d.netZ);
    }
  }
  // 가구 — 산 것들을 집 안에 다시 놓습니다
  furnitureOwned = Object.assign(emptyFurnOwned(), d.furn || {});
  applyFurniture();
  // 덜 채운 망사리 내용물 복원
  net = Array.isArray(d.net) ? d.net.filter((k) => CATCH_KINDS[k]) : [];
  netNight = Array.isArray(d.netNight) ? d.netNight.slice(0, net.length) : [];
  // 농사 — 빌린 밭과 심어둔 작물
  seeds = d.seeds || {};
  if (Array.isArray(d.farms)) {
    d.farms.forEach((sv, i) => {
      const f = FARMS[i];
      if (!f || !sv) return;
      f.rented = !!sv.r;
      f.owned = !!sv.o;
      f.stolen = !!sv.s;      // 무남이가 팔아넘긴 필지인지
      f.rentedDay = sv.rd || 0;   // 년세를 낸 날 (예전 저장은 0 → 첫 해로 봅니다)
      f.crop = SEEDS[sv.c] ? sv.c : null;
      f.planted = sv.p || 0;
    });
  }
  // (밭 그림은 아래에서 dayCount까지 되살린 뒤에 다시 그립니다 — 자란 정도가 날짜에 달렸으니까요)
  // 무남이와 어디까지 왔는지
  romanceStage = d.romanceStage || 0;
  romanceSeen = d.romanceSeen || {};
  lonelySeen = d.lonelySeen || {};
  munamIgnored = d.munamIgnored || 0;
  munamSold = d.munamSold || 0;
  // 불러오면 무남이는 늘 평상에 앉아 있는 데서 다시 시작합니다 (길 한복판에서 깨어나지 않게)
  munamSeenOut = !!d.munamSeenOut;
  munamTripDay = (d.munamTripDay === undefined) ? -1 : d.munamTripDay;
  halmangDiveIdx = d.halmangDiveIdx || 0;
  munamTrip = 0; munamLeg = 0;
  munam.x = MUNAM_SEAT.x; munam.z = MUNAM_SEAT.z; munam.facing = Math.PI;
  lifeCount = d.lifeCount || 1;
  // 게임 시간과 말의 끼니
  if (typeof d.gameT === 'number') gameT = d.gameT;
  dayCount = d.dayCount || 1;
  // 아침 8시 전에 저장했던 게임이면, 그날 아침 알림(말먹이·오늘의 소식·엔딩 판정)은 아직 안 온 것입니다
  morningShownDay = gameHour() >= MORNING_HOUR ? dayCount : dayCount - 1;
  lastFedDay = d.lastFedDay || 0;
  fedToday = d.fedToday || 0;
  ponyAlive = d.ponyAlive !== false;
  ponyDeaths = d.ponyDeaths || 0;
  tutorialSeen = !!d.tutorialSeen;
  introSeen = !!d.introSeen;
  dayEvent = d.dayEvent || null;
  endingState = d.endingState || 0;
  happyDay = d.happyDay || 0;
  if (d.stat) Object.assign(stat, d.stat);
  applyPonyAlive();
  // 집 인테리어 (바닥재·벽지·외벽 페인트)
  houseFloorColor = d.floorC || 0;
  houseWallColor = d.wallC || 0;
  housePaintColor = d.paintC || 0;
  applyRoomLook();
  // 예전 저장이 실내 좌표를 담고 있으면 무시하고 섬의 시작 자리에서 깨어납니다
  if (typeof d.x === 'number' && d.x < 380) {
    state.x = d.x; state.z = d.z;
    lulu.position.set(state.x, groundHeight(state.x, state.z), state.z);
  }
  updateCoinBadge(); updateCarrotBadge(); updateBasketBadge();
  // 딴 야생 귤 되살리기 — 저장된 [칸번호, 딴날]대로 다시 감춥니다. 1년이 지난 건 곧바로 다시 열립니다.
  if (Array.isArray(d.fruit)) {
    for (let j = 0; j + 1 < d.fruit.length; j += 2) {
      const i = d.fruit[j], day = d.fruit[j + 1];
      if (fruitSpots[i] && !fruitSpots[i].picked) {
        if (dayCount - day >= FRUIT_REGROW_DAYS) continue;   // 이미 1년 지났으면 그냥 열린 채로 둠
        hideFruit(i, day);
      }
    }
  }
  refreshAllFarms();   // 날짜까지 되살린 뒤라야 작물이 얼마나 자랐는지 맞게 그려집니다
  // 새드엔딩 끝 대사 도중에 껐던 저장 — 리셋(집·재산 몰수)이 안 된 채 2로 굳어 있으면 여기서 마저 처리합니다.
  // 안 하면 어떤 엔딩도 두 번 다시 안 나오는 막다른 상태가 됩니다 (실제 재현 가능했던 버그).
  if (endingState === 2) restartAfterSad();
  // 해피엔딩 직후(새드엔딩 나오기 전)에 껐던 경우 — 말을 죽인 적 있으면 켜자마자 새드엔딩을 이어줍니다.
  else if (endingState === 1) setTimeout(() => { if (!talkOpen()) playSadEnding(); }, 1500);
}
// (불러오기는 스크립트 맨 아래에서 합니다 — 여기서 부르면 아직 안 만들어진
//  배지들을 건드려 게임 전체가 멈춥니다)

const btnSave = document.getElementById('btnSave');
if (btnSave) btnSave.addEventListener('pointerdown', (e) => { e.preventDefault(); saveGame(); });

// 화면 저장은 💾 버튼으로 직접, 그리고 죽음·엔딩·구매 같은 되돌리면 안 되는 순간마다 자동으로 됩니다.
// 여기에 더해, 폰이 탭을 숨기거나 닫는 순간(다른 앱으로 나가기·카톡 브라우저가 잠재우기)에도 한 번 저장합니다.
// 폰 브라우저는 백그라운드 탭을 예고 없이 죽여서, 이 안전망이 없으면 방금 산 씨앗·가구가 통째로 날아갑니다.
addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveGame(true); });
addEventListener('pagehide', () => saveGame(true));
setInterval(lonelyCheck, 5000);   // 외로움 독백은 자산이 문턱을 넘을 때 (밭·집·가구 무엇이든)

// 접속 1분 뒤 — PC 조작 설명(#help)을 절반 크기로 줄여 오른쪽 아래로 (폰에선 애초에 숨겨져 있어 영향 없음)
setTimeout(() => { const h = document.getElementById('help'); if (h) h.classList.add('mini'); }, 60000);

// 새로 시작 — 화면 위쪽 버튼. 저장을 지우고 루루의 이야기부터 다시.
const restartTop = document.getElementById('restartTop');
if (restartTop) restartTop.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (confirm((window.T || ((s) => s))('처음부터 다시할까요?\n저장된 진행이 모두 지워집니다.'))) {
    gameRestarting = true;   // 새로고침 직전 pagehide 자동 저장이 지운 걸 되살리지 못하게 막습니다
    try { localStorage.removeItem(SAVE_KEY); } catch (err) {}
    location.reload();
  }
});

// ---------- 12-1f-3. 전체 지도 (M키 / 🗺 배지) ----------
// 지도는 따로 그림을 만들지 않고, 게임이 쓰는 지형 높이 함수(groundHeight)를 그대로
// 캔버스에 칠해서 만듭니다. 그래서 지형을 고치면 지도도 저절로 맞습니다.
const MAP_WORLD = 112;   // 지도에 담는 범위 (-112 ~ +112)
let mapBase = null;      // 한 번 그려두는 바탕 (지형·나무·돌담·건물)

function buildMapBase() {
  const S = 560;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const g = c.getContext('2d');
  // 게임에서는 +z가 북쪽(위)인데 캔버스 y는 아래로 갈수록 커지므로, 세로를 뒤집어야 방향이 맞습니다.
  // 가로도 뒤집습니다 — 바다(북쪽)를 바라보고 섰을 때 내 오른손 방향(-x)이 동쪽이므로,
  // 지도에서도 그쪽이 오른쪽에 와야 "바다 보고 오른쪽으로 갔는데 지도에선 왼쪽으로 가네"가 안 생깁니다.
  const w2m = (wx, wz) => [(1 - (wx + MAP_WORLD) / (MAP_WORLD * 2)) * S, (1 - (wz + MAP_WORLD) / (MAP_WORLD * 2)) * S];

  // 지형 — 픽셀마다 땅 높이를 재서 바다/모래/풀밭/오름 색을 칠합니다
  const img = g.createImageData(S, S);
  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      const wx = (1 - px / S) * MAP_WORLD * 2 - MAP_WORLD;   // 가로 뒤집기 (동쪽 = -x)
      const wz = (1 - py / S) * MAP_WORLD * 2 - MAP_WORLD;
      const h = groundHeight(wx, wz);
      let r, gg, b;
      if (h < -0.4) { r = 31; gg = 107; b = 125; }         // 바다
      else if (h < 0.6) { r = 216; gg = 199; b = 155; }    // 물가 모래
      else {
        const t = Math.min(1, (h - 0.6) / 14);             // 높을수록 밝은 풀빛
        r = 106 + t * 40; gg = 152 + t * 26; b = 72 + t * 20;
      }
      const i = (py * S + px) * 4;
      img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);

  // 물질장 — 물속 사냥터를 점선 동그라미로
  {
    const [cx, cy] = w2m(DIVE.x, DIVE.z);
    g.strokeStyle = 'rgba(255,255,255,.75)';
    g.setLineDash([6, 5]);
    g.lineWidth = 2;
    g.beginPath();
    g.arc(cx, cy, DIVE.r / (MAP_WORLD * 2) * S, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
  }

  // 귤나무 — 점 하나가 나무 한 그루입니다 (개간으로 사라진 나무는 지도에서도 뺍니다)
  g.fillStyle = '#2e5c2a';
  for (const t of trunkSpots) {
    if (t.cleared) continue;
    const [px, py] = w2m(t.x, t.z);
    g.fillRect(px - 1, py - 1, 2.4, 2.4);
  }
  // 돌담 — 뛰어넘을 수 있는 낮은 장애물(topY가 낮은 것)이 담입니다
  g.fillStyle = 'rgba(70,70,72,.8)';
  for (const o of obstacles) {
    if (o.topY >= NO_JUMP) continue;
    const [px, py] = w2m(o.x, o.z);
    g.fillRect(px - 1, py - 1, 2, 2);
  }

  // 이름표는 바탕에 굽지 않습니다 — 확대해도 글씨 크기가 그대로여야 읽기 좋으니,
  // 지도를 그릴 때마다 위에 따로 얹습니다 (drawMapLabels)
  return c;
}
// 건물·장소 이름표
function drawMapLabels(g, w2m) {
  g.textAlign = 'center';
  const z = mapZoom;   // 확대하면 글씨도 같이 커집니다
  const TT = window.T || ((s) => s);   // 영어 모드면 이름표를 번역해서 그립니다
  const label = (wx, wz, emoji, rawName) => {
    const name = TT(rawName);
    const [px, py] = w2m(wx, wz);
    g.font = `${20 * z}px sans-serif`;
    g.fillText(emoji, px, py + 6 * z);
    g.font = `bold ${12.5 * z}px "맑은 고딕", Malgun Gothic, sans-serif`;
    g.lineWidth = 3 * z;
    g.strokeStyle = 'rgba(0,0,0,.65)';
    g.strokeText(name, px, py + 21 * z);
    g.fillStyle = '#fff';
    g.fillText(name, px, py + 21 * z);
  };
  label(shop.group.position.x, shop.group.position.z, '🏪', '이장님 상점');
  label(depot.group.position.x - 8, depot.group.position.z, '🚚', '택배사');
  label(STABLE.x, STABLE.z, '🐴', '마구간');
  label(HOUSE.x, HOUSE.z, '🏠', houseStage >= 3 ? '내 집' : '헌집');
  label(PORT.x, PORT.z, '⚓', '포구');
  label(MUNAM_HOUSE.x, MUNAM_HOUSE.z, '🤵', '무남이네');
}
// 지도에 그때그때 달라지는 것들 — 자리가 옮겨 다녀서 어디 뒀는지 잊기 쉬운 살림살이입니다.
// 귤 상자와 내려놓은 망사리, 둘 다 넓은 섬 어딘가에 두고 오면 찾기가 고약합니다.
// 망사리 표식은 🧺 이모지가 아니라 게임과 같은 그림(테왁+그물)으로 찍습니다
let netMapImg = null;
function netMapIcon() {
  if (!netMapImg) {
    netMapImg = new Image();
    netMapImg.onload = () => { if (mapOpen) drawMap(); };   // 그림이 늦게 오면 지도를 한 번 다시 그립니다
    // 이미지로 쓰려면 xmlns 선언과 절대 크기가 있어야 합니다 (없으면 소리 없이 빈 그림이 됩니다)
    netMapImg.src = 'data:image/svg+xml;charset=utf-8,' +
      encodeURIComponent(NET_ICON_SVG
        .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
        .replace('width="100%" height="100%"', 'width="100" height="100"'));
  }
  return netMapImg;
}
function drawMapMarks(g, w2m) {
  const z = mapZoom;   // 확대하면 글씨도 같이 커집니다
  const TT = window.T || ((s) => s);   // 영어 모드면 이름표를 번역해서 그립니다
  const mark = (wx, wz, emoji, rawName, color) => {
    const name = TT(rawName);
    const [px, py] = w2m(wx, wz);
    g.textAlign = 'center';
    g.font = `${20 * z}px sans-serif`;
    g.fillText(emoji, px, py + 6 * z);
    g.font = `bold ${12.5 * z}px "맑은 고딕", Malgun Gothic, sans-serif`;
    g.lineWidth = 3 * z;
    g.strokeStyle = 'rgba(0,0,0,.65)';
    g.strokeText(name, px, py + 21 * z);
    g.fillStyle = color || '#ffd45e';
    g.fillText(name, px, py + 21 * z);
  };
  // 이장님께 빌린 밭과 아예 사버린 땅 — 어느 밭이 내 것인지 지도에서 바로 보이게
  // 사버린 땅은 빨간 글씨로 도드라지게, 빌린 밭은 초록으로
  for (const f of FARMS) {
    if (f.owned) mark(f.x, f.z, '🌱', '루루의 땅', '#ff5648');
    else if (f.rented && !rentExpired(f)) mark(f.x, f.z, '🌱', '루루가 빌린 밭', '#9be27a');
    else mark(f.x, f.z, '🪧', '이장님 밭', '#d8cdb4');
  }
  // (귤상자는 지도에 안 찍습니다 — 여러 개를 두고 다니면 마당이 상자 딱지로 뒤덮입니다)
  // 내려놓은 망사리 — 이름표는 다른 표식과 같게, 그림만 그린 망사리로
  if (hasNet && !netCarried) {
    mark(netObj.position.x, netObj.position.z, '', '망사리');
    const img = netMapIcon();
    if (img.complete && img.naturalWidth) {
      const [px, py] = w2m(netObj.position.x, netObj.position.z);
      g.drawImage(img, px - 13 * z, py - 17 * z, 26 * z, 26 * z);
    }
  }
}

const mapWrap = document.getElementById('mapWrap');
const mapCanvas = document.getElementById('mapCanvas');
let mapOpen = false;
function toggleMap() {
  mapOpen = !mapOpen;
  if (!mapWrap) return;
  mapWrap.style.display = mapOpen ? 'flex' : 'none';
  if (mapOpen) { resetMapView(); drawMap(); }   // 열 때마다 섬 전체로 되돌립니다
}
// ----- 지도 확대·이동 -----
// 마당 언저리에 이름표가 몰려 겹칩니다 (귤상자·망사리·이장님 밭·택배사가 다 그 근처).
// 확대해서 들여다볼 수 있어야 어디가 어딘지 갈립니다.
// 글씨도 지형과 함께 커집니다 — 확대했는데 글씨만 그대로면 되레 작아 보입니다.
let mapZoom = 1, mapPanX = 0, mapPanY = 0;
const MAP_ZOOM_MIN = 1, MAP_ZOOM_MAX = 4;
function clampMapPan() {
  const S = mapBase ? mapBase.width : 560;
  const slack = S * (mapZoom - 1) / 2;      // 확대한 만큼만 밀 수 있습니다
  mapPanX = Math.max(-slack, Math.min(slack, mapPanX));
  mapPanY = Math.max(-slack, Math.min(slack, mapPanY));
}
function mapZoomAt(factor, cxRatio, cyRatio) {
  const before = mapZoom;
  mapZoom = Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, mapZoom * factor));
  const k = mapZoom / before;
  // 손가락(또는 마우스) 아래 지점이 제자리에 머물도록 밀어줍니다
  const S = mapBase ? mapBase.width : 560;
  const fx = (cxRatio - 0.5) * S, fy = (cyRatio - 0.5) * S;
  mapPanX = (mapPanX - fx) * k + fx;
  mapPanY = (mapPanY - fy) * k + fy;
  clampMapPan();
  drawMap();
}
function resetMapView() { mapZoom = 1; mapPanX = 0; mapPanY = 0; }

function drawMap() {
  if (!mapCanvas) return;
  if (!mapBase) mapBase = buildMapBase();          // 처음 열 때 한 번만 그립니다
  const g = mapCanvas.getContext('2d');
  const S = mapBase.width;
  mapCanvas.width = S; mapCanvas.height = S;
  g.clearRect(0, 0, S, S);
  g.save();
  // 가운데를 기준으로 확대하고, 끌어서 민 만큼 옮깁니다
  g.translate(S / 2 + mapPanX, S / 2 + mapPanY);
  g.scale(mapZoom, mapZoom);
  g.translate(-S / 2, -S / 2);
  g.drawImage(mapBase, 0, 0);
  g.restore();
  // 이름표와 점은 확대와 상관없이 같은 크기로 — 자리만 확대에 맞춰 옮깁니다
  const toMap = (wx, wz) => {
    const bx = (1 - (wx + MAP_WORLD) / (MAP_WORLD * 2)) * S;
    const by = (1 - (wz + MAP_WORLD) / (MAP_WORLD * 2)) * S;
    return [S / 2 + mapPanX + (bx - S / 2) * mapZoom,
            S / 2 + mapPanY + (by - S / 2) * mapZoom];
  };
  drawMapLabels(g, toMap);   // 건물·장소 이름표
  drawMapMarks(g, toMap);    // 귤상자·망사리·밭
  const [px, py] = toMap(state.x, state.z);
  g.fillStyle = '#ff8c1a';
  g.strokeStyle = '#fff';
  g.lineWidth = 2.5 * mapZoom;
  g.beginPath(); g.arc(px, py, 7 * mapZoom, 0, Math.PI * 2); g.fill(); g.stroke();
  g.textAlign = 'center';
  g.font = `bold ${13 * mapZoom}px "맑은 고딕", Malgun Gothic, sans-serif`;
  g.lineWidth = 3 * mapZoom; g.strokeStyle = 'rgba(0,0,0,.65)';
  const luluName = (window.T || ((s) => s))('루루');
  g.strokeText(luluName, px, py - 12 * mapZoom);
  g.fillStyle = '#ffd88a';
  g.fillText(luluName, px, py - 12 * mapZoom);
  const cap = document.getElementById('mapCap');
  if (cap) cap.textContent = mapZoom > 1.02
    ? `${mapZoom.toFixed(1)}배 · 끌어서 이동 · 두 손가락으로 축소`
    : (IS_TOUCH ? '두 손가락으로 벌리면 확대 · 바깥을 누르면 닫힘'
                : '휠로 확대 · 끌어서 이동 · M 키로 닫기');
}
addEventListener('keydown', (e) => { if (isKey(e, 'KeyM')) toggleMap(); });

// ----- 지도 만지기 — 확대·이동, 그리고 닫기 -----
// 지도 위에서는 끌어서 옮기고 두 손가락으로 확대합니다.
// 지도 바깥을 누르거나, 지도를 끌지 않고 톡 누르면 닫힙니다.
if (mapWrap && mapCanvas) {
  let dragging = false, moved = 0, lastX = 0, lastY = 0, pinch = 0;
  const ratioAt = (x, y) => {
    const r = mapCanvas.getBoundingClientRect();
    return [(x - r.left) / r.width, (y - r.top) / r.height];
  };
  mapCanvas.style.touchAction = 'none';
  mapCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.touches.length === 1) {
      dragging = true; moved = 0;
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      dragging = false;
      pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                         e.touches[0].clientY - e.touches[1].clientY);
    }
  }, { passive: false });
  mapCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); e.stopPropagation();
    const S = mapBase ? mapBase.width : 560;
    const scale = S / mapCanvas.getBoundingClientRect().width;   // 화면 픽셀 → 지도 픽셀
    if (e.touches.length === 1 && dragging) {
      const dx = e.touches[0].clientX - lastX, dy = e.touches[0].clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      mapPanX += dx * scale; mapPanY += dy * scale;
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
      clampMapPan(); drawMap();
    } else if (e.touches.length === 2 && pinch > 0) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                           e.touches[0].clientY - e.touches[1].clientY);
      const [cx, cy] = ratioAt((e.touches[0].clientX + e.touches[1].clientX) / 2,
                               (e.touches[0].clientY + e.touches[1].clientY) / 2);
      mapZoomAt(d / pinch, cx, cy);
      pinch = d;
      moved += 99;   // 확대한 것은 "톡 누름"으로 치지 않습니다
    }
  }, { passive: false });
  mapCanvas.addEventListener('touchend', (e) => {
    e.stopPropagation();
    if (dragging && moved < 8) toggleMap();   // 끌지 않고 톡 눌렀으면 닫기
    dragging = false;
    if (e.touches.length < 2) pinch = 0;
  });
  // 마우스: 휠로 확대, 끌어서 이동
  mapCanvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const [cx, cy] = ratioAt(e.clientX, e.clientY);
    mapZoomAt(e.deltaY < 0 ? 1.18 : 1 / 1.18, cx, cy);
  }, { passive: false });
  mapCanvas.addEventListener('pointerdown', (e) => {
    // 손가락은 touchstart 쪽에서 따로 봅니다.
    // 다만 여기서 막아두지 않으면 이 신호가 지도 바깥틀까지 올라가 지도를 닫아버립니다
    // (폰에서 pointerdown은 touchstart보다 먼저 옵니다 — 손을 대자마자 닫혀서 확대를 못 했습니다)
    if (e.pointerType === 'touch') { e.stopPropagation(); return; }
    e.preventDefault(); e.stopPropagation();
    dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY;
    mapCanvas.setPointerCapture(e.pointerId);
  });
  mapCanvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || !dragging) return;
    const S = mapBase ? mapBase.width : 560;
    const scale = S / mapCanvas.getBoundingClientRect().width;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    moved += Math.abs(dx) + Math.abs(dy);
    mapPanX += dx * scale; mapPanY += dy * scale;
    lastX = e.clientX; lastY = e.clientY;
    clampMapPan(); drawMap();
  });
  mapCanvas.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'touch') { e.stopPropagation(); return; }
    e.stopPropagation();
    if (dragging && moved < 6) toggleMap();
    dragging = false;
  });
  // 지도 바깥(어두운 바탕)을 누르면 닫힙니다.
  // 지도 그림 위에서 시작한 신호는 여기서 걸러냅니다 — 확대하려다 닫히면 안 되니까요.
  mapWrap.addEventListener('pointerdown', (e) => {
    if (e.target === mapCanvas) return;
    e.preventDefault(); toggleMap();
  });
}
const mapBadge = document.getElementById('mapBadge');
if (mapBadge) {
  mapBadge.classList.add('tappable');
  mapBadge.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); toggleMap(); });
}

// ---------- 12-1g. 당근 사서 조랑말 먹이기 ----------
// 당근 개수는 화면에 상시로 띄우지 않습니다 — 🎒 자산 화면에서 봅니다.
// 왼쪽 아래는 조이스틱 자리라 배지가 겹쳤고, 당근은 급히 확인할 일도 없습니다.
const carrotBadge = document.getElementById('carrotBadge');
function updateCarrotBadge() {
  if (!carrotBadge) return;
  carrotBadge.style.display = 'none';
}

// (가게 앞 당근 바구니는 치웠습니다 — 당근은 상점 안에서 삽니다)

// ---------- 12-1g-2. 조랑말 경마 ----------
// 마구간 옆 팻말에서 참가비를 내면 경주가 열립니다. 직접 뽑으신 경주 영상이
// 그대로 중계가 됩니다: 이기면 1등으로 웃는 영상, 지면 꼴등으로 우는 영상.
// 승부는 순전히 그날의 운입니다 — 아무리 잘 먹여도 말은 말이니까요.
// 나갈 때마다 애정이 3은 되어야 하고, 한 번 출전할 때마다 애정이 3씩 소모됩니다.
// 애정은 하루에 1씩만 쌓이니 결국 사흘에 한 판꼴이지만,
// 9까지 모아 오면 하루에 세 번도 나갈 수 있습니다.
// (승률 반반에 상금 10배라 소모 없이 두면 경마만 돌려도 돈이 무한히 벌립니다)
const RACE_LOVE = 3;           // 출전에 필요한 애정이자 한 판에 소모되는 애정
const RACE_FEE_BASE = 20000;   // 첫 출전 참가비
// 나갈 때마다 판이 두 배로 커집니다 — 참가비도, 상금도.
// 2만원 걸면 20만원 · 4만원 걸면 40만원 · 8만원 걸면 80만원 …
// 다만 끝없이 커지면 경마 한 판으로 1억이 나버립니다. 그래서 상한을 둡니다.
// 2만 → 4 → 8 → 16 → 32만까지 두 배로 가다가, 여섯 번째부터는 계속 100만원입니다 (상금 최대 1천만원).
const RACE_FEE_MAX = 1000000;                     // 참가비 상한 (상금은 그 열 배인 1천만원)
function raceFee() {
  const n = stat.races || 0;
  return n >= 5 ? RACE_FEE_MAX : RACE_FEE_BASE * Math.pow(2, n);
}
function racePrize(fee) { return (fee || raceFee()) * 10; }
function raceWinChance() { return 0.5; }   // 반반 — 순수한 운
const RACE_SPOT = { x: STABLE.x + 3.5, z: STABLE.z + 5.5 };
const RACE_RANGE = 2.2;
let racing = false;
// 경마 팻말
{
  const y = groundHeight(RACE_SPOT.x, RACE_SPOT.z);
  // 기둥은 판 아래에서 끊습니다 — 판 높이까지 올리면 기둥이 간판 앞을 지나가며 글씨를 가립니다.
  // 판 뒤쪽으로도 조금 물려서 어느 각도에서 봐도 글자에 걸리지 않게 합니다.
  [-0.62, 0.62].forEach((off) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.05, 6), citrusTrunkMat);
    post.position.set(RACE_SPOT.x - 0.08, y + 1.02, RACE_SPOT.z + off);
    post.castShadow = true;
    scene.add(post);
  });
  // 「제주경마 / GO!」 — 참가비는 나갈수록 두 배가 되니 팻말에는 적지 않고,
  // 눌렀을 때 뜨는 창에서 그날의 참가비를 보여줍니다.
  // 경마장 간판답게 큼직하고 요란하게 그립니다 (512×256로 그려야 가까이서도 글씨가 또렷합니다).
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g2 = c.getContext('2d');
  // 바탕 — 위아래로 살짝 그러데이션 준 크림색 판
  const grad = g2.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#fdf4dc');
  grad.addColorStop(1, '#efdcb4');
  g2.fillStyle = grad; g2.fillRect(0, 0, 512, 256);
  // 굵은 나무 테두리 + 안쪽 금색 줄
  g2.strokeStyle = '#6b4423'; g2.lineWidth = 18; g2.strokeRect(9, 9, 494, 238);
  g2.strokeStyle = '#c9932f'; g2.lineWidth = 5;  g2.strokeRect(28, 28, 456, 200);
  // 네 귀퉁이 장식 못
  g2.fillStyle = '#8a6a3a';
  [[40, 40], [472, 40], [40, 216], [472, 216]].forEach(([px, py]) => {
    g2.beginPath(); g2.arc(px, py, 7, 0, Math.PI * 2); g2.fill();
  });
  g2.textAlign = 'center';
  g2.textBaseline = 'middle';
  // 제주경마 — 글자 밑에 옅은 그림자를 깔아 도드라지게
  const raceSignName = (window.T || ((s) => s))('제주경마');
  g2.font = `bold ${raceSignName.length > 6 ? 56 : 72}px "맑은 고딕", Malgun Gothic, sans-serif`;
  g2.fillStyle = 'rgba(90,60,25,.35)';
  g2.fillText(raceSignName, 258, 89);
  g2.fillStyle = '#3b2410';
  g2.fillText(raceSignName, 256, 87);
  // 가운데 가름줄 (양옆으로 짧게)
  g2.strokeStyle = '#c9932f'; g2.lineWidth = 3;
  g2.beginPath(); g2.moveTo(120, 130); g2.lineTo(392, 130); g2.stroke();
  // 최대상금 안내 — 빨간 글씨에 흰 테두리를 둘러 멀리서도 확 보이게
  const prizeLine = (window.T || ((s) => s))('최대상금 1천만원!!');
  g2.font = `bold ${prizeLine.length > 14 ? 34 : 46}px "맑은 고딕", Malgun Gothic, sans-serif`;
  g2.lineWidth = 8; g2.strokeStyle = '#fff8e6';
  g2.strokeText(prizeLine, 256, 184);
  g2.fillStyle = '#e01b1b';
  g2.fillText(prizeLine, 256, 184);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
  board.position.set(RACE_SPOT.x, y + 2.65, RACE_SPOT.z);
  board.rotation.y = Math.PI / 2;
  scene.add(board);
}
function tryRace() {
  const y = groundHeight(RACE_SPOT.x, RACE_SPOT.z) + 1.8;
  if (racing) return;
  if (!ponyAlive) {
    spawnMoneyPopup(RACE_SPOT.x, y, RACE_SPOT.z, '조랑말이 있어야 경마에 나갑니다');
    return;
  }
  // 한 판에 애정 3이 듭니다 — 모자라면 당근으로 다시 채워야 해요
  if (ponyLove < RACE_LOVE) {
    spawnMoneyPopup(RACE_SPOT.x, y, RACE_SPOT.z,
      `애정이 ${RACE_LOVE}은 되어야 출전해요 (지금 ${ponyLove})\n하루에 당근 하나씩 먹여주세요`);
    return;
  }
  const fee = raceFee();
  if (coins < fee) {
    spawnMoneyPopup(RACE_SPOT.x, y, RACE_SPOT.z, `${formatWon(fee - coins)} 부족`);
    return;
  }
  // 참가비가 적지 않고 나갈수록 두 배가 되니, 누르자마자 나가지 않고 한 번 물어봅니다
  openBuyDialog('🏇', '제주경마 출전', fee, () => {
    // 승패·돈·애정을 영상 시작 전에 전부 확정하고 저장합니다.
    // 영상 도중 새로고침해서 결과를 무르는 꼼수(지면 새로고침 → 참가비 회수)를 막기 위함입니다.
    coins -= fee;
    stat.races++;
    const win = Math.random() < raceWinChance();
    const prize = win ? racePrize(fee) : 0;
    if (win) { coins += prize; stat.raceWins++; }
    ponyLove -= RACE_LOVE;   // 전력으로 달린 말은 지칩니다 (음수 애정도 그대로 둡니다)
    updateCoinBadge();
    saveGame(true);
    startRaceVideo(win, prize);
  }, `경마 참가비 ${formatWon(fee)}\n1등 상금 ${formatWon(racePrize(fee))} · 승률은 반반`, '출전하시겠습니까');
}
// ----- 경주 영상 미리 받아두기 -----
// 이긴 영상 5MB, 진 영상 4MB입니다. 출전하는 순간 받기 시작하면 까만 화면만 한참 봐야 해서,
// 경마 팻말 근처에 처음 다가올 때 두 편을 미리 받아둡니다. 그러면 출전하자마자 바로 시작합니다.
// 두 편을 각각 따로 두는 것도 같은 이유입니다 — 한 태그에 src만 갈아끼우면 그때마다 다시 받습니다.
const raceVideos = {};
let racePreloaded = false;
function preloadRaceVideos() {
  if (racePreloaded) return;
  racePreloaded = true;
  const wrap = document.getElementById('raceWrap');
  if (!wrap) return;
  for (const k of ['win', 'lose']) {
    const v = document.createElement('video');
    v.className = 'raceVid';
    v.playsInline = true;
    v.preload = 'auto';
    v.style.display = 'none';
    v.src = `../assets/farmcat/race_${k}.mp4?v=3`;   // ?v=3: 진 영상 깨진 글자를 지우고 LAST 한 줄만 얹은 판
    wrap.insertBefore(v, wrap.firstChild);
    v.load();
    raceVideos[k] = v;
  }
}

function startRaceVideo(win, prize) {
  racing = true;
  const wrap = document.getElementById('raceWrap');
  preloadRaceVideos();                       // 아직 안 받았으면 지금이라도
  const vid = raceVideos[win ? 'win' : 'lose'];
  const loading = document.getElementById('raceLoading');
  if (!wrap || !vid) { racing = false; return; }
  // 이 틀(#raceWrap)은 무남이·엔딩 영상과 공유합니다. 그것들이 display:block으로 남아 있으면
  // 경마 영상과 겹쳐(세로로 나란히) 보입니다 — 이 영상 하나만 남기고 전부 숨깁니다.
  for (const el of wrap.querySelectorAll('.raceVid')) el.style.display = el === vid ? 'block' : 'none';
  document.body.classList.add('clipping');   // 영상 위로 버튼·배지가 비치지 않게 UI를 잠깐 치웁니다
  wrap.style.display = 'flex';
  // 아직 덜 받았으면 "준비 중"을 띄웠다가, 틀 수 있게 되면 그때 보여줍니다
  const ready = vid.readyState >= 3;
  if (loading) loading.style.display = ready ? 'none' : 'block';
  vid.style.visibility = ready ? 'visible' : 'hidden';
  vid.oncanplay = () => {
    if (loading) loading.style.display = 'none';
    vid.style.visibility = 'visible';
  };
  vid.currentTime = 0;
  const tryPlay = vid.play();
  if (tryPlay && tryPlay.catch) tryPlay.catch(() => { vid.muted = true; vid.play().catch(() => {}); });
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    wrap.style.display = 'none';
    if (loading) loading.style.display = 'none';
    vid.pause();
    vid.onended = null; vid.ontimeupdate = null; vid.oncanplay = null;
    document.body.classList.remove('clipping');   // 치워뒀던 UI를 다시 보여줍니다
    racing = false;
    // 돈·애정 정산은 출전 확정 때 이미 끝났습니다 — 여기서는 결과를 보여주기만 합니다
    const py = groundHeight(state.x, state.z) + 2;
    if (win) {
      playShipSound();
      spawnMoneyPopup(state.x, py, state.z, `1등! 상금 ${formatWon(prize)}을 받았어요`, 5);
    } else {
      spawnMoneyPopup(state.x, py, state.z, '꼴등… 오늘은 운이 없었네요', 5);
    }
    setTimeout(() => spawnMoneyPopup(state.x, py, state.z,
      `전력으로 달린 말이 지쳤어요\n애정이 ${RACE_LOVE} 줄었어요 (지금 ${ponyLove})`, 6), 1800);
  };
  vid.onended = finish;
  // 영상이 끝나는 순간 바로 게임으로 돌아갑니다.
  // onended만 믿으면 마지막 프레임에서 잠깐 멈춰 있는 것처럼 보일 때가 있어,
  // 끝나기 0.15초 전에 미리 걷어냅니다.
  vid.ontimeupdate = () => {
    if (vid.duration && vid.currentTime >= vid.duration - 0.15) finish();
  };
  wrap.onpointerdown = finish;
}

// ----- 이야기 도중에 잠깐 끼어드는 짧은 영상 -----
// 경마 영상과 같은 틀(#raceWrap)을 빌려 씁니다.
// 다만 바탕이 흰 영상이라 검은 테두리 대신 흰 바탕을 깔아야 이어붙인 티가 안 납니다.
const storyClips = {};
function playClip(name, cap, onDone) {
  const wrap = document.getElementById('raceWrap');
  const done = () => { if (onDone) onDone(); };
  if (!wrap || !CAN_USE_IMAGES) { done(); return; }
  let v = storyClips[name];
  if (!v) {
    v = document.createElement('video');
    v.className = 'raceVid';
    v.playsInline = true; v.preload = 'auto';
    v.src = `../assets/farmcat/${name}.mp4`;
    wrap.insertBefore(v, wrap.firstChild);
    storyClips[name] = v;
  }
  for (const el of wrap.querySelectorAll('.raceVid')) el.style.display = el === v ? 'block' : 'none';
  const loading = document.getElementById('raceLoading');
  const capEl = wrap.querySelector('.cap');
  const capWas = capEl ? capEl.textContent : '';
  if (capEl && cap) capEl.textContent = cap;
  if (loading) loading.style.display = 'none';
  wrap.classList.add('light');
  document.body.classList.add('clipping');   // 흰 화면 위에 배지·아이콘이 떠 있으면 어수선합니다
  wrap.style.display = 'flex';
  v.currentTime = 0;
  v.muted = false;   // 소리 켜기 (경마 영상처럼) — 스토리 영상도 원래 소리대로 나오게
  const bgmWasPlaying = (typeof bgm !== 'undefined') && !bgm.paused;
  if (bgmWasPlaying) bgm.pause();   // 영상 나오는 동안엔 BGM을 빼고 영상 원본 소리만 (사용자 지정)
  const p = v.play();
  if (p && p.catch) p.catch(() => { v.muted = true; v.play().catch(() => {}); });   // 자동재생이 막히면 음소거로 재시도
  let over = false;
  const finish = () => {
    if (over) return;
    over = true;
    v.pause();
    v.onended = null; v.ontimeupdate = null; v.oncanplay = null;
    wrap.onpointerdown = null;
    wrap.style.display = 'none';
    wrap.classList.remove('light');
    document.body.classList.remove('clipping');
    if (capEl) capEl.textContent = capWas;
    if (loading) loading.style.display = 'none';
    if (bgmWasPlaying) bgm.play().catch(() => {});   // 영상이 끝나면 BGM 되살림
    done();
  };
  v.onended = finish;
  v.ontimeupdate = () => { if (v.duration && v.currentTime >= v.duration - 0.12) finish(); };
  wrap.onpointerdown = finish;
  // 아직 다 못 받았으면 문구 없이 조용히 기다렸다가, 받아지는 순간 재생합니다.
  // (예전엔 1.5초 만에 접어버려서, 처음 보는 보상 영상이 느린 인터넷에서 통째로 건너뛰어졌습니다)
  if (v.readyState < 3) {
    v.oncanplay = () => {
      if (over) return;
      const q = v.play();
      if (q && q.catch) q.catch(() => {});
    };
  }
  // 그래도 못 트는 상황(파일이 없거나 브라우저가 막을 때)에는 이야기가 멈추지 않게 안전줄을 겁니다
  setTimeout(() => { if (!over && v.paused) finish(); }, 12000);
}

// (무남이 이벤트 영상은 이제 각 단계 대본(MUNAM_SEQ) 안에 clip으로 박혀 있어, playMunamSeq가 순서대로 틀어줍니다.)

// (예전 주석: 당근을 이만큼 먹이면 경마장에 나갈 수 있습니다)
// 먹이는 순간 조랑말 입가에 나타나 냠냠 줄어드는 당근 (직접 그리신 그림)
let carrotFx = null, carrotFxT = -1;
const CARROT_FX_TIME = 1.0;
if (CAN_USE_IMAGES) {
  carrotFx = new THREE.Mesh(
    new THREE.PlaneGeometry(0.85, 0.68),
    new THREE.MeshBasicMaterial({ map: loadTexture('../assets/farmcat/carrot.webp'),
      transparent: true, alphaTest: 0.3, side: THREE.DoubleSide })
  );
  carrotFx.visible = false;
  scene.add(carrotFx);
}
function updateCarrotFx(dt) {
  if (carrotFxT < 0 || !carrotFx) return;
  carrotFxT += dt;
  const k = carrotFxT / CARROT_FX_TIME;
  if (k >= 1) {
    carrotFx.visible = false; carrotFxT = -1;
    // 다 먹은 순간 입가에서 반짝! (짧고 맑은 소리와 함께)
    const gy2 = groundHeight(STABLE.x, STABLE.z);
    spawnMoneyPopup(STABLE.x + 1.55, gy2 + 2.2, STABLE.z, '✨');
    blip(880, 1320, 0.14, 0.14, 'sine');
    return;
  }
  // 조랑말 입 앞에서 조금씩 작아지며(먹히며) 살짝 위아래로 흔들립니다
  const gy = groundHeight(STABLE.x, STABLE.z);
  carrotFx.position.set(STABLE.x + 1.55, gy + 1.9 + Math.sin(carrotFxT * 18) * 0.05, STABLE.z);   // 조랑말 입가 (3D 머리 앞)
  carrotFx.rotation.y = Math.atan2(camera.position.x - STABLE.x, camera.position.z - STABLE.z);
  carrotFx.scale.setScalar(1 - k * 0.85);
}

// 조랑말 울음소리 (직접 준비하신 소리) — F로 말을 상대할 때 웁니다
const ponySfx = new Audio('../assets/farmcat/pony_sound.mp3');
ponySfx.volume = 0.75;
function playPonySfx() {
  try { ponySfx.currentTime = 0; ponySfx.play().catch(() => {}); } catch (e) {}
}

// 이장님 만물상 앞에서 F — 매어 둔 새 조랑말을 사서 마구간으로 데려옵니다
function tryBuyPony() {
  const y = groundHeight(PONY_SALE.x, PONY_SALE.z) + 2.4;
  playPonySfx();   // 말 곁에서 F — 히힝!
  if (coins < PONY_PRICE) {
    spawnMoneyPopup(PONY_SALE.x, y, PONY_SALE.z,
      `새 조랑말은 ${formatWon(PONY_PRICE)}\n${formatWon(PONY_PRICE - coins)} 모자라요`);
    return;
  }
  coins -= PONY_PRICE;
  ponyAlive = true;
  ponyLove = 0;            // 새 친구와는 처음부터 정을 쌓아야 합니다
  lastFedDay = dayCount;   // 데려온 날은 배불리 먹고 왔습니다
  fedToday = FEED_PER_DAY; // 배지("오늘 몫은 다 줬어요")와 실제 판정이 어긋나지 않게 같이 맞춥니다
  applyPonyAlive();
  updateCoinBadge();
  playShipSound();
  saveGame(true);
  startTalk('이장님', [
    '잘 골랐네. 순한 놈일세.',
    '마구간에 매어 두게. 하루에 당근 하나면 되네.',
    '…이번엔 하루도 거르지 말게나.',
  ]);
}

function tryFeedPony() {
  const y = groundHeight(STABLE.x, STABLE.z) + STABLE_H * BUILD_SCALE * 0.75;
  if (!ponyAlive) {
    // 마구간이 비었습니다 — 새 말은 이장님 만물상 앞에서 삽니다
    spawnMoneyPopup(STABLE.x, y, STABLE.z,
      '마구간이 비었어요\n이장님 만물상 앞에 새 말이 와 있어요', 6);
    return;
  }
  // 멀리서 던져 주는 게 아니라, 조랑말 앞까지 가서 손으로 먹입니다
  const d = Math.hypot(state.x - STABLE.x, state.z - STABLE.z);
  if (d > FEED_RANGE) {
    spawnMoneyPopup(state.x, groundHeight(state.x, state.z) + 1.6, state.z, '조랑말 앞까지 더 가까이 가세요');
    return;
  }
  playPonySfx();   // 말 곁에서 F — 히힝!
  if (carrots <= 0) {
    spawnMoneyPopup(STABLE.x, y, STABLE.z, `당근이 없어요\n이장님 상점에서 ${formatWon(CARROT_PRICE)}`);
    return;
  }
  // 하루에 한 개까지 — 한꺼번에 먹인다고 정이 빨리 들지는 않습니다
  if (fedToday >= FEED_PER_DAY) {
    spawnMoneyPopup(STABLE.x, y, STABLE.z,
      '오늘 몫은 다 줬어요\n내일 또 주세요');
    return;
  }
  carrots--;
  ponyLove++;
  fedToday++;
  lastFedDay = dayCount;   // 오늘 끼니를 챙겼습니다 — 말이 웃는 얼굴로 돌아옵니다
  updateCarrotBadge();
  playDropSound();
  state.facing = Math.atan2(STABLE.x - state.x, STABLE.z - state.z);   // 조랑말을 바라보고 먹입니다
  state.idleTime = 0; state.sit = 0;
  if (carrotFx) { carrotFx.visible = true; carrotFxT = 0; }   // 당근 그림이 냠냠 사라집니다
  if (ponyLove === RACE_LOVE) {
    spawnMoneyPopup(STABLE.x, y, STABLE.z,
      `애정 ${ponyLove}! 이제 경마에 나갈 수 있어요\n옆 팻말에서 출전!`);
  } else if (ponyLove > RACE_LOVE) {
    spawnMoneyPopup(STABLE.x, y, STABLE.z,
      `냠냠! 애정 ${ponyLove}\n오늘 몫은 다 줬어요`);
  } else {
    spawnMoneyPopup(STABLE.x, y, STABLE.z,
      `냠냠! 애정 ${ponyLove}/${RACE_LOVE}\n내일 또 주세요`);
  }
  state.idleTime = 0;
}

// F키 하나로 "그 자리에서 할 수 있는 일"을 전부 합니다 — 상호작용 키는 이것 하나뿐입니다.
// 물속: 채집 (수면에 떠 있으면 뭍으로 나가기)
// 뭍:   귤 따기 → 씨앗 사기 → 택배 부치기 → 집 사기·고치기 → 말 먹이기 → 물질 들어가기
//       → 아무것도 없으면 상자 잡기/놓기
function handleActionKey() {
  // 경마·이야기 영상이 떠 있으면 F는 아무 일도 하지 않습니다.
  // (안 막으면 영상 뒤에서 대화·상호작용이 몰래 진행되어 스토리를 못 보고 지나갑니다)
  const raceWrapEl = document.getElementById('raceWrap');
  if (raceWrapEl && raceWrapEl.style.display === 'flex') return;
  // 구입 창이 떠 있으면 F는 아무 일도 하지 않습니다.
  // 구입은 마우스로 가격 단추를 눌러야만 되고, 나가기는 ESC·✕·바깥 누르기입니다.
  // (키 한 번에 큰돈이 나가는 일이 없도록 일부러 막아둡니다)
  if (pickWrap && pickWrap.style.display === 'flex') return;
  // 그 밖의 창(자산·지도)이 떠 있으면 F는 "창 닫기"입니다
  if (closeOpenPopup()) return;
  // 대화 중이면 F는 "다음 줄"입니다
  if (talkOpen()) { advanceTalk(); return; }
  if (state.harvestT >= 0 || state.fixT >= 0) return;
  if (state.diving) {
    if (drowning > 0) return;
    // 수면에 떠 있으면 F로 뭍에 나갑니다 (물속에서는 채집)
    if (lulu.position.y > SEA_Y - 1.2) { leaveDive('exit'); return; }
    tryCollect();
    return;
  }
  // 상점 안: 물건(또는 왼쪽 인테리어 견본) 앞이면 그것을 삽니다
  if (state.inShop) {
    const rg = nearestReno();
    if (rg) { buyReno(rg); return; }
    const good = nearestShopGood();
    if (good) buyShopGood(good);
    return;
  }
  // 집 안: 내려놓은 망사리를 줍거나, 멘 망사리를 내려놓습니다
  if (state.inside) {
    if (hasNet && !netCarried &&
        Math.hypot(state.x - netObj.position.x, state.z - netObj.position.z) < NET_PICK_RANGE) {
      pickUpNet();
    } else if (netCarried) {
      dropNet();
    }
    return;
  }
  if (nearestFruit() >= 0) {
    // 딴 귤은 상자에 담아야 하니, 상자가 곁에 있어야 딸 수 있습니다.
    // 상자를 놓고 딴 데 갔다가 다른 상자 옆에 왔을 수 있으니, 곁에 더 가까운 상자가 있으면 그 상자로 갈아탑니다.
    // (안 그러면 멀리 둔 옛 상자만 보고 "끌고 와야"라며 막혀서, 바로 옆 상자를 못 씁니다 — 실제 발생한 버그)
    const near = nearestOtherCrate(6);
    if (near && Math.hypot(state.x - near.x, state.z - near.z)
              < Math.hypot(basketPos.x - state.x, basketPos.z - state.z)) switchCrate(near);
    if (Math.hypot(basketPos.x - state.x, basketPos.z - state.z) > 6) {
      spawnMoneyPopup(state.x, lulu.position.y + 1.8, state.z, '귤 상자를 옆에 끌고 와야 담을 수 있어요');
      return;
    }
    tryHarvest();
    return;
  }
  // 밭 팻말 앞이면 임대·심기·수확
  if (tryFarmSign()) return;
  // 상점 앞에 매어 둔 새 조랑말 — 마구간이 비었을 때만 서 있습니다
  if (!ponyAlive &&
      Math.hypot(state.x - PONY_SALE.x, state.z - PONY_SALE.z) < PONY_SALE_RANGE) {
    tryBuyPony();
    return;
  }
  // 컨테이너 창고 — 사면 귤 상자를 두 배 값에 부칩니다
  if (Math.hypot(state.x - CONTAINER.x, state.z - CONTAINER.z) < CONTAINER_RANGE) {
    tryBuyContainer();
    return;
  }
  // 상점 문 앞 — 이장님이 열어주면 들어갑니다 (문 앞에서는 입장이 대화보다 우선)
  if (Math.hypot(state.x - SHOP_DOOR.x, state.z - SHOP_DOOR.z) < SHOP_DOOR_RANGE) {
    tryEnterShop();
    return;
  }
  // 이장님·돌하르방과 이야기하기
  if (mayorGroup && Math.hypot(state.x - mayor.x, state.z - mayor.z) < MAYOR_TALK_RANGE) {
    startTalk('이장님', mayorTalkLines());
    return;
  }
  if (Math.hypot(state.x - TUTOR_SPOT.x, state.z - TUTOR_SPOT.z) < TUTOR_RANGE) {
    tutorTalk();
    return;
  }
  if (Math.hypot(state.x - HALMANG_SPOT.x, state.z - HALMANG_SPOT.z) < HALMANG_RANGE) {
    halmangTalk();
    return;
  }
  if (!state.inside && !state.inShop && !munamAway() &&
      Math.hypot(state.x - munam.x, state.z - munam.z) < MUNAM_RANGE) {
    munamTalk();
    return;
  }
  const depotDist = Math.hypot(state.x - depot.group.position.x, state.z - depot.group.position.z);
  if (depotDist < DEPOT_RANGE) {
    // 부칠 것이 없는데 상자가 손닿는 거리면, 택배 안내 대신 상자를 잡습니다.
    // (안 그러면 택배사 반경 안에 놓인 빈 상자를 영영 못 잡습니다 — 실제 발생한 버그)
    const canShip = hasContainer ? cratesReadyToShip().length > 0 : basketCount >= BASKET_CAP;
    const crateNear = Math.hypot(basketPos.x - state.x, basketPos.z - state.z) <= GRAB_RANGE
                   || nearestOtherCrate(GRAB_RANGE);
    if (!canShip && crateNear && !hasRope) { tryToggleGrab(); return; }
    tryShipBox();
    return;
  }
  // 내려놓은 망사리 줍기 — 작은 물건이라 집수리 같은 넓은 범위보다 먼저 확인합니다
  if (hasNet && !netCarried &&
      Math.hypot(state.x - netObj.position.x, state.z - netObj.position.z) < NET_PICK_RANGE) {
    pickUpNet();
    return;
  }
  const houseDist = Math.hypot(state.x - HOUSE.x, state.z - HOUSE.z);
  if (houseDist < HOUSE_RANGE + 3) { tryFixHouse(); return; }
  const raceDist = Math.hypot(state.x - RACE_SPOT.x, state.z - RACE_SPOT.z);
  if (raceDist < RACE_RANGE) { tryRace(); return; }
  const stableDist = Math.hypot(state.x - STABLE.x, state.z - STABLE.z);
  if (stableDist < STABLE_RANGE) { tryFeedPony(); return; }
  // 물질은 포구 축대 끝에서만 들어갈 수 있습니다
  const entryDist = Math.hypot(state.x - DIVE_ENTRY.x, state.z - DIVE_ENTRY.z);
  if (entryDist < DIVE_ENTRY_RANGE) {
    // 태풍이 오는 날은 바다가 위험해 물질을 쉽니다
    if (dayEvent === 'storm') {
      spawnMoneyPopup(DIVE_ENTRY.x, groundHeight(DIVE_ENTRY.x, DIVE_ENTRY.z) + 2.2, DIVE_ENTRY.z,
        '태풍이 몰아쳐요\n오늘은 물질을 쉽니다');
      return;
    }
    // 망사리를 메고 있어야만 바다에 들어갈 수 있습니다
    if (!netCarried) {
      const py = groundHeight(DIVE_ENTRY.x, DIVE_ENTRY.z) + 2.2;
      spawnMoneyPopup(DIVE_ENTRY.x, py, DIVE_ENTRY.z,
        hasNet ? '망사리를 두고 왔어요\n메고 와야 물질할 수 있어요'
               : `망사리가 있어야 물질할 수 있어요\n상점 안에서 ${formatWon(NET_PRICE)}`);
      return;
    }
    enterDive();
    return;
  }
  // 망사리를 멘 채 빈 데서 누르면 내려놓습니다 (상자 근처면 상자 잡기가 먼저)
  if (netCarried && !state.grabbing &&
      Math.hypot(basketPos.x - state.x, basketPos.z - state.z) >= GRAB_RANGE) {
    dropNet();
    return;
  }
  // 마지막으로: 상자 근처면 잡기/놓기 (잡은 채로 다른 일을 하면 그쪽이 먼저입니다)
  tryToggleGrab();
}

// (예전의 E키 전용 함수는 상호작용 통일로 handleActionKey에 합쳐졌습니다)
addEventListener('keydown', (e) => { if (isKey(e, 'KeyF')) handleActionKey(); });

// 시작 화면의 그림 — 넉 장의 일거리 카드와 무남이.
// 그림이 다 받아진 뒤에 시작 화면을 통째로 띄웁니다.
// (예전에는 글자와 단추가 먼저 뜨고 그림이 하나씩 뒤늦게 튀어나와, 화면이 덜컹거렸습니다)
{
  const startEl = document.getElementById('start');
  const imgs = [...document.querySelectorAll('#start img[data-src]')];
  let waiting = imgs.length;
  let shown = false;
  // 오름게임즈 로고는 최소 이만큼은 보여줍니다 — 안 그러면 빠른 기기에서 깜빡이고 지나갑니다
  const SPLASH_MIN = 900;
  const splashBorn = performance.now();
  const dropSplash = () => {
    const el = document.getElementById('splash');
    if (!el) return;
    const wait = Math.max(0, SPLASH_MIN - (performance.now() - splashBorn));
    setTimeout(() => {
      el.classList.add('gone');
      setTimeout(() => el.remove(), 500);
    }, wait);
  };

  const showStart = () => {
    if (shown) return;
    shown = true;
    if (startEl) startEl.classList.add('ready');
    dropSplash();
  };
  const oneDone = () => { if (--waiting <= 0) showStart(); };
  for (const img of imgs) {
    img.onload = () => { img.classList.add('on'); oneDone(); };
    img.onerror = () => { img.remove(); oneDone(); };   // 파일이 없으면 이모지가 자리를 지킵니다
    img.src = img.getAttribute('data-src');
  }
  if (!imgs.length) showStart();
  // 그림이 늦거나 안 와도 게임은 시작할 수 있어야 합니다
  setTimeout(showStart, 2500);
}

// 시작 화면: 누르면 사라지면서 소리와 배경음악이 깨어납니다.
// (브라우저가 "사용자가 한 번 누르기 전엔 소리 금지"로 막아두기 때문에 이 한 번이 필요합니다)
{
  const startEl = document.getElementById('start');
  if (startEl) {
    const begin = () => {
      startEl.classList.add('gone');
      document.body.classList.remove('starting');   // 이제부터 게임 중 UI(제목·돈·날짜)를 보여줍니다
      setTimeout(() => startEl.remove(), 500);   // 사라지고 나면 화면에서 완전히 치웁니다
      wakeAudio();
      startBgm();
      const tutorHint = () => {
        if (!tutorialSeen) {
          setTimeout(() => spawnMoneyPopup(TUTOR_SPOT.x, groundHeight(TUTOR_SPOT.x, TUTOR_SPOT.z) + 3.4, TUTOR_SPOT.z,
            '돌하르방 앞으로 가면 할 일을 알려줄 거예요\n가까이 가보세요', 8), 900);
        }
      };
      // 처음 온 사람에게는 루루의 사연부터, 그다음 돌하르방이 손짓합니다
      if (!introSeen) {
        setTimeout(() => startTalk('루루의 이야기', INTRO_LINES, () => {
          introSeen = true;
          saveGame(true);
          tutorHint();
        }), 600);
      } else {
        tutorHint();
      }
    };
    startEl.addEventListener('pointerdown', begin, { once: true });
    addEventListener('keydown', begin, { once: true });
    // 홈페이지 링크만은 "아무 데나 누르면 시작" 신호를 막습니다 — 게임을 시작하지 않고 새 탭만 엽니다
    const homeLink = document.getElementById('homeLink');
    if (homeLink) homeLink.addEventListener('pointerdown', (e) => e.stopPropagation());
  }
}

// 전체화면 — 폰 브라우저의 주소창·아래 막대까지 걷어내고 화면을 꽉 채웁니다.
// 시작 화면의 보조 단추와 왼쪽 아래 ⛶ 배지, 두 곳에서 켜고 끕니다.
{
  const root = document.documentElement;
  const canFull = !!(root.requestFullscreen || root.webkitRequestFullscreen);
  const isFull = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const toggleFull = () => {
    if (isFull()) {
      (document.exitFullscreen || document.webkitExitFullscreen || (() => {})).call(document);
    } else {
      (root.requestFullscreen || root.webkitRequestFullscreen || (() => {})).call(root);
    }
  };

  const startFull = document.getElementById('startFull');
  const fullBadge = document.getElementById('fullBadge');

  // 아이폰 사파리처럼 전체화면을 아예 막아둔 브라우저에서는 단추를 숨깁니다
  if (!canFull) {
    if (startFull) startFull.classList.add('hidden');
    if (fullBadge) fullBadge.style.display = 'none';
  } else {
    if (startFull) {
      // 시작 화면은 아무 데나 누르면 게임이 시작되므로, 이 단추만은 그 신호를 막습니다
      startFull.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleFull();
      });
    }
    if (fullBadge) fullBadge.addEventListener('click', toggleFull);

    // 상태가 바뀌면 글씨도 따라 바꿉니다 (되돌리기 버튼으로도 빠져나올 수 있습니다)
    const sync = () => {
      const on = isFull();
      if (startFull) startFull.textContent = on ? '⛶ 전체화면 끄기' : '⛶ 전체화면으로 보기';
      if (fullBadge) fullBadge.title = (window.T || ((s) => s))(on ? '전체화면 끄기' : '전체화면');
    };
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
  }
}

// 폰용 화면 버튼을 각 기능에 연결합니다 (키보드 F·E·Shift·Space와 똑같은 일을 합니다)
bindTouchButton('btnAction', (down) => { if (down) { wakeAudio(); startBgm(); handleActionKey(); } });
bindTouchButton('btnJump',   (down) => { touchJump = down; });
// 달리기는 꾹 누르고 있는 대신, 한 번 누르면 켜지고 다시 누르면 꺼지는 토글입니다.
// (왼손은 조이스틱을 잡고 있어서 버튼까지 계속 누르고 있기 어렵기 때문)
{
  const runBtn = document.getElementById('btnRun');
  if (runBtn) runBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    touchRun = !touchRun;
    runBtn.classList.toggle('on', touchRun);
  });
}

// 점프 높이는 JUMP²/(2×GRAVITY). 7.4이면 1.24미터라 돌담(1.3미터쯤)을 아슬아슬하게 못 넘었습니다.
// 고양이답게 8.9로 올리면 1.8미터까지 떠서 담을 여유 있게 뛰어넘습니다.
const WALK = 4.2, RUN = 8.0, GRAVITY = 22, JUMP = 8.9;
// 물속 움직임 — 「인사이드」의 물속 구간을 참고했습니다.
// 몸에 부력이 있어서 가만히 있으면 가라앉지 않고 살며시 떠오르고,
// 방향키는 화면에 보이는 그대로: ↑ 떠오르기 · ↓ 잠수 · ← → 좌우 헤엄.
const SWIM_ACCEL = 8.0;     // 물을 밀어내며 붙는 속도 (천천히 붙습니다)
const SWIM_DRAG = 2.4;      // 손을 놨을 때 물이 잡아주는 정도
const SWIM_MAX = 2.6;       // 물속 최고 속도 — 뭍 걷기(4.2)보다 한참 느립니다
const SWIM_UP = 7.0;        // 위아래로 헤엄치는 힘 (↑↓ 방향키 · ⤴ 버튼)
const SWIM_DOWN = 7.0;      // (지금은 위와 같은 힘 — 따로 조절하고 싶을 때를 위해 남겨둠)
const BUOYANCY = 0.9;       // 부력 — 아무것도 안 누르면 이 힘으로 살며시 떠오릅니다
const swimVel = { x: 0, z: 0 };   // 물속에서만 쓰는 좌우 관성
const moveDir = new THREE.Vector3();

function updateLulu(dt) {
  // 감귤 따는 중엔 움직임을 멈추고 애니메이션 시간만 흘려보냅니다
  if (state.harvestT >= 0) {
    state.harvestT += dt;
    if (state.harvestT >= HARVEST_DURATION) state.harvestT = -1;
  }

  // 카메라가 보는 방향 기준으로 앞/오른쪽 계산
  const fwdX = -Math.sin(camYaw), fwdZ = -Math.cos(camYaw);
  const rgtX = Math.cos(camYaw), rgtZ = -Math.sin(camYaw);

  // 이동은 방향키만 씁니다. W A S D는 시야 회전(updateCamera)이 가져갔습니다.
  // 폰에서는 화면 왼쪽 조이스틱(touchMove)이 같은 자리에 값을 보탭니다.
  let f = 0, r = 0;
  if (state.harvestT < 0 && state.fixT < 0) {   // 귤 따기·집 고치기 중엔 못 움직입니다
    if (keys['ArrowUp']) f += 1;
    if (keys['ArrowDown']) f -= 1;
    if (keys['ArrowRight']) r += 1;
    if (keys['ArrowLeft']) r -= 1;
    f += touchMove.f;
    r += touchMove.r;
  }

  // 조이스틱을 살짝만 기울이면 천천히, 끝까지 밀면 최고 속도로 걷게 합니다.
  // (키보드는 항상 1이므로 이 값이 늘 1이 되어 예전과 똑같이 움직입니다)
  const tilt = Math.min(1, Math.hypot(f, r));
  moveDir.set(fwdX * f + rgtX * r, 0, fwdZ * f + rgtZ * r);
  const moving = moveDir.lengthSq() > 0.0001;
  const running = keys['ShiftLeft'] || keys['ShiftRight'] || touchRun;
  const spd = (running ? RUN : WALK) * tilt;

  if (state.diving) {
    // 물속 조작(최종): 화면에 보이는 그대로 움직입니다.
    // ↑ 부상(위로) · ↓ 잠수(아래로) · ← → 좌우로 헤엄 · ⤴(점프 버튼)도 부상.
    // 아무것도 안 누르면 부력으로 천천히 떠오릅니다.
    moveDir.set(rgtX * r, f, rgtZ * r);
    const swimTilt = Math.min(1, Math.hypot(f, r));
    if (moveDir.lengthSq() > 0.0001) {
      moveDir.normalize();
      swimVel.x += moveDir.x * SWIM_ACCEL * swimTilt * dt;
      swimVel.z += moveDir.z * SWIM_ACCEL * swimTilt * dt;
      state.vy += moveDir.y * SWIM_UP * swimTilt * dt;   // ↑는 위로, ↓는 아래로 바로 밉니다
      state.idleTime = 0;
    } else {
      state.idleTime += dt;
    }
    const drag = Math.max(0, 1 - SWIM_DRAG * dt);
    swimVel.x *= drag;
    swimVel.z *= drag;
    const sp = Math.hypot(swimVel.x, swimVel.z);
    if (sp > SWIM_MAX) { swimVel.x *= SWIM_MAX / sp; swimVel.z *= SWIM_MAX / sp; }
    // 숨이 차면 팔다리에 힘이 빠져 느려집니다
    const weak = breathLow ? 0.55 : 1;
    state.x += swimVel.x * weak * dt;
    state.z += swimVel.z * weak * dt;
  } else if (moving) {
    moveDir.normalize();
    state.x += moveDir.x * spd * dt;
    state.z += moveDir.z * spd * dt;
    state.idleTime = 0;
  } else {
    state.idleTime += dt;
  }

  // 상자를 끌고 있는 동안은 이동 방향과 무관하게 항상 상자 쪽을 바라보게 합니다.
  // (왼쪽으로 가든 오른쪽으로 가든, 상자를 붙잡은 자세 그대로 옆걸음으로 끌고 가는 것처럼 보입니다)
  const isDraggingBox = !state.diving && (hasRope || state.grabbing);
  if (isDraggingBox) {
    state.facing = Math.atan2(basketPos.x - state.x, basketPos.z - state.z);
  } else if (state.diving) {
    // 물속에서는 실제로 흘러가는 방향을 봅니다 (관성이 있어 키를 놔도 그쪽을 계속 봄)
    if (Math.hypot(swimVel.x, swimVel.z) > 0.25) state.facing = Math.atan2(swimVel.x, swimVel.z);
  } else if (moving) {
    state.facing = Math.atan2(moveDir.x, moveDir.z);
  }

  // 돌담·돌하르방·나무에 부딪히면 밀려나기 (물속에는 이런 것들이 없습니다).
  // 단, 발이 장애물 꼭대기보다 위에 있으면 그냥 지나갑니다 — 그래야 돌담을 뛰어넘을 수 있습니다.
  if (!state.diving) {
    const footY = lulu.position.y;
    for (const o of obstacles) {
      if (footY > o.topY) continue;                 // 담 위로 훌쩍 넘는 중
      const dx = state.x - o.x, dz = state.z - o.z;
      const d = Math.hypot(dx, dz);
      const min = o.r + 0.35;
      if (d < min && d > 0.0001) {
        state.x = o.x + (dx / d) * min;
        state.z = o.z + (dz / d) * min;
      }
    }
  }

  // 돌아다닐 수 있는 범위 — 뭍에서는 섬 안, 물속에서는 물질장 안
  if (state.diving) {
    const dx = state.x - DIVE.x, dz = state.z - DIVE.z;
    const dr = Math.hypot(dx, dz);
    if (dr > DIVE.r) {
      state.x = DIVE.x + (dx / dr) * DIVE.r;
      state.z = DIVE.z + (dz / dr) * DIVE.r;
    }
  } else if (state.inside || state.inShop) {
    // 실내에서는 벽 안쪽까지만 다닐 수 있습니다
    const R = state.inside ? ROOM : SHOP_ROOM;
    state.x = Math.min(R.cx + R.w / 2 - 0.6, Math.max(R.cx - R.w / 2 + 0.6, state.x));
    state.z = Math.min(R.cz + R.d / 2 - 0.4, Math.max(R.cz - R.d / 2 + 0.6, state.z));
  } else if (state.z > 94 && state.z < PORT.z + 10.3 && Math.abs(state.x - PORT.x) < 2.4) {
    // 포구 축대 위 — 섬 경계(원) 밖이지만 축대 폭 안에서는 끝까지 걸어나갈 수 있습니다
    // (양옆 현무암 장식과 겹치지 않게 폭을 살짝 좁힙니다)
    state.x = Math.min(PORT.x + 1.85, Math.max(PORT.x - 1.85, state.x));
    state.z = Math.min(PORT.z + 10.1, state.z);
  } else {
    const rr = Math.hypot(state.x, state.z);
    if (rr > WALK_R) {
      state.x *= WALK_R / rr;
      state.z *= WALK_R / rr;
    }
  }

  // 점프와 중력 — 물속에서는 몸이 뜨므로 훨씬 느리게 가라앉고, 스페이스로 계속 떠오릅니다
  const gy = state.diving ? seabedHeight(state.x, state.z) : groundHeight(state.x, state.z);
  const wantUp = keys['Space'] || touchJump;
  if (state.diving) {
    if (wantUp) state.vy += SWIM_UP * dt;                    // ⤴ — 위로 헤엄치기
    else if (Math.abs(f) <= 0.1) state.vy += BUOYANCY * dt;  // 부력 — 가만히 있으면 살며시 떠오릅니다
    state.vy *= Math.max(0, 1 - 2.6 * dt);          // 물의 저항 — 움직임이 부드럽게 잦아듭니다
    state.vy = Math.max(-2.4, Math.min(2.4, state.vy));
  } else {
    if (wantUp && state.onGround && state.harvestT < 0) {
      state.vy = JUMP;
      state.onGround = false;
      state.idleTime = 0;
    }
    state.vy -= GRAVITY * dt;
  }
  let y = lulu.position.y + state.vy * dt;
  if (y <= gy) { y = gy; state.vy = 0; state.onGround = true; }
  // 물속에서는 수면 위로 머리를 내밀 수 있지만 하늘로 날아오르지는 못합니다
  if (state.diving && y > SEA_Y + 0.4) { y = SEA_Y + 0.4; state.vy = 0; }

  lulu.position.set(state.x, y, state.z);

  // 몸 방향을 부드럽게 돌리기 (-π ~ π 경계 처리 포함)
  let diff = state.facing - lulu.rotation.y;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  lulu.rotation.y += diff * Math.min(1, dt * 12);

  // ----- 애니메이션 -----
  const target = moving ? (running ? 1 : 0.62) * tilt : 0;   // 살살 걸으면 다리도 살살 움직입니다
  state.speed += (target - state.speed) * Math.min(1, dt * 9);
  state.walkPhase += dt * (6 + state.speed * 9);

  // 오래 가만히 있으면 앉기
  // (예전에는 5초 넘게 가만히 있으면 앉았다가 낮잠을 잤는데, 그 연출은 뺐습니다)
  const wantSit = 0;
  state.sit += (wantSit - state.sit) * Math.min(1, dt * 3.5);

  const s = state.sit;
  luluBody.position.y = -0.18 * s;
  luluBody.rotation.x = 0.22 * s;

  // 네 발 걷기 (대각선 발이 짝을 이룹니다)
  const offs = [0, Math.PI, Math.PI, 0];
  legs.forEach((leg, i) => {
    const swing = Math.sin(state.walkPhase + offs[i]) * 0.75 * state.speed;
    const sitPose = i < 2 ? 0.1 : -0.85;   // 앉으면 뒷다리를 접습니다
    leg.rotation.x = swing * (1 - s) + sitPose * s;
  });

  // 걸을 때 몸통이 살짝 통통 튀고, 멈추면 숨쉬듯 부풀기
  const bob = Math.abs(Math.sin(state.walkPhase)) * 0.06 * state.speed;
  luluBody.position.y += bob;
  const breath = 1 + Math.sin(performance.now() * 0.002) * 0.012 * (1 - state.speed);
  torso.scale.set(breath, 1, breath);

  // 꼬리: 걸을 땐 좌우로, 멈추면 천천히 말립니다
  const t = performance.now() * 0.001;
  tailSegs.forEach((seg, i) => {
    seg.rotation.y = Math.sin(t * (2.2 + state.speed * 2) - i * 0.55) * (0.1 + state.speed * 0.14);
    seg.rotation.x = 0.3 + Math.sin(t * 1.3 - i * 0.4) * 0.07 + s * 0.1;
  });

  // 머리: 걸을 때 위아래로 까딱, 앉으면 살짝 듭니다
  head.rotation.x = Math.sin(state.walkPhase * 2) * 0.05 * state.speed - 0.16 * s;

  if (spriteCard) updateSpriteLulu(gy);
}

// 그림 루루: 위치 맞추기 → 카메라 쪽으로 돌리기 → 진행 방향에 맞춰 좌우 뒤집기 → 걸음 표현
const camRight = new THREE.Vector3();
const camFwd = new THREE.Vector3();

function updateSpriteLulu(groundY) {
  // 루루는 뭍에서도 물속에서도 그림(종이 인형)으로 그립니다.
  spriteLulu.visible = true;
  if (spriteBlob) spriteBlob.visible = true;   // 발밑의 동그란 그림자

  spriteLulu.position.copy(lulu.position);

  // 판이 항상 카메라를 정면으로 보게 (좌우로만 돌리고 세로로는 세워둡니다)
  spriteLulu.rotation.y = Math.atan2(
    camera.position.x - spriteLulu.position.x,
    camera.position.z - spriteLulu.position.z
  );

  // 루루가 화면상 왼쪽으로 가는지 오른쪽으로 가는지 기억해둡니다
  camera.getWorldDirection(camFwd);
  camRight.set(-camFwd.z, 0, camFwd.x);   // 카메라 기준 오른쪽 방향
  const faceX = Math.sin(lulu.rotation.y), faceZ = Math.cos(lulu.rotation.y);
  const toRight = faceX * camRight.x + faceZ * camRight.z;
  if (Math.abs(toRight) > 0.12) spriteCard.userData.headingRight = toRight > 0;

  // ----- 어느 그림을 쓸지 고르기 -----
  // 규칙: 보고 있는 방향이 우선입니다.
  // 왼쪽으로 가다 멈추면 옆모습 그대로, 등을 보이며 가다 멈추면 뒷모습 그대로 서 있습니다.
  // (예전엔 멈추기만 하면 정면 그림으로 바뀌어서, 뒤돌아 있다가 갑자기 얼굴이 보였습니다)
  const walking = state.speed > 0.08;
  const away = faceX * camFwd.x + faceZ * camFwd.z;   // 카메라가 보는 쪽으로 갈수록 1 (= 멀어짐)
  const view = away > 0.5 ? 'back' : (away < -0.5 ? 'front' : 'side');
  let sheet, cell;
  const t = performance.now() * 0.001;

  if (state.diving && SHEETS.diveSwim) {
    // 물속에서는 해녀 차림 그림만 씁니다.
    const sp = Math.hypot(swimVel.x, swimVel.z);
    if (state.pickT >= 0) {
      // 전복을 따는 중 — 손을 뻗어 떼어내는 동작이 한 방향으로 재생됩니다
      sheet = SHEETS.divePick;
      cell = Math.min(sheet.frames - 1, Math.floor((state.pickT / PICK_DURATION) * sheet.frames));
    } else if (lulu.position.y > SEA_Y - 1.2 && SHEETS.diveFloat && sp <= 0.4) {
      // 수면에 떠서 숨 고르는 중.
      // (좌우로 헤엄칠 땐 이 정면 그림 대신 아래의 옆헤엄 그림을 씁니다 —
      //  예전엔 수면에서 무조건 이 그림이라, 옆으로 가도 그림이 안 변해 "키가 안 먹는" 것처럼 보였습니다)
      sheet = SHEETS.diveFloat;
      cell = Math.floor(t * 6) % sheet.frames;
    } else if (state.vy > 0.5 || surfacing > 0) {
      // 위로 헤엄쳐 떠오르는 중 (↑)
      sheet = SHEETS.diveUp;
      cell = Math.floor(t * 8) % sheet.frames;
    } else if (state.vy < -0.4) {
      // 아래로 잠수하는 중 (💨·Shift) — 전용 잠수 그림이 있으면 그걸, 없으면 활공 그림을 기울여 씁니다
      sheet = SHEETS.diveDown || SHEETS.diveSwim;
      cell = Math.floor(t * 8) % sheet.frames;
    } else if (sp > 0.4) {
      // 헤엄치기 — 빨리 갈수록 팔다리가 빨리 움직입니다
      sheet = SHEETS.diveSwim;
      cell = Math.floor(t * (4 + sp * 2.4)) % sheet.frames;
    } else if (SHEETS.diveIdle) {
      // 가만히 물에 떠 있기
      sheet = SHEETS.diveIdle;
      cell = Math.floor(t * 6) % sheet.frames;
    } else {
      sheet = SHEETS.diveSwim;
      cell = 0;
    }
  } else if (SHEETS.wetsuitLand && inWetsuitZone()) {
    // 해녀 차림 — 포구 구역이거나 망사리를 들고 다닐 때.
    // 걸으면 태왁과 망사리를 든 채 걷고, 멈추면 서 있는 자세로 돌아갑니다.
    // (서 있는 그림의 2번 컷은 고개가 어깨 너머를 보는 자세라 안 씁니다)
    if (SHEETS.wetsuitSide) {
      sheet = view === 'back' ? SHEETS.wetsuitBack
            : view === 'front' ? SHEETS.wetsuitFront : SHEETS.wetsuitSide;
      // 멈춰 서면 걷기 그림 중 두 발이 모인 칸에 세웁니다.
      // (예전에는 해녀 시트의 「어깨 너머로 돌아보는」 자세를 썼는데, 목이 돌아가 보였습니다)
      cell = walking ? Math.floor(state.walkPhase) % sheet.frames : sheet.stand;
    } else {
      sheet = SHEETS.wetsuitLand;   // 걷기 그림을 못 불러왔을 때의 예비
      cell = view === 'back' ? 0 : view === 'front' ? 4 : 1;
    }
  } else if (SHEETS.diveIdle && inWetsuitZone()) {
    // (시트가 없을 때의 예비 — 물속 대기 자세)
    sheet = SHEETS.diveIdle;
    cell = Math.floor(t * 6) % sheet.frames;
  } else if (state.fixT >= 0 && SHEETS.fixHouse) {
    // 페인트칠 중 — 붓을 든 그림(시트의 3번째 칸)만 씁니다 (망치·톱 수리는 뺐습니다)
    sheet = SHEETS.fixHouse;
    cell = 2;
  } else if (state.harvestT >= 0) {
    // 감귤 따는 중. 뻗기→내리기→기뻐하기가 한 방향으로 재생되고, 끝나면 마지막(기뻐하는) 칸에 멈춥니다
    sheet = SHEETS.harvest;
    cell = Math.min(sheet.frames - 1, Math.floor((state.harvestT / HARVEST_DURATION) * sheet.frames));
  } else if (!state.onGround) {
    // 점프가 먼저입니다. 방향키를 누른 채 뛰어도 걷는 그림이 아니라 뛰는 자세가 나오게.
    // 카메라를 마주 보고 있을 때만 만세, 아니면 보던 방향 그대로 다리를 벌린 자세.
    sheet = view === 'front' ? SHEETS.cheer
          : view === 'back' ? SHEETS.walkBack : SHEETS.walkSide;
    cell = sheet === SHEETS.cheer ? pingpong(Math.floor(t * 10), sheet.frames) : sheet.leap;
  } else if (state.sit > 0.9) {
    // 오래 가만히 있어서 낮잠 자는 중. 웅크린 그림이라 방향과 상관없이 그대로 씁니다.
    sheet = SHEETS.sleep;
    cell = pingpong(Math.floor(t * 3), sheet.frames);   // 숨쉬듯 느리게
  } else if (walking) {
    // 끈으로 자동으로 끌거나 손으로 직접 잡고 있을 때만, 옆모습을 힘겹게 끄는 그림으로 바꿉니다.
    // (뒤/앞모습은 그 자세를 찍은 영상이 없어서 기존 걷기 그림을 그대로 씁니다)
    const isDraggingBox = hasRope || state.grabbing;
    const sideSheet = (isDraggingBox && SHEETS.pullSide) ? SHEETS.pullSide : SHEETS.walkSide;
    sheet = view === 'back' ? SHEETS.walkBack : view === 'front' ? SHEETS.walkFront : sideSheet;
    // 걸음 번호를 walkPhase에 묶어두면 다리 놀림과 실제 이동 속도가 같이 빨라집니다
    cell = Math.floor(state.walkPhase) % sheet.frames;
  } else if (view === 'front') {
    sheet = SHEETS.idle;                              // 카메라를 마주 본 채 서 있을 때만 정면 그림
    cell = pingpong(Math.floor(t * 7), sheet.frames);
  } else {
    sheet = view === 'back' ? SHEETS.walkBack : SHEETS.walkSide;
    cell = sheet.stand;                               // 두 발이 모인 칸으로 멈춰 세웁니다
  }

  if (spriteCard.material.map !== sheet.tex) {
    spriteCard.material.map = sheet.tex;
    spriteCard.material.needsUpdate = true;
  }
  spriteCard.userData.sheet = sheet;
  setCell(sheet, cell);

  // 걸을 때 통통 튀고 살짝 기우뚱 (그림 한 장이라 이런 움직임으로 생기를 냅니다)
  const hop = Math.abs(Math.sin(state.walkPhase)) * 0.09 * state.speed;
  // sleep 그림은 이미 웅크려 땅에 닿은 모습이라, 앉는 만큼 내리는 이 보정을 적용하면 땅에 파묻힙니다
  const sitDrop = sheet === SHEETS.sleep ? 0 : 0.16 * state.sit;
  spriteBoard.position.y = hop - sitDrop;
  spriteBoard.rotation.z = Math.sin(state.walkPhase) * 0.045 * state.speed;
  // 물속에서 오르내리는 방향으로 몸이 기웁니다 — 잠수하면 머리가 아래로, 수평이면 원래대로
  if (state.diving && sheet === SHEETS.diveSwim) {
    spriteBoard.rotation.z = Math.max(-1, Math.min(1, -state.vy)) * 0.5;
  }

  // 판 크기: 칸마다 가로 폭이 달라서 그림에 맞춰 그때그때 정합니다.
  // 원본 그림이 왼쪽을 보고 있으므로, 오른쪽으로 갈 때 좌우를 뒤집습니다.
  const Hp = spriteCard.userData.planeH;
  const Wp = Hp * sheet.frameW / CELL_H;
  const breath = 1 - hop * 0.12 + Math.sin(t * 2) * 0.008 * (1 - state.speed);
  // 옆모습일 때만 진행 방향에 맞춰 뒤집습니다. 정면·뒷모습은 어느 쪽으로 가든 그대로 둡니다
  // (정면으로 오면 좌우 성분이 0이라 뒤집기 값이 직전 것으로 남아 방향이 튀었습니다)
  // 옆모습 그림들은 원본이 왼쪽을 보므로, 오른쪽으로 갈 때 좌우를 뒤집습니다.
  // (물속의 둥둥·수면 그림은 정면이라 뒤집지 않습니다)
  // 잠수 그림(diveDown)·잠수복 뭍 자세도 옆모습이라, 오른쪽으로 갈 땐 좌우를 뒤집습니다
  const sideSheets = [SHEETS.walkSide, SHEETS.pullSide, SHEETS.diveSwim, SHEETS.divePick, SHEETS.diveDown,
                      SHEETS.wetsuitLand, SHEETS.wetsuitSide];
  // 잠수복 그림(해녀 시트·해녀 걷기)만은 원본이 "오른쪽"을 봅니다 — 그래서 뒤집는 조건이 반대입니다.
  // (이걸 다른 옆모습들과 똑같이 다루면, 왼쪽으로 걸을 때 머리가 오른쪽을 보는 우스운 꼴이 됩니다)
  const facesRight = sheet === SHEETS.wetsuitLand || sheet === SHEETS.wetsuitSide;
  const mirror = sideSheets.includes(sheet) &&
    (facesRight ? !spriteCard.userData.headingRight : spriteCard.userData.headingRight);
  spriteCard.scale.set(mirror ? -Wp : Wp, Hp * breath, 1);

  // 발밑 그림자: 점프해서 뜨면 작아지고 옅어집니다
  const air = Math.max(0, lulu.position.y - groundY);
  const shrink = Math.max(0.45, 1 - air * 0.22);
  spriteBlob.position.set(state.x, groundY + 0.06, state.z);
  spriteBlob.scale.set(shrink, shrink, 1);
  spriteBlob.material.opacity = 0.4 * shrink;
}

// ---------- 13. 메인 루프 ----------
// 세계 만들기가 끝났습니다 — 이제부터의 우연(경마 승패·잡담 고르기)은 진짜 랜덤으로
Math.random = trueRandom;

// 모든 것이 준비된 뒤에 저장을 불러와 이어합니다.
//
// 여기서 예외가 나면 아래 코드가 통째로 멈춰 화면이 정지합니다. 그런데 자동저장은
// 이미 등록돼 있어서, 플레이어가 "왜 안 켜지지" 하고 앱을 옮기는 순간
// 반쯤 비어 있는 상태가 멀쩡한 세이브를 덮어씁니다. 되돌릴 방법이 없습니다.
// 그래서 불러오기가 실패하면 저장을 잠가 원본을 지킵니다.
try {
  loadGame();
} catch (e) {
  saveLocked = true;
  console.error('저장 불러오기 실패 — 원본을 지키기 위해 저장을 잠급니다', e);
  setTimeout(() => {
    alert('저장된 기록을 불러오지 못했습니다.\n\n기록이 지워지지 않도록 이번 접속에서는 저장하지 않습니다.\n새로고침하면 다시 시도합니다.');
  }, 300);
}

// 1분마다 조용히 저장합니다.
// 예전에는 화면을 옮기거나 창을 닫을 때만 저장해서, 섬을 한참 걷다가 브라우저가
// 죽으면 그 사이 진행분이 통째로 사라졌습니다.
setInterval(() => { if (!document.hidden) saveGame(true); }, 60000);

const clock = new THREE.Clock();
const camTarget = new THREE.Vector3();
const camWanted = new THREE.Vector3();

// (카메라 자동 추적·가림 방지 기능은 써봤다가 전부 뺐습니다 — 카메라는 원래 방식 그대로)

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());
  const t = clock.elapsedTime;

  updateCamera(dt);   // 방향키로 시야 돌리기 — 이동 계산이 카메라 방향을 쓰므로 먼저 갱신합니다
  updateLulu(dt);
  updateBasket(dt);
  updateFlyingFruits(dt);
  updateFilledFruits(dt);
  updateDiving(dt);   // 물질 중이면 숨을 깎고, 다 떨어지면 뭍으로 올려보냅니다
  updateNet(dt, t);   // 망사리를 멨으면 등 뒤를 따라다닙니다
  updateDoors();      // 문 앞에 서면 집·상점 안팎을 드나듭니다
  updateDayNight(dt); // 해가 뜨고 지고, 아침마다 하루가 바뀝니다
  updatePony(t);      // 조랑말 — 오늘 먹였으면 웃고, 굶었으면 웁니다
  updateHalmang();    // 해녀 할망 — 포구 옆에 앉아 있습니다
  updateMunam(dt, t); // 무남이 — 마을길을 느긋하게 왕복합니다
  updateHouse(dt);    // 집 고치는 동작이 끝나면 수리 단계를 올립니다
  updateMayor(dt, t); // 이장님이 상점과 택배사 사이를 오갑니다
  updateCarrotFx(dt); // 먹인 당근이 조랑말 입가에서 냠냠 사라집니다
  updateHarvestTarget(dt, t);
  updatePopups(dt);

  // 카메라가 루루를 부드럽게 따라갑니다
  camTarget.set(lulu.position.x, lulu.position.y + 1.0, lulu.position.z);
  const hor = Math.cos(camPitch) * camDist;
  camWanted.set(
    camTarget.x + Math.sin(camYaw) * hor,
    camTarget.y + Math.sin(camPitch) * camDist,
    camTarget.z + Math.cos(camYaw) * hor
  );
  // 카메라가 땅을 뚫고 들어가지 않게 바닥보다 조금 위로 띄웁니다.
  // 물속에서는 해저에 바짝 붙어야 하므로 여유를 훨씬 적게 둡니다.
  const minY = groundHeight(camWanted.x, camWanted.z) + (state.diving ? 0.5 : 1.2);
  if (camWanted.y < minY) camWanted.y = minY;
  // 물속에서 카메라가 수면 위로 튀어나오면 바다가 사라져 보입니다. 물 아래에 붙들어 둡니다.
  if (state.diving && lulu.position.y < SEA_Y - 0.6) camWanted.y = Math.min(camWanted.y, SEA_Y - 0.4);
  camera.position.lerp(camWanted, 1 - Math.pow(0.0015, dt));
  camera.lookAt(camTarget);

  // 그림자용 태양은 루루를 따라다니며, 게임 시간에 맞춰 동쪽에서 서쪽으로 갑니다
  const sunA = sunAngCur >= 0 ? sunAngCur : Math.PI / 2;
  sun.position.set(
    lulu.position.x + Math.cos(sunA) * 42,
    lulu.position.y + 10 + Math.sin(sunA) * 38,
    lulu.position.z + 18
  );
  sun.target.position.copy(lulu.position);
  sun.target.updateMatrixWorld();

  // 하늘과 바다는 항상 카메라를 따라옵니다 (끝이 보이지 않게)
  sky.position.set(camera.position.x, 0, camera.position.z);
  sea.position.x = camera.position.x;
  sea.position.z = camera.position.z;

  // 바닷물결
  const sp = sea.geometry.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const x = seaBase[i * 3], z = seaBase[i * 3 + 2];
    sp.setY(i, Math.sin(x * 0.06 + t * 1.1) * 0.28 + Math.cos(z * 0.05 + t * 0.8) * 0.22);
  }
  sp.needsUpdate = true;
  sea.geometry.computeVertexNormals();

  // 풀·꽃이 바람에 흔들리도록 시간 전달
  for (const m of windMaterials) {
    if (m.userData.shader) m.userData.shader.uniforms.uTime.value = t;
  }

  // 구름 흘러가기
  for (const c of clouds) {
    c.position.x += dt * 1.4;
    if (c.position.x > 300) c.position.x = -300;
  }

  // 나비 날갯짓
  for (const b of butterflies) {
    const d = b.userData;
    const a = t * d.spd + d.off;
    const bx = d.cx + Math.cos(a) * d.rad;
    const bz = d.cz + Math.sin(a * 1.3) * d.rad;
    b.position.set(bx, groundHeight(bx, bz) + 1.6 + Math.sin(a * 3) * 0.5, bz);
    b.rotation.y = -a;
    const flap = Math.sin(t * 22 + d.off) * 0.9;
    d.wl.rotation.y = flap;
    d.wr.rotation.y = -flap;
  }

  renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
