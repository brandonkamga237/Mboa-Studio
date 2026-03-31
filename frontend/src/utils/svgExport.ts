function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSVG(svgString: string, brandName: string) {
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  triggerDownload(blob, `${brandName.toLowerCase().replace(/\s+/g, "-")}-logo.svg`);
}

export async function exportPNG(svgString: string, brandName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1024, 1024);
      ctx.drawImage(img, 0, 0, 1024, 1024);
      URL.revokeObjectURL(url);

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) { reject(new Error("Canvas toBlob failed")); return; }
        triggerDownload(pngBlob, `${brandName.toLowerCase().replace(/\s+/g, "-")}-logo.png`);
        resolve();
      }, "image/png");
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("SVG load failed")); };
    img.src = url;
  });
}
