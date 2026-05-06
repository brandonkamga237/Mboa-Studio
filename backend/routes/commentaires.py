from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user
from models.brouillon import Brouillon
from models.commentaire import Commentaire
from models.user import RoleEnum, User
from schemas.commentaire import CommentaireCreate, CommentaireOut

router = APIRouter(prefix="/brouillons/{brouillon_id}/commentaires", tags=["commentaires"])


def _get_brouillon_or_404(brouillon_id: int, db: Session) -> Brouillon:
    b = db.query(Brouillon).filter(Brouillon.id == brouillon_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Brouillon introuvable")
    return b


def _build_tree(commentaires: list[Commentaire]) -> list[CommentaireOut]:
    """Construit l'arborescence des commentaires."""
    by_id = {c.id: c for c in commentaires}
    roots = []
    children: dict[int, list[Commentaire]] = {}
    for c in commentaires:
        if c.parent_id is None:
            roots.append(c)
        else:
            children.setdefault(c.parent_id, []).append(c)

    def to_out(c: Commentaire) -> CommentaireOut:
        out = CommentaireOut.model_validate(c)
        out.reponses = [to_out(child) for child in children.get(c.id, [])]
        return out

    return [to_out(r) for r in roots]


@router.get("/", response_model=list[CommentaireOut])
def list_commentaires(
    brouillon_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    _get_brouillon_or_404(brouillon_id, db)
    commentaires = (
        db.query(Commentaire)
        .filter(Commentaire.brouillon_id == brouillon_id)
        .order_by(Commentaire.cree_le)
        .all()
    )
    return _build_tree(commentaires)


@router.post("/", response_model=CommentaireOut, status_code=status.HTTP_201_CREATED)
def add_commentaire(
    brouillon_id: int,
    body: CommentaireCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_brouillon_or_404(brouillon_id, db)
    if body.parent_id:
        parent = db.query(Commentaire).filter(
            Commentaire.id == body.parent_id,
            Commentaire.brouillon_id == brouillon_id,
        ).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Commentaire parent introuvable")
    c = Commentaire(
        auteur_id=current_user.id,
        contenu=body.contenu,
        cible_type=body.cible_type,
        cible_id=body.cible_id,
        brouillon_id=brouillon_id,
        parent_id=body.parent_id,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    out = CommentaireOut.model_validate(c)
    out.reponses = []
    return out


router_extra = APIRouter(prefix="/commentaires", tags=["commentaires"])


@router_extra.put("/{commentaire_id}/resoudre", response_model=CommentaireOut)
def resoudre_commentaire(
    commentaire_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    c = db.query(Commentaire).filter(Commentaire.id == commentaire_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Commentaire introuvable")
    brouillon = db.query(Brouillon).filter(Brouillon.id == c.brouillon_id).first()
    is_auteur_brouillon = brouillon and brouillon.auteur_id == current_user.id
    is_resp = current_user.role in (RoleEnum.responsable, RoleEnum.admin)
    if not is_auteur_brouillon and not is_resp:
        raise HTTPException(
            status_code=403,
            detail="Seul l'auteur du brouillon ou un responsable peut résoudre un commentaire",
        )
    c.resolu = True
    db.commit()
    db.refresh(c)
    out = CommentaireOut.model_validate(c)
    out.reponses = []
    return out
