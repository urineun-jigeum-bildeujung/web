// 브라우저에서 앱이 반응하기 전에 한 번 도는 계측 진입점. Next.js가 이 이름의 파일을 찾아 실행한다.
//
// **관측 도구는 설정이 있을 때만, 페이지의 첫 리소스를 다 받은 뒤(`load`) 불러온다.** SDK와
// OpenTelemetry가 gzip 71KB라, 여기서 곧바로 부르면 하이드레이션은 막지 않아도 첫 화면의 스크립트·
// 이미지와 대역을 다툰다 (#396 리뷰). 대신 그 전에 난 오류와 첫 API 요청은 수집되지 않는다.
// 웹 바이탈은 브라우저가 쌓아 둔 기록을 나중에 읽어 가므로 빠지지 않는다.

import { isFaroConfigured } from "@/shared/config/observability";
import { reportError } from "@/shared/lib/report-error";

function loadFaro() {
  import("@/shared/lib/observability/faro")
    .then(({ startFaro }) => startFaro())
    .catch((error: unknown) => reportError("faro.start", error));
}

if (isFaroConfigured()) {
  if (document.readyState === "complete") {
    loadFaro();
  } else {
    window.addEventListener("load", loadFaro, { once: true });
  }
}
