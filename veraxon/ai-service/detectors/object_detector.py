"""
Object detector — phones, tablets, books, earphones, additional screens.
Uses YOLOv8/v11 via Ultralytics.  Swap model file in config.py.
"""
import numpy as np
from utils.logging_utils import get_logger
from utils.model_loader_utils import load_yolo
from config import OBJECT_CONFIDENCE_THRESHOLD, PROHIBITED_CLASSES, BREACH_CLASSES, YOLO_MODEL_PATH

logger = get_logger("object_detector")


class ObjectDetector:
    """
    Extensible YOLO-based detector.
    Add new prohibited COCO class IDs in config.PROHIBITED_CLASSES without
    touching this class.
    """

    def __init__(self):
        self._model = load_yolo(YOLO_MODEL_PATH)

    def detect(self, bgr_img: np.ndarray) -> dict:
        """
        Returns:
          objects_detected   list[dict]  — each: {class_id, label, confidence, bbox}
          phone_detected     bool
          book_detected      bool
          any_prohibited     bool
          breach             bool        — True if a BREACH_CLASS object found
          top_confidence     float
        """
        if self._model is None:
            return self._fallback()

        found       = []
        phone       = False
        book        = False
        breach      = False
        top_conf    = 0.0

        try:
            results = self._model(bgr_img, verbose=False, conf=OBJECT_CONFIDENCE_THRESHOLD)
            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0])
                    if cls_id not in PROHIBITED_CLASSES:
                        continue
                    conf  = float(box.conf[0])
                    label = PROHIBITED_CLASSES[cls_id]
                    xyxy  = box.xyxy[0].tolist()
                    found.append({
                        "class_id":   cls_id,
                        "label":      label,
                        "confidence": round(conf, 3),
                        "bbox":       [round(v) for v in xyxy],
                    })
                    if cls_id == 67 or label == "cell_phone":
                        phone = True
                    if label == "book":
                        book = True
                    if cls_id in BREACH_CLASSES:
                        breach = True
                    top_conf = max(top_conf, conf)
        except Exception as exc:
            logger.warning("Object detection error: %s", exc)

        return {
            "objects_detected": found,
            "phone_detected":   phone,
            "book_detected":    book,
            "any_prohibited":   len(found) > 0,
            "breach":           breach,
            "top_confidence":   round(top_conf, 3),
        }

    @staticmethod
    def _fallback() -> dict:
        return {
            "objects_detected": [], "phone_detected": False,
            "book_detected": False, "any_prohibited": False,
            "breach": False, "top_confidence": 0.0,
        }
