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
const EN = new URLSearchParams(location.search).get('lang') === 'en';
window.EN = EN; window.L = (ko, en) => EN ? en : ko;
window.ART = { CAR_COLORS, OWNERS };
window.SCENE = { CELL:1, GX:0, GY:0, SW:6, SH:6 };     // 판 좌표: 한 칸 = 1
})();
