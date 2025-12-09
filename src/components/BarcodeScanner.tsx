"use client";

import { useEffect, useRef, useState } from "react";
import Quagga from "@ericblade/quagga2";
import { useRouter } from "next/navigation";

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
  const videoRef = useRef<HTMLDivElement>(null);

  const [scanned, setScanned] = useState<string | null>(null);
  const [isSteady, setIsSteady] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [supportQR, setSupportQR] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  /* ----------------------------------------------
     CALL CLOUD FUNCTION + REDIRECT
  ----------------------------------------------- */
  async function handleBarcode(raw: string) {
    const normalized = normalizeEAN13(raw);
    console.log("Raw scan:", raw, "→ Normalized:", normalized);

    setScanned(normalized ?? "Invalid scan");

    if (!normalized || !isValidEAN13(normalized)) {
      console.warn("Invalid barcode, ignoring.");
      return;
    }

    setIsSteady(true);

    try {
      const res = await fetch(
        `${LOOKUP_URL}?barcode=${encodeURIComponent(normalized)}`
      );
      const data = await res.json();

      if (!data.error) {
        router.push(`/product/${data.id}?status=${data.status}`);
        onDetected?.(normalized);
      } else {
        console.error("lookupProduct error:", data.error);
      }
    } catch (e) {
      console.error("Lookup failed:", e);
    } finally {
      setIsSteady(false);
      setIsScanning(false); // turn camera off after a scan
      try {
        Quagga.stop();
      } catch {}
    }
  }

  /* ----------------------------------------------
     START / STOP QUAGGA WHEN isScanning CHANGES
  ----------------------------------------------- */
  useEffect(() => {
    if (!isScanning) {
      // If we switch scanning off, ensure Quagga stops
      try {
        Quagga.stop();
      } catch {}
      return;
    }

    if (!videoRef.current) return;

    setIsInitializing(true);

   // Quagga expects objects, not plain strings — convert them:
   const readers = supportQR
   ? ["ean_reader", "ean_8_reader", "code_128_reader", "upc_reader", "qr_reader"]
   : ["ean_reader", "ean_8_reader", "code_128_reader", "upc_reader"];
 
 // Quagga requires a `config` object for each format
 const readerConfigs = readers.map((format) => ({
   format,
   config: {}, // required — even if empty
 }));


    const handleDetected = (result: any) => {
      const code = result?.codeResult?.code;
      if (!code) return;

      console.log("Detected (Quagga):", code);

      // Stop scanning after the first valid read
      setIsScanning(false);
      handleBarcode(code);
    };

    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          target: videoRef.current,
          constraints: { facingMode: "environment" },
        },
        decoder: { readers: readerConfigs },

      },
      (err) => {
        setIsInitializing(false);
        if (err) {
          console.error("Quagga init error:", err);
          setIsScanning(false);
          return;
        }
        Quagga.start();
        Quagga.onDetected(handleDetected);
      }
    );

    return () => {
      try {
        Quagga.stop();
      } catch {}
      // @ts-ignore: offDetected isn't always typed
      try {
        Quagga.offDetected?.(handleDetected);
      } catch {}
    };
  }, [isScanning, supportQR]);

  /* ----------------------------------------------
     MANUAL INPUT HANDLER
  ----------------------------------------------- */
  function submitManual() {
    const normalized = normalizeEAN13(manualInput);
    if (!normalized || !isValidEAN13(normalized)) {
      setScanned("Invalid manual barcode");
      return;
    }
    handleBarcode(normalized);
  }

  return (
    <div className="w-full text-center space-y-4">
      {/* SCAN WINDOW + OVERLAY */}
      <div className="relative">
        <div
          ref={videoRef}
          className="w-full h-[260px] bg-black/20 rounded-lg overflow-hidden"
        />

        {/* Overlay frame */}
        <div className="absolute inset-0 pointer-events-none border-2 border-white/40 rounded-lg">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br" />
        </div>

        {/* “Hold still…” state */}
        {isSteady && (
          <div className="absolute bottom-2 left-0 right-0 text-white text-sm animate-pulse">
            Hold still… analyzing
          </div>
        )}

        {/* Status overlay when initializing */}
        {isInitializing && isScanning && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs">
            Initializing camera…
          </div>
        )}
      </div>

      {/* SCAN STATUS */}
      {scanned && (
        <div className="text-sm text-muted-foreground">
          <strong>Scanned:</strong> {scanned}
        </div>
      )}

      {/* START / STOP BUTTONS */}
      <div className="flex items-center justify-center gap-3">
        {!isScanning ? (
          <button
            onClick={() => setIsScanning(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm"
          >
            Start scanning
          </button>
        ) : (
          <button
            onClick={() => setIsScanning(false)}
            className="bg-destructive text-white px-4 py-2 rounded-lg text-sm"
          >
            Stop scanning
          </button>
        )}
      </div>

      {/* QR TOGGLE */}
      <label className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={supportQR}
          onChange={() => setSupportQR((v) => !v)}
        />
        Enable QR code scanning
      </label>

      {/* MANUAL INPUT */}
      <div className="flex flex-col items-center gap-2 mt-4">
        <input
          type="text"
          placeholder="Enter barcode manually"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          className="border rounded px-3 py-2 w-48 text-center text-sm"
        />
        <button
          onClick={submitManual}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
