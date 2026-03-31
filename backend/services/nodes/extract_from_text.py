import json
from langchain_core.messages import SystemMessage, HumanMessage
from services.llm_client import get_llm
from services.prompts.extract_prompt import EXTRACT_SYSTEM_PROMPT, build_extract_user_prompt


async def extract_from_text(state: dict) -> dict:
    llm = get_llm(temperature=0.3)
    messages = [
        SystemMessage(content=EXTRACT_SYSTEM_PROMPT),
        HumanMessage(content=build_extract_user_prompt(state["user_text"])),
    ]
    response = await llm.ainvoke(messages)
    raw = response.content.strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    data = json.loads(raw)
    missing_fields = data.pop("missing_fields", [])
    ai_message = data.pop("ai_message", "I analyzed your description.")

    return {
        "extracted": data,
        "missing_fields": missing_fields,
        "ai_message": ai_message,
    }
