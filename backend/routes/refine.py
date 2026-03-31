import asyncio
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from models.schemas import RefineRequest
from services.nodes.refine_svg import refine_from_feedback
from services.nodes.validate_svg import validate_svg, should_retry

router = APIRouter()

_EMPTY_STATE = {
    "user_text": "",
    "extracted": {},
    "missing_fields": [],
    "ai_message": "",
    "completed_form": {},
    "thinking": "",
    "brief": {},
    "concepts": [],
    "svgs": [],
    "concept_descriptions": [],
    "validated_svgs": [],
    "errors": [],
    "retry_count": 0,
    "selected_svg": "",
    "feedback_text": "",
    "refined_svgs": [],
}


def _stage(id: str, label: str) -> str:
    return f"event: stage\ndata: {json.dumps({'id': id, 'label': label})}\n\n"


def _thinking(text: str) -> str:
    return f"event: thinking\ndata: {json.dumps({'text': text})}\n\n"


@router.post("/refine")
async def refine_logo(request: RefineRequest):
    async def event_stream():
        state = {
            **_EMPTY_STATE,
            "selected_svg": request.selected_svg,
            "feedback_text": request.feedback_text,
        }

        try:
            # ── Stage 1: Analyse du feedback ────────────────────────────────
            yield _stage("analyse", "Analyse du feedback")
            yield _thinking(f"Feedback reçu : « {request.feedback_text} »\n\n")
            await asyncio.sleep(0.1)
            yield _thinking("Identification des éléments à modifier dans le logo original...\n\n")
            await asyncio.sleep(0.1)

            # ── Stage 2: Génération des variations ──────────────────────────
            yield _stage("design", "Génération des variations")
            yield _thinking("Génération de 2 variations en parallèle...\n\n")

            refine_result = await refine_from_feedback(state)
            state.update(refine_result)

            # ── Stage 3: Validation ─────────────────────────────────────────
            yield _stage("validation", "Validation")

            val_result = validate_svg(state)
            state.update(val_result)

            errors = state.get("errors", [])
            svgs = state.get("svgs", [])
            descriptions = state.get("concept_descriptions", ["Variation raffinée", "Interprétation créative"])

            if any(errors):
                for i, err in enumerate(errors):
                    if err:
                        yield _thinking(f"⚠ Variation {i + 1}: {err}\n\n")

                if should_retry(state) == "retry":
                    yield _thinking("Correction automatique en cours...\n\n")
                    from services.nodes.render_svg import render_svg
                    svg_result = await render_svg(state)
                    state.update(svg_result)
                    svgs = state.get("svgs", [])
            else:
                yield _thinking("Les 2 variations ont passé la validation.\n\n")

            for i, svg in enumerate(svgs):
                desc = descriptions[i] if i < len(descriptions) else f"Variation {i + 1}"
                yield f"event: logo\ndata: {json.dumps({'index': i, 'svg': svg, 'description': desc})}\n\n"
                await asyncio.sleep(0.05)

            yield f"event: done\ndata: {{}}\n\n"

        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
