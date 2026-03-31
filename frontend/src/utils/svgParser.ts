export function extractColors(svgString: string): { primary: string; secondary: string } {
  const fallback = { primary: "#0f0f0f", secondary: "#525252" };
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    const iconGroup = doc.getElementById("icon");
    if (!iconGroup) return fallback;

    const fills = Array.from(iconGroup.children as HTMLCollectionOf<SVGElement>)
      .map((el) => el.getAttribute("fill"))
      .filter((f): f is string => !!f && f !== "none" && f !== "transparent" && f.toLowerCase() !== "#ffffff");

    return {
      primary: fills[0] ?? fallback.primary,
      secondary: fills[1] ?? fills[0] ?? fallback.secondary,
    };
  } catch {
    return fallback;
  }
}

export function applyEdits(
  svgString: string,
  primaryColor: string,
  secondaryColor: string,
  fontFamily: string,
  fontSize: number,
  layout: "icon-above" | "icon-left" | "text-only"
): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    const svg = doc.documentElement;

    const iconGroup = doc.getElementById("icon");
    if (iconGroup) {
      Array.from(iconGroup.children as HTMLCollectionOf<SVGElement>).forEach((el, i) => {
        const fill = el.getAttribute("fill");
        if (fill && fill !== "none" && fill !== "transparent" && fill.toLowerCase() !== "#ffffff") {
          el.setAttribute("fill", i === 0 ? primaryColor : secondaryColor);
        }
      });
    }

    (Array.from(svg.querySelectorAll("text")) as SVGTextElement[]).forEach((t) => {
      t.setAttribute("font-family", fontFamily);
      if (t.closest("#brand-name")) t.setAttribute("font-size", String(fontSize));
    });

    if (layout === "icon-left") {
      iconGroup?.setAttribute("transform", "translate(-80, 40) scale(0.7)");
      doc.getElementById("brand-name")?.setAttribute("transform", "translate(80, 0)");
    } else if (layout === "text-only") {
      if (iconGroup) iconGroup.setAttribute("display", "none");
    } else {
      iconGroup?.removeAttribute("transform");
    }

    return new XMLSerializer().serializeToString(svg);
  } catch {
    return svgString;
  }
}
