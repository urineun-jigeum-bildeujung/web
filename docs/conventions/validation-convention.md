# 검증 컨벤션

빌드·타입·린트·포맷·Git 검증의 반복 실패를 줄이는 실행 규칙. `AGENTS.md`의 "완료 전 검증"과 정합한다.

## 1. 실행 위치

**모든 명령은 프로젝트 루트에서 실행한다.** `src/` 안에서 `next build`를 실행하면 Next가 `src`를 프로젝트 루트로 오인해 `src/tsconfig.json`·`src/next-env.d.ts`·`src/.next`를 만들고 경로 별칭(`@/*`)이 깨진다. 셸의 작업 디렉터리가 옮겨진 채로 남지 않았는지 확인한다.

## 2. Windows 실행

- 기본 OS는 Windows다. **PowerShell**에서 `npm`/`npx` PS 셰임이 잘못된 전역 prefix를 잡아 실패하면 `C:\Program Files\nodejs\npm.cmd` / `npx.cmd`를 명시적으로 쓴다.
- **Bash(Git Bash) 도구**에서는 `npm`/`npx`가 정상 동작한다.
- PowerShell에서는 `&&`가 파서 오류를 낸다. `A; if ($?) { B }`를 쓰거나 Bash를 쓴다.

## 3. 권한

sandbox/네트워크 제한에 걸린 이력이 있어 아래는 처음부터 상승 실행한다.

- `npm run build` — `next/font`가 Google Fonts를 fetch한다.
- `git add` / `git commit` — `.git` 메타데이터 쓰기가 필요하다.

로컬 파일 검사 중심인 아래는 일반 권한으로 먼저 한다.

- `npm run typecheck`, `npm run format:check`, `npm run lint`, 단일 파일 `prettier --write`.
- `git status`, `git diff`, `git log`, `git show`.

일반 권한으로 실패했는데 원인이 파일 쓰기·네트워크·Git index 권한이면 **같은 명령을 반복하지 말고 즉시 상승 재실행**한다.

## 4. 검증 순서

코드·hook·라우트·공용 컴포넌트가 바뀐 경우 아래 순서로 실행한다. 앞 단계가 빠르므로 먼저 걸러낸다. Claude Code에서는 `/verify`가 이 순서를 그대로 돌린다.

1. `npm run typecheck`
2. `npm run format:check`
3. `npm run lint`
4. `npm run build`

단위 테스트가 존재하는 영역을 변경했다면 `npm run test`를 함께 실행한다. 유저 플로우(라우팅·핵심 인터랙션)가 바뀌었으면 `npm run test:e2e`도 실행한다.

문서만 바뀐 경우 검증을 생략할 수 있다. `.md`는 `.prettierignore` 대상이라 `format:check`에도 걸리지 않는다.

단일 파일 내부의 문구·색상·여백·className 조정처럼 타입과 빌드 결과에 영향이 없는 변경은 `build`를 생략할 수 있다. 다만 **새 파일 생성, import/export 변경, 타입 변경, hook 로직 변경, Query Key 변경, 라우트 변경, 공용 컴포넌트 변경**은 간단해 보여도 전체 검증을 돌린다.

## 5. 미사용 코드 검사

`npm run knip`이 미사용 파일·export·의존성을 찾는다. pre-push 훅이 자동으로 실행하므로 평소에는 따로 돌릴 필요가 없다.

무언가를 지우거나 슬라이스를 옮긴 뒤에는 직접 한 번 돌려 남은 죽은 코드를 확인한다.

knip이 실제로 쓰는 코드를 잡으면 코드를 바꾸지 말고 `knip.jsonc`의 `entry`·`ignore`를 조정한다. 아직 화면이 없어 사용처가 없는 확정 스택 패키지는 `ignoreDependencies`에 있으며, **해당 기능을 구현하면 그 항목을 목록에서 지운다.**

## 6. 의존성 변경 시

패키지를 추가·갱신했으면 아래를 함께 확인한다.

- `npm ls <패키지>`로 중복 설치나 예상 밖 버전이 없는지 본다.
- peer dependency 경고를 무시하지 않는다.
- `package.json`의 `overrides`(현재 `react-is`)가 유지되는지 확인한다. Recharts가 이 고정에 의존한다.
- `README.md`와 `AGENTS.md`의 버전 표를 함께 갱신한다.

## 7. 실패 보고

- 같은 명령을 같은 권한으로 반복하지 않는다.
- 실패 원인을 `권한`·`네트워크`·`코드 오류`·`포맷 오류`·`환경 문제` 중 하나로 분류한다.
- 권한·네트워크로 확인되면 다음은 상승 실행한다.
- 검증을 생략하면 완료 보고에 생략 이유를 명시한다.
- **통과하지 않은 것을 통과했다고 보고하지 않는다.** 실패했으면 출력을 그대로 보여준다.
