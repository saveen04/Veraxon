import base64
import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os

# Initialize FastAPI
app = FastAPI(title="Veraxon", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Initialize Random Forest Model
# Features: [face_count, phone_detected, looking_away, head_turned]
# Classes: 0 = Normal, 1 = Suspicious, 2 = Breach
try:
    from sklearn.ensemble import RandomForestClassifier
    # Create mock training dataset
    X_train = np.array([
        [1, 0, 0, 0], # Normal
        [1, 0, 1, 0], # Suspicious (looking away)
        [1, 0, 0, 1], # Suspicious (head turned)
        [0, 0, 0, 0], # Suspicious (no face)
        [2, 0, 0, 0], # Suspicious (multiple faces)
        [1, 1, 0, 0], # Breach (phone present)
        [1, 1, 1, 0], # Breach (phone + looking away)
        [2, 1, 0, 1], # Breach
    ])
    y_train = np.array([0, 1, 1, 1, 1, 2, 2, 2])
    
    rf_model = RandomForestClassifier(n_estimators=15, random_state=42)
    rf_model.fit(X_train, y_train)
    print("Random Forest Classifier trained successfully at startup.")
except Exception as e:
    print(f"Warning: Failed to import or fit scikit-learn Random Forest model: {e}. Using rule-based fallback.")
    rf_model = None

# 2. Initialize YOLOv8 Cell Phone Detector
yolo_model = None
try:
    from ultralytics import YOLO
    # Loads or downloads yolov8n.pt (nano COCO model)
    yolo_model = YOLO("yolov8n.pt")
    print("YOLOv8n model loaded successfully.")
except Exception as e:
    print(f"Warning: YOLOv8 model loading failed: {e}. Fallback to simulated cell phone scans.")

# 3. Initialize MediaPipe Face Mesh / Face Detection
mp_face_mesh = None
mp_face_detection = None
try:
    import mediapipe as mp
    mp_face_mesh = mp.solutions.face_mesh
    mp_face_detection = mp.solutions.face_detection
    print("MediaPipe solutions imported successfully.")
except Exception as e:
    print(f"Warning: MediaPipe initialization failed: {e}. Fallback to simulated face checks.")


class FrameRequest(BaseModel):
    image: str # Base64 encoded string of webcam frame
    examId: str = ""
    studentId: str = ""


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Veraxon AI Proctoring Backend",
        "yolo": "active" if yolo_model else "fallback",
        "mediapipe": "active" if mp_face_mesh else "fallback",
        "random_forest": "active" if rf_model else "fallback"
    }


@app.post("/detect")
def detect_proctoring_infractions(req: FrameRequest):
    try:
        # A. Decode base64 image
        header, encoded = req.image.split(",", 1) if "," in req.image else ("", req.image)
        img_data = base64.b64decode(encoded)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid webcam image format.")

        h, w, _ = img.shape
        
        # B. MediaPipe Face Detection and Mesh Face Count & Angle Analysis
        face_count = 0
        looking_away = 0
        head_turned = 0

        if mp_face_detection and mp_face_mesh:
            try:
                # Run Face Detection
                with mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5) as detector:
                    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                    results = detector.process(rgb_img)
                    if results.detections:
                        face_count = len(results.detections)
                
                # Check Face Mesh for gaze / orientation if a single face is present
                if face_count == 1:
                    with mp_face_mesh.FaceMesh(max_num_faces=1, refine_landmarks=True, min_detection_confidence=0.5) as mesh:
                        mesh_results = mesh.process(rgb_img)
                        if mesh_results.multi_face_landmarks:
                            landmarks = mesh_results.multi_face_landmarks[0].landmark
                            
                            # Simple Nose tip (4) to Outer eye corners (33, 263) distances ratio for head turns
                            nose = landmarks[4]
                            eye_left = landmarks[33]
                            eye_right = landmarks[263]
                            
                            dist_left = abs(nose.x - eye_left.x)
                            dist_right = abs(nose.x - eye_right.x)
                            
                            ratio = dist_left / max(dist_right, 0.001)
                            if ratio > 1.8 or ratio < 0.55:
                                head_turned = 1
                            
                            # Simple Gaze check using pupil distance centers (dummy or landmark offsets)
                            # Let's say if looking significantly far left or right relative to iris center
                            # Iris landmarks: 468, 473
                            iris_left = landmarks[468]
                            if abs(iris_left.x - eye_left.x) < 0.015 or abs(iris_left.x - eye_right.x) < 0.015:
                                looking_away = 1
            except Exception as mp_err:
                print(f"Error during MediaPipe inference: {mp_err}")
                face_count = 1  # Graceful default
        else:
            # Fallback mock scanning using OpenCV or basic heuristics
            face_count = 1
            # Let's add minor random simulation variations for testing if not using real MP
            if "simulate_no_face" in req.examId:
                face_count = 0
            elif "simulate_multiple" in req.examId:
                face_count = 2

        # C. YOLOv8 Cell Phone Detection
        phone_detected = 0
        yolo_confidence = 0.0
        
        if yolo_model:
            try:
                results = yolo_model(img, verbose=False)
                for r in results:
                    for box in r.boxes:
                        cls_idx = int(box.cls[0])
                        # Coco class 67 is 'cell phone'
                        if cls_idx == 67:
                            phone_detected = 1
                            yolo_confidence = float(box.conf[0])
                            break
            except Exception as yolo_err:
                print(f"Error during YOLOv8 inference: {yolo_err}")
        else:
            # Mock phone trigger if simulation pattern is present
            if "simulate_phone" in req.examId:
                phone_detected = 1
                yolo_confidence = 0.92

        # D. Random Forest Classification Decision
        features = [face_count, phone_detected, looking_away, head_turned]
        prediction = 0
        probability = [1.0, 0.0, 0.0]
        
        if rf_model:
            try:
                input_feat = np.array([features])
                pred_class = int(rf_model.predict(input_feat)[0])
                pred_proba = rf_model.predict_proba(input_feat)[0].tolist()
                
                prediction = pred_class
                probability = pred_proba
            except Exception as rf_err:
                print(f"Error during Random Forest prediction: {rf_err}")
                prediction = 2 if phone_detected else (1 if (looking_away or head_turned or face_count != 1) else 0)
        else:
            # Simple rule-based prediction fallback matching model classes
            if phone_detected == 1:
                prediction = 2  # Breach
            elif face_count != 1 or looking_away == 1 or head_turned == 1:
                prediction = 1  # Suspicious
            else:
                prediction = 0  # Normal

        class_labels = {0: "Normal", 1: "Suspicious", 2: "Breach"}
        decision = class_labels.get(prediction, "Normal")
        
        # E. Telemetry structured in payload for React to process and log organically
        # The frontend React App listens for severity="breach" and dispatches to Firestore.
        pass

        return {
            "success": True,
            "decision": decision,
            "severity": "breach" if prediction == 2 else ("warning" if prediction == 1 else "secure"),
            "infractions": {
                "no_face": face_count == 0,
                "multiple_faces": face_count > 1,
                "phone_detected": bool(phone_detected),
                "looking_away": bool(looking_away),
                "head_turned": bool(head_turned)
            },
            "metrics": {
                "face_count": face_count,
                "phone_confidence": yolo_confidence,
                "rf_probabilities": probability
            }
        }
    except Exception as e:
        print(f"Unhandled endpoint error: {e}")
        return {
            "success": False,
            "error": str(e),
            "decision": "Normal",
            "severity": "secure"
        }


from fastapi import WebSocket, WebSocketDisconnect
import json

@app.websocket("/api/proctor/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            req_data = json.loads(data)
            
            # Re-use core detection logic via mocked class wrapper temporarily
            # For real-time, just wrap the above logic cleanly
            frame_req = FrameRequest(
                image=req_data.get("image", ""),
                examId=req_data.get("examId", ""),
                studentId=req_data.get("studentId", "")
            )
            
            if not frame_req.image:
                continue
                
            prediction_res = detect_proctoring_infractions(frame_req)
            
            # Send continuous feed results back to the frontend Overlay
            await websocket.send_json(prediction_res)
    except WebSocketDisconnect:
        print("Client disconnected from secure AI stream.")
    except Exception as e:
        print(f"Websocket error: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
