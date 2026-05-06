from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from models.commentaire import CibleTypeEnum
from schemas.user import UserOut


class CommentaireOut(BaseModel):
    id: int
    auteur: UserOut
    cree_le: datetime
    contenu: str
    cible_type: CibleTypeEnum
    cible_id: int
    brouillon_id: int
    parent_id: int | None
    resolu: bool
    reponses: list[CommentaireOut] = []

    model_config = {"from_attributes": True}


CommentaireOut.model_rebuild()


class CommentaireCreate(BaseModel):
    contenu: str
    cible_type: CibleTypeEnum
    cible_id: int
    parent_id: int | None = None
