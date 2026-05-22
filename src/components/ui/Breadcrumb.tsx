'use client';

import { FileNode } from '@/types/fileSystem';
import { useFileSystem } from '@/hooks/useFileSystem';

export function Breadcrumb({ path }: { path: FileNode[] }) {
  const { selectFolder } = useFileSystem();
  return (
    <nav className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400 flex-wrap" aria-label="breadcrumb">
      <button onClick={() => selectFolder(null)} className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors font-medium">
        Home
      </button>
      {path.map((node, i) => (
        <span key={node.id} className="flex items-center gap-1">
          <span className="text-neutral-300 dark:text-neutral-600">/</span>
          <button
            onClick={() => i < path.length - 1 ? selectFolder(node.id) : undefined}
            aria-current={i === path.length - 1 ? 'page' : undefined}
            className={`transition-colors ${i === path.length - 1 ? 'text-neutral-900 dark:text-neutral-100 font-medium cursor-default' : 'hover:text-neutral-900 dark:hover:text-neutral-100'}`}
          >
            {node.name}
          </button>
        </span>
      ))}
    </nav>
  );
}
