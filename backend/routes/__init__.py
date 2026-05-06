from routes.auth import router as auth_router
from routes.users import router as users_router
from routes.brouillons import router as brouillons_router
from routes.chants import router as chants_router
from routes.commentaires import router as commentaires_router
from routes.commentaires import router_extra as commentaires_extra_router
from routes.presence import router as presence_router
from routes.pdf import router as pdf_router

__all__ = [
    "auth_router",
    "users_router",
    "brouillons_router",
    "chants_router",
    "commentaires_router",
    "commentaires_extra_router",
    "presence_router",
    "pdf_router",
]
