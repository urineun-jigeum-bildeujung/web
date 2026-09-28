import type { NextConfig } from "next";

/**
 * 모든 응답에 싣는 보안 헤더. 사이버 보안팀 시큐어 코딩 가이드 SC-B-02다 (#460).
 *
 * **CSP는 출처 목록이 필요 없는 지시만 켠다.** 스크립트·요청 출처 제한(`script-src`·
 * `connect-src`)은 토스 결제창·Faro·Firebase·S3 업로드 출처가 얽혀 있어, 배포 사이트에서
 * 출처를 확인하고 나서 켠다. 확인 없이 켜면 결제창이나 로그인이 막힌다.
 *
 * **HSTS에 `includeSubDomains`를 넣지 않는다.** `leechs.shop`의 다른 하위 도메인(Jenkins 등)이
 * 모두 https인지 인프라 확인 전이다. 하나라도 http면 그 도메인이 브라우저에서 막힌다.
 */
const SECURITY_HEADERS = [
  // 올린 파일을 브라우저가 내용으로 추측해 스크립트로 실행하지 않게 한다
  { key: "X-Content-Type-Options", value: "nosniff" },
  // 바깥 사이트로 나갈 때 주문 id 같은 경로는 빼고 출처만 보낸다
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // 남의 사이트가 우리 화면을 틀에 넣어 누르게 하는 공격(클릭재킹)을 막는다. 아래 CSP의
  // frame-ancestors와 같은 뜻인데, 그것을 모르는 옛 브라우저를 위해 함께 둔다
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  // 쓰지 않는 권한은 요청조차 못 하게 한다. 사진 촬영은 파일 입력(capture)이라 camera를 막지 않는다
  { key: "Permissions-Policy", value: "geolocation=(), microphone=()" },
  {
    key: "Content-Security-Policy",
    value: ["frame-ancestors 'self'", "object-src 'none'", "base-uri 'self'"].join("; "),
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Docker 이미지에 node_modules 전체 대신 실행에 필요한 파일만 추려서 담기 위함
  // (.next/standalone). infra 레포 sever의 Dockerfile과 동일한 목적.
  output: "standalone",
  // dev 서버는 기본적으로 localhost 외의 출처에서 오는 개발용 자산 요청을 403으로 막는다.
  // WebView 앱(mobile 저장소)이 에뮬레이터에서 붙으려면 이 주소를 허용해야 한다.
  // 막히면 JS 청크가 403이 되어 하이드레이션이 조용히 실패한다.
  // 실기기로 확인할 때는 호스트 PC의 LAN IP를 여기에 추가한다.
  allowedDevOrigins: ["10.0.2.2"], // Android 에뮬레이터에서 본 호스트 PC
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      }, // 로컬호스트 이미지 사용
      // 업로드한 사진과 상품 이미지의 CDN. 여기 없으면 next/image가 그리다가 throw 한다
      {
        protocol: "https",
        hostname: "image.leechs.shop",
      },
    ],
  },
};

export default nextConfig;
