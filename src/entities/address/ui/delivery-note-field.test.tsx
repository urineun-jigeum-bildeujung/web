// 배송 요청사항 고르기 테스트. 결제 화면과 배송지 폼이 같은 목록을 보이는지, 직접 입력 칸이
// 언제 열리고 무엇을 값으로 넘기는지 본다 (QA No.174, #526).
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { expect, test } from "vitest";

import { DeliveryNoteField } from "./delivery-note-field";

/** 부르는 쪽처럼 값을 들고 라벨을 잇는다 */
function Harness({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <label htmlFor="note">요청사항</label>
      <DeliveryNoteField id="note" value={value} onChange={setValue} />
      <output aria-label="보낼 값">{value}</output>
    </>
  );
}

const trigger = () => screen.getByLabelText("요청사항");
const direct = () =>
  screen.queryByLabelText("배송 요청사항 직접 입력") as HTMLTextAreaElement | null;
const sent = () => screen.getByLabelText("보낼 값").textContent;

function choose(name: string) {
  fireEvent.click(trigger());
  fireEvent.click(screen.getByRole("option", { name }));
}

// QA 시트가 기대한 목록이다 — 문 앞·경비실·부재 시 전화·사전 연락·직접 받기·직접 입력
test("시안 순서대로 여섯 보기를 보이고 첫 보기에만 [기본]을 붙인다", () => {
  render(<Harness initial="문 앞에 놓아주세요" />);

  fireEvent.click(trigger());

  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
    "[기본] 문 앞에 놓아주세요",
    "경비실에 맡겨주세요",
    "부재 시 전화 부탁드려요",
    "배송 전 미리 연락 주세요",
    "직접 받을게요",
    "직접 입력",
  ]);
});

// 요청사항은 비워 둘 수 있다. 고른 척 첫 보기를 채우면 저장할 때 적지 않은 요청사항이 실린다
test("고른 것이 없으면 안내 글자를 보이고 적는 칸은 닫혀 있다", () => {
  render(<Harness />);

  expect(trigger().textContent).toBe("요청사항을 선택해주세요");
  expect(direct()).toBeNull();
});

test("보기를 고르면 그 문구가 값이 된다", () => {
  render(<Harness />);

  choose("경비실에 맡겨주세요");

  expect(sent()).toBe("경비실에 맡겨주세요");
  expect(direct()).toBeNull();
});

// 시안(paym_001_직접입력)은 직접 입력을 고른 뒤에만 칸을 연다
test("직접 입력을 고르면 빈 칸이 열리고 적은 글이 값이 된다", () => {
  render(<Harness initial="경비실에 맡겨주세요" />);

  choose("직접 입력");
  expect(direct()?.value).toBe("");
  expect(sent()).toBe("");

  fireEvent.change(direct()!, { target: { value: "벨 누르지 말아 주세요" } });
  expect(sent()).toBe("벨 누르지 말아 주세요");
  expect(screen.getByText("12/100자")).toBeDefined();
});

// 저장해 둔 배송지를 고치러 들어온 경우다. 칸이 닫혀 있으면 적어 둔 글이 어디에도 안 보인다
test("목록에 없는 글이 오면 직접 입력 칸을 연 채로 그 글을 보인다", () => {
  render(<Harness initial="벨 누르지 말아 주세요" />);

  expect(trigger().textContent).toBe("직접 입력");
  expect(direct()?.value).toBe("벨 누르지 말아 주세요");
});

// 값만 보고 칸을 열고 닫으면, 적던 글이 보기 문구와 같아지는 순간 칸이 닫혀 버린다
test("적는 글이 보기 문구와 같아져도 칸이 닫히지 않는다", () => {
  render(<Harness />);

  choose("직접 입력");
  fireEvent.change(direct()!, { target: { value: "직접 받을게요" } });

  expect(trigger().textContent).toBe("직접 입력");
  expect(direct()?.value).toBe("직접 받을게요");
});
