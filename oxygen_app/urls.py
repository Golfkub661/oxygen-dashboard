from django.urls import path
from oxygen_app import views

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('api/latest/', views.api_latest, name='api_latest'),
    path('api/relay/<int:relay_num>/', views.api_relay, name='api_relay'),
    path('api/recording/', views.api_recording, name='api_recording'),
    path('api/history/', views.api_history, name='api_history'),
    path('api/available-dates/', views.api_available_dates, name='api_available_dates'),  # ✅ เพิ่ม
]