// Background Service Worker - Handles recording and API communication
// Agent 2: Chrome Extension Specialist

console.log('🔌 Meeting Assistant Background Service Worker loaded');
console.log('🔌 DEBUG: Available Chrome APIs:', {
  tabCapture: !!chrome.tabCapture,
  tabs: !!chrome.tabs,
  runtime: !!chrome.runtime,
  notifications: !!chrome.notifications,
  storage: !!chrome.storage
});

class MeetingRecorder {
  constructor() {
    this.currentRecording = null;
    this.meetingData = null;
    this.apiBaseUrl = 'http://localhost:3000'; // Will be configurable
    this.isRecording = false;
    
    this.setupMessageHandlers();
    this.setupTabListeners();
  }

  setupMessageHandlers() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('🔌 Background received message:', message.type);
      
      switch (message.type) {
        case 'MEETING_DATA_UPDATE':
          this.handleMeetingDataUpdate(message.data);
          sendResponse({ success: true });
          break;
          
        case 'START_RECORDING':
          console.log('🔌 DEBUG: Processing START_RECORDING request...');
          this.startRecording(message.meetingData, sender.tab)
            .then(success => {
              console.log('🔌 DEBUG: startRecording result:', success);
              sendResponse({ success: success });
            })
            .catch(error => {
              console.error('🔌 DEBUG: startRecording error:', error);
              sendResponse({ success: false, error: error.message });
            });
          return true; // Keep message channel open for async response
          
        case 'STOP_RECORDING':
          this.stopRecording(message.meetingData);
          sendResponse({ success: true });
          break;
          
        case 'GET_RECORDING_STATE':
          sendResponse({ isRecording: this.isRecording });
          break;
          
        case 'PROCESS_AUDIO':
          console.log('🔌 DEBUG: Processing audio from content script...');
          this.processAudioFromContentScript(message)
            .then(success => {
              sendResponse({ success: success });
            })
            .catch(error => {
              console.error('🔌 DEBUG: Audio processing error:', error);
              sendResponse({ success: false, error: error.message });
            });
          return true; // Keep message channel open for async response
          break;
      }
    });
  }

  setupTabListeners() {
    // Monitor tab changes and closures
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url?.includes('meet.google.com')) {
        console.log('🔌 Google Meet tab updated:', tab.url);
      }
    });

    chrome.tabs.onRemoved.addListener((tabId) => {
      if (this.currentRecording && this.currentRecording.tabId === tabId) {
        console.log('🔌 Google Meet tab closed, stopping recording');
        this.stopRecording();
      }
    });
  }

  handleMeetingDataUpdate(data) {
    this.meetingData = data;
    console.log('🔌 DEBUG: Meeting data updated:', {
      title: data.title,
      participants: data.participants.length,
      startTime: data.startTime,
      url: data.meetingUrl,
      fullData: data
    });
    
    // Optionally auto-start recording based on settings
    this.checkAutoRecordSettings();
  }

  async checkAutoRecordSettings() {
    try {
      const settings = await chrome.storage.sync.get(['autoRecord', 'autoRecordKeywords']);
      
      if (settings.autoRecord) {
        // Check if meeting title matches keywords
        const keywords = settings.autoRecordKeywords || [];
        const shouldRecord = keywords.length === 0 || 
          keywords.some(keyword => 
            this.meetingData.title.toLowerCase().includes(keyword.toLowerCase())
          );
          
        if (shouldRecord && !this.isRecording) {
          console.log('🔌 Auto-starting recording based on settings');
          // Auto-start recording with delay
          setTimeout(() => this.startRecording(this.meetingData), 3000);
        }
      }
    } catch (error) {
      console.error('🔌 Error checking auto-record settings:', error);
    }
  }

  async startRecording(meetingData, tab) {
    console.log('🔌 DEBUG: startRecording called with:', { meetingData, tabId: tab?.id });
    
    if (this.isRecording) {
      console.log('🔌 Recording already in progress');
      return false;
    }

    try {
      console.log('🔌 DEBUG: Starting recording for:', meetingData?.title);
      console.log('🔌 DEBUG: Tab info:', tab);
      
      // Initialize recording state
      this.currentRecording = {
        meetingData: meetingData,
        startTime: new Date().toISOString(),
        tabId: tab?.id,
        audioChunks: []
      };
      
      this.isRecording = true;
      console.log('🔌 DEBUG: Recording state set to true');
      
      // Notify content script about recording state
      if (tab?.id) {
        console.log('🔌 DEBUG: Notifying content script about recording state...');
        chrome.tabs.sendMessage(tab.id, {
          type: 'RECORDING_STATE_CHANGE',
          isRecording: true
        }).catch(error => {
          console.log('🔌 DEBUG: Failed to notify content script:', error);
        });
      }
      
      // Start audio capture using tab capture API
      console.log('🔌 DEBUG: Starting audio capture...');
      await this.captureTabAudio(tab);
      
      // Create initial meeting record in database
      console.log('🔌 DEBUG: Creating meeting record...');
      await this.createMeetingRecord(meetingData);
      
      // Set up auto-stop timer (max 4 hours)
      setTimeout(() => {
        if (this.isRecording) {
          console.log('🔌 Auto-stopping recording after 4 hours');
          this.stopRecording();
        }
      }, 4 * 60 * 60 * 1000);
      
      console.log('🔌 DEBUG: Recording started successfully');
      return true;
    } catch (error) {
      console.error('🔌 DEBUG: Failed to start recording:', error);
      this.isRecording = false;
      return false;
    }
  }

  async captureTabAudio(tab) {
    try {
      console.log('🔌 DEBUG: Starting audio capture using content script approach...');
      
      // Use content script to capture audio (Manifest V3 compatible)
      await this.tryContentScriptCapture(tab);
      
      console.log('🔌 DEBUG: Audio capture started successfully');
    } catch (error) {
      console.error('🔌 DEBUG: Audio capture failed with error:', error);
      throw error;
    }
  }


  async tryContentScriptCapture(tab) {
    return new Promise((resolve, reject) => {
      console.log('🔌 DEBUG: Requesting content script to start recording...');
      
      // Send message to content script to handle recording
      chrome.tabs.sendMessage(tab.id, {
        type: 'START_CONTENT_RECORDING'
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('🔌 DEBUG: Failed to communicate with content script:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (response && response.success) {
          console.log('🔌 DEBUG: Content script recording started');
          // Set up recording state
          this.currentRecording.mediaRecorder = { 
            stop: () => {
              console.log('🔌 DEBUG: Stopping content script recording');
              chrome.tabs.sendMessage(tab.id, { type: 'STOP_CONTENT_RECORDING' });
            },
            state: 'recording'
          };
          resolve(true);
        } else {
          console.error('🔌 DEBUG: Content script recording failed:', response?.error);
          reject(new Error(response?.error || 'Content script recording failed'));
        }
      });
    });
  }


  async stopRecording(meetingData) {
    if (!this.isRecording) {
      console.log('🔌 No recording in progress');
      return;
    }

    try {
      console.log('🔌 Stopping recording...');
      
      // Stop media recorder
      if (this.currentRecording.mediaRecorder) {
        this.currentRecording.mediaRecorder.stop();
      }
      
      // Update recording state
      this.isRecording = false;
      this.currentRecording.endTime = new Date().toISOString();
      
      // Notify content script
      const tabs = await chrome.tabs.query({ url: '*://meet.google.com/*' });
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'RECORDING_STATE_CHANGE',
          isRecording: false
        });
      });
      
      console.log('🔌 Recording stopped successfully');
    } catch (error) {
      console.error('🔌 Error stopping recording:', error);
    }
  }


  async createMeetingRecord(meetingData) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: meetingData.title,
          participants: meetingData.participants,
          meetingUrl: meetingData.meetingUrl,
          startTime: meetingData.startTime,
          platform: 'google_meet',
          source: 'chrome_extension'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        this.currentRecording.meetingId = result.meeting.id;
        console.log('🔌 Meeting record created:', result.meeting.id);
      }
    } catch (error) {
      console.error('🔌 Failed to create meeting record:', error);
    }
  }

  async processAudioFromContentScript(message) {
    try {
      console.log('🔌 DEBUG: Processing audio from content script...');
      
      // Send to web app API for processing
      await this.sendToAPI({
        meetingData: message.meetingData,
        audioData: message.audioData,
        duration: message.duration,
        startTime: message.meetingData.startTime,
        endTime: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('🔌 Error processing audio from content script:', error);
      throw error;
    }
  }

  async sendToAPI(data) {
    try {
      console.log('🔌 Sending audio to API for processing...');
      
      const response = await fetch(`${this.apiBaseUrl}/api/process-recording`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('🔌 Audio processed successfully:', result);
        
        // Show notification to user
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Meeting Processed',
          message: `Meeting "${data.meetingData.title}" has been transcribed and summarized.`
        });
        
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error('🔌 Failed to send to API:', error);
      
      // Show error notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Processing Failed',
        message: 'Failed to process meeting recording. Please try again.'
      });
    }
  }
}

// Initialize the meeting recorder
const meetingRecorder = new MeetingRecorder();

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('🔌 Meeting Assistant installed/updated:', details.reason);
  
  // Set default settings
  chrome.storage.sync.set({
    autoRecord: false,
    autoRecordKeywords: [],
    apiBaseUrl: 'http://localhost:3000'
  });
});