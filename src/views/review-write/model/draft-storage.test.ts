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
    setReviewDraft("oi1", {
      score: 4.5,
      days: "7",
      responses: { taste: "soso" },
      petId: "p1",
      text: "잘 먹어요",
    });
    resetReviewDraftCache();

    expect(getReviewDraft("oi1")).toEqual({
      score: 4.5,
      days: "7",
      responses: { taste: "soso" },
      petId: "p1",
      text: "잘 먹어요",
    });
  });

  it("구매 항목이 다르면 서로 섞이지 않는다", () => {
    setReviewDraft("oi1", { score: 3, days: "1", responses: {}, text: "" });

    expect(getReviewDraft("oi2").score).toBe(0);
  });

  it("보기에 없는 답과 범위 밖 점수는 버린다", () => {
    window.localStorage.setItem(
      "review-draft:oi1",
      JSON.stringify({ score: 9, days: "1a2", responses: { taste: "nope", stool: "better" } }),
    );

    const draft = getReviewDraft("oi1");
    expect(draft.score).toBe(0);
    expect(draft.days).toBe("12");
    expect(draft.responses).toEqual({ stool: "better" });
  });

  it("지우면 빈 초안으로 돌아간다", () => {
    setReviewDraft("oi1", { score: 3, days: "1", responses: {}, text: "" });
    clearReviewDraft("oi1");

    expect(getReviewDraft("oi1").score).toBe(0);
    expect(window.localStorage.getItem("review-draft:oi1")).toBeNull();
  });
});
