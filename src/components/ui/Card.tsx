import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = false,
  onClick
}) => {
  const clickableStyles = hover ? `
    border-4 border-black shadow-[8px_8px_0px_0px_black] 
    hover:shadow-[4px_4px_0px_0px_black] hover:translate-x-2 hover:translate-y-2 
    cursor-pointer transition-all duration-150
    bg-gradient-to-br from-white to-gray-50
    relative
    before:absolute before:top-0 before:left-0 before:w-full before:h-1 
    before:bg-gradient-to-r before:from-neon-green before:to-electric-blue
  ` : `
    border-2 border-black shadow-[4px_4px_0px_0px_black]
    bg-white
  `

  return (
    <div
      className={`
        p-6 transition-all duration-150
        ${clickableStyles}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export const CardHeader: React.FC<CardHeaderProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: React.ReactNode
  className?: string
}

export const CardTitle: React.FC<CardTitleProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <h3 className={`text-2xl font-bold mb-2 ${className}`}>
      {children}
    </h3>
  )
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export const CardContent: React.FC<CardContentProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={className}>
      {children}
    </div>
  )
}