// 재입고 알림 목록. 상품을 골라 알림을 취소한다.
// UI 시안 기준(mypa_031, 1555-54448·1555-54490·1555-54533)이다.
//
// 와이어프레임의 "수정하기" 모드가 시안에서 빠졌다. 언제나 고를 수 있고, 고른 것이 있을 때만
// 아래에 "알림 취소하기"가 나온다.

"use client";

import { useState } from "react";

import { cn } from "@/shared/lib/utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { FormField } from "@/shared/ui/form-field/form-field";
import { Icon } from "@/shared/ui/icon/icon";
import { InfoNotice } from "@/shared/ui/info-notice/info-notice";
import { PageHeader } from "@/shared/ui/page-header/page-header";

import { RestockItemRow, type RestockItem } from "./restock-item-row";

const NOTICE_ITEMS = [
  "재입고 시 상품 가격이나 구성이 조금 달라질 수 있어요.",
  "기다리시던 상품을 구매하시면 해당 알림 내역은 자동으로 지워져요.",
  "인기 용품은 재입고 소식을 받은 후에도 빠르게 다시 품절될 수 있어요.",
  "재입고 소식을 놓치지 않도록 기기의 앱 알림(푸시)을 꼭 켜주세요.",
  "신청하신 내역은 최대 90일 동안 보관된 후 사라져요.",
];

/** API 연동 전까지 화면 확인용 값. 시안(1555-54448)의 세 줄이다 */
const MOCK_ITEMS: RestockItem[] = [
  { id: "1", name: "누터스가든 바이탈 조인트 120g 강아지영양제 관절 슬개골 전연령", price: 18900 },
  { id: "2", name: "강아지 관절 슬개골 관절염 칼슘 영양제 120g", price: 23670 },
  {
    id: "3",
    name: "뉴트리로얄 강아지 올인원케어 강아지 눈 관절 오메가3 유산균 장건강 면역 피부 비타민",
    price: 22900,
  },
];

/** 시안 dialog의 action_button. 40px에 굵은 14px */
const ACTION_CLASS = "h-10 flex-1 text-label-bold-14";

export function RestockAlarmView() {
  const [items, setItems] = useState(MOCK_ITEMS);
  const [keyword, setKeyword] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);

  const visible = items.filter((item) => item.name.includes(keyword.trim()));

  const select = (id: string, selected: boolean) =>
    setSelectedIds((prev) => (selected ? [...prev, id] : prev.filter((v) => v !== id)));

  const cancelSelected = () => {
    setItems((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
    setSelectedIds([]);
    setConfirming(false);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="재입고 알림" />

      <main className="flex flex-1 flex-col gap-4 px-5 pt-3 pb-4">
        <InfoNotice items={NOTICE_ITEMS} />

        {/* 시안의 검색칸은 테두리 없이 회색으로 찬다 */}
        <FormField
          label="재입고 알림 검색"
          className="[&_input]:border-0 [&_input]:bg-surface-secondary [&>label]:sr-only"
          leading={<Icon name="search" className="size-6" />}
          placeholder="상품명으로 찾기"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onClear={() => setKeyword("")}
        />

        {visible.length > 0 ? (
          <ul className="flex flex-col gap-4 pt-1">
            {visible.map((item) => (
              <li key={item.id}>
                <RestockItemRow
                  item={item}
                  selected={selectedIds.includes(item.id)}
                  onSelectedChange={(selected) => select(item.id, selected)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<Icon name="search" />}
            title="재입고 알림을 신청한 상품이 없어요"
            description="품절된 상품에서 알림을 신청하면 여기에 모여요."
          />
        )}
      </main>

      {selectedIds.length > 0 && (
        <BottomActionBar>
          <Button variant="secondary" onClick={() => setConfirming(true)}>
            알림 취소하기
          </Button>
        </BottomActionBar>
      )}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent className="gap-4 rounded-2xl">
          <div className="flex flex-col gap-1">
            <AlertDialogTitle className="text-title-bold-18 text-foreground">
              정말 취소할까요?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-body-medium-14 text-text-body-secondary">
              알림을 취소하면 재입고를 바로 확인하기 어려워져요
              <br />
              그래도 취소하시겠어요?
            </AlertDialogDescription>
          </div>
          {/* shadcn AlertDialogFooter는 회색 띠를 두르고, AlertDialogAction·Cancel은 클래스를
              합치지 않고 이어 붙여 높이·색이 덮이지 않는다. 시안 모양은 Button으로 직접 그린다 */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className={ACTION_CLASS}
              onClick={() => setConfirming(false)}
            >
              닫기
            </Button>
            <Button
              className={cn(
                ACTION_CLASS,
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              )}
              onClick={cancelSelected}
            >
              알림 취소하기
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
