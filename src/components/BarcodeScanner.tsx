
"use client";

import { useEffect, useRef, useState } from "react";
import Quagga from "@ericblade/quagga2";
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
    let quaggaInitialized = false;

    const startScanner = () => {
      if (videoRef.current && !quaggaInitialized) {
        quaggaInitialized = true;
        Quagga.init(
          {
            inputStream: {
              name: "Live",
              type: "LiveStream",
              target: videoRef.current,
              constraints: {
                facingMode: "environment",
              },
            },
            decoder: {
              readers: ["ean_reader", "upc_reader", "code_128_reader"],
            },
            locate: true,
          },
          (err) => {
            if (err) {
              console.error("Quagga initialization failed:", err);
              setError("Failed to initialize scanner. Please check camera permissions.");
              setHasCameraPermission(false);
              toast({
                  variant: "destructive",
                  title: "Scanner Error",
                  description: "Could not initialize the barcode scanner.",
              });
              return;
            }
            setHasCameraPermission(true);
            Quagga.start();
          }
        );

        Quagga.onDetected((result) => {
          onDetected(result.codeResult.code);
        });
      }
    };

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        stream.getTracks().forEach(track => track.stop()); // Stop the initial stream, Quagga will start its own
        startScanner();
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setError("Camera access was denied. Please enable it in your browser settings.");
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      getCameraPermission();
    } else {
        setError("Your browser does not support camera access.");
        setHasCameraPermission(false);
    }


    return () => {
      if (quaggaInitialized) {
        Quagga.stop();
      }
    };
  }, [onDetected, toast]);

  return (
    <div className="flex flex-col items-center gap-4">
       <div className="relative w-full max-w-sm aspect-video bg-muted rounded-lg overflow-hidden">
        <div ref={videoRef} id="interactive" className="viewport"/>
        {hasCameraPermission === false && (
           <div className="absolute inset-0 flex items-center justify-center bg-muted">
             <Alert variant="destructive" className="w-auto">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                    {error || "Please allow camera access."}
                </AlertDescription>
             </Alert>
           </div>
        )}
       </div>
    </div>
  );
}
