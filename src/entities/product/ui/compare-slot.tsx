// 비교할 자리 하나. 상품이 들어 있으면 이미지·이름·가격을, 비어 있으면 담으라는 안내를 보여준다.
// 와이어프레임 기준(comp_001, comp_001_empty)이라 디자인 확정 시 바뀔 수 있다.

import Image from "next/image";
import { IoClose, IoImageOutline } from "react-icons/io5";

import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { formatWon } from "@/shared/ui/price/price";

export type CompareProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
};

type CompareSlotProps = {
  product?: CompareProduct;
  /** 상품을 뺀다. 비어 있는 자리에는 나오지 않는다. */
  onRemove?: () => void;
  /** 빈 자리에서 상품을 고르러 간다. */
  onAdd?: () => void;
  className?: string;
};

export function CompareSlot({ product, onRemove, onAdd, className }: CompareSlotProps) {
  if (!product) {
    return (
      <div className={cn("flex flex-col items-center gap-3", className)}>
        <div className="flex aspect-square w-full items-center justify-center rounded-lg border-2 border-dashed border-border">
          <IoImageOutline aria-hidden className="size-8 text-muted-foreground" />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          고민되는 사료를
          <br />
          여기에 담아주세요.
        </p>
        <Button className="min-h-11" onClick={onAdd}>
          상품 추가하기
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative aspect-square w-full">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt="" fill className="rounded-lg object-cover" />
        ) : (
          <span
            aria-hidden
            className="flex size-full items-center justify-center rounded-lg bg-muted text-muted-foreground"
          >
            <IoImageOutline className="size-8" />
          </span>
        )}
        {onRemove && (
          <button
            type="button"
            aria-label={`${product.name} 비교에서 빼기`}
            onClick={onRemove}
            className="absolute -top-2 -right-2 flex size-11 items-center justify-center text-foreground"
          >
            <IoClose aria-hidden className="size-5 rounded-full bg-background p-0.5" />
          </button>
        )}
      </div>

      <p className="text-center text-sm text-foreground">{product.name}</p>
      <p className="text-center text-sm font-bold text-foreground">{formatWon(product.price)}</p>
      {/* 장바구니 화면이 아직 없다. 누를 수 있게 두면 눌러도 아무 일이 없어 고장으로 읽힌다. */}
      <Button className="min-h-11 w-full" disabled>
        장바구니 담기
      </Button>
    </div>
  );
}
