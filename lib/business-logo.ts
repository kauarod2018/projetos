// Validação da logo enviada pelo navegador: só PNG, JPEG ou WebP em data URL, até ~300 KB.
// SVG fica de fora porque pode carregar scripts.
const pattern = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
export const MAX_LOGO_CHARS = 420_000;

export function parseLogoDataUrl(value: unknown) {
  if (typeof value !== "string" || value.length > MAX_LOGO_CHARS) return null;
  const match = pattern.exec(value);
  if (!match) return null;
  const bytes = Buffer.from(match[2], "base64");
  const signatures: Record<string, (b: Buffer) => boolean> = {
    png: b => b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
    jpeg: b => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
    webp: b => b.length > 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP",
  };
  if (!signatures[match[1]](bytes)) return null;
  return { mime: `image/${match[1]}`, bytes, dataUrl: value };
}
