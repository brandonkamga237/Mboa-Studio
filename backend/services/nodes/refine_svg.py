import asyncio
from langchain_core.messages import SystemMessage, HumanMessage
from services.llm_client import get_llm
from services.prompts.svg_prompt import SVG_SYSTEM_PROMPT, build_refine_user_prompt


def _clean_svg(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        for part in parts:
            stripped = part.strip()
            if stripped.startswith("<svg"):
                return stripped
    return raw


async def _refine_single(llm, selected_svg: str, feedback: str, brand_name: str, variation_hint: str) -> str:
    feedback_with_hint = f"{feedback}\n\nVariation note: {variation_hint}"
    messages = [
        SystemMessage(content=SVG_SYSTEM_PROMPT),
        HumanMessage(content=build_refine_user_prompt(selected_svg, feedback_with_hint, brand_name)),
    ]
    response = await llm.ainvoke(messages)
    return _clean_svg(response.content)


async def refine_from_feedback(state: dict) -> dict:
    llm = get_llm(temperature=0.8)
    selected_svg = state.get("selected_svg", "")
    feedback = state.get("feedback_text", "")
    form = state.get("completed_form", {})
    brand_name = form.get("brand_name", "Brand")

    tasks = [
        _refine_single(llm, selected_svg, feedback, brand_name, "Apply the feedback faithfully and directly."),
        _refine_single(llm, selected_svg, feedback, brand_name, "Apply the feedback but also explore a slightly bolder creative interpretation."),
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)
    svgs = []
    for result in results:
        if isinstance(result, Exception):
            svgs.append("")
        else:
            svgs.append(result)

    return {
        "svgs": svgs,
        "concepts": ["Refined version", "Creative interpretation"],
        "concept_descriptions": [
            "Direct application of your feedback",
            "Bold creative interpretation of your feedback",
        ],
        "errors": [],
        "retry_count": 0,
        "validated_svgs": [],
    }
