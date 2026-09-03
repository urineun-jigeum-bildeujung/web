// 2열 격자에 놓는 상품 카드. 고르는 모드에서는 우상단에 선택 표시가 붙는다.
// 와이어프레임 기준(mypa_031, reco_001, like_001)이라 디자인 확정 시 바뀔 수 있다.
//
// 화면마다 카드에 얹는 것이 달라 자리로 받는다. 적합도·구매 횟수는 이미지 안에,
// 찜 하트나 지우기는 이미지 위에, 장바구니·구매하기는 카드 아래에 붙는다.
// boolean을 화면 수만큼 늘리는 대신 무엇을 놓을지 넘기게 했다.

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { IoCheckmarkCircle, IoImageOutline } from "react-icons/io5";

import { cn } from "@/shared/lib/utils";
import { Price } from "@/shared/ui/price/price";

type ProductGridCardProps = {
  name: string;
  option?: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  /** 가격 아래 붙는 것. 하루 급여비나 별점 */
  meta?: ReactNode;
  /** 이미지 안 왼쪽 아래. 적합도나 구매 횟수 */
  imageBadge?: ReactNode;
  /** 이미지 오른쪽 위. 찜 하트나 지우기 — 링크 바깥에 두어 중첩을 피한다 */
  imageAction?: ReactNode;
  /** 카드 맨 아래. 장바구니·구매하기 */
  footer?: ReactNode;
  /** 상품 상세로 가는 길. 없으면 누를 수 없다 */
  href?: string;
  /** 고르는 모드인지. 켜면 카드가 버튼이 된다 */
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
};

export function ProductGridCard({
  name,
  option,
  price,
  originalPrice,
  imageUrl,
  meta,
  imageBadge,
  imageAction,
  footer,
  href,
  selectable,
  selected,
  onSelect,
  className,
}: ProductGridCardProps) {
  const body = (
    <>
      <div
        className={cn(
          "relative flex aspect-4/3 items-center justify-center overflow-hidden rounded-lg bg-muted",
          selectable && selected && "ring-2 ring-primary",
        )}
      >
        {imageUrl ? (
          <Image src={imageUrl} alt="" fill className="object-cover" />
        ) : (
          <IoImageOutline aria-hidden className="size-8 text-muted-foreground" />
        )}
        {selectable && (
          <IoCheckmarkCircle
            aria-hidden
            className={cn(
              "absolute top-2 right-2 size-6",
              selected ? "text-primary" : "text-muted-foreground/40",
            )}
          />
        )}
        {imageBadge && <div className="absolute bottom-2 left-2">{imageBadge}</div>}
      </div>
      <p className="truncate text-sm font-medium text-foreground">{name}</p>
      {option && <p className="truncate text-xs text-muted-foreground">{option}</p>}
      <Price amount={price} originalAmount={originalPrice} size="sm" />
      {meta}
    </>
  );

  if (selectable) {
    return (
      <button
        type="button"
        // 색만으로 선택을 알리지 않도록 눌림 상태를 함께 노출한다
        aria-pressed={selected}
        onClick={onSelect}
        className={cn(
          "flex flex-col gap-1 rounded-lg text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          className,
        )}
      >
        {body}
      </button>
    );
  }

  return (
    <div className={cn("relative flex flex-col gap-1", className)}>
      {href ? (
        <Link
          href={href}
          className="flex flex-col gap-1 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {body}
        </Link>
      ) : (
        body
      )}
      {/* 링크 안에 두면 링크 속 버튼이 되어 눌리지 않는다 */}
      {imageAction && <div className="absolute top-1 right-1">{imageAction}</div>}
      {footer}
    </div>
  );
}
