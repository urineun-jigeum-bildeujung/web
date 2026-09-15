// 아이 제품 관리 탭의 제품 한 장. 구매일·사진·이름·배지와 "반응 남기기" 버튼.
// UI 시안 기준(mypa_021 아이 제품 관리, 1551-46897)이다.
//
// 반응을 아직 안 남긴 제품은 버튼이 브랜드색으로 차고, 남긴 제품은 테두리만 남는다.
// 남긴 뒤에도 눌러서 다시 남길 수 있다.

import Image from "next/image";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge/badge";
import { Button } from "@/shared/ui/button";

export type PetProduct = {
  id: string;
  name: string;
  imageUrl?: string;
  /** "26.08.28" */
  boughtAt: string;
  /** "구매 후 6일" */
  sinceLabel: string;
  /** "3번째 구매" */
  countLabel: string;
  /** 반응을 남겼는지. 거르기와 버튼 모양의 기준이다 */
  reviewed: boolean;
};

type PetProductCardProps = {
  product: PetProduct;
  onFeedback: (product: PetProduct) => void;
};

export function PetProductCard({ product, onFeedback }: PetProductCardProps) {
  return (
    <article className="flex flex-col gap-3">
      <p className="text-caption-regular-13 text-text-body-secondary">구매일 {product.boughtAt}</p>

      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-disable"
        >
          {product.imageUrl && (
            <Image src={product.imageUrl} alt="" width={64} height={64} className="object-cover" />
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="truncate text-title-bold-16 text-foreground">{product.name}</h3>
          <p className="flex gap-2">
            <Badge>{product.sinceLabel}</Badge>
            <Badge tone="positive">{product.countLabel}</Badge>
          </p>
        </div>
      </div>

      <Button
        variant={product.reviewed ? "outline" : "default"}
        aria-label={`${product.name} 반응 남기기`}
        onClick={() => onFeedback(product)}
        className={cn(
          "h-10 text-label-bold-14",
          product.reviewed
            ? "border-border-default text-text-label-brand"
            : "bg-brand text-brand-foreground hover:bg-brand/90",
        )}
      >
        반응 남기기
      </Button>
    </article>
  );
}
