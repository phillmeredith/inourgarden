// PageHeader — sticky glass header with title, optional centre/below/rightAction slots
// Glass treatment: rgba(13,13,17,.88) + backdrop-filter blur(24px) + border bottom

interface PageHeaderProps {
  title: string
  centre?: React.ReactNode
  below?: React.ReactNode
  rightAction?: React.ReactNode
  className?: string
}

export function PageHeader({ title, centre, below, rightAction, className = '' }: PageHeaderProps) {
  return (
    <div
      className={`sticky top-0 z-[100] shrink-0 px-6 ${className}`}
      style={{
        paddingTop: 'calc(24px + env(safe-area-inset-top, 0px))',
        background: 'rgba(13,13,17,.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,.06)',
      }}
    >
      <div
        className="grid items-center gap-2 pt-3 pb-4"
        style={{ gridTemplateColumns: 'auto minmax(0, 1fr) auto' }}
      >
        <h1 className="text-2xl font-bold text-[var(--t1)] leading-tight tracking-tight whitespace-nowrap">
          {title}
        </h1>
        <div className="flex justify-center min-w-0">{centre}</div>
        <div className="flex justify-end">{rightAction}</div>
      </div>
      {below && (
        <div className="flex flex-col gap-3 pb-4">
          {below}
        </div>
      )}
    </div>
  )
}
