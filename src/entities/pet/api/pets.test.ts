// 아이 목록·상세 조회 테스트. 무엇을 부르고 서버 모양을 화면 모양으로 어떻게 옮기는지 본다.
import { afterEach, expect, test, vi } from "vitest";

import { getPetDetail, getPets } from "./pets";

const SUMMARIES = [
  { petId: 7, name: "보리", image: null, isDefault: false },
  { petId: 3, name: "코코", image: "https://cdn.example/coco.jpg", isDefault: true },
];

const DETAIL = {
  petId: 3,
  name: "코코",
  species: "DOG",
  breedId: 1,
  breedName: "말티즈",
  age: 4,
  birthDate: "2022-03-15",
  sex: "FEMALE",
  isNeutered: true,
  size: "SMALL",
  weight: 4.2,
  bcs: 3,
  healthConcerns: ["슬개골 탈구"],
  allergies: [{ code: "CHICKEN", displayName: "닭고기" }],
  image: null,
  isDefault: true,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

test("내 아이 목록을 부른다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json(SUMMARIES));
  vi.stubGlobal("fetch", fetchMock);

  await getPets();

  const [url] = fetchMock.mock.calls[0] as [string];
  expect(url).toContain("/members/me/pets");
});

// 백엔드 목록에 ORDER BY가 없어 순서가 DB에 달렸다. 순서가 흔들리면 아이 전환 줄에서
// 눌렀던 자리가 매번 달라진다
test("기본 아이를 앞으로 올린다", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(SUMMARIES)));

  const pets = await getPets();

  expect(pets.map((pet) => pet.name)).toEqual(["코코", "보리"]);
});

// 사진이 없는 아이는 회색 자리로 그린다. 빈 문자열이 오면 깨진 이미지가 뜬다
test("사진이 없으면 photoUrl을 두지 않는다", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(SUMMARIES)));

  const pets = await getPets();

  expect(pets[0]?.photoUrl).toBe("https://cdn.example/coco.jpg");
  expect(pets[1]).not.toHaveProperty("photoUrl");
});

test("상세를 부를 때 아이 id를 경로에 넣는다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json(DETAIL));
  vi.stubGlobal("fetch", fetchMock);

  await getPetDetail("3");

  const [url] = fetchMock.mock.calls[0] as [string];
  expect(url).toContain("/members/me/pets/3");
});

// 화면은 소문자 값으로 다룬다. 온보딩 초안·선택지 상수가 전부 그 모양이다
test("상세의 enum을 화면 값으로 옮긴다", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(DETAIL)));

  const pet = await getPetDetail("3");

  expect(pet).toMatchObject({
    id: "3",
    species: "dog",
    gender: "female",
    size: "small",
    neutered: true,
    weight: 4.2,
    bcs: 3,
  });
});

// 저장은 코드로 하고 화면에는 표시명을 보인다. 둘 다 잃지 않고 넘겨야 한다
test("알레르기는 코드와 표시명을 함께 넘긴다", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(DETAIL)));

  const pet = await getPetDetail("3");

  expect(pet.allergies).toEqual([{ code: "CHICKEN", displayName: "닭고기" }]);
  expect(pet.healthConcerns).toEqual(["슬개골 탈구"]);
});
