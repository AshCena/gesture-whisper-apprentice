
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
  const [handLandmarks, setHandLandmarks] = useState<mpHands.NormalizedLandmarkList | null>(null);
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
        minDetectionConfidence: 0.6, // Increased from 0.5
        minTrackingConfidence: 0.6   // Increased from 0.5
      });
      
      handsRef.current = hands;
      console.log("Hand gesture recognition initialized with MediaPipe");
      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to initialize gesture recognition:", error);
    }
  };

  // Calculate the angle between three points
  const calculateAngle = (p1: mpHands.NormalizedLandmark, p2: mpHands.NormalizedLandmark, p3: mpHands.NormalizedLandmark) => {
    const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  }

  // Calculate Euclidean distance between two points
  const distance = (p1: mpHands.NormalizedLandmark, p2: mpHands.NormalizedLandmark) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  // Detect gesture based on hand landmarks
  const recognizeGesture = (landmarks: mpHands.NormalizedLandmarkList) => {
    if (!landmarks || landmarks.length < 21) return { gesture: "None", confidence: 0 };
    
    // Get key landmarks
    const wrist = landmarks[0];
    const thumbCmc = landmarks[1];
    const thumbMcp = landmarks[2];
    const thumbIp = landmarks[3];
    const thumbTip = landmarks[4];
    
    const indexMcp = landmarks[5];
    const indexPip = landmarks[6];
    const indexDip = landmarks[7];
    const indexTip = landmarks[8];
    
    const middleMcp = landmarks[9];
    const middlePip = landmarks[10];
    const middleDip = landmarks[11];
    const middleTip = landmarks[12];
    
    const ringMcp = landmarks[13];
    const ringPip = landmarks[14];
    const ringDip = landmarks[15];
    const ringTip = landmarks[16];
    
    const pinkyMcp = landmarks[17];
    const pinkyPip = landmarks[18];
    const pinkyDip = landmarks[19];
    const pinkyTip = landmarks[20];
    
    // Improved finger extended status (based on vertical and horizontal positions)
    const isThumbExtended = thumbTip.y < thumbMcp.y || thumbTip.x < thumbMcp.x - 0.1;
    
    // For finger extension, compare tip position to MCP joint
    const isIndexExtended = indexTip.y < indexMcp.y - 0.05;
    const isMiddleExtended = middleTip.y < middleMcp.y - 0.05;
    const isRingExtended = ringTip.y < ringMcp.y - 0.05;
    const isPinkyExtended = pinkyTip.y < pinkyMcp.y - 0.05;
    
    // Check for finger curling - improved detection logic
    const isIndexCurled = calculateAngle(indexMcp, indexPip, indexDip) < 160 || 
                          (indexTip.y > indexPip.y);
    
    const isMiddleCurled = calculateAngle(middleMcp, middlePip, middleDip) < 160 || 
                           (middleTip.y > middlePip.y);
    
    const isRingCurled = calculateAngle(ringMcp, ringPip, ringDip) < 160 || 
                         (ringTip.y > ringPip.y);
    
    const isPinkyCurled = calculateAngle(pinkyMcp, pinkyPip, pinkyDip) < 160 || 
                          (pinkyTip.y > pinkyPip.y);
    
    // Thumb to finger distances
    const thumbToIndexDist = distance(thumbTip, indexTip);
    const thumbToMiddleDist = distance(thumbTip, middleTip);
    
    // Hand orientation
    const isPalmFacing = wrist.z < indexMcp.z;
    
    let detectedGesture = "None";
    let confidenceScore = 0.7;
    
    // Fist detection - improved logic
    if (!isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended && 
        isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled) {
        
        // Check that the fingertips are closer to the wrist than their MCP joints
        const fingersCurled = 
            distance(indexTip, wrist) < distance(indexMcp, wrist) &&
            distance(middleTip, wrist) < distance(middleMcp, wrist) &&
            distance(ringTip, wrist) < distance(ringMcp, wrist) &&
            distance(pinkyTip, wrist) < distance(pinkyMcp, wrist);
            
        if (fingersCurled) {
            detectedGesture = "Fist";
            confidenceScore = 0.9;
            console.log("Fist detected!", {
                fingersCurled,
                isIndexCurled, isMiddleCurled, isRingCurled, isPinkyCurled
            });
        }
    } 
    // Victory sign - index and middle fingers extended, others curled
    else if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      // Check if index and middle fingers are spread apart
      if (distance(indexTip, middleTip) > distance(indexMcp, middleMcp) * 1.2) {
        detectedGesture = "Victory";
        confidenceScore = 0.92;
      }
    } 
    // Thumbs Up - only thumb extended upward, other fingers curled
    else if (isThumbExtended && thumbTip.y < wrist.y - 0.15 && !isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      detectedGesture = "Thumbs Up";
      confidenceScore = 0.95;
    } 
    // Pointing - only index finger extended
    else if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      detectedGesture = "Pointing";
      confidenceScore = 0.9;
    } 
    // Open Palm - all fingers extended
    else if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) {
      detectedGesture = "Open Palm";
      confidenceScore = 0.93;
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
          const landmarks = results.multiHandLandmarks[0];
          setHandLandmarks(landmarks);
          
          const { gesture: detectedGesture, confidence: detectedConfidence } = 
            recognizeGesture(landmarks);
          
          if (detectedGesture !== "None") {
            setGesture(detectedGesture);
            setConfidence(detectedConfidence);
          }
        } else {
          // No hand detected
          setHandLandmarks(null);
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
    detectGesture,
    handLandmarks
  };
};
