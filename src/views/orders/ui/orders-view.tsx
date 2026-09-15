// 주문·배송 확인. 주문별 상태에 따라 할 수 있는 행동이 달라진다.
// UI 시안 기준(mypa_061 287:8422, mypa_061_구매확정 287:8634, mypa_061_주문취소 302:9385)이다.

"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { OrderStatusBadge, type OrderStatus } from "@/entities/order";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { BottomSheet } from "@/shared/ui/bottom-sheet/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { DrawerDescription, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { PageHeader } from "@/shared/ui/page-header/page-header";

import { DeliveryTrackingDialog } from "./delivery-tracking-dialog";
import { OrderProductRow } from "./order-product-row";

type Order = { id: string; orderedAt: string; status: OrderStatus; amount: number };

/** API 연동 전까지 화면 확인용 값 */
const MOCK_ORDERS: Order[] = [
  { id: "1", orderedAt: "26.08.28", status: "preparing", amount: 12345 },
  { id: "2", orderedAt: "26.08.28", status: "shipping", amount: 12345 },
  { id: "3", orderedAt: "26.08.28", status: "delivered", amount: 12345 },
  { id: "4", orderedAt: "26.08.28", status: "confirmed", amount: 12345 },
];

/** 시안의 목록 행동 버튼. 36px에 label/medium_14, 두 개면 같은 폭으로 나눠 갖는다 (287:8551) */
const ACTION_CLASS =
  "h-9 flex-1 bg-surface-tertiary text-label-medium-14 text-foreground hover:bg-surface-tertiary/80";

// 시안의 시트 버튼. 48px에 label/bold_16 (287:8795).
// `font-bold`를 따로 붙이는 이유는 Button이 `font-medium`을 들고 있어서다. tailwind-merge는
// 크기 토큰(`text-*`)과 굵기(`font-*`)를 다른 그룹으로 보므로 둘 다 남고, 나중에 선언된 쪽이 이긴다.
const SHEET_ACTION_CLASS = "h-12 flex-1 text-label-bold-16 font-bold";

export function OrdersView() {
  // 확정·취소가 목록에 반영돼야 같은 버튼을 다시 누를 수 없다. 서버 연동 전까지 여기서 든다.
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [trackingOpen, setTrackingOpen] = useState(false);

  const confirming = orders.find((order) => order.id === confirmingId) ?? null;

  const setStatus = (id: string, status: OrderStatus) =>
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)));

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="주문·배송 확인" />

      <main className="flex flex-1 flex-col gap-4 px-5 pt-3 pb-8">
        {orders.length === 0 ? (
          <EmptyState title="주문 내역이 없어요" description="마음에 드는 상품을 찾아보세요." />
        ) : (
          orders.map((order) => (
            <article key={order.id} className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <p className="text-body-regular-13 text-text-body-secondary">
                  주문 일자 {order.orderedAt}
                </p>

                <OrderProductRow
                  name="상품명"
                  option="상품 옵션"
                  amount={order.amount}
                  nameTrailing={<OrderStatusBadge status={order.status} className="shrink-0" />}
                />
              </div>

              <div className="flex gap-2">
                {/* 시안은 활성이지만 택배사 연동 전이라 갈 곳이 없다. 준비중임을 알린다 */}
                {order.status === "shipping" && (
                  <Button
                    variant="secondary"
                    className={ACTION_CLASS}
                    onClick={() => setTrackingOpen(true)}
                  >
                    배송 위치 보기
                  </Button>
                )}
                {/* 배송이 시작되기 전까지만 취소할 수 있다 (mypa_061) */}
                {(order.status === "paid" || order.status === "preparing") && (
                  <Button
                    variant="secondary"
                    className={ACTION_CLASS}
                    onClick={() => setCancelingId(order.id)}
                  >
                    주문 취소
                  </Button>
                )}
                {order.status === "delivered" && (
                  <Button
                    variant="secondary"
                    className={ACTION_CLASS}
                    onClick={() => setConfirmingId(order.id)}
                  >
                    구매 확정하기
                  </Button>
                )}
                <Button variant="secondary" className={ACTION_CLASS} asChild>
                  <Link href={`/mypage/orders/${order.id}`}>자세히 보기</Link>
                </Button>
              </div>
            </article>
          ))
        )}
      </main>

      {/* 구매 확정은 되돌릴 수 없지만 무엇을 확정하는지 함께 보여야 해서 시트로 연다.
          시안의 카드에는 손잡이가 없다 */}
      <BottomSheet
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirmingId(null)}
        showHandle={false}
        className="gap-5 p-4"
      >
        <DrawerHeader className="gap-1 p-0">
          {/* DrawerTitle도 `font-medium`을 들고 있어 굵기를 따로 되돌린다 */}
          <DrawerTitle className="text-left text-title-bold-16 font-bold text-foreground">
            무사히 잘 도착했나요?
          </DrawerTitle>
          <DrawerDescription className="text-left text-body-medium-14 text-text-body-secondary">
            구매 확정을 할 수 있어요!
          </DrawerDescription>
        </DrawerHeader>

        <OrderProductRow name="상품명" option="상품 옵션" amount={confirming?.amount ?? 0} />

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className={`${SHEET_ACTION_CLASS} bg-surface-tertiary text-foreground hover:bg-surface-tertiary/80`}
            onClick={() => setConfirmingId(null)}
          >
            나중에 할게요
          </Button>
          <Button
            className={SHEET_ACTION_CLASS}
            onClick={() => {
              if (confirmingId) setStatus(confirmingId, "confirmed");
              setConfirmingId(null);
              toast.success("구매를 확정했어요");
            }}
          >
            확정하기
          </Button>
        </div>
      </BottomSheet>

      {/* 주문 취소는 되돌릴 수 없어 확인 창으로 막는다 */}
      <AlertDialog
        open={cancelingId !== null}
        onOpenChange={(open) => !open && setCancelingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>주문을 취소할까요?</AlertDialogTitle>
          <AlertDialogDescription>결제하신 금액은 안전하게 환불 처리돼요.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">닫기</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-11"
              onClick={() => {
                setOrders((prev) => prev.filter((order) => order.id !== cancelingId));
                toast.success("주문을 취소했어요");
              }}
            >
              주문 취소하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeliveryTrackingDialog open={trackingOpen} onOpenChange={setTrackingOpen} />
    </div>
  );
}
