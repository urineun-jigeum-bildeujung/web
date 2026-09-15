// 건강 관심사·알러지 성분을 고르는 자리. 누르면 시트가 열리고 고른 것을 배지로 되보인다.
// UI 시안 기준(onbo_004, onbo_004_선택)이다.
//
// 온보딩과 마이페이지 수정 화면이 같은 값을 고쳐서 겉모습도 동작도 같아야 한다.
// 한쪽만 자유 입력으로 두면 같은 질환이 여러 표기로 쌓여 추천에 쓸 수 없다.

"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icon/icon";

import type { HealthGroup } from "../model/health";
import { HealthPickerSheet } from "./health-picker-sheet";

type HealthPickerFieldProps = {
  /** 시트 제목이자 이 자리의 이름. "걱정되는 질환" 같은 것 */
  title: string;
  groups: HealthGroup[];
  value: string[];
  onChange: (next: string[]) => void;
  /** "해당 없음"을 켜면 잠긴다. 잠기면 회색으로 채워지고 고른 것도 보이지 않는다 */
  disabled?: boolean;
};

export function HealthPickerField({
  title,
  groups,
  value,
  onChange,
  disabled,
}: HealthPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const filled = !disabled && value.length > 0;

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        aria-label={title}
        onClick={() => setOpen(true)}
        className={cn(
          "flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          disabled
            ? "bg-surface-disable"
            : cn(
                "border bg-background hover:bg-muted",
                filled ? "border-border-secondary" : "border-border",
              ),
        )}
      >
        {/* 잠겼으면 고른 것이 있어도 비워 보인다. 답이 아니라고 표시한 상태다 */}
        <span className="flex flex-1 flex-wrap gap-1">
          {filled &&
            // 고른 것을 배지로 되보인다. 무엇을 골랐는지 시트를 다시 열지 않아도 안다
            value.map((item) => (
              <span
                key={item}
                className="rounded-sm bg-surface-secondary px-1 py-0.5 text-label-bold-12 text-text-body-secondary"
              >
                {item}
              </span>
            ))}
        </span>
        <Icon name="right" className="text-icon-stroke-tertiary" />
      </button>

      {open && (
        <HealthPickerSheet
          open
          onOpenChange={setOpen}
          title={title}
          groups={groups}
          value={value}
          onConfirm={(next) => {
            onChange(next);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
