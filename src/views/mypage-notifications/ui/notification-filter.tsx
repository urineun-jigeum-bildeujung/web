// 알림을 거르는 칩 줄. 하나만 고를 수 있어 시맨틱은 라디오다.
// 와이어프레임 기준(noti_001)이라 디자인 확정 시 바뀔 수 있다.
//
// shared의 ChipSelect를 쓰지 않는다. 그것은 온보딩에서 보기를 고르는 큰 칩이라
// 폭을 균등하게 나누는데, 여기 시안은 글자 크기에 맞는 작은 칩이 왼쪽에 늘어선다.
// 검색·상품 상세에도 같은 모양이 보이므로 두 번째 화면에서 쓰게 되면 공용으로 올린다.

import { useId } from "react";

import { cn } from "@/shared/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";

type FilterOption = { value: string; label: string };

type NotificationFilterProps = {
  label: string;
  options: FilterOption[];
  value: string;
  onValueChange: (value: string) => void;
};

export function NotificationFilter({
  label,
  options,
  value,
  onValueChange,
}: NotificationFilterProps) {
  const id = useId();

  return (
    <RadioGroup
      aria-label={label}
      value={value}
      onValueChange={onValueChange}
      className="flex flex-wrap gap-2"
    >
      {options.map((option) => {
        const itemId = `${id}-${option.value}`;
        const selected = value === option.value;

        return (
          <div key={option.value} className="relative">
            {/* 라디오는 숨기고 레이블을 누르게 한다. peer로 포커스 표시를 잇는다. */}
            <RadioGroupItem id={itemId} value={option.value} className="peer sr-only" />
            <label
              htmlFor={itemId}
              className={cn(
                "flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm transition-colors",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                selected
                  ? "border-foreground bg-foreground font-medium text-background"
                  : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {option.label}
            </label>
          </div>
        );
      })}
    </RadioGroup>
  );
}
