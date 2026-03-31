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
- Every shape must have an explicit fill attribute"""


def build_svg_user_prompt(concept: str, brief: dict, brand_name: str, slogan: str) -> str:
    colors = brief.get("colors", ["#1a1a2e", "#16213e", "#0f3460"])
    font_map = {
        "geometric-sans": "Inter",
        "rounded-sans": "DM Sans",
        "serif": "Playfair Display",
        "slab": "Libre Baskerville",
        "mono": "JetBrains Mono",
    }
    font = font_map.get(brief.get("typography_mood", "geometric-sans"), "Space Grotesk")

    return f"""Logo concept to render:
{concept}

Brand name: {brand_name}
Slogan: {slogan if slogan else "none"}
Colors to use: {', '.join(colors)}
Suggested font: {font}
Layout: {brief.get('layout', 'icon-above')}

Render this as a complete SVG logo now."""
