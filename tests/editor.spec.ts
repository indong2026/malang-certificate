import { test, expect, type Page } from '@playwright/test'
import { readFile, mkdir } from 'node:fs/promises'

async function ready(page: Page) { await expect(page.getByRole('button', { name: '이미지 저장하기', exact: true })).toBeEnabled() }
async function pixels(page: Page) { return page.locator('.certificate').evaluate((c: HTMLCanvasElement) => c.toDataURL()) }
async function uploadTestPhoto(page: Page) {
  // Asymmetric color fixture catches incorrect position, clipping and missing-photo exports.
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 900
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ed8899'; ctx.fillRect(0, 0, 600, 900)
    ctx.fillStyle = '#64aacc'; ctx.fillRect(300, 0, 300, 450)
    ctx.fillStyle = '#f5df4f'; ctx.fillRect(0, 450, 300, 450)
    ctx.fillStyle = '#223344'; ctx.fillRect(200, 330, 200, 220)
    return canvas.toDataURL().split(',')[1]
  })
  await page.locator('#photo-upload').setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from(base64, 'base64') })
  await expect(page.locator('.crop-canvas')).toBeVisible(); await ready(page)
}

test('Korean text, themes, photo crop, random, PNG parity and reset', async ({ page }, testInfo) => {
  const errors: string[] = []; const externalRequests: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith('http://127.0.0.1:4173/')) externalRequests.push(request.url()) })
  await page.goto('/'); await ready(page)
  await expect(page.getByRole('heading', { name: '말랑 자격증 제작소', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.fonts.check('100px Gaegu'))).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('initial.png'), fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const preview = await page.locator('.preview-section').boundingBox(); const editor = await page.locator('.editor').boundingBox()
  if (testInfo.project.name === 'mobile') expect(preview!.y + preview!.height).toBeLessThan(editor!.y)
  const initial = await pixels(page)
  await page.getByLabel('종목명').fill('친구들과 함께 급식 먹고 집 가고 싶기'); await page.getByLabel('등급', { exact: true }).fill('우주최강 전설급 마스터'); await ready(page)
  expect(await pixels(page)).not.toBe(initial)
  for (const theme of ['버터', '멜론', '딸기', '소다', '우유']) {
    await page.getByRole('button', { name: `${theme} 테마` }).click(); await ready(page)
    await expect(page.getByRole('button', { name: `${theme} 테마` })).toHaveAttribute('aria-pressed', 'true')
  }
  await uploadTestPhoto(page)
  const photoBefore = await page.locator('.crop-canvas').evaluate((c: HTMLCanvasElement) => c.toDataURL())
  await page.getByLabel('사진 확대', { exact: true }).fill('1.8'); await ready(page)
  await page.getByText('슬라이더로 위치 조절하기', { exact: true }).click()
  await page.getByLabel('사진 좌우 위치').fill('0.6'); await page.getByLabel('사진 위아래 위치').fill('-0.5'); await ready(page)
  expect(await page.locator('.crop-canvas').evaluate((c: HTMLCanvasElement) => c.toDataURL())).not.toBe(photoBefore)
  const box = await page.locator('.crop-canvas').boundingBox()
  await page.mouse.move(box!.x + 40, box!.y + 40); await page.mouse.down(); await page.mouse.move(box!.x + 65, box!.y + 60, { steps: 6 }); await page.mouse.up(); await ready(page)
  const cropBeforeRandom = await page.locator('.crop-canvas').evaluate((c: HTMLCanvasElement) => c.toDataURL())
  await page.getByRole('button', { name: /랜덤 자격증 만들기/ }).click(); await ready(page)
  expect(await page.locator('.crop-canvas').evaluate((c: HTMLCanvasElement) => c.toDataURL())).toBe(cropBeforeRandom)
  await page.getByLabel('종목명').fill('급식 먹기'); await page.getByLabel('등급', { exact: true }).fill('특급'); await page.getByRole('button', { name: '버터 테마' }).click(); await ready(page)
  const expectedPng = Buffer.from((await pixels(page)).split(',')[1], 'base64')
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: '이미지 저장하기', exact: true }).click()
  const download = await downloadEvent
  expect(download.suggestedFilename()).toBe('말랑_급식 먹기_특급.png')
  const path = testInfo.outputPath('certificate.png'); await download.saveAs(path)
  const png = await readFile(path)
  expect(png.readUInt32BE(16)).toBe(2000); expect(png.readUInt32BE(20)).toBe(1240)
  // toBlob and toDataURL can use different PNG encodings; compare decoded RGBA pixels.
  const differingPixels = await page.evaluate(async ([expected, actual]) => {
    const decode = async (value: string) => {
      const image = new Image(); image.src = `data:image/png;base64,${value}`; await image.decode()
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
      const ctx = canvas.getContext('2d')!; ctx.drawImage(image, 0, 0)
      return ctx.getImageData(0, 0, canvas.width, canvas.height).data
    }
    const [a, b] = await Promise.all([decode(expected), decode(actual)])
    let different = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) different++
    return different
  }, [expectedPng.toString('base64'), png.toString('base64')])
  expect(differingPixels).toBe(0)
  await page.screenshot({ path: testInfo.outputPath('edited.png'), fullPage: true })
  await page.getByRole('button', { name: '초기화', exact: true }).click(); await ready(page)
  await expect(page.getByLabel('종목명')).toHaveValue('제초'); await expect(page.getByLabel('등급', { exact: true })).toHaveValue('3급')
  await expect(page.locator('.crop-canvas')).toHaveCount(0)
  // Confirm reset visually from decoded pixels rather than encoder-specific byte output.
  const resetDiff = await page.evaluate(async (initial) => {
    const image = new Image(); image.src = initial; await image.decode()
    const reference = document.createElement('canvas'); reference.width = 2000; reference.height = 1240
    const ctx = reference.getContext('2d')!; ctx.drawImage(image, 0, 0)
    const before = ctx.getImageData(0, 0, 2000, 1240).data
    const resetImage = new Image(); resetImage.src = document.querySelector<HTMLCanvasElement>('.certificate')!.toDataURL(); await resetImage.decode()
    ctx.clearRect(0, 0, 2000, 1240); ctx.drawImage(resetImage, 0, 0)
    const after = ctx.getImageData(0, 0, 2000, 1240).data
    let count = 0; for (let i = 0; i < before.length; i++) if (before[i] !== after[i]) count++
    return count
  }, initial)
  expect(resetDiff).toBe(0)
  expect(errors).toEqual([]); expect(externalRequests).toEqual([])
  if (testInfo.project.name === 'desktop') {
    await mkdir('.qa', { recursive: true }); await page.screenshot({ path: '.qa/desktop.png', fullPage: true })
  } else { await mkdir('.qa', { recursive: true }); await page.screenshot({ path: '.qa/mobile.png', fullPage: true }) }
})

for (const mode of ['supported', 'unsupported', 'failure', 'cancelled'] as const) {
  test(`file sharing: ${mode}`, async ({ page }) => {
    await page.addInitScript(mode => {
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => mode !== 'unsupported' })
      Object.defineProperty(navigator, 'share', { configurable: true, value: async (data: ShareData) => {
        if (mode === 'failure') throw new DOMException('Blocked', 'NotAllowedError')
        if (mode === 'cancelled') throw new DOMException('Cancelled', 'AbortError')
        const file = data.files![0]
        document.body.dataset.sharedFile = JSON.stringify({ type: file.type, name: file.name, size: file.size, count: data.files!.length, url: data.url ?? null })
      } })
    }, mode)
    await page.goto('/'); await ready(page)
    await page.getByRole('button', { name: '친구에게 공유하기' }).click()
    if (mode === 'supported') {
      const payload = JSON.parse((await page.locator('body').getAttribute('data-shared-file'))!)
      expect(payload.type).toBe('image/png'); expect(payload.size).toBeGreaterThan(10000); expect(payload.count).toBe(1); expect(payload.url).toBeNull()
    } else if (mode === 'cancelled') { await expect(page.getByRole('status')).toContainText('취소'); await expect(page.getByRole('dialog')).not.toBeVisible() }
    else {
      await expect(page.getByRole('dialog')).toBeVisible()
      const event = page.waitForEvent('download'); await page.getByRole('button', { name: 'PNG 이미지 저장하기' }).click(); expect((await event).suggestedFilename()).toMatch(/\.png$/)
      await page.getByRole('button', { name: '닫기', exact: true }).click(); await expect(page.getByRole('dialog')).not.toBeVisible()
    }
  })
}

test('invalid uploads preserve current photo and narrow keyboard layout stays usable', async ({ page }) => {
  await page.goto('/'); await ready(page); await uploadTestPhoto(page)
  const before = await pixels(page)
  await page.locator('#photo-upload').setInputFiles({ name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') })
  await expect(page.getByRole('alert')).toContainText('사진 파일'); expect(await pixels(page)).toBe(before)
  await page.locator('#photo-upload').setInputFiles({ name: 'broken.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('broken') })
  await expect(page.getByRole('alert')).toContainText('열 수 없어요'); expect(await pixels(page)).toBe(before)
  await page.setViewportSize({ width: 320, height: 460 }); await page.getByLabel('종목명').fill('가'.repeat(40)); await ready(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: '이미지 저장하기', exact: true }).scrollIntoViewIfNeeded()
  await expect(page.getByRole('button', { name: '이미지 저장하기', exact: true })).toBeInViewport()
})
