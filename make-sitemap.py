# -*- coding: utf-8 -*-
"""
사이트맵 자동 생성기 — oreum-site

쓰는 법 (이 폴더에서):
    python make-sitemap.py

폴더 안의 index.html 을 전부 찾아서 sitemap.xml 을 새로 씁니다.
페이지를 추가하거나 지운 뒤 이걸 한 번 돌리고 커밋하면 끝입니다.
손으로 sitemap.xml 을 고칠 일이 없습니다.
"""
import os, io, re, datetime

BASE = "https://oreumgames.com"

# 이 폴더들은 사이트맵에 넣지 않습니다
SKIP_DIRS = {".git", "assets", "board-setup", "_new"}

# 주소별 중요도 — 앞부분이 맞으면 그 값을 씁니다 (위에서부터 먼저 맞는 것)
PRIORITY = [
    ("/games/",   "0.9"),
    ("/apps/",    "0.8"),
    ("/board/",   "0.6"),
    ("/guide/",   "0.6"),
    ("/support/", "0.4"),
    ("/privacy/", "0.3"),
]

def priority_of(path):
    if path == "/":
        return "1.0"
    for prefix, p in PRIORITY:
        if path.startswith(prefix) or path.startswith("/en" + prefix):
            return p
    return "0.5"

def find_pages(root="."):
    """index.html 이 있는 폴더를 주소로 바꿔 모읍니다 (noindex 페이지는 뺍니다)"""
    out = []
    for dirpath, dirnames, files in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".")]
        if "index.html" not in files:
            continue
        html = io.open(os.path.join(dirpath, "index.html"), encoding="utf-8").read()
        if re.search(r'name="robots"[^>]*noindex', html):
            continue  # 검색 노출을 막아둔 페이지는 사이트맵에서도 뺀다
        rel = os.path.relpath(dirpath, root).replace("\\", "/")
        path = "/" if rel == "." else "/" + rel + "/"
        out.append(path)
    return sorted(out)

def main():
    pages = find_pages()

    # 한국어판 기준으로 짝을 짓습니다 (/games/lulu/ 와 /en/games/lulu/ 는 한 쌍)
    ko = [p for p in pages if not p.startswith("/en/") and p != "/en/"]
    today = datetime.date.today().isoformat()

    body = []
    for k in ko:
        e = "/en" + k if k != "/" else "/en/"
        has_en = e in pages
        pri = priority_of(k)
        for loc in ([k, e] if has_en else [k]):
            body.append(
f"""  <url>
    <loc>{BASE}{loc}</loc>
    <xhtml:link rel="alternate" hreflang="ko" href="{BASE}{k}"/>"""
+ (f"""
    <xhtml:link rel="alternate" hreflang="en" href="{BASE}{e}"/>""" if has_en else "")
+ f"""
    <xhtml:link rel="alternate" hreflang="x-default" href="{BASE}{k}"/>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>{pri}</priority>
  </url>
""")

    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
           '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
           + "".join(body) + "</urlset>\n")

    io.open("sitemap.xml", "w", encoding="utf-8", newline="\n").write(xml)

    print("sitemap.xml written")
    print("  pages:", xml.count("<loc>"))
    for p in ko:
        print("   ", p, "(+en)" if ("/en" + p if p != "/" else "/en/") in pages else "")

if __name__ == "__main__":
    main()
