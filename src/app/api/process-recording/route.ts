// Process Recording API - Complete Chrome Extension to AI Pipeline
// Agent 3: Backend API Engineer

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { deepseekAI } from '@/lib/deepseek';

interface ProcessRecordingRequest {
  meetingData: {
    title: string;
    participants: Array<{
      name: string;
      email?: string;
      role: string;
    }>;
    meetingUrl: string;
    startTime: string;
  };
  audioData: string; // base64 encoded
  duration: number;
  startTime: string;
  endTime: string;
}

// POST /api/process-recording - Complete meeting processing pipeline
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🔄 Starting complete meeting processing pipeline...');
    
    const requestData: ProcessRecordingRequest = await request.json();
    const { meetingData, audioData, duration, startTime: meetingStart, endTime } = requestData;

    if (!audioData || !meetingData) {
      return NextResponse.json(
        { error: 'Missing required data: audioData and meetingData' },
        { status: 400 }
      );
    }

    // Step 1: Create meeting record
    console.log('📝 Creating meeting record...');
    const meeting = await db.createMeeting({
      title: meetingData.title,
      description: `Meeting processed from Chrome extension`,
      start_time: new Date(meetingStart),
      end_time: new Date(endTime),
      duration_seconds: duration,
      meeting_url: meetingData.meetingUrl,
      meeting_platform: 'google_meet',
      status: 'active'
    });

    // Step 2: Add participants
    console.log('👥 Adding participants...');
    if (meetingData.participants.length > 0) {
      await db.addParticipants(meeting.id, meetingData.participants.map(p => ({
        name: p.name,
        email: p.email,
        role: p.role as 'organizer' | 'presenter' | 'attendee',
        join_time: new Date(meetingStart),
        leave_time: new Date(endTime),
        duration_seconds: duration
      })));
    }

    // Step 3: Save audio recording
    console.log('🎵 Processing audio recording...');
    const recording = await db.createRecording({
      meeting_id: meeting.id,
      file_path: `recordings/${meeting.id}.webm`,
      file_size_bytes: Math.round(audioData.length * 0.75), // Approximate base64 to bytes
      duration_seconds: duration,
      format: 'webm',
      quality_score: 0.8
    });

    // Step 4: Transcribe with ElevenLabs
    console.log('🎯 Transcribing audio with ElevenLabs...');
    const transcriptionResponse = await fetch(`${request.nextUrl.origin}/api/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioData: audioData,
        language: 'hinglish'
      })
    });

    if (!transcriptionResponse.ok) {
      throw new Error(`Transcription failed: ${transcriptionResponse.status}`);
    }

    const transcriptionData = await transcriptionResponse.json();
    
    // Step 5: Save transcript
    const transcript = await db.createTranscript({
      meeting_id: meeting.id,
      recording_id: recording.id,
      content: transcriptionData.text,
      language: 'hinglish',
      confidence_score: transcriptionData.confidence,
      processing_time_ms: transcriptionData.processing_time,
      api_provider: transcriptionData.source
    });

    // Step 6: Generate summary with DeepSeek
    console.log('🤖 Generating AI summary with DeepSeek...');
    const participantNames = meetingData.participants.map(p => p.name);
    const aiSummary = await deepseekAI.generateMeetingSummary(
      transcript.content,
      meeting.title,
      participantNames
    );

    // Step 7: Save summary
    const summary = await db.createSummary({
      meeting_id: meeting.id,
      transcript_id: transcript.id,
      summary_text: aiSummary.summary,
      key_points: aiSummary.keyPoints,
      action_items: aiSummary.actionItems,
      decisions: aiSummary.decisions,
      next_steps: aiSummary.nextSteps,
      ai_provider: 'deepseek',
      processing_time_ms: Date.now() - startTime
    });

    // Step 8: Send email notifications (optional)
    try {
      console.log('📧 Sending email notifications...');
      await sendEmailNotifications(meeting, summary, meetingData.participants);
    } catch (emailError) {
      console.warn('📧 Email notification failed:', emailError);
      // Don't fail the whole process for email errors
    }

    const totalProcessingTime = Date.now() - startTime;
    
    console.log('✅ Meeting processing completed:', {
      meetingId: meeting.id,
      processingTime: totalProcessingTime,
      participantCount: meetingData.participants.length,
      transcriptLength: transcript.content.length
    });

    return NextResponse.json({
      success: true,
      meetingId: meeting.id,
      processingTime: totalProcessingTime,
      summary: {
        title: meeting.title,
        summary: summary.summary_text,
        keyPoints: summary.key_points,
        actionItems: summary.action_items,
        decisions: summary.decisions,
        nextSteps: summary.next_steps
      },
      transcript: {
        content: transcript.content,
        confidence: transcript.confidence_score,
        language: transcript.language
      },
      participants: meetingData.participants,
      urls: {
        dashboard: `${request.nextUrl.origin}/meeting/${meeting.id}`,
        transcript: `${request.nextUrl.origin}/transcript/${meeting.id}`
      }
    });

  } catch (error) {
    console.error('❌ Meeting processing failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process meeting recording',
      details: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime
    }, { status: 500 });
  }
}

// Helper function to send email notifications
async function sendEmailNotifications(
  meeting: any,
  summary: any,
  participants: Array<{ name: string; email?: string }>
) {
  const emailService = await import('@/lib/email');
  
  const participantsWithEmail = participants.filter(p => p.email);
  
  if (participantsWithEmail.length === 0) {
    console.log('📧 No participants with email addresses found');
    return;
  }

  const emailContent = generateEmailContent(meeting, summary);
  
  const emailPromises = participantsWithEmail.map(async (participant) => {
    try {
      await emailService.sendMeetingSummary({
        to: participant.email!,
        participantName: participant.name,
        meetingTitle: meeting.title,
        content: emailContent
      });
      
      // Log notification in database
      await db.query(`
        INSERT INTO notifications (meeting_id, recipient_email, subject, content, status)
        VALUES ($1, $2, $3, $4, 'sent')
      `, [
        meeting.id,
        participant.email,
        `Meeting Summary: ${meeting.title}`,
        emailContent
      ]);
      
    } catch (error) {
      console.error(`📧 Failed to send email to ${participant.email}:`, error);
      
      // Log failed notification
      await db.query(`
        INSERT INTO notifications (meeting_id, recipient_email, subject, content, status, error_message)
        VALUES ($1, $2, $3, $4, 'failed', $5)
      `, [
        meeting.id,
        participant.email,
        `Meeting Summary: ${meeting.title}`,
        emailContent,
        error instanceof Error ? error.message : 'Unknown error'
      ]);
    }
  });

  await Promise.allSettled(emailPromises);
}

function generateEmailContent(meeting: any, summary: any): string {
  return `
Meeting Summary: ${meeting.title}

Summary:
${summary.summary_text}

Key Points:
${summary.key_points.map((point: string, index: number) => `${index + 1}. ${point}`).join('\n')}

Action Items:
${summary.action_items.map((item: string, index: number) => `${index + 1}. ${item}`).join('\n')}

${summary.decisions.length > 0 ? `
Decisions Made:
${summary.decisions.map((decision: string, index: number) => `${index + 1}. ${decision}`).join('\n')}
` : ''}

${summary.next_steps.length > 0 ? `
Next Steps:
${summary.next_steps.map((step: string, index: number) => `${index + 1}. ${step}`).join('\n')}
` : ''}

Meeting Date: ${new Date(meeting.start_time).toLocaleDateString()}
Duration: ${Math.round(meeting.duration_seconds / 60)} minutes

---
This summary was automatically generated by Meeting Assistant.
  `.trim();
}