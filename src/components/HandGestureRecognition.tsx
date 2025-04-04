
import React, { useRef, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, HandMetal, Hand, X } from "lucide-react";
import { useHandGestureRecognition } from "@/hooks/useHandGestureRecognition";

const HandGestureRecognition = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [gestureCount, setGestureCount] = useState<Record<string, number>>({
    "Open Palm": 0,
    "Fist": 0,
    "Pointing": 0,
    "Victory": 0,
    "Thumbs Up": 0,
  });

  // Use our hand gesture recognition hook
  const { 
    gesture: currentGesture, 
    confidence, 
    isInitialized,
    detectGesture 
  } = useHandGestureRecognition();

  // Start webcam stream
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      console.error("Error accessing the webcam:", error);
    }
  };

  // Stop webcam stream
  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };

  // Draw hand landmarks on canvas
  const drawHandLandmarks = (ctx: CanvasRenderingContext2D | null, landmarks: any[]) => {
    if (!ctx) return;
    
    // Draw connections between landmarks
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    
    // Highlight specific landmarks
    ctx.fillStyle = '#FF5722';
    landmarks.forEach((landmark, index) => {
      const x = landmark.x * ctx.canvas.width;
      const y = landmark.y * ctx.canvas.height;
      
      // Draw landmark point
      ctx.beginPath();
      ctx.arc(x, y, index % 4 === 0 ? 6 : 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  // Update gesture count when gesture changes
  useEffect(() => {
    if (currentGesture !== "None" && isStreaming) {
      setGestureCount(prev => ({
        ...prev,
        [currentGesture]: prev[currentGesture] + 1
      }));
      
      // If we have a canvas context, highlight the gesture visually
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Clear previous drawings
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Add text indicator for detected gesture
          ctx.font = '24px Arial';
          ctx.fillStyle = 'rgba(76, 175, 80, 0.8)';
          ctx.fillText(`${currentGesture} (${Math.round(confidence * 100)}%)`, 20, 40);
        }
      }
    }
  }, [currentGesture, confidence, isStreaming]);

  // Process video frames for hand gesture detection
  useEffect(() => {
    let animationId: number;
    
    const processFrame = async () => {
      if (isStreaming && videoRef.current) {
        // Process the current video frame
        await detectGesture(videoRef.current);
        
        // Update canvas dimensions to match video
        if (canvasRef.current && videoRef.current.readyState === 4) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
        }
      }
      
      animationId = requestAnimationFrame(processFrame);
    };
    
    if (isStreaming && isInitialized) {
      processFrame();
    }
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isStreaming, isInitialized, detectGesture]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline
                className="w-full h-full object-cover"
              />
              <canvas 
                ref={canvasRef} 
                className="absolute top-0 left-0 w-full h-full"
              />
              
              {!isStreaming && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Camera className="w-16 h-16 text-white opacity-50" />
                </div>
              )}
            </div>
            
            <div className="mt-4 flex justify-between">
              {!isStreaming ? (
                <Button onClick={startWebcam}>
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera
                </Button>
              ) : (
                <Button variant="destructive" onClick={stopWebcam}>
                  <X className="mr-2 h-4 w-4" />
                  Stop Camera
                </Button>
              )}
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Current Gesture:</span>
                <Badge variant="secondary" className="text-lg">
                  {currentGesture === "None" ? "None" : currentGesture}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="flex-1 md:max-w-xs">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <HandMetal className="mr-2 h-5 w-5" />
              Gesture Counter
            </h3>
            <div className="space-y-3">
              {Object.entries(gestureCount).map(([gesture, count]) => (
                <div key={gesture} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Hand className="mr-2 h-4 w-4" />
                    <span>{gesture}</span>
                  </div>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-medium mb-2">How to use</h3>
          <p className="text-sm text-gray-500">
            Position your hand in front of the camera and make different gestures. 
            The application will recognize common hand gestures such as open palm, 
            fist, pointing, victory sign, and thumbs up. Keep your hand clearly visible
            and make distinct gestures for best results.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default HandGestureRecognition;
