// 상품 비교. 두 자리에 담은 상품을 항목별로 견준다.
// 와이어프레임 기준(comp_001, comp_001_에러, comp_001_empty)이라 디자인 확정 시 바뀔 수 있다.
//
// 종류가 다르면 표를 그리지 않는다. 사료와 간식은 10g당 가격도 칼로리도 기준이 달라,
// 나란히 놓으면 숫자가 큰 쪽이 나빠 보이는 착시가 생긴다. 근거 있는 판단을 내주겠다는
// 서비스가 비교하면 안 되는 것을 비교해 주는 것이 더 나쁘다.

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

/**
 * 고르기 화면에서 담아 올 수 있는 상품. 검색 결과 목록과 같은 id·이름을 쓴다.
 * 목업 단계라 양쪽에 값을 두고, API가 붙으면 둘 다 사라진다.
 */
const PICKABLE: Record<string, CompareProduct> = {
  "1": { id: "1", name: "중소형견 소포장 사료 1kg", price: 31500, kind: "food" },
  "2": { id: "2", name: "노령견 저지방 소화케어 사료 1kg", price: 27200, kind: "food" },
  "3": { id: "3", name: "알레르기 케어 무곡물 사료 1kg", price: 26100, kind: "food" },
  "4": { id: "4", name: "퍼피 성장기 사료 1kg", price: 21000, kind: "food" },
  "5": { id: "5", name: "저자극 덴탈껌 14개입", price: 10800, kind: "snack" },
  "6": { id: "6", name: "고양이 화장실 모래 6L", price: 14900, kind: "supply" },
  "7": { id: "7", name: "실속형 대용량 사료 5kg", price: 18900, kind: "food" },
};

/** API 연동 전까지 화면 확인용 값. 시안 comp_001이 사료 둘을 견준다 */
const MOCK_PRODUCTS: [CompareProduct, CompareProduct] = [PICKABLE["1"], PICKABLE["2"]];

/** 시안 comp_001의 아홉 항목. */
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
  // 검색에서 고른 상품이 주소창에 담겨 온다. 어느 자리에 무엇을 넣을지 알려 준다.
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

  const [first, second] = slots;
  const both = first && second;
  const sameKind = both && first.kind === second.kind;

  // 고르는 일은 검색 화면이 맡는다. 어느 자리를 채우러 왔는지는 주소창이 들고 간다.
  const goSelect = (index: number) => router.push(`/search?slot=${index}`);

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        leading="none"
        right={
          <>
            {/* 장바구니·알림 화면이 아직 없어 아이콘만 둔다. */}
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

        {/* 한쪽이라도 비면 견줄 것이 없다. */}
        {both &&
          (sameKind ? (
            <CompareTable
              productNames={[first.name, second.name]}
              rows={MOCK_ROWS}
              className="border-t border-border"
            />
          ) : (
            // 시안(comp_001_에러). 표와 맞춤 분석이 통째로 빠지고 이 안내만 남는다
            <div className="flex gap-2 rounded-lg bg-muted p-4">
              <span className="shrink-0 text-sm font-bold text-foreground">안내</span>
              <p className="text-sm text-muted-foreground">
                정확한 결과를 위해 건식은 건식끼리, 간식은 간식끼리 골라주세요
              </p>
            </div>
          ))}
      </main>

      <BottomNav />
    </div>
  );
}
