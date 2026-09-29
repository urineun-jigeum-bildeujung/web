// 배송 요청사항이 보기인지 직접 적은 글인지 가르는 테스트 (#526).
import { expect, test } from "vitest";

import { clampDeliveryNote, DELIVERY_NOTE_OPTIONS, isDirectDeliveryNote } from "./delivery-note";

const EMOJI = String.fromCodePoint(0x1f64f);

test("100자까지는 그대로 두고 넘치면 100자로 자른다", () => {
  expect(clampDeliveryNote("가".repeat(100))).toBe("가".repeat(100));
  expect(clampDeliveryNote("가".repeat(101))).toBe("가".repeat(100));
});

// 이모지는 두 단위라 99자 뒤에 오면 100자 경계에 걸린다. 반만 남기면 깨진 글자가 저장된다 (#526 리뷰)
test("경계에 걸린 이모지는 반만 남기지 않고 통째로 뺀다", () => {
  expect(clampDeliveryNote(`${"가".repeat(99)}${EMOJI}`)).toBe("가".repeat(99));
  expect(clampDeliveryNote(`${"가".repeat(98)}${EMOJI}가`)).toBe(`${"가".repeat(98)}${EMOJI}`);
});

test("보기 문구는 직접 적은 글이 아니다", () => {
  expect(isDirectDeliveryNote("경비실에 맡겨주세요")).toBe(false);
});

// 아직 고르지 않은 것이다. 직접 입력으로 읽으면 요청사항이 없는 배송지를 열 때 빈 칸이 열린다
test("빈 값은 직접 적은 글이 아니다", () => {
  expect(isDirectDeliveryNote("")).toBe(false);
});

test("목록에 없는 글은 직접 적은 것이다", () => {
  expect(isDirectDeliveryNote("벨 누르지 말아 주세요")).toBe(true);
});

// 보기로 읽으면 상자에 "직접 입력"이 뜨는데 칸은 닫혀 적어 둔 글이 보이지 않는다
test("'직접 입력'이라는 글자 자체도 직접 적은 것이다", () => {
  expect(DELIVERY_NOTE_OPTIONS).toContain("직접 입력");
  expect(isDirectDeliveryNote("직접 입력")).toBe(true);
});
