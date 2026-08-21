# -*- coding: utf-8 -*-
# 글꼴에서 게임이 실제로 쓰는 글자만 남깁니다.
# 지금은 한글 11,172자가 통째로 들어 있어 1.5MB 입니다.
import io, os, re, base64, sys
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen

BASE = os.path.join(u"C:\\", u"Users", u"cyjcy", u"Downloads", u"\ud074\ub85c\ub4dc\uac8c\uc784")
SITE = os.path.join(BASE, u"oreum-site", u"games", u"mini", u"pairboom")
LOCAL = os.path.join(BASE, u"\ubbf8\ub2c8\uac8c\uc784", u"pairboom")
SP = os.path.join(u"C:\\", u"Users", u"cyjcy", u"AppData", u"Local", u"Temp", u"claude",
                  u"C--Users-cyjcy-Downloads------", u"aae04211-0c61-4d50-bbb9-7341da03d39e", u"scratchpad")

CSS = os.path.join(SITE, u"font", u"game-fonts.css")
css = io.open(CSS, encoding='utf-8').read()
print(u"지금 CSS %.0f KB" % (len(css)/1024.0))

# ── 1) 안에 든 글꼴을 꺼냅니다 ──
blobs = {}
for m in re.finditer(u"font-family:'(\\w+)'.*?base64,([A-Za-z0-9+/=]+)", css, re.S):
    name, b64 = m.group(1), m.group(2)
    raw = base64.b64decode(b64)
    p = os.path.join(SP, name + u".woff2")
    open(p, 'wb').write(raw)
    blobs[name] = p
    print(u"  %-12s %.0f KB (글자로는 %.0f KB)" % (name, len(raw)/1024.0, len(b64)/1024.0))

# ── 2) 게임이 쓰는 글자 모으기 ──
html = io.open(os.path.join(SITE, u"index.html"), encoding='utf-8').read()
chars = set(html)
chars |= set(io.open(os.path.join(LOCAL, u"index.html"), encoding='utf-8').read())
# 늘 넣어 두는 것들 — 숫자·기호는 화면에서 만들어 쓰는 일이 많습니다
chars |= set(u"0123456789")
chars |= set(u"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz")
chars |= set(u" !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~")
chars |= set(u"×·…—–‘’“”★☆←→↑↓♪♥○●◆■□▲▼")
chars = {c for c in chars if ord(c) > 31}
hangul = sorted(c for c in chars if 0xAC00 <= ord(c) <= 0xD7A3)
print(u"\n쓰는 글자 %d개 (그 중 한글 %d자)" % (len(chars), len(hangul)))

TITLE = set(u"PAIRBOOM!") | set(u"0123456789") | set(u"ABCDEFGHIJKLMNOPQRSTUVWXYZ")
WANT = {u"WaterDrop": TITLE, u"Supermagic": chars}

# ── 3) 남길 글자만 남기고 굽기 ──
out = {}
for name, p in blobs.items():
    want = WANT[name]
    dst = os.path.join(SP, name + u"-sub.woff2")
    args = [p, u"--output-file=" + dst, u"--flavor=woff2",
            u"--unicodes=" + u",".join(u"U+%04X" % ord(c) for c in sorted(want)),
            u"--layout-features=*", u"--no-hinting", u"--desubroutinize"]
    subset.main(args)
    out[name] = dst
    before, after = os.path.getsize(p), os.path.getsize(dst)
    print(u"  %-12s %.0f KB -> %.1f KB  (%.0f%% 줄임, 글자 %d개)"
          % (name, before/1024.0, after/1024.0, (1-after/float(before))*100, len(want)))

# ── 4) 검사: 부탁한 글자가 정말 다 들어 있고, 빈 글자가 아닌가 ──
#    (카페24 써라운드에서 × 와 — 가 '있는데 빈 그림'이라 사라졌던 적이 있습니다)
print()
for name, dst in out.items():
    f = TTFont(dst)
    cmap = f.getBestCmap()
    gs = f.getGlyphSet()
    missing, empty = [], []
    for c in sorted(WANT[name]):
        if c.isspace(): continue
        g = cmap.get(ord(c))
        if g is None: missing.append(c); continue
        pen = BoundsPen(gs)
        try: gs[g].draw(pen)
        except Exception: pass
        if pen.bounds is None: empty.append(c)
    print(u"  %-12s 빠진 글자 %d개 %s · 빈 그림 %d개 %s"
          % (name, len(missing), u"".join(missing[:20]) or u"없음",
             len(empty), u"".join(empty[:20]) or u"없음"))
    f.close()

# ── 5) 새 CSS ──
def blk(fam, path, note):
    b = base64.b64encode(open(path,'rb').read()).decode('ascii')
    return (u"/* %s */\n@font-face{\n  font-family:'%s';\n  font-style:normal;\n"
            u"  font-weight:400;\n  font-display:swap;\n"
            u"  src:url(data:font/woff2;charset=utf-8;base64,%s) format('woff2');\n}\n") % (note, fam, b)

head = (u"/* PAIRBOOM!! 글꼴 — 출처와 라이선스는 같은 폴더의 글꼴출처.txt 참고.\n"
        u"   2026-08-21: 한글 11,172자가 통째로 들어 있어 1.5MB 였습니다.\n"
        u"   게임이 실제로 쓰는 글자만 남겨 다시 구웠습니다.\n"
        u"   WaterDrop 은 제목(h1) 에만 쓰므로 영문·숫자만,\n"
        u"   Supermagic 은 본문에 쓰므로 index.html 에 나오는 글자 전부를 남겼습니다.\n\n"
        u"   ★ 게임에 새 글월을 넣을 때 주의 ★\n"
        u"   여기 없는 글자를 쓰면 그 글자만 맑은 고딕으로 튀어 보입니다.\n"
        u"   글월을 고친 뒤에는 도구로 이 파일을 다시 구우세요.\n"
        u"   파일에 넣지 않고 글자로 담아 두는 까닭은, 파일을 그냥 열었을 때(file://)\n"
        u"   브라우저가 글꼴 파일 읽기를 막기 때문입니다. */\n\n")

new = head + blk(u"WaterDrop", out[u"WaterDrop"], u"물방울체 — 제목 전용 (영문·숫자만)") \
           + blk(u"Supermagic", out[u"Supermagic"], u"카페24 슈퍼매직 — 본문 (쓰는 글자만)")

for D in (SITE, LOCAL):
    p = os.path.join(D, u"font", u"game-fonts.css")
    if not os.path.isdir(os.path.dirname(p)): print(u"없음 " + D[-20:]); continue
    io.open(p, 'w', encoding='utf-8').write(new)
    print(u"\n%s : %.0f KB -> %.0f KB" % (p[-40:], len(css)/1024.0, len(new)/1024.0))
