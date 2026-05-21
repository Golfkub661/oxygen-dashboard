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

def on_connect(c, userdata, flags, rc):
    print(f"MQTT Connected: {rc}")
    c.subscribe(TOPIC_SUB)

def on_message(c, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())
        OxygenReading.objects.create(
            value       = data.get("o2_pct", 0),
            mgl         = data.get("o2_mgl", 0),
            temperature = data.get("temp_water", 0),  # ✅ แก้จาก "temp"
            temp_air    = data.get("temp_air", 0),    # ✅ เพิ่มใหม่
            humidity    = data.get("humidity", 0),    # ✅ เพิ่มใหม่
            relay1      = data.get("relay1", False),
            relay2      = data.get("relay2", False),
            relay3      = data.get("relay3", False),
        )
        print(f"Saved: {data}")
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