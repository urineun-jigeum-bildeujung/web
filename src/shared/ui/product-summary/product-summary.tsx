// 상품을 이미지와 이름만으로 짧게 보여준다. 리뷰·문의·최근 본 상품처럼 상품이 주인공이 아닌 화면에 쓴다.
// IA 기준(최근 본 상품, 작성 가능한 리뷰, 작성한 리뷰, 리뷰 상세, 문의, 리뷰 작성)이며 시안은 아직 없다.

import Image from "next/image";
import { IoImageOutline } from "react-icons/io5";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type ProductSummaryProps = {
  name: string;
  /** 없으면 자리만 잡는다. 목 데이터 단계와 이미지 실패를 함께 다룬다 */
  imageUrl?: string;
  /** 상품명 아래 붙는 것. 가격이나 옵션 */
  meta?: ReactNode;
  /** 상품명 오른쪽에 바로 붙는 것. 주문 상태 뱃지처럼 이름과 한 덩어리로 읽혀야 할 때 쓴다 */
  nameTrailing?: ReactNode;
  /** 이미지 한 변 길이. 4px 스케일 기준 */
  imageSize?: 16 | 20 | 24;
} & ComponentProps<"div">;

export function ProductSummary({
  name,
  imageUrl,
  meta,
  nameTrailing,
  imageSize = 20,
  className,
  ...props
}: ProductSummaryProps) {
  const px = imageSize * 4;

  return (
    <div className={cn("flex items-center gap-3", className)} {...props}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          width={px}
          height={px}
          // 상품명이 옆에 글자로 있으므로 이미지는 장식으로 둔다
          className="shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span
          aria-hidden
          style={{ width: px, height: px }}
          className="flex shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
        >
          <IoImageOutline className="size-6" />
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="flex min-w-0 items-center gap-1.5 text-sm text-foreground">
          <span className="truncate">{name}</span>
          {nameTrailing}
        </p>
        {meta && <div className="text-xs text-muted-foreground">{meta}</div>}
      </div>
    </div>
  );
}
