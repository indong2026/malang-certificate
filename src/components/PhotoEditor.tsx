import { useEffect, useRef } from 'react'
import { Move, RotateCcw } from 'lucide-react'
import { drawPhoto, imageRect, defaultCrop, type Crop } from '../lib/certificate'

interface Props { image: HTMLImageElement; crop: Crop; onChange: (crop: Crop) => void }
const clamp = (value: number) => Math.max(-1, Math.min(1, value))

export default function PhotoEditor({ image, crop, onChange }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const drag = useRef<{ x: number; y: number; crop: Crop } | null>(null)
  useEffect(() => {
    const ctx = canvas.current!.getContext('2d')!
    ctx.clearRect(0, 0, 400, 400)
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 400, 400)
    drawPhoto(ctx, image, crop, 400)
  }, [image, crop])
  return <div className="crop-editor">
    <div className="crop-top">
      <canvas ref={canvas} width={400} height={400} className="crop-canvas" aria-label="사진 위치 조절 영역. 드래그하거나 아래 슬라이더를 사용하세요."
        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, crop } }}
        onPointerMove={e => {
          if (!drag.current) return
          const rect = imageRect(image, drag.current.crop, e.currentTarget.getBoundingClientRect().width)
          onChange({ ...drag.current.crop,
            x: rect.overflowX > 0.1 ? clamp(drag.current.crop.x + (e.clientX - drag.current.x) / rect.overflowX) : 0,
            y: rect.overflowY > 0.1 ? clamp(drag.current.crop.y + (e.clientY - drag.current.y) / rect.overflowY) : 0 })
        }} onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }} />
      <div><p className="crop-title"><Move size={15} /> 살짝 옮겨볼까요?</p><p>사진을 손가락으로 움직여<br />얼굴을 가운데에 맞춰 주세요.</p><button type="button" className="text-button" onClick={() => onChange({ ...defaultCrop })}><RotateCcw size={13} /> 위치 되돌리기</button></div>
    </div>
    <label className="slider-label">확대 <input aria-label="사진 확대" type="range" min="1" max="3" step="0.01" value={crop.zoom} onChange={e => onChange({ ...crop, zoom: +e.target.value })} /><span>{crop.zoom.toFixed(1)}×</span></label>
    <details className="position-details"><summary>슬라이더로 위치 조절하기</summary>
      <label className="slider-label">좌우 <input aria-label="사진 좌우 위치" type="range" min="-1" max="1" step="0.01" value={crop.x} onChange={e => onChange({ ...crop, x: +e.target.value })} /></label>
      <label className="slider-label">위아래 <input aria-label="사진 위아래 위치" type="range" min="-1" max="1" step="0.01" value={crop.y} onChange={e => onChange({ ...crop, y: +e.target.value })} /></label>
    </details>
  </div>
}
