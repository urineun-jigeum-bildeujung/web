// 사진이 없으면 이름 앞 두 글자를, 있으면 사진만 보이는지 본다.
// 바탕색이 아이 id로 정해지는지(#488)도 함께 본다.
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { PetPhoto } from "./pet-photo";

test("사진이 없으면 이름 앞 두 글자를 원 안에 넣는다", () => {
  render(<PetPhoto petId="1" name="구름이" sizes="42px" textClassName="text-label-bold-14" />);

  expect(screen.getByText("구름")).toBeDefined();
});

test("사진이 있으면 글자 없이 사진만 둔다", () => {
  const { container } = render(
    <PetPhoto
      petId="1"
      name="구름이"
      photoUrl="https://image.leechs.shop/pets/1.jpg"
      sizes="42px"
      textClassName="text-label-bold-14"
    />,
  );

  expect(screen.queryByText("구름")).toBeNull();
  expect(container.querySelector("img")).not.toBeNull();
});

// 이름이 아니라 id로 정해져야 한다. 이름이 같은 아이가 둘이어도 색이 갈린다
test("바탕색은 아이 id로 정해진다", () => {
  const colorOf = (petId: string) => {
    const { container } = render(
      <PetPhoto petId={petId} name="구름이" sizes="42px" textClassName="text-label-bold-14" />,
    );
    return container.querySelector<HTMLElement>("span")?.style.background;
  };

  // jsdom이 hsl을 rgb로 옮겨 적는다. 공식 형식은 `shared/lib/avatar`의 테스트가 본다
  expect(colorOf("1")).toMatch(/^rgb\(/);
  expect(colorOf("1")).toBe(colorOf("1"));
  expect(colorOf("1")).not.toBe(colorOf("2"));
});

// 바탕이 테마와 무관하게 밝아 글자색이 다크 모드에서 뒤집히면 읽히지 않는다
test("글자는 테마에 따라 뒤집히지 않는 짙은 색이다", () => {
  const { container } = render(
    <PetPhoto petId="1" name="구름이" sizes="42px" textClassName="text-label-bold-14" />,
  );

  expect(container.querySelector("span")?.className).toContain("text-text-body-static-black");
});
