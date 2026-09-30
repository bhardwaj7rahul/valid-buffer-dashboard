# Deploy status

## Live URL

**GitHub Pages:** https://bhardwaj7rahul.github.io/valid-buffer-dashboard/

- Repo: https://github.com/bhardwaj7rahul/valid-buffer-dashboard (public)
- Source: `main` branch, site root (`/`)
- Published: 2026-09-29 PT from `/workspace/buffer-dashboard-publish`

After first enable, Pages can take 1–10 minutes for DNS/CDN. If the URL 404s briefly, wait and hard-refresh.

## Contents

- `index.html` — dashboard UI
- `data.json` — Buffer metrics payload
- `assets/` — post media + `assets/brand/` logos
- `REFRESH.md` — how to rebuild from Buffer raw data
- `rebuild_from_raw.py` — rebuild helper

## Redeploy

```bash
# From updated publish folder
cd /path/to/valid-buffer-dashboard
git add -A && git commit -m "Update dashboard data" && git push
```

## Interim hosts (optional fallbacks)

1. Harvis: https://neat-laurel-604.harvis.page  
2. Vibedrop: https://qftswjqn.vibedrop.site  
