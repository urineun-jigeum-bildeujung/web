// 건강 관심사·알러지 성분을 고르는 자리. 누르면 시트가 열리고 고른 것을 칩으로 되보인다.
// 와이어프레임 기준(onbo_004, mypa_321)이라 디자인 확정 시 바뀔 수 있다.
//
// 온보딩과 마이페이지 수정 화면이 같은 값을 고쳐서 겉모습도 동작도 같아야 한다.
// 한쪽만 자유 입력으로 두면 같은 질환이 여러 표기로 쌓여 추천에 쓸 수 없다.

"use client";

import { useState } from "react";
import { IoChevronForward } from "react-icons/io5";

import { cn } from "@/shared/lib/utils";

import type { HealthGroup } from "../model/health";
import { HealthPickerSheet } from "./health-picker-sheet";

type HealthPickerFieldProps = {
  /** 시트 제목이자 이 자리의 이름. "걱정되는 질환" 같은 것 */
  title: string;
  groups: HealthGroup[];
  value: string[];
  onChange: (next: string[]) => void;
  /** 아직 고르지 않았을 때 보일 문구 */
  placeholder: string;
  disabled?: boolean;
  /** 잠겼을 때 대신 보일 문구. 시안이 "해당 사항 없음"으로 바꾼다 */
  disabledPlaceholder?: string;
};

export function HealthPickerField({
  title,
  groups,
  value,
  onChange,
  placeholder,
  disabled,
  disabledPlaceholder,
}: HealthPickerFieldProps) {
  const [open, setOpen] = useState(false);

  const empty = disabled ? (disabledPlaceholder ?? placeholder) : placeholder;

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        aria-label={title}
        onClick={() => setOpen(true)}
        className={cn(
          "flex min-h-11 w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-left transition-colors",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          disabled ? "bg-muted opacity-50" : "bg-background hover:bg-muted",
        )}
      >
        {/* 잠겼으면 고른 것이 있어도 문구를 보인다. 답이 아니라고 표시한 상태다 */}
        {!disabled && value.length > 0 ? (
          // 고른 것을 칩으로 되보인다. 무엇을 골랐는지 시트를 다시 열지 않아도 안다
          <span className="flex flex-1 flex-wrap gap-1">
            {value.map((item) => (
              <span
                key={item}
                className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground"
              >
                {item}
              </span>
            ))}
          </span>
        ) : (
          <span className="flex-1 text-sm text-muted-foreground">{empty}</span>
        )}
        <IoChevronForward aria-hidden className="size-4 shrink-0 text-muted-foreground" />
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
