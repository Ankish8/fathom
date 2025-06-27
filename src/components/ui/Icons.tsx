import React from 'react'

interface IconProps {
  size?: number
  className?: string
}

export const MicrophoneIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="9" y="3" width="6" height="10" rx="3" fill="currentColor" stroke="black" strokeWidth="2"/>
    <path d="M5 11a7 7 0 0 0 14 0" stroke="black" strokeWidth="2" fill="none"/>
    <line x1="12" y1="18" x2="12" y2="21" stroke="black" strokeWidth="2"/>
    <line x1="8" y1="21" x2="16" y2="21" stroke="black" strokeWidth="2"/>
  </svg>
)

export const PlayIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <polygon points="8,6 8,18 18,12" fill="currentColor" stroke="black" strokeWidth="2"/>
  </svg>
)

export const PauseIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="black" strokeWidth="2"/>
    <rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="black" strokeWidth="2"/>
  </svg>
)

export const StopIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="5" y="5" width="14" height="14" fill="currentColor" stroke="black" strokeWidth="2"/>
  </svg>
)

export const DownloadIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 3v12" stroke="black" strokeWidth="2"/>
    <path d="m8 11 4 4 4-4" stroke="black" strokeWidth="2" fill="none"/>
    <path d="M3 17v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" stroke="black" strokeWidth="2" fill="none"/>
  </svg>
)

export const DocumentIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4" y="2" width="12" height="20" rx="2" fill="currentColor" stroke="black" strokeWidth="2"/>
    <line x1="8" y1="8" x2="12" y2="8" stroke="black" strokeWidth="2"/>
    <line x1="8" y1="12" x2="12" y2="12" stroke="black" strokeWidth="2"/>
    <line x1="8" y1="16" x2="10" y2="16" stroke="black" strokeWidth="2"/>
  </svg>
)

export const SettingsIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="3" fill="currentColor" stroke="black" strokeWidth="2"/>
    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="black" strokeWidth="2"/>
  </svg>
)

export const CalendarIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" fill="currentColor" stroke="black" strokeWidth="2"/>
    <line x1="16" y1="2" x2="16" y2="6" stroke="black" strokeWidth="2"/>
    <line x1="8" y1="2" x2="8" y2="6" stroke="black" strokeWidth="2"/>
    <line x1="3" y1="10" x2="21" y2="10" stroke="black" strokeWidth="2"/>
  </svg>
)

export const ClockIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="currentColor" stroke="black" strokeWidth="2"/>
    <polyline points="12,6 12,12 16,14" stroke="black" strokeWidth="2" fill="none"/>
  </svg>
)

export const UsersIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="9" cy="7" r="4" fill="currentColor" stroke="black" strokeWidth="2"/>
    <path d="M1 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" stroke="black" strokeWidth="2" fill="none"/>
    <circle cx="19" cy="7" r="2" fill="currentColor" stroke="black" strokeWidth="2"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="black" strokeWidth="2" fill="none"/>
  </svg>
)

export const BackIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="m12 19-7-7 7-7" stroke="black" strokeWidth="2" fill="none"/>
    <path d="M19 12H5" stroke="black" strokeWidth="2"/>
  </svg>
)

export const RefreshIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="black" strokeWidth="2" fill="none"/>
    <path d="M21 3v5h-5" stroke="black" strokeWidth="2" fill="none"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="black" strokeWidth="2" fill="none"/>
    <path d="M8 16H3v5" stroke="black" strokeWidth="2" fill="none"/>
  </svg>
)