/* ==========================================================================
   SpeechMail AI - Main Application Logic
   Integrates Sarvam AI STT, Groq Multi-Agent Pipeline, Gmail Service & Google Calendar API Engine
   ========================================================================== */

import { SpeechToTextAgent } from './SpeechToTextAgent.js';
import { GroqAgentEngine } from './GroqAgentEngine.js';
import { GmailService } from './GmailService.js';
import { PlanningAgent } from './PlanningAgent.js';
import { GoogleCalendarService } from './GoogleCalendarService.js';

document.addEventListener('DOMContentLoaded', () => {

  // Instantiate Core Services & Agents
  const gmailService = new GmailService();
  const planningAgent = new PlanningAgent();
  const googleCalendarService = new GoogleCalendarService();
  const groqEngine = new GroqAgentEngine();
  let sttAgent = null;

  // State Management
  const state = {
    apiKeySarvam: '',

    sarvamModel: 'saarika:v2.5',
    activeLanguage: 'en-IN',
    isRecording: false,
    timerInterval: null,
    recordingSeconds: 0,
    
    // Audio Context & Stream
    mediaRecorder: null,
    audioChunks: [],
    recordedAudioUrl: null,
    audioContext: null,
    analyser: null,
    animFrame: null,

    // Transcripts & Pipeline
    transcriptText: '',
    isEditingTranscript: false,
    currentPipelineResult: null,

    // Active Calendar Schedule Events
    activeCalendarEvents: [...planningAgent.calendarEvents],

    // Local Storage History
    emailHistory: JSON.parse(localStorage.getItem('speechmail_history') || '[]')
  };

  // DOM Elements
  const elements = {
    // Header & Nav
    langSelect: document.getElementById('langSelect'),
    statusIndicator: document.getElementById('statusIndicator'),
    statusText: document.getElementById('statusText'),
    btnOpenGmailModal: document.getElementById('btnOpenGmailModal'),
    gmailBadgeText: document.getElementById('gmailBadgeText'),

    // Hero Section
    btnHeroStartRecording: document.getElementById('btnHeroStartRecording'),
    btnDemoLeaveEmail: document.getElementById('btnDemoLeaveEmail'),

    // Recorder Container
    waveCanvas: document.getElementById('waveCanvas'),
    micGlowRing: document.getElementById('micGlowRing'),
    btnStartRecording: document.getElementById('btnStartRecording'),
    btnStopRecording: document.getElementById('btnStopRecording'),
    recordingTimer: document.getElementById('recordingTimer'),
    audioPlaybackContainer: document.getElementById('audioPlaybackContainer'),
    audioPlayer: document.getElementById('audioPlayer'),
    playbackLabel: document.getElementById('playbackLabel'),
    btnUploadAudio: document.getElementById('btnUploadAudio'),
    audioFileInput: document.getElementById('audioFileInput'),

    // Transcript Container
    statWordCount: document.getElementById('statWordCount'),
    btnToggleEditTranscript: document.getElementById('btnToggleEditTranscript'),
    btnCopyTranscript: document.getElementById('btnCopyTranscript'),
    btnClearTranscript: document.getElementById('btnClearTranscript'),
    emptyTranscriptState: document.getElementById('emptyTranscriptState'),
    transcriptStream: document.getElementById('transcriptStream'),
    transcriptDisplayArea: document.getElementById('transcriptDisplayArea'),
    transcriptEditArea: document.getElementById('transcriptEditArea'),
    txtEditableTranscript: document.getElementById('txtEditableTranscript'),
    interimBox: document.getElementById('interimBox'),
    interimText: document.getElementById('interimText'),
    btnGenerateEmailPipeline: document.getElementById('btnGenerateEmailPipeline'),

    // Pipeline Container
    pipelineStatusTag: document.getElementById('pipelineStatusTag'),
    steps: [
      document.getElementById('step1'),
      document.getElementById('step2'),
      document.getElementById('step3'),
      document.getElementById('step4'),
      document.getElementById('step5')
    ],

    // Context Container
    emptyContextState: document.getElementById('emptyContextState'),
    contextGrid: document.getElementById('contextGrid'),
    ctxIntent: document.getElementById('ctxIntent'),
    ctxRecipient: document.getElementById('ctxRecipient'),
    ctxType: document.getElementById('ctxType'),
    ctxTone: document.getElementById('ctxTone'),
    ctxKeyPoints: document.getElementById('ctxKeyPoints'),
    ctxDates: document.getElementById('ctxDates'),
    ctxAction: document.getElementById('ctxAction'),

    // Generated Email Container
    emptyEmailState: document.getElementById('emptyEmailState'),
    emailDocumentCard: document.getElementById('emailDocumentCard'),
    inputEmailTo: document.getElementById('inputEmailTo'),
    emailSubject: document.getElementById('emailSubject'),
    emailGreeting: document.getElementById('emailGreeting'),
    emailBody: document.getElementById('emailBody'),
    emailClosing: document.getElementById('emailClosing'),
    emailSignature: document.getElementById('emailSignature'),
    btnSendGmailDirect: document.getElementById('btnSendGmailDirect'),
    btnEditEmail: document.getElementById('btnEditEmail'),
    btnCopyEmail: document.getElementById('btnCopyEmail'),
    btnDownloadEmail: document.getElementById('btnDownloadEmail'),
    btnSaveEmailEdits: document.getElementById('btnSaveEmailEdits'),
    btnCopyEmailQuick: document.getElementById('btnCopyEmailQuick'),
    btnDownloadTxt: document.getElementById('btnDownloadTxt'),
    btnDownloadMd: document.getElementById('btnDownloadMd'),

    // Gmail Inbox Container
    inboxList: document.getElementById('inboxList'),
    btnSyncInbox: document.getElementById('btnSyncInbox'),
    inputInboxSearch: document.getElementById('inputInboxSearch'),

    // Schedule & Google Calendar API Planner Container
    scheduleStatusBanner: document.getElementById('scheduleStatusBanner'),
    eventsList: document.getElementById('eventsList'),
    formAddEvent: document.getElementById('formAddEvent'),
    inputEventTitle: document.getElementById('inputEventTitle'),
    inputEventDate: document.getElementById('inputEventDate'),
    inputEventTime: document.getElementById('inputEventTime'),
    inputEventAttendees: document.getElementById('inputEventAttendees'),
    btnConnectCalendarOAuth: document.getElementById('btnConnectCalendarOAuth'),
    btnOpenCalendarApiModal: document.getElementById('btnOpenCalendarApiModal'),
    btnReadGoogleCalendar: document.getElementById('btnReadGoogleCalendar'),
    btnDownloadScheduleIcs: document.getElementById('btnDownloadScheduleIcs'),

    // History Container
    inputHistorySearch: document.getElementById('inputHistorySearch'),
    selectHistoryFilter: document.getElementById('selectHistoryFilter'),
    btnClearHistory: document.getElementById('btnClearHistory'),
    historyList: document.getElementById('historyList'),
    emptyHistoryState: document.getElementById('emptyHistoryState'),

    // Modals
    gmailModal: document.getElementById('gmailModal'),
    btnCloseGmailModal: document.getElementById('btnCloseGmailModal'),
    formConnectGmail: document.getElementById('formConnectGmail'),
    inputGmailEmail: document.getElementById('inputGmailEmail'),
    inputGmailAppPassword: document.getElementById('inputGmailAppPassword'),
    btnDisconnectGmail: document.getElementById('btnDisconnectGmail'),

    calendarApiModal: document.getElementById('calendarApiModal'),
    btnCloseCalendarApiModal: document.getElementById('btnCloseCalendarApiModal'),
    formConnectCalendarApi: document.getElementById('formConnectCalendarApi'),
    inputCalendarApiKey: document.getElementById('inputCalendarApiKey'),
    inputCalendarId: document.getElementById('inputCalendarId')
  };

  // Initialize SpeechToTextAgent
  function initSttAgent() {
    sttAgent = new SpeechToTextAgent({
      apiKey: state.apiKeySarvam,
      useSarvamApi: true,
      model: state.sarvamModel,
      languageCode: state.activeLanguage,
      
      onSpeechStart: () => setRecordingState(true),
      onSpeechEnd: () => setRecordingState(false),
      onInterimResult: (text) => {
        if (text) {
          elements.interimBox.style.display = 'flex';
          elements.interimText.textContent = text;
        } else {
          elements.interimBox.style.display = 'none';
        }
      },
      onFinalResult: (result) => {
        appendTranscriptText(result.text);
        updateStatus('active', 'Sarvam AI Transcribed');
      },
      onError: (err) => {
        console.warn("STT Error:", err);
        updateStatus('active', 'Ready');
      }
    });
  }

  // --------------------------------------------------------------------------
  // Event Listeners Setup
  // --------------------------------------------------------------------------
  function setupEventListeners() {
    // Language selection
    elements.langSelect.addEventListener('change', (e) => {
      state.activeLanguage = e.target.value;
      if (sttAgent) sttAgent.options.languageCode = state.activeLanguage;
    });

    // Gmail Modal & Credentials
    if (elements.btnOpenGmailModal) elements.btnOpenGmailModal.addEventListener('click', openGmailModal);
    if (elements.btnCloseGmailModal) elements.btnCloseGmailModal.addEventListener('click', () => elements.gmailModal.classList.remove('open'));
    if (elements.formConnectGmail) elements.formConnectGmail.addEventListener('submit', handleSaveGmailCredentials);
    if (elements.btnDisconnectGmail) elements.btnDisconnectGmail.addEventListener('click', handleDisconnectGmail);

    // Google Calendar API Modal
    if (elements.btnOpenCalendarApiModal) {
      elements.btnOpenCalendarApiModal.addEventListener('click', () => {
        elements.inputCalendarApiKey.value = googleCalendarService.apiKey;
        elements.inputCalendarId.value = googleCalendarService.calendarId;
        elements.calendarApiModal.classList.add('open');
      });
    }
    if (elements.btnCloseCalendarApiModal) elements.btnCloseCalendarApiModal.addEventListener('click', () => elements.calendarApiModal.classList.remove('open'));
    if (elements.formConnectCalendarApi) elements.formConnectCalendarApi.addEventListener('submit', handleSaveCalendarApiKey);

    // Google Calendar API READ Operation
    if (elements.btnReadGoogleCalendar) elements.btnReadGoogleCalendar.addEventListener('click', handleReadGoogleCalendarEvents);

    // Recording triggers
    elements.btnStartRecording.addEventListener('click', startRecording);
    elements.btnHeroStartRecording.addEventListener('click', () => {
      document.getElementById('containerRecorder').scrollIntoView({ behavior: 'smooth' });
      startRecording();
    });
    elements.btnStopRecording.addEventListener('click', stopRecording);

    // Audio file upload & Demo dictation
    elements.btnUploadAudio.addEventListener('click', () => elements.audioFileInput.click());
    elements.audioFileInput.addEventListener('change', handleAudioFileUpload);
    elements.btnDemoLeaveEmail.addEventListener('click', runSampleDictation);

    // Transcript toolbar
    elements.btnToggleEditTranscript.addEventListener('click', toggleEditTranscript);
    elements.txtEditableTranscript.addEventListener('input', (e) => {
      state.transcriptText = e.target.value;
      updateWordCount();
    });
    elements.btnCopyTranscript.addEventListener('click', copyTranscript);
    elements.btnClearTranscript.addEventListener('click', clearTranscript);

    // AI Email Pipeline Trigger
    elements.btnGenerateEmailPipeline.addEventListener('click', () => {
      if (!state.transcriptText.trim()) {
        alert("Please record or enter a speech transcript first.");
        return;
      }
      runAiPipeline(state.transcriptText);
    });

    // Send Email Direct via Gmail
    elements.btnSendGmailDirect.addEventListener('click', sendEmailViaGmail);

    // Email Editing & Downloads
    elements.btnEditEmail.addEventListener('click', toggleEmailEditMode);
    elements.btnSaveEmailEdits.addEventListener('click', saveEmailEdits);
    elements.btnCopyEmail.addEventListener('click', copyEmailToClipboard);
    elements.btnCopyEmailQuick.addEventListener('click', copyEmailToClipboard);
    elements.btnDownloadEmail.addEventListener('click', downloadEmailTxt);
    elements.btnDownloadTxt.addEventListener('click', downloadEmailTxt);
    elements.btnDownloadMd.addEventListener('click', downloadEmailMd);

    // Inbox Sync & Search
    elements.btnSyncInbox.addEventListener('click', renderInboxMails);
    elements.inputInboxSearch.addEventListener('input', renderInboxMails);

    // Calendar Quick Add (Write to Google Calendar) & ICS Export
    elements.formAddEvent.addEventListener('submit', handleAddCalendarEvent);
    elements.btnDownloadScheduleIcs.addEventListener('click', downloadScheduleIcs);

    // History controls
    elements.inputHistorySearch.addEventListener('input', renderHistoryList);
    elements.selectHistoryFilter.addEventListener('change', renderHistoryList);
    elements.btnClearHistory.addEventListener('click', clearAllHistory);
  }

  // --------------------------------------------------------------------------
  // Google Calendar API (READ, WRITE, APPEND Operations)
  // --------------------------------------------------------------------------
  function handleSaveCalendarApiKey(e) {
    e.preventDefault();
    const key = elements.inputCalendarApiKey.value.trim();
    const calId = elements.inputCalendarId.value.trim();

    googleCalendarService.setApiKey(key);
    googleCalendarService.setCalendarId(calId);

    elements.calendarApiModal.classList.remove('open');
    alert("Google Calendar API Key saved! You can now perform live Read, Write, and Append operations.");
    handleReadGoogleCalendarEvents();
  }

  // 1. READ OPERATION: Fetch events from Google Calendar API
  async function handleReadGoogleCalendarEvents() {
    const origBtnText = elements.btnReadGoogleCalendar.innerHTML;
    elements.btnReadGoogleCalendar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Reading API...';

    try {
      const gcalEvents = await googleCalendarService.readEvents({ maxResults: 15 });
      if (gcalEvents && gcalEvents.length > 0) {
        state.activeCalendarEvents = [...gcalEvents, ...state.activeCalendarEvents.filter(e => e.source !== 'Google Calendar API')];
        updateCalendarUI();
        alert(`Successfully fetched ${gcalEvents.length} events from Google Calendar API!`);
      } else {
        alert("Google Calendar API Key read complete. No new events returned or using active schedule cache.");
      }
    } catch (err) {
      alert(`Google Calendar API Read Warning: ${err.message}`);
    } finally {
      elements.btnReadGoogleCalendar.innerHTML = origBtnText;
    }
  }

  // 2. WRITE OPERATION: Create/Insert Event into Google Calendar API
  async function handleAddCalendarEvent(e) {
    e.preventDefault();
    const title = elements.inputEventTitle.value.trim();
    const date = elements.inputEventDate.value;
    const startTime = elements.inputEventTime.value;
    const attendeesStr = elements.inputEventAttendees.value.trim() || 'team@techcorp.com';
    const attendees = attendeesStr.split(',').map(s => s.trim());

    if (!title || !date || !startTime) return;

    const textToPlan = `Schedule ${title} on ${date} at ${startTime} with ${attendeesStr}`;
    const planResult = planningAgent.processSpeechToPlan(textToPlan, state.activeCalendarEvents);

    const eventToSave = planResult && planResult.event ? planResult.event : {
      id: 'evt-' + Date.now(),
      title,
      date,
      startTime,
      endTime: '15:00',
      attendees,
      description: 'Created via SpeechMail AI'
    };

    // Call Google Calendar Service WRITE operation
    const createdEvt = await googleCalendarService.createEvent(eventToSave);

    // Save to active state without duplicating
    if (!state.activeCalendarEvents.some(e => e.id === createdEvt.id || (e.title === createdEvt.title && e.date === createdEvt.date && e.startTime === createdEvt.startTime))) {
      state.activeCalendarEvents.unshift(createdEvt);
    }

    updateCalendarUI(planResult);
    elements.formAddEvent.reset();
    alert(`Event '${title}' successfully scheduled and written to Google Calendar!`);
  }

  // 3. APPEND/UPDATE OPERATION: Append attendees or update description
  async function handleAppendAttendeesToEvent(eventId, newAttendeeEmail) {
    if (!newAttendeeEmail) return;
    try {
      const targetEvt = state.activeCalendarEvents.find(e => e.id === eventId);
      if (targetEvt) {
        if (!Array.isArray(targetEvt.attendees)) targetEvt.attendees = [targetEvt.attendees];
        if (!targetEvt.attendees.includes(newAttendeeEmail)) {
          targetEvt.attendees.push(newAttendeeEmail);
        }
        await googleCalendarService.createEvent(targetEvt);
      }
      alert(`Appended ${newAttendeeEmail} to event! Automatically saved to Google Calendar.`);
      updateCalendarUI();
    } catch (err) {
      alert(`Appended ${newAttendeeEmail} to event!`);
      updateCalendarUI();
    }
  }

  // --------------------------------------------------------------------------
  // Gmail Account Integration
  // --------------------------------------------------------------------------
  function updateGmailStatusUI() {
    if (gmailService.connected) {
      elements.btnOpenGmailModal.classList.add('connected');
      elements.gmailBadgeText.textContent = gmailService.userEmail || 'Gmail Connected';
      elements.inputGmailEmail.value = gmailService.userEmail;
      elements.inputGmailAppPassword.value = gmailService.appPassword;
      elements.btnDisconnectGmail.style.display = 'inline-flex';
    } else {
      elements.btnOpenGmailModal.classList.remove('connected');
      elements.gmailBadgeText.textContent = 'Connect Gmail';
      elements.btnDisconnectGmail.style.display = 'none';
    }
  }

  function openGmailModal() {
    updateGmailStatusUI();
    elements.gmailModal.classList.add('open');
  }

  function handleSaveGmailCredentials(e) {
    e.preventDefault();
    const email = elements.inputGmailEmail.value.trim();
    const pass = elements.inputGmailAppPassword.value.trim();

    if (!email || !pass) return;
    gmailService.saveCredentials(email, pass);
    updateGmailStatusUI();
    elements.gmailModal.classList.remove('open');
    alert(`Gmail account (${email}) successfully connected to SpeechMail AI!`);
  }

  function handleDisconnectGmail() {
    gmailService.disconnect();
    updateGmailStatusUI();
    elements.gmailModal.classList.remove('open');
  }

  async function sendEmailViaGmail() {
    const to = elements.inputEmailTo.value.trim();
    const subject = elements.emailSubject.innerText || elements.emailSubject.textContent;
    const salutation = elements.emailGreeting.innerText || elements.emailGreeting.textContent;
    const body = elements.emailBody.innerText || elements.emailBody.textContent;
    const closing = elements.emailClosing.innerText || elements.emailClosing.textContent;
    const signature = elements.emailSignature.innerText || elements.emailSignature.textContent;

    if (!to) {
      alert("Please enter a valid recipient 'To' email address.");
      elements.inputEmailTo.focus();
      return;
    }

    const origBtnContent = elements.btnSendGmailDirect.innerHTML;
    elements.btnSendGmailDirect.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
    elements.btnSendGmailDirect.disabled = true;

    try {
      const res = await gmailService.sendEmail({ to, subject, body, salutation, closing, signature });
      elements.btnSendGmailDirect.innerHTML = '<i class="fa-solid fa-circle-check"></i> Sent!';
      setTimeout(() => {
        elements.btnSendGmailDirect.innerHTML = origBtnContent;
        elements.btnSendGmailDirect.disabled = false;
      }, 2500);
      alert(res.message || `Message successfully sent to ${to}!`);
    } catch (err) {
      alert(`Email sending notification: ${err.message}`);
      elements.btnSendGmailDirect.innerHTML = origBtnContent;
      elements.btnSendGmailDirect.disabled = false;
    }
  }

  // --------------------------------------------------------------------------
  // Voice Recording & Visualizer
  // --------------------------------------------------------------------------
  async function startRecording() {
    if (state.isRecording) return;
    try {
      state.audioChunks = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      state.mediaRecorder = new MediaRecorder(stream);
      state.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) state.audioChunks.push(e.data);
      };

      state.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(state.audioChunks, { type: 'audio/wav' });
        state.recordedAudioUrl = URL.createObjectURL(audioBlob);
        
        elements.audioPlaybackContainer.style.display = 'flex';
        elements.audioPlayer.src = state.recordedAudioUrl;
        elements.playbackLabel.textContent = 'Recorded Voice Clip';

        if (sttAgent) sttAgent.transcribeWithSarvam(audioBlob);
      };

      state.mediaRecorder.start();
      setRecordingState(true);

      if (sttAgent) sttAgent.start();
      startVisualizer(stream);
    } catch (err) {
      alert("Microphone permission is required to record speech.");
    }
  }

  function stopRecording() {
    if (!state.isRecording) return;
    if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
      state.mediaRecorder.stop();
    }
    if (sttAgent) sttAgent.stop();
    setRecordingState(false);
  }

  function setRecordingState(isRec) {
    state.isRecording = isRec;
    if (isRec) {
      elements.btnStartRecording.disabled = true;
      elements.btnStopRecording.disabled = false;
      elements.micGlowRing.classList.add('active');
      updateStatus('recording', 'Sarvam AI Listening...');
      startTimer();
      resetPipelineSteps();
      setPipelineStep(1, 'active');
    } else {
      elements.btnStartRecording.disabled = false;
      elements.btnStopRecording.disabled = true;
      elements.micGlowRing.classList.remove('active');
      updateStatus('active', 'Transcribing...');
      stopTimer();
      setPipelineStep(1, 'completed');
    }
  }

  function startTimer() {
    stopTimer();
    state.recordingSeconds = 0;
    elements.recordingTimer.textContent = '00:00';
    state.timerInterval = setInterval(() => {
      state.recordingSeconds++;
      const mins = String(Math.floor(state.recordingSeconds / 60)).padStart(2, '0');
      const secs = String(state.recordingSeconds % 60).padStart(2, '0');
      elements.recordingTimer.textContent = `${mins}:${secs}`;
    }, 1000);
  }

  function stopTimer() {
    if (state.timerInterval) clearInterval(state.timerInterval);
  }

  function startVisualizer(stream) {
    if (!state.audioContext) {
      state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const source = state.audioContext.createMediaStreamSource(stream);
    state.analyser = state.audioContext.createAnalyser();
    state.analyser.fftSize = 64;
    source.connect(state.analyser);

    const canvas = elements.waveCanvas;
    const ctx = canvas.getContext('2d');
    const bufferLength = state.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      if (!state.isRecording) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      state.animFrame = requestAnimationFrame(draw);
      state.analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = `rgba(6, 182, 212, ${0.4 + dataArray[i] / 255})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 2;
      }
    }
    draw();
  }

  function handleAudioFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    state.recordedAudioUrl = URL.createObjectURL(file);
    elements.audioPlaybackContainer.style.display = 'flex';
    elements.audioPlayer.src = state.recordedAudioUrl;
    elements.playbackLabel.textContent = file.name;

    updateStatus('recording', 'Transcribing Audio File...');
    setPipelineStep(1, 'active');

    if (sttAgent) {
      sttAgent.transcribeWithSarvam(file).then(() => {
        setPipelineStep(1, 'completed');
      });
    }
  }

  // --------------------------------------------------------------------------
  // Transcript Handling
  // --------------------------------------------------------------------------
  function appendTranscriptText(text) {
    if (!text) return;
    state.transcriptText = state.transcriptText ? state.transcriptText + ' ' + text : text;
    renderTranscript();
  }

  function renderTranscript() {
    if (state.transcriptText.trim()) {
      elements.emptyTranscriptState.style.display = 'none';
      elements.transcriptStream.textContent = state.transcriptText;
      elements.txtEditableTranscript.value = state.transcriptText;
    } else {
      elements.emptyTranscriptState.style.display = 'flex';
      elements.transcriptStream.textContent = '';
      elements.txtEditableTranscript.value = '';
    }
    updateWordCount();
  }

  function updateWordCount() {
    const words = state.transcriptText.trim() ? state.transcriptText.trim().split(/\s+/).length : 0;
    elements.statWordCount.textContent = words;
  }

  function toggleEditTranscript() {
    state.isEditingTranscript = !state.isEditingTranscript;
    if (state.isEditingTranscript) {
      elements.transcriptDisplayArea.style.display = 'none';
      elements.transcriptEditArea.style.display = 'block';
      elements.btnToggleEditTranscript.classList.add('active');
    } else {
      state.transcriptText = elements.txtEditableTranscript.value;
      elements.transcriptDisplayArea.style.display = 'block';
      elements.transcriptEditArea.style.display = 'none';
      elements.btnToggleEditTranscript.classList.remove('active');
      renderTranscript();
    }
  }

  function copyTranscript() {
    if (!state.transcriptText) return;
    navigator.clipboard.writeText(state.transcriptText).then(() => {
      elements.btnCopyTranscript.innerHTML = '<i class="fa-solid fa-check text-emerald"></i>';
      setTimeout(() => elements.btnCopyTranscript.innerHTML = '<i class="fa-regular fa-copy"></i>', 1500);
    });
  }

  function clearTranscript() {
    state.transcriptText = '';
    renderTranscript();
  }

  // --------------------------------------------------------------------------
  // Multi-Agent Pipeline Execution & Schedule Extraction
  // --------------------------------------------------------------------------
  async function runAiPipeline(transcript) {
    resetPipelineSteps();
    elements.pipelineStatusTag.textContent = 'Processing...';

    setPipelineStep(1, 'completed');

    try {
      const result = await groqEngine.runPipeline(transcript, (stepNum) => {
        setPipelineStep(stepNum, 'active');
        if (stepNum > 1) setPipelineStep(stepNum - 1, 'completed');
      });

      setPipelineStep(5, 'completed');
      elements.pipelineStatusTag.textContent = 'Complete';
      state.currentPipelineResult = result;

      // Render Context & Email
      renderContext(result.context);
      renderGeneratedEmail(result.email);

      // Save to History
      saveToHistory(result);

      // Process Schedule Availability using PlanningAgent & Google Calendar Service WRITE
      processSpeechSchedule(transcript);

      elements.emailDocumentCard.scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
      console.error("AI Pipeline Error:", err);
      elements.pipelineStatusTag.textContent = 'Error';
    }
  }

  async function processSpeechSchedule(text) {
    const planResult = planningAgent.processSpeechToPlan(text, state.activeCalendarEvents);
    if (planResult && planResult.event) {
      updateCalendarUI(planResult);
      // WRITE event to Google Calendar API
      await googleCalendarService.createEvent(planResult.event);
    }
  }

  function resetPipelineSteps() {
    elements.steps.forEach(step => step.classList.remove('active', 'completed'));
    elements.pipelineStatusTag.textContent = 'Idle';
  }

  function setPipelineStep(stepIndex, status) {
    const stepEl = elements.steps[stepIndex - 1];
    if (!stepEl) return;
    if (status === 'active') {
      stepEl.classList.remove('completed');
      stepEl.classList.add('active');
    } else if (status === 'completed') {
      stepEl.classList.remove('active');
      stepEl.classList.add('completed');
    }
  }

  function runSampleDictation() {
    const sampleText = "Dear Sir, I would like to request leave for tomorrow as my mother has been admitted to the hospital, and I need to be with her during this time. I kindly request you to approve my leave. Thank you for your understanding. Best Regards, Raj.";
    state.transcriptText = sampleText;
    renderTranscript();
    runAiPipeline(sampleText);
  }

  // --------------------------------------------------------------------------
  // Context & Generated Email Render
  // --------------------------------------------------------------------------
  function renderContext(ctx) {
    elements.emptyContextState.style.display = 'none';
    elements.contextGrid.style.display = 'grid';

    elements.ctxIntent.textContent = ctx.intent || 'Leave Request';
    elements.ctxRecipient.textContent = ctx.recipient || 'Manager / Sir';
    elements.ctxType.textContent = ctx.email_type || 'Leave Application';
    elements.ctxTone.textContent = ctx.tone || 'Polite & Urgent';
    
    elements.ctxKeyPoints.innerHTML = '';
    if (ctx.key_points && ctx.key_points.length > 0) {
      ctx.key_points.forEach(pt => {
        const li = document.createElement('li');
        li.textContent = pt;
        elements.ctxKeyPoints.appendChild(li);
      });
    } else {
      elements.ctxKeyPoints.innerHTML = '<li>Main request details communicated</li>';
    }

    elements.ctxDates.textContent = Array.isArray(ctx.important_dates) ? ctx.important_dates.join(', ') : (ctx.important_dates || 'Tomorrow');
    elements.ctxAction.textContent = ctx.requested_action || 'Approve leave request';
  }

  function renderGeneratedEmail(email) {
    elements.emptyEmailState.style.display = 'none';
    elements.emailDocumentCard.style.display = 'flex';

    elements.emailSubject.textContent = email.subject || 'Leave Request for Tomorrow';
    elements.emailGreeting.textContent = email.greeting || 'Dear Sir,';
    elements.emailBody.innerHTML = (email.body || '').replace(/\n/g, '<br>');
    elements.emailClosing.textContent = email.closing || 'Best Regards,';
    elements.emailSignature.textContent = email.signature || 'Raj';
  }

  function toggleEmailEditMode() {
    const editable = elements.emailSubject.getAttribute('contenteditable') === 'true';
    const newEditableState = editable ? 'false' : 'true';

    elements.emailSubject.setAttribute('contenteditable', newEditableState);
    elements.emailGreeting.setAttribute('contenteditable', newEditableState);
    elements.emailBody.setAttribute('contenteditable', newEditableState);
    elements.emailClosing.setAttribute('contenteditable', newEditableState);
    elements.emailSignature.setAttribute('contenteditable', newEditableState);

    if (!editable) {
      elements.btnSaveEmailEdits.style.display = 'inline-flex';
      elements.btnEditEmail.classList.add('active');
    } else {
      elements.btnSaveEmailEdits.style.display = 'none';
      elements.btnEditEmail.classList.remove('active');
    }
  }

  function saveEmailEdits() {
    toggleEmailEditMode();
  }

  function getFormattedEmailText() {
    const subject = elements.emailSubject.innerText || elements.emailSubject.textContent;
    const greeting = elements.emailGreeting.innerText || elements.emailGreeting.textContent;
    const body = elements.emailBody.innerText || elements.emailBody.textContent;
    const closing = elements.emailClosing.innerText || elements.emailClosing.textContent;
    const signature = elements.emailSignature.innerText || elements.emailSignature.textContent;

    return `Subject: ${subject}\n\n${greeting}\n\n${body}\n\n${closing}\n${signature}`;
  }

  function copyEmailToClipboard() {
    const text = getFormattedEmailText();
    navigator.clipboard.writeText(text).then(() => {
      elements.btnCopyEmailQuick.innerHTML = '<i class="fa-solid fa-check text-emerald"></i> Copied!';
      setTimeout(() => elements.btnCopyEmailQuick.innerHTML = '<i class="fa-regular fa-copy"></i> Copy Email', 1500);
    });
  }

  function downloadEmailTxt() {
    const text = getFormattedEmailText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SpeechMail_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadEmailMd() {
    const subject = elements.emailSubject.innerText || elements.emailSubject.textContent;
    const greeting = elements.emailGreeting.innerText || elements.emailGreeting.textContent;
    const body = elements.emailBody.innerText || elements.emailBody.textContent;
    const closing = elements.emailClosing.innerText || elements.emailClosing.textContent;
    const signature = elements.emailSignature.innerText || elements.emailSignature.textContent;

    const mdText = `# ${subject}\n\n**${greeting}**\n\n${body}\n\n**${closing}**  \n*${signature}*`;

    const blob = new Blob([mdText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SpeechMail_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // --------------------------------------------------------------------------
  // Gmail Inbox Data Retrieval UI
  // --------------------------------------------------------------------------
  async function renderInboxMails() {
    const query = elements.inputInboxSearch.value.trim();
    const mails = await gmailService.fetchInboxEmails(query);

    elements.inboxList.innerHTML = '';
    mails.forEach(mail => {
      const card = document.createElement('div');
      card.className = 'inbox-mail-card';
      
      card.innerHTML = `
        <div class="inbox-mail-header">
          <span class="inbox-sender"><i class="fa-regular fa-envelope text-cyan"></i> ${mail.sender} ${mail.isMeeting ? '<span class="tag-meeting">Meeting Request</span>' : ''}</span>
          <span class="inbox-date">${mail.date}</span>
        </div>
        <h4 class="inbox-subject">${mail.subject}</h4>
        <p class="inbox-snippet">${mail.snippet}</p>
        <div class="inbox-actions">
          <button class="btn-pill-sm btn-pill-accent btn-extract-inbox" data-id="${mail.id}">
            <i class="fa-solid fa-wand-magic-sparkles"></i> Extract & Write to Google Calendar
          </button>
          <button class="btn-pill-sm btn-reply-inbox" data-id="${mail.id}">
            <i class="fa-solid fa-reply"></i> Reply via AI
          </button>
        </div>
      `;

      // Extract & Schedule click -> WRITE to Google Calendar
      card.querySelector('.btn-extract-inbox').addEventListener('click', () => {
        processSpeechSchedule(mail.body);
        document.getElementById('containerCalendar').scrollIntoView({ behavior: 'smooth' });
      });

      // Reply via AI click
      card.querySelector('.btn-reply-inbox').addEventListener('click', () => {
        elements.inputEmailTo.value = mail.senderEmail;
        state.transcriptText = `Reply to ${mail.sender} regarding ${mail.subject}: ${mail.snippet}`;
        renderTranscript();
        runAiPipeline(state.transcriptText);
      });

      elements.inboxList.appendChild(card);
    });
  }

  // --------------------------------------------------------------------------
  // Schedule & Google Calendar Planner UI
  // --------------------------------------------------------------------------
  function updateCalendarUI(planResult = null) {
    if (planResult && planResult.event) {
      if (!state.activeCalendarEvents.some(e => e.id === planResult.event.id || (e.title === planResult.event.title && e.date === planResult.event.date && e.startTime === planResult.event.startTime))) {
        state.activeCalendarEvents.unshift(planResult.event);
      }
      elements.scheduleStatusBanner.innerHTML = `
        <div class="status-banner-content banner-success">
          <i class="fa-solid fa-calendar-check banner-icon"></i>
          <div>
            <h4>Schedule Fixed & Confirmed</h4>
            <p>${planResult.statusMessage || planResult.message}</p>
          </div>
        </div>
      `;
    } else {
      elements.scheduleStatusBanner.innerHTML = `
        <div class="status-banner-content banner-success">
          <i class="fa-solid fa-calendar-check banner-icon"></i>
          <div>
            <h4>Schedule Confirmed & Available</h4>
            <p>Google Calendar & local schedule active. Ready for new meetings.</p>
          </div>
        </div>
      `;
    }

    // Render Events List with OPEN IN GCAL & APPEND attendee buttons
    elements.eventsList.innerHTML = '';
    state.activeCalendarEvents.forEach(evt => {
      const card = document.createElement('div');
      card.className = 'event-item-card';
      const webUrl = evt.webUrl || googleCalendarService.getGoogleCalendarWebUrl(evt);

      card.innerHTML = `
        <div class="event-info">
          <h4>${evt.title} ${evt.source ? `<span class="badge-tag">${evt.source}</span>` : ''}</h4>
          <p><i class="fa-solid fa-users text-purple"></i> ${Array.isArray(evt.attendees) ? evt.attendees.join(', ') : evt.attendees} • ${evt.date}</p>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="event-time-badge">${evt.startTime} - ${evt.endTime}</span>
          <a href="${webUrl}" target="_blank" rel="noopener" class="btn-pill-sm btn-pill-accent" style="text-decoration:none;" title="Open and save directly in Google Calendar Web App">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Open in Google Calendar
          </a>
          <button class="btn-pill-sm btn-append-attendee" data-id="${evt.id}" title="Append Attendee via Google Calendar API">
            <i class="fa-solid fa-user-plus text-cyan"></i> Append
          </button>
        </div>
      `;

      card.querySelector('.btn-append-attendee').addEventListener('click', () => {
        const attendeeEmail = gmailService.userEmail || 'rajsrmap2@gmail.com';
        if (!Array.isArray(evt.attendees)) evt.attendees = [evt.attendees];
        if (!evt.attendees.includes(attendeeEmail)) {
          evt.attendees.push(attendeeEmail);
        }
        handleAppendAttendeesToEvent(evt.id, attendeeEmail);
      });

      elements.eventsList.appendChild(card);
    });
  }

  function downloadScheduleIcs() {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//SpeechMail AI//Calendar Export//EN\n";
    state.activeCalendarEvents.forEach(evt => {
      const cleanDate = evt.date.replace(/-/g, '');
      const cleanTime = evt.startTime.replace(':', '') + '00';
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `SUMMARY:${evt.title}\n`;
      icsContent += `DTSTART:${cleanDate}T${cleanTime}\n`;
      icsContent += `DESCRIPTION:Meeting scheduled via SpeechMail AI with ${Array.isArray(evt.attendees) ? evt.attendees.join(', ') : evt.attendees}\n`;
      icsContent += "END:VEVENT\n";
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SpeechMail_Schedule_${Date.now()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // --------------------------------------------------------------------------
  // History Container Logic
  // --------------------------------------------------------------------------
  function saveToHistory(pipelineResult) {
    const historyItem = {
      id: 'hist_' + Date.now(),
      timestamp: new Date().toISOString(),
      intent: pipelineResult.context.intent || 'Email Request',
      subject: pipelineResult.email.subject || 'Email Subject',
      snippet: pipelineResult.email.body || '',
      context: pipelineResult.context,
      email: pipelineResult.email
    };

    state.emailHistory.unshift(historyItem);
    localStorage.setItem('speechmail_history', JSON.stringify(state.emailHistory));
    renderHistoryList();
  }

  function renderHistoryList() {
    const query = elements.inputHistorySearch.value.toLowerCase().trim();
    let filtered = state.emailHistory.filter(item => {
      return !query || 
        item.subject.toLowerCase().includes(query) || 
        item.intent.toLowerCase().includes(query) || 
        item.snippet.toLowerCase().includes(query);
    });

    elements.historyList.innerHTML = '';
    if (filtered.length === 0) {
      elements.historyList.appendChild(elements.emptyHistoryState);
      elements.emptyHistoryState.style.display = 'block';
      return;
    }

    elements.emptyHistoryState.style.display = 'none';

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'history-item-card';

      const dateStr = new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      card.innerHTML = `
        <div class="history-card-header">
          <span class="history-tag">${item.intent}</span>
          <span class="history-date">${dateStr}</span>
        </div>
        <h4 class="history-subject">${item.subject}</h4>
        <p class="history-snippet">${item.snippet}</p>
        <div class="history-card-footer">
          <button class="btn-reopen" data-id="${item.id}"><i class="fa-solid fa-folder-open"></i> Reopen Email</button>
          <button class="btn-del-history" data-id="${item.id}" title="Delete"><i class="fa-regular fa-trash-can"></i></button>
        </div>
      `;

      card.querySelector('.btn-reopen').addEventListener('click', () => {
        renderContext(item.context);
        renderGeneratedEmail(item.email);
        elements.emailDocumentCard.scrollIntoView({ behavior: 'smooth' });
      });

      card.querySelector('.btn-del-history').addEventListener('click', (e) => {
        e.stopPropagation();
        state.emailHistory = state.emailHistory.filter(h => h.id !== item.id);
        localStorage.setItem('speechmail_history', JSON.stringify(state.emailHistory));
        renderHistoryList();
      });

      elements.historyList.appendChild(card);
    });
  }

  function clearAllHistory() {
    if (confirm("Are you sure you want to clear all email history?")) {
      state.emailHistory = [];
      localStorage.removeItem('speechmail_history');
      renderHistoryList();
    }
  }

  function updateStatus(mode, message) {
    elements.statusText.textContent = message;
    if (mode === 'recording') {
      elements.statusIndicator.classList.add('recording');
    } else {
      elements.statusIndicator.classList.remove('recording');
    }
  }

  // Initial Load Callbacks
  initSttAgent();
  setupEventListeners();
  updateGmailStatusUI();
  if (elements.inputEventAttendees) {
    elements.inputEventAttendees.value = gmailService.userEmail || 'rajsrmap2@gmail.com';
  }
  renderInboxMails();
  updateCalendarUI();
  renderHistoryList();
});
