import os
import json
from sqlalchemy import create_engine, Column, String, Text, DateTime, JSON
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

# Load Neon DB PostgreSQL URL or fallback to SQLite
DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("NEON_DB_URL")

if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./speechmail.db"

# Handle postgresql:// vs postgres:// URL scheme
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

print(f"[DATABASE] Initializing database with target engine: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")

engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

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

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed default calendar events if empty
        if db.query(CalendarEventModel).count() == 0:
            default_events = [
                CalendarEventModel(
                    id="evt-1",
                    title="Product Strategy Sync",
                    event_date="2026-08-07",
                    start_time="10:00",
                    end_time="11:00",
                    attendees=["alex@techcorp.com", "sarah@techcorp.com"],
                    description="Weekly product roadmap discussion"
                ),
                CalendarEventModel(
                    id="evt-2",
                    title="Client Onboarding Review",
                    event_date="2026-08-07",
                    start_time="15:30",
                    end_time="16:30",
                    attendees=["client@acme.org"],
                    description="Onboarding walkthrough with client team"
                )
            ]
            db.add_all(default_events)

        # Seed default inbox messages if empty
        if db.query(InboxMessageModel).count() == 0:
            default_inbox = [
                InboxMessageModel(
                    id="msg-101",
                    sender="Sarah Jenkins (VP Engineering)",
                    sender_email="sarah@techcorp.com",
                    subject="Q3 Product Roadmap Review & Sprint Planning",
                    snippet="Hi team, Please confirm your availability for tomorrow's sprint review at 2:00 PM...",
                    time_ago="10 mins ago",
                    category="Urgent",
                    body="Hi team,\n\nPlease confirm your availability for tomorrow's sprint review at 2:00 PM. We need to align on the upcoming release milestones."
                ),
                InboxMessageModel(
                    id="msg-102",
                    sender="David Miller (Design Lead)",
                    sender_email="david@designhub.io",
                    subject="Updated UI/UX Mockups for SpeechMail AI App",
                    snippet="Hey! Attached are the updated design specs for dark mode and glassmorphism elements...",
                    time_ago="1 hour ago",
                    category="Design",
                    body="Hey!\n\nAttached are the updated design specs for dark mode and glassmorphism elements. Let me know what you think."
                ),
                InboxMessageModel(
                    id="msg-103",
                    sender="HR Operations Team",
                    sender_email="hr@techcorp.com",
                    subject="Reminder: Leave Application Guidelines & Policy",
                    snippet="Dear Employees, Kindly submit your planned leaves at least 24 hours in advance...",
                    time_ago="3 hours ago",
                    category="HR Policy",
                    body="Dear Employees,\n\nKindly submit your planned leaves at least 24 hours in advance through our AI speech portal or direct manager approval."
                )
            ]
            db.add_all(default_inbox)

        db.commit()
    except Exception as e:
        print(f"[DB SEED ERROR] {e}")
        db.rollback()
    finally:
        db.close()
