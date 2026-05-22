'use client';

import { useState } from 'react';
import { TreeView } from '@/components/tree/TreeView';
import { Modal } from '@/components/ui/Modal';
import { useFileSystem } from '@/hooks/useFileSystem';
import { FolderPlus, FilePlus, HardDrive } from 'lucide-react';

export function Sidebar() {
  const { createItem } = useFileSystem();
  const [showCreateModal, setShowCreateModal] = useState<'folder' | 'text' | null>(null);

  return (
    <aside className="flex flex-col h-full border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 w-60 shrink-0">
      <div className="flex items-center justify-between px-3 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <HardDrive size={15} className="text-neutral-500" />
          <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Files</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setShowCreateModal('folder')} className="p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 transition-colors" title="New Folder at root">
            <FolderPlus size={14} />
          </button>
          <button onClick={() => setShowCreateModal('text')} className="p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 transition-colors" title="New File at root">
            <FilePlus size={14} />
          </button>
        </div>
      </div>
      <TreeView />
      <Modal isOpen={showCreateModal !== null} title={showCreateModal === 'folder' ? 'New Folder' : 'New Text File'}
        placeholder={showCreateModal === 'folder' ? 'Folder name' : 'File name'} confirmLabel="Create"
        onConfirm={(name) => createItem(name, showCreateModal!, null)} onClose={() => setShowCreateModal(null)}
      />
    </aside>
  );
}
