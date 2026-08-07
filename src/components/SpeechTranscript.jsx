import React from 'react';

export function SpeechTranscript({
  transcript,
  setTranscript,
  isEditing,
  setIsEditing,
  interimText,
  onGeneratePipeline,
  onCopy,
  onClear
}) {
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;

  return (
    <section class="panel transcript-panel" id="containerTranscript">
      <div class="panel-header">
        <div class="panel-title">
          <i class="fa-solid fa-file-lines text-cyan"></i>
          <h2>Speech Transcript</h2>
          <span class="badge-pill">Words: <strong>{wordCount}</strong></span>
        </div>
        <div class="panel-tools">
          <button
            class="btn-icon"
            onClick={() => setIsEditing(!isEditing)}
            title="Toggle Edit Mode"
          >
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn-icon" onClick={onCopy} title="Copy Raw Text">
            <i class="fa-regular fa-copy"></i>
          </button>
          <button class="btn-icon danger" onClick={onClear} title="Clear Text">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </div>

      {!isEditing ? (
        <div class="transcript-display-area">
          {!transcript ? (
            <div class="empty-state">
              <div class="empty-icon-wrapper"><i class="fa-solid fa-microphone"></i></div>
              <h3>No Speech Recorded Yet</h3>
              <p>Click "Start Recording" or "Try Sample Dictation" to record spoken voice.</p>
            </div>
          ) : (
            <div class="transcript-stream">{transcript}</div>
          )}
        </div>
      ) : (
        <div class="transcript-edit-area">
          <textarea
            class="styled-textarea"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Type or edit raw speech transcript here..."
          ></textarea>
        </div>
      )}

      {interimText && (
        <div class="interim-box" style={{ display: 'flex' }}>
          <span class="interim-pulse"></span>
          <span class="interim-text">{interimText}</span>
        </div>
      )}

      <div class="transcript-action-bar">
        <button class="btn btn-accent-glow" onClick={onGeneratePipeline}>
          <i class="fa-solid fa-wand-magic-sparkles"></i> Generate AI Email Pipeline
        </button>
      </div>
    </section>
  );
}
