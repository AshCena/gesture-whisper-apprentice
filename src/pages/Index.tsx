
import React from "react";
import HandGestureRecognition from "@/components/HandGestureRecognition";

const Index = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Hand Gesture Recognition</h1>
      <p className="text-center mb-6 text-muted-foreground max-w-2xl mx-auto">
        Use your webcam to detect and recognize hand gestures in real-time. Click the "Start Camera" button below to begin.
      </p>
      <HandGestureRecognition />
    </div>
  );
};

export default Index;
