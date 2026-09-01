// 상품 비교. 두 자리에 담은 사료를 항목별로 견준다.
// 와이어프레임 기준(comp_001, comp_001_empty)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { IoCartOutline, IoNotificationsOutline } from "react-icons/io5";

import {
  CompareSlot,
  CompareTable,
  type CompareProduct,
  type CompareRow,
} from "@/entities/product";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { BottomNav } from "@/widgets/bottom-nav";

/** API 연동 전까지 화면 확인용 값 */
const MOCK_PRODUCTS: [CompareProduct, CompareProduct] = [
  { id: "1", name: "상품명", price: 45000 },
  { id: "2", name: "상품명", price: 52000 },
];

/** 고르기 화면에서 담아 올 수 있는 상품 */
const PICKABLE: Record<string, CompareProduct> = {
  "1": { id: "1", name: "상품명", price: 45000 },
  "2": { id: "2", name: "상품명", price: 52000 },
  "3": { id: "3", name: "상품명", price: 38000 },
  "4": { id: "4", name: "상품명", price: 61000 },
  "5": { id: "5", name: "상품명", price: 47000 },
  "6": { id: "6", name: "상품명", price: 55000 },
};

/** 시안 comp_001의 아홉 항목 */
const MOCK_ROWS: CompareRow[] = [
  { label: "10g당 가격", values: ["150원", "176원"] },
  { label: "주원료", values: ["생연어", "가수분해 오리고기"] },
  {
    label: "핵심 기능성",
    values: [
      ["체중 조절", "피모 개선"],
      ["알러지 케어", "소화 촉진"],
    ],
  },
  {
    label: "알러지 안심",
    values: [
      ["그레인프리", "글루텐프리"],
      ["100% 가수분해", "단백질"],
    ],
  },
  { label: "권장 연령대", values: ["1~7세", "전연령"] },
  { label: "알갱이 크기", values: ["작은 사이즈", "중간 사이즈"] },
  { label: "형태 및 식감", values: ["바삭한 건식", "말랑한 반건식"] },
  {
    label: "주요 영양 비율",
    values: [
      ["조단백 30%", "조지방 10%"],
      ["조단백 24%", "조지방 14%"],
    ],
  },
  { label: "칼로리", values: ["310kcal", "360kcal"] },
];

export function ProductCompareView() {
  const router = useRouter();
  // 고르기 화면이 주소창에 담아 온 값. 어느 자리에 무엇을 넣을지 알려 준다.
  const [slot] = useQueryState("slot");
  const [product] = useQueryState("product");

  // 서버 연동 전까지 담긴 상품을 화면이 든다. 빼면 그 자리가 비고 표가 사라진다.
  const [slots, setSlots] = useState<[CompareProduct | undefined, CompareProduct | undefined]>(
    () => {
      const picked = product ? PICKABLE[product] : undefined;
      if (!picked) return MOCK_PRODUCTS;

      const next: [CompareProduct | undefined, CompareProduct | undefined] = [
        MOCK_PRODUCTS[0],
        MOCK_PRODUCTS[1],
      ];
      next[slot === "1" ? 1 : 0] = picked;
      return next;
    },
  );

  const both = slots[0] && slots[1];
  const goSelect = (index: number) => router.push(`/compare/select?slot=${index}`);

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        leading="none"
        right={
          <>
            {/* 장바구니·알림 화면이 아직 없어 아이콘만 둔다 */}
            <span aria-hidden className="flex size-11 items-center justify-center">
              <IoCartOutline className="size-6" />
            </span>
            <span aria-hidden className="flex size-11 items-center justify-center">
              <IoNotificationsOutline className="size-6" />
            </span>
          </>
        }
      />

      <main className="flex flex-1 flex-col gap-4 px-4 pb-4">
        <div className="flex items-start gap-4">
          {slots.map((product, index) => (
            <CompareSlot
              key={product?.id ?? `empty-${index}`}
              product={product}
              className="flex-1"
              onAdd={() => goSelect(index)}
              onRemove={() =>
                setSlots((prev) => {
                  const next: typeof prev = [prev[0], prev[1]];
                  next[index] = undefined;
                  return next;
                })
              }
            />
          ))}
        </div>

        {/* 한쪽이라도 비면 견줄 것이 없다 */}
        {both && (
          <CompareTable
            productNames={[slots[0]!.name, slots[1]!.name]}
            rows={MOCK_ROWS}
            className="border-t border-border"
          />
        )}
      </main>

      <BottomNav />
    </div>
  );
}
