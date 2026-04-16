import tseslint from "typescript-eslint";
import security from "eslint-plugin-security";

const eslintConfig = tseslint.config(
  {
    files: ["**/*.{ts,tsx}"],
    extends: [...tseslint.configs.recommended],
    plugins: { security },
    rules: {
      ...security.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    ignores: [".next/", "node_modules/", "dist/", "*.config.*"],
  }
);

export default eslintConfig;
