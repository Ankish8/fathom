// Content Script - Injected into Google Meet pages
// Agent 2: Chrome Extension Specialist

console.log('🔌 Meeting Assistant: Injected into Google Meet');

class MeetingDetector {
  constructor() {
    this.meetingData = {
      title: '',
      participants: [],
      startTime: null,
      isRecording: false,
      meetingUrl: window.location.href
    };
    
    this.init();
  }

  init() {
    // Wait for Google Meet to load
    this.waitForMeetToLoad(() => {
      this.extractMeetingInfo();
      this.setupParticipantMonitoring();
      this.setupRecordingButton();
      this.notifyExtension();
    });
  }

  waitForMeetToLoad(callback) {
    let attempts = 0;
    const checkInterval = setInterval(() => {
      attempts++;
      console.log(`🔌 DEBUG: Attempt ${attempts} - Looking for Google Meet interface...`);
      
      // Check if Google Meet interface is loaded
      const meetingContainer = document.querySelector('[data-meeting-title], [jsname="HlFzId"]');
      const participantGrid = document.querySelector('[data-participant-id], [jsname="NdUALb"]');
      const meetingFrame = document.querySelector('[data-allocation-index]');
      const videoElements = document.querySelectorAll('video');
      const meetingButtons = document.querySelector('[data-tooltip*="microphone"], [data-tooltip*="camera"]');
      
      console.log('🔌 DEBUG: Elements found:', {
        meetingContainer: !!meetingContainer,
        participantGrid: !!participantGrid,
        meetingFrame: !!meetingFrame,
        videoCount: videoElements.length,
        meetingButtons: !!meetingButtons,
        url: window.location.href,
        title: document.title
      });
      
      // More comprehensive detection
      if (meetingContainer || participantGrid || meetingFrame || videoElements.length > 0 || meetingButtons) {
        clearInterval(checkInterval);
        console.log('🔌 Google Meet interface detected after', attempts, 'attempts');
        callback();
      } else if (attempts >= 30) {
        clearInterval(checkInterval);
        console.log('🔌 WARNING: Google Meet interface not detected after 30 attempts, proceeding anyway');
        callback();
      }
    }, 1000);
  }

  extractMeetingInfo() {
    try {
      console.log('🔌 DEBUG: Starting meeting info extraction...');
      
      // Extract meeting title from various possible locations
      const titleSelectors = [
        '[data-meeting-title]',
        '[aria-label*="meeting"]',
        'h1[jsname]',
        '.google-material-icons + span',
        '[jsname="HlFzId"]',
        '[data-meeting-name]',
        '.VfPpkd-Bz112c-LgbsSe[aria-label]',
        '[role="heading"]'
      ];

      let title = 'Google Meet Session';
      console.log('🔌 DEBUG: Searching for title with selectors:', titleSelectors);
      
      for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        const text = element ? element.textContent?.trim() : null;
        console.log(`🔌 DEBUG: Selector '${selector}':`, text || 'not found');
        
        // Skip invalid/unwanted titles
        if (element && text && 
            text.length > 3 && 
            !text.includes('domain_disabled') &&
            !text.includes('Meeting details') &&
            !text.includes('arrow_drop_down') &&
            !text.includes('undefined') &&
            !text.match(/^[A-Z_]+$/)) { // Skip all-caps UI elements
          title = text;
          console.log('🔌 DEBUG: Found valid title:', title);
          break;
        }
      }

      // Fallback to URL-based title extraction
      if (title === 'Google Meet Session') {
        const urlParams = new URLSearchParams(window.location.search);
        const meetingId = window.location.pathname.split('/').pop();
        console.log('🔌 DEBUG: URL fallback - params:', Object.fromEntries(urlParams), 'meetingId:', meetingId);
        title = `Meeting ${meetingId || new Date().toLocaleString()}`;
      }

      this.meetingData.title = title;
      this.meetingData.startTime = new Date().toISOString();

      console.log('🔌 DEBUG: Final meeting data:', this.meetingData);
      console.log('🔌 Meeting detected:', this.meetingData.title);
    } catch (error) {
      console.error('🔌 Error extracting meeting info:', error);
    }
  }

  extractParticipants() {
    const participants = [];
    
    try {
      // Multiple selectors for participant detection
      const participantSelectors = [
        '[data-participant-id]',
        '[jsname="NdUALb"] [jsname]',
        '[aria-label*="participant"]',
        '.uGOf1d', // Google Meet participant container
        '[data-self-name], [data-participant-name]'
      ];

      participantSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const name = this.extractNameFromElement(el);
          if (name && !participants.some(p => p.name === name)) {
            participants.push({
              name: name,
              role: 'attendee',
              joinTime: new Date().toISOString()
            });
          }
        });
      });

      // Extract from participant list if available
      const participantList = document.querySelector('[aria-label*="People"], [aria-label*="Participants"]');
      if (participantList) {
        const names = participantList.querySelectorAll('[data-tooltip], [title], [aria-label]');
        names.forEach(el => {
          const name = el.getAttribute('data-tooltip') || el.getAttribute('title') || el.getAttribute('aria-label');
          if (name && name.length > 1 && !participants.some(p => p.name === name)) {
            participants.push({
              name: name.trim(),
              role: 'attendee',
              joinTime: new Date().toISOString()
            });
          }
        });
      }

    } catch (error) {
      console.error('🔌 Error extracting participants:', error);
    }

    this.meetingData.participants = participants;
    return participants;
  }

  extractNameFromElement(element) {
    // Try multiple methods to extract participant names
    const methods = [
      () => element.getAttribute('data-participant-name'),
      () => element.getAttribute('data-self-name'),
      () => element.getAttribute('aria-label'),
      () => element.getAttribute('title'),
      () => element.textContent?.trim(),
      () => element.querySelector('[data-tooltip]')?.getAttribute('data-tooltip'),
      () => element.querySelector('[title]')?.getAttribute('title')
    ];

    for (const method of methods) {
      try {
        const name = method();
        if (name && name.length > 1 && name.length < 100) {
          return name.replace(/[^\w\s.-]/g, '').trim();
        }
      } catch (e) {
        continue;
      }
    }

    return null;
  }

  setupParticipantMonitoring() {
    // Monitor for participant changes
    const observer = new MutationObserver(() => {
      this.extractParticipants();
      this.notifyExtension();
    });

    // Observe the main meeting container
    const meetingContainer = document.querySelector('[data-call-id], #yDmH0d, [jsmodel]');
    if (meetingContainer) {
      observer.observe(meetingContainer, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }
  }

  setupRecordingButton() {
    // Create invisible recording indicator
    const recordingIndicator = document.createElement('div');
    recordingIndicator.id = 'meeting-assistant-indicator';
    recordingIndicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 12px;
      height: 12px;
      background: #000;
      border: 2px solid #fff;
      border-radius: 50%;
      z-index: 10000;
      display: none;
      box-shadow: 0 0 0 3px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(recordingIndicator);

    // Listen for recording state changes and popup requests
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('🔌 DEBUG: Content script received message:', message.type);
      
      if (message.type === 'RECORDING_STATE_CHANGE') {
        recordingIndicator.style.display = message.isRecording ? 'block' : 'none';
        this.meetingData.isRecording = message.isRecording;
      } else if (message.type === 'GET_MEETING_DATA') {
        console.log('🔌 DEBUG: Popup requested meeting data, sending:', this.meetingData);
        sendResponse({ meetingData: this.meetingData });
      } else if (message.type === 'START_CONTENT_RECORDING') {
        console.log('🔌 DEBUG: Starting content script recording...');
        this.startRecording().then(success => {
          sendResponse({ success: success });
        }).catch(error => {
          console.error('🔌 DEBUG: Content recording failed:', error);
          sendResponse({ success: false, error: error.message });
        });
        return true; // Keep message channel open for async response
      } else if (message.type === 'STOP_CONTENT_RECORDING') {
        console.log('🔌 DEBUG: Stopping content script recording...');
        this.stopRecording();
        sendResponse({ success: true });
      }
      
      return true; // Keep the message channel open for async responses
    });
  }

  async startRecording() {
    try {
      console.log('🔌 DEBUG: Content script starting recording...');
      
      // Request screen/audio capture with system audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
          systemAudio: 'include' // Include system audio if supported
        },
        video: false // Only capture audio
      });

      console.log('🔌 DEBUG: Got media stream:', stream);

      // Set up MediaRecorder in content script
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        console.log('🔌 DEBUG: Audio data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        console.log('🔌 DEBUG: MediaRecorder stopped, processing audio...');
        this.processRecordedAudio();
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.meetingData.isRecording = true;

      // Show recording indicator
      const indicator = document.getElementById('meeting-assistant-indicator');
      if (indicator) {
        indicator.style.display = 'block';
        indicator.style.background = '#ff0000'; // Red dot when recording
      }

      console.log('🔌 DEBUG: Recording started successfully');
      return true;
    } catch (error) {
      console.error('🔌 DEBUG: Recording failed:', error);
      
      // Show user-friendly error message
      if (error.name === 'NotAllowedError') {
        console.error('🔌 User denied screen sharing permission');
      } else if (error.name === 'NotSupportedError') {
        console.error('🔌 Screen sharing not supported in this browser');
      }
      
      return false;
    }
  }

  stopRecording() {
    try {
      console.log('🔌 DEBUG: Stopping content script recording...');
      
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }
      
      this.meetingData.isRecording = false;
      
      // Hide recording indicator
      const indicator = document.getElementById('meeting-assistant-indicator');
      if (indicator) {
        indicator.style.display = 'none';
      }
      
      // Notify background script
      chrome.runtime.sendMessage({
        type: 'STOP_RECORDING',
        meetingData: this.meetingData
      });
      
      console.log('🔌 DEBUG: Recording stopped');
    } catch (error) {
      console.error('🔌 DEBUG: Error stopping recording:', error);
    }
  }

  async processRecordedAudio() {
    try {
      if (!this.audioChunks || this.audioChunks.length === 0) {
        console.log('🔌 DEBUG: No audio data to process');
        return;
      }

      console.log('🔌 DEBUG: Processing', this.audioChunks.length, 'audio chunks');

      // Create audio blob
      const audioBlob = new Blob(this.audioChunks, {
        type: 'audio/webm;codecs=opus'
      });

      console.log('🔌 DEBUG: Created audio blob:', audioBlob.size, 'bytes');

      // Convert to base64 for transmission
      const audioBase64 = await this.blobToBase64(audioBlob);

      // Send to background script for API processing
      chrome.runtime.sendMessage({
        type: 'PROCESS_AUDIO',
        meetingData: this.meetingData,
        audioData: audioBase64,
        duration: Math.round((Date.now() - new Date(this.meetingData.startTime)) / 1000)
      });

      console.log('🔌 DEBUG: Audio sent to background script for processing');
    } catch (error) {
      console.error('🔌 DEBUG: Error processing recorded audio:', error);
    }
  }

  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  notifyExtension() {
    // Send meeting data to background script
    console.log('🔌 DEBUG: Notifying extension with data:', this.meetingData);
    chrome.runtime.sendMessage({
      type: 'MEETING_DATA_UPDATE',
      data: this.meetingData
    }).catch(error => {
      console.error('🔌 ERROR: Failed to notify extension:', error);
    });
  }

  // Auto-detect meeting end
  detectMeetingEnd() {
    // Monitor for meeting end indicators
    const endIndicators = [
      () => window.location.href.includes('meet.google.com/') && !window.location.pathname.includes('/'),
      () => document.querySelector('[aria-label*="Leave call"], [aria-label*="End call"]'),
      () => document.title.includes('ended') || document.title.includes('left')
    ];

    const checkInterval = setInterval(() => {
      if (endIndicators.some(check => check())) {
        this.stopRecording();
        clearInterval(checkInterval);
      }
    }, 5000);
  }
}

// Initialize meeting detector when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new MeetingDetector();
  });
} else {
  new MeetingDetector();
}

// Handle page navigation in SPA
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    console.log('🔌 Page navigation detected, reinitializing...');
    setTimeout(() => new MeetingDetector(), 2000);
  }
}).observe(document, { subtree: true, childList: true });