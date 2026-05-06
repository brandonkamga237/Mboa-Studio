from datetime import datetime

from pydantic import BaseModel, EmailStr

from models.user import RoleEnum


class UserOut(BaseModel):
    id: int
    nom: str
    email: EmailStr
    role: RoleEnum
    cree_le: datetime

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    nom: str
    email: EmailStr
    mot_de_passe: str
    role: RoleEnum = RoleEnum.moniteur


class UserUpdate(BaseModel):
    nom: str | None = None
    role: RoleEnum | None = None
    mot_de_passe: str | None = None
