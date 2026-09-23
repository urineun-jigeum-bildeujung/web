# entities/notification

알림. 알림함 목록·읽음 처리와 이 기기의 푸시 토큰 등록.

| 파일 | 설명 |
| --- | --- |
| `api/fcm-tokens.ts` | FCM 등록 토큰을 `POST /notifications/fcm-tokens`로 알린다 |
| `api/fcm-tokens.test.ts` | 무엇을 어디로 보내는지 |
| `api/notifications.ts` | 내 알림 목록 조회·읽음 처리와 `AppNotification`·`NotificationTarget` 타입 |
| `api/notifications.test.ts` | 응답을 화면 모양으로 옮기는 것, 읽음이 어디로 가는지 |
| `api/use-query-notifications.ts` | 내 알림 첫 쪽(50건)을 받는 훅. 로그인 전에는 부르지 않고, `pollingInterval`을 주면 문서가 보이는 동안 그 간격으로 다시 받는다(#395) |
| `api/use-query-unread-notification-count.ts` | 읽지 않은 알림 수. 목록과 같은 캐시라 읽으면 바로 줄어든다 |
| `api/use-mutate-read-notification.ts` | 읽음으로 바꾸는 훅. 목록 캐시를 먼저 바꾸고(낙관적) 실패하면 되돌린다 |
| `index.ts` | 공개 API |

## 알림 한 건의 모양

백엔드 `type`(`NOTICE`·`DELIVERY`·`TIMEDEAL`·`STATUS_CHECK`·`RECOMMENDATION`·`RESTOCK`)은 그대로 두고, 공지인지 알림인지는 화면이 정한다. `targetType`·`targetId`는 `target` 하나로 묶고 둘 중 하나라도 없으면 `null`이다 — 공지처럼 이어질 곳이 없는 알림이다. 어느 화면으로 가는지는 라우트를 아는 `views` 쪽이 정한다.

응답에 `hasNext`가 없어 첫 쪽 50건만 받는다. 더보기를 붙일 때 다시 본다.

## 토큰을 받는 곳은 여기가 아니다

브라우저에서 토큰을 받고 지우는 Firebase 접점은 `shared/lib/push/fcm.ts`다. 이 슬라이스는 받은 토큰을 서버에 전하는 것만 맡는다. 두 일을 묶어 스위치로 만든 것은 `views/settings/api/use-mutate-push-setting.ts`다(#354).

## 해제 API는 아직 없다

`DELETE /notifications/fcm-tokens`가 없어 스위치를 꺼도 서버는 그 토큰을 계속 들고 보낸다. 브라우저 쪽 토큰이 지워져 전송은 실패로 끝난다. 백엔드가 나중에 보태기로 했다(2026-09-22).
