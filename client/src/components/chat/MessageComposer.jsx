import { useLayoutEffect, useRef, useState } from 'react';
import { ImagePlus, SendHorizontal } from 'lucide-react';
import { MAX_MESSAGE_LENGTH, UPLOADS } from '../../config/app';
import { useImageAttachment } from '../../hooks/useImageAttachment';
import AttachmentPreview from './AttachmentPreview';

const MAX_TEXTAREA_PX = 160;

/**
 * WhatsApp-style composer: Enter sends, Shift+Enter adds a new line, images
 * can be attached (button or paste) with a preview and optional caption.
 */
export default function MessageComposer({ onSend, onTyping, disabled = false, placeholder = 'Type a message' }) {
  const [text, setText] = useState('');
  const attachment = useImageAttachment(UPLOADS.maxBytes);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const trimmed = text.trim();
  const tooLong = trimmed.length > MAX_MESSAGE_LENGTH;
  const canSend = !disabled && !tooLong && (trimmed.length > 0 || Boolean(attachment.file));

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_PX)}px`;
  }, [text]);

  const submit = () => {
    if (!canSend) return;
    onSend({ text: trimmed, file: attachment.file });
    setText('');
    attachment.clear();
    onTyping?.(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  const handleFile = (file) => {
    if (file) attachment.select(file);
  };

  const handlePaste = (event) => {
    const file = [...(event.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'));
    if (file) {
      event.preventDefault();
      handleFile(file);
    }
  };

  return (
    <form
      className="border-t border-slate-200 bg-white px-3 pt-2.5 pb-safe sm:px-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="mx-auto w-full max-w-3xl pb-2.5">
        <AttachmentPreview file={attachment.file} previewUrl={attachment.previewUrl} onRemove={attachment.clear} />
        {attachment.error && (
          <p role="alert" className="mb-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            {attachment.error}
          </p>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(event) => {
              handleFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-navy-900 disabled:opacity-50"
            aria-label="Attach an image"
            title={`Attach an image (JPEG, PNG or WEBP, max ${UPLOADS.maxMb} MB)`}
          >
            <ImagePlus className="size-5" />
          </button>

          <div className="flex min-h-11 flex-1 items-center rounded-3xl bg-slate-100 px-4 py-2 ring-1 ring-transparent transition focus-within:bg-white focus-within:ring-navy-200">
            <label htmlFor="message-input" className="sr-only">Message</label>
            <textarea
              id="message-input"
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                onTyping?.(event.target.value.length > 0);
              }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onBlur={() => onTyping?.(false)}
              disabled={disabled}
              placeholder={attachment.file ? 'Add a caption (optional)' : placeholder}
              enterKeyHint="send"
              className="max-h-40 w-full resize-none bg-transparent text-[15px] leading-6 text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={!canSend}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-navy-900 text-white shadow-sm transition hover:bg-navy-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            aria-label="Send message"
          >
            <SendHorizontal className="size-5" />
          </button>
        </div>
        {trimmed.length > MAX_MESSAGE_LENGTH - 300 && (
          <p className={`mt-1 text-right text-[11px] ${tooLong ? 'font-semibold text-rose-600' : 'text-slate-400'}`}>
            {trimmed.length}/{MAX_MESSAGE_LENGTH}
          </p>
        )}
      </div>
    </form>
  );
}
