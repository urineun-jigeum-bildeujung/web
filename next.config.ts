import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // dev 서버는 기본적으로 localhost 외의 출처에서 오는 개발용 자산 요청을 403으로 막는다.
  // WebView 앱(mobile 저장소)이 에뮬레이터에서 붙으려면 이 주소를 허용해야 한다.
  // 막히면 JS 청크가 403이 되어 하이드레이션이 조용히 실패한다.
  // 실기기로 확인할 때는 호스트 PC의 LAN IP를 여기에 추가한다.
  allowedDevOrigins: ["10.0.2.2"], // Android 에뮬레이터에서 본 호스트 PC
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      }, // 로컬호스트 이미지 사용
    ],
  },
};

export default nextConfig;
