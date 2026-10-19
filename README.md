# 말랑 자격증 제작소 🌱

소소한 재능을 사진과 함께 한 장의 귀여운 자격증으로 만드는 모바일 우선 웹 앱입니다.

## 실행

Node.js 22.12 이상을 권장합니다.

```sh
npm ci
npm run dev
```

개발 주소: http://127.0.0.1:5173

```sh
npm run build
npm run preview
npm test
```

`build`는 TypeScript 검사 후 `dist/`를 생성합니다. 테스트는 로컬에 설치된 Chrome을 사용합니다. CI에서는 `npx playwright install --with-deps chromium` 후 `CI=true npm test`를 실행합니다. Windows 사용자 이름에 `^` 문자가 있어도 실행되도록 npm 스크립트에서 Node 진입점을 직접 호출합니다.

## 기능

- 실시간 종목명·등급 편집, 긴 텍스트 자동 크기 조절
- 다섯 가지 테마: 우유·버터·멜론·딸기·소다
- 사진 선택 및 드롭, 드래그 이동, 1–3배 확대, 좌우·상하 슬라이더
- 2000 × 1240 PNG 다운로드. 카드 외부는 투명하며 편집 UI는 포함하지 않습니다.
- Web Share API로 PNG 파일 공유. 미지원·실패 시 이미지 저장 안내, 취소 시 편집 유지
- 랜덤 종목·등급 생성 시 사진·위치 유지, 전체 초기화
- 직접 그린 새싹, 왕관, 비대칭 Canvas 경로. 기존 캐릭터/로고 파일은 포함하지 않습니다.

사진은 브라우저 메모리에서만 처리합니다. 서버 업로드, 계정, 데이터베이스, 분석 SDK, 쿠키, 영구 저장 기능이 없습니다. 새로고침하면 편집 내용이 사라집니다. 사용자가 공유를 누른 경우에만 선택한 앱으로 파일을 전달합니다.

## 구조

```text
src/
  App.tsx                    편집 상태, 사진 입력, 저장/공유, 접근성 안내
  components/PhotoEditor.tsx  드래그 및 슬라이더 사진 편집
  components/Doodles.tsx      독창적인 SVG 장식
  lib/certificate.ts         미리보기/PNG 공용 Canvas 렌더러와 크롭 좌표
  lib/photo.ts               이미지 검사, 방향 디코딩 및 최대 2400px 리사이즈
  styles.css                 Tailwind + 반응형 스타일 + 로컬 폰트
public/fonts/                Gaegu/Jua 원본 폰트 및 OFL 라이선스
tests/editor.spec.ts         모바일/PC 기능 및 PNG 픽셀 일치 검증
```

내보내기 준비 단계에서 로컬 Gaegu 글꼴 로딩을 기다린 후 동일한 Canvas로 미리보기와 PNG를 만듭니다. 공유할 File도 미리 생성하여 iOS의 사용자 클릭 활성 상태가 사라지는 문제를 피합니다. 폰트 로딩 실패 시 다른 글꼴로 조용히 저장하지 않고 오류를 표시합니다.

## GitHub Pages 배포

1. **새 공개 저장소**에 이 프로젝트만 올립니다. 기존 저장소와 합치지 않습니다.
2. 저장소 **Settings → Pages → Build and deployment → Source → GitHub Actions**를 선택합니다.
3. `main`에 푸시하면 포함된 `.github/workflows/pages.yml`이 빌드·배포합니다.
4. Actions의 `Deploy to GitHub Pages`가 성공한 후 실제 Pages 주소를 확인합니다.

Vite의 `base: './'` 설정으로 저장소 이름에 관계없이 하위 경로의 JS, CSS, 로컬 폰트를 읽습니다. Hash 라우터나 서버 리라이트가 필요 없는 단일 화면입니다. 워크플로는 [Vite의 공식 정적 배포 안내](https://vite.dev/guide/static-deploy.html#github-pages)를 따릅니다.

## 지원과 한계

- 현대적인 Chrome, Edge, Safari를 대상으로 합니다. 파일 공유 앱 목록은 OS·브라우저·설치 앱에 따라 달라집니다. 카카오톡/인스타그램 전용 SDK나 유료 API는 사용하지 않습니다.
- 아이폰에서 내려받은 PNG는 파일 앱에 저장될 수 있습니다. 파일의 공유 메뉴에서 ‘이미지 저장’을 선택하거나 사이트의 공유 버튼을 이용하세요.
- JPG, PNG, WebP 권장. 최대 20MB/60MP. HEIC은 브라우저가 디코딩할 수 있는 경우만 지원하며 실패 시 JPG/PNG 변환 안내가 나옵니다.
- 테스트의 공유 성공/실패/취소 분기는 Web Share API 모의 구현을 사용합니다. 실제 iOS/Android 공유창 및 카카오톡/Instagram 앱 수신은 실기기 확인이 필요합니다.
- 재미를 위한 비공식 자격증이며 실제 자격 증명의 효력이 없습니다.

폰트 출처: [Google Fonts Gaegu](https://github.com/google/fonts/tree/main/ofl/gaegu), [Jua](https://github.com/google/fonts/tree/main/ofl/jua). SIL Open Font License는 `public/fonts/*-OFL.txt`에 포함되어 있습니다.
