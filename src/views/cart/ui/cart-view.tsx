// 장바구니. 담아 둔 상품을 고르고 수량을 바꾸거나 빼고 결제로 넘어간다.
// UI 시안 기준(cart_001, cart_001_선택, cart_001_삭제하기).
//
// 옵션변경은 2026-09-09 시안 수정에서 빠졌다. `cart_001_옵션변경` 프레임이 삭제되고
// 섹션에 "페이지 삭제 및 옵션변경 버튼 삭제" 메모가 붙었다 (#137).
//
// 상품 옵션 줄도 UI 시안에서 사라졌다. 와이어프레임은 이름 아래 옵션을 적었는데
// 시안은 이름 한 줄만 두고 말줄임한다 (#172).

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

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
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { formatWon } from "@/shared/ui/price/price";
import { QuantityStepper } from "@/shared/ui/quantity-stepper/quantity-stepper";

import type { CartItem } from "../api/cart";

const SHIPPING_FEE = 3000;

type CartViewProps = {
  /** 담아 둔 상품. 서버가 준 것을 그대로 그린다 */
  items: CartItem[];
};

export function CartView({ items: initialItems }: CartViewProps) {
  const [items, setItems] = useState(initialItems);
  // 시안은 아무것도 고르지 않은 상태(0/3)로 시작한다
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [removeTarget, setRemoveTarget] = useState<CartItem | null>(null);

  const allChecked = items.length > 0 && checkedIds.length === items.length;
  const checkedItems = items.filter((item) => checkedIds.includes(item.id));
  const itemTotal = checkedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // 담은 것이 없으면 배송비도 물리지 않는다.
  const total = itemTotal === 0 ? 0 : itemTotal + SHIPPING_FEE;

  const toggle = (id: string) =>
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));

  const setQuantity = (id: string, quantity: number) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)));

  const remove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setCheckedIds((prev) => prev.filter((v) => v !== id));
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="장바구니" />

      <main className="flex flex-1 flex-col">
        {items.length === 0 ? (
          <EmptyState
            title="장바구니가 비었어요"
            description="마음에 드는 상품을 담아보세요."
            className="flex-1"
          />
        ) : (
          <>
            <div className="flex items-center gap-2 px-5 py-3">
              <Checkbox
                id="cart-all"
                className="size-6 rounded-md"
                checked={allChecked}
                onCheckedChange={(checked) =>
                  setCheckedIds(checked ? items.map((item) => item.id) : [])
                }
              />
              {/* 시안이 고른 개수를 함께 보여준다. 몇 개를 담았고 몇 개를 고르는 중인지 한눈에 든다.
                  shadcn Label을 쓰지 않는 이유는 그 기본값(text-sm·leading-none)이
                  타이포 토큰과 같은 자리를 다투는데 tailwind-merge가 커스텀 토큰을 몰라 안 걷히기 때문이다 */}
              <label htmlFor="cart-all" className="text-body-medium-16 text-foreground select-none">
                전체선택 ({checkedIds.length}/{items.length})
              </label>
            </div>

            <ul className="flex flex-col gap-2">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-2 px-5 py-3">
                  {/* 시안은 체크박스를 목록 왼쪽이 아니라 사진 위에 얹는다.
                      사진과 이름이 붙어 있어야 무엇을 고르는지가 바로 읽힌다 */}
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-surface-disable">
                    <Checkbox
                      className="absolute top-1 left-1 z-10 size-4 rounded-sm"
                      checked={checkedIds.includes(item.id)}
                      onCheckedChange={() => toggle(item.id)}
                      aria-label={`${item.name} 고르기`}
                    />
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
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
                      <p className="truncate text-title-bold-16 text-foreground">{item.name}</p>
                      <button
                        type="button"
                        aria-label={`${item.name} 빼기`}
                        onClick={() => setRemoveTarget(item)}
                        className="shrink-0 text-icon-stroke-tertiary"
                      >
                        <Icon name="cancel" />
                      </button>
                    </div>

                    <div className="flex items-end justify-between gap-2">
                      {/* 시안이 숫자와 단위의 굵기를 달리한다. 금액이 먼저 읽히게 하려는 것이다 */}
                      <p className="text-foreground">
                        <span className="text-title-bold-16">
                          {item.price.toLocaleString("ko-KR")}
                        </span>
                        <span className="text-body-medium-16">원</span>
                      </p>
                      <QuantityStepper
                        label={`${item.name} 수량`}
                        value={item.quantity}
                        onChange={(next) => setQuantity(item.id, next)}
                      />
                    </div>
                  </div>
                </li>
              ))}
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
              onClick={() => removeTarget && remove(removeTarget.id)}
            >
              상품 빼기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
