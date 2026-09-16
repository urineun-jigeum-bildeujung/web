import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

import { TYPO_TOKENS } from "./typo/typo-tokens"

// shadcn CLI가 만든 파일이지만 twMerge 설정을 얹었다(#176, #219).
//
// tailwind-merge는 CSS를 읽지 않아 @theme의 타이포 토큰(text-title-bold-20 등)을 모르고,
// 모르는 text-*는 글자색으로 분류한다. 그대로 두면 cn("text-title-bold-20", "text-foreground")가
// 타이포를 지운다. 그래서 토큰을 직접 알려 준다.
//
// **크기 그룹이 아니라 전용 그룹으로 둔다.** 타이포 토큰은 크기·행간·굵기를 한 벌로 정하는데,
// 기본 크기 그룹(text-sm 등)은 굵기와 충돌하지 않는다 — `text-sm font-bold`가 정상이기 때문이다.
// 크기 그룹에 넣어 두면 굵기를 걷어낼 수 없어, shadcn이 달고 오는 font-medium이 그대로 남는다.
// 토큰의 굵기는 `font-weight: var(--tw-font-weight, 700)`이고 font-medium이 그 변수를 채우므로,
// 남아 있으면 **선언 순서와 무관하게** 토큰의 700이 절대 적용되지 않는다(#219). 행간도 같다.
const twMerge = extendTailwindMerge<"typo">({
  extend: {
    classGroups: {
      typo: [{ text: [...TYPO_TOKENS] }],
    },
    conflictingClassGroups: {
      // 토큰이 뒤에 오면 앞의 크기·굵기·행간을 걷어낸다. 한 벌로 정하는 값이기 때문이다
      typo: ["font-size", "font-weight", "leading"],
      // 반대로 기본 크기 유틸이 뒤에 오면 토큰을 걷어낸다
      "font-size": ["typo"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
