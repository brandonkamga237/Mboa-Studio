import asyncio
from langchain_core.messages import SystemMessage, HumanMessage
from services.llm_client import get_llm
from services.prompts.svg_prompt import SVG_SYSTEM_PROMPT, build_svg_user_prompt


def _clean_svg(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        for part in parts:
            stripped = part.strip()
            if stripped.startswith("<svg"):
                return stripped
    return raw


async def _render_single(llm, concept: str, brief: dict, brand_name: str, slogan: str, index: int) -> tuple[int, str]:
    messages = [
        SystemMessage(content=SVG_SYSTEM_PROMPT),
        HumanMessage(content=build_svg_user_prompt(concept, brief, brand_name, slogan)),
    ]
    response = await llm.ainvoke(messages)
    return index, _clean_svg(response.content)


async def render_svg(state: dict) -> dict:
    llm = get_llm(temperature=0.8)
    concepts = state.get("concepts", [])
    brief = state.get("brief", {})
    form = state.get("completed_form", {})
    brand_name = form.get("brand_name", "Brand")
    slogan = form.get("slogan", "")

    existing_svgs = state.get("svgs", [""] * len(concepts))
    errors = state.get("errors", [])

    failed_indices = [i for i, e in enumerate(errors) if e] if errors else list(range(len(concepts)))

    tasks = [
        _render_single(llm, concepts[i], brief, brand_name, slogan, i)
        for i in failed_indices
        if i < len(concepts)
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)
    svgs = list(existing_svgs) if existing_svgs else [""] * len(concepts)
    while len(svgs) < len(concepts):
        svgs.append("")

    for result in results:
        if isinstance(result, Exception):
            continue
        idx, svg = result
        svgs[idx] = svg

    return {"svgs": svgs}
