// 파드를 직접 부른 요청만 가려내는지, 지표를 Prometheus 형식으로 내는지 본다.
import { expect, test, vi } from "vitest";

import { isInternalHost, readServerMetrics } from "./server-metrics";

// Prometheus는 파드 IP로 부른다. 로컬 개발 서버는 localhost다
test.each(["10.0.1.23:3000", "10.0.1.23", "localhost:3000", "[fd00::1]:3000"])(
  "%s는 안쪽 요청이다",
  (host) => {
    expect(isInternalHost(host)).toBe(true);
  },
);

// 로드밸런서를 거친 바깥 요청은 Host가 도메인이다. Host가 없으면 판단할 수 없으니 막는다
test.each(["leechs.shop", "leechs.shop:443", "10.0.1.23.evil.example", null])(
  "%s는 바깥 요청이다",
  (host) => {
    expect(isInternalHost(host)).toBe(false);
  },
);

test("Node.js 기본 지표를 Prometheus 형식으로 낸다", async () => {
  const { body, contentType } = await readServerMetrics();

  expect(contentType).toContain("text/plain");
  expect(body).toContain("process_cpu_user_seconds_total");
  expect(body).toContain("nodejs_heap_size_used_bytes");
});

// 개발 서버가 모듈을 다시 읽을 때마다 새로 만들면 이벤트 루프·GC 수집기가 계속 덧붙는다
test("모듈을 다시 읽어도 레지스트리를 새로 만들지 않는다", async () => {
  const shared = globalThis as { serverMetrics?: unknown };
  await readServerMetrics();
  const first = shared.serverMetrics;

  vi.resetModules();
  const reloaded = await import("./server-metrics");
  await reloaded.readServerMetrics();

  expect(first).toBeDefined();
  expect(shared.serverMetrics).toBe(first);
});
