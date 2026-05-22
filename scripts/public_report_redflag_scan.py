#!/usr/bin/env python3
"""Scan K-AI Daily Intelligence public artifacts for internal/process leakage.

Usage:
  python scripts/public_report_redflag_scan.py /path/to/news-kaihk.github.io [--json]
  python scripts/public_report_redflag_scan.py /path/to/report.html [--json]
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

RED_FLAGS = [
    r"老大",
    r"小葉",
    r"內部指令",
    r"聊天記錄",
    r"工具調用",
    r"對 K-AI Solutions 的機會",
    r"銷售話術",
    r"lead magnet",
    r"Lead Magnet",
    r"幫你",
    r"持續進化",
    r"每日 review",
    r"repo clone",
    r"/Users/",
    r"access key",
    r"api[_ -]?key\s*[:=]",
    r"access[_ -]?token\s*[:=]",
    r"auth[_ -]?token\s*[:=]",
    r"Authorization\s*[:=]\s*Bearer",
    r"-----BEGIN (RSA |EC |OPENSSH |DSA |)?PRIVATE KEY-----",
    r"gh[pousr]_[A-Za-z0-9_]{20,}",
    r"AKIA[0-9A-Z]{16}",
    r"sk-[A-Za-z0-9]{20,}",
    r"重版",
    r"重新壓縮成",
    r"[0-9]{1,2}/[0-9]{1,2}\s*(的)?訊號",
    r"[0-9]{1,2}/[0-9]{1,2}\s*風格",
    r"風格的 editorial briefing",
    r"跟.*那版.*格式",
    r"style baseline",
    r"以\s*[0-9]{4}-[0-9]{2}-[0-9]{2}.*(報告|日報).*(基準|風格)",
    r"Briefing frame",
    r"Core thesis",
    r"Market frame",
    r"Main signal",
    r"Useful lens",
    r"Value pressure flow",
    r"Market Structure",
    r"Open detail",
    r"避免把新聞堆疊",
    r"方便快速掃描",
    r"再深讀",
    r"每條訊號保留來源",
    r"把訊號放回商業鏈條",
    r"不放內部對話",
    r"每條 trend 都要落地",
    r"卡片是入口",
    r"每條新聞一張卡",
    r"先用視覺",
    r"視覺抓住主線",
    r"Reader-first",
    r"Actionable",
    r"Source-linked",
]

EXTS = {".html", ".htm", ".md", ".json", ".txt"}


def candidate_paths(root: Path):
    if root.is_file():
        return [root] if root.suffix in EXTS else []
    return [p for p in sorted(root.rglob("*")) if p.is_file() and p.suffix in EXTS]


def scan(root: Path):
    pattern = re.compile("|".join(f"({p})" for p in RED_FLAGS), re.IGNORECASE)
    hits = []
    for path in candidate_paths(root):
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except Exception as exc:
            hits.append({"path": str(path), "line": 0, "match": "READ_ERROR", "text": str(exc)})
            continue
        for i, line in enumerate(text.splitlines(), start=1):
            m = pattern.search(line)
            if m:
                hits.append({
                    "path": str(path),
                    "line": i,
                    "match": m.group(0),
                    "text": line.strip()[:240],
                })
    return hits


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("root", help="Public site/report directory or file to scan")
    ap.add_argument("--json", action="store_true", help="Emit JSON")
    args = ap.parse_args(argv)

    root = Path(args.root).expanduser().resolve()
    if not root.exists() or (not root.is_dir() and not root.is_file()):
        print(f"Invalid path: {root}", file=sys.stderr)
        return 2

    hits = scan(root)
    if args.json:
        print(json.dumps({"root": str(root), "count": len(hits), "hits": hits}, ensure_ascii=False, indent=2))
    else:
        if not hits:
            print(f"OK: no public-report red flags found under {root}")
        else:
            print(f"RED FLAGS: {len(hits)} hit(s) under {root}")
            for h in hits:
                print(f"{h['path']}:{h['line']}: [{h['match']}] {h['text']}")
            print("\nReview manually before publishing. Fix workflow/templates if hits are internal leakage, not just the visible text.")
    return 1 if hits else 0


if __name__ == "__main__":
    raise SystemExit(main())
