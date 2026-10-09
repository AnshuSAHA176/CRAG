from celery import shared_task
import requests
import tempfile
from .models import Document
from .RAG.chunking import chunking
from .RAG.embedding import generate_embedding



@shared_task(bind = True,ignore_result =True)
def document_proccess(self,document_id):
        doc = Document.objects.get(id = document_id)
        doc.status = Document.Status.PROCESSING
        doc.save(update_fields=['status'])
        try:
            pdf_url = doc.file.url.replace("http://", "https://")

            response = requests.get(
                pdf_url,
                timeout=60,
            )

            response.raise_for_status()

            with tempfile.NamedTemporaryFile(suffix='pdf') as temfile:
                    temfile.write(response.content)
                    temfile.flush()
                    chunks = chunking(temfile.name)
        except Exception as e:
               ...


