import React, { useRef, useEffect } from 'react';

export function VoiceRecorder({
  isRecording,
  onStart,
  onStop,
  recordingTime,
  audioUrl,
  statusText,
  onFileUpload
}) {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Audio wave visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      if (isRecording) {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#06b6d4';

        const time = Date.now() * 0.005;
        for (let x = 0; x < width; x += 4) {
          const y = centerY + Math.sin(x * 0.05 + time) * 20 * Math.sin(x * 0.01 + time);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [isRecording]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <section class="panel recorder-panel" id="containerRecorder">
      <div class="panel-header">
        <div class="panel-title">
          <i class="fa-solid fa-microphone-lines text-accent"></i>
          <h2>Voice Recorder</h2>
        </div>
        <div class={`status-indicator ${isRecording ? 'active' : ''}`}>
          <span class="status-dot"></span>
          <span class="status-text">{statusText}</span>
        </div>
      </div>

      <div class="visualizer-wrapper">
        <canvas ref={canvasRef} width={600} height={120} class="wave-canvas"></canvas>
        <div class={`mic-glow-ring ${isRecording ? 'recording' : ''}`}></div>
      </div>

      <div class="recorder-controls">
        <button
          class="btn btn-rec start"
          onClick={onStart}
          disabled={isRecording}
          title="Start Recording"
        >
          <i class="fa-solid fa-microphone"></i> Start Recording
        </button>
        <button
          class="btn btn-rec stop"
          onClick={onStop}
          disabled={!isRecording}
          title="Stop Recording"
        >
          <i class="fa-solid fa-square"></i> Stop Recording
        </button>

        <div class="recording-timer-badge">
          <i class="fa-regular fa-clock"></i>
          <span>{formatTimer(recordingTime)}</span>
        </div>
      </div>

      {audioUrl && (
        <div class="audio-playback-container">
          <div class="playback-header">
            <span><i class="fa-solid fa-circle-play text-cyan"></i> Audio Playback</span>
            <span class="playback-label">Recorded Clip</span>
          </div>
          <audio src={audioUrl} controls class="styled-audio-player"></audio>
        </div>
      )}

      <div class="upload-bar">
        <button class="btn-pill-sm" onClick={() => fileInputRef.current?.click()}>
          <i class="fa-solid fa-file-audio"></i> Upload Audio File
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept="audio/*"
          hidden
          onChange={onFileUpload}
        />
        <span class="upload-hint">Supported formats: WAV, MP3, M4A, WEBM</span>
      </div>
    </section>
  );
}
