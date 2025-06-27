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
  transcriptionMetadata?: {
    source: string
    confidence: number
    processingTime: number
  }
}

const MOCK_TRANSCRIPTS = [
  "Good morning everyone, thanks for joining today's standup. Let's start with updates from the development team. Sarah, how's the user authentication feature coming along?",
  "Welcome to our weekly planning meeting. Today we need to discuss the Q4 roadmap and prioritize our upcoming features. I'd like to start by reviewing what we accomplished last quarter.",
  "Hi team, this is our client check-in call. The client mentioned they're very happy with the progress so far and they have some additional requirements they'd like to discuss.",
  "Thanks for joining this brainstorming session. We need to come up with creative solutions for improving user engagement on our platform. Let's start by identifying the key pain points."
]

const MOCK_SUMMARIES = [
  "Daily standup meeting where team members shared progress updates and discussed blockers. Key focus on user authentication implementation and database optimization.",
  "Weekly planning session covering Q4 objectives and feature prioritization. Team aligned on upcoming sprint goals and resource allocation.",
  "Client meeting with positive feedback on current progress. Discussion of additional feature requests and timeline adjustments.",
  "Creative brainstorming session focused on user engagement improvements. Multiple solution approaches identified for further evaluation."
]

const MOCK_KEY_POINTS = [
  [
    "User authentication feature is 70% complete",
    "Database performance optimization needed",
    "New team member starting next week",
    "Sprint review scheduled for Friday"
  ],
  [
    "Q4 revenue target confirmed at $500K",
    "Mobile app development to begin in November",
    "Need to hire 2 additional developers",
    "Client onboarding process needs streamlining"
  ],
  [
    "Client satisfaction rate at 95%",
    "Request for additional reporting features",
    "Timeline extension approved for complex features",
    "Monthly review meetings to be established"
  ],
  [
    "Current user engagement rate is 40%",
    "Push notifications could increase retention",
    "Gamification elements show promise",
    "A/B testing framework needed"
  ]
]

const MOCK_ACTION_ITEMS = [
  [
    "Sarah to complete authentication by Friday",
    "Mike to investigate database performance issues",
    "HR to prepare onboarding for new team member",
    "Schedule sprint review meeting"
  ],
  [
    "Finalize Q4 budget by end of week",
    "Post job listings for developer positions",
    "Create mobile app technical specifications",
    "Document client onboarding improvements"
  ],
  [
    "Prepare reporting feature proposal",
    "Update project timeline documentation",
    "Set up monthly client review calendar",
    "Send meeting summary to stakeholders"
  ],
  [
    "Research push notification platforms",
    "Design gamification prototype",
    "Set up A/B testing infrastructure",
    "Create user engagement dashboard"
  ]
]

const MOCK_PARTICIPANTS = [
  ["Sarah Johnson", "Mike Chen", "Alex Rodriguez", "Emma Wilson"],
  ["David Kim", "Lisa Park", "Tom Anderson", "Rachel Green"],
  ["John Smith", "Maria Garcia", "Chris Taylor", "Jennifer Lee"],
  ["Mark Brown", "Anna Davis", "Kevin Liu", "Sophie Martin"]
]

export const generateMockNotes = async (
  audioBlob: Blob, 
  duration: number, 
  meetingTitle?: string
): Promise<MeetingNotes> => {
  // Simulate API processing time
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))
  
  const randomIndex = Math.floor(Math.random() * MOCK_TRANSCRIPTS.length)
  const now = new Date()
  
  return {
    id: crypto.randomUUID(),
    title: meetingTitle || `Meeting ${now.toLocaleDateString()}`,
    date: now.toISOString(),
    duration,
    transcript: MOCK_TRANSCRIPTS[randomIndex],
    summary: MOCK_SUMMARIES[randomIndex],
    keyPoints: MOCK_KEY_POINTS[randomIndex],
    actionItems: MOCK_ACTION_ITEMS[randomIndex],
    participants: MOCK_PARTICIPANTS[randomIndex],
    audioBlob
  }
}

export const saveMeetingToStorage = (meeting: MeetingNotes): void => {
  const meetings = getMeetingsFromStorage()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { audioBlob, ...meetingWithoutBlob } = meeting
  meetings.push(meetingWithoutBlob)
  localStorage.setItem('fathom-meetings', JSON.stringify(meetings))
}

export const getMeetingsFromStorage = (): Omit<MeetingNotes, 'audioBlob'>[] => {
  if (typeof window === 'undefined') return []
  
  const stored = localStorage.getItem('fathom-meetings')
  return stored ? JSON.parse(stored) : []
}

export const exportMeetingAsText = (meeting: MeetingNotes): string => {
  return `# ${meeting.title}
**Date:** ${new Date(meeting.date).toLocaleDateString()}
**Duration:** ${Math.floor(meeting.duration / 60)}:${(meeting.duration % 60).toString().padStart(2, '0')}

## Summary
${meeting.summary}

## Key Points
${meeting.keyPoints.map(point => `- ${point}`).join('\n')}

## Action Items
${meeting.actionItems.map(item => `- [ ] ${item}`).join('\n')}

## Participants
${meeting.participants.map(participant => `- ${participant}`).join('\n')}

## Transcript
${meeting.transcript}
`
}

export const downloadTextFile = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}