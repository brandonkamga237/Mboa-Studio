import json
from langchain_core.messages import SystemMessage, HumanMessage
from services.llm_client import get_llm
from prompts.brief_prompt import BRIEF_SYSTEM_PROMPT, build_brief_user_prompt


async def interpret_brief(state: dict) -> dict:
    llm = get_llm()
    messages = [
        SystemMessage(content=BRIEF_SYSTEM_PROMPT),
        HumanMessage(content=build_brief_user_prompt(
            brand_name=state["brand_name"],
            industry=state["industry"],
            style=state["style"],
            color_palette=state["color_palette"],
            slogan=state["slogan"],
        )),
    ]

    response = await llm.ainvoke(messages)
    raw = response.content.strip()

    # Strip any accidental markdown fences
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    brief = json.loads(raw)
    return {"brief": brief}
