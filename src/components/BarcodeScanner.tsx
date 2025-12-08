
"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function BarcodeScanner({
  onDetected,
}: {
  onDetected: (barcode: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;

    const stopStream = () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };

    async function startScanner() {
      if (!("BarcodeDetector" in window)) {
        setError("Barcode Detector API is not supported by this browser.");
        setHasCameraPermission(false);
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const detector = new (window as any).BarcodeDetector({
          formats: ["ean_13", "ean_8", "code_128", "upc_a", "upc_e"],
        });

        const scanLoop = async () => {
          if (!videoRef.current || videoRef.current.paused) {
            animationFrameId = requestAnimationFrame(scanLoop);
            return;
          }

          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const value = barcodes[0].rawValue;
              onDetected(value);
              stopStream(); // Stop the camera once detected
              return; // End the loop
            }
          } catch (e) {
            console.error("Barcode detection error:", e);
            // Continue scanning even if one frame fails
          }
          animationFrameId = requestAnimationFrame(scanLoop);
        };

        scanLoop();

      } catch (err) {
        console.error("Camera access error:", err);
        setError("Camera access denied or unavailable. Please check your browser permissions.");
        setHasCameraPermission(false);
        toast({
            variant: "destructive",
            title: "Camera Access Denied",
            description: "Please enable camera permissions in your browser settings to use the scanner.",
        })
      }
    }

    startScanner();

    // Cleanup function
    return () => {
      cancelAnimationFrame(animationFrameId);
      stopStream();
    };
  }, [onDetected, toast]);

  return (
    <div className="flex flex-col items-center gap-4">
      {hasCameraPermission === false && (
         <Alert variant="destructive">
            <AlertTitle>Camera Access Required</AlertTitle>
            <AlertDescription>
                {error || "Please allow camera access to use this feature."}
            </AlertDescription>
         </Alert>
      )}

      <video
        ref={videoRef}
        className="rounded-lg border w-full max-w-sm"
        style={{ transform: "scaleX(-1)", display: hasCameraPermission ? 'block' : 'none' }}
        playsInline
      />
    </div>
  );
}
