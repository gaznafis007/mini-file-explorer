'use client';

import { useState } from 'react';
import { useFileSystem } from '@/hooks/useFileSystem';
import { FileCard } from './FileCard';
import { Modal } from '@/components/ui/Modal';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { EmptyState } from '@/components/ui/EmptyState';
import { FolderPlus, FilePlus } from 'lucide-react';

export function FolderContents() {
  const { currentChildren, selectedFolderId, breadcrumb, createItem } = useFileSystem();
  const [showCreateModal, setShowCreateModal] = useState<'folder' | 'text' | null>(null);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <Breadcrumb path={breadcrumb} />
        <div className="flex items-center gap-1">
          <button onClick={() => setShowCreateModal('folder')} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors font-medium" title="New Folder">
            <FolderPlus size={14} /><span className="hidden sm:inline">Folder</span>
          </button>
          <button onClick={() => setShowCreateModal('text')} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors font-medium" title="New File">
            <FilePlus size={14} /><span className="hidden sm:inline">File</span>
          </button>
        </div>
      </div>

      {currentChildren.length === 0
        ? <EmptyState title="This folder is empty" description="Double-click a folder to enter it, or use the buttons above to create items" />
        : (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
              {currentChildren.map((node) => <FileCard key={node.id} node={node} parentId={selectedFolderId} />)}
            </div>
          </div>
        )
      }

      <Modal isOpen={showCreateModal !== null} title={showCreateModal === 'folder' ? 'New Folder' : 'New Text File'}
        placeholder={showCreateModal === 'folder' ? 'Folder name' : 'File name'} confirmLabel="Create"
        onConfirm={(name) => createItem(name, showCreateModal!, selectedFolderId)} onClose={() => setShowCreateModal(null)}
      />
    </div>
  );
}
