"""
Anomaly detector — RandomForest malpractice classifier.
Feature vector: [face_count, phone_detected, looking_away, head_turned, voice_anomaly, env_issues]
Classes: 0=Normal, 1=Suspicious, 2=Breach
"""
import numpy as np
from utils.model_loader_utils import load_sklearn_rf
from utils.logging_utils import get_logger

logger = get_logger("anomaly_detector")

# Training data — extends naturally as more signal columns are added
_X_TRAIN = [
    [1, 0, 0, 0, 0, 0],   # Normal
    [1, 0, 1, 0, 0, 0],   # Suspicious (looking away)
    [1, 0, 0, 1, 0, 0],   # Suspicious (head turned)
    [0, 0, 0, 0, 0, 0],   # Suspicious (no face)
    [2, 0, 0, 0, 0, 0],   # Suspicious (multiple faces)
    [1, 0, 0, 0, 1, 0],   # Suspicious (voice anomaly)
    [1, 0, 0, 0, 0, 1],   # Suspicious (env issue)
    [1, 1, 0, 0, 0, 0],   # Breach (phone)
    [1, 1, 1, 0, 0, 0],   # Breach (phone + looking away)
    [2, 1, 0, 1, 0, 0],   # Breach (multi-face + phone + head turned)
]
_Y_TRAIN = [0, 1, 1, 1, 1, 1, 1, 2, 2, 2]


class AnomalyDetector:
    LABELS = {0: "Normal", 1: "Suspicious", 2: "Breach"}

    def __init__(self):
        self._rf = load_sklearn_rf(_X_TRAIN, _Y_TRAIN)

    def predict(
        self,
        face_count:    int   = 1,
        phone_detected: bool = False,
        looking_away:  bool  = False,
        head_turned:   bool  = False,
        voice_anomaly: bool  = False,
        env_issues:    bool  = False,
    ) -> dict:
        features = [[
            face_count,
            int(phone_detected),
            int(looking_away),
            int(head_turned),
            int(voice_anomaly),
            int(env_issues),
        ]]

        if self._rf is None:
            return self._rule_based(face_count, phone_detected, looking_away, head_turned)

        try:
            pred  = int(self._rf.predict(features)[0])
            proba = self._rf.predict_proba(features)[0].tolist()
        except Exception as exc:
            logger.warning("RF predict error: %s", exc)
            return self._rule_based(face_count, phone_detected, looking_away, head_turned)

        return {
            "class":       pred,
            "decision":    self.LABELS[pred],
            "severity":    "breach" if pred == 2 else ("warning" if pred == 1 else "secure"),
            "probabilities": [round(p, 3) for p in proba],
        }

    @classmethod
    def _rule_based(cls, face_count, phone, looking_away, head_turned) -> dict:
        if phone:
            c = 2
        elif face_count != 1 or looking_away or head_turned:
            c = 1
        else:
            c = 0
        return {
            "class": c, "decision": cls.LABELS[c],
            "severity": "breach" if c == 2 else ("warning" if c == 1 else "secure"),
            "probabilities": [1.0 if i == c else 0.0 for i in range(3)],
        }
