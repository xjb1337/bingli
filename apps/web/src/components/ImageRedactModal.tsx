import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { normalizeAiImage } from '@dabingli/ai';
import type { AiImageAttachment } from '../hooks/useAiSession';
import { ModalDialog } from './ConfirmModal';

interface MaskRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function ImageRedactModal({
  open,
  image,
  onApply,
  onClose,
}: {
  open: boolean;
  image: AiImageAttachment | null;
  onApply: (next: AiImageAttachment) => void;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);
  const [rects, setRects] = useState<MaskRect[]>([]);
  const [draftRect, setDraftRect] = useState<MaskRect | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !image) return;
    setRects([]);
    setDraftRect(null);
    setImageReady(false);
    setError('');
    const img = new Image();
    img.onload = () => {
      loadedImageRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth || img.width || 800;
      canvas.height = img.naturalHeight || img.height || 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setImageReady(true);
      }
    };
    img.onerror = () => setError('无法读取图片，请关闭后重试');
    img.src = image.previewDataUrl;
    return () => {
      img.onload = null;
      img.onerror = null;
      loadedImageRef.current = null;
      dragStartRef.current = null;
    };
  }, [image, open]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = loadedImageRef.current;
    if (!open || !canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    for (const r of rects) {
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
    if (draftRect) {
      ctx.fillStyle = 'rgba(17, 24, 39, 0.78)';
      ctx.fillRect(draftRect.x, draftRect.y, draftRect.w, draftRect.h);
    }
  }, [draftRect, open, rects]);

  function canvasCoords(event: PointerEvent<HTMLCanvasElement>): { x: number; y: number } {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const bounds = canvas.getBoundingClientRect();
    const scaleX = bounds.width > 0 ? canvas.width / bounds.width : 1;
    const scaleY = bounds.height > 0 ? canvas.height / bounds.height : 1;
    return {
      x: Math.max(0, Math.min(canvas.width, (event.clientX - bounds.left) * scaleX)),
      y: Math.max(0, Math.min(canvas.height, (event.clientY - bounds.top) * scaleY)),
    };
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (!imageReady || dragStartRef.current || event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = canvasCoords(event);
    dragStartRef.current = { ...point, pointerId: event.pointerId };
    setDraftRect({ x: point.x, y: point.y, w: 0, h: 0 });
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const start = dragStartRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const point = canvasCoords(event);
    setDraftRect({
      x: Math.min(start.x, point.x),
      y: Math.min(start.y, point.y),
      w: Math.abs(point.x - start.x),
      h: Math.abs(point.y - start.y),
    });
  }

  function handlePointerEnd(event: PointerEvent<HTMLCanvasElement>) {
    const start = dragStartRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    if (event.type === 'pointerup') {
      const point = canvasCoords(event);
      const x = Math.floor(Math.min(start.x, point.x));
      const y = Math.floor(Math.min(start.y, point.y));
      const w = Math.ceil(Math.max(start.x, point.x)) - x;
      const h = Math.ceil(Math.max(start.y, point.y)) - y;
      if (w >= 4 && h >= 4) setRects((prev) => [...prev, { x, y, w, h }]);
    }
    dragStartRef.current = null;
    setDraftRect(null);
  }

  function handleApply() {
    const source = loadedImageRef.current;
    const preview = canvasRef.current;
    if (!source || !preview || !image || !rects.length || dragStartRef.current) return;
    const output = document.createElement('canvas');
    output.width = preview.width;
    output.height = preview.height;
    const ctx = output.getContext('2d');
    if (!ctx) {
      setError('生成遮挡图片失败，请重试');
      return;
    }
    ctx.drawImage(source, 0, 0, output.width, output.height);
    ctx.fillStyle = '#000';
    for (const rect of rects) ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    const dataUrl = output.toDataURL('image/jpeg', 0.85);
    const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (!match?.[1] || !match[2]) {
      setError('生成遮挡图片失败，请重试');
      return;
    }
    const normalized = normalizeAiImage({ mimeType: match[1], dataBase64: match[2] });
    if (!normalized) {
      setError('遮挡后的图片无效，请重试');
      return;
    }
    onApply({
      ...normalized,
      previewDataUrl: `data:${normalized.mimeType};base64,${normalized.dataBase64}`,
      name: image.name,
    });
  }

  return (
    <ModalDialog open={open} title="涂抹遮挡敏感信息" onClose={onClose} className="modal-wide">
      <p className="muted">
        在图片上拖拽框选需要抹除的区域（如患者姓名、住院号、二维码/条码），遮挡区域将以纯黑色物理覆盖后重新压缩。
      </p>
      <div className="redact-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="redact-canvas"
          aria-label="病历图片遮挡画布"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        />
      </div>
      {error ? (
        <div className="field-error" role="alert">
          {error}
        </div>
      ) : null}
      <div className="modal-actions">
        <button
          type="button"
          className="button ghost"
          disabled={!rects.length}
          onClick={() => setRects((prev) => prev.slice(0, -1))}
        >
          撤销上一笔
        </button>
        <button
          type="button"
          className="button ghost"
          disabled={!rects.length}
          onClick={() => setRects([])}
        >
          重置遮挡
        </button>
        <button type="button" className="button primary" disabled={!imageReady || !rects.length || !!draftRect} onClick={handleApply}>
          应用遮挡（{rects.length} 处）
        </button>
      </div>
    </ModalDialog>
  );
}
