from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import OxygenReading  # <--- แก้เป็น OxygenReading
from . import mqtt_client
import json

def dashboard(request):
    # ดึงค่าล่าสุดจาก OxygenReading
    latest = OxygenReading.objects.first() 
    return render(request, 'dashboard.html', {'latest': latest})

def api_latest(request):
    latest = OxygenReading.objects.first()
    if latest:
        return JsonResponse({
            'o2_pct': latest.value,          # แก้ให้ตรงกับฟิลด์ value ใน models
            'o2_mgl': latest.mgl,            # แก้ให้ตรงกับฟิลด์ mgl ใน models
            'temp':   latest.temperature,    # แก้ให้ตรงกับฟิลด์ temperature ใน models
            'timestamp': latest.timestamp.strftime('%H:%M:%S'),
        })
    return JsonResponse({'error': 'no data'})

@csrf_exempt
def api_relay(request, relay_num):
    if request.method == 'POST':
        data  = json.loads(request.body)
        state = data.get('state', False)
        mqtt_client.publish_relay(relay_num, state)
        
        # หมายเหตุ: ใน Model OxygenReading ของคุณยังไม่มีฟิลด์ relay1, relay2, relay3
        # ถ้าจะบันทึกสถานะ Relay ลงฐานข้อมูลด้วย ต้องไปเพิ่มฟิลด์ใน models.py ก่อนครับ
        
        return JsonResponse({'success': True, 'relay': relay_num, 'state': state})
    return JsonResponse({'error': 'POST only'})