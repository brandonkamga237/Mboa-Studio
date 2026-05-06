import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from core.database import Base


class CibleTypeEnum(str, enum.Enum):
    brouillon_chant = "brouillon_chant"
    brouillon_bloc_chants = "brouillon_bloc_chants"
    brouillon_bloc_liturgie = "brouillon_bloc_liturgie"
    brouillon_bloc_lecon = "brouillon_bloc_lecon"
    brouillon_bloc_divers = "brouillon_bloc_divers"


class Commentaire(Base):
    __tablename__ = "commentaires"

    id = Column(Integer, primary_key=True, index=True)
    auteur_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    cree_le = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    contenu = Column(Text, nullable=False)
    cible_type = Column(Enum(CibleTypeEnum), nullable=False)
    cible_id = Column(Integer, nullable=False)
    brouillon_id = Column(Integer, ForeignKey("brouillons.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("commentaires.id"), nullable=True)
    resolu = Column(Boolean, default=False, nullable=False)

    auteur = relationship("User", back_populates="commentaires")
    brouillon = relationship("Brouillon", back_populates="commentaires")
    reponses = relationship(
        "Commentaire",
        back_populates="parent",
        cascade="all, delete-orphan",
    )
    parent = relationship(
        "Commentaire",
        back_populates="reponses",
        remote_side="Commentaire.id",
    )
