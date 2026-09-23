# widgets/notification-bell

헤더의 종과, 열려 있는 동안 새 알림을 토스트로 알리는 부품. 둘이 알림 목록 캐시(`notification.list`)를 같이 쓴다(#395).

| 파일 | 설명 |
| --- | --- |
| `ui/notification-bell.tsx` | `/mypage/notifications`로 가는 종 링크. 읽지 않은 알림이 있으면 오른쪽 위에 6px 브랜드색 점과 `sr-only` 개수 |
| `ui/notification-bell.test.tsx` | 읽지 않은 것이 있을 때만 점이 붙는지, 링크 이름이 "알림"인지 |
| `ui/new-notification-toaster.tsx` | 30초마다 목록을 다시 받아 지난번보다 새 알림이 있으면 토스트. 처음 받은 목록은 알리지 않는다 |
| `ui/new-notification-toaster.test.tsx` | 첫 목록은 조용한지, 새 id가 생기면 그것만 알리는지 |
| `index.ts` | 공개 API |

## 왜 폴링인가

팀 결정(2026-09-23)으로 OS 알림 대신 웹 안에서 알린다. 앱(RN 웹뷰)은 Push API·서비스 워커 푸시가 없어 FCM 토큰을 못 만들고 포그라운드 메시지도 못 받는다. 백엔드에 WebSocket·SSE가 없으니 30초 폴링이 유일한 길이고, 앱 변경도 Apple 개발자 계정도 필요 없다. 백엔드는 `notification` 행만 넣으면 된다.

폴링은 로그인돼 있고 문서가 보일 때만 돈다(`useHasSession`, TanStack의 `refetchIntervalInBackground: false`). 탭을 숨겼다 돌아오면 TanStack이 창 포커스에 다시 받아 그동안 온 알림을 그때 토스트로 알린다. 브라우저에서 FCM 웹 푸시를 켠 사용자는 `shared/providers/push-message-listener`가 메시지를 받는 즉시 캐시를 비워 더 빨리 뜬다 — 토스트는 여기 한 곳만 띄운다. 숨긴 동안 온 것은 OS 알림이 먼저 뜨고 돌아온 뒤 토스트가 한 번 더 뜬다.

## 어디에 있나

`NotificationBell`은 헤더 다섯 곳(홈·상품 상세·찜·비교·마이페이지)이 쓴다. `NewNotificationToaster`는 `app/layout.tsx`가 `AppProviders` 안에 한 번 둔다 — `shared/providers`는 `entities`를 import할 수 없어 거기 두지 못한다.
