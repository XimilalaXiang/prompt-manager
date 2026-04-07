import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  hover?: boolean
  accentColor?: string
  onClick?: () => void
}

export default function BrutalCard({
  children,
  className = '',
  hover = false,
  accentColor,
  onClick,
}: Props) {
  const hoverClass = hover
    ? 'hover:shadow-[4px_4px_0px_0px_rgba(255,0,110,1)] md:hover:shadow-[8px_8px_0px_0px_rgba(255,0,110,1)] hover:-translate-y-1 transition-all duration-200'
    : ''

  const shadowStyle = accentColor
    ? { boxShadow: `4px 4px 0px 0px ${accentColor}` }
    : undefined

  return (
    <div
      className={`
        rounded-none border-2 md:border-4 border-black bg-white p-4 md:p-6
        ${!accentColor ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]' : ''}
        ${hoverClass} ${className}
      `}
      style={shadowStyle}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
