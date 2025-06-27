// Individual Meeting API - Get complete meeting data
// Agent 3: Backend API Engineer

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

interface Params {
  id: string;
}

// GET /api/meeting/[id] - Get complete meeting data
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const meetingId = params.id;

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      );
    }

    // Get complete meeting data
    const meetingData = await db.getCompleteMeetingData(meetingId);

    if (!meetingData) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    const { meeting, participants, transcript, summary } = meetingData;

    // Format response similar to existing MeetingNotes interface
    const formattedMeeting = {
      id: meeting.id,
      title: meeting.title,
      date: meeting.start_time,
      duration: meeting.duration_seconds || 0,
      transcript: transcript?.content || '',
      summary: summary?.summary_text || 'No summary available',
      keyPoints: summary?.key_points || [],
      actionItems: summary?.action_items || [],
      decisions: summary?.decisions || [],
      nextSteps: summary?.next_steps || [],
      participants: participants.map(p => p.name),
      meetingUrl: meeting.meeting_url,
      platform: meeting.meeting_platform,
      status: meeting.status,
      transcriptionMetadata: transcript ? {
        source: transcript.api_provider,
        confidence: transcript.confidence_score || 0,
        processingTime: transcript.processing_time_ms || 0,
        language: transcript.language
      } : null,
      summaryMetadata: summary ? {
        aiProvider: summary.ai_provider,
        processingTime: summary.processing_time_ms || 0
      } : null,
      participantDetails: participants.map(p => ({
        name: p.name,
        email: p.email,
        role: p.role,
        joinTime: p.join_time,
        leaveTime: p.leave_time,
        duration: p.duration_seconds
      }))
    };

    return NextResponse.json({
      meeting: formattedMeeting,
      message: 'Meeting data retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching meeting:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch meeting data', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/meeting/[id] - Update meeting
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const meetingId = params.id;
    const updates = await request.json();

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      );
    }

    // Update meeting
    const updatedMeeting = await db.updateMeeting(meetingId, updates);

    if (!updatedMeeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      meeting: updatedMeeting,
      message: 'Meeting updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating meeting:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update meeting', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/meeting/[id] - Delete/archive meeting
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const meetingId = params.id;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'archive';

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      );
    }

    if (action === 'delete') {
      // Permanent deletion
      await db.query('DELETE FROM meetings WHERE id = $1', [meetingId]);
    } else {
      // Archive (soft delete)
      await db.updateMeeting(meetingId, { status: 'archived' });
    }

    return NextResponse.json({
      message: `Meeting ${action}d successfully`
    });

  } catch (error) {
    console.error('❌ Error deleting meeting:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete meeting', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}