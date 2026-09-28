// 1:1 문의 내역 예시. 문의 API가 없어(2026-09-29 백엔드 확인) 시연용 문장을 둔다 (#502).
// 기능정의서(마이페이지 ver0.5 "1:1 문의 내역 조회")가 적은 두 상태 — 답변 대기·답변 완료 — 를 하나씩 둔다.
// 날짜는 서버 값과 같은 ISO 꼴로 두어, API가 생기면 모양을 바꾸지 않고 갈아끼운다.

export type InquiryStatus = "waiting" | "answered";

type InquiryBase = {
  id: string;
  title: string;
  /** 문의한 날. `YYYY-MM-DD` */
  askedAt: string;
  question: string;
};

/** 답변이 달린 문의만 답변을 가진다 */
export type Inquiry =
  (InquiryBase & { status: "waiting" }) | (InquiryBase & { status: "answered"; answer: string });

export const INQUIRIES: Inquiry[] = [
  {
    id: "inquiry-feeding",
    title: "사료 급여량이 궁금해요",
    askedAt: "2026-09-22",
    status: "answered",
    question: "추천받은 사료를 하루에 얼마나 먹이면 될까요? 아이는 4kg인 말티즈예요.",
    answer:
      "포장에 적힌 급여 표에서 아이 체중에 맞는 하루 양을 확인해 두세 번에 나눠 주세요. 체중이 바뀌면 마이페이지에서 아이 정보를 고쳐 주시면 추천에도 반영돼요.",
  },
  {
    id: "inquiry-pickup",
    title: "반품 수거 일정 문의",
    askedAt: "2026-09-27",
    status: "waiting",
    question: "반품을 신청했는데 기사님이 언제 수거하러 오시나요?",
  },
];
