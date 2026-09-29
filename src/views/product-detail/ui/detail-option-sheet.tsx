// 상품 상세에서 수량을 고른 뒤 장바구니에 담거나 바로 구매하는 시트.
// UI 시안 기준(1702-16392의 옵션 선택 시트)이다.
//
// **바로 구매도 이 시트를 거친다** (#520). 시안에는 바로 구매가 어디로 가는지 연결이 없고 따로 된
// 시트도 없다. 몇 개 살지 고를 자리가 결제 화면에 없어, 장바구니와 같은 시트에서 수량을 고르고
// 버튼 글자만 바꾼다(PD 확인 거리).
//
// **고를 옵션은 없다.** 상품 옵션은 없는 것으로 합의했고(2026-09-14) 시안에서도
// 옵션변경 화면이 지워졌다(#137). 시트가 하는 일은 수량 고르기 하나다 — 그 자리에
// 남는 용량 표기는 지금 담는 것이 무엇인지 알리는 글일 뿐 고르는 값이 아니다.

"use client";

import { useState } from "react";

import { BottomSheet } from "@/shared/ui/bottom-sheet/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { DrawerTitle } from "@/shared/ui/drawer";
import { formatWon } from "@/shared/ui/price/price";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { QuantityStepper } from "@/shared/ui/quantity-stepper/quantity-stepper";

/** 버튼이 할 일. 글자와 대기 문구가 달라진다 */
const ACTION = {
  cart: { label: "장바구니 담기", pending: "장바구니에 담는 중" },
  buy: { label: "바로 구매", pending: "결제 화면으로 가는 중" },
} as const;

type DetailOptionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 장바구니에 담는지, 바로 구매하는지. 기본은 장바구니 */
  action?: keyof typeof ACTION;
  /** 고른 수량으로 할 일. 끝날 때까지 기다린다. 실패하면 거부되고 시트는 열린 채 남는다 */
  onConfirm: (quantity: number) => Promise<void>;
  /** 처리 중. 버튼 라벨을 대기 표시로 바꾼다 (AGENTS.md 5.8) */
  adding?: boolean;
  productName: string;
  /** "90정"처럼 이 상품의 용량. 응답에 없으면 그 줄을 그리지 않는다 */
  quantityLabel?: string;
  price: number;
};

export function DetailOptionSheet({
  open,
  onOpenChange,
  action = "cart",
  onConfirm,
  adding = false,
  productName,
  quantityLabel,
  price,
}: DetailOptionSheetProps) {
  const [quantity, setQuantity] = useState(1);

  return (
    <BottomSheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setQuantity(1);
        onOpenChange(nextOpen);
      }}
    >
      <div className="flex flex-col gap-3 px-5 pt-3 pb-4">
        <DrawerTitle className="sr-only">{productName} 수량 고르기</DrawerTitle>

        <div className="flex h-20 items-center gap-3 border-b border-border-default">
          <div aria-hidden className="size-12 shrink-0 rounded-lg bg-surface-secondary" />
          {/* 일일 섭취 비용은 서버가 계산해 내려줄 값이라(#123) 근거 없이 숫자를 만들어
              보여주지 않는다. 이름만 보여준다 */}
          <p className="min-w-0 truncate text-title-bold-16 text-text-body-default">
            {productName}
          </p>
        </div>

        <div className="flex h-14 items-center justify-between gap-2">
          {quantityLabel && (
            <p className="text-title-bold-16 text-text-body-default">{quantityLabel}</p>
          )}
          <QuantityStepper value={quantity} onChange={setQuantity} label={`${productName} 수량`} />
        </div>

        <Button
          className="min-h-11 w-full text-label-bold-14"
          disabled={adding}
          onClick={async () => {
            try {
              await onConfirm(quantity);
              setQuantity(1);
            } catch {
              // 실패 알림은 MutationCache.onError가 맡는다. 고른 수량은 그대로 두어
              // 다시 누를 수 있게 한다
            }
          }}
        >
          <LoadingSwap loading={adding} label={ACTION[action].pending}>
            {formatWon(price * quantity)} {ACTION[action].label}
          </LoadingSwap>
        </Button>
      </div>
    </BottomSheet>
  );
}
