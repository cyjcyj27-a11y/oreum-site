// 오름게임즈 — 홈 화면 설치용 서비스워커. 아무것도 가로채지 않는다 (캐시 없음).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
