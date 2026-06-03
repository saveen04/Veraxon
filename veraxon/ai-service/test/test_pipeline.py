"""
Veraxon AI Proctoring — Test Suite
===================================
Tests every case from the specification.
Run: pytest test/test_pipeline.py -v

Requires: pip install pytest numpy
"""

import sys
import os
import base64
import numpy as np
import pytest

# Make ai-service root importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from utils.risk_score_utils  import compute_risk_score, build_infractions
from utils.violation_utils   import build_violation_event, get_violation_severity, should_auto_submit
from utils.image_utils       import decode_base64_image, check_image_quality
from utils.performance_utils import LatencyTracker


# ─── Helpers ──────────────────────────────────────────────────────

def _make_blank_b64(w=64, h=64, color=(50, 50, 50)):
    """Create a tiny solid-colour JPEG as base64 data-URL."""
    import cv2
    img = np.full((h, w, 3), color, dtype=np.uint8)
    _, buf = cv2.imencode(".jpg", img)
    b64 = base64.b64encode(buf.tobytes()).decode()
    return f"data:image/jpeg;base64,{b64}"


def _make_bright_b64(w=64, h=64):
    return _make_blank_b64(w, h, color=(200, 200, 200))


def _make_dark_b64(w=64, h=64):
    return _make_blank_b64(w, h, color=(5, 5, 5))


# ─── Risk score tests ──────────────────────────────────────────────

class TestRiskScore:
    def test_no_infractions_is_zero(self):
        inf = build_infractions()
        result = compute_risk_score(inf)
        assert result["score"] == 0
        assert result["level"] == "low"

    def test_no_face_raises_score(self):
        inf = build_infractions(no_face=True)
        result = compute_risk_score(inf)
        assert result["score"] >= 30

    def test_phone_is_critical(self):
        inf = build_infractions(phone_detected=True, multiple_faces=True, looking_away=True)
        result = compute_risk_score(inf)
        assert result["score"] == 100  # capped
        assert result["level"] == "critical"

    def test_moderate_range(self):
        inf = build_infractions(looking_away=True, head_turned=True)
        result = compute_risk_score(inf)
        assert 21 <= result["score"] <= 50
        assert result["level"] == "moderate"

    def test_score_capped_at_100(self):
        inf = build_infractions(
            no_face=True, multiple_faces=True, phone_detected=True,
            looking_away=True, head_turned=True, voice_anomaly=True,
            tab_switch=True, fullscreen_exit=True
        )
        assert compute_risk_score(inf)["score"] == 100


# ─── Violation workflow tests ──────────────────────────────────────

class TestViolationWorkflow:
    def test_first_violation_is_warning(self):
        assert get_violation_severity(1) == "warning"

    def test_second_violation_is_warning(self):
        assert get_violation_severity(2) == "warning"

    def test_third_violation_is_warning(self):
        assert get_violation_severity(3) == "warning"

    def test_fourth_violation_triggers_breach(self):
        assert get_violation_severity(4) == "breach"

    def test_auto_submit_false_below_threshold(self):
        assert not should_auto_submit(3)

    def test_auto_submit_true_at_threshold(self):
        assert should_auto_submit(4)

    def test_violation_event_structure(self):
        event = build_violation_event("exam1", "uid1", "Alice", "phone_detected", 1)
        assert event["examId"]    == "exam1"
        assert event["studentId"] == "uid1"
        assert event["type"]      == "phone_detected"
        assert event["severity"]  == "warning"
        assert event["autoSubmit"] is False

    def test_violation_event_auto_submit_true(self):
        event = build_violation_event("exam1", "uid1", "Alice", "tab_switch", 4)
        assert event["severity"]   == "breach"
        assert event["autoSubmit"] is True


# ─── Image utils tests ────────────────────────────────────────────

class TestImageUtils:
    def test_decode_valid_b64(self):
        b64 = _make_bright_b64()
        img = decode_base64_image(b64)
        assert img is not None
        assert img.shape[2] == 3   # BGR channels

    def test_decode_invalid_returns_none(self):
        assert decode_base64_image("not_valid_base64!!") is None

    def test_bright_image_not_dark(self):
        import cv2
        img = np.full((64, 64, 3), 200, dtype=np.uint8)
        quality = check_image_quality(img)
        assert not quality["is_dark"]
        assert not quality["possibly_covered"]

    def test_dark_image_flagged(self):
        img = np.full((64, 64, 3), 4, dtype=np.uint8)
        quality = check_image_quality(img)
        assert quality["is_dark"]
        assert quality["possibly_covered"]


# ─── Performance tracker tests ────────────────────────────────────

class TestPerformanceTracker:
    def test_avg_latency_recorded(self):
        import time
        tracker = LatencyTracker(window=5)
        for _ in range(3):
            tracker.start()
            time.sleep(0.005)  # 5 ms
            tracker.stop()
        assert tracker.avg_ms > 0

    def test_report_keys(self):
        tracker = LatencyTracker()
        tracker.start()
        tracker.stop()
        report = tracker.report()
        assert "avg_latency_ms" in report
        assert "max_latency_ms" in report
        assert "samples" in report


# ─── Environment analysis tests ───────────────────────────────────

class TestEnvironmentDetection:
    def test_bright_frame_is_safe(self):
        from detectors.environment_detector import EnvironmentDetector
        det = EnvironmentDetector()
        img = np.full((240, 320, 3), 180, dtype=np.uint8)
        result = det.detect(img)
        assert result["status"] == "safe"
        assert not result["poor_lighting"]

    def test_dark_frame_is_problematic(self):
        from detectors.environment_detector import EnvironmentDetector
        det = EnvironmentDetector()
        img = np.full((240, 320, 3), 4, dtype=np.uint8)
        result = det.detect(img)
        assert result["poor_lighting"]


# ─── Anomaly detector tests ───────────────────────────────────────

class TestAnomalyDetector:
    def test_normal_prediction(self):
        from detectors.anomaly_detector import AnomalyDetector
        det = AnomalyDetector()
        result = det.predict(face_count=1)
        assert result["decision"] == "Normal"
        assert result["severity"] == "secure"

    def test_no_face_is_suspicious(self):
        from detectors.anomaly_detector import AnomalyDetector
        det = AnomalyDetector()
        result = det.predict(face_count=0)
        assert result["severity"] in ("warning", "breach")

    def test_phone_is_breach(self):
        from detectors.anomaly_detector import AnomalyDetector
        det = AnomalyDetector()
        result = det.predict(face_count=1, phone_detected=True)
        assert result["severity"] == "breach"


# ─── Specification test cases ──────────────────────────────────────

class TestSpecCases:
    """
    Directly maps to the 10 test cases in the specification.
    """

    def test_case_1_single_student_visible(self):
        """TC1: Single face → Pass (Normal, secure)."""
        inf = build_infractions()
        risk = compute_risk_score(inf)
        assert risk["level"] == "low"
        assert risk["score"] == 0

    def test_case_2_student_leaves_frame(self):
        """TC2: No face → Warning."""
        inf = build_infractions(no_face=True)
        risk = compute_risk_score(inf)
        sev = get_violation_severity(1)
        assert risk["score"] >= 30
        assert sev == "warning"

    def test_case_3_no_face_violation_logged(self):
        """TC3: No face detected → violation event created."""
        event = build_violation_event("ex1", "s1", "Bob", "no_face", 1, risk_score=30)
        assert event["type"] == "no_face"
        assert event["severity"] == "warning"

    def test_case_4_multiple_faces_violation(self):
        """TC4: Multiple faces → violation + breach."""
        inf = build_infractions(multiple_faces=True)
        risk = compute_risk_score(inf)
        assert risk["score"] >= 45
        event = build_violation_event("ex1", "s1", "Bob", "multiple_faces", 2)
        assert event["type"] == "multiple_faces"

    def test_case_5_camera_blocked_warning(self):
        """TC5: Camera blocked (dark frame) → warning."""
        img = np.full((240, 320, 3), 3, dtype=np.uint8)
        from utils.image_utils import check_image_quality
        q = check_image_quality(img)
        assert q["possibly_covered"]

    def test_case_6_additional_voice_violation(self):
        """TC6: Voice anomaly → violation logged."""
        inf = build_infractions(voice_anomaly=True)
        risk = compute_risk_score(inf)
        assert risk["score"] >= 25
        event = build_violation_event("ex1", "s1", "Bob", "voice_anomaly", 1)
        assert event["type"] == "voice_anomaly"

    def test_case_7_tab_switching_violation(self):
        """TC7: Tab switch → violation logged."""
        inf = build_infractions(tab_switch=True)
        risk = compute_risk_score(inf)
        assert risk["score"] >= 20

    def test_case_8_browser_minimized_violation(self):
        """TC8: Browser minimized = fullscreen exit → violation."""
        inf = build_infractions(fullscreen_exit=True)
        assert compute_risk_score(inf)["score"] >= 15

    def test_case_9_mobile_phone_violation(self):
        """TC9: Phone detected → breach."""
        inf = build_infractions(phone_detected=True)
        risk = compute_risk_score(inf)
        assert risk["score"] >= 50
        assert risk["level"] in ("high", "critical")

    def test_case_10_auto_submit_after_max_violations(self):
        """TC10: 4th violation → auto-submit."""
        assert should_auto_submit(4)
        event = build_violation_event("ex1", "s1", "Bob", "identity_mismatch", 4)
        assert event["autoSubmit"] is True
        assert event["severity"] == "breach"
