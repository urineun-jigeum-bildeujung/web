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
| `alert-dialog.tsx` | shadcn AlertDialog. 되돌릴 수 없는 행동 확인 |
| `slider.tsx` | shadcn Slider |
| `select.tsx` | shadcn Select |
| `tabs.tsx` `accordion.tsx` `drawer.tsx` `tooltip.tsx` `switch.tsx` `sonner.tsx` `textarea.tsx` | shadcn. 탭·아코디언·바텀시트·툴팁·스위치·토스트·여러 줄 입력 |

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
| `list-row/` | 아이콘 + 제목 + 설명 + 화살표 한 줄. 이동용(Link)과 실행용(Button) |
| `setting-group/` | 목록 줄을 제목 아래 카드로 묶는다 |
| `definition-row/` | 항목 이름과 값을 한 줄에. 읽기 위주 화면용 |
| `countdown/` | 남은 시간을 시:분:초로 세어 내린다. 서버·클라이언트 시각 차를 피해 붙은 뒤부터 센다 |
| `filter-chips/` | 목록을 거르는 작은 칩 줄. 하나만 고를 수 있어 시맨틱은 라디오 |
| `scroll-row/` | 손으로 밀어 넘기는 가로 목록. 캐러셀이 아니라 저절로 넘어가지 않는다 |
| `detail-card/` | 제목 아래 항목-값 줄을 묶는 카드. 주문 상세·결제에서 쓴다 |
| `price/` | 정가·할인가·할인율·단가 표기 |
| `product-summary/` | 이미지와 상품명만 쓰는 짧은 표현 |
| `single-input-screen/` | 한 가지만 묻고 하단 완료로 끝내는 화면 골격 |
| `address-result-list/` | 주소 검색 결과. 우편번호·도로명·지번·건물명 |
| `info-notice/` | 정책·주의사항을 불릿으로 알리는 안내 블록 |
| `product-grid-card/` | 2열 격자용 상품 카드. 이미지 위·안·아래에 놓을 것을 자리로 받는다 |
| `rating/` | 별점 표시. 값은 스크린 리더용 문장으로 함께 읽힌다 |
| `quantity-stepper/` | 수량 빼기·값·더하기. 값이 바뀌면 스크린 리더가 알린다 |

만드는 규칙은 [component-convention](../../../docs/conventions/component-convention.md)을 따른다. 컴포넌트마다 폴더를 만들고 안에 구현과 테스트를 함께 둔다.

**현재 PD팀 Figma는 와이어프레임 단계다.** 시안을 근거로 만든 컴포넌트는 파일 헤더 주석에 그 사실과 근거 화면 ID를 남긴다.
