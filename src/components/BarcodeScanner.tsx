"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Quagga from "@ericblade/quagga2";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Video } from "lucide-react";

/* Allow BarcodeDetector on window if ever needed */
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

  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12) {
    const sum = digits
      .split("")
      .reduce(
        (acc, val, idx) => acc + Number(val) * (idx % 2 === 0 ? 1 : 3),
        0
      );
    const checksum = (10 - (sum % 10)) % 10;
    return digits + checksum;
  }

  if (digits.length === 13) return digits;
  return null;
}

function isValidEAN13(code: string | null) {
  if (!code || !/^\d{13}$/.test(code)) return false;

  const digits = code.split("").map(Number);
  const check = digits.pop()!;
  const sum = digits.reduce(
    (acc, v, i) => acc + v * (i % 2 === 0 ? 1 : 3),
    0
  );
  return check === (10 - (sum % 10)) % 10;
}

/* -------------------------------------------------------------
   MAIN COMPONENT
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
  const [manualInput, setManualInput] = useState("");
  const [supportQR, setSupportQR] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSteady, setIsSteady] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);

  // keep last scans across renders for stability filter
  const lastScansRef = useRef<string[]>([]);

  function verifyStableScan(code: string) {
    const arr = lastScansRef.current;
    arr.push(code);
    if (arr.length > 6) arr.shift();
    const count = arr.filter((c) => c === code).length;
    return count >= 3; // require 3 matching reads
  }

  /* -------------------------------------------------------------
     Handle barcode result
  ------------------------------------------------------------- */
  const handleBarcode = useCallback(
    async (raw: string) => {
      if (isSteady) return; // ignore repeated triggers while processing

      const normalized = normalizeEAN13(raw);
      console.log("📦 Raw scan:", raw, "➡ Normalized:", normalized);

      if (!normalized || !isValidEAN13(normalized)) {
        console.warn("❌ Invalid or partial barcode ignored:", raw);
        return;
      }

      setScanned(normalized);
      setIsSteady(true);
      setIsScanning(false);

      try {
        const res = await fetch(
          `${LOOKUP_URL}?barcode=${encodeURIComponent(normalized)}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        router.push(`/product/${data.id}?status=${data.status}`);
        onDetected?.(normalized);
      } catch (e: any) {
        console.error("Lookup error:", e);
        toast({
          title: "Lookup Error",
          description:
            e.message || "Could not look up this product. Please try again.",
          variant: "destructive",
        });
        setIsSteady(false);
      }
    },
    [isSteady, router, onDetected, toast]
  );

  /* -------------------------------------------------------------
     Stop camera safely
  ------------------------------------------------------------- */
  const stopCamera = useCallback(() => {
    console.log("📷 Stopping camera...");
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    try {
      Quagga.stop();
    } catch {}
  }, []);

  /* -------------------------------------------------------------
     Start scanner
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
      lastScansRef.current = [];
      setIsSteady(false);

      try {
        // High-resolution, rear camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        videoRef.current.srcObject = stream;

        // Scan zone: full-width, narrow horizontal band
        const scanArea = {
          top: "40%",
          right: "10%",
          left: "10%",
          bottom: "40%",
        };

        const readers = supportQR
          ? ["ean_reader", "ean_8_reader", "code_128_reader", "upc_reader", "qr_reader"]
          : ["ean_reader", "ean_8_reader", "code_128_reader", "upc_reader"];

        Quagga.init(
          {
            inputStream: {
              type: "LiveStream",
              target: videoRef.current,
              constraints: {
                facingMode: "environment",
              },
            },
            locator: {
              patchSize: "medium",
              halfSample: false,
            },
            decoder: {
              // Cast to any to satisfy Quagga's strict typings
              readers: readers as any,
            },
            locate: true,
            area: scanArea as any,
            numOfWorkers: 4,
            frequency: 10,
          },
          (err) => {
            setIsInitializing(false);

            if (err) {
              console.error("Quagga init error:", err);
              setHasCameraPermission(false);
              setIsScanning(false);
              return;
            }

            Quagga.start();

            Quagga.onDetected((result) => {
              const code = result?.codeResult?.code;
              if (!code || code.length < 10) return; // reject obvious garbage

              if (!verifyStableScan(code)) return; // wait until stable

              console.log("📸 Stable detection:", code);
              handleBarcode(code);
            });
          }
        );
      } catch (error) {
        console.error("Camera error:", error);
        setHasCameraPermission(false);
        setIsInitializing(false);
        setIsScanning(false);
      }
    };

    startScanner();

    return () => {
      stopCamera();
      try {
        // @ts-ignore – offDetected isn't always present in typings
        Quagga.offDetected?.();
      } catch {}
    };
  }, [isScanning, supportQR, handleBarcode, stopCamera]);

  /* -------------------------------------------------------------
     Manual input fallback
  ------------------------------------------------------------- */
  function submitManual() {
    const normalized = normalizeEAN13(manualInput);
    if (!normalized || !isValidEAN13(normalized)) {
      toast({
        title: "Invalid Barcode",
        description: "Please enter a valid EAN-13 barcode.",
        variant: "destructive",
      });
      return;
    }
    handleBarcode(normalized);
  }

  /* -------------------------------------------------------------
     RENDER UI
  ------------------------------------------------------------- */
  return (
    <div className="w-full text-center space-y-4">
      <div className="relative w-full max-w-sm mx-auto">
        {/* Camera preview */}
        <video
          ref={videoRef}
          className="w-full aspect-video rounded-md bg-black/10"
          autoPlay
          muted
          playsInline
        />

        {/* Scan zone overlay: full width, narrow height */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute left-0 right-0 border-t-4 border-primary opacity-70"
            style={{ top: "40%" }}
          />
          <div
            className="absolute left-0 right-0 border-b-4 border-primary opacity-70"
            style={{ bottom: "40%" }}
          />
        </div>

        {isSteady && (
          <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center animate-pulse">
            Analyzing…
          </div>
        )}

        {!hasCameraPermission && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-md">
            <Alert variant="destructive">
              <Video className="h-4 w-4" />
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Please enable camera permissions to use the scanner.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>

      {scanned && (
        <p className="text-sm text-muted-foreground h-5">
          Last scan: {scanned}
        </p>
      )}

      <Button
        disabled={isInitializing}
        onClick={() => {
          setIsSteady(false);
          setIsScanning((v) => !v);
        }}
      >
        {isScanning ? "Stop Scanning" : "Start Scanning"}
      </Button>

      <label className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={supportQR}
          onChange={() => setSupportQR((v) => !v)}
          disabled={isScanning}
        />
        Enable QR scanning
      </label>

      <div className="pt-4 border-t flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground">Or enter manually:</p>
        <div className="flex gap-2">
          <input
            type="tel"
            className="border rounded px-3 py-2 w-48 text-center text-sm"
            placeholder="Enter barcode"
            value={manualInput}
            onChange={(e) =>
              setManualInput(e.target.value.replace(/\D/g, ""))
            }
          />
          <Button variant="secondary" onClick={submitManual}>
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
