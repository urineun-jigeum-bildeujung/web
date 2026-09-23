// 주문·배송 확인. "주문내역"·"취소·환불·교환" 두 탭이고, 주문내역은 주문마다 상품 줄을 세운다.
// UI 시안 기준(mypa_061 3324:36861, mypa_061_구매확정_시트 3324:36993, mypa_061_주문취소_모달 3324:37141)이다 (#405).

"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Fragment, useState } from "react";
import { toast } from "sonner";

import { OrderProductRow, useMutateOrder, useQueryOrders } from "@/entities/order";
import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE, APP_MESSAGE_CODE, type AppMessageCode } from "@/shared/config/app-message";
import { cn } from "@/shared/lib/utils";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { BottomSheet } from "@/shared/ui/bottom-sheet/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { DrawerDescription, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { groupByPaidDate } from "../model/group-by-paid-date";

import { OrderEntry } from "./order-entry";
import { OrdersSkeleton } from "./orders-skeleton";
import { PreparingDialog } from "./preparing-dialog";
import { useLoadMore } from "./use-load-more";

const TABS = ["orders", "claims"] as const;
type Tab = (typeof TABS)[number];

/** 시트·확인창의 action_button. 40px에 굵은 14px, 둘이 같은 폭으로 나눈다 (3324:37140·3324:37274) */
const DIALOG_BUTTON = "h-10 flex-1 rounded-lg text-label-bold-14";

/** 주문내역 탭. 받는 중 · 실패 · 비어 있음 · 목록과, 목록에서 여는 시트·확인창을 든다 */
function OrderHistory() {
  const { orders, error, isLoading, hasNext, loadNext, isLoadingNext, nextError } =
    useQueryOrders();
  const { confirm, cancel, confirmingId, cancelingId } = useMutateOrder();

  // 목록 끝이 보이면 다음 쪽을 가져온다. 가져오는 중이거나 방금 실패했으면 멈춘다 —
  // 실패한 채로 계속 보고 있으면 같은 요청이 끝없이 다시 나간다
  const loadMoreRef = useLoadMore(loadNext, hasNext && !isLoadingNext && !nextError);

  // 어느 주문을 확정·취소할지 묻는 중인지. 서버에 보내기 전 단계라 화면이 든다
  const [askingConfirmId, setAskingConfirmId] = useState<number | null>(null);
  const [askingCancelId, setAskingCancelId] = useState<number | null>(null);
  const [preparing, setPreparing] = useState<AppMessageCode | null>(null);

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
                      onCancel={setAskingCancelId}
                      onConfirm={setAskingConfirmId}
                      onTrack={() => setPreparing(APP_MESSAGE_CODE.order.deliveryTrackingPreparing)}
                      onReorder={() => setPreparing(APP_MESSAGE_CODE.order.reorderPreparing)}
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

      {/* 다음 쪽만 실패한 경우다. 저절로 다시 부르면 같은 실패가 되풀이되므로 사용자가 고른다 */}
      {nextError && (
        <Button
          variant="secondary"
          className="mt-4 h-10 text-label-bold-14"
          onClick={() => loadNext()}
        >
          주문을 더 불러오지 못했어요. 다시 시도
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

        {/* 확정은 주문 단위라 그 주문의 상품을 모두 보인다. 목록 응답에 상품별 금액이 없어
            금액 줄은 비운다 */}
        {asking && (
          <ul className="mt-1 flex flex-col gap-3">
            {asking.items.map((item) => (
              <li key={item.orderItemId}>
                <OrderProductRow
                  name={item.productName}
                  quantity={item.quantity}
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

      {/* 주문 취소는 되돌릴 수 없어 확인 창으로 막는다 */}
      <AlertDialog
        open={askingCancelId !== null}
        // 시트와 같은 이유로 보내는 중에는 닫히지 않는다 (#293 리뷰)
        onOpenChange={(open) => {
          if (!open && cancelingId === null) {
            setAskingCancelId(null);
          }
        }}
      >
        <AlertDialogContent
          className="rounded-2xl"
          // Escape는 `onOpenChange`를 거치지 않고 바로 닫는 경로라 따로 막는다
          onEscapeKeyDown={(event) => {
            if (cancelingId !== null) {
              event.preventDefault();
            }
          }}
        >
          {/* 제목과 설명은 4px로 붙는다. 기본 Header는 모바일에서 가운데 정렬이라 쓰지 않는다 */}
          <div className="flex flex-col gap-1">
            <AlertDialogTitle className="text-title-bold-18 text-foreground">
              주문을 취소할까요?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-body-medium-14 break-keep text-text-body-secondary">
              결제하신 금액은 안전하게 환불 처리돼요.
            </AlertDialogDescription>
          </div>
          {/* 기본 Footer는 회색 띠를 두르는데 시안은 카드 안에 버튼만 놓는다 */}
          <div className="flex gap-2">
            <AlertDialogCancel
              variant="secondary"
              className={DIALOG_BUTTON}
              disabled={cancelingId !== null}
            >
              닫기
            </AlertDialogCancel>
            {/* **`AlertDialogAction`을 쓰지 않는다.** 그쪽은 버튼 모양을 `asChild`로 얹어 클래스를
                겹칠 때 충돌 정리를 거치지 않아, 빨간 바탕을 줘도 기본 진한 바탕이 이긴다. 누르면
                닫히는 기본 동작도 여기서는 막아야 해서(서버가 끝날 때까지 열어 둔다) 쓸 까닭이 없다.
                시안의 button/bg/danger(3324:37274) — 되돌릴 수 없는 동작이라 빨간색이다 */}
            <Button
              className={cn(
                DIALOG_BUTTON,
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              )}
              disabled={cancelingId !== null}
              onClick={async () => {
                if (askingCancelId === null) {
                  return;
                }
                try {
                  await cancel(askingCancelId);
                  setAskingCancelId(null);
                  toast.success("주문을 취소했어요");
                } catch {
                  // 실패 알림은 MutationCache.onError가 맡는다
                }
              }}
            >
              <LoadingSwap loading={cancelingId !== null} label="주문을 취소하는 중">
                주문 취소하기
              </LoadingSwap>
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

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
              취소·환불·교환
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
