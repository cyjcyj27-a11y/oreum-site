# -*- coding: utf-8 -*-
"""목록 카드 정렬기 — oreum-site

쓰는 법 (이 폴더에서):
    python make-cards.py            새로 공개한 게임이 저절로 맨 앞으로 옵니다
    python make-cards.py --보기     바꾸지 않고 어떤 순서가 될지만 보여 줍니다

무엇을 하나
  대문(/)·게임즈(/games/)·영문판의 카드를 **공개일 최신순**으로 다시 늘어놓습니다.
  공개일은 각 게임 페이지의 JSON-LD `"datePublished"` 에서 읽습니다.
  가장 최근에 공개한 **한 장에만** NEW 딱지를 붙입니다(14일이 지나면 아예 안 붙습니다).

무엇을 안 하나
  **카드를 더하거나 빼지 않습니다.** 어떤 게임을 대문에 둘지는 사람이 정하는 일입니다
  (대문은 골라 놓은 목록이고, /games/ 가 전체 목록입니다).
  대신 전체 목록에 있는데 대문에 없는 게임을 끝에 알려 줍니다 — 빠뜨리지 않게.

왜 자바스크립트로 안 그리나
  네이버는 자바스크립트를 대체로 실행하지 않습니다. 목록을 JS로 그리면 한글 검색에서
  통째로 안 잡힙니다. 그래서 **미리 HTML 에 박아 넣는** 이 방식을 씁니다.

고칠 자리
  목록 페이지에서 `<!-- CARDS:start -->` 와 `<!-- CARDS:end -->` 사이만 갈아 끼웁니다.
  그 표시가 없는 페이지는 건드리지 않습니다.
"""
import io, os, re, sys, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
PAGES = ["index.html", "games/index.html", "en/index.html", "en/games/index.html"]
NEW_DAYS = 14                   # 딱지는 **맨 앞 한 장에만**. 이보다 오래되면 아예 안 붙인다
                                # (거의 매일 올리는 곳이라 여러 장에 붙이면 뜻이 없어진다)

CARD_RE  = re.compile(r'<a class="mini"[^>]*href="([^"]+)"[^>]*>.*?</a>', re.S)
DATE_RE  = re.compile(r'"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})"')
NEW_RE   = re.compile(r'\s*<span class="isnew">NEW</span>')
MARK     = re.compile(r'(<!-- CARDS:start -->)(.*?)(<!-- CARDS:end -->)', re.S)


def page_for(href):
    """카드 주소 → 그 페이지의 index.html 경로 (영문판은 없으면 한글판을 본다)"""
    p = os.path.join(HERE, href.strip("/").replace("/", os.sep), "index.html")
    if os.path.exists(p):
        return p
    if href.startswith("/en/"):
        return page_for(href[3:])
    return None


def published(href, cache={}):
    if href in cache:
        return cache[href]
    d, p = None, page_for(href)
    if p:
        m = DATE_RE.search(io.open(p, encoding="utf-8").read())
        if m:
            d = m.group(1)
        elif href.startswith("/en/"):                 # 영문판에 날짜가 없으면 한글판 것을 쓴다
            d = published(href[3:])
    cache[href] = d
    return d


def fresh(d, today):
    if not d:
        return False
    y, m, dd = (int(x) for x in d.split("-"))
    return (today - datetime.date(y, m, dd)).days <= NEW_DAYS


def sort_cards(html, today):
    """카드를 공개일 최신순으로. 날짜가 없는 카드는 있던 순서 그대로 맨 뒤."""
    cards = [(m.group(1), m.group(0)) for m in CARD_RE.finditer(html)]
    dated   = [(h, c) for h, c in cards if published(h)]
    undated = [(h, c) for h, c in cards if not published(h)]
    dated.sort(key=lambda hc: published(hc[0]), reverse=True)

    out = []
    for i, (href, card) in enumerate(dated + undated):
        card = NEW_RE.sub("", card)                   # 옛 딱지는 먼저 다 뗀다
        # 맨 앞 한 장에만 — 여러 장에 붙으면 '새것'이라는 뜻이 없어진다
        if i == 0 and fresh(published(href), today):
            card = card.replace('<span class="kind">',
                                '<span class="isnew">NEW</span><span class="kind">', 1)
        out.append(card)
    return out, [h for h, _ in dated + undated]


def main():
    show = "--보기" in sys.argv or "--dry" in sys.argv
    today = datetime.date.today()
    listed = {}

    for rel in PAGES:
        p = os.path.join(HERE, rel.replace("/", os.sep))
        if not os.path.exists(p):
            continue
        html = io.open(p, encoding="utf-8").read()
        m = MARK.search(html)
        if not m:
            print("  ! %s — CARDS 표시가 없어 건너뜁니다" % rel)
            continue
        cards, order = sort_cards(m.group(2), today)
        listed[rel] = order
        body = "\n" + "\n".join("        " + c for c in cards) + "\n      "
        new  = html[:m.start(2)] + body + html[m.end(2):]
        print("%s  카드 %d개" % (rel, len(cards)))
        for i, h in enumerate(order[:4]):
            print("   %-34s %s%s" % (h, published(h) or "날짜없음",
                                     "  ← NEW" if i == 0 and fresh(published(h), today) else ""))
        if not show and new != html:
            io.open(p, "w", encoding="utf-8", newline="").write(new)

    # 전체 목록에는 있는데 대문에 없는 게임 알려 주기
    if "games/index.html" in listed and "index.html" in listed:
        miss = [h for h in listed["games/index.html"] if h not in listed["index.html"]]
        if miss:
            print("\n대문에 없는 게임 (넣을지는 사람이 정합니다):")
            for h in miss:
                print("   " + h)
    print("\n" + ("보기만 했습니다." if show else "카드 정렬 끝."))


if __name__ == "__main__":
    main()
