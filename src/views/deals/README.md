# deals

기간 한정 할인 상품 목록. 진행 중인 딜과 오픈 예정인 딜을 탭으로 나눈다.

- **라우트**: `/deals` — `src/app/deals/page.tsx`
- **조립**: `entities/product`(`ProductOptionSheet`) · `shared/ui`의 `page-header` · `countdown` · `price` · `product-summary` · `empty-state` · `tabs` · `quantity-stepper`
- **상태**: 보고 있는 탭은 URL 쿼리 `tab`(`live` · `upcoming`). 담긴 상품·알림 신청 여부·딜 종료는 화면 안 상태
- **참고**: 와이어프레임 기준(타임딜 6화면). 목록 데이터는 목업이고 API 계약 확정 전 미연동

| 파일 | 설명 |
| --- | --- |
| `ui/deals-view.tsx` | 화면 조립 |
| `ui/deals-view.test.tsx` | 남은 시간·품절·담기·알림 신청 |
| `index.ts` | 공개 API |

## 짚어둘 것

**남은 시간이 다 되면 목록도 함께 사라진다.** `Countdown`의 `onEnd`로 알려 받아 비워짐 화면으로 바꾼다. 세는 것만 멈추면 살 수 없는 상품이 그대로 남는다.

**오픈 예정 탭은 알림을 신청하면 카운트다운이 사라진다.** 시안이 그렇게 그려져 있고, 알림을 받기로 한 이상 초를 지켜볼 이유가 없다는 뜻으로 읽었다. 대신 언제 열리는지를 큰 글씨로 남긴다.

**비워짐 화면의 버튼은 시안에 없다.** "다른 상품도 둘러보시겠어요?"가 물음인데 갈 곳이 없어 링크를 붙였다.
