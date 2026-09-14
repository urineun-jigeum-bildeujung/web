import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

import { TYPO_TOKENS } from "./typo/typo-tokens"

// shadcn CLI가 만든 파일이지만 twMerge 설정 한 줄을 얹었다(#176).
// tailwind-merge는 CSS를 읽지 않아 @theme의 타이포 토큰(text-title-bold-20 등)을 모르고,
// 모르는 text-*는 글자색으로 분류한다. 그대로 두면 cn("text-title-bold-20", "text-foreground")가
// 타이포를 지운다. 토큰 이름을 글자 크기 그룹(theme.text)에 등록해 색과 겹치지 않게 한다.
const twMerge = extendTailwindMerge({
  extend: { theme: { text: [...TYPO_TOKENS] } },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
