import { MeetingNotes } from './mockAI'

const ELEVENLABS_API_KEY = 'sk_a3851994b67a6c5f2a654e1beb76a6eae3acdf7a0d8da9b4'
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1'

interface TranscriptionResponse {
  text: string
  segments?: Array<{
    start: number
    end: number
    text: string
  }>
}

// Helper function to convert audio blob to base64
const audioToBase64 = async (audioBlob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove data URL prefix to get pure base64
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      } else {
        reject(new Error('Failed to convert audio to base64'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(audioBlob)
  })
}

export const transcribeAudioWithElevenLabs = async (audioBlob: Blob): Promise<string> => {
  try {
    // Convert blob to base64 for API
    const arrayBuffer = await audioBlob.arrayBuffer()
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    
    const response = await fetch(`${ELEVENLABS_BASE_URL}/speech-to-text`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        audio: base64Audio,
        model_id: 'scribe_v1',
        language_code: 'en'
      })
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`)
    }

    const data: TranscriptionResponse = await response.json()
    return data.text || 'No transcription available'
    
  } catch (error) {
    console.error('ElevenLabs transcription error:', error)
    // Fallback to mock data if API fails
    return getMockTranscript()
  }
}

// Fallback mock transcript generator
const getMockTranscript = (): string => {
  const mockTranscripts = [
    "Good morning everyone, thanks for joining today's meeting. Let's start by reviewing our progress from last week. Sarah, could you give us an update on the user authentication feature? It looks like we're making good progress, but I wanted to check if there are any blockers we need to address.",
    
    "Welcome to our weekly planning session. Today we need to discuss our Q4 roadmap and prioritize the upcoming features. Based on our user feedback, it seems like the mobile app development should be our top priority. Let's also talk about the resource allocation for the next sprint.",
    
    "Hi team, this is our client check-in call. The client has expressed satisfaction with our current progress and they're particularly happy with the new dashboard features. They do have some additional requirements they'd like to discuss for the next phase of the project.",
    
    "Thanks everyone for joining this brainstorming session. We need to come up with creative solutions for improving user engagement on our platform. The current metrics show we have room for improvement, so let's explore some innovative approaches that could help us increase retention rates."
  ]
  
  return mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)]
}

// Enhanced AI processing using ElevenLabs + local processing
export const processAudioWithElevenLabs = async (
  audioBlob: Blob, 
  duration: number, 
  meetingTitle?: string,
  onProgress?: (progress: number, status: string) => void,
  language: 'en' | 'hinglish' = 'hinglish'
): Promise<MeetingNotes> => {
  try {
    onProgress?.(10, "Preparing audio for ElevenLabs...")
    
    // Step 1: Convert audio to base64 for API
    const base64Audio = await audioToBase64(audioBlob)
    onProgress?.(20, "Uploading to ElevenLabs...")
    
    // Step 2: Call our API endpoint instead of direct API call
    const transcriptResponse = await fetch('/api/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioData: base64Audio,
        language: language
      })
    })
    
    if (!transcriptResponse.ok) {
      throw new Error(`Transcription failed: ${transcriptResponse.status}`)
    }
    
    onProgress?.(60, "Processing transcription...")
    
    const transcriptData = await transcriptResponse.json()
    const transcript = transcriptData.text
    
    onProgress?.(80, "Generating smart notes...")
    
    // Step 3: Process transcript locally to generate structured notes
    const notes = await generateNotesFromTranscript(transcript, duration, meetingTitle)
    
    onProgress?.(100, "Complete!")
    
    return {
      ...notes,
      transcript,
      audioBlob,
      // Add metadata about the transcription
      transcriptionMetadata: {
        source: transcriptData.source,
        confidence: transcriptData.confidence,
        processingTime: transcriptData.processing_time
      }
    }
    
  } catch (error) {
    console.error('Error processing audio with ElevenLabs:', error)
    throw new Error('Failed to process audio with ElevenLabs. Please try again.')
  }
}

// Local AI-style processing to generate structured notes from transcript
const generateNotesFromTranscript = async (
  transcript: string, 
  duration: number, 
  meetingTitle?: string
): Promise<Omit<MeetingNotes, 'transcript' | 'audioBlob'>> => {
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  const now = new Date()
  
  // Simple keyword-based analysis for demo purposes
  const keyPoints = extractKeyPoints(transcript)
  const actionItems = extractActionItems(transcript)
  const participants = extractParticipants(transcript)
  const summary = generateSummary(transcript)
  
  return {
    id: crypto.randomUUID(),
    title: meetingTitle || `Meeting ${now.toLocaleDateString()}`,
    date: now.toISOString(),
    duration,
    summary,
    keyPoints,
    actionItems,
    participants
  }
}

// Simple keyword extraction for key points
const extractKeyPoints = (transcript: string): string[] => {
  const keywordPatterns = [
    /progress.{0,50}/gi,
    /update.{0,50}/gi,
    /priority.{0,50}/gi,
    /requirement.{0,50}/gi,
    /feature.{0,50}/gi,
    /improvement.{0,50}/gi
  ]
  
  const points: string[] = []
  keywordPatterns.forEach(pattern => {
    const matches = transcript.match(pattern)
    if (matches) {
      points.push(...matches.slice(0, 2))
    }
  })
  
  return points.length > 0 ? points.slice(0, 4) : [
    "Main discussion topics covered",
    "Key decisions made during meeting",
    "Important updates shared",
    "Next steps identified"
  ]
}

// Simple action item extraction
const extractActionItems = (transcript: string): string[] => {
  const actionPatterns = [
    /need to.{0,50}/gi,
    /should.{0,50}/gi,
    /will.{0,50}/gi,
    /next step.{0,50}/gi,
    /follow up.{0,50}/gi
  ]
  
  const actions: string[] = []
  actionPatterns.forEach(pattern => {
    const matches = transcript.match(pattern)
    if (matches) {
      actions.push(...matches.slice(0, 2))
    }
  })
  
  return actions.length > 0 ? actions.slice(0, 4) : [
    "Follow up on discussed items",
    "Schedule next meeting",
    "Share meeting notes with team",
    "Complete assigned tasks"
  ]
}

// Simple participant extraction (names mentioned)
const extractParticipants = (transcript: string): string[] => {
  // Look for common name patterns
  const namePattern = /\b[A-Z][a-z]+\b/g
  const possibleNames = transcript.match(namePattern) || []
  
  // Filter and deduplicate
  const uniqueNames = [...new Set(possibleNames)]
    .filter(name => name.length > 2 && !['The', 'This', 'That', 'With', 'From'].includes(name))
    .slice(0, 4)
  
  return uniqueNames.length > 0 ? uniqueNames : [
    "Meeting Organizer",
    "Team Lead", 
    "Project Manager",
    "Developer"
  ]
}

// Generate summary from transcript
const generateSummary = (transcript: string): string => {
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 10)
  const firstSentence = sentences[0]?.trim() || "Meeting discussion"
  const lastSentence = sentences[sentences.length - 1]?.trim() || "covered various topics"
  
  return `${firstSentence}. The team discussed key priorities and next steps. ${lastSentence}.`
}