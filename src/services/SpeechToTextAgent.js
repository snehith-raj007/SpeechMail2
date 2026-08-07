/**
 * SpeechToTextAgent.js
 * Standalone Speech-to-Text (STT) Voice Agent Engine
 * Integrated with Sarvam AI API (saarika:v2.5 / saaras:v3)
 */

export class SpeechToTextAgent {
  constructor(options = {}) {
    this.options = {
      apiKey: options.apiKey || (import.meta && import.meta.env && import.meta.env.VITE_SARVAM_API_KEY) || '',

      useSarvamApi: options.useSarvamApi !== undefined ? options.useSarvamApi : true,
      model: options.model || 'saarika:v2.5',
      languageCode: options.languageCode || 'unknown',
      language: options.language || 'en-US',
      continuous: options.continuous !== undefined ? options.continuous : true,
      filterFillers: options.filterFillers !== undefined ? options.filterFillers : true,
      noiseFilter: options.noiseFilter !== undefined ? options.noiseFilter : true,
      glossary: options.glossary || [],
      onSpeechStart: options.onSpeechStart || (() => {}),
      onSpeechEnd: options.onSpeechEnd || (() => {}),
      onInterimResult: options.onInterimResult || (() => {}),
      onFinalResult: options.onFinalResult || (() => {}),
      onAudioLevel: options.onAudioLevel || (() => {}),
      onError: options.onError || (() => {})
    };

    this.isRecording = false;
    this.recognition = null;
    this.audioContext = null;
    this.analyser = null;
    this.micStream = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.animFrame = null;
    this.transcriptHistory = [];

    this._initSpeechRecognition();
  }

  _initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = this.options.continuous;
      this.recognition.interimResults = true;
      this.recognition.lang = this.options.language;

      this.recognition.onstart = () => {
        this.isRecording = true;
        this.options.onSpeechStart();
      };

      this.recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const rawText = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            if (!this.options.useSarvamApi) {
              const cleanedText = this.cleanText(rawText);
              const segment = {
                id: Date.now(),
                text: cleanedText,
                confidence: Math.round((event.results[i][0].confidence || 0.96) * 100),
                timestamp: new Date().toISOString()
              };
              this.transcriptHistory.push(segment);
              this.options.onFinalResult(segment);
            }
          } else {
            interim += rawText;
          }
        }
        if (interim) {
          this.options.onInterimResult(this.cleanText(interim));
        }
      };

      this.recognition.onerror = (err) => {
        this.options.onError(err);
      };

      this.recognition.onend = () => {
        if (this.isRecording && this.options.continuous) {
          try {
            this.recognition.start();
          } catch (e) {}
        } else {
          this.isRecording = false;
          this.options.onSpeechEnd();
        }
      };
    }
  }

  async transcribeWithSarvam(audioBlob) {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.wav');
      formData.append('model', this.options.model);
      if (this.options.languageCode && this.options.languageCode !== 'unknown') {
        formData.append('language_code', this.options.languageCode);
      }

      const response = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: {
          'api-subscription-key': this.options.apiKey
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Sarvam API returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const transcribedText = this.cleanText(data.transcript || '');

      if (transcribedText) {
        const segment = {
          id: Date.now(),
          text: transcribedText,
          language: data.language_code || this.options.languageCode,
          confidence: 99,
          timestamp: new Date().toISOString(),
          source: 'Sarvam AI'
        };
        this.transcriptHistory.push(segment);
        this.options.onFinalResult(segment);
      }

      return data;
    } catch (err) {
      console.error('[SpeechToTextAgent] Sarvam API Error:', err);
      this.options.onError(err);
      throw err;
    }
  }

  async _startAudioDSP() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 128;

      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: this.options.noiseFilter,
          autoGainControl: true
        }
      };

      this.micStream = await navigator.mediaDevices.getUserMedia(constraints);
      const source = this.audioContext.createMediaStreamSource(this.micStream);
      source.connect(this.analyser);

      if (this.options.useSarvamApi) {
        this.audioChunks = [];
        this.mediaRecorder = new MediaRecorder(this.micStream);
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) this.audioChunks.push(e.data);
        };
        this.mediaRecorder.onstop = async () => {
          if (this.audioChunks.length > 0) {
            const blob = new Blob(this.audioChunks, { type: 'audio/wav' });
            this.audioChunks = [];
            await this.transcribeWithSarvam(blob);
          }
        };
        this.mediaRecorder.start();
      }

      this._listenAudioLevel();
    } catch (e) {
      console.warn('[SpeechToTextAgent] Audio DSP error:', e);
    }
  }

  _listenAudioLevel() {
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    const checkLevel = () => {
      if (!this.isRecording) return;
      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = Math.round(sum / dataArray.length);
      this.options.onAudioLevel(avg);
      this.animFrame = requestAnimationFrame(checkLevel);
    };
    checkLevel();
  }

  async start() {
    if (this.isRecording) return;
    this.isRecording = true;
    await this._startAudioDSP();

    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {}
    }
  }

  stop() {
    this.isRecording = false;

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }

    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
    }

    this.options.onSpeechEnd();
  }

  cleanText(text) {
    if (!text) return '';
    let result = text;
    if (this.options.filterFillers) {
      result = result.replace(/\b(um|uh|you know|like|er|ah)\b/gi, '');
    }
    return result.replace(/\s+/g, ' ').trim();
  }
}
