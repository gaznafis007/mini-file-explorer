'use client';

import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  title: string;
  initialValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => string | null;
  onClose: () => void;
}

export function Modal({
  isOpen, title, initialValue = '', placeholder = 'Enter name...',
  confirmLabel = 'Create', onConfirm, onClose,
}: ModalProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      setError(null);
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [isOpen, initialValue]);

  if (!isOpen || !mounted) return null;

  function handleConfirm() {
    const err = onConfirm(value);
    if (err) setError(err);
    else onClose();
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{title}</h2>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(null); }}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className={cn(
            'w-full px-3 py-2 text-sm rounded-lg border outline-none transition-colors',
            'bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
            error
              ? 'border-red-400 focus:border-red-500'
              : 'border-neutral-300 dark:border-neutral-600 focus:border-blue-500'
          )}
        />
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!value.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
