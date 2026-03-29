from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from datetime import datetime
import time

class SecurityMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.counts = {}
    async def dispatch(self, request, call_next):
        ip = request.client.host
        key = f"{ip}:{datetime.utcnow().strftime('%Y%m%d%H%M')}"
        self.counts[key] = self.counts.get(key, 0) + 1
        if self.counts[key] > 120:
            return JSONResponse(status_code=429, content={"detail": "Too many requests"})
        start = time.time()
        response = await call_next(request)
        response.headers["X-Process-Time"] = str(round(time.time() - start, 4))
        return response
