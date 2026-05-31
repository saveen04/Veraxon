# Veraxon – AI-Powered Online Examination Monitoring Platform

<p align="center">
  <img src="public/logov-removebg-preview.png" alt="Veraxon Logo" width="220"/>
</p>

<h1 align="center">🛡️ Veraxon</h1>

<p align="center">
AI-Powered Online Examination Monitoring & Automated Proctoring System
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js"/>
  <img src="https://img.shields.io/badge/Firebase-Authentication-orange?style=for-the-badge&logo=firebase"/>
  <img src="https://img.shields.io/badge/Node.js-Backend-green?style=for-the-badge&logo=node.js"/>
  <img src="https://img.shields.io/badge/Python-AI-blue?style=for-the-badge&logo=python"/>
  <img src="https://img.shields.io/badge/MongoDB-Database-darkgreen?style=for-the-badge&logo=mongodb"/>
  <img src="https://img.shields.io/badge/YOLOv8-Detection-red?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/MediaPipe-FaceMesh-purple?style=for-the-badge"/>
</p>

---

# 📖 Overview

**Veraxon** is a next-generation AI-powered online examination monitoring platform designed to maintain academic integrity through intelligent automated proctoring.

The platform combines **computer vision**, **voice analysis**, **behavior tracking**, and **real-time monitoring** to identify suspicious activities during online assessments.

Using advanced technologies such as **YOLOv8**, **MediaPipe Face Mesh**, **Firebase Authentication**, and **Python-based analytics**, Veraxon provides institutions with a secure and scalable digital examination ecosystem.

---

# 🎯 Problem Statement

Online examinations often suffer from:

* Identity impersonation
* Mobile phone usage
* Multiple-person presence
* Tab switching
* External assistance
* Voice-based collaboration
* Lack of real-time invigilation

Veraxon addresses these challenges through AI-driven monitoring and automated violation detection.

---

# 🚀 Key Features

## 🔐 Secure Authentication

### Firebase Authentication

* Email & Password Login
* Google Sign-In
* Secure Session Management
* JWT Authorization

### Role-Based Access Control

* Student
* Staff
* Administrator

---

# 🎓 Student Portal

Students can:

* Register and manage profiles
* Join assessments via QR code
* Access examination sessions
* Complete environment verification
* Receive performance analytics
* Download assessment reports

### Environment Check

Before starting an examination:

✅ Webcam Verification

✅ Microphone Verification

✅ Internet Stability Check

✅ Browser Compatibility Check

✅ Device Validation

---

# 👨‍🏫 Staff Portal

Staff members can:

* Create assessments
* Schedule examinations
* Generate QR Codes
* Generate Session Links
* Monitor live sessions
* View student violations
* Export examination reports
* Delete examination records

---

# 🧠 AI-Powered Proctoring

Veraxon continuously monitors examination sessions using artificial intelligence.

---

## 👁️ Face Detection

Using MediaPipe Face Mesh:

### Detects

* Face Presence
* Face Absence
* Head Pose Estimation
* Eye Direction Tracking
* Face Orientation

### Violations

* Looking away frequently
* Face not visible
* Candidate leaving frame

---

## 📱 Object Detection

Using YOLOv8n:

### Detects

* Mobile Phones
* Additional Persons
* Books
* Electronic Devices
* Unauthorized Objects

### Alerts Generated

* Mobile Phone Detected
* Multiple Faces Detected
* Suspicious Object Found

---

## 🎤 Voice Monitoring

Real-time microphone analysis:

### Detects

* Multiple Voices
* Background Conversations
* Abnormal Noise Levels

### Flags

* Speaking During Assessment
* External Assistance Attempts

---

## 🌐 Browser Activity Monitoring

Tracks:

* Tab Switching
* Window Focus Changes
* Fullscreen Exit Events

### Violation Policy

#### Policy Level 1

* Warning Generated
* Activity Logged

#### Policy Level 2

* Automatic Logout
* Assessment Termination
* Staff Notification

---

# 📊 Real-Time Monitoring Dashboard

Staff Dashboard includes:

### Live Examination Monitoring

* Active Students
* Attendance Status
* Examination Progress
* Violation Counts

### Real-Time Alerts

* Mobile Detection
* Face Absence
* Tab Switching
* Voice Activity
* Multiple Person Detection

---

# 📈 Assessment Analytics

After assessment completion, Veraxon generates detailed insights using Python.

### Technologies

* NumPy
* Pandas
* Matplotlib

### Metrics

* Total Score
* Accuracy Percentage
* Subject-wise Analysis
* Time Utilization
* Performance Trend
* Weak Area Identification

---

# 📑 Automated Report Generation

Generate downloadable PDF reports containing:

* Student Information
* Assessment Details
* Marks Obtained
* Violation Summary
* AI Analysis Report
* Performance Graphs
* Staff Remarks

---

# 🔄 Examination Workflow

```text
Staff Login
     │
     ▼
Create Assessment
     │
     ▼
Generate QR Code / Session Link
     │
     ▼
Student Registration
     │
     ▼
Environment Verification
     │
     ▼
Join Assessment
     │
     ▼
AI Proctoring Starts
     │
     ▼
Face + Voice + Activity Monitoring
     │
     ▼
Assessment Submission
     │
     ▼
Analytics Generation
     │
     ▼
PDF Report Creation
     │
     ▼
Results Stored
```

---

# 🏗️ System Architecture

```text
┌─────────────────────────────┐
│         Frontend            │
│     Next.js + Tailwind      │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│        Firebase Auth        │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│     Node.js + Express API   │
└──────────────┬──────────────┘
               │
      ┌────────┴────────┐
      ▼                 ▼
┌──────────────┐  ┌──────────────┐
│   MongoDB    │  │ Python AI    │
│  Database    │  │ Analytics    │
└──────────────┘  └──────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │ YOLOv8 + FaceMesh│
              └──────────────────┘
```

---

# 🛠️ Tech Stack

| Category               | Technology     |
| ---------------------- | -------------- |
| Frontend               | Next.js 16     |
| Styling                | Tailwind CSS   |
| Authentication         | Firebase       |
| Backend                | Node.js        |
| Framework              | Express.js     |
| Database               | MongoDB        |
| AI Detection           | YOLOv8n        |
| Face Tracking          | MediaPipe      |
| Analytics              | NumPy, Pandas  |
| Visualization          | Matplotlib     |
| Realtime Communication | Socket.IO      |
| Report Generation      | PDFKit / jsPDF |

---

# 📂 Project Structure

```bash
veraxon/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── public/
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   └── server.js
│
├── ai-engine/
│   ├── yolov8/
│   ├── mediapipe/
│   ├── analytics/
│   └── reports/
│
└── docs/
```

---

# 🔒 Security Features

* JWT Authentication
* Firebase Security Rules
* Protected APIs
* Secure Cookies
* Rate Limiting
* Input Validation
* Session Management
* Encrypted Password Storage

---

# 🌟 Future Enhancements

* Emotion Recognition
* Eye Gaze Tracking
* Speech-to-Text Analysis
* AI Risk Scoring
* Multi-Camera Monitoring
* Institution Management Portal
* Mobile Application
* Predictive Student Performance Models

---

# 📜 License

This project is licensed under the MIT License.

---

# 💡 Vision

**Veraxon aims to redefine online examinations through intelligent proctoring, automated monitoring, and advanced analytics—creating a secure, transparent, and scalable assessment ecosystem for educational institutions worldwide.** 🚀🛡️📊
