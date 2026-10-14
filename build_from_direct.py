#!/usr/bin/env python3
"""Build data.json / _data_embed.json / index.html directly from platform pulls.

Reads /workspace/social-direct/<city>_<platform>.json  (city: sf|austin|miami|dallas,
platform: instagram|tiktok|youtube|facebook). Replaces the Buffer pipeline
(rebuild_from_raw.py) since Buffer lost Dwell channel access on 2026-10-09.

Accepted per-file shapes (see /workspace/social-direct/README.md):
  * normalized:   {"posts": [{id,url,date,title,caption,thumbnail,views,likes,comments,shares}]}
  * IG browser:   {"reels": [{url,reel_code,post_datetime_utc,views_numeric|views_grid,caption_first_line,likes,comments,[shares],[thumbnail]}]}
  * FB browser:   {"items": [{url,date_utc|date,first_line_of_caption,views,reactions,comments,shares,[thumbnail]}]}
  * bare list of normalized posts.
Missing metrics stay null (never coerced to 0).
Usage: python3 build_from_direct.py [--since YYYY-MM-DD] [--no-thumbs]
"""
from __future__ import annotations
import argparse, hashlib, json, re, time, urllib.request
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

PT = ZoneInfo("America/Los_Angeles")
ROOT = Path(__file__).resolve().parent
SRC = Path("/workspace/social-direct")
CITIES = ["sf", "austin", "miami", "dallas"]
PLATFORMS = ["instagram", "tiktok", "youtube", "facebook"]
CITY_NAME = {"sf": "San Francisco", "austin": "Austin", "miami": "Miami", "dallas": "Dallas"}
HANDLE = {"sf": "dwell.sanfrancisco", "austin": "dwell.austin", "miami": "dwell.miami.fl", "dallas": "dwell.dallas"}


def channel_name(city, plat):
    # Matches the names the old Buffer channels used (and _app.js family regexes).
    return HANDLE[city] if plat in ("instagram", "tiktok") else f"Dwell {CITY_NAME[city]}"


def num(v):
    """'1.2K' / '2,313' / 5 / None -> int or None."""
    if v is None or v == "":
        return None
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return int(v)
    s = str(v).strip().replace(",", "").upper()
    m = re.fullmatch(r"([0-9]*\.?[0-9]+)\s*([KMB]?)", s)
    if not m:
        return None
    return int(round(float(m.group(1)) * {"": 1, "K": 1e3, "M": 1e6, "B": 1e9}[m.group(2)]))


def parse_date(s):
    if not s:
        return None
    s = str(s).strip()
    for fmt in ("%b %d, %Y",):
        try:
            return datetime.strptime(s, fmt).replace(hour=12, tzinfo=PT)
        except ValueError:
            pass
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=PT)  # yt-dlp/date-only values are PT-local
    return dt


def post_key(url, fallback):
    m = re.search(r"/(?:reel|p|video|shorts|reels)/([A-Za-z0-9_-]+)", url or "") or re.search(r"[?&]v=([A-Za-z0-9_-]+)", url or "")
    return m.group(1) if m else fallback


IG_ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"


def ig_shortcode_time(code):
    """IG media ids embed creation time: (id >> 23) ms since 1314220021721.
    Used because browser-pull post_datetime_utc can show a later edit/reshare time."""
    try:
        n = 0
        for ch in code[:11]:
            n = n * 64 + IG_ALPHA.index(ch)
        return datetime.fromtimestamp(((n >> 23) + 1314220021721) / 1000, ZoneInfo("UTC"))
    except (ValueError, OverflowError):
        return None


def records(raw):
    if isinstance(raw, list):
        return raw
    for k in ("posts", "reels", "items", "entries"):
        if isinstance(raw.get(k), list):
            return raw[k]
    return []


def normalize(rec, city, plat):
    url = rec.get("url") or rec.get("webpage_url")
    dt = parse_date(rec.get("post_datetime_utc") or rec.get("date_utc") or rec.get("timestamp_iso")
                    or rec.get("date") or rec.get("post_date"))
    if plat == "instagram":
        code = rec.get("reel_code") or post_key(url, None)
        sc = ig_shortcode_time(code) if code else None
        if sc and (dt is None or abs((sc - dt).total_seconds()) > 3600):
            dt = sc
    if dt is None and rec.get("timestamp"):
        dt = datetime.fromtimestamp(rec["timestamp"], PT)
    text = (rec.get("caption") or rec.get("description") or rec.get("title")
            or rec.get("caption_first_line") or rec.get("first_line_of_caption") or "")
    views = num(rec.get("views_numeric")) if rec.get("views_numeric") is not None else num(
        rec.get("views") if rec.get("views") is not None else rec.get("views_grid") or rec.get("view_count"))
    likes = num(rec.get("likes") if rec.get("likes") is not None else rec.get("reactions") if rec.get("reactions") is not None else rec.get("like_count"))
    comments = num(rec.get("comments") if rec.get("comments") is not None else rec.get("comment_count"))
    shares = num(rec.get("shares") if rec.get("shares") is not None else rec.get("repost_count"))
    pid = str(rec.get("id") or rec.get("reel_code") or post_key(url, hashlib.md5((url or text).encode()).hexdigest()[:12]))
    return {"pid": f"{city}_{plat}_{pid}", "key": post_key(url, pid), "url": url, "dt": dt, "text": text,
            "title": rec.get("title"), "thumb": rec.get("thumbnail") or rec.get("thumbnail_url"),
            "views": views, "likes": likes, "comments": comments, "shares": shares}


def fetch_thumb(url, dest_stem):
    existing = list((ROOT / "assets").glob(dest_stem + ".*"))
    if existing:
        return f"assets/{existing[0].name}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=20) as r:
            data = r.read()
            ct = r.headers.get("Content-Type", "")
        ext = "webp" if "webp" in ct or url.split("?")[0].endswith(".webp") else "png" if "png" in ct else "jpg"
        p = ROOT / "assets" / f"{dest_stem}.{ext}"
        p.write_bytes(data)
        return f"assets/{p.name}"
    except Exception as e:  # noqa: BLE001
        print(f"  thumb fail {dest_stem}: {e}")
        return None


OG_UA = {"instagram": "facebookexternalhit/1.1", "facebook": "Twitterbot/1.0"}


def og_image(url, plat):
    """Public og:image for an IG/FB post (no login). Returns None on any failure."""
    import html as _html
    if not url or plat not in OG_UA:
        return None
    try:
        req = urllib.request.Request(url, headers={"User-Agent": OG_UA[plat], "Accept-Language": "en-US"})
        with urllib.request.urlopen(req, timeout=20) as r:
            page = r.read(2_000_000).decode("utf-8", "replace")
        m = re.search(r'property="og:image"\s+content="([^"]+)"', page) or re.search(r'og:image" content="([^"]+)"', page)
        return _html.unescape(m.group(1)) if m else None
    except Exception as e:  # noqa: BLE001
        print(f"  og:image fail {url}: {e}")
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--since")
    ap.add_argument("--no-thumbs", action="store_true")
    a = ap.parse_args()
    now = datetime.now(PT)
    since = a.since or (now - timedelta(days=30)).strftime("%Y-%m-%d")
    (ROOT / "assets").mkdir(exist_ok=True)

    prev = json.loads((ROOT / "data.json").read_text()) if (ROOT / "data.json").exists() else {}
    prev_ch = {(c.get("platform"), (c.get("name") or "").strip()): c for c in prev.get("channels", [])}
    # Reuse thumbnails we already hold from the Buffer era, keyed by the post's platform id.
    old_assets = {}
    for p in prev.get("posts", []):
        if p.get("postUrl") and p.get("assetLocal") and (ROOT / p["assetLocal"]).exists():
            old_assets[post_key(p["postUrl"], None)] = p["assetLocal"]

    channels, posts, coverage = [], [], {}
    for city in CITIES:
        for plat in PLATFORMS:
            name = channel_name(city, plat)
            cid = f"{city}_{plat}"
            pc = prev_ch.get((plat, name), {})
            channels.append({"id": cid, "name": name, "displayName": name, "platform": plat,
                             "avatarUrl": pc.get("avatarUrl"), "avatar": pc.get("avatar"),
                             "avatarLocal": pc.get("avatarLocal"), "type": pc.get("type"), "handle": name})
            f = SRC / f"{city}_{plat}.json"
            if not f.exists():
                coverage[cid] = None
                continue
            raw = json.loads(f.read_text())
            n = 0
            for rec in records(raw):
                r = normalize(rec, city, plat)
                if not r["dt"]:
                    continue
                d_pt = r["dt"].astimezone(PT)
                if d_pt.strftime("%Y-%m-%d") < since:
                    continue
                asset = old_assets.get(r["key"])
                if not asset and not r["thumb"] and not a.no_thumbs:
                    stem = re.sub(r"[^A-Za-z0-9_.-]", "_", r["pid"])
                    if not list((ROOT / "assets").glob(stem + ".*")):
                        r["thumb"] = og_image(r["url"], plat)
                        time.sleep(0.5)
                if not asset and r["thumb"] and not a.no_thumbs:
                    asset = fetch_thumb(r["thumb"], re.sub(r"[^A-Za-z0-9_.-]", "_", r["pid"]))
                eng = [x for x in (r["likes"], r["comments"], r["shares"]) if x is not None]
                er = round(sum(eng) / r["views"] * 100, 2) if eng and r["views"] else None
                posts.append({
                    "id": r["pid"], "text": r["text"], "title": r["title"], "status": "sent",
                    "dueAt": r["dt"].astimezone(ZoneInfo("UTC")).isoformat().replace("+00:00", "Z"),
                    "dueAtPT": d_pt.isoformat(), "datePT": d_pt.strftime("%Y-%m-%d"),
                    "timeDisplay": d_pt.strftime("%b %-d, %Y %-I:%M %p") + " PT",
                    "channelId": cid, "channelName": name, "platform": plat,
                    "assetLocal": asset, "assetFailed": asset is None, "assetType": "video",
                    "metrics": {"reactions": r["likes"], "comments": r["comments"], "views": r["views"],
                                "reach": None, "shares": r["shares"], "saves": None, "engagementRate": er},
                    "metricsUpdatedAt": (raw.get("collected_at") if isinstance(raw, dict) else None),
                    "hasMetrics": any(v is not None for v in (r["views"], r["likes"], r["comments"], r["shares"])),
                    "postUrl": r["url"], "source": "direct",
                })
                n += 1
            coverage[cid] = n

    posts.sort(key=lambda x: x["dueAt"], reverse=True)
    dates = [p["datePT"] for p in posts]
    date_range = {"start": min(dates), "end": max(dates)} if dates else {"start": None, "end": None}
    tot = lambda k: sum(p["metrics"][k] or 0 for p in posts)
    views = tot("views")
    aggregate = {"postCount": len(posts), "views": views, "reactions": tot("reactions"),
                 "comments": tot("comments"), "shares": tot("shares"),
                 "engagementRate": round((tot("reactions") + tot("comments") + tot("shares")) / views * 100, 2) if views else 0,
                 "metricsUpdatedAt": now.isoformat()}
    ok = sum(1 for p in posts if p["assetLocal"])
    missing = [k for k, v in coverage.items() if v is None]
    data = {
        "generatedAt": now.isoformat(), "timezone": "America/Los_Angeles",
        "organization": prev.get("organization") or {"id": "6a62c54ed46977cbfb28c02b", "name": "Valid Co"},
        "dataSource": "Direct from the platforms (Instagram, TikTok, YouTube, Facebook public pages)",
        "dateRange": date_range, "aggregate": aggregate, "channels": channels, "posts": posts,
        "coverage": coverage, "missingSources": missing,
        "assetStats": {"downloaded": ok, "failed": len(posts) - ok, "total": len(posts)},
        "notes": [
            "Data pulled directly from each platform's public pages (yt-dlp for YouTube/TikTok; browser pulls for Instagram/Facebook).",
            "Metrics that a platform doesn't expose publicly (e.g. IG likes/comments when hidden, YouTube shares) are shown as blank, not 0.",
            "Engagement rate = (likes + comments + shares) / views, using only the fields that exist.",
            "Video posts show local thumbnail assets when download succeeded.",
        ] + ([f"No source file yet for: {', '.join(missing)}."] if missing else []),
    }
    (ROOT / "data.json").write_text(json.dumps(data, indent=2, ensure_ascii=False))
    embed = {k: data[k] for k in ("generatedAt", "timezone", "organization", "dataSource", "dateRange", "channels")}
    embed["posts"] = [{"id": p["id"], "datePT": p["datePT"], "channelId": p["channelId"], "channelName": p["channelName"],
                       "platform": p["platform"], "metrics": p["metrics"], "postUrl": p["postUrl"]} for p in posts]
    ej = json.dumps(embed, separators=(",", ":"), ensure_ascii=False).replace("</", "<\\/")
    (ROOT / "_data_embed.json").write_text(ej)

    app = (ROOT / "_app.js").read_text()
    app, n = re.subn(r'const todayPT = "[0-9]{4}-[0-9]{2}-[0-9]{2}";', f'const todayPT = "{now:%Y-%m-%d}";', app, count=1)
    if n != 1:
        raise SystemExit("todayPT replace failed")
    (ROOT / "_app.js").write_text(app)
    shell = (ROOT / "_shell.html").read_text().replace("</body>", "").replace("</html>", "")
    (ROOT / "index.html").write_text(shell.rstrip() + "\n" + ej + "\n</script>\n<script>\n" + app + "\n</script>\n</body>\n</html>\n")
    print(f"OK posts={len(posts)} range={date_range} thumbs={ok}/{len(posts)} today={now:%Y-%m-%d}")
    for cid, v in coverage.items():
        print(f"  {cid:20s} {'MISSING' if v is None else v}")


if __name__ == "__main__":
    main()
