'use client'

import React, { useState, useEffect } from 'react'
import { AudioRecorder } from './AudioRecorder'
import { NotesDisplay } from './NotesDisplay'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Section } from './ui/Layout'
import { MicrophoneIcon, CalendarIcon, ClockIcon, UsersIcon, BackIcon, DocumentIcon } from './ui/Icons'
import { 
  MeetingNotes, 
  saveMeetingToStorage, 
  getMeetingsFromStorage 
} from '../utils/mockAI'
import { processAudioWithElevenLabs } from '../utils/elevenlabs'

type ViewState = 'dashboard' | 'recording' | 'processing' | 'notes'

export const Dashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard')
  const [currentMeeting, setCurrentMeeting] = useState<MeetingNotes | null>(null)
  const [recentMeetings, setRecentMeetings] = useState<Omit<MeetingNotes, 'audioBlob'>[]>([])
  const [processingProgress, setProcessingProgress] = useState(0)
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'hinglish'>('hinglish')

  useEffect(() => {
    setRecentMeetings(getMeetingsFromStorage())
  }, [])

  const handleRecordingComplete = async (audioBlob: Blob, duration: number, language: 'en' | 'hinglish') => {
    const integrationStartTime = performance.now()
    console.log('🔧 Agent 6: Starting end-to-end integration pipeline')
    
    setCurrentView('processing')
    setProcessingProgress(0)
    setCurrentLanguage(language)
    
    // Progress callback for real-time updates
    const onProgress = (progress: number, status: string) => {
      setProcessingProgress(progress)
      console.log(`Processing: ${progress}% - ${status}`)
    }

    try {
      const meetingNotes = await processAudioWithElevenLabs(
        audioBlob, 
        duration, 
        undefined, // meetingTitle 
        onProgress,
        language
      )
      
      // Enhanced API endpoint integration with better error handling
      try {
        const apiResponse = await fetch('/api/meetings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...meetingNotes,
            language: language,
            processingTime: Date.now(),
            userAgent: navigator.userAgent
          })
        })
        
        if (apiResponse.ok) {
          const { meeting: savedMeeting, integration } = await apiResponse.json()
          console.log('🔧 Agent 6: API Integration successful:', {
            id: savedMeeting.id,
            language: integration.language,
            status: integration.status
          })
          
          // Update meeting with integration metadata
          setCurrentMeeting(savedMeeting)
        } else {
          const errorData = await apiResponse.text()
          throw new Error(`API Error: ${apiResponse.status} - ${errorData}`)
        }
      } catch (apiError) {
        console.warn('API save failed, using localStorage fallback:', apiError)
        // Enhanced fallback logging
        console.log('Fallback data:', {
          meetingId: meetingNotes.id,
          language: language,
          duration: duration,
          timestamp: new Date().toISOString()
        })
      }
      
      // Always save locally as backup
      setCurrentMeeting(meetingNotes)
      saveMeetingToStorage(meetingNotes)
      setRecentMeetings(getMeetingsFromStorage())
      
      // Agent 6: Enhanced completion with integration status
      const integrationEndTime = performance.now()
      const totalIntegrationTime = integrationEndTime - integrationStartTime
      
      setTimeout(() => {
        console.log('🔧 Agent 6: Integration pipeline complete:', {
          totalTime: `${totalIntegrationTime.toFixed(2)}ms`,
          language: language,
          audioSize: `${(audioBlob.size / 1024).toFixed(2)}KB`,
          duration: `${duration}s`,
          status: 'success'
        })
        setCurrentView('notes')
      }, 800) // Slightly longer for better UX
      
    } catch (error) {
      console.error('Error processing audio:', error)
      alert('Error processing audio with ElevenLabs. Please try again.')
      setCurrentView('dashboard')
    }
  }

  const handleViewMeeting = (meeting: Omit<MeetingNotes, 'audioBlob'>) => {
    setCurrentMeeting(meeting as MeetingNotes)
    setCurrentView('notes')
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (currentView === 'recording') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Button 
            onClick={() => setCurrentView('dashboard')} 
            variant="secondary" 
            size="md"
            className="flex items-center gap-2"
          >
            <BackIcon size={18} className="text-black" />
            BACK TO DASHBOARD
          </Button>
        </div>
        <AudioRecorder onRecordingComplete={handleRecordingComplete} />
      </div>
    )
  }

  if (currentView === 'processing') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🤖 Processing Audio...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-black mb-4">
                  {Math.round(processingProgress)}%
                </div>
                <div className="w-full bg-gray-200 border-3 border-black h-8">
                  <div 
                    className="bg-gradient-to-r from-neon-green to-electric-blue h-full transition-all duration-300"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
              </div>
              <div className="text-center text-lg font-medium">
                {processingProgress < 30 && "Preparing audio for ElevenLabs..."}
                {processingProgress >= 30 && processingProgress < 60 && "Transcribing with ElevenLabs AI..."}
                {processingProgress >= 60 && processingProgress < 90 && "Generating smart meeting notes..."}
                {processingProgress >= 90 && "Finalizing AI analysis..."}
              </div>
              <div className="text-center text-sm font-bold text-electric-blue">
                Processing in {currentLanguage.toUpperCase()} mode
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentView === 'notes' && currentMeeting) {
    return (
      <NotesDisplay 
        meeting={currentMeeting} 
        onBack={() => setCurrentView('dashboard')}
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <Section>
        <div className="text-center space-y-6 relative">
          {/* Decorative Color Blocks */}
          <div className="absolute -top-4 -left-4 w-8 h-8 color-block-2 border-3 border-black transform rotate-45"></div>
          <div className="absolute -top-4 -right-4 w-8 h-8 color-block-3 border-3 border-black"></div>
          <div className="absolute -bottom-4 left-1/4 w-6 h-6 color-block-1 border-3 border-black transform rotate-12"></div>
          <div className="absolute -bottom-4 right-1/4 w-6 h-6 color-block-4 border-3 border-black transform -rotate-12"></div>
          
          <h1 className="text-6xl font-black relative z-10">
            RECORD. <span className="gradient-text">TRANSCRIBE</span>. ANALYZE.
          </h1>
          <p className="text-2xl font-medium max-w-3xl mx-auto">
            Transform your meetings into actionable insights with 
            <span className="font-bold text-electric-blue"> ElevenLabs AI </span>
            transcription and note generation.
          </p>
          <Button 
            onClick={() => setCurrentView('recording')} 
            variant="hero" 
            size="xl"
            className="min-w-[300px] flex items-center gap-3"
          >
            <MicrophoneIcon size={28} className="text-black" />
            START NEW RECORDING
          </Button>
        </div>
      </Section>

      {/* Recent Meetings */}
      {recentMeetings.length > 0 && (
        <Section title="Recent Meetings">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentMeetings.slice(0, 6).map((meeting) => (
              <Card 
                key={meeting.id} 
                hover 
                onClick={() => handleViewMeeting(meeting)}
                className="relative"
              >
                {/* Clickable Indicator */}
                <div className="absolute top-2 right-2 w-4 h-4 bg-electric-blue border-2 border-black rounded-full flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">{meeting.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <CalendarIcon size={16} className="text-black" />
                      {new Date(meeting.date).toLocaleDateString()}
                    </div>
                    <div className="text-sm font-medium flex items-center gap-2">
                      <ClockIcon size={16} className="text-electric-blue" />
                      {formatDuration(meeting.duration)}
                    </div>
                    <div className="text-sm font-medium flex items-center gap-2">
                      <UsersIcon size={16} className="text-neon-green" />
                      {meeting.participants.length} participants
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {meeting.summary}
                    </p>
                    <div className="mt-3 text-xs font-bold text-electric-blue uppercase tracking-wider">
                      → Click to view notes
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* Features */}
      <Section title="Features">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="relative">
            <div className="absolute -top-2 -right-2 w-6 h-6 color-block-2 border-2 border-black transform rotate-45"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <MicrophoneIcon size={24} className="text-neon-green" />
                High-Quality Recording
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                Record crystal-clear audio with noise cancellation and 
                echo reduction for optimal transcription results.
              </p>
            </CardContent>
          </Card>

          <Card className="relative">
            <div className="absolute -top-2 -right-2 w-6 h-6 color-block-3 border-2 border-black"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-6 h-6 bg-electric-blue border-2 border-black rounded-sm flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                ElevenLabs AI Transcription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                Advanced <span className="font-bold text-electric-blue">ElevenLabs</span> speech-to-text 
                technology that understands context and generates accurate meeting transcripts.
              </p>
            </CardContent>
          </Card>

          <Card className="relative">
            <div className="absolute -top-2 -right-2 w-6 h-6 color-block-1 border-2 border-black transform -rotate-12"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <DocumentIcon size={24} className="text-hot-pink" />
                Smart Note Generation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                Automatically extract key points, action items, and 
                meeting summaries from your recordings.
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>
    </div>
  )
}