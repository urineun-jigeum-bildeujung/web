# entities/notification

알림. 지금은 이 기기의 푸시 토큰을 서버에 알리는 것만 있다. 알림함 목록·읽음 처리는 #352의 A로 붙인다.

| 파일 | 설명 |
| --- | --- |
| `api/fcm-tokens.ts` | FCM 등록 토큰을 `POST /notifications/fcm-tokens`로 알린다 |
| `api/fcm-tokens.test.ts` | 무엇을 어디로 보내는지 |
| `index.ts` | 공개 API |

## 토큰을 받는 곳은 여기가 아니다

브라우저에서 토큰을 받고 지우는 Firebase 접점은 `shared/lib/push/fcm.ts`다. 이 슬라이스는 받은 토큰을 서버에 전하는 것만 맡는다. 두 일을 묶어 스위치로 만든 것은 `views/settings/api/use-mutate-push-setting.ts`다(#354).

## 해제 API는 아직 없다

`DELETE /notifications/fcm-tokens`가 없어 스위치를 꺼도 서버는 그 토큰을 계속 들고 보낸다. 브라우저 쪽 토큰이 지워져 전송은 실패로 끝난다. 백엔드가 나중에 보태기로 했다(2026-09-22).
