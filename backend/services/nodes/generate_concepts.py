import json
from langchain_core.messages import SystemMessage, HumanMessage
from services.llm_client import get_llm
from prompts.concept_prompt import CONCEPT_SYSTEM_PROMPT, build_concept_user_prompt


async def generate_concepts(state: dict) -> dict:
    llm = get_llm()
    messages = [
        SystemMessage(content=CONCEPT_SYSTEM_PROMPT),
        HumanMessage(content=build_concept_user_prompt(state["brief"])),
    ]

    response = await llm.ainvoke(messages)
    raw = response.content.strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    concepts = json.loads(raw)
    if not isinstance(concepts, list) or len(concepts) != 4:
        raise ValueError(f"Expected list of 4 concepts, got: {type(concepts)}")

    return {"concepts": concepts}
