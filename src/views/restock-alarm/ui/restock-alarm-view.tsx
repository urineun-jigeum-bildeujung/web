// 재입고 알림 목록. 수정하기를 누르면 고르는 모드로 바뀌어 알림을 취소한다.
// 와이어프레임 기준(mypa_021, mypa_021_수정하기)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { useState } from "react";
import { IoSearchOutline } from "react-icons/io5";

import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { FormField } from "@/shared/ui/form-field/form-field";
import { InfoNotice } from "@/shared/ui/info-notice/info-notice";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { ProductGridCard } from "@/shared/ui/product-grid-card/product-grid-card";

const NOTICE_ITEMS = [
  "재입고 시 상품 가격이나 구성이 조금 달라질 수 있어요.",
  "7일 이내 상품을 구매하시면 해당 알림 내역은 자동으로 사라져요.",
  "인기 상품은 재입고 소식을 받은 후에도 빠르게 다시 품절될 수 있어요.",
  "재입고 소식을 놓치지 않도록 기기의 앱 알림을 꼭 켜주세요.",
  "신청하신 내역은 최대 90일 동안 보관된 후 사라져요.",
];

/** API 연동 전까지 화면 확인용 값 */
const MOCK_ITEMS = Array.from({ length: 6 }, (_, index) => ({
  id: String(index),
  name: "상품명",
  option: "상품 옵션",
  price: 0,
}));

export function RestockAlarmView() {
  const [editing, setEditing] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const items = MOCK_ITEMS.filter((item) => item.name.includes(keyword.trim()));
  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));

  const exitEditing = () => {
    setEditing(false);
    setSelectedIds([]);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="재입고 알림" />

      <main className="flex flex-1 flex-col gap-4 px-4 pb-4">
        {/* 고르는 모드에서는 안내와 검색을 숨겨 목록에 집중하게 한다 */}
        {!editing && (
          <>
            <InfoNotice title="다시 들어오길 기다려요" items={NOTICE_ITEMS} />

            <FormField
              label="재입고 알림 검색"
              className="[&>label]:sr-only"
              placeholder="상품명으로 찾기"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onClear={() => setKeyword("")}
            />

            <div className="flex justify-end">
              <Button
                variant="ghost"
                className="min-h-11"
                disabled={items.length === 0}
                onClick={() => setEditing(true)}
              >
                수정하기
              </Button>
            </div>
          </>
        )}

        {items.length > 0 ? (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-5">
            {items.map((item) => (
              <li key={item.id}>
                <ProductGridCard
                  {...item}
                  className="w-full"
                  selectable={editing}
                  selected={selectedIds.includes(item.id)}
                  onSelect={() => toggle(item.id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<IoSearchOutline />}
            title="재입고 알림을 신청한 상품이 없어요"
            description="품절된 상품에서 알림을 신청하면 여기에 모여요."
          />
        )}
      </main>

      <BottomActionBar>
        {editing ? (
          <>
            <Button variant="outline" className="min-h-11" onClick={exitEditing}>
              뒤로가기
            </Button>
            <Button className="min-h-11" disabled={selectedIds.length === 0} onClick={exitEditing}>
              알림 취소하기
            </Button>
          </>
        ) : (
          <Button className="min-h-11">상품 더 찾아보기</Button>
        )}
      </BottomActionBar>
    </div>
  );
}
