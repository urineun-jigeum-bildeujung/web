// 아이 기본 정보 수정 테스트. 이름·나이·생일 칸이 온보딩과 같은 규칙으로 받는지 본다 (#524).
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import type { PetDetail } from "@/entities/pet";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));
// 품종 목록은 서버에서 온다. 이 파일은 다녀오는 흐름만 보므로 고르기 화면은 되돌아가는 버튼만 둔다
vi.mock("@/entities/pet", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/pet")>()),
  BreedPickerStep: ({ onCancel }: { onCancel: () => void }) => (
    <button type="button" onClick={onCancel}>
      이전 화면으로
    </button>
  ),
}));

const save = vi.fn();
const COCO: PetDetail = {
  id: "3",
  name: "코코",
  species: "dog",
  breedId: 1,
  breedName: "말티즈",
  age: 4,
  birthDate: "2022-04-08",
  gender: "female",
  neutered: true,
  size: "small",
  weight: 4,
  bcs: 3,
  healthConcerns: [],
  allergies: [],
  isDefault: true,
};
const state: { pet: PetDetail } = { pet: COCO };
vi.mock("../model/use-edit-pet", () => ({
  useEditPet: () => ({
    pet: state.pet,
    missingPetId: false,
    isLoading: false,
    error: null,
    isSaving: false,
    save: (...args: unknown[]) => save(...args),
  }),
}));

import { EditPetBasicView } from "./edit-pet-basic-view";

beforeEach(() => {
  save.mockClear();
  state.pet = COCO;
});

function renderView() {
  return render(
    <NuqsTestingAdapter>
      <EditPetBasicView />
    </NuqsTestingAdapter>,
  );
}

function field(label: string) {
  return screen.getByLabelText(label) as HTMLInputElement;
}

function submit() {
  return screen.getByRole("button", { name: "수정완료" }) as HTMLButtonElement;
}

// QA No.230. "우지빌12😭"이 그대로 저장됐다. 숫자는 온보딩처럼 받는다
test("이름에 이모티콘은 들어가지 않고 숫자는 들어간다", () => {
  renderView();

  fireEvent.change(field("아이의 이름을 알려주세요"), { target: { value: "우지빌12😭" } });
  fireEvent.click(submit());

  expect(field("아이의 이름을 알려주세요").value).toBe("우지빌12");
  expect(save.mock.calls[0][0]).toMatchObject({ name: "우지빌12" });
});

// 이모티콘을 막기 전에 저장된 이름이다. 다른 칸만 고쳐 저장해도 그 이름을 다시 보낸다
test("예전에 이모티콘과 함께 저장된 이름도 걷어 낸 채로 보인다", () => {
  state.pet = { ...COCO, name: "우지빌12😭" };
  renderView();

  expect(field("아이의 이름을 알려주세요").value).toBe("우지빌12");
});

// QA No.233. 숫자 외 문자·기호·이모티콘이 들어가고 수정완료가 켜졌다
test("나이와 생일에는 숫자만 들어간다", () => {
  renderView();

  fireEvent.change(field("나이"), { target: { value: "2asdf@@#🙇‍♂️" } });
  fireEvent.change(field("생일"), { target: { value: "2021abc0305!!" } });

  expect(field("나이").value).toBe("2");
  expect(field("생일").value).toBe("2021. 03. 05");

  fireEvent.click(submit());
  expect(save.mock.calls[0][0]).toMatchObject({ age: 2, birthDate: "2021-03-05" });
});

// QA No.196. 온보딩과 같은 상한이다
test("나이가 상한을 넘으면 알리고 저장을 막는다", () => {
  renderView();

  fireEvent.change(field("나이"), { target: { value: "31" } });

  expect(screen.getByText("나이는 30살까지 적을 수 있어요")).toBeDefined();
  expect(submit().disabled).toBe(true);
});

test("저장된 생일은 치는 모양으로 맞춰 보인다", () => {
  renderView();

  expect(field("생일").value).toBe("2022. 04. 08");
});

test("달력에 없는 날을 적으면 알리고 저장을 막는다", () => {
  renderView();

  fireEvent.change(field("생일"), { target: { value: "20221345" } });

  expect(screen.getByText("달력에 없는 날이에요")).toBeDefined();
  expect(submit().disabled).toBe(true);
});

// 품종 고르기는 이 화면을 통째로 바꿔 끼워, 돌아오면 사진 칸이 새로 그려진다. 사진을 안에만 들 때는
// 고른 사진 대신 저장된 옛 사진이 보였는데 저장에는 고른 사진이 실렸다 (#602)
test("사진을 고르고 품종 고르기에 다녀와도 고른 사진이 보인다", () => {
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
  state.pet = { ...COCO, photoUrl: "https://image.leechs.shop/old.png" };
  render(
    <NuqsTestingAdapter hasMemory>
      <EditPetBasicView />
    </NuqsTestingAdapter>,
  );
  const photo = new File(["bytes"], "coco.jpg", { type: "image/jpeg" });

  fireEvent.change(screen.getByLabelText("아이 사진", { selector: "input" }), {
    target: { files: [photo] },
  });
  fireEvent.click(screen.getByRole("button", { name: "품종 고르기. 지금은 말티즈" }));
  fireEvent.click(screen.getByRole("button", { name: "이전 화면으로" }));

  expect(screen.getByRole("presentation").getAttribute("src")).toBe("blob:preview");
  fireEvent.click(submit());
  expect(save.mock.calls[0][1]).toBe(photo);
});
