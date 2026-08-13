# shared/providers

앱 전역 Provider를 한곳에서 조립한다. `layout`은 `AppProviders` 하나만 감싼다.

| 파일 | 설명 |
| --- | --- |
| `app-providers.tsx` | `QueryClientProvider` 조립. Provider가 늘어나면 이 파일 안에서 중첩한다 |

- **참고**: `QueryClient`를 `useState(() => new QueryClient())`로 고정하는 이유는 요청마다 새 인스턴스를 만들되 리렌더 시 재생성되지 않게 하기 위함이다. React Compiler가 켜져 있어도 이건 메모이제이션이 아니라 인스턴스 고정이므로 유지한다.
- Provider는 `<html>` 전체가 아니라 `{children}`만 감싼다. 서버 컴포넌트의 정적 영역을 최대한 남기기 위해서다.
