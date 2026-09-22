// 적다 만 배송지 폼 저장소 테스트.
//
// 주소 검색을 건너 살아남는 것이 목적이라, **못 읽는 경우에 폼을 막지 않는 것**이 정상 동작보다
// 중요하다. 사생활 보호 모드처럼 저장소가 막힌 환경이 실제로 있다 (#370).

import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { clearAddressDraft, readAddressDraft, writeAddressDraft } from "./address-draft";

const VALUES = {
  addressName: "집",
  receiver: "전지호",
  phone: "01012345678",
  addressDetail: "4층",
  deliveryNote: "문 앞에 놓아주세요",
  isDefault: false,
};

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("적어 둔 것을 그대로 읽는다", () => {
  writeAddressDraft("new", VALUES);

  expect(readAddressDraft("new")).toEqual(VALUES);
});

test("적어 둔 것이 없으면 없다고 한다", () => {
  expect(readAddressDraft("new")).toBeNull();
});

// `집`을 고치다 나가서 새 배송지를 넣으면 집 값이 새 폼에 들어찬다
test("다른 대상의 것은 읽지 않는다", () => {
  writeAddressDraft("5", VALUES);

  expect(readAddressDraft("new")).toBeNull();
  expect(readAddressDraft("5")).toEqual(VALUES);
});

test("지우면 없어진다", () => {
  writeAddressDraft("new", VALUES);
  clearAddressDraft();

  expect(readAddressDraft("new")).toBeNull();
});

// 적다 만 값이라 절반만 채워져 있다. 검증에 걸려 통째로 버리면 되살릴 것이 없다
test("아직 안 적은 칸은 빈 값으로 채워 돌려준다", () => {
  writeAddressDraft("new", { addressName: "집" });

  expect(readAddressDraft("new")).toEqual({
    addressName: "집",
    receiver: "",
    phone: "",
    addressDetail: "",
    deliveryNote: "",
    isDefault: false,
  });
});

// 손으로 고쳤거나 옛 모양이 남아 있을 수 있다. 그대로 믿으면 폼이 이상한 값으로 선다
test("모양이 맞지 않으면 없는 것으로 다룬다", () => {
  for (const broken of [
    '{"target":"new"}',
    '{"target":"new","values":{"isDefault":"예"}}',
    "깨진 값",
  ]) {
    sessionStorage.setItem("address.draft", broken);
    expect(readAddressDraft("new")).toBeNull();
  }
});

// 사생활 보호 모드나 저장소 차단 설정에서는 접근 자체가 던진다. 폼을 막을 이유가 없다
test("저장소가 막혀 있어도 던지지 않는다", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
    throw new Error("blocked");
  });

  expect(() => writeAddressDraft("new", VALUES)).not.toThrow();
  expect(readAddressDraft("new")).toBeNull();
  expect(() => clearAddressDraft()).not.toThrow();
});
