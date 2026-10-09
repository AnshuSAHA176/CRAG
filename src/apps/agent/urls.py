from django.urls import path
from .views import RagView


urlpatterns =[
    path('',RagView.as_view(),name='rag')
]