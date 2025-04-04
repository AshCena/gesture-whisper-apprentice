
import { useState, useEffect, useRef } from 'react';
import * as mpHands from '@mediapipe/hands';
import * as tf from '@tensorflow/tfjs';

// Ensure TensorFlow is initialized
tf.ready().then(() => console.log('TensorFlow initialized'));

export const useHandGestureRecognition = () => {
  const [gesture, setGesture] = useState<string>("None");
  const [confidence, setConfidence] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const handsRef = useRef<mpHands.Hands | null>(null);
  const requestRef = useRef<number>();

  // Initialize MediaPipe Hands
  const initialize = async () => {
    try {
      // Load TensorFlow.js models
      await tf.ready();
      
      // Create and configure MediaPipe Hands
      const hands = new mpHands.Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });
      
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
      handsRef.current = hands;
      console.log("Hand gesture recognition initialized with MediaPipe");
      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to initialize gesture recognition:", error);
    }
  };

  // Detect gesture based on hand landmarks
  const recognizeGesture = (landmarks: mpHands.NormalizedLandmarkList) => {
    if (!landmarks || landmarks.length < 21) return { gesture: "None", confidence: 0 };
    
    // Get key points for gesture recognition
    const thumb = landmarks[4];
    const indexFinger = landmarks[8];
    const middleFinger = landmarks[12];
    const ringFinger = landmarks[16];
    const pinky = landmarks[20];
    const wrist = landmarks[0];
    
    // Distance calculations for fingers extended state
    const isThumbUp = thumb.y < wrist.y - 0.1;
    const isIndexUp = indexFinger.y < wrist.y - 0.15;
    const isMiddleUp = middleFinger.y < wrist.y - 0.15;
    const isRingUp = ringFinger.y < wrist.y - 0.15;
    const isPinkyUp = pinky.y < wrist.y - 0.15;
    
    // Horizontal distances for specific gestures
    const isThumbAway = Math.abs(thumb.x - indexFinger.x) > 0.1;
    
    // Recognize gestures based on finger positions
    let detectedGesture = "None";
    let confidenceScore = 0.7;
    
    if (isIndexUp && isMiddleUp && !isRingUp && !isPinkyUp && !isThumbUp) {
      detectedGesture = "Victory";
      confidenceScore = 0.9;
    } else if (isThumbUp && !isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
      detectedGesture = "Thumbs Up";
      confidenceScore = 0.9;
    } else if (isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
      detectedGesture = "Pointing";
      confidenceScore = 0.85;
    } else if (isIndexUp && isMiddleUp && isRingUp && isPinkyUp) {
      detectedGesture = "Open Palm";
      confidenceScore = 0.9;
    } else if (!isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
      detectedGesture = "Fist";
      confidenceScore = 0.8;
    }
    
    return { gesture: detectedGesture, confidence: confidenceScore };
  };

  // Process video frame to detect hand and recognize gesture
  const detectGesture = async (videoElement: HTMLVideoElement | null) => {
    if (!videoElement || !isInitialized || !videoElement.readyState || !handsRef.current) return;
    
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      // Send video frame to MediaPipe Hands
      handsRef.current.onResults((results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          // Hand detected, recognize gesture
          const { gesture: detectedGesture, confidence: detectedConfidence } = 
            recognizeGesture(results.multiHandLandmarks[0]);
          
          if (detectedGesture !== "None") {
            setGesture(detectedGesture);
            setConfidence(detectedConfidence);
          }
        } else {
          // No hand detected
          setGesture("None");
          setConfidence(0);
        }
      });
      
      // Process the current video frame
      await handsRef.current.send({image: videoElement});
      
    } catch (error) {
      console.error("Error during gesture detection:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    // Auto-initialize on hook mount
    initialize();
    
    return () => {
      // Clean up resources on unmount
      if (handsRef.current) {
        handsRef.current.close();
      }
      
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return {
    gesture,
    confidence,
    isInitialized,
    isProcessing,
    detectGesture
  };
};
