// 상품 상세의 Q&A 탭. 이 상품에 올라온 문의를 모아 보인다.
// 와이어프레임 기준(상품 상세_Q&A 탭)이라 디자인 확정 시 바뀔 수 있다.
//
// 같은 질문이 반복되는 것이 상품 문의의 성격이다. 급여량, 다른 제품과의 병행,
// 특정 증상에 맞는지 — 목록이 보이면 묻기 전에 답을 찾는다.
//
// 문의를 상품과 배송으로 나눈 것도 이유가 있다. 배송 문의는 주문 건에 매여
// 1:1 문의로 가야 하고, 상품 문의만 공개 목록에 쌓인다.

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";

import { INQUIRY_STATUS_LABEL, type Inquiry } from "../model/mock-inquiries";

type QnaPanelProps = {
  /** 이 상품에 올라온 문의. 서버가 걸러 준 것을 그대로 그린다 */
  inquiries: Inquiry[];
};

export function QnaPanel({ inquiries }: QnaPanelProps) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex gap-2">
          {/* 문의 작성 화면이 시안에 없다. 계약이 정해지면 이 자리에서 연다 */}
          <Button asChild className="min-h-11 flex-1 rounded-lg">
            <Link href="/mypage/support">상품 문의</Link>
          </Button>
          <Button asChild className="min-h-11 flex-1 rounded-lg">
            <Link href="/mypage/support/inquiries">배송 · 반품 · 교환 문의</Link>
          </Button>
        </div>

        {/* 배송 문의는 주문 건에 매여 공개 목록에 쌓이지 않는다. 어디서 보는지 알려 준다 */}
        <Link
          href="/mypage/support/inquiries"
          className="flex min-h-11 items-center justify-center gap-1 text-caption-regular-13 text-text-body-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          배송 · 반품 · 교환 문의 답변은 1:1문의에서 확인해 보세요
          <Icon name="right" aria-hidden className="size-6 text-icon-fill-default" />
        </Link>
      </div>

      {/* 시안(1758-54797)의 문의 목록은 항목 사이에 구분선이 없다. py-4로 여백만 준다 */}
      {inquiries.length > 0 ? (
        <ul className="flex flex-col">
          {inquiries.map((inquiry) => (
            <li key={inquiry.id} className="flex flex-col gap-1 px-5 py-4">
              {/* 답변을 기다리는 중인지가 먼저 읽혀야 한다. 같은 질문을 또 올리지 않도록 */}
              <span
                className={cn(
                  "text-label-bold-14",
                  inquiry.status === "waiting"
                    ? "text-text-body-secondary"
                    : "text-text-body-positive-default",
                )}
              >
                {INQUIRY_STATUS_LABEL[inquiry.status]}
              </span>
              <p className="text-body-medium-16 text-text-body-default">{inquiry.question}</p>
              <p className="flex items-center gap-2 text-caption-regular-13 text-text-body-secondary">
                {inquiry.maskedAuthor}
                <span aria-hidden className="h-3 w-px bg-border" />
                {inquiry.date}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={
            // SVG는 next/image 최적화 서버가 기본적으로 막는다(신뢰 못 할 SVG가 스크립트를
            // 담을 수 있어서다). 우리가 Figma에서 직접 내려받은 자산이라 이 한 장만 끈다
            <Image
              src="/images/product-detail/qna-empty.svg"
              alt=""
              width={72}
              height={72}
              unoptimized
            />
          }
          title="아직 등록된 문의가 없어요"
          titleClassName="text-body-medium-16 font-normal text-text-body-tertiary"
          description="상품이나 서비스에 대해 궁금한 점이 생기면 언제든 편하게 물어보세요"
          descriptionClassName="text-body-medium-16 text-text-body-tertiary"
          className="py-10"
        />
      )}
    </div>
  );
}
