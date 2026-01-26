import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/utils/stems/**/*.test.ts"],
  },
});
