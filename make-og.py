# -*- coding: utf-8 -*-
"""
미리보기 그림(og:image) 자동 생성 — oreum-site (2026-09-22)

쓰는 법 (이 폴더에서):
    python make-og.py

games/index.html 의 카드 순서에서 최신 게임을 골라 3×2 모음 그림을 굽습니다.
  · 가운데: GAMES 칸 앞 3장 + 플래시 칸 앞 3장 / 양옆: 그다음 4장씩
  · 결과: assets/og-image.jpg (1200×630) — 대문·GAMES 허브(한·영)가 이 파일 하나를 씁니다
새 게임을 올리고 카드를 앞에 넣은 뒤 이걸 한 번 돌리면 카카오톡·디스코드 미리보기가 최신 게임으로 바뀝니다.
(카카오톡은 주소별로 미리보기를 오래 기억하므로, 안 바뀌면 developers.kakao.com/tool/clear/og 에서 초기화)

사장님 2026-09-22: "카드 이미지는 일일이 최신 게임으로 고쳐야 뜨냐" → 이 스크립트가 대신 한다. 새 게임 출시 체크리스트에 들어 있다.
"""
import io, os, re
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "assets", "og-image.jpg")
W, H = 1200, 630


def cards_after(html, marker, n):
    i = html.find(marker)
    seg = html[i:]
    shots = re.findall(r'src="/assets/([a-z0-9-]+-shot\.webp)', seg)
    out = []
    for s in shots:
        if s not in out:
            out.append(s)
        if len(out) == n:
            break
    return out


def main():
    # 모바일 카톡은 1200×630 을 가운데 630×630 으로, PC 링크 카드는 양옆을 약 75px씩 잘라 보인다.
    # 사장님 2026-09-22 "카드가 잘려 보인다" → 가운데 정사각형(x 285~915)에 카드 6장을 2열×3줄로.
    # 사장님 2026-09-26 "카드만 보여야지" → 양옆 로고를 빼고 카드 8장(4줄×2)으로 채운다.
    #   양옆 카드는 x 90~285, 915~1110 안에 두어 PC 에서 안 잘리고, 원본 비율 그대로라 제목도 안 잘린다.
    hub = io.open(os.path.join(ROOT, "games", "index.html"), encoding="utf-8").read()
    g = cards_after(hub, "<!-- CARDS:start -->", 7)
    f = cards_after(hub, "<!-- FLASH:start -->", 7)
    center, side = g[:3] + f[:3], g[3:7] + f[3:7]
    bg = Image.new("RGB", (W, H), (248, 245, 236))

    def put(n, x, y, cw, ch):
        im = Image.open(os.path.join(ROOT, "assets", n)).convert("RGB")
        w, h = im.size
        tw = int(h * cw / ch)
        if tw < w:
            im = im.crop(((w - tw) // 2, 0, (w - tw) // 2 + tw, h))
        else:
            th = int(w * ch / cw)
            im = im.crop((0, (h - th) // 2, w, (h - th) // 2 + th))
        im = im.resize((cw, ch), Image.LANCZOS)
        mask = Image.new("L", (cw, ch), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, cw - 1, ch - 1), radius=16, fill=255)
        bg.paste(im, (x, y), mask)

    gap = 10
    cw, ch = 300, (H - gap * 4) // 3             # 가운데 카드 300×196
    for i, n in enumerate(center):
        put(n, 295 + (i % 2) * (cw + gap), gap + (i // 2) * (ch + gap), cw, ch)
    sw = 195; sh = round(sw * ch / cw); sg = (H - 4 * sh) // 5   # 양옆 카드 195×127
    for i, n in enumerate(side):
        put(n, 285 - sw if i < 4 else 915, sg + (i % 4) * (sh + sg), sw, sh)
    names = center + side
    tmp = OUT + ".tmp"
    bg.save(tmp, "JPEG", quality=86, optimize=True)
    os.replace(tmp, OUT)
    print("og-image.jpg:", ", ".join(n.replace("-shot.webp", "") for n in names), "|", os.path.getsize(OUT), "bytes")
    print("다음: 대문·허브의 og:image ?v= 를 하나 올리고(카카오 캐시) 커밋·푸시")


if __name__ == "__main__":
    main()
