from datetime import date, datetime

from pydantic import BaseModel

from models.presence import StatutPresence
from schemas.user import UserOut


class PresenceOut(BaseModel):
    id: int
    date_samedi: date
    user: UserOut
    statut: StatutPresence
    saisi_par_user: UserOut
    saisi_le: datetime

    model_config = {"from_attributes": True}


class PresenceUpsert(BaseModel):
    user_id: int
    statut: StatutPresence


class PresenceBatch(BaseModel):
    date_samedi: date
    presences: list[PresenceUpsert]


class PresenceStat(BaseModel):
    user: UserOut
    nb_present: int
    nb_absent: int
    nb_excuse: int
    nb_total: int
    taux: float
