import chromadb
from chromadb.config import Settings
from app.core.config import settings
import uuid

class ChromaService:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=settings.CHROMA_DB_DIR)
        
        # Collection for patient reports
        self.reports_collection = self.client.get_or_create_collection(
            name="patient_reports",
            metadata={"hnsw:space": "cosine"}
        )
        
        # Collection for lab packages
        self.packages_collection = self.client.get_or_create_collection(
            name="lab_packages",
            metadata={"hnsw:space": "cosine"}
        )

    def add_report_embedding(self, user_id: int, report_id: int, text: str):
        """Store report text embedding in ChromaDB"""
        self.reports_collection.add(
            documents=[text],
            metadatas=[{"user_id": user_id, "report_id": report_id}],
            ids=[f"report_{report_id}_{uuid.uuid4().hex[:8]}"]
        )

    def add_report_chunks(self, user_id: int, report_id: int, chunks: list[str]):
        """Store multiple chunks of report text in ChromaDB"""
        if not chunks:
            return
        ids = [f"report_{report_id}_chunk_{i}_{uuid.uuid4().hex[:6]}" for i, _ in enumerate(chunks)]
        metadatas = [{"user_id": user_id, "report_id": report_id, "chunk_index": i} for i, _ in enumerate(chunks)]
        self.reports_collection.add(
            documents=chunks,
            metadatas=metadatas,
            ids=ids
        )

    def search_reports(self, query: str, user_id: int, n_results: int = 3):
        """Search similar reports for a specific user"""
        results = self.reports_collection.query(
            query_texts=[query],
            n_results=n_results,
            where={"user_id": user_id}
        )
        return results

    def add_package_embedding(self, package_id: int, name: str, description: str):
        """Store package description in ChromaDB"""
        text = f"Package: {name}. Description: {description}"
        self.packages_collection.add(
            documents=[text],
            metadatas=[{"package_id": package_id}],
            ids=[f"package_{package_id}"]
        )

    def search_packages(self, query: str, n_results: int = 3):
        """Search available packages based on natural language query"""
        results = self.packages_collection.query(
            query_texts=[query],
            n_results=n_results
        )
        return results

chroma_service = ChromaService()
