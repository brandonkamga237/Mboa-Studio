from pydantic import BaseModel

from models.chant import EtapeEnum


class ChantOut(BaseModel):
    id: int
    brouillon_id: int
    ordre: int
    titre: str
    etape: EtapeEnum

    model_config = {"from_attributes": True}


class ChantCreate(BaseModel):
    titre: str
    etape: EtapeEnum
    ordre: int | None = None


class ChantUpdate(BaseModel):
    titre: str | None = None
    etape: EtapeEnum | None = None
    ordre: int | None = None


class ChantsReorder(BaseModel):
    ids: list[int]
