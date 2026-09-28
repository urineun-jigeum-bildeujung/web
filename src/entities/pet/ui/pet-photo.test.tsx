// 사진이 없으면 이름 앞 두 글자를, 있으면 사진만 보이는지 본다.
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { PetPhoto } from "./pet-photo";

test("사진이 없으면 이름 앞 두 글자를 원 안에 넣는다", () => {
  render(<PetPhoto name="구름이" sizes="42px" textClassName="text-label-bold-14" />);

  expect(screen.getByText("구름")).toBeDefined();
});

test("사진이 있으면 글자 없이 사진만 둔다", () => {
  const { container } = render(
    <PetPhoto
      name="구름이"
      photoUrl="https://image.leechs.shop/pets/1.jpg"
      sizes="42px"
      textClassName="text-label-bold-14"
    />,
  );

  expect(screen.queryByText("구름")).toBeNull();
  expect(container.querySelector("img")).not.toBeNull();
});
