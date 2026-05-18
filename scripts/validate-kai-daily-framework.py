#!/usr/bin/env python3
"""Validate K-AI daily report fixed framework.

This gate is intentionally stricter than generic HTML validity: daily reports
should reuse the same public briefing scaffold instead of drifting into one-off
layouts.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

REQUIRED_SECTIONS = [
    'id="summary"',
    'id="training"',
    'id="matrix"',
    'id="records"',
    'id="watchlist"',
    'id="sources"',
]
FIVE_QUESTIONS = [
    "發生什麼",
    "誰收錢",
    "誰埋單",
    "真正定價權在哪",
    "接下來看什麼",
]
PUBLIC_SAFETY_BLOCKLIST = [
    "/Users/",
    "127.0.0.1",
    "localhost:",
    "Telegram",
    "canonical shell",
    "shared-shell",
    "05/14",
    "05-14 style",
    "validator",
]


def count(pattern: str, html: str) -> int:
    return len(re.findall(pattern, html, flags=re.I | re.S))


def validate(path: Path) -> list[str]:
    html = path.read_text(encoding="utf-8")
    failures: list[str] = []

    def require(ok: bool, msg: str) -> None:
        if not ok:
            failures.append(msg)

    require('/assets/kai-theme.css' in html, "missing shared kai-theme.css")
    require('/assets/kai-site.js' in html, "missing shared kai-site.js")
    require('<main class="article kai-report"' in html, "missing canonical <main class=\"article kai-report\">")
    require('<style' not in html.lower(), "contains inline <style>; daily reports must use shared CSS")

    for section in REQUIRED_SECTIONS:
        require(section in html, f"missing section {section}")

    require('class="source-rail"' in html, "hero must include source-rail")
    require(count(r'class="source-chip"', html) >= 6, "hero/source cards need at least 6 source-chip elements")
    require('6 條市場訊號' in html or '6 signals' in html, "hero must declare 6 market signals")

    evidence_cards = count(r'class="[^"]*evidence-card[^"]*"', html)
    trend_cards = count(r'class="trend-card daily-report-card track"', html)
    require(evidence_cards == 6, f"expected exactly 6 evidence-card items, found {evidence_cards}")
    require(trend_cards == 6, f"expected exactly 6 trend-card daily-report-card track items, found {trend_cards}")
    require('signal-card' not in html, "do not use signal-card; use trend-card daily-report-card track")

    records_match = re.search(r'<section id="records"[\s\S]*?<section id="watchlist"', html)
    records = records_match.group(0) if records_match else ""
    for q in FIVE_QUESTIONS:
        require(records.count(q) >= 6, f"records section should contain '{q}' in each of 6 cards")
    require(records.count('class="source-chip"') >= 6, "records cards should carry source chips / provenance")

    require('<p></p>' not in html and not re.search(r'<p>\s*</p>', html), "contains empty <p>")
    require('<dd></dd>' not in html and not re.search(r'<dd>\s*</dd>', html), "contains empty <dd>")
    require('<ul></ul>' not in html and not re.search(r'<ul>\s*</ul>', html), "contains empty <ul>")
    for token in PUBLIC_SAFETY_BLOCKLIST:
        require(token not in html, f"public report contains internal/local token: {token}")

    return failures


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("Usage: validate-kai-daily-framework.py reports/YYYY-MM-DD-ai-trend-report.html [...]", file=sys.stderr)
        return 2
    any_fail = False
    for name in argv[1:]:
        path = Path(name)
        failures = validate(path)
        if failures:
            any_fail = True
            print(f"FAIL {path}")
            for f in failures:
                print(f"  - {f}")
        else:
            print(f"OK   {path}")
    return 1 if any_fail else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
