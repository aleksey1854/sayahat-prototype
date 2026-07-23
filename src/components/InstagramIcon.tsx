// Иконка Instagram — одна на весь проект (шапка и подвал).
// Раньше она была нарисована прямо в Footer, из-за чего в шапке пришлось бы
// дублировать разметку и следить за двумя копиями сразу.
export function InstagramIcon({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
      style={size ? { width: size, height: size } : undefined}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" />
    </svg>
  );
}
