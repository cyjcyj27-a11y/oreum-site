# -*- coding: utf-8 -*-
"""
상단 메뉴 SEARCH 목록 생성기 — oreum-site

쓰는 법 (이 폴더에서):
    python make-search.py

게임·앱 목록 페이지(한·영)의 카드를 읽어 assets/search-index.js 를 만든다.
새 게임 카드를 목록에 넣었으면 이걸 다시 돌리고, assets/search.js 안의 IDX_V 를 하나 올린다(캐시 때문).

한국어 페이지에서는 한국어 카드, 영어 페이지에서는 영어 카드를 보여 준다.
같은 게임의 다른 언어 이름으로도 찾히게 짝(o)을 붙인다. (사장님 2026-09-30 "게임즈 앞에 메뉴로 넣어")
"""
import io, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))

# 목록 페이지, 카드를 읽을 구역(None 이면 페이지 전체)
SOURCES = {
    "ko": [("games/index.html", ["CARDS", "FLASH", "MINI"]), ("apps/index.html", None)],
    "en": [("en/games/index.html", ["CARDS", "FLASH", "MINI"]), ("en/apps/index.html", None)],
}

CARD = re.compile(
    r'<a class="mini" href="(?P<u>[^"]+)">.*?<img src="(?P<img>[^"]+)".*?'
    r'<b>(?P<n>.*?)</b>(?:<i>(?P<t>.*?)</i>)?', re.S)


def read(path):
    with io.open(os.path.join(HERE, path), encoding="utf-8") as f:
        return f.read()


def block(html, mark):
    m = re.search(r"<!-- %s:start -->(.*?)<!-- %s:end -->" % (mark, mark), html, re.S)
    if not m:
        raise SystemExit("표식을 못 찾음: %s" % mark)
    return m.group(1)


def strip(s):
    return re.sub(r"<[^>]+>", "", s or "").replace("&amp;", "&").strip()


def cards(lang):
    out, seen = [], set()
    for path, marks in SOURCES[lang]:
        html = read(path)
        parts = [block(html, m) for m in marks] if marks else [html]
        for part in parts:
            for m in CARD.finditer(part):
                u = m.group("u")
                if u in seen:
                    continue
                seen.add(u)
                out.append({"u": u, "n": strip(m.group("n")), "t": strip(m.group("t")), "i": m.group("img")})
    return out


def pair_key(u):
    # 한·영 짝 맞추기: /en 을 떼고, 사주는 한국어가 /saju/ 영어가 /apps/saju/
    k = u.split("?")[0]
    k = k[3:] if k.startswith("/en/") else k
    return "/saju/" if k == "/apps/saju/" else k


def main():
    data = {"ko": cards("ko"), "en": cards("en")}
    names = {lang: {pair_key(c["u"]): c["n"] for c in data[lang]} for lang in data}
    for lang, other in (("ko", "en"), ("en", "ko")):
        for c in data[lang]:
            o = names[other].get(pair_key(c["u"]))
            if o and o != c["n"]:
                c["o"] = o
    js = "/* make-search.py 가 만든 파일. 손으로 고치지 말 것 */\nwindow.OREUM_SEARCH=" + \
        json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
    tmp = os.path.join(HERE, "assets", "search-index.js.tmp")
    with io.open(tmp, "w", encoding="utf-8", newline="\n") as f:
        f.write(js)
    os.replace(tmp, os.path.join(HERE, "assets", "search-index.js"))
    for lang in data:
        print(lang, len(data[lang]))
        for c in data[lang]:
            print("  ", c["u"], "|", c["n"], "|", c.get("o", ""))


if __name__ == "__main__":
    main()
