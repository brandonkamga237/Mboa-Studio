from pydantic import BaseModel
from typing import TypedDict


class AnalyzeRequest(BaseModel):
    user_text: str


class GenerateRequest(BaseModel):
    completed_form: dict


class RefineRequest(BaseModel):
    selected_svg: str
    feedback_text: str


class LogoState(TypedDict):
    user_text: str
    extracted: dict
    missing_fields: list
    ai_message: str
    completed_form: dict
    thinking: str
    brief: dict
    concepts: list
    svgs: list
    concept_descriptions: list
    validated_svgs: list
    errors: list
    retry_count: int
    selected_svg: str
    feedback_text: str
    refined_svgs: list
