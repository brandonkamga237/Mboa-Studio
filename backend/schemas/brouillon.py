from datetime import date, datetime

from pydantic import BaseModel

from models.brouillon import StatutBrouillon
from schemas.chant import ChantOut
from schemas.user import UserOut


class BrouillonOut(BaseModel):
    id: int
    date_dimanche: date
    auteur: UserOut
    cree_le: datetime
    modifie_le: datetime
    liturgie: str
    lecon: str
    divers: str
    statut: StatutBrouillon
    validateur: UserOut | None
    valide_le: datetime | None
    motif_revision: str | None = None
    visible: bool = True
    chants: list[ChantOut] = []
    nb_commentaires: int = 0

    model_config = {"from_attributes": True}


class RenvoyerBody(BaseModel):
    motif: str = ""


class VisibiliteBody(BaseModel):
    visible: bool


class BrouillonSummary(BaseModel):
    id: int
    date_dimanche: date
    auteur: UserOut
    modifie_le: datetime
    statut: StatutBrouillon
    visible: bool = True
    nb_chants: int = 0
    nb_commentaires: int = 0
    apercu_lecon: str = ""

    model_config = {"from_attributes": True}


class BrouillonCreate(BaseModel):
    date_dimanche: date
    liturgie: str = ""
    lecon: str = ""
    divers: str = ""


class BrouillonUpdate(BaseModel):
    liturgie: str | None = None
    lecon: str | None = None
    divers: str | None = None


class BrouillonDuplicate(BaseModel):
    source_id: int
    date_dimanche: date
