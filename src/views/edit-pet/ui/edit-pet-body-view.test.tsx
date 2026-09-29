// 아이 체형 수정 테스트. 강아지는 체구까지 보내고 고양이는 체구를 묻지 않는지 본다(#391).
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import type { PetDetail } from "@/entities/pet";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

const save = vi.fn();
const DOG: PetDetail = {
  id: "3",
  name: "코코",
  species: "dog",
  breedId: 1,
  breedName: "말티즈",
  age: 4,
  birthDate: null,
  gender: "female",
  neutered: true,
  size: "small",
  weight: 4,
  bcs: 3,
  healthConcerns: [],
  allergies: [],
  isDefault: true,
};
const state: { pet: PetDetail } = { pet: DOG };
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

import { EditPetBodyView } from "./edit-pet-body-view";

beforeEach(() => {
  save.mockClear();
  // 테스트마다 아이를 바꿔 끼운다. 앞 테스트의 아이가 뒤로 새지 않게 되돌린다
  state.pet = DOG;
});

test("강아지는 체구를 묻고 고른 체구를 함께 저장한다", () => {
  render(<EditPetBodyView />);

  fireEvent.click(screen.getByRole("radio", { name: "중형" }));
  fireEvent.click(screen.getByRole("button", { name: "수정완료" }));

  expect(save).toHaveBeenCalledWith({ size: "MEDIUM", weight: 4, bcs: 3 });
});

// QA No.242. 10.11111이 그대로 저장되고 칸에 kg이 없었다
test("몸무게는 소수 첫째 자리까지만 받아 저장하고 칸을 벗어나면 kg을 붙인다", () => {
  state.pet = { ...state.pet, id: "5", weight: 10.11111 };
  render(<EditPetBodyView />);
  const weight = screen.getByLabelText("코코의 대략적인 몸무게를 알려주세요") as HTMLInputElement;

  // 예전에 저장된 값도 첫째 자리까지로 보인다
  expect(weight.value).toBe("10.1kg");

  fireEvent.focus(weight);
  fireEvent.change(weight, { target: { value: "4.567" } });
  fireEvent.blur(weight);
  expect(weight.value).toBe("4.5kg");

  fireEvent.click(screen.getByRole("button", { name: "수정완료" }));
  expect(save).toHaveBeenCalledWith({ size: "SMALL", weight: 4.5, bcs: 3 });
});

test("고양이는 체구를 묻지 않고 체구 없이 저장한다", () => {
  state.pet = { ...state.pet, id: "4", name: "나비", species: "cat", size: null };
  render(<EditPetBodyView />);

  expect(screen.queryByText("아이의 체구는 어느 정도인가요?")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "수정완료" }));

  expect(save).toHaveBeenCalledWith({ weight: 4, bcs: 3 });
});
