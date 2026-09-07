// 건강 관심사와 알러지 성분을 받는 마지막 입력 단계.
// 와이어프레임 기준(onbo_004, onbo_004_바텀, onbo_004_선택)이라 디자인 확정 시 바뀔 수 있다.
//
// 자유 입력이 아니라 정해진 목록에서 고른다. 보호자마다 다르게 적으면 같은 질환이
// 여러 표기로 쌓여 추천에 쓸 수 없다. 고르는 자리는 마이페이지 수정 화면과 같은
// `HealthPickerField`를 쓴다 — 같은 값을 고치므로 한쪽만 달라지면 안 된다.

"use client";

import {
  ALLERGY_GROUPS,
  CONCERN_GROUPS,
  HealthPickerField,
  type PetProfileDraft,
} from "@/entities/pet";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";

type HealthStepProps = {
  draft: PetProfileDraft;
  onChange: (patch: Partial<PetProfileDraft>) => void;
  onPrev: () => void;
  onSubmit: () => void;
};

export function HealthStep({ draft, onChange, onPrev, onSubmit }: HealthStepProps) {
  // 골랐거나 "해당 없음"을 켰거나, 두 항목 모두 답이 있어야 넘어간다
  const concernAnswered = draft.concern.length > 0 || draft.noConcern;
  const allergyAnswered = draft.allergy.length > 0 || draft.noAllergy;

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
          <HealthPickerField
            title="걱정되는 질환"
            groups={CONCERN_GROUPS}
            value={draft.concern}
            onChange={(concern) => onChange({ concern })}
            placeholder="신경 쓰이는 곳을 골라주세요"
            disabled={draft.noConcern}
            disabledPlaceholder="해당 사항 없음"
          />
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
            안심하고 먹을 수 있도록 알러지 유발 성분은 미리 걸러낼게요.
          </p>
          <HealthPickerField
            title="피해야 할 성분"
            groups={ALLERGY_GROUPS}
            value={draft.allergy}
            onChange={(allergy) => onChange({ allergy })}
            placeholder="피해야 할 성분을 골라주세요"
            disabled={draft.noAllergy}
            disabledPlaceholder="해당 사항 없음"
          />
          {/* 시안(onbo_004·mypa_321)이 알러지 쪽에만 예시를 남긴다 */}
          <p className="text-xs text-muted-foreground">ex) 복숭아, 닭, 연어, 밀가루 등</p>
          <CheckboxRow
            label="해당 사항이 없어요"
            checked={draft.noAllergy}
            onCheckedChange={(noAllergy) =>
              onChange({ noAllergy, allergy: noAllergy ? [] : draft.allergy })
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
