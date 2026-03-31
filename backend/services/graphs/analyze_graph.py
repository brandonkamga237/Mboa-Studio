from langgraph.graph import StateGraph, END
from services.nodes.extract_from_text import extract_from_text
from models.schemas import LogoState


def build_analyze_graph():
    graph = StateGraph(LogoState)
    graph.add_node("extract_from_text", extract_from_text)
    graph.set_entry_point("extract_from_text")
    graph.add_edge("extract_from_text", END)
    return graph.compile()


analyze_chain = build_analyze_graph()
