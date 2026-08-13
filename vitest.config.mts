import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    // @testing-library/react의 자동 cleanup이 전역 afterEach에 의존한다.
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
