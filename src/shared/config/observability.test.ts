// 수집 주소와 키가 둘 다 있을 때만 관측을 켜는지 본다.
import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

/** 설정은 모듈을 읽는 순간 고정되므로 값을 채운 뒤 새로 불러온다 */
async function load(url: string, apiKey: string) {
  vi.stubEnv("NEXT_PUBLIC_FARO_URL", url);
  vi.stubEnv("NEXT_PUBLIC_FARO_API_KEY", apiKey);
  return import("./observability");
}

test("주소와 키가 모두 있으면 켠다", async () => {
  const { FARO_CONFIG, isFaroConfigured } = await load(" https://example.test/collect ", "key");

  expect(isFaroConfigured()).toBe(true);
  // 복사해 붙일 때 딸려 온 공백으로 주소가 어긋나지 않게 다듬는다
  expect(FARO_CONFIG.url).toBe("https://example.test/collect");
});

// 키 없이 보내면 수집 서버가 401로 거절한다. 반쯤 채운 설정으로 요청을 쌓지 않는다
test.each([
  ["주소가 비면", "", "key"],
  ["키가 비면", "https://example.test/collect", ""],
  ["키가 공백뿐이면", "https://example.test/collect", "  "],
])("%s 켜지 않는다", async (_case, url, apiKey) => {
  const { isFaroConfigured } = await load(url, apiKey);

  expect(isFaroConfigured()).toBe(false);
});
