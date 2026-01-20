from datetime import datetime


def parse_iso(text: str):
    try:
        return datetime.fromisoformat(text)
    except Exception:
        return None
