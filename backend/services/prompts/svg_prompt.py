SVG_SYSTEM_PROMPT = """You are an SVG logo generator. Output ONLY valid SVG code. No explanation, no markdown, no backticks.

RULES:
- Start with <svg, end with </svg>
- viewBox="0 0 512 512"
- xmlns="http://www.w3.org/2000/svg"
- Wrap icon shapes in: <g id="icon">...</g>
- Wrap brand name in: <g id="brand-name"><text>...</text></g>
- Wrap slogan (if any) in: <g id="slogan"><text>...</text></g>
- All text MUST use <text> elements, NEVER <path>
- font-family from: "Inter", "Space Grotesk", "DM Sans", "Playfair Display", "JetBrains Mono", "Libre Baskerville"
- Colors as hex only (#RRGGBB). No named colors, no rgb().
- Max 20 shape elements total (path, circle, rect, polygon, ellipse, line)
- NO filter, clipPath, mask, image, use, foreignObject, script
- Keep shapes simple and geometric
- Center composition in viewBox
- Every shape must have an explicit fill attribute
- Background: add a <rect width="512" height="512" fill="#ffffff"/> as first element

OUTPUT: raw SVG code starting with <svg and ending with </svg>"""


def build_svg_user_prompt(concept: str, brief: dict, brand_name: str, slogan: str) -> str:
    colors = brief.get("colors", ["#1a1a2e", "#7c3aed"])
    font = brief.get("font", "Inter")
    layout = brief.get("layout", "icon-above")
    return f"""Render this logo concept as SVG:

Concept: {concept}

Brand name: {brand_name}
Slogan: {slogan if slogan else "none"}
Colors: {', '.join(colors)}
Font: {font}
Layout: {layout}

Generate the complete SVG now."""


def build_refine_user_prompt(selected_svg: str, feedback: str, brand_name: str) -> str:
    return f"""You are refining an existing SVG logo based on user feedback.

User feedback: {feedback}

Brand name: {brand_name}

Existing SVG to refine:
{selected_svg}

Apply the feedback and generate an improved SVG logo. Keep what works, change what the feedback requests. Output only the new SVG."""
