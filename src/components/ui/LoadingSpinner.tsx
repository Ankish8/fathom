import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="w-full h-full border-3 border-black border-t-transparent animate-spin"></div>
    </div>
  )
}

interface LoadingStateProps {
  message?: string
  progress?: number
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Processing...',
  progress
}) => {
  return (
    <div className="flex flex-col items-center space-y-4">
      <LoadingSpinner size="lg" />
      <div className="text-xl font-bold">{message}</div>
      {typeof progress === 'number' && (
        <div className="w-64">
          <div className="w-full bg-gray-200 border-3 border-black h-6">
            <div 
              className="bg-blue-500 h-full transition-all duration-300 flex items-center justify-center"
              style={{ width: `${progress}%` }}
            >
              <span className="text-white font-bold text-sm">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}