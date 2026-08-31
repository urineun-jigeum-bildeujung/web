// 염려질환과 알러지 성분을 받는 마지막 입력 단계.
// 와이어프레임 기준(onbo_004)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import type { PetProfileDraft } from "@/entities/pet";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";
import { FormField } from "@/shared/ui/form-field/form-field";

type HealthStepProps = {
  draft: PetProfileDraft;
  onChange: (patch: Partial<PetProfileDraft>) => void;
  onPrev: () => void;
  onSubmit: () => void;
};

export function HealthStep({ draft, onChange, onPrev, onSubmit }: HealthStepProps) {
  // 적었거나 "해당 없음"을 골랐거나, 두 항목 모두 답이 있어야 넘어간다
  // 공백만 적은 것은 답한 것으로 세지 않는다
  const concernAnswered = draft.concern.trim() !== "" || draft.noConcern;
  const allergyAnswered = draft.allergy.trim() !== "" || draft.noAllergy;

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
          <FormField
            label="평소 신경 쓰이는 곳"
            className="[&>label]:sr-only"
            hint="ex) 눈물자국, 관절, 피부 등"
            placeholder="눈물자국"
            value={draft.concern}
            disabled={draft.noConcern}
            onChange={(event) => onChange({ concern: event.target.value })}
            onClear={() => onChange({ concern: "" })}
          />
          <CheckboxRow
            label="해당 사항이 없어요"
            checked={draft.noConcern}
            onCheckedChange={(noConcern) =>
              onChange({ noConcern, concern: noConcern ? "" : draft.concern })
            }
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-foreground">피해야 할 알러지 성분이 있나요</p>
          <p className="text-xs text-muted-foreground">
            안심하고 먹을 수 있도록 알려주시면 유발 성분은 미리 걸러낼게요.
          </p>
          <FormField
            label="피해야 할 알러지 성분"
            className="[&>label]:sr-only"
            hint="ex) 닭고기, 밀, 연어, 밀가루 등"
            placeholder="해당 사항 없음"
            value={draft.allergy}
            disabled={draft.noAllergy}
            onChange={(event) => onChange({ allergy: event.target.value })}
            onClear={() => onChange({ allergy: "" })}
          />
          <CheckboxRow
            label="해당 사항이 없어요"
            checked={draft.noAllergy}
            onCheckedChange={(noAllergy) =>
              onChange({ noAllergy, allergy: noAllergy ? "" : draft.allergy })
            }
          />
        </div>
      </main>

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
