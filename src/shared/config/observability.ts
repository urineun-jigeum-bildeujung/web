// 관측(Grafana Faro) 설정. 수집 주소와 키, 수집 서버에서 이 앱을 가르는 이름을 둔다.
//
// **로컬에서는 비워 둔다.** 수집 서버가 localhost 출처의 사전 요청(preflight)을 400으로 돌려보내
// (2026-09-23 실측) 보낼 때마다 콘솔에 CORS 오류가 남는다. 배포에서는 화면과 수집 주소가 같은
// 출처라 사전 요청이 일어나지 않는다.

export const FARO_CONFIG = {
  url: process.env.NEXT_PUBLIC_FARO_URL?.trim() ?? "",
  apiKey: process.env.NEXT_PUBLIC_FARO_API_KEY?.trim() ?? "",
} as const;

/** 수집 서버에서 이 앱을 가르는 이름. 인프라의 이미지 이름(`petflow/web`)에 맞췄다 */
export const FARO_APP_NAME = "petflow-web";

/** 둘 중 하나라도 비면 켜지 않는다. 키 없이 보내면 수집 서버가 401로 거절한다 */
export function isFaroConfigured(): boolean {
  return FARO_CONFIG.url !== "" && FARO_CONFIG.apiKey !== "";
}
