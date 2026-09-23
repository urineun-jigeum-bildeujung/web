// Grafana Faro를 켠다. 오류·웹 바이탈·콘솔 오류를 모으고, 우리 API 요청에 trace를 실어 백엔드와 잇는다.
//
// **`instrumentation-client.ts`가 설정이 있을 때만 동적으로 불러온다.** SDK와 OpenTelemetry가 합쳐
// 무거워 첫 화면 번들에 넣지 않는다. 설정이 없는 환경(로컬·CI)에서는 내려받지도 않는다.
//
// **trace 헤더(`traceparent`)는 같은 출처 요청에만 실린다** — OpenTelemetry 기본값이다. 배포에서는
// API가 같은 출처(`/api/v1`)라 그대로 백엔드 추적과 이어진다. 다른 출처로 넓히면 그 서버의 CORS가
// `traceparent`를 허용해야 하고, 허용하지 않으면 **요청 자체가 막힌다.** 토스·Firebase가 그런 곳이다.
//
// **SDK 쪽에서 민감정보를 거르지 않는다.** 수집 서버(Alloy)가 거른다고 인프라팀이 회신했다
// (2026-09-18). 우리가 직접 남기는 오류는 `reportError`가 이미 요약만 남기고, 그 콘솔 출력이
// 기본 계측(console)을 타고 그대로 수집된다.

import { getWebInstrumentations, initializeFaro } from "@grafana/faro-web-sdk";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";

import { FARO_APP_NAME, FARO_CONFIG } from "@/shared/config/observability";

export function startFaro() {
  initializeFaro({
    url: FARO_CONFIG.url,
    apiKey: FARO_CONFIG.apiKey,
    // 로컬 `next dev`는 development, 배포 빌드는 production으로 갈린다
    app: { name: FARO_APP_NAME, environment: process.env.NODE_ENV },
    instrumentations: [...getWebInstrumentations(), new TracingInstrumentation()],
  });
}
