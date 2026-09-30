// 고른 아이의 맞춤 추천을 AI 추천 API에서 받는다.
//
// 인프라 공용 라우터를 거쳐 다른 백엔드와 같은 `/api/v1` 아래에 열린다고 보고 `apiRequest`로 부른다
// (실제 주소 `/api/v1/recommend/home`). 로그인한 보호자의 아이 기준이라 인증 헤더를 붙인다.

import { apiRequest } from "@/shared/api/client";

import {
  toApiCategory,
  toRecommendation,
  type HomeRecommendationResponse,
  type Recommendation,
  type RecommendationCategory,
} from "../model/recommendation";

export type HomeRecommendationParams = {
  petId: number;
  /** 없으면 전체 */
  category?: RecommendationCategory;
  /** 받을 개수(1~50). 없으면 서버 기본 9개 */
  size?: number;
};

/** `POST /recommend/home`. 서버가 매긴 추천 순서(`rank`) 그대로 돌려준다 */
export async function getHomeRecommendations({
  petId,
  category,
  size,
}: HomeRecommendationParams): Promise<Recommendation[]> {
  const response = await apiRequest<HomeRecommendationResponse>("/recommend/home", {
    method: "POST",
    // 추천순(`recommend`)만 있어 `sort`는 보내지 않는다. 다른 정렬은 받은 목록 안에서 FE가 한다
    body: { pet_id: petId, category: toApiCategory(category), size },
  });
  return response.items.map(toRecommendation);
}
