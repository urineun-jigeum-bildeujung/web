// 추천 이유가 읽히는지, 감점 상품에만 주의 한 줄이 붙는지 본다(#600).
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { RecommendationReason } from "./recommendation-reason";

test("추천 이유를 보이고 스크린 리더에는 추천 이유라고 먼저 알린다", () => {
  render(<RecommendationReason reason="기호성 평가가 좋아 추천합니다." />);

  expect(screen.getByText("기호성 평가가 좋아 추천합니다.").textContent).toBe(
    "추천 이유. 기호성 평가가 좋아 추천합니다.",
  );
  expect(screen.queryByText(/알레르기/)).toBeNull();
});

test("알레르기 감점 상품에는 주의 한 줄이 붙는다", () => {
  render(<RecommendationReason reason="이유" allergyPenalized />);

  expect(screen.getByText("등록한 알레르기 성분이 들어 있어요")).toBeDefined();
});
