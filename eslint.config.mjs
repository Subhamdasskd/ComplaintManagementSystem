import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescriptConfig from "eslint-config-next/typescript";

/**
 * Flat ESLint config for Next.js 16 (eslint-config-next ships flat configs).
 * `npm run lint` covers the App Router rules, Core Web Vitals and TypeScript.
 */
const config = [
  ...coreWebVitals,
  ...typescriptConfig,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "coverage/**",
      "dist/**",
      "prisma/seed.ts",
      "next-env.d.ts",
      ".dev-tmp/**",
      ".tools/**",
      ".npm-cache/**",
    ],
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default config;
