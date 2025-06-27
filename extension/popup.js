// Popup JavaScript - Extension UI Controller
// Agent 2: Chrome Extension Specialist

class PopupController {
  constructor() {
    console.log('🔌 POPUP: PopupController constructor called');
    this.isRecording = false;
    this.meetingData = null;
    this.recordingStartTime = null;
    
    // Add immediate button test
    setTimeout(() => {
      const btn = document.getElementById('record-btn');
      console.log('🔌 POPUP: Button element found:', !!btn);
      if (btn) {
        console.log('🔌 POPUP: Button text:', btn.textContent);
        console.log('🔌 POPUP: Button listeners:', btn);
      }
    }, 100);
    
    this.init();
  }

  async init() {
    console.log('🔌 POPUP DEBUG: Initializing popup...');
    await this.loadSettings();
    this.setupEventListeners();
    await this.checkMeetingStatus();
    this.updateUI();
    console.log('🔌 POPUP DEBUG: Popup initialization complete');
  }

  async loadSettings() {
    try {
      const settings = await chrome.storage.sync.get([
        'autoRecord',
        'apiBaseUrl'
      ]);
      
      document.getElementById('auto-record').checked = settings.autoRecord || false;
      document.getElementById('api-url').value = settings.apiBaseUrl || 'http://localhost:3000';
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  setupEventListeners() {
    // Recording controls
    const recordBtn = document.getElementById('record-btn');
    const stopBtn = document.getElementById('stop-btn');
    
    console.log('🔌 POPUP DEBUG: Setting up event listeners', { recordBtn: !!recordBtn, stopBtn: !!stopBtn });
    
    if (recordBtn) {
      recordBtn.addEventListener('click', (e) => {
        console.log('🔌 POPUP DEBUG: Record button clicked');
        e.preventDefault();
        this.startRecording();
      });
    }
    
    if (stopBtn) {
      stopBtn.addEventListener('click', (e) => {
        console.log('🔌 POPUP DEBUG: Stop button clicked');
        e.preventDefault();
        this.stopRecording();
      });
    }

    // Settings
    document.getElementById('auto-record').addEventListener('change', (e) => {
      this.saveSettings();
    });
    
    document.getElementById('api-url').addEventListener('blur', () => {
      this.saveSettings();
    });

    // Actions
    document.getElementById('open-dashboard').addEventListener('click', () => {
      this.openDashboard();
    });
    
    document.getElementById('view-history').addEventListener('click', () => {
      this.viewHistory();
    });
  }

  async checkMeetingStatus() {
    try {
      console.log('🔌 POPUP DEBUG: Checking meeting status...');
      
      // Check if we're on a Google Meet tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('🔌 POPUP DEBUG: Current tab URL:', tab.url);
      
      if (tab.url?.includes('meet.google.com')) {
        console.log('🔌 POPUP DEBUG: On Google Meet, requesting meeting data...');
        
        // Request meeting data from content script
        chrome.tabs.sendMessage(tab.id, { type: 'GET_MEETING_DATA' }, (response) => {
          console.log('🔌 POPUP DEBUG: Content script response:', response);
          if (response && response.meetingData) {
            this.meetingData = response.meetingData;
            console.log('🔌 POPUP DEBUG: Meeting data received:', this.meetingData);
            this.updateMeetingInfo();
          } else {
            console.log('🔌 POPUP DEBUG: No meeting data received from content script');
          }
        });
        
        // Check recording state
        chrome.runtime.sendMessage({ type: 'GET_RECORDING_STATE' }, (response) => {
          console.log('🔌 POPUP DEBUG: Recording state response:', response);
          if (response) {
            this.isRecording = response.isRecording;
            this.updateRecordingState();
          }
        });
      } else {
        console.log('🔌 POPUP DEBUG: Not on Google Meet');
        this.updateStatus('NOT IN MEETING', 'warning');
      }
    } catch (error) {
      console.error('🔌 POPUP DEBUG: Failed to check meeting status:', error);
      this.updateStatus('ERROR', 'error');
    }
  }

  updateMeetingInfo() {
    if (this.meetingData) {
      document.getElementById('meeting-title').textContent = this.meetingData.title || 'Google Meet Session';
      document.getElementById('participant-count').textContent = 
        `${this.meetingData.participants?.length || 0} participants`;
      
      this.updateStatus('IN MEETING', 'ready');
    }
  }

  updateRecordingState() {
    const recordBtn = document.getElementById('record-btn');
    const stopBtn = document.getElementById('stop-btn');
    
    if (this.isRecording) {
      recordBtn.style.display = 'none';
      stopBtn.style.display = 'block';
      this.updateStatus('RECORDING', 'recording');
      this.startDurationTimer();
    } else {
      recordBtn.style.display = 'block';
      stopBtn.style.display = 'none';
      this.stopDurationTimer();
      
      if (this.meetingData) {
        this.updateStatus('IN MEETING', 'ready');
      }
    }
  }

  async startRecording() {
    try {
      console.log('🔌 POPUP DEBUG: Starting recording...');
      
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('🔌 POPUP DEBUG: Current tab:', tab.url);
      
      if (!tab.url?.includes('meet.google.com')) {
        console.log('🔌 POPUP DEBUG: Not on Google Meet');
        alert('Please navigate to a Google Meet session first.');
        return;
      }

      console.log('🔌 POPUP DEBUG: Meeting data:', this.meetingData);

      // Request permission for tab capture
      console.log('🔌 POPUP DEBUG: Requesting tab capture permission...');
      const hasPermission = await this.requestTabCapturePermission();
      console.log('🔌 POPUP DEBUG: Tab capture permission granted:', hasPermission);
      
      if (!hasPermission) {
        alert('Tab capture permission is required for recording.');
        return;
      }

      // Send recording request to background
      console.log('🔌 POPUP DEBUG: Sending START_RECORDING message to background...');
      chrome.runtime.sendMessage({
        type: 'START_RECORDING',
        meetingData: this.meetingData
      }, (response) => {
        console.log('🔌 POPUP DEBUG: Background response:', response);
        if (response?.success) {
          this.isRecording = true;
          this.recordingStartTime = Date.now();
          this.updateRecordingState();
        } else {
          alert('Failed to start recording. Please try again.');
        }
      });
      
    } catch (error) {
      console.error('🔌 POPUP ERROR: Failed to start recording:', error);
      alert('Recording failed. Please check permissions and try again.');
    }
  }

  stopRecording() {
    chrome.runtime.sendMessage({
      type: 'STOP_RECORDING',
      meetingData: this.meetingData
    }, (response) => {
      this.isRecording = false;
      this.updateRecordingState();
    });
  }

  async requestTabCapturePermission() {
    return new Promise((resolve) => {
      chrome.tabCapture.capture({
        audio: true,
        video: false
      }, (stream) => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

  startDurationTimer() {
    this.durationInterval = setInterval(() => {
      if (this.recordingStartTime) {
        const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        document.getElementById('duration').textContent = 
          `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('duration').style.display = 'inline';
      }
    }, 1000);
  }

  stopDurationTimer() {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
    document.getElementById('duration').style.display = 'none';
  }

  updateStatus(text, type) {
    const statusText = document.getElementById('status-text');
    const statusDot = document.getElementById('status-dot');
    
    statusText.textContent = text;
    
    // Remove existing classes
    statusDot.classList.remove('recording', 'warning', 'error');
    
    // Add appropriate class
    if (type) {
      statusDot.classList.add(type);
    }
  }

  updateUI() {
    // Update based on current state
    this.updateRecordingState();
  }

  async saveSettings() {
    try {
      const settings = {
        autoRecord: document.getElementById('auto-record').checked,
        apiBaseUrl: document.getElementById('api-url').value.trim() || 'http://localhost:3000'
      };
      
      await chrome.storage.sync.set(settings);
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  async openDashboard() {
    const apiUrl = document.getElementById('api-url').value.trim() || 'http://localhost:3000';
    chrome.tabs.create({ url: apiUrl });
  }

  async viewHistory() {
    const apiUrl = document.getElementById('api-url').value.trim() || 'http://localhost:3000';
    chrome.tabs.create({ url: `${apiUrl}/history` });
  }
}

// Initialize popup when DOM is ready
console.log('🔌 POPUP: Script loaded');
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔌 POPUP: DOM loaded, creating PopupController');
  new PopupController();
});