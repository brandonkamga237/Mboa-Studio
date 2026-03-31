import json
from langchain_core.messages import SystemMessage, HumanMessage
from services.llm_client import get_llm
from services.prompts.brief_prompt import BRIEF_SYSTEM_PROMPT, build_brief_user_prompt


async def generate_brief(state: dict) -> dict:
    llm = get_llm(temperature=0.7)
    form = state.get("completed_form", {})
    messages = [
        SystemMessage(content=BRIEF_SYSTEM_PROMPT),
        HumanMessage(content=build_brief_user_prompt(form)),
    ]
    response = await llm.ainvoke(messages)
    raw = response.content.strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    data = json.loads(raw)
    thinking = data.pop("thinking_text", "")
    concepts = data.get("concepts", [])
    concept_descriptions = data.get("concept_descriptions", [f"Concept {i+1}" for i in range(4)])

    return {
        "thinking": thinking,
        "brief": data,
        "concepts": concepts,
        "concept_descriptions": concept_descriptions,
    }
