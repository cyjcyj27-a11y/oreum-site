# oreumgames.com — 오름게임즈 홈페이지

정적 웹사이트입니다. 서버도, 빌드 도구도 필요 없습니다. 파일을 그대로 올리면 끝입니다.

## 폴더 구성

```
index.html     메인 (스튜디오 소개 + 게임 소개)
support.html   고객지원 / 자주 묻는 질문   ← 구글플레이 "지원 URL"에 넣는 주소
privacy.html   개인정보처리방침            ← 구글플레이 "개인정보처리방침 URL"에 넣는 주소
style.css      전체 디자인 (색·글자·반응형·다크모드)
CNAME          연결할 도메인 (oreumgames.com)
robots.txt     검색엔진 안내
sitemap.xml    검색엔진용 페이지 목록
favicon.ico    브라우저 탭 아이콘
assets/
  logo.svg       오름게임즈 로고 (직접 그린 벡터)
  og-image.png   카톡·트위터에 링크 붙일 때 뜨는 미리보기 그림
  lulu.png       히어로에 서 있는 루루
  lulu-icon.png  게임 아이콘
  scene_*.webp   게임 장면 사진 4장
```

## 미리보기 (내 컴퓨터에서)

프로젝트 폴더에서 아래를 실행하고 <http://localhost:4321> 을 엽니다.

```bash
venv/Scripts/python -m http.server 4321 --directory oreum-site
```

## 인터넷에 올리기 (깃허브 페이지)

1. 깃허브에 새 저장소를 만듭니다. 이름은 `oreum-site` 정도로.
2. 이 폴더 안의 파일을 전부 그 저장소에 올립니다.
3. 저장소 **Settings → Pages** 에서
   - Source: `Deploy from a branch`
   - Branch: `main` / `/ (root)`
4. 같은 화면 **Custom domain** 에 `oreumgames.com` 을 넣고 저장합니다.
   (`CNAME` 파일이 이미 들어 있어서 자동으로 채워지기도 합니다.)
5. **Enforce HTTPS** 를 켭니다. 인증서 발급에 최대 24시간 걸릴 수 있습니다.

## 도메인 연결 (DNS 설정)

도메인을 산 곳(가비아·후이즈·Cloudflare 등)의 DNS 관리 화면에서 아래를 넣습니다.

| 종류  | 이름(호스트) | 값 |
|-------|--------------|-----|
| A     | `@`          | `185.199.108.153` |
| A     | `@`          | `185.199.109.153` |
| A     | `@`          | `185.199.110.153` |
| A     | `@`          | `185.199.111.153` |
| CNAME | `www`        | `cyjcyj27-a11y.github.io.` |

반영까지 보통 10분 ~ 몇 시간 걸립니다.

## 현재 연결된 주소 (2026-09-02 기준)

| 주소 | 무엇 | 저장소 |
|------|------|--------|
| `https://oreumgames.com` | 이 홈페이지 | `oreum-site` |
| `https://www.oreumgames.com` | 같은 홈페이지 | `oreum-site` |

저장소는 `oreum-site` 하나입니다. 게임도 전부 이 안에 있습니다
(루루냥 `games/lulu/play/`, 영생의 가격 `games/immortality/play/`, 미니게임 `games/mini/*/play/`).

`play.oreumgames.com`(옛 `lulu-farm` 저장소)은 2026-09-02에 없앴습니다.
홈에서 다른 도메인으로 넘어가면 GA 세션이 끊기고 방문이 새어 나가서, 게임을 이 저장소로 옮기고
DNS·저장소·검색 등록을 모두 지웠습니다. 새 게임은 절대 따로 도메인을 파지 말고 `games/<이름>/play/`에 둡니다.

후이즈 DNS에 들어가 있는 것:

- A 레코드 4개 (호스트명 비움) → `185.199.108~111.153`
- CNAME `www` → `cyjcyj27-a11y.github.io.`

**주의** — 깃허브 Pages 설정의 Custom domain 칸을 비우거나 Remove 하면
저장소의 `CNAME` 파일이 지워지면서 도메인 연결이 끊깁니다.
끊겼을 때는 그 칸에 도메인을 다시 넣고 Save 하면 복구됩니다.

## 구글플레이 제출용 주소

- 개인정보처리방침 URL : `https://oreumgames.com/privacy.html`
- 지원 URL : `https://oreumgames.com/support.html`
- 웹사이트 : `https://oreumgames.com`

## 내용 고칠 때

- 글씨·문장 → `index.html`, `support.html`, `privacy.html` 을 메모장으로 열어 수정
- 색깔 → `style.css` 맨 위 `:root` 안의 색 코드
- 로고 → `assets/logo.svg` 파일만 교체하면 헤더·푸터·스튜디오 섹션이 한 번에 바뀜
- 게임을 새로 추가할 때 → `index.html` 의 `<article class="game">` 블록을 복사해서 아래에 붙여넣기

## 바깥에서 받은 링크 (게임 하나 낼 때마다 하나씩)

GA4 트래픽 획득에서 소스별로 방문을 맞춰 보기 위한 기록. 올린 날·곳·주소·어느 게임인지 적는다.

| 날짜 | 곳 | 주소 | 게임 | 메모 |
|---|---|---|---|---|
| 2026-09-04 | itch.io | https://oreumgames.itch.io/finger-kick | 핑거킥(영어판 실행 포함) | 설명글에 원본 페이지·홈 링크 2개(nofollow). 게임 안 OREUM GAMES 알약 → oreumgames.com/en/?utm_source=itch |
