// 변경 실패 토스트가 MutationCache 한 곳에서 정확히 한 번 뜨는지 본다. 화면 catch가 또 띄우면 여기가 아니라
// 그 화면 테스트가 두 번을 잡는다(#359).
import { useMutation } from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { ApiError } from "@/shared/api/client";

const toastAppError = vi.fn();
vi.mock("@/shared/lib/app-toast", () => ({
  toastAppError: (...args: unknown[]) => toastAppError(...args),
}));

import { createQueryWrapper } from "./query-test-wrapper";

function Failing({ onError }: { onError?: () => void }) {
  const mutation = useMutation({
    mutationFn: () => Promise.reject(new ApiError(409, "이미 있음")),
    onError,
  });
  return <button onClick={() => mutation.mutate()}>보내기</button>;
}

afterEach(() => {
  toastAppError.mockClear();
});

test("변경이 실패하면 전역에서 토스트가 한 번 뜬다", async () => {
  const view = render(<Failing />, { wrapper: createQueryWrapper() });

  await act(async () => {
    view.getByText("보내기").click();
  });

  expect(toastAppError).toHaveBeenCalledTimes(1);
  expect(toastAppError).toHaveBeenCalledWith("common.conflict", expect.any(ApiError));
});

// defaultOptions.mutations.onError에 두면 호출부 onError가 그것을 덮어 알림이 조용히 사라진다
test("호출부가 onError를 줘도 전역 토스트는 그대로 뜬다", async () => {
  const onError = vi.fn();
  const view = render(<Failing onError={onError} />, { wrapper: createQueryWrapper() });

  await act(async () => {
    view.getByText("보내기").click();
  });

  expect(onError).toHaveBeenCalledTimes(1);
  expect(toastAppError).toHaveBeenCalledTimes(1);
});
