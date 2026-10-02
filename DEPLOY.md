# Deploy — Valid Buffer Dashboard

Published (box staging): 2026-10-02 08:01 PT  
Live URL: https://bhardwaj7rahul.github.io/valid-buffer-dashboard/  
Repo: bhardwaj7rahul/valid-buffer-dashboard (main, Pages from /)

## Status 2026-10-02

**Staging rebuilt on box.** GitHub Pages push **blocked** this morning:
- Mac `MacBook-Air-4.local` unreachable / disconnected
- Box `gh` not authenticated
- CloudAgent launch: repo not accessible to Cloud Agents account
- cursor-github MCP is read-only for blobs (no file commit tool)

See `PENDING_PUSH.md` for Mac push commands.

## Mac push (preferred)

```bash
cd ~/valid-buffer-dashboard || cd ~/buffer-dashboard
# After CopyFromBox of /workspace/buffer-dashboard-publish contents:
git add -A
git commit -m "chore: refresh Buffer dashboard 2026-10-02"
git push origin main
```
