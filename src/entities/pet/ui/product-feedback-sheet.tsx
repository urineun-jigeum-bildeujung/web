// 최근에 산 제품이 아이에게 맞았는지 묻고 그 반응을 받는다.
// UI 시안 기준(메인 상태 체크 시트, 1758-69187·1758-69255)이다. 마이페이지 반응 시트
// (mypa_021, 1551-47882)도 같은 선택 로직이지만 감싸는 시트 모양이 달라(뜨는 카드) `variant="floating"`을
// 그쪽에서 쓴다.
//
// 이 서비스가 "근거 있는 판단"으로 가는 자리다. 받은 반응이 다음 추천 적합도로 되돌아간다.

"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge/badge";
import { BottomSheet } from "@/shared/ui/bottom-sheet/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";
import { DrawerClose, DrawerTitle } from "@/shared/ui/drawer";
import { Icon } from "@/shared/ui/icon/icon";

export const FEEDBACKS = [
  { value: "good", label: "잘 맞았어요", icon: "good" },
  { value: "soso", label: "그냥 그랬어요", icon: "soso" },
  { value: "bad", label: "안 맞았어요", icon: "bad" },
] as const;

export type FeedbackTarget = {
  productId: string;
  productName: string;
  imageUrl?: string;
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
  /** 감싸는 시트 모양. 메인 상태 체크는 `full`, 마이페이지 반응 시트는 기본값(`floating`) */
  variant?: "floating" | "full";
};

export function ProductFeedbackSheet({
  target,
  petName,
  onOpenChange,
  onSeeProduct,
  variant = "floating",
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
    <BottomSheet open={target !== null} onOpenChange={close} variant={variant}>
      {done ? (
        <div className="flex flex-col items-center gap-2 px-5 pb-4">
          <span className="flex size-10 items-center justify-center rounded-full bg-surface-brand">
            <Icon name="check" className="size-6 text-icon-fill-static-white" />
          </span>
          <DrawerTitle className="text-title-bold-18 text-foreground">
            반응이 등록됐어요
          </DrawerTitle>
          {/* 남긴 반응이 어디에 쓰이는지 알린다. 이 서비스의 약속이다 */}
          <p className="text-body-medium-14 text-text-body-secondary">
            {petName}의 다음 추천 적합도에 반영할게요
          </p>
          {picked && (
            <Badge className="px-2 py-1 text-label-medium-14">
              {FEEDBACKS.find((item) => item.value === picked)?.label}
            </Badge>
          )}

          <div className="flex w-full gap-2 pt-2">
            <DrawerClose asChild>
              <Button variant="outline" className="h-10 flex-1 text-label-bold-14">
                계속 쇼핑하기
              </Button>
            </DrawerClose>
            <Button
              className="h-10 flex-1 text-label-bold-14"
              onClick={() => target && onSeeProduct?.(target.productId)}
            >
              자세히 보러 갈게요
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-5 pb-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-title-bold-18 text-foreground">
              {petName}에게 잘 맞았나요?
            </DrawerTitle>
            <DrawerClose
              aria-label="닫기"
              className="flex size-10 items-center justify-center text-foreground"
            >
              <Icon name="cancel" className="size-6" />
            </DrawerClose>
          </div>

          {target && (
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-disable"
              >
                {target.imageUrl && (
                  <Image
                    src={target.imageUrl}
                    alt=""
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                )}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="truncate text-title-bold-16 text-foreground">{target.productName}</p>
                <p className="flex gap-2">
                  <Badge>{target.sinceLabel}</Badge>
                  <Badge tone="positive">{target.countLabel}</Badge>
                </p>
              </div>
            </div>
          )}

          <div
            role="radiogroup"
            aria-label="아이에게 잘 맞았는지"
            className="flex justify-center gap-8 pt-3"
          >
            {FEEDBACKS.map((item) => {
              const selected = picked === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setPicked(item.value);
                    // 둘 다 켜지면 무엇을 답한 것인지 알 수 없다
                    setTooEarly(false);
                  }}
                  className={cn(
                    "flex w-19 flex-col items-center gap-2 rounded-lg py-1 transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  )}
                >
                  {/* 고른 것은 배경·테두리색으로 알린다 */}
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-13 items-center justify-center rounded-full border-2",
                      selected
                        ? "border-brand bg-surface-brand-weak"
                        : "border-transparent bg-muted",
                    )}
                  >
                    <Icon
                      name={item.icon}
                      className={cn(
                        "size-6",
                        selected ? "text-icon-fill-brand" : "text-icon-fill-default",
                      )}
                    />
                  </span>
                  <span
                    className={cn(
                      "text-body-regular-13",
                      selected ? "text-brand" : "text-foreground",
                    )}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 아직 답할 수 없다는 것도 답이다. 억지로 고르게 하면 값이 흐려진다 */}
          <CheckboxRow
            label="아직 판단하기에는 일러요 (며칠 더 지켜볼게요)"
            labelClassName="text-body-regular-13 text-text-body-tertiary"
            className="min-h-8 pt-3"
            checked={tooEarly}
            onCheckedChange={(next) => {
              setTooEarly(next);
              if (next) setPicked(undefined);
            }}
          />

          <Button
            className="h-10 text-label-bold-14 disabled:bg-surface-disable disabled:text-text-label-disable disabled:opacity-100"
            disabled={!picked && !tooEarly}
            onClick={() => setDone(true)}
          >
            등록하기
          </Button>
        </div>
      )}
    </BottomSheet>
  );
}
