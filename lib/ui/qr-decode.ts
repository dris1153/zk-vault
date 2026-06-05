// Decode a QR code from an image entirely client-side (the image is never
// uploaded). jsQR is lazy-imported so it stays out of the critical bundle.

export async function decodeQrFromImage(source: Blob): Promise<string | null> {
  const bitmap = await createImageBitmap(source);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return null;
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const { default: jsQR } = await import("jsqr");
  const result = jsQR(data.data, data.width, data.height);
  return result?.data ?? null;
}
