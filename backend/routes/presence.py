from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user
from models.presence import Presence, StatutPresence
from models.user import RoleEnum, User
from schemas.presence import PresenceBatch, PresenceOut, PresenceStat
from schemas.user import UserOut

router = APIRouter(prefix="/presence", tags=["presence"])


def _require_responsable(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in (RoleEnum.responsable, RoleEnum.admin):
        raise HTTPException(
            status_code=403, detail="Accès réservé aux responsables"
        )
    return current_user


@router.get("/{date_samedi}", response_model=list[PresenceOut])
def get_presence(
    date_samedi: date,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return (
        db.query(Presence)
        .filter(Presence.date_samedi == date_samedi)
        .all()
    )


@router.put("/", response_model=list[PresenceOut])
def save_presence(
    body: PresenceBatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_responsable),
):
    for p in body.presences:
        existing = db.query(Presence).filter(
            Presence.date_samedi == body.date_samedi,
            Presence.user_id == p.user_id,
        ).first()
        if existing:
            existing.statut = p.statut
            existing.saisi_par = current_user.id
        else:
            db.add(
                Presence(
                    date_samedi=body.date_samedi,
                    user_id=p.user_id,
                    statut=p.statut,
                    saisi_par=current_user.id,
                )
            )
    db.commit()
    return db.query(Presence).filter(Presence.date_samedi == body.date_samedi).all()


@router.get("/historique/dates", response_model=list[date])
def historique_dates(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Retourne la liste des samedis ayant une présence enregistrée, du plus récent au plus ancien."""
    rows = (
        db.query(Presence.date_samedi)
        .distinct()
        .order_by(Presence.date_samedi.desc())
        .all()
    )
    return [r[0] for r in rows]


@router.get("/stats/participation", response_model=list[PresenceStat])
def stats_participation(
    mois: int | None = Query(None, ge=1, le=12),
    annee: int | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(_require_responsable),
):
    users = db.query(User).filter(User.role != RoleEnum.admin).order_by(User.nom).all()
    result = []
    for user in users:
        q = db.query(Presence).filter(Presence.user_id == user.id)
        if mois:
            q = q.filter(func.extract("month", Presence.date_samedi) == mois)
        if annee:
            q = q.filter(func.extract("year", Presence.date_samedi) == annee)
        records = q.all()
        nb_p = sum(1 for r in records if r.statut == StatutPresence.present)
        nb_a = sum(1 for r in records if r.statut == StatutPresence.absent)
        nb_e = sum(1 for r in records if r.statut == StatutPresence.excuse)
        total = len(records)
        taux = (nb_p / total * 100) if total > 0 else 0.0
        result.append(
            PresenceStat(
                user=UserOut.model_validate(user),
                nb_present=nb_p,
                nb_absent=nb_a,
                nb_excuse=nb_e,
                nb_total=total,
                taux=round(taux, 1),
            )
        )
    return result
