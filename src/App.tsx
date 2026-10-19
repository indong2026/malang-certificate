import { useEffect, useRef, useState } from 'react'
import { ArrowDownToLine, ArrowUpRight, Check, ChevronDown, ImagePlus, LockKeyhole, RotateCcw, Share2, Shuffle, Sparkles, X } from 'lucide-react'
import { canvasBlob, defaults, defaultCrop, filename, loadCardFont, renderCertificate, themes, type Certificate } from './lib/certificate'
import { readPhoto } from './lib/photo'
import PhotoEditor from './components/PhotoEditor'
import { Crown, Sprout } from './components/Doodles'

const randomSubjects = ['늦잠 자기', '급식 빨리 먹기', '집 가고 싶기', '멍 때리기', '고양이 모시기', '게임', '지각', '수면', '친구 웃기기', '간식 찾기', '내일로 미루기', '이불 밖 안 나가기', '노래 흥얼거리기', '귀여움 뽐내기', '최애 응원하기']
const randomGrades = ['1급', '5급', '특급', '마스터', '전설급', '국가대표', '명예박사']

export default function App() {
  const [data, setData] = useState<Certificate>({ ...defaults })
  const [ready, setReady] = useState<{ file: File; url: string } | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [fallback, setFallback] = useState(false)
  const [pop, setPop] = useState(false)
  const canvas = useRef<HTMLCanvasElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const uploadId = useRef(0)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | undefined
    setReady(null)
    void (async () => {
      await loadCardFont()
      if (cancelled) return
      renderCertificate(canvas.current!, data)
      const blob = await canvasBlob(canvas.current!)
      if (cancelled) return
      objectUrl = URL.createObjectURL(blob)
      setReady({ file: new File([blob], filename(data), { type: 'image/png' }), url: objectUrl })
    })().catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : '이미지를 만들지 못했어요.') })
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [data])

  useEffect(() => { if (fallback) dialog.current?.showModal(); else dialog.current?.close() }, [fallback])
  useEffect(() => { if (!message) return; const timer = setTimeout(() => setMessage(''), 5000); return () => clearTimeout(timer) }, [message])
  useEffect(() => { if (!pop) return; const timer = setTimeout(() => setPop(false), 450); return () => clearTimeout(timer) }, [pop])

  function update(patch: Partial<Certificate>) { setData(current => ({ ...current, ...patch })); setError('') }
  async function upload(file?: File) {
    if (!file) return
    const id = ++uploadId.current
    setUploading(true); setError('')
    try {
      const image = await readPhoto(file)
      if (id === uploadId.current) { update({ image, crop: { ...defaultCrop } }); setMessage('사진이 쏙 들어갔어요. 위치를 맞춰 주세요!') }
    } catch (e) { if (id === uploadId.current) setError(e instanceof Error ? e.message : '사진을 다시 골라 주세요.') }
    finally { if (id === uploadId.current) setUploading(false) }
  }
  function randomize() {
    let subject = randomSubjects[Math.floor(Math.random() * randomSubjects.length)]
    if (subject === data.subject) subject = randomSubjects[(randomSubjects.indexOf(subject) + 1) % randomSubjects.length]
    update({ subject, grade: randomGrades[Math.floor(Math.random() * randomGrades.length)] })
    setPop(true); setMessage('숨겨진 재능을 발견했어요! 마음대로 수정해도 좋아요.')
  }
  function reset() {
    uploadId.current++; setUploading(false); setFallback(false)
    setData({ ...defaults, crop: { ...defaultCrop } }); setError(''); setMessage('처음의 말랑한 모습으로 돌아왔어요.')
    if (input.current) input.current.value = ''
  }
  function download() {
    if (!ready) return
    const a = document.createElement('a')
    a.href = ready.url; a.download = ready.file.name
    document.body.appendChild(a); a.click(); a.remove()
    setMessage('PNG 저장을 요청했어요. 다운로드 폴더나 파일 앱을 확인해 주세요.')
  }
  async function share() {
    if (!ready) return
    setError('')
    try {
      if (!navigator.canShare?.({ files: [ready.file] }) || !navigator.share) { setFallback(true); return }
      setSharing(true)
      // The file is pre-generated so transient user activation survives on mobile Safari.
      await navigator.share({ files: [ready.file], title: '말랑 자격증 제작소' })
      setMessage('공유 창으로 자격증을 전달했어요!')
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') setMessage('공유를 취소했어요. 자격증은 그대로 있어요.')
      else setFallback(true)
    } finally { setSharing(false) }
  }

  return <>
    <header className="site-header"><a href="#" className="brand" aria-label="말랑 자격증 제작소 홈"><Crown /><span>말랑<span className="brand-dot">.</span></span></a><span className="header-note">아주 사소한 재능도, 소중하게</span><span className="header-badge"><span /> 오늘도 발급 중</span></header>
    <main className="mx-auto max-w-[1160px] px-5 sm:px-8">
      <section className="intro text-center relative">
        <span className="eyebrow">작고 귀여운 나만의 한 장</span>
        <h1>말랑 자격증 제작소<Crown className="title-crown" /></h1>
        <p>이런 것도 재능이니까!<br className="mobile-break" /> 나의 소소한 능력에 자격증을 선물해요.</p>
        <svg className="intro-star" viewBox="0 0 40 50" aria-hidden="true"><path d="m19 3 4 15 12 6-13 5-6 16-3-16L2 22l12-5Z" fill="#f2dea0" stroke="currentColor" strokeWidth="2" /></svg>
      </section>
      <div className="workspace">
        <section className="preview-section" aria-label="자격증 미리보기">
          <div className="preview-top"><span className="section-kicker"><span className="live-dot" /> 나만의 자격증</span><span className="preview-pill">미리보기</span></div>
          <div className="workmat">
            <div className="mat-caption">당신의 귀여운 재능을 인정합니다</div>
            <div className={`certificate-wrap ${pop ? 'pop' : ''}`}><canvas ref={canvas} className="certificate" role="img" aria-label={`${data.subject || '종목 미입력'} ${data.grade || '등급 미입력'} 자격증 미리보기`} /><span className="tape" /></div>
            <div className="mat-bottom"><span className="hand-note">세상에 하나뿐인 내 자격증</span><span className="drawn-arrow">⤴</span><Sprout /></div>
            <span className="mat-spark one" aria-hidden="true">✧</span><span className="mat-spark two" aria-hidden="true">✳</span>
          </div>
          <div className="preview-under"><span><Check size={14} /> 사진도, 글씨도 내 마음대로</span><span>2000 × 1240 PNG</span></div>
          <div className="desktop-note"><span className="tiny-star">✶</span><p>잘하는 게 없어도 괜찮아요.<br /><strong>귀여운 것도 충분한 자격이니까.</strong></p></div>
        </section>

        <section className="editor" aria-label="자격증 편집 도구">
          <div className="editor-heading"><h2>어떤 재능이 있나요?</h2><button className="reset-button" onClick={reset}><RotateCcw size={13} /> 초기화</button></div>
          <div className="edit-section first">
            <h3><span className="step">01</span> 나의 재능 적기 <span className="aside-note">뻔뻔할수록 좋아요</span></h3>
            <div className="text-fields"><label htmlFor="subject">종목명<span className="field-box"><input id="subject" value={data.subject} maxLength={40} placeholder="예: 급식 먹기" onChange={e => update({ subject: e.target.value })} autoComplete="off" /><span>{Array.from(data.subject).length}/40</span></span></label><label htmlFor="grade">등급<span className="field-box"><input id="grade" value={data.grade} maxLength={20} placeholder="예: 마스터" onChange={e => update({ grade: e.target.value })} autoComplete="off" /></span></label></div>
            <button type="button" className="random-button" onClick={randomize}><Shuffle size={15} /> 무슨 재능이 있더라? <strong>랜덤 자격증 만들기</strong><Sparkles size={14} /></button>
          </div>
          <div className="edit-section">
            <h3><span className="step">02</span> 나의 사진 넣기 <span className="optional">선택</span></h3>
            <input ref={input} type="file" accept="image/*" className="sr-only" id="photo-upload" aria-label="사진 업로드" onChange={e => { void upload(e.target.files?.[0]); e.target.value = '' }} />
            <button type="button" className={`upload-button ${dragging ? 'drag-over' : ''}`} onClick={() => input.current?.click()} disabled={uploading}
              onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); void upload(e.dataTransfer.files[0]) }}>
              <span className="upload-icon"><ImagePlus size={23} strokeWidth={1.5} /></span><span><strong>{uploading ? '사진을 준비하고 있어요…' : data.image ? '다른 사진으로 바꾸기' : '내 사진 쏙 넣기'}</strong><small>갤러리에서 선택하거나 여기로 끌어오세요</small></span><span className="upload-plus">+</span>
            </button>
            {data.image && <><PhotoEditor image={data.image} crop={data.crop} onChange={crop => update({ crop })} /><button className="remove-photo" onClick={() => { uploadId.current++; setUploading(false); update({ image: null, crop: { ...defaultCrop } }) }}>사진 지우고 새싹으로 돌아가기</button></>}
          </div>
          <fieldset className="edit-section theme-section"><legend><span className="step">03</span> 좋아하는 색 고르기</legend><div className="themes">{themes.map(theme => <button key={theme.id} type="button" aria-pressed={data.theme === theme.id} aria-label={`${theme.name} 테마`} className={`theme ${data.theme === theme.id ? 'selected' : ''}`} onClick={() => update({ theme: theme.id })}><span className="swatch" style={{ background: theme.color }}>{data.theme === theme.id && <Check size={19} strokeWidth={2} />}</span><span>{theme.name}</span></button>)}</div></fieldset>
          {error && <div className="error" role="alert">{error}</div>}
          <div className="export-actions"><button className="save-button" disabled={!ready || uploading} onClick={download}><ArrowDownToLine size={19} /> 이미지 저장하기</button><button className="share-button" disabled={!ready || uploading || sharing} onClick={() => void share()}><Share2 size={17} /> {sharing ? '공유 중…' : '친구에게 공유하기'}<ArrowUpRight size={15} /></button><p className="privacy-note"><LockKeyhole size={12} /> 사진은 내 기기에만. 어디에도 전송하지 않아요.</p></div>
        </section>
      </div>
      <section className="how-to"><span className="how-title">행복한 자격증 생활</span><span><b>1</b> 재능을 적고</span><i>→</i><span><b>2</b> 내 사진을 넣고</span><i>→</i><span><b>3</b> 친구에게 자랑하기 <span className="little-heart">♡</span></span></section>
      <details className="help"><summary>저장과 공유가 궁금해요 <ChevronDown size={14} /></summary><div><p><strong>저장한 사진은 어디 있나요?</strong> 브라우저의 다운로드 폴더 또는 휴대폰의 ‘파일’ 앱을 확인해 주세요. 아이폰에서는 파일을 연 뒤 공유 메뉴의 ‘이미지 저장’으로 사진 앱에 넣을 수 있어요.</p><p><strong>카카오톡이나 인스타그램으로 보내려면?</strong> ‘친구에게 공유하기’를 눌러 기기의 공유 목록에서 앱을 선택해 주세요. 앱이 보이지 않으면 PNG를 저장한 뒤, 앱의 대화창에서 사진을 첨부하면 돼요. 지원 앱은 기기와 브라우저에 따라 달라요.</p><p><strong>내 사진은 안전한가요?</strong> 업로드·저장·공유용 이미지 생성은 브라우저 안에서만 이뤄져요. 계정, 서버 업로드, 분석 도구가 없고 새로고침하면 편집 내용은 사라져요. 공유를 선택한 경우에만 직접 고른 앱으로 이미지를 전달해요.</p></div></details>
    </main>
    <footer><span className="footer-brand">말랑 자격증 제작소</span><p>재미로 만드는 자격증이에요. 공식적인 효력은 없지만, 귀여움은 유효해요.</p><span>작은 재능, 커다란 뿌듯함 <span aria-hidden="true">✳</span></span></footer>
    <div className={`toast ${message ? 'visible' : ''}`} role="status" aria-live="polite">{message}</div>
    <dialog ref={dialog} className="share-dialog" onCancel={() => setFallback(false)} onClick={e => { if (e.target === e.currentTarget) setFallback(false) }} aria-labelledby="share-title"><button className="dialog-close" aria-label="닫기" onClick={() => setFallback(false)}><X size={20} /></button><Crown /><h2 id="share-title">저장해서 보내도 좋아요!</h2><p>이 브라우저에서는 파일 공유를 사용할 수 없거나<br />공유 창을 열지 못했어요. PNG를 저장한 뒤<br />카카오톡이나 DM에 사진으로 첨부해 주세요.</p>{ready && <img src={ready.url} alt="공유할 완성 자격증" />}<button className="save-button" onClick={download}><ArrowDownToLine size={18} /> PNG 이미지 저장하기</button><p className="dialog-tip">저장 창이 뜨지 않으면 위 이미지를 길게 눌러 저장해 주세요.</p></dialog>
  </>
}
