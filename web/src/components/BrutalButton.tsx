import { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary: 'bg-brutal-pink text-white',
  secondary: 'bg-black text-white',
  danger: 'bg-red-600 text-white',
  ghost: 'bg-white text-black',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm',
  md: 'px-4 py-2 text-sm md:px-6 md:py-3 md:text-base',
  lg: 'px-6 py-3 text-base md:px-8 md:py-4 md:text-lg',
}

export default function BrutalButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}: Props) {
  return (
    <button
      className={`
        rounded-none border-2 md:border-4 border-black font-black
        shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
        hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]
        active:translate-x-[4px] active:translate-y-[4px]
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
        disabled:hover:translate-x-0 disabled:hover:translate-y-0
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
