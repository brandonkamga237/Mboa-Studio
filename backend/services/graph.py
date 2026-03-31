from typing import TypedDict
from langgraph.graph import StateGraph, END
from services.nodes.interpret_brief import interpret_brief
from services.nodes.generate_concepts import generate_concepts
from services.nodes.render_svg import render_svg
from services.nodes.validate_svg import validate_svg, should_retry


class LogoState(TypedDict):
    brand_name: str
    industry: str
    style: str
    color_palette: str
    slogan: str
    brief: dict
    concepts: list[str]
    svgs: list[str]
    validated_svgs: list[str]
    errors: list[str]
    retry_count: int


def build_graph():
    graph = StateGraph(LogoState)

    graph.add_node("interpret_brief", interpret_brief)
    graph.add_node("generate_concepts", generate_concepts)
    graph.add_node("render_svg", render_svg)
    graph.add_node("validate_svg", validate_svg)

    graph.add_edge("interpret_brief", "generate_concepts")
    graph.add_edge("generate_concepts", "render_svg")
    graph.add_edge("render_svg", "validate_svg")
    graph.add_conditional_edges(
        "validate_svg",
        should_retry,
        {"retry": "render_svg", "done": END},
    )

    graph.set_entry_point("interpret_brief")
    return graph.compile()


chain = build_graph()
