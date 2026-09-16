// 리뷰를 다는 상품 한 줄. 사진 64 · 이름 · 재구매 배지 · 옵션.
// UI 시안 기준(리뷰작성 1884-29400 머리의 상품 줄)이다. 이름은 시안이 15px semibold인데 토큰에 없어 title/bold_16을 쓴다.

import Image from "next/image";

import { Badge } from "@/shared/ui/badge/badge";

type ProductRowProps = {
  name: string;
  option: string;
  /** "재구매 2회". 없으면 배지를 그리지 않는다 */
  repurchase?: string;
  imageUrl?: string;
};

export function ProductRow({ name, option, repurchase, imageUrl }: ProductRowProps) {
  return (
    <div className="flex items-center gap-3 px-5 pt-1 pb-3">
      {/* 상품명이 옆에 글자로 있으므로 사진은 장식이다. 없으면 회색 자리만 남는다 */}
      <span className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-surface-disable">
        {imageUrl && <Image src={imageUrl} alt="" fill sizes="64px" className="object-cover" />}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="flex items-center gap-2">
          <span className="truncate text-title-bold-16 text-foreground">{name}</span>
          {repurchase && <Badge>{repurchase}</Badge>}
        </p>
        <p className="text-label-medium-11 text-text-body-secondary">{option}</p>
      </div>
    </div>
  );
}
