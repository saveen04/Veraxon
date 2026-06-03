"""Image pre-processing helpers."""
import base64
import cv2
import numpy as np
from typing import Optional


def decode_base64_image(b64_string: str) -> Optional[np.ndarray]:
    """
    Decode a base64 data-URL or raw base64 string to an OpenCV BGR image.
    Returns None on failure.
    """
    try:
        if "," in b64_string:
            _, b64_string = b64_string.split(",", 1)
        raw = base64.b64decode(b64_string)
        arr = np.frombuffer(raw, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return img
    except Exception:
        return None


def to_rgb(img: np.ndarray) -> np.ndarray:
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


def resize_for_inference(img: np.ndarray, width: int = 320, height: int = 240) -> np.ndarray:
    return cv2.resize(img, (width, height), interpolation=cv2.INTER_LINEAR)


def enhance_for_low_light(img: np.ndarray) -> np.ndarray:
    """Simple CLAHE-based contrast enhancement for poor lighting conditions."""
    yuv = cv2.cvtColor(img, cv2.COLOR_BGR2YUV)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    yuv[:, :, 0] = clahe.apply(yuv[:, :, 0])
    return cv2.cvtColor(yuv, cv2.COLOR_YUV2BGR)


def check_image_quality(img: np.ndarray) -> dict:
    """
    Returns brightness and blur metrics to detect camera obstruction or poor environment.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    brightness = float(np.mean(gray))
    blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    return {
        "brightness": brightness,
        "blur_score": blur_score,
        "is_dark": brightness < 30,
        "is_blurry": blur_score < 50,
        "possibly_covered": brightness < 10,
    }
