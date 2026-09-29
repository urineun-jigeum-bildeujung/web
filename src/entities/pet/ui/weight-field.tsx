// 몸무게 입력칸. 온보딩 상세와 정보 수정 체형이 함께 쓴다 (#524).
//
// **칸을 벗어나면 값 뒤에 kg을 붙여 보인다.** 시안(정보 수정 체형 1507-43555)이 값을 "4kg"으로
// 그린다(QA No.206·242). 치는 동안에는 숫자만 두어야 지우고 고치기 쉽다.
// `FormField`의 `trailing`으로 단위를 붙이면 지우기 버튼이 사라져 그 길은 쓰지 않는다.

"use client";

import { useState, type ReactNode } from "react";

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
  const [editing, setEditing] = useState(false);

  return (
    <FormField
      {...props}
      inputMode="decimal"
      value={editing || !value ? value : `${value}kg`}
      onFocus={() => setEditing(true)}
      onBlur={() => {
        setEditing(false);
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
