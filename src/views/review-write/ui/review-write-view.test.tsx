// 무엇을 다 채워야 넘어가고 등록되는지, 아이의 반응을 실제로 받아 서버에 보내는지 본다.
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));
const toastAppError = vi.fn();
vi.mock("@/shared/lib/app-toast", () => ({
  toastAppError: (...args: unknown[]) => toastAppError(...args),
}));

import { resetReviewDraftCache } from "../model/draft-storage";
import { ReviewWriteView } from "./review-write-view";

const PETS = [
  { petId: 1, name: "소리", image: null, isDefault: true },
  { petId: 2, name: "냥냥이", image: null, isDefault: false },
];
const PROFILE = {
  nickname: "소리맘",
  name: null,
  birth: null,
  phone: null,
  image: null,
  email: "me@example.com",
};
const PRODUCT = {
  productId: 7,
  timeDealItemId: null,
  summary: { images: [], productName: "오메가3 피쉬오일 60캡슐" },
  detailInfo: {},
};
const PRESIGNED = {
  uploadUrl: "https://bucket.s3.amazonaws.com/reviews/member-1/uuid.jpg?X-Amz-Signature=sig",
  fileUrl: "https://image.leechs.shop/reviews/member-1/uuid.jpg",
};

/** 화면이 부르는 조회를 주소로 갈라 답한다. 등록·발급·PUT도 여기서 받는다 */
type StubOverrides = {
  create?: () => Response;
  pets?: () => Response;
  product?: () => Response;
};

function stubApi({
  create = () => Response.json({ reviewId: 1 }, { status: 201 }),
  pets = () => Response.json(PETS),
  product = () => Response.json(PRODUCT),
}: StubOverrides = {}) {
  const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>((url, init) => {
    if (url.includes("/members/me/pets")) return Promise.resolve(pets());
    if (url.includes("/members/me")) return Promise.resolve(Response.json(PROFILE));
    if (url.includes("/products/")) return Promise.resolve(product());
    if (url.includes("presigned-url")) return Promise.resolve(Response.json(PRESIGNED));
    if (url === PRESIGNED.uploadUrl) return Promise.resolve(new Response(null, { status: 200 }));
    if (url.includes("/reviews") && init?.method === "POST") return Promise.resolve(create());
    return Promise.resolve(Response.json({}, { status: 404 }));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  toastAppError.mockClear();
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

// 초안이 기기에 남으므로 테스트끼리 물들지 않게 비운다
afterEach(() => {
  window.localStorage.clear();
  resetReviewDraftCache();
  vi.unstubAllGlobals();
});

function renderAt(search = "", productId: string | null = "7") {
  return render(
    // hasMemory가 없으면 어댑터가 URL 갱신을 기억하지 않아, 서버 응답으로 다시 그릴 때 단계가 첫 값으로 되돌아간다
    <NuqsTestingAdapter searchParams={search} hasMemory>
      <ReviewWriteView productId={productId ?? undefined} />
    </NuqsTestingAdapter>,
    { wrapper: createQueryWrapper() },
  );
}

/** 같은 이름의 보기가 여러 묶음에 있어 묶음을 먼저 좁힌다 */
function pick(group: string, option: string) {
  fireEvent.click(
    within(screen.getByRole("radiogroup", { name: group })).getByRole("radio", { name: option }),
  );
}

/**
 * 1단계 필수를 채우고 2단계로 넘어간다.
 *
 * **기호성도 필수다.** 시안이 문항에 "필수" 배지를 붙였다 (#302).
 */
function goToDetail() {
  fireEvent.click(screen.getByRole("radio", { name: "5점 만점에 4점" }));
  fireEvent.change(screen.getByLabelText("사용 기간"), { target: { value: "16" } });
  pick("잘 먹었나요?", "잘 먹어요");
  fireEvent.click(screen.getByRole("button", { name: "다음" }));
}

/** 2단계에서 필수를 다 채운다. skipPet이면 아이만, skipAnswer면 반응 문항만 비워 둔다 */
async function fillDetail({ skipPet = false, skipAnswer = false } = {}) {
  // 아이 목록은 서버에서 온다
  await screen.findByRole("radio", { name: "소리" });
  if (!skipPet) fireEvent.click(screen.getByRole("radio", { name: "소리" }));
  if (!skipAnswer) pick("아이에게 급여하기 편했나요?", "편해요");
  fireEvent.change(screen.getByLabelText("후기"), {
    target: { value: "확실히 예전보다 계단 오를 때 덜 힘들어해요" },
  });
}

const submitButton = () => screen.getByRole("button", { name: "등록하기" });

describe("ReviewWriteView 진입", () => {
  it("어떤 구매의 후기인지 모르면 작성 화면 대신 안내를 보인다", () => {
    stubApi();
    renderAt("", null);

    expect(screen.getByText("어떤 상품의 후기인지 알 수 없어요")).toBeDefined();
    expect(screen.queryByRole("radiogroup", { name: "상품 만족도" })).toBeNull();
  });

  it("상품 줄은 서버에서 받은 이름을 보인다", async () => {
    stubApi();
    renderAt();

    expect(await screen.findByText("오메가3 피쉬오일 60캡슐")).toBeDefined();
  });

  // 스켈레톤으로 덮어 두면 기다리는 줄 안다. 못 받았으면 그렇다고 말하고 다시 시도할 길을 준다
  it("상품 정보를 못 받으면 알리고 다시 시도할 수 있다", async () => {
    const fetchMock = stubApi({ product: () => Response.json({}, { status: 500 }) });
    renderAt();

    expect(await screen.findByText("상품 정보를 불러오지 못했어요")).toBeDefined();
    const before = fetchMock.mock.calls.filter(([url]) => url.includes("/products/")).length;
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    await waitFor(() =>
      expect(fetchMock.mock.calls.filter(([url]) => url.includes("/products/")).length).toBe(
        before + 1,
      ),
    );
  });

  it("아이 목록을 못 받으면 빈 줄 대신 그 사실을 알린다", async () => {
    stubApi({ pets: () => Response.json({}, { status: 500 }) });
    renderAt("?step=detail");

    expect(await screen.findByText("아이 목록을 불러오지 못했어요")).toBeDefined();
    expect(screen.queryByRole("radio", { name: "소리" })).toBeNull();
  });
});

describe("ReviewWriteView 1단계", () => {
  beforeEach(() => {
    stubApi();
  });

  it("별점 말고 아이의 반응도 함께 묻고, 반응은 선택이다", () => {
    renderAt();

    for (const question of [
      "잘 먹었나요?",
      "배변 상태는 어땠나요?",
      "피부 · 털 상태는 어땠나요?",
      "체중 · 활력은 어땠나요?",
      "알러지 반응이 있었나요?",
    ]) {
      expect(screen.getByRole("radiogroup", { name: question })).toBeDefined();
    }
    expect(screen.getAllByText("선택").length).toBeGreaterThan(0);
  });

  // 시안이 기호성에도 "필수" 배지를 붙였다 (#302)
  it("별점·사용 기간·기호성을 채워야 다음으로 간다", () => {
    renderAt();

    const next = screen.getByRole("button", { name: "다음" });
    expect(next.hasAttribute("disabled")).toBe(true);

    fireEvent.click(screen.getByRole("radio", { name: "5점 만점에 4점" }));
    expect(next.hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByLabelText("사용 기간"), { target: { value: "16" } });
    // 기호성이 남아 아직 잠겨 있다
    expect(next.hasAttribute("disabled")).toBe(true);

    pick("잘 먹었나요?", "잘 먹어요");
    expect(next.hasAttribute("disabled")).toBe(false);
  });

  // 나머지 넷은 시안이 "선택"으로 그린다
  it("기호성 말고 다른 문항은 비워도 다음으로 간다", () => {
    renderAt();

    fireEvent.click(screen.getByRole("radio", { name: "5점 만점에 4점" }));
    fireEvent.change(screen.getByLabelText("사용 기간"), { target: { value: "16" } });
    pick("잘 먹었나요?", "잘 먹어요");

    expect(screen.getByRole("button", { name: "다음" }).hasAttribute("disabled")).toBe(false);
  });

  it("별은 반 개 단위로 매기고 화살표 키로 반 개씩 옮긴다", () => {
    renderAt();

    const half = screen.getByRole("radio", { name: "5점 만점에 3.5점" });
    fireEvent.click(half);
    expect(half.getAttribute("aria-checked")).toBe("true");

    fireEvent.keyDown(half, { key: "ArrowRight" });
    // 초점이 뒤처지면 다음 화살표가 엉뚱한 데서 출발한다
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "5점 만점에 4점" }));
  });

  it("새로고침해도 별점과 사용 기간이 남는다", async () => {
    const first = renderAt();
    fireEvent.click(screen.getByRole("radio", { name: "5점 만점에 4점" }));
    fireEvent.change(screen.getByLabelText("사용 기간"), { target: { value: "16" } });
    pick("잘 먹었나요?", "잘 먹어요");
    first.unmount();
    resetReviewDraftCache();

    renderAt("?step=detail");
    await fillDetail();

    // 2단계에서 새로고침한 뒤에도 1단계 값이 살아 있어 등록할 수 있다
    expect(screen.getByText("16일째 사용 중")).toBeDefined();
    expect(submitButton().hasAttribute("disabled")).toBe(false);
  });

  it("사용 기간에는 숫자만 남는다", () => {
    renderAt();

    const days = screen.getByLabelText("사용 기간") as HTMLInputElement;
    fireEvent.change(days, { target: { value: "1a6" } });

    expect(days.value).toBe("16");
  });
});

describe("ReviewWriteView 2단계", () => {
  it("1단계에서 답한 문항만 요약 카드에 배지로 보인다", () => {
    stubApi();
    renderAt();
    fireEvent.click(screen.getByRole("radio", { name: "5점 만점에 4.5점" }));
    fireEvent.change(screen.getByLabelText("사용 기간"), { target: { value: "7" } });
    pick("잘 먹었나요?", "보통이에요");
    pick("배변 상태는 어땠나요?", "좋아졌어요");
    fireEvent.click(screen.getByRole("button", { name: "다음" }));

    // "보통이에요"는 2단계의 급여 편의성 보기에도 있어 요약 카드 안에서 찾는다
    const card = screen.getByText("7일째 사용 중").parentElement as HTMLElement;
    expect(within(card).getByText("5점 만점에 4.5점")).toBeDefined();
    expect(within(card).getByText("보통이에요")).toBeDefined();
    expect(within(card).getByText("좋아졌어요")).toBeDefined();
    // 안 답한 피부·모질은 배지가 없다
    expect(within(card).queryByText(/피부/)).toBeNull();
  });

  it("어느 아이가 먹었는지 빠지면 등록할 수 없다", async () => {
    stubApi();
    renderAt();
    goToDetail();
    // 아이를 모르면 그 답을 다음 추천에 쓸 수 없다
    await fillDetail({ skipPet: true });

    expect(submitButton().hasAttribute("disabled")).toBe(true);

    fireEvent.click(screen.getByRole("radio", { name: "소리" }));
    expect(submitButton().hasAttribute("disabled")).toBe(false);
  });

  // 시안은 전부 선택이지만 서버가 하나 이상을 요구한다. 백엔드 확인이 올 때까지 막는다(#291)
  it("급여 편의성을 안 고르면 등록할 수 없다", async () => {
    stubApi();
    renderAt();
    goToDetail();
    await fillDetail({ skipAnswer: true });

    expect(submitButton().hasAttribute("disabled")).toBe(true);

    pick("아이에게 급여하기 편했나요?", "편해요");
    expect(submitButton().hasAttribute("disabled")).toBe(false);
  });

  it("이전은 뒤로가기 없이도 1단계로 돌아간다", () => {
    stubApi();
    renderAt("?step=detail");

    fireEvent.click(screen.getByRole("button", { name: "이전" }));

    expect(screen.getByRole("radiogroup", { name: "상품 만족도" })).toBeDefined();
  });

  it("후기가 열 자에 못 미치면 등록할 수 없다", async () => {
    stubApi();
    renderAt();
    goToDetail();
    await fillDetail();

    fireEvent.change(screen.getByLabelText("후기"), { target: { value: "좋아요" } });

    expect(submitButton().hasAttribute("disabled")).toBe(true);
  });

  it("등록하면 답한 문항만 실어 보내고, 고마움을 전한 뒤 확인이 작성한 리뷰 목록으로 이어진다", async () => {
    const fetchMock = stubApi();
    renderAt();
    fireEvent.click(screen.getByRole("radio", { name: "5점 만점에 4점" }));
    fireEvent.change(screen.getByLabelText("사용 기간"), { target: { value: "16" } });
    pick("잘 먹었나요?", "잘 먹어요");
    fireEvent.click(screen.getByRole("button", { name: "다음" }));
    // 나머지 넷은 비워 둔다 — 시안이 선택으로 그린 문항들이다 (#302)
    await fillDetail();

    fireEvent.click(submitButton());

    expect(await screen.findByText("소중한 리뷰 감사해요!")).toBeDefined();
    // 완료 문구의 이름은 회원 정보에서 온다
    expect(screen.getByText(/소리맘님의 후기가/)).toBeDefined();
    expect(screen.getByRole("link", { name: "확인" }).getAttribute("href")).toBe(
      "/mypage/reviews?tab=written",
    );

    const [, init] = fetchMock.mock.calls.find(
      ([url, options]) => url.endsWith("/reviews") && options?.method === "POST",
    ) as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      productId: 7,
      petId: 1,
      starRate: 4,
      usagePeriod: 16,
      // 필수 둘만 답했다. 선택인 넷은 실리지 않는다
      answerValues: [
        { questionKey: "PALATABILITY", answerValue: "POSITIVE" },
        { questionKey: "FEEDING_CONVENIENCE", answerValue: "POSITIVE" },
      ],
      text: "확실히 예전보다 계단 오를 때 덜 힘들어해요",
    });
  });

  // 사진은 URL로 보내야 해서 등록 전에 S3에 먼저 올린다. 발급 → PUT → 등록 순서를 본다
  it("사진을 붙였으면 먼저 올리고 그 주소를 images에 실어 보낸다", async () => {
    const fetchMock = stubApi();
    renderAt();
    goToDetail();
    await fillDetail();
    // 시트를 거치지 않고 사진첩 입력에 바로 넣는다. 시트의 동작은 photo-picker 테스트가 본다
    fireEvent.change(screen.getByLabelText("사진첩에서 고르기"), {
      target: { files: [new File(["bytes"], "coco.jpg", { type: "image/jpeg" })] },
    });

    fireEvent.click(submitButton());

    expect(await screen.findByText("소중한 리뷰 감사해요!")).toBeDefined();
    const urls = fetchMock.mock.calls.map(([url]) => url);
    const put = urls.indexOf(PRESIGNED.uploadUrl);
    expect(put).toBeGreaterThan(urls.findIndex((url) => url.includes("presigned-url")));
    // 발급도 `/reviews` 아래 POST라 등록만 골라낸다
    const register = urls.findIndex(
      (url, index) =>
        url.endsWith("/reviews") && fetchMock.mock.calls[index]?.[1]?.method === "POST",
    );
    expect(register).toBeGreaterThan(put);
    const [, init] = fetchMock.mock.calls[register] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({ images: [PRESIGNED.fileUrl] });
  });

  // 지우면 두 단계를 처음부터 다시 채워야 한다. 됐다고 알리는 것도 거짓이다
  it("등록에 실패하면 초안을 지우지 않고 그 자리에 남는다", async () => {
    stubApi({
      create: () => Response.json({ errorCode: "REVIEW_409_ALREADY_REVIEWED" }, { status: 409 }),
    });
    renderAt();
    goToDetail();
    await fillDetail();

    fireEvent.click(submitButton());

    await waitFor(() => expect(toastAppError).toHaveBeenCalled());
    expect(screen.queryByText("소중한 리뷰 감사해요!")).toBeNull();
    expect(screen.getByText("16일째 사용 중")).toBeDefined();
  });
});
