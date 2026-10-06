export async function compressPhoto(file: File) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 12_000_000) throw new Error("Escolha uma foto JPEG, PNG ou WebP de até 12 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 24_000_000) throw new Error("A foto é muito grande. Escolha uma imagem menor.");
    const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d"); if (!context) throw new Error("Este navegador não conseguiu preparar a foto.");
    context.fillStyle = "white"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.82, 0.65, 0.45, 0.25]) { const data = canvas.toDataURL("image/jpeg", quality); if (data.length < 333000) return data; }
    throw new Error("A foto ainda está grande. Escolha uma imagem menor.");
  } finally { bitmap.close(); }
}
