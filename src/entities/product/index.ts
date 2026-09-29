// product 슬라이스 공개 API. 바깥에서는 이 파일로만 들어온다.
export {
  getProductDetail,
  getProducts,
  getProductSummary,
  getTimeDealDetail,
  searchProducts,
  type ProductDetail,
  type ProductDetailInfo,
  type ProductSummary,
  type ProductCard,
  type ProductCategory,
  type ProductListResult,
  type ProductSearchResult,
  type ProductSort,
} from "./api/products";
export { useQueryProductSummary } from "./api/use-query-product-summary";
export { useQueryProductDetails, type ProductDetailEntry } from "./api/use-query-product-details";
export { useProductList } from "./api/use-product-list";
export { useProductSearch } from "./api/use-product-search";
export { CATEGORY_TO_API, CATEGORY_VALUES, type CategoryValue } from "./model/category";
export { formatUnitPrice } from "./model/unit-price";
export {
  getTimeDeals,
  type DealItem,
  type DealStock,
  type TimeDealGroup,
  type TimeDealList,
  type TimeDealStatus,
} from "./api/time-deals";
export { MatchScoreBadge, getMatchLevel } from "./ui/match-score-badge";
export { CompareTable, type CompareRow } from "./ui/compare-table";
export { CompareSlot, type CompareProduct, type ProductKind } from "./ui/compare-slot";
export { ProductOptionSheet, type OptionSheetProduct } from "./ui/product-option-sheet";
