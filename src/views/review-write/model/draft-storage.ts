// 리뷰 작성 중인 값을 기기에 남긴다.
//
// 단계는 URL에 있는데 입력값이 컴포넌트 상태여서, 2단계에서 새로고침하면 별점·사용 기간이
// 비어 "등록하기"가 눌리지 않는 채로 남았다. 온보딩 초안(`views/onboarding/model/draft-storage`)과
// 같은 판단으로 상품별로 기기에 두고, 등록을 마치면 지운다. 백엔드가 회원+상품당 리뷰를
// 한 건만 받으므로 구매 건이 아니라 상품이 단위다.
//
// 저장소는 React 밖의 것이라 `useSyncExternalStore`로 잇는다.

import { HANDLING_QUESTION, RATING_STEP_QUESTIONS } from "./questions";

export type ReviewDraft = {
  /** 0이면 아직 안 매겼다. 반 개 단위 */
  score: number;
  days: string;
  responses: Record<string, string | undefined>;
  /** 함께 먹인 아이들. 한 상품을 두 아이에게 먹이기도 해 여러 마리다 */
  petIds: string[];
  text: string;
};

export const EMPTY_REVIEW_DRAFT: ReviewDraft = {
  score: 0,
  days: "",
  responses: {},
  petIds: [],
  text: "",
};

const QUESTIONS = [...RATING_STEP_QUESTIONS, HANDLING_QUESTION];

/** 서버 아이 id를 문자열로 든 것만 받는다. 빈 문자열·숫자 아닌 문자열은 버린다 */
function isPetId(value: unknown): value is string {
  return typeof value === "string" && /^\d+$/.test(value);
}

let cache: { key: string; draft: ReviewDraft } | null = null;
const listeners = new Set<() => void>();

// 예전에는 구매 항목(orderItemId)으로 저장했다. 같은 값이 겹쳐 다른 상품의 초안이 되살아나지 않게 자리를 나눈다
const storageKey = (productId: string) => `review-draft:product:${productId}`;

/** 저장된 값을 한 칸씩 확인해 옮긴다. 모양이 맞지 않는 칸은 버리고 기본값을 쓴다 */
function normalize(raw: unknown): ReviewDraft {
  if (typeof raw !== "object" || raw === null) return EMPTY_REVIEW_DRAFT;
  const saved = raw as Partial<Record<keyof ReviewDraft, unknown>>;

  const score =
    typeof saved.score === "number" && saved.score >= 0 && saved.score <= 5
      ? Math.round(saved.score * 2) / 2
      : 0;

  const responses: Record<string, string> = {};
  if (typeof saved.responses === "object" && saved.responses !== null) {
    const savedResponses = saved.responses as Record<string, unknown>;
    for (const question of QUESTIONS) {
      const value = savedResponses[question.key];
      if (question.options.some((option) => option.value === value)) {
        responses[question.key] = value as string;
      }
    }
  }

  return {
    score,
    days: typeof saved.days === "string" ? saved.days.replace(/\D/g, "").slice(0, 3) : "",
    responses,
    // 아이 여러 마리로 바뀌기 전(#391)에 저장한 초안은 `petId` 하나다. 배열로 옮겨 잃지 않는다.
    // 아이 id는 서버 숫자 id의 문자열이다 — 손댄 저장값("abc")이 남으면 등록 버튼은 열리는데
    // 요청 변환이 NaN으로 실패해 아무 일도 안 일어난다. 여기서 걸러 두 경로가 같은 값을 본다
    petIds: Array.isArray(saved.petIds)
      ? saved.petIds.filter(isPetId)
      : isPetId((saved as { petId?: unknown }).petId)
        ? [(saved as { petId: string }).petId]
        : [],
    text: typeof saved.text === "string" ? saved.text : "",
  };
}

function load(key: string): ReviewDraft {
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? normalize(JSON.parse(saved)) : EMPTY_REVIEW_DRAFT;
  } catch {
    // 저장을 막아 둔 브라우저이거나 값이 깨졌다. 작성을 막을 이유는 없다
    return EMPTY_REVIEW_DRAFT;
  }
}

export function subscribeReviewDraft(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 읽을 때마다 새 객체를 만들면 useSyncExternalStore가 무한히 다시 그린다 */
export function getReviewDraft(productId: string): ReviewDraft {
  const key = storageKey(productId);
  if (cache?.key !== key) cache = { key, draft: load(key) };
  return cache.draft;
}

/** 프리렌더에는 저장소가 없다. 빈 초안으로 그려 두고 붙은 뒤 저장된 것으로 바꾼다 */
export function getReviewDraftOnServer(): ReviewDraft {
  return EMPTY_REVIEW_DRAFT;
}

export function setReviewDraft(productId: string, next: ReviewDraft) {
  const key = storageKey(productId);
  cache = { key, draft: next };
  try {
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // 저장을 막아 뒀으면 화면 안에서만 유지된다
  }
  listeners.forEach((listener) => listener());
}

/** 등록을 마쳤으면 지운다. 남겨 두면 같은 상품에 다시 들어올 때 지난 값이 채워져 보인다 */
export function clearReviewDraft(productId: string) {
  cache = { key: storageKey(productId), draft: EMPTY_REVIEW_DRAFT };
  try {
    window.localStorage.removeItem(storageKey(productId));
  } catch {
    // 지우지 못해도 화면은 빈 초안으로 시작한다
  }
  listeners.forEach((listener) => listener());
}

/** 테스트가 서로 물들지 않게 비운다 */
export function resetReviewDraftCache() {
  cache = null;
}
