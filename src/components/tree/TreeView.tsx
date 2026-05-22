'use client';

import { useFileSystem } from '@/hooks/useFileSystem';
import { TreeNode } from './TreeNode';
import { EmptyState } from '@/components/ui/EmptyState';

export function TreeView() {
  const { tree } = useFileSystem();
  if (tree.length === 0) return <EmptyState title="No files yet" description="Use the + buttons to create your first folder or file" icon="🗂️" />;
  return (
    <div role="tree" className="overflow-y-auto flex-1 py-1 px-1">
      {tree.map((node) => <TreeNode key={node.id} node={node} depth={0} parentId={null} />)}
    </div>
  );
}
