from django.db import models

class ExperimentSession(models.Model):
    STATUS_CHOICES = [
        ('running', 'Running'),
        ('stopped', 'Stopped'),
    ]
    name       = models.CharField(max_length=255)
    condition  = models.TextField(blank=True)
    status     = models.CharField(max_length=10, choices=STATUS_CHOICES, default='running')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time   = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-start_time']

    def __str__(self):
        return f"{self.name} ({self.status})"


class OxygenReading(models.Model):
    # --- Session ---
    session    = models.ForeignKey(
        ExperimentSession,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='readings'
    )

    # --- Oxygen ---
    value       = models.FloatField()
    mgl         = models.FloatField(null=True, blank=True)

    # --- Temperature / Humidity ---
    temperature = models.FloatField(null=True, blank=True)
    temp_air    = models.FloatField(null=True, blank=True)
    humidity    = models.FloatField(null=True, blank=True)

    # --- Timestamp / Device ---
    timestamp   = models.DateTimeField(auto_now_add=True)
    device_id   = models.CharField(max_length=50, default='esp32-001')

    # --- Relay ---
    relay1 = models.BooleanField(default=False)
    relay2 = models.BooleanField(default=False)
    relay3 = models.BooleanField(default=False)

    # --- PZEM ---
    pzem_voltage = models.FloatField(null=True, blank=True)
    pzem_current = models.FloatField(null=True, blank=True)
    pzem_power   = models.FloatField(null=True, blank=True)
    pzem_energy  = models.FloatField(null=True, blank=True)

    # --- RPM ---
    rpm1 = models.FloatField(null=True, blank=True)
    rpm2 = models.FloatField(null=True, blank=True)
    rpm3 = models.FloatField(null=True, blank=True)

    # --- GPS ---
    latitude  = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.device_id}: {self.value}% at {self.timestamp}"