// 리뷰 작성이 묻는 아이의 반응. 별점만으로는 알 수 없는 것들이라 다음 추천의 근거가 된다.
// UI 시안 기준(리뷰작성 1884-29400 1단계 5문항, 1884-29325 2단계 급여 편의성)이다.
//
// `key`는 백엔드 `ReviewQuestionType`, 보기 `value`는 `ReviewAnswer` 값 그대로다. 등록 요청의
// `answerValues`에 이 값이 그대로 실리므로 따로 바꾸는 표를 두지 않는다. 화면 문구는 `label`이 든다.

/** 백엔드 `ReviewAnswer`. 나쁨 · 보통 · 좋음 순서다 */
export type ReviewAnswer = "NEGATIVE" | "NEUTRAL" | "POSITIVE";

export type ResponseOption = { value: ReviewAnswer; label: string };

export type Question = {
  key: string;
  /** "기호성"처럼 무엇에 대한 것인지. 질문 위에 작게 놓인다 */
  topic: string;
  /** 요약 카드 배지에 쓰는 짧은 이름 */
  short: string;
  question: string;
  /** 질문 옆에 흐리게 붙는 보충. "(정제 크기 등)" */
  hint?: string;
  /**
   * 답하지 않으면 다음으로 갈 수 없다.
   *
   * **시안이 문항마다 필수·선택 배지를 그린다**(1884-29158 · 1884-29325). 기호성과 급여
   * 편의성 둘만 필수다 — 그 둘이 다음 추천의 뼈대라 없으면 추천이 서지 않는다 (#302).
   */
  required?: boolean;
  options: readonly ResponseOption[];
};

const CHANGE_OPTIONS = [
  { value: "NEGATIVE", label: "나빠졌어요" },
  { value: "NEUTRAL", label: "그대로예요" },
  { value: "POSITIVE", label: "좋아졌어요" },
] as const;

/** 1단계 "AI 추천을 위해 알려주세요". 기호성만 필수다 (#302) */
export const RATING_STEP_QUESTIONS: readonly Question[] = [
  {
    key: "PALATABILITY",
    topic: "기호성",
    short: "기호성",
    question: "잘 먹었나요?",
    required: true,
    options: [
      { value: "NEGATIVE", label: "안 먹어요" },
      { value: "NEUTRAL", label: "보통이에요" },
      { value: "POSITIVE", label: "잘 먹어요" },
    ],
  },
  {
    key: "DIGESTION",
    topic: "소화 · 배변 반응",
    short: "소화 · 배변",
    question: "배변 상태는 어땠나요?",
    options: CHANGE_OPTIONS,
  },
  {
    key: "SKIN_COAT",
    topic: "피부 · 모질",
    short: "피부 · 모질",
    question: "피부 · 털 상태는 어땠나요?",
    options: CHANGE_OPTIONS,
  },
  {
    // 시안은 "제충 · 활력"인데 오타로 보고 체중으로 쓴다
    key: "WEIGHT_VITALITY",
    topic: "체중 · 활력",
    short: "체중 · 활력",
    question: "체중 · 활력은 어땠나요?",
    options: CHANGE_OPTIONS,
  },
  {
    key: "ALLERGY",
    topic: "알러지 반응",
    short: "알러지",
    question: "알러지 반응이 있었나요?",
    options: [
      // 백엔드가 이 문항만 NEUTRAL을 받지 않는다. 반응이 없는 것이 "좋음"이다
      { value: "POSITIVE", label: "없었어요" },
      { value: "NEGATIVE", label: "있었어요" },
    ],
  },
];

/** 2단계의 급여 편의성. 시안이 필수로 그린다 (#302) */
export const HANDLING_QUESTION: Question = {
  key: "FEEDING_CONVENIENCE",
  topic: "급여 편의성",
  short: "급여 편의성",
  required: true,
  question: "아이에게 급여하기 편했나요?",
  hint: "(정제 크기 등)",
  options: [
    { value: "NEGATIVE", label: "불편해요" },
    { value: "NEUTRAL", label: "보통이에요" },
    { value: "POSITIVE", label: "편해요" },
  ],
};

/** 답한 문항만 골라 배지 문구로 만든다 */
export function answeredSummary(responses: Record<string, string | undefined>) {
  return [...RATING_STEP_QUESTIONS, HANDLING_QUESTION].flatMap((question) => {
    const answer = question.options.find((option) => option.value === responses[question.key]);
    return answer ? [{ key: question.key, short: question.short, label: answer.label }] : [];
  });
}
