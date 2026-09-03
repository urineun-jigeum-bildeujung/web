// 최근에 산 제품이 아이에게 맞았는지 묻고 그 반응을 받는다.
// 와이어프레임 기준(메인_상태 체크 바텀시트 1·2·3)이라 디자인 확정 시 바뀔 수 있다.
//
// 이 서비스가 "근거 있는 판단"으로 가는 자리다. 받은 반응이 다음 추천 적합도로 되돌아간다.

"use client";

import { useState } from "react";
import { IoHappyOutline, IoSadOutline, IoCheckmarkCircle, IoRemoveOutline } from "react-icons/io5";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";

export const FEEDBACKS = [
  { value: "good", label: "잘 맞았어요", icon: IoHappyOutline },
  { value: "soso", label: "그냥 그랬어요", icon: IoRemoveOutline },
  { value: "bad", label: "안 맞았어요", icon: IoSadOutline },
] as const;

export type FeedbackTarget = {
  productId: string;
  productName: string;
  /** "구매 후 6일" 같은 표시 */
  sinceLabel: string;
  /** "3번째 구매" 같은 표시 */
  countLabel: string;
};

type ProductFeedbackSheetProps = {
  target: FeedbackTarget | null;
  petName: string;
  onOpenChange: (open: boolean) => void;
  /** 반응을 남긴 뒤 그 상품을 보러 간다 */
  onSeeProduct?: (productId: string) => void;
};

export function ProductFeedbackSheet({
  target,
  petName,
  onOpenChange,
  onSeeProduct,
}: ProductFeedbackSheetProps) {
  const [picked, setPicked] = useState<string>();
  const [tooEarly, setTooEarly] = useState(false);
  const [done, setDone] = useState(false);

  const close = (open: boolean) => {
    if (!open) {
      setPicked(undefined);
      setTooEarly(false);
      setDone(false);
    }
    onOpenChange(open);
  };

  return (
    <Drawer open={target !== null} onOpenChange={close}>
      <DrawerContent>
        {done ? (
          <div className="flex flex-col items-center gap-2 px-4 pt-2 pb-6">
            <DrawerHeader className="items-center p-0">
              <IoCheckmarkCircle aria-hidden className="size-10 text-brand" />
              <DrawerTitle className="text-base">반응이 등록됐어요</DrawerTitle>
            </DrawerHeader>
            {/* 남긴 반응이 어디에 쓰이는지 알린다. 이 서비스의 약속이다 */}
            <p className="text-sm text-muted-foreground">
              {petName}의 다음 추천 적합도에 반영할게요
            </p>
            {picked && (
              <span className="rounded-full bg-muted px-3 py-1 text-sm text-foreground">
                {FEEDBACKS.find((item) => item.value === picked)?.label}
              </span>
            )}

            <div className="flex w-full gap-2 pt-2">
              <DrawerClose asChild>
                <Button variant="outline" className="min-h-11 flex-1">
                  계속 쇼핑하기
                </Button>
              </DrawerClose>
              <Button
                className="min-h-11 flex-1"
                onClick={() => target && onSeeProduct?.(target.productId)}
              >
                자세히 보러 갈게요
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-4 pt-2 pb-6">
            <DrawerHeader className="p-0">
              <DrawerTitle className="text-left text-base">{petName}에게 잘 맞았나요?</DrawerTitle>
            </DrawerHeader>

            {target && (
              <div className="flex items-center gap-3">
                <span aria-hidden className="size-12 shrink-0 rounded-lg bg-muted" />
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {target.productName}
                  </p>
                  <p className="flex gap-1 text-xs">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                      {target.sinceLabel}
                    </span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                      {target.countLabel}
                    </span>
                  </p>
                </div>
              </div>
            )}

            <div
              role="radiogroup"
              aria-label="아이에게 잘 맞았는지"
              className="flex justify-around"
            >
              {FEEDBACKS.map((item) => {
                const Icon = item.icon;
                const selected = picked === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPicked(item.value)}
                    className={cn(
                      "flex min-h-11 flex-col items-center gap-1 rounded-lg px-3 py-2 transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      selected ? "text-brand" : "text-muted-foreground",
                    )}
                  >
                    <Icon
                      aria-hidden
                      className={cn(
                        "size-8 rounded-full border p-1",
                        selected ? "border-brand" : "border-border",
                      )}
                    />
                    <span className="text-xs">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 아직 답할 수 없다는 것도 답이다. 억지로 고르게 하면 값이 흐려진다 */}
            <CheckboxRow
              label="아직 판단하기에는 일러요 (며칠 더 지켜볼게요)"
              checked={tooEarly}
              onCheckedChange={(next) => {
                setTooEarly(next);
                if (next) setPicked(undefined);
              }}
            />

            <Button
              className="min-h-11"
              disabled={!picked && !tooEarly}
              onClick={() => setDone(true)}
            >
              등록하기
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
