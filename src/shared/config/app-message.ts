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
    title: "앗, 잠시 화면이 멈췄어요",
    // 시안이 두 줄로 끊어 읽힌다. 화면에서 `whitespace-pre-line`으로 그 줄바꿈을 살린다
    description:
      "페이지를 꼼꼼하게 불러오는 중에 예상치 못한 문제가 생겼어요\n잠시 뒤에 다시 시도해 주시면 안전하게 안내해 드릴게요",
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
  "member.verificationCodeWrong": {
    title: "인증 번호가 맞지 않아요",
    description: "번호를 다시 확인해 주세요. 3분이 지났다면 다시 받아야 합니다.",
  },
  "member.tooManyVerifications": {
    title: "잠시 후 다시 시도해 주세요",
    description: "인증 요청이 너무 잦습니다.",
  },

  "product.notFound": {
    title: "상품 없음",
    description: "판매가 끝났거나 삭제된 상품이에요.",
  },
  "product.outOfStock": {
    title: "재고 부족",
    description: "수량을 줄이거나 다른 상품을 골라 주세요.",
  },

  // 토스 결제창이 실패나 취소로 돌아왔을 때다. 원인 코드는 화면에 내보내지 않는다
  "payment.failed": {
    title: "결제 실패",
    description: "결제가 완료되지 않았어요. 다시 시도해 주세요.",
  },

  // **결제창은 성공했는데 서버 승인에서 막힌 경우다.** 위 `payment.failed`와 다르다 —
  // 그쪽은 결제 자체가 시작되지 않았지만 여기는 이미 결제가 일어났을 수 있다.
  // 그래서 "다시 시도해 주세요"라고 하지 않는다. 다시 누르면 두 번 결제될 여지를 만든다
  "payment.confirmFailed": {
    title: "결제 확인이 끝나지 않았어요",
    description:
      "결제는 접수됐지만 주문을 확정하는 중에 문제가 생겼어요\n아래 주문번호로 문의해 주시면 바로 확인해 드릴게요",
  },
  // 금액이 어긋나면 승인이 거절된다. 우리가 보낸 값과 토스가 아는 값이 다른 경우다
  "payment.amountMismatch": {
    title: "결제 금액이 맞지 않아요",
    description:
      "주문 금액과 결제 금액이 달라 승인하지 못했어요\n결제가 됐다면 자동으로 취소되니 잠시 기다려 주세요",
  },

  // 택배사 연동 전이라 아직 갈 곳이 없다. 버튼을 잠가 두면 고장으로 읽히므로 왜 지금은 안 되는지 알린다
  "order.deliveryTrackingPreparing": {
    title: "배송 조회 준비 중",
    description: "택배사 연동이 끝나면 여기에서 배송 위치를 볼 수 있어요.",
  },

  // 신청 화면 시안이 아직 없다. 접수 버튼이 여기로 데려오므로 빈 화면 대신 까닭을 알린다 (#288)
  "order.claimPreparing": {
    title: "신청 화면을 준비하고 있어요",
    description:
      "준비가 끝나면 사유와 사진을 남겨 바로 접수할 수 있어요.\n그때까지는 고객센터로 문의해 주세요.",
  },

  // 행정안전부 도로명주소 API가 거절하는 경우다. 무엇을 고쳐야 하는지 알려 줘야 다시 찾을 수 있다
  "address.keywordTooBroad": {
    title: "검색어가 너무 넓어요",
    description: "도로명이나 건물번호를 함께 넣어 주세요.",
  },
  "address.keywordInvalid": {
    title: "검색어를 다시 확인해 주세요",
    description: "숫자만으로는 찾을 수 없어요. 도로명이나 동 이름과 함께 넣어 주세요.",
  },
  // 사진은 우리 서버가 아니라 S3로 바로 올린다. 실패해도 입력한 나머지는 그대로라 사진만 다시 고르면 된다
  "image.uploadFailed": {
    title: "사진을 올리지 못했어요",
    description: "사진을 다시 골라 시도해 주세요.",
  },
  "image.unsupportedType": {
    title: "쓸 수 없는 사진 형식",
    description: "JPG · PNG · WEBP · GIF 사진을 골라 주세요.",
  },
  // 리뷰는 상품마다 한 번이고 구매 확정 뒤에만 쓸 수 있다. 둘 다 사용자가 고칠 수 있는 것이 아니라 왜인지만 알린다
  "review.alreadyReviewed": {
    title: "이미 후기를 남긴 상품이에요",
    description: "후기는 상품마다 한 번만 쓸 수 있어요.",
  },
  "review.purchaseNotConfirmed": {
    title: "구매 확정 후에 쓸 수 있어요",
    description: "주문 내역에서 구매 확정을 먼저 해 주세요.",
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
    verificationCodeWrong: "member.verificationCodeWrong",
    tooManyVerifications: "member.tooManyVerifications",
  },
  product: {
    notFound: "product.notFound",
    outOfStock: "product.outOfStock",
  },
  order: {
    deliveryTrackingPreparing: "order.deliveryTrackingPreparing",
    claimPreparing: "order.claimPreparing",
  },
  payment: {
    failed: "payment.failed",
    confirmFailed: "payment.confirmFailed",
    amountMismatch: "payment.amountMismatch",
  },
  address: {
    keywordTooBroad: "address.keywordTooBroad",
    keywordInvalid: "address.keywordInvalid",
  },
  image: {
    uploadFailed: "image.uploadFailed",
    unsupportedType: "image.unsupportedType",
  },
  review: {
    alreadyReviewed: "review.alreadyReviewed",
    purchaseNotConfirmed: "review.purchaseNotConfirmed",
  },
} as const satisfies Record<string, Record<string, AppMessageCode>>;
