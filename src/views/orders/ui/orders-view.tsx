// 주문·배송 확인. 주문별 상태에 따라 할 수 있는 행동이 달라진다.
// UI 시안 기준(mypa_061 287:8422, mypa_061_구매확정 287:8634, mypa_061_주문취소 302:9385)이다.

"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import {
  OrderProductRow,
  OrderStatusBadge,
  toOrderStatus,
  useMutateOrder,
  useQueryOrders,
  type OrderSummary,
} from "@/entities/order";
import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE } from "@/shared/config/app-message";
import { formatDisplayDate } from "@/shared/lib/date/display-date";
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
import { Icon } from "@/shared/ui/icon/icon";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { PageHeader } from "@/shared/ui/page-header/page-header";

import { DeliveryTrackingDialog } from "./delivery-tracking-dialog";
import { OrdersSkeleton } from "./orders-skeleton";
import { useLoadMore } from "./use-load-more";

/** 시안의 목록 행동 버튼. 36px에 label/medium_14, 두 개면 같은 폭으로 나눠 갖는다 (287:8551) */
const ACTION_CLASS =
  "h-9 flex-1 bg-surface-tertiary text-label-medium-14 text-foreground hover:bg-surface-tertiary/80";

// 시안의 시트 버튼. 48px에 label/bold_16 (287:8795).
const SHEET_ACTION_CLASS = "h-12 flex-1 text-label-bold-16";

/**
 * 대표로 보일 상품 한 줄을 고른다.
 *
 * **목록은 주문 하나를 한 줄로 보여준다.** 상품이 여럿이면 첫 줄만 세우고 나머지는 수를 붙여
 * 알린다. 전부 보려면 상세로 들어간다.
 */
function toProductRow(order: OrderSummary) {
  const [first, ...rest] = order.items;
  if (!first) {
    return null;
  }

  // 시안의 둘째 줄은 "상품 옵션" 자리인데 옵션이라는 데이터가 없다. PD팀이 "옵션은 빼고
  // 수량은 있어도 괜찮다"고 확인해 줘서 몇 개를 샀는지 넣는다 (#297)
  const caption =
    rest.length > 0 ? `${first.quantity}개 외 ${rest.length}건` : `${first.quantity}개`;

  return { name: first.productName, caption, imageUrl: first.thumbnailUrl };
}

export function OrdersView() {
  const { orders, error, isLoading, hasNext, loadNext, isLoadingNext, nextError } =
    useQueryOrders();
  const { confirm, cancel, confirmingId, cancelingId } = useMutateOrder();

  // 목록 끝이 보이면 다음 쪽을 가져온다. 가져오는 중이거나 방금 실패했으면 멈춘다 —
  // 실패한 채로 계속 보고 있으면 같은 요청이 끝없이 다시 나간다
  const loadMoreRef = useLoadMore(loadNext, hasNext && !isLoadingNext && !nextError);

  // 어느 주문을 확정·취소할지 묻는 중인지. 서버에 보내기 전 단계라 화면이 든다
  const [askingConfirmId, setAskingConfirmId] = useState<number | null>(null);
  const [askingCancelId, setAskingCancelId] = useState<number | null>(null);
  const [trackingOpen, setTrackingOpen] = useState(false);

  const list = orders ?? [];
  const asking = list.find((order) => order.orderId === askingConfirmId) ?? null;
  const askingRow = asking ? toProductRow(asking) : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="주문·배송 확인" />

      <main className="flex flex-1 flex-col gap-4 px-5 pt-3 pb-8">
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

        {!isLoading &&
          list.map((order) => {
            const status = toOrderStatus(order.orderStatus);
            const row = toProductRow(order);
            const orderedAt = formatDisplayDate(order.orderedAt);

            return (
              <article key={order.orderId} className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  {/* 읽을 수 없는 값이면 줄을 비운다. 지어낸 날짜를 보이느니 낫다 */}
                  {orderedAt && (
                    <p className="text-body-regular-13 text-text-body-secondary">
                      주문 일자 {orderedAt}
                    </p>
                  )}

                  {row && (
                    <OrderProductRow
                      name={row.name}
                      option={row.caption}
                      imageUrl={row.imageUrl}
                      amount={order.totalAmount}
                      nameTrailing={
                        // 모르는 상태 값이면 뱃지를 붙이지 않는다. 명세에 없는 값을 추측으로
                        // 옮기면 엉뚱한 단계가 확정처럼 보인다 (entities/order/model/order-status.ts)
                        status ? <OrderStatusBadge status={status} className="shrink-0" /> : null
                      }
                    />
                  )}
                </div>

                <div className="flex gap-2">
                  {/* 시안은 활성이지만 택배사 연동 전이라 갈 곳이 없다. 준비중임을 알린다 */}
                  {status === "shipping" && (
                    <Button
                      variant="secondary"
                      className={ACTION_CLASS}
                      onClick={() => setTrackingOpen(true)}
                    >
                      배송 위치 보기
                    </Button>
                  )}
                  {/* 배송이 시작되기 전까지만 취소할 수 있다 (mypa_061). 백엔드 전이 규칙도
                      `PAID`·`PREPARING`에서만 취소를 허용하는데, 화면은 그 둘을 한 단계로 묶는다 */}
                  {status === "preparing" && (
                    <Button
                      variant="secondary"
                      className={ACTION_CLASS}
                      onClick={() => setAskingCancelId(order.orderId)}
                    >
                      주문 취소
                    </Button>
                  )}
                  {status === "delivered" && (
                    <Button
                      variant="secondary"
                      className={ACTION_CLASS}
                      onClick={() => setAskingConfirmId(order.orderId)}
                    >
                      구매 확정하기
                    </Button>
                  )}
                  <Button variant="secondary" className={ACTION_CLASS} asChild>
                    <Link href={`/mypage/orders/${order.orderId}`}>자세히 보기</Link>
                  </Button>
                </div>
              </article>
            );
          })}

        {/* 이 줄이 화면에 들어오면 다음 쪽을 부른다. 보이는 것은 없어 높이만 1px이다 */}
        {hasNext && !nextError && <div ref={loadMoreRef} aria-hidden className="h-px" />}
        {isLoadingNext && <OrdersSkeleton count={1} />}

        {/* 다음 쪽만 실패한 경우다. 저절로 다시 부르면 같은 실패가 되풀이되므로 사용자가 고른다 */}
        {nextError && (
          <Button variant="secondary" className={ACTION_CLASS} onClick={() => loadNext()}>
            주문을 더 불러오지 못했어요. 다시 시도
          </Button>
        )}
      </main>

      {/* 구매 확정은 되돌릴 수 없지만 무엇을 확정하는지 함께 보여야 해서 시트로 연다.
          시안의 카드에는 손잡이가 없다 */}
      <BottomSheet
        open={asking !== null}
        // 보내는 중에는 닫히지 않는다. 바깥을 눌러 닫으면 어느 주문을 확정하는지 잃은 채
        // 요청만 남아, 끝났을 때 무엇이 확정됐는지 알 수 없다 (#293 리뷰)
        onOpenChange={(open) => {
          if (!open && confirmingId === null) {
            setAskingConfirmId(null);
          }
        }}
        showHandle={false}
        className="gap-5 p-4"
      >
        <DrawerHeader className="gap-1 p-0">
          <DrawerTitle className="text-left text-title-bold-16 text-foreground">
            무사히 잘 도착했나요?
          </DrawerTitle>
          <DrawerDescription className="text-left text-body-medium-14 text-text-body-secondary">
            구매 확정을 할 수 있어요!
          </DrawerDescription>
        </DrawerHeader>

        {askingRow && (
          <OrderProductRow
            name={askingRow.name}
            option={askingRow.caption}
            imageUrl={askingRow.imageUrl}
            amount={asking?.totalAmount ?? 0}
          />
        )}

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className={`${SHEET_ACTION_CLASS} bg-surface-tertiary text-foreground hover:bg-surface-tertiary/80`}
            disabled={confirmingId !== null}
            onClick={() => setAskingConfirmId(null)}
          >
            나중에 할게요
          </Button>
          <Button
            className={SHEET_ACTION_CLASS}
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
          // Escape는 `onOpenChange`를 거치지 않고 바로 닫는 경로라 따로 막는다
          onEscapeKeyDown={(event) => {
            if (cancelingId !== null) {
              event.preventDefault();
            }
          }}
        >
          <AlertDialogTitle>주문을 취소할까요?</AlertDialogTitle>
          <AlertDialogDescription>결제하신 금액은 안전하게 환불 처리돼요.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11" disabled={cancelingId !== null}>
              닫기
            </AlertDialogCancel>
            <AlertDialogAction
              className="min-h-11"
              disabled={cancelingId !== null}
              // 확인 창은 누르면 닫히는 것이 기본이라, 서버가 끝날 때까지 열어 두려면 막아야 한다
              onClick={async (event) => {
                event.preventDefault();
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
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeliveryTrackingDialog open={trackingOpen} onOpenChange={setTrackingOpen} />
    </div>
  );
}
