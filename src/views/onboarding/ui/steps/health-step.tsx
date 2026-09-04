// 건강 관심사와 알러지 성분을 받는 마지막 입력 단계.
// 와이어프레임 기준(onbo_004, onbo_004_바텀, onbo_004_선택)이라 디자인 확정 시 바뀔 수 있다.
//
// 자유 입력이 아니라 정해진 목록에서 고른다. 보호자마다 다르게 적으면 같은 질환이
// 여러 표기로 쌓여 추천에 쓸 수 없다.

"use client";

import { useState } from "react";
import { IoChevronForward } from "react-icons/io5";

import {
  ALLERGY_GROUPS,
  CONCERN_GROUPS,
  HealthPickerSheet,
  type HealthGroup,
  type PetProfileDraft,
} from "@/entities/pet";
import { cn } from "@/shared/lib/utils";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";

type HealthStepProps = {
  draft: PetProfileDraft;
  onChange: (patch: Partial<PetProfileDraft>) => void;
  onPrev: () => void;
  onSubmit: () => void;
};

type Field = "concern" | "allergy";

const SHEET: Record<Field, { title: string; groups: HealthGroup[]; placeholder: string }> = {
  concern: {
    title: "걱정되는 질환",
    groups: CONCERN_GROUPS,
    placeholder: "신경 쓰이는 곳을 골라주세요",
  },
  allergy: {
    title: "피해야 할 성분",
    groups: ALLERGY_GROUPS,
    placeholder: "피해야 할 성분을 골라주세요",
  },
};

export function HealthStep({ draft, onChange, onPrev, onSubmit }: HealthStepProps) {
  const [openField, setOpenField] = useState<Field | null>(null);

  // 골랐거나 "해당 없음"을 켰거나, 두 항목 모두 답이 있어야 넘어간다
  const concernAnswered = draft.concern.length > 0 || draft.noConcern;
  const allergyAnswered = draft.allergy.length > 0 || draft.noAllergy;

  const renderPicker = (field: Field) => {
    const picked = draft[field];
    const disabled = field === "concern" ? draft.noConcern : draft.noAllergy;

    return (
      <button
        type="button"
        disabled={disabled}
        aria-label={SHEET[field].title}
        onClick={() => setOpenField(field)}
        className={cn(
          "flex min-h-11 w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-left transition-colors",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          disabled ? "bg-muted opacity-50" : "bg-background hover:bg-muted",
        )}
      >
        {picked.length > 0 ? (
          // 고른 것을 칩으로 되보인다. 무엇을 골랐는지 시트를 다시 열지 않아도 안다
          <span className="flex flex-1 flex-wrap gap-1">
            {picked.map((item) => (
              <span
                key={item}
                className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground"
              >
                {item}
              </span>
            ))}
          </span>
        ) : (
          <span className="flex-1 text-sm text-muted-foreground">{SHEET[field].placeholder}</span>
        )}
        <IoChevronForward aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      </button>
    );
  };

  return (
    <>
      <main className="flex flex-1 flex-col gap-6 px-4 pt-2 pb-4">
        <h1 className="text-xl font-bold text-foreground">꼼꼼하게 건강을 챙겨줄게요</h1>

        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-foreground">
            아이가 튼튼할 수 있도록 평소 신경 쓰이는 곳을 알려주세요
          </p>
          <p className="text-xs text-muted-foreground">
            걱정되는 부분을 알려주시면 꼭 맞는 상품을 찾아드릴게요.
          </p>
          {renderPicker("concern")}
          <CheckboxRow
            label="해당 사항이 없어요"
            checked={draft.noConcern}
            onCheckedChange={(noConcern) =>
              onChange({ noConcern, concern: noConcern ? [] : draft.concern })
            }
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-foreground">피해야 할 알러지 성분이 있나요</p>
          <p className="text-xs text-muted-foreground">
            안심하고 먹을 수 있도록 알려주시면 유발 성분은 미리 걸러낼게요.
          </p>
          {renderPicker("allergy")}
          <CheckboxRow
            label="해당 사항이 없어요"
            checked={draft.noAllergy}
            onCheckedChange={(noAllergy) =>
              onChange({ noAllergy, allergy: noAllergy ? [] : draft.allergy })
            }
          />
        </div>
      </main>

      {openField && (
        <HealthPickerSheet
          open
          onOpenChange={(next) => !next && setOpenField(null)}
          title={SHEET[openField].title}
          groups={SHEET[openField].groups}
          value={draft[openField]}
          onConfirm={(next) => {
            onChange({ [openField]: next });
            setOpenField(null);
          }}
        />
      )}

      <BottomActionBar>
        <Button variant="outline" className="min-h-11" onClick={onPrev}>
          이전
        </Button>
        <Button
          className="min-h-11"
          disabled={!concernAnswered || !allergyAnswered}
          onClick={onSubmit}
        >
          다음 단계 작성하기
        </Button>
      </BottomActionBar>
    </>
  );
}
