// Minimal test popup script
console.log('🔌 POPUP TEST: Script loaded successfully');
alert('POPUP SCRIPT LOADED!'); // This should show immediately

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔌 POPUP TEST: DOM loaded');
  
  // Test current tab detection
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('🔌 POPUP TEST: Current tab URL:', tab.url);
    
    if (tab.url?.includes('meet.google.com')) {
      console.log('🔌 POPUP TEST: ✅ On Google Meet tab');
      document.getElementById('status-text').textContent = 'IN MEETING';
      
      // Test content script communication
      chrome.tabs.sendMessage(tab.id, { type: 'GET_MEETING_DATA' }, (response) => {
        console.log('🔌 POPUP TEST: Content script response:', response);
        console.log('🔌 POPUP TEST: Chrome runtime error:', chrome.runtime.lastError);
        
        if (chrome.runtime.lastError) {
          console.log('🔌 POPUP TEST: ❌ Runtime error:', chrome.runtime.lastError.message);
          document.getElementById('meeting-title').textContent = 'Content script error: ' + chrome.runtime.lastError.message;
        } else if (response && response.meetingData) {
          console.log('🔌 POPUP TEST: ✅ Got meeting data:', response.meetingData);
          document.getElementById('meeting-title').textContent = response.meetingData.title || 'Meeting Detected';
          document.getElementById('participant-count').textContent = `${response.meetingData.participants?.length || 0} participants`;
        } else {
          console.log('🔌 POPUP TEST: ❌ No meeting data from content script');
          document.getElementById('meeting-title').textContent = 'Content script not responding';
        }
      });
    } else {
      console.log('🔌 POPUP TEST: ❌ Not on Google Meet tab');
      document.getElementById('status-text').textContent = 'NOT IN MEETING';
    }
  } catch (error) {
    console.error('🔌 POPUP TEST: Error:', error);
  }
  
  const btn = document.getElementById('record-btn');
  console.log('🔌 POPUP TEST: Button found:', !!btn);
  
  if (btn) {
    btn.addEventListener('click', async () => {
      console.log('🔌 POPUP TEST: BUTTON CLICKED!');
      
      // Test direct content script communication
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('🔌 POPUP TEST: Sending test message to content script...');
        
        chrome.tabs.sendMessage(tab.id, { type: 'GET_MEETING_DATA' }, (response) => {
          console.log('🔌 POPUP TEST: Button click - Content script response:', response);
          console.log('🔌 POPUP TEST: Button click - Runtime error:', chrome.runtime.lastError);
          
          if (response && response.meetingData) {
            alert(`Meeting detected: ${response.meetingData.title}`);
          } else {
            alert('No response from content script');
          }
        });
      } catch (error) {
        console.error('🔌 POPUP TEST: Button click error:', error);
        alert('Error: ' + error.message);
      }
    });
  }
});