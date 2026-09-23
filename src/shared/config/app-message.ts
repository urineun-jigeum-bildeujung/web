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

  // `@MemberId`를 쓰는 모든 엔드포인트가 이 코드를 낸다. 토큰은 있는데 가입을 마치지
  // 않아 회원 번호가 없는 상태다 — "권한 없음"으로 덮으면 무엇을 해야 할지 알 수 없다
  "member.signupRequired": {
    title: "회원가입 필요",
    description: "가입을 마치면 바로 이용할 수 있어요.",
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
  // 판매 중지·미노출 상태의 상품을 담으려 한 경우다. 재고가 없는 것과 다르다 —
  // 기다려도 돌아오지 않는다
  "product.notPurchasable": {
    title: "판매 불가 상품",
    description: "판매가 멈췄거나 기간이 지났어요.",
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
  // 배송이 시작된 뒤 취소를 누른 경우다. 서버 전이 규칙이 PAID·PREPARING에서만 취소를 받는다
  "order.notCancellable": {
    title: "주문 취소 불가",
    description: "이미 배송이 시작됐어요. 받으신 뒤 반품으로 신청해 주세요.",
  },
  "order.notConfirmable": {
    title: "구매 확정 불가",
    description: "배송이 끝난 뒤에 구매를 확정할 수 있어요.",
  },
  "order.notFound": {
    title: "주문 없음",
    description: "이미 취소되었거나 주소가 바뀌었을 수 있어요.",
  },
  // 결제·주문 사이의 서비스가 잠시 막힌 경우다. 사용자가 고칠 것이 없다
  "order.temporarilyUnavailable": {
    title: "주문 처리 실패",
    description: "주문을 처리하는 중에 문제가 생겼어요.",
  },
  "order.deliveryTrackingPreparing": {
    title: "배송 조회 준비 중",
    description: "택배사 연동이 끝나면 여기에서 배송 위치를 볼 수 있어요.",
  },
  // "취소·반품·교환" 탭 화면 시안과 신청 목록 API가 아직 없다. 취소한 주문은 첫 탭에 남는다 (#405)
  "order.claimHistoryPreparing": {
    title: "취소·반품·교환 내역 준비 중",
    description: "취소한 주문은 주문내역에서 확인해 주세요.",
  },

  // 반품·교환 신청이 서버에 거절되는 네 경우다. 화면이 먼저 막지만 마지막 판단은 서버가 한다 —
  // 다른 기기에서 먼저 신청했거나 7일이 방금 지났을 수 있다 (#327)
  "order.claimRequested": {
    title: "신청 접수",
    description: "1~2일 안에 기사님이 상품을 수거해요.",
  },
  "order.notClaimable": {
    title: "신청 기간 지남",
    description: "배송이 끝나고 7일 안에만 반품·교환을 신청할 수 있어요.",
  },
  "order.claimInProgress": {
    title: "신청 진행 중",
    description: "이미 접수된 신청이 있어요. 처리가 끝난 뒤에 다시 신청해 주세요.",
  },
  "order.claimQuantityExceeded": {
    title: "신청 수량 초과",
    description: "이미 신청한 수량이 있어요. 화면을 새로 고치면 남은 수량이 보여요.",
  },
  "order.itemNotFound": {
    title: "상품 없음",
    description: "주문에서 빠진 상품이에요. 화면을 새로 고쳐 주세요.",
  },

  // 행정안전부 도로명주소 API가 거절하는 경우다. 무엇을 고쳐야 하는지 알려 줘야 다시 찾을 수 있다
  // 기본 배송지는 하나는 남아야 한다. 마지막 하나의 체크를 끄면 저장 전체가 거절된다
  "address.lastDefault": {
    title: "기본 배송지 해제 불가",
    description: "다른 배송지를 기본으로 지정하면 해제할 수 있어요.",
  },
  "address.notFound": {
    title: "배송지 없음",
    description: "이미 지워졌을 수 있어요. 목록에서 다시 골라 주세요.",
  },
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
  // 반응(상태 체크)은 구매 항목마다 한 번이고 정해진 기간이 지나야 남길 수 있다
  "review.feedbackAlreadyAnswered": {
    title: "이미 반응을 남긴 제품이에요",
    description: "반응은 구매마다 한 번만 남길 수 있어요.",
  },
  "review.feedbackNotAvailableYet": {
    title: "아직 반응을 남길 수 없어요",
    description: "받은 뒤 며칠 써 본 다음에 남길 수 있어요.",
  },

  // 알림. 푸시 권한은 브라우저가 쥐고 있어 화면이 대신 켜 줄 수 없다
  "notification.pushPermissionDenied": {
    title: "알림 권한이 꺼져 있어요",
    description: "브라우저나 기기 설정에서 알림을 허용한 뒤 다시 켜 주세요.",
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
    signupRequired: "member.signupRequired",
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
    notPurchasable: "product.notPurchasable",
  },
  order: {
    notCancellable: "order.notCancellable",
    notConfirmable: "order.notConfirmable",
    notFound: "order.notFound",
    temporarilyUnavailable: "order.temporarilyUnavailable",
    deliveryTrackingPreparing: "order.deliveryTrackingPreparing",
    claimHistoryPreparing: "order.claimHistoryPreparing",
    claimRequested: "order.claimRequested",
    notClaimable: "order.notClaimable",
    claimInProgress: "order.claimInProgress",
    claimQuantityExceeded: "order.claimQuantityExceeded",
    itemNotFound: "order.itemNotFound",
  },
  payment: {
    failed: "payment.failed",
    confirmFailed: "payment.confirmFailed",
    amountMismatch: "payment.amountMismatch",
  },
  address: {
    lastDefault: "address.lastDefault",
    notFound: "address.notFound",
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
    feedbackAlreadyAnswered: "review.feedbackAlreadyAnswered",
    feedbackNotAvailableYet: "review.feedbackNotAvailableYet",
  },
  notification: {
    pushPermissionDenied: "notification.pushPermissionDenied",
  },
} as const satisfies Record<string, Record<string, AppMessageCode>>;
