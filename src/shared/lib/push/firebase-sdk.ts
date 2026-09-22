// firebase 모듈을 동적으로 불러오는 얇은 층. `fcm.ts`가 필요한 함수만 여기서 받는다.
//
// **함수 안에서 import한다.** 첫 화면 번들에 firebase가 들어가지 않고, 서버 렌더에서 평가되지도
// 않는다(`window`가 없어 모듈 로드 자체가 깨진다). 테스트는 이 파일 하나를 바꿔 끼운다 — 패키지
// 이름(`firebase/messaging`)을 직접 mock하면 소스 쪽 동적 import에는 걸리지 않았다.

export async function loadFirebase() {
  const [{ getApps, initializeApp }, { deleteToken, getMessaging, getToken, onMessage }] =
    await Promise.all([import("firebase/app"), import("firebase/messaging")]);
  return { getApps, initializeApp, deleteToken, getMessaging, getToken, onMessage };
}
