import { useState } from 'react';
import { initialsOf } from '../../utils/ids';

const PALETTE = [
  'bg-blue-100 text-blue-800',
  'bg-indigo-100 text-indigo-800',
  'bg-sky-100 text-sky-800',
  'bg-teal-100 text-teal-800',
  'bg-violet-100 text-violet-800',
  'bg-slate-200 text-slate-700',
];

function colorFor(name) {
  let hash = 0;
  for (const ch of String(name ?? '')) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

/** Profile picture with an initials fallback and optional online dot. */
export default function Avatar({ name, src, size = 40, online, className = '' }) {
  const [broken, setBroken] = useState(false);
  const showImage = src && !broken;
  return (
    <span className={`relative inline-flex shrink-0 ${className}`} style={{ width: size, height: size }}>
      {showImage ? (
        <img
          src={src}
          alt={`${name ?? 'User'}'s avatar`}
          onError={() => setBroken(true)}
          className="size-full rounded-full object-cover ring-1 ring-slate-200"
        />
      ) : (
        <span
          aria-hidden="true"
          className={`flex size-full items-center justify-center rounded-full font-bold ${colorFor(name)}`}
          style={{ fontSize: Math.max(11, size * 0.38) }}
        >
          {initialsOf(name)}
        </span>
      )}
      {online !== undefined && (
        <span
          className={`absolute right-0 bottom-0 block rounded-full ring-2 ring-white ${online ? 'bg-emerald-500' : 'bg-slate-300'}`}
          style={{ width: Math.max(8, size * 0.26), height: Math.max(8, size * 0.26) }}
          aria-label={online ? 'Online' : 'Offline'}
        />
      )}
    </span>
  );
}
