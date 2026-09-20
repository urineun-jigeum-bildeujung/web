// 아이 관리 테스트. 탭 전환과 반응 시트, 거르기, 그리고 아이를 못 받았을 때를 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, expect, test, vi } from "vitest";

import { ApiError } from "@/shared/api/client";
import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

const push = vi.fn();
const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, back: vi.fn() }),
}));

// 목록·상세·선택지 셋을 서버에서 받는다(#230). 무엇을 부르고 어떻게 옮기는지는
// `entities/pet/api/pets.test.ts`가 보므로 여기서는 화면 동작만 본다
const PETS = [
  { id: "3", name: "코코", isDefault: true },
  { id: "7", name: "보리", isDefault: false },
];

const DETAIL = {
  id: "3",
  name: "코코",
  species: "dog" as const,
  breedId: 1,
  breedName: "말티즈",
  age: 4,
  birthDate: "2022-03-15",
  gender: "female" as const,
  neutered: true,
  size: "small" as const,
  weight: 4,
  bcs: 3,
  healthConcerns: ["슬개골 탈구"],
  allergies: [{ code: "CHICKEN", displayName: "닭고기" }],
  isDefault: true,
};

const query = {
  pets: PETS as { id: string; name: string; isDefault: boolean }[] | undefined,
  petsError: null as Error | null,
  pet: DETAIL as typeof DETAIL | undefined,
  petError: null as Error | null,
};

vi.mock("@/entities/pet", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/pet")>()),
  useQueryPets: () => ({ pets: query.pets, isLoading: false, error: query.petsError }),
  useQueryPetDetail: () => ({ pet: query.pet, isLoading: false, error: query.petError }),
}));

import { PetProfileView } from "./pet-profile-view";

beforeEach(() => {
  push.mockClear();
  replace.mockClear();
  query.pets = PETS;
  query.petsError = null;
  query.pet = DETAIL;
  query.petError = null;
});

function renderView(search = "") {
  render(
    <NuqsTestingAdapter searchParams={search}>
      <PetProfileView />
    </NuqsTestingAdapter>,
    { wrapper: createQueryWrapper() },
  );
}

test("기본은 내 아이 관리 탭이다", () => {
  renderView();

  expect(screen.getByRole("tab", { name: /내 아이 관리/ }).getAttribute("data-state")).toBe(
    "active",
  );
  expect(screen.getByText("걱정되는 질환 · 알러지")).toBeDefined();
});

test("정보 줄의 화살표가 각 수정 화면으로 간다", () => {
  renderView();

  expect(screen.getByRole("link", { name: "기본 정보 수정" }).getAttribute("href")).toBe(
    "/mypage/pets/basic",
  );
  expect(screen.getByRole("link", { name: "체형 수정" }).getAttribute("href")).toBe(
    "/mypage/pets/body",
  );
  expect(screen.getByRole("link", { name: "건강 정보 수정" }).getAttribute("href")).toBe(
    "/mypage/pets/health",
  );
});

test("주소창의 탭 값을 따른다", () => {
  // 목록에서 상세로 갔다 돌아와도 보던 탭이 남아야 한다
  renderView("?tab=products");

  expect(screen.getByRole("tab", { name: /아이 제품 관리/ }).getAttribute("data-state")).toBe(
    "active",
  );
  expect(screen.getAllByText(/구매일/).length).toBeGreaterThan(0);
});

test("반응 남기기를 누르면 그 제품의 반응 시트가 열린다", () => {
  renderView("?tab=products");

  fireEvent.click(screen.getByRole("button", { name: "베터 글루코사민 반응 남기기" }));
  expect(screen.getByText("코코에게 잘 맞았나요?")).toBeDefined();
  expect(screen.getByRole("radio", { name: "잘 맞았어요" })).toBeDefined();
});

test("아이를 고르면 그 아이가 선택 상태가 된다", () => {
  renderView();

  const [first, second] = screen.getAllByRole("radio");
  expect(first.getAttribute("aria-checked")).toBe("true");

  fireEvent.click(second);
  expect(second.getAttribute("aria-checked")).toBe("true");
  expect(first.getAttribute("aria-checked")).toBe("false");
});

test("새 아이 추가는 온보딩 기본 정보 단계로 간다", () => {
  renderView();

  fireEvent.click(screen.getByRole("button", { name: "새 아이 추가" }));
  expect(push).toHaveBeenCalledWith("/onboarding?step=basic");
});

test("아이 제품을 반응 입력 여부로 거른다", () => {
  // 목업 넷 중 둘만 반응을 남겼다
  renderView("?tab=products&reviewed=todo");
  expect(screen.getAllByRole("button", { name: /반응 남기기/ })).toHaveLength(2);
});

// 저장은 코드로 하지만 상세가 표시명을 함께 준다. 코드를 찍으면 사람이 읽지 못한다
test("알레르기를 표시명으로 보인다", () => {
  renderView();

  expect(screen.getByText("닭고기")).toBeDefined();
  expect(screen.queryByText("CHICKEN")).toBeNull();
});

test("고른 아이의 품종·나이·성별을 한 줄로 보인다", () => {
  renderView();

  expect(screen.getByText("말티즈 · 4세 · 여자아이")).toBeDefined();
  expect(screen.getByText("4kg")).toBeDefined();
  expect(screen.getByText("보통")).toBeDefined();
});

// 등록한 아이가 없는데 빈 카드만 보이면 고장으로 읽힌다
test("아이가 없으면 등록하러 가는 자리를 보인다", () => {
  query.pets = [];
  query.pet = undefined;
  renderView();

  expect(screen.getByText("아직 등록한 아이가 없어요")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "아이 등록하기" }));
  expect(push).toHaveBeenCalledWith("/onboarding?step=basic");
});

test("불러오지 못하면 그 사실을 알린다", () => {
  query.pet = undefined;
  query.petError = new Error("500");
  renderView();

  expect(screen.getByRole("alert").textContent).toContain("불러오지 못했어요");
});

// accessToken은 메모리에만 있어 새로고침하면 사라진다. 재발급 엔드포인트가 아직 없어
// 되살릴 수도 없다. "불러오지 못했어요"로 두면 눌러도 될 리 없는 것을 다시 누르게 한다
test("세션이 없으면 실패가 아니라 로그인으로 보낸다", () => {
  query.pets = undefined;
  query.pet = undefined;
  query.petsError = new ApiError(401, "인증 정보가 없습니다.");
  renderView();

  expect(push).not.toHaveBeenCalled();
  expect(replace).toHaveBeenCalledWith("/login");
  expect(screen.queryByRole("alert")).toBeNull();
});

// 문구만 두면 카드 자리가 통째로 비었다가 갑자기 채워진다
test("아이 정보를 받는 동안 카드 자리를 잡아 둔다", () => {
  query.pet = undefined;
  renderView();

  expect(screen.getByRole("status", { name: "아이 정보를 불러오는 중" })).toBeDefined();
});
