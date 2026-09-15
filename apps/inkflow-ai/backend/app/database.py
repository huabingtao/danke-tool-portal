from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from config import settings

SQLALCHEMY_DATABASE_URL = f"sqlite:///{settings.sqlite_db_path}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # 1. Create any missing tables
    Base.metadata.create_all(bind=engine)

    # 2. Auto-migrate missing columns for existing SQLite tables
    with engine.connect() as conn:
        # Check chat_history columns
        try:
            res = conn.execute(text("PRAGMA table_info(chat_history)")).fetchall()
            existing_cols = [r[1] for r in res]
            if "project_id" not in existing_cols:
                print("🛠️ Auto-migrating: Adding column project_id to chat_history table...")
                conn.execute(text("ALTER TABLE chat_history ADD COLUMN project_id INTEGER;"))
            if "model_used" not in existing_cols:
                print("🛠️ Auto-migrating: Adding column model_used to chat_history table...")
                conn.execute(text("ALTER TABLE chat_history ADD COLUMN model_used VARCHAR;"))
            conn.commit()
        except Exception as e:
            print("Auto-migration chat_history warning:", e)

        # Check article_drafts columns
        try:
            res = conn.execute(text("PRAGMA table_info(article_drafts)")).fetchall()
            existing_cols = [r[1] for r in res]
            if "project_id" not in existing_cols:
                print("🛠️ Auto-migrating: Adding column project_id to article_drafts table...")
                conn.execute(text("ALTER TABLE article_drafts ADD COLUMN project_id INTEGER;"))
            if "updated_at" not in existing_cols:
                print("🛠️ Auto-migrating: Adding column updated_at to article_drafts table...")
                conn.execute(text("ALTER TABLE article_drafts ADD COLUMN updated_at DATETIME;"))
            conn.commit()
        except Exception as e:
            print("Auto-migration article_drafts warning:", e)
