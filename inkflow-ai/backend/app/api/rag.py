import uuid
from fastapi import APIRouter, HTTPException
from app.schemas import DocumentUploadRequest, RAGSearchRequest, RAGSearchResult
from app.services.rag_service import rag_service

router = APIRouter(prefix="/api/rag", tags=["RAG Vector Database"])

@router.post("/upload")
def upload_document(req: DocumentUploadRequest):
    try:
        doc_id = str(uuid.uuid4())[:8]
        chunks_count = rag_service.add_document(
            doc_id=doc_id,
            title=req.title,
            content=req.content,
            metadata=req.metadata
        )
        return {
            "success": True,
            "doc_id": doc_id,
            "chunks_created": chunks_count,
            "message": f"成功切片并索引 {chunks_count} 个段落至 ChromaDB"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search", response_model=RAGSearchResult)
def search_rag(req: RAGSearchRequest):
    try:
        contexts = rag_service.search_similar(query=req.query, top_k=req.top_k)
        return RAGSearchResult(
            documents=contexts,
            metadatas=[{"source": "ChromaDB"} for _ in contexts],
            distances=[0.0 for _ in contexts]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
def get_rag_stats():
    return rag_service.get_stats()
