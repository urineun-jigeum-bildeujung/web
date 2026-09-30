// 재입고 알림 한 줄. 사진·이름·가격과 오른쪽 원형 체크로 이루어진다.
// UI 시안 기준(mypa_031, 1555-54448·1555-54490)이다. 사진 64, 이름 title/bold_16, 가격 bold 16 + "원" medium 16, 체크 24.
//
// **사진·이름·가격은 상품 상세로 가는 링크이고, 고르기는 오른쪽 체크만 한다(QA No.267, #579).**
// 전에는 줄 전체가 체크의 레이블이라 어디를 눌러도 체크가 바뀌어 상품을 다시 볼 길이 없었다.
// 원형 체크는 CheckboxRow 한 곳에만 둔다. 레이블은 화면 낭독기용으로만 남겨 어느 상품의 체크인지 읽히게 한다.

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/shared/lib/utils";
import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";

export type RestockItem = {
  id: string;
  /** 상품 상세로 갈 상품 번호 */
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
};

type RestockItemRowProps = {
  item: RestockItem;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
};

export function RestockItemRow({ item, selected, onSelectedChange }: RestockItemRowProps) {
  return (
    // 고른 줄은 연한 브랜드색으로 찬다
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-1 py-2",
        selected && "bg-surface-brand-weak",
      )}
    >
      <Link
        href={`/products/${item.productId}`}
        className="flex min-w-0 flex-1 gap-3 rounded-lg text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-surface-disable">
          {item.imageUrl && (
            <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" />
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col justify-between">
          <span className="truncate text-title-bold-16">{item.name}</span>
          <span className="text-title-bold-16">
            {item.price.toLocaleString("ko-KR")}
            <span className="text-body-medium-16">원</span>
          </span>
        </span>
      </Link>
      <CheckboxRow
        tone="brand"
        checked={selected}
        onCheckedChange={onSelectedChange}
        className="shrink-0"
        label={<span className="sr-only">{item.name} 고르기</span>}
      />
    </div>
  );
}
