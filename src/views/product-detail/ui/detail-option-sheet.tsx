// 상품 상세에서 구성과 수량을 고른 뒤 장바구니에 담는 시트.
// UI 시안 기준(1702-16392의 옵션 선택 시트)이다.

"use client";

import { useState } from "react";

import { BottomSheet } from "@/shared/ui/bottom-sheet/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { DrawerTitle } from "@/shared/ui/drawer";
import { formatWon } from "@/shared/ui/price/price";
import { QuantityStepper } from "@/shared/ui/quantity-stepper/quantity-stepper";

type DetailOptionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (quantity: number) => void;
  productName: string;
  /** "90정 (기본 구성)"처럼 고를 수 있는 구성이 하나뿐일 때 보여줄 이름 */
  optionLabel: string;
  price: number;
};

export function DetailOptionSheet({
  open,
  onOpenChange,
  onAddToCart,
  productName,
  optionLabel,
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
        <DrawerTitle className="sr-only">{productName} 옵션 선택</DrawerTitle>

        <div className="flex h-20 items-center gap-3 border-b border-border-default">
          <div aria-hidden className="size-12 shrink-0 rounded-lg bg-surface-secondary" />
          {/* 일일 섭취 비용은 서버가 계산해 내려줄 값이라(#123) 근거 없이 숫자를 만들어
              보여주지 않는다. 이름만 보여준다 */}
          <p className="min-w-0 truncate text-title-bold-16 text-text-body-default">
            {productName}
          </p>
        </div>

        <div className="flex h-14 items-center justify-between gap-2">
          <p className="text-title-bold-16 text-text-body-default">{optionLabel}</p>
          <QuantityStepper value={quantity} onChange={setQuantity} label={`${productName} 수량`} />
        </div>

        <Button
          className="h-10 w-full text-label-bold-14"
          onClick={() => {
            onAddToCart(quantity);
            setQuantity(1);
          }}
        >
          {formatWon(price * quantity)} 장바구니 담기
        </Button>
      </div>
    </BottomSheet>
  );
}
