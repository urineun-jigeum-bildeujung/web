// 2열 격자나 가로 목록에 놓는 상품 카드. 고르는 모드에서는 우상단에 선택 표시가 붙는다.
// UI 시안 기준(ProductCard/Grid, node 1758-69014·1758-68918 등)이다.
//
// 화면마다 카드에 얹는 것이 달라 자리로 받는다. 적합도·구매 횟수는 이미지 안에,
// 찜 하트나 지우기는 이미지 위에, 장바구니·구매하기는 카드 아래에 붙는다.
// boolean을 화면 수만큼 늘리는 대신 무엇을 놓을지 넘기게 했다.

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { IoImageOutline } from "react-icons/io5";

import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icon/icon";
import { calcDiscountRate, formatWon } from "@/shared/ui/price/price";

type ProductGridCardProps = {
  name: string;
  option?: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  /** 가격 아래 붙는 것. 하루 급여비나 별점 */
  meta?: ReactNode;
  /** 이미지 안 왼쪽 위. 적합도나 구매 횟수 */
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
  /** 시안이 다르게 그린 화면(상품 상세의 "함께 보면 좋은 상품" 등)만 가격 크기를 덮어쓴다 */
  priceClassName?: string;
  /** 기본은 이미지 오른쪽 위(top-3 right-3). 시안이 다르게 그린 화면만 자리를 덮어쓴다 */
  imageActionClassName?: string;
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
  priceClassName,
  imageActionClassName,
}: ProductGridCardProps) {
  // 시안(ProductCard/Grid의 price 슬롯)은 이름·취소선·할인율+가격이 간격 없이
  // 붙어 있고, 그 아래 meta(하루 급여비·별점)와만 4px 떨어진다. 공용 Price
  // 컴포넌트는 아직 이 카드 시안 기준이 아니라서 값만 가져와 직접 그린다.
  const discountRate = originalPrice ? calcDiscountRate(price, originalPrice) : 0;

  const body = (
    <>
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-muted">
        {imageUrl ? (
          <Image src={imageUrl} alt="" fill className="object-cover" />
        ) : (
          <IoImageOutline aria-hidden className="size-8 text-muted-foreground" />
        )}
        {selectable && (
          // 시안(1117-6424)은 이미지 전체에 테두리를 두르지 않는다. 우상단 24px 원의
          // 배경색만 바뀌고(#dddee3/#ff611d), 흰 체크 아이콘은 선택 여부와 무관하게
          // 항상 보인다 — 선택 상태는 카드 버튼의 aria-pressed로 이미 전해진다
          <span
            aria-hidden
            className={cn(
              "absolute top-2 right-2 flex size-6 items-center justify-center rounded-full",
              selected ? "bg-surface-brand" : "bg-surface-disable",
            )}
          >
            <Icon name="check" className="size-4 text-icon-fill-static-white" />
          </span>
        )}
        {imageBadge && <div className="absolute top-3 left-3 flex">{imageBadge}</div>}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex flex-col items-start">
          <p className="truncate text-body-medium-14 text-foreground">{name}</p>
          {option && (
            <p className="truncate text-label-regular-13 text-text-body-tertiary">{option}</p>
          )}
          {discountRate > 0 && originalPrice && (
            <p className="text-label-regular-13 text-text-body-tertiary line-through">
              {formatWon(originalPrice)}
            </p>
          )}
          <div className="flex items-center gap-1">
            {discountRate > 0 && (
              <span className="text-label-regular-13 font-bold text-text-body-danger-default">
                {discountRate}%
              </span>
            )}
            <p className={cn("text-title-bold-18 text-foreground", priceClassName)}>
              {formatWon(price)}
            </p>
          </div>
        </div>
        {meta}
      </div>
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
          // button은 div와 달리 width:auto가 내용에 맞춰 줄어든다(폼 컨트롤의 내재적 크기 규칙).
          // w-full이 없으면 그리드 칸 너비(모두 같음)를 안 채워 카드마다 이미지 크기가 들쭉날쭉해진다
          "flex w-full flex-col gap-2 rounded-lg text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          className,
        )}
      >
        {body}
      </button>
    );
  }

  return (
    <div className={cn("relative flex flex-col gap-2", className)}>
      {href ? (
        <Link
          href={href}
          className="flex flex-col gap-2 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {body}
        </Link>
      ) : (
        body
      )}
      {/* 링크 안에 두면 링크 속 버튼이 되어 눌리지 않는다. 카드 전체(이미지+글) 기준으로
          자리를 잡으면 아래쪽으로 놓을 때 이미지가 아니라 카드 맨 아래(글 밑)에 붙는다.
          이미지와 정확히 같은 크기(aspect-square)의 투명판을 따로 둬서 이미지 기준으로
          자리를 잡는다 */}
      {imageAction && (
        <div className="pointer-events-none absolute inset-x-0 top-0 aspect-square">
          <div className={cn("pointer-events-auto absolute top-3 right-3", imageActionClassName)}>
            {imageAction}
          </div>
        </div>
      )}
      {footer}
    </div>
  );
}
