import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";
import tailwindcss from "eslint-plugin-tailwindcss";

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
