'use client';

import { useState } from 'react';
import { FileNode } from '@/types/fileSystem';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useContextMenu } from '@/hooks/useContextMenu';
import { ContextMenu } from '@/components/ui/ContextMenu';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';
import { ChevronRight, Folder, FolderOpen, FileText, Pencil, Trash2 } from 'lucide-react';

interface TreeNodeProps { node: FileNode; depth?: number; parentId: string | null; }

export function TreeNode({ node, depth = 0, parentId }: TreeNodeProps) {
  const { selectedFolderId, expandedFolderIds, selectFolder, openFileById, toggleFolderExpand, createItem, renameItem, deleteItem } = useFileSystem();
  const { menu, openMenu, closeMenu } = useContextMenu();
  const [showCreateModal, setShowCreateModal] = useState<'folder' | 'text' | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isFolder = node.type === 'folder';
  const isExpanded = expandedFolderIds.has(node.id);
  const isSelected = selectedFolderId === node.id;

  function handleClick() {
    if (isFolder) { toggleFolderExpand(node.id); selectFolder(node.id); }
    else openFileById(node.id);
  }

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-1.5 py-1 rounded-md cursor-pointer select-none group',
          'hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors',
          isSelected && 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px`, paddingRight: '8px' }}
        onClick={handleClick}
        onContextMenu={(e) => openMenu(e, node.id, node.type, 'sidebar')}
        role="treeitem"
        aria-expanded={isFolder ? isExpanded : undefined}
        aria-selected={isFolder ? isSelected : undefined}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      >
        {isFolder
          ? <ChevronRight size={14} className={cn('shrink-0 text-neutral-400 transition-transform duration-150', isExpanded && 'rotate-90')} />
          : <span className="w-3.5 shrink-0" />
        }
        {isFolder
          ? (isExpanded ? <FolderOpen size={15} className="shrink-0 text-yellow-500" /> : <Folder size={15} className="shrink-0 text-yellow-500" />)
          : <FileText size={15} className="shrink-0 text-blue-400" />
        }
        <span className="text-sm truncate flex-1 text-neutral-700 dark:text-neutral-200">{node.name}</span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 shrink-0 transition-opacity">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowRenameModal(true); }}
            className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            aria-label={`Rename ${node.name}`}
            title="Rename"
          >
            <Pencil size={12} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
            className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-950 text-neutral-400 hover:text-red-500 transition-colors"
            aria-label={`Delete ${node.name}`}
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {isFolder && isExpanded && node.children && (
        <div role="group">
          {node.children.length === 0
            ? <p className="text-xs text-neutral-400 italic py-0.5" style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}>Empty folder</p>
            : node.children.map((child) => <TreeNode key={child.id} node={child} depth={depth + 1} parentId={node.id} />)
          }
        </div>
      )}

      <ContextMenu menu={menu} onClose={closeMenu}
        onNewFolder={() => setShowCreateModal('folder')}
        onNewFile={() => setShowCreateModal('text')}
        onRename={() => setShowRenameModal(true)}
        onDelete={() => setShowDeleteConfirm(true)}
      />
      <Modal isOpen={showCreateModal !== null} title={showCreateModal === 'folder' ? 'New Folder' : 'New Text File'}
        placeholder={showCreateModal === 'folder' ? 'Folder name' : 'File name'} confirmLabel="Create"
        onConfirm={(name) => createItem(name, showCreateModal!, node.id)} onClose={() => setShowCreateModal(null)}
      />
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
