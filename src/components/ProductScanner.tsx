"use client";

import { useEffect, useRef, useState } from "react";
import Quagga from "@ericblade/quagga2";
import { useRouter } from "next/navigation";

const LOOKUP_URL =
  "https://us-central1-purescan-a61f4.cloudfunctions.net/lookupProduct";

type ScanHistoryEntry = {
  code: string;
  status: "existing" | "new" | "error" | "unknown";
  productId: string | null;
  at: string; // ISO timestamp
};

const HISTORY_KEY = "purescan_scan_history";

export default function ProductScanner() {
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const videoRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Native API support?
  const nativeSupported =
    typeof window !== "undefined" && "BarcodeDetector" in window;

  /** -----------------------------
   *  Load scan history on mount
   *  ----------------------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ScanHistoryEntry[];
        setHistory(parsed);
      }
    } catch (e) {
      console.error("Error reading scan history", e);
    }
  }, []);

  /** -----------------------------
   *  Save scan history helper
   *  ----------------------------- */
  function pushHistory(entry: ScanHistoryEntry) {
    const next = [entry, ...history].slice(0, 10); // keep last 10
    setHistory(next);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      }
    } catch (e) {
      console.error("Error saving scan history", e);
    }
  }

  /** -----------------------------
   *  CLOUD LOOKUP + REDIRECT
   *  ----------------------------- */
  async function handleBarcode(code: string) {
    // Prevent double-triggers
    if (isLoading) return;

    try {
      setIsLoading(true);
      setLastBarcode(code);
      console.log("🔍 Sending barcode to API:", code);

      const res = await fetch(
        `${LOOKUP_URL}?barcode=${encodeURIComponent(code)}`
      );
      const data = await res.json();

      console.log("API result:", data);

      if (data.error) {
        console.error("Lookup error:", data.error);
        pushHistory({
          code,
          status: "error",
          productId: null,
          at: new Date().toISOString(),
        });
        return;
      }

      const status: "existing" | "new" | "unknown" =
        data.status === "existing" || data.status === "new"
          ? data.status
          : "unknown";

      pushHistory({
        code,
        status,
        productId: data.id ?? null,
        at: new Date().toISOString(),
      });

      // Haptic feedback
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        (navigator as any).vibrate?.(60);
      }

      // Redirect to product page, with status
      if (data.id) {
        router.push(`/product/${data.id}?status=${status}`);
      }
    } catch (e) {
      console.error("Lookup failed", e);
      pushHistory({
        code,
        status: "error",
        productId: null,
        at: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  }

  /** -----------------------------
   *  Setup scanner on mount
   *  ----------------------------- */
  useEffect(() => {
    if (nativeSupported) {
      console.log("📸 Using Native BarcodeDetector");
      startNativeScanner();
    } else {
      console.warn("⚠️ BarcodeDetector not supported — using Quagga fallback");
      startQuaggaScanner();
    }

    return () => {
      stopQuagga();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** -----------------------------
   *  Native BarcodeDetector Scanner
   *  ----------------------------- */
  async function startNativeScanner() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const detector = new BarcodeDetector({
        formats: ["ean_13", "ean_8", "code_128", "upc_a"],
      });

      const scanLoop = async () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          const barcodes = await detector.detect(video);

          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            console.log("Detected (native):", code);

            stopVideo(video);
            await handleBarcode(code);
            return;
          }
        }

        requestAnimationFrame(scanLoop);
      };

      scanLoop();

      if (videoRef.current) videoRef.current.appendChild(video);
    } catch (error) {
      console.log("Native scanner failed → switching to Quagga", error);
      startQuaggaScanner();
    }
  }

  function stopVideo(video: HTMLVideoElement) {
    const stream = video.srcObject as MediaStream;
    stream.getTracks().forEach((track) => track.stop());
  }

  /** -----------------------------
   *  Quagga Fallback Scanner
   *  ----------------------------- */
  function startQuaggaScanner() {
    if (!videoRef.current) return;

    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          target: videoRef.current,
          constraints: { facingMode: "environment" },
        },
        decoder: {
          readers: [
            "ean_reader",
            "ean_8_reader",
            "code_128_reader",
            "upc_reader",
          ],
        },
      },
      (err) => {
        if (err) {
          console.error("Quagga init error:", err);
          return;
        }
        Quagga.start();
      }
    );

    Quagga.onDetected(async (result) => {
      const code = result.codeResult.code;
      console.log("Detected (Quagga):", code);
      stopQuagga();
      await handleBarcode(code);
    });
  }

  function stopQuagga() {
    try {
      Quagga.stop();
    } catch {}
  }

  /** -----------------------------
   *  Render
   *  ----------------------------- */
  return (
    <div className="w-full text-center space-y-4">
      <div className="text-xs text-muted-foreground">
        {nativeSupported
          ? "Using native camera scanner."
          : "Barcode Detector API not supported. Fallback scanner active."}
      </div>

      <div
        ref={videoRef}
        style={{
          width: "100%",
          height: "260px",
          borderRadius: "12px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <div className="bg-white px-4 py-2 rounded-md shadow">
              <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-xs text-gray-700">Analyzing barcode…</p>
            </div>
          </div>
        )}
      </div>

      {lastBarcode && (
        <div className="text-gray-600 text-xs">
          Last detected: <span className="font-mono">{lastBarcode}</span>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-4 text-left text-xs border-t pt-3">
          <div className="font-semibold mb-1">Recent scans</div>
          <ul className="space-y-1">
            {history.slice(0, 5).map((h, i) => (
              <li
                key={i}
                className="flex items-center justify-between cursor-pointer hover:bg-muted/60 px-2 py-1 rounded"
                onClick={() => {
                  if (h.productId) {
                    router.push(`/product/${h.productId}?status=${h.status}`);
                  }
                }}
              >
                <span className="font-mono">{h.code}</span>
                <span
                  className={`ml-2 text-[10px] uppercase ${
                    h.status === "new"
                      ? "text-blue-600"
                      : h.status === "existing"
                      ? "text-green-600"
                      : h.status === "error"
                      ? "text-red-600"
                      : "text-gray-500"
                  }`}
                >
                  {h.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
