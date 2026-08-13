# toggle-theme

다크 모드를 켜고 끄는 기능이다. 디자인 확정 전까지 쓰는 데모 수준이다.

| 파일 | 설명 |
| --- | --- |
| `index.ts` | 공개 API — `ThemeToggle` |
| `ui/theme-toggle.tsx` | `html`의 `.dark` 클래스를 토글하는 아이콘 버튼 |

- **참고**: 선택이 저장되지 않아 새로고침하면 라이트 모드로 돌아간다. 시스템 테마 연동과 저장은 정식 테마 도구(next-themes 등) 도입 시점에 결정한다.
