// 아이 체형 수정 테스트. 강아지는 체구까지 보내고 고양이는 체구를 묻지 않는지 본다(#391).
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import type { PetDetail } from "@/entities/pet";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

const save = vi.fn();
const state: { pet: PetDetail } = {
  pet: {
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
  },
};
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
});

test("강아지는 체구를 묻고 고른 체구를 함께 저장한다", () => {
  render(<EditPetBodyView />);

  fireEvent.click(screen.getByRole("radio", { name: "중형" }));
  fireEvent.click(screen.getByRole("button", { name: "수정완료" }));

  expect(save).toHaveBeenCalledWith({ size: "MEDIUM", weight: 4, bcs: 3 });
});

test("고양이는 체구를 묻지 않고 체구 없이 저장한다", () => {
  state.pet = { ...state.pet, id: "4", name: "나비", species: "cat", size: null };
  render(<EditPetBodyView />);

  expect(screen.queryByText("아이의 체구는 어느 정도인가요?")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "수정완료" }));

  expect(save).toHaveBeenCalledWith({ weight: 4, bcs: 3 });
});
