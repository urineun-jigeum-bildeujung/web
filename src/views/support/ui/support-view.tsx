// 고객지원. 문의·공지로 가는 입구와 자주 묻는 질문을 모은다.
// 와이어프레임 기준(mypa_061)이라 디자인 확정 시 바뀔 수 있다.

import { IoChatbubbleOutline, IoMegaphoneOutline } from "react-icons/io5";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { ListRowLink } from "@/shared/ui/list-row/list-row";
import { PageHeader } from "@/shared/ui/page-header/page-header";

const FAQS = [
  {
    question: "배송은 보통 며칠이나 걸리나요?",
    answer:
      "평일 오후 2시 이전에 결제하시면 당일 출고되어 보통 1~2영업일 이내에 받아보실 수 있어요. 주말과 공휴일에는 출고되지 않아요.",
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
    question: "상품을 교환하거나 반품하려면 어떻게 해야 하나요?",
    answer: "수령 후 7일 이내에 1:1 문의로 알려주시면 안내해 드려요.",
  },
];

export function SupportView() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="고객지원" />

      <main className="flex flex-1 flex-col gap-6 pb-8">
        <section className="[&>*+*]:border-t [&>*+*]:border-border">
          <ListRowLink
            href="/mypage/support/inquiry"
            title="1:1 문의"
            icon={<IoChatbubbleOutline />}
          />
          <ListRowLink
            href="/mypage/support/notice"
            title="공지사항"
            icon={<IoMegaphoneOutline />}
          />
        </section>

        <section className="flex flex-col gap-2 px-4">
          <h2 className="text-base font-semibold text-foreground">많이 묻는 질문</h2>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, index) => (
              <AccordionItem key={faq.question} value={`faq-${index}`}>
                <AccordionTrigger className="min-h-11 text-left text-sm">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>
    </div>
  );
}
