# mypage-notifications

공지와 배송 알림을 한 자리에서 보는 화면. 와이어프레임 `noti_001`과 그 두 상세 상태에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/mypage-notifications-view.tsx` | 알림 목록과 거르기 (`noti_001`) |
| `ui/mypage-notifications-view.test.tsx` | 거르기가 목록을 줄이는지, 읽지 않음이 문장으로 읽히는지 본다 |
| `ui/notification-row.tsx` | 목록 한 줄. 유형 뱃지·제목·날짜·본문 미리보기 |
| `ui/notification-dialog.tsx` | 상세 모달 (`noti_001_공지`, `noti_001_알림`) |
| `index.ts` | 공개 API |

## 라우트

```text
/mypage/notifications  알림 목록
```

거르기는 `?filter=all|unread|read`로 주소에 남는다. 목록에서 상세로 갔다 돌아와도 조건이 유지되어야 한다.

**상세는 모달이라 라우트를 나누지 않았다.** 화면 이동이 아니라 같은 화면의 상태다.

## 거르는 칩

`shared/ui/filter-chips`를 쓴다. 이 화면에서 만들었다가 아이 제품 관리·좋아요·맞춤 추천에서도 같은 모양이 나와 공용으로 올렸다 (#91).

## 모달에 Dialog를 쓴 이유

`AlertDialog`는 사용자의 응답을 요구하는 경고용이라 스크린 리더가 즉시 알린다. 여기 모달은 사용자가 항목을 눌러 여는 정보 전달이므로 `Dialog`가 맞다. 이 작업에서 shadcn `dialog`를 새로 받았다.

받은 파일의 오버레이가 `bg-black/10`이어서 `bg-black/50`으로 고쳤다. `drawer`·`alert-dialog`가 이미 `/50`이고, `/10`은 뒤 화면이 그대로 읽혀 무엇이 잠긴 상태인지 알기 어렵다.

## 아직 없는 것

- 목록이 목업이다. 읽음 표시가 서버에 남지 않아 새로고침하면 되돌아간다
- 배송 알림의 "배송 확인"이 주문 목록으로만 간다. 어느 주문인지는 알림에 주문 번호가 실려야 이을 수 있다
- 알림이 하나도 없을 때의 화면은 `EmptyState`로 그려 두었으나 시안이 없다
