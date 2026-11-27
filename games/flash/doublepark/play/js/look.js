/* 이중주차 탈출 — 3D 미니멀 아트 디렉션(10/9). 색·차 종류·차주 옷을 한곳에 */
(function(){
const ACCENT = '#f2483a';
// 차 칠: 선명하되 무광에 가깝게. 이름은 판 만들기(game1)가 쓰는 이름 그대로
const BODY = {
  red:'#f2483a', blue:'#3f7be8', white:'#f3f2ee', black:'#3b3e45', silver:'#b8bdc6',
  green:'#38a872', yellow:'#f4bf34', purple:'#8b66d6', mint:'#3cc3b1', orange:'#f2883a', brown:'#c9a27a',
};
const CAR_COLORS = ['blue','white','black','silver','green','yellow','purple','mint','orange','brown'];
// 층마다 벽 띠 색(실제 주차장처럼 층을 색으로 구분)
const FLOOR_COL = ['#46a878', '#4a83de', '#e8913e', '#8c68d4', '#3fb3b0', '#d9a72e', '#d9607a', '#5b6fd0', '#7fa83c', '#b0705a'];
// 차주(사이드 채운 차 주인): 옷 위·아래·머리
const OWNERS = [
  { top:'#f2a7bd', pants:'#f2a7bd', hair:'#2b2622' },   // 분홍 잠옷
  { top:'#8fd0e4', pants:'#3e4a66', hair:'#5a3b22' },   // 하늘 반팔
  { top:'#b9ad7c', pants:'#5c5d62', hair:'#cfcfcf' },   // 할아버지 조끼
  { top:'#f4f4f2', pants:'#2c2f3a', hair:'#1c1c1e' },   // 흰 셔츠 출근
];
window.LOOK = { ACCENT, BODY, CAR_COLORS, FLOOR_COL, OWNERS };
// 언어는 주소로만: ?lang=en 일 때 영어, 아니면 한국어
const LQ = new URLSearchParams(location.search).get('lang');
const EN = LQ === 'en', ZH = LQ === 'zh';
// 중국어: 한국어 문장을 열쇠로 찾는다
const Z = {
  '이중주차':'双排停车', '탈출':'逃脱', '출구':'出口',
  '이동':'步数', '목표':'目标', '시각':'时间', '소리':'声音',
  '지각':'迟到', '정시 출근':'准时上班',
  '사원':'普通职员', '대리':'副经理', '과장':'经理', '팀장':'组长',
  '이번엔 사원 그대로':'这次还是普通职员', '승진을 축하합니다':'恭喜升职',
};
window.EN = EN; window.ZH = ZH; window.L = (ko, en) => EN ? en : ZH && Z[ko] != null ? Z[ko] : ko;
if(ZH){
  document.documentElement.lang = 'zh-CN'; document.title = '双排停车逃脱';
  // 게임 글꼴엔 한자가 없다 → 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
  const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
  const zb = "local('PingFang SC Semibold'),local('PingFangSC-Semibold'),local('Microsoft YaHei Bold'),local('Microsoft YaHei UI Bold'),local('Noto Sans SC Bold'),local('NotoSansSC-Bold'),local('Source Han Sans SC Bold')," + zf;
  const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
  const st = document.createElement('style');
  st.textContent = `@font-face{font-family:Paperlogy;src:${zf};font-weight:400;unicode-range:${ur}}@font-face{font-family:Paperlogy;src:${zb};font-weight:800;unicode-range:${ur}}@font-face{font-family:Paperlogy;src:${zb};font-weight:900;unicode-range:${ur}}html[lang=zh-CN] *{word-break:normal!important}html[lang=zh-CN] .ttl h1{line-height:1.08}`;
  document.head.appendChild(st);
}
window.ART = { CAR_COLORS, OWNERS };
window.SCENE = { CELL:1, GX:0, GY:0, SW:6, SH:6 };     // 판 좌표: 한 칸 = 1
})();
