# Deploy — Valid Buffer Dashboard

Repo: `bhardwaj7rahul/valid-buffer-dashboard` (main, Pages from `/`)
Live: https://bhardwaj7rahul.github.io/valid-buffer-dashboard/

## Latest staging refresh
- When: 2026-10-05 ~08:15 PT
- generatedAt: see data.json
- todayPT: `2026-10-05`
- posts: 168
- dateRange: 2026-09-05 → 2026-10-05 PT
- brands: Dwell SF / Austin / Miami / Dallas (IG, TikTok, YouTube, Facebook)

## How to push (Mac)
```bash
cd ~/valid-buffer-dashboard   # or ~/buffer-dashboard
# extract /workspace/buffer-dashboard-publish.tgz into repo root, then:
git add -A
git commit -m "chore: refresh Buffer dashboard 2026-10-05"
git push origin main
```

## Notes
- Metrics lag ~24h per Buffer.
- Box cannot push without `gh` auth; Mac local-exec is preferred when connected.
