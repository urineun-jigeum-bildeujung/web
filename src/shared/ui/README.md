# shared/ui

shadcn 컴포넌트와 공용 프리미티브. **shadcn CLI가 생성하고 소유하는 폴더다.**

| 파일 | 설명 |
| --- | --- |
| `button.tsx` | shadcn Button. variant·size 조합을 cva로 정의한다 |

- `npx shadcn add <컴포넌트>`가 `components.json`의 alias에 따라 여기에 추가한다.
- **임의로 수정하지 않는다.** 내장된 접근성(ARIA·포커스 관리·키보드 인터랙션)이 조용히 깨질 수 있다. 수정이 필요하면 리뷰를 거친다.
- 스타일 변경은 파일을 고치는 대신 호출부에서 `className`으로 덮는 것을 먼저 검토한다.
- `.prettierignore`와 ESLint 검사에서 제외되어 있다. 포맷을 손으로 맞추지 않는다.
- 이 폴더 안의 `lucide-react` import는 그대로 둔다. 화면에 직접 배치하는 아이콘만 react-icons를 쓴다.
