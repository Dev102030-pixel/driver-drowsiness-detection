# 🚘 Real-Time Driver Drowsiness & Distraction Detection

## 📌 Project Overview
This repository contains the code for an advanced, real-time safety system designed to prevent road accidents caused by driver fatigue and distraction. By leveraging deep learning and computer vision, the system actively monitors the driver's face and the surrounding environment simultaneously.

The pipeline combines a custom **Convolutional Neural Network (CNN)** to monitor eye states (detecting micro-sleeps) with **YOLOv8** to detect, frame, and label everyday objects in the camera feed. If the driver closes their eyes for a dangerous duration, or if potential distractions are detected, the system triggers real-time alerts.

## ✨ Key Features
*   🧠 **Deep Learning Drowsiness Detection:** Uses a custom-trained CNN to accurately classify cropped eye images as 'Open' or 'Closed'.
*   📦 **Real-Time Object Tracking (YOLOv8):** Continuously scans the video feed to detect and draw bounding boxes around objects (e.g., cell phones, cups, people) to provide environmental context and monitor for distracted driving.
*   ⏱️ **Smart Alert Logic:** Implements consecutive frame-counting algorithms to easily distinguish between natural human blinking and actual driver fatigue.
*   📹 **Optimized Edge Inference:** Built with OpenCV for smooth, lag-free live video processing, proving the system can run efficiently alongside heavy deep learning models.

## 🛠️ Tech Stack
*   **Language:** Python
*   **Computer Vision:** OpenCV, MediaPipe / Haar Cascades
*   **Deep Learning:** TensorFlow / Keras (for eye classification)
*   **Object Detection:** Ultralytics YOLOv8 Nano (for environmental tracking)
