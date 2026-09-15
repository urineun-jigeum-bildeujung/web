# views/restock-alarm

재입고 알림 화면. UI 시안 `mypa_031`(목록·선택·취소 확인)에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/restock-alarm-view.tsx` | 재입고 알림. 안내·검색·상품 목록과 취소 확인 다이얼로그 |
| `ui/restock-alarm-view.test.tsx` | 고르면 취소 버튼이 나오고, 확인하면 목록에서 빠지는지 본다 |
| `ui/restock-item-row.tsx` | 상품 한 줄. 사진·이름·가격과 오른쪽 원형 체크 |
| `index.ts` | 공개 API |

## 라우트

`/mypage/restock` — `src/app/mypage/restock/page.tsx`

## 수정하기 모드가 없어졌다

와이어프레임에는 "수정하기"를 눌러야 고를 수 있는 모드가 있었는데 UI 시안(#196)에서 빠졌다. 언제나 고를 수 있고, 고른 것이 있을 때만 아래에 "알림 취소하기"가 나온다. 누르면 확인 다이얼로그를 거쳐 목록에서 지운다.

원형 체크는 `CheckboxRow` 한 곳에만 두기로 해서(#184), 시안처럼 체크를 오른쪽에 두려고 줄을 `flex-row-reverse`로 뒤집어 쓴다.

확인 다이얼로그의 버튼은 `AlertDialogAction`·`AlertDialogCancel` 대신 `Button`으로 그린다. 그 둘은 클래스를 병합하지 않고 이어 붙여 높이(40)와 빨간 배경이 기본값에 덮인다.

## 아직 없는 것

API 연동. 화면 안의 값은 확인용 목 데이터이며 백엔드 계약이 정해지면 교체한다. 상품 사진도 아직 없어 회색으로 비워 둔다.
