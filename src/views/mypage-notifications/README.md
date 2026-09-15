# mypage-notifications

공지와 배송 알림을 한 자리에서 보는 화면. UI 시안 `noti_011`(목록·공지 모달·알림 모달)에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/mypage-notifications-view.tsx` | 알림 목록. 거르기 칩과 `?filter` 쿼리 |
| `ui/mypage-notifications-view.test.tsx` | 목록이 다 보이는지, 거르기가 URL을 따르는지, 읽지 않음이 문장으로 읽히는지 본다 |
| `ui/notification-row.tsx` | 목록 한 줄. 유형 배지·제목·날짜·읽지 않음 점·본문 미리보기 |
| `ui/notification-dialog.tsx` | 상세 모달. 공지는 닫기만, 알림은 배송 확인이 더 붙는다 |
| `index.ts` | 공개 API |

## 라우트

```text
/mypage/notifications           알림 목록
/mypage/notifications?filter=…  all · unread · read
```

**상세는 모달이라 라우트를 나누지 않았다.** 화면 이동이 아니라 같은 화면의 상태다.

## 거르기가 돌아왔다

전체·새 알림·확인한 알림 칩은 2026-09-09 와이어프레임 수정에서 빠졌다가(#137) UI 시안(#196)에 다시 있어 되살렸다. 값은 `nuqs`로 URL에 두어 상세를 열었다 돌아와도 남고, 그래서 라우트를 `Suspense`로 감싼다. 화면 구성이 바뀌는 게 아니라 목록만 걸러지므로 `history`는 기본(replace)이다.

## 모달에 Dialog를 쓴 이유

`AlertDialog`는 사용자의 응답을 요구하는 경고용이라 스크린 리더가 즉시 알린다. 여기 모달은 사용자가 항목을 눌러 여는 정보 전달이므로 `Dialog`가 맞다.

shadcn `DialogFooter`는 아래에 회색 띠를 두르는데 시안에는 없어 버튼 줄을 맨 `div`로 둔다. 오버레이는 받은 파일의 `bg-black/10`을 `bg-black/50`으로 고쳐 두었다(`drawer`·`alert-dialog`와 같다).

## 아직 없는 것

- 목록이 목업이다. 읽음 표시가 서버에 남지 않아 새로고침하면 되돌아간다
- 배송 알림의 "배송 확인"이 주문 목록으로만 간다. 어느 주문인지는 알림에 주문 번호가 실려야 이을 수 있다
- 알림이 하나도 없을 때의 화면은 `EmptyState`로 그려 두었으나 시안이 없다
