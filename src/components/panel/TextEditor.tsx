'use client';

// useEffectEvent (React 19.2, stable in Next.js 16) solves the stale closure
// problem for the Ctrl+S handler without needing useCallback.
// It extracts non-reactive logic from effects so that `content` is always fresh
// without being listed as a dependency.

import { useState, useEffect, useRef, useEffectEvent } from 'react';
import { useFileSystem } from '@/hooks/useFileSystem';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';

export function TextEditor() {
  const { openFile, openFileId, saveFileContent, openFileById } = useFileSystem();
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(true);
  const [justSaved, setJustSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync content when switching files
  useEffect(() => {
    if (openFile) { setContent(openFile.content ?? ''); setSaved(true); }
  }, [openFile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // useEffectEvent: reads current content without being a dep
  const onSave = useEffectEvent(() => {
    if (!openFileId) return;
    saveFileContent(openFileId, content);
    setSaved(true);
    setJustSaved(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setJustSaved(false), 2000);
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // onSave is an Effect Event — not a dependency
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); onSave(); }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!openFile) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => openFileById(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors" title="Back">
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate max-w-48">{openFile.name}</h2>
          {!saved && <span className="text-xs text-amber-500 font-medium">● Unsaved</span>}
        </div>
        <button onClick={onSave} disabled={saved}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
            justSaved ? 'bg-green-50 dark:bg-green-950 text-green-600'
            : saved ? 'text-neutral-400 cursor-default'
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {justSaved ? <><CheckCircle size={13} /> Saved</> : <><Save size={13} /> Save</>}
        </button>
      </div>

      <textarea
        value={content}
        onChange={(e) => { setContent(e.target.value); setSaved(false); }}
        className="flex-1 p-5 resize-none outline-none font-mono text-sm text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-950 leading-relaxed"
        placeholder="Start typing..."
        spellCheck={false}
      />

      <div className="px-5 py-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400 shrink-0">
        Press <kbd className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-[10px]">Ctrl+S</kbd> to save
      </div>
    </div>
  );
}
