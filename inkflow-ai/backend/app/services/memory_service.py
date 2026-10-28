from sqlalchemy.orm import Session
from app.models import UserPreference, ChatHistory
from app.schemas import UserPreferenceSchema
from typing import List, Dict, Any

class MemoryService:
    def get_or_create_preference(self, db: Session, user_id: str = "default_user") -> UserPreference:
        pref = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
        if not pref:
            pref = UserPreference(
                user_id=user_id,
                writing_style="专业、幽默、有吸引力、干货满满",
                target_platform="wechat",
                custom_system_prompt="文章需具备吸引人的钩子（Hook），段落简短明快，排版层次分明。"
            )
            db.add(pref)
            db.commit()
            db.refresh(pref)
        return pref

    def update_preference(self, db: Session, data: UserPreferenceSchema, user_id: str = "default_user") -> UserPreference:
        pref = self.get_or_create_preference(db, user_id)
        pref.writing_style = data.writing_style
        pref.target_platform = data.target_platform
        pref.custom_system_prompt = data.custom_system_prompt
        db.commit()
        db.refresh(pref)
        return pref

    def get_recent_chat_history(self, db: Session, session_id: str = "default_session", limit: int = 20) -> List[Dict[str, Any]]:
        history = (
            db.query(ChatHistory)
            .filter(ChatHistory.session_id == session_id)
            .order_by(ChatHistory.id.desc())
            .limit(limit)
            .all()
        )
        history.reverse()
        return [
            {
                "role": item.role,
                "content": item.content,
                "model_used": item.model_used,
                "created_at": item.created_at.strftime("%H:%M") if item.created_at else ""
            }
            for item in history
        ]

    def add_chat_message(self, db: Session, role: str, content: str, session_id: str = "default_session", model_used: str = None):
        msg = ChatHistory(session_id=session_id, role=role, content=content, model_used=model_used)
        db.add(msg)
        db.commit()

memory_service = MemoryService()
