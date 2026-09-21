import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // 상위 폴더(moneylog-project)에도 package-lock.json이 있어 Turbopack이 그쪽을 프로젝트 루트로 잘못 잡는다.
  // 루트가 넓어지면 백엔드 폴더까지 감시해 개발 서버가 느려지므로 이 저장소로 고정한다.
  turbopack: { root: path.resolve(__dirname) },
};

export default nextConfig;
