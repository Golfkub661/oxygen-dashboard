from django.urls import path
from . import views

urlpatterns = [
    path('',              views.dashboard,  name='dashboard'),
    path('api/latest/',   views.api_latest, name='api_latest'),
    path('api/relay/<int:relay_num>/', views.api_relay, name='api_relay'),
]