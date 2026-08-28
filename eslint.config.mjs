import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";
import checkFile from "eslint-plugin-check-file";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tailwindcss from "eslint-plugin-tailwindcss";

// 패키지 import 위치 제한 — 컨벤션의 상태 경계·아이콘 규칙을 강제한다.
// flat config는 같은 규칙을 나중 블록이 통째로 덮어쓰므로,
// "src 전체 금지 → 허용 구역에서 좁혀서 재정의" 순서로 계단을 만든다.
//
// paths가 아니라 patterns를 쓴다. paths는 정확한 모듈명만 막아서 zustand/react나
// zustand/middleware 같은 서브패스로 그대로 우회된다. zustand v5는 exports에
// "./*"를 노출하므로 서브패스가 실제 진입점이다.
const RESTRICT_QUERY = {
  group: ["@tanstack/react-query", "@tanstack/react-query/*"],
  message:
    "서버 상태 훅은 슬라이스 api 세그먼트의 use-query-* 훅으로 감싸십시오. (code-convention)",
};
const RESTRICT_ZUSTAND = {
  group: ["zustand", "zustand/*"],
  message: "스토어는 슬라이스 model 세그먼트 또는 shared에 두십시오. (srp-convention)",
};
const RESTRICT_LUCIDE = {
  group: ["lucide-react", "lucide-react/*"],
  message:
    "화면에 직접 배치하는 아이콘은 react-icons를 쓰십시오. lucide는 shared/ui의 shadcn 파일 전용입니다. (design-convention)",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Tailwind 클래스 검사 — design-convention의 표준 단위·토큰 규칙을 자동 강제한다.
  // shadcn CLI 소유 파일은 손댈 수 없으므로 검사에서 제외한다.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/shared/ui/**", "src/shared/lib/utils.ts"],
    extends: [tailwindcss.configs.recommended],
    settings: {
      tailwindcss: {
        cssConfigPath: "./src/app/globals.css",
        // v4는 문자열 인자를 functions로, 객체 키를 parseKeyFunctions로 본다.
        // (v3의 callees는 없어진 키라 지정해도 조용히 무시된다.)
        // cn·cva·clsx는 functions 기본값에 이미 있지만 parseKeyFunctions에는
        // cn이 빠져 있어 cn({ "h-[20px]": on }) 형태가 검사에서 샜다.
        parseKeyFunctions: ["classnames", "classNames", "clsx", "cn"],
      },
    },
    rules: {
      // 정렬은 prettier-plugin-tailwindcss가 담당한다. 이중 보고를 막는다.
      "tailwindcss/classnames-order": "off",
      // 4px 스케일로 표현 가능한 임의 값 금지. design-convention "간격과 크기" 절.
      "tailwindcss/no-unnecessary-arbitrary-value": "error",
    },
  },
  // 접근성 검사 — Lighthouse 접근성 95점 목표의 1차 방어선이다.
  // eslint-config-next가 켜는 a11y 규칙은 alt-text·aria-* 계열 6개뿐이라,
  // 레이블 없는 입력이나 키보드로 누를 수 없는 요소는 그냥 통과한다.
  // 화면을 만들기 전에 켜야 위반이 쌓이지 않는다.
  // shadcn 생성 파일은 CLI가 덮어써 우리가 고칠 수 없으므로 제외한다.
  //
  // 플러그인을 다시 등록하지 않고 규칙만 펼친다. eslint-config-next가 이미
  // "jsx-a11y" 이름으로 등록해 두어, flat config에서 같은 이름을 다시 선언하면
  // "Cannot redefine plugin"으로 설정 로드 자체가 실패한다.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/shared/ui/**"],
    rules: { ...jsxA11y.flatConfigs.recommended.rules },
  },
  // FSD 레이어 경계 — srp-convention의 의존 방향을 자동 강제한다.
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "src/app" },
        { type: "views", pattern: "src/views/*", capture: ["slice"] },
        { type: "widgets", pattern: "src/widgets/*", capture: ["slice"] },
        { type: "features", pattern: "src/features/*", capture: ["slice"] },
        { type: "entities", pattern: "src/entities/*", capture: ["slice"] },
        { type: "shared", pattern: "src/shared" },
      ],
    },
    rules: {
      // 의존 방향(상위→하위)과 슬라이스 공개 API(index만 import)를 한 규칙으로 강제한다.
      // 슬라이스형 레이어(views·widgets·features·entities)는 index.ts(x)로만 들어갈 수 있고,
      // shared는 세그먼트 직접 import를 허용한다.
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          message:
            "FSD 경계 위반 — 의존 방향(상위→하위) 또는 슬라이스 공개 API(index.ts) 규칙을 어기는 import입니다",
          policies: [
            {
              from: { element: { type: "app" } },
              allow: [
                {
                  to: {
                    element: {
                      type: ["views", "widgets", "features", "entities"],
                      fileInternalPath: ["index.ts", "index.tsx"],
                    },
                  },
                },
                { to: { element: { type: "shared" } } },
              ],
            },
            {
              from: { element: { type: "views" } },
              allow: [
                {
                  to: {
                    element: {
                      type: ["widgets", "features", "entities"],
                      fileInternalPath: ["index.ts", "index.tsx"],
                    },
                  },
                },
                { to: { element: { type: "shared" } } },
              ],
            },
            {
              from: { element: { type: "widgets" } },
              allow: [
                {
                  to: {
                    element: {
                      type: ["features", "entities"],
                      fileInternalPath: ["index.ts", "index.tsx"],
                    },
                  },
                },
                { to: { element: { type: "shared" } } },
              ],
            },
            {
              from: { element: { type: "features" } },
              allow: [
                {
                  to: {
                    element: {
                      type: "entities",
                      fileInternalPath: ["index.ts", "index.tsx"],
                    },
                  },
                },
                { to: { element: { type: "shared" } } },
              ],
            },
            {
              from: { element: { type: "entities" } },
              allow: [{ to: { element: { type: "shared" } } }],
            },
          ],
        },
      ],
    },
  },
  // 파일·폴더 이름 kebab-case — code-convention 네이밍 규칙을 강제한다.
  // app은 [id]·(group) 같은 Next 라우트 규약이 있어 폴더 검사에서 제외한다.
  {
    files: ["src/**/*"],
    plugins: { "check-file": checkFile },
    rules: {
      "check-file/filename-naming-convention": [
        "error",
        { "src/**/*.{ts,tsx}": "KEBAB_CASE" },
        {
          ignoreMiddleExtensions: true,
          errorMessage:
            "파일명 '{{ target }}'이 kebab-case가 아닙니다. 컴포넌트는 이름만 PascalCase이고 파일은 kebab-case입니다 (PetCard → pet-card.tsx). (code-convention)",
        },
      ],
      "check-file/folder-naming-convention": [
        "error",
        { "src/{views,widgets,features,entities,shared}/**/": "KEBAB_CASE" },
        {
          errorMessage:
            "폴더명 '{{ target }}'이 kebab-case가 아닙니다. 슬라이스 이름은 kebab-case로 짓습니다 (write-review). (code-convention)",
        },
      ],
    },
  },
  // 컨벤션 2차 방어 — 문서 규칙 중 기계적으로 잡을 수 있는 것.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // 원시 img 금지. next/image를 쓴다. (design-convention 이미지 규칙)
      "@next/next/no-img-element": "error",
      // 이중 단언 금지. (AGENTS.md 2.5)
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSAsExpression > TSAsExpression",
          message:
            "이중 단언(as unknown as ...)을 쓰지 마십시오. API 응답 타입 정의와 실제 사용 필드를 일치시킵니다.",
        },
      ],
    },
  },
  // import 위치 제한 계단 — 아래로 갈수록 허용 구역.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [RESTRICT_QUERY, RESTRICT_ZUSTAND, RESTRICT_LUCIDE] },
      ],
    },
  },
  {
    files: ["src/**/api/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [RESTRICT_ZUSTAND, RESTRICT_LUCIDE] }],
    },
  },
  {
    files: ["src/**/model/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [RESTRICT_QUERY, RESTRICT_LUCIDE] }],
    },
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [RESTRICT_LUCIDE] }],
    },
  },
  {
    files: ["src/shared/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 테스트 산출물. .gitignore가 생성물로 잡는 경로와 맞춘다.
    // Playwright 리포트에는 trace viewer의 JS 번들이 들어 있어, 인자 없는
    // eslint가 저장소 전체를 훑을 때 이것까지 검사하게 된다.
    "playwright-report/**",
    "test-results/**",
    "blob-report/**",
    "coverage/**",
  ]),
]);

export default eslintConfig;
