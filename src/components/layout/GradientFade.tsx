// GradientFade — gradient above bottom nav on scrollable pages
// Prevents a hard edge between content and the glass nav bar

export function GradientFade() {
  return (
    <div
      className="fixed left-0 right-0 h-12 pointer-events-none z-[899]"
      style={{
        bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))',
        background: 'linear-gradient(to top, var(--bg), transparent)',
      }}
    />
  )
}
