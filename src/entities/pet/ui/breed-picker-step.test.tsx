// 품종 선택 화면 테스트. 목록을 서버에서 받아 검색창이 거르고, 줄을 누르면 바로 확정되는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

import { BreedPickerStep } from "./breed-picker-step";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

/** 종마다 따로 부르므로 쿼리 스트링을 보고 갈라 답한다 */
function stubBreeds() {
  const fetchMock = vi.fn((url: string) =>
    Promise.resolve(
      Response.json(
        url.includes("CAT")
          ? [
              { id: 36, breedName: "코리안 숏헤어" },
              { id: 50, breedName: "랙돌" },
            ]
          : [
              { id: 1, breedName: "말티즈" },
              { id: 22, breedName: "비글" },
            ],
      ),
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderStep(props: Partial<Parameters<typeof BreedPickerStep>[0]> = {}) {
  return render(
    <BreedPickerStep value={null} onConfirm={vi.fn()} onCancel={vi.fn()} {...props} />,
    { wrapper: createQueryWrapper() },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test("두 종을 각각 불러 한 목록으로 보여준다", async () => {
  const fetchMock = stubBreeds();
  renderStep();

  expect(await screen.findByRole("button", { name: "말티즈" })).toBeDefined();
  expect(screen.getByRole("button", { name: "랙돌" })).toBeDefined();

  // API가 종을 필수로 받아 호출이 둘로 나뉜다
  const urls = fetchMock.mock.calls.map(([url]) => String(url));
  expect(urls.some((url) => url.includes("/pets/breeds") && url.includes("species=DOG"))).toBe(
    true,
  );
  expect(urls.some((url) => url.includes("/pets/breeds") && url.includes("species=CAT"))).toBe(
    true,
  );
});

test("고른 품종의 id로 다시 열면 그 줄이 표시된 채로 나온다", async () => {
  stubBreeds();
  renderStep({ value: 50 });

  const row = await screen.findByRole("button", { name: "랙돌" });
  expect(row.getAttribute("aria-current")).toBe("true");
});

// 시안에 확인 버튼이 없다. 줄을 누르는 것이 곧 확정이다
test("줄을 누르면 고른 품종을 통째로 넘긴다", async () => {
  stubBreeds();
  const onConfirm = vi.fn();
  renderStep({ onConfirm });

  fireEvent.click(await screen.findByRole("button", { name: "랙돌" }));

  expect(onConfirm).toHaveBeenCalledWith({ id: 50, breedName: "랙돌", species: "cat" });
  expect(screen.queryByRole("button", { name: "선택 완료" })).toBeNull();
});

test("검색창에 치면 목록이 걸러지고 지우면 돌아온다", async () => {
  stubBreeds();
  renderStep();
  await screen.findByRole("button", { name: "비글" });

  fireEvent.change(screen.getByLabelText("품종 검색"), { target: { value: "말티" } });
  expect(screen.queryByRole("button", { name: "비글" })).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "입력 지우기" }));
  expect(screen.getByRole("button", { name: "비글" })).toBeDefined();
});

// 문구 한 줄만 두면 검색창 아래가 비었다가 갑자기 수십 줄로 차서 화면이 튄다.
// 줄 높이로 자리를 잡고, 보조기기에는 무엇을 기다리는지 이름으로 알린다
test("불러오는 동안 줄 자리를 잡아 둔다", () => {
  vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
  renderStep();

  const pending = screen.getByRole("status", { name: "품종을 불러오는 중" });
  expect(pending.querySelectorAll("li").length).toBeGreaterThan(0);
});

test("목록을 못 받으면 까닭을 알린다", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({}, { status: 500 })));
  renderStep();

  expect(await screen.findByRole("alert")).toBeDefined();
  expect(screen.queryByRole("button", { name: "말티즈" })).toBeNull();
});

test("머리말의 뒤로가기가 부르던 화면으로 돌려보낸다", () => {
  stubBreeds();
  const onCancel = vi.fn();
  renderStep({ onCancel });

  fireEvent.click(screen.getByRole("button", { name: "이전 화면으로" }));
  expect(onCancel).toHaveBeenCalledOnce();
});
