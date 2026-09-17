import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// eslint-config-next는 아직 flat config가 아니라 구형 .eslintrc 확장 방식으로
// 배포된다(Next.js 15 기준). FlatCompat으로 감싸서 ESLint 9의 flat config와 연결한다.
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // flat config는 .eslintignore를 쓰지 않고 이 배열로 대체한다.
    // 빠뜨리면 `npm run lint`가 .next/의 압축된 빌드 산출물까지 검사한다.
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
