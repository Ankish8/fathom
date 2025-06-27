import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'recording' | 'neon' | 'electric' | 'hero'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = `
    font-black uppercase tracking-wider transition-all duration-150 border-4 border-black
    disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
    transform-gpu will-change-transform
    active:translate-x-2 active:translate-y-2 active:shadow-none
  `

  const variantClasses = {
    primary: `
      bg-white text-black 
      shadow-[8px_8px_0px_0px_black] hover:shadow-[4px_4px_0px_0px_black]
      hover:translate-x-2 hover:translate-y-2
      border-4 border-black
    `,
    secondary: `
      bg-gray-200 text-black 
      shadow-[8px_8px_0px_0px_black] hover:shadow-[4px_4px_0px_0px_black]
      hover:translate-x-2 hover:translate-y-2
      border-4 border-black
    `,
    danger: `
      bg-red-400 text-black 
      shadow-[8px_8px_0px_0px_black] hover:shadow-[4px_4px_0px_0px_black]
      hover:translate-x-2 hover:translate-y-2
      border-4 border-black
    `,
    recording: `
      bg-red-500 text-black border-4 border-black
      shadow-[12px_12px_0px_0px_black]
      animate-pulse-record
    `,
    neon: `
      bg-neon-green text-black 
      shadow-[8px_8px_0px_0px_black] hover:shadow-[4px_4px_0px_0px_black]
      hover:translate-x-2 hover:translate-y-2
      border-4 border-black
    `,
    electric: `
      bg-blue-400 text-black 
      shadow-[8px_8px_0px_0px_black] hover:shadow-[4px_4px_0px_0px_black]
      hover:translate-x-2 hover:translate-y-2
      border-4 border-black
    `,
    hero: `
      bg-green-400 font-black
      shadow-[12px_12px_0px_0px_black] hover:shadow-[6px_6px_0px_0px_black]
      hover:translate-x-3 hover:translate-y-3
      border-5 border-black
      hover:bg-green-500
      relative z-10
    `
  }

  const sizeClasses = {
    sm: 'px-5 py-3 text-sm',
    md: 'px-8 py-4 text-base',
    lg: 'px-10 py-5 text-lg',
    xl: 'px-14 py-6 text-xl'
  }

  const buttonStyle = variant === 'hero' ? { 
    color: '#000000',
    WebkitTextFillColor: '#000000',
    textShadow: 'none'
  } : {}

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${variant === 'hero' ? 'force-black-text' : ''}
        ${className}
      `}
      style={buttonStyle}
      disabled={disabled}
      {...props}
    >
      <span 
        className={variant === 'hero' ? 'relative z-20' : ''} 
        style={buttonStyle}
      >
        {children}
      </span>
    </button>
  )
}