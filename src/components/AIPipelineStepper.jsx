import React from 'react';

export function AIPipelineStepper({ currentStep, pipelineStatus }) {
  const steps = [
    { num: 1, title: '🎤 Speech Recognition', desc: 'Sarvam AI STT Transcription', icon: 'fa-microphone' },
    { num: 2, title: '📝 Transcript Processing', desc: 'Sanitization & Filler Removal', icon: 'fa-file-pen' },
    { num: 3, title: '🧠 Context Extraction', desc: 'Groq Context Agent Parsing', icon: 'fa-brain' },
    { num: 4, title: '✍️ Email Generation', desc: 'Groq Email Agent Drafting', icon: 'fa-pen-nib' },
    { num: 5, title: '✅ Validation Complete', desc: 'Quality Audit & Structure Approval', icon: 'fa-circle-check' }
  ];

  return (
    <section class="panel pipeline-panel" id="containerPipeline">
      <div class="panel-header">
        <div class="panel-title">
          <i class="fa-solid fa-gears text-purple"></i>
          <h2>AI Multi-Agent Processing Pipeline</h2>
        </div>
        <span class="badge-pill badge-purple">{pipelineStatus}</span>
      </div>

      <div class="pipeline-stepper">
        {steps.map((step, idx) => {
          const isActive = currentStep === step.num;
          const isDone = currentStep > step.num;

          return (
            <React.Fragment key={step.num}>
              <div class={`step-item ${isDone ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                <div class="step-icon">
                  <i class={`fa-solid ${step.icon}`}></i>
                </div>
                <div class="step-info">
                  <h4>{step.title}</h4>
                  <p>{step.desc}</p>
                </div>
                <div class="step-status">
                  <i class="fa-solid fa-circle-check"></i>
                </div>
              </div>
              {idx < steps.length - 1 && <div class="step-connector"></div>}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}
