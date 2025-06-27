// Enhanced audio processing utilities
// Agent 4 (Sam Rodriguez) - Web Audio Technology Expert

export interface AudioConfig {
  sampleRate: number
  channels: number
  bitDepth: number
  format: 'wav' | 'mp3' | 'webm'
}

export interface AudioQualityMetrics {
  level: number
  noise: number
  clipping: boolean
  silence: boolean
}

export class AudioProcessor {
  private mediaRecorder: MediaRecorder | null = null
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private stream: MediaStream | null = null
  private chunks: Blob[] = []
  
  // High-quality audio configuration
  private defaultConfig: AudioConfig = {
    sampleRate: 48000,
    channels: 1, // Mono for better transcription
    bitDepth: 16,
    format: 'wav'
  }

  async initialize(config: Partial<AudioConfig> = {}): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config }
    
    try {
      // Request high-quality audio stream
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: finalConfig.sampleRate,
          channelCount: finalConfig.channels,
          sampleSize: finalConfig.bitDepth
        }
      })

      // Set up audio analysis
      this.audioContext = new AudioContext({ sampleRate: finalConfig.sampleRate })
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 256
      
      const source = this.audioContext.createMediaStreamSource(this.stream)
      source.connect(this.analyser)

      // Configure MediaRecorder with optimal settings
      const mimeType = this.getSupportedMimeType(finalConfig.format)
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: finalConfig.sampleRate * finalConfig.bitDepth
      })

      this.setupRecorderEvents()
      
      console.log('Audio processor initialized:', {
        config: finalConfig,
        mimeType,
        sampleRate: this.audioContext.sampleRate
      })
      
    } catch (error) {
      console.error('Failed to initialize audio processor:', error)
      throw new Error('Audio initialization failed. Please check microphone permissions.')
    }
  }

  private getSupportedMimeType(format: string): string {
    const mimeTypes = [
      `audio/${format}`,
      `audio/webm;codecs=opus`,
      `audio/mp4`,
      `audio/wav`
    ]
    
    return mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm'
  }

  private setupRecorderEvents(): void {
    if (!this.mediaRecorder) return

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data)
      }
    }

    this.mediaRecorder.onstop = () => {
      console.log('Recording stopped, processing audio...')
    }

    this.mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event)
    }
  }

  async startRecording(): Promise<void> {
    if (!this.mediaRecorder) {
      throw new Error('Audio processor not initialized')
    }

    this.chunks = []
    this.mediaRecorder.start(100) // Collect data every 100ms
    console.log('High-quality recording started')
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.chunks, { type: 'audio/wav' })
        console.log('Recording completed:', {
          size: audioBlob.size,
          type: audioBlob.type,
          duration: 'calculated separately'
        })
        resolve(audioBlob)
      }

      this.mediaRecorder.stop()
    })
  }

  pauseRecording(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause()
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume()
    }
  }

  // Real-time audio quality analysis
  getAudioQualityMetrics(): AudioQualityMetrics {
    if (!this.analyser) {
      return { level: 0, noise: 0, clipping: false, silence: true }
    }

    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    this.analyser.getByteFrequencyData(dataArray)

    // Calculate audio level (RMS)
    const sum = dataArray.reduce((acc, value) => acc + value * value, 0)
    const rms = Math.sqrt(sum / bufferLength)
    const level = rms / 255

    // Detect clipping (values near maximum)
    const clipping = dataArray.some(value => value > 240)

    // Detect silence (very low levels)
    const silence = level < 0.01

    // Simple noise estimation (high frequency content)
    const highFreqStart = Math.floor(bufferLength * 0.7)
    const highFreqSum = dataArray.slice(highFreqStart).reduce((acc, val) => acc + val, 0)
    const noise = highFreqSum / (bufferLength * 0.3) / 255

    return { level, noise, clipping, silence }
  }

  // Convert audio to base64 for API transmission
  async audioToBase64(audioBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Remove data URL prefix to get pure base64
          const base64 = reader.result.split(',')[1]
          resolve(base64)
        } else {
          reject(new Error('Failed to convert audio to base64'))
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(audioBlob)
    })
  }

  // Clean up resources
  cleanup(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop()
      this.mediaRecorder = null
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    
    this.analyser = null
    this.chunks = []
    
    console.log('Audio processor cleaned up')
  }

  // Export audio in different formats
  async exportAudio(audioBlob: Blob, format: 'wav' | 'mp3'): Promise<Blob> {
    // For MVP, return the original blob
    // In production, this would convert between formats
    console.log(`Exporting audio as ${format}:`, audioBlob.size, 'bytes')
    return audioBlob
  }

  // Get recording state
  getState(): string {
    return this.mediaRecorder?.state || 'inactive'
  }

  // Check browser compatibility
  static isSupported(): boolean {
    return !!(
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof MediaRecorder !== 'undefined' &&
      typeof AudioContext !== 'undefined'
    )
  }

  // Get available audio devices
  static async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.filter(device => device.kind === 'audioinput')
    } catch (error) {
      console.error('Failed to enumerate audio devices:', error)
      return []
    }
  }
}