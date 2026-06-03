"""Environment analysis: lighting, camera obstruction, background movement."""
import cv2
import numpy as np
from utils.image_utils import check_image_quality


def analyse_environment(img: np.ndarray, prev_img: Optional[np.ndarray] = None) -> dict:
    quality = check_image_quality(img)

    # Motion estimation between consecutive frames
    motion_score = 0.0
    if prev_img is not None and prev_img.shape == img.shape:
        diff = cv2.absdiff(
            cv2.cvtColor(img, cv2.COLOR_BGR2GRAY),
            cv2.cvtColor(prev_img, cv2.COLOR_BGR2GRAY),
        )
        motion_score = float(np.mean(diff))

    issues = []
    if quality["is_dark"]:
        issues.append("poor_lighting")
    if quality["possibly_covered"]:
        issues.append("camera_covered")
    if quality["is_blurry"]:
        issues.append("camera_obstructed")
    if motion_score > 40:
        issues.append("excessive_movement")

    return {
        "brightness":    quality["brightness"],
        "blur_score":    quality["blur_score"],
        "motion_score":  motion_score,
        "issues":        issues,
        "is_problematic": len(issues) > 0,
    }


# allow optional import of numpy ndarray for type hints
try:
    from numpy import ndarray as Optional  # type: ignore
except ImportError:
    pass
