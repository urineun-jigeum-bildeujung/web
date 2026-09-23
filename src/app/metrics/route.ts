// Prometheus가 읽어 가는 서버 지표. 파드를 직접 부른 요청에만 내보낸다 (#401).
import { isInternalHost, readServerMetrics } from "@/shared/lib/metrics/server-metrics";

export async function GET(request: Request) {
  // 바깥에서 온 요청에는 이 경로가 없는 것처럼 답한다
  if (!isInternalHost(request.headers.get("host"))) {
    return new Response(null, { status: 404 });
  }

  const { body, contentType } = await readServerMetrics();
  return new Response(body, { headers: { "Content-Type": contentType } });
}
