// 메인 라우트. 화면 조립은 views/home에 있다.
//
// 카테고리 탭 상품 그리드와 "전체" 탭 타임딜 미리보기를 서버에서 조회한다(#289).
// 둘 다 await하지 않고 그대로 HomeView에 넘긴다 — 화면 안의 해당 영역이 `use()`로
// 풀면서 그 부분만 Suspense로 대기하고, 헤더·아이 고르기 등은 기다리지 않는다.
//
// "전체" 탭에서는 상품 목록 자체가 안 그려지고, 카테고리 탭에서는 타임딜 미리보기가
// 안 그려진다 — 그래서 필요 없는 쪽은 실제 조회를 생략하고(#282, #289) 빈 값으로
// 채운 Promise만 넘긴다(search-result/page.tsx의 키워드 없음 처리와 같은 패턴).

import { Suspense } from "react";

import {
  getProducts,
  getTimeDeals,
  type ProductListResult,
  type TimeDealList,
} from "@/entities/product";
import {
  CATEGORY_TO_API,
  HomeView,
  normalizeCategory,
  normalizeSort,
  SORT_TO_API,
} from "@/views/home";

function toSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// searchParams를 읽어 자동으로 동적 렌더링된다. 명시하지 않으면 `next build`가
// 이 조회 결과를 정적 HTML에 구워 넣을 수 있어 명시적으로도 선언해 둔다(#282, #289).
export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  // 클라이언트의 parseAsStringLiteral만 믿지 않는다 — 주소를 직접 쳐서 들어온
  // 잘못된 값이 그대로 API로 새지 않게 서버도 같은 규칙으로 정규화한다(#289)
  const category = normalizeCategory(toSearchParam(params.category));
  const sort = normalizeSort(toSearchParam(params.sort));

  const productsPromise: Promise<ProductListResult> =
    category === "all"
      ? Promise.resolve({ items: [], nextCursor: null, hasNext: false })
      : getProducts({ category: CATEGORY_TO_API[category], sort: SORT_TO_API[sort] });

  const dealsPromise: Promise<TimeDealList> =
    category === "all"
      ? getTimeDeals("ACTIVE")
      : Promise.resolve({ groups: [], serverTime: new Date().toISOString() });

  // nuqs의 useQueryState가 내부에서 useSearchParams를 쓴다.
  // Suspense로 감싸지 않으면 정적 프리렌더가 실패한다.
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <HomeView
        productsPromise={productsPromise}
        productsKey={`${category}:${sort}`}
        dealsPromise={dealsPromise}
      />
    </Suspense>
  );
}
