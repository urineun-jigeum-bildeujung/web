// 목록에서 상품을 눌렀을 때 구성과 수량을 고르고 바로 담는 바텀시트.
// 와이어프레임 기준(타임딜_옵션 선택 바텀시트)이라 디자인 확정 시 바뀔 수 있다.
//
// 상세로 보내지 않고 목록에서 끝내는 것은 타임딜이 시간에 쫓기는 화면이기 때문이다.
// 구성이 여러 갈래인 상품은 아직 시안에 없어 한 줄만 다룬다.

"use client";

import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";
import { formatWon } from "@/shared/ui/price/price";
import { ProductSummary } from "@/shared/ui/product-summary/product-summary";
import { QuantityStepper } from "@/shared/ui/quantity-stepper/quantity-stepper";

export type OptionSheetProduct = {
  id: string;
  name: string;
  /** 하나에 얼마인지. 담기 버튼 금액은 여기에 수량을 곱한다 */
  price: number;
  /** "90정 (기본 구성)"처럼 무엇을 사는지 */
  optionLabel: string;
  /** "1일 섭취 기준 약" */
  unitLabel?: string;
  unitAmount?: number;
  imageUrl?: string;
};

type ProductOptionSheetProps = {
  /** 고른 상품. null이면 닫힌다 */
  product: OptionSheetProduct | null;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (productId: string, quantity: number) => void;
};

type SheetBodyProps = {
  product: OptionSheetProduct;
  onAddToCart: (productId: string, quantity: number) => void;
};

function SheetBody({ product, onAddToCart }: SheetBodyProps) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex flex-col gap-4 px-4 pt-2 pb-6">
      <DrawerHeader className="p-0">
        {/* 제목은 상품 이름이다. 시트가 무엇에 대한 것인지 스크린 리더가 먼저 읽는다 */}
        <DrawerTitle className="sr-only">{product.name} 구성 고르기</DrawerTitle>
      </DrawerHeader>

      <ProductSummary
        name={product.name}
        imageUrl={product.imageUrl}
        imageSize={16}
        meta={
          product.unitLabel &&
          product.unitAmount !== undefined && (
            <span>
              {product.unitLabel} {formatWon(product.unitAmount)}
            </span>
          )
        }
      />

      <div className="flex items-center justify-between border-t border-border pt-4">
        <p className="text-sm font-medium text-foreground">{product.optionLabel}</p>
        <QuantityStepper value={quantity} onChange={setQuantity} label={`${product.name} 수량`} />
      </div>

      <Button className="min-h-12" onClick={() => onAddToCart(product.id, quantity)}>
        {formatWon(product.price * quantity)} 장바구니 담기
      </Button>
    </div>
  );
}

export function ProductOptionSheet({
  product,
  onOpenChange,
  onAddToCart,
}: ProductOptionSheetProps) {
  return (
    <Drawer open={product !== null} onOpenChange={onOpenChange}>
      <DrawerContent>
        {/* 상품이 바뀌면 통째로 새로 그려 수량이 1로 돌아간다.
            효과로 되돌리면 앞 상품의 수량이 한 번 그려진 뒤에 바뀐다 */}
        {product && <SheetBody key={product.id} product={product} onAddToCart={onAddToCart} />}
      </DrawerContent>
    </Drawer>
  );
}
