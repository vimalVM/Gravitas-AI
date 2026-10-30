import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { useSignedImage } from '../../hooks/useSignedImage';

/** An image attachment inside a bubble. Click to open full size. */
export default function ImageMessage({ message, onOpen, onLoad }) {
  const { src, failed, onError } = useSignedImage(message);
  const [loaded, setLoaded] = useState(false);
  const uploading = message.status === 'sending' && typeof message.progress === 'number';

  if (failed) {
    return (
      <div className="flex h-32 w-56 max-w-full flex-col items-center justify-center gap-2 rounded-xl bg-slate-100 text-slate-500">
        <ImageOff className="size-6" aria-hidden="true" />
        <span className="text-xs font-medium">Image unavailable</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => src && onOpen?.(src)}
      disabled={!src}
      className="group relative block overflow-hidden rounded-xl bg-slate-200/60 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
      aria-label="Open image"
    >
      {!loaded && <div className="h-48 w-64 max-w-full animate-pulse bg-slate-200" aria-hidden="true" />}
      {src && (
        <img
          src={src}
          alt={message.content ? `Image: ${message.content.slice(0, 80)}` : 'Shared image'}
          onLoad={() => {
            setLoaded(true);
            onLoad?.();
          }}
          onError={onError}
          className={`block max-h-80 w-auto max-w-full object-cover transition group-hover:brightness-95 ${loaded ? '' : 'absolute inset-0 opacity-0'}`}
          loading="lazy"
        />
      )}
      {uploading && (
        <div className="absolute inset-0 flex items-end bg-navy-950/35 p-3">
          <div className="w-full">
            <div className="mb-1 text-left text-xs font-semibold text-white">Uploading {message.progress}%</div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/30">
              <div className="h-full rounded-full bg-white transition-[width]" style={{ width: `${message.progress}%` }} />
            </div>
          </div>
        </div>
      )}
    </button>
  );
}
