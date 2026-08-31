// 주문·배송 확인. 주문별 상태에 따라 할 수 있는 행동이 달라진다.
// 와이어프레임 기준(mypa_061, mypa_061_구매확정, mypa_061_주문취소)이라 디자인 확정 시 바뀔 수 있다.

"use client";

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
import { Button } from "@/shared/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Price } from "@/shared/ui/price/price";
import { ProductSummary } from "@/shared/ui/product-summary/product-summary";

type Order = { id: string; orderedAt: string; status: OrderStatus; amount: number };

/** API 연동 전까지 화면 확인용 값 */
const MOCK_ORDERS: Order[] = [
  { id: "1", orderedAt: "26.08.28", status: "preparing", amount: 12345 },
  { id: "2", orderedAt: "26.08.28", status: "shipping", amount: 12345 },
  { id: "3", orderedAt: "26.08.28", status: "delivered", amount: 12345 },
  { id: "4", orderedAt: "26.08.28", status: "confirmed", amount: 12345 },
];

export function OrdersView() {
  // 확정·취소가 목록에 반영돼야 같은 버튼을 다시 누를 수 없다. 서버 연동 전까지 여기서 든다.
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const setStatus = (id: string, status: OrderStatus) =>
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)));

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="주문·배송 확인" />

      <main className="flex flex-1 flex-col gap-6 px-4 pb-8">
        {orders.length === 0 ? (
          <EmptyState title="주문 내역이 없어요" description="마음에 드는 상품을 찾아보세요." />
        ) : (
          orders.map((order) => (
            <article key={order.id} className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">주문 일자 {order.orderedAt}</p>

              <ProductSummary
                name="상품명"
                meta="상품 옵션"
                nameTrailing={<OrderStatusBadge status={order.status} />}
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">결제 금액</span>
                <Price amount={order.amount} size="sm" />
              </div>

              <div className="flex gap-2">
                {/* 배송 조회와 주문 상세(mypa_161)는 아직 화면이 없다.
                    눌러도 아무 일이 없으면 고장으로 읽히므로 잠가 둔다. */}
                {order.status === "shipping" && (
                  <Button variant="outline" className="min-h-11 flex-1" disabled>
                    배송 위치 보기
                  </Button>
                )}
                {/* 배송이 시작되기 전까지만 취소할 수 있다 (mypa_061) */}
                {(order.status === "paid" || order.status === "preparing") && (
                  <Button
                    variant="outline"
                    className="min-h-11 flex-1"
                    onClick={() => setCancelingId(order.id)}
                  >
                    주문 취소
                  </Button>
                )}
                {order.status === "delivered" && (
                  <Button
                    variant="outline"
                    className="min-h-11 flex-1"
                    onClick={() => setConfirmingId(order.id)}
                  >
                    구매 확정하기
                  </Button>
                )}
                <Button variant="outline" className="min-h-11 flex-1" disabled>
                  자세히 보기
                </Button>
              </div>
            </article>
          ))
        )}
      </main>

      {/* 구매 확정은 되돌릴 수 없지만 이득(포인트)을 알리는 자리라 시트로 연다 */}
      <Drawer open={confirmingId !== null} onOpenChange={(open) => !open && setConfirmingId(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>무사히 잘 도착했나요?</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-4 px-4 pb-6">
            <p className="text-sm text-muted-foreground">확정하고 후기까지 남기면 200P를 드려요.</p>
            <ProductSummary name="상품명" meta="상품 옵션" />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="min-h-11 flex-1"
                onClick={() => setConfirmingId(null)}
              >
                나중에 할게요
              </Button>
              <Button
                className="min-h-11 flex-1"
                onClick={() => {
                  if (confirmingId) setStatus(confirmingId, "confirmed");
                  setConfirmingId(null);
                  toast.success("구매를 확정했어요");
                }}
              >
                확정하고 포인트 받기
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

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
    </div>
  );
}
