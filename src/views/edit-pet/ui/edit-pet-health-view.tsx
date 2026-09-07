// 아이 건강 정보 수정. 신경 쓰이는 곳과 피해야 할 성분을 고친다.
// 와이어프레임 기준(mypa_321)이라 디자인 확정 시 바뀔 수 있다.
//
// 온보딩에서 고른 값을 여기서 고친다. 한쪽만 자유 입력이면 같은 질환이
// 여러 표기로 쌓여 추천에 쓸 수 없어, 고르는 자리를 온보딩과 같은 것으로 쓴다.

"use client";

import { useState } from "react";

import { ALLERGY_GROUPS, CONCERN_GROUPS, HealthPickerField } from "@/entities/pet";
import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";

import { EditPetScreen } from "./edit-pet-screen";

/** API 연동 전까지 화면 확인용 값 */
// 해당 없음이 켜진 항목은 값을 비워 둔다. 체크를 끄면 다시 답을 받아야 한다.
const SAVED = {
  concern: ["슬개골 탈구"],
  noConcern: false,
  allergy: [] as string[],
  noAllergy: true,
};

export function EditPetHealthView() {
  const [concern, setConcern] = useState(SAVED.concern);
  const [noConcern, setNoConcern] = useState(SAVED.noConcern);
  const [allergy, setAllergy] = useState(SAVED.allergy);
  const [noAllergy, setNoAllergy] = useState(SAVED.noAllergy);

  const concernAnswered = concern.length > 0 || noConcern;
  const allergyAnswered = allergy.length > 0 || noAllergy;

  return (
    <EditPetScreen submitDisabled={!concernAnswered || !allergyAnswered}>
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
          value={concern}
          onChange={setConcern}
          placeholder="신경 쓰이는 곳을 골라주세요"
          disabled={noConcern}
          disabledPlaceholder="해당 사항 없음"
        />
        <CheckboxRow
          label="해당 사항이 없어요"
          checked={noConcern}
          onCheckedChange={(next) => {
            setNoConcern(next);
            // 켠 채로 값을 남겨 두면 체크를 껐을 때 그것이 답으로 되살아난다
            if (next) setConcern([]);
          }}
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
          value={allergy}
          onChange={setAllergy}
          placeholder="피해야 할 성분을 골라주세요"
          disabled={noAllergy}
          disabledPlaceholder="해당 사항 없음"
        />
        {/* 시안(mypa_321)이 알러지 쪽에만 예시를 남긴다 */}
        <p className="text-xs text-muted-foreground">ex) 복숭아, 닭, 연어, 밀가루 등</p>
        <CheckboxRow
          label="해당 사항이 없어요"
          checked={noAllergy}
          onCheckedChange={(next) => {
            setNoAllergy(next);
            if (next) setAllergy([]);
          }}
        />
      </div>
    </EditPetScreen>
  );
}
