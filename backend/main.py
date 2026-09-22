from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes import router

app = FastAPI(
    title="University FAQ Multi-Agent System",
    description="Multi-agent AI assistant for university academic, student services, and general inquiries.",
    version="1.0.0"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/health", summary="System Health Check")
def health_check():
    return {"status": "online", "service": "University FAQ Multi-Agent Backend"}
