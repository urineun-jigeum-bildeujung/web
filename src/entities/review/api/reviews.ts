// 리뷰 등록·리뷰 사진 발급·내 후기 목록·작성 가능 목록·리뷰 상세 조회·도움돼요·상품 후기 목록·후기 사진.
// 작성 화면과 내 후기 화면들, 상품 상세의 리뷰 탭과 사진 모음 화면이 쓴다.
//
// 값 형식은 백엔드 열거형 그대로다(#281). 문항 키는 `ReviewQuestionType`, 답은 `ReviewAnswer`.
// 백엔드는 회원+상품당 리뷰를 한 건만 받고(`ALREADY_REVIEWED`), 구매 확정한 상품만 허용한다.

import { apiRequest } from "@/shared/api/client";
import type { PresignedUpload } from "@/shared/api/upload-image";
import { formatDisplayFullDate } from "@/shared/lib/date/display-date";

import { toUsageLabel } from "../lib/usage-label";
import type { Review, ReviewPet } from "../model/review";
import { toReviewSortParam, type ReviewSort } from "../model/review-sort";

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

/** 목록과 상세가 아이를 같은 모양으로 주므로 옮기는 자리도 하나로 둔다 */
function toReviewPet(pet: {
  petId: number;
  name: string;
  age: number;
  species: "DOG" | "CAT";
  breedSize: "SMALL" | "MEDIUM" | "LARGE" | null;
  breedId: number;
  breedName: string | null;
  weight: number;
}): ReviewPet {
  return {
    id: String(pet.petId),
    name: pet.name,
    age: pet.age,
    species: pet.species,
    breedSize: pet.breedSize,
    breedId: pet.breedId,
    breedName: pet.breedName,
    weight: pet.weight,
  };
}

/** 백엔드 `ReviewDetailResponse`와 같은 모양이다. 비어 있는 목록을 `null`로 준다 */
type ReviewDetailResponse = {
  reviewId: number;
  isMine: boolean;
  /** 닉네임 조회가 비면 빈 문자열로 온다 */
  nickname: string;
  product: { productId: number; name: string; image: string | null };
  /** 함께 먹인 아이들의 스냅샷(쓸 당시 값). 고양이는 `breedSize`가 `null` */
  pets: {
    petId: number;
    name: string;
    sex: "MALE" | "FEMALE";
    age: number;
    breedSize: "SMALL" | "MEDIUM" | "LARGE" | null;
    species: "DOG" | "CAT";
    breedId: number;
    /** 스냅샷 컬럼이 뒤늦게 생겨 그 전에 쓴 후기는 `null` */
    breedName: string | null;
    weight: number;
  }[];
  /** 저장값 그대로. 0.5 단위 */
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
  likeCount: number;
  /** 지금 보는 사람이 이미 눌렀는가 */
  liked: boolean;
  /** `YYYY-MM-DD` */
  createdAt: string;
};

/** 리뷰 한 건의 상세 */
export type ReviewDetail = {
  id: string;
  /** 로그인한 회원이 쓴 것인가. 비로그인이면 `false` */
  isMine: boolean;
  /** 닉네임 조회가 비면 빈 문자열로 온다 */
  nickname: string;
  product: { id: string; name: string; imageUrl?: string };
  /** 함께 먹인 아이들. 한 마리 이상 */
  pets: ReviewPet[];
  /** 0~5, 0.5 단위 */
  rating: number;
  usageDays: number;
  /** "기호성 좋음"처럼 문항 이름과 답을 붙인 문구 */
  goodPoints: string[];
  badPoints: string[];
  content: string;
  images: string[];
  likeCount: number;
  /** 지금 보는 사람이 이미 눌렀는가. 비로그인이면 `false` */
  liked: boolean;
  /** `YYYY-MM-DD` */
  createdAt: string;
};

export function getReviewDetail(reviewId: string): Promise<ReviewDetail> {
  return apiRequest<ReviewDetailResponse>(`/reviews/${reviewId}`).then((response) => ({
    id: String(response.reviewId),
    isMine: response.isMine,
    nickname: response.nickname,
    product: {
      id: String(response.product.productId),
      name: response.product.name,
      ...(response.product.image && { imageUrl: response.product.image }),
    },
    pets: response.pets.map(toReviewPet),
    rating: response.rating,
    usageDays: response.usagePeriod,
    goodPoints: response.goodPoints ?? [],
    badPoints: response.badPoints ?? [],
    content: response.text,
    images: response.images ?? [],
    likeCount: response.likeCount,
    liked: response.liked,
    createdAt: response.createdAt,
  }));
}

/**
 * 도움돼요를 켜고 끈다. 같은 요청이 켜진 것은 끄고 꺼진 것은 켠다. 로그인해야 한다(비로그인이면 401).
 *
 * **응답 본문을 읽지 않는다.** 누른 뒤 상태는 화면이 먼저 그리고, 서버가 가진 값은 끝난 뒤 다시 받아
 * 맞춘다(`use-mutate-review-recommend.ts`)
 */
export function toggleReviewRecommend(reviewId: string): Promise<void> {
  return apiRequest<void>(`/reviews/${encodeURIComponent(reviewId)}/recommend`, {
    method: "PATCH",
  });
}

/** 백엔드 `ReviewFilterListResponse`와 같은 모양이다 */
type ProductReviewListResponse = {
  /** 이 상품 전체 평균. 거른 목록이 아니라 상품 기준이다 */
  averageRating: number;
  /** 조건에 맞는 후기 수. 다음 쪽이 있는지를 이 값으로 판단한다 — 응답에 `hasNext`가 없다 */
  totalCount: number;
  content: {
    reviewId: number;
    /** 닉네임 조회가 비면 빈 문자열로 온다 */
    nickname: string;
    /** 한 마리 이상 */
    pets: {
      petId: number;
      name: string;
      sex: "MALE" | "FEMALE";
      age: number;
      /** 고양이는 `null` */
      breedSize: "SMALL" | "MEDIUM" | "LARGE" | null;
      species: "DOG" | "CAT";
      breedId: number;
      /** 스냅샷 컬럼이 뒤늦게 생겨 그 전에 쓴 후기는 `null` */
      breedName: string | null;
      weight: number;
    }[];
    /** 0.5 단위 */
    rating: number;
    /** 일 단위. 상세와 같은 숫자다 */
    usagePeriod: number;
    /** 기호성 문항에 답하지 않았으면 `null` */
    palatability: string | null;
    text: string;
    /** 사진이 없으면 `null`이다. 빈 배열이 아니다 */
    images: string[] | null;
    likeCount: number;
    /** 지금 보는 사람이 이미 눌렀는가 */
    liked: boolean;
    /** `YYYY-MM-DD` */
    createdAt: string;
  }[];
};

/** 후기 한 쪽. 요약값은 쪽마다 같은 값이 온다 */
export type ProductReviewPage = {
  averageRating: number;
  totalCount: number;
  reviews: Review[];
};

/**
 * 서버가 받는 후기 거르기 조건. 비운 값은 보내지 않는다(`GET /reviews/products/{id}`, #472).
 *
 * 구간은 양 끝을 **포함**한다(서버 `goe`·`loe`). 위쪽이 열린 구간은 `…Max`를 비운다.
 * 품종·건강 관심사는 여럿이고 **하나라도 겹치면** 걸린다. 종·품종·나이·중성화·체중은
 * 리뷰에 딸린 아이들 중 **같은 한 마리**가 모두 맞아야 걸린다.
 */
export type ProductReviewConditions = {
  species?: "DOG" | "CAT";
  breedIds?: number[];
  ageMin?: number;
  ageMax?: number;
  neutered?: boolean;
  weightMin?: number;
  weightMax?: number;
  healthConcerns?: string[];
  usagePeriodMinDays?: number;
  usagePeriodMaxDays?: number;
};

export type ProductReviewsParams = {
  productId: string;
  sort: ReviewSort;
  page: number;
  size: number;
  /** 거르기 조건. 없으면 그 상품의 후기 전부다 */
  conditions?: ProductReviewConditions;
};

/**
 * 상품 후기 목록.
 *
 * **거르고 정렬하는 것은 서버다.** 조건을 파라미터로 넘기고 화면에서 다시 거르지 않는다
 * (AGENTS.md 2.5). 품종·건강 관심사는 같은 키를 반복해 싣는다(`breedIds=1&breedIds=2`,
 * Spring 기본 바인딩).
 */
export function getProductReviews({
  productId,
  sort,
  page,
  size,
  conditions,
}: ProductReviewsParams): Promise<ProductReviewPage> {
  return apiRequest<ProductReviewListResponse>(
    `/reviews/products/${encodeURIComponent(productId)}`,
    { query: { sort: toReviewSortParam(sort), page, size, ...conditions } },
  ).then((response) => ({
    averageRating: response.averageRating,
    totalCount: response.totalCount,
    reviews: response.content.map((item) => ({
      id: String(item.reviewId),
      nickname: item.nickname,
      pets: item.pets.map(toReviewPet),
      rating: item.rating,
      // 서버가 주는 날짜는 전부 shared/lib/date를 거친다. 읽을 수 없으면 날짜 줄을 비운다
      date: formatDisplayFullDate(item.createdAt) ?? "",
      images: item.images ?? [],
      // 지금 배지로 세울 수 있는 것은 사용 기간뿐이다. 재구매 횟수는 응답에 없다
      tags: [toUsageLabel(item.usagePeriod)],
      content: item.text,
      likeCount: item.likeCount,
      liked: item.liked,
    })),
  }));
}

/** 후기에 달린 사진 한 장. 누르면 어느 후기로 갈지 알아야 해서 `reviewId`를 함께 든다 */
export type ReviewPhoto = {
  reviewId: string;
  imageUrl: string;
};

/** 백엔드 `ReviewPhotosResponse`와 같은 모양이다 */
type ReviewPhotosResponse = {
  /** 후기 수가 아니라 **사진 장수**다(`countByProductId`) */
  totalCount: number;
  photos: { reviewId: number; imageUrl: string }[];
  hasNext: boolean;
};

export type ReviewPhotoPage = {
  totalCount: number;
  photos: ReviewPhoto[];
  hasNext: boolean;
};

/** 백엔드 `FeaturedReviewPhotosResponse`와 같은 모양이다 */
type FeaturedReviewPhotosResponse = {
  photos: { reviewId: number; imageUrl: string }[];
};

/**
 * 후기 사진을 쪽 단위로 받는다. 사진 모음 화면이 격자로 편다.
 *
 * 후기 목록과 달리 **응답에 `hasNext`가 있다.** 그대로 쓴다.
 */
export function getReviewPhotos({
  productId,
  page,
  size,
}: {
  productId: string;
  page: number;
  size: number;
}): Promise<ReviewPhotoPage> {
  return apiRequest<ReviewPhotosResponse>(
    `/reviews/products/${encodeURIComponent(productId)}/photos`,
    { query: { page, size } },
  ).then((response) => ({
    totalCount: response.totalCount,
    photos: response.photos.map((photo) => ({
      reviewId: String(photo.reviewId),
      imageUrl: photo.imageUrl,
    })),
    hasNext: response.hasNext,
  }));
}

/**
 * 리뷰 탭 상단에 걸 대표 사진.
 *
 * **현재 백엔드 구현은 후기당 한 장씩 최대 넉 장을 준다**(`FEATURED_PHOTO_LIMIT = 4`). 시안의 썸네일
 * 네 칸과 그대로 맞아 화면에서 자르지 않는다.
 */
export function getFeaturedReviewPhotos(productId: string): Promise<ReviewPhoto[]> {
  return apiRequest<FeaturedReviewPhotosResponse>(
    `/reviews/products/${encodeURIComponent(productId)}/photos/featured`,
  ).then((response) =>
    response.photos.map((photo) => ({
      reviewId: String(photo.reviewId),
      imageUrl: photo.imageUrl,
    })),
  );
}
