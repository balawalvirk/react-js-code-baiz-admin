'use client';

import { NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import Image from '@tiptap/extension-image';
import { useCallback, useRef, useState } from 'react';

const WIDTH_PRESETS = [
  { label: 'S', width: '25%' },
  { label: 'M', width: '50%' },
  { label: 'L', width: '75%' },
  { label: 'Full', width: '100%' },
] as const;

function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [dragging, setDragging] = useState(false);

  const width = (node.attrs.width as string) || '100%';
  const src = node.attrs.src as string;
  const alt = (node.attrs.alt as string) || '';

  const onResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const startWidth = imgRef.current?.getBoundingClientRect().width || 0;
      const parentWidth =
        imgRef.current?.closest('.ProseMirror')?.getBoundingClientRect().width || startWidth;

      setDragging(true);

      const onMove = (ev: MouseEvent | TouchEvent) => {
        const clientX = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
        const delta = clientX - startX;
        const nextPx = Math.max(80, Math.min(parentWidth, startWidth + delta));
        const pct = Math.round((nextPx / parentWidth) * 100);
        updateAttributes({ width: `${Math.min(100, Math.max(10, pct))}%` });
      };

      const onUp = () => {
        setDragging(false);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onUp);
    },
    [updateAttributes]
  );

  return (
    <NodeViewWrapper
      className={`relative my-3 inline-block max-w-full ${selected ? 'ring-2 ring-orange-400 ring-offset-2 rounded-lg' : ''}`}
      style={{ width }}
      data-drag-handle
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className="rounded-lg max-w-full h-auto block w-full"
        draggable={false}
      />

      {selected && (
        <>
          <div className="absolute -top-9 left-0 flex items-center gap-1 rounded-md border border-gray-200 bg-white px-1.5 py-1 shadow-sm">
            {WIDTH_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                title={`Width ${p.width}`}
                onClick={() => updateAttributes({ width: p.width })}
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                  width === p.width
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <span
            role="presentation"
            onMouseDown={onResizeStart}
            onTouchStart={onResizeStart}
            className={`absolute bottom-1 right-1 h-3.5 w-3.5 cursor-se-resize rounded-sm border-2 border-white bg-orange-500 shadow ${
              dragging ? 'scale-110' : ''
            }`}
            title="Drag to resize"
          />
        </>
      )}
    </NodeViewWrapper>
  );
}

export const ResizableImage = Image.extend({
  name: 'image',
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: (element) =>
          element.getAttribute('width') ||
          element.style.width ||
          element.getAttribute('data-width') ||
          '100%',
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return {
            width: attributes.width,
            style: `width: ${attributes.width}; height: auto;`,
            'data-width': attributes.width,
          };
        },
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
