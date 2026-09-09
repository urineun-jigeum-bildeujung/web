// TanStack Query Key 중앙 관리 factory. 호출부는 배열을 직접 조립하지 않고 이 factory만 쓴다.
// 도메인과 필터는 백엔드 API 명세의 GET 엔드포인트 파라미터를 따른다.

// id 타입은 명세상 상품·주문·결제는 UUID 문자열, 반려동물·배송지·리뷰·알림은 long이다.
// 응답 타입을 한곳에 두는 시점에 도메인별로 좁힌다.
type ResourceId = string | number;

// 응답을 바꾸는 파라미터는 전부 키에 넣는다. 아이(petId)를 바꾸면 적합도가 달라지므로 빠뜨리면 캐시가 섞인다.
interface ProductListFilters {
  category?: string;
  petId?: ResourceId;
  sort?: string;
}

interface ProductSearchFilters {
  keyword: string;
  petId?: ResourceId;
  sort?: string;
}

interface PersonalizeFilters {
  petId?: ResourceId;
  healthConcern?: string;
  category?: string;
}

interface ProductReviewFilters {
  petId?: ResourceId;
  personalized?: boolean;
  sort?: string;
}

const productKeys = {
  all: ["product"] as const,
  categories: () => [...productKeys.all, "categories"] as const,
  listAll: () => [...productKeys.all, "list"] as const,
  list: (filters: ProductListFilters) => [...productKeys.listAll(), filters] as const,
  searchAll: () => [...productKeys.all, "search"] as const,
  search: (filters: ProductSearchFilters) => [...productKeys.searchAll(), filters] as const,
  suggestions: (keyword: string) => [...productKeys.all, "suggestions", keyword] as const,
  detailAll: () => [...productKeys.all, "detail"] as const,
  detail: (productId: ResourceId, petId?: ResourceId) =>
    [...productKeys.detailAll(), productId, { petId }] as const,
  personalizeAll: () => [...productKeys.all, "personalize"] as const,
  personalize: (filters: PersonalizeFilters) => [...productKeys.personalizeAll(), filters] as const,
  banners: () => [...productKeys.all, "banners"] as const,
};

const timedealKeys = {
  all: ["timedeal"] as const,
  listAll: () => [...timedealKeys.all, "list"] as const,
  list: (status?: string) => [...timedealKeys.listAll(), { status }] as const,
  detailAll: () => [...timedealKeys.all, "detail"] as const,
  detail: (dealId: ResourceId) => [...timedealKeys.detailAll(), dealId] as const,
};

const cartKeys = {
  all: ["cart"] as const,
  list: (petId?: ResourceId) => [...cartKeys.all, "list", { petId }] as const,
};

const orderKeys = {
  all: ["order"] as const,
  listAll: () => [...orderKeys.all, "list"] as const,
  list: (status?: string) => [...orderKeys.listAll(), { status }] as const,
  detailAll: () => [...orderKeys.all, "detail"] as const,
  detail: (orderId: ResourceId) => [...orderKeys.detailAll(), orderId] as const,
};

const petKeys = {
  all: ["pet"] as const,
  list: () => [...petKeys.all, "list"] as const,
  detailAll: () => [...petKeys.all, "detail"] as const,
  detail: (petId: ResourceId) => [...petKeys.detailAll(), petId] as const,
  products: (petId: ResourceId, reviewed?: boolean) =>
    [...petKeys.detailAll(), petId, "products", { reviewed }] as const,
};

const addressKeys = {
  all: ["address"] as const,
  list: () => [...addressKeys.all, "list"] as const,
  search: (keyword: string) => [...addressKeys.all, "search", keyword] as const,
};

const reviewKeys = {
  all: ["review"] as const,
  byProductAll: () => [...reviewKeys.all, "by-product"] as const,
  byProduct: (productId: ResourceId, filters: ProductReviewFilters = {}) =>
    [...reviewKeys.byProductAll(), productId, filters] as const,
  photos: (productId: ResourceId) => [...reviewKeys.byProductAll(), productId, "photos"] as const,
  featuredPhotos: (productId: ResourceId) =>
    [...reviewKeys.byProductAll(), productId, "featured-photos"] as const,
  detailAll: () => [...reviewKeys.all, "detail"] as const,
  detail: (reviewId: ResourceId) => [...reviewKeys.detailAll(), reviewId] as const,
  myAll: () => [...reviewKeys.all, "my"] as const,
  myList: () => [...reviewKeys.myAll(), "list"] as const,
  myWritable: () => [...reviewKeys.myAll(), "writable"] as const,
};

const paymentKeys = {
  all: ["payment"] as const,
  detailAll: () => [...paymentKeys.all, "detail"] as const,
  detail: (paymentId: ResourceId) => [...paymentKeys.detailAll(), paymentId] as const,
  methods: () => [...paymentKeys.all, "methods"] as const,
};

const notificationKeys = {
  all: ["notification"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
  settings: () => [...notificationKeys.all, "settings"] as const,
};

const userKeys = {
  all: ["user"] as const,
  me: () => [...userKeys.all, "me"] as const,
  likesAll: () => [...userKeys.all, "likes"] as const,
  likes: (category?: string) => [...userKeys.likesAll(), { category }] as const,
  recentlyViewed: () => [...userKeys.all, "recently-viewed"] as const,
  frequentProducts: () => [...userKeys.all, "frequent-products"] as const,
  restockAlerts: (keyword?: string) => [...userKeys.all, "restock-alerts", { keyword }] as const,
  statusCheckTargets: (petId?: ResourceId) =>
    [...userKeys.all, "status-check-targets", { petId }] as const,
};

// 사용자와 무관한 정적 목록. 건강 고민·알레르기·품종은 등록 화면의 선택지다.
const catalogKeys = {
  all: ["catalog"] as const,
  healthConcerns: (species?: string) =>
    [...catalogKeys.all, "health-concerns", { species }] as const,
  allergies: () => [...catalogKeys.all, "allergies"] as const,
  breeds: (species?: string) => [...catalogKeys.all, "breeds", { species }] as const,
};

export const QUERY_KEYS = {
  product: productKeys,
  timedeal: timedealKeys,
  cart: cartKeys,
  order: orderKeys,
  pet: petKeys,
  address: addressKeys,
  review: reviewKeys,
  payment: paymentKeys,
  notification: notificationKeys,
  user: userKeys,
  catalog: catalogKeys,
} as const;
