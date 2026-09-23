# shared/lib

순수 유틸리티와 외부 라이브러리 설정. 비즈니스 로직을 담지 않는다.

| 파일 | 설명 |
| --- | --- |
| `date/display-date.ts` | 서버 시각을 화면 형식으로. **표시 기준을 `Asia/Seoul`로 못 박는다.** 날짜·날짜시각·해를 뺀 날짜시각·시각·날짜시각(말하듯)과 같은 날인지 견줄 하루 키 (#295, #405) |
| `date/display-date.test.ts` | 시안 형식, 자정 근처 값이 하루 밀리지 않는지, 오전·오후와 12시 경계, 읽을 수 없는 값을 본다 |
| `birth-date.ts` | 생년월일을 치는 대로 다듬고 서버가 받는 `YYYY-MM-DD`로 옮긴다 |
| `birth-date.test.ts` | 달력에 없는 날과 앞날을 거르는지 본다 |
| `josa/josa.ts` | 이름 뒤 조사를 받침에 맞춰 고른다 |
| `josa/josa.test.ts` | 받침 유무와 ㄹ 예외, 한글이 아닌 이름을 본다 |
| `typo/typo-tokens.ts` | `globals.css` 타이포 토큰 이름 목록. tailwind-merge가 `text-title-bold-20`을 글자색으로 오인하지 않게, 또 shadcn의 `font-medium`에 굵기가 죽지 않게 `cn`에 알려 준다 |
| `utils.ts` | `cn` — clsx와 tailwind-merge로 className을 병합한다. 타이포 토큰을 전용 그룹으로 등록하고 굵기·행간과 충돌시키는 설정이 얹혀 있다 (#176, #219) |
| `utils.test.ts` | `cn` 단위 테스트. 타이포 토큰이 색과 겹쳐도 남는지, 목록이 `globals.css`와 같은지 본다 |
| `push/fcm.ts` | 브라우저 푸시(FCM) 토큰 발급·삭제. **Firebase를 부르는 유일한 곳** (#354) |
| `push/push-preference.ts` | "이 기기에서 푸시를 켰다"는 표시. 설정 스위치와 전역 수신기가 같이 본다. 켜짐 = 표시 + 권한 허용(앱 안에서는 앱 지원 여부) |
| `push/native-bridge.ts` | 앱 셸(RN 웹뷰)과 주고받는 푸시 신호. 앱이 FCM 토큰을 대신 받아 주고 열려 있을 때 온 푸시를 알린다. 이름은 mobile 저장소 `src/lib/web-event.ts`와 맞춘다 (#403) |
| `push/native-bridge.test.ts` | 앱이 없으면 물러나는지, 토큰·거부·무응답을 결과로 바꾸는지, 수신 신호를 듣는지 |
| `push/firebase-sdk.ts` | `firebase/app`·`firebase/messaging`을 함수 안에서 동적으로 불러오는 얇은 층. 첫 화면 번들·서버 렌더에 들어가지 않고, 테스트는 이 파일을 바꿔 끼운다 |
| `push/fcm.test.ts` | 미지원 환경에서 물러나는지, 권한 거부·허용에 따라 토큰을 받는지, 끄면 지우는지 |
| `observability/faro.ts` | Grafana Faro를 켠다(`startFaro`). 오류·웹 바이탈·콘솔 오류 수집과 같은 출처 API의 trace 전파. **`src/instrumentation-client.ts`가 수집 설정이 있을 때만 동적으로 부른다** (#396) |
| `observability/faro.test.ts` | 수집 주소·키·앱 이름과 trace 계측을 넘기는지 본다 |
| `metrics/server-metrics.ts` | 서버 기본 지표를 Prometheus 형식으로 낸다(`readServerMetrics`). 파드를 직접 부른 요청인지 Host로 가른다(`isInternalHost`) — **도메인으로 온 요청은 로드밸런서를 거친 바깥 요청이라 막는다**. `src/app/metrics/route.ts`가 부른다 (#401) |
| `metrics/server-metrics.test.ts` | IP·localhost만 안쪽으로 보는지, 지표를 내는지, 모듈을 다시 읽어도 레지스트리를 새로 만들지 않는지 |
| `app-toast.ts` | 토스트를 띄우는 유일한 통로(`toastAppSuccess`·`toastAppError`) — 호출부는 메시지 코드만 넘긴다. 예외는 서버가 정한 문구가 오는 `toastPushMessage` 하나 |
| `report-error.ts` | 오류를 바깥으로 알리는 유일한 통로(`reportError`) — 민감정보를 걸러낸 요약만 남긴다. 관측 도구 접점 — Faro가 이 콘솔 출력을 그대로 수집한다 (#396) |
| `report-error.test.ts` | 무엇이 남고 무엇이 남지 않는지 단위 테스트 |
| `query-test-wrapper.tsx` | 테스트에서 서버 상태를 쓰는 화면을 감쌀 Provider를 만든다(`createQueryWrapper`) |

- **`utils.ts`는 예외 파일이다.** shadcn CLI가 `components.json`의 alias(`@/shared/lib/utils`)로 직접 참조하고 덮어쓴다. 위치와 이름을 바꾸지 말고 `cn` 외의 유틸을 이 파일에 추가하지 않는다. tailwind-merge 설정(#176)은 예외로 얹었고, CLI가 덮어쓰면 그 설정을 되살려야 한다 — `utils.test.ts`가 그 회귀를 잡는다.
- **`query-test-wrapper.tsx`는 테스트만 쓴다.** 앱은 `shared/providers`의 `AppProviders`가 감싼다. ESLint가 `@tanstack/react-query` import를 슬라이스 `api` 세그먼트와 `shared`로 묶어 두어 화면 테스트가 직접 `QueryClient`를 만들 수 없고, 그 자리를 여기서 연다. `@testing-library`는 들이지 않는다 — `src` 안에 개발 의존성이 섞이면 누가 화면에서 import했을 때 빌드가 그것까지 담으려 든다.
- **관측 진입점은 `src/instrumentation-client.ts`다.** Next.js가 이 이름의 파일을 브라우저에서 앱보다 먼저 실행한다. 레이어 밖 파일이라 여기 적어 둔다. 켜고 끄는 조건은 같은 자리의 `instrumentation-client.test.ts`가 본다.
- **날짜를 그리는 화면은 `date/display-date.ts`만 쓴다.** `new Date(iso)`를 직접 `format`에 넘기면 표시 기준이 실행 환경을 따라간다. `birth-date.ts`는 사용자 입력을 다듬는 쪽이라 성격이 다르고, 폴더 규칙이 생기기 전부터 있어 현 위치를 지킨다.
- 새 유틸리티는 라이브러리·주제별 폴더로 만든다 (`lib/motion/`, `lib/date/`). 상세는 [code-convention](../../../docs/conventions/code-convention.md)의 "shared/lib 폴더 구조" 절을 본다.
