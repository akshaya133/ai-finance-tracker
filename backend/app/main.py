from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import connect_to_mongo, close_mongo_connection
from app.routes import auth, transactions, dashboard, scanner, ai_insights, export
from app.middleware.security import SecurityMiddleware

app = FastAPI(title="AI Finance Tracker", version="2.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.add_middleware(SecurityMiddleware)

@app.on_event("startup")
async def startup(): await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown(): await close_mongo_connection()

app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(dashboard.router)
app.include_router(scanner.router)
app.include_router(ai_insights.router)
app.include_router(export.router)

@app.get("/")
def root(): return {"message": "AI Finance Tracker API", "version": "2.0.0", "docs": "/docs"}

@app.get("/health")
async def health(): return {"status": "healthy"}
