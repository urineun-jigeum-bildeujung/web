# shared/providers

앱 전역 Provider를 한곳에서 조립한다. `layout`은 `AppProviders` 하나만 감싼다.

| 파일 | 설명 |
| --- | --- |
| `session-expiry-redirect.tsx` | 재발급까지 실패해 세션이 끝나면 로그인으로 보낸다 |
| `session-expiry-redirect.test.tsx` | 만료·로그인 화면·세션 없던 경우 |
| `push-message-listener.tsx` | 푸시를 켠 기기에서 탭이 보이는 동안 온 푸시로 알림 캐시를 비운다. 토스트는 `widgets/notification-bell`의 폴링 토스터가 한 번만 띄운다 (#354, #395) |
| `push-message-listener.test.tsx` | 켜 두지 않으면 구독하지 않는 것, 캐시 무효화, 내려갈 때 끊는 것 |
| `app-providers.tsx` | `QueryClientProvider` 조립. Provider가 늘어나면 이 파일 안에서 중첩한다 |

- **참고**: `QueryClient`를 `useState(() => new QueryClient())`로 고정하는 이유는 요청마다 새 인스턴스를 만들되 리렌더 시 재생성되지 않게 하기 위함이다. React Compiler가 켜져 있어도 이건 메모이제이션이 아니라 인스턴스 고정이므로 유지한다.
- Provider는 `<html>` 전체가 아니라 `{children}`만 감싼다. 서버 컴포넌트의 정적 영역을 최대한 남기기 위해서다.
- **세션이 끝나면 로그인으로 보내는 자리는 여기 하나다.** `apiRequest`가 재발급까지 실패하면 토큰을 지우고 401을 그대로 던진다. 그 뒤를 화면마다 처리하면 빠뜨린 곳에서 목록이 조용히 비어 보이고 보호자는 왜 안 되는지 알지 못한다. `shared/api/README.md`가 정해 둔 `subscribeTokensCleared` 계약을 `SessionExpiryRedirect`가 구독한다.
- **토큰이 처음부터 없던 경우는 이 구독이 잡지 못한다.** `clearTokens`가 지울 것이 있었을 때만 알리기 때문이다(그러지 않으면 로그아웃 뒤 요청마다 울린다). 세션 없이 열면 안 되는 화면은 401을 스스로 보고 돌려보낸다 — `views/pet-profile`이 그렇게 한다.
