import nextVitals from "eslint-config-next/core-web-vitals";
import globals from "globals";

const eslintConfig = [
  ...nextVitals,
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
    // eslint-config-next 16 (با eslint-plugin-react-hooks 7) چند قاعدهٔ «آمادگی برای React Compiler» را خطا می‌کند. React Compiler
    // در این پروژه روشن نیست و این الگوها (setState بعد از fetch داخل useEffect، تغییر window.location برای رفتن به درگاه) درست کار می‌کنند.
    // static-components فقط هشدار می‌ماند: SkeletonLoader داخل خود کامپوننت تعریف شده و در هر رندر دوباره ساخته می‌شود.
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/static-components": "warn",
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
