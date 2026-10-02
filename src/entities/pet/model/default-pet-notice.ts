// 기본(대표) 아이를 바꾼 뒤 띄우는 알림 문구. 메인과 맞춤 추천이 같은 문구를 쓴다.

import { withJosa } from "@/shared/lib/josa/josa";

/**
 * "대표 아이가 보리로 바뀌었어요". 무엇이 바뀌었는지 드러나게 정했다(QA HM-021, #657) — 전에는
 * "보리로 바꿨어요"라 화면 안 선택만 바뀐 것인지 대표 아이가 바뀐 것인지 갈리지 않았다
 */
export function defaultPetChangedMessage(name: string): string {
  return `대표 아이가 ${withJosa(name, "으로/로")} 바뀌었어요`;
}
