"""
Centralised model management.
Loads each model once, caches the instance, handles fallbacks.
Designed so adding a new model requires only adding a new loader here.
"""
import os
from utils.logging_utils import get_logger

logger = get_logger("model_loader")

# ─── Model registry ───────────────────────────────────────────────
_models = {}


def load_yolo(model_path: str = "yolov8n.pt"):
    key = f"yolo:{model_path}"
    if key in _models:
        return _models[key]
    try:
        from ultralytics import YOLO
        model = YOLO(model_path)
        _models[key] = model
        logger.info("YOLO loaded: %s", model_path)
        return model
    except Exception as e:
        logger.warning("YOLO failed to load (%s): %s", model_path, e)
        _models[key] = None
        return None


def load_mediapipe_face_detection():
    key = "mp:face_detection"
    if key in _models:
        return _models[key]
    try:
        import mediapipe as mp
        _models[key] = mp.solutions.face_detection
        _models["mp:face_mesh"] = mp.solutions.face_mesh
        logger.info("MediaPipe face_detection and face_mesh loaded")
        return _models[key]
    except Exception as e:
        logger.warning("MediaPipe failed to load: %s", e)
        _models[key] = None
        return None


def load_mediapipe_face_mesh():
    load_mediapipe_face_detection()  # loads both
    return _models.get("mp:face_mesh")


def load_sklearn_rf(X_train, y_train):
    key = "sklearn:rf"
    if key in _models:
        return _models[key]
    try:
        from sklearn.ensemble import RandomForestClassifier
        import numpy as np
        rf = RandomForestClassifier(n_estimators=15, random_state=42)
        rf.fit(np.array(X_train), np.array(y_train))
        _models[key] = rf
        logger.info("RandomForest trained and cached")
        return rf
    except Exception as e:
        logger.warning("RandomForest failed: %s", e)
        _models[key] = None
        return None


def get_model(key: str):
    return _models.get(key)


def list_loaded_models() -> dict:
    return {k: ("loaded" if v is not None else "failed") for k, v in _models.items()}
