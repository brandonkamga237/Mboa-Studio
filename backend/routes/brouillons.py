from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user
from models.brouillon import Brouillon, StatutBrouillon
from models.chant import Chant
from models.commentaire import Commentaire
from models.user import RoleEnum, User
from schemas.brouillon import (
    BrouillonCreate,
    BrouillonDuplicate,
    BrouillonOut,
    BrouillonSummary,
    BrouillonUpdate,
    RenvoyerBody,
    VisibiliteBody,
)

router = APIRouter(prefix="/brouillons", tags=["brouillons"])


def _build_summary(b: Brouillon) -> BrouillonSummary:
    nb_chants = len(b.chants)
    nb_comm = len([c for c in b.commentaires if c.parent_id is None])
    apercu = (b.lecon or "")[:80]
    return BrouillonSummary(
        id=b.id,
        date_dimanche=b.date_dimanche,
        auteur=b.auteur,
        modifie_le=b.modifie_le,
        statut=b.statut,
        visible=b.visible,
        nb_chants=nb_chants,
        nb_commentaires=nb_comm,
        apercu_lecon=apercu,
    )


def _build_out(b: Brouillon) -> BrouillonOut:
    nb_comm = len([c for c in b.commentaires if c.parent_id is None])
    return BrouillonOut(
        id=b.id,
        date_dimanche=b.date_dimanche,
        auteur=b.auteur,
        cree_le=b.cree_le,
        modifie_le=b.modifie_le,
        liturgie=b.liturgie,
        lecon=b.lecon,
        divers=b.divers,
        statut=b.statut,
        validateur=b.validateur,
        valide_le=b.valide_le,
        motif_revision=b.motif_revision,
        visible=b.visible,
        chants=b.chants,
        nb_commentaires=nb_comm,
    )


def _is_responsable(user: User) -> bool:
    return user.role in (RoleEnum.responsable, RoleEnum.admin)


def _can_edit(brouillon: Brouillon, user: User) -> bool:
    if brouillon.statut == StatutBrouillon.archive:
        return False
    if brouillon.statut == StatutBrouillon.officiel:
        return _is_responsable(user)
    return brouillon.auteur_id == user.id or _is_responsable(user)


@router.get("/", response_model=list[BrouillonSummary])
def list_brouillons(
    date_dimanche: date | None = Query(None),
    statut: StatutBrouillon | None = Query(None),
    auteur_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import or_
    q = db.query(Brouillon).filter(
        or_(Brouillon.visible == True, Brouillon.auteur_id == current_user.id)
    )
    if date_dimanche:
        q = q.filter(Brouillon.date_dimanche == date_dimanche)
    if statut:
        q = q.filter(Brouillon.statut == statut)
    if auteur_id:
        q = q.filter(Brouillon.auteur_id == auteur_id)
    brouillons = q.order_by(Brouillon.date_dimanche.desc(), Brouillon.cree_le.desc()).all()
    return [_build_summary(b) for b in brouillons]


@router.post("/", response_model=BrouillonOut, status_code=status.HTTP_201_CREATED)
def create_brouillon(
    body: BrouillonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    b = Brouillon(
        date_dimanche=body.date_dimanche,
        auteur_id=current_user.id,
        liturgie=body.liturgie,
        lecon=body.lecon,
        divers=body.divers,
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    return _build_out(b)


@router.get("/{brouillon_id}", response_model=BrouillonOut)
def get_brouillon(
    brouillon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    b = db.query(Brouillon).filter(Brouillon.id == brouillon_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Brouillon introuvable")
    if not b.visible and b.auteur_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ce brouillon est privé")
    return _build_out(b)


@router.post("/{brouillon_id}/visibilite", response_model=BrouillonOut)
def set_visibilite(
    brouillon_id: int,
    body: VisibiliteBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """L'auteur contrôle la visibilité de son brouillon."""
    b = db.query(Brouillon).filter(Brouillon.id == brouillon_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Brouillon introuvable")
    if b.auteur_id != current_user.id:
        raise HTTPException(status_code=403, detail="Seul l'auteur peut modifier la visibilité")
    if b.statut in (StatutBrouillon.officiel, StatutBrouillon.archive):
        raise HTTPException(status_code=400, detail="Un brouillon officiel ou archivé est toujours visible")
    b.visible = body.visible
    b.modifie_le = datetime.now(timezone.utc)
    db.commit()
    db.refresh(b)
    return _build_out(b)


@router.put("/{brouillon_id}", response_model=BrouillonOut)
def update_brouillon(
    brouillon_id: int,
    body: BrouillonUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    b = db.query(Brouillon).filter(Brouillon.id == brouillon_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Brouillon introuvable")
    if not _can_edit(b, current_user):
        raise HTTPException(
            status_code=403, detail="Vous n'avez pas le droit de modifier ce brouillon"
        )
    if body.liturgie is not None:
        b.liturgie = body.liturgie
    if body.lecon is not None:
        b.lecon = body.lecon
    if body.divers is not None:
        b.divers = body.divers
    b.modifie_le = datetime.now(timezone.utc)
    db.commit()
    db.refresh(b)
    return _build_out(b)


@router.delete("/{brouillon_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_brouillon(
    brouillon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    b = db.query(Brouillon).filter(Brouillon.id == brouillon_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Brouillon introuvable")
    if b.auteur_id != current_user.id and not _is_responsable(current_user):
        raise HTTPException(status_code=403, detail="Accès refusé")
    if b.statut in (StatutBrouillon.officiel, StatutBrouillon.archive):
        raise HTTPException(
            status_code=400,
            detail="Impossible de supprimer un brouillon officiel ou archivé",
        )
    db.delete(b)
    db.commit()


@router.post("/{brouillon_id}/soumettre", response_model=BrouillonOut)
def soumettre(
    brouillon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soumet le brouillon comme candidat final (auteur uniquement)."""
    b = db.query(Brouillon).filter(Brouillon.id == brouillon_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Brouillon introuvable")
    if b.auteur_id != current_user.id:
        raise HTTPException(status_code=403, detail="Seul l'auteur peut soumettre ce brouillon")
    if b.statut != StatutBrouillon.cree:
        raise HTTPException(status_code=400, detail="Le brouillon n'est pas dans l'état 'créé'")
    b.statut = StatutBrouillon.candidat_final
    b.modifie_le = datetime.now(timezone.utc)
    db.commit()
    db.refresh(b)
    return _build_out(b)


@router.post("/{brouillon_id}/valider", response_model=BrouillonOut)
def valider(
    brouillon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Désigne le brouillon comme officiel (responsable uniquement)."""
    if not _is_responsable(current_user):
        raise HTTPException(status_code=403, detail="Accès réservé aux responsables")
    b = db.query(Brouillon).filter(Brouillon.id == brouillon_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Brouillon introuvable")
    if b.statut == StatutBrouillon.archive:
        raise HTTPException(status_code=400, detail="Impossible de valider un brouillon archivé")
    # Archive tout autre brouillon officiel pour ce dimanche
    db.query(Brouillon).filter(
        Brouillon.date_dimanche == b.date_dimanche,
        Brouillon.statut == StatutBrouillon.officiel,
        Brouillon.id != b.id,
    ).update({"statut": StatutBrouillon.archive})
    b.statut = StatutBrouillon.officiel
    b.valide_par = current_user.id
    b.valide_le = datetime.now(timezone.utc)
    b.modifie_le = datetime.now(timezone.utc)
    db.commit()
    db.refresh(b)
    return _build_out(b)


@router.post("/{brouillon_id}/renvoyer", response_model=BrouillonOut)
def renvoyer(
    brouillon_id: int,
    body: RenvoyerBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Renvoie un brouillon en révision à l'auteur (responsable uniquement)."""
    if not _is_responsable(current_user):
        raise HTTPException(status_code=403, detail="Accès réservé aux responsables")
    b = db.query(Brouillon).filter(Brouillon.id == brouillon_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Brouillon introuvable")
    if b.statut not in (StatutBrouillon.candidat_final, StatutBrouillon.cree):
        raise HTTPException(
            status_code=400,
            detail="Seul un brouillon soumis peut être renvoyé en révision",
        )
    b.statut = StatutBrouillon.en_revision
    b.motif_revision = body.motif.strip() or None
    b.modifie_le = datetime.now(timezone.utc)
    db.commit()
    db.refresh(b)
    return _build_out(b)


@router.post("/dupliquer", response_model=BrouillonOut, status_code=status.HTTP_201_CREATED)
def dupliquer(
    body: BrouillonDuplicate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    source = db.query(Brouillon).filter(Brouillon.id == body.source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Brouillon source introuvable")
    nouveau = Brouillon(
        date_dimanche=body.date_dimanche,
        auteur_id=current_user.id,
        liturgie=source.liturgie,
        lecon=source.lecon,
        divers=source.divers,
    )
    db.add(nouveau)
    db.flush()
    for chant in source.chants:
        db.add(
            Chant(
                brouillon_id=nouveau.id,
                ordre=chant.ordre,
                titre=chant.titre,
                etape=chant.etape,
            )
        )
    db.commit()
    db.refresh(nouveau)
    return _build_out(nouveau)


@router.get("/historique/officiel", response_model=list[BrouillonSummary])
def historique(
    q: str | None = Query(None, description="Recherche texte libre"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Brouillon).filter(
        Brouillon.statut.in_([StatutBrouillon.officiel, StatutBrouillon.archive])
    )
    if q:
        query = query.filter(
            Brouillon.lecon.ilike(f"%{q}%")
            | Brouillon.liturgie.ilike(f"%{q}%")
            | Brouillon.divers.ilike(f"%{q}%")
        )
    brouillons = query.order_by(Brouillon.date_dimanche.desc()).all()
    return [_build_summary(b) for b in brouillons]
