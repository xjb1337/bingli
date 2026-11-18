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
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !image) return;
    setRects([]);
    setDraftRect(null);
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
      }
    };
    img.src = image.previewDataUrl;
  }, [image, open]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = loadedImageRef.current;
    if (!open || !canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111827';
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
      x: (event.clientX - bounds.left) * scaleX,
      y: (event.clientY - bounds.top) * scaleY,
    };
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = canvasCoords(event);
    dragStartRef.current = point;
    setDraftRect({ x: point.x, y: point.y, w: 0, h: 0 });
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const start = dragStartRef.current;
    if (!start) return;
    const point = canvasCoords(event);
    setDraftRect({
      x: Math.min(start.x, point.x),
      y: Math.min(start.y, point.y),
      w: Math.abs(point.x - start.x),
      h: Math.abs(point.y - start.y),
    });
  }

  function handlePointerUp() {
    if (draftRect && (draftRect.w >= 4 || draftRect.h >= 4)) {
      setRects((prev) => [...prev, draftRect]);
    }
    dragStartRef.current = null;
    setDraftRect(null);
  }

  function handleApply() {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
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
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
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
        <button type="button" className="button primary" onClick={handleApply}>
          应用遮挡（{rects.length} 处）
        </button>
      </div>
    </ModalDialog>
  );
}
