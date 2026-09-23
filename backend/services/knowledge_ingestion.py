"""
Local Knowledge Base Ingestion & Retrieval Service.

Extracts text from university PDF documents in knowledge/raw/,
chunks them into searchable segments, and provides keyword-based
retrieval for the local RAG pipeline (no Azure dependency needed).
"""
import logging
import pathlib
import re
from dataclasses import dataclass, field
from typing import List, Optional

logger = logging.getLogger(__name__)

KNOWLEDGE_DIR = pathlib.Path(__file__).parent.parent.parent / "knowledge" / "raw"

# Category mapping based on directory structure
CATEGORY_MAP = {
    "academic": "academic",
    "student-services": "student_services",
    "general": "general_faq",
}


@dataclass
class KnowledgeChunk:
    """A single chunk of text extracted from a university document."""
    text: str
    source_file: str
    document_title: str
    category: str  # academic, student_services, general_faq
    page_number: Optional[int] = None
    section: Optional[str] = None


@dataclass
class RetrievalResult:
    """Result from knowledge base search."""
    chunks: List[KnowledgeChunk] = field(default_factory=list)
    query: str = ""


# In-memory knowledge store (loaded once at startup)
_knowledge_chunks: List[KnowledgeChunk] = []
_is_loaded: bool = False


def _extract_text_from_pdf(pdf_path: pathlib.Path) -> List[dict]:
    """Extract text page-by-page from a PDF file."""
    pages = []
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(str(pdf_path))
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text and text.strip():
                pages.append({"page": i + 1, "text": text.strip()})
    except ImportError:
        logger.error("PyPDF2 not installed. Run: pip install PyPDF2")
    except Exception as ex:
        logger.error(f"Failed to extract text from {pdf_path.name}: {ex}")

    # If PyPDF2 fails (e.g., scanned PDF), try reading as text
    if not pages:
        try:
            raw = pdf_path.read_text(encoding="utf-8", errors="ignore")
            if raw.strip():
                pages.append({"page": 1, "text": raw.strip()})
        except Exception:
            pass

    return pages


def _chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into overlapping chunks."""
    # Split on paragraph boundaries first
    paragraphs = re.split(r'\n\s*\n', text)
    chunks = []
    current_chunk = ""

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        if len(current_chunk) + len(para) <= chunk_size:
            current_chunk += ("\n\n" + para) if current_chunk else para
        else:
            if current_chunk:
                chunks.append(current_chunk)
            # If a single paragraph is longer than chunk_size, split it further
            if len(para) > chunk_size:
                words = para.split()
                current_chunk = ""
                for word in words:
                    if len(current_chunk) + len(word) + 1 <= chunk_size:
                        current_chunk += (" " + word) if current_chunk else word
                    else:
                        if current_chunk:
                            chunks.append(current_chunk)
                        current_chunk = word
            else:
                current_chunk = para

    if current_chunk:
        chunks.append(current_chunk)

    return chunks


def _derive_document_title(filename: str) -> str:
    """Convert filename to a human-readable document title."""
    name = pathlib.Path(filename).stem
    # Replace underscores and hyphens with spaces
    name = name.replace("_", " ").replace("-", " ")
    # Title case
    return name.title()


def load_knowledge_base() -> int:
    """
    Load and index all PDF documents from knowledge/raw/.
    Returns the number of chunks created.
    """
    global _knowledge_chunks, _is_loaded

    if _is_loaded and _knowledge_chunks:
        return len(_knowledge_chunks)

    _knowledge_chunks = []

    if not KNOWLEDGE_DIR.exists():
        logger.warning(f"Knowledge directory not found: {KNOWLEDGE_DIR}")
        _is_loaded = True
        return 0

    pdf_count = 0
    for category_dir in KNOWLEDGE_DIR.iterdir():
        if not category_dir.is_dir():
            continue

        category = CATEGORY_MAP.get(category_dir.name, "general_faq")

        # Ingest PDF files
        for pdf_file in category_dir.glob("*.pdf"):
            pdf_count += 1
            doc_title = _derive_document_title(pdf_file.name)
            pages = _extract_text_from_pdf(pdf_file)

            for page_data in pages:
                text_chunks = _chunk_text(page_data["text"])
                for chunk_text in text_chunks:
                    _knowledge_chunks.append(KnowledgeChunk(
                        text=chunk_text,
                        source_file=pdf_file.name,
                        document_title=doc_title,
                        category=category,
                        page_number=page_data["page"],
                    ))

        # Ingest Markdown and text knowledge files
        for doc_file in list(category_dir.glob("*.md")) + list(category_dir.glob("*.txt")):
            pdf_count += 1
            doc_title = _derive_document_title(doc_file.name)
            try:
                raw_text = doc_file.read_text(encoding="utf-8", errors="ignore")
                text_chunks = _chunk_text(raw_text)
                for chunk_text in text_chunks:
                    _knowledge_chunks.append(KnowledgeChunk(
                        text=chunk_text,
                        source_file=doc_file.name,
                        document_title=doc_title,
                        category=category,
                        page_number=1,
                    ))
            except Exception as ex:
                logger.error(f"Failed to read doc {doc_file.name}: {ex}")

    _is_loaded = True
    logger.info(f"Knowledge base loaded: {pdf_count} files → {len(_knowledge_chunks)} chunks")
    return len(_knowledge_chunks)


def search_knowledge(query: str, category: Optional[str] = None, top_k: int = 5) -> RetrievalResult:
    """
    Search the knowledge base using keyword matching.
    Ranks chunks by relevance score based on term overlap with the query.
    """
    if not _is_loaded:
        load_knowledge_base()

    if not _knowledge_chunks:
        return RetrievalResult(query=query)

    # Tokenize query
    query_terms = set(re.findall(r'\b\w{3,}\b', query.lower()))

    if not query_terms:
        return RetrievalResult(query=query)

    scored_chunks = []
    for chunk in _knowledge_chunks:
        # Optional category filter
        if category and chunk.category != category:
            continue

        chunk_lower = chunk.text.lower()
        chunk_terms = set(re.findall(r'\b\w{3,}\b', chunk_lower))

        # Score = number of matching terms + bonus for exact phrase fragments
        matching_terms = query_terms & chunk_terms
        score = len(matching_terms)

        # Bonus: check for multi-word phrase matches from query
        for term in query_terms:
            if term in chunk_lower:
                score += 0.5

        # Bonus: check for consecutive query words appearing together
        query_words = query.lower().split()
        for i in range(len(query_words) - 1):
            bigram = f"{query_words[i]} {query_words[i + 1]}"
            if bigram in chunk_lower:
                score += 2.0

        if score > 0:
            scored_chunks.append((score, chunk))

    # Sort by score descending and take top_k
    scored_chunks.sort(key=lambda x: x[0], reverse=True)
    top_chunks = [chunk for _, chunk in scored_chunks[:top_k]]

    return RetrievalResult(chunks=top_chunks, query=query)
