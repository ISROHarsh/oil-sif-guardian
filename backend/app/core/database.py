"""
Database Connection and Session Management via SQLAlchemy.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.core.config import settings

# Engine configuration with thread check disabled for SQLite
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency yielding a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initializes tables in database and applies automatic schema updates."""
    Base.metadata.create_all(bind=engine)
    if settings.DATABASE_URL.startswith("sqlite"):
        with engine.connect() as conn:
            try:
                result = conn.execute(text("PRAGMA table_info(reports)"))
                columns = [row[1] for row in result.fetchall()]
                if "quality_score" not in columns:
                    conn.execute(text("ALTER TABLE reports ADD COLUMN quality_score FLOAT"))
                if "quality_grade" not in columns:
                    conn.execute(text("ALTER TABLE reports ADD COLUMN quality_grade VARCHAR(8)"))
                conn.commit()
            except Exception:
                pass

