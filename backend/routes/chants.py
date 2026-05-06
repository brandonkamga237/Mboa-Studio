from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user
from models.brouillon import Brouillon, StatutBrouillon
from models.chant import Chant
from models.user import RoleEnum, User
from schemas.chant import ChantCreate, ChantOut, ChantUpdate, ChantsReorder

router = APIRouter(prefix="/brouillons/{brouillon_id}/chants", tags=["chants"])


def _get_brouillon_or_404(brouillon_id: int, db: Session) -> Brouillon:
    b = db.query(Brouillon).filter(Brouillon.id == brouillon_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Brouillon introuvable")
    return b


def _can_edit(b: Brouillon, user: User) -> bool:
    if b.statut == StatutBrouillon.archive:
        return False
    if b.statut == StatutBrouillon.officiel:
        return user.role in (RoleEnum.responsable, RoleEnum.admin)
    return b.auteur_id == user.id or user.role in (RoleEnum.responsable, RoleEnum.admin)


@router.get("/", response_model=list[ChantOut])
def list_chants(
    brouillon_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    b = _get_brouillon_or_404(brouillon_id, db)
    return b.chants


@router.post("/", response_model=ChantOut, status_code=status.HTTP_201_CREATED)
def add_chant(
    brouillon_id: int,
    body: ChantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    b = _get_brouillon_or_404(brouillon_id, db)
    if not _can_edit(b, current_user):
        raise HTTPException(status_code=403, detail="Modification non autorisée")
    ordre = body.ordre if body.ordre is not None else (len(b.chants) + 1)
    chant = Chant(
        brouillon_id=brouillon_id,
        titre=body.titre,
        etape=body.etape,
        ordre=ordre,
    )
    db.add(chant)
    b.modifie_le = datetime.now(timezone.utc)
    db.commit()
    db.refresh(chant)
    return chant


@router.put("/{chant_id}", response_model=ChantOut)
def update_chant(
    brouillon_id: int,
    chant_id: int,
    body: ChantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    b = _get_brouillon_or_404(brouillon_id, db)
    if not _can_edit(b, current_user):
        raise HTTPException(status_code=403, detail="Modification non autorisée")
    chant = db.query(Chant).filter(
        Chant.id == chant_id, Chant.brouillon_id == brouillon_id
    ).first()
    if not chant:
        raise HTTPException(status_code=404, detail="Chant introuvable")
    if body.titre is not None:
        chant.titre = body.titre
    if body.etape is not None:
        chant.etape = body.etape
    if body.ordre is not None:
        chant.ordre = body.ordre
    b.modifie_le = datetime.now(timezone.utc)
    db.commit()
    db.refresh(chant)
    return chant


@router.delete("/{chant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chant(
    brouillon_id: int,
    chant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    b = _get_brouillon_or_404(brouillon_id, db)
    if not _can_edit(b, current_user):
        raise HTTPException(status_code=403, detail="Modification non autorisée")
    chant = db.query(Chant).filter(
        Chant.id == chant_id, Chant.brouillon_id == brouillon_id
    ).first()
    if not chant:
        raise HTTPException(status_code=404, detail="Chant introuvable")
    db.delete(chant)
    b.modifie_le = datetime.now(timezone.utc)
    db.commit()


@router.put("/reorder", response_model=list[ChantOut])
def reorder_chants(
    brouillon_id: int,
    body: ChantsReorder,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    b = _get_brouillon_or_404(brouillon_id, db)
    if not _can_edit(b, current_user):
        raise HTTPException(status_code=403, detail="Modification non autorisée")
    for i, chant_id in enumerate(body.ids):
        db.query(Chant).filter(
            Chant.id == chant_id, Chant.brouillon_id == brouillon_id
        ).update({"ordre": i})
    b.modifie_le = datetime.now(timezone.utc)
    db.commit()
    db.refresh(b)
    return b.chants
