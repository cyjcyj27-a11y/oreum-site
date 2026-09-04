#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
지표 스냅샷 — Abacus 카운터 100개쯤을 서버(깃허브 액션)에서 천천히 읽어 stats.json 한 장으로 만듭니다.

왜: stats.html 이 브라우저에서 카운터를 하나씩 읽으면 Abacus 속도 제한(10초에 30번) 때문에 40~50초가 걸립니다.
    액션이 20분마다 미리 읽어 두면 페이지는 JSON 한 장만 받아 바로 그리고, '오늘' 같은 몇 칸만 실시간으로 덧읽습니다.

어디에: 'stats' 브랜치(main 과 따로)에 stats.json 으로 커밋합니다. 페이지는
        https://raw.githubusercontent.com/cyjcyj27-a11y/oreum-site/stats/stats.json 을 읽습니다.

읽을 칸 이름은 stats.html 의 `var keys = [...]` 와 `var GAMES = [...]` 에서 뽑습니다 — 한 곳만 고치면 됩니다.

혼자 돌려볼 때:  python .github/scripts/stats_snapshot.py --out stats.json   (브랜치 푸시는 안 함)
"""
import datetime
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
NS = "oreumgames"
BASE = "https://abacus.jasoncameron.dev/get/%s/" % NS
CHUNK, GAP = 5, 2.0          # 5개씩 2초 — 10초에 25번, 제한(30번) 안쪽


def kst_today():
    return (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=9)).strftime("%Y-%m-%d")


def keys_from_html():
    html = open(os.path.join(ROOT, "stats.html"), encoding="utf-8").read()
    m = re.search(r"var keys = \[(.*?)\];", html, re.S)
    keys = re.findall(r"'([a-z0-9_]+)'", m.group(1))
    keys = [k for k in keys if k != "day_"]          # 'day_' + today 는 따로 넣는다
    keys.append("day_" + kst_today())
    g = re.search(r"var GAMES = \[(.*?)\];", html, re.S)
    slugs = re.findall(r"\['[^']*',\s*'([a-z0-9-]+)'\]", g.group(1))
    for s in slugs:
        keys += ["pv_game_" + s, "rounds_" + s, "min_" + s]
    return keys, slugs


def get(key, tries=0):
    """404/400 = 아직 안 세어진 칸(0). 429 나 네트워크 오류는 쉬었다 다시."""
    try:
        with urllib.request.urlopen(urllib.request.Request(BASE + key, headers={"User-Agent": "oreum-stats-snapshot/1.0"}), timeout=10) as r:
            return int(json.load(r).get("value", 0))
    except urllib.error.HTTPError as e:
        if e.code in (404, 400):
            return 0
    except Exception:
        pass
    if tries >= 5:
        return None
    time.sleep(1.5 * (tries + 1))
    return get(key, tries + 1)


def main():
    out_path = None
    if "--out" in sys.argv:
        out_path = sys.argv[sys.argv.index("--out") + 1]
    keys, slugs = keys_from_html()
    values, missing = {}, []
    for i in range(0, len(keys), CHUNK):
        for k in keys[i:i + CHUNK]:
            v = get(k)
            if v is None:
                missing.append(k)
            else:
                values[k] = v
        time.sleep(GAP)
        print("  %d/%d" % (min(i + CHUNK, len(keys)), len(keys)), flush=True)
    snap = {"at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "kst_day": kst_today(),
            "keys": len(keys), "missing": missing, "games": slugs, "values": values}
    text = json.dumps(snap, ensure_ascii=False, separators=(",", ":"))
    if out_path:
        open(out_path, "w", encoding="utf-8").write(text)
        print("wrote", out_path, len(values), "values,", len(missing), "missing")
        return
    # ── 'stats' 브랜치에 커밋 (액션 안에서) ──
    work = os.path.join(ROOT, "_stats_branch")
    subprocess.run(["git", "worktree", "remove", "--force", work], cwd=ROOT, capture_output=True)
    has = subprocess.run(["git", "ls-remote", "--heads", "origin", "stats"], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    if has:
        subprocess.run(["git", "fetch", "origin", "stats"], cwd=ROOT, check=True)
        subprocess.run(["git", "worktree", "add", work, "origin/stats"], cwd=ROOT, check=True)
        subprocess.run(["git", "checkout", "-B", "stats"], cwd=work, check=True)
    else:
        subprocess.run(["git", "worktree", "add", "--detach", work], cwd=ROOT, check=True)
        subprocess.run(["git", "checkout", "--orphan", "stats"], cwd=work, check=True)
        subprocess.run(["git", "rm", "-rfq", "."], cwd=work, capture_output=True)
        open(os.path.join(work, "README.md"), "w", encoding="utf-8").write("# stats\n\n지표 스냅샷 브랜치. 깃허브 액션이 20분마다 stats.json 을 갱신합니다. 손으로 고치지 않습니다.\n")
    open(os.path.join(work, "stats.json"), "w", encoding="utf-8").write(text)
    subprocess.run(["git", "config", "user.name", "stats-bot"], cwd=work, check=True)
    subprocess.run(["git", "config", "user.email", "stats-bot@users.noreply.github.com"], cwd=work, check=True)
    subprocess.run(["git", "add", "-A"], cwd=work, check=True)
    st = subprocess.run(["git", "status", "--porcelain"], cwd=work, capture_output=True, text=True).stdout.strip()
    if not st:
        print("변화 없음"); return
    subprocess.run(["git", "commit", "-qm", "stats %s (%d values)" % (snap["at"], len(values))], cwd=work, check=True)
    subprocess.run(["git", "push", "origin", "stats"], cwd=work, check=True)
    print("pushed", len(values), "values,", len(missing), "missing")


if __name__ == "__main__":
    main()
