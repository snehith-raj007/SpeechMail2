import os
import json
import smtplib
import time
import uuid
from typing import List, Optional
from datetime import datetime
from contextlib import asynccontextmanager
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders


from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

# Load .env file manually if present
env_file = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_file):
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                os.environ[key.strip()] = val.strip()

from database import init_db, get_db
from models import (
    Email, Draft, Meeting, AgentActivity,
    EmailHistoryModel, CalendarEventModel, InboxMessageModel
)

PORT = int(os.environ.get('PORT', 8080))

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[STARTUP] SpeechMail AI Backend initializing...")
    db_connected = await init_db()
    if db_connected:
        print("[STARTUP] Neon PostgreSQL Database is CONNECTED & READY!")
    else:
        print("[STARTUP WARNING] Database connection failed. Proceeding with endpoint listeners.")
    print(f"[STARTUP] SpeechMail AI FastAPI Backend running on port {PORT}")
    yield

app = FastAPI(
    title="SpeechMail AI & Neon DB Backend",
    description="Async FastAPI Backend connected to Neon Postgres with Email, Draft, Meeting, & AgentActivity CRUD APIs",
    lifespan=lifespan
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper: iCalendar Generator
def generate_ics_content(title, date_str, start_time, end_time, attendees, description, organizer_email):
    clean_date = date_str.replace('-', '')
    start_dt = f"{clean_date}T{start_time.replace(':', '')}00"
    end_dt = f"{clean_date}T{end_time.replace(':', '')}00"
    uid = f"speechmail-{int(time.time() * 1000)}@speechmail.ai"

    attendee_lines = ""
    if isinstance(attendees, list):
        for att in attendees:
            if att and '@' in att:
                attendee_lines += f"ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:{att.strip()}\r\n"
    elif isinstance(attendees, str) and '@' in attendees:
        attendee_lines += f"ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:{attendees.strip()}\r\n"

    ics = (
        "BEGIN:VCALENDAR\r\n"
        "PRODID:-//SpeechMail AI//Google Calendar Integration//EN\r\n"
        "VERSION:2.0\r\n"
        "METHOD:REQUEST\r\n"
        "BEGIN:VEVENT\r\n"
        f"ORGANIZER;CN=SpeechMail AI:mailto:{organizer_email}\r\n"
        f"{attendee_lines}"
        f"UID:{uid}\r\n"
        f"DTSTAMP:{start_dt}Z\r\n"
        f"DTSTART:{start_dt}\r\n"
        f"DTEND:{end_dt}\r\n"
        f"SUMMARY:{title}\r\n"
        f"DESCRIPTION:{description}\r\n"
        "STATUS:CONFIRMED\r\n"
        "END:VEVENT\r\n"
        "END:VCALENDAR\r\n"
    )
    return ics

# --------------------------------------------------------------------------
# Pydantic Schemas for New Neon DB Tables
# --------------------------------------------------------------------------
class EmailCreateSchema(BaseModel):
    sender: str
    subject: str
    body: str
    priority: Optional[int] = 1

class DraftCreateSchema(BaseModel):
    email_id: Optional[str] = None
    draft_text: str
    confidence: Optional[float] = 0.95
    status: Optional[str] = "pending"  # pending / approved / auto_sent

class DraftUpdateSchema(BaseModel):
    status: str  # pending / approved / auto_sent
    draft_text: Optional[str] = None

class MeetingCreateSchema(BaseModel):
    title: str
    proposed_time: Optional[str] = None
    confirmed_time: Optional[str] = None
    status: Optional[str] = "negotiating"  # negotiating / confirmed
    negotiation_log: Optional[dict] = None

class MeetingUpdateSchema(BaseModel):
    status: str  # negotiating / confirmed
    confirmed_time: Optional[str] = None
    negotiation_log: Optional[dict] = None

class AgentActivityCreateSchema(BaseModel):
    agent_name: str
    action: str
    reasoning: Optional[str] = ""

# Legacy Send/Calendar Schemas
class SendEmailRequest(BaseModel):
    to: str
    subject: str
    body: str
    userEmail: Optional[str] = None
    appPassword: Optional[str] = None
    emailData: Optional[dict] = None
    priority: Optional[int] = 1
    greeting: Optional[str] = None
    closing: Optional[str] = None
    signature: Optional[str] = None


class CreateCalendarEventRequest(BaseModel):
    title: str
    date: Optional[str] = None
    event_date: Optional[str] = None
    startTime: Optional[str] = None
    start_time: Optional[str] = None
    endTime: Optional[str] = None
    end_time: Optional[str] = None
    attendees: Optional[list] = []
    description: Optional[str] = ""


# --------------------------------------------------------------------------
# Root Endpoint
# --------------------------------------------------------------------------
@app.get("/")
async def read_root():
    return {
        "message": "SpeechMail AI Backend connected to Neon Postgres Database!",
        "status": "running",
        "database": "Neon Postgres (postgresql+asyncpg)"
    }

# --------------------------------------------------------------------------
# 1. EMAILS ENDPOINTS (Neon DB Table: emails)
# --------------------------------------------------------------------------
@app.get("/api/db/emails")
async def list_emails(db: AsyncSession = Depends(get_db)):
    """List all emails sorted by priority (highest priority first)."""
    stmt = select(Email).order_by(Email.priority.desc(), Email.created_at.desc())
    res = await db.execute(stmt)
    emails = res.scalars().all()
    return [
        {
            "id": e.id,
            "sender": e.sender,
            "subject": e.subject,
            "body": e.body,
            "priority": e.priority,
            "created_at": e.created_at.isoformat() if e.created_at else None
        }
        for e in emails
    ]

@app.post("/api/db/emails", status_code=status.HTTP_201_CREATED)
async def create_email(item: EmailCreateSchema, db: AsyncSession = Depends(get_db)):
    """Create a new email record in Neon DB."""
    email_obj = Email(
        id=f"email-{int(time.time() * 1000)}",
        sender=item.sender,
        subject=item.subject,
        body=item.body,
        priority=item.priority or 1,
        created_at=datetime.utcnow()
    )
    db.add(email_obj)
    await db.commit()
    await db.refresh(email_obj)
    return {
        "success": True,
        "email": {
            "id": email_obj.id,
            "sender": email_obj.sender,
            "subject": email_obj.subject,
            "body": email_obj.body,
            "priority": email_obj.priority,
            "created_at": email_obj.created_at.isoformat()
        }
    }

# --------------------------------------------------------------------------
# 2. DRAFTS ENDPOINTS (Neon DB Table: drafts)
# --------------------------------------------------------------------------
@app.get("/api/db/drafts")
async def list_drafts(db: AsyncSession = Depends(get_db)):
    """List all generated drafts."""
    stmt = select(Draft).order_by(Draft.created_at.desc())
    res = await db.execute(stmt)
    drafts = res.scalars().all()
    return [
        {
            "id": d.id,
            "email_id": d.email_id,
            "draft_text": d.draft_text,
            "confidence": d.confidence,
            "status": d.status,
            "created_at": d.created_at.isoformat() if d.created_at else None
        }
        for d in drafts
    ]

@app.post("/api/db/drafts", status_code=status.HTTP_201_CREATED)
async def create_draft(item: DraftCreateSchema, db: AsyncSession = Depends(get_db)):
    """Create a new draft record (AI Agent generated)."""
    draft_obj = Draft(
        id=f"draft-{int(time.time() * 1000)}",
        email_id=item.email_id,
        draft_text=item.draft_text,
        confidence=item.confidence or 0.95,
        status=item.status or "pending",
        created_at=datetime.utcnow()
    )
    db.add(draft_obj)
    await db.commit()
    await db.refresh(draft_obj)
    return {
        "success": True,
        "draft": {
            "id": draft_obj.id,
            "email_id": draft_obj.email_id,
            "draft_text": draft_obj.draft_text,
            "confidence": draft_obj.confidence,
            "status": draft_obj.status,
            "created_at": draft_obj.created_at.isoformat()
        }
    }

@app.patch("/api/db/drafts/{draft_id}")
async def update_draft_status(draft_id: str, item: DraftUpdateSchema, db: AsyncSession = Depends(get_db)):
    """Update draft status (pending / approved / auto_sent)."""
    stmt = select(Draft).where(Draft.id == draft_id)
    res = await db.execute(stmt)
    draft_obj = res.scalar_one_or_none()
    if not draft_obj:
        raise HTTPException(status_code=404, detail=f"Draft with ID '{draft_id}' not found.")

    if item.status not in ["pending", "approved", "auto_sent"]:
        raise HTTPException(status_code=400, detail="Status must be one of: pending, approved, auto_sent")

    draft_obj.status = item.status
    if item.draft_text:
        draft_obj.draft_text = item.draft_text

    await db.commit()
    await db.refresh(draft_obj)
    return {
        "success": True,
        "message": f"Draft status updated to '{item.status}'",
        "draft": {
            "id": draft_obj.id,
            "status": draft_obj.status,
            "draft_text": draft_obj.draft_text
        }
    }

# --------------------------------------------------------------------------
# 3. MEETINGS ENDPOINTS (Neon DB Table: meetings)
# --------------------------------------------------------------------------
@app.get("/api/db/meetings")
async def list_meetings(db: AsyncSession = Depends(get_db)):
    """List all meetings."""
    stmt = select(Meeting).order_by(Meeting.created_at.desc())
    res = await db.execute(stmt)
    meetings = res.scalars().all()
    return [
        {
            "id": m.id,
            "title": m.title,
            "proposed_time": m.proposed_time,
            "confirmed_time": m.confirmed_time,
            "status": m.status,
            "negotiation_log": m.negotiation_log,
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in meetings
    ]

@app.post("/api/db/meetings", status_code=status.HTTP_201_CREATED)
async def create_meeting(item: MeetingCreateSchema, db: AsyncSession = Depends(get_db)):
    """Create a new meeting record."""
    meeting_obj = Meeting(
        id=f"meet-{int(time.time() * 1000)}",
        title=item.title,
        proposed_time=item.proposed_time,
        confirmed_time=item.confirmed_time,
        status=item.status or "negotiating",
        negotiation_log=item.negotiation_log or {},
        created_at=datetime.utcnow()
    )
    db.add(meeting_obj)
    await db.commit()
    await db.refresh(meeting_obj)
    return {
        "success": True,
        "meeting": {
            "id": meeting_obj.id,
            "title": meeting_obj.title,
            "proposed_time": meeting_obj.proposed_time,
            "confirmed_time": meeting_obj.confirmed_time,
            "status": meeting_obj.status,
            "negotiation_log": meeting_obj.negotiation_log,
            "created_at": meeting_obj.created_at.isoformat()
        }
    }

@app.patch("/api/db/meetings/{meeting_id}")
async def update_meeting_status(meeting_id: str, item: MeetingUpdateSchema, db: AsyncSession = Depends(get_db)):
    """Update meeting status (negotiating / confirmed)."""
    stmt = select(Meeting).where(Meeting.id == meeting_id)
    res = await db.execute(stmt)
    meeting_obj = res.scalar_one_or_none()
    if not meeting_obj:
        raise HTTPException(status_code=404, detail=f"Meeting with ID '{meeting_id}' not found.")

    if item.status not in ["negotiating", "confirmed"]:
        raise HTTPException(status_code=400, detail="Status must be one of: negotiating, confirmed")

    meeting_obj.status = item.status
    if item.confirmed_time:
        meeting_obj.confirmed_time = item.confirmed_time
    if item.negotiation_log:
        meeting_obj.negotiation_log = item.negotiation_log

    await db.commit()
    await db.refresh(meeting_obj)
    return {
        "success": True,
        "message": f"Meeting status updated to '{item.status}'",
        "meeting": {
            "id": meeting_obj.id,
            "status": meeting_obj.status,
            "confirmed_time": meeting_obj.confirmed_time,
            "negotiation_log": meeting_obj.negotiation_log
        }
    }

# --------------------------------------------------------------------------
# 4. AGENT ACTIVITIES ENDPOINTS (Neon DB Table: agent_activities)
# --------------------------------------------------------------------------
@app.get("/api/db/activities")
async def list_agent_activities(db: AsyncSession = Depends(get_db)):
    """List all logged agent activities."""
    stmt = select(AgentActivity).order_by(AgentActivity.created_at.desc())
    res = await db.execute(stmt)
    acts = res.scalars().all()
    return [
        {
            "id": a.id,
            "agent_name": a.agent_name,
            "action": a.action,
            "reasoning": a.reasoning,
            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in acts
    ]

@app.post("/api/db/activities", status_code=status.HTTP_201_CREATED)
async def create_agent_activity(item: AgentActivityCreateSchema, db: AsyncSession = Depends(get_db)):
    """Log a new AI agent activity."""
    act_obj = AgentActivity(
        id=f"act-{int(time.time() * 1000)}",
        agent_name=item.agent_name,
        action=item.action,
        reasoning=item.reasoning or "",
        created_at=datetime.utcnow()
    )
    db.add(act_obj)
    await db.commit()
    await db.refresh(act_obj)
    return {
        "success": True,
        "activity": {
            "id": act_obj.id,
            "agent_name": act_obj.agent_name,
            "action": act_obj.action,
            "reasoning": act_obj.reasoning,
            "created_at": act_obj.created_at.isoformat()
        }
    }

# --------------------------------------------------------------------------
# 5. LEGACY SPEECHMAIL ENDPOINTS (SMTP, Calendar ICS, History, Events, Inbox)
# --------------------------------------------------------------------------
@app.post("/api/send-email")
async def send_email(req: SendEmailRequest, db: AsyncSession = Depends(get_db)):
    try:
        user_email = req.userEmail or os.environ.get('GMAIL_USER_EMAIL', 'rajsrmap2@gmail.com')
        app_password = req.appPassword or os.environ.get('GMAIL_APP_PASSWORD', 'kpusqkiduzbkzgvv')
        
        user_email = user_email.strip()
        app_password = app_password.replace(' ', '').strip()
        to_email = req.to.strip()
        subject = req.subject.strip()
        body = req.body.strip()

        if not to_email:
            raise HTTPException(status_code=400, detail="Recipient 'To' address is required.")

        # 1. ALWAYS Save record to Neon DB FIRST so data is NEVER lost!
        hist_id = f"hist-{int(time.time() * 1000)}"
        ed = req.emailData or {}
        db_item = EmailHistoryModel(
            id=hist_id,
            subject=subject,
            to_email=to_email,
            greeting=ed.get('greeting', req.greeting or ''),
            body=body,
            closing=ed.get('closing', req.closing or ''),
            signature=ed.get('signature', req.signature or ''),
            transcript=ed.get('transcript', ''),
            intent=ed.get('intent', 'Sent Email'),
            recipient=ed.get('recipient', to_email),
            email_type=ed.get('email_type', 'Direct Delivery'),
            tone=ed.get('tone', 'Professional'),
            key_points=ed.get('key_points', []),
            important_dates=ed.get('important_dates', []),
            requested_action=ed.get('requested_action', 'Delivered via Gmail'),
            created_at=datetime.utcnow()
        )
        db.add(db_item)

        email_rec = Email(
            id=f"email-{int(time.time() * 1000)}",
            sender=user_email,
            subject=subject,
            body=body,
            priority=req.priority or 1,
            created_at=datetime.utcnow()
        )
        db.add(email_rec)
        await db.commit()
        print(f"[NEON DB SUCCESS] Email successfully saved to Neon DB tables ('email_history' & 'emails')!")

        # 2. Attempt SMTP Delivery
        smtp_success = False
        smtp_msg = ""
        try:
            msg = MIMEMultipart()
            msg['From'] = user_email
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))

            smtp_server = smtplib.SMTP('smtp.gmail.com', 587, timeout=15)
            smtp_server.starttls()
            smtp_server.login(user_email, app_password)
            smtp_server.sendmail(user_email, to_email, msg.as_string())
            smtp_server.quit()
            smtp_success = True
            smtp_msg = f"Email delivered to {to_email} and saved to Neon DB!"
            print(f"[SMTP SUCCESS] Email delivered to {to_email}!")
        except Exception as smtp_err:
            print(f"[SMTP WARNING] Could not send via Gmail SMTP: {smtp_err}")
            smtp_msg = f"Email saved to Neon DB! (SMTP Note: {str(smtp_err)})"

        return {'success': True, 'message': smtp_msg, 'smtp_delivered': smtp_success}

    except Exception as e:
        print(f"[SERVER ERROR] {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/events", status_code=status.HTTP_201_CREATED)
@app.post("/api/create-calendar-event", status_code=status.HTTP_201_CREATED)
async def create_calendar_event(req: CreateCalendarEventRequest, db: AsyncSession = Depends(get_db)):

    try:
        user_email = os.environ.get('GMAIL_USER_EMAIL', 'rajsrmap2@gmail.com')
        app_password = os.environ.get('GMAIL_APP_PASSWORD', 'kpusqkiduzbkzgvv').replace(' ', '').strip()

        title = req.title.strip()
        date_str = (req.date or req.event_date or datetime.now().strftime('%Y-%m-%d')).strip()
        start_time = (req.startTime or req.start_time or '14:00').strip()
        end_time = (req.endTime or req.end_time or '15:00').strip()
        attendees = req.attendees or [user_email]
        description = req.description.strip() if req.description else 'Scheduled via SpeechMail AI Voice Planner'


        ics_content = generate_ics_content(title, date_str, start_time, end_time, attendees, description, user_email)

        msg = MIMEMultipart('mixed')
        msg['From'] = f"SpeechMail AI <{user_email}>"
        msg['To'] = user_email
        msg['Subject'] = f"Calendar Invitation: {title} ({date_str} at {start_time})"

        body_text = f"SpeechMail AI has scheduled a meeting:\n\nTitle: {title}\nDate: {date_str}\nTime: {start_time} - {end_time}\nDescription: {description}\n\nThis event has been sent to Google Calendar."
        msg.attach(MIMEText(body_text, 'plain'))

        cal_part = MIMEBase('text', 'calendar', method='REQUEST', name='invite.ics')
        cal_part.set_payload(ics_content.encode('utf-8'))
        encoders.encode_base64(cal_part)
        cal_part.add_header('Content-Class', 'urn:content-classes:calendarmessage')
        cal_part.add_header('Content-Disposition', 'inline', filename='invite.ics')
        msg.attach(cal_part)

        try:
            smtp_server = smtplib.SMTP('smtp.gmail.com', 587, timeout=15)
            smtp_server.starttls()
            smtp_server.login(user_email, app_password)
            smtp_server.sendmail(user_email, [user_email], msg.as_string())
            smtp_server.quit()
        except Exception as smtp_err:
            print(f"[CALENDAR EMAIL WARNING] {smtp_err}")

        # Save into Neon DB calendar_events & meetings
        evt_id = f"evt-{int(time.time() * 1000)}"
        db_event = CalendarEventModel(
            id=evt_id,
            title=title,
            event_date=date_str,
            start_time=start_time,
            end_time=end_time,
            attendees=attendees,
            description=description,
            created_at=datetime.utcnow()
        )
        db.add(db_event)

        meeting_obj = Meeting(
            id=f"meet-{int(time.time() * 1000)}",
            title=title,
            proposed_time=f"{date_str} {start_time}",
            confirmed_time=f"{date_str} {start_time}",
            status="confirmed",
            negotiation_log={"attendees": attendees, "description": description},
            created_at=datetime.utcnow()
        )
        db.add(meeting_obj)

        await db.commit()

        return {
            'success': True,
            'message': f"Meeting '{title}' saved to Google Calendar & Neon DB!",
            'event': {
                'id': evt_id,
                'title': title,
                'date': date_str,
                'startTime': start_time,
                'endTime': end_time,
                'attendees': attendees,
                'description': description
            }
        }

    except Exception as e:
        print(f"[CALENDAR ERROR] {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/history", status_code=status.HTTP_201_CREATED)
async def save_history_item(req: dict, db: AsyncSession = Depends(get_db)):
    hist_id = req.get('id') or f"hist-{int(time.time() * 1000)}"
    db_item = EmailHistoryModel(
        id=hist_id,
        subject=req.get('subject', 'Generated Email'),
        to_email=req.get('to') or req.get('to_email') or 'manager@techcorp.com',
        greeting=req.get('greeting', ''),
        body=req.get('body', ''),
        closing=req.get('closing', ''),
        signature=req.get('signature', ''),
        transcript=req.get('transcript', ''),
        intent=req.get('intent', 'AI Generated Email'),
        recipient=req.get('recipient', req.get('to', '')),
        email_type=req.get('email_type', 'AI Email'),
        tone=req.get('tone', 'Professional'),
        key_points=req.get('key_points', []),
        important_dates=req.get('important_dates', []),
        requested_action=req.get('requested_action', ''),
        created_at=datetime.utcnow()
    )
    db.add(db_item)
    await db.commit()
    return {"success": True, "message": "History item saved to Neon DB!", "id": hist_id}

@app.get("/api/history")
async def get_email_history(db: AsyncSession = Depends(get_db)):

    stmt = select(EmailHistoryModel).order_by(EmailHistoryModel.created_at.desc())
    res = await db.execute(stmt)
    items = res.scalars().all()
    return [
        {
            "id": item.id,
            "subject": item.subject,
            "to": item.to_email,
            "greeting": item.greeting,
            "body": item.body,
            "closing": item.closing,
            "signature": item.signature,
            "transcript": item.transcript,
            "intent": item.intent,
            "recipient": item.recipient,
            "email_type": item.email_type,
            "tone": item.tone,
            "key_points": item.key_points or [],
            "important_dates": item.important_dates or [],
            "requested_action": item.requested_action,
            "timestamp": item.created_at.isoformat() if item.created_at else None
        }
        for item in items
    ]

@app.get("/api/events")
async def get_calendar_events(db: AsyncSession = Depends(get_db)):
    stmt = select(CalendarEventModel).order_by(CalendarEventModel.event_date.asc(), CalendarEventModel.start_time.asc())
    res = await db.execute(stmt)
    events = res.scalars().all()
    return [
        {
            "id": ev.id,
            "title": ev.title,
            "date": ev.event_date,
            "startTime": ev.start_time,
            "endTime": ev.end_time,
            "attendees": ev.attendees or [],
            "description": ev.description
        }
        for ev in events
    ]

@app.get("/api/inbox")
async def get_inbox_messages(db: AsyncSession = Depends(get_db)):
    stmt = select(InboxMessageModel).order_by(InboxMessageModel.received_at.desc())
    res = await db.execute(stmt)
    msgs = res.scalars().all()
    return [
        {
            "id": msg.id,
            "sender": msg.sender,
            "senderEmail": msg.sender_email,
            "subject": msg.subject,
            "snippet": msg.snippet,
            "timeAgo": msg.time_ago,
            "category": msg.category,
            "body": msg.body
        }
        for msg in msgs
    ]

if __name__ == '__main__':
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=PORT, reload=False)
