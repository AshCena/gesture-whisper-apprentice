
import React, { useRef, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, HandMetal, Hand, X } from "lucide-react";

const HandGestureRecognition = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<string>("None");
  const [gestureCount, setGestureCount] = useState<Record<string, number>>({
    "Open Palm": 0,
    "Fist": 0,
    "Pointing": 0,
    "Victory": 0,
    "Thumbs Up": 0,
  });

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

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
      setCurrentGesture("None");
    }
  };

  // This is a placeholder for the actual hand gesture recognition
  // In a real implementation, you would use MediaPipe or TensorFlow.js here
  useEffect(() => {
    let animationId: number;
    
    const detectGestures = () => {
      if (isStreaming && videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (context && video.readyState === 4) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw the video frame to the canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Simulate random gesture detection for demo purposes
          if (Math.random() < 0.05) { // Occasionally change the detected gesture
            const gestures = Object.keys(gestureCount);
            const randomGesture = gestures[Math.floor(Math.random() * gestures.length)];
            setCurrentGesture(randomGesture);
            setGestureCount(prev => ({
              ...prev,
              [randomGesture]: prev[randomGesture] + 1
            }));
            
            // Draw a simple hand outline (placeholder for actual landmarks)
            context.strokeStyle = '#4CAF50';
            context.lineWidth = 2;
            context.beginPath();
            context.arc(canvas.width / 2, canvas.height / 2, 50, 0, 2 * Math.PI);
            context.stroke();
          }
        }
      }
      
      animationId = requestAnimationFrame(detectGestures);
    };
    
    if (isStreaming) {
      detectGestures();
    }
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isStreaming, gestureCount]);

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
            The application will attempt to recognize common hand gestures such as open palm, 
            fist, pointing, victory sign, and thumbs up.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default HandGestureRecognition;
