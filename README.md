# K-AI Daily Intelligence

Public GitHub Pages site for public-source AI and business daily intelligence briefings.

- `index.html` — light editorial daily briefing homepage
- `assets/kai-theme.css` — shared K-AI public site shell, typography, rails, cards, spacing, responsive rules
- `assets/kai-site.js` — injects the shared topbar, left archive rail, right section TOC, archive/search interactions
- `reports/index.json` — report archive index; homepage/archive rails should read from this source
- `reports/*.html` — full daily HTML reports
- `reports/*.md` — full daily Markdown source reports
- `templates/kai-daily-report-scaffold.html` — fixed starting scaffold for new public daily reports
- `scripts/validate-kai-report-shell.py` — stdlib-only validator that blocks shell/style drift before publish

Public site: https://news-kaihk.github.io/

## Daily report SOP

New daily report pages must reuse the shared site shell instead of inventing page chrome again.

Required flow:

1. Start from `templates/kai-daily-report-scaffold.html`.
2. Fill only the editorial content inside `<main class="article kai-report">`.
3. Keep the canonical section IDs: `summary`, `matrix`, `records`, `watchlist`, `sources`.
4. Do **not** hard-code local `.shell`, `.rail`, `.toc`, `.topbar`, or large inline `<style>` blocks in a new report.
5. Update `reports/index.json` with the new date/title/summary/html/md paths.
6. Run the gates before publish:

```bash
python3 scripts/validate-kai-report-shell.py reports/YYYY-MM-DD-ai-trend-report.html
python3 scripts/public_report_redflag_scan.py reports/YYYY-MM-DD-ai-trend-report.html
python3 scripts/public_report_redflag_scan.py reports/index.json
```

`public_report_redflag_scan.py` is available from the Hermes `trend-intelligence-reports` skill; copy or symlink it into `scripts/` for local project runs if it is not already present.

7. Browser-check homepage + latest report + one previous report at a common desktop viewport before any push.

Publishing still requires explicit approval before commit/push/deploy.
