from langgraph.graph import StateGraph, END
from services.nodes.generate_brief import generate_brief
from services.nodes.render_svg import render_svg
from services.nodes.validate_svg import validate_svg, should_retry
from models.schemas import LogoState


def build_generate_graph():
    graph = StateGraph(LogoState)
    graph.add_node("generate_brief", generate_brief)
    graph.add_node("render_svg", render_svg)
    graph.add_node("validate_svg", validate_svg)
    graph.add_edge("generate_brief", "render_svg")
    graph.add_edge("render_svg", "validate_svg")
    graph.add_conditional_edges(
        "validate_svg",
        should_retry,
        {"retry": "render_svg", "done": END},
    )
    graph.set_entry_point("generate_brief")
    return graph.compile()


generate_chain = build_generate_graph()
