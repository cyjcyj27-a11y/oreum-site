# -*- coding: utf-8 -*-
"""
개발뉴스 페이지 생성기 — oreum-site (2026-09-22)

쓰는 법 (이 폴더에서):
    python make-news.py

news/posts/*.md 를 전부 읽어
  · news/<slug>/index.html  (글 한 장, Article JSON-LD 포함)
  · news/index.html         (목록, 최신 글이 위)
를 새로 씁니다. 그다음 python make-sitemap.py 를 돌리고 커밋하면 끝입니다.

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

규칙: 제목·본문에 # 기호가 남지 않게 여기서 전부 HTML 로 바꾼다. 꼭지 이름은 "오름게임즈 인디게임 개발뉴스"(사장님 2026-09-22).
"""
import io, os, re, glob, json, html

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = "https://oreumgames.com"
SECTION = "오름게임즈 인디게임 개발뉴스"
TEMPLATE_PAGE = os.path.join(ROOT, "games", "flash", "yut", "index.html")   # 머리·꼬리·스크립트를 여기서 빌린다


def chrome():
    s = io.open(TEMPLATE_PAGE, encoding="utf-8").read()
    header = re.search(r"<header.*?</header>", s, re.S).group(0)
    header = re.sub(r'<a href="/en/[^"]*" lang="en" hreflang="en">EN</a>', '<a href="/en/" lang="en" hreflang="en">EN</a>', header)
    if 'href="/news/">NEWS' not in header:
        header = header.replace('<a href="/apps/">APPS</a>', '<a href="/apps/">APPS</a>\n      <a href="/news/">NEWS</a>', 1)
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
        if b.startswith("## "):
            out.append("      <h2>%s</h2>" % inline(b[3:].strip()))
        else:
            out.append('      <p class="gp-body">%s</p>' % inline(" ".join(l.strip() for l in b.splitlines())))
    return "\n".join(out)


HEAD = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="keywords" content="{keywords}">
<link rel="canonical" href="{url}">
{verif}
<meta name="theme-color" content="#f8f5ec">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/assets/icon-512.png" type="image/png" sizes="512x512">
<link rel="apple-touch-icon" href="/assets/icon-180.png">
<link rel="manifest" href="/manifest.webmanifest">

<meta property="og:type" content="{ogtype}">
<meta property="og:site_name" content="오름게임즈">
<meta property="og:title" content="{ogtitle}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/assets/og-image.png?v=2">
<meta property="og:locale" content="ko_KR">
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
.note-page .gp-cta{ margin-top:30px; }"""

LIST_STYLE = """.news-h1{ font-size:clamp(30px,5vw,48px); line-height:1.2; font-weight:900; }
.news-list{ list-style:none; margin:18px 0 0; padding:0; }
.news-list li{ border-top:1px solid var(--line); padding:16px 0; }
.news-list a{ font-size:24px; font-weight:800; color:var(--ink); line-height:1.4; }
.news-list p{ margin:6px 0 0; font-size:15px; line-height:1.7; color:var(--ink-2); }
.news-list time{ font-size:13px; color:var(--muted); }"""


def kdate(d):
    y, m, dd = d.split("-")
    return "%s년 %d월 %d일" % (y, int(m), int(dd))


def render_article(meta, ch):
    header, footer, scripts, verif, css = ch
    url = "%s/news/%s/" % (SITE, meta["slug"])
    title_full = "%s — %s" % (meta["title"], SECTION)
    ld = {"@context": "https://schema.org", "@type": "Article", "headline": meta["title"], "description": meta["desc"],
          "datePublished": meta["date"], "dateModified": meta.get("updated", meta["date"]), "inLanguage": "ko", "mainEntityOfPage": url,
          "image": SITE + "/assets/og-image.png?v=2",
          "author": {"@type": "Organization", "name": "오름게임즈", "url": SITE + "/"},
          "publisher": {"@type": "Organization", "name": "오름게임즈", "url": SITE + "/", "logo": {"@type": "ImageObject", "url": SITE + "/assets/icon-512.png"}}}
    head = HEAD.format(title=html.escape(title_full, quote=True), desc=html.escape(meta["desc"], quote=True), keywords=html.escape(meta.get("keywords", ""), quote=True),
                       url=url, verif=verif, ogtype="article", ogtitle=html.escape(meta["title"], quote=True), SITE=SITE, css=css, style=ARTICLE_STYLE,
                       ld='<script type="application/ld+json">%s</script>' % json.dumps(ld, ensure_ascii=False), header=header)
    body = """
<main id="main">
  <section class="showcase">
    <div class="wrap game-page note-page">
      <a class="backlink" href="/games/">← 게임 목록</a>
      <p class="note-kicker"><a href="/news/">%s</a></p>
      <h1>%s</h1>
      <p class="note-sub">%s</p>
      <p class="note-date"><time datetime="%s">%s</time> · 오름게임즈</p>

%s
      <p class="gp-cta"><a class="btn btn-primary" href="/games/">🎮 게임 목록 보기</a></p>
    </div>
  </section>
</main>
""" % (SECTION, html.escape(meta["title"], quote=False), inline(meta.get("sub", "")), meta["date"], kdate(meta["date"]), body_html(meta["body"]))
    return head + body + "\n" + footer + "\n\n" + scripts + "\n</body>\n</html>\n"


def render_list(posts, ch):
    header, footer, scripts, verif, css = ch
    items = []
    for m in posts:
        items.append('        <li><time datetime="%s">%s</time><br><a href="/news/%s/">%s</a><p>%s</p></li>' % (
            m["date"], m["date"], m["slug"], html.escape(m["title"], quote=False), inline(m.get("sub", ""))))
    desc = "한국의 작은 인디게임 스튜디오 오름게임즈의 개발뉴스. 설치 없이 브라우저에서 바로 하는 인디게임을 어떻게 만들고, 무엇을 배우고, 어디에 내는지 기록합니다."
    head = HEAD.format(title="%s — 설치 없이 하는 인디게임을 만드는 이야기" % SECTION, desc=desc, keywords="인디게임, 인디게임 개발, 인디게임 뉴스, 인디게임 사이트, 웹게임 개발, 오름게임즈",
                       url=SITE + "/news/", verif=verif, ogtype="website", ogtitle=SECTION, SITE=SITE, css=css, style=LIST_STYLE, ld="", header=header)
    body = """
<main id="main">
  <section class="showcase">
    <div class="wrap game-page">
      <a class="backlink" href="/games/">← 게임 목록</a>
      <h1 class="news-h1">%s</h1>
      <p class="gp-line">설치 없이 브라우저에서 바로 하는 인디게임을 만드는 이야기. 무엇을 만들었고, 어디서 막혔고, 어디에 냈는지 적습니다.</p>
      <ul class="news-list">
%s
      </ul>
    </div>
  </section>
</main>
""" % (SECTION, "\n".join(items))
    return head + body + "\n" + footer + "\n\n" + scripts + "\n</body>\n</html>\n"


def write(path, s):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    io.open(tmp, "w", encoding="utf-8", newline="").write(s)
    os.replace(tmp, path)


def main():
    ch = chrome()
    posts = [parse(p) for p in sorted(glob.glob(os.path.join(ROOT, "news", "posts", "*.md")))]
    posts.sort(key=lambda m: m["date"], reverse=True)
    for m in posts:
        write(os.path.join(ROOT, "news", m["slug"], "index.html"), render_article(m, ch))
        print("글:", "/news/%s/" % m["slug"], m["title"])
    write(os.path.join(ROOT, "news", "index.html"), render_list(posts, ch))
    print("목록: /news/  (%d편)" % len(posts))
    print("다음: python make-sitemap.py → 커밋 → 푸시. 색인 요청은 글 주소와 /news/ 만.")


if __name__ == "__main__":
    main()
