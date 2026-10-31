/** Keep a local, resized JPEG instead of the original camera file and its metadata. */
export async function prepareBodyPhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.size > 20_000_000) throw new Error("Invalid photo")
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const ratio = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio))
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Canvas unavailable")
    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const photo = await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Photo conversion failed")), "image/jpeg", 0.85))
    if (photo.size > 3_000_000) throw new Error("Photo too large")
    return photo
  } finally { URL.revokeObjectURL(url) }
}
