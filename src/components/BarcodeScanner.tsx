
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Quagga from "@ericblade/quagga2";
import { useRouter } from "next/navigation";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Video } from "lucide-react";

// Ensure the window object can have our custom property
declare global {
  interface Window {
    BarcodeDetector: any;
  }
}

const LOOKUP_URL =
  "https://us-central1-purescan-a61f4.cloudfunctions.net/lookupProduct";

/* -------------------------------------------------
   NORMALIZE + VALIDATE EAN-13
-------------------------------------------------- */
function normalizeEAN13(raw: string): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");

  // If 12 digits → add checksum
  if (digits.length === 12) {
    const sum = digits
      .split("")
      .reduce(
        (acc, val, idx) => acc + Number(val) * (idx % 2 === 0 ? 1 : 3),
        0
      );
    const checksum = (10 - (sum % 10)) % 10;
    digits += checksum;
  }

  // If too long → trim
  if (digits.length > 13) digits = digits.slice(0, 13);

  return digits.length === 13 ? digits : null;
}

function isValidEAN13(code: string | null): boolean {
  if (!code || !/^\d{13}$/.test(code)) return false;

  const digits = code.split("").map(Number);
  const checksum = digits.pop()!;
  const sum = digits.reduce(
    (acc, val, idx) => acc + val * (idx % 2 === 0 ? 1 : 3),
    0
  );
  const expected = (10 - (sum % 10)) % 10;

  return checksum === expected;
}

/* -------------------------------------------------
   MAIN COMPONENT
-------------------------------------------------- */
export default function BarcodeScanner({
  onDetected,
}: {
  onDetected?: (code: string) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [scanned, setScanned] = useState<string | null>(null);
  const [isSteady, setIsSteady] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [supportQR, setSupportQR] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);

  /* ----------------------------------------------
     CALL CLOUD FUNCTION + REDIRECT
  ----------------------------------------------- */
  const handleBarcode = useCallback(async (raw: string) => {
    // Prevent multiple triggers
    if (isSteady) return;

    const normalized = normalizeEAN13(raw);
    console.log("Raw scan:", raw, "→ Normalized:", normalized);

    setScanned(normalized ?? "Invalid scan");

    if (!normalized || !isValidEAN13(normalized)) {
      console.warn("Invalid barcode, ignoring.");
      return;
    }

    setIsSteady(true);
    setIsScanning(false); // Stop scanning immediately

    try {
      const res = await fetch(
        `${LOOKUP_URL}?barcode=${encodeURIComponent(normalized)}`
      );
      if (!res.ok) {
        throw new Error(`Cloud Function returned status: ${res.status}`);
      }
      const data = await res.json();

      if (!data.error) {
        onDetected?.(normalized);
        router.push(`/product/${data.id}?status=${data.status}`);
      } else {
        throw new Error(`Cloud Function error: ${data.error}`);
      }
    } catch (e: any) {
      console.error("Lookup failed:", e);
      toast({
        title: "Scan Error",
        description: e.message || "Could not look up the product. Please try again.",
        variant: "destructive"
      });
      setIsSteady(false); // Allow re-scanning on error
    }
  }, [isSteady, onDetected, router, toast]);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    try {
      Quagga.stop();
    } catch {}
  }, []);

  /* ----------------------------------------------
     START / STOP SCANNING
  ----------------------------------------------- */
  useEffect(() => {
    if (!isScanning) {
      stopCamera();
      return;
    }

    const startScanner = async () => {
      if (!videoRef.current) return;
      setIsInitializing(true);
      setHasCameraPermission(true);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        videoRef.current.srcObject = stream;
        
        const readers = supportQR
          ? ["ean_reader", "ean_8_reader", "code_128_reader", "upc_reader", "qr_reader"]
          : ["ean_reader", "ean_8_reader", "code_128_reader", "upc_reader"];

        const handleDetected = (result: any) => {
          const code = result?.codeResult?.code;
          if (code) {
            console.log("Detected (Quagga):", code);
            handleBarcode(code);
          }
        };

        Quagga.init({
          inputStream: {
            type: "LiveStream",
            target: videoRef.current,
            constraints: { facingMode: "environment" },
          },
          decoder: { readers: readers },
          locator: { patchSize: "medium", halfSample: true },
          locate: true,
        }, (err) => {
          setIsInitializing(false);
          if (err) {
            console.error("Quagga init error:", err);
            setHasCameraPermission(false);
            toast({
              title: "Camera Error",
              description: "Could not initialize the scanner.",
              variant: "destructive",
            });
            setIsScanning(false);
            return;
          }
          Quagga.start();
          Quagga.onDetected(handleDetected);
        });
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
        setIsInitializing(false);
        setIsScanning(false);
        toast({
          variant: "destructive",
          title: "Camera Access Denied",
          description: "Please enable camera permissions to use the scanner.",
        });
      }
    };

    startScanner();

    return () => {
      stopCamera();
      // @ts-ignore: offDetected isn't always typed
      try { Quagga.offDetected?.(); } catch {}
    };
  }, [isScanning, supportQR, handleBarcode, stopCamera, toast]);

  /* ----------------------------------------------
     MANUAL INPUT HANDLER
  ----------------------------------------------- */
  function submitManual() {
    if (!manualInput) return;
    const normalized = normalizeEAN13(manualInput);
    if (!normalized || !isValidEAN13(normalized)) {
      setScanned("Invalid manual barcode");
      toast({
          title: "Invalid Barcode",
          description: "Please enter a valid EAN-13 barcode.",
          variant: "destructive"
      })
      return;
    }
    handleBarcode(normalized);
  }

  return (
    <div className="w-full text-center space-y-4">
      {/* SCAN WINDOW + OVERLAY */}
      <div className="relative w-full max-w-sm mx-auto">
        <video ref={videoRef} className="w-full aspect-video rounded-md bg-black/20" autoPlay muted playsInline />

        {/* Overlay frame */}
        <div className="absolute inset-0 pointer-events-none border-2 border-white/40 rounded-lg">
          <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-md" />
          <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-md" />
          <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-md" />
          <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-md" />
        </div>

        {isSteady && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white animate-pulse">
            Analyzing...
          </div>
        )}
        
        {isInitializing && isScanning && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs">
            Initializing camera…
          </div>
        )}

        {!hasCameraPermission && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-md p-4">
                <Alert variant="destructive">
                    <Video className="h-4 w-4" />
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                        Please allow camera access to use this feature.
                    </AlertDescription>
                </Alert>
            </div>
        )}
      </div>

      {/* SCAN STATUS */}
      {scanned && (
        <div className="text-sm text-muted-foreground h-5">
          <strong>Last Scan:</strong> {scanned}
        </div>
      )}

      {/* START / STOP BUTTONS */}
      <div className="flex items-center justify-center gap-3">
        <Button onClick={() => setIsScanning(s => !s)} disabled={isInitializing || isSteady}>
          {isScanning ? "Stop Scanning" : "Start Scanning"}
        </Button>
      </div>

      {/* QR TOGGLE */}
      <label className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={supportQR}
          onChange={() => setSupportQR((v) => !v)}
          disabled={isScanning}
        />
        Enable QR code scanning
      </label>

      {/* MANUAL INPUT */}
      <div className="flex flex-col items-center gap-2 pt-4 border-t">
        <p className="text-sm text-muted-foreground">Or enter barcode manually:</p>
        <div className="flex gap-2">
            <input
                type="tel"
                placeholder="Enter 12 or 13 digits"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value.replace(/\D/g, ''))}
                className="border rounded px-3 py-2 w-48 text-center text-sm"
                onKeyDown={(e) => e.key === 'Enter' && submitManual()}
            />
            <Button onClick={submitManual} variant="secondary">
                Submit
            </Button>
        </div>
      </div>
    </div>
  );
}


    