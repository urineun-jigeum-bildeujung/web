// 건강 관심사·알러지 성분을 탭으로 나눠 고르는 바텀시트.
// 와이어프레임 기준(onbo_004_바텀)이라 디자인 확정 시 바뀔 수 있다.
//
// 질환과 알러지가 같은 모양이라 목록만 갈아끼워 쓴다. 자유 입력을 대신하는 자리다 —
// 보호자마다 다르게 적으면 같은 질환이 여러 표기로 쌓여 추천에 쓸 수 없다.

"use client";

import { useState } from "react";
import { IoCheckmark } from "react-icons/io5";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";
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
    <div className="flex flex-col gap-4 px-4 pt-2 pb-6">
      <DrawerHeader className="p-0">
        <DrawerTitle className="text-left text-base">{title}</DrawerTitle>
      </DrawerHeader>

      <Tabs defaultValue={groups[0]?.label} className="gap-3">
        {/* 갈래가 여섯이라 좁은 화면에서는 가로로 밀어 본다 */}
        <TabsList
          variant="line"
          className="h-auto w-full [scrollbar-width:none] justify-start gap-4 overflow-x-auto border-b border-border pb-2 [&::-webkit-scrollbar]:hidden"
        >
          {groups.map((group) => (
            <TabsTrigger
              key={group.label}
              value={group.label}
              className="min-h-11 flex-none px-0 text-sm after:bg-brand data-active:text-brand"
            >
              {group.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {groups.map((group) => (
          <TabsContent key={group.label} value={group.label}>
            {/* 여러 개를 고를 수 있어 라디오가 아니라 눌림 상태를 쓴다 */}
            <ul className="flex flex-wrap gap-2">
              {group.items.map((item) => {
                const selected = picked.includes(item);
                return (
                  <li key={item}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggle(item)}
                      className={cn(
                        "flex min-h-11 items-center gap-1 rounded-full border px-4 text-sm transition-colors",
                        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-muted",
                      )}
                    >
                      {/* 색만으로 고른 것을 알리지 않는다. 색을 구분하기 어려운 사람도 안다 */}
                      {selected && <IoCheckmark aria-hidden className="size-4" />}
                      {item}
                    </button>
                  </li>
                );
              })}
            </ul>
          </TabsContent>
        ))}
      </Tabs>

      <Button className="min-h-12" onClick={() => onConfirm(picked)}>
        선택 완료
      </Button>
    </div>
  );
}

export function HealthPickerSheet({ open, onOpenChange, ...body }: HealthPickerSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        {/* 열 때마다 통째로 새로 그려 지금 값에서 시작한다.
            효과로 되돌리면 앞서 고른 것이 한 번 그려진 뒤에 바뀐다 */}
        {open && <SheetBody key={body.title} {...body} />}
      </DrawerContent>
    </Drawer>
  );
}
