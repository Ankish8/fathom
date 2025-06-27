import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

// GET /api/meetings - Retrieve all meetings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    let meetings;
    
    if (userId) {
      // Get meetings for specific user
      meetings = await db.getMeetingsByUser(userId, limit)
    } else {
      // Get all recent meetings (for demo/admin purposes)
      const result = await db.query(`
        SELECT m.*, 
               COUNT(p.id) as participant_count,
               MAX(s.summary_text) as summary_text
        FROM meetings m
        LEFT JOIN participants p ON m.id = p.meeting_id
        LEFT JOIN summaries s ON m.id = s.meeting_id
        WHERE m.status = 'active'
        GROUP BY m.id
        ORDER BY m.start_time DESC
        LIMIT $1
      `, [limit])
      
      meetings = result.rows
    }

    return NextResponse.json({ 
      meetings,
      count: meetings.length,
      message: "Meetings retrieved successfully"
    })
  } catch (error) {
    console.error('❌ Error fetching meetings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meetings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/meetings - Create a new meeting (simplified version)
export async function POST(request: NextRequest) {
  try {
    const meetingData = await request.json()
    
    // Validate required fields
    if (!meetingData.title) {
      return NextResponse.json(
        { error: 'Missing required field: title' },
        { status: 400 }
      )
    }

    // Create meeting record
    const meeting = await db.createMeeting({
      title: meetingData.title,
      description: meetingData.description,
      start_time: meetingData.startTime ? new Date(meetingData.startTime) : new Date(),
      end_time: meetingData.endTime ? new Date(meetingData.endTime) : undefined,
      duration_seconds: meetingData.duration || 0,
      meeting_url: meetingData.meetingUrl,
      meeting_platform: meetingData.platform || 'web',
      status: 'active'
    })

    // Add participants if provided
    if (meetingData.participants && meetingData.participants.length > 0) {
      await db.addParticipants(meeting.id, meetingData.participants.map((p: any) => ({
        name: p.name,
        email: p.email,
        role: p.role || 'attendee',
        join_time: meetingData.startTime ? new Date(meetingData.startTime) : new Date(),
        duration_seconds: meetingData.duration || 0
      })))
    }

    console.log('✅ Meeting created successfully:', {
      id: meeting.id,
      title: meeting.title,
      participants: meetingData.participants?.length || 0
    })
    
    return NextResponse.json({ 
      meeting,
      message: "Meeting created successfully"
    })
  } catch (error) {
    console.error('❌ Error creating meeting:', error)
    return NextResponse.json(
      { error: 'Failed to create meeting', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT /api/meetings - Update a meeting
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const meetingId = searchParams.get('id')
    
    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      )
    }

    const updates = await request.json()
    
    // Update meeting
    const updatedMeeting = await db.updateMeeting(meetingId, updates)
    
    if (!updatedMeeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      meeting: updatedMeeting,
      message: "Meeting updated successfully"
    })
  } catch (error) {
    console.error('❌ Error updating meeting:', error)
    return NextResponse.json(
      { error: 'Failed to update meeting', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/meetings - Delete/archive meetings
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const meetingId = searchParams.get('id')
    const action = searchParams.get('action') || 'archive' // archive or delete
    
    if (meetingId) {
      // Delete/archive specific meeting
      if (action === 'delete') {
        await db.query('DELETE FROM meetings WHERE id = $1', [meetingId])
      } else {
        await db.updateMeeting(meetingId, { status: 'archived' })
      }
      
      return NextResponse.json({ 
        message: `Meeting ${action}d successfully`
      })
    } else {
      // Clear all meetings (development only)
      if (process.env.NODE_ENV === 'development') {
        await db.query('UPDATE meetings SET status = $1', ['archived'])
        return NextResponse.json({ 
          message: "All meetings archived (development mode)"
        })
      } else {
        return NextResponse.json(
          { error: 'Bulk delete not allowed in production' },
          { status: 403 }
        )
      }
    }
  } catch (error) {
    console.error('❌ Error deleting meetings:', error)
    return NextResponse.json(
      { error: 'Failed to delete meetings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}