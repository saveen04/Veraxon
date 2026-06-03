"""
Veraxon AI Proctoring Service — FastAPI entry point
====================================================
Endpoints:
  GET  /               health + model status
  GET  /metrics        pipeline performance stats
  POST /detect         single frame analysis (HTTP)
  POST /event          browser event (tab switch / fullscreen exit)
  WS   /api/proctor/stream  real-time WebSocket stream

Architecture:
  app.py → pipeline.py → detectors/* + utils/*
  All thresholds in config.py.
"""

from __future__ import annotations

import json
import time
import numpy as np

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

from pipeline import ProctorPipeline
from utils.performance_utils import pipeline_tracker
from utils.model_loader_utils import list_loaded_models
from utils.logging_utils import get_logger, log_performance

logger = get_logger("app")

# ─── App init ────────────────────────────────────────────────────
app = FastAPI(
    title="Veraxon AI Proctoring Service",
    version="2.0.0",
    description="Enterprise AI proctoring pipeline: face, object, voice, environment.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Single shared pipeline instance (models loaded once at startup)
_pipeline: Optional[ProctorPipeline] = None


@app.on_event("startup")
async def startup():
    global _pipeline
    logger.info("Veraxon AI Service starting…")
    _pipeline = ProctorPipeline()
    logger.info("Pipeline ready. Models: %s", list_loaded_models())


def get_pipeline() -> ProctorPipeline:
    if _pipeline is None:
        raise HTTPException(status_code=503, detail="Pipeline not initialised")
    return _pipeline


# ─── Request schemas ──────────────────────────────────────────────

class FrameRequest(BaseModel):
    image:           str
    examId:          str = ""
    studentId:       str = ""
    studentName:     str = "Candidate"
    violationCount:  int = Field(default=0, ge=0)


class BrowserEventRequest(BaseModel):
    eventType:       str   # tab_switch | fullscreen_exit | window_blur
    examId:          str = ""
    studentId:       str = ""
    studentName:     str = "Candidate"
    violationCount:  int = Field(default=0, ge=0)


# ─── HTTP endpoints ───────────────────────────────────────────────

@app.get("/")
def health():
    return {
        "status":  "online",
        "service": "Veraxon AI Proctoring",
        "version": "2.0.0",
        "models":  list_loaded_models(),
    }


@app.get("/metrics")
def metrics():
    return {
        "pipeline_latency": pipeline_tracker.report(),
        "models":           list_loaded_models(),
    }


@app.post("/detect")
def detect(req: FrameRequest):
    t0 = time.perf_counter()

    result = get_pipeline().process_frame(
        image_b64       = req.image,
        exam_id         = req.examId,
        student_id      = req.studentId,
        student_name    = req.studentName,
        violation_count = req.violationCount,
    )

    log_performance(logger, "/detect", (time.perf_counter() - t0) * 1000)
    return result


@app.post("/event")
def browser_event(req: BrowserEventRequest):
    result = get_pipeline().process_browser_event(
        event_type      = req.eventType,
        exam_id         = req.examId,
        student_id      = req.studentId,
        student_name    = req.studentName,
        violation_count = req.violationCount,
    )
    return result


# ─── WebSocket stream ─────────────────────────────────────────────

@app.websocket("/api/proctor/stream")
async def ws_stream(websocket: WebSocket):
    await websocket.accept()
    client = f"{websocket.client.host}:{websocket.client.port}"
    logger.info("WS client connected: %s", client)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"success": False, "error": "Invalid JSON"})
                continue

            # Browser event (no image)
            if "eventType" in data:
                result = get_pipeline().process_browser_event(
                    event_type      = data.get("eventType", ""),
                    exam_id         = data.get("examId", ""),
                    student_id      = data.get("studentId", ""),
                    student_name    = data.get("studentName", "Candidate"),
                    violation_count = int(data.get("violationCount", 0)),
                )
                await websocket.send_json(result)
                continue

            # Frame analysis
            image = data.get("image", "")
            if not image:
                continue

            result = get_pipeline().process_frame(
                image_b64       = image,
                exam_id         = data.get("examId", ""),
                student_id      = data.get("studentId", ""),
                student_name    = data.get("studentName", "Candidate"),
                violation_count = int(data.get("violationCount", 0)),
            )
            await websocket.send_json(result)

    except WebSocketDisconnect:
        logger.info("WS client disconnected: %s", client)
    except Exception as exc:
        logger.error("WS error for %s: %s", client, exc)
        try:
            await websocket.send_json({"success": False, "error": str(exc)})
        except Exception:
            pass


# ─── Dev server ───────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
