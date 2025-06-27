import React from 'react'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b-5 border-black bg-white relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-neon-green via-electric-blue to-hot-pink"></div>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-black">
            <span className="text-black">FATHOM</span>
            <span className="text-neon-green">.</span>
          </h1>
          <p className="text-lg font-medium mt-1">
            AI Meeting Assistant
          </p>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}

interface ContainerProps {
  children: React.ReactNode
  className?: string
}

export const Container: React.FC<ContainerProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {children}
    </div>
  )
}

interface SectionProps {
  children: React.ReactNode
  title?: string
  className?: string
}

export const Section: React.FC<SectionProps> = ({ 
  children, 
  title, 
  className = '' 
}) => {
  return (
    <section className={`mb-12 ${className}`}>
      {title && (
        <h2 className="text-3xl font-black mb-6 border-b-3 border-black pb-2">
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}