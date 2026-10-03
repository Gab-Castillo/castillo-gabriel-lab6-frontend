// StokPile mark: three stacked crates, the top one in Signal Orange.
export function Mark({ className = 'size-8' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="2" y="18" width="12" height="11" rx="2" fill="currentColor" />
      <rect x="16" y="18" width="14" height="11" rx="2" fill="currentColor" />
      <rect x="8" y="5" width="14" height="11" rx="2" fill="var(--accent)" />
    </svg>
  )
}

export function Wordmark({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Mark />
      <span className="font-heading text-xl">StokPile</span>
    </span>
  )
}

// Original illustration for the sign-in panel: a pallet pile with one crate flagged low.
export function Pile({ className = '' }) {
  const crate = (x, y, w, h, key, fill = 'var(--panel-2)') => (
    <g key={key}>
      <rect x={x} y={y} width={w} height={h} rx="6" fill={fill} stroke="#3b4a5c" strokeWidth="2" />
      <rect x={x + w / 2 - 5} y={y} width="10" height={h} fill="#000" opacity=".18" />
    </g>
  )
  return (
    <svg viewBox="0 0 360 300" className={className} role="img" aria-label="A pile of crates on a pallet, one tagged low stock">
      <ellipse cx="180" cy="274" rx="150" ry="10" fill="#000" opacity=".25" />
      {crate(40, 176, 86, 62, 'a')}
      {crate(137, 176, 86, 62, 'b')}
      {crate(234, 176, 86, 62, 'c')}
      {crate(88, 108, 86, 62, 'd')}
      {crate(185, 108, 86, 62, 'e', 'var(--accent)')}
      <g transform="rotate(-6 150 70)">{crate(105, 44, 90, 58, 'f')}</g>
      <rect x="28" y="244" width="304" height="12" rx="3" fill="#8a6a4a" />
      <rect x="40" y="256" width="40" height="14" rx="2" fill="#6f533a" />
      <rect x="160" y="256" width="40" height="14" rx="2" fill="#6f533a" />
      <rect x="280" y="256" width="40" height="14" rx="2" fill="#6f533a" />
      <g transform="translate(236 62)">
        <rect width="104" height="34" rx="6" fill="#f1f5f9" />
        <circle cx="16" cy="17" r="5" fill="var(--accent)" />
        <text x="28" y="22" fontSize="14" fontWeight="600" fill="#1a2229" fontFamily="IBM Plex Sans, sans-serif">4 left</text>
      </g>
      <path d="M262 96 L262 112" stroke="#f1f5f9" strokeWidth="2" />
    </svg>
  )
}
