
from datetime import datetime, timedelta
from collections import defaultdict
import json

from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

from .models import OxygenReading, ExperimentSession
from . import mqtt_client


# ─── Dashboard ───────────────────────────────────────────────

def dashboard(request):
    latest = OxygenReading.objects.order_by('-timestamp').first()
    return render(request, 'dashboard.html', {'latest': latest})


# ─── Latest Data API ─────────────────────────────────────────

def api_latest(request):
    data = mqtt_client.latest_data

    # กรณีมีข้อมูลสดจาก MQTT
    if data:
        return JsonResponse({
            'o2_pct':       data.get("o2_pct", 0),
            'o2_mgl':       data.get("o2_mgl", 0),
            'temp':         data.get("temp_water", 0),
            'temp_air':     data.get("temp_air", 0),
            'humidity':     data.get("humidity", 0),

            'relay1':       data.get("relay1", False),
            'relay2':       data.get("relay2", False),
            'relay3':       data.get("relay3", False),

            'pzem_voltage': data.get("pzem_voltage", 0),
            'pzem_current': data.get("pzem_current", 0),
            'pzem_power':   data.get("pzem_power", 0),
            'pzem_energy':  data.get("pzem_energy", 0),

            'rpm1':         data.get("rpm1", 0),
            'rpm2':         data.get("rpm2", 0),
            'rpm3':         data.get("rpm3", 0),

            # GPS
            'lat':          data.get("lat", None),
            'lng':          data.get("lng", None),

            'timestamp': timezone.localtime(
                timezone.now()
            ).strftime('%d/%m/%Y %H:%M:%S'),

            'recording': mqtt_client.is_recording,
        })

    # กรณีไม่มีข้อมูล MQTT ให้ดึงข้อมูลล่าสุดจาก Database
    latest = OxygenReading.objects.order_by('-timestamp').first()

    if latest:
        local_time = timezone.localtime(latest.timestamp)

        return JsonResponse({
            'o2_pct':       latest.value,
            'o2_mgl':       latest.mgl,
            'temp':         latest.temperature,
            'temp_air':     latest.temp_air,
            'humidity':     latest.humidity,

            'relay1':       latest.relay1,
            'relay2':       latest.relay2,
            'relay3':       latest.relay3,

            'pzem_voltage': latest.pzem_voltage,
            'pzem_current': latest.pzem_current,
            'pzem_power':   latest.pzem_power,
            'pzem_energy':  latest.pzem_energy,

            'rpm1':         latest.rpm1,
            'rpm2':         latest.rpm2,
            'rpm3':         latest.rpm3,

            # GPS
            'lat':          latest.latitude,
            'lng':          latest.longitude,

            'timestamp': local_time.strftime('%d/%m/%Y %H:%M:%S'),
            'recording': mqtt_client.is_recording,
        })

    return JsonResponse({
        'error': 'no data',
        'recording': mqtt_client.is_recording
    })


# ─── Relay API ───────────────────────────────────────────────

def parse_bool(value):
    """แปลงค่าให้เป็น Boolean อย่างถูกต้อง"""
    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        return value.strip().lower() in ('true', '1', 'on', 'yes')

    return bool(value)


@csrf_exempt
def api_relay(request, relay_num):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST only'}, status=405)

    # อนุญาตเฉพาะ Relay 1-3
    if relay_num not in [1, 2, 3]:
        return JsonResponse({
            'error': 'Invalid relay number'
        }, status=400)

    try:
        data = json.loads(request.body)
        state = parse_bool(data.get('state', False))

        mqtt_client.publish_relay(relay_num, state)

        latest = OxygenReading.objects.order_by('-timestamp').first()

        if latest:
            setattr(latest, f'relay{relay_num}', state)
            latest.save()

        return JsonResponse({
            'success': True,
            'relay': relay_num,
            'state': state
        })

    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({
            'error': 'Invalid JSON'
        }, status=400)


# ─── Recording API ───────────────────────────────────────────

@csrf_exempt
def api_recording(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            action = data.get('action')

            if action == 'start':
                mqtt_client.is_recording = True

            elif action == 'stop':
                mqtt_client.is_recording = False

            else:
                return JsonResponse({
                    'error': 'Invalid action'
                }, status=400)

            return JsonResponse({
                'recording': mqtt_client.is_recording
            })

        except (json.JSONDecodeError, UnicodeDecodeError):
            return JsonResponse({
                'error': 'Invalid JSON'
            }, status=400)

    return JsonResponse({
        'recording': mqtt_client.is_recording
    })


# ─── Session APIs ─────────────────────────────────────────────

@csrf_exempt
def api_sessions_start(request):
    """POST /api/sessions/start/ — สร้าง Session ใหม่"""

    if request.method != 'POST':
        return JsonResponse({'error': 'POST only'}, status=405)

    try:
        # ป้องกัน Session ซ้อนกัน
        if ExperimentSession.objects.filter(status='running').exists():
            return JsonResponse({
                'error': 'มี session กำลัง running อยู่แล้ว'
            }, status=400)

        data = json.loads(request.body)

        name = data.get('name', '').strip()
        condition = data.get('condition', '').strip()

        if not name:
            return JsonResponse({
                'error': 'กรุณาระบุชื่อการทดลอง'
            }, status=400)

        session = ExperimentSession.objects.create(
            name=name,
            condition=condition,
            status='running',
        )

        return JsonResponse({
            'id': session.id,
            'name': session.name,
            'condition': session.condition,
            'status': session.status,
            'start_time': timezone.localtime(
                session.start_time
            ).strftime('%d/%m/%Y %H:%M'),
        })

    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({
            'error': 'Invalid JSON'
        }, status=400)


@csrf_exempt
def api_sessions_stop(request):
    """POST /api/sessions/stop/ — หยุด Session ที่กำลัง Running"""

    if request.method != 'POST':
        return JsonResponse({'error': 'POST only'}, status=405)

    session = ExperimentSession.objects.filter(
        status='running'
    ).first()

    if not session:
        return JsonResponse({
            'error': 'ไม่มี session ที่กำลัง running'
        }, status=400)

    session.status = 'stopped'
    session.end_time = timezone.now()
    session.save()

    return JsonResponse({
        'id': session.id,
        'name': session.name,
        'status': session.status,
        'end_time': timezone.localtime(
            session.end_time
        ).strftime('%d/%m/%Y %H:%M'),
    })


def api_sessions_list(request):
    """GET /api/sessions/ — รายการ Session ทั้งหมด"""

    sessions = ExperimentSession.objects.all()
    data = []

    for s in sessions:
        data.append({
            'id': s.id,
            'name': s.name,
            'condition': s.condition,
            'status': s.status,

            'start_time': timezone.localtime(
                s.start_time
            ).strftime('%d/%m/%Y %H:%M'),

            'end_time': timezone.localtime(
                s.end_time
            ).strftime('%d/%m/%Y %H:%M') if s.end_time else None,

            'reading_count': s.readings.count(),
        })

    return JsonResponse({'sessions': data})


def api_sessions_readings(request, session_id):
    """GET /api/sessions/<id>/readings/ — ข้อมูลใน Session"""

    try:
        session = ExperimentSession.objects.get(id=session_id)

    except ExperimentSession.DoesNotExist:
        return JsonResponse({
            'error': 'ไม่พบ session'
        }, status=404)

    readings = session.readings.all().order_by('timestamp')

    # Pagination
    try:
        page = max(1, int(request.GET.get('page', 1)))
        page_size = min(
            500,
            max(1, int(request.GET.get('page_size', 50)))
        )

    except ValueError:
        return JsonResponse({
            'error': 'Invalid pagination parameters'
        }, status=400)

    start = (page - 1) * page_size
    end = start + page_size

    total = readings.count()
    readings = readings[start:end]

    data = []

    for r in readings:
        local_time = timezone.localtime(r.timestamp)

        data.append({
            'timestamp': local_time.strftime('%d/%m/%Y %H:%M'),

            # GPS
            'latitude': r.latitude,
            'longitude': r.longitude,

            # Dissolved Oxygen
            'o2_pct': r.value,
            'o2_mgl': r.mgl,

            # Temperature / Humidity
            'temp_water': r.temperature,
            'temp_air': r.temp_air,
            'humidity': r.humidity,

            # PZEM
            'pzem_voltage': r.pzem_voltage,
            'pzem_current': r.pzem_current,
            'pzem_power': r.pzem_power,
            'pzem_energy': r.pzem_energy,

            # RPM
            'rpm1': r.rpm1,
            'rpm2': r.rpm2,
            'rpm3': r.rpm3,
        })

    return JsonResponse({
        'session': {
            'id': session.id,
            'name': session.name,
            'status': session.status,
        },
        'total': total,
        'page': page,
        'page_size': page_size,
        'readings': data,
    })


# ─── History APIs ─────────────────────────────────────────────

def api_history(request):
    """
    GET /api/history/?hours=1
    GET /api/history/?hours=6
    GET /api/history/?hours=24
    GET /api/history/?date=DD/MM/YYYY
    """

    # รับค่าชั่วโมงหรือวันที่
    try:
        hours = int(request.GET.get('hours', 1))

        if hours < 1:
            raise ValueError

    except ValueError:
        return JsonResponse({
            'error': 'Invalid hours parameter'
        }, status=400)

    date_str = request.GET.get('date', None)

    now = timezone.localtime(timezone.now())
    current_tz = timezone.get_current_timezone()

    # กรณีเลือกวันที่
    if date_str:
        try:
            date_obj = datetime.strptime(
                date_str,
                '%d/%m/%Y'
            )

            # เวลาเริ่มต้นของวันที่เลือก
            start = timezone.make_aware(
                date_obj.replace(
                    hour=0,
                    minute=0,
                    second=0,
                    microsecond=0
                ),
                current_tz
            )

            # ใช้วันถัดไปเป็นเวลาสิ้นสุดแบบไม่รวม
            end = start + timedelta(days=1)

        except ValueError:
            return JsonResponse({
                'error': 'invalid date'
            }, status=400)

    # กรณีเลือกจำนวนชั่วโมง
    else:
        end = now
        start = end - timedelta(hours=hours)

    readings = OxygenReading.objects.filter(
        timestamp__gte=start,
        timestamp__lt=end
    ).order_by('timestamp')

    # ─── Group ข้อมูลทุก 1 นาที ──────────────────────────────

    buckets = defaultdict(list)

    for r in readings:
        local_time = timezone.localtime(r.timestamp)

        key = local_time.strftime(
            '%d/%m/%Y %H:%M'
        )

        buckets[key].append(r)

    data = []

    for key in sorted(buckets.keys()):
        rows = buckets[key]

        # เฉลี่ยข้อมูลตัวเลขภายใน 1 นาที
        def avg_field(field):
            vals = [
                getattr(r, field)
                for r in rows
                if getattr(r, field) is not None
            ]

            return (
                round(sum(vals) / len(vals), 2)
                if vals else None
            )

        # เลือกค่าล่าสุดที่ไม่ใช่ None
        # เหมาะสำหรับ GPS เพราะไม่ควรนำพิกัดมาเฉลี่ย
        def last_field(field):
            for r in reversed(rows):
                value = getattr(r, field)

                if value is not None:
                    return value

            return None

        data.append({

            # เวลา
            'timestamp': key,

            # Dissolved Oxygen
            'o2_pct': avg_field('value'),
            'o2_mgl': avg_field('mgl'),

            # Temperature / Humidity
            'temp': avg_field('temperature'),
            'temp_air': avg_field('temp_air'),
            'humidity': avg_field('humidity'),

            # PZEM
            'pzem_voltage': avg_field('pzem_voltage'),
            'pzem_current': avg_field('pzem_current'),
            'pzem_power': avg_field('pzem_power'),
            'pzem_energy': avg_field('pzem_energy'),

            # RPM
            'rpm1': avg_field('rpm1'),
            'rpm2': avg_field('rpm2'),
            'rpm3': avg_field('rpm3'),

            # GPS
            'latitude': last_field('latitude'),
            'longitude': last_field('longitude'),
        })

    return JsonResponse({
        'data': data
    })


# ─── Available Dates API ──────────────────────────────────────

def api_available_dates(request):
    """GET /api/available-dates/"""

    readings = OxygenReading.objects.order_by('timestamp')

    dates = set()

    for r in readings:
        local_time = timezone.localtime(r.timestamp)

        dates.add(
            local_time.strftime('%d/%m/%Y')
        )

    # เรียงวันที่ตามลำดับเวลา ไม่ใช่เรียงตามตัวอักษร
    sorted_dates = sorted(
        dates,
        key=lambda d: datetime.strptime(d, '%d/%m/%Y')
    )

    return JsonResponse({
        'dates': sorted_dates
    })
