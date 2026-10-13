'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, X, Crop } from 'lucide-react';

type Props = {
  file: File;
  onCancel: () => void;
  /** Cropped file (or original if user skips crop) */
  onConfirm: (file: File) => void;
};

type Rect = { x: number; y: number; w: number; h: number };

/**
 * Lightweight crop UI: drag a selection on the image, then export via canvas.
 * No extra npm deps — good enough for blog content images.
 */
export default function ImageCropModal({ file, onCancel, onConfirm }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [objectUrl, setObjectUrl] = useState('');
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [display, setDisplay] = useState({ w: 0, h: 0 });
  const [selection, setSelection] = useState<Rect | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !natural.w) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const maxW = Math.min(720, window.innerWidth - 48);
    const scale = Math.min(1, maxW / natural.w);
    const dw = Math.round(natural.w * scale);
    const dh = Math.round(natural.h * scale);
    setDisplay({ w: dw, h: dh });
    canvas.width = dw;
    canvas.height = dh;

    ctx.clearRect(0, 0, dw, dh);
    ctx.drawImage(img, 0, 0, dw, dh);

    if (selection) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, dw, dh);
      ctx.clearRect(selection.x, selection.y, selection.w, selection.h);
      ctx.drawImage(
        img,
        (selection.x / dw) * natural.w,
        (selection.y / dh) * natural.h,
        (selection.w / dw) * natural.w,
        (selection.h / dh) * natural.h,
        selection.x,
        selection.y,
        selection.w,
        selection.h
      );
      ctx.strokeStyle = '#FC5B15';
      ctx.lineWidth = 2;
      ctx.strokeRect(selection.x, selection.y, selection.w, selection.h);
    }
  }, [natural, selection]);

  useEffect(() => {
    if (!objectUrl) return;
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setSelection(null);
    };
    img.src = objectUrl;
  }, [objectUrl]);

  useEffect(() => {
    draw();
  }, [draw]);

  const pointerPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(display.w, e.clientX - rect.left)),
      y: Math.max(0, Math.min(display.h, e.clientY - rect.top)),
    };
  };

  const onDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const p = pointerPos(e);
    dragStart.current = p;
    setSelection({ x: p.x, y: p.y, w: 0, h: 0 });
  };

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragStart.current) return;
    const p = pointerPos(e);
    const x = Math.min(dragStart.current.x, p.x);
    const y = Math.min(dragStart.current.y, p.y);
    const w = Math.abs(p.x - dragStart.current.x);
    const h = Math.abs(p.y - dragStart.current.y);
    setSelection({ x, y, w, h });
  };

  const onUp = () => {
    dragStart.current = null;
  };

  const exportCrop = async () => {
    const img = imgRef.current;
    if (!img) return;

    if (!selection || selection.w < 8 || selection.h < 8) {
      onConfirm(file);
      return;
    }

    const sx = (selection.x / display.w) * natural.w;
    const sy = (selection.y / display.h) * natural.h;
    const sw = (selection.w / display.w) * natural.w;
    const sh = (selection.h / display.h) * natural.h;

    const out = document.createElement('canvas');
    out.width = Math.max(1, Math.round(sw));
    out.height = Math.max(1, Math.round(sh));
    const ctx = out.getContext('2d');
    if (!ctx) {
      onConfirm(file);
      return;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, out.width, out.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      out.toBlob(resolve, file.type.includes('png') ? 'image/png' : 'image/jpeg', 0.92)
    );
    if (!blob) {
      onConfirm(file);
      return;
    }
    const cropped = new File([blob], file.name.replace(/(\.[^.]+)?$/, '-cropped$1'), {
      type: blob.type,
      lastModified: Date.now(),
    });
    onConfirm(cropped);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Crop size={16} className="text-orange-500" />
            Crop image (optional)
          </div>
          <button type="button" onClick={onCancel} className="rounded p-1 hover:bg-gray-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-3 text-xs text-gray-500">
          Drag on the image to select a crop area. Leave empty and confirm to use the full image.
        </div>

        <div className="flex justify-center overflow-auto px-4 pb-2">
          <canvas
            ref={canvasRef}
            className="max-w-full cursor-crosshair rounded-lg border border-gray-200"
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(file)}
            className="rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            Skip crop
          </button>
          <button
            type="button"
            onClick={exportCrop}
            className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600"
          >
            <Check size={14} />
            Use image
          </button>
        </div>
      </div>
    </div>
  );
}
