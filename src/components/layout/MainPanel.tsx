'use client';

import { useFileSystem } from '@/hooks/useFileSystem';
import { FolderContents } from '@/components/panel/FolderContents';
import { TextEditor } from '@/components/panel/TextEditor';

export function MainPanel() {
  const { openFileId } = useFileSystem();
  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-neutral-950">
      {openFileId ? <TextEditor /> : <FolderContents />}
    </main>
  );
}
