from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Project Schemas ---
class ProjectCreate(BaseModel):
    title: str = Field(..., description="项目名称")
    category: str = Field("general", description="分类: 'wechat', 'video_script', 'general'")
    description: Optional[str] = Field(None, description="项目描述")

class ProjectSchema(BaseModel):
    id: int
    title: str
    category: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- File Upload Schemas ---
class UploadedFileSchema(BaseModel):
    id: int
    project_id: Optional[int]
    filename: str
    folder_path: str
    file_size: int
    doc_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Structured AI Response ---
class GeneratedArticleJSON(BaseModel):
    titles: List[str] = Field(description="5个爆款标题", min_items=1)
    outline: List[str] = Field(description="章节大纲")
    content: str = Field(description="Markdown 正文")

# --- API Requests ---
class GenerateRequest(BaseModel):
    topic: str = Field(..., description="创作主题或核心要点")
    platform: str = Field("wechat", description="目标平台: 'wechat' 或 'xiaohongshu'")
    style: Optional[str] = Field(None, description="特定文风要求")
    model: str = Field("deepseek-v4-flash", description="AI 模型选择")
    enable_rag: bool = Field(True, description="是否开启 RAG 检索")
    enable_memory: bool = Field(True, description="是否注入用户习惯记忆")
    session_id: str = Field("default_session", description="会话 ID")
    project_id: Optional[int] = Field(None, description="关联项目 ID")
    selected_file_ids: Optional[List[int]] = Field(None, description="勾选关联的参考文件与文件夹 ID 列表")

class GenerateResponse(BaseModel):
    success: bool
    titles: List[str]
    outline: List[str]
    content: str
    rag_context_used: List[str] = []
    draft_id: Optional[int] = None
    model_used: str = "deepseek-v4-flash"

class ChatRequest(BaseModel):
    message: str = Field(..., description="用户聊天内容")
    model: str = Field("deepseek-v4-flash", description="选择的 AI 模型")
    session_id: str = Field("default_session", description="会话 ID")
    project_id: Optional[int] = Field(None, description="关联项目 ID")
    enable_rag: bool = Field(False)
    enable_memory: bool = Field(True)
    selected_file_ids: Optional[List[int]] = Field(None, description="勾选关联的参考文件 ID 列表")

class DraftUpdateSchema(BaseModel):
    selected_title: Optional[str] = None
    candidate_titles: Optional[List[str]] = None
    outline: Optional[List[str]] = None
    markdown_content: Optional[str] = None
    formatted_html: Optional[str] = None

# --- RAG Schemas ---
class DocumentUploadRequest(BaseModel):
    title: str
    content: str
    metadata: Optional[Dict[str, Any]] = None

class RAGSearchRequest(BaseModel):
    query: str
    top_k: int = 3
    selected_file_ids: Optional[List[int]] = None

class RAGSearchResult(BaseModel):
    documents: List[str]
    metadatas: List[Dict[str, Any]]
    distances: List[float]

# --- Memory & Preferences ---
class UserPreferenceSchema(BaseModel):
    writing_style: str
    target_platform: str
    custom_system_prompt: str

class ChatMessageSchema(BaseModel):
    role: str
    content: str
    model_used: Optional[str] = None
    created_at: Optional[datetime] = None

# --- Skill & Sandbox ---
class SkillExecuteRequest(BaseModel):
    skill_name: str
    input_text: str
    custom_script: Optional[str] = None
    allow_network: bool = False
    env_vars: Optional[Dict[str, str]] = None
