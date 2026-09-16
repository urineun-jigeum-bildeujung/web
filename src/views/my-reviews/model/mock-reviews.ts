// 나의 상품 후기 목데이터. API 계약이 정해지기 전까지 쓴다.
//
// 화면이 상수를 직접 보면 목록이 늘 차 있어 빈 상태가 닿지 않는다(#159).
// 라우트가 이 값을 넘기고, 연동하면 그 자리에 조회 결과가 들어간다.
// 값은 UI 시안(mypa_041 두 장)의 것이다.

/** 아직 후기를 안 쓴 구매 항목 */
export type WritableReview = {
  id: string;
  name: string;
  imageUrl?: string;
  /** "26.08.28" */
  purchasedAt: string;
  /** 작성 기한까지 남은 날 */
  daysLeft: number;
};

/** 이미 쓴 후기 */
export type WrittenReview = {
  id: string;
  name: string;
  imageUrl?: string;
  /** "26.08.28" */
  purchasedAt: string;
  /** 0~5. 반 개 단위 */
  rating: number;
  content: string;
};

export const MOCK_WRITABLE: WritableReview[] = [
  { id: "0", name: "저자극 덴탈껌 14개입", purchasedAt: "26.08.28", daysLeft: 30 },
  { id: "1", name: "베터 글루코사민", purchasedAt: "26.08.17", daysLeft: 30 },
  { id: "2", name: "잘먹는 독 기호성 사료 2kg", purchasedAt: "26.08.09", daysLeft: 30 },
];

export const MOCK_WRITTEN: WrittenReview[] = [
  {
    id: "0",
    name: "멍 바나나스낵 45g 강아지간식",
    purchasedAt: "26.07.20",
    rating: 4,
    content:
      "코코가 엄청 잘 먹어요 성분도 착해서 안심하고 주는데, 포장지 지퍼백이 조금 뻑뻑해서 닫을 때 힘을 줘야 하네요 그거 빼고는 기호성도 좋고 다 만족스러워요",
  },
  {
    id: "1",
    name: "강아지 대용량 1kg 강아지간식 육포 져키 애견간식 강아지 반려견간식 반려동물간식",
    purchasedAt: "26.07.04",
    rating: 3,
    content:
      "리뷰가 좋아서 샀는데 우리 아이 입맛에는 안 맞나 봐요 냄새만 맡고 입을 짧게 대네요 노즈워크용으로 크기는 딱 좋은데 살짝 아쉬워요",
  },
  {
    id: "2",
    name: "농심 반려다움 강아지 유산균 영양제 가루 애견 펫 프로바이오틱스",
    purchasedAt: "26.06.20",
    rating: 5,
    content:
      "가루형이라 사료에 쓱 섞어주기 너무 편해요 입맛이 까다로운 애라 영양제 냄새가 조금만 나도 밥을 아예 안 먹는데, 이건 거부감 없이 그릇까지 싹싹 핥아먹네요 며칠 먹여보니 활력도 좋아진 것 같아서 꾸준히 먹여보려고 장바구니에 더 담아둡니다",
  },
  {
    id: "3",
    name: "관절 강아지 사료 2kg (단품)",
    purchasedAt: "26.04.08",
    rating: 2,
    content:
      "이걸로 사료를 바꿨는데 눈물이 갑자기 터졌어요 적응 기간 두고 천천히 섞어 먹였는데도 변이 묽어지네요 성분은 좋은 것 같은데 우리 아이랑은 안 맞아서 다른 걸로 다시 찾아봐야겠어요",
  },
];
