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
    ("wol300",        "/games/wol300/",              "/en/games/wol300/",              "월300",             "AI 시뮬레이션게임·스토리게임",       "300 A MONTH",          "AI surveillance sim & story game", {"sim", "story"}),
    ("fartlike",      "/games/fartlike/",            "/en/games/fartlike/",            "방귀라이크",        "방귀 뱀서라이크게임",              "FARTLIKE",             "fart survivors-like game", {"action", "arcade", "funny", "casual"}),
    ("jejukart",      "/games/jejukart/",            "/en/games/jejukart/",            "제주카트레이싱",     "3D 카트레이싱게임",               "JEJU KART RACING",     "3D kart racing game", {"racing", "driving", "3d", "pvp", "arcade"}),
    ("checkers",      "/games/flash/checkers/",      "/en/games/flash/checkers/",      "체커게임",          "혼자·2인용 체커 보드게임",          "Checkers",             "checkers board game vs computer", {"board", "pvp", "strategy"}),
    ("chwigwon",      "/games/mini/chwigwon/",       "/en/games/mini/chwigwon/",       "취권소찬",          "취권 격투 액션게임",               "Drunken Fist: Sochan", "drunken fist beat 'em up game", {"action", "fighting", "arcade"}),
    ("saving12chicks", "/games/flash/saving12chicks/", "/en/games/flash/saving12chicks/", "병아리 일이병구하기", "수탉 횡스크롤 액션게임", "Saving 12 Chicks", "rooster side-scroller game", {"arcade", "casual", "animal", "kids"}),
    ("maidcafe",      "/games/maidcafe/",           "/en/games/maidcafe/",           "모에모에 메이드카페", "메이드카페 방치형 경영게임",   "MOE MOE MAID CAFE",        "idle maid cafe tycoon",         {"sim", "tycoon", "idle"}),
    ("fullbrain",     "/games/mini/fullbrain/",      "/en/games/mini/fullbrain/",      "두뇌풀가동",        "사칙연산 퀴즈 두뇌게임",           "FULL BRAIN",           "mental math quiz game", {"puzzle", "casual", "quiz", "brain"}),
    ("yut",           "/games/flash/yut/",           "/en/games/flash/yut/",           "윷놀이",           "윷가락 던지는 윷놀이 게임",        "YUT NORI",             "Korean board game yut nori", {"physics", "pvp", "3d", "casual", "board", "korean"}),
    ("foosball",      "/games/mini/foosball/",       "/en/games/mini/foosball/",       "테이블축구게임",    "3D 테이블 축구게임",              "FOOSBALL",             "free online foosball game", {"sport", "physics", "pvp", "3d", "casual"}),
    ("cheonggi",      "/games/flash/cheonggi/",      None,                              "청기백기",          "순발력게임 청기백기",              None,                   None, {"arcade", "casual", "rhythm"}),
    ("woodenblock",   "/games/flash/woodenblock/",   "/en/games/flash/woodenblock/",   "나무블럭쌓기",      "젠가게임과 비슷한 블럭쌓기게임",   "WOODEN BLOCK",         "block tower game like Jenga", {"physics", "pvp", "3d", "casual", "board"}),
    ("odaesu",        "/games/mini/odaesu/",        "/en/games/mini/odaesu/",        "오대수게임",        "복도 망치 격투 액션게임",          "Odaesu Game",          "hammer beat em up game", {"action", "arcade"}),
    ("bowling",       "/games/flash/bowling/",       "/en/games/flash/bowling/",       "볼링게임",          "3D 볼링게임",                   "3D Bowling",           "3D bowling game online", {"sport", "physics", "pvp", "3d", "casual"}),
    ("mulgwisin",     "/games/mulgwisin/",           "/en/games/mulgwisin/",           "물귀신",            "밤 계곡 3D 공포게임",              "Mulgwisin",            "3D water ghost horror game", {"horror", "3d", "adventure", "puzzle"}),
    ("spotdiff",      "/games/flash/spotdiff/",      "/en/games/flash/spotdiff/",      "틀린그림찾기",      "두 그림 비교 틀린그림찾기 게임",     "Spot the Difference",  "spot the difference game", {"puzzle", "casual", "kids"}),
    ("taja",          "/games/flash/taja/",          "/en/games/flash/taja/",          "타자연습 달리기",    "한글·영어 타자연습 게임",        "Typing Race",          "free typing practice game", {"casual", "kids", "animal", "educational"}),
    ("burger",        "/games/flash/burger/",        "/en/games/flash/burger/",        "킹왕짱버거",        "햄버거 만들기 요리게임",          "KINGWANGZZANG",        "burger cooking game", {"sim", "cooking", "casual"}),
    ("meowsquad",     "/games/flash/meowsquad/",     "/en/games/flash/meowsquad/",     "야옹 편대",         "고양이 비행기 슈팅게임",          "MEOWSQUAD",            "cat fighter shoot 'em up game", {"arcade", "cat", "casual"}),
    ("ueno",          "/games/ueno/",                "/en/games/ueno/",                "우에노짱",          "착한 양아치 커플 3D 공원 어드벤처",  "UENO ZZANG",               "3D park adventure brawler",     {"3d", "adventure", "cat", "fight"}),
    ("ttang",         "/games/flash/ttang/",         "/en/games/flash/ttang/",         "땅따먹기",          "1인용·2인용 땅따먹기게임",        "LAND GRAB",                "Korean land-claiming stone flick game", {"board", "pvp", "casual"}),
    ("bangwi",        "/games/flash/bangwi/",        "/en/games/flash/bangwi/",        "방귀 뀌기",        "안 들키게 몰래 뀌는 방귀게임",       "THE FART",                 "sneaky fart game",              {"casual", "arcade", "funny"}),
    ("omok",          "/games/flash/omok/",          "/en/games/flash/omok/",          "오목",            "혼자·2인용 오목게임",         "GOMOKU",                   "free Gomoku five in a row game", {"board", "pvp", "strategy"}),
    ("baduk",         "/games/flash/baduk/",         "/en/games/flash/baduk/",         "바둑",            "혼자 두는 바둑게임",          "BADUK",                    "free Go board game",            {"board", "pvp", "strategy"}),
    ("jeju",          "/games/jeju/",               "/en/games/jeju/",               "BUY JEJU",        "제주도 땅 사는 오픈월드게임",   "BUY JEJU",                 "open world land-buying game on Jeju", {"sim", "tycoon", "building", "driving"}),
    ("farmonmars",    "/games/farmonmars/",         "/en/games/farmonmars/",         "팜온마즈",         "화성 농장 건설 방치형게임",     "FARM ON MARS",             "idle Mars farming city builder", {"sim", "idle", "tycoon", "building"}),
    ("bungeoppang",   "/games/flash/bungeoppang/",   "/en/games/flash/bungeoppang/",   "붕어빵",          "겨울 노점 방치형게임",        "BUNGEOPPANG",              "Korean fish-shaped bread idle game", {"sim", "idle", "tycoon", "casual"}),
    ("catmobile",     "/games/flash/catmobile/",     "/en/games/flash/catmobile/",     "고양이용 게임",     "고양이·아기 터치게임",       "GAME FOR CAT",             "tap game for cats and toddlers", {"casual", "animal", "kids"}),
    ("boa",           "/games/flash/boa/",           "/en/games/flash/boa/",           "보아뱀",          "코끼리 삼키는 뱀게임",        "BOA",                      "elephant-swallowing snake game", {"arcade", "casual", "animal"}),
    ("coinwash",      "/games/coinwash/",           "/en/games/coinwash/",           "코인빨래방",       "빨래방 방치형 경영게임",     "COIN LAUNDRY 24",          "idle laundromat game",          {"sim", "tycoon", "idle"}),
    ("boyband",       "/games/boyband/",            "/en/games/boyband/",            "제발 데뷔해줘",     "인디밴드 육성 시뮬레이션게임",        "HOTSHOT INDIE",            "indie band manager sim",        {"sim", "story"}),
    ("castaway",      "/games/castaway/",           "/en/games/castaway/",           "망망대해",         "뗏목 낚시 생존게임",         "OPEN SEA",                 "raft fishing survival game",    {"3d", "sim", "survival", "fishing"}),
    ("fingerkick",    "/games/fingerkick/",         "/en/games/fingerkick/",         "핑거킥",          "손가락 축구게임",           "FINGER KICK",              "finger soccer game",            {"sport", "physics", "pvp"}),
    ("skyrider",      "/games/skyrider/",           "/en/games/skyrider/",           "스카이 라이더",    "하늘 오토바이 배달게임",     "SKY RIDER",                "flying motorbike delivery game", {"3d", "driving", "delivery"}),
    ("saab",          "/games/saab/",               "/en/games/saab/",               "S.A.A.B.",        "3D FPS 슈팅게임",           "S.A.A.B.",                 "3D first-person shooter",       {"3d", "action", "shooter"}),
    ("making-kimchi", "/games/making-kimchi/",      "/en/games/making-kimchi/",      "메이킹김치",       "김치가게 경영 요리게임",     "MAKING KIMCHI",            "kimchi cooking shop sim",       {"sim", "cooking", "tycoon"}),
    ("oreumkil",      "/games/oreumkil/",           "/en/games/oreumkil/",           "OREUMKIL",        "고장난 물리엔진 게임",       "OREUMKIL",                 "broken physics engine game",    {"physics", "3d", "sandbox"}),
    ("immortality",   "/games/immortality/",        "/en/games/immortality/",        "영생의 가격",      "내러티브 생존 어드벤처",     "The Price of Immortality", "narrative survival adventure",  {"story", "adventure", "survival"}),
    ("lulu",          "/games/lulu/",               "/en/games/lulu/",               "루루냥의 제주살이", "제주 3D 고양이 생활게임",    "Lulu the Cat's Jeju Life", "3D cat life sim on Jeju",       {"3d", "sim", "cat", "jeju"}),
    ("skijump",       "/games/mini/skijump/",       "/en/games/mini/skijump/",       "SKI JUMP",        "스키점프 게임",             "SKI JUMP",                 "ski jump game",                 {"sport", "arcade"}),
    ("alkkagi",       "/games/flash/alkkagi/",       "/en/games/flash/alkkagi/",       "알까기",          "바둑돌 튕기기 게임",         "ALKKAGI",                  "stone flicking game",           {"physics", "board", "pvp"}),
    ("shibavet",      "/games/mini/shibavet/",      "/en/games/mini/shibavet/",      "시바 병원 가는 날", "시바견 잡기 게임",          "SHIBA VET DAY",            "shiba dog catching game",       {"3d", "action", "animal"}),
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
# 미니게임 목록에서 '실험작'으로 표시한 것 — 이 페이지들에도 블록은 붙지만, 다른 페이지가 추천하지는 않는다 (2026-09-04 사장님 지시)
EXPERIMENTAL = {"life-logistics", "slip-cat", "knife-duel-v7", "nyang-duel", "polarity-flip"}
N_RELATED = 6      # 페이지마다 관련 게임 수
N_SIMILAR = 4      # 그중 태그가 겹치는 것 수 (나머지는 돌림 순서로 채워 전체가 이어지게)

MARK_S, MARK_E = "<!-- related:start -->", "<!-- related:end -->"

_PICKS = {}
def pick(i, en=False):
    """전부 한 번에 정한다: 태그 겹치는 것 먼저, 나머지는 지금까지 들어오는 링크가 가장 적은 게임부터 채운다.
    영문판이 없는 게임(영문 주소 None, 청기백기 2026-09-19)은 영어 페이지에서 추천하지 않는다"""
    if en not in _PICKS:
        n = len(GAMES); inbound = [0] * n; _PICKS[en] = [None] * n
        for a in range(n):
            me = GAMES[a]; others = [k for k in range(n) if k != a and GAMES[k][0] not in EXPERIMENTAL and (not en or GAMES[k][2])]
            sim = sorted([k for k in others if me[7] & GAMES[k][7]], key=lambda k: (-len(me[7] & GAMES[k][7]), (k - a) % n))[:N_SIMILAR]
            out = list(sim)
            while len(out) < N_RELATED:
                rest = [k for k in others if k not in out]
                k = min(rest, key=lambda k: (inbound[k], (k - a) % n))
                out.append(k)
            for k in out: inbound[k] += 1
            _PICKS[en][a] = out
    return _PICKS[en][i]

SHOT_ALIAS = {"knife-duel-v7": "knife-duel"}
SHOT_VER = {"bowling": "2"}   # 그림을 다시 뜬 게임 — 주소 뒤 ?v= 로 캐시를 넘긴다
def thumb(slug, en):
    """assets/<slug>-shot(-en).webp 가 있으면 그 주소, 없으면 None"""
    root = os.path.dirname(os.path.abspath(__file__)); base = SHOT_ALIAS.get(slug, slug)
    for name in ([f"{base}-shot-en.webp"] if en else []) + [f"{base}-shot.webp", f"{base}-teaser.webp"]:
        if os.path.exists(os.path.join(root, "assets", name)):
            return "/assets/" + name + (f"?v={SHOT_VER[slug]}" if slug in SHOT_VER else "")
    return None

def block(i, en):
    items = []
    for k in pick(i, en):
        g = GAMES[k]
        href, name, genre = (g[2], g[5], g[6]) if en else (g[1], g[3], g[4])
        shot = thumb(g[0], en)
        img = f'<img src="{shot}" alt="" width="96" height="60" loading="lazy">' if shot else '<i class="related-noimg"></i>'
        items.append(f'      <li><a href="{href}">{img}<span class="related-txt"><b>{name}</b><span>{genre}</span></span><em>{"PLAY" if en else "플레이"} ▸</em></a></li>')
    if en:
        title, more = "Play Other Games", '<a href="/en/games/">All free games</a> · <a href="/en/games/mini/">Mini games</a> · <a href="/en/">Oreum Games home</a>'
    else:
        title, more = "다른 게임 플레이", '<a href="/games/">무료게임 전체 목록</a> · <a href="/games/flash/">플래시게임 모음</a> · <a href="/games/mini/">미니게임 모음</a> · <a href="/">오름게임즈 홈</a>'
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
    s = re.sub(r"style\.css\?v=\d+", "style.css?v=40", s)
    io.open(path, "w", encoding="utf-8", newline="\n").write(s)
    return "OK"

def main():
    root = os.path.dirname(os.path.abspath(__file__))
    inbound = {g[0]: 0 for g in GAMES}
    for i, g in enumerate(GAMES):
        for k in pick(i): inbound[GAMES[k][0]] += 1
        r1 = apply(os.path.join(root, g[1].strip("/"), "index.html"), block(i, False))
        r2 = apply(os.path.join(root, g[2].strip("/"), "index.html"), block(i, True)) if g[2] else "영문판 없음"
        print(f"{g[0]:<15} ko={r1:<10} en={r2:<10} → " + ", ".join(GAMES[k][0] for k in pick(i)))
    print("\n들어오는 링크 수:", ", ".join(f"{k}={v}" for k, v in inbound.items()))
    low = [k for k, v in inbound.items() if v < 3 and k not in EXPERIMENTAL]
    print("3개 미만:", low or "없음")

if __name__ == "__main__":
    main()
