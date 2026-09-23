// 수집 주소·키·앱 이름으로 SDK를 켜고, trace 전파를 함께 켜는지 본다.
import { expect, test, vi } from "vitest";

const { initializeFaro, TracingInstrumentation } = vi.hoisted(() => ({
  initializeFaro: vi.fn(),
  TracingInstrumentation: class TracingInstrumentation {},
}));

// 실제 SDK는 브라우저 API를 붙잡고 요청을 보낸다. 무엇을 넘기는지만 본다
vi.mock("@grafana/faro-web-sdk", () => ({
  initializeFaro,
  getWebInstrumentations: () => ["web-default"],
}));
vi.mock("@grafana/faro-web-tracing", () => ({ TracingInstrumentation }));

// 설정은 모듈을 읽는 순간 고정되므로 import 전에 채운다
vi.stubEnv("NEXT_PUBLIC_FARO_URL", "https://example.test/collect");
vi.stubEnv("NEXT_PUBLIC_FARO_API_KEY", "key");

const { startFaro } = await import("./faro");

// **trace 계측이 빠지면 오류는 모여도 백엔드 로그와 이어지지 않는다.** 그게 이 연동의 절반이다
test("수집 주소·키·앱 이름으로 켜고 trace 전파를 함께 켠다", () => {
  startFaro();

  expect(initializeFaro).toHaveBeenCalledWith({
    url: "https://example.test/collect",
    apiKey: "key",
    app: { name: "petflow-web", environment: "test" },
    instrumentations: ["web-default", expect.any(TracingInstrumentation)],
  });
});
