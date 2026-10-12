"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ProgressIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeRequestsRef = useRef(0);

  // Mulai animasi loading progress
  const startLoading = () => {
    setVisible(true);
    setProgress((prev) => (prev < 20 ? 25 : prev));

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 90;
        }
        // Naik bertahap melambat mendekati 90%
        const increment = Math.max(1, (90 - prev) * 0.15);
        return Math.min(90, prev + increment);
      });
    }, 150);
  };

  // Selesaikan animasi loading progress
  const completeLoading = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    setProgress(100);
    setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setProgress(0);
      }, 250);
    }, 300);
  };

  // 1. Tangani Navigasi Rute (Perubahan Pathname / SearchParams)
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    completeLoading();
  }, [pathname, searchParams]);

  // 2. Intersepsi Klik Link Internal
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      const targetAttr = target.getAttribute("target");

      // Cek apakah tautan adalah rute internal aplikasi
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("#") &&
        targetAttr !== "_blank" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        // Jika rute tujuan berbeda dari halaman saat ini
        const currentPath = window.location.pathname + window.location.search;
        if (href !== currentPath) {
          startLoading();
        }
      }
    };

    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  // 3. Intersepsi Otomatis Fetch Network Request
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      activeRequestsRef.current += 1;
      startLoading();

      try {
        const response = await originalFetch(...args);
        return response;
      } finally {
        activeRequestsRef.current = Math.max(0, activeRequestsRef.current - 1);
        if (activeRequestsRef.current === 0) {
          completeLoading();
        }
      }
    };

    // 4. Custom Event Listener (start-loading / stop-loading)
    const handleCustomStart = () => startLoading();
    const handleCustomStop = () => completeLoading();

    window.addEventListener("sikamos-loading-start", handleCustomStart);
    window.addEventListener("sikamos-loading-stop", handleCustomStop);

    return () => {
      window.fetch = originalFetch;
      window.removeEventListener("sikamos-loading-start", handleCustomStart);
      window.removeEventListener("sikamos-loading-stop", handleCustomStop);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ height: "4px" }}
    >
      {/* Track Background */}
      <div className="w-full h-full bg-slate-200/30 overflow-hidden relative">
        {/* Striped Moving Progress Bar */}
        <div
          className="h-full striped-progress-bar bg-gradient-to-r from-[#0A2540] via-[#1E3A8A] to-[#D4AF37] transition-all duration-200 ease-out shadow-sm relative"
          style={{
            width: `${progress}%`,
          }}
        >
          {/* Glowing Front Edge */}
          <div
            className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/70"
            style={{
              boxShadow: "0 0 10px #D4AF37, 0 0 5px #D4AF37",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function TopProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressIndicator />
    </Suspense>
  );
}

