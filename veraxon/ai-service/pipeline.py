"""
Veraxon Unified AI Proctoring Pipeline
=======================================
Single entry-point that wires every detector together.
Callers only interact with ProctorPipeline.process_frame().

Adding a new detector = instantiate it here + call it in _run_detectors().
No changes needed anywhere else.
"""

import numpy as np
from typing import Optional

from detectors.face_detector        import FaceDetector
from detectors.object_detector      import ObjectDetector
from detectors.voice_detector       import VoiceDetector
from detectors.environment_detector import EnvironmentDetector
from detectors.anomaly_detector     import AnomalyDetector

from utils.image_utils       import decode_base64_image, to_rgb
from utils.risk_score_utils  import compute_risk_score, build_infractions
from utils.violation_utils   import build_violation_event, get_violation_severity
from utils.performance_utils import pipeline_tracker
from utils.logging_utils     import get_logger, log_detection, log_violation

logger = get_logger("pipeline")


class ProctorPipeline:
    """
    Thread-safe stateless pipeline (environment detector keeps internal state
    for motion estimation — one instance per exam session is recommended).
    """

    def __init__(self):
        self.face_det  = FaceDetector()
        self.obj_det   = ObjectDetector()
        self.voice_det = VoiceDetector()
        self.env_det   = EnvironmentDetector()
        self.anomaly   = AnomalyDetector()
        logger.info("ProctorPipeline initialised")

    # ─── Public API ───────────────────────────────────────────────

    def process_frame(
        self,
        image_b64:    str,
        exam_id:      str = "",
        student_id:   str = "",
        student_name: str = "Candidate",
        audio_chunk:  Optional[np.ndarray] = None,
        violation_count: int = 0,
    ) -> dict:
        """
        Full pipeline for one webcam frame.

        Returns a structured dict consumed by:
          - Next.js /api/proctor/detect  (HTTP)
          - WebSocket /api/proctor/stream
        """
        pipeline_tracker.start()

        # ── 1. Decode image ───────────────────────────────────────
        bgr = decode_base64_image(image_b64)
        if bgr is None:
            return self._error("Invalid image data")

        rgb = to_rgb(bgr)

        # ── 2. Run all detectors ──────────────────────────────────
        face   = self.face_det.detect(rgb)
        obj    = self.obj_det.detect(bgr)
        env    = self.env_det.detect(bgr)
        voice  = self.voice_det.detect(audio_chunk) if audio_chunk is not None \
                 else VoiceDetector.fallback()

        # ── 3. Build infraction map ───────────────────────────────
        inf = build_infractions(
            no_face         = face["face_count"] == 0,
            multiple_faces  = face["face_count"] > 1,
            phone_detected  = obj["phone_detected"],
            book_detected   = obj["book_detected"],
            looking_away    = face["looking_away"],
            head_turned     = face["head_turned"],
            voice_anomaly   = voice["anomaly"],
            tab_switch      = False,   # browser-side event, injected externally
            fullscreen_exit = False,   # browser-side event, injected externally
            environment     = env["is_problematic"] if hasattr(env, "__contains__")
                              else env.get("status") == "problematic",
        )

        # ── 4. Risk score ─────────────────────────────────────────
        risk = compute_risk_score(inf)

        # ── 5. ML decision ────────────────────────────────────────
        ml = self.anomaly.predict(
            face_count     = face["face_count"],
            phone_detected = obj["phone_detected"],
            looking_away   = face["looking_away"],
            head_turned    = face["head_turned"],
            voice_anomaly  = voice["anomaly"],
            env_issues     = env.get("status") == "problematic",
        )

        # ── 6. Determine primary violation type ──────────────────
        vtype = self._primary_violation(inf, ml["severity"])

        # ── 7. Violation event payload ────────────────────────────
        viol_event = None
        if ml["severity"] in ("warning", "breach"):
            viol_event = build_violation_event(
                exam_id         = exam_id,
                student_id      = student_id,
                student_name    = student_name,
                violation_type  = vtype,
                violation_count = violation_count + 1,
                risk_score      = risk["score"],
            )
            log_violation(logger, exam_id, student_id, vtype, ml["severity"])

        latency = pipeline_tracker.stop()
        log_detection(logger, f"{exam_id}:{student_id}", {
            "decision": ml["decision"], "severity": ml["severity"], "risk_score": risk["score"],
        })

        return {
            "success":    True,
            "decision":   ml["decision"],
            "severity":   ml["severity"],
            "risk":       risk,
            "infractions": inf,
            "metrics": {
                "face_count":        face["face_count"],
                "face_confidence":   face["confidence"],
                "phone_confidence":  obj["top_confidence"],
                "objects":           obj["objects_detected"],
                "voice_status":      voice["status"],
                "vad_prob":          voice["vad_prob"],
                "environment":       env,
                "ml_probabilities":  ml["probabilities"],
                "latency_ms":        round(latency, 1),
            },
            "violation_event": viol_event,
        }

    def process_browser_event(
        self,
        event_type:   str,
        exam_id:      str = "",
        student_id:   str = "",
        student_name: str = "Candidate",
        violation_count: int = 0,
    ) -> dict:
        """
        Handle tab-switch / fullscreen-exit events sent from the browser.
        No image needed — returns a violation payload directly.
        """
        inf = build_infractions(
            tab_switch      = event_type == "tab_switch",
            fullscreen_exit = event_type == "fullscreen_exit",
        )
        risk = compute_risk_score(inf)
        sev  = "warning" if risk["score"] < 80 else "breach"

        viol_event = build_violation_event(
            exam_id         = exam_id,
            student_id      = student_id,
            student_name    = student_name,
            violation_type  = event_type,
            violation_count = violation_count + 1,
            risk_score      = risk["score"],
        )
        log_violation(logger, exam_id, student_id, event_type, sev)

        return {
            "success":         True,
            "decision":        "Suspicious",
            "severity":        sev,
            "risk":            risk,
            "infractions":     inf,
            "violation_event": viol_event,
        }

    # ─── Helpers ──────────────────────────────────────────────────

    @staticmethod
    def _primary_violation(inf: dict, severity: str) -> str:
        priority = [
            "phone_detected", "multiple_faces", "no_face",
            "book_detected",  "looking_away",   "head_turned",
            "voice_anomaly",  "environment",
        ]
        for key in priority:
            if inf.get(key):
                return key
        return "anomaly_detected"

    @staticmethod
    def _error(msg: str) -> dict:
        return {
            "success":   False,
            "error":     msg,
            "decision":  "Normal",
            "severity":  "secure",
            "risk":      {"score": 0, "level": "low"},
            "infractions": {},
            "metrics":   {},
            "violation_event": None,
        }
