import os
import uuid
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import UploadedFile as UploadedFileModel
from app.schemas import UploadedFileSchema
from app.services.rag_service import rag_service
from config import settings

router = APIRouter(prefix="/api/files", tags=["File & Folder Upload Manager"])

UPLOAD_DIR = Path(settings.data_path) / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.get("", response_model=List[UploadedFileSchema])
def list_files(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(UploadedFileModel)
    if project_id:
        query = query.filter(UploadedFileModel.project_id == project_id)
    files = query.order_by(UploadedFileModel.created_at.desc()).all()
    return files

@router.post("/upload")
async def upload_files(
    files: List[UploadFile] = File(...),
    folder_paths: Optional[List[str]] = Form(None),
    project_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Handle single/multiple file uploads and folder uploads (with relative folder_paths).
    Saves file to disk, records in SQLite, chunks text and indexes into ChromaDB RAG.
    """
    results = []
    
    for idx, file in enumerate(files):
        folder_rel = folder_paths[idx] if (folder_paths and idx < len(folder_paths)) else ""
        doc_id = str(uuid.uuid4())[:8]

        # Target directory structure
        target_folder = UPLOAD_DIR / (folder_rel if folder_rel else ".")
        target_folder.mkdir(parents=True, exist_ok=True)

        target_file_path = target_folder / file.filename

        # Write uploaded binary content to disk
        content_bytes = await file.read()
        with open(target_file_path, "wb") as f:
            f.write(content_bytes)

        file_size = len(content_bytes)

        # Attempt to decode text content for RAG indexing
        text_content = ""
        try:
            text_content = content_bytes.decode("utf-8")
        except UnicodeDecodeError:
            try:
                text_content = content_bytes.decode("gbk")
            except UnicodeDecodeError:
                text_content = f"二进制文件: {file.filename}"

        # Add to ChromaDB RAG Vector Store
        chunks_count = 0
        if text_content and not text_content.startswith("二进制文件"):
            chunks_count = rag_service.add_document(
                doc_id=doc_id,
                title=file.filename,
                content=text_content,
                metadata={"folder_path": folder_rel, "project_id": project_id}
            )

        # Record in SQLite Database
        db_file = UploadedFileModel(
            project_id=project_id,
            filename=file.filename,
            folder_path=folder_rel,
            file_path=str(target_file_path.resolve()),
            file_size=file_size,
            doc_id=doc_id
        )
        db.add(db_file)
        db.commit()
        db.refresh(db_file)

        results.append({
            "id": db_file.id,
            "filename": db_file.filename,
            "folder_path": db_file.folder_path,
            "file_size": db_file.file_size,
            "doc_id": doc_id,
            "chunks_created": chunks_count
        })

    return {
        "success": True,
        "uploaded_count": len(results),
        "files": results
    }

@router.get("/{file_id}/download")
def download_file(file_id: int, db: Session = Depends(get_db)):
    from fastapi.responses import FileResponse
    db_file = db.query(UploadedFileModel).filter(UploadedFileModel.id == file_id).first()
    if not db_file or not db_file.file_path or not os.path.exists(db_file.file_path):
        raise HTTPException(status_code=404, detail="文件不存在或已被删除")
    return FileResponse(
        path=db_file.file_path,
        filename=db_file.filename,
        media_type="application/octet-stream"
    )

@router.delete("/{file_id}")
def delete_file(file_id: int, db: Session = Depends(get_db)):
    db_file = db.query(UploadedFileModel).filter(UploadedFileModel.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="未找到指定文件")

    # Remove physical file if exists
    if db_file.file_path and os.path.exists(db_file.file_path):
        try:
            os.remove(db_file.file_path)
        except Exception:
            pass

    db.delete(db_file)
    db.commit()
    return {"success": True, "message": f"文件 {db_file.filename} 已成功删除"}
