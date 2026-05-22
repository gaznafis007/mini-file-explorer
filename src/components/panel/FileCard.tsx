'use client';

import { useState } from 'react';
import { FileNode } from '@/types/fileSystem';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useContextMenu } from '@/hooks/useContextMenu';
import { ContextMenu } from '@/components/ui/ContextMenu';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatDate } from '@/lib/utils';
import { Folder, FileText } from 'lucide-react';

interface FileCardProps { node: FileNode; parentId: string | null; }

export function FileCard({ node, parentId }: FileCardProps) {
  const { expandAndSelectFolder, openFileById, createItem, renameItem, deleteItem } = useFileSystem();
  const { menu, openMenu, closeMenu } = useContextMenu();
  const [showCreateModal, setShowCreateModal] = useState<'folder' | 'text' | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isFolder = node.type === 'folder';

  function handleDoubleClick() {
    if (isFolder) expandAndSelectFolder(node.id);
    else openFileById(node.id);
  }

  return (
    <>
      <div
        className="group flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors select-none text-center"
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => openMenu(e, node.id, node.type, 'panel')}
        role="button" tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleDoubleClick()}
        aria-label={`${isFolder ? 'Folder' : 'File'}: ${node.name}`}
      >
        <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 group-hover:border-neutral-300 dark:group-hover:border-neutral-600 transition-colors">
          {isFolder
            ? <Folder size={28} className="text-yellow-500" fill="currentColor" fillOpacity={0.15} />
            : <FileText size={28} className="text-blue-500" />
          }
        </div>
        <span className="text-xs text-neutral-700 dark:text-neutral-200 font-medium w-20 truncate leading-tight">{node.name}</span>
        <span className="text-[10px] text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">{formatDate(node.updatedAt)}</span>
      </div>

      <ContextMenu menu={menu} onClose={closeMenu}
        onNewFolder={() => setShowCreateModal('folder')}
        onNewFile={() => setShowCreateModal('text')}
        onRename={() => setShowRenameModal(true)}
        onDelete={() => setShowDeleteConfirm(true)}
      />
      {isFolder && (
        <Modal isOpen={showCreateModal !== null} title={showCreateModal === 'folder' ? 'New Folder' : 'New Text File'}
          placeholder={showCreateModal === 'folder' ? 'Folder name' : 'File name'} confirmLabel="Create"
          onConfirm={(name) => createItem(name, showCreateModal!, node.id)} onClose={() => setShowCreateModal(null)}
        />
      )}
      <Modal isOpen={showRenameModal} title="Rename" initialValue={node.name} confirmLabel="Rename"
        onConfirm={(name) => renameItem(node.id, name, parentId)} onClose={() => setShowRenameModal(false)}
      />
      <ConfirmDialog isOpen={showDeleteConfirm} title={`Delete "${node.name}"`}
        message={isFolder ? 'This will permanently delete this folder and all its contents.' : 'This will permanently delete this file.'}
        onConfirm={() => deleteItem(node.id)} onClose={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
