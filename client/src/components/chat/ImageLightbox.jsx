import { useEffect } from 'react';
import { ExternalLink, X } from 'lucide-react';

export default function ImageLightbox({ src, onClose }) {
  useEffect(() => {
    if (!src) return undefined;
    const handler = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [src, onClose]);

  if (!src) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Image preview" className="fixed inset-0 z-50 flex animate-fade-in flex-col bg-navy-950/90">
      <div className="flex items-center justify-end gap-2 p-3 pt-safe">
        {!src.startsWith('blob:') && (
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            <ExternalLink className="size-4" aria-hidden="true" /> Open original
          </a>
        )}
        <button type="button" onClick={onClose} className="rounded-xl bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Close image">
          <X className="size-5" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center p-4 pb-safe" onClick={onClose}>
        <img src={src} alt="Full size attachment" className="max-h-full max-w-full rounded-xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
      </div>
    </div>
  );
}
