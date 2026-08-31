// 2열 격자에 놓는 상품 카드. 고르는 모드에서는 우상단에 선택 표시가 붙는다.
// 와이어프레임 기준(mypa_021, mypa_021_수정하기)이라 디자인 확정 시 바뀔 수 있다.

import Image from "next/image";
import { IoCheckmarkCircle } from "react-icons/io5";

import { cn } from "@/shared/lib/utils";
import { Price } from "@/shared/ui/price/price";

type ProductGridCardProps = {
  name: string;
  option?: string;
  price: number;
  imageUrl?: string;
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
  imageUrl,
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
          <span aria-hidden className="text-muted-foreground">
            이미지
          </span>
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
      </div>
      <p className="truncate text-sm font-medium text-foreground">{name}</p>
      {option && <p className="truncate text-xs text-muted-foreground">{option}</p>}
      <Price amount={price} size="sm" />
    </>
  );

  if (!selectable) {
    return <div className={cn("flex flex-col gap-1", className)}>{body}</div>;
  }

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
