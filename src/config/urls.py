from django.contrib import admin
from django.urls import path,include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('apps.accounts.urls')),
    path('document/', include('apps.document.urls')),
    path('agent/', include('apps.agent.urls')),
]
