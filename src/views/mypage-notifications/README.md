# mypage-notifications

공지와 배송 알림을 한 자리에서 보는 화면. UI 시안 `noti_011`(목록·공지 모달·알림 모달)에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/mypage-notifications-view.tsx` | 알림 목록. `useQueryNotifications`로 받고 거르기 칩과 `?filter` 쿼리로 가른다. 열면 읽음으로 알린다 |
| `ui/mypage-notifications-view.test.tsx` | 받는 중·실패·빔·목록, 거르기가 URL을 따르는지, 읽음 알림, 이어 가기 버튼 |
| `model/to-notification-item.ts` | 서버 알림을 줄·모달 모양으로 옮기고(공지 배지는 `NOTICE`만) 눌렀을 때 갈 곳과 버튼 문구를 정한다 |
| `model/to-notification-item.test.ts` | 배지 구분, 날짜 꼴, 대상 유형별 경로와 문구 |
| `ui/notification-row.tsx` | 목록 한 줄. 유형 배지·제목·날짜·읽지 않음 점·본문 미리보기 |
| `ui/notification-dialog.tsx` | 상세 모달. 갈 곳이 있는 알림만 이어 가기 버튼(배송 확인·주문 확인·상품 보기·타임딜 보기)이 붙는다 |
| `index.ts` | 공개 API |

## 라우트

```text
/mypage/notifications           알림 목록
/mypage/notifications?filter=…  all · unread · read
```

**상세는 모달이라 라우트를 나누지 않았다.** 화면 이동이 아니라 같은 화면의 상태다.

## 거르기가 돌아왔다

전체·새 알림·확인한 알림 칩은 2026-09-09 와이어프레임 수정에서 빠졌다가(#137) UI 시안(#196)에 다시 있어 되살렸다. 값은 `nuqs`로 URL에 두어 상세를 열었다 돌아와도 남고, 그래서 라우트를 `Suspense`로 감싼다. 화면 구성이 바뀌는 게 아니라 목록만 걸러지므로 `history`는 기본(replace)이다.

## 서버에서 받는다 (#354)

`GET /notifications`(최신순, 첫 쪽 50건)를 `entities/notification`으로 받는다. 서버에 읽음 필터가 없어 전체·새 알림·확인한 알림은 받은 목록을 화면에서 `isRead`로 가른다 — 한 화면 분량이라 다시 받는 것보다 낫고, AGENTS.md 2.5의 "서버가 거를 수 있는 조건"이 아니다.

열어 보면 `PATCH /notifications/{id}/read`로 알린다. 캐시를 먼저 바꿔 점이 바로 사라지고 실패하면 되돌린다(낙관적 갱신, 대기 표시 없음). 이미 읽은 것은 다시 알리지 않는다.

**배지는 둘뿐이다.** 서버 `type`은 여섯(`NOTICE`·`DELIVERY`·`TIMEDEAL`·`STATUS_CHECK`·`RECOMMENDATION`·`RESTOCK`)인데 시안의 배지는 공지·알림 둘이라 `NOTICE`만 공지다. 이어 가기는 `targetType`이 정한다 — `ORDER`는 주문 상세(배송 알림이면 "배송 확인"), `PRODUCT`는 상품 상세, `TIMEDEAL`은 단건 화면이 없어 타임딜 목록이다.

탭이 보이는 동안 도착한 푸시는 `shared/providers/push-message-listener`가 토스트로 알리고 이 목록의 캐시를 비운다.

## 모달에 Dialog를 쓴 이유

`AlertDialog`는 사용자의 응답을 요구하는 경고용이라 스크린 리더가 즉시 알린다. 여기 모달은 사용자가 항목을 눌러 여는 정보 전달이므로 `Dialog`가 맞다.

shadcn `DialogFooter`는 아래에 회색 띠를 두르는데 시안에는 없어 버튼 줄을 맨 `div`로 둔다. 오버레이는 받은 파일의 `bg-black/10`을 `bg-black/50`으로 고쳐 두었다(`drawer`·`alert-dialog`와 같다).

## 아직 없는 것

- 목록이 목업이다. 읽음 표시가 서버에 남지 않아 새로고침하면 되돌아간다
- 배송 알림의 "배송 확인"이 주문 목록으로만 간다. 어느 주문인지는 알림에 주문 번호가 실려야 이을 수 있다
- 알림이 하나도 없을 때의 화면은 `EmptyState`로 그려 두었으나 시안이 없다
