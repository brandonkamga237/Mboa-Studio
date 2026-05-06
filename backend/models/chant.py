import enum

from sqlalchemy import Column, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from core.database import Base


class EtapeEnum(str, enum.Enum):
    salutation = "salutation"
    adoration = "adoration"
    priere_repentance = "priere_repentance"
    parole_de_grace = "parole_de_grace"
    loi = "loi"
    lecon = "lecon"
    confession_de_foi = "confession_de_foi"
    offrande_1 = "offrande_1"
    offrande_2 = "offrande_2"
    sortie = "sortie"


ETAPES_LABELS = {
    EtapeEnum.salutation: "Salutation",
    EtapeEnum.adoration: "Adoration",
    EtapeEnum.priere_repentance: "Prière de repentance",
    EtapeEnum.parole_de_grace: "Parole de grâce",
    EtapeEnum.loi: "Loi",
    EtapeEnum.lecon: "Leçon",
    EtapeEnum.confession_de_foi: "Confession de foi",
    EtapeEnum.offrande_1: "Offrande 1",
    EtapeEnum.offrande_2: "Offrande 2",
    EtapeEnum.sortie: "Sortie",
}


class Chant(Base):
    __tablename__ = "chants"

    id = Column(Integer, primary_key=True, index=True)
    brouillon_id = Column(Integer, ForeignKey("brouillons.id"), nullable=False)
    ordre = Column(Integer, nullable=False, default=0)
    titre = Column(String(255), nullable=False)
    etape = Column(Enum(EtapeEnum), nullable=False)

    brouillon = relationship("Brouillon", back_populates="chants")
