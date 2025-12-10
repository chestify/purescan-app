"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Quagga from "@ericblade/quagga2";
import { useRouter } from "next/navigation";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Video } from "lucide-react";

declare global {
  interface Window {
    BarcodeDetector: any;
  }
}

const LOOKUP_URL =
  "https://us-central1-purescan-a61f4.cloudfunctions.net/lookupProduct";

/* -------------------------------------------------------------
   NORMALIZE + VALIDATE EAN-13
------------------------------------------------------------- */
function normalizeEAN13(raw: string): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");

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

/* -------------------------------------------------------------
   MAIN SCANNER COMPONENT
------------------------------------------------------------- */
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

  /* -------------------------------------------------------------
     BARCODE LOOKUP VIA CLOUD FUNCTION
  ------------------------------------------------------------- */
  const handleBarcode = useCallback(
    async (raw: string) => {
      if (isSteady) return;

      const normalized = normalizeEAN13(raw);
      console.log("Raw scan:", raw, "→ Normalized:", normalized);

      setScanned(normalized ?? "Invalid scan");

      if (!normalized || !isValidEAN13(normalized)) {
        console.warn("Invalid barcode, ignoring.");
        return;
      }

      setIsSteady(true);
      setIsScanning(false);

      try {
        const res = await fetch(
          `${LOOKUP_URL}?barcode=${encodeURIComponent(normalized)}`
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        onDetected?.(normalized);
        router.push(`/product/${data.id}?status=${data.status}`);
      } catch (e: any) {
        console.error("Lookup failed:", e);
        toast({
          title: "Lookup Error",
          description:
            e.message || "Unable to look up this product. Please try again.",
          variant: "destructive",
        });
        setIsSteady(false);
      }
    },
    [isSteady, onDetected, router, toast]
  );

  /* -------------------------------------------------------------
     STOP CAMERA
  ------------------------------------------------------------- */
  const stopCamera = useCallback(() => {
    console.log("Stopping camera + Quagga");
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    try {
      Quagga.stop();
    } catch {}
  }, []);

  /* -------------------------------------------------------------
     START CAMERA + QUAGGA SCANNER
  ------------------------------------------------------------- */
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
        console.log("Requesting camera with higher constraints…");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        const videoElement = videoRef.current as HTMLVideoElement;
        videoElement.srcObject = stream;
        videoElement.setAttribute("playsinline", "true");
        videoElement.setAttribute("webkit-playsinline", "true");

        await videoElement.play().catch((err) => {
          console.warn("Video playback failed:", err);
        });

        // Try to improve focus/zoom on Android if supported
        const [track] = stream.getVideoTracks();
        if (track) {
          try {
            // These advanced constraints are best-effort; unsupported keys are ignored
            await (track as any).applyConstraints({
              advanced: [
                { focusMode: "continuous" },
                { zoom: 2 },
              ],
            });
            console.log("Applied advanced camera constraints (focus/zoom).");
          } catch (e) {
            console.log("Advanced constraints not supported:", e);
          }
        }

        // Quagga readers config – object format required by typings
        const readerConfigs =
          supportQR
            ? [
                { format: "ean_reader", config: {} },
                { format: "ean_8_reader", config: {} },
                { format: "code_128_reader", config: {} },
                { format: "upc_reader", config: {} },
                { format: "qr_reader", config: {} },
              ]
            : [
                { format: "ean_reader", config: {} },
                { format: "ean_8_reader", config: {} },
                { format: "code_128_reader", config: {} },
                { format: "upc_reader", config: {} },
              ];

        const onDetectedLocal = (result: any) => {
          console.log("Detection attempt:", result);
          const code = result?.codeResult?.code;
          if (code) {
            console.log("Detected (Quagga):", code);
            handleBarcode(code);
          }
        };

        console.log("Initializing Quagga with readers:", readerConfigs);

        Quagga.init(
          {
            inputStream: {
              type: "LiveStream",
              target: videoRef.current,
              constraints: { facingMode: "environment" },
            },
            decoder: {
              readers: readerConfigs,
            },
            locator: { patchSize: "medium", halfSample: true },
            locate: true,
          },
          (err) => {
            setIsInitializing(false);

            if (err) {
              console.error("Quagga init error:", err);
              setHasCameraPermission(false);
              toast({
                title: "Camera Error",
                description: "Failed to initialize camera.",
                variant: "destructive",
              });
              setIsScanning(false);
              return;
            }

            console.log("Quagga started.");
            Quagga.start();
            Quagga.onDetected(onDetectedLocal);
          }
        );
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
        setIsInitializing(false);
        setIsScanning(false);
        toast({
          title: "Camera Access Denied",
          description: "Please enable camera permissions.",
          variant: "destructive",
        });
      }
    };

    startScanner();

    return () => {
      stopCamera();
      try {
        // @ts-ignore
        Quagga.offDetected?.();
      } catch {}
    };
  }, [isScanning, supportQR, handleBarcode, stopCamera, toast]);

  /* -------------------------------------------------------------
     MANUAL INPUT
  ------------------------------------------------------------- */
  function submitManual() {
    if (!manualInput) return;

    const normalized = normalizeEAN13(manualInput);
    if (!normalized || !isValidEAN13(normalized)) {
      toast({
        title: "Invalid Barcode",
        description: "Please enter a valid EAN-13 code.",
        variant: "destructive",
      });
      return;
    }

    handleBarcode(normalized);
  }

  /* -------------------------------------------------------------
     RENDER
  ------------------------------------------------------------- */
  return (
    <div className="w-full text-center space-y-4">
      {/* SCAN WINDOW */}
      <div className="relative w-full max-w-sm mx-auto">
        <video
          ref={videoRef}
          className="w-full aspect-video rounded-md bg-black/20"
          autoPlay
          muted
          playsInline
        />

        {/* Overlay frame */}
        <div className="absolute inset-0 pointer-events-none border-2 border-white/40 rounded-lg">
          <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-md" />
          <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-md" />
          <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-md" />
          <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-md" />
        </div>

        {isSteady && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white animate-pulse">
            Analyzing…
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

      {/* LAST SCAN STATUS */}
      {scanned && (
        <div className="text-sm text-muted-foreground h-5">
          <strong>Last Scan:</strong> {scanned}
        </div>
      )}

      {/* START / STOP BUTTON */}
      <div className="flex items-center justify-center gap-3">
        <Button
          onClick={() => {
            setIsSteady(false);
            setIsScanning((s) => !s);
          }}
          disabled={isInitializing}
        >
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
            onChange={(e) =>
              setManualInput(e.target.value.replace(/\D/g, ""))
            }
            className="border rounded px-3 py-2 w-48 text-center text-sm"
            onKeyDown={(e) => e.key === "Enter" && submitManual()}
          />
          <Button onClick={submitManual} variant="secondary">
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
