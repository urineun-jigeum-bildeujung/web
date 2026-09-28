// 리뷰 카드 테스트. 아이 정보가 읽히는지, 계약에 없는 값이 지어내지지 않는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Review } from "../model/review";

import { ReviewCard } from "./review-card";

/** 목록 응답으로 채운 카드. 닉네임과 도움돼요 수가 함께 온다 */
const FROM_LIST: Review = {
  id: "1",
  nickname: "댕댕이짱",
  pets: [{ id: "10", name: "보리", age: 8, species: "DOG", breedSize: "SMALL" }],
  rating: 4.5,
  date: "2026. 08. 31",
  images: [],
  tags: ["사용 21일"],
  content: "확실히 예전보다 계단 오를 때 덜 힘들어해요.",
  likeCount: 32,
};

describe("ReviewCard", () => {
  it("누가 어떤 아이와 썼는지가 함께 보인다", () => {
    render(<ReviewCard review={FROM_LIST} />);

    expect(screen.getByText("댕댕이짱")).toBeDefined();
    expect(screen.getByText("소형견 · 8세")).toBeDefined();
  });

  // 아이를 여럿 고를 수 있게 바뀌었다. 첫 마리만 적으면 나머지를 숨기는 것이라 사실과 다르다
  it("아이가 여러 마리면 줄이지 않고 전부 적는다", () => {
    render(
      <ReviewCard
        review={{
          ...FROM_LIST,
          pets: [
            { id: "10", name: "보리", age: 8, species: "DOG", breedSize: "SMALL" },
            { id: "11", name: "나비", age: 3, species: "CAT", breedSize: null },
          ],
        }}
      />,
    );

    expect(screen.getByText("소형견 · 8세, 고양이 · 3세")).toBeDefined();
  });

  // 목록에는 `liked`가 없다. 버튼으로 두면 누르는 순간 서버가 취소로 처리해 되돌아간다
  it("도움돼요는 수만 보이고 누를 수 없다", () => {
    render(<ReviewCard review={FROM_LIST} />);

    expect(screen.getByText("32")).toBeDefined();
    expect(screen.queryByRole("button", { name: /도움이 됐어요/ })).toBeNull();
  });

  // 신고는 되돌리기 어렵다. 누르는 순간 접수되면 안 된다
  it("신고하기를 눌러도 바로 접수되지 않고 확인창이 먼저 뜬다", () => {
    render(<ReviewCard review={FROM_LIST} />);

    fireEvent.click(screen.getByRole("button", { name: "신고하기" }));

    expect(screen.getByText("이 후기를 신고할까요?")).toBeDefined();
  });

  it("사진이 없으면 사진 자리를 그리지 않는다", () => {
    render(<ReviewCard review={FROM_LIST} />);

    expect(screen.queryByRole("img", { name: /후기 사진/ })).toBeNull();
  });

  it("사진이 있으면 몇 번째인지 알려준다", () => {
    render(<ReviewCard review={{ ...FROM_LIST, images: ["https://img.example/a.webp"] }} />);

    expect(screen.getByRole("img", { name: "후기 사진 1번째" })).toBeDefined();
  });

  // 공개 리뷰 상세에는 닉네임과 도움돼요 수가 없다. 사진 뷰어가 그쪽을 쓴다.
  // 임의의 이름과 숫자를 넣으면 진짜 후기 글에 다른 사람의 이름표가 붙는다(#339)
  describe("계약에 없는 값은 지어내지 않는다", () => {
    const FROM_DETAIL: Review = {
      id: FROM_LIST.id,
      pets: FROM_LIST.pets,
      rating: FROM_LIST.rating,
      date: FROM_LIST.date,
      images: FROM_LIST.images,
      tags: FROM_LIST.tags,
      content: FROM_LIST.content,
    };

    it("닉네임이 없으면 이름 줄을 그리지 않는다", () => {
      render(<ReviewCard review={FROM_DETAIL} />);

      expect(screen.queryByText("댕댕이짱")).toBeNull();
      // 아이 정보와 본문은 그대로 보인다
      expect(screen.getByText("소형견 · 8세")).toBeDefined();
      expect(screen.getByText(FROM_DETAIL.content)).toBeDefined();
    });

    it("도움돼요 수가 없으면 그 줄을 그리지 않는다", () => {
      render(<ReviewCard review={FROM_DETAIL} />);

      expect(screen.queryByText(/도움이 됐다고 했어요/)).toBeNull();
    });

    it("도움돼요 수가 0이면 0으로 보인다", () => {
      render(<ReviewCard review={{ ...FROM_DETAIL, likeCount: 0 }} />);

      expect(screen.getByText("0")).toBeDefined();
    });
  });
});
