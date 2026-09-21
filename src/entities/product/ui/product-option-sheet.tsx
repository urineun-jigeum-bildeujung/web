// 목록에서 상품을 눌렀을 때 구성과 수량을 고르고 바로 담는 바텀시트.
// UI 시안 기준(#275, 2544-56035)이다.
//
// 상세로 보내지 않고 목록에서 끝내는 것은 타임딜이 시간에 쫓기는 화면이기 때문이다.
// 구성이 여러 갈래인 상품은 아직 시안에 없어 한 줄만 다룬다.

"use client";

import Image from "next/image";
import { useState } from "react";
import { IoImageOutline } from "react-icons/io5";

import { Button } from "@/shared/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";
import { formatWon } from "@/shared/ui/price/price";
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
    <div className="flex flex-col">
      <DrawerHeader className="p-0">
        {/* 제목은 상품 이름이다. 시트가 무엇에 대한 것인지 스크린 리더가 먼저 읽는다 */}
        <DrawerTitle className="sr-only">{product.name} 구성 고르기</DrawerTitle>
      </DrawerHeader>

      {/* 시안(2544-56037 Handle)은 손잡이 칸 자체가 40px지만, 공용 Drawer의 손잡이는
          그보다 짧다(mt-4+h-1). 시안의 pt-[4px]만 그대로 쓰면 문구가 손잡이에 바짝
          붙어 보여, 그 차이만큼 위쪽 여백을 더 둔다 */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-3">
        <span className="relative size-15 shrink-0 overflow-hidden rounded-lg bg-muted">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt="" fill className="object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-muted-foreground">
              <IoImageOutline aria-hidden className="size-6" />
            </span>
          )}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          {/* 시안은 15px SemiBold인데 이 굵기 크기 조합의 등록된 토큰이 없어
              가장 가까운 14px Bold(`label/bold_14`)로 근사했다 */}
          <p className="truncate text-label-bold-14 text-foreground">{product.name}</p>
          {product.unitLabel && product.unitAmount !== undefined && (
            <p className="text-label-medium-11 text-text-body-secondary">
              {product.unitLabel} {formatWon(product.unitAmount)}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-5 pt-4 pb-1">
        <p className="text-label-bold-14 text-foreground">{product.optionLabel}</p>
        <QuantityStepper value={quantity} onChange={setQuantity} label={`${product.name} 수량`} />
      </div>

      <div className="px-5 pt-4 pb-12.5">
        <Button className="min-h-11 w-full" onClick={() => onAddToCart(product.id, quantity)}>
          {formatWon(product.price * quantity)} 장바구니 담기
        </Button>
      </div>
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
