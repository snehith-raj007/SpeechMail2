import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer, Float, JSON
from sqlalchemy.orm import declarative_base

Base = declarative_base()

# 1. Email Model
class Email(Base):
    __tablename__ = "emails"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sender = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    priority = Column(Integer, default=1, index=True)  # Higher integer = higher priority
    created_at = Column(DateTime, default=datetime.utcnow)

# 2. Draft Model
class Draft(Base):
    __tablename__ = "drafts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email_id = Column(String, nullable=True)
    draft_text = Column(Text, nullable=False)
    confidence = Column(Float, default=0.95)
    status = Column(String, default="pending")  # pending / approved / auto_sent
    created_at = Column(DateTime, default=datetime.utcnow)

# 3. Meeting Model
class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    proposed_time = Column(String, nullable=True)
    confirmed_time = Column(String, nullable=True)
    status = Column(String, default="negotiating")  # negotiating / confirmed
    negotiation_log = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# 4. AgentActivity Model
class AgentActivity(Base):
    __tablename__ = "agent_activities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_name = Column(String, nullable=False)
    action = Column(String, nullable=False)
    reasoning = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# 5. Additional Application Models for SpeechMail AI
class EmailHistoryModel(Base):
    __tablename__ = "email_history"

    id = Column(String, primary_key=True, index=True)
    subject = Column(Text, nullable=True)
    to_email = Column(String, nullable=True)
    greeting = Column(Text, nullable=True)
    body = Column(Text, nullable=True)
    closing = Column(Text, nullable=True)
    signature = Column(Text, nullable=True)
    transcript = Column(Text, nullable=True)
    intent = Column(String, nullable=True)
    recipient = Column(String, nullable=True)
    email_type = Column(String, nullable=True)
    tone = Column(String, nullable=True)
    key_points = Column(JSON, nullable=True)
    important_dates = Column(JSON, nullable=True)
    requested_action = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class CalendarEventModel(Base):
    __tablename__ = "calendar_events"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    event_date = Column(String, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    attendees = Column(JSON, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class InboxMessageModel(Base):
    __tablename__ = "inbox_messages"

    id = Column(String, primary_key=True, index=True)
    sender = Column(String, nullable=False)
    sender_email = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    snippet = Column(Text, nullable=True)
    time_ago = Column(String, nullable=True)
    category = Column(String, nullable=True)
    body = Column(Text, nullable=True)
    received_at = Column(DateTime, default=datetime.utcnow)

# 6. ScheduledEmail Model for Automated Delayed Email Dispatch
class ScheduledEmailModel(Base):
    __tablename__ = "scheduled_emails"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    to_email = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    greeting = Column(Text, nullable=True)
    closing = Column(Text, nullable=True)
    signature = Column(Text, nullable=True)
    priority = Column(Integer, default=1)
    scheduled_at = Column(DateTime, nullable=False)  # Target dispatch time
    status = Column(String, default="pending")        # pending / sent / failed / cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

# 7. EmailSummary Model for AI Perception, Classification & Memory Persistence in Neon DB
class EmailSummaryModel(Base):
    __tablename__ = "email_summaries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    inbox_message_id = Column(String, nullable=True, index=True)
    sender = Column(String, nullable=False)
    sender_email = Column(String, nullable=True)
    subject = Column(String, nullable=False)
    summary = Column(Text, nullable=False)
    priority = Column(String, default="Important")     # Urgent / Important / Routine
    category = Column(String, default="General")       # Meeting Request / Leave / Status Update / etc
    intent = Column(String, nullable=True)
    key_points = Column(JSON, nullable=True)
    action_items = Column(JSON, nullable=True)
    suggested_reply = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


