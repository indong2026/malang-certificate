export async function readPhoto(file: File): Promise<HTMLImageElement> {
  if (!file.type.startsWith('image/')) throw new Error('사진 파일을 선택해 주세요. JPG, PNG, WebP를 권장해요.')
  if (file.size > 20 * 1024 * 1024) throw new Error('20MB 이하의 사진을 골라 주세요.')
  const url = URL.createObjectURL(file)
  try {
    const original = new Image()
    original.src = url
    await original.decode().catch(() => { throw new Error('이 사진을 열 수 없어요. HEIC 사진은 JPG나 PNG로 바꿔 주세요.') })
    if (original.naturalWidth * original.naturalHeight > 60_000_000) throw new Error('사진이 너무 커요. 크기를 줄인 뒤 다시 골라 주세요.')
    const ratio = Math.min(1, 2400 / Math.max(original.naturalWidth, original.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(original.naturalWidth * ratio); canvas.height = Math.round(original.naturalHeight * ratio)
    canvas.getContext('2d')!.drawImage(original, 0, 0, canvas.width, canvas.height)
    const image = new Image()
    image.src = canvas.toDataURL('image/png')
    await image.decode()
    return image
  } finally { URL.revokeObjectURL(url) }
}
