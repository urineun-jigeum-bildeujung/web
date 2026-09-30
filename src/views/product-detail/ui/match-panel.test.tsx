// 출처가 다른 두 줄(아이별 적합도 근거와 상품 주의성분)이 한 목록에서 섞이지 않는지 본다.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PetMatch } from "../model/mock-product";
import { MatchPanel } from "./match-panel";

const PETS = [{ id: "1", name: "소리" }];

const MATCH: PetMatch = {
  petId: "1",
  petName: "소리",
  score: 92,
  profileLabel: "말티즈 · 8세 · 4kg",
  reasons: [
    { tone: "good", text: "관절 건강에 도움되는 글루코사민이 들어있어요" },
    { tone: "caution", text: "나트륨 함량이 또래 평균보다 다소 높은 편이에요" },
  ],
  nutrients: [],
  functions: "관절 건강",
  summary: "꾸준히 급여하기 좋은 상품이에요",
};

function renderPanel(cautions: string[], match: PetMatch = MATCH) {
  render(<MatchPanel pets={PETS} onPetChange={() => {}} match={match} cautions={cautions} />);
}

describe("주의성분", () => {
  it("적합도 근거와 같은 목록에 이어 붙는다", () => {
    renderPanel(["나트륨 과다", "자일리톨"]);

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(4);
    expect(rows[2].textContent).toContain("나트륨 과다");
    expect(rows[3].textContent).toContain("자일리톨");
  });

  it("비어 있으면 줄을 만들지 않는다", () => {
    renderPanel([]);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByText("주의성분.")).toBeNull();
  });

  it("낭독기 문구가 적합도 근거와 갈린다", () => {
    renderPanel(["나트륨 과다"]);

    // 눈으로는 위아래 자리로 갈리지만 낭독기에는 자리가 없다
    expect(screen.getByText("주의성분.")).toBeDefined();
    expect(screen.getByText("지켜볼 점.")).toBeDefined();
    expect(screen.getByText("도움되는 점.")).toBeDefined();
  });

  it("적합도 근거와 같은 문장이 와도 둘 다 그린다", () => {
    const sameText = "나트륨 함량이 또래 평균보다 다소 높은 편이에요";
    renderPanel([sameText]);

    expect(screen.getAllByText(sameText)).toHaveLength(2);
  });

  it("적합도 근거가 없어도 주의성분만으로 그린다", () => {
    renderPanel(["자일리톨"], { ...MATCH, reasons: [] });

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain("자일리톨");
  });
});
