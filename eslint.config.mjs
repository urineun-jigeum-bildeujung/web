import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";
import checkFile from "eslint-plugin-check-file";
import tailwindcss from "eslint-plugin-tailwindcss";

// 패키지 import 위치 제한 — 컨벤션의 상태 경계·아이콘 규칙을 강제한다.
// flat config는 같은 규칙을 나중 블록이 통째로 덮어쓰므로,
// "src 전체 금지 → 허용 구역에서 좁혀서 재정의" 순서로 계단을 만든다.
const RESTRICT_QUERY = {
  name: "@tanstack/react-query",
  message:
    "서버 상태 훅은 슬라이스 api 세그먼트의 use-query-* 훅으로 감싸십시오. (code-convention)",
};
const RESTRICT_ZUSTAND = {
  name: "zustand",
  message: "스토어는 슬라이스 model 세그먼트 또는 shared에 두십시오. (srp-convention)",
};
const RESTRICT_LUCIDE = {
  name: "lucide-react",
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
        callees: ["cn", "cva", "clsx"],
      },
    },
    rules: {
      // 정렬은 prettier-plugin-tailwindcss가 담당한다. 이중 보고를 막는다.
      "tailwindcss/classnames-order": "off",
      // 4px 스케일로 표현 가능한 임의 값 금지. design-convention "간격과 크기" 절.
      "tailwindcss/no-unnecessary-arbitrary-value": "error",
    },
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
        { ignoreMiddleExtensions: true },
      ],
      "check-file/folder-naming-convention": [
        "error",
        { "src/{views,widgets,features,entities,shared}/**/": "KEBAB_CASE" },
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
        { paths: [RESTRICT_QUERY, RESTRICT_ZUSTAND, RESTRICT_LUCIDE] },
      ],
    },
  },
  {
    files: ["src/**/api/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { paths: [RESTRICT_ZUSTAND, RESTRICT_LUCIDE] }],
    },
  },
  {
    files: ["src/**/model/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { paths: [RESTRICT_QUERY, RESTRICT_LUCIDE] }],
    },
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { paths: [RESTRICT_LUCIDE] }],
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
  ]),
]);

export default eslintConfig;
