import React, { useRef, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Camera, 
  HandMetal, 
  Hand, 
  X, 
  ThumbsUp, 
  Scissors,
  PointerIcon, 
  Grip, 
  CircleDashed 
} from "lucide-react";
import { useHandGestureRecognition } from "@/hooks/useHandGestureRecognition";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const GestureExample = ({ name, icon, description }: { name: string; icon: React.ReactNode; description: string }) => (
  <div className="flex flex-col items-center p-3 border rounded-md bg-card">
    <div className="mb-2 text-3xl text-primary">{icon}</div>
    <h4 className="text-sm font-medium mb-1">{name}</h4>
    <p className="text-xs text-muted-foreground text-center">{description}</p>
  </div>
);

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

  const { 
    gesture: currentGesture, 
    confidence, 
    isInitialized,
    detectGesture,
    handLandmarks
  } = useHandGestureRecognition();

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsStreaming(true);
        };
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
    }
  };

  const drawHandLandmarks = () => {
    const canvas = canvasRef.current;
    if (!canvas || !handLandmarks) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [0, 5], [5, 9], [9, 13], [13, 17]
    ];
    
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    
    connections.forEach(([i, j]) => {
      ctx.beginPath();
      ctx.moveTo(
        handLandmarks[i].x * canvas.width,
        handLandmarks[i].y * canvas.height
      );
      ctx.lineTo(
        handLandmarks[j].x * canvas.width,
        handLandmarks[j].y * canvas.height
      );
      ctx.stroke();
    });
    
    handLandmarks.forEach((landmark, index) => {
      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;
      
      if (index === 0) { // Wrist
        ctx.fillStyle = '#FF5722';
      } else if (index >= 1 && index <= 4) { // Thumb
        ctx.fillStyle = '#FFEB3B';
      } else if (index >= 5 && index <= 8) { // Index
        ctx.fillStyle = '#2196F3';
      } else if (index >= 9 && index <= 12) { // Middle
        ctx.fillStyle = '#4CAF50';
      } else if (index >= 13 && index <= 16) { // Ring
        ctx.fillStyle = '#9C27B0';
      } else { // Pinky
        ctx.fillStyle = '#F44336';
      }
      
      ctx.beginPath();
      ctx.arc(x, y, index % 4 === 0 ? 6 : 4, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    if (currentGesture !== "None") {
      ctx.font = '24px Arial';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.strokeText(`${currentGesture} (${Math.round(confidence * 100)}%)`, 20, 40);
      ctx.fillText(`${currentGesture} (${Math.round(confidence * 100)}%)`, 20, 40);
    }
  };

  useEffect(() => {
    if (currentGesture !== "None" && isStreaming) {
      setGestureCount(prev => ({
        ...prev,
        [currentGesture]: prev[currentGesture] + 1
      }));
      
      if (canvasRef.current && handLandmarks) {
        drawHandLandmarks();
      }
    }
  }, [currentGesture, confidence, isStreaming, handLandmarks]);

  useEffect(() => {
    let animationId: number;
    
    const processFrame = async () => {
      if (isStreaming && videoRef.current) {
        await detectGesture(videoRef.current);
        
        if (canvasRef.current && videoRef.current && videoRef.current.readyState >= 2) {
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

  const sampleGestures = [
    {
      name: "Open Palm",
      icon: <CircleDashed />,
      description: "Show your palm with all fingers extended"
    },
    {
      name: "Fist",
      icon: <Grip />,
      description: "Make a fist by curling all fingers inward"
    },
    {
      name: "Pointing",
      icon: <PointerIcon />,
      description: "Extend only your index finger, curl others"
    },
    {
      name: "Victory",
      icon: <Scissors />,
      description: "Extend index and middle fingers in a V shape"
    },
    {
      name: "Thumbs Up",
      icon: <ThumbsUp />,
      description: "Extend only your thumb upward"
    }
  ];

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
                style={{ transform: "scaleX(-1)" }}
              />
              <canvas 
                ref={canvasRef} 
                className="absolute top-0 left-0 w-full h-full"
                style={{ transform: "scaleX(-1)" }}
              />
              
              {!isStreaming && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Camera className="w-16 h-16 text-white opacity-50" />
                </div>
              )}

              {currentGesture !== "None" && isStreaming && (
                <div className="absolute top-2 left-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentGesture} ({Math.round(confidence * 100)}%)
                </div>
              )}
            </div>
            
            <div className="mt-4 flex justify-between">
              {!isStreaming ? (
                <Button onClick={startWebcam} className="w-full sm:w-auto">
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera
                </Button>
              ) : (
                <Button variant="destructive" onClick={stopWebcam} className="w-full sm:w-auto">
                  <X className="mr-2 h-4 w-4" />
                  Stop Camera
                </Button>
              )}
              
              <div className="hidden sm:flex items-center gap-2">
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
          <h3 className="text-lg font-medium mb-4">Sample Gestures</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {sampleGestures.map(gesture => (
              <GestureExample 
                key={gesture.name}
                name={gesture.name}
                icon={gesture.icon}
                description={gesture.description}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-medium mb-2">How to use</h3>
          <p className="text-sm text-gray-500">
            Position your hand in front of the camera and make different gestures. 
            The application will recognize common hand gestures such as open palm, 
            fist, pointing, victory sign, and thumbs up. Keep your hand clearly visible
            and make distinct gestures for best results. See the sample gestures above
            for guidance on how to position your hand.
          </p>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="mt-3">
                <Hand className="mr-2 h-4 w-4" />
                Detailed Instructions
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>How to Use Hand Gesture Recognition</SheetTitle>
                <SheetDescription>
                  Follow these tips for the best hand gesture recognition results
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="font-medium">Open Palm</h4>
                  <p className="text-sm text-muted-foreground">
                    Extend all fingers and show your palm to the camera. Keep fingers spread apart slightly.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Fist</h4>
                  <p className="text-sm text-muted-foreground">
                    Curl all fingers into a fist. Make sure your knuckles are visible to the camera.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Pointing</h4>
                  <p className="text-sm text-muted-foreground">
                    Extend only your index finger while keeping other fingers curled into your palm.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Victory</h4>
                  <p className="text-sm text-muted-foreground">
                    Extend your index and middle fingers in a V shape, while keeping other fingers curled.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Thumbs Up</h4>
                  <p className="text-sm text-muted-foreground">
                    Extend only your thumb upward, with all other fingers curled into a fist.
                  </p>
                </div>
                <div className="pt-4 border-t">
                  <h4 className="font-medium">General Tips</h4>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
                    <li>Ensure good lighting conditions</li>
                    <li>Position your hand 1-2 feet from the camera</li>
                    <li>Make gestures clearly and hold them steady</li>
                    <li>Avoid quick movements</li>
                    <li>Keep your hand within the camera frame</li>
                  </ul>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </CardContent>
      </Card>
    </div>
  );
};

export default HandGestureRecognition;
