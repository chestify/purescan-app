"use client";

import { useEffect, useRef, useState } from "react";
import Quagga from "@ericblade/quagga2";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Extend the Window interface to include BarcodeDetector for TypeScript
declare global {
  interface Window {
    BarcodeDetector: any;
  }
}

const LOOKUP_URL =
  "https://us-central1-purescan-a61f4.cloudfunctions.net/lookupProduct";

type ScanHistoryEntry = {
  code: string;
  status: "existing" | "new" | "error" | "unknown";
  productId: string | null;
  at: string;
};

const HISTORY_KEY = "purescan_scan_history";

export default function BarcodeScanner({ onDetected }: { onDetected: (barcode: string) => void; }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const nativeSupported =
    typeof window !== "undefined" && "BarcodeDetector" in window;

  function isValidBarcode(code: string): boolean {
    if (!code || !/^\d+$/.test(code)) return false;
    
    // EAN-13 and UPC-A validation
    if (code.length === 13 || code.length === 12) {
      const arr = code.split("").map(Number);
      const checkDigit = arr.pop() as number;
      
      let sum = 0;
      const start = code.length === 13 ? 0 : 1;
      
      for (let i = 0; i < arr.length; i++) {
        sum += arr[i] * ((i + start) % 2 === 0 ? 1 : 3);
      }
      
      const calculatedCheckDigit = (10 - (sum % 10)) % 10;
      return checkDigit === calculatedCheckDigit;
    }
    return false; // Reject other lengths
  }

  async function handleBarcode(code: string) {
    if (isLoading) return;

    setIsLoading(true);
    navigator.vibrate?.(100);

    try {
        const res = await fetch(`${LOOKUP_URL}?barcode=${code}`);
        if (!res.ok) {
            throw new Error(`Server responded with status ${res.status}`);
        }
        const data = await res.json();

        if (data.error) {
            throw new Error(data.error);
        }

        if (data.id) {
            // Use the onDetected prop which is just router.push
            onDetected(data.id);
        } else {
            throw new Error("Invalid response from lookup function.");
        }
    } catch (err: any) {
        console.error("Lookup error:", err);
        setError(`Error looking up barcode: ${err.message}`);
        toast({
            variant: "destructive",
            title: "Lookup Failed",
            description: err.message || "Could not find product information.",
        });
        setIsLoading(false); // Allow retrying
    }
  }

  useEffect(() => {
    let stopScanning = () => {};

    const startNativeScanner = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            });
            setHasCameraPermission(true);

            const video = document.createElement("video");
            video.srcObject = stream;
            video.autoplay = true;
            video.playsInline = true;
            video.style.width = "100%";
            video.style.height = "100%";
            video.style.objectFit = "cover";
            videoRef.current?.appendChild(video);
            
            await video.play();

            const detector = new window.BarcodeDetector({
                formats: ["ean_13", "upc_a"],
            });

            let scanning = true;
            const scanLoop = async () => {
                if (!scanning) return;
                try {
                    const barcodes = await detector.detect(video);
                    if (barcodes.length > 0) {
                        const code = barcodes[0].rawValue;
                        if (isValidBarcode(code)) {
                            scanning = false;
                            stopScanning();
                            handleBarcode(code);
                            return;
                        }
                    }
                } catch (e) {
                    console.error("Native scan loop error", e);
                }
                if (scanning) requestAnimationFrame(scanLoop);
            };
            scanLoop();

            stopScanning = () => {
                scanning = false;
                stream.getTracks().forEach((track) => track.stop());
                if (videoRef.current) videoRef.current.innerHTML = "";
            };

        } catch (err) {
            console.warn("Native scanner failed, falling back to Quagga.", err);
            startQuaggaScanner();
        }
    };
    
    const startQuaggaScanner = () => {
      if (!videoRef.current) return;

      Quagga.init(
        {
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: videoRef.current,
            constraints: { facingMode: "environment" },
          },
          decoder: {
            readers: ["ean_reader", "upc_reader"],
          },
          locate: true,
        },
        (err) => {
          if (err) {
            console.error("Quagga initialization failed:", err);
            setError("Failed to initialize scanner. Please check camera permissions.");
            setHasCameraPermission(false);
            return;
          }
          setHasCameraPermission(true);
          Quagga.start();
        }
      );
      
      const onDetectHandler = (result: any) => {
        const code = result.codeResult.code;
        if(isValidBarcode(code)){
            Quagga.offDetected(onDetectHandler);
            stopScanning();
            handleBarcode(code);
        }
      }
      Quagga.onDetected(onDetectHandler);

      stopScanning = () => {
        try {
            Quagga.offDetected(onDetectHandler);
            Quagga.stop();
        } catch(e) {
            console.log("Quagga stop error", e);
        }
      }
    };


    if (nativeSupported) {
      startNativeScanner();
    } else {
      startQuaggaScanner();
    }

    return () => {
      stopScanning();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nativeSupported]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-sm aspect-video bg-muted rounded-lg overflow-hidden" ref={videoRef}>
        {isLoading && (
           <div className="absolute inset-0 flex items-center justify-center bg-black/40">
             <div className="bg-white px-4 py-2 rounded shadow text-center flex flex-col items-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                <div className="text-xs">Analyzing Barcode...</div>
             </div>
           </div>
        )}
        {hasCameraPermission === false && (
           <div className="absolute inset-0 flex items-center justify-center bg-muted">
             <Alert variant="destructive" className="w-auto">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                    {error || "Please allow camera access to use the scanner."}
                </AlertDescription>
             </Alert>
           </div>
        )}
       </div>
    </div>
  );
}
