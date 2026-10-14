# Deploy — Valid Buffer Dashboard

Repo: `bhardwaj7rahul/valid-buffer-dashboard` (main, Pages from `/`)
Live: https://bhardwaj7rahul.github.io/valid-buffer-dashboard/

## Latest staging refresh
- When: 2026-10-07 ~08:06 PT
- generatedAt: 2026-10-07T08:04:56.894232-07:00
- todayPT: `2026-10-07`
- posts: 203 (thumbnails 203/203, Buffer links 203/203)
- dateRange: 2026-09-07 → 2026-10-07 PT (incl. 4 Oct 7 SF posts sent 8:01 AM PT; nothing scheduled for other cities as of ~08:06 PT)
- aggregate (30d, Buffer): postCount=203, reactions=18587, comments=1587, engRate=7.02% (metricsUpdatedAt 2026-10-07 08:04 PT)
- brands: Dwell SF / Austin / Miami / Dallas (IG, TikTok, YouTube, Facebook)
- Live Pages still on: 2026-10-05 build (commit c52373a, 168 posts, generatedAt 2026-10-05 08:05 PT)

## How to push (Mac)
```bash
cd ~/valid-buffer-dashboard   # or ~/buffer-dashboard
# extract /workspace/buffer-dashboard-publish.tgz into repo root, then:
git add -A
git commit -m "chore: refresh Buffer dashboard 2026-10-07"
git push origin main
```

## Notes
- Metrics lag ~24h per Buffer.
- Box cannot push without `gh` auth; Mac local-exec is the chosen route when connected.
