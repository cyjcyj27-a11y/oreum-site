// 오름게임즈 — 바탕화면(홈 화면) 바로가기용 서비스워커. 캐시는 하지 않는다.
//
// ⚠ 크롬은 "가져오기(fetch)를 듣는 서비스워커"가 있어야 설치할 수 있는 사이트로 본다.
//    예전에는 이 줄이 없어서, 크롬이 설치 신호(beforeinstallprompt)를 안 보내는 일이 있었다
//    (2026-09-16 사장님: 윈도우에서 지웠는데도 단추가 설치 창을 못 띄움).
//    아무것도 가로채지 않고 그대로 넘긴다 — 늘 인터넷에서 새로 받는다.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
