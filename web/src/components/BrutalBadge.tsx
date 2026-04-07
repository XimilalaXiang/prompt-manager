import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  color?: string
  className?: string
}

export default function BrutalBadge({ children, color = '#000', className = '' }: Props) {
  return (
    <span
      className={`
        inline-block rounded-none border-2 border-black px-2 py-0.5
        font-mono text-xs font-bold ${className}
      `}
      style={{ backgroundColor: color, color: isLight(color) ? '#000' : '#fff' }}
    >
      {children}
    </span>
  )
}

function isLight(hex: string): boolean {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}
