"""Simple JSON-file storage for analytics, feedback, and config."""
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock

DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

ANALYTICS_FILE = DATA_DIR / "analytics.json"
FEEDBACK_FILE  = DATA_DIR / "feedback.json"
CONFIG_FILE    = DATA_DIR / "config.json"

_lock = Lock()


def _read(path: Path, default: dict) -> dict:
    if not path.exists():
        return default
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return default


def _write(path: Path, data: dict) -> None:
    with open(path, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ── Config (maintenance mode) ──────────────────────────────────────────────

def get_config() -> dict:
    return _read(CONFIG_FILE, {
        "maintenance_mode": False,
        "maintenance_message": "L'application est actuellement en maintenance suite à un volume de requêtes élevé. Revenez très bientôt !",
    })


def set_maintenance(enabled: bool, message: str | None = None) -> dict:
    with _lock:
        cfg = get_config()
        cfg["maintenance_mode"] = enabled
        if message is not None:
            cfg["maintenance_message"] = message
        _write(CONFIG_FILE, cfg)
    return cfg


def is_maintenance() -> bool:
    return get_config().get("maintenance_mode", False)


# ── Analytics ──────────────────────────────────────────────────────────────

def _parse_ua(ua: str) -> tuple[str, str]:
    """Return (browser, os) from User-Agent string."""
    ua_l = ua.lower()

    if "edg/" in ua_l:
        browser = "Edge"
    elif "chrome/" in ua_l and "chromium" not in ua_l:
        browser = "Chrome"
    elif "firefox/" in ua_l:
        browser = "Firefox"
    elif "safari/" in ua_l and "chrome" not in ua_l:
        browser = "Safari"
    elif "opr/" in ua_l or "opera" in ua_l:
        browser = "Opera"
    else:
        browser = "Autre"

    if "windows" in ua_l:
        os_ = "Windows"
    elif "mac os" in ua_l or "macos" in ua_l:
        os_ = "macOS"
    elif "linux" in ua_l:
        os_ = "Linux"
    elif "android" in ua_l:
        os_ = "Android"
    elif "iphone" in ua_l or "ipad" in ua_l:
        os_ = "iOS"
    else:
        os_ = "Autre"

    return browser, os_


def _mask_ip(ip: str) -> str:
    """Keep only first 3 octets for privacy."""
    parts = ip.split(".")
    if len(parts) == 4:
        return ".".join(parts[:3]) + ".x"
    return ip


def track_generation(
    request_ip: str,
    user_agent: str,
    referer: str,
    brand_name: str,
    logos_count: int,
) -> None:
    browser, os_ = _parse_ua(user_agent)
    event = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "ip": _mask_ip(request_ip),
        "browser": browser,
        "os": os_,
        "referer": referer or "Direct",
        "brand": brand_name or "—",
        "logos": logos_count,
    }
    with _lock:
        data = _read(ANALYTICS_FILE, {"events": []})
        data["events"].append(event)
        _write(ANALYTICS_FILE, data)


def get_analytics() -> dict:
    data = _read(ANALYTICS_FILE, {"events": []})
    events = data.get("events", [])

    now = datetime.now(timezone.utc)
    today = now.date().isoformat()
    this_week_start = (now.date().toordinal() - now.weekday())

    total_logos = sum(e.get("logos", 0) for e in events)
    today_events = [e for e in events if e.get("ts", "").startswith(today)]
    week_events = [
        e for e in events
        if datetime.fromisoformat(e["ts"]).date().toordinal() >= this_week_start
    ]

    # Per-day counts (last 14 days)
    from collections import defaultdict
    daily: dict[str, int] = defaultdict(int)
    for e in events:
        day = e.get("ts", "")[:10]
        daily[day] += e.get("logos", 0)

    # Browser breakdown
    browsers: dict[str, int] = defaultdict(int)
    for e in events:
        browsers[e.get("browser", "Autre")] += 1

    # OS breakdown
    oses: dict[str, int] = defaultdict(int)
    for e in events:
        oses[e.get("os", "Autre")] += 1

    # Origins (referer)
    origins: dict[str, int] = defaultdict(int)
    for e in events:
        origins[e.get("referer", "Direct")] += 1

    return {
        "total_generations": len(events),
        "total_logos": total_logos,
        "today_generations": len(today_events),
        "week_generations": len(week_events),
        "daily": dict(sorted(daily.items())[-14:]),
        "browsers": dict(browsers),
        "os": dict(oses),
        "origins": dict(origins),
        "recent": list(reversed(events[-50:])),
    }


# ── Feedback ───────────────────────────────────────────────────────────────

def save_feedback(rating: int, message: str, ip: str) -> None:
    entry = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "rating": max(1, min(5, rating)),
        "message": message.strip()[:1000],
        "ip": _mask_ip(ip),
    }
    with _lock:
        data = _read(FEEDBACK_FILE, {"feedbacks": []})
        data["feedbacks"].append(entry)
        _write(FEEDBACK_FILE, data)


def get_feedback() -> dict:
    data = _read(FEEDBACK_FILE, {"feedbacks": []})
    feedbacks = data.get("feedbacks", [])
    ratings = [f["rating"] for f in feedbacks if "rating" in f]
    avg = round(sum(ratings) / len(ratings), 1) if ratings else 0
    return {
        "total": len(feedbacks),
        "average_rating": avg,
        "feedbacks": list(reversed(feedbacks)),
    }
