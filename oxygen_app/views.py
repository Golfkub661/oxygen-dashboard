from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from .models import OxygenReading
from . import mqtt_client
import json
from datetime import timedelta, datetime
from collections import defaultdict
from django.db.models.functions import TruncDate

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

# ⚡ [แก้ไขจุดนี้] อัปเดตฟังก์ชัน api_history บล็อกช่วงเวลา Timezone ให้แม่นยำ
def api_history(request):
    hours = int(request.GET.get('hours', 1))
    date_str = request.GET.get('date', None)

    # ดึงเวลาปัจจุบันในรูปแบบ Local Time (เวลาไทย)
    current_local = timezone.localtime(timezone.now())
    tz = timezone.get_current_timezone()

    if date_str:
        try:
            # 1. แปลง String วันที่ที่ส่งมาจาก Next.js (%d/%m/%Y)
            parsed_date = datetime.strptime(date_str, '%d/%m/%Y').date()
            
            # 2. คัดกรองข้อมูลให้อยู่ใน "วันที่เลือก" แน่นอนไว้ก่อนเพื่อความชัวร์
            # และใช้การจำกัดรายการดึงย้อนหลังจากล่าสุดของวันนั้นๆ ข้อมูลจะไม่หายแน่นอน
            if parsed_date == current_local.date():
                until = current_local
            else:
                end_of_day = datetime.combine(parsed_date, datetime.max.time())
                until = timezone.make_aware(end_of_day, tz)
                
            since = until - timedelta(hours=hours)
            
            readings = OxygenReading.objects.filter(
                timestamp__gte=since,
                timestamp__lte=until
            ).order_by('timestamp')
            
        except Exception as e:
            print(f"Error filtering history with date: {e}")
            return JsonResponse({'data': [], 'total': 0})
    else:
        # 3. หากหน้าบ้านไม่ได้ส่งค่า date มาเลย (โหมดปกติหน้าเว็บตอนแรก) ดึงย้อนหลังจากปัจจุบันทันที
        since = current_local - timedelta(hours=hours)
        readings = OxygenReading.objects.filter(
            timestamp__gte=since,
            timestamp__lte=current_local
        ).order_by('timestamp')

    # --- ส่วนการจัดกลุ่มเวลา (Grouping) ---
    groups = defaultdict(list)
    for r in readings:
        local_time = timezone.localtime(r.timestamp)
        minute_key = local_time.strftime('%d/%m/%Y %H:%M')
        groups[minute_key].append(r)

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

    data.reverse()
    return JsonResponse({'data': data, 'hours': hours, 'total': len(data)})

def api_available_dates(request):
    dates = (
        OxygenReading.objects
        .annotate(date=TruncDate('timestamp'))
        .values_list('date', flat=True)
        .distinct()
        .order_by('-date')
    )
    local_dates = []
    for d in dates:
        aware = timezone.make_aware(datetime.combine(d, datetime.min.time()))
        local = timezone.localtime(aware)
        local_dates.append(local.strftime('%d/%m/%Y'))

    return JsonResponse({'dates': local_dates})