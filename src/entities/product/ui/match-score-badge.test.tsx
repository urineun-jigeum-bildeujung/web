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
  test("적합도 N점을 보여준다", () => {
    render(<MatchScoreBadge score={92} />);
    expect(screen.getByText("적합도 92점")).toBeDefined();
  });

  test("이름을 넘기면 스크린 리더 문구에 누구 기준인지 함께 읽힌다", () => {
    render(<MatchScoreBadge score={92} petName="코코" />);
    expect(screen.getByText("코코와 적합도 92점")).toBeDefined();
  });

  test("이름이 없으면 우리 아이로 읽는다", () => {
    render(<MatchScoreBadge score={45} />);
    expect(screen.getByText("우리 아이와 적합도 45점")).toBeDefined();
  });

  // 검색 결과(#119)는 영양 정보 미등록 상품에 "정보 확인 중"을 보여주기로 정했다
  test("점수가 없으면 정보 확인 중을 보여준다", () => {
    render(<MatchScoreBadge score={null} />);
    expect(screen.getByText("정보 확인 중")).toBeDefined();
  });
});
