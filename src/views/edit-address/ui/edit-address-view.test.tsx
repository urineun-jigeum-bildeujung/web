// 배송지 화면 테스트. 주소창이 가리키는 곳에 맞는 값이 채워지는지, 무엇을 보내는지 본다.
//
// 대상이 바뀌는 경우(집 → 회사)는 여기서 확인하지 못한다.
// NuqsTestingAdapter가 searchParams를 처음 한 번만 읽어, 다시 렌더해도 값이 바뀌지 않는다.
// 그 경우는 화면 쪽에서 key로 폼을 새로 세워 막는다.
//
// 조회·저장은 가짜로 둔다. 무엇을 어떤 모양으로 보내는지는 `entities/address`가 본다.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, expect, test, vi } from "vitest";

const back = vi.fn();
const replace = vi.fn();
const create = vi.fn();
const update = vi.fn();
const useQueryAddresses = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ back, replace }) }));
vi.mock("@/entities/address", () => ({
  useQueryAddresses: () => useQueryAddresses(),
  useMutateAddress: () => ({ create, update, isSaving: false }),
}));

import { EditAddressView } from "./edit-address-view";

/** 명세 예시 JSON을 옮긴 값 */
const HOME = {
  addressId: 5,
  addressName: "집",
  receiver: "홍길동",
  phone: "010-1234-5678",
  zipCode: "06133",
  address: "서울특별시 강남구 테헤란로 123",
  addressDetail: "UI타워 4층 404호",
  deliveryNote: null,
  isDefault: true,
};

/** 검색 화면이 실어 보내는 값 */
const PICKED =
  "roadAddr=%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C+%EB%A7%88%ED%8F%AC%EA%B5%AC+%EC%96%91%ED%99%94%EB%A1%9C+45&zipNo=04039";
const PICKED_ROAD = "서울특별시 마포구 양화로 45";

beforeEach(() => {
  back.mockClear();
  replace.mockClear();
  create.mockReset().mockResolvedValue(12);
  update.mockReset().mockResolvedValue(undefined);
  useQueryAddresses.mockReturnValue({ addresses: [HOME], isLoading: false, error: null });
});

function renderAt(search: string) {
  render(
    <NuqsTestingAdapter searchParams={search}>
      <EditAddressView />
    </NuqsTestingAdapter>,
  );
  return screen.getByLabelText("배송지 이름") as HTMLInputElement;
}

const fill = (values: [string, string][]) => {
  for (const [label, value] of values) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
};

const submit = () => screen.getByRole("button", { name: /입력 완료/ });

test("새 배송지는 빈 칸으로 시작한다", () => {
  const input = renderAt("");

  expect(screen.getByRole("heading", { name: "어디로 보내드릴까요?" })).toBeDefined();
  expect(input.value).toBe("");
});

test("이미 저장된 곳을 열면 그 값이 채워진다", () => {
  const input = renderAt("?place=5");

  expect(screen.getByRole("heading", { name: "집 주소를 고칠까요?" })).toBeDefined();
  expect(input.value).toBe("집");
});

// 시안 mypa_311에 "연락처 추가" 메모가 붙었다. 기사가 부재 시 연락할 곳이다
test("저장된 곳을 열면 연락처도 함께 채워진다", () => {
  renderAt("?place=5");

  expect((screen.getByLabelText("연락처") as HTMLInputElement).value).toBe("010-1234-5678");
});

// 다른 칸이 함께 비어 있으면 연락처 조건을 지워도 테스트가 통과해 회귀를 놓친다.
// 전부 채워진 곳에서 연락처만 비워야 그 조건 하나를 겨눌 수 있다
test("다 채워진 배송지에서 연락처만 비우면 입력 완료가 꺼진다", () => {
  renderAt("?place=5");

  expect(submit().hasAttribute("disabled")).toBe(false);
  fill([["연락처", ""]]);
  expect(submit().hasAttribute("disabled")).toBe(true);
});

// 지워졌거나 주소창을 손으로 고친 경우다. 새 배송지로 다루면 고치려던 것이 하나 더 생긴다
test("없는 배송지를 가리키면 새로 만들지 않고 알린다", () => {
  render(
    <NuqsTestingAdapter searchParams="?place=999">
      <EditAddressView />
    </NuqsTestingAdapter>,
  );

  expect(screen.getByText("찾는 배송지가 없어요")).toBeDefined();
  expect(screen.queryByLabelText("배송지 이름")).toBeNull();
});

// 값이 나중에 들어오면서 사용자가 적던 것을 덮으면 안 된다
test("고칠 대상을 불러오는 동안에는 폼을 그리지 않는다", () => {
  useQueryAddresses.mockReturnValue({ addresses: undefined, isLoading: true, error: null });
  render(
    <NuqsTestingAdapter searchParams="?place=5">
      <EditAddressView />
    </NuqsTestingAdapter>,
  );

  expect(screen.getByRole("status")).toBeDefined();
  expect(screen.queryByLabelText("배송지 이름")).toBeNull();
});

// 채울 것이 없으므로 목록을 기다릴 이유가 없다
test("새 배송지는 목록을 기다리지 않는다", () => {
  useQueryAddresses.mockReturnValue({ addresses: undefined, isLoading: true, error: null });
  render(
    <NuqsTestingAdapter searchParams="">
      <EditAddressView />
    </NuqsTestingAdapter>,
  );

  expect(screen.getByLabelText("배송지 이름")).toBeDefined();
});

// 검색 화면이 주소창에 실어 보낸 값이다. 이게 안 되면 주소를 골라도 폼이 비어 있다
test("검색 화면에서 고른 주소가 주소 줄에 들어온다", () => {
  renderAt(`?${PICKED}`);

  expect(screen.getByText(PICKED_ROAD)).toBeDefined();
  expect(screen.queryByText("주소 검색")).toBeNull();
});

// 고치러 들어와 새로 골랐으면 저장된 주소가 아니라 방금 고른 것이 보여야 한다
test("저장된 곳을 열어 새 주소를 고르면 그것이 저장된 값을 덮는다", () => {
  renderAt(`?place=5&${PICKED}`);

  expect(screen.getByText(PICKED_ROAD)).toBeDefined();
  expect(screen.queryByText(HOME.address)).toBeNull();
});

// 주소를 고르지 않으면 넘길 값이 없다.
//
// 다른 칸까지 비워 두면 주소 조건을 지워도 다른 조건 때문에 통과해 회귀를 놓친다.
// 나머지를 채운 뒤 주소만 비워야 그 조건 하나를 겨눌 수 있다 (CodeRabbit 리뷰, #187)
test("다른 칸을 다 채워도 주소가 비어 있으면 입력 완료가 꺼진다", () => {
  renderAt("");

  fill([
    ["배송지 이름", "집"],
    ["받는 분 이름", "전경진"],
    ["연락처", "010-1234-5678"],
  ]);

  expect(screen.getByText("주소 검색")).toBeDefined();
  expect(submit().hasAttribute("disabled")).toBe(true);
});

// 위 테스트가 주소 조건만 겨누는지 뒤집어 확인한다
test("주소까지 채우면 입력 완료가 켜진다", () => {
  renderAt(`?${PICKED}`);

  fill([
    ["배송지 이름", "집"],
    ["받는 분 이름", "전경진"],
    ["연락처", "010-1234-5678"],
    // 서버가 상세주소도 @NotBlank로 받는다. 비우면 저장이 400으로 막힌다 (#314)
    ["상세 주소", "101동 1001호"],
  ]);

  expect(submit().hasAttribute("disabled")).toBe(false);
});

// **우편번호는 필수다.** 폼에 칸이 없어 눈으로는 빠진 것을 알 수 없으므로 여기서 본다
test("고른 주소의 우편번호가 함께 나간다", async () => {
  renderAt(`?${PICKED}`);

  fill([
    ["배송지 이름", "자취방"],
    ["받는 분 이름", "전경진"],
    ["연락처", "010-0000-0000"],
    ["상세 주소", "3층"],
  ]);
  fireEvent.click(submit());

  await waitFor(() => expect(create).toHaveBeenCalled());
  expect(create.mock.calls[0][0]).toMatchObject({
    addressName: "자취방",
    receiver: "전경진",
    phone: "010-0000-0000",
    zipCode: "04039",
    address: PICKED_ROAD,
    addressDetail: "3층",
  });
});

// 적지 않은 요청사항은 빈 문자열이 아니라 null이다. 명세에서 유일하게 nullable인 필드다
test("배송 요청사항을 비우면 null로 보낸다", async () => {
  renderAt(`?${PICKED}`);

  fill([
    ["배송지 이름", "자취방"],
    ["받는 분 이름", "전경진"],
    ["연락처", "010-0000-0000"],
    ["상세 주소", "2층"],
  ]);
  fireEvent.click(submit());

  await waitFor(() => expect(create).toHaveBeenCalled());
  expect(create.mock.calls[0][0].deliveryNote).toBeNull();
});

test("고치던 곳이면 등록이 아니라 수정을 부른다", async () => {
  renderAt("?place=5");

  fill([["배송지 이름", "본가"]]);
  fireEvent.click(submit());

  await waitFor(() => expect(update).toHaveBeenCalled());
  expect(create).not.toHaveBeenCalled();
  expect(update.mock.calls[0][0]).toMatchObject({
    addressId: 5,
    request: { addressName: "본가", zipCode: HOME.zipCode },
  });
});

// 저장되기 전에 떠나면 적은 것이 사라진다
test("저장이 끝난 뒤에 화면을 떠난다", async () => {
  renderAt("?place=5");

  fireEvent.click(submit());
  expect(back).not.toHaveBeenCalled();

  await waitFor(() => expect(back).toHaveBeenCalled());
});

/**
 * 주소는 검색 화면에서만 고른다. 그 화면의 쪽 이동이 history를 쌓아, 저장을 마치고 한 칸
 * 되돌리면 검색 화면으로 돌아간다. 몇 칸인지 셀 수 없어 돌아갈 곳을 주소창이 들고 다닌다 (#369).
 */
test("돌아갈 곳을 받았으면 저장한 뒤 그리로 간다", async () => {
  renderAt("?from=%2Fpayment%2Faddress&place=5");

  fireEvent.click(submit());

  await waitFor(() => expect(replace).toHaveBeenCalledWith("/payment/address"));
  expect(back).not.toHaveBeenCalled();
});

// 주소창에 실려 오는 값이라 손으로 고칠 수 있다. 그대로 믿으면 남의 사이트로 보내게 된다
test("돌아갈 곳이 바깥을 가리키면 쓰지 않는다", async () => {
  renderAt("?from=https%3A%2F%2Fevil.example&place=5");

  fireEvent.click(submit());

  await waitFor(() => expect(back).toHaveBeenCalled());
  expect(replace).not.toHaveBeenCalled();
});

// 고치던 대상을 들고 검색하러 가야 돌아올 때 그 배송지로 복귀한다.
// 돌아갈 곳도 함께 간다 — 검색 화면에서 잃으면 저장 뒤 그리로 되돌아온다 (#369)
test("고치는 중이면 검색 링크가 place와 돌아갈 곳을 들고 간다", () => {
  renderAt("?place=5&from=%2Fmypage%2Faddress");

  const link = screen.getByRole("link", { name: /주소/ }) as HTMLAnchorElement;
  const query = new URLSearchParams(link.getAttribute("href")!.split("?")[1]);
  expect(query.get("place")).toBe("5");
  expect(query.get("from")).toBe("/mypage/address");
});

test("새 배송지면 검색 링크에 place가 없다", () => {
  renderAt("");

  const link = screen.getByRole("link", { name: /주소/ }) as HTMLAnchorElement;
  expect(link.getAttribute("href")).toBe("/mypage/address/search");
});

// 서버 `AddressRegisterRequest`가 여섯을 모두 `@NotBlank`로 받는다. 비운 채 누르면 400이고
// `COMMON_400`은 어느 칸이 문제인지 알려주지 않는다 (#314)
test("상세주소를 비우면 입력 완료가 꺼진다", () => {
  renderAt(`?${PICKED}`);

  fill([
    ["배송지 이름", "집"],
    ["받는 분 이름", "전경진"],
    ["연락처", "010-1234-5678"],
    ["상세 주소", "101동 1001호"],
  ]);
  expect(submit().hasAttribute("disabled")).toBe(false);

  fill([["상세 주소", "  "]]);
  expect(submit().hasAttribute("disabled")).toBe(true);
});

/**
 * **수정에서 빈 값의 뜻이 등록과 다르다.**
 *
 * 서버 `mergeWithRequest`가 `null`을 "건드리지 마라"로 읽어, 지우려고 비웠는데 204로 성공하고
 * 옛 문구가 그대로 남았다. 수정에는 빈 문자열을 보낸다 (#314).
 */
test("수정에서 요청사항을 지우면 빈 문자열을 보낸다", async () => {
  renderAt("?place=5");

  fill([["배송 요청사항", ""]]);
  fireEvent.click(submit());

  await waitFor(() => expect(update).toHaveBeenCalled());
  expect(update.mock.calls[0][0].request.deliveryNote).toBe("");
});

/**
 * **이미 기본인 배송지는 체크를 끌 수 없다.**
 *
 * 서버가 마지막 기본 배송지를 지키느라 `LAST_DEFAULT_ADDRESS`로 저장 전체를 거절해, 같이
 * 고친 이름·연락처까지 무산된다 (#314).
 */
test("이미 기본인 배송지는 기본 해제를 막고 그 이유를 알린다", () => {
  renderAt("?place=5");

  const checkbox = screen.getByRole("checkbox", { name: /계속 이 주소로 받을게요/ });
  expect(checkbox.hasAttribute("disabled")).toBe(true);
  expect(screen.getByText("다른 배송지를 기본으로 지정하면 해제할 수 있어요")).toBeDefined();
});

// 기본이 아닌 배송지는 자유롭게 켜고 끈다
test("기본이 아닌 배송지는 체크를 바꿀 수 있다", () => {
  useQueryAddresses.mockReturnValue({
    addresses: [{ ...HOME, isDefault: false }],
    isLoading: false,
    error: null,
  });
  renderAt("?place=5");

  const checkbox = screen.getByRole("checkbox", { name: /계속 이 주소로 받을게요/ });
  expect(checkbox.hasAttribute("disabled")).toBe(false);
  expect(screen.queryByText("다른 배송지를 기본으로 지정하면 해제할 수 있어요")).toBeNull();
});
