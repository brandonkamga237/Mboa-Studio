import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.analyze import router as analyze_router
from routes.generate import router as generate_router
from routes.refine import router as refine_router
from routes.admin import router as admin_router

load_dotenv()

app = FastAPI(title="Mboa Studio API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router, prefix="/api")
app.include_router(generate_router, prefix="/api")
app.include_router(refine_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "Mboa Studio API"}
