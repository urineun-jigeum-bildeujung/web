// 상품 문의 목데이터. API 계약이 정해지기 전까지 쓴다.
//
// 시안(상품 상세_Q&A 탭)이 작성자를 `구*****`로 가린다. 누가 물었는지는 가리고
// 무엇을 물었는지만 공개하는 것이 상품 문의의 성격이다.

export type InquiryStatus = "waiting" | "answered";

export type Inquiry = {
  id: string;
  status: InquiryStatus;
  question: string;
  /** 이미 가려진 채로 온다. 원본을 받아 화면에서 가리면 가린 뜻이 없다 */
  maskedAuthor: string;
  /** "2026. 09. 02" */
  date: string;
};

export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
  waiting: "답변대기",
  answered: "답변완료",
};

export const MOCK_INQUIRIES: Inquiry[] = [
  {
    id: "1",
    status: "waiting",
    question: "이 제품 눈물자국 있는 아이한테도 도움이 될까요?",
    maskedAuthor: "구*****",
    date: "2026. 09. 02",
  },
  {
    id: "2",
    status: "answered",
    question: "하루에 몇 알씩 급여하면 되나요?",
    maskedAuthor: "하*****",
    date: "2026. 08. 29",
  },
  {
    id: "3",
    status: "answered",
    question: "다른 관절 영양제랑 같이 급여해도 괜찮을까요?",
    maskedAuthor: "오*****",
    date: "2026. 08. 28",
  },
  {
    id: "4",
    status: "answered",
    question: "소형견인데 90정이면 얼마나 오래 먹일 수 있나요?",
    maskedAuthor: "오*****",
    date: "2026. 08. 20",
  },
  {
    id: "5",
    status: "answered",
    question: "보관은 어떻게 하면 되나요?",
    maskedAuthor: "소*****",
    date: "2026. 08. 26",
  },
];
