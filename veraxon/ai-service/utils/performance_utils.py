"""Latency and throughput tracking for the AI pipeline."""
import time
from collections import deque
from typing import Deque


class LatencyTracker:
    """Rolling window latency tracker (last N frames)."""

    def __init__(self, window: int = 60):
        self._window: Deque[float] = deque(maxlen=window)
        self._start: float = 0.0

    def start(self):
        self._start = time.perf_counter()

    def stop(self) -> float:
        elapsed_ms = (time.perf_counter() - self._start) * 1000
        self._window.append(elapsed_ms)
        return elapsed_ms

    @property
    def avg_ms(self) -> float:
        return sum(self._window) / len(self._window) if self._window else 0.0

    @property
    def max_ms(self) -> float:
        return max(self._window) if self._window else 0.0

    def report(self) -> dict:
        return {
            "avg_latency_ms": round(self.avg_ms, 2),
            "max_latency_ms": round(self.max_ms, 2),
            "samples":        len(self._window),
        }


# Singleton tracker used by app.py
pipeline_tracker = LatencyTracker(window=100)
