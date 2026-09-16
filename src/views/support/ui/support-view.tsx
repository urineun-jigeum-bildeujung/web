// 고객지원. 문의·공지로 가는 입구와 많이 찾는 질문을 모은다.
// UI 시안 기준(mypa_071, 1117-7926 기본 · 1559-61857 질문 펼침)이다.
// 입구 줄은 44 · 아이콘 28 · 굵은 14, 질문은 물음표 24 + 굵은 16이고 펼치면 물음표가 붉어지며 파란 느낌표 답이 붙는다.

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { Icon } from "@/shared/ui/icon/icon";
import { ListRowLink } from "@/shared/ui/list-row/list-row";
import { PageHeader } from "@/shared/ui/page-header/page-header";

/** 시안에는 첫 문항의 답만 있다. 나머지 답은 와이어프레임 때 문구 그대로다 */
const FAQS = [
  {
    question: "배송은 보통 며칠이나 걸리나요?",
    answer:
      "평일 오후 2시 이전 결제 완료 건은 당일 출고되어, 보통 1~2영업일 이내에 받아보실 수 있습니다. (주말 및 공휴일 제외)",
  },
  {
    question: "주문 완료 후 배송지를 변경하고 싶어요.",
    answer: "상품 준비 단계 전까지는 주문 상세에서 배송지를 바꿀 수 있어요.",
  },
  {
    question: "맞춤 사료 급여량은 어떻게 계산되나요?",
    answer: "등록하신 프로필의 체중·나이·활동량을 바탕으로 하루 권장 급여량을 계산해요.",
  },
  {
    question: "정기배송 간편결제 카드를 바꾸고 싶어요.",
    answer: "마이페이지 결제 수단 관리에서 카드를 등록하고 기본 카드로 지정하면 돼요.",
  },
  {
    question: "상품을 교환이나 반품하려면 어떻게 해야 하나요?",
    answer: "수령 후 7일 이내에 1:1 문의로 알려주시면 안내해 드려요.",
  },
];

/** 시안의 입구 줄은 좌우 20에 굵은 14다. ListRow md(44 · 아이콘 28 · 화살표 28)에서 그 둘만 덮는다 */
const ENTRY_ROW = "px-5";

export function SupportView() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="고객지원" />

      <main className="flex flex-1 flex-col gap-4 pt-4 pb-8">
        <section className="flex flex-col gap-1">
          {/* 시안의 문의 아이콘은 초록+회색 두 색인데 Icon은 단색이라 초록으로 둔다 */}
          <ListRowLink
            href="/mypage/support/inquiries"
            title={<span className="text-label-bold-14">1:1 문의</span>}
            icon={<Icon name="customer" className="text-icon-fill-green" />}
            className={ENTRY_ROW}
          />
          <ListRowLink
            href="/mypage/support/notices"
            title={<span className="text-label-bold-14">공지사항</span>}
            icon={<Icon name="notice" className="text-icon-fill-accent" />}
            className={ENTRY_ROW}
          />
        </section>

        <section className="flex flex-col gap-3 px-5">
          <h2 className="text-title-bold-16 text-foreground">많이 찾는 질문</h2>
          {/* shadcn 아코디언의 접근성·키보드 조작은 그대로 쓰고 모양만 시안대로 덮는다.
              화살표는 아코디언이 그리는 것을 24px 기본색으로 키워 쓴다 */}
          <Accordion type="single" collapsible className="gap-5">
            {FAQS.map((faq, index) => (
              <AccordionItem
                key={faq.question}
                value={`faq-${index}`}
                className="not-last:border-b-0"
              >
                <AccordionTrigger className="min-h-6 items-center gap-2 rounded-none border-0 py-0 text-title-bold-16 font-bold text-foreground hover:no-underline **:data-[slot=accordion-trigger-icon]:size-6 **:data-[slot=accordion-trigger-icon]:text-icon-fill-default">
                  {/* 펼친 질문은 물음표가 붉어져 어느 답이 열렸는지 한눈에 보인다 */}
                  <Icon
                    name="question_mark"
                    className="size-6 shrink-0 text-icon-fill-light-red group-aria-expanded/accordion-trigger:text-icon-fill-red"
                  />
                  <span className="flex-1">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="flex items-start gap-2 pt-3 pb-0">
                  <Icon name="exclaimation_mark" className="size-6 shrink-0 text-icon-fill-blue" />
                  <p className="text-caption-regular-13 text-text-body-secondary">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>
    </div>
  );
}
