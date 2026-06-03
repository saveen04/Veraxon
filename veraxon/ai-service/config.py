"""
Veraxon AI Proctoring Service — Centralized Configuration
All detection thresholds, risk weights, and session parameters live here.
Update this file to tune behaviour without touching detector logic.
"""

from dataclasses import dataclass, field
from typing import Dict


# ─── Face detection ───────────────────────────────────────────────
FACE_DETECTION_CONFIDENCE   = 0.50   # MediaPipe min detection confidence
FACE_MESH_CONFIDENCE        = 0.50   # MediaPipe face-mesh confidence
HEAD_TURN_RATIO_HIGH        = 1.80   # nose-to-eye ratio → head turned right
HEAD_TURN_RATIO_LOW         = 0.55   # nose-to-eye ratio → head turned left
GAZE_IRIS_THRESHOLD         = 0.015  # iris proximity to outer eye → looking away
NO_FACE_WARNING_FRAMES      = 3      # consecutive empty frames before warning
NO_FACE_VIOLATION_FRAMES    = 8      # consecutive empty frames before violation
FACE_ABSENCE_TIMEOUT_SEC    = 5.0    # seconds of absence → record violation

# ─── Object detection ─────────────────────────────────────────────
OBJECT_CONFIDENCE_THRESHOLD = 0.45   # YOLO minimum box confidence
# COCO class IDs for prohibited objects
PROHIBITED_CLASSES: Dict[int, str] = {
    67: "cell_phone",
    77: "cell_phone",   # 'remote' — treated as device
    73: "book",
    74: "clock",        # suspicious in exam context
    63: "laptop",
    64: "mouse",
    65: "keyboard",     # secondary device
    76: "scissors",
    84: "book",
}
BREACH_CLASSES = {67, 77, 63}        # immediate breach vs. warning

# ─── Voice detection ──────────────────────────────────────────────
VOICE_SAMPLE_RATE           = 16000
VOICE_SILENCE_THRESHOLD     = 0.01   # RMS below this → silent
VOICE_ANOMALY_THRESHOLD     = 0.60   # Silero VAD probability threshold
MULTIPLE_SPEAKER_THRESHOLD  = 2      # pyannote diarization speaker count

# ─── Risk scoring weights ─────────────────────────────────────────
RISK_WEIGHTS = {
    "no_face":          30,
    "multiple_faces":   45,
    "phone_detected":   50,
    "book_detected":    25,
    "looking_away":     20,
    "head_turned":      15,
    "voice_anomaly":    25,
    "tab_switch":       20,
    "fullscreen_exit":  15,
    "environment":      10,
}

RISK_LEVELS = {
    "low":      (0,  20),
    "moderate": (21, 50),
    "high":     (51, 80),
    "critical": (81, 100),
}

# ─── Violation workflow ───────────────────────────────────────────
MAX_WARNINGS_BEFORE_SUBMIT  = 3      # 3 warnings → auto-submit on 4th
VIOLATION_COOLDOWN_SEC      = 8.0    # min seconds between same violation type

# ─── Session ──────────────────────────────────────────────────────
SESSION_TIMEOUT_SEC         = 7200   # 2 hours max session
FRAME_INTERVAL_MS           = 1500   # WebSocket frame cadence (ms)
SNAPSHOT_WIDTH              = 320
SNAPSHOT_HEIGHT             = 240

# ─── Model paths / versions ───────────────────────────────────────
YOLO_MODEL_PATH             = "yolov8n.pt"   # upgrade to yolov11n.pt when available
YOLO_MODEL_VERSION          = "yolov8n"

# ─── Logging ──────────────────────────────────────────────────────
LOG_LEVEL                   = "INFO"
LOG_DETECTIONS              = True
LOG_VIOLATIONS              = True
LOG_PERFORMANCE             = True
