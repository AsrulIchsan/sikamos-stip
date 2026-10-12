"use client";

import React, { useRef, useState, useEffect } from "react";
import { Eraser, CheckCircle2, PenTool } from "lucide-react";

interface SignatureCanvasProps {
  onSignatureCapture: (dataUrl: string | null) => void;
  signerTitle?: string;
}

export default function SignatureCanvas({
  onSignatureCapture,
  signerTitle = "Tanda Tangan Elektronik Resmi",
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Bersihkan dan siapkan canvas
    ctx.strokeStyle = "#0A2540"; // STIP Navy ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Simpan tanda tangan sebagai PNG Data URL
    const dataUrl = canvas.toDataURL("image/png");
    onSignatureCapture(dataUrl);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onSignatureCapture(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
        <span className="flex items-center">
          <PenTool className="w-3.5 h-3.5 mr-1 text-[#0A2540]" />
          {signerTitle}
        </span>
        <button
          type="button"
          onClick={clearCanvas}
          className="text-slate-500 hover:text-rose-600 flex items-center space-x-1"
        >
          <Eraser className="w-3.5 h-3.5" />
          <span>Hapus / Ulangi</span>
        </button>
      </div>

      <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden shadow-inner touch-none">
        <canvas
          ref={canvasRef}
          width={500}
          height={180}
          className="w-full h-36 cursor-crosshair block"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {!hasDrawn && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 text-xs font-medium">
            Bubuhkan tanda tangan di area kanvas ini (Mouse / Stylus / Layar Sentuh)
          </div>
        )}
      </div>

      {hasDrawn && (
        <p className="text-[11px] text-emerald-600 flex items-center">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" />
          Tanda tangan elektronik terekam dan siap disahkan dengan stempel waktu resmi.
        </p>
      )}
    </div>
  );
}

