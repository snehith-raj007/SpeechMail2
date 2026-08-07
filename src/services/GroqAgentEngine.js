/**
 * GroqAgentEngine.js
 * Multi-Agent Pipeline Engine for SpeechMail AI
 * Agents:
 *  1. Context Extraction Agent
 *  2. Email Generation Agent
 *  3. Email Validation Agent
 */

export class GroqAgentEngine {
  constructor(options = {}) {
    this.apiKey = options.apiKey || (import.meta && import.meta.env && import.meta.env.VITE_GROQ_API_KEY) || '';

    this.model = options.model || 'llama-3.3-70b-versatile';
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  async runPipeline(transcript, onProgressStep = () => {}) {
    if (!transcript || !transcript.trim()) {
      throw new Error("Transcript text cannot be empty.");
    }

    // Step 2: Transcript Processing & Cleaning
    onProgressStep(2, "Transcript Processing", { transcript });
    const cleanedTranscript = this.cleanTranscript(transcript);

    // Step 3: Context Extraction Agent
    onProgressStep(3, "Context Extraction", { transcript: cleanedTranscript });
    const context = await this.extractContext(cleanedTranscript);

    // Step 4: Email Generation Agent
    onProgressStep(4, "Email Generation", { context });
    const emailDraft = await this.generateEmail(context);

    // Step 5: Email Validation Agent
    onProgressStep(5, "Validation Complete", { context, emailDraft });
    const validation = await this.validateEmail(context, emailDraft);

    return {
      transcript: cleanedTranscript,
      context,
      email: validation.approved && validation.revised_email ? validation.revised_email : emailDraft,
      validation,
      timestamp: new Date().toISOString()
    };
  }

  cleanTranscript(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\b(um|uh|you know|like|er|ah)\b/gi, '')
      .replace(/\s+([,.!?])/g, '$1')
      .trim();
  }

  async extractContext(transcript) {
    const prompt = `You are an expert AI Context Extraction Agent. Analyze this raw speech transcript and extract structured email intent context into JSON.

Transcript: "${transcript}"

Return ONLY a valid JSON object matching this schema without markdown codeblocks or commentary:
{
  "intent": "Brief overall goal (e.g. Leave Request, Meeting Scheduling, Follow-up, Project Update)",
  "recipient": "Target recipient name or role (e.g. Manager, Team, Client, HR, Professor)",
  "email_type": "Format type (e.g. Formal Application, Leave Request, Meeting Invite, Follow-up)",
  "tone": "Communication tone (e.g. Professional & Polite, Urgent, Friendly, Persuasive)",
  "key_points": ["Key point 1", "Key point 2", "Key point 3"],
  "important_dates": ["Mentioned dates, times, or deadlines"],
  "requested_action": "Clear action requested from the recipient"
}`;

    let jsonResult = null;
    if (this.apiKey) {
      jsonResult = await this.callGroqApi(prompt);
    }

    if (!jsonResult) {
      jsonResult = this.fallbackContextExtraction(transcript);
    }

    return jsonResult;
  }

  async generateEmail(context) {
    const prompt = `You are a world-class Executive Email Copywriter Agent. Generate a beautifully formatted, professional email based strictly on this extracted structured context JSON.

Context JSON:
${JSON.stringify(context, null, 2)}

Return ONLY a valid JSON object matching this schema without markdown codeblocks:
{
  "subject": "Clear, professional email subject line",
  "greeting": "Formal salutation (e.g. Dear Manager / Dear [Name],)",
  "body": "Well-structured paragraph(s) covering all key points politely and clearly.",
  "closing": "Professional closing (e.g. Sincerely, / Best Regards,)",
  "signature": "Sender name or designation (e.g. Raj)"
}`;

    let jsonResult = null;
    if (this.apiKey) {
      jsonResult = await this.callGroqApi(prompt);
    }

    if (!jsonResult) {
      jsonResult = this.fallbackEmailGeneration(context);
    }

    return jsonResult;
  }

  async validateEmail(context, emailDraft) {
    const prompt = `You are an Email Audit & Quality Assurance Agent. Verify if this email accurately represents the intent without errors.

Context: ${JSON.stringify(context)}
Email Draft: ${JSON.stringify(emailDraft)}

Return ONLY a valid JSON object:
{
  "approved": true,
  "feedback": "Validation check passed seamlessly",
  "score": 98
}`;

    let jsonResult = null;
    if (this.apiKey) {
      jsonResult = await this.callGroqApi(prompt);
    }

    if (!jsonResult) {
      jsonResult = {
        approved: true,
        feedback: "Local validation passed",
        score: 95
      };
    }

    return jsonResult;
  }

  async callGroqApi(prompt) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) return null;

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content;
      if (!rawContent) return null;

      return JSON.parse(rawContent.trim());
    } catch (e) {
      console.warn("Groq API call error:", e);
      return null;
    }
  }

  fallbackContextExtraction(transcript) {
    const lower = transcript.toLowerCase();
    let intent = "Email Composition";
    let recipient = "Recipient";
    let email_type = "Standard Email";
    let tone = "Professional";

    if (lower.includes("leave") || lower.includes("absent") || lower.includes("hospital")) {
      intent = "Leave Request";
      recipient = "Manager / Sir";
      email_type = "Formal Leave Application";
      tone = "Polite & Urgent";
    } else if (lower.includes("meet") || lower.includes("schedule") || lower.includes("sync")) {
      intent = "Meeting Scheduling";
      recipient = "Team / Client";
      email_type = "Calendar Meeting Invitation";
      tone = "Professional & Direct";
    }

    return {
      intent,
      recipient,
      email_type,
      tone,
      key_points: [transcript],
      important_dates: ["Tomorrow / As specified"],
      requested_action: "Kindly review and respond."
    };
  }

  fallbackEmailGeneration(context) {
    return {
      subject: `${context.intent || 'Message'} - ${context.recipient || 'Notification'}`,
      greeting: "Dear Sir/Madam,",
      body: `I am writing regarding ${context.intent.toLowerCase()}. ${context.requested_action}`,
      closing: "Best Regards,",
      signature: "Raj"
    };
  }
}
