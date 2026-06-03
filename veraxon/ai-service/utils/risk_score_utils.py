"""
Risk scoring engine.
Takes a dict of boolean/int infraction signals and returns
a 0-100 risk score with a named level.
"""
from config import RISK_WEIGHTS, RISK_LEVELS


def compute_risk_score(infractions: dict) -> dict:
    """
    infractions keys should match RISK_WEIGHTS keys.
    Values: True/1 = active, False/0 = inactive.
    Returns { score: int, level: str }
    """
    score = 0
    for key, weight in RISK_WEIGHTS.items():
        if infractions.get(key):
            score += weight

    score = min(score, 100)

    level = "low"
    for lvl, (lo, hi) in RISK_LEVELS.items():
        if lo <= score <= hi:
            level = lvl
            break

    return {"score": score, "level": level}


def build_infractions(
    no_face: bool = False,
    multiple_faces: bool = False,
    phone_detected: bool = False,
    book_detected: bool = False,
    looking_away: bool = False,
    head_turned: bool = False,
    voice_anomaly: bool = False,
    tab_switch: bool = False,
    fullscreen_exit: bool = False,
    environment: bool = False,
) -> dict:
    return {
        "no_face":         no_face,
        "multiple_faces":  multiple_faces,
        "phone_detected":  phone_detected,
        "book_detected":   book_detected,
        "looking_away":    looking_away,
        "head_turned":     head_turned,
        "voice_anomaly":   voice_anomaly,
        "tab_switch":      tab_switch,
        "fullscreen_exit": fullscreen_exit,
        "environment":     environment,
    }
