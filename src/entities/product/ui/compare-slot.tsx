// 비교할 자리 하나. 상품이 들어 있으면 이미지·이름·가격·적합도·장바구니 담기를, 비어 있으면
// 담으라는 안내를 보여준다. UI 시안 기준(#245, comp_001·comp_001_empty, 1568-70143·1117-6319)이다.

import Image from "next/image";
import { IoImageOutline } from "react-icons/io5";

import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icon/icon";
import { formatWon } from "@/shared/ui/price/price";

/** 비교가 성립하는 단위. 사료와 간식은 10g당 가격도 칼로리도 기준이 달라 나란히 놓을 수 없다.
 *  실제 분류 체계는 #123에서 API 계약을 기다리는 중이라 화면이 성립할 최소 집합만 둔다 */
export type ProductKind = "food" | "snack" | "supplement" | "supply";

export type CompareProduct = {
  id: string;
  name: string;
  price: number;
  kind: ProductKind;
  imageUrl?: string;
  /** 우리 아이 기준 적합도. 영양 정보가 없어 재지 못했으면 null(#119) */
  matchScore: number | null;
};

type CompareSlotProps = {
  product?: CompareProduct;
  /** 상품을 뺀다. 비어 있는 자리에는 나오지 않는다. */
  onRemove?: () => void;
  /** 빈 자리에서 상품을 고르러 간다. */
  onAdd?: () => void;
  /** 장바구니에 담는다. */
  onAddToCart?: () => void;
  /** 상대 자리보다 적합도가 높은지 낮은지. 둘 다 채워지고 점수가 갈릴 때만 준다.
   *  안 주면(동점·한쪽만 채움) 우열 없는 기본 크기로 그린다 */
  scoreEmphasis?: "win" | "lose";
  className?: string;
};

export function CompareSlot({
  product,
  onRemove,
  onAdd,
  onAddToCart,
  scoreEmphasis,
  className,
}: CompareSlotProps) {
  if (!product) {
    return (
      <div className={cn("flex min-w-0 flex-col items-start gap-3", className)}>
        <div className="flex w-full flex-col items-start gap-2">
          <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-border-secondary">
            {/* 시안(1568-71123)의 "+"는 실측 25%(172px 기준 약 43px) 크기에 색은
                #565d6d(text-body-secondary)다 — icon-fill-tertiary는 다른(더 옅은) 회색이다 */}
            <Icon name="plus" aria-hidden className="size-11 text-text-body-secondary" />
          </div>
          <p className="text-sm text-foreground">
            고민되는 사료를
            <br />
            담아주세요.
          </p>
        </div>
        <Button
          variant="secondary"
          className="h-10 w-full gap-1.5 text-label-bold-14"
          onClick={onAdd}
        >
          상품 추가하기
          {/* 시안(1568-71117)은 24px이다 */}
          <Icon name="right" aria-hidden className="size-6" />
        </Button>
      </div>
    );
  }

  return (
    // 시안(1568-70143)은 이미지+이름/가격을 12px 바깥·4px 안쪽 두 겹으로 묶어, 빈 자리의
    // 8px 한 겹(위)과 자리마다 총 높이가 같아지도록 맞춰 뒀다 — 장바구니/추가 버튼이 한
    // 상품만 담겼을 때도 같은 줄에 나란히 놓이는 이유가 이 간격 차이다
    <div className={cn("flex min-w-0 flex-col items-start gap-3", className)}>
      <div className="flex w-full flex-col items-start gap-1">
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
              // 시안(2451-93742)은 원판 없이 28px 아이콘 하나만 이미지 우상단에 둔다
              className="absolute top-1 right-1 flex size-11 items-center justify-center text-icon-stroke-tertiary"
            >
              <Icon name="cancel" aria-hidden className="size-7" />
            </button>
          )}
        </div>

        <div className="flex w-full flex-col items-start gap-1">
          {/* items-start는 교차축 정렬이라 자식이 폭을 물려받지 않는다. w-full 없이는
              truncate가 잘라낼 폭 자체가 없어 긴 이름이 카드 밖으로 넘친다 */}
          <p className="w-full truncate text-sm text-foreground">{product.name}</p>
          <p className="text-sm font-bold text-foreground">{formatWon(product.price)}</p>
        </div>
      </div>

      <div className="flex w-full items-center justify-between gap-2">
        {product.matchScore !== null && (
          <p
            aria-label={`적합도 ${product.matchScore}점`}
            className={cn(
              "font-bold",
              scoreEmphasis === "win" && "text-title-bold-22 text-text-body-brand-default",
              scoreEmphasis === "lose" && "text-title-bold-16 text-text-body-unselect",
              !scoreEmphasis && "text-title-bold-16 text-foreground",
            )}
          >
            {product.matchScore}점
          </p>
        )}
        <Button
          variant="secondary"
          className="ml-auto h-10 w-26.75 text-label-bold-14"
          onClick={onAddToCart}
        >
          장바구니 추가
        </Button>
      </div>
    </div>
  );
}
