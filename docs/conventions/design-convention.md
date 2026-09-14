# 디자인 컨벤션

## 토큰

- **HEX·rgb를 하드코딩하지 않는다.** 시맨틱 토큰을 쓴다 (`bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border-border` 등).
- 토큰은 `src/app/globals.css`의 `@theme inline` 블록과 `:root` / `.dark`에서 관리한다.
- **Tailwind v4에는 설정 파일이 없다.** `tailwind.config.js`를 만들지 않는다. v3 예제를 그대로 옮기면 동작하지 않는다.
- 새 토큰이 필요하면 임의로 클래스를 만들지 말고 `@theme`에 먼저 추가한다.
- **공용 시맨틱 색상 토큰은 Figma `골라주개냥 Design System`의 `03. semantic` 컬렉션이 원본이다.**
  `--bg-*`·`--surface-*`·`--text-*`·`--border-*`·`--icon-*`는 Figma 토큰 경로의 `/`와 `_`를
  CSS 변수 형식인 `-`로 바꾼 이름이다
  (예: `surface/primary_strong` → `--surface-primary-strong`). 기존의 `bg/*`를
  `surface/*`(컴포넌트 표면)로 옮기고, `bg/*`는 화면 프레임 배경 전용으로 새로
  분리했다.
- shadcn이 내부적으로 쓰는 고정 슬롯(`--primary`, `--secondary`, `--destructive`,
  `--background`, `--card`, `--popover` 등)은 값을 중복해서 넣지 않고, 개념이
  대응되는 시맨틱 변수를 `var()`로 참조한다.
- shadcn의 `--accent`처럼 Figma 토큰과 이름만 같고 의미가 다른 슬롯은 기존 용도를
  유지한다. `--muted`·`--muted-foreground`도 마찬가지다 — `surface/tertiary`와
  겉보기 역할이 비슷해 보이지만 Figma나 PD팀이 실제로 지정한 대응은 아니라서,
  전역으로 연결하지 않고 shadcn 기본값을 유지한다.
- Figma에서 `surface/tertiary`를 직접 지정한 화면은 그 컴포넌트에 토큰을 바로 쓴다.
  그 위 글자는 Figma 컴포넌트에 지정된 값을 우선하고, 없으면 `text/body/default`·
  `text/body/secondary`·`text/body/static_black` 중 라이트·다크 대비를 확인해
  고른다. 기존 `bg-muted`·`text-muted-foreground` 사용처는 이 결정과 무관하므로
  건드리지 않는다.
- `--brand-foreground`·`--success-foreground`·`--destructive-foreground`의 흰
  글자는 WCAG 비율 공식(4.5:1)으로는 미달이지만, PD팀이 APCA 기준으로 재평가해
  유지하기로 했다. Lighthouse는 APCA가 아닌 WCAG 비율로 대비를 검사하므로,
  접근성 감사에서 이 조합이 미달로 잡힐 수 있다는 점을 알고 있어야 한다.
- **모서리와 그림자도 Figma 값이다.** `rounded-sm·md·lg·xl·2xl`은 `radius/4·6·8·12·16`(px)에
  명시값으로 고정돼 있고, `rounded-full`이 `radius/full`이다. `shadow-xs·sm·md·lg·xl`은
  foundation의 `shadow_xs·s·m·l·xl` 다섯 단계(각 두 겹)다. 시안의 `radius/8`은 `rounded-lg`,
  `shadow_s`는 `shadow-sm`으로 옮긴다. 임의 값 `rounded-[8px]`·`shadow-[...]`를 쓰지 않는다 (#169).
- 전체 토큰 목록은 이 문서에 나열하지 않는다. 코드에 반영된 목록과 값은
  `globals.css`에서, 디자인 원본은 Figma에서 확인한다. 토큰이 추가·변경될 때마다
  목록을 중복 관리하면 문서와 구현이 어긋날 수 있다.

## 폰트

- **본문 폰트는 Pretendard다.** Figma 타이포 토큰이 모두 `typo/pretendard`를 참조한다.
- Google Fonts에 없어 `next/font/local`로 self-host한다. 파일은
  `src/app/fonts/`에 있고 weight는 **400·500·700 세 벌뿐**이다. Figma 타이포 토큰이
  쓰는 값이 그 셋이라서다. 다른 두께가 필요하면 토큰부터 확인한다.
- 통짜가 아니라 **subset(한글 상용 2350자)** 이다. 세 벌을 합쳐 787KB이고, 통짜
  variable 한 장은 2MB다. **CDN에서 불러오지 않는다** — `next/font`가 만들어 주는
  `size-adjust` fallback을 못 써 폰트가 바뀌는 순간 레이아웃이 밀린다.
- `--font-sans` 변수 이름은 유지한다. `@theme inline` 매핑과 `font-sans`
  유틸리티가 그 이름에 걸려 있다 (#162).

## 타이포

- **글자 크기·행간·굵기를 따로 적지 않는다.** Figma Text Style을 옮긴 토큰 한 벌이
  셋을 함께 건다 — `text-label-bold-14` 하나면 14px · 행간 22 · weight 700이다.
  `text-sm font-bold leading-[22px]`처럼 쪼개 쓰지 않는다 (#167).
- 계열은 넷이다. **`title`**(제목, bold만) · **`body`**(본문) · **`caption`**(부가 설명) ·
  **`label`**(버튼·배지·항목 이름). 시안이 지정한 계열을 그대로 쓴다. 크기가 같아도
  계열이 다르면 다른 토큰이다.
- **굵기는 400·500·700 셋뿐이다.** 디자인 시스템에 semibold(600)가 없고 Pretendard도
  그 셋만 싣고 있다. `font-semibold`를 쓰면 브라우저가 700으로 올려 그리므로
  의도한 굵기가 나오지 않는다.
- Figma는 px로 주지만 코드에는 **rem으로 환산**해 넣는다. px로 고정하면 사용자가
  브라우저 기본 글자 크기를 키워도 화면이 따라 커지지 않는다.
- `body/*`는 Figma 쪽 이름이 `refular`지만 **코드에는 `regular`로 넣는다.** 정의표의
  샘플 글자가 `body/regular_18`로 적혀 있어 스타일 이름만 오타로 보고 맞춘 것이다.
- 전체 목록은 `/dev` 갤러리의 Typography 절에서 실제 렌더로 비교한다. 값의 원본은
  Figma `골라주개냥 Design System`의 `foundation > typography`다.

## 다크 모드

- `.dark` 클래스 기반이다(`@custom-variant dark`). 라이트에서만 확인하고 끝내지 않는다.
- 색을 넣을 때 라이트·다크 양쪽 값을 함께 정의한다. 한쪽에만 정의된 색은 반대 테마에서 깨진다.

## cn

- 조건부 className은 문자열 결합 대신 `cn()`을 쓴다 (`@/shared/lib/utils`).
- `cn`은 `clsx` + `tailwind-merge`다. 나중에 오는 클래스가 앞 클래스를 덮으므로, 기본 스타일을 먼저 두고 오버라이드를 뒤에 둔다.
- 컴포넌트는 `className` prop을 받아 `cn(base, className)` 형태로 합쳐 호출부가 덮어쓸 수 있게 한다.

```tsx
<div className={cn("rounded-lg border p-4", isActive && "border-primary", className)} />
```

## 모바일 우선

- **모든 스타일은 모바일 뷰를 기본으로 작성한다.** `sm:` 이상은 확장으로 붙인다. 데스크톱을 먼저 짜고 모바일을 덮지 않는다.
- 반응형 브레이크포인트는 3개를 쓴다(모바일 기본 / `md` / `lg`).
- **WebView 앱 확장 가능성을 고려한다.** 브라우저 UI(주소창·뒤로가기)에 의존하는 내비게이션을 만들지 않는다. 화면 안에 이동 수단을 둔다.

### 시안 기준 크기

디자인 시안은 아래 세 크기로 온다. 회의에서 확정했다.

| 구간 | 시안 크기 | 적용 범위 | 접두사 |
|---|---|---|---|
| 모바일 | 393 × 852 | 0 ~ 767px | 없음 (기본) |
| 태블릿 | 768 × 1024 | 768 ~ 1023px | `md:` |
| 웹 | 1920 × 1080 | 1024px 이상 | `lg:` |

**시안 폭과 전환점은 다르다.** Tailwind는 min-width 기반이라 `md:`는 768px에서, `lg:`는 1024px에서 진입한다. 웹 시안이 1920이라고 해서 1920px에서 레이아웃이 바뀌지 않는다. 태블릿 시안 폭(768)만 전환점과 일치한다.

**그래서 1024~1919px에는 대응하는 시안이 없다.** 이 구간은 웹 시안의 레이아웃을 그대로 쓰되, 콘텐츠가 화면 폭을 따라 무한정 늘어나지 않도록 컨테이너에 `max-w-*`를 건다. 시안 폭에 맞춰 요소를 고정 픽셀로 박지 않는다.

시안의 **높이**는 스크롤 없이 처음 보이는 범위를 가늠하는 값이다. 화면 전체 높이가 그 값이라는 뜻이 아니므로 `h-[852px]` 같은 고정 높이로 옮기지 않는다.

구현 후에는 **전환점 앞뒤**를 본다. 깨진다면 대개 여기서 깨진다.

```
767px / 768px    모바일 ↔ 태블릿
1023px / 1024px  태블릿 ↔ 웹
```

### 디자인 값은 디자인팀이 정한다

**폰트·패딩·마진 값은 프레임에 명시되어 온다.** 글꼴 크기·자간·행간, 여백을 프론트가 임의로 정하지 않는다. 시안에 값이 없으면 추측해서 채우지 말고 물어본다.

프론트가 판단하는 것은 **받은 값을 코드로 옮기는 방식**이다.

- 색은 시맨틱 토큰에 매핑한다 ("토큰" 절)
- 길이는 4px 스케일 표준 단위로 옮긴다 ("간격과 크기" 절)
- 토큰에 없는 값이 반복되면 그건 토큰이 되어야 한다는 신호다. 임의로 늘리지 말고 디자인팀에 확인한다

## 터치 UX

- 탭 대상은 최소 44×44px를 확보한다.
- **hover에만 의존하는 정보·기능을 만들지 않는다.** 터치 기기에는 hover가 없다.
- **색만으로 정보를 전달하지 않는다.** 아이콘·텍스트·패턴을 함께 쓴다.
- 포커스 링을 지우지 않는다. 키보드 사용자가 위치를 잃는다.

## 간격과 크기

**4px 스케일로 표현되는 길이에 임의 값을 쓰지 않는다.** px를 4로 나눈 값이 유틸리티 숫자다. Tailwind v4는 스케일이 동적이라(`--spacing: 0.25rem`의 배수) `w-25`처럼 프리셋에 없던 숫자도 그대로 동작한다.

| 임의 값 (금지) | 표준 단위 (사용) | 환산 |
|---|---|---|
| `w-[100px]` | `w-25` | 100 ÷ 4 = 25 |
| `h-[14px]` | `h-3.5` | 14 ÷ 4 = 3.5 |
| `p-[8px]` | `p-2` | 8 ÷ 4 = 2 |
| `gap-[6px]` | `gap-1.5` | 6 ÷ 4 = 1.5 |

- 4의 배수가 아닌 px(예: `158px`)는 먼저 디자인 의도를 의심한다. 가까운 스케일 값으로 맞출 수 있으면 맞춘다.
- 스케일로 표현할 수 없는 값이 정말 필요하면 임의 값을 쓰되, 같은 값이 반복되면 그건 토큰이 되어야 한다는 신호다. `@theme`에 올린다.
- 이 규칙은 길이(width·height·padding·margin·gap 등)에 적용된다. `text-[0.9em]` 같은 비율 값은 대상이 아니다.
- ESLint의 `tailwindcss/no-unnecessary-arbitrary-value`가 **정수 스케일 환산만** 잡고 `--fix`로 교정한다(`w-[100px]`→`w-25`, `p-[8px]`→`p-2`).
- **소수 환산은 검출되지 않는다.** 위 표의 `h-[14px]`→`h-3.5`, `gap-[6px]`→`gap-1.5`가 그렇다. 플러그인 4.2.0의 한계이고 규칙에 설정 옵션이 없어 조정할 수 없으므로, 이 자리는 리뷰(CodeRabbit·`code-reviewer`)가 본다. **lint 통과를 근거로 이 규칙을 지켰다고 판단하지 않는다.**
- 클래스 오타(`no-custom-classname`)와 상충 클래스(`no-contradicting-classname`)는 함께 검사된다.

## shadcn 컴포넌트

- shadcn은 라이브러리가 아니라 **코드가 저장소에 복사되는 방식**이다. `src/shared/ui/` 하위 파일은 CLI가 덮어쓴다.
- 이 파일들을 임의로 수정하면 내장된 접근성(ARIA·포커스 관리·키보드 인터랙션)이 조용히 깨질 수 있다. 수정이 필요하면 리뷰를 거친다.
- 스타일 변경은 파일을 고치는 대신 호출부에서 `className`으로 덮는 것을 먼저 검토한다.
- `.prettierignore` 대상이므로 포맷을 손으로 맞추지 않는다.

## 아이콘

- 화면에 직접 배치하는 아이콘은 **`shared/ui/icon`의 `Icon`**을 쓴다. Figma `골라주개냥 Design System` > `icon` 페이지의 43종을 스크립트로 옮긴 것이라 시안과 글리프가 같다. 색은 글자색(`text-icon-fill-*`), 크기는 `size-*`로 정한다.
- 세트에 없는 글리프만 react-icons로 보충한다. 그 파일 헤더에 어떤 아이콘이 왜 세트 밖인지 남기고, 반복되면 PD팀에 추가를 요청한다.
- `icon-shapes.ts`는 생성 파일이다. 시안이 바뀌면 Figma MCP로 다시 내려받아 만들지, 손으로 고치지 않는다.
- `components.json`의 `iconLibrary`는 **`lucide`로 유지한다.** shadcn CLI가 지원하는 값은 lucide·phosphor·hugeicons·radix뿐이라 `react-icons`로 바꾸면 CLI가 인식하지 못한다.
- `src/shared/ui/` 안의 lucide import는 그대로 둔다. 손으로 바꾸면 위의 소유권 규칙에 걸린다. ESLint가 `shared/ui` 밖의 `lucide-react` import를 막는다.
- 의미를 전달하는 아이콘에는 접근성 이름을 준다. 장식용이면 `aria-hidden`을 준다.

## 이미지

| 규칙 | 근거 |
|---|---|
| `next/image` 사용, 원시 `img` 태그 금지 | WebP·AVIF 자동 변환. 국내 3사 모두 미사용 |
| 모든 이미지에 width·height 또는 fill 지정 | 컬리 CLS 0.77 사례 |
| 첫 화면 핵심 이미지에 priority 적용 | 펫프렌즈·컬리 LCP Load delay 75~80% |
| 목록 이미지는 lazy 유지 | 어바웃펫 이미지 464개 즉시 로드 사례 |
| 모든 이미지에 의미 있는 alt | 경쟁사 image-alt 검사 실패 |

## 차트

| 규칙 | 내용 |
|---|---|
| `accessibilityLayer` 기본 적용 | 차트는 SVG라 그냥 두면 스크린리더에서 비어 보인다 |
| 첫 화면 사용 금지 | Recharts는 번들이 크다. 대시보드 초기 로드에 넣지 않는다 |
| 지연 로드 | 차트가 필요한 화면은 `next/dynamic`으로 불러온다 |
| 단순 게이지는 CSS | 잔량 표시에 차트 라이브러리를 쓰지 않는다 |

```tsx
<div className="bg-muted h-2 w-full rounded-full">
  <div className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }} />
</div>
```

## 접근성 목표

Lighthouse 접근성 **95점 이상**이 목표다. 국내 경쟁 3사가 75~89점에 머무는 지점이라 이 프로젝트의 차별화 축이다. 구현 중에는 아래를 기본으로 지킨다.

- 버튼·링크에 접근 가능한 이름이 있다 (아이콘만 있는 버튼 주의).
- 시맨틱 태그를 쓴다. 클릭 가능한 `div` 대신 `button`을 쓴다.
- 폼 입력에 label이 연결되어 있다.
- 텍스트 대비가 충분하다. 예외: `--brand-foreground`·`--success-foreground`·
  `--destructive-foreground`는 WCAG 비율로는 미달이지만 PD팀이 APCA 기준으로
  재평가해 유지하기로 했다 ("토큰" 절 참고). Lighthouse 감사에서는 이 세 조합이
  미달로 잡힐 수 있다.
