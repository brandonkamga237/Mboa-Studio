from langgraph.graph import StateGraph, END
from services.nodes.refine_svg import refine_from_feedback
from services.nodes.validate_svg import validate_svg, should_retry
from models.schemas import LogoState


def build_refine_graph():
    graph = StateGraph(LogoState)
    graph.add_node("refine", refine_from_feedback)
    graph.add_node("validate_svg", validate_svg)
    graph.add_edge("refine", "validate_svg")
    graph.add_conditional_edges(
        "validate_svg",
        should_retry,
        {"retry": "refine", "done": END},
    )
    graph.set_entry_point("refine")
    return graph.compile()


refine_chain = build_refine_graph()
