from django.db import models

class OxygenReading(models.Model):
    value       = models.FloatField()
    mgl         = models.FloatField(null=True, blank=True)
    temperature = models.FloatField(null=True, blank=True)
    temp_air    = models.FloatField(null=True, blank=True)   # ✅ เพิ่มใหม่
    humidity    = models.FloatField(null=True, blank=True)   # ✅ เพิ่มใหม่
    timestamp   = models.DateTimeField(auto_now_add=True)
    device_id   = models.CharField(max_length=50, default='esp32-001')

    relay1 = models.BooleanField(default=False)
    relay2 = models.BooleanField(default=False)
    relay3 = models.BooleanField(default=False)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.device_id}: {self.value}% at {self.timestamp}"