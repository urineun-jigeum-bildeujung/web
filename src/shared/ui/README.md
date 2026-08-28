# shared/ui

shadcn 컴포넌트와 공용 프리미티브. 비즈니스 의미가 없는 UI만 둔다. 도메인을 아는 컴포넌트는 `entities/<도메인>/ui`로 간다.

## 두 종류가 섞여 있다

**폴더 바로 아래 `.tsx` 파일은 shadcn CLI가 생성하고 소유한다.** 하위 폴더는 우리가 만든 것이다. 도구 설정이 이 경계로 갈린다.

| | 위치 | prettier | ESLint (tailwind·a11y) | lucide import |
| --- | --- | --- | --- | --- |
| shadcn 생성물 | `shared/ui/*.tsx` | 제외 | 제외 | 허용 |
| 우리 컴포넌트 | `shared/ui/<name>/` | 적용 | 적용 | 금지 (react-icons를 쓴다) |

shadcn 파일을 검사에서 빼는 이유는 세미콜론 없는 자체 스타일이라 포맷하면 `add` 할 때마다 diff가 되살아나고, 내장된 접근성 처리를 우리가 판단할 수 없기 때문이다.

## shadcn 생성물

| 파일 | 설명 |
| --- | --- |
| `button.tsx` | shadcn Button. variant·size 조합을 cva로 정의한다 |
| `skeleton.tsx` | shadcn Skeleton. 로딩 중 자리를 잡아 레이아웃이 밀리지 않게 한다 |
| `input.tsx` | shadcn Input |
| `label.tsx` | shadcn Label. `htmlFor`로 입력과 묶인다 |
| `checkbox.tsx` | shadcn Checkbox |
| `radio-group.tsx` | shadcn RadioGroup. 배타적 선택의 키보드 이동을 처리한다 |

- `npx shadcn add <컴포넌트>`가 `components.json`의 alias에 따라 여기에 추가한다.
- **임의로 수정하지 않는다.** 내장된 접근성(ARIA·포커스 관리·키보드 인터랙션)이 조용히 깨질 수 있다. 수정이 필요하면 리뷰를 거친다.
- 스타일 변경은 파일을 고치는 대신 호출부에서 `className`으로 덮는 것을 먼저 검토한다.
- 이 파일들 안의 `lucide-react` import는 그대로 둔다.

## 우리가 만든 공용 컴포넌트

| 폴더 | 설명 |
| --- | --- |
| `page-header/` | 화면 상단 머리말. left·title·right 슬롯과 뒤로가기·닫기 기본 버튼 |
| `bottom-action-bar/` | 화면 하단 고정 버튼 줄. safe-area 여백을 여기서 처리한다 |
| `empty-state/` | 목록이 비었을 때 안내와 다음 행동 |
| `error-boundary/` | 섹션 단위 오류 격리와 재시도. TanStack Query 리셋과 연결 |
| `form-field/` | 레이블 + 입력 + 예시 문구. 접근성 연결과 클리어 버튼 |
| `chip-select/` | 보기 중 하나만 고르는 칩. 겉모습은 버튼이고 시맨틱은 라디오 |
| `avatar-uploader/` | 사진 한 장 선택과 원형 미리보기 |
| `checkbox-row/` | 체크박스 + 레이블 한 줄 |
| `step-progress/` | 여러 단계 입력의 진행 표시 |

만드는 규칙은 [component-convention](../../../docs/conventions/component-convention.md)을 따른다. 컴포넌트마다 폴더를 만들고 안에 구현과 테스트를 함께 둔다.

**현재 PD팀 Figma는 와이어프레임 단계다.** 시안을 근거로 만든 컴포넌트는 파일 헤더 주석에 그 사실과 근거 화면 ID를 남긴다.
