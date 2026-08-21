#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
푸시할 때마다 '바뀐 페이지'만 골라 IndexNow 로 알립니다. (빙·네이버가 받습니다)

돌아가는 차례
  1) 이번 푸시에서 바뀐 .html 을 깃에서 뽑습니다
  2) 색인에 넣으면 안 되는 것을 걸러 냅니다 (noindex, /play/, _new/ 등)
  3) 깃허브 페이지가 실제로 새 내용을 내보낼 때까지 기다립니다
     — 이게 없으면 빙이 옛 페이지를 읽어 갑니다
  4) IndexNow 에 한 번에 보냅니다

혼자 돌려볼 때:  python .github/scripts/indexnow.py --dry
"""
import hashlib
import json
import os
import subprocess
import sys
import time
import urllib.request

SITE = "https://oreumgames.com"
KEY = "4f167099ffacceb53fefdcf6b0879417"
KEY_URL = "%s/%s.txt" % (SITE, KEY)
ENDPOINT = "https://api.indexnow.org/indexnow"

# 색인에 넣지 않을 자리
SKIP_DIRS = ("_new/", ".github/", "board-setup/")
SKIP_PARTS = ("/play/",)              # 게임 알맹이는 설명 페이지가 대표합니다
SKIP_MARKS = ('name="robots" content="noindex"',)

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def sh(*args):
    return subprocess.run(args, cwd=ROOT, capture_output=True, text=True,
                          encoding="utf-8", errors="replace").stdout.strip()


def changed_html():
    """이번 푸시에서 바뀐 html. 첫 커밋이면 전부."""
    before = os.environ.get("GITHUB_EVENT_BEFORE") or ""
    if before and set(before) != {"0"}:
        diff = sh("git", "diff", "--name-only", before, "HEAD")
    else:
        diff = sh("git", "diff", "--name-only", "HEAD~1", "HEAD")
    out = []
    for line in diff.splitlines():
        line = line.strip().replace("\\", "/")
        if not line.endswith(".html"):
            continue
        if any(line.startswith(d) or ("/" + d) in ("/" + line) for d in SKIP_DIRS):
            continue
        if any(part in ("/" + line) for part in SKIP_PARTS):
            continue
        if os.path.basename(line).startswith("_"):     # 개발용 찌꺼기
            continue
        out.append(line)
    return out


def to_url(path):
    """games/mini/pairboom/index.html -> https://oreumgames.com/games/mini/pairboom/"""
    if path.endswith("/index.html"):
        return SITE + "/" + path[:-len("index.html")]
    if path == "index.html":
        return SITE + "/"
    return SITE + "/" + path


def indexable(path):
    full = os.path.join(ROOT, path)
    if not os.path.exists(full):        # 지워진 파일
        return False
    try:
        s = open(full, encoding="utf-8", errors="replace").read()
    except OSError:
        return False
    return not any(m in s for m in SKIP_MARKS)


def local_hash(path):
    with open(os.path.join(ROOT, path), "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def live_hash(url):
    req = urllib.request.Request(url + "?_in=%d" % time.time(),
                                 headers={"User-Agent": "oreum-indexnow"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return hashlib.sha256(r.read()).hexdigest()


def wait_deployed(path, url, minutes=12):
    """깃허브 페이지가 새 내용을 내보낼 때까지. 못 기다리면 False."""
    want = local_hash(path)
    end = time.time() + minutes * 60
    while time.time() < end:
        try:
            if live_hash(url) == want:
                return True
        except Exception as e:
            print("   아직: %s" % e)
        time.sleep(15)
    return False


def send(urls):
    body = json.dumps({
        "host": SITE.split("//", 1)[1],
        "key": KEY,
        "keyLocation": KEY_URL,
        "urlList": urls,
    }).encode("utf-8")
    req = urllib.request.Request(ENDPOINT, data=body,
                                 headers={"Content-Type": "application/json; charset=utf-8"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status, r.read().decode("utf-8", "replace")[:200]


def main():
    dry = "--dry" in sys.argv
    paths = [p for p in changed_html() if indexable(p)]
    if not paths:
        print("바뀐 페이지가 없습니다. 알릴 것 없음.")
        return 0

    urls = sorted({to_url(p) for p in paths})
    print("바뀐 페이지 %d개:" % len(urls))
    for u in urls:
        print("   " + u)

    if dry:
        print("(--dry 라 보내지 않았습니다)")
        return 0

    # 대표 한 장이 실제로 올라갔는지 확인하고 보냅니다
    probe = paths[0]
    print("\n깃허브 페이지에 올라갈 때까지 기다립니다 — %s" % to_url(probe))
    if wait_deployed(probe, to_url(probe)):
        print("   올라갔습니다.")
    else:
        print("   ★ 시간 안에 못 봤습니다. 그래도 보냅니다 (빙이 나중에 다시 읽습니다).")

    status, text = send(urls)
    print("\nIndexNow 응답: %s %s" % (status, text))
    return 0 if status in (200, 202) else 1


if __name__ == "__main__":
    sys.exit(main())
