# FATHOM - AI Meeting Assistant

A neubrutalism-styled AI meeting assistant that records audio and generates meeting notes with mock AI processing.

## Features

- 🎤 **High-Quality Audio Recording** - Web Audio API with noise cancellation
- 🤖 **Mock AI Processing** - Simulated transcription and note generation
- 📋 **Smart Note Display** - Key points, action items, and summaries
- 💾 **Local Storage** - Meeting history persistence
- 📁 **Export Functionality** - Download notes as TXT or Markdown
- 🎨 **Neubrutalism Design** - Bold, geometric, high-contrast UI

## Tech Stack

- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Web Audio API** - Browser-based audio recording
- **localStorage** - Client-side data persistence

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   Visit [http://localhost:3000](http://localhost:3000)

## Usage

1. **Record Audio** - Click "START NEW RECORDING" to begin
2. **Control Recording** - Use pause/resume and stop controls
3. **AI Processing** - Watch mock AI generate meeting notes
4. **View Notes** - Review transcripts, summaries, and action items
5. **Export** - Download notes as text or markdown files

## Design Philosophy

**Neubrutalism Aesthetic:**
- Bold typography with Inter font
- High contrast (black/white with red accent)
- Sharp edges and geometric shapes
- Thick borders (3px) and distinct shadows
- Generous white space and clear hierarchy

## Project Structure

```
src/
├── app/                 # Next.js app router
├── components/          # React components
│   ├── ui/             # Design system components
│   ├── AudioRecorder.tsx
│   ├── Dashboard.tsx
│   └── NotesDisplay.tsx
├── utils/              # Utilities and mock AI
└── types/              # TypeScript definitions
```

## Key Components

- **Button** - Neubrutalism-styled buttons with hover effects
- **Card** - Content containers with bold borders and shadows
- **AudioRecorder** - Web Audio API integration with controls
- **Dashboard** - Main application interface
- **NotesDisplay** - Meeting notes presentation

## Mock AI Features

Currently uses mock AI responses for rapid prototyping:
- Realistic meeting transcripts
- Generated summaries and key points
- Action item extraction
- Participant identification

## Future Enhancements

- Real Whisper API integration
- Database persistence
- User authentication
- Chrome extension
- Multi-platform meeting support

## Development Notes

Built as a 2-3 hour MVP sprint focusing on:
- Visual-first development
- Neubrutalism design implementation
- Working audio recording
- Mock AI demonstration
- Export functionality

---

**Agent 1 (Alex Chen) - Project Architect & Coordinator**  
Multi-agent development with focus on rapid prototyping and neubrutalism aesthetics.
