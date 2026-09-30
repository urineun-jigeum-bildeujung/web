# toggle-theme

다크 모드를 켜고 끄는 기능이다. 선택은 `next-themes`가 기기(`localStorage`의 `theme`)에 남겨 새로고침해도 유지된다 (#565).

| 파일 | 설명 |
| --- | --- |
| `index.ts` | 공개 API — `ThemeSwitch`, `ThemeToggle` |
| `model/use-dark-mode.ts` | 다크 모드인지 읽고 바꾸는 훅. 하이드레이션이 끝나기 전에는 꺼짐으로 보이고 바꿀 수 없다 |
| `ui/theme-switch.tsx` | 설정 화면 테마설정 줄의 스위치. 켜면 다크 모드 |
| `ui/theme-toggle.tsx` | 해·달 아이콘 버튼. 개발용 화면 목록(`/dev/screens`)에서 쓴다 |

- **기본은 라이트이고 시스템 설정을 따르지 않는다.** `AppProviders`의 `ThemeProvider`가 `defaultTheme="light"`, `enableSystem={false}`다. 다크 토큰을 모든 화면에서 검수하지 않아, 시스템이 다크인 사람에게 저절로 켜지면 덜 된 화면이 드러난다. 켠 사람만 다크다.
- **서버는 저장된 선택을 모른다.** 그래서 하이드레이션 전에는 스위치를 꺼짐으로 그리고 잠근다. 저장값으로 먼저 그리면 서버가 그린 것과 어긋난다. `html`의 `dark` 클래스는 `next-themes`가 그리기 전에 붙여 화면이 번쩍이지 않는다.
- 켠 스위치 색은 공용 `Switch`의 브랜드 주황 그대로다. 설정 시안은 남색(`surface/primary`)이지만 공용 규칙을 따른다 (#565 결정).
