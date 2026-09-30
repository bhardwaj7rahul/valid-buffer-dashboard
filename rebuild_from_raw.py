#!/usr/bin/env python3
"""Rebuild data.json, _data_embed.json, and index.html from raw_posts.json.

MCP fetch must be done by an agent first (Buffer is MCP-only).
If post_links.json is present (id→externalLink map from Buffer), merges postUrl onto posts.
Usage (on box):
  python3 rebuild_from_raw.py
Optional aggregate JSON file path as argv[1] with keys matching get_aggregated_post_metrics.
"""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

PT = ZoneInfo("America/Los_Angeles")
ROOT = Path(__file__).resolve().parent


def metrics_to_dict(m):
    out = {
        "reactions": 0,
        "comments": 0,
        "views": 0,
        "reach": 0,
        "shares": 0,
        "saves": 0,
        "engagementRate": 0,
    }
    if isinstance(m, list):
        for item in m:
            t = item.get("type")
            if t in out:
                out[t] = item.get("value") or 0
            elif t == "likes":
                out["reactions"] = item.get("value") or 0
        return out, True
    if isinstance(m, dict):
        for k in out:
            if k in m and m[k] is not None:
                out[k] = m[k]
        return out, True
    return out, False


def parse_dt(s):
    if not s:
        return None
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def fmt_display(dt_pt):
    return dt_pt.strftime("%b %-d, %Y %-I:%M %p") + " PT"


def main():
    posts_raw = json.loads((ROOT / "raw_posts.json").read_text())
    if isinstance(posts_raw, dict) and "posts" in posts_raw:
        posts_raw = posts_raw["posts"]

    prev = {}
    if (ROOT / "data.json").exists():
        prev = json.loads((ROOT / "data.json").read_text())
    channels = prev.get("channels") or []
    chan_by_id = {c["id"]: c for c in channels}

    post_links = {}
    links_path = ROOT / "post_links.json"
    if links_path.exists():
        raw_links = json.loads(links_path.read_text())
        if isinstance(raw_links, dict) and "links" in raw_links:
            post_links = {k: v for k, v in raw_links["links"].items() if v}
        elif isinstance(raw_links, dict):
            # allow flat id→url map
            post_links = {k: v for k, v in raw_links.items() if isinstance(v, str) and v.startswith("http")}

    aggregate = prev.get("aggregate") or {}
    if len(sys.argv) > 1:
        agg_path = Path(sys.argv[1])
        raw_agg = json.loads(agg_path.read_text())
        metrics = raw_agg.get("metrics") or raw_agg
        if isinstance(metrics, list):
            flat = {}
            for item in metrics:
                flat[item["type"]] = item.get("value")
            aggregate = {
                "postCount": flat.get("postCount", 0),
                "reactions": flat.get("reactions", 0),
                "comments": flat.get("comments", 0),
                "engagementRate": flat.get("engagementRate", 0),
                "views": flat.get("views", 0),
                "metricsUpdatedAt": raw_agg.get("metricsUpdatedAt"),
            }

    posts_out = []
    asset_ok = asset_fail = 0
    for p in posts_raw:
        pid = p["id"]
        due = parse_dt(p.get("dueAt") or p.get("sentAt"))
        due_pt = due.astimezone(PT) if due else None
        ch_id = p.get("channelId")
        ch = chan_by_id.get(ch_id, {})
        platform = p.get("channelService") or ch.get("platform") or ""
        channel_name = ch.get("name") or platform
        matches = list((ROOT / "assets").glob(f"{pid}.*"))
        asset_local = None
        asset_failed = True
        if matches:
            asset_local = f"assets/{matches[0].name}"
            asset_failed = False
            asset_ok += 1
        else:
            asset_fail += 1
        assets = p.get("assets") or []
        asset_type = assets[0].get("type") if assets else None
        mdict, has = metrics_to_dict(p.get("metrics"))
        posts_out.append(
            {
                "id": pid,
                "text": p.get("text") or "",
                "status": p.get("status"),
                "dueAt": p.get("dueAt"),
                "dueAtPT": due_pt.isoformat() if due_pt else None,
                "datePT": due_pt.strftime("%Y-%m-%d") if due_pt else None,
                "timeDisplay": fmt_display(due_pt) if due_pt else None,
                "channelId": ch_id,
                "channelName": channel_name,
                "platform": platform,
                "assetLocal": asset_local,
                "assetFailed": asset_failed,
                "assetType": asset_type,
                "metrics": mdict,
                "metricsUpdatedAt": p.get("metricsUpdatedAt"),
                "hasMetrics": has,
            }
        )
        url = post_links.get(pid) or p.get("externalLink") or p.get("postUrl")
        if url:
            posts_out[-1]["postUrl"] = url

    posts_out.sort(key=lambda x: x.get("dueAt") or "", reverse=True)
    dates = [p["datePT"] for p in posts_out if p.get("datePT")]
    date_range = {"start": min(dates), "end": max(dates)} if dates else {"start": None, "end": None}
    now_pt = datetime.now(PT)
    today = now_pt.strftime("%Y-%m-%d")

    data = {
        "generatedAt": now_pt.isoformat(),
        "timezone": "America/Los_Angeles",
        "organization": prev.get("organization")
        or {"id": "6a62c54ed46977cbfb28c02b", "name": "Valid Co"},
        "dateRange": date_range,
        "aggregate": aggregate,
        "channels": channels,
        "posts": posts_out,
        "assetStats": {"downloaded": asset_ok, "failed": asset_fail, "total": len(posts_out)},
        "notes": prev.get("notes")
        or [
            "Metrics can lag ~24h behind the source networks.",
            "Follower counts are unavailable from Buffer for these channels.",
            "Engagement rate on cards is recomputed from the filtered set when possible.",
            "Video posts show local thumbnail assets when download succeeded.",
        ],
    }
    (ROOT / "data.json").write_text(json.dumps(data, indent=2))

    embed = {
        "generatedAt": data["generatedAt"],
        "timezone": data["timezone"],
        "organization": data["organization"],
        "dateRange": date_range,
        "channels": channels,
        "posts": [
            {
                "id": p["id"],
                "datePT": p["datePT"],
                "channelId": p["channelId"],
                "channelName": p["channelName"],
                "platform": p["platform"],
                "metrics": p["metrics"],
                **({"postUrl": p["postUrl"]} if p.get("postUrl") else {}),
            }
            for p in posts_out
        ],
    }
    (ROOT / "_data_embed.json").write_text(json.dumps(embed, separators=(",", ":")))

    app = (ROOT / "_app.js").read_text()
    app, n = re.subn(
        r'const todayPT = "[0-9]{4}-[0-9]{2}-[0-9]{2}";',
        f'const todayPT = "{today}";',
        app,
        count=1,
    )
    if n != 1:
        raise SystemExit(f"todayPT replace failed n={n}")
    (ROOT / "_app.js").write_text(app)

    shell = (ROOT / "_shell.html").read_text()
    for tag in ("</body>", "</html>"):
        shell = shell.replace(tag, "")
    embed_json = json.dumps(embed, separators=(",", ":"))
    index = (
        shell.rstrip()
        + "\n"
        + embed_json
        + "\n</script>\n<script>\n"
        + app
        + "\n</script>\n</body>\n</html>\n"
    )
    (ROOT / "index.html").write_text(index)
    print(
        f"OK posts={len(posts_out)} range={date_range} assets_ok={asset_ok} fail={asset_fail} today={today}"
    )


if __name__ == "__main__":
    main()
