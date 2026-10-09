# tasks.py

import tempfile
import requests

from celery import shared_task
from django.db import transaction

from .models import Document, DocumentChunk
from .RAG.chunking import chunking
from .RAG.embedding import generate_embedding


@shared_task(ignore_result=True)
def document_process(document_id):
    try:
        doc = Document.objects.get(id=document_id)

        doc.status = Document.Status.PROCESSING
        doc.save(update_fields=["status"])

        pdf_url = doc.file.url.replace("http://", "https://")

        response = requests.get(pdf_url, timeout=60)
        response.raise_for_status()

        with tempfile.NamedTemporaryFile(suffix=".pdf") as temp:
            temp.write(response.content)
            temp.flush()

            chunks = chunking(temp.name)

        if not chunks:
            raise ValueError("No text could be extracted from this PDF.")

        chunk_objects = []

        for index, chunk in enumerate(chunks):
            embedding = generate_embedding(chunk["text"])

            if len(embedding) != 1024:
                raise ValueError(
                    f"Expected 1024 embedding dimensions, "
                    f"received {len(embedding)}."
                )

            chunk_objects.append(
                DocumentChunk(
                    document=doc,
                    chunk_index=index,
                    text=chunk["text"],
                    embedding=embedding,
                    metadata={
                        "page_start": chunk["page_start"],
                        "page_end": chunk["page_end"],
                    },
                    token_count=len(chunk["text"].split()),
                )
            )

        with transaction.atomic():
            DocumentChunk.objects.filter(
                document=doc
            ).delete()

            DocumentChunk.objects.bulk_create(chunk_objects)

            doc.status = Document.Status.READY
            doc.save(update_fields=["status"])

    except Exception:
        Document.objects.filter(id=document_id).update(
            status=Document.Status.FAILED
        )
        raise