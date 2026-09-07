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

  // 재 봤더니 안 맞는 것과 아직 재지 않은 것은 다른 이야기다.
  // 0점으로 내려보내면 "확인이 필요해요"로 읽혀 궁합이 나쁜 상품처럼 보인다
  test("점수가 없으면 판정이 아니라 정보 확인 중이다", () => {
    expect(getMatchLevel(null).tone).toBe("unknown");
    expect(getMatchLevel(null).label).toBe("정보 확인 중");
    expect(getMatchLevel(0).tone).not.toBe("unknown");
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

  test("점수가 없으면 숫자 자리를 비우고 정보 확인 중만 보인다", () => {
    render(<MatchScoreBadge score={null} />);

    expect(screen.getByText("정보 확인 중")).toBeDefined();
    // 0이 점수처럼 보이면 안 된다
    expect(screen.queryByText("0")).toBeNull();
  });

  test("점수가 없다는 것을 스크린 리더도 안다", () => {
    render(<MatchScoreBadge score={null} petName="코코" />);

    expect(
      screen.getByText("코코와 얼마나 맞는지 아직 알 수 없어요. 상품 정보를 확인하는 중입니다"),
    ).toBeDefined();
  });
});
