"use client";

import { useEffect, useRef, useState } from "react";
import Quagga from "@ericblade/quagga2";

export default function ProductScanner() {
  const [barcode, setBarcode] = useState<string | null>(null);
  const videoRef = useRef<HTMLDivElement>(null);

  // Try native BarcodeDetector first
  const nativeSupported =
    typeof window !== "undefined" &&
    "BarcodeDetector" in window;

  useEffect(() => {
    if (nativeSupported) {
      console.log("Using native BarcodeDetector");
      startNativeScanner();
    } else {
      console.warn("BarcodeDetector not supported — using Quagga fallback.");
      startQuaggaScanner();
    }

    return () => {
      stopQuagga();
    };
  }, []);

  /** -----------------------------
   *  Native BarcodeDetector API
   *  ----------------------------- */
  async function startNativeScanner() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "code_128", "upc_a"] });

      const scanLoop = async () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          const barcodes = await detector.detect(video);
          if (barcodes.length > 0) {
            setBarcode(barcodes[0].rawValue);
            stopVideo(video);
            return; // stop scanning
          }
        }
        requestAnimationFrame(scanLoop);
      };

      scanLoop();
      if (videoRef.current) videoRef.current.appendChild(video);
    } catch (error) {
      console.log("Native scanner failed → using fallback", error);
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
          readers: ["ean_reader", "ean_8_reader", "code_128_reader", "upc_reader"],
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

    Quagga.onDetected((result) => {
      const code = result.codeResult.code;
      console.log("Detected (Quagga):", code);
      setBarcode(code);
      stopQuagga();
    });
  }

  function stopQuagga() {
    if (Quagga) {
      try {
        Quagga.stop();
      } catch {}
    }
  }

  return (
    <div className="w-full text-center space-y-4">
      <div className="text-sm text-red-500">
        Barcode Detector API not supported. Fallback scanner active.
      </div>

      <div
        ref={videoRef}
        style={{ width: "100%", height: "260px", borderRadius: "12px", overflow: "hidden" }}
      ></div>

      {barcode && (
        <a
          href={`/product/${barcode}`}
          className="inline-block mt-4 px-6 py-3 bg-primary text-white rounded-md"
        >
          View Product → {barcode}
        </a>
      )}
    </div>
  );
}
