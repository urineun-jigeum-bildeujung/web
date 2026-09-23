// 브라우저에서 앱이 반응하기 전에 한 번 도는 계측 진입점. Next.js가 이 이름의 파일을 찾아 실행한다.
//
// **관측 도구는 설정이 있을 때만, 그것도 뒤따라 불러온다.** 기다리지 않는 `import()`라 하이드레이션을
// 막지 않는다. 대신 SDK가 도착하기 전에 난 오류와 첫 API 요청은 수집되지 않는다. 웹 바이탈은
// 브라우저가 쌓아 둔 기록을 나중에 읽어 가므로 빠지지 않는다 (#396).

import { isFaroConfigured } from "@/shared/config/observability";
import { reportError } from "@/shared/lib/report-error";

if (isFaroConfigured()) {
  import("@/shared/lib/observability/faro")
    .then(({ startFaro }) => startFaro())
    .catch((error: unknown) => reportError("faro.start", error));
}
