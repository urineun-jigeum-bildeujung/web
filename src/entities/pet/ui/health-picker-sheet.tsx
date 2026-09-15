// 건강 관심사·알러지 성분을 탭으로 나눠 고르는 바텀시트.
// UI 시안 기준(onbo_004_바텀)이다.
//
// 질환과 알러지가 같은 모양이라 목록만 갈아끼워 쓴다. 자유 입력을 대신하는 자리다 —
// 보호자마다 다르게 적으면 같은 질환이 여러 표기로 쌓여 추천에 쓸 수 없다.

"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { BottomSheet } from "@/shared/ui/bottom-sheet/bottom-sheet";
import { DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";
import { Icon } from "@/shared/ui/icon/icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import type { HealthGroup } from "../model/health";

type HealthPickerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 시트 제목. "걱정되는 질환" 같은 것 */
  title: string;
  groups: HealthGroup[];
  /** 지금 고른 것 */
  value: string[];
  onConfirm: (next: string[]) => void;
};

type SheetBodyProps = Omit<HealthPickerSheetProps, "open" | "onOpenChange">;

function SheetBody({ title, groups, value, onConfirm }: SheetBodyProps) {
  // 시트 안에서 고르다 닫으면 되돌아가야 한다. 확정은 "선택 완료"에서만 한다
  const [picked, setPicked] = useState<string[]>(value);

  const toggle = (item: string) =>
    setPicked((prev) => (prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]));

  return (
    <div className="flex flex-col gap-3 px-5 pb-4">
      <DrawerHeader className="p-0">
        <DrawerTitle className="text-left text-title-bold-18">{title}</DrawerTitle>
      </DrawerHeader>

      <Tabs defaultValue={groups[0]?.label} className="gap-4">
        {/* 갈래가 여섯이라 좁은 화면에서는 가로로 밀어 본다 */}
        <TabsList
          variant="line"
          className="h-10 w-full [scrollbar-width:none] justify-start gap-0 overflow-x-auto p-0 [&::-webkit-scrollbar]:hidden"
        >
          {groups.map((group) => (
            <TabsTrigger
              key={group.label}
              value={group.label}
              className="h-8 min-w-11 flex-none px-2 text-label-medium-14 text-text-body-tertiary after:bottom-0 after:h-px data-active:font-bold data-active:text-foreground"
            >
              {group.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {groups.map((group) => (
          <TabsContent key={group.label} value={group.label}>
            {/* 여러 개를 고를 수 있어 라디오가 아니라 눌림 상태를 쓴다 */}
            <ul className="flex flex-wrap gap-3">
              {group.items.map((item) => {
                const selected = picked.includes(item);
                return (
                  <li key={item}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggle(item)}
                      // 시안의 칩은 36px이다. 탭 영역(44px)은 보이지 않는 테두리로 넓힌다
                      className={cn(
                        "relative flex h-9 items-center gap-1 rounded-full border px-3 text-label-medium-14 transition-colors after:absolute after:-inset-1",
                        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border-secondary bg-background text-foreground hover:bg-muted",
                      )}
                    >
                      {/* 시안에는 없지만 색만으로 고른 것을 알리지 않는다. 색을 구분하기 어려운 사람도 안다 */}
                      {selected && <Icon name="check" className="size-4" />}
                      {item}
                    </button>
                  </li>
                );
              })}
            </ul>
          </TabsContent>
        ))}
      </Tabs>

      <Button className="h-11 text-label-bold-14" onClick={() => onConfirm(picked)}>
        선택 완료
      </Button>
    </div>
  );
}

export function HealthPickerSheet({ open, onOpenChange, ...body }: HealthPickerSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      {/* 열 때마다 통째로 새로 그려 지금 값에서 시작한다.
          효과로 되돌리면 앞서 고른 것이 한 번 그려진 뒤에 바뀐다 */}
      {open && <SheetBody key={body.title} {...body} />}
    </BottomSheet>
  );
}
