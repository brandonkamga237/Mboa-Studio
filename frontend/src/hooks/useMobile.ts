import { useState, useEffect } from "react";

export function useMobile(breakpoint = 640) {
  const [mobile, setMobile] = useState(() => window.innerWidth <= breakpoint);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", handler, { passive: true });
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return mobile;
}
