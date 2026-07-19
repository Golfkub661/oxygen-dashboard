from django.db import models

class OxygenReading(models.Model):
    # ─── O2 Sensor ────────────────────────────────────────────────────────
    value       = models.FloatField()
    mgl         = models.FloatField(null=True, blank=True)
    temperature = models.FloatField(null=True, blank=True)

    # ─── Air Sensor ───────────────────────────────────────────────────────
    temp_air    = models.FloatField(null=True, blank=True)
    humidity    = models.FloatField(null=True, blank=True)

    # ─── PZEM-017 ─────────────────────────────────────────────────────────
    pzem_voltage = models.FloatField(null=True, blank=True)
    pzem_current = models.FloatField(null=True, blank=True)
    pzem_power   = models.FloatField(null=True, blank=True)
    pzem_energy  = models.PositiveIntegerField(null=True, blank=True)

    # ─── RPM ──────────────────────────────────────────────────────────────
    rpm1 = models.FloatField(null=True, blank=True)
    rpm2 = models.FloatField(null=True, blank=True)
    rpm3 = models.FloatField(null=True, blank=True)

    # ─── Relay ────────────────────────────────────────────────────────────
    relay1 = models.BooleanField(default=False)
    relay2 = models.BooleanField(default=False)
    relay3 = models.BooleanField(default=False)

    # ─── Meta ─────────────────────────────────────────────────────────────
    timestamp = models.DateTimeField(auto_now_add=True)
    device_id = models.CharField(max_length=50, default='esp32-001')

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.device_id}: {self.value}% at {self.timestamp}"