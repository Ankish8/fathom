export interface MeetingNotes {
  id: string
  title: string
  date: string
  duration: number
  transcript: string
  summary: string
  keyPoints: string[]
  actionItems: string[]
  participants: string[]
  audioBlob?: Blob
}

export type ViewState = 'dashboard' | 'recording' | 'processing' | 'notes'

export interface AudioRecorderState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioBlob: Blob | null
}