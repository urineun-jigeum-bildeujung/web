// 주문·배송 확인. "주문내역"·"취소·반품·교환" 두 탭이고, 주문내역은 주문마다 상품 줄을 세운다.
// UI 시안 기준(mypa_061 3324:36861, mypa_061_취소·반품·교환 3326:33002)이다 (#405, #462).
//
// **주문 취소와 구매 확정은 여기 없다.** 서버가 둘 다 주문 전체에 걸어 PD팀이 주문 상세 맨 아래로
// 옮겼다 — 취소는 #410, 구매 확정은 #462.

"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Fragment, useState } from "react";

import { useMutateCartItem } from "@/entities/cart";
import { useQueryOrders, type OrderListItem } from "@/entities/order";
import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE, APP_MESSAGE_CODE, type AppMessageCode } from "@/shared/config/app-message";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { PreparingDialog } from "@/shared/ui/preparing-dialog/preparing-dialog";
import { showSnackbar } from "@/shared/ui/snackbar/snackbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { groupByPaidDate } from "../model/group-by-paid-date";
import { isHistoryOrder } from "../model/history-orders";

import { ClaimHistory } from "./claim-history";
import { LoadMoreFooter } from "./load-more-footer";
import { OrderEntry } from "./order-entry";
import { OrdersSkeleton } from "./orders-skeleton";

const TABS = ["orders", "claims"] as const;
type Tab = (typeof TABS)[number];

/** 주문내역 탭. 받는 중 · 실패 · 비어 있음 · 목록을 든다 */
function OrderHistory() {
  const { orders, error, isLoading, hasNext, loadNext, isLoadingNext, nextError } =
    useQueryOrders();
  const [preparing, setPreparing] = useState<AppMessageCode | null>(null);

  const { add } = useMutateCartItem();
  // 담는 중인 상품 줄. 담기 훅의 대기 표시는 어느 줄인지 몰라 화면이 든다
  const [reorderingId, setReorderingId] = useState<number | null>(null);

  /**
   * 주문한 상품을 장바구니에 다시 담는다. 상품 상세의 담기처럼 끝나면 스낵바로 알린다.
   *
   * **일반 상품으로, 주문한 수량만큼 담는다.** 목록의 `productId`는 타임딜로 산 줄도 원본
   * 상품 id다 — 딜은 기간이 끝나 있을 수 있다. 몇 개 담을지는 시안에 없어, 같은 것을 다시 사는
   * 흐름에 맞춰 주문 수량으로 둔다(PD 확인 거리, #418).
   */
  async function reorder(item: OrderListItem) {
    setReorderingId(item.orderItemId);
    try {
      await add({ itemType: "NORMAL", itemId: item.productId }, item.quantity);
      showSnackbar("상품이 장바구니에 담겼어요");
    } catch {
      // 실패 알림은 MutationCache.onError가 맡는다
    }
    // `finally`에 두지 않는다 — React Compiler가 finally 절을 만나면 이 컴포넌트 최적화를 포기한다
    setReorderingId(null);
  }

  const fetched = orders ?? [];
  // 결제를 끝내지 않은 주문과 취소한 주문은 이 탭에 세우지 않는다 (2026-09-28 PD 답, #462)
  const list = fetched.filter(isHistoryOrder);
  // 같은 날 결제한 주문은 한 머리 아래 모은다. 다음 쪽이 이어 붙어도 같은 날이면 한 묶음이다
  const groups = groupByPaidDate(list);

  return (
    <>
      {isLoading && <OrdersSkeleton />}

      {/* 조회 실패는 토스트로 알리지 않는다(AppProviders 주석). 화면에서 무엇이 잘못됐는지 보여준다.
          **이미 받아 둔 주문이 있으면 화면을 덮지 않는다** — 둘째 쪽에서 실패했다고 보고 있던
          목록까지 사라지면 스크롤하던 자리를 잃는다 (#294 리뷰). 받아 둔 것이 모두 걸러졌을 때도
          덮지 않는다 — 다음 쪽만 실패한 것이라 아래 다시 시도가 맞다 (#462) */}
      {error && fetched.length === 0 && (
        <EmptyState role="alert" className="flex-1" {...APP_MESSAGE[toAppMessageCode(error)]} />
      )}

      {/* 다음 쪽이 남아 있으면 비었다고 하지 않는다. 한 쪽이 통째로 걸러졌을 수 있다 (#462).
          받아 둔 목록을 배경에서 다시 받다 실패한 것은 막지 않는다 — 그것까지 막으면 빈 상태도
          오류도 없는 빈 화면이 된다(#474) */}
      {!isLoading && !(error && fetched.length === 0) && !hasNext && list.length === 0 && (
        <EmptyState
          icon={<Icon name="delivery" />}
          title="아직 주문한 내역이 없어요"
          description="맞춤 리포트로 딱 맞는 식단을 찾아보세요"
        />
      )}

      {/* 결제일마다 머리를 달고 날짜 사이에 구분선(border/default)을 넣는다. 위아래로 16px씩 띄운다.
          PD 메모 — "결제일 별로 분리 시키기 위해 divider를 추가"했고, 한 날짜 안은 결제 시간으로
          나뉜다 (3326:33455·3326:33463) */}
      {!isLoading && groups.length > 0 && (
        <div className="flex flex-col gap-4">
          {groups.map((group, index) => (
            <Fragment key={group.key}>
              {index > 0 && <hr className="border-border-default" />}
              <section className="flex flex-col gap-3">
                {/* 읽을 수 없는 값이면 머리를 비운다. 지어낸 날짜를 보이느니 낫다 */}
                {group.day && (
                  <h2 className="text-body-medium-18 text-foreground">결제일 {group.day}</h2>
                )}
                <div className="flex flex-col gap-4">
                  {group.orders.map((order) => (
                    <OrderEntry
                      key={order.orderId}
                      order={order}
                      onTrack={() => setPreparing(APP_MESSAGE_CODE.order.deliveryTrackingPreparing)}
                      onReorder={(item) => void reorder(item)}
                      reorderingId={reorderingId}
                    />
                  ))}
                </div>
              </section>
            </Fragment>
          ))}
        </div>
      )}

      {/* 다음 쪽을 부르는 줄·뼈대·다시 시도(LoadingSwap)는 둘째 탭과 함께 쓴다 */}
      <LoadMoreFooter
        hasNext={hasNext}
        loadNext={loadNext}
        isLoadingNext={isLoadingNext}
        nextError={nextError}
      />

      <PreparingDialog code={preparing} onClose={() => setPreparing(null)} />
    </>
  );
}

export function OrdersView() {
  const [tab, setTab] = useQueryState(
    "tab",
    // 두 탭이 서로 다른 목록이라 뒤로가기로 되돌아와야 한다
    parseAsStringLiteral(TABS).withDefault("orders").withOptions({ history: "push" }),
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="주문·배송 확인" />

      <main className="flex flex-1 flex-col px-5 pt-3 pb-8">
        <Tabs
          value={tab}
          onValueChange={(next) => void setTab(next as Tab)}
          className="flex-1 gap-4"
        >
          {/* 시안의 segment_control(3324:36992). 트랙은 목록보다 좌우 4px 안쪽이다 */}
          <TabsList variant="segment" className="mx-1 w-auto">
            <TabsTrigger value="orders" className="h-10 text-label-bold-16">
              주문내역
            </TabsTrigger>
            <TabsTrigger value="claims" className="h-10 text-label-bold-16">
              취소·반품·교환
            </TabsTrigger>
          </TabsList>

          {/* 탭을 열 때만 그린다. 두 탭이 같은 주문 목록 캐시를 쓰므로 오가도 목록을 다시 받지 않는다.
              상세는 둘째 탭을 열어야 받는다 */}
          <TabsContent value="orders" className="flex flex-col">
            {tab === "orders" && <OrderHistory />}
          </TabsContent>

          {/* 취소한 주문과 반품·교환 신청이 여기 모인다(2026-09-28 PD 답). 신청 건을 모아 주는 API가
              없어 목록과 상세를 합쳐 만든다 (#462) */}
          <TabsContent value="claims" className="flex flex-col">
            {tab === "claims" && <ClaimHistory />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
