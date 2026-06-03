"""Centralised structured logging for Veraxon AI service."""
import logging
import sys
from datetime import datetime
from config import LOG_LEVEL


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        fmt = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(fmt)
        logger.addHandler(handler)
    logger.setLevel(getattr(logging, LOG_LEVEL, logging.INFO))
    return logger


def log_detection(logger: logging.Logger, frame_id: str, result: dict):
    logger.debug(
        "DETECTION frame=%s decision=%s severity=%s risk=%s",
        frame_id, result.get("decision"), result.get("severity"), result.get("risk_score"),
    )


def log_violation(logger: logging.Logger, exam_id: str, student_id: str, vtype: str, severity: str):
    logger.warning(
        "VIOLATION exam=%s student=%s type=%s severity=%s ts=%s",
        exam_id, student_id, vtype, severity, datetime.utcnow().isoformat(),
    )


def log_model_load(logger: logging.Logger, model_name: str, status: str):
    logger.info("MODEL_LOAD name=%s status=%s", model_name, status)


def log_performance(logger: logging.Logger, endpoint: str, latency_ms: float):
    logger.info("PERF endpoint=%s latency_ms=%.1f", endpoint, latency_ms)
