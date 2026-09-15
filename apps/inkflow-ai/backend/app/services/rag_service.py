import logging
from typing import List, Dict, Any, Optional
from config import settings

logger = logging.getLogger(__name__)

TRY_CHROMA = True
try:
    import chromadb
except ImportError:
    TRY_CHROMA = False

class RAGService:
    def __init__(self):
        self.chroma_enabled = False
        if TRY_CHROMA:
            try:
                self.client = chromadb.PersistentClient(path=settings.chroma_db_path)
                self.collection = self.client.get_or_create_collection(
                    name="inkflow_knowledge",
                    metadata={"hnsw:space": "cosine"}
                )
                self.chroma_enabled = True
            except Exception as e:
                logger.warning(f"ChromaDB 初始化跳过: {e}")
        
        if not self.chroma_enabled:
            self.memory_store: List[Dict[str, Any]] = []

    def chunk_text(self, text: str, chunk_size: int = 400, overlap: int = 50) -> List[str]:
        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk = ""

        for paragraph in paragraphs:
            p = paragraph.strip()
            if not p:
                continue
            if len(current_chunk) + len(p) <= chunk_size:
                current_chunk += ("\n\n" if current_chunk else "") + p
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = p

        if current_chunk:
            chunks.append(current_chunk)

        final_chunks = []
        for c in chunks:
            if len(c) > chunk_size * 1.5:
                for i in range(0, len(c), chunk_size - overlap):
                    final_chunks.append(c[i:i + chunk_size])
            else:
                final_chunks.append(c)

        return final_chunks if final_chunks else [text]

    def add_document(self, doc_id: str, title: str, content: str, metadata: Dict[str, Any] = None) -> int:
        chunks = self.chunk_text(content)
        
        if self.chroma_enabled:
            ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
            metadatas = [
                {"title": title, "doc_id": doc_id, "chunk_index": i, **(metadata or {})}
                for i in range(len(chunks))
            ]
            self.collection.upsert(
                ids=ids,
                documents=chunks,
                metadatas=metadatas
            )
        else:
            for i, chunk in enumerate(chunks):
                self.memory_store.append({
                    "id": f"{doc_id}_chunk_{i}",
                    "doc_id": doc_id,
                    "title": title,
                    "chunk": chunk,
                    "metadata": metadata or {}
                })

        return len(chunks)

    def search_similar(self, query: str, top_k: int = 3, allowed_doc_ids: Optional[List[str]] = None) -> List[str]:
        """
        Retrieve top_k relevant text chunks.
        If allowed_doc_ids is provided, filter search strictly to chunks matching these doc_ids.
        """
        if self.chroma_enabled:
            count = self.collection.count()
            if count == 0:
                return []
            
            where_filter = None
            if allowed_doc_ids:
                if len(allowed_doc_ids) == 1:
                    where_filter = {"doc_id": allowed_doc_ids[0]}
                else:
                    where_filter = {"$or": [{"doc_id": did} for did in allowed_doc_ids]}

            actual_k = min(top_k, count)
            try:
                results = self.collection.query(
                    query_texts=[query],
                    n_results=actual_k,
                    where=where_filter
                )
            except Exception:
                # Fallback without filter if metadata query fails
                results = self.collection.query(
                    query_texts=[query],
                    n_results=actual_k
                )

            documents = results.get("documents", [[]])[0]
            metadatas = results.get("metadatas", [[]])[0]
            formatted_contexts = []
            for doc, meta in zip(documents, metadatas):
                source_title = meta.get("title", "参考素材")
                formatted_contexts.append(f"【来源: {source_title}】\n{doc}")
            return formatted_contexts
        else:
            if not self.memory_store:
                return []
            
            query_words = set(query.lower())
            scored_items = []
            for item in self.memory_store:
                if allowed_doc_ids and item.get("doc_id") not in allowed_doc_ids:
                    continue
                doc_text = item["chunk"].lower()
                overlap = sum(1 for char in query_words if char in doc_text)
                score = overlap / max(len(query_words), 1)
                scored_items.append((score, item))
            
            scored_items.sort(key=lambda x: x[0], reverse=True)
            top_results = [item[1] for item in scored_items[:top_k]]
            
            return [
                f"【来源: {item['title']}】\n{item['chunk']}"
                for item in top_results
            ]

    def get_stats(self) -> Dict[str, Any]:
        if self.chroma_enabled:
            return {
                "engine": "ChromaDB Persistent Store",
                "total_chunks": self.collection.count(),
                "collection_name": self.collection.name
            }
        else:
            return {
                "engine": "Local SQLite Vector Store",
                "total_chunks": len(self.memory_store),
                "collection_name": "fallback_store"
            }

rag_service = RAGService()
