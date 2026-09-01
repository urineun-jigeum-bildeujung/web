// 결제 수단 고르기. 페이결제를 고르면 어느 페이인지 한 번 더 고른다.
// 와이어프레임 기준(paym_001)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { cn } from "@/shared/lib/utils";
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";

export const PAY_METHODS = [
  { value: "simple", label: "간편결제" },
  { value: "pay", label: "페이결제" },
  { value: "card", label: "일반카드결제" },
  { value: "transfer", label: "무통장입금" },
  { value: "phone", label: "휴대폰" },
] as const;

/** 시안에 로고로 들어간 세 곳. 이미지가 없어 이름으로 그린다 */
const PAY_BRANDS = [
  { value: "toss", label: "toss pay" },
  { value: "kakao", label: "카카오페이" },
  { value: "naver", label: "네이버페이" },
];

type PayMethodPickerProps = {
  method: string;
  onMethodChange: (value: string) => void;
  brand: string;
  onBrandChange: (value: string) => void;
};

export function PayMethodPicker({
  method,
  onMethodChange,
  brand,
  onBrandChange,
}: PayMethodPickerProps) {
  return (
    <RadioGroup value={method} onValueChange={onMethodChange} className="flex flex-col gap-3">
      {PAY_METHODS.map((item) => (
        <div key={item.value} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <RadioGroupItem id={`pay-${item.value}`} value={item.value} />
            <Label htmlFor={`pay-${item.value}`} className="text-sm">
              {item.label}
            </Label>
          </div>

          {/* 페이결제를 골랐을 때만 어느 페이인지 묻는다 */}
          {item.value === "pay" && method === "pay" && (
            <RadioGroup
              aria-label="페이 종류"
              value={brand}
              onValueChange={onBrandChange}
              className="grid grid-cols-3 gap-2"
            >
              {PAY_BRANDS.map((option) => (
                <div key={option.value} className="relative">
                  <RadioGroupItem
                    id={`brand-${option.value}`}
                    value={option.value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`brand-${option.value}`}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center justify-center rounded-lg border text-xs",
                      "peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                      brand === option.value
                        ? "border-foreground bg-background font-medium text-foreground"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </div>
      ))}
    </RadioGroup>
  );
}
