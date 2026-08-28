// 적합도 배지 단위 테스트. 구간 판정과 스크린 리더 문구를 검증한다.
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { getMatchLevel, MatchScoreBadge } from "./match-score-badge";

describe("getMatchLevel", () => {
  test("80점 이상은 잘 맞는다", () => {
    expect(getMatchLevel(80).tone).toBe("high");
    expect(getMatchLevel(100).tone).toBe("high");
  });

  test("60점 이상 80점 미만은 중간이다", () => {
    expect(getMatchLevel(60).tone).toBe("mid");
    expect(getMatchLevel(79).tone).toBe("mid");
  });

  test("60점 미만은 확인이 필요하다", () => {
    expect(getMatchLevel(59).tone).toBe("low");
    expect(getMatchLevel(0).tone).toBe("low");
  });
});

describe("MatchScoreBadge", () => {
  test("점수를 보여준다", () => {
    render(<MatchScoreBadge score={92} />);
    expect(screen.getByText("92")).toBeDefined();
  });

  test("색만으로 구분하지 않도록 구간 문구를 함께 읽힌다", () => {
    render(<MatchScoreBadge score={92} petName="코코" />);
    expect(screen.getByText("코코와 잘 맞아요. 적합도 92점")).toBeDefined();
  });

  test("이름이 없으면 우리 아이로 읽는다", () => {
    render(<MatchScoreBadge score={45} />);
    expect(screen.getByText("우리 아이와 확인이 필요해요. 적합도 45점")).toBeDefined();
  });
});
