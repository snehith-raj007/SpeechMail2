# Sarvam AI Speech-to-Text Integration Guide

This guide explains how to integrate the standalone **`SpeechToTextAgent.js`** module into your main project using the **Sarvam AI Speech-to-Text API** (`https://api.sarvam.ai/speech-to-text`).

---

## 🔑 Configured API Credentials

- **API Subscription Key**: `<YOUR_SARVAM_API_KEY>`
- **STT Endpoint**: `https://api.sarvam.ai/speech-to-text`
- **Supported Models**: `saarika:v2.5` (Multi-lingual STT for 10+ Indian languages), `saaras:v3`
- **Supported Languages**: `en-IN`, `hi-IN`, `bn-IN`, `ta-IN`, `te-IN`, `mr-IN`, `es-ES`, `fr-FR`, `de-DE`

---

## ⚡ Quick Start Usage

### Vanilla JavaScript / ES Module

```javascript
import { SpeechToTextAgent } from './SpeechToTextAgent.js';

const agent = new SpeechToTextAgent({
  apiKey: '<YOUR_SARVAM_API_KEY>',
  useSarvamApi: true,
  model: 'saarika:v2.5',
  languageCode: 'en-IN', // or 'hi-IN', 'ta-IN', 'unknown'
  filterFillers: true,
  noiseFilter: true,
  glossary: ['MyProject', 'GraphQL', 'Kubernetes'],

  onSpeechStart: () => console.log('Sarvam STT Recording Started'),
  onSpeechEnd: () => console.log('Recording Ended, Transcribing...'),
  onInterimResult: (text) => console.log('Listening:', text),

  onFinalResult: (result) => {
    console.log('Sarvam STT Output:', result.text);
    console.log('Language Detected:', result.language);
    
    // 💡 Send transcribed speech directly to your main project's AI Voice Agent backend!
    sendToMainProjectVoiceAgent(result.text);
  },

  onError: (err) => console.error('Sarvam STT Error:', err)
});

// Controls
agent.start(); // Start listening & MediaRecorder
agent.stop();  // Stop & trigger Sarvam AI API transcription
```

---

### React / Next.js Component Integration

```jsx
import React, { useState, useEffect, useRef } from 'react';
import { SpeechToTextAgent } from './SpeechToTextAgent';

export function SarvamVoiceAgentComponent() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [status, setStatus] = useState('Ready');
  const agentRef = useRef(null);

  useEffect(() => {
    agentRef.current = new SpeechToTextAgent({
      apiKey: '<YOUR_SARVAM_API_KEY>',

      useSarvamApi: true,
      model: 'saarika:v2.5',
      languageCode: 'en-IN',
      onSpeechStart: () => {
        setIsRecording(true);
        setStatus('Listening...');
      },
      onSpeechEnd: () => {
        setIsRecording(false);
        setStatus('Transcribing via Sarvam AI...');
      },
      onFinalResult: (result) => {
        setStatus('Sarvam AI Transcribed');
        setTranscripts((prev) => [...prev, result.text]);
      }
    });

    return () => {
      if (agentRef.current) agentRef.current.stop();
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      agentRef.current.stop();
    } else {
      agentRef.current.start();
    }
  };

  return (
    <div className="sarvam-stt-box">
      <h3>Sarvam AI Voice Agent ({status})</h3>
      <button onClick={toggleRecording}>
        {isRecording ? '⏹️ Stop & Transcribe' : '🎙️ Record Speech'}
      </button>

      <div className="transcripts-list">
        {transcripts.map((text, idx) => (
          <p key={idx}>{text}</p>
        ))}
      </div>
    </div>
  );
}
```
