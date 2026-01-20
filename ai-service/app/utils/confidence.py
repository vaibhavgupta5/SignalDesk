def normalize_confidence(score: float) -> float:
    try:
        s = float(score)
    except Exception:
        return 0.0
    return max(0.0, min(1.0, s))
