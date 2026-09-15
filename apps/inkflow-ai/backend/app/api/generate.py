from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.schemas import GenerateRequest, GenerateResponse, ChatRequest, DraftUpdateSchema
from app.services.ai_service import ai_service
from app.services.rag_service import rag_service
from app.services.memory_service import memory_service
from app.models import ArticleDraft

router = APIRouter(prefix="/api/generate", tags=["AI Generation & Editing"])

@router.post("", response_model=GenerateResponse)
def generate_article(req: GenerateRequest, db: Session = Depends(get_db)):
    try:
        # 1. Long-term memory retrieval
        style_prompt = req.style or ""
        if req.enable_memory:
            pref = memory_service.get_or_create_preference(db)
            style_prompt = f"{pref.writing_style}。{pref.custom_system_prompt} {style_prompt}".strip()

        # 2. RAG Top-3 context retrieval (filtered by user-checked file IDs)
        rag_contexts = []
        if req.enable_rag:
            allowed_doc_ids = None
            if req.selected_file_ids:
                from app.models import UploadedFile
                files = db.query(UploadedFile).filter(UploadedFile.id.in_(req.selected_file_ids)).all()
                allowed_doc_ids = [f.doc_id for f in files if f.doc_id]

            rag_contexts = rag_service.search_similar(req.topic, top_k=3, allowed_doc_ids=allowed_doc_ids)

        # 3. Short-term chat history
        chat_history = memory_service.get_recent_chat_history(db, session_id=req.session_id)

        # 4. Invoke Multi-Model AI Service
        result = ai_service.generate_content(
            topic=req.topic,
            platform=req.platform,
            model=req.model,
            style_preference=style_prompt,
            rag_contexts=rag_contexts,
            chat_history=chat_history
        )

        # 5. Save generated draft to SQLite
        draft = ArticleDraft(
            project_id=req.project_id,
            topic=req.topic,
            platform=req.platform,
            selected_title=result.titles[0],
            candidate_titles=result.titles,
            outline=result.outline,
            markdown_content=result.content,
            rag_used=req.enable_rag
        )
        db.add(draft)
        db.commit()
        db.refresh(draft)

        # 6. Record chat turn in Short-term memory
        memory_service.add_chat_message(
            db, role="user", content=f"生成主题：{req.topic} ({req.platform})",
            session_id=req.session_id, model_used=req.model
        )
        memory_service.add_chat_message(
            db, role="assistant", content=f"已成功生成，包含5个候选标题与正文。",
            session_id=req.session_id, model_used=req.model
        )

        return GenerateResponse(
            success=True,
            titles=result.titles,
            outline=result.outline,
            content=result.content,
            rag_context_used=rag_contexts,
            draft_id=draft.id,
            model_used=req.model
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
def chat_conversation(req: ChatRequest, db: Session = Depends(get_db)):
    """Conversational chat endpoint supporting SSE typewriter streaming."""
    try:
        style_prompt = ""
        if req.enable_memory:
            pref = memory_service.get_or_create_preference(db)
            style_prompt = pref.writing_style

        rag_contexts = []
        if req.enable_rag:
            allowed_doc_ids = None
            if req.selected_file_ids:
                from app.models import UploadedFile
                files = db.query(UploadedFile).filter(UploadedFile.id.in_(req.selected_file_ids)).all()
                allowed_doc_ids = [f.doc_id for f in files if f.doc_id]

            rag_contexts = rag_service.search_similar(req.message, top_k=2, allowed_doc_ids=allowed_doc_ids)

        chat_history = memory_service.get_recent_chat_history(db, session_id=req.session_id)

        # Record user message
        memory_service.add_chat_message(db, role="user", content=req.message, session_id=req.session_id, model_used=req.model)

        def event_stream():
            full_text = ""
            for text_chunk in ai_service.chat_dialogue_stream(
                user_message=req.message,
                model=req.model,
                style_preference=style_prompt,
                rag_contexts=rag_contexts,
                chat_history=chat_history
            ):
                full_text += text_chunk
                yield text_chunk

            # Save complete assistant reply to SQLite
            db_session = SessionLocal()
            try:
                memory_service.add_chat_message(db_session, role="assistant", content=full_text, session_id=req.session_id, model_used=req.model)
            finally:
                db_session.close()

        from fastapi.responses import StreamingResponse
        return StreamingResponse(event_stream(), media_type="text/event-stream")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/drafts/{draft_id}")
def update_draft(draft_id: int, data: DraftUpdateSchema, db: Session = Depends(get_db)):
    """API endpoint to save user live modifications on titles, outline, markdown content, and HTML."""
    draft = db.query(ArticleDraft).filter(ArticleDraft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="草稿不存在")

    if data.selected_title is not None:
        draft.selected_title = data.selected_title
    if data.candidate_titles is not None:
        draft.candidate_titles = data.candidate_titles
    if data.outline is not None:
        draft.outline = data.outline
    if data.markdown_content is not None:
        draft.markdown_content = data.markdown_content
    if data.formatted_html is not None:
        draft.formatted_html = data.formatted_html

    db.commit()
    db.refresh(draft)
    return {"success": True, "draft": draft}
