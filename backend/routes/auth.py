from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user
from core.security import create_access_token, hash_password, verify_password
from models.user import RoleEnum, User
from schemas.auth import LoginRequest, SetupRequest, TokenResponse
from schemas.user import UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/connexion", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.mot_de_passe, user.mot_de_passe_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)


@router.post("/initialisation", response_model=TokenResponse)
def setup(body: SetupRequest, db: Session = Depends(get_db)):
    """Crée le premier compte admin. Désactivé si des utilisateurs existent déjà."""
    if db.query(User).count() > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="L'initialisation a déjà été effectuée",
        )
    user = User(
        nom=body.nom,
        email=body.email,
        mot_de_passe_hash=hash_password(body.mot_de_passe),
        role=RoleEnum.admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)


@router.get("/moi", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
