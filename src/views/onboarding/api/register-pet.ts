// 반려동물 프로필을 등록한다. 온보딩 마지막 단계에서 한 번 부른다.
//
// 요청 본문은 `model/to-register-request.ts`가 초안에서 만든다. 화면 값과 API 값의 모양이
// 거의 다 달라 옮기는 자리를 따로 뒀다.

import { apiRequest } from "@/shared/api/client";

import type { PetRegisterRequest } from "../model/to-register-request";

/** 백엔드 `PetRegisterResponse`와 같은 모양이다 */
export type RegisteredPet = {
  petId: number;
  name: string;
  species: "DOG" | "CAT";
  isDefault: boolean;
  breedId: number;
};

export function registerPet(request: PetRegisterRequest): Promise<RegisteredPet> {
  return apiRequest<RegisteredPet>("/members/me/pets", { method: "POST", body: request });
}
