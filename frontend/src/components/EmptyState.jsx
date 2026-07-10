const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="animate-fade-slide-up flex flex-col items-center rounded-md border border-dashed border-border bg-surface px-4 py-10 text-center sm:py-14">
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-status-todo-soft text-ink-muted">
      <Icon className="h-6 w-6" />
    </div>
    <p className="m-0 font-heading text-base text-ink">{title}</p>
    {description && (
      <p className="m-0 mt-1 max-w-xs text-sm text-ink-muted">{description}</p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
