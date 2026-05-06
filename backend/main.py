from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.database import Base, engine
from models import (  # noqa: F401 — registration before create_all
    Brouillon,
    Chant,
    Commentaire,
    Presence,
    User,
)
from routes import (
    auth_router,
    brouillons_router,
    chants_router,
    commentaires_router,
    commentaires_extra_router,
    pdf_router,
    presence_router,
    users_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="3.0.0",
    description="Système de gestion des mises en commun — Culte d'enfants",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(brouillons_router, prefix="/api")
app.include_router(chants_router, prefix="/api")
app.include_router(commentaires_router, prefix="/api")
app.include_router(commentaires_extra_router, prefix="/api")
app.include_router(presence_router, prefix="/api")
app.include_router(pdf_router, prefix="/api")


@app.get("/api/sante")
def health():
    return {"statut": "ok", "service": settings.APP_NAME}
