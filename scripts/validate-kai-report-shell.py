#!/usr/bin/env python3
"""Validate that K-AI daily reports use the fixed shared shell scaffold.

Usage:
  python3 scripts/validate-kai-report-shell.py reports/2026-05-05-ai-trend-report.html
  python3 scripts/validate-kai-report-shell.py reports/*.html

This is intentionally stdlib-only so it works in cron / lightweight environments.
"""
from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path

REQUIRED = [
    '/assets/kai-theme.css',
    '/assets/kai-site.js',
    'rel="canonical"',
    'meta name="description"',
    'application/ld+json',
]
REQUIRED_IDS = ['summary', 'matrix', 'records', 'watchlist', 'sources']
BLOCKED_NEW_REPORT_PATTERNS = [
    r'<div\s+class=["\']shell["\']',
    r'<aside\s+class=["\']rail["\']',
    r'<aside\s+class=["\']toc["\']',
    r'<header\s+class=["\']topbar["\']',
    r'<style\b',
]
PUBLIC_COPY_BLOCKLIST = [
    'Telegram', '老大', '小馬', '工具調用', 'cron', 'repo path',
    'style baseline', '重版', '2/5', '3/5', '4/5', '5/5',
    'Briefing frame', 'Core thesis', 'Value Chain', 'Open detail',
]

class IdParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.add(attrs['id'])

def validate(path: Path) -> list[str]:
    text = path.read_text(encoding='utf-8')
    errors: list[str] = []
    for needle in REQUIRED:
        if needle not in text:
            errors.append(f'missing required shell/head asset: {needle}')
    parser = IdParser(); parser.feed(text)
    for sec in REQUIRED_IDS:
        if sec not in parser.ids:
            errors.append(f'missing required section id: #{sec}')
    for pat in BLOCKED_NEW_REPORT_PATTERNS:
        if re.search(pat, text, flags=re.I):
            errors.append(f'new report should not hard-code legacy shell/style pattern: {pat}')
    for word in PUBLIC_COPY_BLOCKLIST:
        if word in text:
            errors.append(f'public/internal copy red flag: {word}')
    return errors

def main(argv: list[str]) -> int:
    paths = [Path(p) for p in argv[1:]]
    if not paths:
        print('usage: validate-kai-report-shell.py FILE [FILE...]', file=sys.stderr)
        return 2
    failed = False
    for path in paths:
        errs = validate(path)
        if errs:
            failed = True
            print(f'FAIL {path}')
            for e in errs:
                print(f'  - {e}')
        else:
            print(f'OK {path}')
    return 1 if failed else 0

if __name__ == '__main__':
    raise SystemExit(main(sys.argv))
