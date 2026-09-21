// 온보딩 화면 테스트. 단계 이동과 다음 버튼 활성 조건을 검증한다.
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

import { EMPTY_PROFILE_DRAFT } from "@/entities/pet";

// 건강 단계가 선택지를 서버에서 받는다(#226). 못 받으면 넘어가지 못하게 막으므로 세운다.
// 무엇을 보내고 어떻게 옮기는지는 `entities/pet/api/health-options.test.ts`가 본다
vi.mock("@/entities/pet", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/pet")>()),
  useQueryHealthOptions: () => ({
    options: {
      concerns: [{ label: "관절·뼈", items: [{ value: "슬개골 탈구", label: "슬개골 탈구" }] }],
      allergies: [{ label: "알레르기", items: [{ value: "CHICKEN", label: "닭고기" }] }],
    },
    isLoading: false,
    error: null,
  }),
}));

import { getDraft, resetDraftCache, setDraft } from "../model/draft-storage";
import { OnboardingView } from "./onboarding-view";

const push = vi.fn();
const toastAppError = vi.fn();
vi.mock("@/shared/lib/app-toast", () => ({
  toastAppError: (...args: unknown[]) => toastAppError(...args),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, back: vi.fn() }) }));
// 도입부 목업 이미지. jsdom에는 이미지 최적화가 없어 img로 대신한다
type MockImageProps = ComponentProps<"img"> & { fill?: boolean; priority?: boolean };
vi.mock("next/image", () => ({
  default: ({ fill, priority, alt, ...props }: MockImageProps) => {
    // fill·priority는 next/image 전용이라 img에 넘기면 경고가 난다
    void fill;
    void priority;
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...props} />;
  },
}));

beforeEach(() => {
  // 초안을 기기에 남기므로 앞 테스트가 뒤 테스트로 새어 나간다
  window.localStorage.clear();
  resetDraftCache();
  push.mockClear();
  toastAppError.mockClear();
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderAt(search: string, children: ReactNode = <OnboardingView />) {
  // 품종 단계가 서버에서 목록을 받는다(#226). Provider가 없으면 그 단계 렌더에서 죽는다
  return render(<NuqsTestingAdapter searchParams={search}>{children}</NuqsTestingAdapter>, {
    wrapper: createQueryWrapper(),
  });
}

test("기본은 도입부를 보여준다", () => {
  renderAt("");
  expect(screen.getByRole("heading", { name: "딱 1분만 아이에 대해 알려주세요" })).toBeDefined();
});

// 시안 도입부에는 버튼이 하나뿐이다. 섹션 메모도 "건너뛰기, 닫기 버튼 삭제"다.
// 이름을 짚어 없는지만 보면 다른 이름의 이탈 버튼이 생겨도 통과하므로 개수를 센다
test("도입부에는 프로필 입력하기 하나만 있다", () => {
  renderAt("");

  const buttons = screen.getAllByRole("button");
  expect(buttons).toHaveLength(1);
  expect(buttons[0].textContent).toBe("프로필 입력하기");
});

test("첫 입력 단계는 세 항목이 다 차야 다음으로 넘어갈 수 있다", () => {
  renderAt("?step=basic");

  const next = screen.getByRole("button", { name: "다음 단계 작성하기" });
  expect((next as HTMLButtonElement).disabled).toBe(true);

  fireEvent.change(screen.getByLabelText("아이의 이름을 알려주세요"), {
    target: { value: "코코" },
  });
  fireEvent.click(screen.getByText("남자아이"));
  expect((next as HTMLButtonElement).disabled).toBe(true);

  fireEvent.click(screen.getByText("했어요"));
  expect((next as HTMLButtonElement).disabled).toBe(false);
});

// 시안 onbo_002가 첫 단계의 "이전"을 비활성으로 그린다. 도입부로 돌아가는 길은 없다
test("첫 입력 단계의 이전은 잠겨 있다", () => {
  renderAt("?step=basic");
  expect((screen.getByRole("button", { name: "이전" }) as HTMLButtonElement).disabled).toBe(true);
});

test("건강 단계는 해당 없음 체크만으로도 넘어갈 수 있다", () => {
  renderAt("?step=health");

  const next = screen.getByRole("button", { name: "작성 완료" });
  expect((next as HTMLButtonElement).disabled).toBe(true);

  const [concern, allergy] = screen.getAllByRole("checkbox", { name: "해당 사항이 없어요" });
  fireEvent.click(concern);
  fireEvent.click(allergy);

  expect((next as HTMLButtonElement).disabled).toBe(false);
});

test("입력 단계 위에는 진행 표시만 있고 머리말은 없다", () => {
  const { container } = renderAt("?step=detail");

  expect(screen.getByRole("progressbar", { name: "전체 3단계 중 2단계" })).toBeDefined();
  expect(container.querySelector("header")).toBeNull();
  expect(screen.queryByRole("button", { name: "닫기" })).toBeNull();
});

test("도입부에는 진행 표시가 없다", () => {
  renderAt("");
  expect(screen.queryByRole("progressbar")).toBeNull();
});

// 시안에는 건너뛰기도 닫기도 없다. 모달만 보면 다른 이탈 경로가 생겨도 통과하므로
// 링크까지 함께 본다
test("입력 단계에는 온보딩을 떠나는 버튼도 링크도 없다", () => {
  const { container } = renderAt("?step=basic");

  // 이탈 확인 모달을 여는 곳이 없어 모달도 함께 사라졌다
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(screen.queryByText("프로필 작성을 그만둘까요?")).toBeNull();

  // 다른 화면으로 새는 링크도 없다
  expect(container.querySelectorAll("a")).toHaveLength(0);
});

test("체구를 고르기 전에는 몸무게·체질 항목이 없다", () => {
  renderAt("?step=detail");

  // 시안 onbo_003_체구선택전에는 두 항목이 보이지 않는다
  expect(screen.queryByPlaceholderText("평균 몸무게 5kg")).toBeNull();
  expect(screen.queryByRole("slider")).toBeNull();
});

test("체구를 고르면 몸무게와 체질 항목이 나타난다", () => {
  renderAt("?step=detail");

  fireEvent.click(screen.getByText("소형"));

  expect(screen.getByPlaceholderText("평균 몸무게 5kg")).toBeDefined();
  expect(screen.getByRole("slider")).toBeDefined();
  expect(screen.getByText("보통")).toBeDefined();
});

test("체구 물음표를 누르면 몇 kg으로 가르는지 보인다", () => {
  renderAt("?step=detail");

  fireEvent.click(screen.getByRole("button", { name: "체구 기준 보기" }));
  expect(screen.getByText("소형은 10kg 미만")).toBeDefined();
});

test("품종 선택 단계에는 진행 표시 대신 품종선택 머리말이 있다", () => {
  renderAt("?step=breed");

  expect(screen.queryByRole("progressbar")).toBeNull();
  expect(screen.getByRole("heading", { name: "품종선택" })).toBeDefined();
});

// 시안에 이어지는 화면이 없어 같은 흐름을 처음부터 다시 돈다
test("완료 화면의 프로필 추가는 초안을 비우고 첫 입력 단계로 돌아간다", () => {
  window.localStorage.setItem("onboarding-draft", JSON.stringify({ name: "코코" }));
  resetDraftCache();
  renderAt("?step=done");

  expect(screen.getByRole("heading", { name: /코코의 프로필 등록이 끝났어요/ })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "프로필 추가" }));

  expect(window.localStorage.getItem("onboarding-draft")).toBeNull();
  expect(screen.getByRole("heading", { name: "아이를 소개해 주세요" })).toBeDefined();
});

// 마지막 단계의 "작성 완료"에서 프로필이 서버에 등록된다.
// 초안은 앞 단계들이 채워 두므로 여기서는 저장소에 직접 넣고 그 단계만 연다
function fillDraft() {
  setDraft({
    ...EMPTY_PROFILE_DRAFT,
    name: "코코",
    gender: "female",
    neutered: "yes",
    species: "dog",
    breedId: 1,
    breedName: "말티즈",
    age: "4",
    size: "small",
    weight: "4.2",
    noConcern: true,
    noAllergy: true,
  });
  resetDraftCache();
}

test("작성 완료를 누르면 프로필을 등록하고 완료 단계로 간다", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(Response.json({ petId: 1, name: "코코" }, { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);
  fillDraft();
  renderAt("?step=health");

  fireEvent.click(screen.getByRole("button", { name: "작성 완료" }));

  // 이 단계는 건강 옵션도 함께 부른다. 등록 호출만 골라 본다
  const register = () =>
    fetchMock.mock.calls.find(([url]) => String(url).includes("/members/me/pets"));
  await waitFor(() => expect(register()).toBeDefined());

  const [, init] = register() as [string, RequestInit];
  expect(init.method).toBe("POST");
  expect(JSON.parse(String(init.body))).toMatchObject({
    name: "코코",
    sex: "FEMALE",
    species: "DOG",
    breedId: 1,
    bcs: 3,
  });
});

// 사진은 URL로 보내야 해서 등록 전에 S3에 먼저 올린다. 발급 → PUT → 등록 순서와,
// 등록 본문에 그 주소가 실리는 것을 본다
test("사진을 골랐으면 먼저 올리고 그 주소와 함께 등록한다", async () => {
  const presigned = {
    uploadUrl: "https://bucket.s3.amazonaws.com/profiles/member-1/uuid.jpg?X-Amz-Signature=sig",
    fileUrl: "https://image.leechs.shop/profiles/member-1/uuid.jpg",
  };
  const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>((url) => {
    if (url.includes("presigned-url")) return Promise.resolve(Response.json(presigned));
    if (url === presigned.uploadUrl) return Promise.resolve(new Response(null, { status: 200 }));
    return Promise.resolve(Response.json({ petId: 1, name: "코코" }, { status: 201 }));
  });
  vi.stubGlobal("fetch", fetchMock);
  fillDraft();
  // 사진은 기기에 남지 않아 캐시에 직접 넣는다. 화면에서 고른 것과 같은 상태다
  setDraft({ ...getDraft(), photo: new File(["bytes"], "coco.jpg", { type: "image/jpeg" }) });
  renderAt("?step=health");

  fireEvent.click(screen.getByRole("button", { name: "작성 완료" }));

  const register = () =>
    fetchMock.mock.calls.find(([url]) => String(url).includes("/members/me/pets"));
  await waitFor(() => expect(register()).toBeDefined());

  const urls = fetchMock.mock.calls.map(([url]) => String(url));
  expect(urls.indexOf(presigned.uploadUrl)).toBeGreaterThan(
    urls.findIndex((url) => url.includes("presigned-url")),
  );
  const [, init] = register() as [string, RequestInit];
  expect(JSON.parse(String(init.body))).toMatchObject({ image: presigned.fileUrl });
});

// 지우면 여섯 단계를 처음부터 다시 채워야 한다.
// 실패가 실제로 처리된 뒤를 보지 않으면 요청 전에 통과할 수 있다
test("등록에 실패하면 초안을 지우지 않고 그 자리에 남는다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({}, { status: 500 }));
  vi.stubGlobal("fetch", fetchMock);
  fillDraft();
  renderAt("?step=health");

  fireEvent.click(screen.getByRole("button", { name: "작성 완료" }));

  // 실패를 알린 뒤에 본다. 그전에는 초안이 그대로인 것이 당연하다
  await waitFor(() => expect(toastAppError).toHaveBeenCalled());
  expect(getDraft().name).toBe("코코");
  // 완료 단계로 넘어가지 않는다 — 등록되지 않았는데 됐다고 알리는 셈이다
  expect(screen.getByRole("button", { name: "작성 완료" })).toBeDefined();
  expect(screen.queryByRole("button", { name: "홈으로 가기" })).toBeNull();
});

// 입력 단계가 달력에 없는 날을 막지만, 초안이 기기에 남아 `?step=health`로 바로
// 들어오면 그 가드를 거치지 않는다. 생일을 뺀 채 등록되면 적은 사람은 저장된 줄 안다
test("저장된 초안의 생일이 달력에 없는 날이면 등록하지 않고 그 칸으로 돌려보낸다", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(Response.json({ petId: 1, name: "코코" }, { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);
  fillDraft();
  setDraft({ ...getDraft(), birthday: "2003. 10. 92" });
  resetDraftCache();
  renderAt("?step=health");

  fireEvent.click(screen.getByRole("button", { name: "작성 완료" }));

  await waitFor(() => expect(toastAppError).toHaveBeenCalled());
  expect(
    fetchMock.mock.calls.find(([url]) => String(url).includes("/members/me/pets")),
  ).toBeUndefined();
  // 고칠 칸이 있는 단계로 돌려보낸다
  expect(screen.getByLabelText("생년월일")).toBeDefined();
});

// 잘못 적은 값이 조용히 빠지면 사용자는 적었으니 저장된 줄 안다.
// 그대로 나가면 서버가 본문을 통째로 거절하기까지 한다
test("몸무게에 숫자가 아닌 것은 들어가지 않는다", () => {
  setDraft({ ...EMPTY_PROFILE_DRAFT, breedId: 1, breedName: "말티즈", size: "small" });
  resetDraftCache();
  renderAt("?step=detail");

  fireEvent.change(screen.getByLabelText("대략적인 몸무게"), { target: { value: "4키로" } });

  expect((screen.getByLabelText("대략적인 몸무게") as HTMLInputElement).value).toBe("4");
});

test("생년월일은 치는 대로 구분점이 붙는다", () => {
  setDraft({ ...EMPTY_PROFILE_DRAFT, breedId: 1, breedName: "말티즈", size: "small" });
  resetDraftCache();
  renderAt("?step=detail");

  fireEvent.change(screen.getByLabelText("생년월일"), { target: { value: "20031029" } });

  expect((screen.getByLabelText("생년월일") as HTMLInputElement).value).toBe("2003. 10. 29");
});

test("달력에 없는 날을 적으면 알리고 다음으로 못 간다", () => {
  setDraft({
    ...EMPTY_PROFILE_DRAFT,
    breedId: 1,
    breedName: "말티즈",
    size: "small",
    weight: "4.2",
  });
  resetDraftCache();
  renderAt("?step=detail");

  fireEvent.change(screen.getByLabelText("생년월일"), { target: { value: "20031092" } });

  expect(screen.getByText("달력에 없는 날이에요")).toBeDefined();
  expect(
    (screen.getByRole("button", { name: "다음 단계 작성하기" }) as HTMLButtonElement).disabled,
  ).toBe(true);
});

// 알레르기는 종별로 갈리는 코드가 있다(고양이 전용 BONITO, 강아지 전용 INSECT).
// 그대로 두면 새 종에 없는 코드를 등록 요청에 실어 보낸다
test("종이 바뀌면 고른 질환과 알레르기를 함께 비운다", async () => {
  // 종마다 따로 부른다. 같은 값을 주면 한 품종이 양쪽 묶음에 다 뜬다
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve(
        Response.json(
          url.includes("CAT")
            ? [{ id: 36, breedName: "코리안 숏헤어" }]
            : [{ id: 1, breedName: "말티즈" }],
        ),
      ),
    ),
  );
  setDraft({
    ...EMPTY_PROFILE_DRAFT,
    species: "dog",
    breedId: 1,
    breedName: "말티즈",
    concern: ["슬개골 탈구"],
    allergy: ["CHICKEN"],
  });
  resetDraftCache();
  renderAt("?step=breed");

  fireEvent.click(await screen.findByRole("button", { name: "코리안 숏헤어" }));

  expect(getDraft().species).toBe("cat");
  expect(getDraft().concern).toEqual([]);
  expect(getDraft().allergy).toEqual([]);
});

// 나이는 등록에 필수다. 여기서 안 막으면 마지막 단계에서 까닭 모를 오류만 뜬다
test("나이를 비우면 다음 단계로 못 간다", () => {
  setDraft({
    ...EMPTY_PROFILE_DRAFT,
    breedId: 1,
    breedName: "말티즈",
    size: "small",
    weight: "4.2",
  });
  resetDraftCache();
  renderAt("?step=detail");

  expect(
    (screen.getByRole("button", { name: "다음 단계 작성하기" }) as HTMLButtonElement).disabled,
  ).toBe(true);

  fireEvent.change(screen.getByLabelText("나이"), { target: { value: "4" } });

  expect(
    (screen.getByRole("button", { name: "다음 단계 작성하기" }) as HTMLButtonElement).disabled,
  ).toBe(false);
});
