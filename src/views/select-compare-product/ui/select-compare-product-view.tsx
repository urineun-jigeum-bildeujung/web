// 비교할 상품 고르기. 최근 본 상품에서 하나를 골라 비교 자리에 담는다.
// 와이어프레임 기준(comp_011, comp_011_선택, comp_011_searching)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IoSearchOutline } from "react-icons/io5";

import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { FormField } from "@/shared/ui/form-field/form-field";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { ProductGridCard } from "@/shared/ui/product-grid-card/product-grid-card";

/** API 연동 전까지 화면 확인용 값 */
const MOCK_ITEMS = Array.from({ length: 6 }, (_, index) => ({
  id: String(index + 1),
  name: "상품명",
  price: 0,
}));

export function SelectCompareProductView() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const searching = keyword.trim() !== "";
  const items = MOCK_ITEMS.filter((item) => item.name.includes(keyword.trim()));

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader />

      <main className="flex flex-1 flex-col gap-4 px-4 pb-4">
        <FormField
          label="상품 검색"
          className="[&>label]:sr-only"
          leading={<IoSearchOutline className="size-5" />}
          placeholder="상품명"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onClear={() => setKeyword("")}
        />

        {/* 검색 중에는 제목을 숨긴다. 최근 본 것이 아니라 검색 결과이기 때문이다 */}
        {!searching && <h2 className="text-base font-semibold text-foreground">최근 봤어요</h2>}

        {items.length > 0 ? (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-5">
            {items.map((item) => (
              <li key={item.id}>
                <ProductGridCard
                  name={item.name}
                  price={item.price}
                  className="w-full"
                  selectable
                  selected={selectedId === item.id}
                  onSelect={() => setSelectedId(item.id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="찾는 상품이 없어요" description="다른 이름으로 검색해 보세요." />
        )}
      </main>

      <BottomActionBar>
        <Button className="min-h-11" disabled={!selectedId} onClick={() => router.back()}>
          선택 완료
        </Button>
      </BottomActionBar>
    </div>
  );
}
