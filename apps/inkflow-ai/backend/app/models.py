from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    category = Column(String, default="general") # 'wechat', 'xiaohongshu', 'code', 'general'
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    drafts = relationship("ArticleDraft", back_populates="project", cascade="all, delete-orphan")
    files = relationship("UploadedFile", back_populates="project", cascade="all, delete-orphan")

class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    filename = Column(String, index=True)
    folder_path = Column(String, default="")  # Relative folder path if uploaded as folder
    file_path = Column(String)                # Stored disk path in DATA_DIR/uploads
    file_size = Column(Integer, default=0)    # Bytes
    doc_id = Column(String, index=True)       # ChromaDB document UUID
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="files")

class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, default="default_user", unique=True, index=True)
    writing_style = Column(String, default="专业、幽默、有吸引力、干货满满")
    target_platform = Column(String, default="wechat")  # 'wechat' or 'xiaohongshu'
    custom_system_prompt = Column(Text, default="文章需具备吸引人的钩子（Hook），段落简短明快，排版层次分明。")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, default="default_session", index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    role = Column(String)  # 'user', 'assistant', 'system'
    content = Column(Text)
    model_used = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ArticleDraft(Base):
    __tablename__ = "article_drafts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    topic = Column(String, index=True)
    platform = Column(String)  # 'wechat' or 'xiaohongshu'
    selected_title = Column(String)
    candidate_titles = Column(JSON)  # List of 5 titles
    outline = Column(JSON)           # Outline sections
    markdown_content = Column(Text)  # Markdown content
    formatted_html = Column(Text, nullable=True)
    rag_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="drafts")

class SkillRegistry(Base):
    __tablename__ = "skill_registry"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text)
    permission_network = Column(Boolean, default=False)
    env_whitelist = Column(JSON, default=list)
    script_content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
