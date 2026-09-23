// 수집 설정이 있을 때만 관측 SDK를 불러오는지, 켜다 실패해도 화면을 막지 않는지 본다.
import { afterEach, expect, test, vi } from "vitest";

const { startFaro, reportError } = vi.hoisted(() => ({
  startFaro: vi.fn(),
  reportError: vi.fn(),
}));

vi.mock("@/shared/lib/observability/faro", () => ({ startFaro }));
vi.mock("@/shared/lib/report-error", () => ({ reportError }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

/** 진입점은 불러오는 순간 한 번 돈다. 값을 채운 뒤 새로 불러온다 */
async function boot(url: string, apiKey: string) {
  vi.stubEnv("NEXT_PUBLIC_FARO_URL", url);
  vi.stubEnv("NEXT_PUBLIC_FARO_API_KEY", apiKey);
  await import("./instrumentation-client");
}

// 로컬·CI에는 설정이 없다. 그때 SDK를 내려받으면 쓰지도 않을 번들을 받는다
test("설정이 없으면 SDK를 불러오지 않는다", async () => {
  await boot("", "");
  await vi.dynamicImportSettled();

  expect(startFaro).not.toHaveBeenCalled();
});

test("설정이 있으면 SDK를 불러와 켠다", async () => {
  await boot("https://example.test/collect", "key");

  await vi.waitFor(() => expect(startFaro).toHaveBeenCalledTimes(1));
});

// 곧바로 부르면 첫 화면의 스크립트·이미지와 대역을 다툰다. 페이지가 다 뜬 뒤에 받는다 (#396 리뷰)
test("페이지가 다 뜨기 전에는 SDK를 불러오지 않는다", async () => {
  const readyState = vi.spyOn(document, "readyState", "get").mockReturnValue("loading");

  await boot("https://example.test/collect", "key");
  await vi.dynamicImportSettled();
  expect(startFaro).not.toHaveBeenCalled();

  readyState.mockReturnValue("complete");
  window.dispatchEvent(new Event("load"));

  await vi.waitFor(() => expect(startFaro).toHaveBeenCalledTimes(1));
});

// 계측 때문에 화면이 멈추면 안 된다. 원본이 아니라 `reportError`의 요약으로만 남긴다
test("켜다 실패하면 알리고 넘어간다", async () => {
  startFaro.mockImplementationOnce(() => {
    throw new Error("SDK 초기화 실패");
  });

  await boot("https://example.test/collect", "key");

  await vi.waitFor(() => expect(reportError).toHaveBeenCalledWith("faro.start", expect.any(Error)));
});
