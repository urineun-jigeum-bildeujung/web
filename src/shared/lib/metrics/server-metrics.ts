// 서버(Next.js) 지표를 Prometheus 형식으로 내보낸다. 인프라가 web 파드의 /metrics를 수집한다 (#401).
//
// **바깥에는 열지 않는다.** 그대로 두면 누구나 `leechs.shop/metrics`로 서버 내부 지표를 본다.
// Prometheus는 파드 IP로 직접 부르고(Host가 `10.x.x.x:3000`), 바깥 요청은 로드밸런서를 거쳐 Host가
// 도메인이다. 로드밸런서 규칙이 도메인에만 걸려 있어 다른 Host로는 웹까지 오지 못한다. 그래서 Host가
// IP나 localhost일 때만 내보낸다 — 배포 설정이 바뀌어도 막히는 쪽으로 틀어진다.
//
// **`x-forwarded-for` 유무로는 가를 수 없다.** Next.js가 없으면 소켓 주소로 채워 넣어
// (`next/dist/server/base-server.js`) 모든 요청에 붙어 있다.

import { collectDefaultMetrics, Registry } from "prom-client";

/**
 * 프로세스에 하나만 둔다. 개발 서버가 모듈을 다시 읽을 때마다 새로 만들면 이벤트 루프·GC 수집기가
 * 계속 덧붙는다.
 */
const globalForMetrics = globalThis as typeof globalThis & { serverMetrics?: Registry };

function registry(): Registry {
  if (!globalForMetrics.serverMetrics) {
    const created = new Registry();
    // 메모리·CPU·이벤트 루프 지연·GC 같은 Node.js 기본 지표. 표준 이름이라 Grafana 대시보드가 그대로 읽는다
    collectDefaultMetrics({ register: created });
    globalForMetrics.serverMetrics = created;
  }
  return globalForMetrics.serverMetrics;
}

const IPV4_HOST = /^\d{1,3}(\.\d{1,3}){3}(:\d+)?$/;
const IPV6_HOST = /^\[[0-9a-f:.]+\](:\d+)?$/i;
const LOCALHOST = /^localhost(:\d+)?$/i;

/** 파드를 직접 부른 요청인가. 도메인으로 온 요청은 로드밸런서를 거친 바깥 요청이다 */
export function isInternalHost(host: string | null): boolean {
  if (!host) {
    return false;
  }
  return IPV4_HOST.test(host) || IPV6_HOST.test(host) || LOCALHOST.test(host);
}

export async function readServerMetrics(): Promise<{ body: string; contentType: string }> {
  const metrics = registry();
  return { body: await metrics.metrics(), contentType: metrics.contentType };
}
