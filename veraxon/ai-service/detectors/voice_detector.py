"""
Voice activity detector.
Uses Silero VAD when available; falls back to RMS-based heuristic.
Designed so Whisper or Pyannote can be plugged in without changing callers.
"""
import numpy as np
from utils.logging_utils import get_logger
from utils.audio_utils import detect_voice_activity, compute_rms
from config import VOICE_ANOMALY_THRESHOLD

logger = get_logger("voice_detector")

# Lazy-load Silero VAD once
_vad_model  = None
_vad_utils  = None
_vad_loaded = False


def _load_silero():
    global _vad_model, _vad_utils, _vad_loaded
    if _vad_loaded:
        return
    _vad_loaded = True
    try:
        import torch
        model, utils = torch.hub.load(
            repo_or_dir="snakers4/silero-vad",
            model="silero_vad",
            force_reload=False,
            onnx=False,
        )
        _vad_model = model
        _vad_utils = utils
        logger.info("Silero VAD loaded")
    except Exception as exc:
        logger.warning("Silero VAD unavailable, using RMS fallback: %s", exc)


class VoiceDetector:
    """Per-frame voice analysis."""

    def __init__(self):
        _load_silero()

    def detect(self, audio_chunk: np.ndarray) -> dict:
        """
        audio_chunk: 16kHz mono float32 numpy array.
        Returns structured voice result.
        """
        result = detect_voice_activity(audio_chunk, _vad_model, _vad_utils)

        # Classify
        status = "clear"
        if result["anomaly"]:
            status = "anomaly"
        elif result["voice_active"]:
            status = "active"

        return {
            "status":       status,
            "voice_active": result["voice_active"],
            "anomaly":      result["anomaly"],
            "vad_prob":     round(result["vad_prob"], 3),
            "rms":          round(result["rms"], 5),
        }

    @staticmethod
    def fallback() -> dict:
        return {
            "status": "clear", "voice_active": False,
            "anomaly": False, "vad_prob": 0.0, "rms": 0.0,
        }
