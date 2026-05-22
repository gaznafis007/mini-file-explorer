interface EmptyStateProps { title: string; description: string; icon?: string; }

export function EmptyState({ title, description, icon = '📂' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
      <span className="text-5xl opacity-30">{icon}</span>
      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
      <p className="text-xs text-neutral-400 dark:text-neutral-500 max-w-48">{description}</p>
    </div>
  );
}
