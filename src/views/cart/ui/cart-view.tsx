// 장바구니. 담아 둔 상품을 고르고 수량을 바꾸거나 빼고 결제로 넘어간다.
// 와이어프레임 기준(cart_001, cart_001_옵션변경, cart_001_삭제하기)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import Link from "next/link";
import { useState } from "react";
import { IoClose, IoImageOutline } from "react-icons/io5";

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
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Label } from "@/shared/ui/label";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Price, formatWon } from "@/shared/ui/price/price";
import { QuantityStepper } from "@/shared/ui/quantity-stepper/quantity-stepper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

type CartItem = {
  id: string;
  name: string;
  option: string;
  price: number;
  originalPrice?: number;
  quantity: number;
};

/** API 연동 전까지 화면 확인용 값 */
const MOCK_ITEMS: CartItem[] = [
  { id: "1", name: "상품명", option: "상품 옵션 1", price: 45000, quantity: 1 },
  {
    id: "2",
    name: "상품명",
    option: "상품 옵션 2",
    price: 26000,
    originalPrice: 52000,
    quantity: 1,
  },
  {
    id: "3",
    name: "상품명",
    option: "상품 옵션 1",
    price: 19000,
    originalPrice: 38000,
    quantity: 1,
  },
];

const OPTIONS = ["상품 옵션 1", "상품 옵션 2", "상품 옵션 3"];
const SHIPPING_FEE = 3000;

export function CartView() {
  const [items, setItems] = useState(MOCK_ITEMS);
  const [checkedIds, setCheckedIds] = useState(MOCK_ITEMS.map((item) => item.id));
  const [optionTarget, setOptionTarget] = useState<CartItem | null>(null);
  const [removeTarget, setRemoveTarget] = useState<CartItem | null>(null);
  const [pickedOption, setPickedOption] = useState(OPTIONS[0]);

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
            <div className="flex items-center gap-2 px-4 py-3">
              <Checkbox
                id="cart-all"
                checked={allChecked}
                onCheckedChange={(checked) =>
                  setCheckedIds(checked ? items.map((item) => item.id) : [])
                }
              />
              <Label htmlFor="cart-all" className="flex min-h-11 flex-1 items-center text-sm">
                전체선택
              </Label>
            </div>

            <ul className="flex flex-col">
              {items.map((item) => (
                <li key={item.id} className="flex flex-col gap-3 border-t border-border p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={checkedIds.includes(item.id)}
                      onCheckedChange={() => toggle(item.id)}
                      aria-label={item.name + " 고르기"}
                      className="mt-1"
                    />
                    <span
                      aria-hidden
                      className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                    >
                      <IoImageOutline className="size-7" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                      <span className="text-xs text-muted-foreground">{item.option}</span>
                    </span>
                    <button
                      type="button"
                      aria-label={item.name + " 빼기"}
                      onClick={() => setRemoveTarget(item)}
                      className="flex size-11 shrink-0 items-center justify-center text-muted-foreground"
                    >
                      <IoClose aria-hidden className="size-5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Price amount={item.price} originalAmount={item.originalPrice} />
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="min-h-11"
                        onClick={() => {
                          setOptionTarget(item);
                          setPickedOption(item.option);
                        }}
                      >
                        옵션변경
                      </Button>
                      <QuantityStepper
                        label={item.name + " 수량"}
                        value={item.quantity}
                        onChange={(next) => setQuantity(item.id, next)}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <section className="mt-2 flex flex-col border-t border-border p-4">
              <dl className="flex flex-col">
                <DefinitionRow
                  term={<span className="font-medium text-foreground">결제금액</span>}
                  description={<span className="text-base font-bold">{formatWon(total)}</span>}
                  alignEnd
                  className="min-h-9 px-0 py-1"
                />
                {/* 시안(`paym_001`·`paym_002`·`cart_001`) 세 화면 모두 이 자리를 "상품 옵션"이라 부른다.
                금액이 들어가는 줄이라 "상품 금액"이 맞아 보이지만, 화면에 그대로 나가는 문구라
                임의로 바꾸지 않고 PD팀에 확인을 요청해 뒀다. */}
                <DefinitionRow
                  term="상품 옵션"
                  description={formatWon(itemTotal)}
                  alignEnd
                  className="min-h-9 px-0 py-1"
                />
                <DefinitionRow
                  term="배송비"
                  description={formatWon(itemTotal === 0 ? 0 : SHIPPING_FEE)}
                  alignEnd
                  className="min-h-9 px-0 py-1"
                />
              </dl>

              {/* 고른 것이 없으면 결제로 넘어갈 수 없다 */}
              {checkedItems.length > 0 ? (
                <Button className="mt-3 min-h-11 w-full" asChild>
                  <Link href="/payment">결제하기</Link>
                </Button>
              ) : (
                <Button className="mt-3 min-h-11 w-full" disabled>
                  결제하기
                </Button>
              )}
            </section>
          </>
        )}
      </main>

      {/* 옵션 바꾸기 */}
      <Drawer open={optionTarget !== null} onOpenChange={(open) => !open && setOptionTarget(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-left">{optionTarget?.name}</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-4 px-4 pb-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cart-option" className="text-sm text-muted-foreground">
                상품 옵션
              </Label>
              <Select value={pickedOption} onValueChange={setPickedOption}>
                <SelectTrigger id="cart-option" className="min-h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="min-h-11 flex-1"
                onClick={() => setOptionTarget(null)}
              >
                닫기
              </Button>
              <Button
                className="min-h-11 flex-1"
                onClick={() => {
                  if (optionTarget) {
                    setItems((prev) =>
                      prev.map((item) =>
                        item.id === optionTarget.id ? { ...item, option: pickedOption } : item,
                      ),
                    );
                  }
                  setOptionTarget(null);
                }}
              >
                옵션 바꾸기
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* 빼기는 되돌릴 수 없어 확인 창으로 막는다 */}
      <AlertDialog
        open={removeTarget !== null}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>장바구니에서 이 상품을 뺄까요?</AlertDialogTitle>
          <AlertDialogDescription>나중에 언제든지 다시 담을 수 있어요</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">취소</AlertDialogCancel>
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
