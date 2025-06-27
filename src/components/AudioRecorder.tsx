'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { MicrophoneIcon, PlayIcon, PauseIcon, StopIcon, RefreshIcon } from './ui/Icons'

interface AudioRecorderProps {
  onRecordingComplete?: (audioBlob: Blob, duration: number, language: 'en' | 'hinglish') => void
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hinglish'>('hinglish')
  
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })
      
      mediaRecorder.current = new MediaRecorder(stream)
      chunks.current = []
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.current.push(event.data)
        }
      }
      
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/wav' })
        setAudioBlob(blob)
        onRecordingComplete?.(blob, duration, selectedLanguage)
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.current.start()
      setIsRecording(true)
      setDuration(0)
      startTimer()
      
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Unable to access microphone. Please check permissions.')
    }
  }, [duration, onRecordingComplete, startTimer, selectedLanguage])

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      stopTimer()
    }
  }, [isRecording, stopTimer])

  const pauseRecording = useCallback(() => {
    if (mediaRecorder.current && isRecording) {
      if (isPaused) {
        mediaRecorder.current.resume()
        startTimer()
        setIsPaused(false)
      } else {
        mediaRecorder.current.pause()
        stopTimer()
        setIsPaused(true)
      }
    }
  }, [isRecording, isPaused, startTimer, stopTimer])

  const resetRecording = useCallback(() => {
    setIsRecording(false)
    setIsPaused(false)
    setDuration(0)
    setAudioBlob(null)
    stopTimer()
  }, [stopTimer])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Record Meeting Audio</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Language Selector */}
          {!isRecording && (
            <div className="flex justify-center">
              <div className="flex space-x-2 p-2 border-3 border-black bg-gray-50">
                <button
                  onClick={() => setSelectedLanguage('en')}
                  className={`px-4 py-2 border-2 border-black font-bold ${selectedLanguage === 'en' ? 'bg-electric-blue text-white' : 'bg-white text-black'}`}
                >
                  ENGLISH
                </button>
                <button
                  onClick={() => setSelectedLanguage('hinglish')}
                  className={`px-4 py-2 border-2 border-black font-bold ${selectedLanguage === 'hinglish' ? 'bg-neon-green text-black' : 'bg-white text-black'}`}
                >
                  HINGLISH
                </button>
              </div>
            </div>
          )}
          
          {/* Timer Display */}
          <div className="text-center">
            <div className={`text-6xl font-black ${isRecording && !isPaused ? 'text-red-500 recording-pulse' : 'text-black'}`}>
              {formatTime(duration)}
            </div>
            {isRecording && (
              <div className="flex items-center justify-center mt-2">
                <div className="w-4 h-4 bg-red-500 mr-2 recording-pulse border-2 border-black"></div>
                <span className="text-lg font-bold">
                  {isPaused ? 'PAUSED' : 'RECORDING'}
                </span>
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center space-x-4">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                variant="hero"
                size="xl"
                className="min-w-[200px] flex items-center gap-3"
              >
                <MicrophoneIcon size={24} className="text-black" />
                START RECORDING
              </Button>
            ) : (
              <>
                <Button
                  onClick={pauseRecording}
                  variant="secondary"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  {isPaused ? (
                    <>
                      <PlayIcon size={20} className="text-black" />
                      RESUME
                    </>
                  ) : (
                    <>
                      <PauseIcon size={20} className="text-black" />
                      PAUSE
                    </>
                  )}
                </Button>
                <Button
                  onClick={stopRecording}
                  variant="danger"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <StopIcon size={20} className="text-white" />
                  STOP
                </Button>
              </>
            )}
          </div>

          {/* Reset Button */}
          {(duration > 0 && !isRecording) && (
            <div className="flex justify-center">
              <Button
                onClick={resetRecording}
                variant="secondary"
                size="md"
                className="flex items-center gap-2"
              >
                <RefreshIcon size={18} className="text-black" />
                RESET
              </Button>
            </div>
          )}

          {/* Audio Playback */}
          {audioBlob && (
            <div className="border-3 border-black p-4 bg-gray-50">
              <h4 className="font-bold mb-2">Recording Complete:</h4>
              <audio 
                controls 
                src={URL.createObjectURL(audioBlob)}
                className="w-full"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}