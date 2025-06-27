'use client'

import React from 'react'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { BackIcon, DownloadIcon, DocumentIcon, CalendarIcon, ClockIcon, UsersIcon } from './ui/Icons'
import { MeetingNotes, exportMeetingAsText, downloadTextFile } from '../utils/mockAI'

interface NotesDisplayProps {
  meeting: MeetingNotes
  onBack?: () => void
}

export const NotesDisplay: React.FC<NotesDisplayProps> = ({
  meeting,
  onBack
}) => {
  const handleExportText = () => {
    const content = exportMeetingAsText(meeting)
    const filename = `${meeting.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.txt`
    downloadTextFile(content, filename)
  }

  const handleExportMarkdown = () => {
    const content = exportMeetingAsText(meeting)
    const filename = `${meeting.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.md`
    downloadTextFile(content, filename)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {onBack && (
          <Button onClick={onBack} variant="secondary" size="md" className="flex items-center gap-2">
            <BackIcon size={18} className="text-black" />
            BACK
          </Button>
        )}
        <div className="flex space-x-4">
          <Button onClick={handleExportText} variant="electric" size="md" className="flex items-center gap-2">
            <DocumentIcon size={18} className="text-white" />
            EXPORT TXT
          </Button>
          <Button onClick={handleExportMarkdown} variant="neon" size="md" className="flex items-center gap-2">
            <DownloadIcon size={18} className="text-black" />
            EXPORT MD
          </Button>
        </div>
      </div>

      {/* Meeting Info */}
      <Card>
        <CardHeader>
          <CardTitle>{meeting.title}</CardTitle>
          <div className="flex space-x-6 text-lg font-medium flex-wrap">
            <span className="flex items-center gap-2">
              <CalendarIcon size={20} className="text-black" />
              {new Date(meeting.date).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-2">
              <ClockIcon size={20} className="text-electric-blue" />
              {formatDuration(meeting.duration)}
            </span>
            <span className="flex items-center gap-2">
              <UsersIcon size={20} className="text-neon-green" />
              {meeting.participants.length} participants
            </span>
            {meeting.transcriptionMetadata && (
              <span className="flex items-center gap-2 text-sm bg-gray-100 px-2 py-1 border-2 border-black">
                <div className="w-2 h-2 bg-electric-blue rounded-full"></div>
                {meeting.transcriptionMetadata.source === 'elevenlabs' ? 'ElevenLabs AI' : 'Mock'} 
                ({Math.round(meeting.transcriptionMetadata.confidence * 100)}%)
              </span>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed">{meeting.summary}</p>
        </CardContent>
      </Card>

      {/* Key Points */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Key Points</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {meeting.keyPoints.map((point, index) => {
              const colors = ['bg-neon-green', 'bg-electric-blue', 'bg-hot-pink', 'bg-black']
              const textColors = ['text-black', 'text-white', 'text-white', 'text-white']
              const colorIndex = index % colors.length
              return (
                <li key={index} className="flex items-start">
                  <span className={`inline-block w-6 h-6 ${colors[colorIndex]} ${textColors[colorIndex]} text-center font-bold text-sm mr-3 mt-1`}>
                    {index + 1}
                  </span>
                  <span className="text-lg">{point}</span>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle>✅ Action Items</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {meeting.actionItems.map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-block w-6 h-6 border-3 border-black mr-3 mt-1"></span>
                <span className="text-lg">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Participants */}
      <Card>
        <CardHeader>
          <CardTitle>👥 Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {meeting.participants.map((participant, index) => (
              <div key={index} className="border-3 border-black p-3 bg-gray-50">
                <span className="font-bold text-lg">{participant}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transcript */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-3 border-black p-4 bg-gray-50">
            <p className="text-lg leading-relaxed font-mono whitespace-pre-wrap">
              {meeting.transcript}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Audio Playback */}
      {meeting.audioBlob && (
        <Card>
          <CardHeader>
            <CardTitle>🎵 Original Recording</CardTitle>
          </CardHeader>
          <CardContent>
            <audio 
              controls 
              src={URL.createObjectURL(meeting.audioBlob)}
              className="w-full"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}