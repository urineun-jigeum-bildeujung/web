// 오류 경계 단위 테스트. 하위 오류를 가두고 재시도가 동작하는지 검증한다.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { ErrorBoundary } from "./error-boundary";

// React가 경계에 걸린 오류를 콘솔에 찍어 테스트 출력이 지저분해진다.
beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());

function Wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function Boom(): ReactNode {
  throw new Error("의도적으로 낸 오류");
}

test("정상일 때는 자식을 그대로 보여준다", () => {
  render(
    <Wrapper>
      <ErrorBoundary>
        <p>상품 목록</p>
      </ErrorBoundary>
    </Wrapper>,
  );

  expect(screen.getByText("상품 목록")).toBeDefined();
});

test("자식이 던진 오류를 가두고 안내와 재시도 버튼을 보여준다", () => {
  render(
    <Wrapper>
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    </Wrapper>,
  );

  expect(screen.getByRole("alert")).toBeDefined();
  expect(screen.getByRole("button", { name: "다시 시도" })).toBeDefined();
});

test("fallback을 주면 기본 안내 대신 그것을 보여준다", () => {
  render(
    <Wrapper>
      <ErrorBoundary fallback={(retry) => <button onClick={retry}>추천을 다시 불러오기</button>}>
        <Boom />
      </ErrorBoundary>
    </Wrapper>,
  );

  expect(screen.getByRole("button", { name: "추천을 다시 불러오기" })).toBeDefined();
  expect(screen.queryByRole("alert")).toBeNull();
});

test("재시도를 누르면 자식을 다시 그린다", () => {
  let shouldThrow = true;
  function Flaky(): ReactNode {
    if (shouldThrow) throw new Error("첫 렌더에서만 실패");
    return <p>복구됨</p>;
  }

  render(
    <Wrapper>
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>
    </Wrapper>,
  );

  shouldThrow = false;
  fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

  expect(screen.getByText("복구됨")).toBeDefined();
});
