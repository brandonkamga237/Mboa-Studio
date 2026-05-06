import io
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user
from models.brouillon import Brouillon
from models.chant import ETAPES_LABELS
from models.user import User

router = APIRouter(prefix="/brouillons", tags=["pdf"])

NAVY = "#1E2D4A"
BLUE = "#2B4C7E"
GOLD = "#C9952A"
CREAM = "#F7F3EE"
WARM_WHITE = "#FDFAF7"
STONE = "#E8E2D9"
MUTED = "#6B7280"
GREEN = "#15803D"
AMBER = "#D97706"

STATUT_FR = {
    "cree": "Brouillon",
    "en_revision": "En révision",
    "candidat_final": "En attente",
    "officiel": "Validé",
    "archive": "Archivé",
}

MOIS = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
]


def _format_date_fr(d: date) -> str:
    return f"Dimanche {d.day} {MOIS[d.month - 1]} {d.year}"


def _safe(text: str | None) -> str:
    if not text:
        return ""
    return (
        text
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\n", "<br/>")
    )


@router.get("/{brouillon_id}/pdf")
def generate_pdf(
    brouillon_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import cm, mm
        from reportlab.platypus import (
            HRFlowable,
            Paragraph,
            SimpleDocTemplate,
            Spacer,
            Table,
            TableStyle,
        )
        from reportlab.platypus.flowables import KeepTogether
    except ImportError:
        raise HTTPException(status_code=500, detail="La bibliothèque PDF n'est pas installée")

    b = db.query(Brouillon).filter(Brouillon.id == brouillon_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Brouillon introuvable")

    buf = io.BytesIO()

    def on_page(canvas, doc):
        canvas.saveState()
        w, h = A4
        # Header bar navy
        canvas.setFillColor(colors.HexColor(NAVY))
        canvas.rect(0, h - 28 * mm, w, 28 * mm, fill=1, stroke=0)
        # Gold accent line under header
        canvas.setFillColor(colors.HexColor(GOLD))
        canvas.rect(0, h - 30 * mm, w, 2 * mm, fill=1, stroke=0)
        # Header: org name
        canvas.setFillColor(colors.white)
        canvas.setFont("Helvetica-Bold", 11)
        canvas.drawString(2 * cm, h - 14 * mm, "Mises en Commun")
        canvas.setFont("Helvetica", 8.5)
        canvas.setFillColor(colors.HexColor("#AABBD4"))
        canvas.drawString(2 * cm, h - 20 * mm, "Culte d'enfants  ·  " + _format_date_fr(b.date_dimanche))
        # Status badge
        statut_val = b.statut.value if hasattr(b.statut, "value") else str(b.statut)
        statut_label = STATUT_FR.get(statut_val, statut_val)
        badge_color = {
            "Validé": GREEN,
            "En attente": AMBER,
            "En révision": "#DC2626",
        }.get(statut_label, MUTED)
        canvas.setFillColor(colors.HexColor(badge_color))
        badge_w = len(statut_label) * 5.2 + 14
        badge_x = w - 2 * cm - badge_w
        badge_y = h - 22 * mm - 2
        canvas.roundRect(badge_x, badge_y, badge_w, 13, 3, fill=1, stroke=0)
        canvas.setFillColor(colors.white)
        canvas.setFont("Helvetica-Bold", 7.5)
        canvas.drawCentredString(badge_x + badge_w / 2, badge_y + 3.5, statut_label)
        # Footer
        canvas.setFillColor(colors.HexColor(CREAM))
        canvas.rect(0, 0, w, 16 * mm, fill=1, stroke=0)
        canvas.setFillColor(colors.HexColor(STONE))
        canvas.rect(0, 16 * mm, w, 0.4 * mm, fill=1, stroke=0)
        canvas.setFillColor(colors.HexColor(MUTED))
        canvas.setFont("Helvetica", 7.5)
        now = datetime.now(timezone.utc).strftime("%d/%m/%Y à %H:%M UTC")
        auteur_info = f"Brouillon de {b.auteur.nom}"
        if b.validateur:
            auteur_info += f"  ·  Validé par {b.validateur.nom}"
        canvas.drawString(2 * cm, 10 * mm, auteur_info)
        canvas.drawString(2 * cm, 5 * mm, f"Généré le {now}")
        canvas.setFont("Helvetica-Bold", 8)
        canvas.setFillColor(colors.HexColor(NAVY))
        canvas.drawRightString(w - 2 * cm, 7 * mm, f"Page {doc.page}")
        canvas.restoreState()

    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=3.6 * cm,
        bottomMargin=2.4 * cm,
        title=f"Culte {_format_date_fr(b.date_dimanche)}",
        author=b.auteur.nom,
    )

    styles = getSampleStyleSheet()

    def s(name, **kw):
        return ParagraphStyle(name, parent=styles["Normal"], **kw)

    h1_style = s("h1", fontName="Helvetica-Bold", fontSize=15, textColor=colors.HexColor(NAVY),
                 spaceAfter=3, leading=20)
    h2_style = s("h2", fontName="Helvetica-Bold", fontSize=10.5, textColor=colors.HexColor(BLUE),
                 spaceBefore=12, spaceAfter=5, leading=14)
    body_style = s("body", fontSize=10, leading=15, textColor=colors.HexColor(NAVY))
    muted_style = s("muted", fontSize=8.5, textColor=colors.HexColor(MUTED), spaceAfter=8, leading=12)
    empty_style = s("empty", fontSize=9.5, textColor=colors.HexColor(MUTED), leading=14)
    motif_style = s("motif", fontSize=9, textColor=colors.HexColor("#92400E"), leading=13,
                    leftIndent=8, spaceBefore=4, spaceAfter=6)

    story = []

    # Title block
    story.append(Paragraph(_format_date_fr(b.date_dimanche), h1_style))
    meta_parts = [f"Brouillon de <b>{b.auteur.nom}</b>"]
    if b.validateur:
        meta_parts.append(f"validé par <b>{b.validateur.nom}</b>")
    story.append(Paragraph("  ·  ".join(meta_parts), muted_style))

    # Motif de révision
    if b.motif_revision:
        story.append(Paragraph(f"⚠ Renvoyé en révision : {_safe(b.motif_revision)}", motif_style))

    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor(STONE), spaceAfter=4))

    # ── Chants ──────────────────────────────────────────────────
    story.append(Paragraph("Chants", h2_style))
    chants_sorted = sorted(b.chants, key=lambda c: c.ordre)
    if chants_sorted:
        data = [["N°", "Étape liturgique", "Titre du chant"]]
        for i, chant in enumerate(chants_sorted, 1):
            etape_label = ETAPES_LABELS.get(chant.etape, chant.etape)
            data.append([str(i), etape_label, chant.titre])
        col_w = [0.9 * cm, 4.8 * cm, 11.3 * cm]
        t = Table(data, colWidths=col_w)
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(NAVY)),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 8),
            ("FONTSIZE", (0, 1), (-1, -1), 9.5),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor(WARM_WHITE), colors.HexColor(CREAM)]),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor(STONE)),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("ALIGN", (0, 0), (0, -1), "CENTER"),
            ("TEXTCOLOR", (1, 1), (1, -1), colors.HexColor(MUTED)),
        ]))
        story.append(KeepTogether([t]))
    else:
        story.append(Paragraph("Aucun chant renseigné.", empty_style))

    # ── Liturgie ────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.3, color=colors.HexColor(STONE), spaceBefore=8, spaceAfter=2))
    story.append(Paragraph("Liturgie", h2_style))
    if b.liturgie and b.liturgie.strip():
        story.append(Paragraph(_safe(b.liturgie), body_style))
    else:
        story.append(Paragraph("Non renseignée.", empty_style))

    # ── Leçon ───────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.3, color=colors.HexColor(STONE), spaceBefore=8, spaceAfter=2))
    story.append(Paragraph("Leçon", h2_style))
    if b.lecon and b.lecon.strip():
        story.append(Paragraph(_safe(b.lecon), body_style))
    else:
        story.append(Paragraph("Non renseignée.", empty_style))

    # ── Divers ──────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.3, color=colors.HexColor(STONE), spaceBefore=8, spaceAfter=2))
    story.append(Paragraph("Informations et divers", h2_style))
    if b.divers and b.divers.strip():
        story.append(Paragraph(_safe(b.divers), body_style))
    else:
        story.append(Paragraph("Rien à signaler.", empty_style))

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    buf.seek(0)

    filename = f"culte_{b.date_dimanche.isoformat()}.pdf"
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )
