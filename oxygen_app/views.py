from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from .models import OxygenReading
from . import mqtt_client
import json

def dashboard(request):
    latest = OxygenReading.objects.order_by('-timestamp').first()
    return render(request, 'dashboard.html', {'latest': latest})

def api_latest(request):
    # ✅ ดึงจาก memory ก่อน (อัปเดตเสมอแม้ไม่ได้ recording)
    data = mqtt_client.latest_data
    if data:
        return JsonResponse({
            'o2_pct':    data.get("o2_pct", 0),
            'o2_mgl':    data.get("o2_mgl", 0),
            'temp':      data.get("temp_water", 0),
            'temp_air':  data.get("temp_air", 0),
            'humidity':  data.get("humidity", 0),
            'relay1':    data.get("relay1", False),
            'relay2':    data.get("relay2", False),
            'relay3':    data.get("relay3", False),
            'timestamp': timezone.localtime(timezone.now()).strftime('%d/%m/%Y %H:%M:%S'),
            'recording': mqtt_client.is_recording,
        })

    # ถ้ายังไม่มีข้อมูลใหม่ใน memory ดึงจาก DB แทน
    latest = OxygenReading.objects.order_by('-timestamp').first()
    if latest:
        local_time = timezone.localtime(latest.timestamp)
        return JsonResponse({
            'o2_pct':    latest.value,
            'o2_mgl':    latest.mgl,
            'temp':      latest.temperature,
            'temp_air':  latest.temp_air,
            'humidity':  latest.humidity,
            'relay1':    latest.relay1,
            'relay2':    latest.relay2,
            'relay3':    latest.relay3,
            'timestamp': local_time.strftime('%d/%m/%Y %H:%M:%S'),
            'recording': mqtt_client.is_recording,
        })

    return JsonResponse({
        'error': 'no data',
        'recording': mqtt_client.is_recording
    })

@csrf_exempt
def api_relay(request, relay_num):
    if request.method == 'POST':
        data  = json.loads(request.body)
        state = data.get('state', False)
        mqtt_client.publish_relay(relay_num, state)

        latest = OxygenReading.objects.order_by('-timestamp').first()
        if latest:
            setattr(latest, f'relay{relay_num}', state)
            latest.save()

        return JsonResponse({'success': True, 'relay': relay_num, 'state': state})
    return JsonResponse({'error': 'POST only'})

@csrf_exempt
def api_recording(request):
    if request.method == 'POST':
        data   = json.loads(request.body)
        action = data.get('action')
        if action == 'start':
            mqtt_client.is_recording = True
        elif action == 'stop':
            mqtt_client.is_recording = False
        return JsonResponse({'recording': mqtt_client.is_recording})
    return JsonResponse({'recording': mqtt_client.is_recording})