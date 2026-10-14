# Pending GitHub Pages push — 2026-10-13 ~19:13 PT (complete direct-from-platform build, all 16 sources)

**Replaces the 2026-10-07 Buffer staging and the earlier SF-only build from 18:59 PT tonight.** Buffer lost access to the Dwell channels on Oct 9. This build reads straight from the platforms (`build_from_direct.py`, sources in `/workspace/social-direct/`).

- Source: `/workspace/buffer-dashboard`; publish: `/workspace/buffer-dashboard-publish/`; tarball: `/workspace/buffer-dashboard-publish.tgz`
- generatedAt: 2026-10-13T19:12:41.192396-07:00
- posts: **253** (2026-09-13 → 2026-10-13 PT), all 16 city × platform sources present; thumbnails 253/253 (IG/FB via public og:image, no login)
- Totals: views 692,062 · likes/reactions 19,565 · comments 1,818 · shares 85 · eng. rate 3.10%
- Per city (IG/TT/YT/FB): SF 39/29/24/16 · Austin 12/12/12/13 · Miami 12/12/12/12 · Dallas 12/12/12/12
- Coverage Oct 2–13: every channel posted every day (Austin FB posted twice on Oct 2, both "OAK").
- Zero-view: Dallas FB Oct 8, 9, 12, 13; SF YouTube Sep 27, 28.
- SF IG dates for 8 reels from Sep 30 to Oct 7 come from the reel shortcode. The browser pull showed all 8 as Oct 8 (probably edits made that day).
- UI is "Dwell · Social Dashboard". The data source is direct from the platforms, and missing metrics are blank (null).
- Not pushed. Deploy is via git push from Rahul's Mac.

## When Mac is back
```bash
cd ~/valid-buffer-dashboard
tar -xzf /path/to/buffer-dashboard-publish.tgz -C .
git add -A && git commit -m "feat: Dwell dashboard direct from platforms 2026-10-13" && git push origin main
```

---
## History (superseded)
# Pending GitHub Pages push — 2026-10-07 ~08:06 PT

## Blockers (as of refresh)
- Mac `MacBook-Air-4.local` (`523e9c84-7752-4d4b-bdc4-d151bb5d2b8b`) offline at 08:01 PT and again at ~08:06 PT.
- Box `gh` is not logged in (by design; deploy route is Mac git push).
- Live Pages = 2026-10-05 build (commit c52373a, 168 posts, generatedAt 2026-10-05 08:05 PT). The 2026-10-06 staged build was never pushed; this build supersedes it.

## Staged refresh ready
- Source: `/workspace/buffer-dashboard`; publish: `/workspace/buffer-dashboard-publish/`; tarball: `/workspace/buffer-dashboard-publish.tgz`
- generatedAt: 2026-10-07T08:04:56.894232-07:00
- posts: **203** (dateRange 2026-09-07 → 2026-10-07 PT), todayPT 2026-10-07, thumbnails 203/203, links 203/203
- aggregate (30d): postCount=203, reactions=18587, comments=1587, engRate=7.02%

## Callouts
- Oct 6: full coverage. All 16 city×platform combos posted (16 feed posts + 4 IG stories, 9:02–9:38 AM PT).
- Oct 7 so far (~08:06 PT): only SF posted (IG, TikTok, YouTube, FB at 8:01 AM PT). **Austin, Miami, Dallas: 0 of 4 platforms, 12 combos missing**, and nothing scheduled/drafted in Buffer for them.
- Facebook: still 0 "views" on all 53 FB posts (Sep 28 → Oct 7, all 4 pages). Buffer doesn't return a views metric for FB; it returns impressions instead (30d FB impressions = 5,326; Oct 6: SF 525, Miami 176, Austin 27, Dallas 2). The gap is still there.
- Zero-view non-FB: SF TikTok Oct 6 "DECK" = 0 views but 1.15 min watch time (6.3 s avg) and 1 comment, so Buffer's views count is inconsistent or stale. SF TikTok Oct 7 is also 0 (posted just now). Oct 7 SF IG/YT are 0 because they just went out.
- YouTube Shorts are still low (Oct 6: Dallas 40, Austin 33, SF 29, Miami 9).
- Oct 6 top by city: SF IG "DECK" 3,666 views; Austin TikTok "LAKE" 155; Dallas IG "WINDOW" 148; Miami IG "POOL" 143.

## When Mac is back
```bash
cd ~/valid-buffer-dashboard
tar -xzf /path/to/buffer-dashboard-publish.tgz -C .
git add -A && git commit -m "chore: refresh Buffer dashboard 2026-10-07" && git push origin main
```
Live: https://bhardwaj7rahul.github.io/valid-buffer-dashboard/

## 2026-10-10 ~08:00 PT — refresh BLOCKED
- Buffer MCP: list_channels for Valid Co (6a62c54ed46977cbfb28c02b) returns [] ; list_posts by channel IDs -> 403 "Actor can not access the specified channels". Org owner is jessa@valid.co; rahul@valid.co appears to have lost channel access (or channels moved).
- No rebuild done; staged build is still the 2026-10-07 one (203 posts). Mac (mac.lan) offline, so not pushed. Live Pages still 2026-10-05 (c52373a).

## 2026-10-11 ~08:00 PT — refresh BLOCKED (2nd day)
- Buffer MCP: get_account OK (rahul@valid.co, member of Valid Co 6a62c54ed46977cbfb28c02b, owner jessa@valid.co, 2 members), but list_channels for Valid Co still returns []. Personal org has only 2 LinkedIn channels. The Dwell channels can't be seen from Rahul's account.
- Fix needed: Jessa (Valid Co owner) needs to give rahul@valid.co channel access again (Buffer > Team > channel permissions), or the channels have moved to another org.
- No rebuild; staged build is still 2026-10-07 (203 posts). Mac (mac.lan) offline, so not pushed. Live Pages still 2026-10-05 (c52373a).
