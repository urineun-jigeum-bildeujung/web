// 새로고침해도 별점·사용 기간이 남는지, 깨진 값은 버리는지 본다.
import { afterEach, describe, expect, it } from "vitest";

import {
  clearReviewDraft,
  getReviewDraft,
  resetReviewDraftCache,
  setReviewDraft,
} from "./draft-storage";

describe("review draft-storage", () => {
  afterEach(() => {
    window.localStorage.clear();
    resetReviewDraftCache();
  });

  it("저장한 값을 캐시를 비워도 다시 읽는다", () => {
    setReviewDraft("p1", {
      score: 4.5,
      days: "7",
      responses: { PALATABILITY: "NEUTRAL" },
      petIds: ["1", "2"],
      text: "잘 먹어요",
    });
    resetReviewDraftCache();

    expect(getReviewDraft("p1")).toEqual({
      score: 4.5,
      days: "7",
      responses: { PALATABILITY: "NEUTRAL" },
      petIds: ["1", "2"],
      text: "잘 먹어요",
    });
  });

  // 아이 여러 마리로 바뀌기 전에 저장해 둔 초안을 잃지 않는다(#391)
  // 손댄 저장값이 남으면 등록 버튼은 열리는데 요청 변환이 실패해 아무 일도 안 일어난다(#392 리뷰)
  it("숫자 id가 아닌 petIds는 버린다", () => {
    window.localStorage.setItem(
      "review-draft:product:p1",
      JSON.stringify({ score: 3, days: "5", responses: {}, petIds: ["3", "abc", "", 7], text: "" }),
    );
    resetReviewDraftCache();

    expect(getReviewDraft("p1").petIds).toEqual(["3"]);
  });

  it("옛 초안의 petId 하나는 petIds 배열로 읽는다", () => {
    window.localStorage.setItem(
      "review-draft:product:p1",
      JSON.stringify({ score: 3, days: "5", responses: {}, petId: "1", text: "" }),
    );
    resetReviewDraftCache();

    expect(getReviewDraft("p1").petIds).toEqual(["1"]);
  });

  it("상품이 다르면 서로 섞이지 않는다", () => {
    setReviewDraft("p1", { score: 3, days: "1", responses: {}, petIds: [], text: "" });

    expect(getReviewDraft("p2").score).toBe(0);
  });

  it("보기에 없는 답과 범위 밖 점수는 버린다", () => {
    window.localStorage.setItem(
      "review-draft:product:p1",
      JSON.stringify({
        score: 9,
        days: "1a2",
        responses: { PALATABILITY: "nope", DIGESTION: "POSITIVE" },
      }),
    );

    const draft = getReviewDraft("p1");
    expect(draft.score).toBe(0);
    expect(draft.days).toBe("12");
    expect(draft.responses).toEqual({ DIGESTION: "POSITIVE" });
  });

  it("지우면 빈 초안으로 돌아간다", () => {
    setReviewDraft("p1", { score: 3, days: "1", responses: {}, petIds: [], text: "" });
    clearReviewDraft("p1");

    expect(getReviewDraft("p1").score).toBe(0);
    expect(window.localStorage.getItem("review-draft:product:p1")).toBeNull();
  });
});
