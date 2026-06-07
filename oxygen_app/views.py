from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from .models import OxygenReading
from . import mqtt_client
import json
from datetime import timedelta
from collections import defaultdict

def dashboard(request):
    latest = OxygenReading.objects.order_by('-timestamp').first()
    return render(request, 'dashboard.html', {'latest': latest})

def api_latest(request):
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

def api_history(request):
    hours = int(request.GET.get('hours', 1))
    since = timezone.now() - timedelta(hours=hours)
    readings = OxygenReading.objects.filter(timestamp__gte=since).order_by('timestamp')

    # จัดกลุ่มทุก 1 นาที
    groups = defaultdict(list)
    for r in readings:
        local_time = timezone.localtime(r.timestamp)
        # key = "DD/MM/YYYY HH:MM" ตัด second ออก
        minute_key = local_time.strftime('%d/%m/%Y %H:%M')
        groups[minute_key].append(r)

    # คำนวณเฉลี่ยแต่ละนาที
    data = []
    for minute_key in sorted(groups.keys()):
        group = groups[minute_key]
        count = len(group)
        data.append({
            'timestamp': minute_key,
            'o2_pct':   round(sum(r.value       for r in group) / count, 2),
            'o2_mgl':   round(sum(r.mgl         for r in group) / count, 2),
            'temp':     round(sum(r.temperature for r in group) / count, 2),
            'temp_air': round(sum(r.temp_air    for r in group) / count, 2),
            'humidity': round(sum(r.humidity    for r in group) / count, 2),
        })

    # เรียงจากใหม่ไปเก่า
    data.reverse()

    return JsonResponse({'data': data, 'hours': hours, 'total': len(data)})