# -*- coding: utf-8 -*-
"""
관련 게임 블록 생성기 — oreum-site

쓰는 법 (이 폴더에서):
    python make-related.py

모든 게임 소개 페이지(한·영) 끝에 "관련 게임 / Related Games" 블록을 넣는다.
이미 있으면 새로 갈아끼운다. 게임을 추가하면 아래 GAMES 표에 한 줄 넣고 다시 돌리면 끝.

왜: 구글봇이 홈 → 목록 → 게임 → 다른 게임 → 다른 목록으로 사이트 전체를 돌게 하려고.
     앵커 글자에 장르 키워드(축구게임·배달게임·퍼즐게임)가 들어가야 그 페이지가 그 키워드로 평가된다.

고르는 법: 태그가 겹치는 게임을 먼저(같은 장르), 그 다음 돌림 순서로 몇 개 더 넣어
          어떤 게임도 들어오는 링크가 끊기지 않게 한다. 결과 표를 끝에 찍어 확인한다.
"""
import io, os, re, sys

# slug, 한국어 경로, 영어 경로, 한국어 이름, 한국어 장르 앵커, 영어 이름, 영어 장르 앵커, 태그
GAMES = [
    ("fingerkick",    "/games/fingerkick/",         "/en/games/fingerkick/",         "핑거킥",          "손가락 축구게임",           "FINGER KICK",              "finger soccer game",            {"sport", "physics", "pvp"}),
    ("skyrider",      "/games/skyrider/",           "/en/games/skyrider/",           "스카이 라이더",    "하늘 오토바이 배달게임",     "SKY RIDER",                "flying motorbike delivery game", {"3d", "driving", "delivery"}),
    ("saab",          "/games/saab/",               "/en/games/saab/",               "S.A.A.B.",        "3D FPS 슈팅게임",           "S.A.A.B.",                 "3D first-person shooter",       {"3d", "action", "shooter"}),
    ("making-kimchi", "/games/making-kimchi/",      "/en/games/making-kimchi/",      "메이킹김치",       "김치가게 경영 요리게임",     "MAKING KIMCHI",            "kimchi cooking shop sim",       {"sim", "cooking", "tycoon"}),
    ("oreumkil",      "/games/oreumkil/",           "/en/games/oreumkil/",           "OREUMKIL",        "고장난 물리엔진 게임",       "OREUMKIL",                 "broken physics engine game",    {"physics", "3d", "sandbox"}),
    ("immortality",   "/games/immortality/",        "/en/games/immortality/",        "영생의 가격",      "내러티브 생존 어드벤처",     "The Price of Immortality", "narrative survival adventure",  {"story", "adventure", "survival"}),
    ("lulu",          "/games/lulu/",               "/en/games/lulu/",               "루루냥의 제주살이", "제주 3D 고양이 생활게임",    "Lulu the Cat's Jeju Life", "3D cat life sim on Jeju",       {"3d", "sim", "cat", "jeju"}),
    ("skijump",       "/games/mini/skijump/",       "/en/games/mini/skijump/",       "SKI JUMP",        "스키점프 게임",             "SKI JUMP",                 "ski jump game",                 {"sport", "arcade"}),
    ("night-study",   "/games/mini/night-study/",   "/en/games/mini/night-study/",   "야간자율학습",     "폐교 탈출 공포게임",         "NIGHT STUDY",              "school horror escape game",     {"horror", "3d", "adventure"}),
    ("break-it-all",  "/games/mini/break-it-all/",  "/en/games/mini/break-it-all/",  "BREAK IT ALL",    "벽돌깨기 게임",             "BREAK IT ALL",             "brick breaker game",            {"arcade", "physics"}),
    ("pixl",          "/games/mini/pixl/",          "/en/games/mini/pixl/",          "PIXL",            "직소퍼즐 게임",             "PIXL",                     "jigsaw puzzle game",            {"puzzle"}),
    ("crispy",        "/games/mini/crispy/",        "/en/games/mini/crispy/",        "CRISPY",          "육각 크래커 잇기 퍼즐",      "CRISPY",                   "hex cracker linking puzzle",    {"puzzle"}),
    ("doldam",        "/games/mini/doldam/",        "/en/games/mini/doldam/",        "돌담 DOLDAM",     "블록 퍼즐 게임",            "DOLDAM",                   "block puzzle game",             {"puzzle", "jeju"}),
    ("pairboom",      "/games/mini/pairboom/",      "/en/games/mini/pairboom/",      "PAIRBOOM!!",      "짝 잇기 퍼즐 게임",          "PAIRBOOM!!",               "match-and-clear puzzle game",   {"puzzle"}),
    ("oreumnyang",    "/games/mini/oreumnyang/",    "/en/games/mini/oreumnyang/",    "오름냥",          "고양이 3매치 퍼즐게임",      "Oreumnyang",               "cat match-3 puzzle game",       {"puzzle", "cat"}),
    ("slip-cat",      "/games/mini/slip-cat/",      "/en/games/mini/slip-cat/",      "SLIP CAT",        "고양이 피하기 게임",         "SLIP CAT",                 "cat dodge game",                {"arcade", "cat"}),
    ("life-logistics","/games/mini/life-logistics/","/en/games/mini/life-logistics/","LIFE LOGISTICS",  "1인칭 창고 작업 게임",       "LIFE LOGISTICS",           "first-person warehouse game",   {"3d", "sim"}),
    ("knife-duel-v7", "/games/mini/knife-duel-v7/", "/en/games/mini/knife-duel-v7/", "칼전 v7",         "3D 근접 대전 게임",          "Knife Duel v7",            "3D melee duel game",            {"action", "3d", "fighting", "pvp"}),
    ("nyang-duel",    "/games/mini/nyang-duel/",    "/en/games/mini/nyang-duel/",    "냥냥 검객 대전",   "2D 격투 게임",              "Nyang Duel",               "2D fighting game",              {"action", "fighting", "cat", "pvp"}),
    ("polarity-flip", "/games/mini/polarity-flip/", "/en/games/mini/polarity-flip/", "극성 반전",        "전략 보드게임",             "Polarity Flip",            "strategy board game",           {"puzzle", "board", "pvp"}),
]
N_RELATED = 6      # 페이지마다 관련 게임 수
N_SIMILAR = 4      # 그중 태그가 겹치는 것 수 (나머지는 돌림 순서로 채워 전체가 이어지게)

MARK_S, MARK_E = "<!-- related:start -->", "<!-- related:end -->"

_PICKS = None
def pick(i):
    """전부 한 번에 정한다: 태그 겹치는 것 먼저, 나머지는 지금까지 들어오는 링크가 가장 적은 게임부터 채운다"""
    global _PICKS
    if _PICKS is None:
        n = len(GAMES); inbound = [0] * n; _PICKS = [None] * n
        for a in range(n):
            me = GAMES[a]; others = [k for k in range(n) if k != a]
            sim = sorted([k for k in others if me[7] & GAMES[k][7]], key=lambda k: (-len(me[7] & GAMES[k][7]), (k - a) % n))[:N_SIMILAR]
            out = list(sim)
            while len(out) < N_RELATED:
                rest = [k for k in others if k not in out]
                k = min(rest, key=lambda k: (inbound[k], (k - a) % n))
                out.append(k)
            for k in out: inbound[k] += 1
            _PICKS[a] = out
    return _PICKS[i]

def block(i, en):
    items = []
    for k in pick(i):
        g = GAMES[k]
        href, name, genre = (g[2], g[5], g[6]) if en else (g[1], g[3], g[4])
        items.append(f'      <li><a href="{href}"><b>{name}</b><span>{genre}</span></a></li>')
    if en:
        title, more = "Play Other Games", '<a href="/en/games/">All free games</a> · <a href="/en/games/mini/">Mini games</a> · <a href="/en/">Oreum Games home</a>'
    else:
        title, more = "다른 게임 플레이", '<a href="/games/">무료게임 전체 목록</a> · <a href="/games/mini/">미니게임 모음</a> · <a href="/">오름게임즈 홈</a>'
    return (f'{MARK_S}\n  <section class="related" aria-label="{title}">\n    <div class="wrap game-page">\n      <h2>{title}</h2>\n      <ul class="related-list">\n'
            + "\n".join(items) + f'\n      </ul>\n      <p class="related-more">{more}</p>\n    </div>\n  </section>\n  {MARK_E}')

def apply(path, html_block):
    if not os.path.exists(path): return "없음"
    s = io.open(path, encoding="utf-8").read()
    if "noindex" in s: return "noindex 건너뜀"
    if MARK_S in s:
        s = re.sub(re.escape(MARK_S) + r".*?" + re.escape(MARK_E), lambda m: html_block, s, flags=re.S)
    else:
        assert s.count("</main>") == 1, path
        s = s.replace("</main>", html_block + "\n</main>")
    s = re.sub(r"style\.css\?v=\d+", "style.css?v=31", s)
    io.open(path, "w", encoding="utf-8", newline="\n").write(s)
    return "OK"

def main():
    root = os.path.dirname(os.path.abspath(__file__))
    inbound = {g[0]: 0 for g in GAMES}
    for i, g in enumerate(GAMES):
        for k in pick(i): inbound[GAMES[k][0]] += 1
        r1 = apply(os.path.join(root, g[1].strip("/"), "index.html"), block(i, False))
        r2 = apply(os.path.join(root, g[2].strip("/"), "index.html"), block(i, True))
        print(f"{g[0]:<15} ko={r1:<10} en={r2:<10} → " + ", ".join(GAMES[k][0] for k in pick(i)))
    print("\n들어오는 링크 수:", ", ".join(f"{k}={v}" for k, v in inbound.items()))
    low = [k for k, v in inbound.items() if v < 3]
    print("3개 미만:", low or "없음")

if __name__ == "__main__":
    main()
