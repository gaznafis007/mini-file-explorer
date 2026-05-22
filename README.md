# Mini File Explorer

| Feature | File | Why |
|---|---|---|
| **React Compiler** | `next.config.ts` | Eliminates manual `useCallback`/`useMemo` — compiler auto-memoizes |
| **Turbopack (default)** | dev server | ~87% faster startup, zero config |
| **React 19.2 `useEffectEvent`** | `TextEditor.tsx` | Solves stale closure in keyboard handler without useCallback |
| **`next.config.ts`** | config | Type-safe configuration |
| **App Router** | `app/page.tsx` | Server/client boundary, layout system |
| **`'use client'` directive** | All interactive components | Correct RSC boundary — Server Components can't use hooks |
| **Tailwind v4** | `globals.css` | `@import "tailwindcss"` (not the old three `@tailwind` directives) |
