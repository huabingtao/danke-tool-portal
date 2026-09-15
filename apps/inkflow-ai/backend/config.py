import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load .env from project root or backend directory
root_dir = Path(__file__).resolve().parent.parent
dotenv_path = root_dir / ".env"
if dotenv_path.exists():
    load_dotenv(dotenv_path)
else:
    load_dotenv()

class Settings(BaseSettings):
    # DeepSeek API Configuration
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")
    DEEPSEEK_BASE_URL: str = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    DEEPSEEK_MODEL: str = os.getenv("DEEPSEEK_MODEL", "deepseek-v4-flash")
    
    # Local-first Data Persistence Directory
    DATA_DIR: str = os.getenv("DATA_DIR", "./data")
    
    @property
    def data_path(self) -> Path:
        p = Path(self.DATA_DIR).resolve()
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def sqlite_db_path(self) -> str:
        return str(self.data_path / "db.sqlite3")

    @property
    def chroma_db_path(self) -> str:
        p = self.data_path / "chroma_db"
        p.mkdir(parents=True, exist_ok=True)
        return str(p)

    @property
    def sandbox_tmp_path(self) -> str:
        p = self.data_path / "sandbox_tmp"
        p.mkdir(parents=True, exist_ok=True)
        return str(p)

    class Config:
        extra = "ignore"

settings = Settings()
