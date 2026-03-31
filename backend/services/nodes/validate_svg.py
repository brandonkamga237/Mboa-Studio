import xml.etree.ElementTree as ET

FORBIDDEN_TAGS = {"filter", "clipPath", "mask", "image", "use", "foreignObject", "script"}
SHAPE_TAGS = {"path", "circle", "rect", "polygon", "ellipse", "line", "polyline"}
NS = "http://www.w3.org/2000/svg"


def _local(tag: str) -> str:
    return tag.replace(f"{{{NS}}}", "")


def _validate_single(svg: str, index: int) -> str | None:
    if not svg or not svg.strip().startswith("<svg"):
        return f"Logo {index + 1}: empty or invalid SVG"
    try:
        root = ET.fromstring(svg)
    except ET.ParseError as e:
        return f"Logo {index + 1}: XML parse error — {e}"

    if root.get("viewBox", "") != "0 0 512 512":
        return f"Logo {index + 1}: missing viewBox='0 0 512 512'"

    tags = [_local(el.tag) for el in root.iter()]

    for forbidden in FORBIDDEN_TAGS:
        if forbidden in tags:
            return f"Logo {index + 1}: forbidden tag <{forbidden}>"

    icon = root.find(".//{%s}g[@id='icon']" % NS) or root.find(".//g[@id='icon']")
    if icon is None:
        return f"Logo {index + 1}: missing <g id='icon'>"

    brand = root.find(".//{%s}g[@id='brand-name']" % NS) or root.find(".//g[@id='brand-name']")
    if brand is None:
        return f"Logo {index + 1}: missing <g id='brand-name'>"

    text = brand.find("{%s}text" % NS) or brand.find("text")
    if text is None:
        return f"Logo {index + 1}: <g id='brand-name'> has no <text> child"

    shape_count = sum(1 for t in tags if t in SHAPE_TAGS)
    if shape_count > 20:
        return f"Logo {index + 1}: too many shapes ({shape_count} > 20)"

    return None


def validate_svg(state: dict) -> dict:
    svgs = state.get("svgs", [])
    retry_count = state.get("retry_count", 0)

    errors: list = []
    validated_svgs: list = []

    for i, svg in enumerate(svgs):
        error = _validate_single(svg, i)
        errors.append(error or "")
        validated_svgs.append(svg if not error else "")

    return {
        "errors": errors,
        "validated_svgs": validated_svgs,
        "retry_count": retry_count + (1 if any(errors) else 0),
    }


def should_retry(state: dict) -> str:
    if any(state.get("errors", [])) and state.get("retry_count", 0) < 3:
        return "retry"
    return "done"
