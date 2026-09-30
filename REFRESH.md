# Buffer Dashboard — Daily Refresh

Permanent host: GitHub Pages at `https://bhardwaj7rahul.github.io/valid-buffer-dashboard/`  
Source on box: `/workspace/buffer-dashboard`  
Mac mirror: `/Users/rahulbhardwaj/buffer-dashboard`  
Repo: `bhardwaj7rahul/valid-buffer-dashboard`

## Why a Grok Bot routine (not shell cron)

Buffer data is only available through the **user-Buffer MCP**. Shell scripts cannot call MCP, so daily refresh must be an agent routine that:

1. Pulls posts via MCP  
2. Rebuilds `data.json` / `index.html` on the box  
3. Syncs to Mac and pushes to GitHub Pages  

## Recommended parent routine prompt

```
Daily Buffer dashboard refresh (America/Los_Angeles ~8:00 AM PT):

1. Call user-Buffer MCP:
   - get_account → use org "Valid Co" id 6a62c54ed46977cbfb28c02b
   - list_channels for that org
   - list_posts status=["sent"], includeMetrics=true, dueAt last 30 days
     (America/Los_Angeles), paginate with after until hasNextPage=false
   - get_aggregated_post_metrics for the same 30d window

2. On the box at /workspace/buffer-dashboard:
   - Save raw posts JSON → raw_posts.json
   - Download any missing post thumbnails into assets/{postId}.{ext}
     (prefer asset.thumbnail for videos; asset.source for images)
   - Rebuild data.json (same schema as existing: generatedAt, timezone,
     organization, dateRange, aggregate, channels, posts, assetStats, notes)
   - Rebuild slim embed (_data_embed.json) with posts fields:
     id, datePT, channelId, channelName, platform, metrics
   - Update todayPT in _app.js to today's PT date
   - Rebuild index.html = _shell.html + embed JSON + _app.js

3. Sync to Mac: copy index.html, data.json, assets/, REFRESH.md into
   /Users/rahulbhardwaj/buffer-dashboard (machine Mac.attlocal.net)

4. Redeploy GitHub Pages from Mac:
   cd /Users/rahulbhardwaj/buffer-dashboard
   (or from the git clone of bhardwaj7rahul/valid-buffer-dashboard)
   git add -A && git commit -m "chore: refresh Buffer dashboard $(date +%Y-%m-%d)" && git push
   Pages serves from branch main / root (or /docs).

5. Confirm https://bhardwaj7rahul.github.io/valid-buffer-dashboard/ loads
   and generatedAt is today.

Do not ask the user; report permanent URL + post count + date range.
```

## Manual one-shot (agent)

Same steps as the routine prompt above. Helper notes live in `rebuild_from_raw.py` (rebuild only; MCP fetch is agent-side).

## Schema notes

- Org: Valid Co `6a62c54ed46977cbfb28c02b`
- Timezone: America/Los_Angeles
- Post metrics are flattened from Buffer's `{type,value}[]` list into
  `{reactions,comments,views,reach,shares,saves,engagementRate}`
- Metrics lag ~24h per Buffer

## First-time GitHub Pages setup (Mac, when connected)

```bash
# After syncing /workspace/buffer-dashboard-publish → ~/buffer-dashboard
cd ~/buffer-dashboard   # or a fresh clone dir
# If not yet a repo:
gh repo create valid-buffer-dashboard --public --source=. --remote=origin --push
gh api repos/bhardwaj7rahul/valid-buffer-dashboard/pages -X POST \
  -f build_type=legacy -f source[branch]=main -f source[path]=/
# Live: https://bhardwaj7rahul.github.io/valid-buffer-dashboard/
```

If the repo already exists:

```bash
cd ~/valid-buffer-dashboard   # or ~/buffer-dashboard with remote set
git add -A && git commit -m "chore: refresh Buffer dashboard" && git push
```

## Interim hosts (no GitHub)

- Full: https://neat-laurel-604.harvis.page (`npx harvis` from publish dir; claim to keep)
- Lean: https://qftswjqn.vibedrop.site
