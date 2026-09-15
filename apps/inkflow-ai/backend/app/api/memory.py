from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import UserPreferenceSchema
from app.services.memory_service import memory_service
from app.models import ChatHistory

router = APIRouter(prefix="/api/memory", tags=["Memory & Preferences"])

@router.get("/preferences", response_model=UserPreferenceSchema)
def get_preferences(db: Session = Depends(get_db)):
    pref = memory_service.get_or_create_preference(db)
    return UserPreferenceSchema(
        writing_style=pref.writing_style,
        target_platform=pref.target_platform,
        custom_system_prompt=pref.custom_system_prompt
    )

@router.post("/preferences", response_model=UserPreferenceSchema)
def update_preferences(data: UserPreferenceSchema, db: Session = Depends(get_db)):
    pref = memory_service.update_preference(db, data)
    return UserPreferenceSchema(
        writing_style=pref.writing_style,
        target_platform=pref.target_platform,
        custom_system_prompt=pref.custom_system_prompt
    )

@router.get("/history")
def get_chat_history(session_id: str = "default_session", limit: int = 20, db: Session = Depends(get_db)):
    return memory_service.get_recent_chat_history(db, session_id=session_id, limit=limit)

@router.delete("/history")
def clear_chat_history(session_id: str = "default_session", db: Session = Depends(get_db)):
    db.query(ChatHistory).filter(ChatHistory.session_id == session_id).delete()
    db.commit()
    return {"success": True, "message": "聊天上下文记忆已重置"}
