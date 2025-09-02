import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  // Apply to TypeScript and JavaScript files
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Node.js globals
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",

        // Browser globals
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        FormData: "readonly",
        Request: "readonly",
        Response: "readonly",
        Headers: "readonly",
        URLSearchParams: "readonly",
        alert: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",

        // Testing globals (Vitest)
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        vi: "readonly",

        // React (when not using JSX transform)
        React: "readonly",

        // Web APIs
        TextDecoder: "readonly",
        TextEncoder: "readonly",
        crypto: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
      react,
      "react-hooks": reactHooks,
    },
    rules: {
      // Basic JS/TS rules - focus on actual errors
      ...js.configs.recommended.rules,

      // Disable some overly aggressive rules
      "no-unused-vars": "off", // Let TypeScript handle this
      "no-undef": "off", // TypeScript handles this better

      // TypeScript rules - only essential ones that exist
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "off", // Allow any for now, too aggressive

      // React rules - essential for correctness
      "react/jsx-uses-react": "off", // React 17+ JSX transform
      "react/react-in-jsx-scope": "off", // React 17+ JSX transform
      "react/jsx-uses-vars": "error",
      "react/jsx-key": "error",
      "react/no-unescaped-entities": "off", // Allow quotes in JSX

      // React Hooks rules - critical for correctness
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Code quality - minimal but valuable
      "no-console": "off", // Allow console for debugging
      "no-debugger": "warn",
      "no-duplicate-imports": "warn", // Just warn, not error
      "prefer-const": "warn", // Warn instead of error
      "no-constant-condition": "warn",
      "no-constant-binary-expression": "warn",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },

  // Ignore patterns
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".wrangler/**",
      "*.config.js",
      "*.config.ts",
      "vite.config.ts",
      "drizzle.config.ts",
      "worker-configuration.d.ts",
    ],
  },
];
