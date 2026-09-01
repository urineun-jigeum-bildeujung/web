// 아이 건강 정보 수정. 신경 쓰이는 곳과 피해야 할 성분을 고친다.
// 와이어프레임 기준(mypa_321)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { useState } from "react";

import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";
import { FormField } from "@/shared/ui/form-field/form-field";

import { EditPetScreen } from "./edit-pet-screen";

/** API 연동 전까지 화면 확인용 값 */
const SAVED = { concern: "눈물자국", noConcern: false, allergy: "해당 사항 없음", noAllergy: true };

export function EditPetHealthView() {
  const [concern, setConcern] = useState(SAVED.concern);
  const [noConcern, setNoConcern] = useState(SAVED.noConcern);
  const [allergy, setAllergy] = useState(SAVED.allergy);
  const [noAllergy, setNoAllergy] = useState(SAVED.noAllergy);

  // 공백만 적은 것은 답한 것으로 세지 않는다.
  const concernAnswered = concern.trim() !== "" || noConcern;
  const allergyAnswered = allergy.trim() !== "" || noAllergy;

  return (
    <EditPetScreen submitDisabled={!concernAnswered || !allergyAnswered}>
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
          value={noConcern ? "" : concern}
          disabled={noConcern}
          onChange={(event) => setConcern(event.target.value)}
        />
        <CheckboxRow
          label="해당 사항이 없어요"
          checked={noConcern}
          onCheckedChange={setNoConcern}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-foreground">피해야 할 알러지 성분이 있나요</p>
        <p className="text-xs text-muted-foreground">
          안심하고 먹을 수 있도록 알러지 유발 성분은 미리 걸러낼게요.
        </p>
        <FormField
          label="피해야 할 알러지 성분"
          className="[&>label]:sr-only"
          hint="ex) 복숭아, 닭, 연어, 밀가루 등"
          value={noAllergy ? "" : allergy}
          disabled={noAllergy}
          onChange={(event) => setAllergy(event.target.value)}
        />
        <CheckboxRow
          label="해당 사항이 없어요"
          checked={noAllergy}
          onCheckedChange={setNoAllergy}
        />
      </div>
    </EditPetScreen>
  );
}
