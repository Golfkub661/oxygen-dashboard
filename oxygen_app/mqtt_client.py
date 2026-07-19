import paho.mqtt.client as mqtt
import json
import django
import os
import threading

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'oxygen_dashboard.settings')
django.setup()

from oxygen_app.models import OxygenReading

BROKER      = "broker.hivemq.com"
PORT        = 1883
TOPIC_SUB   = "sensor/oxygen"
TOPIC_RLY1  = "control/relay/1"
TOPIC_RLY2  = "control/relay/2"
TOPIC_RLY3  = "control/relay/3"

client = mqtt.Client()

latest_data  = {}
is_recording = False

def on_connect(c, userdata, flags, rc):
    print(f"MQTT Connected: {rc}")
    c.subscribe(TOPIC_SUB)

def on_message(c, userdata, msg):
    global latest_data
    try:
        data = json.loads(msg.payload.decode())
        latest_data = data
        print(f"Received: {data}")

        if is_recording:
            o2       = data.get("o2_pct", 0)
            mgl      = data.get("o2_mgl", 0)
            temp_air = data.get("temp_air", 0)
            humidity = data.get("humidity", 0)

            # ✅ บันทึกถ้ามีค่าจากเซนเซอร์ตัวใดตัวหนึ่ง
            if o2 > 0 or mgl > 0 or temp_air > 0 or humidity > 0:
                OxygenReading.objects.create(
                    value        = o2,
                    mgl          = mgl,
                    temperature  = data.get("temp_water", 0),
                    temp_air     = temp_air,
                    humidity     = humidity,
                    relay1       = data.get("relay1", False),
                    relay2       = data.get("relay2", False),
                    relay3       = data.get("relay3", False),
                    # ✅ PZEM-017
                    pzem_voltage = data.get("pzem_voltage", None),
                    pzem_current = data.get("pzem_current", None),
                    pzem_power   = data.get("pzem_power", None),
                    pzem_energy  = data.get("pzem_energy", None),
                    # ✅ RPM
                    rpm1         = data.get("rpm1", None),
                    rpm2         = data.get("rpm2", None),
                    rpm3         = data.get("rpm3", None),
                )
                print(f"Saved: {data}")
        else:
            print("Not recording, skipped DB save")

    except Exception as e:
        print(f"Error: {e}")

def publish_relay(relay_num, state):
    topic   = f"control/relay/{relay_num}"
    payload = "ON" if state else "OFF"
    client.publish(topic, payload)
    print(f"Published {topic}: {payload}")

def on_disconnect(c, userdata, rc):
    print("Disconnected, reconnecting...")
    c.reconnect()

def start():
    client.on_connect    = on_connect
    client.on_message    = on_message
    client.on_disconnect = on_disconnect
    client.connect(BROKER, PORT, 60)
    client.loop_start()

thread = threading.Thread(target=start, daemon=True)
thread.start()