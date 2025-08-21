// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import jsxA11y from "eslint-plugin-jsx-a11y";
import eslintConfigPrettier from "eslint-config-prettier";

const files = ["**/*.{ts,tsx,js,jsx}"];
const ignores = [
  "dist/**",
  "build/**",
  "coverage/**",
  ".next/**",
  "out/**",
  "node_modules/**",
  "**/*.d.ts",
  "**/generated/**",
  "worker-configuration.d.ts",
  "tsconfig.*.tsbuildinfo"
];

// Helper: downgrade all rules in a config block to warnings.
function warnify(rules = {}) {
  return Object.fromEntries(Object.entries(rules).map(([k, v]) => [k, "warn"]));
}

export default [
  { ignores },

  // Base JS (warnings only) - but disable noisy rules
  {
    files,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Browser globals
        console: "readonly",
        window: "readonly",
        document: "readonly",
        FormData: "readonly",
        URL: "readonly",
        HTMLInputElement: "readonly",
        HTMLFormElement: "readonly",
        // Node globals
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        // React globals
        React: "readonly",
        // Other globals
        setTimeout: "readonly",
        clearTimeout: "readonly",
        confirm: "readonly",
        alert: "readonly",
        prompt: "readonly",
        navigator: "readonly",
        // Web API globals
        Response: "readonly",
        Request: "readonly",
        Headers: "readonly",
        // Cloudflare Workers globals
        D1Database: "readonly"
      }
    },
    rules: {
      ...warnify(js.configs.recommended.rules),
      // Disable noisy rules
      "no-undef": "off", // Too many browser/Node globals in SSR context
      "no-unused-vars": "off", // Handled by TypeScript version
      "no-empty-pattern": "off", // Common in React patterns
      "no-case-declarations": "off", // Common in switch statements
      "no-useless-escape": "off", // Often false positives
      "prefer-const": "off" // Can be noisy during development
    }
  },

  // TypeScript (warnings only) - but disable noisy rules
  ...tseslint.configs.recommended.map(cfg => ({
    ...cfg,
    files,
    rules: {
      ...warnify(cfg.rules),
      // Disable noisy rules
      "@typescript-eslint/no-explicit-any": "off", // Too many instances, gradual migration needed
      "@typescript-eslint/no-unused-vars": "warn", // Keep this one as it's high-signal
      "@typescript-eslint/no-non-null-assertion": "off", // Common in React patterns
      "@typescript-eslint/ban-ts-comment": "off", // Sometimes necessary
      "@typescript-eslint/no-var-requires": "off" // Not applicable in ESM
    }
  })),

  // React and a11y (warnings only)
  {
    files,
    plugins: {
      react: reactPlugin,
      "jsx-a11y": jsxA11y
    },
    settings: { react: { version: "detect" } },
    rules: {
      // React
      "react/jsx-uses-react": "off",        // no longer needed with new JSX transform
      "react/react-in-jsx-scope": "off",
      // a11y (a small, low-noise starter set)
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/aria-role": "warn"
    }
  },

  // Prettier — disable stylistic rules that conflict with Prettier
  eslintConfigPrettier
];
