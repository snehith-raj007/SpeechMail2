import os
import json
import smtplib
import time
import uuid
from typing import List, Optional
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Load .env file manually if present
env_file = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_file):
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                os.environ[key.strip()] = val.strip()

from database import init_db, get_db, EmailHistoryModel, CalendarEventModel, InboxMessageModel

PORT = int(os.environ.get('PORT', 8081))

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print(f"[STARTUP] SpeechMail AI FastAPI Backend initialized on port {PORT}")
    print(f"[STARTUP] Gmail Account: {os.environ.get('GMAIL_USER_EMAIL', 'Not set')}")
    yield

app = FastAPI(title="SpeechMail AI Backend", description="FastAPI Backend with Neon DB & Gmail / Google Calendar Services", lifespan=lifespan)

# Enable CORS for React frontend (Vite running on localhost)
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
# Pydantic Schemas
# --------------------------------------------------------------------------
class SendEmailRequest(BaseModel):
    to: str
    subject: str
    body: str
    userEmail: Optional[str] = None
    appPassword: Optional[str] = None
    emailData: Optional[dict] = None

class CreateCalendarEventRequest(BaseModel):
    title: str
    date: str
    startTime: str
    endTime: str
    attendees: Optional[list] = []
    description: Optional[str] = ""

class EmailHistoryItemSchema(BaseModel):
    id: Optional[str] = None
    subject: Optional[str] = ""
    to_email: Optional[str] = ""
    greeting: Optional[str] = ""
    body: Optional[str] = ""
    closing: Optional[str] = ""
    signature: Optional[str] = ""
    transcript: Optional[str] = ""
    intent: Optional[str] = ""
    recipient: Optional[str] = ""
    email_type: Optional[str] = ""
    tone: Optional[str] = ""
    key_points: Optional[list] = []
    important_dates: Optional[list] = []
    requested_action: Optional[str] = ""
    created_at: Optional[str] = None

class CalendarEventSchema(BaseModel):
    id: Optional[str] = None
    title: str
    event_date: str
    start_time: str
    end_time: str
    attendees: Optional[list] = []
    description: Optional[str] = ""

# --------------------------------------------------------------------------
# API Endpoints
# --------------------------------------------------------------------------

@app.get("/")
def read_root():
    return {"message": "SpeechMail AI Backend with Neon DB Operating Cleanly!", "status": "running"}

# 1. Send Email Endpoint
@app.post("/api/send-email")
def send_email(req: SendEmailRequest, db: Session = Depends(get_db)):
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

        print(f"[SMTP SEND] From: {user_email} -> To: {to_email} | Subject: {subject}")

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

        print(f"[SMTP SUCCESS] Email delivered to {to_email}!")

        # Save record into Neon DB email_history
        if req.emailData:
            ed = req.emailData
            hist_id = f"hist-{int(time.time() * 1000)}"
            db_item = EmailHistoryModel(
                id=hist_id,
                subject=ed.get('subject', subject),
                to_email=to_email,
                greeting=ed.get('greeting', ''),
                body=ed.get('body', body),
                closing=ed.get('closing', ''),
                signature=ed.get('signature', ''),
                transcript=ed.get('transcript', ''),
                intent=ed.get('intent', ''),
                recipient=ed.get('recipient', ''),
                email_type=ed.get('email_type', ''),
                tone=ed.get('tone', ''),
                key_points=ed.get('key_points', []),
                important_dates=ed.get('important_dates', []),
                requested_action=ed.get('requested_action', ''),
                created_at=datetime.utcnow()
            )
            db.add(db_item)
            db.commit()

        return {'success': True, 'message': f'Email successfully delivered to {to_email}!'}

    except Exception as e:
        print(f"[SMTP ERROR] {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# 2. Create Google Calendar Event Endpoint
@app.post("/api/create-calendar-event")
def create_calendar_event(req: CreateCalendarEventRequest, db: Session = Depends(get_db)):
    try:
        user_email = os.environ.get('GMAIL_USER_EMAIL', 'rajsrmap2@gmail.com')
        app_password = os.environ.get('GMAIL_APP_PASSWORD', 'kpusqkiduzbkzgvv').replace(' ', '').strip()

        title = req.title.strip()
        date_str = req.date.strip()
        start_time = req.startTime.strip()
        end_time = req.endTime.strip()
        attendees = req.attendees or [user_email]
        description = req.description.strip() if req.description else 'Scheduled via SpeechMail AI Voice Planner'

        print(f"[GOOGLE CALENDAR AUTO-SAVE] Creating event '{title}' on {date_str} at {start_time}")

        ics_content = generate_ics_content(title, date_str, start_time, end_time, attendees, description, user_email)

        # Send email with iCalendar invite
        msg = MIMEMultipart('mixed')
        msg['From'] = f"SpeechMail AI <{user_email}>"
        msg['To'] = user_email
        msg['Subject'] = f"Calendar Invitation: {title} ({date_str} at {start_time})"

        body_text = f"SpeechMail AI has scheduled a meeting:\n\nTitle: {title}\nDate: {date_str}\nTime: {start_time} - {end_time}\nDescription: {description}\n\nThis event has been sent to Google Calendar for {user_email}."
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
            print(f"[CALENDAR EMAIL SUCCESS] Sent invite to {user_email}")
        except Exception as smtp_err:
            print(f"[CALENDAR EMAIL WARNING] Could not send invite email: {smtp_err}")

        # Save into Neon DB calendar_events table
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
        db.commit()

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

# 3. Email History Endpoints (Neon DB)
@app.get("/api/history")
def get_email_history(db: Session = Depends(get_db)):
    items = db.query(EmailHistoryModel).order_by(EmailHistoryModel.created_at.desc()).all()
    res = []
    for item in items:
        res.append({
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
        })
    return res

@app.post("/api/history")
def add_email_history(item: EmailHistoryItemSchema, db: Session = Depends(get_db)):
    hist_id = item.id or f"hist-{int(time.time() * 1000)}"
    db_item = EmailHistoryModel(
        id=hist_id,
        subject=item.subject,
        to_email=item.to_email,
        greeting=item.greeting,
        body=item.body,
        closing=item.closing,
        signature=item.signature,
        transcript=item.transcript,
        intent=item.intent,
        recipient=item.recipient,
        email_type=item.email_type,
        tone=item.tone,
        key_points=item.key_points or [],
        important_dates=item.important_dates or [],
        requested_action=item.requested_action,
        created_at=datetime.utcnow()
    )
    db.add(db_item)
    db.commit()
    return {"success": True, "id": hist_id}

@app.delete("/api/history/{item_id}")
def delete_email_history_item(item_id: str, db: Session = Depends(get_db)):
    db.query(EmailHistoryModel).filter(EmailHistoryModel.id == item_id).delete()
    db.commit()
    return {"success": True, "message": f"History item {item_id} deleted"}

@app.delete("/api/history")
def clear_all_email_history(db: Session = Depends(get_db)):
    db.query(EmailHistoryModel).delete()
    db.commit()
    return {"success": True, "message": "All history cleared from Neon DB"}

# 4. Calendar Events Endpoints (Neon DB)
@app.get("/api/events")
def get_calendar_events(db: Session = Depends(get_db)):
    events = db.query(CalendarEventModel).order_by(CalendarEventModel.event_date.asc(), CalendarEventModel.start_time.asc()).all()
    res = []
    for ev in events:
        res.append({
            "id": ev.id,
            "title": ev.title,
            "date": ev.event_date,
            "startTime": ev.start_time,
            "endTime": ev.end_time,
            "attendees": ev.attendees or [],
            "description": ev.description
        })
    return res

@app.post("/api/events")
def add_calendar_event(ev: CalendarEventSchema, db: Session = Depends(get_db)):
    evt_id = ev.id or f"evt-{int(time.time() * 1000)}"
    db_event = CalendarEventModel(
        id=evt_id,
        title=ev.title,
        event_date=ev.event_date,
        start_time=ev.start_time,
        end_time=ev.end_time,
        attendees=ev.attendees or [],
        description=ev.description or "",
        created_at=datetime.utcnow()
    )
    db.add(db_event)
    db.commit()
    return {"success": True, "event": {
        "id": evt_id,
        "title": ev.title,
        "date": ev.event_date,
        "startTime": ev.start_time,
        "endTime": ev.end_time,
        "attendees": ev.attendees or [],
        "description": ev.description or ""
    }}

@app.delete("/api/events/{event_id}")
def delete_calendar_event(event_id: str, db: Session = Depends(get_db)):
    db.query(CalendarEventModel).filter(CalendarEventModel.id == event_id).delete()
    db.commit()
    return {"success": True, "message": f"Event {event_id} deleted"}

# 5. Inbox Endpoints (Neon DB)
@app.get("/api/inbox")
def get_inbox_messages(db: Session = Depends(get_db)):
    msgs = db.query(InboxMessageModel).order_by(InboxMessageModel.received_at.desc()).all()
    res = []
    for msg in msgs:
        res.append({
            "id": msg.id,
            "sender": msg.sender,
            "senderEmail": msg.sender_email,
            "subject": msg.subject,
            "snippet": msg.snippet,
            "timeAgo": msg.time_ago,
            "category": msg.category,
            "body": msg.body
        })
    return res

if __name__ == '__main__':
    import uvicorn
    import socket

    def is_port_in_use(port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            return s.connect_ex(('127.0.0.1', port)) == 0

    run_port = PORT
    for p in [PORT, 8081, 8082, 5000, 5001]:
        if not is_port_in_use(p):
            run_port = p
            break

    print(f"Starting SpeechMail FastAPI server on http://127.0.0.1:{run_port}")
    uvicorn.run("server:app", host="127.0.0.1", port=run_port, reload=False)

