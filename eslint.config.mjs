import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    // به‌طور پیش‌فرض فقط .js و .mjs بررسی می‌شد و فایل‌های .jsx اصلاً lint نمی‌شدند.
    // importهای فراموش‌شده و متغیرهای تعریف‌نشده هم خطا هستند (مثل <Image> بدون import).
    files: ["**/*.{js,jsx,mjs}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "no-undef": "error",
      "react/jsx-no-undef": "error",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "UsersAMAppDataLocalnpm-cache/**",
    ],
  },
];

export default eslintConfig;
