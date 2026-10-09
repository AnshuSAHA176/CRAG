from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from .models import Document
from .serializer import DocumentSerializer


class DocumentView(ModelViewSet):
    permission_classes =[IsAuthenticated]
    serializer_class = DocumentSerializer
    def get_queryset(self):
        return Document.objects.filter(user= self.request.user)
    
    def perform_create(self, serializer):
        return serializer.save(user=self.request.user)