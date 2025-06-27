// DeepSeek AI Integration for Meeting Summarization
// Agent 3: Backend API Engineer

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface MeetingSummary {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  decisions: string[];
  nextSteps: string[];
  participants: string[];
}

export class DeepSeekAI {
  private apiKey: string;
  private baseUrl: string = 'https://api.deepseek.com/chat/completions';

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('DEEPSEEK_API_KEY environment variable is required');
    }
  }

  async generateMeetingSummary(
    transcript: string,
    meetingTitle: string,
    participants: string[] = []
  ): Promise<MeetingSummary> {
    const startTime = Date.now();

    try {
      const prompt = this.buildSummarizationPrompt(transcript, meetingTitle, participants);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are an expert meeting analyst. Generate concise, actionable meeting summaries in the exact JSON format requested. Be precise and professional.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 2000,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status} - ${response.statusText}`);
      }

      const data: DeepSeekResponse = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from DeepSeek API');
      }

      // Parse the JSON response
      const summary = this.parseAIResponse(content);
      
      const processingTime = Date.now() - startTime;
      console.log(`🤖 DeepSeek processing completed in ${processingTime}ms`, {
        tokens: data.usage?.total_tokens,
        summary: summary.summary.substring(0, 100) + '...'
      });

      return summary;

    } catch (error) {
      console.error('🤖 DeepSeek AI error:', error);
      
      // Fallback to structured parsing
      return this.fallbackSummary(transcript, meetingTitle, participants);
    }
  }

  private buildSummarizationPrompt(transcript: string, meetingTitle: string, participants: string[]): string {
    return `
Analyze this meeting transcript and generate a comprehensive summary in JSON format.

MEETING DETAILS:
- Title: ${meetingTitle}
- Participants: ${participants.join(', ') || 'Not specified'}

TRANSCRIPT:
${transcript}

Generate a JSON response with this exact structure:
{
  "summary": "A concise 2-3 sentence summary of the meeting",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "actionItems": ["Action 1", "Action 2"],
  "decisions": ["Decision 1", "Decision 2"],
  "nextSteps": ["Step 1", "Step 2"],
  "participants": ["Name 1", "Name 2"]
}

REQUIREMENTS:
- Summary: 2-3 sentences maximum, capture the main purpose and outcomes
- Key Points: 3-5 most important discussion points
- Action Items: Specific tasks assigned with who/what/when if mentioned
- Decisions: Clear decisions made during the meeting
- Next Steps: Follow-up actions or future meetings planned
- Participants: Extract participant names from the transcript

Return ONLY the JSON object, no additional text.`;
  }

  private parseAIResponse(content: string): MeetingSummary {
    try {
      // Clean the response - remove markdown formatting if present
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanContent);
      
      // Validate required fields
      return {
        summary: parsed.summary || 'No summary available',
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
        decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
        nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
        participants: Array.isArray(parsed.participants) ? parsed.participants : []
      };
    } catch (error) {
      console.error('🤖 Failed to parse AI response:', error);
      throw new Error('Invalid AI response format');
    }
  }

  private fallbackSummary(transcript: string, meetingTitle: string, participants: string[]): MeetingSummary {
    console.log('🤖 Using fallback summary generation');
    
    // Simple keyword-based extraction
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const words = transcript.toLowerCase().split(/\s+/);
    
    // Extract key points based on common meeting phrases
    const keyPoints = this.extractKeyPhrases(transcript, [
      'discussed', 'review', 'update', 'progress', 'issue', 'problem', 'solution',
      'decision', 'agreed', 'plan', 'schedule', 'deadline', 'budget', 'resource'
    ]);

    // Extract action items
    const actionItems = this.extractKeyPhrases(transcript, [
      'will', 'should', 'need to', 'action', 'task', 'assign', 'follow up',
      'next week', 'by friday', 'deadline', 'complete', 'deliver'
    ]);

    // Extract decisions
    const decisions = this.extractKeyPhrases(transcript, [
      'decided', 'agreed', 'approved', 'rejected', 'chosen', 'selected',
      'final', 'conclude', 'resolve'
    ]);

    // Generate summary
    const summary = sentences.length > 0 
      ? `Meeting "${meetingTitle}" covered key topics and discussions. ${sentences[0]?.trim()}. Various action items and next steps were identified.`
      : `Meeting "${meetingTitle}" was held with ${participants.length} participants. Key discussions and decisions were made.`;

    return {
      summary,
      keyPoints: keyPoints.slice(0, 5),
      actionItems: actionItems.slice(0, 4),
      decisions: decisions.slice(0, 3),
      nextSteps: actionItems.slice(0, 3),
      participants
    };
  }

  private extractKeyPhrases(text: string, keywords: string[]): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const phrases: string[] = [];

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      if (keywords.some(keyword => lowerSentence.includes(keyword))) {
        phrases.push(sentence.trim());
      }
    }

    return [...new Set(phrases)]; // Remove duplicates
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: 'Hello, are you working?'
            }
          ],
          max_tokens: 10
        })
      });

      return response.ok;
    } catch (error) {
      console.error('🤖 DeepSeek connection test failed:', error);
      return false;
    }
  }
}

export const deepseekAI = new DeepSeekAI();