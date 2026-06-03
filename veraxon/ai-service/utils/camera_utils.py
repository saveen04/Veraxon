"""Camera and video stream utilities."""
import cv2
import numpy as np
from typing import Optional


def capture_frame_from_stream(cap: cv2.VideoCapture) -> Optional[np.ndarray]:
    """Read one frame from an OpenCV VideoCapture. Returns None on failure."""
    if not cap.isOpened():
        return None
    ret, frame = cap.read()
    return frame if ret else None


def flip_horizontal(img: np.ndarray) -> np.ndarray:
    """Mirror image (selfie-style — matches browser canvas mirroring)."""
    return cv2.flip(img, 1)


def draw_face_box(
    img: np.ndarray,
    x: int, y: int, w: int, h: int,
    color: tuple = (0, 82, 204),
    label: str = "Face",
    thickness: int = 2,
) -> np.ndarray:
    out = img.copy()
    cv2.rectangle(out, (x, y), (x + w, y + h), color, thickness)
    cv2.putText(out, label, (x, max(y - 8, 0)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1, cv2.LINE_AA)
    return out


def draw_object_box(
    img: np.ndarray,
    x1: int, y1: int, x2: int, y2: int,
    label: str,
    confidence: float,
    color: tuple = (222, 53, 11),
) -> np.ndarray:
    out = img.copy()
    cv2.rectangle(out, (x1, y1), (x2, y2), color, 2)
    text = f"{label} {confidence:.2f}"
    cv2.putText(out, text, (x1, max(y1 - 6, 0)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1, cv2.LINE_AA)
    return out


def encode_frame_jpeg(img: np.ndarray, quality: int = 70) -> bytes:
    """Encode BGR image to JPEG bytes."""
    _, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, quality])
    return buf.tobytes()
