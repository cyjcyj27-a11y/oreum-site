# -*- coding: utf-8 -*-
"""
개발뉴스 페이지 생성기 — oreum-site (2026-09-22, 영문판 추가)

쓰는 법 (이 폴더에서):
    python make-news.py

news/posts/*.md      → news/<slug>/index.html + news/index.html      (한국어)
news/posts-en/*.md   → en/news/<slug>/index.html + en/news/index.html (영어)
같은 slug 가 두 언어에 다 있으면 서로 hreflang 짝으로 잇는다. 그다음 python make-sitemap.py 를 돌리고 커밋하면 끝.

원고 파일 꼴 (news/posts/2026-09-22-indiegame.md):
    ---
    slug: indiegame
    date: 2026-09-22
    title: 설치 없이 하는 인디게임, 한국의 작은 스튜디오가 웹에서 50개를 낸 이유
    sub: "다운로드 버튼이 없는 인디게임" 오름게임즈, 방치형게임부터 어드벤처게임까지
    desc: 검색 설명문 한두 문장
    keywords: 인디게임, 인디게임 뜻, …
    ---
    본문. 빈 줄로 문단을 나눈다.
    ## 소제목
    링크는 [알까기](/games/flash/alkkagi/), 굵게는 **이렇게**.
    사진은 한 줄에 ![설명](/assets/news/파일.webp) — 작게 줄인 webp 를 assets/news/ 에(2026-09-25).

규칙: 제목·본문에 # 기호가 남지 않게 여기서 전부 HTML 로 바꾼다. 꼭지 이름은 "오름게임즈 인디게임 개발뉴스"(사장님 2026-09-22).
목록 페이지에는 글 본문을 다 펼치고 글 끝에 게임 목록 단추(사장님 2026-09-22).
"""
import io, os, re, glob, json, html

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = "https://oreumgames.com"

LANG = {
    "ko": dict(
        posts="posts", out="news", section="오름게임즈 인디게임 개발뉴스", lang="ko", locale="ko_KR",
        template=os.path.join(ROOT, "games", "flash", "yut", "index.html"),
        back_href="/games/", back="← 게임 목록", cta="🎮 게임 목록 보기", cta_href="/games/", by="오름게임즈", more="더 읽기 →",
        list_title="오름게임즈 인디게임 개발뉴스 — 설치 없이 하는 인디게임을 만드는 이야기",
        list_desc="한국의 작은 인디게임 스튜디오 오름게임즈의 개발뉴스. 설치 없이 브라우저에서 바로 하는 인디게임을 어떻게 만들고, 무엇을 배우고, 어디에 내는지 기록합니다.",
        list_keywords="인디게임, 인디게임 개발, 인디게임 뉴스, 인디게임 사이트, 웹게임 개발, 오름게임즈",
        other_lang_link='<a href="/en/news/{slug}" lang="en" hreflang="en">EN</a>',
    ),
    "en": dict(
        posts="posts-en", out="en/news", section="Oreum Games Indie Dev News", lang="en", locale="en_US",
        template=os.path.join(ROOT, "en", "games", "flash", "yut", "index.html"),
        back_href="/en/games/", back="← All games", cta="🎮 See all games", cta_href="/en/games/", by="Oreum Games", more="Read more →",
        list_title="Oreum Games Indie Dev News — making indie games you play with no install",
        list_desc="Dev news from Oreum Games, a very small indie studio in Korea: how we make browser games that start with no install, what we learn, and where we put them.",
        list_keywords="indie game, indie game dev, indie dev news, browser games, web game development, Oreum Games",
        other_lang_link='<a href="/news/{slug}" lang="ko" hreflang="ko">한국어</a>',
    ),
}


def chrome(L):
    s = io.open(L["template"], encoding="utf-8").read()
    header = re.search(r"<header.*?</header>", s, re.S).group(0)
    # 언어 전환 링크는 글마다 바꾼다 — 자리표시자로
    header = re.sub(r'<a href="[^"]*" lang="(?:en|ko)" hreflang="(?:en|ko)">[^<]*</a>', "{OTHER_LANG}", header)
    apps = '<a href="/apps/">APPS</a>' if L["lang"] == "ko" else '<a href="/en/apps/">APPS</a>'
    news = '<a href="/news/">NEWS</a>' if L["lang"] == "ko" else '<a href="/en/news/">NEWS</a>'
    if news not in header:
        header = header.replace(apps, apps + "\n      " + news, 1)
    footer = re.search(r"<footer.*?</footer>", s, re.S).group(0)
    scripts = "\n".join(re.findall(r'<script[^>]+src="[^"]+"[^>]*></script>', s))
    verif = "\n".join(re.findall(r'<meta name="(?:naver|google)-site-verification"[^>]*/?>', s))
    css = re.search(r'<link rel="stylesheet" href="[^"]+">', s).group(0)
    return header, footer, scripts, verif, css


def parse(path):
    s = io.open(path, encoding="utf-8").read()
    m = re.match(r"---\n(.*?)\n---\n(.*)", s, re.S)
    meta = {}
    for line in m.group(1).splitlines():
        k, _, v = line.partition(":")
        meta[k.strip()] = v.strip()
    meta["body"] = m.group(2).strip()
    return meta


def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', t)
    return t


def body_html(md):
    out = []
    for block in re.split(r"\n\s*\n", md):
        b = block.strip()
        if not b:
            continue
        m = re.fullmatch(r"!\[([^\]]*)\]\(([^)]+)\)", b)
        if m:   # 사진 한 장 — 가로세로를 적어 두고 늦게 읽는다(글 첫 화면이 가볍게)
            src, wh = m.group(2), ""
            try:
                from PIL import Image
                w, h = Image.open(os.path.join(ROOT, src.split("?")[0].lstrip("/"))).size
                wh = ' width="%d" height="%d"' % (w, h)
            except Exception:
                pass
            out.append('      <figure class="note-fig"><img src="%s" alt="%s"%s loading="lazy" decoding="async"></figure>' % (html.escape(src), html.escape(m.group(1)), wh))
        elif b.startswith("## "):
            out.append("      <h2>%s</h2>" % inline(b[3:].strip()))
        else:
            out.append('      <p class="gp-body">%s</p>' % inline(" ".join(l.strip() for l in b.splitlines())))
    return "\n".join(out)


HEAD = """<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="keywords" content="{keywords}">
<link rel="canonical" href="{url}">
{alternates}
{verif}
<meta name="theme-color" content="#f8f5ec">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/assets/icon-512.png" type="image/png" sizes="512x512">
<link rel="apple-touch-icon" href="/assets/icon-180.png">
<link rel="manifest" href="/manifest.webmanifest">

<meta property="og:type" content="{ogtype}">
<meta property="og:site_name" content="{site_name}">
<meta property="og:title" content="{ogtitle}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/assets/og-image.jpg?v=4">
<meta property="og:locale" content="{locale}">
<meta name="twitter:card" content="summary_large_image">

{css}
<style>
{style}
</style>
{ld}
</head>

<body>

{header}
"""

ARTICLE_STYLE = """.note-page h1{ font-size:clamp(18px,2.4vw,24px); line-height:1.4; margin:22px 0 0; letter-spacing:-.02em; }
@media (min-width:900px){ .note-page h1{ white-space:nowrap; } }
.note-kicker{ margin:22px 0 0; font-size:clamp(28px,4.6vw,44px); line-height:1.2; letter-spacing:-.01em; color:var(--ink); font-weight:900; padding-bottom:12px; border-bottom:3px solid var(--ink); }
.note-kicker a{ color:inherit; text-decoration:none; }
.note-sub{ margin:10px 0 0; font-size:17px; line-height:1.6; color:var(--ink-2); }
.note-date{ margin:8px 0 22px; font-size:13px; color:var(--muted); }
.note-page h2{ font-size:21px; margin:30px 0 4px; }
.note-page .gp-body a{ text-decoration:underline; text-underline-offset:3px; }
.note-page .gp-cta{ margin-top:30px; }
.note-fig{ margin:18px 0 4px; }
.note-fig img{ display:block; width:auto; max-width:100%; max-height:560px; height:auto; border-radius:12px; }"""

LIST_STYLE = """.news-h1{ font-size:clamp(30px,5vw,48px); line-height:1.2; font-weight:900; padding-bottom:12px; border-bottom:3px solid var(--ink); }
.news-list{ list-style:none; margin:0; padding:0; }
.news-item{ padding:26px 0 34px; border-bottom:1px solid var(--line); }
.news-item time{ font-size:13px; color:var(--muted); }
.news-title{ font-size:clamp(18px,2.4vw,24px); line-height:1.4; margin:6px 0 0; letter-spacing:-.02em; }
.news-title a{ color:var(--ink); text-decoration:none; }
.news-item .note-sub{ margin:8px 0 14px; font-size:17px; line-height:1.6; color:var(--ink-2); }
.news-item h2:not(.news-title){ font-size:21px; margin:30px 0 4px; }
.news-item .gp-body a{ text-decoration:underline; text-underline-offset:3px; }
.news-item .gp-cta{ margin-top:26px; }
.news-lead{ margin:14px 0 6px; font-size:16px; line-height:1.7; color:var(--ink-2); }
.news-item{ display:flex; gap:22px; align-items:flex-start; }
.news-txt{ flex:1; min-width:0; }
.news-pic{ flex:0 0 200px; margin-top:26px; }
.news-pic img{ display:block; width:200px; height:150px; object-fit:cover; border-radius:10px; }
.news-ex{ margin:0; font-size:16px; line-height:1.75; color:var(--ink-2); }
.news-more{ margin:10px 0 0; font-weight:700; }
.news-more a{ color:var(--ink); text-underline-offset:3px; }
@media (max-width:640px){ .news-item{ flex-direction:column; gap:0; } .news-pic{ flex-basis:auto; width:100%; margin-top:22px; } .news-pic img{ width:100%; height:auto; aspect-ratio:4/3; } }
.note-fig{ margin:18px 0 4px; }
.note-fig img{ display:block; width:auto; max-width:100%; max-height:560px; height:auto; border-radius:12px; }"""

MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]


def kdate(d, lang):
    y, m, dd = d.split("-")
    if lang == "en":
        return "%s %d, %s" % (MONTHS[int(m) - 1], int(dd), y)
    return "%s년 %d월 %d일" % (y, int(m), int(dd))


def alternates(ko_url, en_url):
    out = []
    if ko_url:
        out.append('<link rel="alternate" hreflang="ko" href="%s">' % ko_url)
    if en_url:
        out.append('<link rel="alternate" hreflang="en" href="%s">' % en_url)
    out.append('<link rel="alternate" hreflang="x-default" href="%s">' % (ko_url or en_url))
    return "\n".join(out)


def render_article(meta, L, ch, pair):
    header, footer, scripts, verif, css = ch
    url = "%s/%s/%s/" % (SITE, L["out"], meta["slug"])
    title_full = "%s — %s" % (meta["title"], L["section"])
    ko_url = "%s/news/%s/" % (SITE, meta["slug"]) if (L["lang"] == "ko" or pair) else None
    en_url = "%s/en/news/%s/" % (SITE, meta["slug"]) if (L["lang"] == "en" or pair) else None
    other = L["other_lang_link"].format(slug=meta["slug"] + "/") if pair else L["other_lang_link"].format(slug="")
    ld = {"@context": "https://schema.org", "@type": "Article", "headline": meta["title"], "description": meta["desc"],
          "datePublished": meta["date"], "dateModified": meta.get("updated", meta["date"]), "inLanguage": L["lang"], "mainEntityOfPage": url,
          "image": SITE + "/assets/og-image.jpg?v=4",
          "author": {"@type": "Organization", "name": L["by"], "url": SITE + "/" if L["lang"] == "ko" else SITE + "/en/"},
          "publisher": {"@type": "Organization", "name": L["by"], "url": SITE + "/", "logo": {"@type": "ImageObject", "url": SITE + "/assets/icon-512.png"}}}
    head = HEAD.format(lang=L["lang"], title=html.escape(title_full, quote=True), desc=html.escape(meta["desc"], quote=True), keywords=html.escape(meta.get("keywords", ""), quote=True),
                       url=url, alternates=alternates(ko_url, en_url), verif=verif, ogtype="article", site_name=L["by"], ogtitle=html.escape(meta["title"], quote=True), SITE=SITE, locale=L["locale"],
                       css=css, style=ARTICLE_STYLE, ld='<script type="application/ld+json">%s</script>' % json.dumps(ld, ensure_ascii=False),
                       header=header.replace("{OTHER_LANG}", other))
    body = """
<main id="main">
  <section class="showcase">
    <div class="wrap game-page note-page">
      <a class="backlink" href="%s">%s</a>
      <p class="note-kicker"><a href="/%s/">%s</a></p>
      <h1>%s</h1>
      <p class="note-sub">%s</p>
      <p class="note-date"><time datetime="%s">%s</time> · %s</p>

%s
      <p class="gp-cta"><a class="btn btn-primary" href="%s">%s</a></p>
    </div>
  </section>
</main>
""" % (L["back_href"], L["back"], L["out"], L["section"], html.escape(meta["title"], quote=False), inline(meta.get("sub", "")),
       meta["date"], kdate(meta["date"], L["lang"]), L["by"], body_html(meta["body"]), L["cta_href"], L["cta"])
    return head + body + "\n" + footer + "\n\n" + scripts + "\n</body>\n</html>\n"


def excerpt(md):
    # 목록에 보일 첫 문단(사진·소제목은 건너뛴다)과 첫 사진
    first, img = "", None
    for block in re.split(r"\n\s*\n", md):
        b = block.strip()
        m = re.fullmatch(r"!\[([^\]]*)\]\(([^)]+)\)", b)
        if m:
            img = img or (m.group(2), m.group(1))
        elif b and not b.startswith("## ") and not first:
            first = " ".join(l.strip() for l in b.splitlines())
    first = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", first)   # 목록에서는 링크 없이 글자만
    first = first.replace("**", "")
    return first, img


def render_list(posts, L, ch, pair_list):
    # 목록은 제목·날짜·부제·첫 문단·사진 한 장·더 읽기만 — 전문은 글 페이지에만 둔다.
    # 사장님 2026-09-25 "바꿔": 전문을 목록에도 펼치면 같은 글이 두 곳에 있고 목록 주제가 흐려진다(9/22 에는 전문 펼침이었다).
    header, footer, scripts, verif, css = ch
    items, ld_items = [], []
    for i, m in enumerate(posts):
        href = "/%s/%s/" % (L["out"], m["slug"])
        first, img = excerpt(m["body"])
        pic = ('<a class="news-pic" href="%s"><img src="%s" alt="%s" loading="lazy" decoding="async"></a>' % (href, html.escape(img[0]), html.escape(img[1]))) if img else ""
        items.append('        <li class="news-item">%s<div class="news-txt"><time datetime="%s">%s</time><h2 class="news-title"><a href="%s">%s</a></h2><p class="note-sub">%s</p><p class="news-ex">%s</p><p class="news-more"><a href="%s">%s</a></p></div></li>' % (
            pic, m["date"], kdate(m["date"], L["lang"]), href, html.escape(m["title"], quote=False), inline(m.get("sub", "")), html.escape(first, quote=False), href, L["more"]))
        ld_items.append({"@type": "ListItem", "position": i + 1, "url": SITE + href, "name": m["title"]})
    url = "%s/%s/" % (SITE, L["out"])
    ko_url = SITE + "/news/" if (L["lang"] == "ko" or pair_list) else None
    en_url = SITE + "/en/news/" if (L["lang"] == "en" or pair_list) else None
    other = L["other_lang_link"].format(slug="")
    ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": L["section"], "description": L["list_desc"], "url": url,
          "mainEntity": {"@type": "ItemList", "itemListElement": ld_items}}
    head = HEAD.format(lang=L["lang"], title=L["list_title"], desc=L["list_desc"], keywords=L["list_keywords"],
                       url=url, alternates=alternates(ko_url, en_url), verif=verif, ogtype="website", site_name=L["by"], ogtitle=L["section"], SITE=SITE, locale=L["locale"],
                       css=css, style=LIST_STYLE, ld='<script type="application/ld+json">%s</script>' % json.dumps(ld, ensure_ascii=False),
                       header=header.replace("{OTHER_LANG}", other))
    body = """
<main id="main">
  <section class="showcase">
    <div class="wrap game-page">
      <a class="backlink" href="%s">%s</a>
      <h1 class="news-h1">%s</h1>
      <p class="news-lead">%s</p>
      <ul class="news-list">
%s
      </ul>
      <p class="gp-cta"><a class="btn btn-primary" href="%s">%s</a></p>
    </div>
  </section>
</main>
""" % (L["back_href"], L["back"], L["section"], html.escape(L["list_desc"], quote=False), "\n".join(items), L["cta_href"], L["cta"])
    return head + body + "\n" + footer + "\n\n" + scripts + "\n</body>\n</html>\n"


def write(path, s):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    io.open(tmp, "w", encoding="utf-8", newline="").write(s)
    os.replace(tmp, path)


def main():
    all_posts = {}
    for lang, L in LANG.items():
        posts = [parse(p) for p in sorted(glob.glob(os.path.join(ROOT, "news", L["posts"], "*.md")))]
        posts.sort(key=lambda m: m["date"], reverse=True)
        all_posts[lang] = posts
    slugs = {lang: {m["slug"] for m in ps} for lang, ps in all_posts.items()}
    for lang, L in LANG.items():
        ch = chrome(L)
        other = "en" if lang == "ko" else "ko"
        for m in all_posts[lang]:
            pair = m["slug"] in slugs[other]
            write(os.path.join(ROOT, *L["out"].split("/"), m["slug"], "index.html"), render_article(m, L, ch, pair))
            print("글:", "/%s/%s/" % (L["out"], m["slug"]), m["title"], "(+짝)" if pair else "")
        if all_posts[lang]:
            pair_list = bool(all_posts[other])
            write(os.path.join(ROOT, *L["out"].split("/"), "index.html"), render_list(all_posts[lang], L, ch, pair_list))
            print("목록: /%s/  (%d편)" % (L["out"], len(all_posts[lang])))
    print("다음: python make-sitemap.py → 커밋 → 푸시. 색인 요청은 글 주소와 목록 주소만.")


if __name__ == "__main__":
    main()
