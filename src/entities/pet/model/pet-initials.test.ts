// 사진 없는 아이 원에 넣을 글자가 이름 앞 두 글자인지 본다.
import { expect, test } from "vitest";

import { petInitials } from "./pet-initials";

test("이름 앞 두 글자만 남긴다", () => {
  expect(petInitials("구름이")).toBe("구름");
  expect(petInitials("코코")).toBe("코코");
});

test("한 글자 이름은 그대로 둔다", () => {
  expect(petInitials("콩")).toBe("콩");
});

test("앞뒤 공백을 떼고 센다", () => {
  expect(petInitials(" 보리 ")).toBe("보리");
});

// 코드 단위로 자르면 이모지가 반쪽으로 잘려 깨진 글자가 원에 남는다
test("두 칸짜리 글자도 한 글자로 센다", () => {
  expect(petInitials("🐶멍멍")).toBe("🐶멍");
});

// 코드 포인트로 자르면 피부색·ZWJ로 이은 이모지가 반으로 잘린다(#470 리뷰)
test("여러 코드 포인트로 된 이모지도 한 글자로 센다", () => {
  expect(petInitials("👍🏽콩이")).toBe("👍🏽콩");
  expect(petInitials("👨‍👩‍👧보리")).toBe("👨‍👩‍👧보");
});
