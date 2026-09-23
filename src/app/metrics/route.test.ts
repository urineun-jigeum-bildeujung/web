// /metrics가 바깥 요청에는 없는 것처럼 답하고, 파드를 직접 부른 요청에만 지표를 주는지 본다.
import { expect, test } from "vitest";

import { GET } from "./route";

function requestWithHost(host: string) {
  return new Request(`http://${host}/metrics`, { headers: { host } });
}

// 그대로 열면 누구나 leechs.shop/metrics로 서버 내부 지표를 본다
test("도메인으로 들어온 요청에는 404로 답한다", async () => {
  const response = await GET(requestWithHost("leechs.shop"));

  expect(response.status).toBe(404);
  expect(await response.text()).toBe("");
});

test("파드 IP로 들어온 요청에는 지표를 준다", async () => {
  const response = await GET(requestWithHost("10.0.1.23:3000"));

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/plain");
  expect(await response.text()).toContain("process_resident_memory_bytes");
});
