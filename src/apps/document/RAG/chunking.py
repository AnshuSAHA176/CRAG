# RAG/chunking.py

import pymupdf
import numpy as np

from nltk.tokenize import sent_tokenize
from .embedding import generate_embedding


def chunking(document_name, max_sentences=8):
    sentences = []

    with pymupdf.open(document_name) as doc:
        for page_number, page in enumerate(doc, start=1):
            text = page.get_text()

            if not text.strip():
                continue

            for sentence in sent_tokenize(text):
                sentence = sentence.strip()

                if sentence:
                    sentences.append(
                        {
                            "page": page_number,
                            "text": sentence,
                        }
                    )

    if not sentences:
        return []

    if len(sentences) < 2:
        return [
            {
                "text": sentences[0]["text"],
                "page_start": sentences[0]["page"],
                "page_end": sentences[0]["page"],
            }
        ]

    embeddings = np.asarray(
        [generate_embedding(s["text"]) for s in sentences],
        dtype=np.float32,
    )

    if embeddings.ndim != 2 or not np.isfinite(embeddings).all():
        raise ValueError("Invalid sentence embeddings.")

    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    embeddings = embeddings / np.maximum(norms, 1e-12)

    similarities = np.sum(
        embeddings[:-1] * embeddings[1:],
        axis=1,
    )

    threshold = np.percentile(similarities, 20)

    chunks = []
    start = 0

    for i, similarity in enumerate(similarities):
        current_size = i + 1 - start

        if similarity <= threshold or current_size >= max_sentences:
            group = sentences[start : i + 1]

            chunks.append(
                {
                    "text": " ".join(s["text"] for s in group),
                    "page_start": group[0]["page"],
                    "page_end": group[-1]["page"],
                }
            )

            start = i + 1

    if start < len(sentences):
        group = sentences[start:]

        chunks.append(
            {
                "text": " ".join(s["text"] for s in group),
                "page_start": group[0]["page"],
                "page_end": group[-1]["page"],
            }
        )

    return chunks
