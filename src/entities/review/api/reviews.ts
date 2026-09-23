// 리뷰 등록·리뷰 사진 발급·내 후기 목록·작성 가능 목록·리뷰 상세 조회. 작성 화면과 내 후기 화면들이 쓴다.
//
// 값 형식은 백엔드 열거형 그대로다(#281). 문항 키는 `ReviewQuestionType`, 답은 `ReviewAnswer`.
// 백엔드는 회원+상품당 리뷰를 한 건만 받고(`ALREADY_REVIEWED`), 구매 확정한 상품만 허용한다.

import { apiRequest } from "@/shared/api/client";
import type { PresignedUpload } from "@/shared/api/upload-image";

/** 백엔드 `ReviewCreateRequest`와 같은 모양이다 */
export type ReviewCreateRequest = {
  productId: number;
  /** 함께 먹인 아이들. 한 마리 이상 */
  petIds: number[];
  /** 1.0~5.0. 반 개 단위 */
  starRate: number;
  /** 일 단위 양수 */
  usagePeriod: number;
  /** 답한 문항만. 백엔드가 하나 이상을 요구한다 — 빈 값으로 채우면 `INVALID_ANSWER`다 */
  answerValues: { questionKey: string; answerValue: string }[];
  /** 300자 이하 */
  text: string;
  /** 올려 둔 사진의 CDN 주소. 세 장까지 */
  images?: string[];
};

export function createReview(request: ReviewCreateRequest): Promise<{ reviewId: number }> {
  return apiRequest<{ reviewId: number }>("/reviews", { method: "POST", body: request });
}

/** 리뷰 사진 발급. `uploadImage`에 넘긴다 — 회원 사진과는 발급 주소만 다르다 */
export function issueReviewImageUpload(extension: string): Promise<PresignedUpload> {
  return apiRequest<PresignedUpload>("/reviews/images/presigned-url", {
    method: "POST",
    body: { extension },
  });
}

/** 백엔드 `MyReviewListResponse`와 같은 모양이다 */
type MyReviewListResponse = {
  content: {
    reviewId: number;
    productId: number;
    productName: string;
    productImage: string | null;
    rating: number;
    text: string;
    /** `YYYY-MM-DD` */
    createdAt: string;
  }[];
  hasNext: boolean;
};

/** 내가 쓴 후기 한 줄 */
export type MyReviewItem = {
  id: string;
  productId: string;
  name: string;
  imageUrl?: string;
  /** 0~5 */
  rating: number;
  content: string;
  /** `YYYY-MM-DD` 작성일. 목록의 구매일 자리를 이것이 채운다 — 응답에 구매일은 없다 */
  createdAt: string;
};

export type MyReviewList = {
  items: MyReviewItem[];
  hasNext: boolean;
};

/** 백엔드 `WritableProductListResponse`와 같은 모양이다 */
type WritableReviewListResponse = {
  content: {
    orderProductId: number;
    productId: number;
    productName: string;
    thumbnailUrl: string | null;
    /** 구매확정 시각. ISO(`+09:00`) */
    confirmedAt: string;
  }[];
};

/** 구매확정했는데 아직 후기를 안 쓴 상품 한 줄. 상품 단위라 같은 상품은 한 번만 온다 */
export type WritableReview = {
  orderProductId: string;
  productId: string;
  name: string;
  imageUrl?: string;
  /** 구매확정 시각(ISO). 시안의 "구매일" 자리를 이것이 채운다 — 응답에 주문일은 없다 */
  confirmedAt: string;
};

export function getWritableReviews(): Promise<WritableReview[]> {
  return apiRequest<WritableReviewListResponse>("/reviews/writable").then((response) =>
    response.content.map((item) => ({
      orderProductId: String(item.orderProductId),
      productId: String(item.productId),
      name: item.productName,
      ...(item.thumbnailUrl && { imageUrl: item.thumbnailUrl }),
      confirmedAt: item.confirmedAt,
    })),
  );
}

export function getMyReviews(params: { page: number; size: number }): Promise<MyReviewList> {
  return apiRequest<MyReviewListResponse>("/reviews/me", { query: params }).then((response) => ({
    items: response.content.map((item) => ({
      id: String(item.reviewId),
      productId: String(item.productId),
      name: item.productName,
      ...(item.productImage && { imageUrl: item.productImage }),
      rating: item.rating,
      content: item.text,
      createdAt: item.createdAt,
    })),
    hasNext: response.hasNext,
  }));
}

/** 백엔드 `ReviewDetailResponse`와 같은 모양이다. 비어 있는 목록을 `null`로 준다 */
type ReviewDetailResponse = {
  reviewId: number;
  isMine: boolean;
  product: { productId: number; name: string; image: string | null };
  petId: number;
  /** 반올림 정수 */
  rating: number;
  /** 일 단위 */
  usagePeriod: number;
  answerValues: { questionKey: string; answerValue: string }[];
  /** "기호성 좋음" 같은 문구. 하나도 없으면 `null` */
  goodPoints: string[] | null;
  badPoints: string[] | null;
  /** 아직 값이 없다(항상 `null`) */
  matchScore: number | null;
  text: string;
  images: string[] | null;
  /** `YYYY-MM-DD` */
  createdAt: string;
};

/** 리뷰 한 건의 상세. 닉네임·아이 스냅샷·도움돼요 수는 응답에 없다(백엔드 요청 중) */
export type ReviewDetail = {
  id: string;
  /** 로그인한 회원이 쓴 것인가. 비로그인이면 `false` */
  isMine: boolean;
  product: { id: string; name: string; imageUrl?: string };
  petId: string;
  /** 0~5 정수 */
  rating: number;
  usageDays: number;
  /** "기호성 좋음"처럼 문항 이름과 답을 붙인 문구 */
  goodPoints: string[];
  badPoints: string[];
  content: string;
  images: string[];
  /** `YYYY-MM-DD` */
  createdAt: string;
};

export function getReviewDetail(reviewId: string): Promise<ReviewDetail> {
  return apiRequest<ReviewDetailResponse>(`/reviews/${reviewId}`).then((response) => ({
    id: String(response.reviewId),
    isMine: response.isMine,
    product: {
      id: String(response.product.productId),
      name: response.product.name,
      ...(response.product.image && { imageUrl: response.product.image }),
    },
    petId: String(response.petId),
    rating: response.rating,
    usageDays: response.usagePeriod,
    goodPoints: response.goodPoints ?? [],
    badPoints: response.badPoints ?? [],
    content: response.text,
    images: response.images ?? [],
    createdAt: response.createdAt,
  }));
}
