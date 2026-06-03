"""
Face detector — presence, count, head pose, gaze.
Uses MediaPipe Face Detection + Face Mesh.
"""
import numpy as np
from typing import Optional
from utils.logging_utils import get_logger
from utils.model_loader_utils import load_mediapipe_face_detection, load_mediapipe_face_mesh
from config import (
    FACE_DETECTION_CONFIDENCE, FACE_MESH_CONFIDENCE,
    HEAD_TURN_RATIO_HIGH, HEAD_TURN_RATIO_LOW, GAZE_IRIS_THRESHOLD,
)

logger = get_logger("face_detector")


class FaceDetector:
    """
    Stateless face analysis.  Call detect(rgb_img) per frame.
    Scalable: swap MediaPipe for DeepFace or any model without changing callers.
    """

    def __init__(self):
        self._mp_detection = load_mediapipe_face_detection()
        self._mp_mesh      = load_mediapipe_face_mesh()
        self._available    = self._mp_detection is not None

    def detect(self, rgb_img: np.ndarray) -> dict:
        """
        Returns:
          face_count      int
          looking_away    bool
          head_turned     bool
          landmarks       list | None
          confidence      float  (highest detection score)
        """
        if not self._available:
            return self._fallback()

        face_count  = 0
        looking_away = False
        head_turned  = False
        confidence   = 0.0
        landmarks    = None

        try:
            # ── Face count via Face Detection ──────────────────────
            mp_fd = self._mp_detection
            with mp_fd.FaceDetection(
                model_selection=0,
                min_detection_confidence=FACE_DETECTION_CONFIDENCE,
            ) as detector:
                result = detector.process(rgb_img)
                if result.detections:
                    face_count = len(result.detections)
                    confidence = max(
                        d.score[0] for d in result.detections if d.score
                    )

            # ── Head pose + gaze via Face Mesh (single-face only) ──
            if face_count == 1:
                mp_mesh = self._mp_mesh
                with mp_mesh.FaceMesh(
                    max_num_faces=1,
                    refine_landmarks=True,
                    min_detection_confidence=FACE_MESH_CONFIDENCE,
                    min_tracking_confidence=FACE_MESH_CONFIDENCE,
                ) as mesh:
                    mesh_result = mesh.process(rgb_img)
                    if mesh_result.multi_face_landmarks:
                        lm = mesh_result.multi_face_landmarks[0].landmark
                        landmarks = lm

                        # Head turn — nose to eye-corner ratio
                        nose       = lm[4]
                        eye_left   = lm[33]
                        eye_right  = lm[263]
                        d_left  = abs(nose.x - eye_left.x)
                        d_right = abs(nose.x - eye_right.x)
                        ratio   = d_left / max(d_right, 1e-6)
                        if ratio > HEAD_TURN_RATIO_HIGH or ratio < HEAD_TURN_RATIO_LOW:
                            head_turned = True

                        # Gaze — iris proximity to outer eye corners
                        try:
                            iris = lm[468]   # left iris centre
                            if (
                                abs(iris.x - eye_left.x) < GAZE_IRIS_THRESHOLD
                                or abs(iris.x - eye_right.x) < GAZE_IRIS_THRESHOLD
                            ):
                                looking_away = True
                        except (IndexError, AttributeError):
                            pass

        except Exception as exc:
            logger.warning("Face detection error: %s", exc)
            face_count = 1  # graceful default

        return {
            "face_count":   face_count,
            "looking_away": looking_away,
            "head_turned":  head_turned,
            "landmarks":    landmarks,
            "confidence":   round(confidence, 3),
        }

    @staticmethod
    def _fallback() -> dict:
        return {
            "face_count": 1, "looking_away": False,
            "head_turned": False, "landmarks": None, "confidence": 0.0,
        }
