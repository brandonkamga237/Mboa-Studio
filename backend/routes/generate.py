import asyncio
import json
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from models.schemas import GenerateRequest
from services.nodes.generate_brief import generate_brief
from services.nodes.render_svg import render_svg
from services.nodes.validate_svg import validate_svg, should_retry
from services.storage import is_maintenance, get_config, track_generation

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


@router.post("/generate")
async def generate_logos(request: GenerateRequest, http_request: Request):
    async def event_stream():
        # ── Maintenance gate ────────────────────────────────────────────
        if is_maintenance():
            cfg = get_config()
            msg = cfg.get("maintenance_message", "L'application est en maintenance.")
            yield f"event: maintenance\ndata: {json.dumps({'message': msg})}\n\n"
            return

        state = {**_EMPTY_STATE, "completed_form": request.completed_form}
        ip = http_request.headers.get("x-forwarded-for", http_request.client.host if http_request.client else "unknown")
        ua = http_request.headers.get("user-agent", "")
        referer = http_request.headers.get("referer", "")

        try:
            # ── Stage 1: Brief ──────────────────────────────────────────────
            yield _stage("brief", "Conception du brief")

            brief_result = await generate_brief(state)
            state.update(brief_result)

            thinking = state.get("thinking", "")
            chunk_size = 60
            for i in range(0, len(thinking), chunk_size):
                yield _thinking(thinking[i:i + chunk_size])
                await asyncio.sleep(0.015)

            # ── Stage 2: Design ─────────────────────────────────────────────
            yield _stage("design", "Rendu des concepts SVG")

            concepts = state.get("concepts", [])
            for idx, concept in enumerate(concepts):
                name = concept.get("name", f"Concept {idx + 1}") if isinstance(concept, dict) else f"Concept {idx + 1}"
                yield _thinking(f"Génération du concept {idx + 1} — {name}...\n\n")
                await asyncio.sleep(0.05)

            svg_result = await render_svg(state)
            state.update(svg_result)

            svgs = state.get("svgs", [])
            descriptions = state.get("concept_descriptions", [])

            for i, svg in enumerate(svgs):
                desc = descriptions[i] if i < len(descriptions) else f"Concept {i + 1}"
                yield _thinking(f"✓ Concept {i + 1} rendu avec succès.\n\n")
                yield f"event: logo\ndata: {json.dumps({'index': i, 'svg': svg, 'description': desc})}\n\n"
                await asyncio.sleep(0.05)

            # ── Stage 3: Validation ─────────────────────────────────────────
            yield _stage("validation", "Validation des SVGs")

            retries = 0
            while retries < 3:
                val_result = validate_svg(state)
                state.update(val_result)
                errors = state.get("errors", [])

                has_errors = any(errors)

                if not has_errors:
                    yield _thinking("Tous les logos ont passé la validation structurelle.\n\n")
                    break

                for i, err in enumerate(errors):
                    if err:
                        yield _thinking(f"⚠ Concept {i + 1}: {err} — Correction en cours...\n\n")

                if should_retry(state) == "done":
                    break

                svg_result = await render_svg(state)
                state.update(svg_result)

                for i, (svg, err) in enumerate(zip(state["svgs"], errors)):
                    if err:
                        desc = descriptions[i] if i < len(descriptions) else f"Concept {i + 1}"
                        yield _thinking(f"✓ Concept {i + 1} corrigé.\n\n")
                        yield f"event: logo\ndata: {json.dumps({'index': i, 'svg': svg, 'description': desc})}\n\n"

                retries += 1

            # ── Track analytics ─────────────────────────────────────────
            brand_name = request.completed_form.get("brand_name", "") if isinstance(request.completed_form, dict) else ""
            valid_count = len([s for s in state.get("svgs", []) if s])
            track_generation(ip, ua, referer, brand_name, valid_count)

            yield f"event: done\ndata: {{}}\n\n"

        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
