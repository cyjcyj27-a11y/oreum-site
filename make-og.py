# -*- coding: utf-8 -*-
"""
미리보기 그림(og:image) 자동 생성 — oreum-site (2026-09-22)

쓰는 법 (이 폴더에서):
    python make-og.py

games/index.html 의 카드 순서에서 최신 게임을 골라 3×2 모음 그림을 굽습니다.
  · GAMES 칸(CARDS:start 뒤) 앞 3장 + 플래시 칸(FLASH:start 뒤) 앞 3장
  · 결과: assets/og-image.jpg (1200×630) — 대문·GAMES 허브(한·영)가 이 파일 하나를 씁니다
새 게임을 올리고 카드를 앞에 넣은 뒤 이걸 한 번 돌리면 카카오톡·디스코드 미리보기가 최신 게임으로 바뀝니다.
(카카오톡은 주소별로 미리보기를 오래 기억하므로, 안 바뀌면 developers.kakao.com/tool/clear/og 에서 초기화)

사장님 2026-09-22: "카드 이미지는 일일이 최신 게임으로 고쳐야 뜨냐" → 이 스크립트가 대신 한다. 새 게임 출시 체크리스트에 들어 있다.
"""
import io, os, re
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "assets", "og-image.jpg")
W, H, GAP, COLS, ROWS = 1200, 630, 10, 3, 2


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
    # 카톡 등은 1200×630 을 가운데 정사각형으로 잘라 보이기도 한다(사장님 2026-09-22 "카드가 잘려 보인다")
    # → 카드 6장을 가운데 630×630 안에 2열×3줄로 넣어, 정사각형으로 잘려도 여섯 장이 다 보이게 한다. 양옆은 로고.
    hub = io.open(os.path.join(ROOT, "games", "index.html"), encoding="utf-8").read()
    names = cards_after(hub, "<!-- CARDS:start -->", 3) + cards_after(hub, "<!-- FLASH:start -->", 3)
    S = H                      # 가운데 정사각형 한 변 630
    cols, rows, gap = 2, 3, 10
    cw = (S - gap * (cols + 1)) // cols          # 300
    ch = (S - gap * (rows + 1)) // rows          # 196
    x0 = (W - S) // 2
    bg = Image.new("RGB", (W, H), (248, 245, 236))
    for i, n in enumerate(names[:6]):
        im = Image.open(os.path.join(ROOT, "assets", n)).convert("RGB")
        w, h = im.size
        tw = int(h * cw / ch)
        if tw < w:
            im = im.crop(((w - tw) // 2, 0, (w - tw) // 2 + tw, h))
        else:
            th = int(w * ch / cw)
            im = im.crop((0, (h - th) // 2, w, (h - th) // 2 + th))
        im = im.resize((cw, ch), Image.LANCZOS)
        x = x0 + gap + (i % cols) * (cw + gap)
        y = gap + (i // cols) * (ch + gap)
        mask = Image.new("L", (cw, ch), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, cw - 1, ch - 1), radius=16, fill=255)
        bg.paste(im, (x, y), mask)
    # 양옆 여백에 로고
    try:
        logo = Image.open(os.path.join(ROOT, "assets", "logo-full.webp")).convert("RGBA")
        lw = 150; lh = int(logo.size[1] * lw / logo.size[0]); logo = logo.resize((lw, lh), Image.LANCZOS)
        for lx in ((x0 - lw) // 2, x0 + S + (x0 - lw) // 2):
            bg.paste(logo, (lx, (H - lh) // 2), logo)
    except Exception as e:
        print("logo skip:", e)
    tmp = OUT + ".tmp"
    bg.save(tmp, "JPEG", quality=86, optimize=True)
    os.replace(tmp, OUT)
    print("og-image.jpg:", ", ".join(n.replace("-shot.webp", "") for n in names[:6]), "|", os.path.getsize(OUT), "bytes")
    print("다음: 대문·허브의 og:image ?v= 를 하나 올리고(카카오 캐시) 커밋·푸시")


if __name__ == "__main__":
    main()
