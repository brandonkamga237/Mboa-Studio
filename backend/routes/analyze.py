from fastapi import APIRouter, HTTPException
from models.schemas import AnalyzeRequest
from services.graphs.analyze_graph import analyze_chain

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


@router.post("/analyze")
async def analyze(request: AnalyzeRequest):
    state = {**_EMPTY_STATE, "user_text": request.user_text}
    try:
        result = await analyze_chain.ainvoke(state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")
    return {
        "extracted": result["extracted"],
        "missing_fields": result["missing_fields"],
        "ai_message": result["ai_message"],
    }
