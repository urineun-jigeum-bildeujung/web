// 리뷰 상세의 짧은 문구들. 시안(943-15495)의 칩과 날짜 꼴을 서버 값에서 만든다.

import type { PetDetail } from "@/entities/pet";

/** "말티즈 · 8세 · 4kg". 몸무게는 소수 첫째 자리까지, `4.0`은 `4`로 */
export function toReviewPetProfile(pet: Pick<PetDetail, "breedName" | "age" | "weight">): string {
  return `${pet.breedName} · ${pet.age}세 · ${Number(pet.weight.toFixed(1))}kg`;
}

/** 시안의 "사용 3주째". 서버는 일 수를 주므로 일주일이 안 되면 날로, 되면 주로 말한다 */
export function toUsageLabel(days: number): string {
  return days < 7 ? `사용 ${days}일째` : `사용 ${Math.floor(days / 7)}주째`;
}

/** 시안의 "2026. 08. 31". 서버가 주는 `YYYY-MM-DD`를 점과 공백으로 잇는다. 읽을 수 없으면 비운다 */
export function toReviewDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  return match ? `${match[1]}. ${match[2]}. ${match[3]}` : "";
}
