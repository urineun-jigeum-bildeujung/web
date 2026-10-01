// 타임딜 알림 구독을 묻고 바꾼다. 구독한 회원에게만 서버가 타임딜 시작 10분 전·시작·30분 뒤에 알린다.
//
// 타임딜은 한 번에 함께 열리므로 상품별·딜별이 아니라 전체 구독 하나다(#644). 서버 경로는
// `subscriptions/{category}`지만 카테고리가 `TIME_DEAL` 하나뿐이라 타임딜 전용으로 둔다.

import { apiRequest } from "@/shared/api/client";

const TIME_DEAL_SUBSCRIPTION_PATH = "/notifications/subscriptions/TIME_DEAL";

type SubscriptionResponse = {
  category: "TIME_DEAL";
  subscribed: boolean;
};

/** `GET /notifications/subscriptions/TIME_DEAL`. 한 번도 바꾸지 않았으면 거짓이다 */
export async function getTimeDealSubscription(): Promise<boolean> {
  const { subscribed } = await apiRequest<SubscriptionResponse>(TIME_DEAL_SUBSCRIPTION_PATH);
  return subscribed;
}

/** `PUT /notifications/subscriptions/TIME_DEAL`. 서버가 저장한 값을 돌려준다 */
export async function updateTimeDealSubscription(subscribed: boolean): Promise<boolean> {
  const response = await apiRequest<SubscriptionResponse>(TIME_DEAL_SUBSCRIPTION_PATH, {
    method: "PUT",
    body: { subscribed },
  });
  return response.subscribed;
}
