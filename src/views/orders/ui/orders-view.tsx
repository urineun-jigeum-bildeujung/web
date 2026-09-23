// 주문·배송 확인. "주문내역"·"취소·반품·교환" 두 탭이고, 주문내역은 주문마다 상품 줄을 세운다.
// UI 시안 기준(mypa_061 3324:36861, mypa_061_구매확정_시트 3324:36993)이다 (#405).
//
// **주문 취소는 여기 없다.** 서버가 주문 전체만 취소해 PD팀이 취소를 주문 상세 맨 아래로 옮겼다 (#410).

"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Fragment, useState } from "react";
import { toast } from "sonner";

import { useMutateCartItem } from "@/entities/cart";
import {
  OrderProductRow,
  useMutateOrder,
  useQueryOrders,
  type OrderListItem,
} from "@/entities/order";
import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE, APP_MESSAGE_CODE, type AppMessageCode } from "@/shared/config/app-message";
import { BottomSheet } from "@/shared/ui/bottom-sheet/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { DrawerDescription, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { showSnackbar } from "@/shared/ui/snackbar/snackbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { groupByPaidDate } from "../model/group-by-paid-date";

import { OrderEntry } from "./order-entry";
import { OrdersSkeleton } from "./orders-skeleton";
import { PreparingDialog } from "./preparing-dialog";
import { useLoadMore } from "./use-load-more";

const TABS = ["orders", "claims"] as const;
type Tab = (typeof TABS)[number];

/** 시트의 action_button. 40px에 굵은 14px, 둘이 같은 폭으로 나눈다 (3324:37140) */
const DIALOG_BUTTON = "h-10 flex-1 rounded-lg text-label-bold-14";

/** 주문내역 탭. 받는 중 · 실패 · 비어 있음 · 목록과, 목록에서 여는 구매확정 시트를 든다 */
function OrderHistory() {
  const { orders, error, isLoading, hasNext, loadNext, isLoadingNext, nextError } =
    useQueryOrders();
  const { confirm, confirmingId } = useMutateOrder();

  // 목록 끝이 보이면 다음 쪽을 가져온다. 가져오는 중이거나 방금 실패했으면 멈춘다 —
  // 실패한 채로 계속 보고 있으면 같은 요청이 끝없이 다시 나간다
  const loadMoreRef = useLoadMore(loadNext, hasNext && !isLoadingNext && !nextError);

  // 어느 주문을 확정할지 묻는 중인지. 서버에 보내기 전 단계라 화면이 든다
  const [askingConfirmId, setAskingConfirmId] = useState<number | null>(null);
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

  const list = orders ?? [];
  const asking = list.find((order) => order.orderId === askingConfirmId) ?? null;
  // 같은 날 결제한 주문은 한 머리 아래 모은다. 다음 쪽이 이어 붙어도 같은 날이면 한 묶음이다
  const groups = groupByPaidDate(list);

  return (
    <>
      {isLoading && <OrdersSkeleton />}

      {/* 조회 실패는 토스트로 알리지 않는다(AppProviders 주석). 화면에서 무엇이 잘못됐는지 보여준다.
          **이미 받아 둔 주문이 있으면 화면을 덮지 않는다** — 둘째 쪽에서 실패했다고 보고 있던
          목록까지 사라지면 스크롤하던 자리를 잃는다 (#294 리뷰) */}
      {error && list.length === 0 && (
        <EmptyState role="alert" className="flex-1" {...APP_MESSAGE[toAppMessageCode(error)]} />
      )}

      {!isLoading && !error && list.length === 0 && (
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
                      onConfirm={setAskingConfirmId}
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

      {/* 이 줄이 화면에 들어오면 다음 쪽을 부른다. 보이는 것은 없어 높이만 1px이다 */}
      {hasNext && !nextError && <div ref={loadMoreRef} aria-hidden className="h-px" />}
      {isLoadingNext && <OrdersSkeleton count={1} className="pt-4" />}

      {/* 다음 쪽만 실패한 경우다. 저절로 다시 부르면 같은 실패가 되풀이되므로 사용자가 고른다.
          **다시 받는 동안에도 오류 상태가 남아 이 버튼이 서 있다.** 잠그지 않으면 또 눌러 같은
          커서로 요청이 한 번 더 나간다. 리뷰 목록의 다시 시도와 같이 대기를 보인다 (#427) */}
      {nextError && (
        <Button
          variant="secondary"
          className="mt-4 h-10 text-label-bold-14"
          disabled={isLoadingNext}
          onClick={() => loadNext()}
        >
          <LoadingSwap loading={isLoadingNext} label="주문을 더 불러오는 중">
            주문을 더 불러오지 못했어요. 다시 시도
          </LoadingSwap>
        </Button>
      )}

      {/* 구매 확정은 되돌릴 수 없어 무엇을 확정하는지 보여주는 시트를 한 번 거친다.
          시안(3324:37140)은 손잡이·제목·설명이 8px로 붙고 상품·버튼이 12px씩 떨어진다 */}
      <BottomSheet
        open={asking !== null}
        // 보내는 중에는 닫히지 않는다. 바깥을 눌러 닫으면 어느 주문을 확정하는지 잃은 채
        // 요청만 남아, 끝났을 때 무엇이 확정됐는지 알 수 없다 (#293 리뷰)
        onOpenChange={(open) => {
          if (!open && confirmingId === null) {
            setAskingConfirmId(null);
          }
        }}
        className="gap-2 px-5 pb-4"
      >
        <DrawerHeader className="gap-2 p-0">
          <DrawerTitle className="text-left text-title-bold-18 text-foreground">
            무사히 잘 도착했나요?
          </DrawerTitle>
          <DrawerDescription className="text-left text-body-medium-14 text-text-body-secondary">
            구매 확정을 할 수 있어요!
          </DrawerDescription>
        </DrawerHeader>

        {/* 확정은 주문 단위라 그 주문의 상품을 모두 보인다. 금액은 목록과 같이 그 줄에 낸 값이다 (#418) */}
        {asking && (
          <ul className="mt-1 flex flex-col gap-3">
            {asking.items.map((item) => (
              <li key={item.orderItemId}>
                <OrderProductRow
                  name={item.productName}
                  quantity={item.quantity}
                  amount={item.amount}
                  imageUrl={item.thumbnailUrl}
                />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-1 flex gap-3">
          <Button
            variant="secondary"
            className={DIALOG_BUTTON}
            disabled={confirmingId !== null}
            onClick={() => setAskingConfirmId(null)}
          >
            나중에 할게요
          </Button>
          <Button
            className={DIALOG_BUTTON}
            // 서버가 끝낸 뒤 닫는다. 먼저 닫으면 실패했을 때 확정된 줄 안다
            disabled={confirmingId !== null}
            onClick={async () => {
              if (askingConfirmId === null) {
                return;
              }
              try {
                await confirm(askingConfirmId);
                setAskingConfirmId(null);
                toast.success("구매를 확정했어요");
              } catch {
                // 실패 알림은 MutationCache.onError가 맡는다. 시트는 열어 두어 다시 누를 수 있게 한다
              }
            }}
          >
            <LoadingSwap loading={confirmingId !== null} label="구매를 확정하는 중">
              확정하기
            </LoadingSwap>
          </Button>
        </div>
      </BottomSheet>

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

          {/* 탭을 열 때만 받는다. 둘째 탭에 머무는 동안 주문 목록을 부르지 않는다 */}
          <TabsContent value="orders" className="flex flex-col">
            {tab === "orders" && <OrderHistory />}
          </TabsContent>

          {/* **시안은 있는데 API가 없다.** 탭 화면(mypa_061_취소·반품·교환 3326:33002)은 신청 건마다
              접수일·"환불" 같은 뱃지·상품·자세히 보기를 보이는데, 신청 건을 모아 주는 API가 없다.
              받기 전까지 준비 중으로 둔다 (#405) */}
          <TabsContent value="claims" className="flex flex-col">
            <EmptyState
              icon={<Icon name="delivery" />}
              {...APP_MESSAGE[APP_MESSAGE_CODE.order.claimHistoryPreparing]}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
