// Database Connection and Models
// Agent 3: Backend API Engineer

import { Pool, PoolClient } from 'pg';

// Database connection pool
class DatabasePool {
  private static instance: DatabasePool;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle connection errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  public static getInstance(): DatabasePool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new DatabasePool();
    }
    return DatabasePool.instance;
  }

  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  public async query(text: string, params?: any[]): Promise<any> {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}

// Database interface types
export interface User {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  settings: Record<string, any>;
}

export interface Meeting {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  start_time: Date;
  end_time?: Date;
  duration_seconds?: number;
  meeting_url?: string;
  meeting_platform: string;
  status: 'active' | 'archived' | 'deleted';
  created_at: Date;
  updated_at: Date;
}

export interface Participant {
  id: string;
  meeting_id: string;
  name: string;
  email?: string;
  role: 'organizer' | 'presenter' | 'attendee';
  join_time?: Date;
  leave_time?: Date;
  duration_seconds?: number;
  created_at: Date;
}

export interface Recording {
  id: string;
  meeting_id: string;
  file_path: string;
  file_size_bytes?: number;
  duration_seconds?: number;
  format: string;
  quality_score?: number;
  created_at: Date;
}

export interface Transcript {
  id: string;
  meeting_id: string;
  recording_id?: string;
  content: string;
  language: string;
  confidence_score?: number;
  processing_time_ms?: number;
  api_provider: string;
  created_at: Date;
}

export interface Summary {
  id: string;
  meeting_id: string;
  transcript_id?: string;
  summary_text: string;
  key_points: string[];
  action_items: string[];
  decisions: string[];
  next_steps: string[];
  ai_provider: string;
  processing_time_ms?: number;
  created_at: Date;
}

// Database operations class
export class DatabaseOperations {
  private db: DatabasePool;

  constructor() {
    this.db = DatabasePool.getInstance();
  }

  // User operations
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const query = `
      INSERT INTO users (email, name, settings)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await this.db.query(query, [userData.email, userData.name, userData.settings]);
    return result.rows[0];
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.db.query(query, [email]);
    return result.rows[0] || null;
  }

  // Meeting operations
  async createMeeting(meetingData: Omit<Meeting, 'id' | 'created_at' | 'updated_at'>): Promise<Meeting> {
    const query = `
      INSERT INTO meetings (user_id, title, description, start_time, end_time, duration_seconds, meeting_url, meeting_platform, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      meetingData.user_id,
      meetingData.title,
      meetingData.description,
      meetingData.start_time,
      meetingData.end_time,
      meetingData.duration_seconds,
      meetingData.meeting_url,
      meetingData.meeting_platform,
      meetingData.status
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getMeetingById(meetingId: string): Promise<Meeting | null> {
    const query = 'SELECT * FROM meetings WHERE id = $1';
    const result = await this.db.query(query, [meetingId]);
    return result.rows[0] || null;
  }

  async getMeetingsByUser(userId: string, limit: number = 50): Promise<Meeting[]> {
    const query = `
      SELECT * FROM meetings 
      WHERE user_id = $1 AND status = 'active'
      ORDER BY start_time DESC 
      LIMIT $2
    `;
    const result = await this.db.query(query, [userId, limit]);
    return result.rows;
  }

  async updateMeeting(meetingId: string, updates: Partial<Meeting>): Promise<Meeting | null> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE meetings 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 
      RETURNING *
    `;
    
    const values = [meetingId, ...Object.values(updates)];
    const result = await this.db.query(query, values);
    return result.rows[0] || null;
  }

  // Participant operations
  async addParticipants(meetingId: string, participants: Omit<Participant, 'id' | 'meeting_id' | 'created_at'>[]): Promise<Participant[]> {
    if (participants.length === 0) return [];

    const values: any[] = [];
    const placeholders = participants.map((_, index) => {
      const baseIndex = index * 6;
      values.push(
        meetingId,
        participants[index].name,
        participants[index].email,
        participants[index].role,
        participants[index].join_time,
        participants[index].leave_time,
        participants[index].duration_seconds
      );
      return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7})`;
    });

    const query = `
      INSERT INTO participants (meeting_id, name, email, role, join_time, leave_time, duration_seconds)
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows;
  }

  async getParticipantsByMeeting(meetingId: string): Promise<Participant[]> {
    const query = 'SELECT * FROM participants WHERE meeting_id = $1 ORDER BY created_at';
    const result = await this.db.query(query, [meetingId]);
    return result.rows;
  }

  // Recording operations
  async createRecording(recordingData: Omit<Recording, 'id' | 'created_at'>): Promise<Recording> {
    const query = `
      INSERT INTO recordings (meeting_id, file_path, file_size_bytes, duration_seconds, format, quality_score)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      recordingData.meeting_id,
      recordingData.file_path,
      recordingData.file_size_bytes,
      recordingData.duration_seconds,
      recordingData.format,
      recordingData.quality_score
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  // Transcript operations
  async createTranscript(transcriptData: Omit<Transcript, 'id' | 'created_at'>): Promise<Transcript> {
    const query = `
      INSERT INTO transcripts (meeting_id, recording_id, content, language, confidence_score, processing_time_ms, api_provider)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      transcriptData.meeting_id,
      transcriptData.recording_id,
      transcriptData.content,
      transcriptData.language,
      transcriptData.confidence_score,
      transcriptData.processing_time_ms,
      transcriptData.api_provider
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getTranscriptByMeeting(meetingId: string): Promise<Transcript | null> {
    const query = 'SELECT * FROM transcripts WHERE meeting_id = $1 ORDER BY created_at DESC LIMIT 1';
    const result = await this.db.query(query, [meetingId]);
    return result.rows[0] || null;
  }

  // Summary operations
  async createSummary(summaryData: Omit<Summary, 'id' | 'created_at'>): Promise<Summary> {
    const query = `
      INSERT INTO summaries (meeting_id, transcript_id, summary_text, key_points, action_items, decisions, next_steps, ai_provider, processing_time_ms)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      summaryData.meeting_id,
      summaryData.transcript_id,
      summaryData.summary_text,
      JSON.stringify(summaryData.key_points),
      JSON.stringify(summaryData.action_items),
      JSON.stringify(summaryData.decisions),
      JSON.stringify(summaryData.next_steps),
      summaryData.ai_provider,
      summaryData.processing_time_ms
    ];
    const result = await this.db.query(query, values);
    
    // Parse JSON fields back
    const summary = result.rows[0];
    summary.key_points = JSON.parse(summary.key_points);
    summary.action_items = JSON.parse(summary.action_items);
    summary.decisions = JSON.parse(summary.decisions);
    summary.next_steps = JSON.parse(summary.next_steps);
    
    return summary;
  }

  async getSummaryByMeeting(meetingId: string): Promise<Summary | null> {
    const query = 'SELECT * FROM summaries WHERE meeting_id = $1 ORDER BY created_at DESC LIMIT 1';
    const result = await this.db.query(query, [meetingId]);
    
    if (result.rows[0]) {
      const summary = result.rows[0];
      summary.key_points = JSON.parse(summary.key_points);
      summary.action_items = JSON.parse(summary.action_items);
      summary.decisions = JSON.parse(summary.decisions);
      summary.next_steps = JSON.parse(summary.next_steps);
      return summary;
    }
    
    return null;
  }

  // Complete meeting data
  async getCompleteMeetingData(meetingId: string) {
    const meeting = await this.getMeetingById(meetingId);
    if (!meeting) return null;

    const [participants, transcript, summary] = await Promise.all([
      this.getParticipantsByMeeting(meetingId),
      this.getTranscriptByMeeting(meetingId),
      this.getSummaryByMeeting(meetingId)
    ]);

    return {
      meeting,
      participants,
      transcript,
      summary
    };
  }
}

export const db = new DatabaseOperations();