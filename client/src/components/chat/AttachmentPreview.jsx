import { X } from 'lucide-react';
import { formatBytes } from '../../utils/files';

/** Thumbnail of the image selected in the composer, before it is sent. */
export default function AttachmentPreview({ file, previewUrl, onRemove }) {
  if (!file || !previewUrl) return null;
  return (
    <div className="mb-2 flex animate-sheet-in items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 pr-3">
      <img src={previewUrl} alt="Selected attachment preview" className="size-16 shrink-0 rounded-xl object-cover ring-1 ring-slate-200" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-navy-900">{file.name}</p>
        <p className="text-xs text-slate-500">
          {formatBytes(file.size)} · Add an optional caption below
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-2 text-slate-500 hover:bg-slate-200 hover:text-navy-900"
        aria-label="Remove attachment"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
