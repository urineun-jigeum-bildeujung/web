// 리뷰 필터 시트의 품종·건강 관심사 줄: 고른 값이 Badge로 하나씩 그려지는지 본다(#598).
//
// **말줄임 자체는 여기서 볼 수 없다.** jsdom은 레이아웃을 계산하지 않아 폭도 넘침도 0이라
// `text-overflow`가 걸렸는지 알 수 없다 — 실제 말줄임과 넘침은 Chromium 실측으로 확인했고,
// 여기서는 DOM 계약만 고정한다.
//
// **이 시트는 아직 어느 화면에도 붙어 있지 않아 E2E가 이 자리를 잡지 못한다**(#472).
// 그래서 회귀를 잡는 자동 검증이 이 파일뿐이다.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_FILTER, type ReviewFilter } from "../model/review-filter";
import { ReviewFilterSheet } from "./review-filter-sheet";

const { BREEDS, HEALTH_OPTIONS } = vi.hoisted(() => ({
  /** 마지막 하나는 13자다 — 줄을 넘치는 조합을 DOM에서도 같은 값으로 쓴다 */
  BREEDS: [
    { id: 1, breedName: "말티즈", species: "dog" as const },
    { id: 2, breedName: "포메라니안", species: "dog" as const },
    { id: 3, breedName: "웨스트하이랜드화이트테리어", species: "dog" as const },
  ],
  HEALTH_OPTIONS: {
    concerns: [
      {
        label: "관절·뼈",
        items: [
          { value: "슬개골 탈구", label: "슬개골 탈구" },
          { value: "관절염", label: "관절염" },
        ],
      },
    ],
    allergies: [],
  },
}));

vi.mock("@/entities/pet", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/pet")>();
  return {
    ...actual,
    useQueryBreeds: () => ({ breeds: BREEDS, isLoading: false, error: null }),
    useQueryHealthOptions: () => ({ options: HEALTH_OPTIONS, isLoading: false, error: null }),
  };
});

const BREED_LABELS = ["말티즈", "포메라니안", "웨스트하이랜드화이트테리어"];
const HEALTH_LABELS = ["슬개골 탈구", "관절염"];

/** 시트를 열고 품종·건강 관심사가 있는 "반려동물 필터" 탭으로 옮긴다 */
function openPetTab(filter: ReviewFilter) {
  render(<ReviewFilterSheet filter={filter} onApply={vi.fn()} countOf={() => 12} />);

  fireEvent.click(screen.getByRole("button", { name: "기본 맞춤 필터" }));
  // Radix 탭은 click이 아니라 mouseDown에서 값을 바꾼다
  fireEvent.mouseDown(screen.getByRole("tab", { name: "반려동물 필터" }), { button: 0 });
}

/**
 * 고른 값이 늘어선 줄. `Field`가 제목을 붙인 `group`으로 집는다 —
 * 버튼의 접근성 이름으로 집으면 이름이 어떻게 이어지는지에 테스트가 묶인다.
 */
function rowOf(fieldTitle: string) {
  return within(screen.getByRole("group", { name: fieldTitle })).getByRole("button");
}

describe("ReviewFilterSheet의 고른 값 줄", () => {
  it("요약 한 줄이 아니라 고른 값마다 하나씩 그린다", () => {
    openPetTab({ ...DEFAULT_FILTER, breedIds: [1, 2, 3] });

    // 고치기 전의 모양이다. 되돌아오면 이 줄이 실패한다
    expect(screen.queryByText("말티즈 외 2개")).toBeNull();

    const row = rowOf("품종");
    for (const label of BREED_LABELS) {
      expect(within(row).getByText(label)).toBeDefined();
    }

    // 값 셋에 Badge 셋이다. 줄 안쪽 칸의 자식 수로 센다
    expect(row.firstElementChild?.children).toHaveLength(BREED_LABELS.length);
  });

  it("건강 관심사 줄도 같은 방식으로 그린다", () => {
    openPetTab({ ...DEFAULT_FILTER, healthConcerns: HEALTH_LABELS });

    const row = rowOf("건강 관심사");
    for (const label of HEALTH_LABELS) {
      expect(within(row).getByText(label)).toBeDefined();
    }
    expect(row.firstElementChild?.children).toHaveLength(HEALTH_LABELS.length);
  });

  it("고른 것이 없으면 안내 문구가 그대로 보인다", () => {
    openPetTab(DEFAULT_FILTER);

    expect(screen.getByText("품종 선택하기")).toBeDefined();
    expect(screen.getByText("건강 관심사 선택하기")).toBeDefined();
  });

  it("낭독기에는 잘리지 않은 전체 이름이 끊어 읽힌다", () => {
    openPetTab({ ...DEFAULT_FILTER, breedIds: [1, 2, 3] });

    // 말줄임은 CSS로만 자르므로 글자는 원문 그대로 남는다(#546과 같은 규칙)
    expect(screen.getByText("웨스트하이랜드화이트테리어")).toBeDefined();

    // 배지 사이에 공백 텍스트가 없어 이름을 직접 적었다.
    // 없으면 "말티즈포메라니안웨스트하이랜드화이트테리어" 한 단어로 읽힌다
    expect(
      screen.getByRole("button", {
        name: `품종 선택하기, 고른 값 ${BREED_LABELS.join(", ")}`,
      }),
    ).toBeDefined();
  });

  it("고른 것이 없으면 안내 문구가 그대로 버튼 이름이 된다", () => {
    openPetTab(DEFAULT_FILTER);

    expect(screen.getByRole("button", { name: "품종 선택하기" })).toBeDefined();
  });
});
