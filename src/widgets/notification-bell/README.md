# widgets/notification-bell

헤더의 종과, 열려 있는 동안 새 알림을 토스트로 알리는 부품. 둘이 알림 목록 캐시(`notification.list`)를 같이 쓴다(#395).

| 파일 | 설명 |
| --- | --- |
| `ui/notification-bell.tsx` | `/mypage/notifications`로 가는 종 링크. 읽지 않은 알림이 있으면 오른쪽 위에 6px 브랜드색 점과 `sr-only` 개수 |
| `ui/notification-bell.test.tsx` | 읽지 않은 것이 있을 때만 점이 붙는지, 링크 이름이 "알림"인지 |
| `ui/new-notification-toaster.tsx` | 30초마다 목록을 다시 받아 지난번보다 새 알림이 있으면 토스트. 처음 받은 목록은 알리지 않고, 설정의 알림 스위치가 꺼져 있으면 띄우지 않는다(#403) |
| `ui/new-notification-toaster.test.tsx` | 첫 목록은 조용한지, 새 id가 생기면 그것만 알리는지, 꺼 두면 조용하고 켜면 그 뒤 것부터 알리는지 |
| `index.ts` | 공개 API |

## 왜 폴링인가

팀 결정(2026-09-23)으로 열려 있을 때는 웹 안에서 알린다. 앱(RN 웹뷰)은 Push API·서비스 워커 푸시가 없어 웹 스스로는 FCM을 못 받고, 백엔드에 WebSocket·SSE도 없어 30초 폴링이 모든 환경에 공통인 바탕이다. iOS 앱은 APNs가 없어 이 폴링이 전부다. 백엔드는 `notification` 행만 넣으면 된다.

경로는 셋으로 나뉜다. **OS 알림**은 토큰을 등록한 기기(브라우저 서비스 워커, Android 앱)가 앱 밖에서 받는다. **캐시 무효화**는 브라우저 포그라운드 FCM이나 Android 앱의 수신 신호(`golaju:push-received`)를 `shared/providers/push-message-listener`가 받아 목록을 즉시 다시 받게 한다 — 신호 자체는 토스트를 띄우지 않는다. **토스트**는 여기 폴링 토스터만 띄운다. 폴링이든 신호든 새 목록이 오면 지난번보다 큰 id만 한 번 알린다.

폴링은 로그인돼 있고 문서가 보일 때만 돈다(`useHasSession`, TanStack의 `refetchIntervalInBackground: false`). 설정의 알림 스위치와는 무관하게 돌아 종의 점과 알림함은 늘 갱신되고, **토스트만 스위치가 켜져 있을 때 뜬다**(#403) — 꺼 둔 동안에도 기준 id는 옮겨 두어 켜는 순간 쌓인 것이 쏟아지지 않는다. 탭을 숨겼다 돌아오면 TanStack이 창 포커스에 다시 받아 그동안 온 알림을 그때 토스트로 알린다. 브라우저 FCM 웹 푸시나 앱의 수신 신호가 오면 `shared/providers/push-message-listener`가 캐시를 비워 30초를 기다리지 않고 뜬다 — 토스트는 여기 한 곳만 띄운다. 숨긴 동안 온 것은 OS 알림이 먼저 뜨고 돌아온 뒤 토스트가 한 번 더 뜬다.

## 어디에 있나

`NotificationBell`은 헤더 다섯 곳(홈·상품 상세·찜·비교·마이페이지)이 쓴다. `NewNotificationToaster`는 `app/layout.tsx`가 `AppProviders` 안에 한 번 둔다 — `shared/providers`는 `entities`를 import할 수 없어 거기 두지 못한다.
