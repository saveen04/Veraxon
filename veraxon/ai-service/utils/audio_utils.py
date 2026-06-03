"""Audio analysis helpers for voice activity and multi-speaker detection."""
import numpy as np
from typing import Optional
from config import VOICE_SILENCE_THRESHOLD, VOICE_ANOMALY_THRESHOLD


def compute_rms(audio_array: np.ndarray) -> float:
    """Root-mean-square energy of an audio chunk."""
    if audio_array.size == 0:
        return 0.0
    return float(np.sqrt(np.mean(audio_array.astype(np.float64) ** 2)))


def is_silent(audio_array: np.ndarray) -> bool:
    return compute_rms(audio_array) < VOICE_SILENCE_THRESHOLD


def run_silero_vad(audio_array: np.ndarray, model, utils) -> float:
    """
    Run Silero VAD on a 16kHz mono float32 audio chunk.
    Returns speech probability (0-1).
    Falls back to 0.0 on error.
    """
    try:
        import torch
        tensor = torch.FloatTensor(audio_array)
        prob = float(model(tensor, 16000).item())
        return prob
    except Exception:
        return 0.0


def detect_voice_activity(audio_array: np.ndarray, vad_model=None, vad_utils=None) -> dict:
    """
    High-level voice activity check.
    Returns structured result compatible with the pipeline output schema.
    """
    rms = compute_rms(audio_array)
    silent = rms < VOICE_SILENCE_THRESHOLD
    vad_prob = 0.0

    if not silent and vad_model is not None:
        vad_prob = run_silero_vad(audio_array, vad_model, vad_utils)

    anomaly = vad_prob >= VOICE_ANOMALY_THRESHOLD and not silent

    return {
        "rms":          rms,
        "is_silent":    silent,
        "vad_prob":     vad_prob,
        "voice_active": not silent,
        "anomaly":      anomaly,
    }
