'use client';

import { ContextMenuState } from '@/types/fileSystem';

interface ContextMenuProps {
  menu: ContextMenuState;
  onClose: () => void;
  onNewFolder: () => void;
  onNewFile: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function ContextMenu({ menu, onClose, onNewFolder, onNewFile, onRename, onDelete }: ContextMenuProps) {
  if (!menu.visible) return null;
  const isFolder = menu.targetType === 'folder';
  type Action = { label: string; icon: string; onClick: () => void; danger?: boolean };
  const actions: Action[] = [
    ...(isFolder
      ? [
          { label: 'New Folder', icon: '📁', onClick: () => { onNewFolder(); onClose(); } },
          { label: 'New Text File', icon: '📄', onClick: () => { onNewFile(); onClose(); } },
        ]
      : []),
    { label: 'Rename', icon: '✏️', onClick: () => { onRename(); onClose(); } },
    { label: 'Delete', icon: '🗑️', onClick: () => { onDelete(); onClose(); }, danger: true },
  ];

  const style: React.CSSProperties = {
    position: 'fixed',
    top: Math.min(menu.y, window.innerHeight - (actions.length * 40 + 16)),
    left: Math.min(menu.x, window.innerWidth - 180),
    zIndex: 100,
  };

  return (
    <div style={style} className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 py-1 min-w-[160px] text-sm" onClick={(e) => e.stopPropagation()}>
      {actions.map((action, i) => (
        <button key={i} onClick={action.onClick}
          className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors ${action.danger ? 'text-red-500' : 'text-neutral-700 dark:text-neutral-200'}`}
        >
          <span className="text-base leading-none">{action.icon}</span>
          {action.label}
        </button>
      ))}
    </div>
  );
}
