
import paho.mqtt.client as mqtt
import json
import django
import os
import threading

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'oxygen_dashboard.settings')
django.setup()

from oxygen_app.models import OxygenReading, ExperimentSession

BROKER = "broker.hivemq.com"
PORT = 1883
TOPIC_SUB = "sensor/oxygen"

client = mqtt.Client()

latest_data = {}
is_recording = False


def get_rpm(value):
    """ถ้า rpm เกิน 120 → return None"""
    if value is None:
        return None
    return None if value > 120 else value


def get_active_session():
    """ดึง session ที่ status='running' อยู่ ถ้าไม่มี return None"""
    return ExperimentSession.objects.filter(status='running').first()


def on_connect(c, userdata, flags, rc):
    print(f"MQTT Connected: {rc}")
    c.subscribe(TOPIC_SUB)


def on_message(c, userdata, msg):
    global latest_data

    try:
        data = json.loads(msg.payload.decode())
        latest_data = data
        print(f"Received: {data}")

        # ตรวจสอบ session ที่กำลัง running
        active_session = get_active_session()

        # บันทึกเมื่อเปิด recording หรือมี session running
        if is_recording or active_session:

            o2 = data.get("o2_pct", 0)
            mgl = data.get("o2_mgl", 0)

                OxygenReading.objects.create(
                    session=active_session,
                    value=o2,
                    mgl=mgl,
                    temperature=data.get("temp_water", 0),
                    temp_air=data.get("temp_air", 0),
                    humidity=data.get("humidity", 0),
                    relay1=data.get("relay1", False),
                    relay2=data.get("relay2", False),
                    relay3=data.get("relay3", False),
                    pzem_voltage=data.get("pzem_voltage", None),
                    pzem_current=data.get("pzem_current", None),
                    pzem_power=data.get("pzem_power", None),
                    pzem_energy=data.get("pzem_energy", None),
                    rpm1=get_rpm(data.get("rpm1")),
                    rpm2=get_rpm(data.get("rpm2")),
                    rpm3=get_rpm(data.get("rpm3")),
                    latitude=data.get("lat", None),
                    longitude=data.get("lng", None),
                )

                print(f"Saved: session={active_session}, data={data}")

        else:
            print("Not recording, skipped DB save")

    except Exception as e:
        print(f"Error: {e}")


def publish_relay(relay_num, state):
    topic = f"control/relay/{relay_num}"
    payload = "ON" if state else "OFF"
    client.publish(topic, payload)
    print(f"Published {topic}: {payload}")


def on_disconnect(c, userdata, rc):
    print("Disconnected, reconnecting...")
    c.reconnect()


def start():
    client.on_connect = on_connect
    client.on_message = on_message
    client.on_disconnect = on_disconnect
    client.connect(BROKER, PORT, 60)
    client.loop_start()


thread = threading.Thread(target=start, daemon=True)
thread.start()
