// 구매 후 상태 체크(반응). 지금 반응을 남길 수 있는 구매 항목 조회와 반응 등록.
//
// 백엔드는 구매확정 뒤 사료·간식 7일, 영양제 30일이 지난 항목만 돌려주고(최대 3건), 답한 것은
// 빼며, 보류(`postpone`)하면 7일 뒤 다시 돌려준다. 이 반응이 다음 추천 적합도의 근거다.

import { apiRequest } from "@/shared/api/client";

/** 백엔드 `FeedbackCheckAnswer`. 잘 맞았어요 · 그냥 그랬어요 · 안 맞았어요 */
export type FeedbackAnswer = "GOOD" | "NEUTRAL" | "BAD";

/** 백엔드 `FeedbackCheckPendingListResponse`와 같은 모양이다 */
type PendingFeedbackListResponse = {
  content: {
    orderProductId: number;
    productId: number;
    productName: string;
    thumbnailUrl: string | null;
    /** ISO 시각. 이때부터 반응을 받을 수 있다 */
    checkAvailableAt: string;
    /** 어느 아이에게 사 줬는지. **백엔드가 아직 `null`로 둔다** — 주문 서비스 내부 응답에 없어 "추후 연동" */
    petId: number | null;
  }[];
};

/** 반응을 남길 수 있는 구매 항목 한 줄 */
export type PendingFeedback = {
  /** 구매 항목 id. 등록 요청이 이 값을 받는다 */
  orderProductId: string;
  productId: string;
  name: string;
  imageUrl?: string;
  /** 없으면 대표 아이로 본다 */
  petId: string | null;
};

export function getPendingFeedbacks(): Promise<PendingFeedback[]> {
  return apiRequest<PendingFeedbackListResponse>("/reviews/feedbacks/pending").then((response) =>
    response.content.map((item) => ({
      orderProductId: String(item.orderProductId),
      productId: String(item.productId),
      name: item.productName,
      ...(item.thumbnailUrl && { imageUrl: item.thumbnailUrl }),
      petId: item.petId === null ? null : String(item.petId),
    })),
  );
}

/** 답을 골랐거나, 아직 판단하기 이르다고 보류했거나 둘 중 하나다 */
export type FeedbackSubmission = { answer: FeedbackAnswer } | { postpone: true };

export type SubmitFeedbackInput = {
  productId: string;
  orderProductId: string;
  submission: FeedbackSubmission;
};

/**
 * 반응을 남긴다. 백엔드 `FeedbackSubmitRequest`는 `postpone`과 `answer`를 함께 받는데
 * 보류면 답을 보지 않으므로 `answer`는 보류가 아닐 때만 싣는다.
 */
export function submitFeedback({
  productId,
  orderProductId,
  submission,
}: SubmitFeedbackInput): Promise<void> {
  const postpone = "postpone" in submission;
  return apiRequest<void>(`/reviews/products/${productId}/feedbacks`, {
    method: "POST",
    body: {
      orderProductId: Number(orderProductId),
      postpone,
      ...(!postpone && { answer: submission.answer }),
    },
  });
}
