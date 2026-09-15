// 사용자에게 보이는 문구를 한곳에 모은다. 화면과 에러 처리는 코드만 넘기고 문구는 여기서 찾는다.
//
// 문구 소유권을 프론트가 갖는 이유가 있다. 백엔드 실패 응답의 `detail`은 대체로 한국어지만,
// Spring이 직접 처리하는 예외(405·415 등)에서는 기본 영어 문구가 그대로 내려온다.
// 그것을 화면에 흘리면 톤이 깨지고, 백엔드가 문구를 다듬을 때마다 화면이 우리도 모르게 바뀐다.
//
// 규칙은 `docs/conventions/app-message-convention.md`를 따른다 — title은 짧은 명사형,
// description은 다음에 할 행동이 있을 때만.

export type AppMessage = {
  /** 짧은 명사형·상태형. 문장형·마침표 금지 */
  title: string;
  /** title만으로 부족할 때의 안내. 다음에 할 행동이 있으면 여기 쓴다 */
  description?: string;
};

/**
 * 키가 곧 메시지 코드다(`"도메인.이름"`). 중첩 객체로 두지 않는 이유는
 * 코드 하나로 문구를 바로 찾을 수 있어야 헬퍼가 단언 없이 조회하기 때문이다.
 */
export const APP_MESSAGE = {
  // 어느 도메인에도 속하지 않는 기본값. 매핑되지 않은 실패가 여기로 떨어진다
  "common.requestFailed": {
    title: "요청 실패",
    description: "잠시 후 다시 시도해 주세요.",
  },
  "common.invalidInput": {
    title: "입력값 확인 필요",
    description: "입력한 내용을 다시 확인해 주세요.",
  },
  "common.unauthorized": {
    title: "로그인 필요",
    description: "다시 로그인한 뒤 이용해 주세요.",
  },
  "common.forbidden": {
    title: "권한 없음",
  },
  "common.notFound": {
    title: "찾을 수 없음",
    description: "이미 삭제되었거나 주소가 바뀌었을 수 있어요.",
  },
  "common.conflict": {
    title: "처리 불가",
    description: "지금 상태에서는 요청을 처리할 수 없어요.",
  },
  "common.serverError": {
    title: "일시적인 오류",
    description: "잠시 후 다시 시도해 주세요.",
  },
  "common.networkError": {
    title: "연결 실패",
    description: "네트워크 상태를 확인해 주세요.",
  },
  // 아래 둘은 토스트가 아니라 화면을 대신 채운다. 그래도 문구는 같은 곳에서 관리한다
  "common.routeError": {
    title: "화면을 불러오지 못했어요",
    description: "잠시 후 다시 시도해 주세요.",
  },
  "common.appError": {
    title: "문제가 생겼어요",
    description: "잠시 후 다시 열어 주세요.",
  },

  "auth.signInFailed": {
    title: "로그인 실패",
    description: "다시 시도해 주세요.",
  },

  "member.agreementRequired": {
    title: "필수 약관 동의 필요",
    description: "필수 항목에 모두 동의해야 가입할 수 있어요.",
  },
  "member.alreadySignedUp": {
    title: "이미 가입된 계정",
    description: "로그인으로 이용해 주세요.",
  },
  "member.nicknameTaken": {
    title: "사용 중인 닉네임",
    description: "다른 닉네임을 입력해 주세요.",
  },
  // 휴대폰 인증 번호를 보냈을 때. 시안(mypa_212)의 스낵바 자리다
  "member.verificationCodeSent": {
    title: "인증 번호 전송",
    description: "문자로 받은 번호를 입력해 주세요.",
  },

  "product.notFound": {
    title: "상품 없음",
    description: "판매가 끝났거나 삭제된 상품이에요.",
  },
  "product.outOfStock": {
    title: "재고 부족",
    description: "수량을 줄이거나 다른 상품을 골라 주세요.",
  },
} as const satisfies Record<string, AppMessage>;

export type AppMessageCode = keyof typeof APP_MESSAGE;

/**
 * 호출부가 코드 문자열을 직접 쓰지 않도록 하는 상수.
 * `satisfies`가 값이 실재하는 코드인지 본다 — 오타를 타입 단계에서 잡는다.
 */
export const APP_MESSAGE_CODE = {
  common: {
    requestFailed: "common.requestFailed",
    invalidInput: "common.invalidInput",
    unauthorized: "common.unauthorized",
    forbidden: "common.forbidden",
    notFound: "common.notFound",
    conflict: "common.conflict",
    serverError: "common.serverError",
    networkError: "common.networkError",
    routeError: "common.routeError",
    appError: "common.appError",
  },
  auth: {
    signInFailed: "auth.signInFailed",
  },
  member: {
    agreementRequired: "member.agreementRequired",
    alreadySignedUp: "member.alreadySignedUp",
    nicknameTaken: "member.nicknameTaken",
    verificationCodeSent: "member.verificationCodeSent",
  },
  product: {
    notFound: "product.notFound",
    outOfStock: "product.outOfStock",
  },
} as const satisfies Record<string, Record<string, AppMessageCode>>;
