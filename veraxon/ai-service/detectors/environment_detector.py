"""
Environment detector — lighting quality, camera obstruction, motion.
"""
import numpy as np
from typing import Optional
from utils.environment_utils import analyse_environment
from utils.logging_utils import get_logger

logger = get_logger("environment_detector")


class EnvironmentDetector:
    """Stateful: remembers previous frame for motion estimation."""

    def __init__(self):
        self._prev_frame: Optional[np.ndarray] = None

    def detect(self, bgr_img: np.ndarray) -> dict:
        result = analyse_environment(bgr_img, self._prev_frame)
        self._prev_frame = bgr_img.copy()

        violations = result["issues"]
        return {
            "status":           "problematic" if result["is_problematic"] else "safe",
            "issues":           violations,
            "brightness":       round(result["brightness"], 2),
            "blur_score":       round(result["blur_score"], 2),
            "motion_score":     round(result["motion_score"], 2),
            "camera_covered":   "camera_covered" in violations,
            "poor_lighting":    "poor_lighting" in violations,
        }

    def reset(self):
        self._prev_frame = None
