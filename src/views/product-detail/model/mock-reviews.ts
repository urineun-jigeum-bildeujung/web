// 리뷰 탭이 그릴 값. API 계약이 정해지기 전까지 쓰는 목데이터다.
//
// 시안(상품 상세_리뷰 탭)이 사진 있는 후기와 없는 후기를 섞어 두었다. 한 벌로만 두면
// 사진 줄이 없는 카드의 간격을 확인할 수 없어 그대로 따른다.

import type { Review } from "@/entities/review";

/** 리뷰 정렬. 서버가 정렬해 주기 전까지 화면에서 거른다 */
export const REVIEW_SORTS = ["recommend", "recent", "rating-high", "rating-low"] as const;

export type ReviewSort = (typeof REVIEW_SORTS)[number];

export const REVIEW_SORT_LABEL: Record<ReviewSort, string> = {
  recommend: "추천순",
  recent: "최신순",
  "rating-high": "별점 높은순",
  "rating-low": "별점 낮은순",
};

export const MOCK_REVIEWS: Review[] = [
  {
    id: "1",
    nickname: "댕댕이짱",
    petProfile: "말티즈 · 8세 · 4kg",
    rating: 4,
    date: "2026. 08. 31",
    photoCount: 3,
    option: "90정 1박스",
    tags: ["사용 3주차", "재구매 2회"],
    content: "확실히 예전보다 계단 오를 때 덜 힘들어해요. 잘 먹기도 하고 만족스러워요.",
    likeCount: 32,
  },
  {
    id: "2",
    nickname: "뭉이언니",
    petProfile: "푸들 · 5세 · 3kg",
    rating: 5,
    date: "2026. 08. 22",
    photoCount: 0,
    option: "90정 1박스",
    tags: ["사용 3개월"],
    content:
      "알갱이가 작아서 소형견도 먹기 편해요. 확실히 이전보다 털 빠짐이 줄어든 게 느껴져서 만족스러워요.",
    likeCount: 10,
  },
  {
    id: "3",
    nickname: "구름아사랑해",
    petProfile: "푸들 · 4세 · 3.5kg",
    rating: 3,
    date: "2026. 08. 26",
    photoCount: 3,
    option: "90정 1박스",
    tags: ["사용 2주차"],
    content: "향도 안 강하고 잘 먹어요. 다음에도 재구매할 것 같아요!",
    likeCount: 4,
  },
  {
    id: "4",
    nickname: "초코집사",
    petProfile: "리트리버 · 6세 · 28kg",
    rating: 5,
    date: "2026. 08. 14",
    photoCount: 0,
    option: "90정 3박스",
    tags: ["사용 6개월", "재구매 4회"],
    content:
      "대형견이라 양이 많이 드는데 3박스 묶음이 있어서 좋아요. 관절 영양제 중에 이만한 게 없어요.",
    likeCount: 51,
  },
  {
    id: "5",
    nickname: "밤이맘",
    petProfile: "코리안 숏헤어 · 3세 · 4.2kg",
    rating: 2,
    date: "2026. 08. 09",
    photoCount: 0,
    option: "90정 1박스",
    tags: ["사용 1주차"],
    content: "우리 아이는 냄새를 맡더니 안 먹네요. 기호성은 아이마다 다른 것 같아요.",
    likeCount: 7,
  },
];
