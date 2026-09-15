// 재입고 알림 한 줄. 사진·이름·가격과 오른쪽 원형 체크로 이루어진다.
// UI 시안 기준(mypa_031, 1555-54448·1555-54490)이다. 사진 64, 이름 title/bold_16, 가격 bold 16 + "원" medium 16, 체크 24.
//
// 원형 체크는 CheckboxRow 한 곳에만 둔다. 시안은 체크가 오른쪽이라 줄을 뒤집어 쓴다.

import Image from "next/image";

import { cn } from "@/shared/lib/utils";
import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";

export type RestockItem = {
  id: string;
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
    <CheckboxRow
      tone="brand"
      checked={selected}
      onCheckedChange={onSelectedChange}
      // 고른 줄은 연한 브랜드색으로 찬다
      className={cn(
        "flex-row-reverse gap-3 rounded-lg px-1 py-2",
        selected && "bg-surface-brand-weak",
      )}
      labelClassName="gap-3 text-foreground"
      label={
        <>
          <span className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-surface-disable">
            {item.imageUrl && (
              <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" />
            )}
          </span>
          <span className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
            <span className="truncate text-title-bold-16">{item.name}</span>
            <span className="text-title-bold-16">
              {item.price.toLocaleString("ko-KR")}
              <span className="text-body-medium-16">원</span>
            </span>
          </span>
        </>
      }
    />
  );
}
