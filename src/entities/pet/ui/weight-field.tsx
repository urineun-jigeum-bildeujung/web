// 몸무게 입력칸. 온보딩 상세와 정보 수정 체형이 함께 쓴다 (#524).
//
// **값 뒤에 kg을 붙여 보인다.** 시안(정보 수정 체형 1507-43555)이 값을 "4kg"으로 그린다(QA No.206·242).
// 단위는 `FormField`의 `suffix`로 값 끝에 겹쳐 그리고 입력값에는 넣지 않는다 — 포커스에 따라 값을
// "4"↔"4kg"으로 바꿔 끼우면 Tab으로 들어와 전체 선택된 값이 풀려, 새로 친 숫자가 뒤에 붙는다.
// `trailing`으로 붙이면 지우기 버튼이 사라져 그 길도 쓰지 않는다.

"use client";

import type { ReactNode } from "react";

import { FormField } from "@/shared/ui/form-field/form-field";

import { formatWeight, parseWeight } from "../model/parse-profile-input";
import { toWeightInput } from "../model/profile-input";

type WeightFieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  placeholder?: string;
  className?: string;
  /** 단위 없이 숫자만 든 몸무게. "4.5" */
  value: string;
  onValueChange: (value: string) => void;
};

export function WeightField({ value, onValueChange, ...props }: WeightFieldProps) {
  return (
    <FormField
      {...props}
      inputMode="decimal"
      value={value}
      suffix="kg"
      onBlur={() => {
        // "4."·"04"처럼 치다 만 모양을 다듬는다. 못 알아들으면 그대로 두어 오류가 보이게 한다
        const parsed = parseWeight(value);
        if (parsed !== null) {
          onValueChange(formatWeight(parsed));
        }
      }}
      onChange={(event) => onValueChange(toWeightInput(event.target.value))}
      onClear={() => onValueChange("")}
    />
  );
}
