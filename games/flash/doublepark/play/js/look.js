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
const EN = LQ === 'en', ZH = LQ === 'zh', JA = LQ === 'ja', PT = LQ === 'pt', RU = LQ === 'ru';
// 중국어: 한국어 문장을 열쇠로 찾는다
const Z = {
  '이중주차':'双排停车', '탈출':'逃脱', '출구':'出口',
  '이동':'步数', '목표':'目标', '시각':'时间', '소리':'声音',
  '지각':'迟到', '정시 출근':'准时上班',
  '사원':'普通职员', '대리':'副经理', '과장':'经理', '팀장':'组长',
  '이번엔 사원 그대로':'这次还是普通职员', '승진을 축하합니다':'恭喜升职',
};
// 일본어·포르투갈어·러시아어: 중국어와 같은 열쇠
const JD = {
  '이중주차':'二重駐車', '탈출':'脱出', '출구':'出口',
  '이동':'手数', '목표':'目標', '시각':'時刻', '소리':'サウンド',
  '지각':'遅刻', '정시 출근':'定時出勤',
  '사원':'平社員', '대리':'主任', '과장':'課長', '팀장':'チーム長',
  '이번엔 사원 그대로':'今回は平社員のまま', '승진을 축하합니다':'昇進おめでとう！',
};
const PD = {
  '이중주차':'FILA DUPLA', '탈출':'FUGA', '출구':'SAÍDA',
  '이동':'JOGADAS', '목표':'META', '시각':'HORA', '소리':'Som',
  '지각':'ATRASADO', '정시 출근':'NO HORÁRIO',
  '사원':'Funcionário', '대리':'Supervisor', '과장':'Gerente', '팀장':'Chefe de equipe',
  '이번엔 사원 그대로':'Ainda funcionário', '승진을 축하합니다':'Parabéns pela promoção!',
};
const RD = {
  '이중주차':'ДВОЙНАЯ ПАРКОВКА', '탈출':'ПОБЕГ', '출구':'ВЫХОД',
  '이동':'ХОДЫ', '목표':'ЦЕЛЬ', '시각':'ВРЕМЯ', '소리':'Звук',
  '지각':'ОПОЗДАЛ', '정시 출근':'ВОВРЕМЯ',
  '사원':'Сотрудник', '대리':'Ст. специалист', '과장':'Менеджер', '팀장':'Начальник',
  '이번엔 사원 그대로':'Всё ещё сотрудник', '승진을 축하합니다':'С повышением!',
};
const XD = JA ? JD : PT ? PD : RU ? RD : null;
window.EN = EN; window.ZH = ZH; window.JA = JA; window.PT = PT; window.RU = RU;
window.L = (ko, en) => EN ? en : ZH && Z[ko] != null ? Z[ko] : XD ? (XD[ko] != null ? XD[ko] : en != null ? en : ko) : ko;
if(XD){
  document.documentElement.lang = JA ? 'ja' : PT ? 'pt-BR' : 'ru';
  document.title = JA ? '二重駐車脱出' : PT ? 'Fuga da Fila Dupla' : 'Побег с двойной парковки';
  // 게임 글꼴에 없는 글자(가나·한자, 악센트 라틴·키릴)는 같은 이름에 기기 글꼴을 그 범위로만 덧붙인다
  const xf = JA ? "local('Hiragino Sans'),local('Hiragino Kaku Gothic ProN'),local('Yu Gothic UI'),local('Yu Gothic'),local('Yu Gothic Medium'),local('YuGothic-Medium'),local('Yu Gothic Regular'),local('YuGothic-Regular'),local('Yu Gothic Bold'),local('YuGothic-Bold'),local('MS PGothic'),local('MS Gothic'),local('Meiryo'),local('Noto Sans JP'),local('Noto Sans CJK JP'),local('Source Han Sans JP')"
    : "local('Segoe UI'),local('Roboto'),local('Arial'),local('Helvetica Neue'),local('Helvetica')";
  const xr = JA ? 'U+2E80-2FFF,U+3000-30FF,U+31F0-31FF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF' : 'U+00A0-024F,U+0400-04FF,U+1E00-1EFF,U+2010-2027';
  const st = document.createElement('style');
  const xb = JA ? "local('Yu Gothic Bold'),local('YuGothic-Bold'),local('Hiragino Sans W7'),local('Meiryo Bold'),local('Meiryo-Bold')," : "local('Segoe UI Black'),local('SegoeUI-Black'),local('Segoe UI Bold'),local('SegoeUI-Bold'),local('Roboto Black'),local('Roboto-Black'),local('Arial Bold'),local('Arial-BoldMT'),";
  // 굵은 글씨(800·900)는 기기의 굵은 글꼴을 먼저 찾는다
  st.textContent = [400, 800, 900].map(w => `@font-face{font-family:Paperlogy;src:${w > 400 ? xb : ''}${xf};font-weight:${w};unicode-range:${xr}}`).join('') + (JA ? 'html[lang=ja] *{word-break:normal!important}html[lang=ja] .ttl h1{line-height:1.08}' : '');
  document.head.appendChild(st);
}
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
