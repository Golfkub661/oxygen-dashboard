import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import oxygen_app.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'oxygen_dashboard.settings')

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AuthMiddlewareStack(
        URLRouter(
            oxygen_app.routing.websocket_urlpatterns
        )
    ),
})