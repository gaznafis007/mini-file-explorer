'use client';

import { useState, useEffect } from 'react';
import { ContextMenuState, NodeType } from '@/types/fileSystem';

const INITIAL: ContextMenuState = {
  visible: false, x: 0, y: 0, targetId: null, targetType: null, location: null,
};

export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>(INITIAL);

  function openMenu(e: React.MouseEvent, targetId: string, targetType: NodeType, location: 'sidebar' | 'panel') {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ visible: true, x: e.clientX, y: e.clientY, targetId, targetType, location });
  }

  function closeMenu() { setMenu(INITIAL); }

  useEffect(() => {
    if (!menu.visible) return;
    const handler = () => setMenu(INITIAL);
    window.addEventListener('click', handler);
    window.addEventListener('contextmenu', handler);
    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('contextmenu', handler);
    };
  }, [menu.visible]);

  return { menu, openMenu, closeMenu };
}
