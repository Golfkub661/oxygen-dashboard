from django.urls import path
from oxygen_app import views

urlpatterns = [
    # ─── Dashboard ────────────────────────────────────────────
    path('', views.dashboard, name='dashboard'),

    # ─── Latest Data ──────────────────────────────────────────
    path('api/latest/', views.api_latest, name='api_latest'),

    # ─── Relay ────────────────────────────────────────────────
    path('api/relay/<int:relay_num>/', views.api_relay, name='api_relay'),

    # ─── Recording ────────────────────────────────────────────
    path('api/recording/', views.api_recording, name='api_recording'),

    # ─── Calibrate ────────────────────────────────────────────
    path('api/calibrate/start/',  views.api_calibrate_start,  name='api_calibrate_start'),
    path('api/calibrate/status/', views.api_calibrate_status, name='api_calibrate_status'),

    # ─── History ──────────────────────────────────────────────
    path('api/history/',          views.api_history,          name='api_history'),
    path('api/available-dates/',  views.api_available_dates,  name='api_available_dates'),

    # ─── Sessions ─────────────────────────────────────────────
    path('api/sessions/',                          views.api_sessions_list,     name='api_sessions_list'),
    path('api/sessions/start/',                    views.api_sessions_start,    name='api_sessions_start'),
    path('api/sessions/stop/',                     views.api_sessions_stop,     name='api_sessions_stop'),
    path('api/sessions/<int:session_id>/readings/', views.api_sessions_readings, name='api_sessions_readings'),
]