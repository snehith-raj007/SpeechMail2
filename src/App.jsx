import React, { useState, useEffect, useRef } from 'react';

// Services
import { SpeechToTextAgent } from './services/SpeechToTextAgent.js';
import { GroqAgentEngine } from './services/GroqAgentEngine.js';
import { GmailService } from './services/GmailService.js';
import { PlanningAgent } from './services/PlanningAgent.js';
import { GoogleCalendarService } from './services/GoogleCalendarService.js';
import { api } from './services/api.js';

// Components
import { Header } from './components/Header.jsx';
import { Hero } from './components/Hero.jsx';
import { VoiceRecorder } from './components/VoiceRecorder.jsx';
import { SpeechTranscript } from './components/SpeechTranscript.jsx';
import { AIPipelineStepper } from './components/AIPipelineStepper.jsx';
import { ContextExtraction } from './components/ContextExtraction.jsx';
import { GeneratedEmail } from './components/GeneratedEmail.jsx';
import { GmailInbox } from './components/GmailInbox.jsx';
import { SchedulePlanner } from './components/SchedulePlanner.jsx';
import { EmailHistory } from './components/EmailHistory.jsx';
import { GmailModal } from './components/GmailModal.jsx';
import { CalendarApiModal } from './components/CalendarApiModal.jsx';
import { Footer } from './components/Footer.jsx';

export default function App() {
  // Service Instances
  const gmailServiceRef = useRef(new GmailService());
  const planningAgentRef = useRef(new PlanningAgent());
  const calendarServiceRef = useRef(new GoogleCalendarService());
  const groqEngineRef = useRef(new GroqAgentEngine());
  const sttAgentRef = useRef(null);

  // App State
  const [activeLanguage, setActiveLanguage] = useState('en-IN');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [statusText, setStatusText] = useState('Sarvam AI Ready');

  const [transcript, setTranscript] = useState('');
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [interimText, setInterimText] = useState('');

  const [currentStep, setCurrentStep] = useState(1);
  const [pipelineStatus, setPipelineStatus] = useState('Idle');

  const [contextData, setContextData] = useState(null);
  const [generatedEmail, setGeneratedEmail] = useState(null);

  const [inboxMessages, setInboxMessages] = useState([]);
  const [events, setEvents] = useState([]);
  const [conflictBanner, setConflictBanner] = useState(null);
  const [history, setHistory] = useState([]);

  // Modals
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  // Timer Ref
  const timerIntervalRef = useRef(null);

  // Load Neon DB data on mount
  useEffect(() => {
    async function loadData() {
      // 1. Fetch History from Neon DB
      const dbHistory = await api.fetchHistory();
      if (dbHistory && dbHistory.length > 0) {
        setHistory(dbHistory);
      }

      // 2. Fetch Events from Neon DB
      const dbEvents = await planningAgentRef.current.loadEventsFromDB();
      setEvents(dbEvents || []);

      // 3. Fetch Inbox from Neon DB
      const dbInbox = await gmailServiceRef.current.getInboxMessages();
      setInboxMessages(dbInbox || []);
    }
    loadData();
  }, []);

  // Initialize SpeechToTextAgent
  useEffect(() => {
    sttAgentRef.current = new SpeechToTextAgent({
      apiKey: (import.meta && import.meta.env && import.meta.env.VITE_SARVAM_API_KEY) || '',

      useSarvamApi: true,
      model: 'saarika:v2.5',
      languageCode: activeLanguage,
      onSpeechStart: () => {
        setIsRecording(true);
        setStatusText('Listening for Speech...');
      },
      onSpeechEnd: () => {
        setIsRecording(false);
        setStatusText('Sarvam AI Ready');
      },
      onInterimResult: (text) => setInterimText(text),
      onFinalResult: (result) => {
        setTranscript((prev) => (prev ? `${prev} ${result.text}` : result.text));
        setInterimText('');
        setStatusText('Sarvam AI Transcribed');
      },
      onError: (err) => {
        console.warn('STT Error:', err);
        setStatusText('Ready');
      }
    });
  }, [activeLanguage]);

  // Recording timer control
  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  // Recording Actions
  const handleStartRecording = () => {
    if (sttAgentRef.current) {
      sttAgentRef.current.start();
    }
  };

  const handleStopRecording = () => {
    if (sttAgentRef.current) {
      sttAgentRef.current.stop();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setStatusText('Transcribing File with Sarvam AI...');

    try {
      if (sttAgentRef.current) {
        await sttAgentRef.current.transcribeWithSarvam(file);
        setStatusText('Sarvam AI Transcribed');
      }
    } catch (err) {
      alert('Error transcribing audio file: ' + err.message);
      setStatusText('Ready');
    }
  };

  const handleSampleDictation = () => {
    const sample = "Respected Sir, I am writing to request one day leave for tomorrow because my mother is unwell and admitted to hospital. Kindly approve my leave. Thank you, Raj.";
    setTranscript(sample);
  };

  // Run Groq AI Multi-Agent Pipeline
  const handleRunPipeline = async () => {
    if (!transcript || !transcript.trim()) {
      alert('Please record or type a transcript first!');
      return;
    }

    setPipelineStatus('Processing Pipeline...');
    setCurrentStep(1);

    try {
      const result = await groqEngineRef.current.runPipeline(transcript, (stepNum, stepName) => {
        setCurrentStep(stepNum);
      });

      setCurrentStep(5);
      setPipelineStatus('Complete');
      setContextData(result.context);
      setGeneratedEmail(result.email);

      // Save to Neon DB history
      const historyItem = {
        id: `hist-${Date.now()}`,
        subject: result.email.subject,
        to: 'manager@techcorp.com',
        greeting: result.email.greeting,
        body: result.email.body,
        closing: result.email.closing,
        signature: result.email.signature,
        transcript,
        intent: result.context.intent,
        recipient: result.context.recipient,
        email_type: result.context.email_type,
        tone: result.context.tone,
        key_points: result.context.key_points,
        important_dates: result.context.important_dates,
        requested_action: result.context.requested_action,
        timestamp: new Date().toISOString()
      };

      setHistory((prev) => [historyItem, ...prev]);
      await api.saveHistoryItem(historyItem);

      // Scroll to email component
      document.getElementById('containerEmail')?.scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
      console.error('Pipeline Error:', err);
      alert('Error running AI pipeline: ' + err.message);
      setPipelineStatus('Error');
    }
  };

  // Email Actions
  const handleSendGmail = async (emailPayload) => {
    try {
      const res = await gmailServiceRef.current.sendEmailDirect(
        emailPayload.to,
        emailPayload.subject,
        emailPayload.body,
        emailPayload
      );
      alert(res.message || `Email successfully sent to ${emailPayload.to}!`);
    } catch (err) {
      alert(`Send Email Error: ${err.message}`);
    }
  };

  const handleCopyEmail = () => {
    if (!generatedEmail) return;
    const fullText = `${generatedEmail.greeting}\n\n${generatedEmail.body}\n\n${generatedEmail.closing}\n${generatedEmail.signature}`;
    navigator.clipboard.writeText(fullText);
    alert('Email copied to clipboard!');
  };

  const handleDownloadTxt = () => {
    if (!generatedEmail) return;
    const fullText = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.greeting}\n\n${generatedEmail.body}\n\n${generatedEmail.closing}\n${generatedEmail.signature}`;
    downloadFile(fullText, 'SpeechMail_Draft.txt', 'text/plain');
  };

  const handleDownloadMd = () => {
    if (!generatedEmail) return;
    const fullText = `# ${generatedEmail.subject}\n\n**Greeting**: ${generatedEmail.greeting}\n\n${generatedEmail.body}\n\n**Closing**: ${generatedEmail.closing}\n**Signature**: ${generatedEmail.signature}`;
    downloadFile(fullText, 'SpeechMail_Draft.md', 'text/markdown');
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  };

  // Calendar & Events
  const handleAddEvent = async (eventData) => {
    const res = await planningAgentRef.current.addEvent(eventData);
    if (!res.success) {
      setConflictBanner(res.message);
      return;
    }

    setConflictBanner(null);
    const updated = await planningAgentRef.current.loadEventsFromDB();
    setEvents([...updated]);
    alert(`Meeting '${res.event.title}' scheduled and saved to Neon DB & Google Calendar!`);
  };

  const handleRemoveEvent = async (eventId) => {
    await planningAgentRef.current.removeEvent(eventId);
    const updated = await planningAgentRef.current.loadEventsFromDB();
    setEvents([...updated]);
  };

  const handleReadGoogleCalendar = async () => {
    const calEvents = await calendarServiceRef.current.readCalendarEvents();
    if (calEvents) {
      setEvents(calEvents);
      alert(`Read ${calEvents.length} events from Google Calendar & Neon DB!`);
    } else {
      alert('Fetched active events from Neon DB!');
    }
  };

  // History Actions
  const handleDeleteHistoryItem = async (id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    await api.deleteHistoryItem(id);
  };

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear all history from Neon DB?')) {
      setHistory([]);
      await api.clearAllHistory();
    }
  };

  const handleLoadHistoryItem = (item) => {
    setTranscript(item.transcript || '');
    setContextData({
      intent: item.intent,
      recipient: item.recipient,
      email_type: item.email_type,
      tone: item.tone,
      key_points: item.key_points,
      important_dates: item.important_dates,
      requested_action: item.requested_action
    });
    setGeneratedEmail({
      subject: item.subject,
      greeting: item.greeting,
      body: item.body,
      closing: item.closing,
      signature: item.signature
    });
    document.getElementById('containerEmail')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div class="app-container">
      <Header
        activeLanguage={activeLanguage}
        setActiveLanguage={setActiveLanguage}
        onOpenGmailModal={() => setIsGmailModalOpen(true)}
        userEmail={gmailServiceRef.current.userEmail}
      />

      <Hero
        onStartRecording={() => {
          document.getElementById('containerRecorder')?.scrollIntoView({ behavior: 'smooth' });
          handleStartRecording();
        }}
        onTrySampleDictation={handleSampleDictation}
      />

      <main class="app-main-grid">
        <div class="workspace-column left-column">
          <VoiceRecorder
            isRecording={isRecording}
            onStart={handleStartRecording}
            onStop={handleStopRecording}
            recordingTime={recordingTime}
            audioUrl={audioUrl}
            statusText={statusText}
            onFileUpload={handleFileUpload}
          />

          <SpeechTranscript
            transcript={transcript}
            setTranscript={setTranscript}
            isEditing={isEditingTranscript}
            setIsEditing={setIsEditingTranscript}
            interimText={interimText}
            onGeneratePipeline={handleRunPipeline}
            onCopy={() => {
              navigator.clipboard.writeText(transcript);
              alert('Transcript copied to clipboard!');
            }}
            onClear={() => setTranscript('')}
          />
        </div>

        <div class="workspace-column right-column">
          <AIPipelineStepper
            currentStep={currentStep}
            pipelineStatus={pipelineStatus}
          />

          <ContextExtraction context={contextData} />

          <GeneratedEmail
            email={generatedEmail}
            onSendGmail={handleSendGmail}
            onCopyEmail={handleCopyEmail}
            onDownloadTxt={handleDownloadTxt}
            onDownloadMd={handleDownloadMd}
          />
        </div>
      </main>

      <GmailInbox
        inboxMessages={inboxMessages}
        onSyncInbox={async () => {
          const fresh = await gmailServiceRef.current.getInboxMessages();
          setInboxMessages(fresh);
          alert('Inbox messages synced from Neon DB!');
        }}
      />

      <SchedulePlanner
        events={events}
        onAddEvent={handleAddEvent}
        onRemoveEvent={handleRemoveEvent}
        onReadGoogleCalendar={handleReadGoogleCalendar}
        onOpenCalendarApiModal={() => setIsCalendarModalOpen(true)}
        conflictBanner={conflictBanner}
      />

      <EmailHistory
        history={history}
        onDeleteItem={handleDeleteHistoryItem}
        onClearAll={handleClearHistory}
        onLoadItem={handleLoadHistoryItem}
      />

      <Footer />

      <GmailModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        onSave={(emailVal, passVal) => {
          gmailServiceRef.current.setCredentials(emailVal, passVal);
          alert('Gmail credentials updated!');
        }}
        onDisconnect={() => {
          gmailServiceRef.current.disconnect();
          alert('Gmail account disconnected.');
        }}
        currentEmail={gmailServiceRef.current.userEmail}
        currentAppPassword={gmailServiceRef.current.appPassword}
      />

      <CalendarApiModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        onSave={(keyVal, calIdVal) => {
          calendarServiceRef.current.setApiKey(keyVal);
          if (calIdVal) calendarServiceRef.current.calendarId = calIdVal;
          alert('Google Calendar API Key saved!');
        }}
        currentApiKey={calendarServiceRef.current.apiKey}
        currentCalendarId={calendarServiceRef.current.calendarId}
      />
    </div>
  );
}
