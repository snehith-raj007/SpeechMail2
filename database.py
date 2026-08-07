import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from models import Base

# Load .env file manually if present
env_file = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_file):
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                os.environ[key.strip()] = val.strip()

# 1. Load DATABASE_URL or NEON_DB_URL from environment
DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("NEON_DB_URL")

if not DATABASE_URL:
    # Fallback default if not set
    DATABASE_URL = "sqlite+aiosqlite:///./speechmail.db"

# Format URL for asyncpg: postgresql:// -> postgresql+asyncpg://
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

# Ensure ssl parameter for Neon DB PostgreSQL connection
if "postgresql+asyncpg" in DATABASE_URL:
    if "sslmode=" in DATABASE_URL and "ssl=" not in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("sslmode=require", "ssl=require")
    if "ssl=" not in DATABASE_URL:
        if "?" in DATABASE_URL:
            DATABASE_URL += "&ssl=require"
        else:
            DATABASE_URL += "?ssl=require"

# Print target host securely (hiding password)
masked_url = DATABASE_URL
if "@" in DATABASE_URL:
    creds_part, host_part = DATABASE_URL.split("@", 1)
    masked_url = f"postgresql+asyncpg://***:***@{host_part}"
print(f"[DATABASE] Initializing Async Engine targeting: {masked_url}")

# 2. Create Async Engine & Async Session Maker
try:
    async_engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True
    )
    AsyncSessionLocal = async_sessionmaker(
        async_engine,
        expire_on_commit=False,
        class_=AsyncSession
    )
except Exception as e:
    print(f"[DATABASE CONFIG ERROR] Failed to create async engine: {e}")
    sys.exit(1)

# 3. get_db Dependency for FastAPI Routes
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# 4. Async Database Table Initialization on Startup
async def init_db():
    try:
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("[NEON DB SUCCESS] Connection established! Neon PostgreSQL database tables verified and created successfully.")
        return True
    except Exception as e:
        print("\n" + "="*70)
        print("[NEON DB ERROR] COULD NOT CONNECT TO NEON POSTGRES DATABASE!")
        print(f"Details: {str(e)}")
        print("Please check your DATABASE_URL / NEON_DB_URL connection string in .env")
        print("="*70 + "\n")
        return False
