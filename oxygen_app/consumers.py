import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class OxygenConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add('oxygen_updates', self.channel_name)
        await self.accept()

        readings = await self.get_recent_readings(50)
        await self.send(text_data=json.dumps({
            'type': 'history',
            'data': readings
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard('oxygen_updates', self.channel_name)

    async def oxygen_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'update',
            'data': event['data']
        }))

    @database_sync_to_async
    def get_recent_readings(self, count=50):
        from .models import OxygenReading
        readings = OxygenReading.objects.order_by('-timestamp')[:count]
        return [
            {
                'value': r.value,
                'mgl': r.mgl,
                'temperature': r.temperature,
                'timestamp': r.timestamp.isoformat(),
                'device_id': r.device_id
            }
            for r in reversed(list(readings))
        ]