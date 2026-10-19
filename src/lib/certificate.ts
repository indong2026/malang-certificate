export const CARD = { width: 1000, height: 620 }
export const PHOTO = { x: 728, y: 182, size: 192 }
export const themes = [
  { id: 'cream', name: '우유', color: '#fffdf5', accent: '#b7cf97' },
  { id: 'yellow', name: '버터', color: '#f8e49c', accent: '#b2cb91' },
  { id: 'green', name: '멜론', color: '#d8e5b0', accent: '#f5d98f' },
  { id: 'pink', name: '딸기', color: '#f5d7dd', accent: '#c5d5a6' },
  { id: 'blue', name: '소다', color: '#d4e8ee', accent: '#f3d992' },
] as const
export type ThemeId = typeof themes[number]['id']
export interface Crop { zoom: number; x: number; y: number }
export interface Certificate { subject: string; grade: string; theme: ThemeId; image: HTMLImageElement | null; crop: Crop }
export const defaultCrop: Crop = { zoom: 1, x: 0, y: 0 }
export const defaults: Certificate = { subject: '제초', grade: '3급', theme: 'cream', image: null, crop: defaultCrop }
export const INK = '#33382e'
let fontPromise: Promise<void> | undefined

export function loadCardFont() {
  if (!fontPromise) {
    fontPromise = document.fonts.load('100px "Gaegu"').then(fonts => {
      if (!fonts.length) throw new Error('글꼴을 불러오지 못했어요. 새로고침 후 다시 시도해 주세요.')
    }).catch(error => { fontPromise = undefined; throw error })
  }
  return fontPromise
}

export function imageRect(image: HTMLImageElement, crop: Crop, size: number) {
  const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight) * crop.zoom
  const width = image.naturalWidth * scale, height = image.naturalHeight * scale
  const overflowX = (width - size) / 2, overflowY = (height - size) / 2
  return { width, height, overflowX, overflowY, x: -overflowX + crop.x * overflowX, y: -overflowY + crop.y * overflowY }
}

function stroke(ctx: CanvasRenderingContext2D, data: string, width = 6) {
  ctx.lineWidth = width
  ctx.stroke(new Path2D(data))
}

function fittedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, start: number) {
  let size = start
  ctx.font = `${size}px Gaegu`
  while (ctx.measureText(text).width > maxWidth && size > 10) ctx.font = `${--size}px Gaegu`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y, maxWidth)
}

export function drawPhoto(ctx: CanvasRenderingContext2D, image: HTMLImageElement, crop: Crop, size: number) {
  const rect = imageRect(image, crop, size)
  ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height)
}

// A small original sprout doodle. No third-party character art is used.
function placeholder(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#fffef9'
  ctx.fillRect(PHOTO.x, PHOTO.y, PHOTO.size, PHOTO.size)
  ctx.save()
  ctx.translate(PHOTO.x, PHOTO.y)
  ctx.fillStyle = '#e6ebce'
  ctx.beginPath(); ctx.ellipse(97, 129, 60, 53, -0.04, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke()
  ctx.fillStyle = '#b9ce91'
  const leaf = new Path2D('M96 80 Q58 76 65 47 Q94 42 98 72 Q100 39 130 43 Q133 69 99 80Z')
  ctx.fill(leaf); ctx.stroke(leaf)
  ctx.fillStyle = INK
  for (const x of [78, 115]) { ctx.beginPath(); ctx.ellipse(x, 124, 3.5, 5, 0, 0, Math.PI * 2); ctx.fill() }
  stroke(ctx, 'M88 140 Q97 149 106 139', 3)
  ctx.fillStyle = '#ecb5ac'
  for (const x of [64, 128]) { ctx.beginPath(); ctx.ellipse(x, 138, 9, 5, 0, 0, Math.PI * 2); ctx.fill() }
  ctx.restore()
}

/** Both the on-screen preview and PNG use this exact renderer and loaded local font. */
export function renderCertificate(canvas: HTMLCanvasElement, data: Certificate, width = 2000) {
  canvas.width = width
  canvas.height = width * CARD.height / CARD.width
  const ctx = canvas.getContext('2d')!
  ctx.scale(width / CARD.width, width / CARD.width)
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  const theme = themes.find(item => item.id === data.theme)!
  ctx.fillStyle = theme.color
  ctx.beginPath(); ctx.roundRect(5, 5, 990, 610, 40); ctx.fill()
  ctx.strokeStyle = INK
  // Deliberately asymmetric curves: stable hand-drawn lines, no per-render randomness.
  stroke(ctx, 'M439 55 C331 51 237 57 126 53 Q59 48 55 111 C50 217 58 313 53 426 L57 502 Q53 565 117 566 C343 570 630 561 866 568 Q944 573 946 500 C951 380 943 257 948 132 Q949 59 880 57 C765 50 645 57 565 54', 7)
  stroke(ctx, 'M56 308 C191 315 291 304 419 311 Q587 315 730 308 M921 312 L946 311', 5.5)
  ctx.fillStyle = theme.accent
  const crown = new Path2D('M468 39 L486 54 L503 31 L516 54 L540 40 L530 77 Q504 82 479 76Z')
  ctx.fill(crown); ctx.lineWidth = 5.5; ctx.stroke(crown)
  ctx.fillStyle = INK
  fittedText(ctx, data.subject.trim(), 377, 213, 575, 128)
  fittedText(ctx, data.grade.trim(), 377, 441, 575, 139)
  ctx.save()
  ctx.beginPath(); ctx.rect(PHOTO.x, PHOTO.y, PHOTO.size, PHOTO.size); ctx.clip()
  if (data.image) {
    ctx.fillStyle = '#fffef9'; ctx.fillRect(PHOTO.x, PHOTO.y, PHOTO.size, PHOTO.size)
    ctx.translate(PHOTO.x, PHOTO.y); drawPhoto(ctx, data.image, data.crop, PHOTO.size)
  } else placeholder(ctx)
  ctx.restore()
  ctx.strokeStyle = INK
  stroke(ctx, 'M729 372 C725 318 730 242 729 183 Q813 180 920 185 M922 190 C918 255 925 317 921 374 M916 376 Q811 372 734 377', 5)
}

export function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('이미지 생성에 실패했어요. 다시 시도해 주세요.')), 'image/png'))
}

export function filename(data: Certificate) {
  return `말랑_${data.subject}_${data.grade}`.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').slice(0, 90) + '.png'
}
