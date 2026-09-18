// 장바구니. 담아 둔 상품을 고르고 수량을 바꾸거나 빼고 결제로 넘어간다.
// UI 시안 기준(cart_001, cart_001_선택, cart_001_삭제하기).
//
// 옵션변경은 2026-09-09 시안 수정에서 빠졌다. `cart_001_옵션변경` 프레임이 삭제되고
// 섹션에 "페이지 삭제 및 옵션변경 버튼 삭제" 메모가 붙었다 (#137).
//
// 상품 옵션 줄도 UI 시안에서 사라졌다. 와이어프레임은 이름 아래 옵션을 적었는데
// 시안은 이름 한 줄만 두고 말줄임한다 (#172).
//
// 내용은 `GET /carts`가 준다. 수량과 빼기는 서버에 남으므로 새로고침해도 유지된다 (#214).

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE } from "@/shared/config/app-message";
import { cn } from "@/shared/lib/utils";
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
import { Checkbox } from "@/shared/ui/checkbox";
import { DefinitionRow } from "@/shared/ui/definition-row/definition-row";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { EmptyBagIllustration } from "@/shared/ui/empty-state/illustrations/bag";
import { Icon } from "@/shared/ui/icon/icon";
import { Label } from "@/shared/ui/label";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { formatWon } from "@/shared/ui/price/price";
import { QuantityStepper } from "@/shared/ui/quantity-stepper/quantity-stepper";

import { cartItemKey, type CartItem } from "../api/cart";
import { useMutateCartItem } from "../api/use-mutate-cart-item";
import { useQueryCart } from "../api/use-query-cart";
import { CartSkeleton } from "./cart-skeleton";

// 응답에 `deliveryFee`가 없어 고정값을 유지한다. 백엔드에 확인을 요청해 뒀다 (#214)
const SHIPPING_FEE = 3000;

/**
 * 못 사는 까닭을 우리 문구로 바꾼다.
 *
 * 서버가 `DEAL_ENDED` 같은 코드로 주는데 그대로 내보내면 읽을 수 없다.
 * **명세에 나온 코드가 `DEAL_ENDED` 하나뿐이라 나머지는 기본 문구로 떨어진다.**
 */
const UNAVAILABLE_REASON: Record<string, string> = {
  DEAL_ENDED: "타임딜이 끝났어요",
};
const UNAVAILABLE_DEFAULT = "지금은 살 수 없어요";

export function CartView() {
  // 대기 표시 없음 — 첫 그림은 아래 CartSkeleton이 덮고, 수량 변경·삭제는 낙관적 갱신이라
  // 왕복을 기다리지 않는다. 스피너를 얹으면 이미 그려진 결과가 오히려 끊겨 보인다
  const { cart, error, isLoading } = useQueryCart();
  const { changeQuantity, remove } = useMutateCartItem();

  // 시안은 아무것도 고르지 않은 상태(0/3)로 시작한다
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [removeTarget, setRemoveTarget] = useState<CartItem | null>(null);

  const items = cart?.items ?? [];
  // 살 수 없는 줄은 고를 수 없다. 개수를 셀 때도 빼야 "전체선택"이 끝까지 차오른다
  const sellable = items.filter((item) => item.available);
  const checkedItems = sellable.filter((item) => checkedKeys.includes(cartItemKey(item)));
  const allChecked = sellable.length > 0 && checkedItems.length === sellable.length;

  // 서버가 준 `subtotal`은 수량을 방금 바꿨을 때 아직 옛 값이라 여기서 다시 센다
  const itemTotal = checkedItems.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
  // 담은 것이 없으면 배송비도 물리지 않는다.
  const total = itemTotal === 0 ? 0 : itemTotal + SHIPPING_FEE;

  const toggle = (key: string) =>
    setCheckedKeys((prev) => (prev.includes(key) ? prev.filter((v) => v !== key) : [...prev, key]));

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="장바구니" />

      <main className="flex flex-1 flex-col">
        {/* 뼈대는 눈으로만 읽히는 표시다. 스크린 리더에는 불러오는 중이라고 말로 알린다 */}
        {isLoading && (
          <div role="status" aria-live="polite">
            <span className="sr-only">장바구니를 불러오는 중</span>
            <div aria-hidden>
              <CartSkeleton />
            </div>
          </div>
        )}

        {/* 조회 실패는 토스트로 알리지 않는다(AppProviders 주석). 화면에서 무엇이 잘못됐는지 보여준다 */}
        {error && (
          <EmptyState role="alert" className="flex-1" {...APP_MESSAGE[toAppMessageCode(error)]} />
        )}

        {/* 버튼은 시안이 92×40이다. shadcn `sm`은 h-7(28px)이라 시안보다 작아 높이를 맞춘다 */}
        {!isLoading && !error && items.length === 0 && (
          <EmptyState
            icon={<EmptyBagIllustration />}
            title="장바구니가 비어 있어요"
            description="건강한 사료와 간식을 천천히 골라볼까요?"
            action={
              <Button variant="outline" size="sm" className="min-h-10 px-3" asChild>
                <Link href="/search">상품 둘러보기</Link>
              </Button>
            }
            className="flex-1"
          />
        )}

        {!isLoading && !error && items.length > 0 && (
          <>
            <div className="flex items-center gap-2 px-5 py-3">
              <Checkbox
                id="cart-all"
                className="size-6 rounded-md"
                checked={allChecked}
                disabled={sellable.length === 0}
                onCheckedChange={(checked) =>
                  setCheckedKeys(checked ? sellable.map(cartItemKey) : [])
                }
              />
              {/* 시안이 고른 개수를 함께 보여준다. 몇 개를 담았고 몇 개를 고르는 중인지 한눈에 든다 */}
              <Label htmlFor="cart-all" className="text-body-medium-16 text-foreground">
                전체선택 ({checkedItems.length}/{sellable.length})
              </Label>
            </div>

            <ul className="flex flex-col gap-2">
              {items.map((item) => {
                const key = cartItemKey(item);
                const reason =
                  (item.unavailableReason && UNAVAILABLE_REASON[item.unavailableReason]) ??
                  UNAVAILABLE_DEFAULT;
                // 살 수 없는 줄은 이름이 오지 않는다. **지어내지 않고 까닭을 그 자리에 둔다** —
                // 없는 이름을 만들면 사용자는 그것을 상품명으로 읽는다
                const name = item.productName ?? reason;

                return (
                  <li key={key} className="flex items-center gap-2 px-5 py-3">
                    {/* 시안은 체크박스를 목록 왼쪽이 아니라 사진 위에 얹는다.
                        사진과 이름이 붙어 있어야 무엇을 고르는지가 바로 읽힌다 */}
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-surface-disable">
                      <Checkbox
                        className="absolute top-1 left-1 z-10 size-4 rounded-sm"
                        checked={checkedKeys.includes(key)}
                        disabled={!item.available}
                        onCheckedChange={() => toggle(key)}
                        aria-label={`${name} 고르기`}
                      />
                      {item.thumbnailUrl && (
                        <Image
                          src={item.thumbnailUrl}
                          alt=""
                          width={80}
                          height={80}
                          className="size-full object-cover"
                        />
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 self-stretch">
                      <div className="flex items-start justify-between gap-1">
                        {/* 시안이 한 줄로 자른다. 목록에서는 무엇인지 알아볼 만큼만 보이면 된다 */}
                        <p
                          className={cn(
                            "truncate text-title-bold-16",
                            item.available ? "text-foreground" : "text-text-body-unselect",
                          )}
                        >
                          {name}
                        </p>
                        <button
                          type="button"
                          aria-label={`${name} 빼기`}
                          onClick={() => setRemoveTarget(item)}
                          className="shrink-0 text-icon-stroke-tertiary"
                        >
                          <Icon name="cancel" />
                        </button>
                      </div>

                      {/* 살 수 없는 줄은 금액도 수량도 뜻이 없어 아랫줄을 비운다. 까닭은 이름 자리가
                          이미 들고 있고, 빼기는 남겨 둔다 — 지울 길이 없으면 장바구니에 계속 걸린다.
                          **이 상태는 시안(cart_001)에 없어 새로 그리지 않고 있는 것만 썼다** (#214) */}
                      {item.available && (
                        <div className="flex items-end justify-between gap-2">
                          {/* 시안이 숫자와 단위의 굵기를 달리한다. 금액이 먼저 읽히게 하려는 것이다 */}
                          <p className="text-foreground">
                            <span className="text-title-bold-16">
                              {(item.price ?? 0).toLocaleString("ko-KR")}
                            </span>
                            <span className="text-body-medium-16">원</span>
                          </p>
                          <QuantityStepper
                            label={`${name} 수량`}
                            value={item.quantity}
                            // 서버는 바뀐 값이 아니라 증감을 받는다
                            onChange={(next) => changeQuantity(item, next - item.quantity)}
                          />
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <section className="mt-auto flex flex-col gap-3 p-5">
              {/* 시안은 고른 것이 없으면 금액 줄을 아예 보여주지 않는다.
                  0원만 늘어놓아도 알려주는 것이 없고, 고르라는 신호가 흐려진다 */}
              {checkedItems.length > 0 && (
                <dl className="flex flex-col border-t border-border pt-4">
                  <DefinitionRow
                    term={<span className="text-body-medium-16 text-foreground">결제금액</span>}
                    description={
                      <span className="text-title-bold-16 text-foreground">{formatWon(total)}</span>
                    }
                    alignEnd
                    className="min-h-9 px-0 py-1"
                  />
                  <DefinitionRow
                    term="판매가격"
                    description={formatWon(itemTotal)}
                    alignEnd
                    className="min-h-9 px-0 py-1"
                  />
                  <DefinitionRow
                    term="배송비"
                    description={formatWon(SHIPPING_FEE)}
                    alignEnd
                    className="min-h-9 px-0 py-1"
                  />
                </dl>
              )}

              {/* 고른 것이 없으면 결제로 넘어갈 수 없다 */}
              {checkedItems.length > 0 ? (
                <Button asChild className={cn("h-11 w-full rounded-lg", "text-label-bold-16")}>
                  <Link href="/payment">결제하기</Link>
                </Button>
              ) : (
                <Button disabled className={cn("h-11 w-full rounded-lg", "text-label-bold-16")}>
                  결제하기
                </Button>
              )}
            </section>
          </>
        )}
      </main>

      {/* 빼기는 되돌릴 수 없어 확인 창으로 막는다 */}
      <AlertDialog
        open={removeTarget !== null}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <AlertDialogContent>
          {/* 시안(cart_001_삭제하기)은 제목과 설명에 같은 문구를 넣어 두었다. 더미로 보여
              기존 문구를 유지하고 PD팀에 확인을 요청했다 */}
          <AlertDialogTitle>장바구니에서 이 상품을 뺄까요?</AlertDialogTitle>
          <AlertDialogDescription>나중에 언제든지 다시 담을 수 있어요</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">닫기</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-11"
              onClick={() => removeTarget && remove(removeTarget)}
            >
              상품 빼기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
