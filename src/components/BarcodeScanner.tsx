"use client";

import { useEffect, useRef, useState } from "react";

export default function BarcodeScanner({
  onDetected,
}: {
  onDetected: (barcode: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream;

    async function startScanner() {
      try {
        if (!("BarcodeDetector" in window)) {
          setError("Barcode Detector API not supported. Using fallback soon.");
          return;
        }

        const detector = new (window as any).BarcodeDetector({
          formats: ["ean_13", "ean_8", "code_128", "upc_a", "upc_e"],
        });

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const scanLoop = async () => {
          if (!videoRef.current) return;

          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const value = barcodes[0].rawValue;
              onDetected(value);
              return;
            }
          } catch (e) {
            console.error("Detector error", e);
          }

          requestAnimationFrame(scanLoop);
        };

        scanLoop();
      } catch (e) {
        console.error(e);
        setError("Camera access denied or not available.");
      }
    }

    startScanner();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [onDetected]);

  return (
    <div className="flex flex-col items-center">
      {error && (
        <p className="text-red-500 text-sm mb-2">
          {error}  
        </p>
      )}

      <video
        ref={videoRef}
        className="rounded-lg border w-full max-w-sm"
        style={{ transform: "scaleX(-1)" }}
      />
    </div>
  );
}
