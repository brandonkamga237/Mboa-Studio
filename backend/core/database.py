from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from core.config import settings


def _build_url() -> str:
    """Détecte automatiquement le driver PostgreSQL disponible (psycopg v3 ou v2)."""
    url = settings.DATABASE_URL
    try:
        import psycopg  # noqa: F401  — psycopg v3
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    except ImportError:
        pass
    try:
        import psycopg2  # noqa: F401  — psycopg v2
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    except ImportError:
        pass
    raise RuntimeError(
        "Aucun driver PostgreSQL trouvé. Installe psycopg[binary] ou psycopg2-binary."
    )


_url = _build_url()

engine = create_engine(
    _url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
