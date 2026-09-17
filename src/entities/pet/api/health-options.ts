// 건강 고민과 알레르기 선택지를 백엔드에서 받는다. 종에 따라 갈래도 항목도 다르다.
//
// **알레르기만 코드 체계다.** 응답이 `{ code, displayName }`을 주므로 화면에는 표시명을 보이고
// 저장은 코드로 한다. 건강 고민은 한글 문자열 그대로 주고받는다 — 비대칭이라 백엔드에
// 확인을 요청해 두었다(#226).

import { apiRequest } from "@/shared/api/client";

import { SPECIES_PARAM, type PetSpecies } from "../model/breeds";
import type { HealthGroup } from "../model/health";

/** 백엔드 `PetHealthOptionsResponse`와 같은 모양이다 */
type HealthOptionsResponse = {
  categories: { category: string; items: string[] }[];
  allergies: { code: string; displayName: string }[];
};

export type HealthOptions = {
  /** 걱정되는 질환. 대분류별로 갈린다 */
  concerns: HealthGroup[];
  /**
   * 알레르기 성분.
   *
   * **서버가 묶음 없이 평평하게 준다.** 시트가 묶음 단위로 그리므로 한 묶음으로 싸서 넘긴다.
   * 갈래가 생기면 그때 나눈다.
   */
  allergies: HealthGroup[];
};

export async function getHealthOptions(species: PetSpecies): Promise<HealthOptions> {
  const response = await apiRequest<HealthOptionsResponse>("/pets/health-options", {
    query: { species: SPECIES_PARAM[species] },
  });

  return {
    concerns: response.categories.map(({ category, items }) => ({
      label: category,
      // 고민은 코드가 없어 값과 표시가 같다
      items: items.map((item) => ({ value: item, label: item })),
    })),
    allergies: [
      {
        label: "알레르기",
        items: response.allergies.map(({ code, displayName }) => ({
          value: code,
          label: displayName,
        })),
      },
    ],
  };
}
