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
// 고른 줄은 이 브라우저에 남는다. 결제 화면에 갔다 오거나 탭을 닫았다 열어도 그대로다 (#563).

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { cartItemKey, useMutateCartItem, useQueryCart, type CartItem } from "@/entities/cart";
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
import { Icon } from "@/shared/ui/icon/icon";
import { Label } from "@/shared/ui/label";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { formatWon } from "@/shared/ui/price/price";
import { QuantityStepper } from "@/shared/ui/quantity-stepper/quantity-stepper";

import { useCartSelectionStore } from "../model/cart-selection-store";
import { CartItemLink } from "./cart-item-link";
import { CartSkeleton } from "./cart-skeleton";

// 응답에 `deliveryFee`가 없어 고정값을 쓴다. 백엔드가 MVP에서는 배송비를 고정한다고 답했다(2026-09-21) (#214)
const SHIPPING_FEE = 3000;

/**
 * 못 사는 까닭을 우리 문구로 바꾼다.
 *
 * 서버가 `DEAL_ENDED` 같은 코드로 주는데 그대로 내보내면 읽을 수 없다.
 *
 * **다섯을 소스에서 확인했다** — `CartService`가 `NOT_FOUND`·`TEMPORARILY_UNAVAILABLE`·
 * `DEAL_ENDED`를 직접 만들고, 상품이 있는데 못 사는 경우는 `ProductAvailability`
 * (`OUT_OF_STOCK`·`DISCONTINUED`)와 `TimeDealItemAvailability`(`OUT_OF_STOCK`·`DEAL_ENDED`)가
 * 그대로 넘어온다. 명세에는 하나만 적혀 있었다 (#318).
 */
const UNAVAILABLE_REASON: Record<string, string> = {
  DEAL_ENDED: "타임딜이 끝났어요",
  OUT_OF_STOCK: "품절됐어요",
  DISCONTINUED: "판매가 끝났어요",
  NOT_FOUND: "더 이상 없는 상품이에요",
  // 상품 정보를 못 받아 온 경우다. 다시 열면 돌아올 수 있다
  TEMPORARILY_UNAVAILABLE: "지금은 확인할 수 없어요",
};
const UNAVAILABLE_DEFAULT = "지금은 살 수 없어요";

export function CartView() {
  // 대기 표시 없음 — 첫 그림은 아래 CartSkeleton이 덮고, 수량 변경·삭제는 낙관적 갱신이라
  // 왕복을 기다리지 않는다. 스피너를 얹으면 이미 그려진 결과가 오히려 끊겨 보인다
  const { cart, error, isLoading } = useQueryCart();
  const { changeQuantity, remove } = useMutateCartItem();

  // **고른 줄은 화면 상태가 아니라 브라우저에 남긴다.** `useState`로 들던 동안 결제 화면에 갔다
  // 뒤로 오거나 탭을 닫았다 열면 다시 마운트되며 `0/9`로 풀렸다 (#563). 처음 담은 줄은 고르지 않은
  // 상태다 — 시안이 아무것도 고르지 않은 상태(0/3)로 시작한다
  const savedKeys = useCartSelectionStore((state) => state.keys);
  const setCheckedKeys = useCartSelectionStore((state) => state.setKeys);
  const [removeTarget, setRemoveTarget] = useState<CartItem | null>(null);

  const items = cart?.items ?? [];
  // 살 수 없는 줄은 고를 수 없다. 개수를 셀 때도 빼야 "전체선택"이 끝까지 차오른다
  const sellable = items.filter((item) => item.available);
  // **남겨 둔 키는 지금 살 수 있는 줄과 겹치는 것만 쓴다.** 그사이 빠진 줄이나 품절된 줄의 키가 남아
  // 있을 수 있다. 고칠 때는 이 목록에서 만들어 저장하므로 남은 키가 걷힌다
  const checkedItems = sellable.filter((item) => savedKeys.includes(cartItemKey(item)));
  const checkedKeys = checkedItems.map(cartItemKey);
  const allChecked = sellable.length > 0 && checkedItems.length === sellable.length;

  // 줄 합계는 `price × quantity`로 센다. 수량을 먼저 그리는 낙관적 갱신도 같은 식으로 맞춘다 (#427)
  const itemTotal = checkedItems.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
  // 담은 것이 없으면 배송비도 물리지 않는다.
  const total = itemTotal === 0 ? 0 : itemTotal + SHIPPING_FEE;

  const toggle = (key: string) =>
    setCheckedKeys(
      checkedKeys.includes(key) ? checkedKeys.filter((v) => v !== key) : [...checkedKeys, key],
    );

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

        {/* **비었어도 "전체선택 (0/0)"과 "결제하기"를 남긴다.** 상품을 담으면 무엇을 할 수 있는지
            미리 보이게 PD팀이 일부러 둔 것이다(빈 장바구니 2022:157279, 2026-09-28 #448). 둘 다
            고를 것이 없어 잠긴다 */}
        {!isLoading && !error && (
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

            {/* 버튼은 시안이 92×40이다. shadcn `sm`은 h-7(28px)이라 시안보다 작아 높이를 맞춘다.
                **메인으로 보낸다.** 검색 화면으로 보내던 것을 PM QA가 실패로 봤다. 기대 동작이 메인
                이동이다 (No.7, #563) */}
            {items.length === 0 ? (
              <EmptyState
                icon={<Icon name="bag" />}
                title="장바구니가 비어 있어요"
                description="건강한 사료와 간식을 천천히 골라볼까요?"
                action={
                  <Button variant="outline" size="sm" className="min-h-10 px-3" asChild>
                    <Link href="/">상품 둘러보기</Link>
                  </Button>
                }
                className="flex-1"
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {items.map((item) => {
                  const key = cartItemKey(item);
                  // **못 사는 줄에도 이름이 올 수 있다.** 서버 `unavailableWithInfo`가 상품은
                  // 있는데 못 사는 경우(`OUT_OF_STOCK`·`DISCONTINUED`·`DEAL_ENDED`) 이름·사진·
                  // 가격을 그대로 준다. 이름을 까닭으로 덮어쓰던 동안 그 셋은 까닭이 아예 보이지
                  // 않아, 살 수 없는 줄이 멀쩡한 상품처럼 보였다 (#318)
                  const reason = item.available
                    ? null
                    : ((item.unavailableReason && UNAVAILABLE_REASON[item.unavailableReason]) ??
                      UNAVAILABLE_DEFAULT);
                  // 이름이 안 오는 경우(`NOT_FOUND`·`TEMPORARILY_UNAVAILABLE`)에만 까닭이 이름
                  // 자리에 선다. 없는 이름을 지어내면 사용자는 그것을 상품명으로 읽는다
                  const name = item.productName ?? reason ?? UNAVAILABLE_DEFAULT;
                  // 할인 줄일 때만 정가를 든다. 할인율은 서버가 계산해 준 값을 쓰고(`discountRate`) 화면에서
                  // 두 금액으로 다시 만들지 않는다 — 할인이 없는 줄도 정가가 판매가와 같은 값으로 온다
                  const originalPrice =
                    item.discountRate !== null && item.discountRate > 0 ? item.originalPrice : null;

                  return (
                    // `relative`는 이름 링크가 줄 전체를 덮는 기준이다(`CartItemLink`). 줄 안의 다른
                    // 버튼은 그 덮개 위로 올린다(`z-10`)
                    <li key={key} className="relative flex items-center gap-2 px-5 py-3">
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
                        {/* **살 수 없는 줄은 사진을 흐린다.** 품절 상품 상세의 대표 사진(1702:19206)과
                            같은 50%다. 흐림은 사진에만 건다 — 감싼 칸에 걸면 쌓임 맥락이 생겨 체크박스가
                            줄을 덮는 링크 아래로 깔린다 (No.21, #563) */}
                        {item.thumbnailUrl && (
                          <Image
                            src={item.thumbnailUrl}
                            alt=""
                            width={80}
                            height={80}
                            className={cn(
                              "size-full object-cover",
                              !item.available && "opacity-50",
                            )}
                          />
                        )}
                        {/* 품절이면 사진에 표시를 얹는다. 타임딜 목록의 품절 배지(1905-32428)와 같은 색이다.
                            까닭은 이름 아래 글로 이미 읽히므로 스크린 리더에는 한 번만 들리게 감춘다 */}
                        {item.unavailableReason === "OUT_OF_STOCK" && (
                          <span
                            aria-hidden
                            className="absolute bottom-1 left-1 rounded bg-primary px-1 py-0.5 text-label-medium-12 text-primary-foreground"
                          >
                            품절
                          </span>
                        )}
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 self-stretch">
                        <div className="flex items-start justify-between gap-1">
                          {/* 시안이 한 줄로 자른다. 목록에서는 무엇인지 알아볼 만큼만 보이면 된다.
                           **누르면 상세로 간다** — 이름뿐 아니라 줄 어디를 눌러도 간다 (No.9, #563) */}
                          <CartItemLink
                            item={item}
                            name={name}
                            className={cn(
                              "truncate text-title-bold-16",
                              item.available ? "text-foreground" : "text-text-body-unselect",
                            )}
                          />
                          <button
                            type="button"
                            aria-label={`${name} 빼기`}
                            onClick={() => setRemoveTarget(item)}
                            className="relative z-10 shrink-0 text-icon-stroke-tertiary"
                          >
                            <Icon name="cancel" />
                          </button>
                        </div>

                        {/* 살 수 없는 줄은 금액도 수량도 뜻이 없어 그 자리에 까닭을 둔다. 빼기는
                          남겨 둔다 — 지울 길이 없으면 장바구니에 계속 걸린다.
                          **이 상태는 시안(cart_001)에 없어 새로 그리지 않고 있는 것만 썼다** (#214) */}
                        {!item.available && item.productName && (
                          <p className="text-body-medium-14 text-text-body-unselect">{reason}</p>
                        )}

                        {item.available && (
                          <div className="flex items-end justify-between gap-2">
                            {/* **할인 상품이면 정가 취소선과 할인율을 함께 둔다** (No.10, #563). 시안
                                (cart_001)은 할인 없는 상품만 그려, 상품 카드(`product-grid-card`)의 모양
                                — 정가를 위에, 할인율을 판매가 왼쪽에 — 을 따른다 */}
                            <div className="flex flex-col">
                              {originalPrice !== null && (
                                <p className="text-label-regular-13 text-text-body-tertiary line-through">
                                  {formatWon(originalPrice)}
                                </p>
                              )}
                              <p className="flex items-center gap-1 text-foreground">
                                {originalPrice !== null && (
                                  <span className="text-label-regular-13 font-bold text-text-body-danger-default">
                                    {item.discountRate}%
                                  </span>
                                )}
                                {/* 시안이 숫자와 단위의 굵기를 달리한다. 금액이 먼저 읽히게 하려는 것이다 */}
                                <span>
                                  <span className="text-title-bold-16">
                                    {(item.price ?? 0).toLocaleString("ko-KR")}
                                  </span>
                                  <span className="text-body-medium-16">원</span>
                                </span>
                              </p>
                            </div>
                            <QuantityStepper
                              label={`${name} 수량`}
                              value={item.quantity}
                              // 서버는 바뀐 값이 아니라 증감을 받는다
                              onChange={(next) => changeQuantity(item, next - item.quantity)}
                              className="relative z-10"
                            />
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

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

              {/* 고른 것이 없으면 결제로 넘어갈 수 없다.
                  **고른 줄을 쿼리로 넘긴다.** 넘기지 않으면 결제 화면이 장바구니 전체를 세어
                  고르지 않은 것까지 결제된다 (#255) */}
              {checkedItems.length > 0 ? (
                <Button asChild className={cn("h-11 w-full rounded-lg", "text-label-bold-16")}>
                  <Link href={`/payment?items=${checkedItems.map(cartItemKey).join(",")}`}>
                    결제하기
                  </Link>
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
            {/* 뺀 줄은 고른 목록에서도 뺀다. 남겨 두면 같은 상품을 다시 담았을 때 골라진 채로 보인다 */}
            <AlertDialogAction
              className="min-h-11"
              onClick={() => {
                if (!removeTarget) return;
                remove(removeTarget);
                setCheckedKeys(checkedKeys.filter((v) => v !== cartItemKey(removeTarget)));
              }}
            >
              상품 빼기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
