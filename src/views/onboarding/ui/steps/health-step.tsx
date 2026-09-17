// 건강 관심사와 알러지 성분을 받는 마지막 입력 단계.
// UI 시안 기준(onbo_004, onbo_004_바텀, onbo_004_선택, onbo_004_사항 없음 체크)이다.
//
// 자유 입력이 아니라 정해진 목록에서 고른다. 보호자마다 다르게 적으면 같은 질환이
// 여러 표기로 쌓여 추천에 쓸 수 없다. 고르는 자리는 마이페이지 수정 화면과 같은
// `HealthPickerField`를 쓴다 — 같은 값을 고치므로 한쪽만 달라지면 안 된다.

"use client";

import { HealthPickerField, useQueryHealthOptions, type PetProfileDraft } from "@/entities/pet";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";

type HealthStepProps = {
  draft: PetProfileDraft;
  onChange: (patch: Partial<PetProfileDraft>) => void;
  onPrev: () => void;
  onSubmit: () => void;
  /** 등록 요청이 도는 중. 두 번 눌러 두 마리가 등록되는 것을 막는다 */
  isSubmitting?: boolean;
};

export function HealthStep({ draft, onChange, onPrev, onSubmit, isSubmitting }: HealthStepProps) {
  // 갈래도 항목도 종마다 다르다. 고른 종의 것만 받는다
  const { options } = useQueryHealthOptions(draft.species);

  // 골랐거나 "해당 없음"을 켰거나, 두 항목 모두 답이 있어야 넘어간다
  const concernAnswered = draft.concern.length > 0 || draft.noConcern;
  const allergyAnswered = draft.allergy.length > 0 || draft.noAllergy;

  return (
    <>
      <main className="flex flex-1 flex-col gap-5 pt-5 pb-6">
        <h1 className="px-5 text-title-bold-20 text-foreground">꼼꼼하게 건강을 챙겨줄게요</h1>

        <div className="flex flex-col gap-5 px-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-title-bold-16 text-foreground">
                아이가 튼튼할 수 있도록
                <br />
                평소 신경 쓰이는 곳을 알려주세요
              </p>
              <p className="text-body-medium-14 text-text-body-secondary">
                걱정되는 부분을 알려주시면 꼭 맞는 상품을 찾아드릴게요.
              </p>
            </div>
            <HealthPickerField
              title="걱정되는 질환"
              groups={options?.concerns ?? []}
              value={draft.concern}
              onChange={(concern) => onChange({ concern })}
              disabled={draft.noConcern}
            />
            <CheckboxRow
              label="해당 사항이 없어요"
              checked={draft.noConcern}
              onCheckedChange={(noConcern) =>
                onChange({ noConcern, concern: noConcern ? [] : draft.concern })
              }
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-title-bold-16 text-foreground">피해야 할 알러지 성분이 있나요</p>
              <p className="text-body-medium-14 text-text-body-secondary">
                안심하고 먹을 수 있도록 알러지 유발 성분은 미리 걸러낼게요.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <HealthPickerField
                title="피해야 할 성분"
                groups={options?.allergies ?? []}
                value={draft.allergy}
                onChange={(allergy) => onChange({ allergy })}
                disabled={draft.noAllergy}
              />
              {/* 시안(onbo_004)이 알러지 쪽에만 예시를 남긴다 */}
              <p className="text-caption-regular-12 text-text-body-tertiary">
                ex) 복숭아, 닭, 연어, 밀가루 등
              </p>
            </div>
            <CheckboxRow
              label="해당 사항이 없어요"
              checked={draft.noAllergy}
              onCheckedChange={(noAllergy) =>
                onChange({ noAllergy, allergy: noAllergy ? [] : draft.allergy })
              }
            />
          </div>
        </div>
      </main>

      <BottomActionBar>
        <Button variant="secondary" onClick={onPrev}>
          이전
        </Button>
        <Button disabled={!concernAnswered || !allergyAnswered || isSubmitting} onClick={onSubmit}>
          작성 완료
        </Button>
      </BottomActionBar>
    </>
  );
}
