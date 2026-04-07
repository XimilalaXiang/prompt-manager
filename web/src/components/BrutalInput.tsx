import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function BrutalInput({ label, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && <label className="font-black text-sm md:text-base">{label}</label>}
      <input
        className={`
          w-full rounded-none border-2 md:border-4 border-black font-mono
          px-3 py-2 md:px-4 md:py-3 text-sm md:text-base
          focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none
          placeholder:text-gray-400
          ${className}
        `}
        {...props}
      />
    </div>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function BrutalTextarea({ label, className = '', ...props }: TextareaProps) {
  return (
    <div className="space-y-1">
      {label && <label className="font-black text-sm md:text-base">{label}</label>}
      <textarea
        className={`
          w-full rounded-none border-2 md:border-4 border-black font-mono
          px-3 py-2 md:px-4 md:py-3 text-sm md:text-base resize-y
          focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none
          placeholder:text-gray-400
          ${className}
        `}
        {...props}
      />
    </div>
  )
}

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export function BrutalSelect({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && <label className="font-black text-sm md:text-base">{label}</label>}
      <div className="relative">
        <select
          className={`
            w-full rounded-none border-2 md:border-4 border-black font-mono
            px-3 py-2 md:px-4 md:py-3 text-sm md:text-base bg-white
            focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none
            appearance-none cursor-pointer pr-10
            ${className}
          `}
          {...(props as any)}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="black" strokeWidth="2" strokeLinecap="square"/></svg>
        </div>
      </div>
    </div>
  )
}
