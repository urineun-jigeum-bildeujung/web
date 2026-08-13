---
description: 코드 검증 — validation-convention 순서로 돌리고 결과 보고
---

`docs/conventions/validation-convention.md` 순서대로 검증하고 각 단계의 통과/실패를 구체적으로 보고한다.

**프로젝트 루트에서 실행한다.** `src/` 안에서 실행하면 Next가 `src`를 프로젝트 루트로 오인해 경로 별칭이 깨진다.

바뀐 범위에 맞춰 실행한다.

- **코드·hook·라우트·공용 컴포넌트 변경**: 아래 순서 전부. CI(`.github/workflows/ci.yml`)와 같은 순서다
  1. `npm run typecheck`
  2. `npm run format:check`
  3. `npm run lint`
  4. `npm run knip` — 미사용 파일·export·의존성
  5. `npm run test` — 단위 테스트
  6. `npm run build`
- **유저 플로우(라우팅·핵심 인터랙션) 변경**: 위에 더해 `npm run test:e2e`
- **단순 문구·색상·여백·className 조정**: `format:check`까지만 하고 생략 사유를 보고에 명시
- **문서만 변경**: 생략 가능 (`.md`는 `.prettierignore` 대상이라 `format:check`에도 걸리지 않는다)

의존성을 건드렸으면 `npm ls <패키지>`로 중복·버전을 확인하고, `package.json`의 `overrides`(`react-is`)가 유지되는지 본다.

실패하면 원인을 `권한`·`네트워크`·`코드 오류`·`포맷 오류`·`환경 문제`로 분류하고, 같은 명령을 같은 권한으로 반복하지 않는다. **통과하지 않은 것을 통과했다고 보고하지 않는다.**
